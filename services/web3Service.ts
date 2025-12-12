
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Configuration for Sei Network (EVM)
const SEI_CHAIN_ID_DECIMAL = 1329;
const SEI_CHAIN_ID_HEX = '0x531'; // 1329 in hex
const SEI_RPC_URL = 'https://evm-rpc.sei-apis.com';
const SEI_EXPLORER_URL = 'https://seitrace.com';

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (params: any) => void) => void;
  removeListener: (eventName: string, handler: (params: any) => void) => void;
}

export const connectToSei = async (): Promise<string | null> => {
  const provider = (window as any).ethereum as EthereumProvider;

  if (!provider) {
    alert("Please install an EVM-compatible wallet like MetaMask or Compass!");
    return null;
  }

  try {
    // 1. Request Account Access
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];

    // 2. Check Chain ID
    const chainId = await provider.request({ method: 'eth_chainId' });

    if (chainId !== SEI_CHAIN_ID_HEX) {
      try {
        // Try switching to Sei
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEI_CHAIN_ID_HEX }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: SEI_CHAIN_ID_HEX,
                  chainName: 'Sei Network',
                  nativeCurrency: {
                    name: 'Sei',
                    symbol: 'SEI',
                    decimals: 18,
                  },
                  rpcUrls: [SEI_RPC_URL],
                  blockExplorerUrls: [SEI_EXPLORER_URL],
                },
              ],
            });
          } catch (addError) {
            console.error("Failed to add Sei network", addError);
            return null;
          }
        } else {
          console.error("Failed to switch network", switchError);
          return null;
        }
      }
    }

    return account;
  } catch (error) {
    console.error("Error connecting to wallet", error);
    return null;
  }
};

export const checkIfWalletConnected = async (): Promise<string | null> => {
    const provider = (window as any).ethereum as EthereumProvider;
    if (!provider) return null;

    try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
             // Optional: Force check chain ID here if strict network adherence is needed on reload
             return accounts[0];
        }
        return null;
    } catch (error) {
        return null;
    }
}
