# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack (Next.js 15)
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js configuration

## Architecture Overview

This is a Next.js 15 application using the App Router architecture with TypeScript and Tailwind CSS v4.

### Key Structure
- `src/app/` - App Router pages and layouts
- `src/app/layout.tsx` - Root layout with Geist font configuration
- `src/app/page.tsx` - Home page component
- `src/app/globals.css` - Global styles
- `public/` - Static assets (SVG icons)

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Geist Sans and Geist Mono via next/font/google
- **Linting**: ESLint with Next.js configuration

### Import Path Configuration
The project uses `@/*` path mapping for imports from the `src/` directory (configured in tsconfig.json).

### Development Notes
- Uses Turbopack for faster development builds
- Configured with TypeScript strict mode
- Path aliases: `@/*` maps to `./src/*`
- All components are React Server Components by default (App Router)

## Gasless Relayer Backend

This project implements a gasless relayer backend service that allows users to send ERC-20 tokens without holding native gas tokens. The backend acts as a trusted relayer that submits transactions on behalf of users.

### API Endpoints

- `POST /api/relay` - Submit a signed meta-transfer for relay
- `GET /api/status` - Get contract status and configuration
- `GET /api/user/[address]` - Get user nonce and usage statistics
- `GET /api/token/[address]` - Get token whitelist status and user balances
- `GET /api/tx/[hash]` - Get transaction status and receipt

### Environment Variables Required

See `.env.example` for all required environment variables including:
- `PRIVATE_KEY` - Relayer wallet private key
- `RELAYER_CONTRACT` - GaslessRelayer contract address
- `CHAIN_RPC_URL` - Sepolia RPC endpoint
- `RECAPTCHA_SECRET` - Google reCAPTCHA v2 secret

### Key Features

- EIP-712 signature validation for meta-transfers
- EIP-2612 permit support for token approvals
- Rate limiting by wallet address and gas usage
- reCAPTCHA v2 validation
- Comprehensive logging and error handling
- Contract interaction with ethers.js
- In-memory storage for MVP (rate limits, bans)

### Frontend Components

- **Wallet Connection**: wagmi integration with MetaMask and WalletConnect
- **Token Selection**: Dynamic token selection with balance display
- **Transfer Form**: Complete form with EIP-712 signing
- **Transaction Status**: Real-time transaction tracking
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Frontend Stack

- wagmi v2 for wallet connections
- React Query for API state management
- Tailwind CSS for styling
- reCAPTCHA v2 for bot protection
- TypeScript for type safety