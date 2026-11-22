# Ask Golu deployment

The portfolio is a static GitHub Pages site, so the chat API is a separate Node/Vercel function. The browser never receives `AIROUTER_API_KEY`; only `api/chat.js` reads it server-side.

## Local

1. Install Node.js 18+.
2. Open `.env` and set `AIROUTER_API_KEY=your-key`.
3. Run `npm.cmd run start:chat` in PowerShell, or run `node api/server.js` directly.
4. Keep `chat-config.js` pointed at `http://localhost:8787/api/chat`.
5. Serve the portfolio folder with any static server and open it in a browser.

## Deploy the API on Vercel

1. Import this repository into Vercel, or deploy the repository with `vercel` from the project root.
2. Add `AIROUTER_API_KEY` as a Vercel Environment Variable for Preview and Production. Never add the value to this repository or a `VITE_` variable.
3. Add `FRONTEND_ORIGIN` with the exact GitHub Pages origin, for example `https://golu-kumarpandey.github.io`.
4. Copy the deployed function URL, normally `https://your-project.vercel.app/api/chat`, into `chat-config.js` as `window.__PORTFOLIO_CHAT_API_URL__`.
5. Commit and push `chat-config.js`; GitHub Pages will then call the separate API. Redeploy the API whenever `api/portfolioFacts.js` changes.

The endpoint accepts `POST {"message":"..."}`, limits questions to 500 characters and 10 requests per minute per client key, and applies a 12-second provider timeout. Contact and résumé links are taken directly from the portfolio facts; unsupported questions return the required fallback sentence.
