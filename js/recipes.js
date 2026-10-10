/* TheMealDB public recipe API. No API key is required for these endpoints. */
const RecipeAPI = (() => {
  const BASE = "https://www.themealdb.com/api/json/v1/1";
  async function request(path) {
    const response = await fetch(`${BASE}/${path}`);
    if (!response.ok)
      throw new Error(
        "Recipe service is temporarily unavailable. Please try again.",
      );
    const data = await response.json();
    return data.meals || [];
  }
  const ingredients = (meal) =>
    Array.from({ length: 20 }, (_, i) => ({
      name: meal[`strIngredient${i + 1}`]?.trim(),
      measure: meal[`strMeasure${i + 1}`]?.trim(),
    })).filter((x) => x.name);
  function normalize(meal) {
    return {
      ...meal,
      ingredients: ingredients(meal),
      category: meal.strCategory || "Recipe",
      area: meal.strArea || "World cuisine",
    };
  }
  return {
    async search(query) {
      return (await request(`search.php?s=${encodeURIComponent(query)}`)).map(
        normalize,
      );
    },
    async category(name) {
      return (await request(`filter.php?c=${encodeURIComponent(name)}`)).map(
        (m) => ({ ...m, strCategory: name }),
      );
    },
    async random() {
      const meals = await request("random.php");
      return meals.map(normalize)[0];
    },
    async lookup(id) {
      return (await request(`lookup.php?i=${encodeURIComponent(id)}`)).map(
        normalize,
      )[0];
    },
    async categories() {
      return request("categories.php");
    },
    async byIngredient(name) {
      return (await request(`filter.php?i=${encodeURIComponent(name)}`)).map(
        (m) => ({ ...m, ingredients: [] }),
      );
    },
    normalize,
  };
})();
