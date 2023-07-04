import { Form, Input } from 'antd';
import * as React from 'react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import {
  isValidEthereumAddress,
  getTokenStandardMetadata,
} from '@pollum-io/sysweb3-utils';

import { Card, DefaultModal, NeutralButton } from 'components/index';
import { useUtils } from 'hooks/index';
import { RootState } from 'state/store';
import { IAddCustomTokenMetadataInfos } from 'types/tokens';
import { getController } from 'utils/browser';

import { CustomTokenErrorModal } from './CustomTokenErrorModal';

export const CustomToken = () => {
  const controller = getController();

  const [form] = Form.useForm();
  const { navigate } = useUtils();

  const [added, setAdded] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ercError, setErcError] = useState({
    errorType: '',
    message: '',
  });
  const [tokenMetadataInfos, setTokenMetadataInfos] =
    useState<IAddCustomTokenMetadataInfos | null>(null);
  const [tokenDecimalsWarning, setTokenDecimalsWarning] = useState({
    error: false,
    value: '',
  });
  const [tokenSymbolWarning, setTokenSymbolWarning] = useState({
    error: false,
    value: '',
  });

  const { accounts, activeAccount: activeAccountMeta } = useSelector(
    (state: RootState) => state.vault
  );
  const activeAccount = accounts[activeAccountMeta.type][activeAccountMeta.id];

  const handleSubmit = async ({
    contractAddress,
    symbol,
    decimals,
  }: {
    contractAddress: string;
    decimals: number;
    symbol: string;
  }) => {
    setIsLoading(true);

    try {
      const addTokenMethodResponse =
        await controller.wallet.assets.evm.addCustomTokenByType(
          activeAccount.address,
          contractAddress,
          symbol,
          decimals,
          controller.wallet.ethereumTransaction.web3Provider
        );

      if (addTokenMethodResponse.error) {
        setIsLoading(false);
        setErcError({
          errorType: addTokenMethodResponse.errorType,
          message: addTokenMethodResponse.message,
        });

        return;
      }

      await controller.wallet.account.eth.saveTokenInfo(
        addTokenMethodResponse.tokenToAdd
      );

      setAdded(true);
    } catch (error) {
      setErcError({
        errorType: 'Undefined',
        message: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetErcErrorState = () => {
    setErcError({
      errorType: '',
      message: '',
    });
  };

  const resetAddTokenErrorsAndValues = () => {
    form.setFieldsValue({
      symbol: '',
      decimals: '',
    });

    setTokenMetadataInfos({
      symbol: '',
      decimals: '',
    });

    if (tokenDecimalsWarning.error) {
      setTokenDecimalsWarning({
        error: false,
        value: '',
      });
    }

    if (tokenSymbolWarning.error) {
      setTokenSymbolWarning({
        error: false,
        value: '',
      });
    }
  };

  return (
    <>
      <Form
        validateMessages={{ default: '' }}
        form={form}
        id="token-form"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 8 }}
        onFinish={handleSubmit}
        autoComplete="off"
        className="flex flex-col gap-3 items-center justify-center mt-4 text-center md:w-full"
      >
        <Form.Item
          name="contractAddress"
          className="md:w-full md:max-w-md"
          hasFeedback
          rules={[
            {
              required: true,
              message: 'Please, type token contract address!',
            },
            () => ({
              async validator(_, value) {
                if (value && isValidEthereumAddress(value)) {
                  const { decimals, tokenSymbol } =
                    await getTokenStandardMetadata(
                      value,
                      activeAccount.address,
                      controller.wallet.ethereumTransaction.web3Provider
                    );

                  if (decimals && tokenSymbol) {
                    form.setFieldsValue({
                      symbol: tokenSymbol,
                      decimals: decimals,
                    });

                    setTokenMetadataInfos({
                      symbol: tokenSymbol,
                      decimals: decimals,
                    });
                  }

                  return Promise.resolve();
                } else {
                  resetAddTokenErrorsAndValues();

                  return Promise.reject();
                }
              },
            }),
          ]}
        >
          <Input
            type="text"
            className="input-small relative"
            placeholder="Contract address"
          />
        </Form.Item>

        <Form.Item
          name="symbol"
          className="md:w-full md:max-w-md"
          hasFeedback
          rules={[
            {
              required: true,
              message: 'Please, type token symbol!',
            },
            () => ({
              async validator(_, value) {
                if (!value) {
                  return Promise.reject();
                }

                if (
                  value &&
                  tokenMetadataInfos.symbol &&
                  value.toUpperCase() !==
                    tokenMetadataInfos.symbol.toUpperCase()
                ) {
                  setTokenSymbolWarning({
                    error: true,
                    value: value,
                  });
                } else {
                  setTokenSymbolWarning({
                    error: false,
                    value: '',
                  });
                }

                return Promise.resolve();
              },
            }),
          ]}
        >
          <Input
            type="text"
            className="input-small relative"
            placeholder="Token symbol"
          />
        </Form.Item>

        <Form.Item
          name="decimals"
          className="md:w-full md:max-w-md"
          hasFeedback
          rules={[
            {
              required: true,
              message: 'Please, type token decimals!',
            },
            () => ({
              async validator(_, value) {
                if (!value) {
                  return Promise.reject();
                }

                if (
                  value &&
                  tokenMetadataInfos.decimals &&
                  Number(value) !== tokenMetadataInfos.decimals
                ) {
                  setTokenDecimalsWarning({
                    error: true,
                    value: value,
                  });
                } else {
                  setTokenDecimalsWarning({
                    error: false,
                    value: '',
                  });
                }

                return Promise.resolve();
              },
            }),
          ]}
        >
          <Input
            type="number"
            className="input-small relative"
            placeholder="Token decimal"
          />
        </Form.Item>

        {tokenDecimalsWarning.error || tokenSymbolWarning.error ? (
          <div className="flex flex-col items-center justify-center w-full md:max-w-full">
            <Card type="info" className="border-alert-darkwarning">
              <div>
                <div className="text-xs text-alert-darkwarning font-bold mb-2.5">
                  <p>
                    You are trying to insert data different from the original
                    ones, do you want to continue?
                  </p>
                </div>

                <div className="flex flex-col gap-y-2.5">
                  {tokenSymbolWarning.error ? (
                    <div className="flex flex-col">
                      <p className="text-xs text-alert-darkwarning font-bold mb-1">
                        Token Symbol:{' '}
                      </p>
                      <span className="text-xs">
                        Original value: {tokenMetadataInfos.symbol}
                      </span>
                      <span className="text-xs">
                        Form value: {tokenSymbolWarning.value}
                      </span>
                    </div>
                  ) : null}

                  {tokenDecimalsWarning.error ? (
                    <div className="flex flex-col">
                      <p className="text-xs text-alert-darkwarning font-bold mb-1">
                        Token Decimals:
                      </p>
                      <span className="text-xs">
                        Original value: {tokenMetadataInfos.decimals}
                      </span>
                      <span className="text-xs">
                        Form value: {tokenDecimalsWarning.value}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        <div className="flex flex-col items-center justify-center w-full">
          <div
            className={`${
              tokenDecimalsWarning.error && tokenSymbolWarning.error
                ? 'bottom-6'
                : 'bottom-12'
            } absolute md:static`}
          >
            <NeutralButton
              type="submit"
              disabled={isLoading}
              loading={isLoading}
            >
              Next
            </NeutralButton>
          </div>
        </div>
      </Form>

      {added && (
        <DefaultModal
          show={added}
          title="Token successfully added"
          description={`${form.getFieldValue(
            'symbol'
          )} was successfully added to your wallet.`}
          onClose={() => navigate('/home')}
        />
      )}

      {ercError.errorType !== '' ? (
        <CustomTokenErrorModal
          errorType={ercError.errorType}
          message={ercError.message}
          resetErcErrorState={resetErcErrorState}
        />
      ) : null}
    </>
  );
};
