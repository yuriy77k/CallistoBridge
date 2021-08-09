# CallistoBridge

## Description

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

## CLO test net
[Bridge](https://testnet-explorer.callisto.network/address/0x6664fD73ed95CF608B5e461A6cE89212F989EdCA/contracts) `0x6664fD73ed95CF608B5e461A6cE89212F989EdCA`

[Token implementation](https://testnet-explorer.callisto.network/address/0xa89f3920D5F4B333d783C9cac33E13A26C78bc2b/contracts) `0xa89f3920D5F4B333d783C9cac33E13A26C78bc2b`


## BSC test net
[Bridge](https://testnet.bscscan.com/address/0x05ef4b789c75c02d5182e6efb7c64230ec9b58b2#code) `0x05ef4B789C75c02d5182e6EfB7c64230Ec9B58b2`

[Token implementation](https://testnet.bscscan.com/address/0x57a40032d14755b9e481584c51b8ef59e93120be#code) `0x57a40032d14755B9e481584C51b8eF59e93120bE`

[wrapped CLO token](https://testnet.bscscan.com/address/0xbf48dca064ac248ba2096fb7e5f41724322942e9#code) `0xBf48DCa064aC248Ba2096Fb7e5F41724322942E9`
