import type { Profile, DateIdea } from './types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your-gemini')) {
    return null;
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API request failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText || null;
  } catch (error) {
    console.warn('Error calling Gemini API:', error);
    return null;
  }
}

/**
 * 1. AI Matchmaking & Compatibility Score
 */
export interface AIMatchAnalysis {
  compatibility_score: number;
  reasoning: string;
  shared_highlights: string[];
}

export async function generateAIMatchAnalysis(
  user: Profile,
  candidate: Profile
): Promise<AIMatchAnalysis> {
  const sharedInterests = user.interests.filter((i) => candidate.interests.includes(i));
  const fallbackScore = Math.min(96, Math.max(65, 60 + sharedInterests.length * 8 + Math.floor(Math.random() * 8)));
  const fallback: AIMatchAnalysis = {
    compatibility_score: fallbackScore,
    reasoning: `Match gebaseerd op jullie gedeelde interesses in ${sharedInterests.join(', ') || 'nieuwe ervaringen'}.`,
    shared_highlights: sharedInterests,
  };

  const prompt = `Je bent de AI Matchmaker voor Mail2Date, een privacy-first Nederlandse datingapp.
Analyseer de compatibiliteit tussen deze twee personen:
Persoon A: ${user.first_name}, ${user.age} jaar, stad: ${user.city}, interesses: ${user.interests.join(', ')}, bio: "${user.bio}"
Persoon B: ${candidate.first_name}, ${candidate.age} jaar, stad: ${candidate.city}, interesses: ${candidate.interests.join(', ')}, bio: "${candidate.bio}"

Geef antwoord strictly in JSON format met exact deze velden:
{
  "compatibility_score": GETAL tussen 65 en 98,
  "reasoning": "Korte Nederlandse verklaring (max 2 zinnen) waarom zij zo goed matchen",
  "shared_highlights": ["hoogtepunt 1", "hoogtepunt 2"]
}`;

  const rawResult = await callGemini(prompt);
  if (!rawResult) return fallback;

  try {
    const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      compatibility_score: typeof parsed.compatibility_score === 'number' ? parsed.compatibility_score : fallbackScore,
      reasoning: parsed.reasoning || fallback.reasoning,
      shared_highlights: Array.isArray(parsed.shared_highlights) ? parsed.shared_highlights : fallback.shared_highlights,
    };
  } catch (e) {
    return fallback;
  }
}

/**
 * 2. Gepersonaliseerde Date Ideas Generator
 */
export async function generateAIDateIdeas(
  matchId: string,
  userId: string,
  user: Profile,
  candidate: Profile
): Promise<Omit<DateIdea, 'id' | 'created_at'>[]> {
  const sharedInterests = user.interests.filter((i) => candidate.interests.includes(i));

  const prompt = `Je bent een dating-expert in Nederland. Genereer 3 unieke, sfeervolle en realistische date-ideeën voor twee mensen in of nabij ${user.city || candidate.city || 'de stad'}.
Persoon A interesses: ${user.interests.join(', ')}
Persoon B interesses: ${candidate.interests.join(', ')}
Gedeelde interesses: ${sharedInterests.join(', ')}

Geef antwoord strictly in JSON format als een array van 3 objecten:
[
  {
    "title": "Titel van de date (kort en pakkend in het Nederlands)",
    "description": "Aantrekkelijke beschrijving van de activiteit en sfeer (max 2 zinnen in het Nederlands)",
    "venue_name": "Naam van een bekende of sfeervolle locatie/venue in ${user.city || 'de stad'}",
    "venue_type": "type zoals coffee, drinks, walk, museum, dinner, outdoor"
  }
]`;

  const rawResult = await callGemini(prompt);

  if (rawResult) {
    try {
      const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedArray = JSON.parse(cleanJson);
      if (Array.isArray(parsedArray) && parsedArray.length > 0) {
        return parsedArray.slice(0, 3).map((item) => ({
          match_id: matchId,
          user_id: userId,
          title: item.title || 'Koffie & Wandeling',
          description: item.description || 'Gezellig praten op een ontspannen locatie.',
          venue_name: item.venue_name || 'Lokale Hotspot',
          venue_type: item.venue_type || 'coffee',
          status: 'pending',
        }));
      }
    } catch (e) {
      console.warn('Could not parse Gemini date ideas JSON, using fallback.');
    }
  }

  // Fallback date ideas
  return [
    {
      match_id: matchId,
      user_id: userId,
      title: sharedInterests.includes('Specialty Coffee') ? 'Specialty Coffee & Stadswandeling' : 'Koffie & Eerste Indruk',
      description: `Wandel samen door ${user.city || 'het centrum'} met een verse espresso of matcha latten. Laagdrempelig en sfeervol.`,
      venue_name: 'Espressobar & Park',
      venue_type: 'coffee',
      status: 'pending',
    },
    {
      match_id: matchId,
      user_id: userId,
      title: 'Boutique Borrel & Speakeasy',
      description: 'Geniet van ambachtelijke cocktails of een speciaalbiertje in een intieme bar.',
      venue_name: 'Secret Cocktail Lounge',
      venue_type: 'drinks',
      status: 'pending',
    },
    {
      match_id: matchId,
      user_id: userId,
      title: 'Kunst, Cultuur & Ferry',
      description: 'Bekijk een indrukwekkende tentoonstelling en praat na met uitzicht op het water.',
      venue_name: 'Cultuurkwartier',
      venue_type: 'museum',
      status: 'pending',
    },
  ];
}

