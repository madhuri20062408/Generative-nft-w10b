// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MyNFT is ERC721, Ownable, ERC2981 {
    using Strings for uint256;

    enum SaleState { Paused, Allowlist, Public }

    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public price = 0.05 ether;
    uint256 public maxPerWallet = 5;

    bytes32 public merkleRoot;
    string public baseURI;
    string public revealedURI;
    bool public isRevealed;
    SaleState public saleState = SaleState.Paused;

    uint256 private _currentId;
    mapping(address => uint256) public walletMintCount;

    error InactiveSale();
    error NotOnAllowlist();
    error ExceedsMaxSupply();
    error ExceedsMaxPerWallet();
    error InsufficientFunds();
    error AlreadyRevealed();
    error WithdrawFailed();

    constructor(
        string memory name,
        string memory symbol,
        string memory initialBaseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        baseURI = initialBaseURI;
        _setDefaultRoyalty(msg.sender, 500); // 5% royalty
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setPrice(uint256 _price) external onlyOwner {
        price = _price;
    }

    function setBaseURI(string calldata _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function setRevealedURI(string calldata _revealedURI) external onlyOwner {
        revealedURI = _revealedURI;
    }

    function setSaleState(SaleState _state) external onlyOwner {
        saleState = _state;
    }

    function reveal() external onlyOwner {
        if (isRevealed) revert AlreadyRevealed();
        isRevealed = true;
    }

    function allowlistMint(bytes32[] calldata merkleProof, uint256 quantity) external payable {
        if (saleState != SaleState.Allowlist) revert InactiveSale();
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        if (!MerkleProof.verify(merkleProof, merkleRoot, leaf)) revert NotOnAllowlist();
        
        _mintInternal(msg.sender, quantity);
    }

    function publicMint(uint256 quantity) external payable {
        if (saleState != SaleState.Public) revert InactiveSale();
        
        _mintInternal(msg.sender, quantity);
    }

    function _mintInternal(address to, uint256 quantity) internal {
        if (_currentId + quantity > MAX_SUPPLY) revert ExceedsMaxSupply();
        if (walletMintCount[to] + quantity > maxPerWallet) revert ExceedsMaxPerWallet();
        if (msg.value < price * quantity) revert InsufficientFunds();

        for (uint256 i = 0; i < quantity; i++) {
            _currentId++;
            _safeMint(to, _currentId);
        }
        walletMintCount[to] += quantity;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);

        if (!isRevealed) {
            return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
        } else {
            return string(abi.encodePacked(revealedURI, tokenId.toString(), ".json"));
        }
    }

    function totalSupply() public view returns (uint256) {
        return _currentId;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        if (!success) revert WithdrawFailed();
    }

    // Overrides required by Solidity
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
