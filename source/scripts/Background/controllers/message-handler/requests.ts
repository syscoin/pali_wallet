import { ethErrors } from 'helpers/errors';

import { EthProvider } from 'scripts/Provider/EthProvider';
import { SysProvider } from 'scripts/Provider/SysProvider';
import store from 'state/store';
import { getController } from 'utils/browser';
import cleanErrorStack from 'utils/cleanErrorStack';
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
  data: { method: string; network?: string; params?: any[] }
) => {
  const { dapp, wallet } = window.controller;
  const controller = getController();
  const [prefix, methodName] = data.method.split('_');

  if (prefix === 'wallet' && methodName === 'isConnected')
    return dapp.isConnected(host);

  if (data.method) {
    const provider = EthProvider(host);
    const resp = await provider.unrestrictedRPCMethods(
      data.method,
      data.params
    );
    if (resp !== false && resp !== undefined) {
      return resp; //Sending back to Dapp non restrictive method response
    }
  }
  const account = dapp.getAccount(host);
  const { activeAccount, isBitcoinBased } = store.getState().vault;
  const isRequestAllowed = dapp.isConnected(host) && account;
  if (prefix === 'eth' && methodName === 'requestAccounts') {
    return await enable(host, undefined, undefined);
  }

  if (!isRequestAllowed && methodName !== 'switchEthereumChain')
    throw cleanErrorStack(ethErrors.provider.userRejectedRequest());
  const estimateFee = () => wallet.getRecommendedFee(dapp.getNetwork().url);

  if (prefix === 'eth' && methodName === 'accounts') {
    return isBitcoinBased
      ? cleanErrorStack(ethErrors.rpc.internal())
      : wallet.isUnlocked()
      ? [dapp.getAccount(host).address]
      : [];
  }

  //* Wallet methods
  if (prefix === 'wallet') {
    let tryingToAdd = false;
    const { activeNetwork, networks: chains } = store.getState().vault;
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
        if (!wallet.isUnlocked()) return false;
        return popupPromise({
          host,
          route: 'change-account',
          eventName: 'accountsChanged',
          data: { network: data.network },
        });
      case 'requestPermissions':
        if (!wallet.isUnlocked()) return false;
        return popupPromise({
          host,
          route: 'change-account',
          eventName: 'requestPermissions',
          data: { params: data.params },
        });
      case 'getPermissions':
        //This implementation should be improved to integrate in a more appropriate way the EIP2255
        const response: any = [{}];
        response[0].caveats = [
          { type: 'restrictReturnedAccounts', value: [dapp.getAccount(host)] },
        ];
        response[0].date = dapp.get(host).date;
        response[0].invoker = host;
        response[0].parentCapability = 'eth_accounts';

        return response;
      case 'addEthereumChain':
        const customRPCData = {
          url: data.params[0].rpcUrls[0],
          chainId: Number(data.params[0].chainId),
          label: data.params[0].chainName,
          apiUrl: data.params[0]?.blockExplorerUrls
            ? data.params[0].blockExplorerUrls[0]
            : undefined,
          isSyscoinRpc: false,
          symbol: data.params[0].nativeCurrency.symbol,
        };
        console.log('Check Custom RPC data', customRPCData);
        const network = await controller.wallet.getRpc(customRPCData);
        console.log('Checked Custom RPC data', customRPCData);
        if (!chains.ethereum[customRPCData.chainId] && !isBitcoinBased) {
          return popupPromise({
            host,
            route: 'add-EthChain',
            eventName: 'wallet_addEthereumChain',
            data: { ...customRPCData, symbol: network?.currency },
          });
        }
        tryingToAdd = true;
      case 'switchEthereumChain':
        if (isBitcoinBased) return cleanErrorStack(ethErrors.rpc.internal());
        const chainId = tryingToAdd
          ? customRPCData.chainId
          : Number(data.params[0].chainId);

        if (activeNetwork.chainId === chainId) return null;
        else if (chains.ethereum[chainId]) {
          return popupPromise({
            host,
            route: 'switch-EthChain',
            eventName: 'wallet_switchEthereumChain',
            data: { chainId: chainId },
          });
        }
        return cleanErrorStack(ethErrors.rpc.internal());

      default:
        throw cleanErrorStack(ethErrors.rpc.methodNotFound());
    }
  }

  if (
    activeAccount.address !== dapp.getAccount(host).address &&
    !isBitcoinBased &&
    EthProvider(host).checkIsBlocking(data.method)
  ) {
    const response = await popupPromise({
      host,
      route: 'change-active-connected-account',
      eventName: 'changeActiveConnected',
      data: { connectedAccount: dapp.getAccount(host) },
    });
    if (!response) {
      return cleanErrorStack(ethErrors.rpc.internal());
    }
    // dapp.setHasWindow(host, false); // TESTED CHANGING ACCOUNT SO CAN KEEP COMENTED
  }
  //* Providers methods
  if (prefix !== 'sys' && !isBitcoinBased) {
    const provider = EthProvider(host);
    const resp = await provider.restrictedRPCMethods(data.method, data.params);
    if (!wallet.isUnlocked()) return false;
    if (!resp) throw cleanErrorStack(ethErrors.rpc.invalidRequest());

    return resp;
  } else if (prefix === 'sys' && !isBitcoinBased)
    return cleanErrorStack(ethErrors.rpc.internal());

  const provider = SysProvider(host);
  const method = provider[methodName];

  if (!method) throw cleanErrorStack(ethErrors.rpc.methodNotFound());

  if (data.params) return await method(...data.params);

  return await method();
};

export const enable = async (
  host: string,
  chain: string,
  chainId: number,
  isSyscoinDapp = false
) => {
  const { isBitcoinBased } = store.getState().vault;
  if (!isSyscoinDapp && isBitcoinBased)
    return cleanErrorStack(ethErrors.provider.userRejectedRequest());
  const { dapp, wallet } = window.controller;
  if (dapp.isConnected(host) && wallet.isUnlocked())
    return [dapp.getAccount(host).address];
  const acceptedRequest: any = await popupPromise({
    host,
    route: 'connect-wallet',
    eventName: 'connect',
    data: { chain, chainId },
  });

  if (!acceptedRequest)
    throw cleanErrorStack(ethErrors.provider.userRejectedRequest());

  return [acceptedRequest.connectedAccount.address];
};

export const isUnlocked = () => {
  const { wallet } = window.controller;
  console.log('Test it', wallet.isUnlocked());
  return wallet.isUnlocked();
};
