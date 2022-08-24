import { Form, Input } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  Layout,
  PrimaryButton,
  SecondaryButton,
  Tooltip,
  Icon,
} from 'components/index';
import { RootState } from 'state/store';
import { getController } from 'utils/browser';

interface IFee {
  onFinish: (fee: number) => any;
  title: string;
}

const Fee: React.FC<IFee> = ({ title, onFinish }) => {
  const { getRecommendedFee } = getController().wallet.account.sys.tx;

  const activeNetwork = useSelector(
    (state: RootState) => state.vault.activeNetwork
  );

  const [form] = Form.useForm();

  const [fee, setFee] = useState(0.00001);

  const updateFee = async () => {
    const _fee = await getRecommendedFee(activeNetwork.url);
    form.setFieldsValue({ fee: _fee });
    setFee(_fee);
  };

  useEffect(() => {
    updateFee();
  }, []);

  const disabledFee =
    activeNetwork.chainId === 57 || activeNetwork.chainId === 5700;

  return (
    <Layout canGoBack={false} title={title.toUpperCase()}>
      <div className="flex flex-col items-center justify-center">
        <h1 className="mt-4 text-sm">FEE</h1>

        <Form
          validateMessages={{ default: '' }}
          form={form}
          id="site"
          labelCol={{ span: 8 }}
          initialValues={{ fee: fee }}
          wrapperCol={{ span: 8 }}
          onFinish={(data) => onFinish(data.fee)}
          autoComplete="off"
          className="standard flex flex-col gap-3 items-center justify-center mt-4 text-center"
        >
          <div className="flex gap-x-0.5 items-center justify-center mx-2">
            <Form.Item
              name="recommend"
              className={`${
                disabledFee && 'opacity-50 cursor-not-allowed'
              } bg-fields-input-primary border border-fields-input-border focus:border-fields-input-borderfocus w-16 py-1.5 rounded-l-full text-center`}
              rules={[
                {
                  required: false,
                  message: '',
                },
              ]}
            >
              <Tooltip
                content={`${
                  disabledFee
                    ? 'Use recommended fee. Disabled for SYS networks because the fee used in transactions is always the recommended for current SYS network conditions.'
                    : 'Click to use the recommended fee'
                }`}
              >
                <div onClick={updateFee}>
                  <Icon
                    wrapperClassname="w-6 ml-5 mb-1"
                    name="verified"
                    className={`${
                      disabledFee
                        ? 'cursor-not-allowed text-button-disabled'
                        : 'text-warning-success'
                    }`}
                  />
                </div>
              </Tooltip>
            </Form.Item>

            <Form.Item
              name="fee"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: '',
                },
              ]}
            >
              <Tooltip content={disabledFee ? 'Fee network' : ''}>
                <Input
                  disabled={disabledFee}
                  className={`${
                    disabledFee &&
                    'opacity-50 cursor-not-allowed text-button-disabled'
                  } border border-fields-input-border bg-fields-input-primary rounded-r-full w-full md:max-w-2xl outline-none py-3 pr-24 pl-4 text-sm`}
                  type="number"
                  placeholder="Fee network"
                  value={fee}
                />
              </Tooltip>
            </Form.Item>
          </div>

          <p className="mt-4 mx-6 p-4 max-w-xs text-left text-xs bg-transparent border border-dashed border-gray-600 rounded-lg md:max-w-2xl">
            With current network conditions, we recommend a fee of {fee} SYS.
          </p>

          <div className="absolute bottom-10 flex gap-3 items-center justify-between w-full max-w-xs md:max-w-2xl">
            <SecondaryButton type="button" action onClick={window.close}>
              Cancel
            </SecondaryButton>

            <PrimaryButton action type="submit">
              Next
            </PrimaryButton>
          </div>
        </Form>
      </div>
    </Layout>
  );
};

export default Fee;