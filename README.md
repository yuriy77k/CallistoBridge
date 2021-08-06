# CallistoBridge

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


Use `signature`, `token`, `value`, `to` to call function [claimMultiSig]() it the `bridge` contract on destination network

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

Each authority script has own private key that stored in [environment]() (`.env`). 

To get transaction events the script use [public RPC](). There is a risk of compromising a public site and providing malicious data.

Therefore, I highly recommend to use local node instead of public RPC or, at least, use different public RPC for different authority script.

## CLO test net
[Bridge](https://testnet-explorer.callisto.network/address/0x6664fD73ed95CF608B5e461A6cE89212F989EdCA/contracts) `0x6664fD73ed95CF608B5e461A6cE89212F989EdCA`

[Token implementation](https://testnet-explorer.callisto.network/address/0xa89f3920D5F4B333d783C9cac33E13A26C78bc2b/contracts) `0xa89f3920D5F4B333d783C9cac33E13A26C78bc2b`


## BSC test net
[Bridge](https://testnet.bscscan.com/address/0x05ef4b789c75c02d5182e6efb7c64230ec9b58b2#code) `0x05ef4B789C75c02d5182e6EfB7c64230Ec9B58b2`

[Token implementation](https://testnet.bscscan.com/address/0x57a40032d14755b9e481584c51b8ef59e93120be#code) `0x57a40032d14755B9e481584C51b8eF59e93120bE`

[wrapped CLO token](https://testnet.bscscan.com/address/0xbf48dca064ac248ba2096fb7e5f41724322942e9#code) `0xBf48DCa064aC248Ba2096Fb7e5F41724322942E9`