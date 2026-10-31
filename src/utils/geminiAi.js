/**
 * Gemini AI & RAG Fitness Service for Trainer David
 * Powers the interactive "Coach David AI" Assistant & RAG Workout Recommender
 * Compatible with Gemini 2.5 Flash-Lite, Claude Haiku 4.5, gpt-6-luna
 */

import { videoLibrary } from '../data/videos.js';
import { servicesData } from '../data/services.js';
import { INITIAL_SOCIAL_POSTS } from '../data/socialPosts.js';

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
      if (text) return { success: true, text, raw: data };
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
      if (text) return { success: true, text, raw: data };
    }
  } catch (proxyErr) {
    console.warn('[Gemini AI] Proxy also failed:', proxyErr);
  }

  return { success: false, text: '' };
}

/**
 * Retrieve top matching workout masterclasses for RAG context
 */
export function retrieveRelevantVideos(query, maxResults = 4) {
  const q = String(query || '').toLowerCase();
  const scored = videoLibrary.map(video => {
    let score = 0;
    const title = (video.title || '').toLowerCase();
    const muscle = (video.muscleGroup || '').toLowerCase();
    const cat = (video.category || '').toLowerCase();
    const desc = (video.shortDescription || '').toLowerCase();
    const equip = (video.equipment || '').toLowerCase();

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
 * Retrieve top matching creator social postcards for RAG context
 */
export function retrieveRelevantPosts(query, maxResults = 3) {
  const q = String(query || '').toLowerCase();
  const scored = INITIAL_SOCIAL_POSTS.map(post => {
    let score = 0;
    const title = (post.title || '').toLowerCase();
    const caption = (post.caption || '').toLowerCase();
    const tags = (post.tags || []).join(' ').toLowerCase();

    const words = q.split(/\s+/).filter(w => w.length > 2);
    words.forEach(w => {
      if (title.includes(w)) score += 5;
      if (caption.includes(w)) score += 3;
      if (tags.includes(w)) score += 4;
    });

    return { post, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.post);
}

/**
 * Generate intelligent deterministic response when AI endpoint is unreachable
 */
function buildDeterministicResponse({ query, topVideo, topPost, user }) {
  const greeting = user?.name ? `Hey ${user.name}!` : "G'day!";
  const videoMention = topVideo 
    ? `\n\nI recommend checking out this masterclass from our video library:\n[VIDEO:${topVideo.id}:${topVideo.title}]\n*Target:* ${topVideo.muscleGroup} • *Category:* ${topVideo.category}`
    : '';

  const postMention = topPost
    ? `\n\nAlso, check out this creator breakdown on our Social page:\n[POST:${topPost.id}:${topPost.title}]\n*(Cost: 1 token to unlock and view this post)*`
    : '';

  const messagingNote = `\n\n💡 **Connect with Creators:** Once you unlock a video or social post, you can message the creator directly for advice (1 token per message). The SuperAdmin can message anyone at any time without tokens.`;

  return `${greeting} Here is a customized biomechanical recommendation for your fitness goal:${videoMention}${postMention}${messagingNote}\n\nStay consistent, focus on progressive overload and pristine form! Let me know if you want cues on any specific movement.`;
}

/**
 * Main RAG Chat Interface with Coach David AI
 */
export async function askCoachDavidAi({ userMessage, chatHistory = [], user = null }) {
  // 1. RAG Retrieval for Videos and Social Posts
  const relevantVideos = retrieveRelevantVideos(userMessage, 4);
  const relevantPosts = retrieveRelevantPosts(userMessage, 3);

  // 2. Build RAG Grounding Context
  const videoContextSummary = relevantVideos.map(v => 
    `- [VIDEO:${v.id}:${v.title}] | Category: ${v.category} | Target Muscle: ${v.muscleGroup} | Difficulty: ${v.difficulty} | Equipment: ${v.equipment} | Cues: ${(v.keyCues || []).join(', ')}`
  ).join('\n');

  const postsContextSummary = relevantPosts.map(p =>
    `- [POST:${p.id}:${p.title}] | Author: ${p.author} | Platform: ${p.platform} | Tags: ${(p.tags || []).join(', ')} | Summary: ${p.caption.slice(0, 100)}...`
  ).join('\n');

  const servicesSummary = servicesData.map(s => 
    `- ${s.title} (${s.category}): ${s.tagline}`
  ).join('\n');

  // 3. System Prompt Persona & Skill Rules
  const systemPrompt = `You are "Coach David AI", the official AI fitness coach and sports performance mentor for Trainer David's platform (Trainer David, Australia).
Your tone: Energetic, evidence-based, warm, motivating, and biomechanically rigorous.

Knowledge base available to you:
WORKOUT VIDEOS:
${videoContextSummary}

CREATOR SOCIAL POSTS (Instagram & Facebook):
${postsContextSummary}

COACHING OFFERINGS:
${servicesSummary}

SKILL DIRECTIVES & RULES:
1. Video Recommendations: Pick out relevant workout videos to solve the user's inquiry. Always format video references as [VIDEO:id:title] so our web interface renders interactive clickable video workout cards.
2. Creator Social Posts: Suggest relevant creator social posts for nutrition, setup, and mobility. Always format post references as [POST:id:title].
   CRITICAL REQUIREMENT: Always explicitly remind users that it costs 1 token to view/unlock a creator post!
3. Messaging Creators: Suggest messaging the creator for custom feedback.
   CRITICAL REQUIREMENT: Remind users that messaging a creator costs 1 token, and that payment/unlocking must be made first before messaging is enabled. Note that the SuperAdmin can message anyone at any time without tokens.
4. If the user mentions flexibility, core stability, or group exercise (Pilates, Yoga, Aerobics), recommend David's Group Fitness & Studio Conditioning or a 1-on-1 personal coaching plan.
5. Keep answers concise, formatted with clear bullet points, bold key cues, and upbeat encouragement.
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

  let replyText = response.text;
  if (!replyText) {
    replyText = buildDeterministicResponse({
      query: userMessage,
      topVideo: relevantVideos[0],
      topPost: relevantPosts[0],
      user
    });
  }

  return {
    text: replyText,
    recommendedVideos: relevantVideos,
    recommendedPosts: relevantPosts
  };
}
