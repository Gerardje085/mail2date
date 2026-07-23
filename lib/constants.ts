export const INTEREST_TAGS = [
  'Specialty Coffee',
  'Indie Cinema',
  'Board Games',
  'Fine Dining',
  'Hiking',
  'Yoga',
  'Photography',
  'Vinyl Records',
  'Craft Beer',
  'Wine Tasting',
  'Book Clubs',
  'Live Music',
  'Art Galleries',
  'Cooking',
  'Cycling',
  'Running',
  'Museums',
  'Theater',
  'Baking',
  'Travel',
  'Gaming',
  'Pottery',
  'Sustainability',
  'Philosophy',
] as const;

export const DATE_TYPES = [
  { id: 'coffee', label: 'Coffee', icon: 'Coffee' },
  { id: 'cinema', label: 'Cinema', icon: 'Film' },
  { id: 'dinner', label: 'Dinner', icon: 'UtensilsCrossed' },
  { id: 'walk', label: 'Walk', icon: 'Trees' },
  { id: 'museum', label: 'Museum', icon: 'Landmark' },
  { id: 'drinks', label: 'Drinks', icon: 'Wine' },
  { id: 'activity', label: 'Activity', icon: 'Gamepad2' },
  { id: 'food', label: 'Food', icon: 'Croissant' },
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
  "So you're into {interest} too — what's your favorite spot in the city for that?",
  "I noticed we both love {interest}. Bold take: best place in town for it?",
  "Since we share {interest}, I have to ask: what got you into it?",
];

export const SAFETY_RESOURCES = [
  { label: '112 (Emergency)', number: '112' },
  { label: 'Slachtofferhulp Nederland', number: '0900-0101' },
  { label: 'Centrum Seksueel Geweld', number: '0800-0188' },
];
