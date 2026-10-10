const $ = (selector) => document.querySelector(selector);
const grid = $("#recipeGrid"),
  status = $("#recipeStatus");
let currentRecipes = [],
  ingredients = [];
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function card(meal) {
  const id = meal.idMeal || meal.id || "",
    title = meal.strMeal || "Recipe",
    img = meal.strMealThumb || "";
  const tag = meal.strCategory || meal.strArea || "Recipe";
  const desc = meal.strArea
    ? `${meal.strArea} cuisine`
    : "Easy inspiration for your next meal";
  return `<article class="recipe-card" tabindex="0" role="button" data-id="${esc(id)}" aria-label="View ${esc(title)}"><div class="recipe-image"><img loading="lazy" src="${esc(img)}" alt="${esc(title)}" onerror="this.style.opacity='.2'"><span class="recipe-tag">${esc(tag)}</span></div><div class="recipe-info"><h3>${esc(title)}</h3><p>${esc(desc)}</p><div class="recipe-foot"><span>✦ Recipe idea</span><span>View recipe ↗</span></div></div></article>`;
}
function render(meals, message = "") {
  currentRecipes = meals || [];
  grid.innerHTML = currentRecipes.length
    ? currentRecipes.map(card).join("")
    : `<div class="empty-state">${esc(message || "No recipes found. Try a different search.")}</div>`;
  status.textContent = currentRecipes.length
    ? `${currentRecipes.length} recipe${currentRecipes.length === 1 ? "" : "s"} to explore`
    : "";
}
async function loadFeatured() {
  grid.innerHTML =
    '<div class="loading-card">Finding something delicious…</div>';
  try {
    const names = [
      "Arrabiata",
      "Chicken Handi",
      "Salmon Avocado Salad",
      "Vegetarian Casserole",
    ];
    const results = await Promise.all(
      names.map((n) => RecipeAPI.search(n).catch(() => [])),
    );
    const unique = new Map();
    results.flat().forEach((m) => unique.set(m.idMeal, m));
    const meals = [...unique.values()];
    if (meals.length < 4) {
      const more = await RecipeAPI.search("chicken").catch(() => []);
      more.forEach((m) => unique.set(m.idMeal, m));
    }
    render(
      [...unique.values()].slice(0, 8),
      "Recipes could not load. Check your connection and try again.",
    );
  } catch {
    render([], "Recipes could not load. Check your connection and try again.");
  }
}
async function search(query) {
  const q = query.trim();
  if (!q) return;
  $("#searchInput").value = q;
  grid.innerHTML =
    '<div class="loading-card">Searching the recipe shelf…</div>';
  status.textContent = "";
  $("#explore").scrollIntoView({ behavior: "smooth" });
  try {
    const meals = await RecipeAPI.search(q);
    if (meals.length) {
      render(meals, `No recipes found for “${q}”. Try another search.`);
      return;
    }
    // TheMealDB's search-by-name endpoint can be narrow; try ingredient matches as a fallback.
    const found = await RecipeAPI.byIngredient(q);
    render(found, `No recipes found for “${q}”. Try another search.`);
  } catch {
    render(
      [],
      "The recipe service is unavailable right now. Please try again.",
    );
  }
}
async function category(name) {
  document
    .querySelectorAll(".category")
    .forEach((b) => b.classList.toggle("active", b.dataset.category === name));
  grid.innerHTML = '<div class="loading-card">Gathering recipe ideas…</div>';
  if (name === "all") {
    await loadFeatured();
    return;
  }
  try {
    const meals = await RecipeAPI.category(name);
    render(meals, `No ${name.toLowerCase()} recipes found.`);
  } catch {
    render([], "The recipe service is unavailable right now.");
  }
}
async function openRecipe(id) {
  const dialog = $("#recipeDialog"),
    detail = $("#recipeDetail");
  detail.innerHTML = '<div class="loading-card">Opening recipe…</div>';
  dialog.showModal();
  try {
    const meal = await RecipeAPI.lookup(id);
    if (!meal) throw new Error("Recipe details not found.");
    const list = meal.ingredients
      .map((i) => `<li>${esc(i.measure)} ${esc(i.name)}</li>`)
      .join("");
    const instructions = (
      meal.strInstructions || "Instructions are not available for this recipe."
    )
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `<p>${esc(s)}</p>`)
      .join("");
    detail.innerHTML = `<img class="detail-hero" src="${esc(meal.strMealThumb)}" alt="${esc(meal.strMeal)}"><div class="detail-content"><div class="eyebrow">${esc(meal.strArea)} · ${esc(meal.strCategory)}</div><h2>${esc(meal.strMeal)}</h2><h3>Ingredients</h3><ul class="ingredients-list">${list}</ul><h3>Let's cook</h3>${instructions}${meal.strSource ? `<p><a href="${esc(meal.strSource)}" target="_blank" rel="noopener noreferrer">Original recipe source ↗</a></p>` : ""}<button class="dark-button" id="askRecipeAI">Ask the AI chef about this <span>→</span></button></div>`;
    $("#askRecipeAI").addEventListener("click", () => {
      dialog.close();
      $("#chatInput").value =
        `Help me make ${meal.strMeal}. Give me a few useful cooking tips.`;
      $("#chatForm").requestSubmit();
      $("#ai-chef").scrollIntoView({ behavior: "smooth" });
    });
  } catch (error) {
    detail.innerHTML = `<div class="detail-content"><p class="error">${esc(error.message || "Could not load this recipe.")}</p></div>`;
  }
}
function renderChips() {
  const el = $("#ingredientChips");
  el.innerHTML = ingredients.length
    ? ingredients
        .map(
          (item, i) =>
            `<span class="ingredient-chip">${esc(item)} <button data-remove="${i}" aria-label="Remove ${esc(item)}">×</button></span>`,
        )
        .join("")
    : '<span class="hint">Try: eggs, rice, tomato, potato</span>';
}
function addIngredient() {
  const input = $("#ingredientInput"),
    v = input.value.trim().toLowerCase();
  if (v && !ingredients.includes(v) && ingredients.length < 12) {
    ingredients.push(v);
    renderChips();
  }
  input.value = "";
  input.focus();
}
async function matchIngredients() {
  if (!ingredients.length) {
    $("#ingredientInput").focus();
    return;
  }
  grid.innerHTML = '<div class="loading-card">Matching your ingredients…</div>';
  $("#explore").scrollIntoView({ behavior: "smooth" });
  try {
    // Query several ingredients then merge; fetch full details for an accurate local score.
    const sets = await Promise.all(
      ingredients
        .slice(0, 4)
        .map((i) => RecipeAPI.byIngredient(i).catch(() => [])),
    );
    const merged = new Map();
    sets.flat().forEach((m) => merged.set(m.idMeal, m));
    const candidates = [...merged.values()].slice(0, 24);
    const detailed = await Promise.all(
      candidates
        .slice(0, 16)
        .map((m) => RecipeAPI.lookup(m.idMeal).catch(() => null)),
    );
    const ranked = SmartSearch.rank(
      detailed.filter(Boolean),
      ingredients,
    ).filter((m) => m.match.hits > 0);
    if (ranked.length) {
      render(
        ranked.map((m) => ({
          ...m,
          strCategory: `${m.match.hits}/${m.match.total} ingredients`,
        })),
        `Matched against ${ingredients.join(", ")}.`,
      );
    } else
      render(
        [],
        "No close matches found. Try adding common ingredients or fewer ingredients.",
      );
  } catch {
    render([], "Could not match ingredients right now. Please try again.");
  }
}
function addMessage(text, role) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = role === "assistant" ? "✳" : "You";
  const bubble = document.createElement("div");
  bubble.textContent = text;
  if (role === "assistant") row.append(avatar, bubble);
  else row.append(bubble);
  $("#chatMessages").append(row);
  $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
  return row;
}
async function sendChat(text) {
  const prompt = text.trim();
  if (!prompt) return;
  addMessage(prompt, "user");
  $("#chatInput").value = "";
  document
    .querySelectorAll(".prompt-suggestions")
    .forEach((e) => (e.style.display = "none"));
  const waiting = addMessage("Thinking up something delicious…", "assistant");
  waiting.classList.add("typing");
  $("#aiStatus").textContent = "Connecting to the AI chef…";
  try {
    const reply = await AIChef.ask(prompt, {
      ingredients,
      site: "Quick Recipe Explore",
    });
    waiting.querySelector("div").textContent = reply;
    waiting.classList.remove("typing");
    $("#aiStatus").textContent =
      "AI can make mistakes. Check food safety and cooking temperatures.";
  } catch (error) {
    waiting.querySelector("div").textContent = error.message;
    waiting.classList.remove("typing");
    $("#aiStatus").textContent =
      "Smart recipe search works without AI. Check the AI setup if you expected chat to work.";
  }
}
$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  search($("#searchInput").value);
});
document
  .querySelectorAll("[data-search]")
  .forEach((b) => b.addEventListener("click", () => search(b.dataset.search)));
