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
  lastLogin: 0, //
  accounts: {},
  activeAccount: initialActiveAccountState,
  activeNetwork: {
    chainId: 57,
    url: 'https://blockbook.elint.services/',
    label: 'Syscoin Mainnet',
    default: true,
  },
  isPendingBalances: false,
  timer: 5, //
  networks: initialNetworksState,
  trustedApps,
  activeToken: 'SYS',
  temporaryTransactionState: { executing: false, type: '' }, // todo: remove temporary tx state from sysweb3
  hasEncryptedVault: false,
  encryptedMnemonic: '',
  getState: () => initialState,
  version: '2.0.0', // todo: remove version from sysweb3
};

const VaultState = createSlice({
  name: 'vault',
  initialState,
  reducers: {
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
    setNetworks(
      state: IVaultState,
      action: PayloadAction<{
        type: INetworkType.Ethereum | INetworkType.Syscoin;
        value: INetwork;
      }>
    ) {
      const { type, value } = action.payload;

      state.networks = {
        ...state.networks,
        [type]: value,
      };
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
} = VaultState.actions;

export default VaultState.reducer;
