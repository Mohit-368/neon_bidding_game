# Auction Arena

A real-time multiplayer card auction built with React, Vite, Tailwind CSS, Express, and Socket.IO. It supports up to four players per room, admin-controlled starting budgets, 10-second server-authoritative bidding rounds, five-card player hands, and a server-calculated final leaderboard.

## Project layout

```text
auction-arena/
├── backend/
│   ├── data/
│   │   └── card_database.json # Private hidden-stat dataset
│   ├── src/
│   │   ├── config/          # Environment and Socket.IO setup
│   │   ├── controllers/     # HTTP controllers
│   │   ├── events/           # Socket.IO event registration
│   │   ├── middleware/       # Express error handling
│   │   ├── models/           # In-memory room and player models
│   │   ├── repositories/     # Card database access and validation
│   │   ├── routes/           # HTTP routes
│   │   ├── services/         # Room, auction rules, and battle scoring
│   │   ├── utils/            # Validation, room codes, sanitizers
│   │   ├── app.js
│   │   └── server.js
│   └── tests/
├── frontend/
│   ├── public/
│   │   ├── pokemon_cards/
│   │   ├── cricketers/
│   │   └── superheroes/
│   └── src/
│       ├── components/       # Lobby, waiting room, auction, results
│       ├── hooks/            # Socket and game state
│       ├── lib/              # Socket client
│       └── styles/
├── .env.example
├── package.json
└── render.yaml
```

## Requirements

- Node.js 20 or later
- npm 10 or later

## Run locally

From the project root:

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend talks to the backend on `http://localhost:4000` through the Vite development proxy. To test multiplayer, open multiple browser windows or use different devices on the same network and expose the development server appropriately.

Run tests and create a production build:

```bash
npm test
npm run build
npm start
```

The Express server serves `frontend/dist` when that folder exists, so the production app and Socket.IO endpoint can run on one origin.

## Environment variables

| Variable | Default | Description |
|---|---:|---|
| `PORT` | `4000` | HTTP and Socket.IO port |
| `NODE_ENV` | `development` | Runtime environment |
| `CLIENT_ORIGIN` | `http://localhost:5173` in development | Comma-separated allowed frontend origins. Leave unset for same-origin production hosting. |
| `AUCTION_DURATION_SECONDS` | `10` | Server-side duration for each item, allowed range 5 to 60 |
| `ROOM_DISCONNECT_GRACE_SECONDS` | `60` | Waiting-room reconnect grace period |
| `DEFAULT_STARTING_BUDGET` | `20` | Default wallet for rooms created through random matchmaking |
| `VITE_SERVER_URL` | empty | Optional Socket.IO server URL. Keep empty for same-origin deployment. |

The room creator chooses the initial wallet. The first player is the admin. The admin can change the starting wallet for all players while the room is waiting and can start the game when at least two players are connected.

## Card database and local assets

The private card database is `backend/data/card_database.json`. Each record has exactly the required fields:

```json
{
  "id": "pk-01",
  "name": "Pikachu",
  "image": "/pokemon_cards/pikachu.svg",
  "power": 72,
  "tier": "Epic"
}
```

The sample database contains 24 cards across Pokemon-style, cricketer, and superhero categories. Matching sample SVG artwork is included in the three local `frontend/public` folders. Replace those SVGs with image files you have rights to use, keeping the referenced file paths intact, or update the `image` values in the JSON.

Keep `card_database.json` inside the backend. Do not move it into `frontend/public` or import it into frontend code. The backend reads the file directly and never exposes a card's `power` field in a bidding-phase payload.

## Game rules and accounting

1. A room has a maximum of four players. The first player to create or join an empty room becomes admin.
2. The game can start with two to four connected players.
3. Each player starts with the configured wallet budget, $20 by default.
4. The active card has a 10-second server deadline. The browser countdown is only a visual display of the server's `endsAt` timestamp.
5. Bids are absolute integer amounts and must exceed the current high bid. The initial minimum bid is $1.
6. A leading bid reserves wallet funds. When another player outbids them, the old reservation is released. When the item closes, the winner pays the final bid and receives the card. This prevents a player from using the same wallet funds to cover a bid and another outstanding reservation.
7. A player cannot bid after acquiring five cards.
8. The game ends when every player has five cards or the card pool is exhausted.
9. The backend sums hidden card power and broadcasts the final leaderboard after bidding has ended. Only the final per-player total is revealed, not each card's individual power.

## Socket.IO event contract

| Event | Direction | Purpose |
|---|---|---|
| `room_state_updated` | server to room | Sanitized players, wallets, deck counts, current public card, phase |
| `next_item` | server to room | New public card, item number, and authoritative end timestamp |
| `timer_tick` | server to room | Remaining server time and end timestamp |
| `bid_updated` | server to room | Current bid, leader, and wallet reservation updates |
| `card_awarded` | server to room | Public card, winner, and final paid amount |
| `game_over_battle_results` | server to room | Final ranked leaderboard and total hidden power |

Client commands are `create_room`, `join_room`, `join_random_room`, `rejoin_room`, `update_room_settings`, `start_game`, `place_bid`, and `leave_room`. Commands use Socket.IO acknowledgement callbacks and receive a structured `{ ok, data }` or `{ ok: false, error }` response.

## Hidden-stat security boundary

All card broadcasts pass through `toPublicCard`, an explicit field whitelist containing only `id`, `name`, `image`, and `tier`. Awarded deck cards additionally include `paidPrice`. The backend does not expose the raw card database through an HTTP route, and the frontend has no copy of the database. The final results event reveals each player's summed power only after the game enters the battle phase.

This protects power values from ordinary browser network inspection during bidding. As with any self-hosted game, someone with server filesystem or process access can inspect the private database and runtime. Use server access controls and trusted hosting for competitive play.

## Deployment

### One service (recommended)

The included `render.yaml` describes a Node web service. It installs the root workspace dependencies, builds Vite, and starts Express. Express then serves the frontend and handles `/socket.io` on the same origin. No separate frontend server is required.

For another Node host, use:

```bash
npm install
npm run build
npm start
```

Set `NODE_ENV=production`. Set `PORT` if your host requires a specific port. Keep `VITE_SERVER_URL` empty for same-origin hosting.

### Separate frontend and backend services

Build and host `frontend` as a static Vite site. Set `VITE_SERVER_URL` to the backend's public URL at build time. Set `CLIENT_ORIGIN` on the backend to the exact frontend origin. Ensure the host supports WebSocket upgrades for `/socket.io`.

## Operational notes

- Game rooms are stored in process memory. A server restart clears active rooms. Use a persistent shared store such as Redis before running multiple backend instances or promising room persistence.
- Do not run multiple backend replicas without shared room state and coordinated timers.
- The default card images are local SVG placeholders. Replace them with locally hosted assets before a public commercial launch.
# neon_bidding_game
