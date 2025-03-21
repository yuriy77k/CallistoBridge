# Bridge v2
## Description

### Deposit tokens

To swap tokens from one chain to another, a user calls the function `depositTokens()`. 
```Solidity
    function depositTokens(
        address receiver,   // address of token receiver on destination chain
        address token,      // token that user send (if token address < 32, then send native coin)
        uint256 value,      // tokens value
        uint256 toChainId   // destination chain Id where will be claimed tokens
    ) 
        external
        payable
```

This function is the same as in v1.

### Bridge to contract

Move tokens through the bridge and call the contract with 'data' parameters on the destination chain

```Solidity
    function bridgeToContract(
        address receiver, // address of token receiver on destination chain
        address token, // token that user send (if token address < 32, then send native coin)
        uint256 value, // tokens value
        uint256 toChainId, // destination chain Id where will be claimed tokens
        address toContract, // this contract will be called on destination chain
        bytes memory data // this data will be passed to contract call (ABI encoded parameters)
    ) external payable notFrozen 
```

This function is the same as in v1.

### Claim tokens

Claim tokens from the bridge.

```Solidity
    function claim(
        address originalToken, // original token
        uint256 originalChainID, // original chain ID
        bytes32 txId, // deposit transaction hash on fromChain
        address to, // user address
        uint256 value, // value of tokens
        uint256 fromChainId, // chain ID where user deposited
        bytes[] memory sig // authority signatures
    ) external 
```

Difference from v1 is in the  first two parameters: 
- `originalToken` - is an address of original token (not wrapped by bridge) that we want to use. 
- `originalChainID` - chain ID where original token contract deployed.

For example, if we want to work with the `SOY` token that is exist on Callisto chain, then we should use `SOY` token contract address and Callisto chain ID, independent of chain where we call this function.

### Claim to contract

Claim tokens from the bridge and call the contract with 'data' parameters
```Solidity
    function claimToContract(
        address originalToken, // original token
        uint256 originalChainID, // original chain ID
        bytes32 txId, // deposit transaction hash on fromChain
        address to, // receiver address
        uint256 value, // value of tokens
        uint256 fromChainId, // chain ID where user deposited
        address toContract, // this contract will be called on destination chain
        bytes memory data, // this data will be passed to contract call (ABI encoded parameters)
        bytes[] memory sig // authority signatures
    ) external
```

Difference from v1 is in the  first two parameters: 
- `originalToken` - is an address of original token (not wrapped by bridge) that we want to use. 
- `originalChainID` - chain ID where original token contract deployed.

For example, if we want to work with the `SOY` token that is exist on Callisto chain, then we should use `SOY` token contract address and Callisto chain ID, independent of chain where we call this function.

### Add token

Allow anybody to add new token (original) to the bridge.

```Solidity
    function addToken(
        address token   // token contract address to add to the bridge
    ) external 
```

### Add wrapped token 

Allow to create bridge between original token, that was added by function `addToken()` and new created wrapped token on the current chain.

```Solidity
    function addWrappedToken(
        address token, // original token address
        uint256 chainID, // original token chain ID
        uint256 decimals, // original token decimals
        string calldata name, // original token name
        string calldata symbol, // original token symbol
        bytes[] memory sig // authority signatures
    ) external
```

For example: let's there is DAI token on ETH chain and we wants to create bridge to BSC and Callisto.
1. On Ethereum chain we call function `addToken(address_of_DAI_token)`;
2. On BSC and Callisto chain we call function `addWrappedToken()` with parameters according token on Ethereum chain (token address, chain Id, decimals, name, symbol).


## Deployment 
- On all supported chains: `0xA2Db85A43a443cAcCD176AaDE36c5980B9d2E643` (deployed in the second transaction from wallet `0x851bE0807823c7667Cd04971CaF758Bd14eb002D`)
- Founder's and Owner's Multisig wallets should be deployed prior.
1. Deploy `BridgeV2`
2. Deploy `BridgeUpgradeableProxy`

### Fushuma

- Bridge proxy (use to for contract communication): https://fumascan.com/address/0xA2Db85A43a443cAcCD176AaDE36c5980B9d2E643?tab=read_proxy_contract
- Bridge implementation (take ABI from it): https://fumascan.com/address/0x887aB310CE0e2dAbD48f5b6eB49EB51Eb84294a2?tab=contract
- ERC20_implementation: https://fumascan.com/address/0xA17fe5F3F05aa3faCEd8ad95151dd646aE8Da29f?tab=contract

### Callisto

- Bridge proxy (use to for contract communication): https://explorer.callistodao.org/address/0xA2Db85A43a443cAcCD176AaDE36c5980B9d2E643/read-proxy#address-tabs

## Authority
- test Authority `0x9e35ec5917780fBb87f26Bfa470200e1e552df5a` https://rrhlkmpf5kwflojrf3kgigvvvm0drquu.lambda-url.us-west-2.on.aws/
  - Add token: https://rrhlkmpf5kwflojrf3kgigvvvm0drquu.lambda-url.us-west-2.on.aws/addToken?token=0x0000000000000000000000000000000000000001&chain=121224
  - Claim: https://rrhlkmpf5kwflojrf3kgigvvvm0drquu.lambda-url.us-west-2.on.aws/auth?tx=0x876c3b158a6e95005c2a3331a8d3849d3fbb3ebefd3966c5c9f93605c41aeed4&chain=820
  - Claim to contract: https://rrhlkmpf5kwflojrf3kgigvvvm0drquu.lambda-url.us-west-2.on.aws/auth?tx=0x5dc0bdea37f75fd62cc2c5920f6c6b009b9de0ce3065a83bfdf1af96ff508f4a&chain=820
