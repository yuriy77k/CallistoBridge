//const AWS = require('aws-sdk')
// Create client outside of handler to reuse
//const lambda = new AWS.Lambda()

const blockConfirmations = {
    "20729" : 1, // CLO test net
    "820" : 64, // CLO main net
    "97" : 1,  // BSC test net
    "56" : 3,  // BSC main net
    "1"  : 4,   // ETH main net
    "61" : 500,  // ETC main net
    "199": 4,  // BTTC main net  
    "250" : 12, // Fantom Opera mainnet
    "137" : 128, // Polygon Mainnet
    "43114" : 12, // Avalanche Mainnet
    "1313161554" : 1200, // Aurora mainnet
    "5" : 1, // ETH Goerli testnet        
}

const bridgeNFTContracts = {
    "20729" : "0xe96E157d994300B50073559820Fe49a015ecEf1E", // CLO test net
    "820" : "", // CLO main net
    "97" : "0x5E4BC70Df60FFBBab1290bD40d87aa095230A97e",  // BSC test net
    "56" : "",  // BSC main net
    "1" : "",   // ETH main net
    "61" : "",  // ETC main net
    "199": "",  // BTTC main net
};

const bridgeContracts = {
    "20729" : "0xE1AF7a91EBC36E66D89a6201680dC5242796b246", // CLO test net
    "820" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56", // CLO main net
    "97" : "0x9a1fc8c0369d49f3040bf49c1490e7006657ea56",  // BSC test net
    "56" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",  // BSC main net
    "1" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",   // ETH main net
    "61" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",  // ETC main net
    "199": "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",  // BTTC main net
    "250" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56", // Fantom Opera mainnet
    "137" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56", // Polygon Mainnet
    "43114" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56", // Avalanche Mainnet
    "1313161554" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56", // Aurora mainnet
    "5" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56", // ETH Goerli testnet
};

const providers = {
    "20729" : "https://testnet-rpc.callisto.network", // CLO test net
    "820" : "https://rpc.callisto.network/", // CLO main net
    "97" : "https://data-seed-prebsc-1-s1.binance.org:8545/",  // BSC test net
    "56" : "https://bsc-dataseed.binance.org/",  // BSC main net
    //"56" : "https://bsc-dataseed1.defibit.io/",  // BSC main net
    "1" : "https://nodes.mewapi.io/rpc/eth",   // ETH main net
    "61" : "https://etc.etcdesktop.com", // ETC main net
    "199": "https://rpc.bt.io/",  // BTTC main net
    "250" : "https://rpcapi.fantom.network/", // Fantom Opera mainnet
    "137" : "https://polygon-rpc.com/", // Polygon Mainnet
    "43114" : "https://api.avax.network/ext/bc/C/rpc", // Avalanche Mainnet
    "1313161554" : "https://mainnet.aurora.dev", // Aurora mainnet
    "5" : "https://goerli.infura.io/v3/", // ETH Goerli testnet
}

const deposit_event_abi = [
    {"type":"address","name":"token","internalType":"address","indexed":true},
    {"type":"address","name":"sender","internalType":"address","indexed":true},
    {"type":"uint256","name":"value","internalType":"uint256","indexed":false},
    {"type":"uint256","name":"toChainId","internalType":"uint256","indexed":false},
    {"type":"address","name":"toToken","internalType":"address","indexed":false}
];

const BridgeToContract_event_abi = [
    {"type":"address","name":"token","internalType":"address","indexed":true},
    {"type":"address","name":"sender","internalType":"address","indexed":true},
    {"type":"uint256","name":"value","internalType":"uint256","indexed":false},
    {"type":"uint256","name":"toChainId","internalType":"uint256","indexed":false},
    {"type":"address","name":"toToken","internalType":"address","indexed":false},
    {"type":"address","name":"toContract","internalType":"address","indexed":false},
    {"type":"bytes","name":"data","internalType":"bytes","indexed":false}
];

