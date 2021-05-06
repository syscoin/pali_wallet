import React, { Component, useEffect, useState, useCallback } from "react";
import logo from "./assets/images/logosys.svg";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-dropzone-uploader/dist/styles.css'
import FormSpt from "./FormSpt"
  const Mintspt = () => {


    const [preview, setPreview] = useState("");
    const [isInstalled, setIsInstalled] = useState(false);
    const [canConnect, setCanConnect] = useState(true);
    const [balance, setBalance] = useState(0);
    const [controller, setController] = useState();
    const [connectedAccount, setConnectedAccount] = useState({});
    const [connectedAccountAddress, setConnectedAccountAddress] = useState('');
    const [amount, setAmount] = useState(0);
    const [fee, setFee] = useState(0.00001);
    const [toAddress, setToAddress] = useState('');
    const [selectedAsset,setSelectedAsset] = useState(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
      const callback = async (event) => {
        if (event.detail.SyscoinInstalled) {
          setIsInstalled(true);
  
          if (event.detail.ConnectionsController) {
            setController(window.ConnectionsController);
  
            return;
          }
  
          return;
        }
  
        setIsInstalled(false);
  
        window.removeEventListener('SyscoinStatus', callback);
      }
  
      window.addEventListener('SyscoinStatus', callback);
    }, []);

    const handleTypeChanged = useCallback((checked) => {
        setChecked(checked)
    }, []);
  
    const setup = async () => {
      const state = await controller.getWalletState();
  
      if (state.accounts.length > 0) {
        controller.getConnectedAccount()
          .then((data) => {
            if (data) {
              setConnectedAccount(data);
              setConnectedAccountAddress(data.address.main);
              setBalance(data.balance);
            } else {
              setConnectedAccount({});
              setConnectedAccountAddress('');
              setBalance(0);
            }
        
            return;
          });
      }
    };
  
    useEffect(() => {
      if (controller){
        
      }
    })
    useEffect(() => {
      if (controller) {
        setup();
  
        controller.onWalletUpdate(setup);
      }
    }, [
      controller,
    ]);
  
    const handleAssetSelected = (event) => {
      if (connectedAccount) {
        const selectedAsset = connectedAccount.assets.filter((asset) => asset.assetGuid == event.target.value);
  
        if (selectedAsset[0]) {
          setSelectedAsset(selectedAsset[0]);
  
          return;
        }
  
        setSelectedAsset(null);
      }
    };
  
    const handleMessageExtension = async () => {
      await controller.connectWallet();
      await setup();
    }
  
    const handleGetWalletState = async (evt) => {
      const inputs = document.querySelectorAll('input');
      alert(`Submitting Asset Guid: ${evt.target.assetGuid.value}, Amount: ${evt.target.amount.value}, Fee: ${evt.target.fee.value}, RBF: ${evt.target.rbf.value}, Sys Address: ${evt.target.receiver.value}`)
      console.log("Sending tokens");
       await controller.handleCreateToken(8,
         'NikBar',
         1000,
          0.00001,
         'larara lelere lololo lululu',
         'tsys1qvaf78steqrvsljch9mn6n559ljj5g2xs7gvepq',
         false) 
      // (rbf: boolean, fee: number, assetGuid: string, amount: number, receiver: string)
      await controller.handleIssueAsset(
        false,
        0.00001,
        'umasset',
        200,
        'txsdkasod'
      )
      //(rbf: boolean, fee: number, assetGuid: string, nfthash: string, receiver: string) => {
       await controller.handleIssueNFT(
         true,
         0.0001,
         'umassetguid',
         'umnfthash',
         'umaconta'
       )
      return await controller.getWalletState();
    }
  
  
    const clearData = (inputs) => {
      for (let input of inputs) {
        input.value = '';
      }
  
      setToAddress('');
      setAmount(0);
      setFee(0.00001);
    }


    const handleSendToken = async (sender, receiver, amount, fee, token) => {
      const inputs = document.querySelectorAll('input');
  
      if (token !== null) {
        await controller.handleSendToken(sender, receiver, amount, fee, token, true, !checked);
  
        clearData(inputs);
  
        return;
      }
  
      await controller.handleSendToken(sender, receiver, amount, fee, null, false, !checked);
  
      clearData(inputs);
  
      return;
    }
    const getUploadParams = () => ({ url: 'https://api.nft.storage/upload',  
headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGJiNUM1NzJkYmFlNDQ1MkFDOGFiZWZlMjk3ZTljREIyRmEzRjRlNzIiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYxOTcxMjM0MTgzNCwibmFtZSI6InN5cyJ9.KmVoWH8Sa0FNsPyWrPYEr1zCAdFw8bJwVnmzPsp_fg4"
 }})
;//"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5ASDASDAXCZg0NTY5MDEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYxODU5NzczODM5NCwibmFtZSI6ImtleTEifQ.uNeFoDDU_M8uzTNTVQ3uYnxejjVNldno5nFuxzoOWMk"
const handleChangeStatus = ({ meta, file, xhr }, status) => {
 if (xhr?.response){
  const {value: {cid}} = JSON.parse(xhr.response)
  setPreview(`https://ipfs.io/ipfs/${cid}/${file.name}`)

  console.log(`CID:${cid}`)
  console.log('meta: ', meta)
  console.log('file', file)
  console.log(`other information: `, JSON.parse(xhr.response));
   document.getElementById('out').innerHTML+= `${JSON.stringify(
    `CID:${cid}`
  )}\n` 
 
}; 
};  


    return (
      
             <div className="app">
     
             {controller ? (  
       <div>  
       <nav class="navbar navbar-expand-lg navbar-light  static-top">
         <div class="container">
           <a class="navbar-brand" href="https://syscoin.org/">
           <img src={logo} alt="logo" className="header__logo"></img>
               </a>
               <a class="button" href="/">Home</a>
              <div class="collapse navbar-collapse" id="navbarResponsive">
             <ul class="navbar-nav ml-auto">
              <button
                className="button"
                onClick={canConnect ? handleMessageExtension : undefined}
                disabled={!isInstalled}>
                {connectedAccountAddress === '' ? 'Connect to Syscoin Wallet' : connectedAccountAddress}
              </button>
             </ul>
           </div>
         </div>
       </nav>  
       <FormSpt
       formCallback={handleGetWalletState}
      />
</div>

        ) : (
          <div>
            <p>...</p>
            <h1>You need to install Syscoin Wallet.</h1>
          </div>
        )}
      </div>
    );
  }
  
  export default Mintspt;
