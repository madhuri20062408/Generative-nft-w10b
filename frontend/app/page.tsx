'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { parseEther } from 'viem';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

import MyNFTABI from '../contracts/MyNFT.json';
import allowlist from '../allowlist.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export default function Home() {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const [merkleProof, setMerkleProof] = useState<string[]>([]);

  // Contract Reads
  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNFTABI.abi,
    functionName: 'totalSupply',
  });

  const { data: saleState } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNFTABI.abi,
    functionName: 'saleState',
  });

  const { data: price } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNFTABI.abi,
    functionName: 'price',
  });

  // Contract Writes
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: isRevealed } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNFTABI.abi,
    functionName: 'isRevealed',
  });

  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNFTABI.abi,
    functionName: 'owner',
  });

  // Calculate Merkle Proof when address changes
  useEffect(() => {
    if (address) {
      const leafNodes = allowlist.map(addr => keccak256(addr));
      const tree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
      const leaf = keccak256(address);
      const proof = tree.getHexProof(leaf);
      setMerkleProof(proof);
    }
  }, [address]);

  // Refetch supply after transaction
  useEffect(() => {
    if (isConfirmed) {
      refetchSupply();
    }
  }, [isConfirmed, refetchSupply]);

  const handleMint = () => {
    if (!price) return;

    if (saleState === 1) { // Allowlist
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: MyNFTABI.abi,
        functionName: 'allowlistMint',
        args: [merkleProof, BigInt(quantity)],
        value: (price as bigint) * BigInt(quantity),
      });
    } else if (saleState === 2) { // Public
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: MyNFTABI.abi,
        functionName: 'publicMint',
        args: [BigInt(quantity)],
        value: (price as bigint) * BigInt(quantity),
      });
    }
  };

  const handleReveal = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: MyNFTABI.abi,
      functionName: 'reveal',
    });
  };

  const setSaleState = (state: number) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: MyNFTABI.abi,
      functionName: 'setSaleState',
      args: [state],
    });
  };

  const getSaleStatusText = (state: number | undefined) => {
    switch (state) {
      case 0: return 'Paused';
      case 1: return 'Allowlist';
      case 2: return 'Public';
      default: return 'Loading...';
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          NFT Launchpad
        </h1>

        <div className="flex justify-center mb-8">
          <div data-testid="connect-wallet-button">
            <ConnectButton />
          </div>
        </div>

        {isConnected && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">Connected Address</p>
              <p data-testid="connected-address" className="font-mono text-xs break-all">
                {address}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-400">Status</p>
                <p data-testid="sale-status" className="font-bold">
                  {getSaleStatusText(saleState as number)}
                </p>
              </div>
              <div className="p-4 bg-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-400">Minted</p>
                <p className="font-bold">
                  <span data-testid="mint-count">{totalSupply?.toString() || '0'}</span> /
                  <span data-testid="total-supply">10000</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                  data-testid="quantity-input"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={handleMint}
                disabled={saleState === 0 || isPending || isConfirming}
                data-testid="mint-button"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 rounded-lg transition-all duration-200"
              >
                {isPending ? 'Confirming in Wallet...' : isConfirming ? 'Minting...' : 'Mint NFT'}
              </button>

              {address === owner && (
                <div className="pt-4 border-t border-gray-700 space-y-4">
                  <p className="text-sm font-bold text-gray-400">Admin Controls</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setSaleState(0)} className="bg-red-900/50 hover:bg-red-800 text-xs py-2 rounded">Pause</button>
                    <button onClick={() => setSaleState(1)} className="bg-blue-900/50 hover:bg-blue-800 text-xs py-2 rounded">Allowlist</button>
                    <button onClick={() => setSaleState(2)} className="bg-green-900/50 hover:bg-green-800 text-xs py-2 rounded">Public</button>
                  </div>
                  {!isRevealed && (
                    <button
                      onClick={handleReveal}
                      disabled={isPending || isConfirming}
                      className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-2 rounded-lg transition-all text-sm"
                    >
                      Reveal Collection
                    </button>
                  )}
                </div>
              )}

              {isConfirmed && (
                <p className="text-green-400 text-center text-sm font-medium">
                  Mint successful! View on Explorer.
                </p>
              )}

              {writeError && (
                <p className="text-red-400 text-center text-sm break-words">
                  Error: {(writeError as any).shortMessage || writeError.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
