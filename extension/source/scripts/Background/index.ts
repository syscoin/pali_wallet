/* eslint-disable prettier/prettier */
import 'emoji-log';
import { STORE_PORT } from 'constants/index';

import { browser } from 'webextension-polyfill-ts';
import { wrapStore } from 'webext-redux';
import store from 'state/store';
import {
  setSenderURL,
  updateCanConnect,
  updateCurrentURL,
  updateConnectionsArray,
  removeConnection,
  updateCanConfirmTransaction,
  createAsset,
  issueAsset,
  issueNFT,
  setUpdateAsset,
  setTransferOwnership,
  clearAllTransactions
} from 'state/wallet';

import MasterController, { IMasterController } from './controllers';
import { IAccountState } from 'state/wallet/types';
import { getHost } from './helpers';
// var TrezorConnect = require('trezor-connect').default;
import TrezorConnect from 'trezor-connect';

declare global {
  interface Window {
    controller: Readonly<IMasterController>;
    senderURL: string;
    trezorConnect: any;
  }
}

if (!window.controller) {
  window.controller = Object.freeze(MasterController());
  setInterval(window.controller.stateUpdater, 3 * 60 * 1000);
}

const observeStore = async (store: any) => {
  let currentState: any;

  const handleChange = async () => {
    let nextState = store.getState();

    if (nextState !== currentState) {
      currentState = nextState;

      const tabs = await browser.tabs.query({
        active: true,
        windowType: 'normal'
      });

      const isAccountConnected = store.getState().wallet.accounts.findIndex((account: IAccountState) => {
        return account.connectedTo.find((url: string) => {
          return url === new URL(`${tabs[0].url}`).host;
        })
      }) >= 0;

      if (isAccountConnected) {
        await browser.tabs.sendMessage(Number(tabs[0].id), {
          type: 'WALLET_UPDATED',
          target: 'contentScript',
          connected: false
        });

        return;
      }
    }
  }

  let unsubscribe = store.subscribe(handleChange);

  await handleChange();

  return unsubscribe;
}

observeStore(store);

