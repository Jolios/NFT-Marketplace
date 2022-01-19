async function resellOwnedItem(id,price){
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
}
export default resellOwnedItem