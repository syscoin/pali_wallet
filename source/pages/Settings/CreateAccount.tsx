import { Form, Input } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Layout, DefaultModal, NeutralButton } from 'components/index';
import { getController } from 'scripts/Background';
import { RootState } from 'state/store';
import { ellipsis } from 'utils/index';

const CreateAccount = () => {
  const [address, setAddress] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const { isBitcoinBased, activeNetwork } = useSelector(
    (state: RootState) => state.vault
  );
  const { t } = useTranslation();
  const controller = getController();
  const navigate = useNavigate();

  const onSubmit = async ({ label }: { label?: string }) => {
    setLoading(true);

    const { address: newAddress } = await controller.wallet.createAccount(
      isBitcoinBased,
      activeNetwork.chainId,
      label
    );

    setAddress(newAddress);
    setLoading(false);
  };

  return (
    <Layout title={t('settings.createAccount')} id="create-account-title">
      {address ? (
        <DefaultModal
          show={address !== ''}
          onClose={() => {
            setAddress('');
            navigate('/home');
          }}
          title={t('settings.yourNewAccount')}
          description={`${ellipsis(address)}`}
        />
      ) : (
        <Form
          validateMessages={{ default: '' }}
          className="flex flex-col gap-8 items-center justify-center text-center md:w-full"
          name="newaccount"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          autoComplete="off"
          onFinish={onSubmit}
        >
          <Form.Item
            name="label"
            className="md:w-full"
            hasFeedback
            rules={[
              {
                required: false,
                message: '',
              },
            ]}
          >
            <Input
              type="text"
              className="input-small relative"
              placeholder={`${t('settings.nameYourNewAccount')} (${t(
                'settings.optional'
              )})`}
              id="account-name-input"
            />
          </Form.Item>

          <div className="absolute bottom-12 md:static">
            <NeutralButton
              type="submit"
              loading={loading}
              disabled={loading}
              id="create-btn"
            >
              {t('buttons.create')}
            </NeutralButton>
          </div>
        </Form>
      )}
    </Layout>
  );
};

export default CreateAccount;
