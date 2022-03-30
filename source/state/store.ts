import {
  combineReducers,
  configureStore,
  getDefaultMiddleware,
  Store,
} from '@reduxjs/toolkit';
import logger from 'redux-logger';
import { persistStore, persistReducer } from 'redux-persist';
import { localStorage } from 'redux-persist-webextension-storage';

import vault from './vault';
import signer, { ISignerState } from './signer';
import price, { IPriceState } from './price';
import { IVaultState } from './vault/types';

const reducers = combineReducers({
  price,
  vault,
  signer,
});

const persistConfig = {
  key: 'root',
  storage: localStorage,
};

const persistedReducer = persistReducer(persistConfig, reducers);

const middleware = [
  ...getDefaultMiddleware({ thunk: false, serializableCheck: false }),
];

const nodeEnv = process.env.NODE_ENV;

if (nodeEnv !== 'production' && nodeEnv !== 'test') {
  middleware.push(logger);
}

const store: Store<{
  price: IPriceState;
  signer: ISignerState;
  vault: IVaultState;
}> = configureStore({
  reducer: persistedReducer,
  middleware,
  devTools: process.env.NODE_ENV !== 'production',
});

persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const currentPriceState = store.getState().price;

export default store;
