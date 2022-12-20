import { PaliInpageProvider } from './paliProvider';
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// Read files in as strings
declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Window {
    ConnectionsController: any;
    SUPPORTED_WALLET_METHODS: any;
    SyscoinInstalled: any;
    beterraba: Readonly<PaliInpageProvider>;
    ethereum: any;
    pali: Readonly<any>;
  }
}

// const paliListener = () => {
//   window.addEventListener(
//     'notification',
//     (event) => {
//       // console.log('[Pali] EventListener method', data.method );
//       if (event.detail === undefined) {
//         resolve(undefined);

//         return;
//       } else if (event.detail === null) {
//         resolve(null);

//         return;
//       }

//       const response = JSON.parse(event.detail);
//       if (response.error) {
//         reject(response.error); //TODO all the errors function needs to be refactored this part should not add new Error on response rejection

//         return;
//       }
//       resolve(response);

//       return response;
//     },
//     {
//       passive: true,
//     }
//   );
// };
/**
 * Sends a message to pali and add a listerner for the response
 */
const Oldproxy = (type, data?) =>
  new Promise((resolve, reject) => {
    const id = Date.now() + '.' + Math.random();

    window.addEventListener(
      id,
      (event: any) => {
        // console.log('[Pali] EventListener method', data.method );
        if (event.detail === undefined) {
          resolve(undefined);

          return;
        } else if (event.detail === null) {
          resolve(null);

          return;
        }

        const response = JSON.parse(event.detail);
        if (response?.code === 4001 || response?.code === -32603) {
          reject(response);
          return;
        }
        if (response.error) {
          reject(response.error); //TODO all the errors function needs to be refactored this part should not add new Error on response rejection

          return;
        }

        if (
          data.method === 'eth_requestAccounts' ||
          data.method === 'eth_accounts'
        ) {
          //TODO: enhance this implementation
          let addr = event.detail.replace('[', '');
          addr = addr.replace(']', '');
          addr = addr.replaceAll('"', '');
          window.ethereum.selectedAddress = addr;
        }
        resolve(response);

        return response;
      },
      {
        once: true,
        passive: true,
      }
    );
    window.postMessage(
      {
        id,
        type,
        data,
      },
      '*'
    );
  });

/**
 * Requests a method execution to pali
 * @param req is an object that contains `method` and maybe `args`
 * @returns the result of the method execution
 */
const request = async (req) => {
  const response = await Oldproxy('METHOD_REQUEST', req);
  return response;
};
/**
 * Check if wallet is unlocked as metamask api exposes it
 */
const isUnlocked = () => {
  const host = window.location.host;
  const id = `${host}.isUnlocked`;
  window.postMessage(
    {
      id: id,
      type: 'IS_UNLOCKED',
    },
    '*'
  );
  return new Promise((resolve) => {
    window.addEventListener(id, (event: any) => {
      const response = JSON.parse(event.detail);
      resolve(response);
    });
  });
};

/**
 * Adds a listener to pali events
 * @see `DAppEvents`
 */
const on = (eventName, callback) => {
  const host = window.location.host;

  const id = `${host}.${eventName}`;
  console.log('checking callback: ', callback);
  window.pali._listeners[id] = ({ detail }) => {
    callback(JSON.parse(detail));
  };

  window.addEventListener(id, window.pali._listeners[id], {
    passive: true,
  });
  window.postMessage(
    {
      id: id,
      type: 'EVENT_REG',
      data: {
        eventName,
        host,
      },
    },
    '*'
  );
};

/**
 * Removes a listener from pali events
 * @see `DAppEvents`
 */
const removeListener = (eventName) => {
  const host = window.location.host;

  const id = `${host}.${eventName}`;

  if (window.pali._listeners[id]) {
    window.removeEventListener(id, window.pali._listeners[id]);

    delete window.pali._listeners[id];
  }

  window.postMessage(
    {
      id,
      type: 'EVENT_DEREG',
      data: {
        eventName,
        host,
      },
    },
    '*'
  );
};

window.pali = Object.freeze({
  version: 2,
  request,
  on,
  removeListener,
  isConnected: () => request({ method: 'wallet_isConnected' }),
  enable: () => Oldproxy('ENABLE', { chain: 'syscoin', chainId: '0x39' }),
  disable: () => Oldproxy('DISABLE'),
  _listeners: {},
});

window.ethereum = {
  isMetaMask: true, //Provisory just for make testing easier
  _metamask: {
    isUnlocked: () => isUnlocked(),
  },
  wallet: 'pali-v2',
  request,
  on,
  chainId: undefined,
  networkVersion: undefined,
  selectedAddress: null,
  removeListener,
  isConnected: () => request({ method: 'wallet_isConnected' }),
  enable: () => Oldproxy('ENABLE', { chain: 'ethereum', chainId: '0x01' }),
  disable: () => Oldproxy('DISABLE'),
  _listeners: {},
};

window.beterraba = new PaliInpageProvider('ethereum');

export const { SUPPORTED_WALLET_METHODS } = window;