const Web3 = require('web3');

//const pk = "0x442a171f9f486e311c3f668b4fec52c77423fecdce005b21adcd265d238fee5d";
const pk = process.env.AUTHORITY_PK;  // Private key should be hidden

// Handler
exports.handler = async (event) => {
    if (event.rawPath == "/auth") {
        return authorize(event.queryStringParameters.tx, event.queryStringParameters.chain, false);
    } else if (event.rawPath == "/authNFT") {
        return authorize(event.queryStringParameters.tx, event.queryStringParameters.chain, true);
    }
    return {isSuccess: false, message: "API not found"};
};


// call this function to get authorization signature
// params: txId = deposit transaction hash, fromChainId = chain ID where transaction was sent.
// returns: on success {isSuccess: true, message: sig.signature};
// on error: {isSuccess: false, message: error_message}; 
async function authorize(txId, fromChainId, isNFT) {
    var provider = providers[fromChainId];
    var bridgeContract;
    if (isNFT) {
        bridgeContract = bridgeNFTContracts[fromChainId];
    } else {
        bridgeContract = bridgeContracts[fromChainId];
    }
        
    if (!bridgeContract) {
        let msg = "No bridgeContract for chain ID:" + fromChainId;
        //console.log(msg);
        return {isSuccess: false, message: msg};
    }
    if (!provider) {
        let msg = "No provider for chain ID:" + fromChainId;
        //console.log(msg);
        return {isSuccess: false, message: msg};
    }
    var web3 = new Web3(provider);
    var lastBlock = await web3.eth.getBlockNumber();

    return web3.eth.getTransactionReceipt(txId)
    .then(receipt => {
        if (receipt && receipt.status) {
            if (lastBlock - receipt.blockNumber < blockConfirmations[fromChainId]) { // require at least 12 confirmation
                let msg = "Confirming: " + (lastBlock - receipt.blockNumber) + " of " + blockConfirmations[fromChainId];
                console.log(msg);
                return {isSuccess: false, message: msg};
            }
            for (var i = 0; i < receipt.logs.length; i++) {
                let element = receipt.logs[i];
                // START previous bridge
                if (element.topics[0] == "0xf5dd9317b9e63ac316ce44acc85f670b54b339cfa3e9076e1dd55065b922314b"  // Deposit
                    && element.address == bridgeContract
                    && element.transactionHash == txId) 
                {
                    element.topics.shift(); // remove 
                    let p = web3.eth.abi.decodeLog(deposit_event_abi, element.data, element.topics);
                    //console.log(p);
                    let toBridge;
                    let messageHash;
                    if (isNFT){
                        toBridge = bridgeNFTContracts[p.toChainId];
                        messageHash = web3.utils.soliditySha3(p.toToken, p.sender, p.value, txId, fromChainId, p.toChainId, toBridge);
                    } else {
                        toBridge = bridgeContracts[p.toChainId];
                        messageHash = web3.utils.soliditySha3(p.toToken, p.sender, p.value, txId, fromChainId, p.toChainId);
                    }
                    //console.log(messageHash);
                    sig = web3.eth.accounts.sign(messageHash, pk);
                    //console.log(sig);
                    let ret = {isSuccess: true, signature: sig.signature, token: p.toToken, value: p.value, to: p.sender, chainId: p.toChainId, bridge: toBridge};
                    //console.log(ret);
                    return ret;
                } else if (element.topics[0] == "0x8e3af9ffa3a105195ae58520a6e3ab241268521cd0a0ca519896e650d4fbebe4"   // BridgeToContract
                    && element.address == bridgeContract
                    && element.transactionHash == txId) 
                {
                    element.topics.shift(); // remove 
                    var p = web3.eth.abi.decodeLog(BridgeToContract_event_abi, element.data, element.topics);
                    //console.log(p);
                    var messageHash = web3.utils.soliditySha3(p.toToken, p.sender, p.value, txId, fromChainId, p.toChainId, p.toContract, p.data);
                    //console.log(messageHash);
                    sig = web3.eth.accounts.sign(messageHash, pk);
                    //console.log(sig);
                    let ret = {isSuccess: true, signature: sig.signature, token: p.toToken, value: p.value, to: p.sender, chainId: p.toChainId, toContract: p.toContract, data: p.data, bridge: bridgeContracts[p.toChainId]};
                    //console.log(ret);
                    return ret;
                }
                // END previous bridge
                if (element.topics[0] == "0xc9e84ed7aa56cf1771d0373f4b6380ccc9c7cdae154f287abf95c48f72e7f0cf")  // Deposit
                {
                    element.topics.shift(); // remove 
                    let p = web3.eth.abi.decodeLog(Deposit_event_abi, element.data, element.topics);
                    //console.log(p);
                    let toBridge = bridgeContracts[p.toChainId];
                    let messageHash = web3.utils.soliditySha3(
                        p.originalToken,
                        p.originalChainID,
                        p.receiver, 
                        p.value, 
                        txId, 
                        fromChainId, 
                        p.toChainId, 
                        toBridge
                    );


                    //console.log(messageHash);
                    sig = web3.eth.accounts.sign(messageHash, pk);
                    //console.log(sig);
                    let ret = {
                        isSuccess: true, 
                        signature: sig.signature,
                        originalToken: p.originalToken,
                        originalChainID: p.originalChainID,
                        value: p.value, 
                        to: p.receiver, 
                        chainId: p.toChainId, 
                        bridge: toBridge
                    };
                    //console.log(ret);
                    return ret;
                } else if (element.topics[0] == "0xeaa11317bb61110cf1035a22a7b6b4c716b909b47954d51ee13de1627fdf0f50")   // BridgeToContract
                {
                    element.topics.shift(); // remove 
                    let p = web3.eth.abi.decodeLog(BridgeToContract_event_abi, element.data, element.topics);
                    //console.log(p);
                    if (!p.data) p.data = "0x";
                    let toBridge = bridgeContracts[p.toChainId];
                    let messageHash = web3.utils.soliditySha3(
                        p.originalToken,
                        p.originalChainID,
                        p.receiver, 
                        p.value, 
                        txId, 
                        fromChainId, 
                        p.toChainId, 
                        toBridge, 
                        p.toContract, 
                        p.data
                    );
                    //console.log(messageHash);
                    sig = web3.eth.accounts.sign(messageHash, pk);
                    //console.log(sig);
                    let ret = {
                        isSuccess: true, 
                        signature: sig.signature, 
                        originalToken: p.originalToken,
                        originalChainID: p.originalChainID,
                        value: p.value, 
                        to: p.receiver, 
                        chainId: p.toChainId, 
                        toContract: p.toContract, 
                        data: p.data, 
                        bridge: toBridge
                    };
                    //console.log(ret);
                    return ret;
                } else if (element.topics[0] == "0xef4ec9b3cfaa22dd32688bf4ac3c820e8b468ffb6452f61717fb9d845f3c5263")   // AddToken
                {
                    element.topics.shift(); // remove 
                    let p = web3.eth.abi.decodeLog(AddToken_event_abi, element.data, element.topics);
                    //console.log(p);
                    let toBridge = bridgeContracts[p.toChainId];
                    let messageHash = web3.utils.soliditySha3(
                        p.token, 
                        p.chainID,
                        p.decimals,
                        p.name,
                        p.symbol
                    );
                    //console.log(messageHash);
                    sig = web3.eth.accounts.sign(messageHash, pk);
                    //console.log(sig);
                    let ret = {
                        isSuccess: true, 
                        signature: sig.signature, 
                        token: p.token, 
                        chainID: p.chainID,
                        decimals: p.decimals,
                        name: p.name,
                        symbol: p.symbol,                        
                        bridge: toBridge
                    };
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
