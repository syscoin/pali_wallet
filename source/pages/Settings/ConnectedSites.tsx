import { Dialog, Transition } from '@headlessui/react';
import _ from 'lodash';
import React, { Fragment, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Layout, Icon, IconButton, SecondaryButton } from 'components/index';
import { useUtils } from 'hooks/index';
import { IDApp } from 'state/dapp/types';
import { RootState } from 'state/store';
import { getController } from 'utils/browser';
import { formatUrl, ellipsis } from 'utils/index';
import { networkChain } from 'utils/network';

const ConnectedSites = () => {
  const { dapp } = getController();
  const { navigate } = useUtils();

  const activeAccount = useSelector(
    (state: RootState) => state.vault.activeAccount
  );
  const activeNetwork = useSelector(
    (state: RootState) => state.vault.activeNetwork
  );

  const [selected, setSelected] = useState<IDApp>();
  const [connectedDapps, setConnectedDapps] = useState<IDApp[]>([]);

  const disconnectSelected = () => {
    dapp.disconnect(selected.host);

    setSelected(undefined);

    const _connectedDapps = connectedDapps.filter(
      (_dapp) => _dapp.host !== selected.host
    );
    setConnectedDapps(_connectedDapps);
  };

  useEffect(() => {
    const dapps = Object.values(dapp.getAll());
    const _activeNetworkChain = networkChain(activeNetwork);
    const _connectedDapps = dapps.filter((_dapp) => {
      const sameChain = _dapp.chain === _activeNetworkChain;
      const sameAccount = _dapp.accountId === activeAccount.id;
      return sameChain && sameAccount;
    });

    setConnectedDapps(_connectedDapps);
  }, []);

  return (
    <Layout title="CONNECTED SITES">
      <p className="m-4 max-w-xs text-white text-xs md:max-w-md">
        {`${activeAccount?.label} is not connected to any sites. To connect to a SYS platform site, find the connect button on their site.`}
      </p>

      <div className="flex flex-col items-center justify-center w-full">
        {connectedDapps.map((_dapp) => (
          <ul
            key={_dapp.host}
            className="scrollbar-styled px-4 py-2 w-full h-80 overflow-auto"
          >
            <li className="flex items-center justify-between my-2 py-3 w-full text-xs border-b border-dashed border-gray-500">
              <p>{formatUrl(_dapp.host, 25)}</p>
              <IconButton onClick={() => setSelected(_dapp)}>
                <Icon name="edit" wrapperClassname="w-4" />
              </IconButton>
            </li>
          </ul>
        ))}

        {selected && (
          <Transition appear show={selected !== undefined} as={Fragment}>
            <Dialog
              as="div"
              className="fixed z-10 inset-0 text-center overflow-y-auto"
              onClose={() => setSelected(undefined)}
            >
              <div className="fixed z-0 -inset-0 w-full bg-brand-black bg-opacity-50 transition-all duration-300 ease-in-out" />

              <div className="px-4 min-h-screen">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Dialog.Overlay className="fixed inset-0" />
                </Transition.Child>

                <span
                  className="inline-block align-middle h-screen"
                  aria-hidden="true"
                >
                  &#8203;
                </span>
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <div className="inline-block align-middle my-8 py-6 w-full max-w-2xl text-left font-poppins bg-bkg-2 rounded-2xl shadow-xl overflow-hidden transform transition-all">
                    <Dialog.Title
                      as="h3"
                      className="pb-3 text-center text-brand-white text-lg font-medium leading-6 border-b border-dashed border-brand-white"
                    >
                      Edit connection
                    </Dialog.Title>
                    <div className="my-4">
                      <p className="m-3 text-brand-white text-sm">
                        Delete connected site:
                      </p>

                      <div className="flex items-center justify-between m-3 text-brand-white">
                        <p>{formatUrl(selected.host, 20)}</p>

                        <IconButton onClick={disconnectSelected}>
                          <Icon name="delete" />
                        </IconButton>
                      </div>

                      <div className="p-4 bg-bkg-1">
                        <p className="mb-3 text-brand-white">Permissions</p>

                        <div className="flex items-center justify-between">
                          <p className="text-brand-white text-xs">
                            {activeAccount?.label}
                          </p>

                          <p className="text-brand-white text-xs">
                            {ellipsis(activeAccount?.address)}
                          </p>
                        </div>

                        <p className="mt-4 pt-3 text-brand-white border-t border-dashed border-brand-white opacity-60 cursor-not-allowed">
                          <input type="checkbox" />

                          <span className="mb-1 ml-3">
                            View the addresses of your permitted accounts
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        className="transparent inline-flex justify-center px-12 py-2 hover:text-bkg-4 text-brand-white text-sm font-medium hover:bg-white bg-repeat border border-white rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-royalblue focus-visible:ring-offset-2"
                        onClick={() => setSelected(undefined)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition>
        )}

        <div className="absolute bottom-12 md:static">
          <SecondaryButton type="button" onClick={() => navigate('/home')}>
            Close
          </SecondaryButton>
        </div>
      </div>
    </Layout>
  );
};

export default ConnectedSites;
