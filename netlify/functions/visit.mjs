import { getStore } from "@netlify/blobs";

// Registra una visita o una consulta a Pere a Netlify Blobs (analítica agregada i anònima).
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body = {};
  try { body = await req.json(); } catch (e) {}
  const type = body.type === 'chat' ? 'chat' : 'visit';
  const visitorId = (typeof body.visitorId === 'string' ? body.visitorId : '').slice(0, 64);
  const query = (typeof body.query === 'string' ? body.query : '').slice(0, 120);

  try {
    const store = getStore({ name: 'analytics', consistency: 'strong' });
    const data = (await store.get('data', { type: 'json' })) || {};
    data.visits = data.visits || 0;
    data.uniques = data.uniques || {};
    data.visitsByDay = data.visitsByDay || {};
    data.visitsByHour = data.visitsByHour || {};
    data.chat = data.chat || 0;
    data.chatByDay = data.chatByDay || {};
    data.topQueries = data.topQueries || {};

    // Hora de Madrid (CEST = UTC+2 al juny)
    const madrid = new Date(Date.now() + 2 * 3600 * 1000);
    const day = madrid.toISOString().slice(0, 10);
    const hour = String(madrid.getUTCHours());

    if (type === 'visit') {
      data.visits++;
      data.visitsByDay[day] = (data.visitsByDay[day] || 0) + 1;
      data.visitsByHour[hour] = (data.visitsByHour[hour] || 0) + 1;
      if (visitorId) data.uniques[visitorId] = day;
    } else {
      data.chat++;
      data.chatByDay[day] = (data.chatByDay[day] || 0) + 1;
      const q = query.toLowerCase().trim();
      if (q) data.topQueries[q] = (data.topQueries[q] || 0) + 1;
    }

    await store.setJSON('data', data);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    // Si Blobs falla, no trenquem res: responem ok igualment.
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
};
