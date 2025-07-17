# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Bash commands
- npm run build: Build the project
- npm run lint: Run ESLint with strict --max-warnings=0 setting
- npm run lint:fix: Run ESLint with auto-fix and strict settings
- npm run type-check: Run TypeScript type checking
- npm run pre-deploy: Run full pre-deployment checks (lint + type-check + build)

# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')

# Workflow
- ALWAYS run `npm run pre-deploy` before any deployment or when making significant changes
- This ensures strict linting (max-warnings=0), type checking, and successful build
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance

## Architecture Overview

This is a Next.js 15 gasless relayer application that enables ERC-20 token transfers on Sepolia without requiring users to hold native gas tokens. The backend acts as a trusted relayer that submits transactions on behalf of users.

### Key Structure
- `src/app/` - App Router pages and layouts
- `src/app/api/` - API routes for relay functionality
- `src/components/` - React components for UI
- `src/lib/` - Core services and utilities
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React contexts
- `abi/` - Smart contract ABIs

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Geist Sans and Geist Mono via next/font/google
- **Linting**: ESLint with Next.js configuration
- **Blockchain**: ethers.js v6 (backend) + wagmi v2 (frontend)
- **State Management**: React Query (@tanstack/react-query)
- **Validation**: Zod schemas

### Import Path Configuration
The project uses `@/*` path mapping for imports from the `src/` directory (configured in tsconfig.json).

### Development Notes
- Uses Turbopack for faster development builds
- Configured with TypeScript strict mode
- Path aliases: `@/*` maps to `./src/*`
- All components are React Server Components by default (App Router)

## Environment Variables

See `.env.example` for all required environment variables including:
- `PRIVATE_KEY` - Relayer wallet private key
- `RELAYER_CONTRACT` - GaslessRelayer contract address
- `CHAIN_RPC_URL` - Sepolia RPC endpoint
- `RECAPTCHA_SECRET` - Google reCAPTCHA v2 secret (optional)
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` - reCAPTCHA site key (optional)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID (optional)

## API Endpoints

- `POST /api/relay` - Submit a signed meta-transfer for relay
- `GET /api/status` - Get contract status and configuration
- `GET /api/user/[address]` - Get user nonce and usage statistics
- `GET /api/token/[address]` - Get token whitelist status and user balances
- `GET /api/tx/[hash]` - Get transaction status and receipt

## Core Components

### Backend Services
- **ContractService** (`src/lib/contract-service.ts`) - Main contract interaction service
- **Rate Limiter** (`src/lib/rate-limiter.ts`) - In-memory rate limiting
- **Logger** (`src/lib/logger.ts`) - Centralized logging
- **Schemas** (`src/lib/schemas.ts`) - Zod validation schemas
- **EIP-712 Utils** (`src/lib/eip712-utils.ts`) - EIP-712 signature utilities

### Frontend Components
- **WalletConnection** - wagmi integration with MetaMask and WalletConnect
- **TransferForm** - Complete form with EIP-712 signing
- **TransactionStatus** - Real-time transaction tracking
- **TokenSelector** - Dynamic token selection with balance display

### Custom Hooks
- **useContractData** - Contract status and configuration
- **useUserData** - User nonce and statistics
- **useRelayTransaction** - Transaction relay functionality

## Key Features

- EIP-712 signature validation for meta-transfers
- EIP-2612 permit support for token approvals
- Rate limiting by wallet address and gas usage
- reCAPTCHA v2 validation (optional)
- Comprehensive logging and error handling
- Contract interaction with ethers.js
- In-memory storage for MVP (rate limits, bans)
- Responsive design with Tailwind CSS

## Security Considerations

- All environment variables containing secrets must be kept secure
- EIP-712 signatures are validated on the backend
- Rate limiting prevents abuse
- Input validation using Zod schemas
- Deadline validation prevents stale transactions
- Contract pause functionality for emergency stops

## Development Workflow

1. Configure environment variables from `.env.example`
2. Install dependencies with `npm install`
3. Start development server with `npm run dev`
4. Connect wallet to Sepolia network
5. Test gasless transfers through the UI
6. Use API endpoints directly for testing backend functionality