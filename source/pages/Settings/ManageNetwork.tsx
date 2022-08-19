import React from 'react';
import { useSelector } from 'react-redux';

import { INetwork } from '@pollum-io/sysweb3-utils';

import { IconButton, Layout, SecondaryButton, Icon } from 'components/index';
import { useUtils } from 'hooks/index';
import { RootState } from 'state/store';
import { getController } from 'utils/browser';
import { formatUrl } from 'utils/index';

const ManageNetworkView = () => {
  const networks = useSelector((state: RootState) => state.vault.networks);
  const { navigate } = useUtils();
  const { wallet } = getController();

  const removeNetwork = (chain: string, chainId: number) =>
    wallet.removeKeyringNetwork(chain, chainId);

  return (
    <Layout title="MANAGE NETWORKS">
      <p className="mt-4 text-left text-brand-white font-poppins text-sm">
        Click on network to manage
      </p>

      <ul className="scrollbar-styled mb-3 mt-2 px-4 py-2 w-full h-80 text-sm overflow-auto md:h-96">
        <p className="py-1 text-brand-royalbluemedium text-xs font-bold bg-bkg-1">
          Syscoin Networks
        </p>
        {Object.values(networks.syscoin).map((network: INetwork) => (
          <li
            key={network.chainId}
            className={
              network.default
                ? 'my-3 cursor-not-allowed border-b border-dashed bg-opacity-60 border-dashed-light flex flex-col w-full'
                : 'my-3 w-full border-b border-dashed border-dashed-light cursor-pointer flex flex-col transition-all duration-300'
            }
          >
            <span
              onClick={() =>
                !network.default
                  ? navigate('/settings/networks/custom-rpc', {
                      state: { selected: network, chain: 'syscoin' },
                    })
                  : undefined
              }
              className={`${
                !network.default && 'hover:text-brand-royalblue cursor-pointer'
              }`}
            >
              {formatUrl(network.label, 25)}
            </span>

            <small className="flex items-center justify-between">
              <div className="flex gap-x-3 items-center justify-start">
                <span>Blockbook URL:</span>
                <span>{formatUrl(String(network.url), 30)}</span>
              </div>

              {!network.default && (
                <IconButton
                  onClick={() => removeNetwork('syscoin', network.chainId)}
                  type="primary"
                  shape="circle"
                >
                  <Icon
                    name="trash"
                    className="hover:text-brand-royalblue text-xl"
                  />
                </IconButton>
              )}
            </small>
          </li>
        ))}

        <p className="py-1 text-brand-royalbluemedium text-xs font-bold bg-bkg-1">
          Ethereum Networks
        </p>
        {Object.values(networks.ethereum).map((network: any) => (
          <li
            key={network.chainId}
            className={
              network.default
                ? 'my-3 cursor-not-allowed border-b border-dashed bg-opacity-60 border-dashed-light flex flex-col w-full'
                : 'my-3 w-full border-b border-dashed border-dashed-light cursor-pointer flex flex-col transition-all duration-300'
            }
          >
            <span
              onClick={() =>
                !network.default
                  ? navigate('/settings/networks/custom-rpc', {
                      state: { selected: network, chain: 'ethereum' },
                    })
                  : undefined
              }
              className={`${
                !network.default && 'hover:text-brand-royalblue cursor-pointer'
              }`}
            >
              {formatUrl(network.label, 25)}
            </span>

            <small className="flex items-center justify-between">
              <div className="flex gap-x-3 items-center justify-start">
                <span>RPC URL:</span>
                <span>{formatUrl(String(network.url), 30)}</span>
              </div>

              {!network.default && (
                <IconButton
                  onClick={() => removeNetwork('ethereum', network)}
                  type="primary"
                  shape="circle"
                >
                  <Icon
                    name="trash"
                    className="hover:text-brand-royalblue text-xl"
                  />
                </IconButton>
              )}
            </small>
          </li>
        ))}
      </ul>

      <div className="absolute bottom-12">
        <SecondaryButton type="button" onClick={() => navigate('/home')}>
          Close
        </SecondaryButton>
      </div>
    </Layout>
  );
};

export default ManageNetworkView;
