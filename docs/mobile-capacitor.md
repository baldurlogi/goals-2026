# Capacitor Mobile Setup

This repo keeps the web app as the source of truth and wraps the built Vite app with Capacitor for iOS and Android.

## What is in place

- `capacitor.config.ts`
- Capacitor packages in `package.json`
- helper scripts:
  - `pnpm mobile:build`
  - `pnpm cap:sync`
  - `pnpm cap:copy`
  - `pnpm cap:open:ios`
  - `pnpm cap:open:android`
  - `pnpm cap:run:ios`
  - `pnpm cap:run:android`

## First-time local setup

1. Build the web app:

   ```bash
   pnpm build
   ```

2. Add native platforms:

   ```bash
   pnpm exec cap add ios
   pnpm exec cap add android
   ```

3. Sync the built web app into the native wrappers:

   ```bash
   pnpm cap:sync
   ```

4. Open the native projects:

   ```bash
   pnpm cap:open:ios
   pnpm cap:open:android
   ```

## Normal workflow

After any web app change:

```bash
pnpm mobile:build
```

That rebuilds the Vite app and syncs the output into Capacitor.

## What to test first

- Supabase auth and callback flow
- Safe-area spacing on iPhone
- Keyboard behavior on forms
- Deep links such as auth redirects and waitlist confirmation
- Storage/session persistence after app relaunch
- Dashboard performance on real devices

## Current approach

This is intentionally the smallest safe start:

- same repo
- same React web app
- Capacitor as the native wrapper

If mobile later becomes the primary product and needs a truly native UI, that would be the point to evaluate a separate Expo / React Native app.
