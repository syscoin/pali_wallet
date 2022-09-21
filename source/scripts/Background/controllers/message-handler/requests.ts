import { EthProvider } from 'scripts/Provider/EthProvider';
import { SysProvider } from 'scripts/Provider/SysProvider';
import { networkChain } from 'utils/network';

import { popupPromise } from './popup-promise';

/**
 * Handles methods request.
 *
 * Methods have a prefix and a name. Prefixes are the destination of the
 * request. Supported: sys, eth, wallet
 *
 * @return The method return
 */
export const methodRequest = async (
  host: string,
  data: { args?: any[]; method: string; network?: string }
) => {
  const { dapp, wallet } = window.controller;

  const [prefix, methodName] = data.method.split('_');

  if (prefix === 'wallet' && methodName === 'isConnected')
    return dapp.isConnected(host);

  const account = dapp.getAccount(host);

  const isRequestAllowed = dapp.isConnected(host) && account;

  if (!isRequestAllowed)
    throw new Error('Restricted method. Connect before requesting');

  const estimateFee = () => wallet.getRecommendedFee(dapp.getNetwork().url);

  //* Wallet methods
  if (prefix === 'wallet') {
    switch (methodName) {
      case 'isLocked':
        return !wallet.isUnlocked();
      case 'getAccount':
        return account;
      case 'getBalance':
        return Boolean(account) && account.balances[networkChain()];
      case 'getNetwork':
        return dapp.getNetwork();
      case 'getPublicKey':
        return account.xpub;
      case 'getAddress':
        return account.address;
      case 'getTokens':
        return account.assets;
      case 'estimateFee':
        return estimateFee();
      case 'changeAccount':
        return popupPromise({
          host,
          route: 'change-account',
          eventName: 'accountChange',
          data: { network: data.network },
        });
      default:
        throw new Error('Unknown method');
    }
  }

  //* Providers methods
  const provider = prefix !== 'sys' ? EthProvider(host) : SysProvider(host);

  const method = provider[methodName];

  if (!method) throw new Error('Unknown method');

  if (data.args) return await method(...data.args);

  return await method();
};

export const enable = async (host: string, chain: string, chainId: number) => {
  const { dapp } = window.controller;

  if (dapp.isConnected(host)) return { success: true };

  return popupPromise({
    host,
    route: 'connect-wallet',
    eventName: 'connect',
    data: { chain, chainId },
  });
};
