import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {
  nftmarketaddress, nftaddress
} from '../config';
import { useRouter } from 'next/router';

import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

export default function MyAssets() {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const router = useRouter();
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleChange = (event) =>{
    setPrice(event.target.value);
  }
  
  const [nfts, setNfts] = useState([]);
  const [nftsRights, setNftsRights] = useState([]);

  const [loadingState, setLoadingState] = useState('not-loaded');
  
  useEffect(() => {
    loadNFTs();
    loadNFTsRights();
  }, [])
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
      
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const data = await marketContract.fetchMyNFTs()
    
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        nftContract: i.nftContract,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }
  async function loadNFTsRights() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
      
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const data = await marketContract.fetchNfts()
    
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let rightsPrice = ethers.utils.formatUnits(i.rightsPrice.toString(), 'ether')
      let item = {
        rightsPrice,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        description: meta.data.description,
        nftContract: i.nftContract,
      }
      return item
    }))
    setNftsRights(items)
    setLoadingState('loaded') 
  }
  async function resellOwnedItem(id){
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      signer
    );
    const listingPrice = await marketContract.getListingPrice();
    const tx = await marketContract.putItemToResell(
      nftaddress,
      id,
      ethers.utils.parseUnits(price, "ether"),
      { value: listingPrice.toString() }
    );
    await tx.wait();
    router.push('/');
}
  if (loadingState === 'loaded' && !nfts.length && nftsRights.length) return (
    <div className="flex">
      <div className="p-4">
          <h1 className="text-3xl">Bought assets rights</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">

          {
            nftsRights.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                {/* <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                </div> */}
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.rightsPrice} ETH</p>
                  <p className="text-2xl mb-4 font-bold text-white">{nft.description}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
  if (loadingState === 'loaded' && nfts.length && !nftsRights.length) return (
    
    <div className="flex">
      <div className="p-4">
      <h1 className="py-10 text-3xl">Bought assets</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">

            {
              nfts.map((nft, i) => (
                <div key={i} className="border shadow rounded-xl overflow-hidden">
                  <img src={nft.image} className="rounded" />
                  {/* <div className="p-4 bg-black">
                    <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                  </div> */}
                  <div className="p-4 bg-black">
                    <p className="text-2xl mb-4 font-bold text-white">{nft.price} ETH</p>
                    <div style={{display : 'flex' }}>
                    <button className="w-full bg-blue-500 text-white font-bold py-2 mr-2  rounded" onClick={() => window.open(
                            `https://ropsten.etherscan.io/token/${nft.nftContract}?a=${nft.tokenId}`,
                            "_blank"
                          )}>Show</button>
                    <button className="w-full bg-blue-500 text-white font-bold py-2  rounded" onClick={handleClickOpen}>Sell</button>
                    </div>
                  </div>
                  <Dialog open={open} onClose={()=>handleClose}>
                    <DialogTitle>Sell</DialogTitle>
                    <DialogContent>
                      <TextField
                        autoFocus
                        margin="dense"
                        id="price"
                        label="Price in ETH"
                        fullWidth
                        variant="outlined"
                        value={price}
                        onChange={handleChange}
                      />
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={()=>handleClose()}>Cancel</Button>
                      <Button onClick={()=>resellOwnedItem(nft.tokenId)}>Sell</Button>
                    </DialogActions>
                  </Dialog>
                </div>
                
              ))
            }
        </div>
      </div>
    </div>
  )
  if (loadingState === 'loaded' && !nfts.length && !nftsRights.length) 
  return (
    <h1 className="py-10 text-3xl">No assets or rights owned</h1>
  )

  return (
    <div className="flex">
      <div className="p-4">
      <h1 className="py-10 text-3xl">Bought assets</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                {/* <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                </div> */}
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} ETH</p>
                  <div style={{display : 'flex' }}>
                  <button className="w-full bg-blue-500 text-white font-bold py-2 mr-2  rounded" onClick={() => window.open(
                          `https://ropsten.etherscan.io/token/${nft.nftContract}?a=${nft.tokenId}`,
                          "_blank"
                        )}>Show</button>
                  <button className="w-full bg-blue-500 text-white font-bold py-2  rounded" onClick={handleClickOpen}>Sell</button>
                  </div>
                </div>
                <Dialog open={open} onClose={()=>handleClose}>
                  <DialogTitle>Sell</DialogTitle>
                  <DialogContent>
                    <TextField
                      autoFocus
                      margin="dense"
                      id="price"
                      label="Price in ETH"
                      fullWidth
                      variant="outlined"
                      value={price}
                      onChange={handleChange}
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={()=>handleClose()}>Cancel</Button>
                    <Button onClick={()=>resellOwnedItem(nft.tokenId)}>Sell</Button>
                  </DialogActions>
                </Dialog>
              </div>
              
            ))
          }
          </div>
           <h1 className="py-10 px-20 text-3xl">Bought assets rights</h1>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
           {
            nftsRights.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                {/* <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                </div> */}
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.rightsPrice} ETH</p>
                  <p className="text-2xl mb-4 font-bold text-white">{nft.description}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}