/**
 * 3. AI Chat Icebreakers & Gespreksopeners
 */
export async function generateAIChatIcebreakers(
  user: Profile,
  matchedProfile: Profile
): Promise<string[]> {
  const sharedInterests = user.interests.filter((i) => matchedProfile.interests.includes(i));

  const prompt = `Genereer 3 originele, leuke en respectvolle Nederlandse openingszinnen of date-voorstellen voor een chat op een datingapp.
Gebruiker 1: ${user.first_name}, interesses: ${user.interests.join(', ')}
Gebruiker 2 (match): ${matchedProfile.first_name}, interesses: ${matchedProfile.interests.join(', ')}, bio: "${matchedProfile.bio}"
Gedeelde interesses: ${sharedInterests.join(', ')}

Geef antwoord strictly als JSON array van 3 zinnen:
[
  "zin 1",
  "zin 2",
  "zin 3"
]`;

  const rawResult = await callGemini(prompt);
  if (rawResult) {
    try {
      const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3);
      }
    } catch (e) {}
  }

  const topic = sharedInterests[0] || 'reizen';
  return [
    `Hoi ${matchedProfile.first_name}! Ik zag dat we allebei gek zijn op ${topic}. Wat is jouw favoriete plek daarvoor? 😊`,
    `Hey ${matchedProfile.first_name}, als we dit weekend spontaan een date zouden plannen, kies je dan voor koffie of cocktails? ☕🍹`,
    `Leuk je te matchen, ${matchedProfile.first_name}! Je bio sprak me meteen aan. Zin om snel eens ideeën uit te wisselen? ✨`,
  ];
}

/**
 * 4. AI Bio Enhancer
 */
export async function enhanceBioWithAI(
  currentBio: string,
  interests: string[]
): Promise<{ title: string; bio: string }[]> {
  const prompt = `Herconciepieer en herschrijf de onderstaande dating-bio in 3 verschillende pakkende Nederlandse stijlen (bijv. Vlot & Enthousiast, Mysterieus & Verfijnd, Humoristisch & Direct).
Huidige bio: "${currentBio || 'Ik houd van leuke dingen doen, gezelligheid en nieuwe mensen ontmoeten.'}"
Interesses: ${interests.join(', ')}

Geef antwoord strictly in JSON format als een array van 3 objecten:
[
  { "title": "Stijl Naam", "bio": "Verbeterde bio tekst" }
]`;

  const rawResult = await callGemini(prompt);
  if (rawResult) {
    try {
      const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3);
      }
    } catch (e) {}
  }

  return [
    {
      title: 'Vlot & Charmant',
      bio: `Levensgenieter met een passie voor ${interests.slice(0, 2).join(' en ') || 'goede koffie'}. Altijd in voor spontane avonturen en goede gesprekken! ☕✨`,
    },
    {
      title: 'Direct & Humoristisch',
      bio: `Mijn formule voor een geslaagde dag? ${interests[0] || 'Goede muziek'}, fijne mensen en een flinke dosis humor. Wie daagt me uit voor een eerste date? 😉`,
    },
    {
      title: 'Verfijnd & Nieuwsgierig',
      bio: `Gepassioneerd door ${interests.join(', ') || 'cultuur en reizen'}. Op zoek naar iemand om mooie momenten en verrassende plekken mee te ontdekken.`,
    },
  ];
}
