/**
 * Gemini AI & RAG Fitness Service for Trainer David
 * Powers the interactive "Coach David AI" Assistant & RAG Workout Recommender
 * Uses Google Gemini Flash (gemini-flash-latest) via key=API_KEY parameter
 */

import { videoLibrary } from '../data/videos.js';
import { servicesData } from '../data/services.js';

const GEMINI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';

/**
 * Low-level caller to Google Gemini Flash generateContent endpoint
 */
export async function callGeminiGenerateContent(contents, systemPrompt = '') {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: contents
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || '';
      return { success: true, text, raw: data };
    }
  } catch (err) {
    console.warn('[Gemini AI] Direct call failed, trying proxy endpoint:', err);
  }

  // Fallback to local Vite dev server proxy
  try {
    const proxyRes = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, text, raw: data };
    }
  } catch (proxyErr) {
    console.error('[Gemini AI] Proxy also failed:', proxyErr);
  }

  throw new Error("Unable to reach Gemini AI service. Please check your network connection.");
}

/**
 * Retrieve top matching workout masterclasses for RAG context
 */
function retrieveRelevantVideos(query, maxResults = 5) {
  const q = query.toLowerCase();
  const scored = videoLibrary.map(video => {
    let score = 0;
    const title = video.title.toLowerCase();
    const muscle = video.muscleGroup.toLowerCase();
    const cat = video.category.toLowerCase();
    const desc = video.shortDescription.toLowerCase();
    const equip = (video.equipment || '').toLowerCase();

    // Keyword matching weights
    const words = q.split(/\s+/).filter(w => w.length > 2);
    words.forEach(w => {
      if (title.includes(w)) score += 5;
      if (muscle.includes(w)) score += 4;
      if (cat.includes(w)) score += 3;
      if (desc.includes(w)) score += 2;
      if (equip.includes(w)) score += 1;
    });

    return { video, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.video);
}

/**
 * Main RAG Chat Interface with Coach David AI
 */
export async function askCoachDavidAi({ userMessage, chatHistory = [], user = null }) {
  // 1. RAG Retrieval
  const relevantVideos = retrieveRelevantVideos(userMessage, 4);

  // 2. Build RAG Grounding Context
  const videoContextSummary = relevantVideos.map(v => 
    `- [VIDEO:${v.id}:${v.title}] | Category: ${v.category} | Target Muscle: ${v.muscleGroup} | Difficulty: ${v.difficulty} | Equipment: ${v.equipment} | Cues: ${(v.keyCues || []).join(', ')}`
  ).join('\n');

  const servicesSummary = servicesData.map(s => 
    `- ${s.title} (${s.category}): ${s.tagline}`
  ).join('\n');

  // 3. System Prompt Persona
  const systemPrompt = `You are "Coach David AI", the official AI fitness coach and sports performance mentor for Trainer David's platform (Trainer David, Australia).
Your tone: Energetic, evidence-based, warm, motivating, and biomechanically rigorous.
Knowledge base available to you:
${videoContextSummary}

Coaching offerings:
${servicesSummary}

Guidelines:
1. Always give actionable, scientifically sound exercise advice (hypertrophy, injury rehabilitation, nutrition/macros, posture correction).
2. Whenever you recommend a workout from the catalog, reference it using the format: [VIDEO:id:title] so our web interface can render a clickable interactive workout card for the user!
3. If the user mentions injury or pain (e.g. lower back, shoulder impingement, knee discomfort), provide safe clinical precautions and advise booking a 1-on-1 Physiotherapy & Rehab Assessment with David.
4. Keep answers concise, formatted with clear bullet points, bold key cues, and upbeat encouragement.
${user?.name ? `Address the user as ${user.name}.` : ''}`;

  // 4. Format multi-turn conversation
  const contents = [];
  chatHistory.slice(-6).forEach(msg => {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  });

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const response = await callGeminiGenerateContent(contents, systemPrompt);

  return {
    text: response.text,
    recommendedVideos: relevantVideos
  };
}
