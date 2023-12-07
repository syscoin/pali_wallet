import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { INftsStructure } from '@pollum-io/sysweb3-utils';

import dafaultImage from 'assets/images/pali-blank.png';
import { useUtils } from 'hooks/index';
import { RootState } from 'state/store';
import { getController } from 'utils/browser';

import { getChainImage } from './GetChainImage';

export const EvmNftsList = () => {
  const videoFormats = ['.mp4', '.webm', '.avi', '.ogg'];

  const controller = getController();
  const { navigate } = useUtils();
  const { accounts, activeAccount, activeNetwork } = useSelector(
    (state: RootState) => state.vault
  );

  const [nftsGrouped, setNftsGrouped] = useState<Record<string, Array<any>>>(
    {}
  );

  const userAccount = accounts[activeAccount.type][activeAccount.id];

  const userNftsFromCurrentChain = userAccount.assets.nfts.filter(
    (nft) => Number(nft.chainId) === activeNetwork.chainId
  );

  const getUserNfts = async () => {
    try {
      await controller.wallet.fetchAndUpdateNftsState({
        activeAccount,
        activeNetwork,
      });

      const groupSameCollection = (data: INftsStructure[]) => {
        const groups = {};

        data.forEach((item) => {
          const name = item.address;

          if (!groups[name]) {
            groups[name] = [];
          }

          groups[name].push(item);
        });

        return groups;
      };

      const grouped = groupSameCollection(userNftsFromCurrentChain);
      setNftsGrouped(grouped);
    } catch (error) {
      console.error('Erro ao obter NFTs:', error);
    }
  };

  const handleNavigateToNftDetail = (tokenId, address) => {
    navigate('/home/details', {
      state: {
        nftId: tokenId,
        nftAddress: address,
      },
    });
  };

  const getCollectionImage = (imageUrl?: string): string => {
    if (imageUrl) {
      return imageUrl;
    } else {
      return dafaultImage;
    }
  };

  useEffect(() => {
    getUserNfts();
  }, [userAccount.address, activeNetwork.chainId]);

  return (
    <div className="flex flex-col gap-6 mt-6">
      {userNftsFromCurrentChain &&
        Object.entries(nftsGrouped).map(([collections, nfts]) => (
          <div
            key={collections}
            className="w-full flex flex-col gap-2 items-start"
          >
            <div
              id="nft-collection-name"
              className="flex items-center gap-[22px]"
            >
              {nfts.length > 0 && (
                <div className="relative">
                  <img
                    className="w-[35px] h-[35px] rounded-[100px]"
                    src={nfts[0]?.collection?.image_url}
                  />
                  <img
                    className="absolute top-[18px] left-[24px] w-[17.246px] h-[17.246px] rounded-[100px]"
                    src={getChainImage(nfts[0]?.chainId)}
                  />
                </div>
              )}
              <div className="text-sm font-medium text-white">
                {nfts[0]?.collection?.name}
              </div>
            </div>

            <div className="flex gap-2 items-start flex-wrap">
              {nfts.map((data, index) => (
                <div key={index} className="rounded-[10px] overflow-hidden">
                  {videoFormats.some((format) =>
                    data.image_preview_url.endsWith(format)
                  ) ? (
                    <video
                      className="max-w-none w-[153px] h-[153px] hover:cursor-pointer"
                      autoPlay
                      muted
                      loop
                      onClick={() =>
                        handleNavigateToNftDetail(data.token_id, data.address)
                      }
                    >
                      <source src={data.image_preview_url} type="video/mp4" />
                      Video not supported
                    </video>
                  ) : (
                    <img
                      id="nft-image"
                      className="rounded-[10px] w-[153px] h-[153px] cursor-pointer"
                      onClick={() =>
                        handleNavigateToNftDetail(data.token_id, data.address)
                      }
                      src={getCollectionImage(data?.image_preview_url)}
                    />
                  )}
                </div>
              ))}
            </div>
            <div id="nft-by" className="overflow-hidden max-w-[100px]">
              <p className="text-brand-gray200 text-xs overflow-hidden whitespace-nowrap">
                Post by @{nfts[0]?.creator?.user?.username}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
};
