
const { ethers } = require('ethers');
//require('dotenv').config(); // if use .env file for environment variables

const pk = process.env.AUTHORITY_PK;  // Private key should be hidden

const Chains = {
    "121224": {
        name: "Fushuma",
        coin: "FUMA",
        bridge: "0x7304ac11BE92A013dA2a8a9D77330eA5C1531462",
        rpc: "https://rpc.fushuma.com/",
        confirmations: 64,
    },
    "137": {
        name: "Polygon",
        coin: "POL",
        bridge: "0x7304ac11BE92A013dA2a8a9D77330eA5C1531462",
        rpc: "https://polygon-rpc.com/",
        confirmations: 300,
    },
    "56": {
        name: "Binance Smart Chain",
        coin: "BNB",
        bridge: "0x7304ac11BE92A013dA2a8a9D77330eA5C1531462",
        rpc: "https://bsc-dataseed.binance.org/",
        confirmations: 3,
    },
    "1": {
        name: "Ethereum",
        coin: "ETH",
        bridge: "0x7304ac11BE92A013dA2a8a9D77330eA5C1531462",
        rpc: "https://eth.drpc.org",
        confirmations: 4,
    },
    "130": {
        name: "Unichain",
        coin: "ETH",
        bridge: "0x7304ac11BE92A013dA2a8a9D77330eA5C1531462",
        rpc: "https://mainnet.unichain.org",
        confirmations: 600,
    },
    "42161": {
        name: "Arbitrum",
        coin: "ETH",
        bridge: "0x7304ac11BE92A013dA2a8a9D77330eA5C1531462",
        rpc: "https://arbitrum-one-rpc.publicnode.com",
        confirmations: 1200,
    },
    "8453": {
        name: "Base",
        coin: "ETH",
        bridge: "0x7304ac11BE92A013dA2a8a9D77330eA5C1531462",
        rpc: "https://mainnet.base.org",
        confirmations: 300,
    },
    /*"820": {
        name: "Callisto",
        coin: "CLO",
        bridge: "0xA2Db85A43a443cAcCD176AaDE36c5980B9d2E643",
        rpc: "https://rpc.callistodao.org/",
        confirmations: 64,
    },*/
};

const bridgeV2ABI = [
    "event Deposit(address indexed originalToken, uint256 originalChainID, address indexed token, address indexed receiver, uint256 value, uint256 toChainId)",
    "event BridgeToContract(address indexed originalToken, uint256 originalChainID, address indexed token, address indexed receiver, uint256 value, uint256 toChainId, address toContract, bytes data)",
    "function getToken(address nativeToken) external view returns (tuple(address token, uint256 chainID, address wrappedToken, address authority) tokenInfo)",
];

/*
// Test function
// Call this function to test the code
test();
async function test() {
    var resp = "";
    resp = await authorize("0x5dc0bdea37f75fd62cc2c5920f6c6b009b9de0ce3065a83bfdf1af96ff508f4a", "820");    // bridgeToContract
    console.log(resp);
    resp = await authorize("0x876c3b158a6e95005c2a3331a8d3849d3fbb3ebefd3966c5c9f93605c41aeed4", "820");    // depositTokens
    console.log(resp);
    resp = await addToken("0x0000000000000000000000000000000000000001", "121224");
    console.log(resp);
    //resp = JSON.stringify(resp)
}
*/

