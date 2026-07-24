import type { Profile, DateIdea } from './types';

async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.includes('your-gemini')) {
    console.warn('⚠️ [Gemini AI Warning] Geen geldige EXPO_PUBLIC_GEMINI_API_KEY in .env gevonden!');
    return null;
  }

  const models = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-flash-latest',
    'gemini-3.6-flash',
  ];

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

    try {
      const response = await fetch(url, {
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
        const errorBody = await response.text();
        console.warn(`[Gemini API Error] Model ${model} status ${response.status}:`, errorBody);
        continue;
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidateText) {
        console.log(`✅ [Gemini AI Success] Antwoord ontvangen via model: ${model}`);
        return candidateText;
      }
    } catch (error) {
      console.warn(`[Gemini Fetch Error] Fout bij model ${model}:`, error);
    }
  }

  return null;
}

/**
  1. AI Matchmaking & Intentie-interpretatie Analysis
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
  const fallbackScore = Math.min(96, Math.max(68, 65 + sharedInterests.length * 7 + Math.floor(Math.random() * 6)));
  
  const fallback: AIMatchAnalysis = {
    compatibility_score: fallbackScore,
    reasoning: sharedInterests.length > 0
      ? `Sterke match op basis van jullie gedeelde passie voor ${sharedInterests.slice(0, 2).join(' en ')} in ${user.city || 'de regio'}.`
      : `Beide geïnteresseerd in spontane dates, goede gesprekken en nieuwe ervaringen in ${user.city || 'de omgeving'}.`,
    shared_highlights: sharedInterests.length > 0 ? sharedInterests : ['Spontane dates', 'Goede gesprekken'],
  };

  const prompt = `Je bent de AI Matchmaker en intentie-analist voor Mail2Date, een privacy-first Nederlandse datingapp.
Analyseer de intenties, levensstijl en compatibiliteit tussen deze twee personen:

Persoon A (Gebruiker): ${user.first_name}, ${user.age} jaar, Woonplaats: ${user.city || 'Nederland'}, Interesses: [${user.interests.join(', ')}], Bio: "${user.bio || 'Geen bio ingevuld'}"
Persoon B (Kandidaat): ${candidate.first_name}, ${candidate.age} jaar, Woonplaats: ${candidate.city || 'Nederland'}, Interesses: [${candidate.interests.join(', ')}], Bio: "${candidate.bio || 'Geen bio ingevuld'}"

Opdracht:
1. Interpreteer de intentie en de klik tussen deze twee profielen op basis van gedeelde hobby's en woonomgeving.
2. Geef antwoord UITSLUITEND in valide JSON indeling met deze velden:
{
  "compatibility_score": GETAL tussen 68 en 98,
  "reasoning": "Accurate Nederlandse verklaring (max 2 zinnen) die direct aansluit op hun specifieke intenties en interesses",
  "shared_highlights": ["gedeelde interesse 1", "gedeelde interesse 2"]
}`;

  const rawResult = await callGemini(prompt);
  if (!rawResult) return fallback;

  try {
    const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      compatibility_score: typeof parsed.compatibility_score === 'number' ? parsed.compatibility_score : fallbackScore,
      reasoning: parsed.reasoning || fallback.reasoning,
      shared_highlights: Array.isArray(parsed.shared_highlights) && parsed.shared_highlights.length > 0
        ? parsed.shared_highlights
        : fallback.shared_highlights,
    };
  } catch (e) {
    return fallback;
  }
}

/**
  2. Gepersonaliseerde Date Ideas Generator op basis van Intenties & Locatie
 */
