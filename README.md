# Gasless Token Transfer App

A simple web app that lets you send ERC-20 tokens on Sepolia **without needing ETH for gas fees**. Just connect your wallet, sign the transaction, and we handle the rest!

## ✨ What This App Does

- **Send tokens for free** - No ETH needed for gas
- **Simple interface** - Connect wallet and transfer in seconds  
- **Secure** - Your wallet stays safe, you just sign transactions
- **Fast** - Transactions are processed by our relayer service

## 🚀 Getting Started

### For Users
1. Visit the app at `http://localhost:3000`
2. Connect your wallet (MetaMask, WalletConnect, etc.)
3. Make sure you're on **Sepolia testnet**
4. Select a token and enter transfer details
5. Sign the transaction - **no gas required!**

### For Developers

1. **Clone and install**:
   ```bash
   git clone <repo-url>
   cd gasless-app
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Add your configuration to .env.local
   ```

3. **Run the app**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   ```
   http://localhost:3000
   ```

## 🔧 Required Configuration

Create a `.env.local` file with these settings:

```bash
# Relayer Wallet (handles gas payments)
PRIVATE_KEY=your_relayer_wallet_private_key_here
RELAYER_CONTRACT=your_deployed_contract_address_here

# Network
CHAIN_RPC_URL=https://sepolia.infura.io/v3/your_project_id
CHAIN_ID=11155111

# Security
RECAPTCHA_SECRET=your_recaptcha_secret_key
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## 🛠 Built With

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **wagmi** - Wallet connections
- **ethers.js** - Blockchain interactions

## 📱 Features

- **Wallet Connection** - MetaMask, WalletConnect, and more
- **Token Selection** - Choose from whitelisted tokens
- **Real-time Status** - See transaction progress
- **Dark/Light Mode** - Choose your preferred theme
- **Mobile Friendly** - Works on all devices

## 🔒 How It Works

1. You sign a transaction off-chain (no gas needed)
2. Our relayer receives your signed transaction
3. The relayer pays the gas and submits it to the blockchain
4. Your tokens are transferred successfully!

## ⚠️ Important Notes

- This app works on **Sepolia testnet only**
- You need the tokens you want to transfer in your wallet
- The receiving address must be valid
- Transactions have time limits (deadlines)

## 🆘 Troubleshooting

**Wallet won't connect?**
- Make sure you're on Sepolia testnet
- Try refreshing the page
- Check if your wallet is unlocked

**Transaction failed?**
- Verify you have enough token balance
- Check if the token is whitelisted
- Make sure the recipient address is correct

**Need test tokens?**
- Use Sepolia faucets to get test ETH
- Use token faucets for test ERC-20 tokens

## 🚀 Deployment

This app is ready to deploy on:
- Vercel (recommended)
- Netlify  
- Railway
- Any platform that supports Next.js

Just make sure to set your environment variables in your deployment platform.

---

**Happy transferring! 🎉**