// call this function to get authorization signature
// params: txId = deposit transaction hash, fromChainId = chain ID where transaction was sent.
// returns: on success {isSuccess: true, signature: sig, ...};
// on error: {isSuccess: false, message: error_message}; 
async function authorize(txId, fromChainId) {
    if (!Chains.hasOwnProperty(fromChainId)) {
        let msg = "Chain ID:" + fromChainId + " is not supported";
        //console.log(msg);
        return {isSuccess: false, message: msg};
    }
    const rpc = Chains[fromChainId].rpc;
    const bridgeContract = Chains[fromChainId].bridge;
    const blockConfirmations = Chains[fromChainId].confirmations;    

    if (!bridgeContract) {
        let msg = "No bridgeContract for chain ID:" + fromChainId;
        //console.log(msg);
        return {isSuccess: false, message: msg};
    }
    if (!rpc) {
        let msg = "No rpc for chain ID:" + fromChainId;
        //console.log(msg);
        return {isSuccess: false, message: msg};
    }
    const provider = new ethers.JsonRpcProvider(rpc);
    var lastBlock = await provider.getBlockNumber();
    const iface = new ethers.Interface(bridgeV2ABI);
    return provider.getTransactionReceipt(txId)
    .then(async receipt => {
        if (receipt && receipt.status) {
            if (lastBlock - receipt.blockNumber < blockConfirmations) { // require at least 12 confirmation
                let msg = "Confirming: " + (lastBlock - receipt.blockNumber) + " of " + blockConfirmations;
                console.log(msg);
                return {isSuccess: false, message: msg};
            }
            for (var i = 0; i < receipt.logs.length; i++) {
                let element = receipt.logs[i];
                if (BigInt(element.address) != BigInt(bridgeContract) || element.transactionHash != txId) continue; // skip if not bridge contract
                var messageHash = "";
                var ret;
                if (element.topics[0] == "0xc9e84ed7aa56cf1771d0373f4b6380ccc9c7cdae154f287abf95c48f72e7f0cf")  // Deposit
                {
                    let p = iface.parseLog(element).args;
                    //console.log(p);
                    let toBridge = Chains[p.toChainId].bridge;
                    messageHash = ethers.solidityPackedKeccak256(
                        ["address", "uint256", "address", "uint256", "bytes32", "uint256", "uint256", "address"], 
                        [p.originalToken, p.originalChainID, p.receiver, p.value, txId, fromChainId, p.toChainId, toBridge]
                    );
                    ret = {
                        isSuccess: true,
                        originalToken: p.originalToken,
                        originalChainID: p.originalChainID.toString(),
                        value: p.value.toString(),
                        to: p.receiver,
                        chainId: p.toChainId.toString(),
                        bridge: toBridge
                    };
                } else if (element.topics[0] == "0xeaa11317bb61110cf1035a22a7b6b4c716b909b47954d51ee13de1627fdf0f50")   // BridgeToContract
                {
                    let p = iface.parseLog(element).args;
                    //console.log(p);
                    let toBridge = Chains[p.toChainId].bridge;
                    messageHash = ethers.solidityPackedKeccak256(
                        ["address", "uint256", "address", "uint256", "bytes32", "uint256", "uint256", "address", "address", "bytes"], 
                        [p.originalToken, p.originalChainID, p.receiver, p.value, txId, fromChainId, p.toChainId, toBridge, p.toContract, p.data]
                    );
                    ret = {
                        isSuccess: true,
                        originalToken: p.originalToken,
                        originalChainID: p.originalChainID.toString(),
                        value: p.value.toString(),
                        to: p.receiver,
                        chainId: p.toChainId.toString(),
                        toContract: p.toContract,
                        data: p.data,
                        bridge: toBridge
                    };
                }
                if (messageHash != "") {    // sign message
                    const wallet = new ethers.Wallet(pk);
                    const sig = await wallet.signMessage(ethers.getBytes(messageHash));
                    ret.signature = sig;
                    //console.log(ret);
                    return ret;                    
                }
            }
        }
        let msg = "Wrong transaction hash:" + txId;
        console.log(msg);
        return {isSuccess: false, message: msg};   
    })
    .catch(err => {
        console.log(err);
        return {isSuccess: false, message: err.toString()};
    })
}

// call this function to add token to the bridge
// params: token = original token address, chainId = chain ID of original token
// returns: on success {isSuccess: true, signature: sig, ...};
// on error: {isSuccess: false, message: error_message}; 
async function addToken(token, chainId) {
    if (!Chains.hasOwnProperty(chainId)) {
        let msg = "Chain ID:" + chainId + " is not supported";
        //console.log(msg);
        return {isSuccess: false, message: msg};
    }
    try {
        const rpc = Chains[chainId].rpc;
        const bridgeContract = Chains[chainId].bridge;
        const provider = new ethers.JsonRpcProvider(rpc);
        const contract = new ethers.Contract(bridgeContract, bridgeV2ABI, provider);
        var name = "";
        var symbol = "";
        var decimals;
        if (BigInt(token) == 1n) {
            //native coin
            name = Chains[chainId].coin;
            symbol = Chains[chainId].coin;
            decimals = 18;
        } else {
            // get token info
            const r = await contract.getToken(token);
            if (BigInt(r.token) == BigInt(token) && r.chainID == BigInt(chainId) && BigInt(r.wrappedToken) == 0n) {
                const tokenContract = new ethers.Contract(token, ["function name() view returns (string)", "function symbol() view returns (string)", "function decimals() view returns (uint8)"], provider);
                name = await tokenContract.name();
                symbol = await tokenContract.symbol();
                decimals = await tokenContract.decimals();
            } else {
                return {isSuccess: false, message: "Incorrect original token address or chainId or token is wrapped. Select chain where original token is located."};
            }
        }
        if(symbol == "" || name == "") {
            return {isSuccess: false, message: "Failed to get token name or symbol"};
        }
        const messageHash = ethers.solidityPackedKeccak256(
            ["address", "uint256", "uint256", "string", "string"], 
            [token, chainId, decimals, name, symbol]
        );
        const wallet = new ethers.Wallet(pk);
        const sig = await wallet.signMessage(ethers.getBytes(messageHash));
        return {
            isSuccess: true,
            signature: sig,
            name: name,
            symbol: symbol,
            decimals: decimals.toString()
        };

    } catch (err) {
        console.log(err);
        return {isSuccess: false, message: err.toString()};
    }
}

module.exports = {authorize, addToken};
