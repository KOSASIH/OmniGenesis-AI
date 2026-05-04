// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title OmniNFT
 * @notice Agent Badges, Pioneer NFTs, and Governance Power NFTs for the OmniGenesis ecosystem
 * @dev ERC-721 with attributes, tiers, and staking power multipliers
 */
contract OmniNFT is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    enum NFTType {
        GENESIS_BADGE,
        PIONEER_PASS,
        QUANTUM_GUARDIAN,
        ECON_MASTER,
        OVERLORD_CROWN,
        INNOVATION_CRYSTAL,
        OMNI_DEITY
    }

    enum Tier { COMMON, RARE, EPIC, LEGENDARY, MYTHIC, GOD_LEVEL }

    struct NFTAttributes {
        NFTType nftType;
        Tier tier;
        uint256 powerScore;
        uint256 stakingMultiplier;
        uint256 governanceWeight;
        uint256 mintedAt;
        uint256 agentId;
        bool soulbound;
    }

    mapping(uint256 => NFTAttributes) public attributes;
    mapping(NFTType => uint256) public typeSupply;
    mapping(NFTType => uint256) public typeMaxSupply;
    mapping(Tier => uint256) public tierBasePower;

    uint256 private _tokenIdCounter;
    uint256 public constant MAX_SUPPLY = 1_000_000;

    event NFTMinted(uint256 indexed tokenId, address indexed to, NFTType nftType, Tier tier, uint256 powerScore);
    event AttributesUpdated(uint256 indexed tokenId, uint256 newPowerScore, uint256 newMultiplier);

    constructor(address admin) ERC721("OmniGenesis NFT", "OMNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        typeMaxSupply[NFTType.GENESIS_BADGE] = 200;
        typeMaxSupply[NFTType.PIONEER_PASS] = 100_000;
        typeMaxSupply[NFTType.QUANTUM_GUARDIAN] = 100;
        typeMaxSupply[NFTType.ECON_MASTER] = 150;
        typeMaxSupply[NFTType.OVERLORD_CROWN] = 150;
        typeMaxSupply[NFTType.INNOVATION_CRYSTAL] = 100;
        typeMaxSupply[NFTType.OMNI_DEITY] = 1;

        tierBasePower[Tier.COMMON] = 100;
        tierBasePower[Tier.RARE] = 500;
        tierBasePower[Tier.EPIC] = 2000;
        tierBasePower[Tier.LEGENDARY] = 10000;
        tierBasePower[Tier.MYTHIC] = 50000;
        tierBasePower[Tier.GOD_LEVEL] = 1_000_000;
    }

    function mint(
        address to,
        NFTType nftType,
        Tier tier,
        string calldata tokenURI_,
        bool soulbound,
        uint256 agentId
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256 tokenId) {
        require(_tokenIdCounter < MAX_SUPPLY, "OmniNFT: max supply");
        uint256 maxS = typeMaxSupply[nftType];
        require(maxS == 0 || typeSupply[nftType] < maxS, "OmniNFT: type cap");

        tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        uint256 multiplier = 100 + uint256(tier) * 50;
        uint256 power = tierBasePower[tier];
        attributes[tokenId] = NFTAttributes({
            nftType: nftType, tier: tier, powerScore: power,
            stakingMultiplier: multiplier, governanceWeight: power / 100,
            mintedAt: block.timestamp, agentId: agentId, soulbound: soulbound
        });
        typeSupply[nftType]++;
        emit NFTMinted(tokenId, to, nftType, tier, power);
    }

    function updateAttributes(uint256 tokenId, uint256 newPowerScore, uint256 newMultiplier) external onlyRole(MINTER_ROLE) {
        attributes[tokenId].powerScore = newPowerScore;
        attributes[tokenId].stakingMultiplier = newMultiplier;
        attributes[tokenId].governanceWeight = newPowerScore / 100;
        emit AttributesUpdated(tokenId, newPowerScore, newMultiplier);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        if (attributes[tokenId].soulbound) {
            require(auth == address(0) || to == address(0), "OmniNFT: soulbound");
        }
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) { super._increaseBalance(account, value); }
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) { return super.tokenURI(tokenId); }
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl) returns (bool) { return super.supportsInterface(interfaceId); }
    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }
}
