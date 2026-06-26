import { getStore } from "@netlify/blobs";

// Retorna l'analítica agregada per al panel d'administració.
export default async () => {
  try {
    const store = getStore({ name: 'analytics', consistency: 'strong' });
    const data = (await store.get('data', { type: 'json' })) || {};
    const uniques = data.uniques ? Object.keys(data.uniques).length : 0;
    const topQueries = Object.entries(data.topQueries || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([q, n]) => ({ q, n }));
    return new Response(JSON.stringify({
      visits: { total: data.visits || 0, unique: uniques, byDay: data.visitsByDay || {}, byHour: data.visitsByHour || {} },
      chat: { total: data.chat || 0, byDay: data.chatByDay || {} },
      topQueries
    }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({
      visits: { total: 0, unique: 0, byDay: {}, byHour: {} },
      chat: { total: 0, byDay: {} }, topQueries: [], error: String(err)
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
};
