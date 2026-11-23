# Portfolio UI design context

## Chat surface

- The chat is a compact floating utility, not a second page. Keep the transcript dense enough for scanning while preserving comfortable tap targets.
- Orange remains the action color (`#f97316`); the transcript uses a quiet, low-opacity wave motif so the background adds character without competing with messages.
- Light mode uses the provided bright chat background at `assets/chat-bg-light.png`; dark mode uses the provided deep-blue chat background at `assets/chat-bg-dark.png`.
- Message bubbles use 1.5rem vertical padding and restrained markdown margins to avoid excess space beneath short replies.

## Runtime mapping

The chat theme tokens are implemented in `styles.css` under `.ask-golu-panel-light` and `.ask-golu-panel-dark`. The React panel state in `app.js` selects the corresponding token class from `darkMode`.
