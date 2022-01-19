import { getEllipsisTxt } from "./formatters";
import Blockie from "./Blockie";
import { Button, Card, Modal } from "antd";
import { useState, useEffect } from "react";
import Address from "./Address";
import { SelectOutlined } from "@ant-design/icons";
import Web3Modal from 'web3modal'
import { ethers } from 'ethers'


const styles = {
  account: {
    height: "42px",
    padding: "0 15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "fit-content",
    borderRadius: "12px",
    backgroundColor: "rgb(244, 244, 244)",
    cursor: "pointer",
    marginLeft: "39em",
    marginTop: "-0.7em"
  },
  text: {
    color: "blue",
  },
};


export default function Account() {
  const [isModalVisible, setIsModalVisible] = useState(false);
//   useEffect(() => {
//     // window is accessible here.
//     const web3Modal = new Web3Modal();
//     dispatch({
//         web3Modal
//     })
//   }, []);

  const [provider,setProvider] = useState(null)
  const [walletAddress,setWalletAddress] = useState(null)
  useEffect(() => {
    (async () => {
       if(localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER")) await connect();
    })()
  }, [])
  async function connect(){
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect()
    const firstProvider = new ethers.providers.Web3Provider(connection)
    const signer = firstProvider.getSigner()
    const firstWalletAddress = await signer.getAddress()
    setProvider(firstProvider)
    setWalletAddress(firstWalletAddress)
  }
  async function disconnect(){
    await web3Modal.clearCachedProvider()
    if (provider?.disconnect && typeof provider.disconnect === 'function') {
      await provider.disconnect()
    }
    setProvider(null)
  }
  if (!provider) {
    return (
      <div
        style={styles.account}
        onClick={connect}
      >
        <p style={styles.text}>Authenticate {provider}</p>
      </div>
    );
  }
  return (
    <>
      <div style={styles.account} onClick={() => setIsModalVisible(true)}>
        <p style={{ marginRight: "5px", ...styles.text }}>
          {getEllipsisTxt(walletAddress, 6)}
        </p>
        <Blockie address={walletAddress} scale={3} />
      </div>
     
    </>
  );
}