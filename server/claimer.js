const Web3 = require('web3');
require('dotenv').config(); // if use .env file for enviroment variables


const claimer_pk = process.env.CLAIMER_PK;  // Private key should be hidden

const https = require('https')

const bridge_abi = [
  {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"claim","inputs":[
      {"type":"address","name":"token","internalType":"address"},
      {"type":"bytes32","name":"txId","internalType":"bytes32"},
      {"type":"address","name":"to","internalType":"address"},
      {"type":"uint256","name":"value","internalType":"uint256"},
      {"type":"uint256","name":"fromChainId","internalType":"uint256"},
      {"type":"bytes[]","name":"sig","internalType":"bytes[]"}
  ]},
  {"type":"function","stateMutability":"payable","outputs":[],"name":"claimToContract","inputs":[
      {"type":"address","name":"token","internalType":"address"},
      {"type":"bytes32","name":"txId","internalType":"bytes32"},
      {"type":"address","name":"to","internalType":"address"},
      {"type":"uint256","name":"value","internalType":"uint256"},
      {"type":"uint256","name":"fromChainId","internalType":"uint256"},
      {"type":"address","name":"toContract","internalType":"address"},
      {"type":"bytes","name":"data","internalType":"bytes"},
      {"type":"bytes[]","name":"sig","internalType":"bytes[]"}
  ]}
]


const bridgeContracts = {
  "20729" : "0xE1AF7a91EBC36E66D89a6201680dC5242796b246", // CLO test net
  "820" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56", // CLO main net
  "97" : "0x3777c0b1CBFC65743149D5559db0bC199B7C647c",  // BSC test net
  "56" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",  // BSC main net
  "42" : "0x9b5e4b10b405cd5cd4b056a1b57c1c653379db3c",  // ETH KOVAN test net 
  "1" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",   // ETH main net
  "61" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",  // ETC main net
  "199": "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",  // BTTC main net
};

const providers = {
  "20729" : "https://testnet-rpc.callisto.network", // CLO test net
  "820" : "https://rpc.callisto.network/", // CLO main net
  "97" : "https://data-seed-prebsc-1-s2.binance.org:8545/",  // BSC test net
  "56" : "https://bsc-dataseed.binance.org/",  // BSC main net
  "42" : "https://kovan.infura.io/v3/",  // ETH KOVAN test net 
  "1" : "https://mainnet.infura.io/v3/",   // ETH main net
  "61" : "https://www.ethercluster.com/etc", // ETC main net
  "199": "https://rpc.bt.io/",  // BTTC main net
}

const minimalBalance = {
  "20729" : 1e17, // CLO test net
  "820" : 1e17, // CLO main net
  "97" : 1e17,  // BSC test net
  "56" : 0,  // BSC main net
  "42" : 1e17,  // ETH KOVAN test net 
  "1"  : 0,   // ETH main net
  "61" : 3*1e14,  // ETC main net
  "199": 150*1e18,  // BTTC main net    
}

async function fetch(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return reject(new Error(`HTTP status code ${res.statusCode}`))
      }

      const body = []
      res.on('data', (chunk) => body.push(chunk))
      res.on('end', () => {
        const resString = Buffer.concat(body).toString()
        resolve(resString)
      })
    })

    request.on('error', (err) => {
      reject(err)
    })
    request.on('timeout', () => {
      request.destroy()
      reject(new Error('timed out'))
    })
  })
}


async function requestSignature(txID, txChain) 
{
  var p = 'tx='+txID+'&chain='+txChain;
  var r1 = fetch('https://a78aj8vsu0.execute-api.us-west-2.amazonaws.com/auth/'+p);
  var r2 = fetch('https://ip-159-225.cust.aspone.cz/auth?'+p);
  var r3 = fetch('https://z3ks0jkyd5.execute-api.us-east-2.amazonaws.com/default/auth/'+p);
  
  return  [
            JSON.parse(await r1),
            JSON.parse(await r2),
            JSON.parse(await r3)
          ];
}

async function claim(txID, txChain) 
{
    var sig = await requestSignature(txID, txChain);
    var signatures = [];
    for (i=0; i < sig.length; i++) {
        if(!sig[i].isSuccess) {
            return {isSuccess: false, message: sig[i].message};
        }
        signatures.push(sig[i].signature);
    }
    // if (isSuccess) 
    var min = minimalBalance[sig[0].chainId];   // user shouldn't has more money on balance to get free claim
    if (min == 0) return {isSuccess: false, message: "Network is not supported"};

    try {
        const web3 = new Web3(providers[sig[0].chainId]);
        const acc = web3.eth.accounts.privateKeyToAccount(claimer_pk);
        web3.eth.accounts.wallet.add(acc);
        const bridge = new web3.eth.Contract(bridge_abi, bridgeContracts[sig[0].chainId]);

        // check receiver balance
        var bal = await web3.eth.getBalance(sig[0].to);
        if (parseInt(bal) > min) {
            return {isSuccess: false, message: "Receiver balance: "+ (bal/1e18) +" is higher then required: " + (min/1e18) };
        }

        if ("toContract" in sig[0]) {
            //console.log("toContract");
            var gas_limit = await bridge.methods.claimToContract(sig[0].token, txID, sig[0].to, sig[0].value, txChain, sig[0].toContract, sig[0].data, signatures).estimateGas({from: acc.address});
            var params = {from: acc.address, value: 0, gas: parseInt(gas_limit)+20000, chainId: sig[0].chainId,};
            var tx = await bridge.methods.claimToContract(sig[0].token, txID, sig[0].to, sig[0].value, txChain, sig[0].toContract, sig[0].data, signatures).send(params);
            return {isSuccess: true, txHash: tx.transactionHash, chainID: sig[0].chainId};
        } else {
            //console.log("claim");
            var gas_limit = await bridge.methods.claim(sig[0].token, txID, sig[0].to, sig[0].value, txChain, signatures).estimateGas({from: acc.address});
            var params = {from: acc.address, value: 0, gas: parseInt(gas_limit)+20000, chainId: sig[0].chainId,};
            var tx = await bridge.methods.claim(sig[0].token, txID, sig[0].to, sig[0].value, txChain, signatures).send(params);
            return {isSuccess: true, txHash: tx.transactionHash, chainID: sig[0].chainId};

        }
    }
    catch (e) {
        return {isSuccess: false, message: e.toString()};
    }
}

module.exports.claim = claim;