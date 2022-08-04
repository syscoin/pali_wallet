import React, { Fragment, useEffect } from 'react';

import { Icon } from 'components/Icon';
import { IconButton } from 'components/IconButton';
import { useStore, useUtils } from 'hooks/index';
import { camelCaseToText, formatUrl } from 'utils/index';

import { NftImage } from './NftImage';

export const EvmAssetDetais = ({ id }: { id: string }) => {
  const {
    activeAccount: { assets },
  } = useStore();
  const { useCopyClipboard, alert } = useUtils();

  const [copied, copy] = useCopyClipboard();

  useEffect(() => {
    if (!copied) return;

    alert.removeAll();
    alert.success('Contract successfully copied');
  }, [copied]);

  const formattedAsset = [];

  assets.find((asset: any) => {
    if (asset.id !== id) return null;

    for (const [key, value] of Object.entries(asset)) {
      const formattedKey = camelCaseToText(key);
      const formattedBoolean = Boolean(value) ? 'Yes' : 'No';

      const formattedValue = {
        value: typeof value === 'boolean' ? formattedBoolean : value,
        label: formattedKey,
        canCopy: false,
        isNft: false,
      };

      if (key === 'isNft') {
        formattedValue.isNft = Boolean(value);
      }

      if (String(value).length >= 20 && key !== 'image') {
        formattedValue.value = formatUrl(String(value), 20);
        formattedValue.canCopy = true;
      }

      const isValid = typeof value !== 'object';

      if (isValid) formattedAsset.push(formattedValue);
    }

    return formattedAsset;
  });

  const RenderAsset = () => (
    <>
      {formattedAsset.map(({ label, isNft, value, canCopy }: any) => (
        <Fragment key={id}>
          {label === 'Image' && isNft && <NftImage imageLink={value} />}

          {label && value && label !== 'Image' && (
            <li className="flex items-center justify-between my-1 px-6 py-2 w-full text-xs border-b border-dashed border-bkg-2 cursor-default transition-all duration-300">
              <p>{label}</p>
              <b>
                {value}

                {canCopy && (
                  <IconButton
                    onClick={() => copy(value ?? '')}
                    type="primary"
                    shape="circle"
                    className="mt-1"
                  >
                    <Icon
                      name="copy"
                      className="text-xs"
                      id="copy-address-btn"
                    />
                  </IconButton>
                )}
              </b>
            </li>
          )}
        </Fragment>
      ))}
    </>
  );

  return <RenderAsset />;
};