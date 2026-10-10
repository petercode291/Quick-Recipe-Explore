# Quick Recipe Explore 🍋

Discover recipes, make the most of your ingredients, and find inspiration for your next meal with **Quick Recipe Explore** — a lightweight, responsive recipe discovery website featuring smart ingredient matching and an AI-powered cooking assistant.

🌐 **Live Website:** [https://petercode291.github.io/Quick-Recipe-Explore/](https://petercode291.github.io/Quick-Recipe-Explore/)

## ✨ Features

- **🔎 Recipe Discovery** — Search and explore recipes using data from TheMealDB.
- **🥗 Smart Ingredient Matching** — Find recipes based on ingredients you already have, using browser-based matching.
- **🤖 AI Cooking Assistant** — Get meal ideas, ingredient substitutions, and cooking guidance through a generative AI integration.
- **🍽️ Recipe Details** — Explore ingredients, cooking instructions, food images, and original recipe sources.
- **🌍 Recipe Exploration** — Discover meals across different categories and cuisines.
- **📱 Responsive Design** — Enjoy a clean, user-friendly experience across desktop, tablet, and mobile devices.
- **⚡ Lightweight Architecture** — Recipe discovery and ingredient matching run in the browser without a traditional backend.
- **🔐 Secure AI Integration** — The Gemini API key is stored as a secret in a Cloudflare Worker rather than exposed in frontend code.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive layouts |
| JavaScript | Interactive features and recipe search |
| TheMealDB API | Recipe data, ingredients, images, and instructions |
| Google Gemini API | Generative AI cooking assistance |
| Cloudflare Workers | Secure server-side AI request handling |
| GitHub Pages | Static website hosting |

## 🧠 How It Works

Quick Recipe Explore combines live recipe data with client-side functionality to make discovering meals simple.

1. Search for dishes or browse available recipe categories.
2. Enter ingredients to find recipes that match what you have available.
3. Explore recipe details, ingredients, instructions, and source links.
4. Use the AI cooking assistant for additional meal ideas and cooking guidance when the AI service is configured and available.

The website does not maintain its own recipe database. Recipe information is retrieved from TheMealDB, while the AI assistant communicates with the Gemini API through a Cloudflare Worker.

## 🚀 Getting Started

To run the website locally, clone the repository and start a local static server.

```bash
git clone https://github.com/petercode291/Quick-Recipe-Explore.git
cd Quick-Recipe-Explore
python -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

Recipe search and smart ingredient matching can work without an AI API key. The AI cooking assistant requires a correctly configured Cloudflare Worker endpoint and Gemini API key.

## 🔒 Privacy & Security

- No user registration or login is required.
- No user roles, admin dashboard, or recipe management system.
- No self-hosted recipe database.
- The Gemini API key should remain in Cloudflare Worker secrets and must never be committed to the public repository.
- Public AI access should use appropriate rate limits and usage monitoring.

Recipe availability and AI functionality depend on the external services being accessible and their applicable quotas.

## ⚠️ Disclaimer

Recipe information and images are provided by their respective sources and are subject to those providers' terms. AI-generated cooking advice may be inaccurate, so verify food safety instructions, cooking temperatures, and allergy-related information independently.

## 📄 License

The project source code is licensed under the [MIT License](LICENSE). External recipe data, photographs, and other third-party content remain subject to their respective licenses and terms.

## 👨‍💻 Author

**Soumyaditya Das**

- GitHub: [@petercode291](https://github.com/petercode291)
- Project Repository: [Quick Recipe Explore](https://github.com/petercode291/Quick-Recipe-Explore)
- Live Website: [Quick Recipe Explore](https://petercode291.github.io/Quick-Recipe-Explore/)

---

*Discover something delicious. Cook something wonderful. 🍋*
