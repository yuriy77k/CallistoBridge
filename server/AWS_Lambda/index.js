const { ethers } = require('ethers');

const blockConfirmations = {
    //"20729" : 1, // CLO test net
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
    //"20729" : "0xe96E157d994300B50073559820Fe49a015ecEf1E", // CLO test net
    "820" : "", // CLO main net
    "97" : "0x5E4BC70Df60FFBBab1290bD40d87aa095230A97e",  // BSC test net
    "56" : "",  // BSC main net
    "1" : "",   // ETH main net
    "61" : "",  // ETC main net
    "199": "",  // BTTC main net
};

const bridgeContracts = {
    //"20729" : "0xE1AF7a91EBC36E66D89a6201680dC5242796b246", // CLO test net
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
    //"20729" : "https://testnet-rpc.callisto.network", // CLO test net
    "820" : "https://rpc.callistodao.org/", // CLO main net
    "97" : "https://data-seed-prebsc-1-s1.binance.org:8545/",  // BSC test net
    "56" : "https://bsc-dataseed.binance.org/",  // BSC main net
    //"56" : "https://bsc-dataseed1.defibit.io/",  // BSC main net
    "1" : "https://eth.drpc.org",   // ETH main net
    "61" : "https://etc.etcdesktop.com", // ETC main net
    "199": "https://rpc.bt.io/",  // BTTC main net
    "250" : "https://rpcapi.fantom.network/", // Fantom Opera mainnet
    "137" : "https://polygon-rpc.com/", // Polygon Mainnet
    "43114" : "https://api.avax.network/ext/bc/C/rpc", // Avalanche Mainnet
    "1313161554" : "https://mainnet.aurora.dev", // Aurora mainnet
    "5" : "https://goerli.infura.io/v3/", // ETH Goerli testnet
}

const bridgeV1ABI = [
    "event Deposit(address indexed token, address indexed sender, uint256 value, uint256 toChainId, address toToken)",
    "event BridgeToContract(address indexed token, address indexed sender, uint256 value, uint256 toChainId, address toToken, address toContract, bytes data)"
];

const bridgeV2ABI = [
    "event Deposit(address indexed originalToken,uint256 originalChainID,address indexed token,address indexed receiver,uint256 value,uint256 toChainId)",
    "event BridgeToContract(address indexed originalToken,uint256 originalChainID,address indexed token,address indexed receiver,uint256 value,uint256 toChainId,address toContract,bytes data)",
    "event AddToken(address indexed token,uint256 chainID,uint256 decimals,string name,string symbol)"
];

