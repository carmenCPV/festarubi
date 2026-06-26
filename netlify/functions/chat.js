exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

  try {
    const { query, lang, events } = JSON.parse(event.body);
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ text: 'Error: API key no configurada.' })
      };
    }

    const isCA = lang === 'ca';

    const dayNames = isCA
      ? { 26: 'Divendres 26 de juny', 27: 'Dissabte 27 de juny', 28: 'Diumenge 28 de juny', 29: 'Dilluns 29 de juny' }
      : { 26: 'Viernes 26 de junio', 27: 'Sábado 27 de junio', 28: 'Domingo 28 de junio', 29: 'Lunes 29 de junio' };

    const catLabels = isCA
      ? { nit: 'Nit Golfa', musica: 'Música', cultura: 'Cultura', infantil: 'Infantil', esport: 'Esport', tradicional: 'Tradicional' }
      : { nit: 'Noche Golfa', musica: 'Música', cultura: 'Cultura', infantil: 'Infantil', esport: 'Deporte', tradicional: 'Tradicional' };

    const eventsText = (events || []).map(e =>
      `- ${e.title} | ${dayNames[e.day]} a les ${e.time}h | ${e.place}${e.cat ? ' [' + (catLabels[e.cat] || e.cat) + ']' : ''}`
    ).join('\n');

    const officialInfo = isCA
      ? `INFORMACIÓ PRÀCTICA DE RUBÍ:
- PUNT D'INFORMACIÓ I MOCADORS: el Punt d'Informació de la Festa Major s'instal·la a la plaça Pearson i obre el diumenge 28 de juny a les 17h. Des d'allà es reparteixen 15.000 mocadors de la Festa Major fins a exhaurir existències.
- ENTRADES DELS CONCERTS: la majoria d'actes són GRATUÏTS. Només alguns concerts són de pagament (Festival RRandom a l'Amfiteatre del parc del Castell i alguns al Casino), amb preus moderats (5-10€). Es compren per internet a teatreelcasinorubi.koobin.cat i a la taquilla del Teatre Municipal La Sala.
- BUS NOCTURN: les línies 1, 2, 3, 4, 5 i 7 funcionen de nit els dies 26-29 de juny, freqüència ~60 min. Servei fins a les 5h (nit del 26), 7h (nit del 27), 5h (nit del 28) i 12h del migdia (29). Operador: Avanza (rubi.avanzagrupo.com).
- APARCAMENT: zones recomanades: polígon de La Llana, Can Fatjó, Cova Solera i davant de l'Arborètum. No al voral de la C-1413.
- AJUNTAMENT (OAC): C. Narcís Menard, 13-17. Telèfon 93 588 70 00 (opció 1). oac@ajrubi.cat. Programa oficial: rubi.cat.
- EMERGÈNCIES: 112; Policia Local 092.`
      : `INFORMACIÓN PRÁCTICA DE RUBÍ:
- PUNTO DE INFORMACIÓN Y PAÑUELOS: el Punto de Información de la Fiesta Mayor se instala en la plaza Pearson y abre el domingo 28 de junio a las 17h. Desde allí se reparten 15.000 pañuelos hasta agotar existencias.
- ENTRADAS DE CONCIERTOS: la mayoría de actos son GRATUITOS. Solo algunos conciertos son de pago (Festival RRandom en el Amfiteatre del parc del Castell y algunos en el Casino), precios moderados (5-10€). Se compran en teatreelcasinorubi.koobin.cat y en la taquilla del Teatre Municipal La Sala.
- BUS NOCTURNO: las líneas 1, 2, 3, 4, 5 y 7 funcionan de noche los días 26-29 de junio, frecuencia ~60 min. Servicio hasta las 5h (noche del 26), 7h (noche del 27), 5h (noche del 28) y 12h del mediodía (29). Operador: Avanza (rubi.avanzagrupo.com).
- APARCAMIENTO: zonas recomendadas: polígono de La Llana, Can Fatjó, Cova Solera y frente al Arborètum. No en el arcén de la C-1413.
- AYUNTAMIENTO (OAC): C. Narcís Menard, 13-17. Teléfono 93 588 70 00 (opción 1). oac@ajrubi.cat. Programa oficial: rubi.cat.
- EMERGENCIAS: 112; Policía Local 092.`;

    const systemPrompt = isCA
      ? `Ets el Pere, l'assistent oficial i simpàtic de la Festa Major de Rubí 2026 (dies 26-29 de juny).
Respon SEMPRE en l'idioma de l'usuari (català o castellà), de forma breu i amigable (màxim 4-5 línies).

REGLA PRINCIPAL — PROGRAMA I CERCA WEB:
Per a qualsevol pregunta sobre el PROGRAMA (actes, concerts, horaris, llocs, dies), respon NOMÉS amb el PROGRAMA COMPLET de sota; aquest és l oficial i correcte, NO facis cerca web per a això ni et contradiguis amb cap altra font.
Si la resposta NO és al PROGRAMA ni a la INFORMACIÓ PRÀCTICA de sota, és OBLIGATORI que facis servir l'eina de cerca web (web_search) per buscar-la abans de respondre. NO diguis mai "no tinc aquesta informació" ni recomanis l'OAC sense haver buscat PRIMER amb l'eina. Busca sempre que l'usuari pregunti per qualsevol cosa de la Festa Major o de Rubí que no tinguis a mà. Només si després de buscar no trobes res, recomana trucar a l'OAC (93 588 70 00).

COM DONAR LA INFORMACIÓ:
- Dóna la informació directament, com si la sabessis tu. NO diguis de quina web l'has tret i NO anomenis MAI "Tot Rubí"/totrubi.cat ni cap altra guia privada.
- Per a actes, inclou nom, dia, hora i lloc. Per la "Nit Golfa", llista els actes amb categoria [Nit Golfa].
- NO inventis res: la informació o és a sota, o l'has trobada amb la cerca web.

PROGRAMA COMPLET DE LA FESTA:
${eventsText}

${officialInfo}`
      : `Eres Pere, el asistente oficial y simpático de la Festa Major de Rubí 2026 (días 26-29 de junio).
Responde SIEMPRE en el idioma del usuario (catalán o castellano), de forma breve y amigable (máximo 4-5 líneas).

REGLA PRINCIPAL — PROGRAMA Y BÚSQUEDA WEB:
Para cualquier pregunta sobre el PROGRAMA (actos, conciertos, horarios, lugares, días), responde SOLO con el PROGRAMA COMPLETO de abajo; es el oficial y correcto, NO hagas búsqueda web para eso ni te contradigas con otra fuente.
Si la respuesta NO está en el PROGRAMA ni en la INFORMACIÓN PRÁCTICA de abajo, es OBLIGATORIO que uses la herramienta de búsqueda web (web_search) para buscarla antes de responder. NUNCA digas "no tengo esta información" ni recomiendes la OAC sin haber buscado PRIMERO con la herramienta. Busca siempre que el usuario pregunte por cualquier cosa de la Fiesta Mayor o de Rubí que no tengas a mano. Solo si después de buscar no encuentras nada, recomienda llamar a la OAC (93 588 70 00).

CÓMO DAR LA INFORMACIÓN:
- Da la información directamente, como si la supieras tú. NO digas de qué web la has sacado y NO nombres NUNCA "Tot Rubí"/totrubi.cat ni ninguna otra guía privada.
- Para actos, incluye nombre, día, hora y lugar. Para la "Noche Golfa", lista los actos con categoría [Noche Golfa].
- NO inventes nada: la información o está abajo, o la has encontrado con la búsqueda web.

PROGRAMA COMPLETO DE LA FIESTA:
${eventsText}

${officialInfo}`;

    const headers = {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    };

    const webSearchTool = {
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 3,
      allowed_domains: ['rubi.cat', 'www.rubi.cat', 'totrubi.cat', 'www.totrubi.cat']
    };

    const convo = [{ role: 'user', content: query }];

    async function callAnthropic(useTools) {
      const payload = {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        system: systemPrompt,
        messages: convo
      };
      if (useTools) payload.tools = [webSearchTool];
      const r = await fetch(ANTHROPIC_URL, { method: 'POST', headers, body: JSON.stringify(payload) });
      const d = await r.json();
      return { r, d };
    }

    function extractText(d) {
      if (!d || !Array.isArray(d.content)) return '';
      return d.content.filter(b => b && b.type === 'text' && b.text).map(b => b.text).join('').trim();
    }

    // 1r intent: amb cerca web (restringida a rubi.cat + totrubi.cat)
    let { r: response, d: data } = await callAnthropic(true);

    // --- DIAGNÒSTIC (es veu als logs de Netlify) ---
    if (!response.ok) {
      console.log('PERE_DEBUG tools-call FAILED status=' + response.status + ' body=' + JSON.stringify(data).slice(0, 800));
    } else {
      const stu = data && data.usage && data.usage.server_tool_use ? JSON.stringify(data.usage.server_tool_use) : 'none';
      console.log('PERE_DEBUG ok stop_reason=' + (data && data.stop_reason) + ' web_search_use=' + stu);
    }

    // Bucle per a pauses de la cerca web (server-side)
    let guard = 0;
    while (response.ok && data && data.stop_reason === 'pause_turn' && guard < 3) {
      convo.push({ role: 'assistant', content: data.content });
      ({ r: response, d: data } = await callAnthropic(true));
      console.log('PERE_DEBUG pause-continue ' + guard + ' stop_reason=' + (data && data.stop_reason));
      guard++;
    }

    // Si l'API falla amb eines, tornem a provar SENSE eines (perquè Pere respongui igual)
    if (!response.ok) {
      convo.length = 1;
      ({ r: response, d: data } = await callAnthropic(false));
      console.log('PERE_DEBUG fallback-no-tools status=' + response.status);
    }

    if (!response.ok) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ text: 'Error ' + response.status + ': ' + (data && data.error && data.error.message ? data.error.message : JSON.stringify(data)) })
      };
    }

    const text = extractText(data) || (isCA ? 'No he pogut respondre.' : 'No he podido responder.');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ text })
    };

  } catch (err) {
    console.log('PERE_DEBUG exception ' + (err && err.message));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ text: 'Error intern: ' + (err && err.message) })
    };
  }
};
