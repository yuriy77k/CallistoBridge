# NFT bridge

## Documentation 

### Adding NFT contract to the bridge

Only bridge owner can add NTF contract to the bridge (create pair).

On the chain of origin NFT contract should be called function `createPair`:
https://github.com/yuriy77k/CallistoBridge/blob/634afecadc6c6d8e9dbf09b227eb52ea15c6c951/contracts/BridgeNFT.sol#L555-L562

On destination chain should be called function `createWrappedHybrid`:
https://github.com/yuriy77k/CallistoBridge/blob/634afecadc6c6d8e9dbf09b227eb52ea15c6c951/contracts/BridgeNFT.sol#L526-L536

Notes about parameter `nonce`: if we will use here `uint256(address(NFT_origen_contract))` we will get identical address of wrapped NFT on different chains.

For example: let's say original NFT contract has `address A`. We want to create wrapped NFT for this contract on `chain 1` and `chain 2`. So, if we will use `address A` as `nonce` then wrapped NFT contract will have `address B` on both chains (`chain 1` and `chain 2`).

### Deposit tokens

To swap tokens from one chain to another, a user calls the function [depositNFT()](https://github.com/yuriy77k/CallistoBridge/blob/634afecadc6c6d8e9dbf09b227eb52ea15c6c951/contracts/BridgeNFT.sol#L598-L603). 
```Solidity
    function depositNFT(
        address receiver,   // address of token receiver on destination chain
        address token,      // NFT token that user send
        uint256 tokenId,    // token ID
        uint256 toChainId   // destination chain Id where will be claimed tokens
    ) 
        external
        payable
        notFrozen
```

The event [Deposit(address token, address sender, uint256 tokenId, uint256 toChainId, address toToken)](https://github.com/yuriy77k/CallistoBridge/blob/634afecadc6c6d8e9dbf09b227eb52ea15c6c951/contracts/BridgeNFT.sol#L320) will be emitted, where:
- `address token` - token address (if address < 32, then it's native coin).
- `address sender` - the wallet address who sends tokens (only the same address may receive tokens on another chain).
- `uint256 tokenId` - NFT token ID.
- `uint256 toChainId` - chain ID where a user can claim tokens
- `address toToken` - token address on the destination chain that user will claim.

On destination chain user will receive NFT token with thw same ID as was deposited.

### Claim tokens


To get authority signature a UI has to call Authority server (servers) [server/authNFT?tx=&chain=<from_chain_id>](https://tyb7cgiwasnoqxybhv42hxcree0rlqdc.lambda-url.us-west-2.on.aws/authNFT?tx=0x74f52d21780e229217d3a4e936ca9305912e25d763d652884e56f0c4327c655a&chain=97), where: 
- `<transaction_hash>` - deposit transaction ID (hash) 
- `<from_chain_id>` - chain ID where deposited.

it returns JSON, where:
* if all good:
  * `isSuccess` - true,
  * `signature` - authority signature,
  * `token` - token to receive,
  * `value` - NFT token ID,
  * `to`- receiver (user's) address,
  * `chainId` - chain ID where to claim token,
  * `bridge` - address of bridge on destination network.

* in case of error: 
  * `isSuccess` - false,
  * `message` - error description

Use those values to claim tokens on destination chain, the user calls the function [claim()](https://github.com/yuriy77k/CallistoBridge/blob/634afecadc6c6d8e9dbf09b227eb52ea15c6c951/contracts/BridgeNFT.sol#L645-L655)
```Solidity
    function claim(
        address token,          // NFT token contract address to receive
        bytes32 txId,           // deposit transaction hash on fromChain 
        address to,             // user address
        uint256 tokenId,        // NFT token ID
        uint256 fromChainId,    // chain ID where user deposited
        bytes[] memory sig      // authority signatures
    ) 
        external
        notFrozen 
```

### Get info of origin NFT

Users or dapps can read from wrapped NFT contract information about origen NFT contract using function [nftOrigin()](https://github.com/yuriy77k/CallistoBridge/blob/634afecadc6c6d8e9dbf09b227eb52ea15c6c951/contracts/ERC721CallistoNFTHybrid_implementation.sol#L846-L851) which returns structure:
```Solidity
    struct OriginNFT {
        address contractAddress;    // Origin NFT contract address
        uint256 chainID;            // Origin NFT contract chain ID
    }
```

## Testnet contracts

### Fushuma

- bridge NFT (proxy): https://fumascan.com/address/0xaA35d9D9DbfcE3D50bc94Cc7DE62d06e62A54569?tab=write_proxy_contract
- HybridNFT implementation: https://fumascan.com/address/0x9e87125e851f9f435609b5c12296f9b317a5F248?tab=contract
- bridge implementation: https://fumascan.com/address/0x5A4e9d0fa6a2F29af5c46C93b7e1464794f64e0D?tab=contract

### Callisto test net

- bridge NFT [0xe96E157d994300B50073559820Fe49a015ecEf1E](https://testnet-explorer.callisto.network/address/0xe96E157d994300B50073559820Fe49a015ecEf1E/transactions)
- HybridNFT implementation `0x389d03eBbdAa8987cA3e9Fdc4c81E274dFfb78BA`
- bridge implementation `0xdB8Ba688ED4E34cE680e83830198967DDf058074`

### BSC testnet

- bridge NFT [0x5E4BC70Df60FFBBab1290bD40d87aa095230A97e](https://testnet.bscscan.com/address/0x5e4bc70df60ffbbab1290bd40d87aa095230a97e#writeProxyContract)
- HybridNFT implementation `0x4e36e5130eeBbdD22515683aad3Fab0662897429`
- bridge implementation `0x095dBcd62B03CC7e930c06849266EbE5C485fcEb`

### test NFT tokens

- BSC test ERC721 token (BTN) [0x3dB12B9F2e1e9E2F83D242Fa6954471A0c6AdE76](https://testnet.bscscan.com/address/0x3db12b9f2e1e9e2f83d242fa6954471a0c6ade76#code)
- wrapped wBTN token on Callisto testnet [0xcca192725ff511d630d3126fd3e23c9d8acfe0aa](https://testnet-explorer.callisto.network/address/0xcca192725ff511d630d3126fd3e23c9d8acfe0aa/transactions)


- Callisto test ERC721 token (tNFT) [0x26439d6cD27783E75C9d0B27b187D6ED4991eC22](https://testnet-explorer.callisto.network/address/0x26439d6cD27783E75C9d0B27b187D6ED4991eC22/transactions)
-  wrapped wtNFT token on BSC testnet [0xCcd99a7221C82735B40231e4359F0Ab76fad366d](https://testnet.bscscan.com/address/0xccd99a7221c82735b40231e4359f0ab76fad366d#code)

## Authority

Authorities endpoints are:

1. `https://tyb7cgiwasnoqxybhv42hxcree0rlqdc.lambda-url.us-west-2.on.aws/authNFT?` 


Use authority endpoint + `tx=` + transaction hash + `&chain=` + chain ID where transaction was sent

For example: 
https://tyb7cgiwasnoqxybhv42hxcree0rlqdc.lambda-url.us-west-2.on.aws/authNFT?tx=0x74f52d21780e229217d3a4e936ca9305912e25d763d652884e56f0c4327c655a&chain=97
