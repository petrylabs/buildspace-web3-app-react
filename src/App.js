import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";
import "./App.css";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0x537D1c6d9c5F3bF2F3c8d0478b075ad16d25d764"; //New Contract Address
  const contractABI = abi.abi;

  /**
  * Make sure the ethereum object injected by Metamask is available
  */
  const checkMetamaskEthereumObject = (ethereum) => {
    if (!ethereum) {
      console.log("Make sure you have Metamask installed!");
      return false;
    } else {
      console.log("We have the ethereum object, thanks Metamask!", ethereum);
      return true;
    }
  }

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    try {
      if(!checkMetamaskEthereumObject(ethereum)) 
        return;
      /*
      * Make sure the user has authorized access to at least one account
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Connect Metmask Wallet to dApp
  */
  const connectWallet = async () => {
    const { ethereum } = window;
    try {
      if(!checkMetamaskEthereumObject(ethereum))
        return;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave("this is a message");
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        Hiho... Please say hello!
        </div>

        <div className="bio">
          <p>I am Michael and I am a Web3 Developer</p>
          <p>Connect your Ethereum wallet and wave at me!</p>
        </div>

        {/*
        * If there is no currentAccount render this button
        */}
        {currentAccount ? ([
            <p>Connected!</p>,
            <button className="waveButton" onClick={wave}>
              Wave at Me!
            </button>
        ])
        : (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}

export default App