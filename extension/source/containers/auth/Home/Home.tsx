import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import CircularProgress from '@material-ui/core/CircularProgress';
import Spinner from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import RefreshIcon from '@material-ui/icons/Refresh';

import Header from 'containers/common/Header';
import Button from 'components/Button';
import FullSelect from 'components/FullSelect';
import Modal from 'components/Modal';
import ModalBlock from 'components/ModalBlock';
import { useController } from 'hooks/index';
import { useFiat } from 'hooks/usePrice';
import { RootState } from 'state/store';
import IWalletState from 'state/wallet/types';
import TxsPanel from './TxsPanel';

import styles from './Home.scss';
import { formatNumber } from '../helpers';
import { getHost } from '../../../scripts/Background/helpers';

const Home = () => {
  const controller = useController();
  const getFiatAmount = useFiat();
  const { accounts, activeAccountId, currentURL, changingNetwork }: IWalletState = useSelector(
    (state: RootState) => state.wallet
  );
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [openBlockExplorer, setOpenBlockExplorer] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [txidSelected, setTxidSelected] = useState('');
  const sysExplorer = controller.wallet.account.getSysExplorerSearch();

  const handleRefresh = () => {
    controller.wallet.account.getLatestUpdate();
    controller.wallet.account.watchMemPool();
    controller.stateUpdater();
  };

  useEffect(() => {
    console.log('home block', openBlockExplorer)
    if (!controller.wallet.isLocked() && accounts.length > 0 && accounts.find(element => element.id === activeAccountId)) {
      handleRefresh();
    }
  }, [
    !controller.wallet.isLocked(),
    accounts.length > 0
  ]);

  useEffect(() => {
    let acc = accounts.find(element => element.id === activeAccountId);

    if (acc && acc.connectedTo !== undefined) {
      if (acc.connectedTo.length > 0) {
        setIsConnected(acc.connectedTo.findIndex((url: any) => {
          return url == getHost(currentURL);
        }) > -1);
        return;
      }

      setIsConnected(false);
    }
  }, [
    accounts,
    activeAccountId,
    currentURL
  ]);
  
  const handleOpenExplorer = (txid: string) => {
    window.open(sysExplorer + '/tx/' + txid);
  };

  const handleSetModalIsOpen = () => {
    setIsOpenModal(!isOpenModal);
  }

  return (
    <div className={styles.wrapper}>
      {isOpenModal && (
        <div className={styles.background} onClick={() => setIsOpenModal(false)}></div>
      )}
      
      {openBlockExplorer && (
        <div className={styles.background} onClick={() => setOpenBlockExplorer(false)}></div>
      )}
      
      {openBlockExplorer && <ModalBlock title="Open block explorer" message="Would you like to go to view transaction in Sys Block Explorer?" setCallback={() => setOpenBlockExplorer(false)} callback={() => handleOpenExplorer(txidSelected)} />}

      {accounts.find(element => element.id === activeAccountId) ? (
        <>
          <Header showLogo />
          <section className={styles.account}>
            {accounts.length > 1 ? (
              <FullSelect
                value={String(activeAccountId)}
                options={accounts}
                onChange={(val: string) => {
                  controller.wallet.switchWallet(Number(val));
                  controller.wallet.account.watchMemPool();
                }}
              />
            ) : (
              accounts.find(element => element.id === activeAccountId)?.label
            )}
          </section>
          <section className={styles.center}>
            {isConnected
              ? <small className={styles.connected} onClick={() => setIsOpenModal(!isOpenModal)}>Connected</small>
              : <small className={styles.notConnected} onClick={() => setIsOpenModal(!isOpenModal)}>Not connected</small>
            }

            {isOpenModal && isConnected && (
              <Modal title={currentURL} connected callback={handleSetModalIsOpen} />
            )}

            {isOpenModal && (!isConnected) && (
              <Modal title={currentURL} message="This account is not connected to this site. To connect to a sys plataform site, find the connect button on their site." callback={handleSetModalIsOpen} />
            )}

            {changingNetwork ? (
              <Spinner size={25} className={styles.spinner} />
            ) : (
              <h3>
                {formatNumber(accounts.find(element => element.id === activeAccountId)?.balance || 0)}{' '}
                <small>SYS</small>
              </h3>
            )}

            {changingNetwork ? (
              <p style={{ color: 'white' }}>...</p>
            ) : (
              <small>{getFiatAmount(accounts.find(element => element.id === activeAccountId)?.balance || 0)}</small>
            )}

            <IconButton className={styles.refresh} onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
            <div className={styles.actions}>
              <Button
                type="button"
                theme="btn-outline-secondary"
                variant={styles.button}
                linkTo="/send"
              >
                Send
              </Button>
              <Button
                type="button"
                theme="btn-outline-primary"
                variant={styles.button}
                linkTo="/receive"
              >
                Receive
              </Button>
            </div>
          </section>
          <TxsPanel
            txidSelected={txidSelected}
            setTxidSelected={setTxidSelected}
            openBlockExplorer={openBlockExplorer}
            setOpenBlockExplorer={setOpenBlockExplorer}
            address={accounts.find(element => element.id === activeAccountId)?.address.main || 'no addr'}
            transactions={accounts.find(element => element.id === activeAccountId)?.transactions || []}
            assets={accounts.find(element => element.id === activeAccountId)?.assets || []}
          />
        </>
      ) : (
        <section
          className={clsx(styles.mask, {
            [styles.hide]: accounts.find(element => element.id === activeAccountId),
          })}
        >
          <CircularProgress className={styles.loader} />
        </section>
      )}
    </div>
  );
};

export default Home;
