# Northstar Dental Studio — Cloudflare Pages

Premium US dental website concept by Virexa & Hartwell.

## Stack
- Static HTML/CSS/JS
- Cloudflare Pages
- Cloudflare Pages Functions
- Resend REST API for appointment email delivery

## Project structure
- `index.html` — complete UI
- `functions/api/appointment.js` — backend appointment endpoint

## Cloudflare setup
1. Push this folder to a GitHub repository.
2. In Cloudflare: Workers & Pages → Create application → Pages → Connect to Git.
3. Select the repository.
4. Build command: leave empty.
5. Build output directory: `/` (project root).
6. Deploy.

Cloudflare Pages Functions are deployed from the root `functions/` directory.

## Email setup
Create a Resend account and verify a sending domain.
Then in Cloudflare Pages:
Settings → Variables and Secrets → Production → Add:
- `RESEND_API_KEY` = your Resend API key (Encrypt it)
- `FROM_EMAIL` = `Northstar Dental <appointments@your-verified-domain.com>`

The backend sends appointment requests to:
`virexahartwell@gmail.com`

Do not put the Resend API key in `index.html` or GitHub.

## Important
The UI is intentionally unchanged from the approved Northstar v2 design. Backend wiring only changes the form destination and adds submission handling.
