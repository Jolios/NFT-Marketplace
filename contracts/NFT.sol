// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address contractAddress;
    address creator;
    uint256 royaltiesAmount = 0.001 ether;
    mapping(address => bool) public excludedList;


    constructor(address marketplaceAddress) ERC721("Metaverse", "METT") {
        contractAddress = marketplaceAddress;
    }

    function createToken(string memory tokenURI) public returns (uint) {
        creator = msg.sender;
        excludedList[creator] = true;
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(contractAddress, true);
        return newItemId;
    }
    function hasToPayRoyalties(address from,address artist)external {
        if(excludedList[from] == false) {
            payRoyalties(artist);
        }
    }
    function transferToken(address from, address to, uint256 tokenId) external {
        require(ownerOf(tokenId) == from, "From address must be token owner");
        
        _transfer(from, to, tokenId);
    }
    function payRoyalties(address artist) public payable{
        payable(artist).transfer(royaltiesAmount);
    }
}