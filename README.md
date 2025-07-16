# Gasless Relayer Backend

A Next.js backend service that enables gasless ERC-20 token transfers on Sepolia. Users can send tokens without holding native gas tokens by signing meta-transactions that are relayed by this service.

## Features

- **Gasless Transfers**: Users sign EIP-712 meta-transactions off-chain
- **EIP-2612 Permits**: Support for token approvals via permits
- **Rate Limiting**: Prevent abuse with per-wallet rate limiting
- **Security**: reCAPTCHA v2, signature validation, and comprehensive logging
- **Monitoring**: Transaction status endpoints and user statistics

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open the app**:
   - Navigate to `http://localhost:3000`
   - Connect your wallet
   - Switch to Sepolia network
   - Start transferring tokens!

5. **Test the API**:
   ```bash
   curl http://localhost:3000/api/status
   ```

## API Endpoints

### `POST /api/relay`
Submit a signed meta-transfer for execution.

**Request Body**:
```json
{
  "metaTransfer": {
    "owner": "0x...",
    "token": "0x...",
    "recipient": "0x...",
    "amount": "1000000000000000000",
    "fee": "10000000000000000",
    "deadline": "1234567890",
    "nonce": "0"
  },
  "permitData": {
    "value": "1010000000000000000",
    "deadline": "1234567890",
    "v": 27,
    "r": "0x...",
    "s": "0x..."
  },
  "signature": "0x...",
  "recaptchaToken": "token"
}
```

### `GET /api/status`
Get contract status and configuration.

### `GET /api/user/[address]`
Get user's current nonce and usage statistics.

### `GET /api/token/[address]`
Get token whitelist status and user balances.

### `GET /api/tx/[hash]`
Get transaction status and receipt.

## Environment Variables

Required environment variables (see `.env.example`):

- `PRIVATE_KEY` - Relayer wallet private key
- `RELAYER_CONTRACT` - GaslessRelayer contract address
- `CHAIN_RPC_URL` - Sepolia RPC endpoint
- `RECAPTCHA_SECRET` - Google reCAPTCHA v2 secret
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` - Google reCAPTCHA v2 site key
- `FEE_WALLET` - Wallet to receive fees
- `WHITELISTED_TOKENS` - Comma-separated token addresses
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID (optional)

## Architecture

```
src/
├── app/api/           # Next.js API routes
│   ├── relay/         # Main relay endpoint
│   ├── status/        # Contract status
│   ├── user/          # User information
│   ├── token/         # Token information
│   └── tx/            # Transaction monitoring
├── lib/               # Core services
│   ├── contract.ts    # Contract interactions
│   ├── schemas.ts     # Zod validation schemas
│   ├── recaptcha.ts   # reCAPTCHA validation
│   ├── rate-limiter.ts # Rate limiting
│   ├── logger.ts      # Logging service
│   └── eip712-utils.ts # EIP-712 utilities
└── abi/               # Contract ABI
```

## Security Features

- **EIP-712 Signature Validation**: Prevents replay attacks
- **Rate Limiting**: Per-wallet request and gas usage limits
- **reCAPTCHA v2**: Prevents automated abuse
- **Input Validation**: Comprehensive request validation with Zod
- **Logging**: All transactions and errors are logged
- **Deadline Validation**: Prevents stale transactions

## Development

Built with:
- Next.js 15 (App Router)
- TypeScript
- ethers.js v6 (backend) + wagmi (frontend)
- Zod validation
- Tailwind CSS
- React Query (@tanstack/react-query)
- reCAPTCHA v2

## Deployment

The service is designed to run on Sepolia testnet. For production:

1. Update environment variables for mainnet
2. Configure proper database for rate limiting
3. Set up monitoring and alerting
4. Review security configurations

## License

This project is for educational and development purposes.