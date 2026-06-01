# Her Quiet Place

Her Quiet Place is an Expo Router mobile application for journaling, prayer requests, daily encouragement, audio comfort resources, and profile settings. It uses Supabase for authentication, data persistence, row-level security, and audio storage.

## Requirements

- Node.js and npm
- Expo tooling through `npx expo`
- A Supabase project

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local `.env` file from `.env.example` and add your Supabase project values:

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Link your Supabase project and apply the migration:

   ```bash
   npx supabase link
   npx supabase db push
   ```

4. In Supabase Dashboard, open **Authentication > URL Configuration** and add this redirect URL:

   ```text
   herquietplace://update-password
   ```

   Add your deployed web `/update-password` URL as an additional redirect URL if you use the web build.

5. Start the application:

   ```bash
   npm start
   ```

## Commands

```bash
npm run lint
npx tsc --noEmit
npm run android
npm run ios
npm run web
```

Android builds are configured through EAS:

```bash
npm run build:apk-cloud
```

## Security Notes

- Do not commit `.env`.
- The mobile app must use the Supabase anon key, never the service-role key.
- Apply `supabase/migrations/202606010001_harden_application.sql` before testing authenticated workflows.
- Apply later migrations in filename order to keep RLS policies and API grants hardened.
- In Supabase Dashboard, enable leaked password protection under **Authentication > Providers > Email** when the project plan supports it.
- Promote administrators through trusted database tooling. The client RPC only permits existing administrators to change roles.
