// Vercel serverless function — runs on the server, keeps your Groq API key secret.
// Env var required: GROQ_API_KEY (set in Vercel project settings, not in this file).
// This handles ONLY the qualitative "recruiter read" layer.
// The mechanical ATS parse check runs client-side (deterministic, no AI) — see public/index.html.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const { resume, jd, role } = req.body || {};

  if (!resume || resume.trim().length < 80) {
    return res.status(400).json({ error: 'Resume text is too short to scan.' });
  }

  const targetRole = (role && role.trim()) || 'a general professional role the resume seems aimed at';
  const jdContext = (jd && jd.trim().length > 40)
    ? `The candidate is applying to this specific job description:\n${jd.trim()}`
    : 'No specific job description was provided — judge against general best practice for the stated role.';

  const systemPrompt = `You are an experienced recruiter giving a candid, specific read of a resume. This is a judgment call, not a mechanical check — formatting and keyword parsing are handled elsewhere, so focus entirely on substance: how convincing, specific, and well-communicated the experience is.

Return ONLY a JSON object, no markdown fences, no preamble, matching exactly this shape:
{
  "score": <integer 0-100, your honest overall impression of how compelling this resume is for the role>,
  "verdict": "<one short sentence, under 14 words, on overall impression>",
  "content": [{"pass": true|false, "text": "<specific finding about achievements, quantification, clarity, relevance to the role, under 16 words>"}, ... 4 to 5 items],
  "fixes": ["<concrete, specific, actionable fix tied to what's actually in the resume>", ... 3 to 5 items, ordered by impact]
}

Be honest and specific, never generic — every point must reference something actually in the resume text, not boilerplate advice. Target role: ${targetRole}.
${jdContext}`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Resume text to evaluate:\n\n${resume}` }
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq error:', errText);
      return res.status(502).json({ error: 'The scan service failed. Please try again.' });
    }

    const data = await groqRes.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong during the scan.' });
  }
}
