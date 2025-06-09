# PrismChat

A lightweight, modern T3 Chat clone built for the Cloneathon.

## 🚀 Stack

- React + Vite
- React Router v7
- shadcn/ui
- better-auth
- Prisma + PostgreSQL

## 🛠 Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy .env
cp .env.example .env

# 3. Start PostgreSQL
docker-compose up -d

# 4. Generate Prisma client
npx prisma generate

# 5. Migrate and seed DB
npx prisma migrate dev --name init
npx prisma db seed

# 6. Run dev server
npm run dev

```
## 📜 License
MIT