browser.runtime.onInstalled.addListener(async () => {
  console.emoji('🤩', 'Syscoin extension installed');

  window.controller.stateUpdater();

  TrezorConnect.init({
    connectSrc: 'https://localhost:8088/',
    lazyLoad: true, // this param will prevent iframe injection until TrezorConnect.method will be called
    manifest: {
      email: 'claudiocarvalhovilasboas@gmail.com',
      appUrl: 'https://syscoin.org/',
    }
  });

  window.trezorConnect = TrezorConnect;
  
  browser.runtime.onMessage.addListener(async (request, sender) => {
    const {
      type,
      target
    } = request;
    
    const views = browser.extension.getViews();
  
    for (let view of views) {
      console.log('view', view)
    }

    const tabs = await browser.tabs.query({
      active: true,
      windowType: 'normal'
    });

    const tabId = Number(tabs[0].id);

    const createPopup = async (url: string) => {
      let paliCheck: any = {
        title: 'Pali Wallet',
        alreadyOpen: false,
        windowId: -1
      };
      
      browser.tabs.query({ active: true })
      .then(async (tabs) => {
        tabs.map(async (tab) => {
          if (tab.title === 'Pali Wallet') {
            paliCheck = {
              ...paliCheck,
              alreadyOpen: true,
              windowId: tab.windowId
            };
          }
        });

        if (paliCheck.alreadyOpen) {
          await browser.windows.update(Number(paliCheck.windowId), {
            drawAttention: true,
            focused: true
          });

          return;
        }
        
        let windowpopup: any = window.open(url, "Pali Wallet", "width=372, height=600, left=900, top=90");
        
        // @ts-ignore
        windowpopup.onbeforeunload = () => {
          store.dispatch(clearAllTransactions());
        }
      });
    };

    if (typeof request == 'object') {
      if (type == 'WALLET_ERROR' && target == 'background') {
        const {
          transactionError,
          invalidParams,
          message
        } = request;
        
        browser.tabs.sendMessage(tabId, {
          type: 'WALLET_ERROR',
          target: 'contentScript',
          transactionError,
          invalidParams,
          message
        });
      }
      
      if (type == 'CONNECT_WALLET' && target == 'background') {
        const url = browser.runtime.getURL('app.html');

        store.dispatch(setSenderURL(`${sender.url}`));
        store.dispatch(updateCanConnect(true));

        await createPopup(url);

        window.senderURL = `${sender.url}`;

        return;
      }

      if (type == 'RESET_CONNECTION_INFO' && target == 'background') {
        store.dispatch(updateCanConnect(false));
        store.dispatch(removeConnection({
          accountId: request.id,
          url: request.url
        }));
        store.dispatch(setSenderURL(''));

        Promise.resolve(browser.tabs.sendMessage(Number(tabs[0].id), {
          type: 'WALLET_UPDATED',
          target: 'contentScript',
          connected: false
        }).then((response) => {
          console.log('wallet updated', response)
        }))

        return;
      }

      if (type == 'SELECT_ACCOUNT' && target == 'background') {
        store.dispatch(updateConnectionsArray({
          accountId: request.id,
          url: window.senderURL
        }));

        return;
      }

      if (type == 'CHANGE_CONNECTED_ACCOUNT' && target == 'background') {
        store.dispatch(updateConnectionsArray({
          accountId: request.id,
          url: window.senderURL
        }));

        return;
      }

      if (type == 'CONFIRM_CONNECTION' && target == 'background') {
        if (getHost(window.senderURL) == getHost(store.getState().wallet.currentURL)) {
          store.dispatch(updateCanConnect(false));

          browser.tabs.sendMessage(tabId, {
            type: 'WALLET_CONNECTION_CONFIRMED',
            target: 'contentScript',
            connectionConfirmed: true,
            state: store.getState().wallet
          });

          return;
        }

        return;
      }

      if (type == 'CANCEL_TRANSACTION' && target == 'background') {
        const item = request.item;
        
        store.dispatch(clearAllTransactions());
        
        window.controller.wallet.account.clearTransactionItem(item);

        return;
      }

      if (type == 'CLOSE_POPUP' && target == 'background') {
        store.dispatch(updateCanConnect(false));
        store.dispatch(clearAllTransactions());
        
        browser.tabs.query({ active: true })
        .then(async (tabs) => {
          tabs.map(async (tab) => {
            if (tab.title === 'Pali Wallet') {
              await browser.windows.remove(Number(tab.windowId));
            }

            return;
          });
        });

        return;
      }

      if (type == 'SEND_STATE_TO_PAGE' && target == 'background') {
        browser.tabs.sendMessage(tabId, {
          type: 'SEND_STATE_TO_PAGE',
          target: 'contentScript',
          state: store.getState().wallet
        });
      }

      if (type == 'SEND_CONNECTED_ACCOUNT' && target == 'background') {
        const connectedAccount = store.getState().wallet.accounts.find((account: IAccountState) => {
          return account.connectedTo.find((url) => {
            return url === getHost(store.getState().wallet.currentURL)
          });
        });

        browser.tabs.sendMessage(tabId, {
          type: 'SEND_CONNECTED_ACCOUNT',
          target: 'contentScript',
          connectedAccount
        });
      }

      if (type == 'CHECK_ADDRESS' && target == 'background') {
        const isValidSYSAddress = window.controller.wallet.account.isValidSYSAddress(request.address, store.getState().wallet.activeNetwork);

        browser.tabs.sendMessage(tabId, {
          type: 'CHECK_ADDRESS',
          target: 'contentScript',
          isValidSYSAddress
        });
      }

      if (type == 'GET_HOLDINGS_DATA' && target == 'background') {
        const holdingsData = await window.controller.wallet.account.getHoldingsData();

        browser.tabs.sendMessage(tabId, {
          type: 'GET_HOLDINGS_DATA',
          target: 'contentScript',
          holdingsData
        });

      }

      if (type == 'SEND_TOKEN' && target == 'background') {
        const {
          fromConnectedAccount,
          toAddress,
          amount,
          fee,
          token,
          isToken,
          rbf
        } = request;

        window.controller.wallet.account.updateTempTx({
          fromAddress: fromConnectedAccount,
          toAddress,
          amount,
          fee,
          token,
          isToken,
          rbf
        });

        store.dispatch(updateCanConfirmTransaction(true));

        const appURL = browser.runtime.getURL('app.html');

        await createPopup(appURL);

        browser.tabs.sendMessage(tabId, {
          type: 'SEND_TOKEN',
          target: 'contentScript',
          complete: true
        });
      }

      if (type == 'DATA_FROM_PAGE_TO_CREATE_TOKEN' && target == 'background') {
        const {
          precision,
          symbol,
          maxsupply,
          description,
          receiver,
          capabilityflags,
          notarydetails,
          auxfeedetails,
          notaryAddress,
          payoutAddress
        } = request;
        
        if (precision < 0 || precision > 8) {
          throw new Error('invalid precision value');
        }
        
        if (maxsupply < 0) {
          throw new Error('invalid max supply value');
        }
        
        if (!window.controller.wallet.account.isValidSYSAddress(receiver, store.getState().wallet.activeNetwork)) {
          throw new Error('invalid receiver address');
        }

        window.controller.wallet.account.setDataFromPageToCreateNewSPT({
          precision,
          symbol,
          maxsupply,
          description,
          receiver,
          capabilityflags,
          notarydetails,
          auxfeedetails,
          notaryAddress,
          payoutAddress
        });

        store.dispatch(createAsset(true));

        const appURL = browser.runtime.getURL('app.html');

        await createPopup(appURL);

        browser.tabs.sendMessage(tabId, {
          type: 'DATA_FROM_PAGE_TO_CREATE_TOKEN',
          target: 'contentScript',
          complete: true
        });
      }

      if (type == 'DATA_FROM_WALLET_TO_CREATE_TOKEN' && target == 'background') {
        window.controller.wallet.account.createSPT({
          ...window.controller.wallet.account.getDataFromPageToInitTransaction().dataFromPageToCreateSPT,
          ...window.controller.wallet.account.getDataFromPageToInitTransaction().dataFromWalletToCreateSPT
        });
      }

      if (type == 'ISSUE_SPT' && target == 'background') {
        const {
          amount,
          assetGuid
        } = request;
        
        const assetFromAssetGuid = window.controller.wallet.account.getDataAsset(assetGuid);
        
        console.log('asset data', assetFromAssetGuid)
        
        if (amount < 0 || amount >= assetFromAssetGuid.balance) {
          throw new Error('invalid amount value');
        }
        
        window.controller.wallet.account.setDataFromPageToMintSPT({
          assetGuid,
          amount: Number(amount)
        });

        store.dispatch(issueAsset(true));

        const appURL = browser.runtime.getURL('app.html');

        await createPopup(appURL);

        browser.tabs.sendMessage(tabId, {
          type: 'ISSUE_SPT',
          target: 'contentScript',
          complete: true
        });
      }

      if (type == 'DATA_FROM_WALLET_TO_MINT_TOKEN' && target == 'background') {
        window.controller.wallet.account.issueSPT({
          ...window.controller.wallet.account.getDataFromPageToInitTransaction().dataFromPageToMintSPT,
          ...window.controller.wallet.account.getDataFromPageToInitTransaction().dataFromWalletToMintSPT
        });
      }

      if (type == 'CREATE_AND_ISSUE_NFT' && target == 'background') {
        const {
          symbol,
          issuer,
          totalShares,
          description,
          notary,
          notarydetails,
          auxfee,
          auxfeedetails,
          notaryAddress,
          payoutAddress,
        } = request;
        
        if (totalShares < 0 || totalShares > 8) {
          throw new Error('invalid total shares value');
        }
        
        if (!window.controller.wallet.account.isValidSYSAddress(issuer, store.getState().wallet.activeNetwork)) {
          throw new Error('invalid receiver address');
        }

        window.controller.wallet.account.setDataFromPageToMintNFT({
          symbol,
          issuer,
          totalShares,
          description,
          notary,
          notarydetails,
          auxfee,
          auxfeedetails,
          notaryAddress,
          payoutAddress,
        });

        store.dispatch(issueNFT(true));

        const appURL = browser.runtime.getURL('app.html');

        await createPopup(appURL);

        browser.tabs.sendMessage(tabId, {
          type: 'CREATE_AND_ISSUE_NFT',
          target: 'contentScript',
          complete: true
        });
      }

      if (type == 'DATA_FROM_WALLET_TO_MINT_NFT' && target == 'background') {
        window.controller.wallet.account.issueNFT({
          ...window.controller.wallet.account.getDataFromPageToInitTransaction().dataFromPageToMintNFT,
          ...window.controller.wallet.account.getDataFromPageToInitTransaction().dataFromWalletToMintNFT
        });
      }

      if (type == 'UPDATE_ASSET' && target == 'background') {
        const {
          assetGuid,
          contract,
          capabilityflags,
          description,
          notarydetails,
          auxfeedetails,
          notaryAddress,
          payoutAddress
        } = request;

        window.controller.wallet.account.setDataFromPageToUpdateAsset({
          assetGuid,
          contract,
          capabilityflags,
          description,
          notarydetails,
          auxfeedetails,
          notaryAddress,
          payoutAddress
        });

        store.dispatch(setUpdateAsset(true));

        const appURL = browser.runtime.getURL('app.html');

        await createPopup(appURL);

        browser.tabs.sendMessage(tabId, {
          type: 'UPDATE_ASSET',
          target: 'contentScript',
          complete: true
        });
      }

      if (type == 'DATA_FROM_WALLET_TO_UPDATE_TOKEN' && target == 'background') {
        window.controller.wallet.account.setUpdateAsset({
          ...window.controller.wallet.account.getDataFromPageToInitTransaction().dataFromPageToUpdateAsset,
          ...window.controller.wallet.account.getDataFromPageToInitTransaction().dataFromWalletToUpdateAsset
        });
      }

      if (type == 'TRANSFER_OWNERSHIP' && target == 'background') {
        const {
          assetGuid,
          newOwner
        } = request;
        
        if (!window.controller.wallet.account.isValidSYSAddress(newOwner, store.getState().wallet.activeNetwork)) {
          throw new Error('invalid new owner address');
        }

        window.controller.wallet.account.setDataFromPageToTransferOwnership({
          assetGuid,
          newOwner
        });

        store.dispatch(setTransferOwnership(true));

        const appURL = browser.runtime.getURL('app.html');

        await createPopup(appURL);

        browser.tabs.sendMessage(tabId, {
          type: 'UPDATE_ASSET',
          target: 'contentScript',
          complete: true
        });
      }

      if (type == 'DATA_FROM_WALLET_TO_TRANSFER_OWNERSHIP' && target == 'background') {
        window.controller.wallet.account.setNewOwnership({
          ...window.controller.wallet.account.getDataFromPageToInitTransaction().dataFromPageToTransferOwnership,
          ...window.controller.wallet.account.getDataFromPageToInitTransaction().dataFromWalletToTransferOwnership
        });
      }

      if (type == 'CREATE_COLLECTION' && target == 'background') {
        const {
          collectionName,
          description,
          sysAddress,
          symbol,
          property1,
          property2,
          property3,
          attribute1,
          attribute2,
          attribute3
        } = request;

        window.controller.wallet.account.createCollection(collectionName, description, sysAddress, symbol, property1, property2, property3, attribute1, attribute2, attribute3)

        const createCollection: string = 'create collection is working';

        browser.tabs.sendMessage(tabId, {
          type: 'CREATE_COLLECTION',
          target: 'contentScript',
          createCollection
        });
      }

      if (type == 'GET_USER_MINTED_TOKENS' && target == 'background') {
        const tokensMinted = await window.controller.wallet.account.getUserMintedTokens();

        browser.tabs.sendMessage(tabId, {
          type: 'GET_USER_MINTED_TOKENS',
          target: 'contentScript',
          userTokens: tokensMinted
        });
      }

      if (type == 'GET_ASSET_DATA' && target == 'background') {
        const assetData = await window.controller.wallet.account.getDataAsset(request.assetGuid);

        browser.tabs.sendMessage(tabId, {
          type: 'GET_ASSET_DATA',
          target: 'contentScript',
          assetData
        });
      }
    }
  });

  browser.runtime.onConnect.addListener((port) => {
    if (port.name == 'trezor-connect') {
      return;
    }

    browser.tabs.query({ active: true })
      .then((tabs) => {
        store.dispatch(updateCurrentURL(`${tabs[0].url}`));
      });
  });
});

wrapStore(store, { portName: STORE_PORT });

// used only for development mode to automatically reload the extension when starting the browser
// remove this in production

chrome.runtime.onStartup.addListener(() => {
  chrome.runtime.reload();
})
