const { portfolioFacts, selectFacts } = require("./portfolioFacts");
const { randomUUID } = require("crypto");

const MAX_MESSAGE_LENGTH = 500;
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimits = new Map();

function setCors(response) {
  response.setHeader(
    "Access-Control-Allow-Origin",
    process.env.FRONTEND_ORIGIN || "*",
  );
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}
function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}
function sendText(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end(String(body ?? ""));
}
function logFailure(stage, status, requestId, extra = "") {
  console.error(
    `[ask-golu] stage=${stage} status=${status} request_id=${requestId}${extra ? ` ${extra}` : ""}`,
  );
}
function getClientKey(request) {
  return String(
    request.headers["x-forwarded-for"] ||
      request.socket?.remoteAddress ||
      "unknown",
  )
    .split(",")[0]
    .trim();
}
function isRateLimited(key) {
  const now = Date.now();
  const current = rateLimits.get(key) || { count: 0, startedAt: now };
  if (now - current.startedAt >= WINDOW_MS) {
    rateLimits.set(key, { count: 1, startedAt: now });
    return false;
  }
  current.count += 1;
  rateLimits.set(key, current);
  return current.count > MAX_REQUESTS_PER_WINDOW;
}
async function readBody(request) {
  if (request.body)
    return typeof request.body === "string"
      ? JSON.parse(request.body)
      : request.body;
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 10000) throw new Error("body-too-large");
  }
  return JSON.parse(raw || "{}");
}

async function handler(request, response) {
  setCors(response);
  if (request.method === "OPTIONS") return sendJson(response, 204, {});
  if (request.method !== "POST")
    return sendJson(response, 405, {
      error: "Only POST requests are supported.",
    });
  if (isRateLimited(getClientKey(request)))
    return sendJson(response, 429, {
      error: "Too many questions right now. Please try again in a minute.",
    });
  let body;
  try {
    body = await readBody(request);
  } catch {
    return sendJson(response, 400, {
      error: "Please send a valid JSON message.",
    });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const requestId = String(request.headers["x-request-id"] || randomUUID());
  response.setHeader("X-Request-Id", requestId);
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    logFailure("validate", 400, requestId);
    return sendJson(response, 400, {
      error: `Questions must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`,
    });
  }
  const history = Array.isArray(body.history)
    ? body.history
        .filter((item) => item && typeof item.content === "string")
        .slice(-6)
    : [];
  const facts =
    selectFacts(
      `${message} ${history.map((item) => item.content).join(" ")}`,
    ) ||
    Object.entries(portfolioFacts)
      .map(([section, content]) => `${section.toUpperCase()}\n${content}`)
      .join("\n\n");
  if (!process.env.AIROUTER_API_KEY) {
    logFailure("configuration", 503, requestId);
    return sendJson(response, 503, {
      error: "The chat service is not configured yet.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    // ScaleDown Extract is used for evidence extraction, not free-form chat.
    // Its structured entity output is converted into context for the conversational model.
    let extractedFacts = facts;
    const extractionResponse = await fetch(
      "https://api.airouter.in/v1/chat/completions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AIROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "tencent/hy4-flash",
          messages: [
            {
              role: "system",
              content:
                "Extract only factual evidence relevant to the visitor question. Return concise entities from the supplied portfolio facts. Do not invent facts.",
            },
            {
              role: "user",
              content: `Visitor question:\n${message}\n\nPortfolio facts:\n${facts}`,
            },
          ],
          max_tokens: 1200,
        }),
      },
    );
    const extractionData = await extractionResponse.json().catch(() => ({}));
    const extractionText =
      extractionData.choices?.[0]?.message?.content?.trim() || "";
    if (extractionResponse.ok && extractionText) {
      try {
        const extracted = JSON.parse(extractionText);
        const entities = Array.isArray(extracted.entities)
          ? extracted.entities
              .map((entity) => entity?.text)
              .filter((text) => typeof text === "string" && text.trim())
          : [];
        if (entities.length) extractedFacts = entities.join("\n");
      } catch {
        // Keep the deterministic portfolio facts when extraction is not valid JSON.
      }
    }

    const providerResponse = await fetch(
      "https://api.airouter.in/v1/chat/completions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AIROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "tencent/hy4-flash",
          messages: [
            {
              role: "system",
              content:
                "Answer directly and briefly in the visitor’s language. Use supplied portfolio facts for questions about Golu; preserve names, dates, technologies and links exactly. Never infer or invent personal facts. For a greeting, respond warmly and offer projects, skills, or experience. For a general knowledge question such as What is React?, answer it directly using ordinary knowledge. If a personal detail is not in the facts, say exactly: That detail isn’t listed in Golu’s portfolio.",
            },
            ...history.map((item) => ({
              role: item.role === "assistant" ? "assistant" : "user",
              content: item.content.slice(0, 1000),
            })),
            {
              role: "user",
              content: `Relevant portfolio facts:\n${extractedFacts}\n\nVisitor question:\n${message}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 4000,
        }),
      },
    );
    const data = await providerResponse.json().catch(() => ({}));
    const providerRequestId =
      providerResponse.headers.get("x-request-id") || requestId;
    if (!providerResponse.ok) {
      logFailure("provider_http", providerResponse.status, providerRequestId);
      return sendJson(response, providerResponse.status === 429 ? 503 : 502, {
        error:
          providerResponse.status === 429
            ? "The chat service has temporarily exhausted its credits. Please try again later."
            : "The chat provider is unavailable right now. Please try again.",
      });
    }
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      const choice = data.choices?.[0] || {};
      logFailure(
        "provider_empty",
        502,
        providerRequestId,
        `top_keys=${Object.keys(data).join(",")} choice_keys=${Object.keys(choice).join(",")} message_keys=${Object.keys(choice.message || {}).join(",")} finish_reason=${choice.finish_reason || "none"}`,
      );
      return sendJson(response, 502, {
        error: "The chat provider returned an empty answer. Please retry.",
      });
    }
    return sendText(response, 200, answer);
  } catch (error) {
    const status = error.name === "AbortError" ? 504 : 502;
    logFailure(
      error.name === "AbortError" ? "provider_timeout" : "provider_network",
      status,
      requestId,
    );
    return sendJson(response, status, {
      error:
        error.name === "AbortError"
          ? "That took too long. Please retry."
          : "The chat provider is unavailable right now. Please try again.",
    });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = handler;
