import store from 'state/store';
import { bech32 } from 'bech32';
import TrezorConnect from 'trezor-connect';
import {
  createAccount,
  updateStatus,
  removeAccount,
  updateAccount,
  updateLabel,
  updateTransactions,
  updateAccountAddress,
  updateAccountXpub
} from 'state/wallet';
import IWalletState, {
  IAccountState
} from 'state/wallet/types';
import {
  IAccountInfo,
  ITransactionInfo,
  Transaction,
  Assets,
  ISPTInfo,
  ISPTIssue,
  INFTIssue,
  MintedToken,
} from '../../types';
import { sys } from 'constants/index';
import { fromZPub } from 'bip84';

export interface IAccountController {
  subscribeAccount: (isHardwareWallet: boolean, sjs?: any, label?: string, walletCreation?: boolean) => Promise<string | null>;
  getPrimaryAccount: (pwd: string, sjs: any) => void;
  unsubscribeAccount: (index: number, pwd: string) => boolean;
  updateAccountLabel: (id: number, label: string) => void;
  addNewAccount: (label: string) => Promise<string | null>;
  watchMemPool: () => void;
  getLatestUpdate: () => void;
  isNFT: (guid: number) => boolean;
  isValidSYSAddress: (address: string, network: string) => boolean | undefined;
  getRecommendFee: () => Promise<number>;
  updateTxs: () => void;
  getTempTx: () => ITransactionInfo | null;
  getNewSPT: () => ISPTInfo | null;
  getIssueSPT: () => ISPTIssue | null;
  getIssueNFT: () => INFTIssue | null;
  getNewUpdateAsset: () => any | null;
  getNewOwnership: () => any | null;
  updateTempTx: (tx: ITransactionInfo) => void;
  createSPT: (spt: ISPTInfo) => void;
  issueSPT: (spt: ISPTIssue) => void;
  issueNFT: (nft: INFTIssue) => void;
  confirmNewSPT: () => void;
  confirmIssueSPT: () => void;
  confirmIssueNFT: () => void;
  confirmTempTx: () => void;
  setNewAddress: (addr: string) => boolean;
  setNewXpub: (id: number, xpub: string) => boolean;
  getUserMintedTokens: () => any;
  createCollection: (collectionName: string, description: string, sysAddress: string, symbol: any, property1?: string, property2?: string, property3?: string, attribute1?: string, attribute2?: string, attribute3?: string) => void;
  getCollection: () => any;
  getTransactionInfoByTxId: (txid: any) => any;
  getSysExplorerSearch: () => string;
  setDataFromPageToCreateNewSPT: (data: any) => void;
  getDataFromPageToCreateNewSPT: () => any | null;
  setDataFromWalletToCreateSPT: (data: any) => void;
  getDataFromWalletToCreateSPT: () => any | null;
  setDataFromPageToMintSPT: (data: any) => void;
  getDataFromPageToMintSPT: () => any | null;
  setDataFromWalletToMintSPT: (data: any) => void;
  getDataFromWalletToMintSPT: () => any | null;
  setDataFromPageToMintNFT: (data: any) => void;
  getDataFromPageToMintNFT: () => any | null;
  setDataFromWalletToMintNFT: (data: any) => void;
  getDataFromWalletToMintNFT: () => any | null;
  setDataFromPageToUpdateAsset: (data: any) => void;
  getDataFromPageToUpdateAsset: () => any;
  setDataFromWalletToUpdateAsset: (data: any) => void;
  getDataFromWalletToUpdateAsset: () => any;
  setDataFromPageToTransferOwnership: (data: any) => void;
  getDataFromPageToTransferOwnership: () => any;
  setDataFromWalletToTransferOwnership: (data: any) => void;
  getDataFromWalletToTransferOwnership: () => any;
  confirmUpdateAssetTransaction: () => any;
  confirmTransferOwnership: () => any;
  setUpdateAsset: (asset: any) => any;
  setNewOwnership: (data: any) => any;
  getHoldingsData: () => any;
}

