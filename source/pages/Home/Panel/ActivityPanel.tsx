import { Fullscreen } from 'components/Fullscreen';
import React, { FC } from 'react';

import { PanelList } from './components/PanelList';
import { useStore } from 'hooks/useStore';

export const ActivityPanel: FC = () => {
  const { activeAccount } = useStore();

  return (
    <>
      <div className="p-4 w-full h-full text-white text-base bg-bkg-3">
        {activeAccount?.transactions && activeAccount.transactions ? (
          <PanelList data={[]} activity assets={false} />
        ) : (
          <p className="flex items-center justify-center text-brand-white text-sm">
            You have no transaction history.
          </p>
        )}
      </div>

      <Fullscreen />
    </>
  );
};
