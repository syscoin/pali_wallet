/* eslint-disable camelcase */

import { saveState, setMigratedVersions } from 'state/paliStorage';
import { initialState as initialVaultState } from 'state/vault';
import { IVaultState } from 'state/vault/types';

type V3_0_1 = {
  vault: IVaultState;
};

const MigrateRunner = async (oldState: any) => {
  try {
    const newState: V3_0_1 = {
      ...oldState,
      vault: {
        ...oldState.vault,
        shouldShowFaucetModal: initialVaultState.shouldShowFaucetModal,
      },
    };

    await Promise.all([saveState(newState), setMigratedVersions('3.0.1')]);

    console.log('Migrate to <v3.0.1> successfully!');
  } catch (error) {
    console.log('<v3.0.1> Migration Error');
    console.log(error);
  }
};

export default MigrateRunner;
