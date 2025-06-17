# BrunoChat

BrunoChat began as a project for the cloneathon by T3 Chat, but it aims to become the best open source alternative to closed LLM-wrappers. Our mission is to provide a powerful, accessible platform for interacting with language models while keeping your data private and your options open.

## 🌟 Why BrunoChat?

- **Flexibility**: Run it locally with your own API keys or use our hosted version
- **Freedom**: Connect your own API keys and use the service for free
- **Community-focused**: Built with and for the open source community
- **Future-proof**: Growing feature set with plans for premium options

## 💼 How to Use

1. **Self-hosted**: Clone this repo and run locally with your own API keys
2. **Web App**: Visit [brunochat.app](https://brunochat.app) and use your own API keys at no cost
3. **Free Account**: Create an account to access limited free usage of various models
4. **Premium Plans**: Coming soon - expanded access and features (stay tuned!)

## 🤝 Community & Contributions

BrunoChat is being built in the open, and I welcome contributions of all kinds! Whether you're a developer, designer, or just have great ideas, your input can help make BrunoChat better for everyone.

Together, we can create an exceptional open source alternative that respects user privacy while providing powerful AI chat capabilities. Join us on this journey!

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

# 5. Migrate DB
npx prisma migrate dev --name init

# 6. Run dev server
npm run dev

```
## 📜 License
MIT