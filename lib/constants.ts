export const INTEREST_TAGS = [
  'Specialty Coffee',
  'Indie Films',
  'Bordspellen',
  'Fine Dining',
  'Wandelen',
  'Yoga',
  'Fotografie',
  'Vinyl Platen',
  'Speciaalbier',
  'Wijnproeverij',
  'Boekenclub',
  'Live Muziek',
  'Kunstgaleries',
  'Koken',
  'Wielrennen',
  'Hardlopen',
  'Musea',
  'Theater',
  'Bakken',
  'Reizen',
  'Gaming',
  'Keramiek & Pottenbakken',
  'Duurzaamheid',
  'Filosofie',
] as const;

export const DATE_TYPES = [
  { id: 'coffee', label: 'Koffie', icon: 'Coffee' },
  { id: 'cinema', label: 'Bioscoop', icon: 'Film' },
  { id: 'dinner', label: 'Diner', icon: 'UtensilsCrossed' },
  { id: 'walk', label: 'Wandeling', icon: 'Trees' },
  { id: 'museum', label: 'Museum', icon: 'Landmark' },
  { id: 'drinks', label: 'Borrel', icon: 'Wine' },
  { id: 'activity', label: 'Activiteit', icon: 'Gamepad2' },
  { id: 'food', label: 'Eten', icon: 'Croissant' },
] as const;

export const DATE_VENUES = [
  { name: 'Pathé City', type: 'cinema', area: 'Amsterdam Centrum' },
  { name: 'Scandinavian Embassy', type: 'coffee', area: 'Amsterdam De Pijp' },
  { name: 'Toki Coffee', type: 'coffee', area: 'Amsterdam Haarlemmerbuurt' },
  { name: 'Restaurant De Kas', type: 'dinner', area: 'Amsterdam Oost' },
  { name: 'NEMO Science Museum', type: 'museum', area: 'Amsterdam Centrum' },
  { name: 'Vondelpark', type: 'walk', area: 'Amsterdam Oud-Zuid' },
  { name: 'Hiding in Plain Sight', type: 'drinks', area: 'Amsterdam Centrum' },
  { name: 'Eye Filmmuseum', type: 'museum', area: 'Amsterdam Noord' },
  { name: 'Café Thijssen', type: 'drinks', area: 'Amsterdam Jordaan' },
  { name: 'Artis Zoo', type: 'activity', area: 'Amsterdam Oost' },
];

export const SAMPLE_ICEBREAKERS = [
  "Zo te zien houd jij ook van {interest} — wat is jouw favoriete plek daarvoor in de stad?",
  "Ik zag dat we allebei een passie hebben voor {interest}. Eerlijke mening: waar moet ik echt een keer heen?",
  "Omdat we allebei van {interest} houden moet ik het vragen: hoe is die passie bij jou ontstaan?",
];

export const SAFETY_RESOURCES = [
  { label: '112 (Noodnummer)', number: '112' },
  { label: 'Slachtofferhulp Nederland', number: '0900-0101' },
  { label: 'Centrum Seksueel Geweld', number: '0800-0188' },
];
