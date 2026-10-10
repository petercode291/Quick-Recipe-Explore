const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin'
});
const json = (body, status, origin) => new Response(JSON.stringify(body), {status, headers:{...JSON_HEADERS,...corsHeaders(origin)}});

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
    // Do not reflect arbitrary origins. Requests without Origin are rejected too for this public browser endpoint.
    if (!origin || !allowed.includes(origin)) return new Response('Origin not allowed', {status:403,headers:{'Content-Type':'text/plain','Vary':'Origin'}});
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:corsHeaders(origin)});
    if (new URL(request.url).pathname !== '/api/chat') return json({error:'Not found.'},404,origin);
    if (request.method !== 'POST') return json({error:'Use POST for chat requests.'},405,origin);
    if (!env.GEMINI_API_KEY) return json({error:'AI service is not configured yet.'},503,origin);

    // Lightweight fallback limiter. Configure Cloudflare's Rate Limiting binding/rules for stronger distributed protection.
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.CHAT_LIMITER) {
      const result = await env.CHAT_LIMITER.limit({key:clientIP});
      if (!result.success) return json({error:'You have sent several requests. Please wait a minute and try again.'},429,origin);
    }
    let body;
    try {
      const length = Number(request.headers.get('Content-Length') || 0);
      if (length > 12000) return json({error:'Message is too long.'},413,origin);
      body = await request.json();
    } catch { return json({error:'Please send a valid JSON message.'},400,origin); }
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 1200) return json({error:'Message must be between 1 and 1200 characters.'},400,origin);
    const ingredients = Array.isArray(body.context?.ingredients) ? body.context.ingredients.filter(x=>typeof x==='string').slice(0,12).map(x=>x.slice(0,40)) : [];
    const systemPrompt = `You are Quick Recipe Explore's friendly cooking assistant. Be practical, warm, concise, and safety-conscious. Help with recipe ideas, ingredient substitutions, cooking methods, and meal planning. If giving a recipe, structure it with a short title, ingredients, numbered steps, and approximate time. Do not claim a dish is allergen-free or medically suitable without caveats. For meat, poultry, seafood, and eggs, remind users to follow reliable food-safety guidance when relevant. Never claim to have checked TheMealDB unless recipe data was actually supplied. If asked about non-cooking topics, briefly steer back to cooking. The user's available ingredients, if any: ${ingredients.join(', ') || 'not specified'}.`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL || 'gemini-2.5-flash')}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({systemInstruction:{parts:[{text:systemPrompt}]},contents:[{role:'user',parts:[{text:message}]}],generationConfig:{temperature:0.7,maxOutputTokens:700}})
      });
      const data = await response.json().catch(()=>({}));
      if (!response.ok) {
        // Never pass provider response details to visitors; those can include internal diagnostic information.
        return json({error:response.status===429?'The AI chef has reached its current usage limit. Please try again later.':'The AI chef is temporarily unavailable.'},response.status===429?429:502,origin);
      }
      const reply = (data.candidates?.[0]?.content?.parts || []).map(p=>p.text || '').join('\n').trim();
      if (!reply) return json({error:'The AI chef could not produce an answer. Please try another question.'},502,origin);
      return json({reply},200,origin);
    } catch { return json({error:'Could not connect to the AI service. Please try again.'},502,origin); }
  }
};
