import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  IKeyringAccountState,
  INetwork,
  INetworkType,
  initialActiveAccountState,
  initialNetworksState,
} from '@pollum-io/sysweb3-utils';

import trustedApps from './trustedApps.json';
import { IVaultState } from './types';

export const initialState: IVaultState = {
  lastLogin: 0,
  accounts: {},
  activeAccount: initialActiveAccountState,
  activeNetwork: {
    chainId: 57,
    url: 'https://blockbook.elint.services/',
    label: 'Syscoin Mainnet',
    default: true,
  },
  isPendingBalances: false,
  timer: 5,
  networks: initialNetworksState,
  trustedApps,
  activeToken: 'SYS',
  encryptedMnemonic: '',
  getState: () => initialState,
};

const VaultState = createSlice({
  name: 'vault',
  initialState,
  reducers: {
    // todo: set account tx and add to ikeyringaccountstate
    setAccountTransactions(
      state: IVaultState,
      action: PayloadAction<{ txid: string; tx: any }>
    ) {
      const { txid, tx } = action.payload;

      state.accounts[state.activeAccount.id] = {
        ...state.accounts[state.activeAccount.id],
        [txid]: tx,
      };
    },
    createAccount(
      state: IVaultState,
      action: PayloadAction<IKeyringAccountState>
    ) {
      state.accounts = {
        ...state.accounts,
        [action.payload.id]: action.payload,
      };
    },
    setNetworks(
      state: IVaultState,
      action: PayloadAction<{ prefix: string; value: INetwork }>
    ) {
      const { prefix, value } = action.payload;

      state.networks = {
        ...state.networks,
        [prefix]: value,
      };
    },
    removeNetwork(
      state: IVaultState,
      action: PayloadAction<{ prefix: string; chainId: number }>
    ) {
      const { prefix, chainId } = action.payload;

      delete state.networks[prefix][chainId];
    },
    // todo: remove this
    clearAllTransactions(state: IVaultState) {
      return {
        ...state,
        temporaryTransactionState: {
          executing: false,
          type: '',
        },
      };
    },
    setTemporaryTransactionState(
      state: IVaultState,
      action: PayloadAction<{ executing: boolean; type: string }>
    ) {
      return {
        ...state,
        temporaryTransactionState: {
          executing: action.payload.executing,
          type: action.payload.type,
        },
      };
    },
    setTimer(state: IVaultState, action: PayloadAction<number>) {
      state.timer = action.payload;
    },
    setLastLogin(state: IVaultState) {
      state.lastLogin = Date.now();
    },
    setActiveAccount(
      state: IVaultState,
      action: PayloadAction<IKeyringAccountState>
    ) {
      state.activeAccount = action.payload;
    },
    setActiveNetwork(state: IVaultState, action: PayloadAction<INetwork>) {
      state.activeNetwork = action.payload;
    },
    setIsPendingBalances(state: IVaultState, action: PayloadAction<boolean>) {
      state.isPendingBalances = action.payload;
      state.activeAccount.balances = {
        [INetworkType.Ethereum]: 0,
        [INetworkType.Syscoin]: 0,
      };
      state.activeToken = '';
    },
    setActiveAccountProperty(
      state: IVaultState,
      action: PayloadAction<{
        property: string;
        value: number | string | boolean;
      }>
    ) {
      const { property, value } = action.payload;

      state.activeAccount = {
        ...state.activeAccount,
        [property]: value,
      };
    },
    setActiveToken(state: IVaultState, action: PayloadAction<string>) {
      state.activeToken = action.payload;
    },
    setEncryptedMnemonic(state: IVaultState, action: PayloadAction<string>) {
      state.encryptedMnemonic = action.payload;
    },
    forgetWallet() {
      return initialState;
    },
    removeAccounts(state: IVaultState) {
      state.accounts = {};
      state.activeAccount = initialActiveAccountState;
    },
    removeAccount(state: IVaultState, action: PayloadAction<{ id: number }>) {
      delete state.accounts[action.payload.id];
    },
    setAccountLabel(
      state: IVaultState,
      action: PayloadAction<{ id: number; label: string }>
    ) {
      const { label, id } = action.payload;

      state.accounts[id] = {
        ...state.accounts[id],
        label,
      };
    },
  },
});

export const {
  setActiveAccount,
  setActiveAccountProperty,
  setActiveNetwork,
  setActiveToken,
  setIsPendingBalances,
  setLastLogin,
  setNetworks,
  setTimer,
  setEncryptedMnemonic,
  setTemporaryTransactionState,
  clearAllTransactions,
  forgetWallet,
  removeAccount,
  removeAccounts,
  removeNetwork,
  createAccount,
  setAccountLabel,
  setAccountTransactions,
} = VaultState.actions;

export default VaultState.reducer;
