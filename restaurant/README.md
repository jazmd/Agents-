# By Kebap — Premium Döner Restaurant Platform

Full-stack ordering platform for a German döner restaurant, built as an npm-workspaces monorepo.

## Stack

- **Web**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + next-intl + Prisma + NextAuth + Zustand
- **Mobile**: Expo (React Native) + Expo Router + NativeWind — shared menu + i18n with web
- **Database**: SQLite (dev) / PostgreSQL (prod) via Prisma
- **i18n**: German (default), English, Turkish, Russian

## Structure

```
restaurant/
├── apps/
│   ├── web/          Next.js storefront + admin
│   └── mobile/       Expo native app
└── packages/
    ├── menu/         Shared menu data + types
    ├── i18n/         Shared translation messages
    └── ui/           Shared design tokens
```

## Quick start

```bash
cd restaurant
npm install

# Web (http://localhost:3000)
npm run dev:web

# Mobile (Expo dev server)
npm run dev:mobile
```

Initial DB setup (web):

```bash
cd apps/web
npx prisma migrate dev --name init
npm run dev
```

## Features

- Premium menu catalog (Döner, Dürüm, Lahmacun, Pide, Pizza, Burger, Salate, Beilagen, Süßes, Getränke)
- Persistent shopping cart (Zustand)
- Delivery + pickup checkout with order persistence
- Customer registration + order history (NextAuth credentials)
- Admin dashboard for orders + menu management
- 4-language interface (DE / EN / TR / RU)
- Mobile-first responsive design with warm premium aesthetic
