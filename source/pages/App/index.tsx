import 'assets/styles/index.css';
import 'assets/fonts/index.css';
import React from 'react';
import { transitions, positions, Provider as AlertProvider } from 'react-alert';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import watch from 'redux-watch';

import { ToastAlert } from 'components/index';
import { STORE_PORT } from 'constants/index';
import appStore from 'state/store';
import { log } from 'utils/index';

import App from './App';
import { PaliStore } from './utils';

const app = document.getElementById('app-root');
const isFullscreen = window.innerWidth > 600;
const portName = isFullscreen ? 'pali-fullscreen' : STORE_PORT;
const paliStore = new PaliStore(portName);
const w = watch(appStore.getState, 'vault.lastLogin');
paliStore.subscribe(
  w(() => {
    log('watching webext store');
  })
);

const options = {
  position: positions.BOTTOM_CENTER,
  timeout: 2 * 1000,
  offset: '30px',
  transition: transitions.FADE,
};

paliStore.ready().then(() => {
  ReactDOM.render(
    <Provider store={paliStore}>
      <AlertProvider template={ToastAlert} {...options}>
        <App />
      </AlertProvider>
    </Provider>,
    app
  );
});
