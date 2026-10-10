/* Set AI_WORKER_URL to your deployed Cloudflare Worker endpoint. Never put a Gemini key here. */
const AIChef = (() => {
  const endpoint = window.AI_WORKER_URL || "";
  async function ask(message, context = {}) {
    if (!endpoint || endpoint.includes("YOUR-WORKER"))
      throw new Error(
        "The AI chef is not connected yet. Recipe search and smart ingredient matching still work. Deploy the Worker and set AI_WORKER_URL in js/ai-chef.js to enable chat.",
      );
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        data.error ||
          (response.status === 429
            ? "The AI chef is taking a little break. Please try again later."
            : "The AI chef could not answer right now."),
      );
    if (!data.reply)
      throw new Error("The AI returned an empty response. Please try again.");
    return data.reply;
  }
  return { ask };
})();
