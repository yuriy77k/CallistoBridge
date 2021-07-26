const http = require('http');
const Web3 = require('web3');
//const fs = require('fs');
const url = require('url');
const port = 3000;

/*
    call /auth?tx= transaction hash &chain= chain Id where transaction was sent
    for example: http://127.0.0.1:3000/auth?tx=0x67eba02bcea4aa35d64e3e5d1adcf089c42b586d57669cf683e22573358846c3&chain=97
    should returns JSON with bridge address to call function claim() and required parameters: 
    {
        "isSuccess":true,
        "signature":"0xadd441ba65cc9b691abe4208bf693afe211225da1146d6a7f26fd7acbc24475c5d230b2d9d14d2c662f06719c68fe6f749e89c1ba661703cdf3fed370967e45f1b",
        "token":"0x0000000000000000000000000000000000000001",
        "value":"1000000000000000000",
        "to":"0xC7d98c4c919E93eD44755718E27b53791E7F3521",
        "bridge":"0x05ef4B789C75c02d5182e6EfB7c64230Ec9B58b2"
    }

    txId and fromChainId is the same as used for signature request.
*/

//============================ Begin Authority part ======================================================
// authority address: 0x3d40De3046a7D7E2Aa9E8097A86e49c699A0170B
const pk = "442a171f9f486e311c3f668b4fec52c77423fecdce005b21adcd265d238fee5d";  // Private key should be hidden

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
    if (!provider) {
        let msg = "No provider for chain ID:" + fromChainId;
        console.log(msg);
        return {isSuccess: false, message: msg};
    }
    var web3 = new Web3(provider);

    return web3.eth.getTransactionReceipt(txId)
    .then(receipt => {
        if (receipt && receipt.status) {
            let element;
            for (var i = 0; i < receipt.logs.length; i++) {
                if (receipt.logs[i].topics[0] == "0xf5dd9317b9e63ac316ce44acc85f670b54b339cfa3e9076e1dd55065b922314b") {
                    element = receipt.logs[i];
                    element.topics.shift(); // remove 
                }
            }
            bridgeContract = bridgeContracts[fromChainId];
            if (bridgeContract && element.address == bridgeContract && element.transactionHash == txId) {
                let p = web3.eth.abi.decodeLog(deposit_event_abi, element.data, element.topics);
                console.log(p);
                let messageHash = web3.utils.soliditySha3(p.toToken, p.sender, p.value, txId, fromChainId, p.toChainId);
                console.log(messageHash);
                sig = web3.eth.accounts.sign(messageHash, pk);
                console.log(sig);
                return {isSuccess: true, signature: sig.signature, token: p.toToken, value: p.value, to: p.sender, bridge: bridgeContracts[toChainId]};
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
//============================ End Authority part ======================================================

const requestHandler = (request, response) => {
    console.log(request.url);
    let url = new URL("http://"+request.host+request.url);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader("Access-Control-Allow-Methods", '*');
    response.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');

      
    if (url.pathname == "/auth") {
        //console.log(request.url);
        let params = url.searchParams;
        let txId = params.get('tx');    // transaction ID
        let fromChainId = params.get('chain'); // transaction chain ID
        authorize(txId, fromChainId)
        .then(resp => {
            console.log(resp);
            response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
            response.end(JSON.stringify(resp));

        })
        .catch(err => {
            response.writeHead(404, {'Content-Type': 'text/html'});
            response.end(err.toString());            
        })
    }
    else 
    {
        response.writeHead(404, {'Content-Type': 'text/html'});
        response.end(request.url.toString()+" file not found");
    }
}


const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }    console.log(`server is listening on ${port}`)
})

