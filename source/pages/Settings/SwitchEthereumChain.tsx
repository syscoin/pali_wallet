import { ethErrors } from 'helpers/errors';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import arrowRight from 'assets/images/arrowRight.svg';
import ethChainImg from 'assets/images/ethChain.svg';
import sysChainImg from 'assets/images/sysChain.svg';
import { SecondButton } from 'components/Button/Button';
import { Layout, PrimaryButton, LoadingComponent } from 'components/index';
import { useQueryData } from 'hooks/index';
import { RootState } from 'state/store';
import { dispatchBackgroundEvent, getController } from 'utils/browser';
import cleanErrorStack from 'utils/cleanErrorStack';

const SwitchChain: React.FC = () => {
  const { host, ...data } = useQueryData();
  const { chainId } = data;
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const activeNetwork = useSelector(
    (state: RootState) => state.vault.activeNetwork
  );
  const networks = useSelector((state: RootState) => state.vault.networks);
  const network = networks.ethereum[chainId];
  const { wallet } = getController();

  const onSubmit = async () => {
    setLoading(true);
    try {
      await wallet.setActiveNetwork(network, 'ethereum');
    } catch (networkError) {
      throw cleanErrorStack(ethErrors.rpc.internal());
    }
    setConfirmed(true);
    setLoading(false);
    const type = data.eventName;
    dispatchBackgroundEvent(`${type}.${host}`, null);
    window.close();
  };

  const CurrentChains = () => {
    let fromChain: any;
    let toChain: any;
    switch (activeNetwork.chainId) {
      case 1:
        fromChain = <img src={ethChainImg} alt="eth" width="100px" />;
        break;
      case 57:
        fromChain = <img src={sysChainImg} alt="sys" width="100px" />;
        break;
      default:
        fromChain = (
          <div
            className="rounded-full flex items-center justify-center text-white text-sm bg-brand-blue200 p-5"
            style={{ width: '100px', height: '100px' }}
          >
            {activeNetwork.label}
          </div>
        );
    }

    switch (network.chainId) {
      case 1:
        toChain = <img src={ethChainImg} alt="eth" width="100px" />;
        break;
      case 57:
        toChain = <img src={sysChainImg} alt="sys" width="100px" />;
        break;
      default:
        toChain = (
          <div
            className="rounded-full flex items-center justify-center text-brand-blue200 bg-white text-sm"
            style={{ width: '100px', height: '100px' }}
          >
            {network.label}
          </div>
        );
    }

    return (
      <div className="w-4/5 gap-4 flex items-center align-center flex-row">
        {fromChain} <img src={arrowRight} alt="arrow" width="50px" /> {toChain}
      </div>
    );
  };
  return (
    <Layout canGoBack={false} title={'SWITCH CHAIN'}>
      {!loading && (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="relative top-15 flex flex-col pb-4 pt-4 w-full gap-4">
            <h2 className="text-center text-base">
              Allow {host} to switch the network ?
            </h2>
            <div className="mt-1 px-4 w-full text-center text-sm">
              <span className="disabled">
                This will switch the selected network within Pali to a
                previously added network
              </span>
            </div>
            <div className="flex flex-col pb-4 pt-4 w-full text-center items-center">
              <CurrentChains />
            </div>
          </div>

          <div className="absolute bottom-14 flex items-center justify-between px-10 w-full md:max-w-2xl">
            <SecondButton type="button" onClick={window.close} action={true}>
              Reject
            </SecondButton>

            <PrimaryButton
              type="submit"
              disabled={confirmed}
              loading={loading}
              onClick={onSubmit}
              action={true}
            >
              Confirm
            </PrimaryButton>
          </div>
        </div>
      )}
      {loading && (
        <div className="relative top-40 flex items-center justify-center w-full">
          <LoadingComponent />
        </div>
      )}
    </Layout>
  );
};

export default SwitchChain;
