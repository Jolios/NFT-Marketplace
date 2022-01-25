// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./NFT.sol";

contract Market is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemsIds;
    Counters.Counter private _itemsSold;
    Counters.Counter private _itemsDeleted;

    // owner of the marketplace
    address payable owner;
    // price for putting something to sale in the Marketplace
    uint256 listingPrice = 0.025 ether;

    constructor() {
        //set the owner of the contract to the one that deployed it
        owner = payable(msg.sender);
    }

    /* Returns the listing price of the contract */
    // function getListingPrice() public view returns (uint256) {
    //   return listingPrice;
    // }

    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable creator;
        address payable seller;
        address payable owner;
        uint256 price;
        uint256 rightsPrice;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address creator,
        address seller,
        address owner,
        uint256 price,
        uint256 rightsPrice
    );

    //mateus

    event ProductUpdated(
      uint256 indexed itemId,
      uint256 indexed oldPrice,
      uint256 indexed newPrice
    );

    event MarketItemDeleted(uint256 itemId);

    event ProductSold(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address creator,
        address seller,
        address owner,
        uint256 price
    );
    event RightsSold(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address creator,
        address seller,
        address owner,
        uint256 rightsPrice
    );

     event ProductListed(
        uint256 indexed itemId
    );

    modifier onlyProductOrMarketPlaceOwner(uint256 id) {
        if (idToMarketItem[id].owner != address(0)) {
            require(idToMarketItem[id].owner == msg.sender);
        } else {
            require(
                idToMarketItem[id].seller == msg.sender || msg.sender == owner
            );
        }
        _;
    }

    modifier onlyProductSeller(uint256 id) {
        require(
            idToMarketItem[id].owner == address(0) &&
                idToMarketItem[id].seller == msg.sender, "Only the product can do this operation"
        );
        _;
    }

    modifier onlyItemOwner(uint256 id) {
        require(
            idToMarketItem[id].owner == msg.sender,
            "Only product owner can do this operation"
        );
        _;
    }

    function getListingPrice() public view returns (uint256) {
      return listingPrice;
    }

    //mateus

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 rightsPrice
    ) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(rightsPrice > 0, "Rights possession price must be at least 1 wei");

        // obligates the seller to pay the listing price
        require(msg.value == listingPrice, "Listing fee required");

        _itemsIds.increment();
        uint256 itemId = _itemsIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(msg.sender),
            payable(address(0)),
            price,
            rightsPrice,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            msg.sender,
            address(0),
            price,
            rightsPrice
        );
    }

    function updateMarketItemPrice(uint256 id, uint256 newPrice)
        public 
        payable
        onlyProductSeller(id)
    {
        MarketItem storage item = idToMarketItem[id];
        uint256 oldPrice = item.price;
        item.price = newPrice;

        emit ProductUpdated(id, oldPrice, newPrice);
    }

    function createMarketSale(address nftContract, uint256 itemId)
        public
        payable
        nonReentrant
    {
        uint256 price = idToMarketItem[itemId].price;
        uint256 tokenId = idToMarketItem[itemId].tokenId;
        require(
            msg.value == price,
            "Please submit the asking price in order to complete the purchase"
        );

        idToMarketItem[itemId].seller.transfer(msg.value);
        NFT tokenContract = NFT(nftContract);
        
        tokenContract.hasToPayRoyalties(idToMarketItem[itemId].seller,idToMarketItem[itemId].creator);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        

        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();

        //regards the marketplace with the listingPrice
        // payable(owner).transfer(listingPrice);

        emit ProductSold(
            idToMarketItem[itemId].itemId,
            idToMarketItem[itemId].nftContract,
            idToMarketItem[itemId].tokenId,
            idToMarketItem[itemId].creator,
            idToMarketItem[itemId].seller,
            payable(msg.sender),
            idToMarketItem[itemId].price
        );
    }

    function putItemToResell(address nftContract, uint256 itemId, uint256 newPrice)
        public
        payable
        nonReentrant
        onlyItemOwner(itemId)
    {
        uint256 tokenId = idToMarketItem[itemId].tokenId;
        require(newPrice > 0, "Price must be at least 1 wei");
        require(
            msg.value == listingPrice,
            "Price must be equal to listing price"
        );
        NFT tokenContract = NFT(nftContract);
        tokenContract.transferToken(msg.sender,address(this),tokenId);
        
        address payable oldOwner = idToMarketItem[itemId].owner;
        idToMarketItem[itemId].owner = payable(address(0));
        idToMarketItem[itemId].seller = oldOwner;
        idToMarketItem[itemId].price = newPrice;
        idToMarketItem[itemId].sold = false;
        _itemsSold.decrement();

        emit ProductListed(itemId);
    }

    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = _itemsIds.current();
        uint256 currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].tokenId != 0) 
            {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchSingleItem(uint256 id)
        public
        view
        returns (MarketItem memory)
    {
        return idToMarketItem[id];
    }

    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemsIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchAuthorsCreations(address author) public view returns (MarketItem[] memory){
        uint256 totalItemCount = _itemsIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].creator == author && !idToMarketItem[i + 1].sold) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].creator == author && !idToMarketItem[i + 1].sold) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
    mapping(address=>uint256[]) rightsHolderNfts;

    function addNft(address rightsHolder,uint256 id)public{
        rightsHolderNfts[rightsHolder].push(id);
    }
    function fetchNfts()public view returns(MarketItem[] memory) {
        uint256 len = rightsHolderNfts[msg.sender].length;
        uint256[] memory itemsIds = rightsHolderNfts[msg.sender];
        uint256 currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](len);
        for (uint256 i = 0; i < len; i++) {
            uint256 currentId = itemsIds[i];
            MarketItem storage currentItem = idToMarketItem[currentId];
            items[currentIndex] = currentItem;
            currentIndex += 1;
        }
        return items;
    }
    function createRightsSale(uint256 itemId)
        public
        payable
    {
        uint256 rightsPrice = idToMarketItem[itemId].rightsPrice;
        require(
            msg.value == rightsPrice,
            "Please submit the asking price in order to complete the rights purchase"
        );

        idToMarketItem[itemId].seller.transfer(msg.value);
        addNft(msg.sender,itemId);

        //regards the marketplace with the listingPrice
        //payable(owner).transfer(listingPrice);

        emit RightsSold(
            idToMarketItem[itemId].itemId,
            idToMarketItem[itemId].nftContract,
            idToMarketItem[itemId].tokenId,
            idToMarketItem[itemId].creator,
            idToMarketItem[itemId].seller,
            idToMarketItem[itemId].owner,
            idToMarketItem[itemId].rightsPrice
        );
    }
}