import 'emoji-log';
import { wrapStore } from 'webext-redux';
import { browser, Runtime } from 'webextension-polyfill-ts';

import { STORE_PORT } from 'constants/index';
import store from 'state/store';
import { setIsLoadingBalances, setIsLoadingTxs } from 'state/vault';
import { log } from 'utils/logger';

import MasterController, { IMasterController } from './controllers';

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Window {
    controller: Readonly<IMasterController>;
  }
}
let paliPort: Runtime.Port;
const onWalletReady = (windowController: IMasterController) => {
  // Add any code here that depends on the initialized wallet
  window.controller = windowController;
  setInterval(window.controller.utils.setFiat, 3 * 60 * 1000);
  if (paliPort) {
    window.controller.dapp.setup(paliPort);
  }
  window.controller.utils.setFiat();
};

if (!window.controller) {
  window.controller = MasterController(onWalletReady);
  // setInterval(window.controller.utils.setFiat, 3 * 60 * 1000);
}

browser.runtime.onInstalled.addListener(() => {
  console.emoji('🤩', 'Pali extension enabled');
});

let timeout: any;

const restartLockTimeout = () => {
  const { timer } = store.getState().vault;

  if (timeout) {
    clearTimeout(timeout);
  }

  timeout = setTimeout(() => {
    handleLogout();
  }, timer * 60 * 1000);
};

const handleIsOpen = (isOpen: boolean) =>
  window.localStorage.setItem('isPopupOpen', JSON.stringify({ isOpen }));
const handleLogout = () => {
  const { isTimerEnabled } = store.getState().vault; // We need this because movement listner will refresh timeout even if it's disabled
  if (isTimerEnabled) {
    window.controller.wallet.lock();

    window.location.replace('/');
  }
};

browser.runtime.onMessage.addListener(async ({ type, target }) => {
  if (type === 'reset_autolock' && target === 'background') {
    restartLockTimeout();
  }
});

export const inactivityTime = () => {
  const resetTimer = () => {
    browser.runtime.sendMessage({
      type: 'reset_autolock',
      target: 'background',
    });
  };

  // DOM Events
  const events = [
    'onmousemove',
    'onkeydown',
    'onload',
    'onmousedown',
    'ontouchstart',
    'onclick',
    'onkeydown',
  ];

  events.forEach((event) => (document[event] = resetTimer));
};

browser.runtime.onConnect.addListener(async (port: Runtime.Port) => {
  if (port.name === 'pali') handleIsOpen(true);
  if (port.name === 'pali-inject') {
    if (window.controller?.dapp) {
      window.controller.dapp.setup(port);
    }
    paliPort = port;
    return;
  }
  const { changingConnectedAccount, timer, isTimerEnabled } =
    store.getState().vault;

  if (timeout) clearTimeout(timeout);

  if (isTimerEnabled) {
    timeout = setTimeout(() => {
      handleLogout();
    }, timer * 60 * 1000);
  }

  if (changingConnectedAccount.isChangingConnectedAccount)
    window.controller.wallet.resolveAccountConflict();

  const senderUrl = port.sender.url;

  if (
    senderUrl?.includes(browser.runtime.getURL('/app.html')) ||
    senderUrl?.includes(browser.runtime.getURL('/external.html'))
  ) {
    // window.controller.utils.setFiat();

    port.onDisconnect.addListener(() => {
      handleIsOpen(false);
      if (timeout) clearTimeout(timeout);
      if (isTimerEnabled) {
        timeout = setTimeout(() => {
          handleLogout();
        }, timer * 60 * 1000);
      }
      log('pali disconnecting port', 'System');
    });
  }
});

async function checkForUpdates() {
  const {
    changingConnectedAccount: { isChangingConnectedAccount },
    isLoadingAssets,
    isLoadingBalances,
    isLoadingTxs,
    isNetworkChanging,
  } = store.getState().vault;

  const runPollingForTxs = () => {
    store.dispatch(setIsLoadingTxs(true));

    //Method that update TXs for current user based on isBitcoinBased state ( validated inside )
    window.controller.wallet.updateUserTransactionsState();

    store.dispatch(setIsLoadingTxs(false));
  };
  const runPollingForBalances = () => {
    store.dispatch(setIsLoadingBalances(true));

    //Method that update Balances for current user based on isBitcoinBased state ( validated inside )
    window.controller.wallet.updateUserNativeBalance();

    store.dispatch(setIsLoadingBalances(false));
  };

  const notValidToRunPolling =
    isChangingConnectedAccount ||
    isLoadingAssets ||
    isLoadingBalances ||
    isLoadingTxs ||
    isNetworkChanging;

  if (notValidToRunPolling) {
    //todo: do we also need to return if walle is unlocked?
    return;
  }

  runPollingForTxs();

  runPollingForBalances();
}

let intervalId;

browser.runtime.onConnect.addListener((port) => {
  // execute checkForUpdates() every 5 seconds
  if (port.name === 'polling') {
    port.onMessage.addListener((message) => {
      if (message.action === 'startPolling') {
        intervalId = setInterval(checkForUpdates, 10000);
        port.postMessage({ intervalId });
      } else if (message.action === 'stopPolling') {
        clearInterval(intervalId);
      }
    });
  }
});

const port = browser.runtime.connect(undefined, { name: 'polling' });
port.postMessage({ action: 'startPolling' });

wrapStore(store, { portName: STORE_PORT });
