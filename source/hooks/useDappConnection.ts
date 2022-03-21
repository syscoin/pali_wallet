import {
  useUtils,
  useStore,
  usePopup,
  useController,
  useBrowser,
} from 'hooks/index';

export const useDappConnection = () => {
  const controller = useController();

  const { alert, navigate } = useUtils();
  const { currentSenderURL } = useStore();
  const { closePopup } = usePopup();
  const { browser } = useBrowser();

  const confirmConnection = async (accountId: number) => {
    try {
      await browser.runtime.sendMessage({
        type: 'SELECT_ACCOUNT',
        target: 'background',
        id: accountId,
      });

      await browser.runtime.sendMessage({
        type: 'CONFIRM_CONNECTION',
        target: 'background',
      });

      navigate('/home');

      window.close();

      return true;
    } catch (error) {
      alert.removeAll();
      alert.error('Sorry, an internal error has occurred.');

      return false;
    }
  };

  const cancelConnection = async (accountId: number) => {
    navigate('/home');

    if (accountId > -1) {
      await browser.runtime.sendMessage({
        type: 'RESET_CONNECTION_INFO',
        target: 'background',
        id: accountId,
        url: currentSenderURL,
      });

      await closePopup();

      return;
    }

    await closePopup();
  };

  const changeConnectedAccount = async (accountId: number) => {
    try {
      await browser.runtime.sendMessage({
        type: 'CHANGE_CONNECTED_ACCOUNT',
        target: 'background',
        id: accountId,
        url: currentSenderURL,
      });

      await closePopup();

      await controller.wallet.account.updateTokensState();
    } catch (error) {
      alert.removeAll();
      alert.error('Error changing account. Try again.');
    }
  };

  return {
    confirmConnection,
    cancelConnection,
    changeConnectedAccount,
  };
};