export async function generateAIDateIdeas(
  matchId: string,
  userId: string,
  user: Profile,
  candidate: Profile
): Promise<Omit<DateIdea, 'id' | 'created_at'>[]> {
  const sharedInterests = user.interests.filter((i) => candidate.interests.includes(i));
  const locationName = user.city || candidate.city || 'de regio';

  const prompt = `Je bent de dating-expert voor Mail2Date.
Genereer 3 accurate, sfeervolle date-ideeën die exact aansluiten bij de intenties en interesses van deze twee personen.

Persoon A interesses: ${user.interests.join(', ')}
Persoon B interesses: ${candidate.interests.join(', ')}
Gedeelde interesses: ${sharedInterests.join(', ') || 'Koffie, Wandelen, Borrelen'}
Locatie/Stad: ${locationName}

Regels:
- De date-ideeën moeten concreet, realistisch en laagdrempelig zijn voor een eerste of tweede date.
- Geef antwoord UITSLUITEND als JSON array van 3 objecten met exact deze sleutels:
[
  {
    "title": "Titel van de date (pakkend Nederlands, bijv. 'Specialty Coffee & Grachtenwandeling')",
    "description": "Aantrekkelijke en sfeervolle beschrijving (max 2 duidelijke Nederlandse zinnen)",
    "venue_name": "Sfeervolle bekende plek of hotspot in ${locationName}",
    "venue_type": "Kies uit: coffee, drinks, walk, museum, dinner, activity"
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
          title: item.title || 'Gezellige Koffiedate',
          description: item.description || 'Ontspannen afspreken in het centrum voor een goed gesprek.',
          venue_name: item.venue_name || `Koffiebar in ${locationName}`,
          venue_type: item.venue_type || 'coffee',
          status: 'pending',
        }));
      }
    } catch (e) {
      console.warn('Fout bij verwerken Gemini date ideas JSON, fallback wordt gebruikt.');
    }
  }

  // Smart dynamic fallbacks tailored to shared interests
  const topic1 = sharedInterests[0] || 'Koffie';
  const topic2 = sharedInterests[1] || 'Borrelen';

  return [
    {
      match_id: matchId,
      user_id: userId,
      title: `${topic1} & Stadswandeling`,
      description: `Wandel samen door sfeervol ${locationName} met een verse espresso of warme drank. Ontspannen en laagdrempelig.`,
      venue_name: `Espressobar & Park in ${locationName}`,
      venue_type: 'coffee',
      status: 'pending',
    },
    {
      match_id: matchId,
      user_id: userId,
      title: `${topic2} in een Intieme Bar`,
      description: `Geniet samen van een ambachtelijk speciaalbiertje of cocktail in een gezellige hotspot in ${locationName}.`,
      venue_name: `Boutique Bar ${locationName}`,
      venue_type: 'drinks',
      status: 'pending',
    },
    {
      match_id: matchId,
      user_id: userId,
      title: 'Kunst, Cultuur & Nakleten',
      description: 'Bekijk samen een inspirerende expositie of voorstelling en praat na onder het genot van een hapje.',
      venue_name: `Cultuurcentrum in ${locationName}`,
      venue_type: 'museum',
      status: 'pending',
    },
  ];
}

/**
  3. AI Chat Icebreakers & Gespreksopeners op basis van Intenties
 */
export async function generateAIChatIcebreakers(
  user: Profile,
  matchedProfile: Profile
): Promise<string[]> {
  const sharedInterests = user.interests.filter((i) => matchedProfile.interests.includes(i));
  const topic = sharedInterests[0] || matchedProfile.interests[0] || 'reizen';

  const prompt = `Genereer 3 originele, sympathieke en accurate Nederlandse openingszinnen voor een chat op de datingapp Mail2Date.
Gebruiker: ${user.first_name}, interesses: [${user.interests.join(', ')}]
Match: ${matchedProfile.first_name}, interesses: [${matchedProfile.interests.join(', ')}], bio: "${matchedProfile.bio || ''}"
Gedeelde interesses: [${sharedInterests.join(', ')}]

Geef antwoord UITSLUITEND als JSON array van 3 zinnen:
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

  return [
    `Hoi ${matchedProfile.first_name}! Ik zag dat we allebei een passie hebben voor ${topic}. Wat is jouw favoriete ervaring daarmee? 😊`,
    `Hey ${matchedProfile.first_name}, als we dit weekend spontaan een date zouden plannen op basis van onze interesses, kies je dan voor koffie of borrelen? ☕🍹`,
    `Leuk je te matchen, ${matchedProfile.first_name}! Je profiel sprak me meteen aan. Zin om binnenkort eens ideeën uit te wisselen? ✨`,
  ];
}

/**
  4. AI Bio Enhancer & Intentie Optimalisatie
 */
export async function enhanceBioWithAI(
  currentBio: string,
  interests: string[]
): Promise<{ title: string; bio: string }[]> {
  const prompt = `Herconciepieer en herschrijf de onderstaande dating-bio in 3 verschillende pakkende Nederlandse stijlen die de daadwerkelijke intenties van de gebruiker krachtig weerspiegelen.

Huidige bio: "${currentBio || 'Ik houd van leuke dingen doen, gezelligheid en nieuwe mensen ontmoeten.'}"
Interesses: [${interests.join(', ')}]

Geef antwoord UITSLUITEND als JSON array van 3 objecten met "title" en "bio":
[
  { "title": "Vlot & Enthusiast", "bio": "Herschreven bio tekst" },
  { "title": "Direct & Humoristisch", "bio": "Herschreven bio tekst" },
  { "title": "Verfijnd & Nieuwsgierig", "bio": "Herschreven bio tekst" }
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

  const topic1 = interests[0] || 'goede koffie';
  const topic2 = interests[1] || 'nieuwe plekken ontdekken';

  return [
    {
      title: 'Vlot & Enthousiast',
      bio: `Levensgenieter met een passie voor ${topic1} en ${topic2}. Altijd in voor spontane avonturen en een goed gesprek! ☕✨`,
    },
    {
      title: 'Direct & Humoristisch',
      bio: `Mijn formule voor een geslaagde dag? ${topic1}, fijne mensen en een flinke dosis humor. Wie daagt me uit voor een eerste date? 😉`,
    },
    {
      title: 'Verfijnd & Nieuwsgierig',
      bio: `Gepassioneerd door ${interests.join(', ') || 'cultuur en reizen'}. Op zoek naar iemand om mooie momenten en verrassende plekken mee te delen.`,
    },
  ];
}
