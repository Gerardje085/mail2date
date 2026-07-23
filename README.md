# Mail2Date

Privacy-first dating applicatie gebouwd met Expo (React Native) en Supabase.

## 🚀 Aan de slag

### 1. Afhankelijkheden installeren
Voer in de terminal het volgende commando uit om alle benodigde pakketten te installeren:

```bash
npm install
```

### 2. Supabase Instellen
1. Maak een project aan in [Supabase](https://supabase.com/).
2. Ga in je Supabase Dashboard naar **Project Settings** -> **API**.
3. Open het `.env` bestand in de root map van dit project en vul jouw Supabase gegevens in:

```env
EXPO_PUBLIC_SUPABASE_URL=https://jouw-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key-hier
```

### 3. Database Schema Migratie
Voer in je Supabase SQL Editor de inhoud uit van het migratiebestand:
📄 `supabase/migrations/20260723223901_mail2date_schema.sql`

Hiermee worden alle tabellen (`profiles`, `matches`, `date_ideas`, `conversations`, `messages`, `date_posts`, `date_checkins`) en de benodigde RLS (Row Level Security) regels aangemaakt.

### 4. App Lokaal Starten
Start de ontwikkelserver met Expo:

```bash
npm run dev
```

Of:

```bash
npx expo start
```

Druk op `w` in de terminal om de webversie in de browser te openen, of scan de QR-code met de Expo Go app op iOS/Android.

---

## 🛠️ Scripts
- `npm run dev`: Start de Expo ontwikkelserver.
- `npm run build:web`: Exporteert de app voor het web.
- `npm run typecheck`: Controleert de TypeScript typen op fouten.