const AccountController = (actions: {
  checkPassword: (pwd: string) => boolean;
}): IAccountController => {
  let intervalId: any;
  let account: IAccountState;
  let tempTx: ITransactionInfo | null;
  let sysjs: any;
  let newSPT: ISPTInfo | null;
  let mintSPT: ISPTIssue | null;
  let updateAssetItem: any;
  let transferOwnershipData: any;
  let mintNFT: INFTIssue | null;
  let collection: any;
  let dataFromPageToCreateSPT: any;
  let dataFromWalletToCreateSPT: any;
  let dataFromPageToMintSPT: any;
  let dataFromWalletToMintSPT: any;
  let dataFromPageToMintNFT: any;
  let dataFromWalletToMintNFT: any;
  let dataFromWalletToUpdateAsset: any;
  let dataFromPageToUpdateAsset: any;
  let resAddress: any;
  let encode: any;

  const getAccountInfo = async (isHardwareWallet?: boolean, xpub?: any): Promise<IAccountInfo> => {
    let res, address = null;
    if (isHardwareWallet) {
      res = await sys.utils.fetchBackendAccount(sysjs.blockbookURL, xpub, 'tokens=nonzero&details=txs', true);
      let account0 = new fromZPub(xpub, sysjs.HDSigner.pubTypes, sysjs.HDSigner.networks)
      let receivingIndex: number = -1
      if (res.tokens) {
        res.tokens.forEach((token: any) => {
          if (token.path) {
            const splitPath = token.path.split('/')
            if (splitPath.length >= 6) {
              const change = parseInt(splitPath[4], 10)
              const index = parseInt(splitPath[5], 10)
              if (change === 1) {
                console.log("Can't update it's change index")
              }
              else if (index > receivingIndex) {
                receivingIndex = index
              }
            }
          }
        })
      }
      address = account0.getAddress(receivingIndex + 1)

    }
    else {
      console.log("Wallet object")
      console.log(sysjs.HDSigner)
      console.log("New xpub")
      console.log(sysjs.HDSigner.getAccountXpub())
      res = await sys.utils.fetchBackendAccount(sysjs.blockbookURL, sysjs.HDSigner.getAccountXpub(), 'tokens=nonzero&details=txs', true, sysjs.HDSigner);

    }


    const balance = res.balance / 1e8;
    let transactions: Transaction[] = [];
    let assets: Assets[] = [];

    if (res.transactions) {
      transactions = res.transactions.map((transaction: Transaction) => {
        return <Transaction>
          {
            txid: transaction.txid,
            value: transaction.value,
            confirmations: transaction.confirmations,
            fees: transaction.fees,
            blockTime: transaction.blockTime,
            tokenType: transaction.tokenType,
          }
      }).slice(0, 10);
    }

    if (res.tokensAsset) {
      let transform = res.tokensAsset.reduce((res: any, val: any) => {
        res[val.assetGuid] = <Assets>{
          type: val.type,
          assetGuid: val.assetGuid,
          symbol: atob(val.symbol),
          balance: (res[val.assetGuid] ? res[val.assetGuid].balance : 0) + Number(val.balance),
          decimals: val.decimals,
        };

        return res;
      }, {});

      for (var key in transform) {
        assets.push(transform[key]);
      }
    }
    if (address) {
      return {
        balance,
        assets,
        transactions,
        address
      };

    }
    else {
      return {
        balance,
        assets,
        transactions,
      };
    }
  };

  const subscribeAccount = async (isHardwareWallet: boolean = false, sjs?: any, label?: string, walletCreation?: boolean) => {
    if (isHardwareWallet) {
      const { accounts } = store.getState().wallet;
      let trezorID: number = accounts.reduce((trezorID: number, account: IAccountState) => (account.trezorId) ? trezorID = trezorID > account.trezorId ? trezorID : account.trezorId : trezorID, 0);
      console.log("The trezor id" + trezorID)
      const trezorinfo: IAccountInfo | null = await getAccountInfo(isHardwareWallet, sjs.descriptor);

      if (trezorinfo.address) {
        account = {
          id: 9999 + trezorID,
          label: `Trezor ${trezorID + 1}`,
          balance: sjs.availableBalance / (10 ** 8),
          transactions: trezorinfo.transactions,
          xpub: sjs.descriptor,
          address: { 'main': trezorinfo.address },
          assets: trezorinfo.assets,
          connectedTo: [],
          isTrezorWallet: true,
          trezorId: trezorID + 1
        };
        store.dispatch(createAccount(account));
        console.log(account!.xpub)
        return account!.xpub;

      }
      else {

        console.error("The trezor info output is wrong" + JSON.stringify(trezorinfo))
        return null;
      }
    }


    if (sjs) {
      sysjs = sjs;
    }
    if (!walletCreation) {
      sysjs.HDSigner.createAccount();
    }
    const res: IAccountInfo | null = await getAccountInfo();
    account = {
      id: sysjs.HDSigner.accountIndex,
      label: label || `Account ${sysjs.HDSigner.accountIndex + 1}`,
      balance: res.balance,
      transactions: res.transactions,
      xpub: sysjs.HDSigner.getAccountXpub(),
      address: { 'main': await sysjs.HDSigner.getNewReceivingAddress() },
      assets: res.assets,
      connectedTo: [],
      isTrezorWallet: false
    };
    console.log("The account being created")
    console.log(account)
    store.dispatch(createAccount(account));

    return account!.xpub;
  };

  const unsubscribeAccount = (index: number, pwd: string) => {
    if (actions.checkPassword(pwd)) {
      store.dispatch(removeAccount(index));
      store.dispatch(updateStatus());

      return true;
    }

    return false;
  };

  const updateAccountLabel = (id: number, label: string, isHardwareWallet?: boolean) => {
    if (isHardwareWallet) {

    }
    else {
      store.dispatch(updateLabel({ id, label }));
    }

  };

  const addNewAccount = async (label: string) => {
    return await subscribeAccount(false, null, label);
  };

  const getLatestUpdate = async () => {
    const { activeAccountId, accounts }: IWalletState = store.getState().wallet;
    if (!accounts.find(element => element.id === activeAccountId)) {
      return;
    };
    account = accounts.find(element => element.id === activeAccountId)!;
    if (!account.isTrezorWallet) {
      console.log("account infos")
      console.log(activeAccountId)
      sysjs.HDSigner.accountIndex = activeAccountId;
      console.log(sysjs.HDSigner.accountIndex)
      const accLatestInfo = await getAccountInfo();

      if (!accLatestInfo) return;



      store.dispatch(
        updateAccount({
          id: activeAccountId,
          balance: accLatestInfo.balance,
          transactions: accLatestInfo.transactions,
          assets: accLatestInfo.assets
        })
      );
    }
    else {
      const accLatestInfo = await getAccountInfo(true, account.xpub);

      if (!accLatestInfo) return;
      store.dispatch(
        updateAccount({
          id: activeAccountId,
          balance: accLatestInfo.balance,
          transactions: accLatestInfo.transactions,
          assets: accLatestInfo.assets
        })
      );

    }
  };

  const getPrimaryAccount = (pwd: string, sjs: any) => {
    const { accounts, activeAccountId }: IWalletState = store.getState().wallet;
    console.log(sjs)
    if (sjs) {
      sysjs = sjs;
    }

    if (!actions.checkPassword(pwd)) return;

    getLatestUpdate();

    if (!account && accounts) {
      account = accounts.find(element => element.id === activeAccountId) || accounts[activeAccountId];
      store.dispatch(updateStatus());
    }
  };

  const watchMemPool = () => {
    if (intervalId) {
      return;
    }

    intervalId = setInterval(() => {
      getLatestUpdate();

      const { activeAccountId, accounts }: IWalletState = store.getState().wallet;

      if (
        !accounts.find(element => element.id === activeAccountId) ||
        !accounts.find(element => element.id === activeAccountId)?.transactions ||
        !accounts.find(element => element.id === activeAccountId)!.transactions.filter(
          (tx: Transaction) => tx.confirmations > 0
        ).length
      ) {
        clearInterval(intervalId);
      }
    }, 30 * 1000);
  };

  const isValidSYSAddress = (address: string, network: string) => {
    if (address) {
      try {
        resAddress = bech32.decode(address);

        if (network === "main" && resAddress.prefix === "sys") {
          encode = bech32.encode(resAddress.prefix, resAddress.words);

          if (address === account.address.main) {
            return false;
          }

          return encode === address.toLowerCase();
        }

        if (network === "testnet" && resAddress.prefix === "tsys") {
          encode = bech32.encode(resAddress.prefix, resAddress.words);

          if (address === account.address.main) {
            return false;
          }

          return encode === address.toLowerCase();
        }
      } catch (error) {
        return false;
      }

      return false;
    }

    return false;
  };

  const isNFT = (guid: number) => {
    let assetGuid = BigInt.asUintN(64, BigInt(guid));

    return (assetGuid >> BigInt(32)) > 0;
  }

  const getRecommendFee = async () => {
    return await sys.utils.fetchEstimateFee(sysjs.blockbookURL, 1) / 10 ** 8;
  };

  const _coventPendingType = (txid: string) => {
    return {
      txid: txid,
      value: 0,
      confirmations: 0,
      fees: 0,
      blockTime: Date.now() / 1e3,
    } as Transaction;
  };

  const updateTxs = () => {
    if (!account) {
      return;
    }

    getLatestUpdate();
  };

  const getTempTx = () => {
    return tempTx || null;
  };

  const getNewSPT = () => {
    return newSPT || null;
  };

  const getIssueSPT = () => {
    return mintSPT || null;
  };

  const getIssueNFT = () => {
    return mintNFT || null;
  };

  const getNewUpdateAsset = () => {
    return updateAssetItem || null;
  }

  const getNewOwnership = () => {
    return transferOwnershipData || null;
  }

  const updateTempTx = (tx: ITransactionInfo) => {
    tempTx = { ...tx };
    tempTx.fromAddress = tempTx.fromAddress.trim();
    tempTx.toAddress = tempTx.toAddress.trim();
  };

  const setNewAddress = (addr: string) => {
    const { activeAccountId } = store.getState().wallet;
    console.log(activeAccountId)
    store.dispatch(
      updateAccountAddress({
        id: activeAccountId,
        address: { "main": addr },
      })
    );
    return true;
  }

  const setNewXpub = (id: number, xpub: string) => {
    store.dispatch(
      updateAccountXpub({
        id: id,
        xpub: xpub,
      })
    );

    return true;
  }

  const setDataFromPageToCreateNewSPT = (data: any) => {
    dataFromPageToCreateSPT = data;
  }
  const getDataFromPageToCreateNewSPT = () => {
    return dataFromPageToCreateSPT || null;
  }

  const setDataFromWalletToCreateSPT = (data: any) => {
    dataFromWalletToCreateSPT = data;
  }

  const getDataFromWalletToCreateSPT = () => {
    return dataFromWalletToCreateSPT || null;
  }

  const setDataFromPageToMintSPT = (data: any) => {
    dataFromPageToMintSPT = data;
  }

  const getDataFromPageToMintSPT = () => {
    return dataFromPageToMintSPT || null;
  }

  const setDataFromWalletToMintSPT = (data: any) => {
    console.log('data mint spt', data)
    dataFromWalletToMintSPT = data;
  }

  const getDataFromWalletToMintSPT = () => {
    return dataFromWalletToMintSPT || null;
  }

  const setDataFromPageToMintNFT = (data: any) => {
    dataFromPageToMintNFT = data;
  }
  const getDataFromPageToMintNFT = () => {
    return dataFromPageToMintNFT || null;
  }

  const setDataFromWalletToMintNFT = (data: any) => {
    console.log('set data nft', data)
    dataFromWalletToMintNFT = data;
  }

  const getDataFromWalletToMintNFT = () => {
    console.log('data mint nft', dataFromWalletToMintNFT)
    return dataFromWalletToMintNFT || null;
  }

  const setDataFromPageToUpdateAsset = (data: any) => {
    dataFromPageToUpdateAsset = data;
  }

  const getDataFromPageToUpdateAsset = () => {
    return dataFromPageToUpdateAsset || null;
  }

  const setDataFromWalletToUpdateAsset = (data: any) => {
    console.log('set data update asset', data)
    dataFromWalletToUpdateAsset = data;
  }

  const getDataFromWalletToUpdateAsset = () => {
    return dataFromWalletToUpdateAsset || null;
  }

  const setDataFromPageToTransferOwnership = (data: any) => {
    dataFromPageToCreateSPT = data;
  }
  const getDataFromPageToTransferOwnership = () => {
    return dataFromPageToCreateSPT || null;
  }

  const setDataFromWalletToTransferOwnership = (data: any) => {
    dataFromWalletToCreateSPT = data;
  }

  const getDataFromWalletToTransferOwnership = () => {
    return dataFromWalletToCreateSPT || null;
  }

  const createSPT = (spt: ISPTInfo) => {
    newSPT = spt;
    console.log("checkout the spt", spt)

    return true;
  }

  const issueSPT = (spt: ISPTIssue) => {
    mintSPT = spt;

    return true;
  }

  const issueNFT = (nft: INFTIssue) => {
    mintNFT = nft;

    return true;
  }
  const setUpdateAsset = (asset: any) => {
    updateAssetItem = asset;

    return true;
  }

  const setNewOwnership = (asset: any) => {
    transferOwnershipData = asset;

    return true;
  }
  
  const confirmSPTCreation = async (item: any) => {
    const newMaxSupply = item.maxsupply * 1e8;

    const _assetOpts = {
      precision: item.precision, symbol: item.symbol, maxsupply: new sys.utils.BN(newMaxSupply), description: item.description
    }

    const txOpts = { rbf: item.rbf }
    if (account.isTrezorWallet) {
      // const psbt = await sysjs.assetNew(_assetOpts, txOpts, null, item.receiver, new sys.utils.BN(item.fee), account.xpub);
      const psbt = await sysjs.assetNew(_assetOpts, txOpts, null, null, new sys.utils.BN(item.fee), account.xpub);
      if (!psbt) {
        console.log('Could not create transaction, not enough funds?')
      }
      console.log("The psbt")
      console.log(psbt.res.inputs)
      console.log(psbt.res.outputs)
    }
    else {
      const pendingTx = await sysjs.assetNew(_assetOpts, txOpts, null, null, new sys.utils.BN(item.fee * 1e8));

      const txInfo = pendingTx.extractTransaction().getId();

      store.dispatch(
        updateTransactions({
          id: account.id,
          txs: [_coventPendingType(txInfo), ...account.transactions],
        })
      );
    }
    item = null;

    watchMemPool();
  }


  const handleTransactions = (item: any, executeTransaction: any) => {
    if (!sysjs) {
      throw new Error('Error: No signed account exists');
    }

    if (!account) {
      throw new Error("Error: Can't find active account info");
    }

    if (!item) {
      throw new Error("Error: Can't find NewSPT info");
    }

    try {
      executeTransaction(item);

      return null;
    } catch (error) {
      throw new Error(error);
    }
  }

  const confirmNewSPT = () => {
    handleTransactions(newSPT, confirmSPTCreation);
  }

  const confirmMintSPT = async (item: any) => {
    const feeRate = new sys.utils.BN(item.fee * 1e8);
    const txOpts = { rbf: item.rbf };
    const assetGuid = item.assetGuid;
    const assetChangeAddress = null;

    console.log('mint spt', item)

    const assetMap = new Map([
      [assetGuid, { changeAddress: assetChangeAddress, outputs: [{ value: new sys.utils.BN(item.amount * 1e8), address: item.receiver }] }]
    ]);

    const sysChangeAddress = null;

    const pendingTx = await sysjs.assetSend(txOpts, assetMap, sysChangeAddress, feeRate);

    console.log('minting spt pendingTx', pendingTx);

    if (!pendingTx) {
      console.log('Could not create transaction, not enough funds?')
    }

    const txInfo = pendingTx.extractTransaction().getId();
    console.log('tx info mint spt', txInfo)

    store.dispatch(
      updateTransactions({
        id: account.id,
        txs: [_coventPendingType(txInfo), ...account.transactions],
      })
    );

    watchMemPool();
  }

  const confirmIssueSPT = () => {
    handleTransactions(mintSPT, confirmMintSPT);
  }

  const confirmMintNFT = async (item: any) => {
    const feeRate = new sys.utils.BN(item.fee * 1e8);
    const txOpts = { rbf: item?.rbf };
    const assetGuid = item?.assetGuid;
    const NFTID = sys.utils.createAssetID('1', assetGuid);
    const assetChangeAddress = null;

    const assetMap = new Map([
      [assetGuid, { changeAddress: assetChangeAddress, outputs: [{ value: new sys.utils.BN(1000), address: item?.receiver }] }],
      [NFTID, { changeAddress: assetChangeAddress, outputs: [{ value: new sys.utils.BN(1), address: item?.receiver }] }]
    ]);

    console.log('mint nft', item)
    console.log('minting nft asset map', assetMap);

    const sysChangeAddress = null;

    const pendingTx = await sysjs.assetSend(txOpts, assetMap, sysChangeAddress, feeRate);

    console.log('minting nft pendingTx', pendingTx);

    if (!pendingTx) {
      console.log('Could not create transaction, not enough funds?')
    }

    const txInfo = pendingTx.extractTransaction().getId();
    console.log('tx info mint nft', txInfo)

    store.dispatch(
      updateTransactions({
        id: account.id,
        txs: [_coventPendingType(txInfo), ...account.transactions],
      })
    );

    mintNFT = null;
  }

  const confirmIssueNFT = () => {
    handleTransactions(mintNFT, confirmMintNFT);
  }

  const confirmTransactionTx = async (item: any) => {
    if (item.isToken && item.token) {
      const txOpts = { rbf: item.rbf }
      const value = isNFT(item.token.assetGuid) ? new sys.utils.BN(item.amount) : new sys.utils.BN(item.amount * 10 ** item.token.decimals);

      const assetMap = new Map([
        [item.token.assetGuid, { changeAddress: null, outputs: [{ value: value, address: item.toAddress }] }]
      ]);

      if (account.isTrezorWallet) {
        console.log("Is trezor wallet")
        const psbt = await sysjs.assetAllocationSend(txOpts, assetMap, null,
          new sys.utils.BN(item.fee * 1e8), account.xpub)
        // const psbt = await syscoinjs.assetAllocationSend(txOpts, assetMap, sysChangeAddress, feeRate) 
        if (!psbt) {
          console.log('Could not create transaction, not enough funds?')
        }
        console.log("Is not trezor wallet")
        console.log("PSBT response")
        console.log(psbt.res.inputs)
        console.log(psbt.res.outputs)
        //TREZOR PART GOES UNDER NOW 
        //PSBT TO --TREZOR FORMAT

      }
      else {
        const pendingTx = await sysjs.assetAllocationSend(txOpts, assetMap, null, new sys.utils.BN(item.fee * 1e8));
        const txInfo = pendingTx.extractTransaction().getId();

        store.dispatch(
          updateTransactions({
            id: account.id,
            txs: [_coventPendingType(txInfo), ...account.transactions],
          })
        );
      }
    } else {
      const _outputsArr = [
        { address: item.toAddress, value: new sys.utils.BN(item.amount * 1e8) }
      ];
      const txOpts = { rbf: item.rbf }

      if (account.isTrezorWallet) {
        console.log("Is trezor wallet")
        const psbt = await sysjs.createTransaction(txOpts, null, _outputsArr,
          new sys.utils.BN(item.fee * 1e8), account.xpub);
        if (!psbt) {
          console.log('Could not create transaction, not enough funds?')
        }

        console.log("PSBT response:")
        console.log("PSBT inputs")
        console.log(psbt.res.inputs)
        console.log("PSBT outputs")
        console.log(psbt.res.outputs)
        console.log("the psbt transact" + JSON.stringify(psbt))

        // TREZOR PART GOES UNDER NOW

        let trezortx: any = {};
        trezortx.coin = "sys"
        trezortx.version = psbt.res.txVersion
        trezortx.inputs = []
        trezortx.outputs = []

        for (let i = 0; i < psbt.res.inputs.length; i++) {
          const input = psbt.res.inputs[i]
          let _input: any = {}

          _input.address_n = [84 | 0x80000000, 57 | 0x80000000, 0 | 0x80000000, 1, 49]
          _input.prev_index = input.vout
          _input.prev_hash = input.txId
          _input.sequence = input.sequence
          _input.amount = input.value.toString()
          _input.script_type = 'SPENDWITNESS'
          trezortx.inputs.push(_input)
        }

        for (let i = 0; i < psbt.res.outputs.length; i++) {
          const output = psbt.res.outputs[i]
          let _output: any = {}

          _output.address = output.address
          _output.amount = output.value.toString()
          _output.script_type = "PAYTOWITNESS"
          trezortx.outputs.push(_output)
        }
        console.log(trezortx)
        const resp = await TrezorConnect.signTransaction(trezortx)
        console.log(resp)
        if (resp.success == true) {
          const response = await sys.utils.sendRawTransaction(sysjs.blockbookURL, resp.payload.serializedTx)
          console.log(response)
          console.log("tx ix")
        } else {
          console.log(resp.payload.error)
        }

      }
      else {
        const pendingTx = await sysjs.createTransaction(txOpts, null, _outputsArr, new sys.utils.BN(item.fee * 1e8));
        const txInfo = pendingTx.extractTransaction().getId();

        store.dispatch(
          updateTransactions({
            id: account.id,
            txs: [_coventPendingType(txInfo), ...account.transactions],
          })
        );
      }
    }
    item = null;

    watchMemPool();
  }

  const confirmTempTx = () => {
    handleTransactions(tempTx, confirmTransactionTx);
  };

  const getUserMintedTokens = async () => {
    let mintedTokens: MintedToken[] = [];

    const res = await sys.utils.fetchBackendAccount(sysjs.blockbookURL, sysjs.HDSigner.getAccountXpub(), 'details=txs&assetMask=non-token-transfers', true, sysjs.HDSigner);

    if (res.transactions) {
      res.transactions.map(async (transaction: any) => {
        if (transaction.tokenType === 'SPTAssetActivate' && transaction.tokenTransfers) {
          for (let item of transaction.tokenTransfers) {
            if (mintedTokens.indexOf({ assetGuid: item.token, symbol: atob(item.symbol) }) === -1) {
              mintedTokens.push({
                assetGuid: item.token,
                symbol: atob(item.symbol)
              });
            }

            return;
          }
        }
        return;
      });
      return mintedTokens;
    }
    return;
  }

  const getHoldingsData = async () => {
    let assetsData: any = [];

    const connectedAccountAssetsData = store.getState().wallet.accounts.filter((account: IAccountState) => {
      return account.connectedTo.find((url: any) => {
        return url == new URL(store.getState().wallet.currentURL).host;
      });
    });

    if (connectedAccountAssetsData[0]) {
      connectedAccountAssetsData[0].assets.map(async (asset: any) => {
        const {
          balance,
          type,
          decimals,
          symbol,
          assetGuid
        } = asset;

        const assetId = await sys.utils.getBaseAssetID(assetGuid);
  
        const assetData = {
          balance,
          type,
          decimals,
          symbol,
          assetGuid,
          baseAssetID: assetId,
          nftAssetID: isNFT(assetGuid) ? await sys.utils.createAssetID(assetId, assetGuid) : await sys.utils.createAssetID(null, assetGuid)
        }
  
        if (assetsData.indexOf(assetData) === -1) {
          assetsData.push(assetData);
        }
      });

      return {
        assetsData
      };
    }

    console.log('no account connected to this site :(');

    return;
  }

  const createCollection = (collectionName: string, description: string, sysAddress: string, symbol: any, property1?: string, property2?: string, property3?: string, attribute1?: string, attribute2?: string, attribute3?: string) => {
    console.log('[account controller]: collection created')

    collection = {
      collectionName,
      description,
      sysAddress,
      symbol,
      property1,
      property2,
      property3,
      attribute1,
      attribute2,
      attribute3
    }

    console.log(collection)
  }

  const getCollection = () => {
    return collection;
  }

  const getTransactionInfoByTxId = async (txid: any) => {
    console.log('info txid', await sys.utils.fetchBackendRawTx(sysjs.blockbookURL, txid))
    return await sys.utils.fetchBackendRawTx(sysjs.blockbookURL, txid);
  }

  const getSysExplorerSearch = () => {
    return sysjs.blockbookURL;
  }
  
  const confirmUpdateAsset = async (item: any) => {
    const {
      fee,
      assetWhiteList,
      updatecapabilityflags,
      contract,
      description,
      rbf
    } = item;
    const feeRate = new sys.utils.BN(fee * 1e8);

    const txOpts = {
      rbf: rbf || true,
      assetWhiteList: assetWhiteList || null,
    };

    const assetGuid = item.assetGuid;

    const assetOpts = {
      updatecapabilityflags: updatecapabilityflags || 127,
      contract: Buffer.from(contract, 'hex') || null,
      description: description,
      // notarykeyid: item.notarykeyid || '',
      // notarydetails: {
      //   endpoint: item.endpoint || '',
      //   instanttransfers: item.instanttransfers || 0,
      //   hdrequired: item.hdrequired || 0,
      // },
      // auxfeedetails: item.auxFeeDetails
      // auxfeedetails: {
      //   auxfeekeyid: item.auxFeeDetails.auxfeekeyid || 'bc1qg9stkxrszkdqsuj92lm4c7akvk36zvhqw7p6ck',
      //   auxfees: [
      //     {
      //       bound: item.auxFeeDetails.bound || 0,
      //       percent: item.auxFeeDetails.percent || 0
      //     }
      //   ]
      // }
    };

    console.log('asset opts update asset', assetOpts)

    const assetChangeAddress = null;

    const assetMap = new Map([
      [Number(assetGuid), {
        changeAddress: assetChangeAddress,
        outputs: [{
          value: new sys.utils.BN(0),
          address: assetChangeAddress
        }]
      }]
    ]);

    const sysChangeAddress = null;
    const psbt = await sysjs.assetUpdate(assetGuid, assetOpts, txOpts, assetMap, sysChangeAddress, feeRate);

    console.log('psbt', psbt)

    if (!psbt) {
      console.log('Could not create transaction, not enough funds?');
    }
  }

  const confirmUpdateAssetTransaction = () => {
    console.log('update asset item', updateAssetItem)
    try {
      handleTransactions(updateAssetItem, confirmUpdateAsset);
    } catch (error) {
      throw new Error(error);
    }
  }

  const transferAsset = async (item: any) => {
    const feeRate = new sys.utils.BN(item.fee * 1e8);
    const txOpts = { rbf: item.rbf };
    const assetGuid = item.assetGuid;
    const assetOpts = {};

    const assetChangeAddress = null;
    const assetMap = new Map([
      [assetGuid, { changeAddress: assetChangeAddress, outputs: [{ value: new sys.utils.BN(0), address: item.newOwner }] }]
    ]);

    const sysChangeAddress = null;
    const psbt = await sysjs.assetUpdate(assetGuid, assetOpts, txOpts, assetMap, sysChangeAddress, feeRate);

    if (!psbt) {
      console.log('Could not create transaction, not enough funds?');
    }
  }

  const confirmTransferOwnership = () => {
    handleTransactions(transferOwnershipData, transferAsset);
  }

  return {
    subscribeAccount,
    getPrimaryAccount,
    unsubscribeAccount,
    updateAccountLabel,
    addNewAccount,
    getLatestUpdate,
    watchMemPool,
    getTempTx,
    updateTempTx,
    confirmTempTx,
    isValidSYSAddress,
    updateTxs,
    getRecommendFee,
    setNewAddress,
    setNewXpub,
    isNFT,
    createSPT,
    getNewSPT,
    confirmNewSPT,
    issueSPT,
    issueNFT,
    getIssueSPT,
    getIssueNFT,
    getNewUpdateAsset,
    getNewOwnership,
    confirmIssueSPT,
    confirmIssueNFT,
    getUserMintedTokens,
    createCollection,
    getCollection,
    getTransactionInfoByTxId,
    getSysExplorerSearch,
    setDataFromPageToCreateNewSPT,
    getDataFromPageToCreateNewSPT,
    setDataFromWalletToCreateSPT,
    getDataFromWalletToCreateSPT,
    setDataFromPageToMintSPT,
    getDataFromPageToMintSPT,
    setDataFromWalletToMintSPT,
    getDataFromWalletToMintSPT,
    setDataFromPageToMintNFT,
    getDataFromPageToMintNFT,
    setDataFromWalletToMintNFT,
    getDataFromWalletToMintNFT,
    setDataFromPageToUpdateAsset,
    getDataFromPageToUpdateAsset,
    setDataFromWalletToUpdateAsset,
    getDataFromWalletToUpdateAsset,
    setDataFromPageToTransferOwnership,
    getDataFromPageToTransferOwnership,
    setDataFromWalletToTransferOwnership,
    getDataFromWalletToTransferOwnership,
    confirmUpdateAssetTransaction,
    confirmTransferOwnership,
    setUpdateAsset,
    setNewOwnership,
    getHoldingsData
  };
};

export default AccountController;