$("#categoryRow").addEventListener("click", (e) => {
  const b = e.target.closest("[data-category]");
  if (b) category(b.dataset.category);
});
$("#surpriseBtn").addEventListener("click", async () => {
  try {
    const m = await RecipeAPI.random();
    if (m) openRecipe(m.idMeal);
  } catch {
    status.textContent = "Could not load a surprise recipe. Try again.";
  }
});
grid.addEventListener("click", (e) => {
  const c = e.target.closest("[data-id]");
  if (c) openRecipe(c.dataset.id);
});
grid.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-id]")) {
    e.preventDefault();
    openRecipe(e.target.dataset.id);
  }
});
$("#addIngredient").addEventListener("click", addIngredient);
$("#ingredientInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addIngredient();
  }
});
$("#ingredientChips").addEventListener("click", (e) => {
  const b = e.target.closest("[data-remove]");
  if (b) {
    ingredients.splice(Number(b.dataset.remove), 1);
    renderChips();
  }
});
$("#matchBtn").addEventListener("click", matchIngredients);
$("#chatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  sendChat($("#chatInput").value);
});
document
  .querySelectorAll("[data-prompt]")
  .forEach((b) =>
    b.addEventListener("click", () => sendChat(b.dataset.prompt)),
  );
$("#closeDialog").addEventListener("click", () => $("#recipeDialog").close());
$("#recipeDialog").addEventListener("click", (e) => {
  if (e.target === $("#recipeDialog")) $("#recipeDialog").close();
});
$("#menuToggle").addEventListener("click", () =>
  document.querySelector("nav").classList.toggle("open"),
);
document
  .querySelectorAll("nav a")
  .forEach((a) =>
    a.addEventListener("click", () =>
      document.querySelector("nav").classList.remove("open"),
    ),
  );
$("#year").textContent = new Date().getFullYear();
renderChips();
loadFeatured();
