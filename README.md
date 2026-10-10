# Quick Recipe Explore 🍋

A lightweight, responsive recipe-discovery website with a browser-only ingredient matcher and an optional generative AI cooking assistant. The static frontend can be hosted on GitHub Pages; a small Cloudflare Worker securely proxies AI requests to Gemini.

## Features

- Search and browse recipes from [TheMealDB](https://www.themealdb.com/)
- Browse categories and open recipe instructions, ingredients, and source links
- Find recipes using ingredients you already have (browser-side matching)
- Ask the AI sous-chef for meal ideas, substitutions, and cooking guidance
- Responsive layout, accessible buttons, loading/error states, no login or user database
- AI key stays in a Cloudflare Worker secret, not in the public repository

## Run locally

This is a static site. From the project root, run any local static file server, for example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`. Recipe search and smart ingredient matching should work. The AI assistant will show a setup message until a Worker URL is configured.

## Deploy the frontend to GitHub Pages

1. Create a new public repository, for example `quick-recipe-explore`.
2. Upload the contents of this folder to the repository root (so `index.html` is at the root).
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
5. Wait for GitHub Pages to publish the site. A project site usually has a URL like `https://YOUR-USERNAME.github.io/quick-recipe-explore/`.

## Enable the AI assistant securely

### 1. Create a Gemini API key

Create/manage a key through Google's official AI Studio/API console. Review the current Gemini API terms, quotas, and pricing before sharing the site publicly. Do **not** put the key in frontend JavaScript, HTML, README, or GitHub Actions logs.

### 2. Deploy the Cloudflare Worker

1. Create/sign in to a Cloudflare account.
2. Install Node.js (LTS) if it is not installed.
3. In a terminal, enter the `worker` directory and install Wrangler/run deploy:

   ```bash
   npm install --save-dev wrangler
   npx wrangler login
   npx wrangler deploy
   ```

4. Add the Gemini key as an encrypted Worker secret:

   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```

   Paste the key only into the secret prompt. Do not save it in this repository.

5. In Cloudflare Worker settings, add a non-secret variable named `ALLOWED_ORIGINS` with the exact origin of your published site, e.g. `https://YOUR-USERNAME.github.io`. For local development, you may temporarily add `http://localhost:8080` too. Separate multiple origins with commas. Redeploy after changing settings if prompted.
6. Note the Worker URL, such as `https://quick-recipe-explore-ai.YOUR-SUBDOMAIN.workers.dev`.
7. Open `js/ai-chef.js` and set the endpoint to the Worker URL plus `/api/chat`, for example:

   ```js
   const endpoint = window.AI_WORKER_URL || 'https://YOUR-WORKER.workers.dev/api/chat';
   ```

   Replace the example with your actual URL. This URL is public; the Gemini key is not.
8. Commit and push the updated frontend. Test the AI from the deployed Pages URL.

### Rate limits and cost controls

- The Worker optionally checks a Cloudflare Rate Limiting binding named `CHAT_LIMITER`. Configure one in your Worker if available in your account/tooling, or configure a suitable Cloudflare rate-limiting rule. Do not treat CORS or `Origin` validation as authentication; non-browser clients can forge headers.
- Start with low output limits and monitor Gemini usage/quotas. Provider charges may apply, and a public endpoint can be abused. For stronger controls, add an explicit per-IP or per-session quota and abuse monitoring before broad promotion.
- If the AI service fails or reaches its quota, recipe browsing and browser-side ingredient matching remain available.

## API notes

- Recipe data is fetched live from TheMealDB; this project does not own or store that database. Availability, images, and terms are controlled by the provider.
- AI replies are generated content and can be inaccurate. Verify cooking temperatures, food safety, and allergy-related advice independently.
- This project intentionally has no login, user roles, admin dashboard, recipe-management system, or self-hosted database.

## License

The website code is provided under the MIT License. Recipe data and photos are provided by their respective sources and remain subject to their own terms. See [TheMealDB](https://www.themealdb.com/) for recipe API information.
