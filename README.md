# Cali Lights

A dynamic, multiplayer digital experience that merges art, memory, and play. Built with Next.js 14, deployed on Vercel.

## Overview

Cali Lights is a dual-mode interactive experience:

- **Solo Mode**: An evolving, single-player memory journey with progressive levels
- **Party Mode**: A real-time multiplayer mini-game for groups

The experience lives behind a single dynamic QR code that can switch between modes, making it perfect as a living gift or event companion.

## Features

- 🎭 **Dual Modes**: Solo memory levels and multiplayer party games
- 🎨 **Custom Visual Identity**: Gold (#DB962C), Green (#44553B), Black (#111111)
- ⚡ **Real-time Multiplayer**: Using Ably for WebSocket connections
- 💾 **Persistent Storage**: Vercel KV + Postgres for data
- 📱 **Mobile-First**: Touch gestures, haptic feedback
- 🎵 **Audio Integration**: Background music and sound effects
- ✨ **Smooth Animations**: Framer Motion for transitions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Database**: Vercel Postgres
- **Cache/KV**: Vercel KV (Redis)
- **Realtime**: Ably
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Vercel account (for deployment)
- Ably account (for realtime features)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd cali-lights
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `POSTGRES_URL`: Vercel Postgres connection string
- `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`: Vercel KV credentials
- `ABLY_API_KEY`: Ably API key for realtime features
- `NEXT_PUBLIC_APP_URL`: Your app URL
- `DEFAULT_TOKEN`: QR code token (e.g., "cali")

### Database Setup

Initialize the database tables:

```bash
# The tables will be created automatically on first run
# Or you can run the init script:
npm run db:init
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Key Routes

- `/` - Home page
- `/solo?cfg=solo.v1` - Solo Mode
- `/party?sid={sessionId}` - Party Mode
- `/admin` - Admin panel
- `/r/{token}` - Dynamic QR resolver (add this in production)

## Configuration

### Solo Mode

Edit `config/solo.v1.json` to customize solo mode levels:

```json
{
  "active_level": 1,
  "levels": [
    {
      "id": 1,
      "slug": "level-name",
      "steps": [...],
      "mini_game": "optional-game-type"
    }
  ]
}
```

### Party Mode

Edit `config/party.v1.json` to customize party rounds:

```json
{
  "rounds": [
    {
      "type": "tap-beat",
      "duration": 90,
      "threshold": 0.7
    }
  ]
}
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
vercel --prod
```

### Post-Deployment Setup

1. Set up Vercel Postgres:
   - Enable in Vercel dashboard
   - Copy connection strings to environment variables

2. Set up Vercel KV:
   - Enable in Vercel dashboard
   - Copy credentials to environment variables

3. Set up Ably:
   - Create app at ably.com
   - Copy API key to `ABLY_API_KEY`

4. Initialize database:
   - Visit your deployed URL
   - Tables will auto-create on first request

## Usage

### Admin Panel

Access the admin panel at `/admin` to:

- Toggle between Solo and Party modes
- Start and manage party game rounds
- End sessions
- View participant counts

### QR Code Setup

The dynamic QR code should point to:
```
https://your-domain.com/r/{token}
```

Where `{token}` is your `DEFAULT_TOKEN` (e.g., "cali").

### Solo Mode

Users progress through levels sequentially. Each level can contain:
- Text steps with animations
- Mini-games (salt-lime-sip, cali-lights visualization)
- Unlock conditions for birthday rewards

### Party Mode

1. Host toggles to Party Mode in admin panel
2. Players scan QR code and enter names
3. Host starts rounds from admin panel
4. Players participate in real-time games
5. Session ends with collective recap

## Project Structure

```
├── app/
│   ├── solo/              # Solo mode pages & components
│   ├── party/             # Party mode pages & components
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   └── r/                 # QR resolver (to be added)
├── lib/
│   ├── types.ts           # TypeScript types
│   ├── db.ts              # Database utilities
│   ├── kv.ts              # KV store utilities
│   ├── realtime.ts        # Ably/realtime utilities
│   ├── utils.ts           # General utilities
│   ├── audio.ts           # Audio management
│   └── hooks/             # React hooks
├── config/
│   ├── solo.v1.json       # Solo mode config
│   └── party.v1.json      # Party mode config
└── public/
    └── media/             # Images, audio files
```

## Customization

### Colors

Edit `tailwind.config.ts` to change the color palette:

```typescript
colors: {
  cali: {
    gold: "#DB962C",
    green: "#44553B",
    black: "#111111",
  },
}
```

### Adding New Levels

Add to `config/solo.v1.json`:

```json
{
  "id": 5,
  "slug": "new-level",
  "steps": [
    {
      "text": "Your text here",
      "duration": 3000,
      "animation": "fadeIn"
    }
  ]
}
```

### Adding New Rounds

Add to `config/party.v1.json` and create component in `app/party/components/`.

## Troubleshooting

### Database Connection Issues
- Verify `POSTGRES_URL` is correct
- Check Vercel Postgres is enabled
- Ensure tables are created

### Realtime Not Working
- Verify `ABLY_API_KEY` is correct
- Check Ably app is active
- Ensure WebSocket connections are allowed

### Mode Toggle Not Working
- Check KV store is configured
- Verify `DEFAULT_TOKEN` matches QR code

## License

Private project - All rights reserved

## Credits

Built with love for a special night where the lights came alive.
