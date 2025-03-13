# CallistoBridge

## Bridge v1
### Deposit tokens

To swap tokens from one chain to another, a user calls the function [depositTokens()](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/contracts/Bridge.sol#L299-L306). 
```Solidity
    function depositTokens(
        address token,      // token that user send (if token address < 32, then send native coin)
        uint256 value,      // tokens value
        uint256 toChainId   // destination chain Id where will be claimed tokens
    ) 
        external
        payable
        notFrozen
```

The event [Deposit(address token, address sender, uint256 value, uint256 toChainId, address toToken)](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/contracts/Bridge.sol#L182) will be emitted, where:
- `address token` - token address (if address < 32, then it's native coin).
- `address sender` - the wallet address who sends tokens (only the same address may receive tokens on another chain).
- `uint256 value` - amount of tokens.
- `uint256 toChainId` - chain ID where a user can claim tokens/
- `address toToken` - token address on the destination chain that user will claim.

### Claim tokens


To get authority signature a user has to call Authority server [function authorize(txId, fromChainId)](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/server/authority.js#L80), where: 
- `txId` - deposit transaction ID (hash) 
- `fromChainId` - chain ID where deposited.

it returns JSON, where:
* if all good:
  * `isSuccess` - true,
  * `signature` - authority signature,
  * `token` - token to receive,
  * `value` - tokens amount,
  * `to`- receiver (user's) address,
  * `chainId` - chain ID where to claim token,
  * `bridge` - address of bridge on destination network.

* in case of error: 
  * `isSuccess` - false,
  * `message` - error description

Use those values to claim tokens on destination chain, the user calls the function [claimMultiSig()](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/contracts/Bridge.sol#L344-L353)
```Solidity
    function claimMultiSig(
        address token,          // token to receive
        bytes32 txId,           // deposit transaction hash on fromChain 
        address to,             // user address
        uint256 value,          // value of tokens
        uint256 fromChainId,    // chain ID where user deposited
        bytes[] calldata sig    // authority signatures
    ) 
```

### Create wrapped token

To created wrapped token the `owner` has to get `nonce` from function [calculateNonce()](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/contracts/Bridge.sol#L257) then using this `nonce` calls the function [createWrappedToken()](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/contracts/Bridge.sol#L269-L278)
```Solidity
    function createWrappedToken(
        address fromToken,      // foreign token address
        uint256 fromChainId,    // foreign chain ID where token deployed
        string memory name,     // wrapped token name
        string memory symbol,   // wrapped token symbol
        uint8 decimals,         // wrapped token decimals (should be the same as in original token)
        uint256 nonce           // nonce to create wrapped token address begin with 0xCC.... 
    )
        external
        onlyOwner
```

On native token's chain the `owner` calls function [createPair(address toToken, address fromToken, uint256 fromChainId)](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/contracts/Bridge.sol#L292), where:
- `toToken` - address of token contract on native chain.
- `fromToken` - address of wrapped token on foreign chain.
- `fromChainId` - foreign chain ID.

### Security settings

1. Only `owner` can set/remove authority address, using function [setAuthority()](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/contracts/Bridge.sol#L219).
2. Only `owner` can set threshold (numbers of authority required to approve swap), using function [setThreshold()](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/contracts/Bridge.sol#L249-L250).
3. The `owner` or any `authority` can [freeze](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/contracts/Bridge.sol#L206) the Bridge contract in case of anomaly detection (anomaly detection module is not implemented).
4. Only `owner` can [unfreeze](https://github.com/yuriy77k/CallistoBridge/blob/c5d066799821b87e260e45decf1bc40659ef573f/contracts/Bridge.sol#L213) contract.




## Server setup

Import `authority.js` module in server app using: 
`const auth = require("./authority.js");`

Call function `auth.authorize(txId, fromChainId)`, where:
* `txId` - transaction hash, 
* `fromChainId` - chain ID where transaction was sent.


returns JSON string, where:
* if all good:
  * `isSuccess` - true,
  * `signature` - authority signature,
  * `token` - token to receive,
  * `value` - tokens amount,
  * `to`- receiver (user's) address,
  * `chainId` - chain ID where to claim token,
  * `bridge` - address of bridge on destination network.

* in case of error: 
  * `isSuccess` - false,
  * `message` - error description


Use `signature`, `token`, `value`, `to` to call function [claimMultiSig](https://github.com/yuriy77k/CallistoBridge/blob/5b4c6bef3415ff643e0f7b22f80470faf002f45e/contracts/Bridge.sol#L345-L352) it the `bridge` contract on destination network

### Example
```js
    auth.authorize(txId, fromChainId)
    .then(resp => {
        response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
        response.end(JSON.stringify(resp));

    })
    .catch(err => {
        response.writeHead(404, {'Content-Type': 'text/html'});
        response.end(err.toString());            
    })
```

## Authority server security

Each authority script has own private key that stored in [environment](https://github.com/yuriy77k/CallistoBridge/blob/5b4c6bef3415ff643e0f7b22f80470faf002f45e/server/authority.js#L47) (`.env`). 

To get transaction events the script use [public RPC](https://github.com/yuriy77k/CallistoBridge/blob/5b4c6bef3415ff643e0f7b22f80470faf002f45e/server/authority.js#L59-L64). There is a risk of compromising a public site and providing malicious data.

Therefore, I highly recommend to use local node instead of public RPC or, at least, use different public RPC for different authority script.

# Bridge deployed

Bridge contract address on all chains `0x9a1fc8C0369D49f3040bF49c1490E7006657ea56`
- [CLO bridge](https://explorer.callisto.network/address/0x9a1fc8C0369D49f3040bF49c1490E7006657ea56/write-proxy)
- [BSC bridge](https://bscscan.com/address/0x9a1fc8c0369d49f3040bf49c1490e7006657ea56#writeProxyContract) (toToken - native token)
- [ETH bridge](https://etherscan.io/address/0x9a1fc8C0369D49f3040bF49c1490E7006657ea56#writeProxyContract) (toToken - native token)
- [ETC bridge](https://blockscout.com/etc/mainnet/address/0x9a1fc8C0369D49f3040bF49c1490E7006657ea56#writeProxyContract) (toToken - native token)
- [BTTC bridge](https://bttcscan.com/address/0x9a1fc8c0369d49f3040bf49c1490e7006657ea56) (toToken - native token)
- [Polygon bridge](https://polygonscan.com/address/0x9a1fc8c0369d49f3040bf49c1490e7006657ea56#writeProxyContract)

### Multisig
- Owners Multisig [0x6A56D0f7498C9f2AEb9Bb6892Ade5b2E0A50379F](https://explorer.callisto.network/address/0x6A56D0f7498C9f2AEb9Bb6892Ade5b2E0A50379F/contracts)
- Founders Multisig [0x447c143620A4555c8aEb1596fb013ea84e7DbC03](https://explorer.callisto.network/address/0x447c143620A4555c8aEb1596fb013ea84e7DbC03/contracts)

### Claimer

- https://bridge01.callisto.network/claim?tx=0x2dc54873cd96d25ccc000f90e71bc0239b1c7437e54ab90ed2b73c8e2e589260&chain=820
- [0x91a93225332fa3e0e888d6dce9ea26ed3fc59bc8](https://explorer.callisto.network/address/0x91A93225332fa3e0e888D6dCE9ea26Ed3Fc59bc8/transactions)

### Authority

- https://srs27mbzuopehskfhvkdrdjwqi0qpjxk.lambda-url.us-west-2.on.aws/auth?tx=0x8dd267b036cdb3d3cabdf344f6ac599c0d9f4ed513024aac83c0a663673bed29&chain=56
- https://bridge01.callisto.network/auth?tx=0x8dd267b036cdb3d3cabdf344f6ac599c0d9f4ed513024aac83c0a663673bed29&chain=56
- https://nrc6gwlqvajn4umvmcqurtni240usuqm.lambda-url.us-east-2.on.aws/auth?tx=0x8dd267b036cdb3d3cabdf344f6ac599c0d9f4ed513024aac83c0a663673bed29&chain=56

## CLO test net
[Bridge](https://testnet-explorer.callisto.network/address/0xE1AF7a91EBC36E66D89a6201680dC5242796b246/contracts) `0xE1AF7a91EBC36E66D89a6201680dC5242796b246`

[Bridge implementation](https://testnet-explorer.callisto.network/address/0x6bae44aa40df48204337Df2ED580a0FC2642dE1B/contracts) `0x6bae44aa40df48204337Df2ED580a0FC2642dE1B`

[Token implementation](https://testnet-explorer.callisto.network/address/0xa89f3920D5F4B333d783C9cac33E13A26C78bc2b/contracts) `0xa89f3920D5F4B333d783C9cac33E13A26C78bc2b`


## BSC test net
[Bridge](https://testnet.bscscan.com/address/0x3777c0b1cbfc65743149d5559db0bc199b7c647c#code) `0x3777c0b1CBFC65743149D5559db0bC199B7C647c`

[Bridge implementation](https://testnet.bscscan.com/address/0xe0553dcf6e9dc1e8097420b8dac26afe3e57a0c3#code) `0xe0553dcf6e9dc1e8097420b8dac26afe3e57a0c3`

[Token implementation](https://testnet.bscscan.com/address/0x57a40032d14755b9e481584c51b8ef59e93120be#code) `0x57a40032d14755B9e481584C51b8eF59e93120bE`

[wrapped CLO token](https://testnet.bscscan.com/address/0xccea50dda26f141fcc41ad7e94755936d8c57e28#code) `0xCCEA50dDA26F141Fcc41Ad7e94755936d8C57e28`

## ETH Kovan test net
[Bridge](https://kovan.etherscan.io/address/0x9b5e4b10b405cd5cd4b056a1b57c1c653379db3c#code) `0x9b5e4b10b405cd5cd4b056a1b57c1c653379db3c`

[Bridge implementation](https://kovan.etherscan.io/address/0x6664fd73ed95cf608b5e461a6ce89212f989edca#code) `0x6664fd73ed95cf608b5e461a6ce89212f989edca`

[Token implementation](https://kovan.etherscan.io/address/0x06c0d53112b522c2caa0b150dc431386ceec0cf0#code) `0x06c0d53112b522c2caa0b150dc431386ceec0cf0`

[wrapped CLO token](https://kovan.etherscan.io/address/0xcc48d2250b55b82696978184e75811f1c0ef383f#code) `0xcc48d2250b55b82696978184e75811f1c0ef383f`

### BNB main net
[Bridge](https://bscscan.com/address/0x9a1fc8C0369D49f3040bF49c1490E7006657ea56#code) `0x9a1fc8C0369D49f3040bF49c1490E7006657ea56`

[wrapped CLO token `ccCLO`](https://bscscan.com/address/0xCcbf1C9E8b4f2cDF3Bfba1098b8f56f97d219D53#code) `0xCcbf1C9E8b4f2cDF3Bfba1098b8f56f97d219D53`

### ETH main net
[Bridge](https://etherscan.io/address/0x9a1fc8C0369D49f3040bF49c1490E7006657ea56#code) `0x9a1fc8C0369D49f3040bF49c1490E7006657ea56`

[wrapped CLO token `ccCLO`](https://etherscan.io/address/0xCcbf1C9E8b4f2cDF3Bfba1098b8f56f97d219D53#code) `0xCcbf1C9E8b4f2cDF3Bfba1098b8f56f97d219D53`

### ETC main net
[Bridge](https://blockscout.com/etc/mainnet/address/0x9a1fc8C0369D49f3040bF49c1490E7006657ea56#code) `0x9a1fc8C0369D49f3040bF49c1490E7006657ea56`

[wrapped CLO token `ccCLO`](https://blockscout.com/etc/mainnet/address/0xCcbf1C9E8b4f2cDF3Bfba1098b8f56f97d219D53#code) `0xCcbf1C9E8b4f2cDF3Bfba1098b8f56f97d219D53`

### CLO main net
[Bridge](https://explorer.callisto.network/address/0x9a1fc8C0369D49f3040bF49c1490E7006657ea56#code) `0x9a1fc8C0369D49f3040bF49c1490E7006657ea56`

[wrapped BNB token `ccBNB`](https://explorer.callisto.network/address/0xcCDe29903E621Ca12DF33BB0aD9D1ADD7261Ace9#code) `0xcCDe29903E621Ca12DF33BB0aD9D1ADD7261Ace9`

[wrapped ETH token `ccETH`](https://explorer.callisto.network/address/0xcC208c32Cc6919af5d8026dAB7A3eC7A57CD1796#code) `0xcC208c32Cc6919af5d8026dAB7A3eC7A57CD1796`

[wrapped ETC token `ccETC`](https://explorer.callisto.network/address/0xCCc766f97629a4E14b3af8C91EC54f0b5664A69F#code) `0xCCc766f97629a4E14b3af8C91EC54f0b5664A69F`

#### old ERC20 tokens (should migrate to new ERC223)

[wrapped BNB token `ccBNB`](https://explorer.callisto.network/address/0xCC78D0A86B0c0a3b32DEBd773Ec815130F9527CF#code) `0xCC78D0A86B0c0a3b32DEBd773Ec815130F9527CF`

[wrapped ETH token `ccETH`](https://explorer.callisto.network/address/0xcC00860947035a26Ffe24EcB1301ffAd3a89f910#code) `0xcC00860947035a26Ffe24EcB1301ffAd3a89f910`
