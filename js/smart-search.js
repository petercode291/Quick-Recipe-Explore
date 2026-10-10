/* Browser-only matching: no account, server, or AI key needed. */
const SmartSearch = (() => {
  const clean = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .trim();
  function score(meal, terms) {
    const names = (meal.ingredients || []).map((i) => clean(i.name));
    const title = clean(meal.strMeal);
    let hits = 0;
    for (const term of terms)
      if (
        names.some((n) => n === term || n.includes(term) || term.includes(n)) ||
        title.includes(term)
      )
        hits++;
    return {
      hits,
      total: terms.length,
      ratio: terms.length ? hits / terms.length : 0,
    };
  }
  function rank(meals, ingredients) {
    const terms = ingredients.map(clean).filter(Boolean);
    return meals
      .map((meal) => ({ ...meal, match: score(meal, terms) }))
      .sort(
        (a, b) =>
          b.match.hits - a.match.hits || a.strMeal.localeCompare(b.strMeal),
      );
  }
  return { rank, clean };
})();
