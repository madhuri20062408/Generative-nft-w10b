# Generative NFT Collection Launchpad

A comprehensive, production-grade NFT launchpad featuring a gas-efficient Merkle Tree allowlist, reveal mechanism, and royalty support (ERC-2981).

## Architecture

- **Smart Contract**: Solidity (0.8.20) using OpenZeppelin ERC721, Ownable, and ERC2981.
- **Off-Chain Scripts**: Node.js scripts for Merkle Root generation and contract deployment.
- **Frontend**: Next.js 15, RainbowKit, Wagmi, and Ethers.js.
- **Orchestration**: Fully containerized with Docker and Docker Compose.

## Key Features

- **Merkle Tree Allowlist**: Allows thousands of addresses to be whitelisted for the price of a single 32-byte hash store on-chain.
- **Phased Minting**: Paused, Allowlist, and Public states controlled by the contract owner.
- **Reveal Mechanism**: Tokens initially show placeholder metadata, which can be "revealed" by the owner to show final artwork.
- **Royalty Support**: Implements ERC-2981 for seamless royalty management across marketplaces.
- **Responsive DApp**: Premium dark-mode UI with real-time on-chain data feedback.

## Setup Instructions

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- MetaMask or any EVM wallet

### 1. Environment Configuration
Copy `.env.example` to `.env` (root) and `frontend/.env.local` and fill in your details:
```bash
cp .env.example .env
```

### 2. Run with Docker
Start the local blockchain node and the frontend application:
```bash
docker-compose up --build
```
The Hardhat node will be available at `http://localhost:8545` and the frontend at `http://localhost:3000`.

### 3. Deployment (Local)
While the containers are running, you can deploy the contract to your local node:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
Update the `NEXT_PUBLIC_CONTRACT_ADDRESS` in your frontend configuration with the newly deployed address.

## Testing
Run the comprehensive unit test suite:
```bash
npx hardhat test
```

## Security & Optimization
- **Check-Effects-Interactions**: Followed patterns to prevent re-entrancy.
- **Gas Optimized**: Uses custom errors and efficient state management.
- **Access Control**: Critical functions restricted to `onlyOwner`.
