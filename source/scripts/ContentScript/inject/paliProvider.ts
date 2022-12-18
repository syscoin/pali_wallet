import { EventEmitter } from 'events';
import dequal from 'fast-deep-equal';

import messages from './messages';
import {
  getRpcPromiseCallback,
  // isValidChainId,
  // isValidNetworkVersion,
} from './utils';
export type Maybe<T> = Partial<T> | null | undefined;
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface BaseProviderState {
  accounts: null | string[];
  initialized: boolean;
  isConnected: boolean;
  isPermanentlyDisconnected: boolean;
  isUnlocked: boolean;
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface RequestArguments {
  /** The RPC method to request. */
  method: string;

  /** The params of the RPC method, if any. */
  params?: unknown[] | Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface UnvalidatedJsonRpcRequest {
  method: string;
  params?: unknown;
}

export class PaliInpageProvider {
  emitter: EventEmitter;
  public readonly _metamask: ReturnType<
    PaliInpageProvider['_getExperimentalApi']
  >;
  public chainType: string;
  public networkVersion: string | null;
  public chainId: string | null;
  public selectedAddress: string | null;
  public wallet: string;
  protected static _defaultState: BaseProviderState = {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
    isPermanentlyDisconnected: false,
  };
  protected _state: BaseProviderState;

  /**
   * Indicating that this provider is a MetaMask provider.
   */
  public readonly isMetaMask: true;
  constructor(chainType, maxEventListeners = 100, wallet = 'pali-v2') {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(maxEventListeners);
    // Private state
    this._state = {
      ...PaliInpageProvider._defaultState,
    };
    // Public state
    this.selectedAddress = null;
    this.chainId = null;
    this.wallet = wallet;
    this._state;
    this.chainType = chainType;
    this._metamask = this._getExperimentalApi();
    this._handleAccountsChanged = this._handleAccountsChanged.bind(this);
    // this._handleConnect = this._handleConnect.bind(this);
    // this._handleChainChanged = this._handleChainChanged.bind(this);
    // this._handleDisconnect = this._handleDisconnect.bind(this);
    // this._handleUnlockStateChanged = this._handleUnlockStateChanged.bind(this);
    this._rpcRequest = this._rpcRequest.bind(this);
    this.request = this.request.bind(this);
    this.request({ method: 'wallet_getProviderState' })
      .then((state) => {
        const initialState = state as Parameters<
          PaliInpageProvider['_initializeState']
        >[0];
        this._initializeState(initialState);
      })
      .catch((error) =>
        console.error(
          'Pali: Failed to get initial state. Please report this bug.',
          error
        )
      );
  }

  //====================
  // Public Methods
  //====================

  /**
   * Returns whether the provider can process RPC requests.
   */
  isConnected(): boolean {
    return this._state.isConnected;
  }
  /**
   * Submits an RPC request for the given method, with the given params.
   * Resolves with the result of the method call, or rejects on error.
   *
   * @param args - The RPC request arguments.
   * @param args.method - The RPC method name.
   * @param args.params - The parameters for the RPC method.
   * @returns A Promise that resolves with the result of the RPC method,
   * or rejects if an error is encountered.
   */
  public async request<T>(args: RequestArguments): Promise<Maybe<T>> {
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      throw {
        code: 420,
        message: messages.errors.invalidRequestArgs(),
        data: args,
      };
      //   throw ethErrors.rpc.invalidRequest({
      //     message: messages.errors.invalidRequestArgs(),
      //     data: args,
      //   });
    }

    const { method, params } = args;

    if (typeof method !== 'string' || method.length === 0) {
      throw {
        code: 69,
        message: messages.errors.invalidRequestMethod(),
        data: args,
      };
      //   throw ethErrors.rpc.invalidRequest({
      //     message: messages.errors.invalidRequestMethod(),
      //     data: args,
      //   });
    }

    if (
      params !== undefined &&
      !Array.isArray(params) &&
      (typeof params !== 'object' || params === null)
    ) {
      throw {
        code: 42069,
        message: messages.errors.invalidRequestParams(),
        data: args,
      };
      //   throw ethErrors.rpc.invalidRequest({
      //     message: messages.errors.invalidRequestParams(),
      //     data: args,
      //   });
    }

    return new Promise<T>((resolve, reject) => {
      this._rpcRequest(
        { method, params },
        getRpcPromiseCallback(resolve, reject, false)
      );
    });
  }

  //====================
  // Private Methods
  //====================

  /**
   * **MUST** be called by child classes.
   *
   * Sets initial state if provided and marks this provider as initialized.
   * Throws if called more than once.
   *
   * Permits the `networkVersion` field in the parameter object for
   * compatibility with child classes that use this value.
   *
   * @param initialState - The provider's initial state.
   * @emits BaseProvider#_initialized
   * @emits BaseProvider#connect - If `initialState` is defined.
   */
  private _initializeState(initialState?: {
    accounts: string[];
    chainId: string;
    isUnlocked: boolean;
    networkVersion?: string;
  }) {
    if (this._state.initialized === true) {
      throw new Error('Provider already initialized.');
    }

    if (initialState) {
      const { accounts, chainId, isUnlocked, networkVersion } = initialState;

      // EIP-1193 connect
      // this._handleConnect(chainId);
      // this._handleChainChanged({ chainId, networkVersion });
      // this._handleUnlockStateChanged({ accounts, isUnlocked });
      this._handleAccountsChanged(accounts);
    }

    // Mark provider as initialized regardless of whether initial state was
    // retrieved.
    this._state.initialized = true;
    this.emitter.emit('_initialized');
  }
  private async _rpcRequest(
    payload: UnvalidatedJsonRpcRequest | UnvalidatedJsonRpcRequest[], //TODO: refactor to accept incoming batched requests
    callback: (...args: any[]) => void
  ) {
    let cb = callback;
    let error = null;
    let result = null;
    if (!Array.isArray(payload)) {
      if (
        payload.method === 'eth_requestAccounts' ||
        payload.method === 'eth_accounts'
      ) {
        // handle accounts changing
        cb = (err: Error, res: string[]) => {
          this._handleAccountsChanged(
            res || [],
            payload.method === 'eth_accounts'
          );
          callback(err, res);
        };
      }

      try {
        result = await this.proxy('METHOD_REQUEST', payload);
      } catch (_error) {
        // A request handler error, a re-thrown middleware error, or something
        // unexpected.
        error = _error;
      }
      return cb(error, result);
    }
    error = {
      code: 123,
      message: messages.errors.invalidBatchRequest(),
      data: null,
    };
    return callback(error, result);
  }
  private proxy = (type: string, data: UnvalidatedJsonRpcRequest) =>
    new Promise((resolve, reject) => {
      const id = Date.now() + '.' + Math.random();

      window.addEventListener(
        id,
        (event: any) => {
          //TODO: Add proper event for our event handling methods
          console.log('[Pali] EventListener method', data.method, event.detail);
          if (event.detail === undefined) {
            resolve(undefined);
          } else if (event.detail === null) {
            resolve(null);
          }

          const response = JSON.parse(event.detail);
          if (response?.code === 4001 || response?.code === -32603) {
            //TODO: refactor so all reject cases go through response.error if condition
            console.log('Check response that triggered this situation');
            reject(response);
          }
          if (response.error) {
            reject(response.error); //TODO all the errors function needs to be refactored this part should not add new Error on response rejection
          }

          if (
            data.method === 'eth_requestAccounts' ||
            data.method === 'eth_accounts'
          ) {
            //TODO: enhance this implementation
            let addr = event.detail.replace('[', '');
            addr = addr.replace(']', '');
            addr = addr.replaceAll('"', '');
            this.selectedAddress = addr;
          }
          resolve(response);
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

  private _handleAccountsChanged(
    accounts: unknown[],
    isEthAccounts = false
  ): void {
    let _accounts = accounts;

    if (!Array.isArray(accounts)) {
      console.error(
        'Pali: Received invalid accounts parameter. Please report this bug.',
        accounts
      );
      _accounts = [];
    }

    for (const account of accounts) {
      if (typeof account !== 'string') {
        console.error(
          'Pali: Received non-string account. Please report this bug.',
          accounts
        );
        _accounts = [];
        break;
      }
    }

    // emit accountsChanged if anything about the accounts array has changed
    if (!dequal(this._state.accounts, _accounts)) {
      // we should always have the correct accounts even before eth_accounts
      // returns
      if (isEthAccounts && this._state.accounts !== null) {
        console.error(
          `Pali: 'eth_accounts' unexpectedly updated accounts. Please report this bug.`,
          _accounts
        );
      }

      this._state.accounts = _accounts as string[];

      // handle selectedAddress
      if (this.selectedAddress !== _accounts[0]) {
        this.selectedAddress = (_accounts[0] as string) || null;
      }

      // finally, after all state has been updated, emit the event
      if (this._state.initialized) {
        this.emitter.emit('accountsChanged', _accounts);
      }
    }
  }

  protected _getExperimentalApi() {
    return new Proxy(
      {
        /**
         * Determines if MetaMask is unlocked by the user.
         *
         * @returns Promise resolving to true if MetaMask is currently unlocked
         */
        isUnlocked: async () => {
          if (!this._state.initialized) {
            await new Promise<void>((resolve) => {
              this.emitter.on('_initialized', () => resolve());
            });
          }
          return this._state.isUnlocked;
        },
      },
      {
        get: (obj, prop, ...args) => Reflect.get(obj, prop, ...args),
      }
    );
  }
}
