/*


Import this module in server app using: 
const auth = require("./authority.js");

Call function auth.authorize(txId, fromChainId), 
where:
    `txId` - transaction hash, 
    `fromChainId` - chain ID where transaction was sent.
returns JSON object,
where:
if all good:
    "isSuccess" - true,
    "signature" - authority signature,
    "token" - token to receive,
    "value" - tokens amount,
    "to"- receiver (user's) address,
    "chainId" - chain ID where to claim token,
    "bridge" - address of bridge on destination network.

in case of error: 
    "isSuccess" - false,
    "message" - error description


Example:

    auth.authorize(txId, fromChainId)
    .then(resp => {
        response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
        response.end(JSON.stringify(resp));

    })
    .catch(err => {
        response.writeHead(404, {'Content-Type': 'text/html'});
        response.end(err.toString());            
    })


In this example of `.env` the authority address is 0x3d40De3046a7D7E2Aa9E8097A86e49c699A0170B
*/

const Web3 = require('web3');
//require('dotenv').config(); // uncomment if use .env file for enviroment variables

const pk = process.env.AUTHORITY_PK;  // Private key should be hidden

const bridgeContracts = {
    "20729" : "0x6664fD73ed95CF608B5e461A6cE89212F989EdCA", // CLO test net
    "820" : "", // CLO main net
    "97" : "0x05ef4B789C75c02d5182e6EfB7c64230Ec9B58b2",  // BSC test net
    "56" : "",  // BSC main net
    "42" : "",  // ETH KOVAN test net 
    "1" : "",   // ETH main net
};

const providers = {
    "20729" : "https://testnet-rpc.callisto.network", // CLO test net
    "820" : "https://clo-geth.0xinfra.com/", // CLO main net
    "97" : "https://data-seed-prebsc-1-s1.binance.org:8545/",  // BSC test net
    "56" : "https://bsc-dataseed.binance.org/",  // BSC main net
    "42" : "https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",  // ETH KOVAN test net 
    "1" : "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",   // ETH main net    
}

const deposit_event_abi = [
    {"type":"address","name":"token","internalType":"address","indexed":true},
    {"type":"address","name":"sender","internalType":"address","indexed":true},
    {"type":"uint256","name":"value","internalType":"uint256","indexed":false},
    {"type":"uint256","name":"toChainId","internalType":"uint256","indexed":false},
    {"type":"address","name":"toToken","internalType":"address","indexed":false}
];


// call this function to get authorization signature
// params: txId = deposit transaction hash, fromChainId = chain ID where transaction was sent.
// returns: on success {isSuccess: true, message: sig.signature};
// on error: {isSuccess: false, message: error_message}; 
async function authorize(txId, fromChainId) {
    var provider = providers[fromChainId];
    var bridgeContract = bridgeContracts[fromChainId];
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

    return web3.eth.getTransactionReceipt(txId)
    .then(receipt => {
        if (receipt && receipt.status) {
            for (var i = 0; i < receipt.logs.length; i++) {
                let element = receipt.logs[i];
                if (element.topics[0] == "0xf5dd9317b9e63ac316ce44acc85f670b54b339cfa3e9076e1dd55065b922314b"
                    && element.address == bridgeContract
                    && element.transactionHash == txId) 
                {
                    element.topics.shift(); // remove 
                    let p = web3.eth.abi.decodeLog(deposit_event_abi, element.data, element.topics);
                    //console.log(p);
                    let messageHash = web3.utils.soliditySha3(p.toToken, p.sender, p.value, txId, fromChainId, p.toChainId);
                    //console.log(messageHash);
                    sig = web3.eth.accounts.sign(messageHash, pk);
                    //console.log(sig);
                    let ret = {isSuccess: true, signature: sig.signature, token: p.toToken, value: p.value, to: p.sender, chainId: p.toChainId, bridge: bridgeContracts[p.toChainId]};
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

module.exports.authorize = authorize;