//const pk = "0x442a171f9f486e311c3f668b4fec52c77423fecdce005b21adcd265d238fee5d";  // for test
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
// returns: on success {isSuccess: true, message: signature};
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
    var staticProvider = new ethers.JsonRpcProvider(provider);
    var lastBlock = await staticProvider.getBlockNumber();

    return staticProvider.getTransactionReceipt(txId)
    .then(async (receipt) => {
        if (receipt && receipt.status) {
            const wallet = new ethers.Wallet(pk);

            if (lastBlock - receipt.blockNumber < blockConfirmations[fromChainId]) { // require at least 12 confirmation
                let msg = "Confirming: " + (lastBlock - receipt.blockNumber) + " of " + blockConfirmations[fromChainId];
                console.log(msg);
                return {isSuccess: false, message: msg};
            }
            for (var i = 0; i < receipt.logs.length; i++) {
                let element = receipt.logs[i];
                if (element.address != bridgeContract || element.transactionHash != txId) continue; // event should be emitted by bridg contract in specific transaction
                // START bridgeV1
                if (element.topics[0] == "0xf5dd9317b9e63ac316ce44acc85f670b54b339cfa3e9076e1dd55065b922314b")  // Deposit
                {
                    const ifaceV1 = new ethers.Interface(bridgeV1ABI);
                    const p = ifaceV1.decodeEventLog("Deposit",element.data, element.topics);
                    //console.log(p);
                    let toBridge;
                    let messageHash;
                    if (isNFT){
                        toBridge = bridgeNFTContracts[p.toChainId];
                        messageHash = ethers.solidityPackedKeccak256(
                            ['address','address','uint256','bytes32','uint256','uint256','address'], 
                            [p.toToken, p.sender, p.value, txId, fromChainId, p.toChainId, toBridge]
                        );
                    } else {
                        toBridge = bridgeContracts[p.toChainId];
                        messageHash = ethers.solidityPackedKeccak256(
                            ['address','address','uint256','bytes32','uint256','uint256'], 
                            [p.toToken, p.sender, p.value, txId, fromChainId, p.toChainId]
                        );

                    }
                    //console.log(messageHash);
                    let signature = await wallet.signMessage(ethers.getBytes(messageHash));
                    //console.log(signature);
                    let ret = {isSuccess: true, signature: signature, token: p.toToken, value: p.value.toString(), to: p.sender, chainId: p.toChainId.toString(), bridge: toBridge};
                    //console.log(ret);
                    return ret;
                } else if (element.topics[0] == "0x8e3af9ffa3a105195ae58520a6e3ab241268521cd0a0ca519896e650d4fbebe4")   // BridgeToContract
                {
                    const ifaceV1 = new ethers.Interface(bridgeV1ABI);
                    const p = ifaceV1.decodeEventLog("BridgeToContract",element.data, element.topics);
                    //console.log(p);
                    var messageHash = ethers.solidityPackedKeccak256(
                        ['address','address','uint256','bytes32','uint256','uint256','address',"bytes"], 
                        [p.toToken, p.sender, p.value, txId, fromChainId, p.toChainId, p.toContract, p.data]
                    );
                    //console.log(messageHash);
                    let signature = await wallet.signMessage(ethers.getBytes(messageHash));
                    //console.log(signature);

                    let ret = {isSuccess: true, signature: signature, token: p.toToken, value: p.value.toString(), to: p.sender, chainId: p.toChainId.toString(), toContract: p.toContract, data: p.data, bridge: bridgeContracts[p.toChainId]};
                    //console.log(ret);
                    return ret;
                }
                // END bridgeV1

                // START bridgeV2
                if (element.topics[0] == "0xc9e84ed7aa56cf1771d0373f4b6380ccc9c7cdae154f287abf95c48f72e7f0cf")  // Deposit
                {
                    const ifaceV2 = new ethers.Interface(bridgeV2ABI);
                    const p = ifaceV2.decodeEventLog("Deposit",element.data, element.topics);
                    //console.log(p);
                    let toBridge = bridgeContracts[p.toChainId];
                    var messageHash = ethers.solidityPackedKeccak256(
                        ['address','uint256','address','uint256','bytes32','uint256','uint256','address'], 
                        [
                            p.originalToken,
                            p.originalChainID,
                            p.receiver, 
                            p.value, 
                            txId, 
                            fromChainId, 
                            p.toChainId, 
                            toBridge
                        ]
                    );

                    //console.log(messageHash);
                    let signature = await wallet.signMessage(ethers.getBytes(messageHash));
                    //console.log(signature);
                    let ret = {
                        isSuccess: true, 
                        signature: signature,
                        originalToken: p.originalToken,
                        originalChainID: p.originalChainID.toString(),
                        value: p.value.toString(), 
                        to: p.receiver, 
                        chainId: p.toChainId.toString(), 
                        bridge: toBridge
                    };
                    //console.log(ret);
                    return ret;
                } else if (element.topics[0] == "0xeaa11317bb61110cf1035a22a7b6b4c716b909b47954d51ee13de1627fdf0f50")   // BridgeToContract
                {
                    const ifaceV2 = new ethers.Interface(bridgeV2ABI);
                    const p = ifaceV2.decodeEventLog("BridgeToContract",element.data, element.topics);
                    //console.log(p);
                    if (!p.data) p.data = "0x";
                    let toBridge = bridgeContracts[p.toChainId];
                    var messageHash = ethers.solidityPackedKeccak256(
                        ['address','uint256','address','uint256','bytes32','uint256','uint256','address','address','bytes'], 
                        [
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
                        ]
                    );
                    //console.log(messageHash);
                    let signature = await wallet.signMessage(ethers.getBytes(messageHash));
                    //console.log(signature);
                    let ret = {
                        isSuccess: true, 
                        signature: signature, 
                        originalToken: p.originalToken,
                        originalChainID: p.originalChainID.toString(),
                        value: p.value.toString(), 
                        to: p.receiver, 
                        chainId: p.toChainId.toString(), 
                        toContract: p.toContract, 
                        data: p.data, 
                        bridge: toBridge
                    };
                    //console.log(ret);
                    return ret;
                } else if (element.topics[0] == "0xef4ec9b3cfaa22dd32688bf4ac3c820e8b468ffb6452f61717fb9d845f3c5263")   // AddToken
                {
                    const ifaceV2 = new ethers.Interface(bridgeV2ABI);
                    const p = ifaceV2.decodeEventLog("BridgeToContract",element.data, element.topics);
                    //console.log(p);
                    if (!p.data) p.data = "0x";
                    let toBridge = bridgeContracts[p.toChainId];
                    var messageHash = ethers.solidityPackedKeccak256(
                        ['address','uint256','uint256','string','string'], 
                        [
                            p.token, 
                            p.chainID,
                            p.decimals,
                            p.name,
                            p.symbol
                        ]
                    );
                    //console.log(messageHash);
                    let signature = await wallet.signMessage(ethers.getBytes(messageHash));
                    //console.log(signature);
                    let ret = {
                        isSuccess: true, 
                        signature: signature, 
                        token: p.token, 
                        chainID: p.chainID.toString(),
                        decimals: p.decimals.toString(),
                        name: p.name,
                        symbol: p.symbol,                        
                        bridge: toBridge
                    };
                    //console.log(ret);
                    return ret;
                }
                // END bridgeV2
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
