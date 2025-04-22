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
- Founder's and Owner's Multisig owners' wallets: 
```Solidity
[
    "0x9e6993DD8CA5C90777CDCf888eA7f54c641a2A4E",
    "0x45FAc82b24511927a201C2cdFC506625dECe3d22",
    "0xC8e420222d4c93355776eD77f9A34757fb6f3eea",
    "0x7152B9A7BD708750892e577Fcc96ea24FDDF37a4"
]
```
- Authorities: 
```Solidity
authorityWallet =
[
    "0x9cF318Cf120F98F1ad82F27041CfD28c9e0c0C9b",
    "0x5047e1df36E80722627D2cccf99006D578FE3797",
    "0x9fd61d384f7caa39C8be1107FfA91dA9F0F9E280",
    "0x3A93976Cf512A6d671358AAC41C91C8D8DB3EAAE"
]
```

- Authorities URL: 
```Solidity
authorityURL =
[
    "https://mrs6x6ew7njwnad27dkhear7ya0tzbjy.lambda-url.eu-north-1.on.aws",
    "https://7iurhujz7zfo4gx65p7ws7wliy0gaexu.lambda-url.eu-north-1.on.aws",
    "https://3jb2sp2i7x27xmcol2qsetcvse0jgtzp.lambda-url.eu-north-1.on.aws",
    "https://hvktatipoqgc74s6su4j3h273i0gaotl.lambda-url.us-east-1.on.aws"
]
```
- Chains ID for `[Fushuma, Polygon, BNB, Ethereum, Unichain, Arbitrum, Base]`:
```Solidity
[
    "121224",
    "137",
    "56",
    "1",
    "130",
    "42161",
    "8453"
]
```
- Bridge deployer address: `0x724253C05366e42bb0F484a0cdf19810862065cD`

1. Deploy `ERC20_implementation` (`0xE42fA5629b7EcDfba39a09C284B153FFA896E862`)
2. Deploy `BridgeV2` (`0x623Ef498161BFabB37EB85Cd8B65230226a54C87`)
3. Deploy multisig wallet for Bridge Owner (`0x4fE48F0a718B00A553f9b8e78E793c522c374b45`)
4. Deploy multisig weller fot Bridge Founder (`0x564F12052cd0e8F988ce531a533ba22598061463`)
5. Deploy `BridgeUpgradeableProxy` (`0x7304ac11BE92A013dA2a8a9D77330eA5C1531462`)
6. Initialize Bridge (proxy)

Deployment cost about 10M gas.

### Deployed contracts

Bridge: `0x7304ac11BE92A013dA2a8a9D77330eA5C1531462` (address is the same on all supported chains).

Contracts deployed on: 
- [Fushuma](https://fumascan.com/address/0x7304ac11BE92A013dA2a8a9D77330eA5C1531462?tab=read_proxy_contract) (chainId: 121224) 
- [Ethereum](https://etherscan.io/address/0x7304ac11be92a013da2a8a9d77330ea5c1531462#readProxyContract) (chainId: 1) 
- [BNB](https://bscscan.com/address/0x7304ac11be92a013da2a8a9d77330ea5c1531462#readProxyContract) (chainId: 56) 
- [Base](https://basescan.org/address/0x7304ac11be92a013da2a8a9d77330ea5c1531462#readProxyContract) (chainId: 8453) 
- [Arbitrum](https://arbiscan.io/address/0x7304ac11be92a013da2a8a9d77330ea5c1531462#readProxyContract) (chainId: 42161) 
- [Polygon](https://polygonscan.com/address/0x7304ac11be92a013da2a8a9d77330ea5c1531462#readProxyContract) (chainId: 137) 
- [Unichain](https://uniscan.xyz/address/0x7304ac11be92a013da2a8a9d77330ea5c1531462#readProxyContract) (chainId: 130) 

Multisigs addresses on all supported chains are the identical:
- Bridge Owner: `0x4fE48F0a718B00A553f9b8e78E793c522c374b45`.
- Bridge Founder `0x564F12052cd0e8F988ce531a533ba22598061463`.


### Authority

## Test deployment
### Fushuma

- Bridge proxy (use to for contract communication): https://fumascan.com/address/0xA2Db85A43a443cAcCD176AaDE36c5980B9d2E643?tab=read_proxy_contract
- Bridge implementation (take ABI from it): https://fumascan.com/address/0x887aB310CE0e2dAbD48f5b6eB49EB51Eb84294a2?tab=contract
- ERC20_implementation: https://fumascan.com/address/0xA17fe5F3F05aa3faCEd8ad95151dd646aE8Da29f?tab=contract

### Callisto

- Bridge proxy (use to for contract communication): https://explorer.callistodao.org/address/0xA2Db85A43a443cAcCD176AaDE36c5980B9d2E643/read-proxy#address-tabs

### Authority
- test Authority `0x9e35ec5917780fBb87f26Bfa470200e1e552df5a` https://rrhlkmpf5kwflojrf3kgigvvvm0drquu.lambda-url.us-west-2.on.aws/
  - Add token: https://rrhlkmpf5kwflojrf3kgigvvvm0drquu.lambda-url.us-west-2.on.aws/addToken?token=0x0000000000000000000000000000000000000001&chain=121224
  - Claim: https://rrhlkmpf5kwflojrf3kgigvvvm0drquu.lambda-url.us-west-2.on.aws/auth?tx=0x876c3b158a6e95005c2a3331a8d3849d3fbb3ebefd3966c5c9f93605c41aeed4&chain=820
  - Claim to contract: https://rrhlkmpf5kwflojrf3kgigvvvm0drquu.lambda-url.us-west-2.on.aws/auth?tx=0x5dc0bdea37f75fd62cc2c5920f6c6b009b9de0ce3065a83bfdf1af96ff508f4a&chain=820
