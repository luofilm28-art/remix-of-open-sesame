# Remix of Remix of Remix of Sky High Casino

Build a production-quality online crash game similar to Aviator for the web.

IMPORTANT:

- Do not use emojis.

- Do not use placeholders.

- Do not use CSS drawings.

- Use professional PNG, WebP and Lottie assets.

- The game must look like a modern casino game.

- The interface must be mobile-friendly and desktop-friendly.

TECH STACK

Frontend:

- Next.js 15

- TypeScript

- Tailwind CSS

- Socket.IO client

- GSAP animations

- Howler.js

- Framer Motion

Backend:

- Node.js

- Express

- Socket.IO

- PostgreSQL

- Redis

DESIGN

Theme:

- Dark casino theme

- Black and red background

- Neon effects

- Animated clouds

- Realistic airplane

- Smooth particles

- Professional buttons

- Live player feed

- Real-time multiplier

MAIN GAMEPLAY

- A plane starts flying.

- The multiplier starts at 1.00x.

- The multiplier increases continuously.

- The plane flies higher and higher.

- At a random point, the plane flies away and the round ends.

- Players must cash out before the plane leaves.

- If a player does not cash out in time, the player loses the bet.

GAME FEATURES

- Real-time multiplier

- Auto bet

- Auto cash out

- Chat room

- Live leaderboard

- Bet history

- Recent winners

- Sound effects

- Background music

- Notifications

PLAYER SYSTEM

- Register

- Login

- Wallet balance

- Deposit

- Withdraw

- Transaction history

- User profile

ADMIN PANEL

- User management

- Bet management

- Statistics dashboard

- Financial reports

- Game history

- Round history

DATABASE TABLES

users

- id

- username

- email

- password

- balance

bets

- id

- user_id

- amount

- cashout

- result

rounds

- id

- crash_point

- created_at

transactions

- id

- user_id

- amount

- type

- created_at

API

POST /api/register

POST /api/login

POST /api/bet

POST /api/cashout

GET /api/history

GET /api/profile

WEBSOCKET EVENTS

round_start

multiplier_update

cashout

round_end

chat_message

ASSETS

Generate:

- HD airplane

- Clouds

- Explosion animation

- Coin animation

- Background music

- Real casino sound effects

PROJECT STRUCTURE

/client

/server

/database

/assets/images

/assets/sounds

/assets/animations

Generate complete code files with installation instructions and Docker setup.look at this image carefully i need it exactly everything layout, play logic, wining and losing logic and everything real

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nebula-wager.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f9c7016-804f-4b90-8022-67d2b827b77a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
