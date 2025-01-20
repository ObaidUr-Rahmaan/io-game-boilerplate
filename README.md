# Hathora IO Game Boilerplate

A minimal boilerplate for creating multiplayer IO games using Hathora as the game server. This boilerplate provides the essential structure and networking code to get started with multiplayer game development.

## Tech Stack

- React + Vite + TypeScript for the client
- NodeJS + TypeScript for the server
- Hathora for the Global Game Server
- GitHub Actions for CI/CD
- Docker for containerization

## Features

- Room creation and management
- Client-server networking setup
- TypeScript support
- Vite for client development
- Shared types between client and server
- Automatic deployment to Hathora Cloud
- Docker containerization
- Node version management with .nvmrc

## Project Structure

```
.
├── client/          # Frontend application
│   ├── src/         # Source code
│   └── public/      # Static assets
├── server/          # Game server
│   └── src/         # Server source code
└── shared/          # Shared types and constants
    └── types/       # TypeScript interfaces
```

## Prerequisites

- Node.js (version specified in `.nvmrc`)
  ```bash
  # Use nvm to switch to the correct version
  nvm use
  ```
- PNPM package manager (`npm install -g pnpm`)
- Hathora Account (for deployment)
- Docker (optional, for local container testing)

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   pnpm install

   # Install client dependencies
   cd ../client
   pnpm install
   ```

3. Start development servers:
   ```bash
   # Start server
   cd server
   pnpm dev

   # Start client (in another terminal)
   cd client
   pnpm dev
   ```

## Building Your Game

This boilerplate provides the basic infrastructure for a multiplayer game. To create your own game:

1. Define your game state in `shared/types`
2. Implement game logic in `server/src`
3. Create your game UI in `client/src`
4. Add your game-specific networking events

## Local Docker Testing

To test the server in a container locally:

```bash
# Build the container
docker build -t my-game-server .

# Run the container
docker run -p 4000:4000 my-game-server
```

## Deployment

### Client Deployment

Create a new Vercel project and add the repository as a new project.

The React Client will be deployed to Vercel automatically on every push to the main branch.

### Setting up Automatic Server Deployment with GitHub Actions

1. Create a Hathora account at [https://hathora.dev](https://hathora.dev)

2. Create a new app in Hathora Cloud Console and note down your:
   - App ID
   - Developer Token

3. In your GitHub repository, add these secrets:
   - Go to Settings > Secrets and Variables > Actions
   - Add `HATHORA_TOKEN` with your Developer Token
   - Add `HATHORA_APP_ID` with your App ID

4. Push to main branch or manually trigger the workflow:
   - Every push to main will automatically deploy
   - Or go to Actions tab > "Deploy to Hathora" > "Run workflow"

## License

MIT 