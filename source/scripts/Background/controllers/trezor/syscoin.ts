import {
  IKeyringAccountState,
  KeyringManager,
} from '@pollum-io/sysweb3-keyring';

export interface ISysTrezorController {
  createAccount: () => Promise<IKeyringAccountState>;
}
//TODO: validate unit testing for trezor on pali after fix on sysweb3
const SysTrezorController = (): ISysTrezorController => {
  const { trezor } = KeyringManager();

  const createAccount = async () => await trezor.createHardwareWallet();

  return {
    createAccount,
  };
};

export default SysTrezorController;
