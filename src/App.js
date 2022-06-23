import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Moment from 'react-moment';
import abi from "./utils/WavePortal.json";
import "./App.css";

import {
  Gif
} from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { useAsync } from "react-async-hook";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(0);
  const [countryList, setCountryList] = useState([]);
  const [countryCode, setCountryCode] = useState("");
  const [message, setMessage] = useState("");
  const [gif, setGif] = useState(null);


  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0xd31cA6d8c9FeAa0C07514Aa634451a7DC14901BE"; //New Contract Address
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            countryCode: wave.countryCode,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);

        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

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
    console.log('message', message);
    console.log('countryCode', countryCode);
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
        const waveTxn = await wavePortalContract.wave(message, countryCode, { gasLimit: 300000});
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

  const getCountryList = () => {
    console.log("Get country list involed!");
    fetch("https://restcountries.com/v3.1/all")
    .then(res => res.json())
    .then(
      (result) => {
        const sorted = result?.sort((a, b) => a.name.common.localeCompare(b.name.common));
        setCountryList(sorted);
      }
    )
    .finally(() => {
      console.log('end of story');
    })
  }

  const giphyFetch = new GiphyFetch("63rZnjUDKyyA0VowUPteomkmEBGDON9m");

  useAsync(async () => {
    const { data } = await giphyFetch.gif("fpXxIjftmkk9y");
    setGif(data);
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();
    getAllWaves();
    getCountryList();
  }, [])

  const getNationality = (countryCode) => {
    const country = countryList.find(country => country.cca2 == countryCode.toUpperCase());
    // console.log('Nationality match', country);
    return  country ? country?.demonyms?.eng?.m : countryCode
  }

  const getFlagSvg = (countryCode) => {
    const country = countryList.find(country => country.cca2 == countryCode.toUpperCase());
    // console.log('Flag SVG match', country);
    return  country ? country?.flags?.svg : countryCode
  }


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
        <div className="message">
          <textarea 
            class="message_input" 
            placeholder="Type a message..."
            onChange={(e)=>{setMessage(e.target.value)}}
          ></textarea>
          <span class="message_chars"></span>
        </div>
        {/*
        * If there is no currentAccount render this button
        */}
        {currentAccount ? ([
            <p>Connected!</p>,
            <button className="waveButton" onClick={wave}>
              Wave at Me!
            </button>,
            <select
              onChange={(e)=>{setCountryCode(e.target.value)}}
            >
              <option value="">Select a country</option>
              {countryList.map((country) => {
                return <option value={country?.cca2}>{country?.flag} {country?.name?.common}</option>
              })}
            </select>
        ])
        : (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

      <div>
        {gif ? (<Gif gif={gif} width={200} />) : null}
      </div>
      <div className="waves">
          <h2>Waves {allWaves.length}</h2>
          {allWaves.map((wave, index) => {
          return (
            <div className="wave">
              <div className="thumb">
                <img src={getFlagSvg(wave.countryCode)} height={64} width={64} alt="thumb"/>
              </div>
              <div className="body">
                <div class="top">
                  <div><b>{getNationality(wave.countryCode)}</b>@{wave.address.substr(-8)}</div>
                  <Moment fromNow>{wave.timestamp}</Moment>
                </div>
              <div>{wave.message}</div>
              </div>
            </div>)
        }).reverse()}
        </div>

      </div>
    </div>
  );
}

export default App

// https://restcountries.com/v3.1/all
// https://www.countryflagsapi.com/#howToUse