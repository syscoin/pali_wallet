import reducer, {
  addDApp,
  removeDApp,
  updateDAppAccount,
  initialState,
} from '.';
import { IDApp } from './types';

/*  ----- Tests ----- */

describe('dapp store actions', () => {
  const FAKE_DAPP: IDApp = {
    host: 'fakehost.net',
    chain: 'syscoin',
    chainId: 57,
    accountId: 0,
  };

  //* addDApp
  it('should add a dapp', () => {
    const newState = reducer(initialState, addDApp(FAKE_DAPP));

    expect(newState.dapps[FAKE_DAPP.host]).toEqual(FAKE_DAPP);
  });

  //* removeDApp
  it('should remove a dapp', () => {
    const customState = reducer(initialState, addDApp(FAKE_DAPP));
    const newState = reducer(customState, removeDApp(FAKE_DAPP.host));

    expect(newState.dapps).toEqual(initialState.dapps);
  });

  //* updateDAppAccount
  it('should remove a dapp', () => {
    const payload = { host: FAKE_DAPP.host, accountId: 1 };

    const customState = reducer(initialState, addDApp(FAKE_DAPP));
    const newState = reducer(customState, updateDAppAccount(payload));

    const dapp = newState.dapps[FAKE_DAPP.host];
    expect(dapp.accountId).toEqual(payload.accountId);
  });
});
