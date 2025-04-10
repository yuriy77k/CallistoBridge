const { ethers } = require('ethers');
require('dotenv').config(); // if use .env file for enviroment variables


const claimer_pk = process.env.CLAIMER_PK;  // Private key should be hidden

const https = require('https')

const bridge_abi = [
  "function claim(address originalToken,uint256 originalChainID,bytes32 txId,address to,uint256 value,uint256 fromChainId,bytes[] memory sig)",
  "function claimToContract(address originalToken,uint256 originalChainID,bytes32 txId,address to,uint256 value,uint256 fromChainId,address toContract, bytes memory data,bytes[] memory sig)"
]


const bridgeContracts = {
  "121224" : "", // Fushuma
  "137" : "",  // Polygon main net
  "56" : "",  // BSC main net
  "1" : "",   // ETH main net
  "130" : "", // Unichain
  "42161": "",  // Arbitrum
  "8453": "",  // Base
  //"820" : "", // CLO main net
};

const RPC = {
  "121224" : "https://rpc.fushuma.com/", // Fushuma
  "137" : "https://polygon-rpc.com/",  // Polygon main net
  "56" : "https://bsc-dataseed.binance.org/",  // BSC main net
  "1" : "https://eth.drpc.org",   // ETH main net
  "130" : "https://mainnet.unichain.org", // Unichain
  "42161": "https://arbitrum-one-rpc.publicnode.com",  // Arbitrum
  "8453": "https://mainnet.base.org",  // Base
  //"820" : "https://rpc.callistodao.org/", // CLO main net
}

const minimalBalance = {
  "121224" : 1e18, // Fushuma
  "137" : 0,  // Polygon main net
  "56" : 0,  // BSC main net
  "1" : 0,   // ETH main net
  "130" : 0, // Unichain
  "42161": 0,  // Arbitrum
  "8453": 0,  // Base
  //"820" : 0, // CLO main net
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
  var p = 'auth?tx='+txID+'&chain='+txChain;
  var r1 = fetch(''+p);
  var r2 = fetch(''+p);
  var r3 = fetch(''+p);
  var r4 = fetch(''+p);
  
  return  [
            JSON.parse(await r1),
            JSON.parse(await r2),
            JSON.parse(await r3),
            JSON.parse(await r4),
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
    const min = minimalBalance[sig[0].chainId];   // user shouldn't has more money on balance to get free claim
    if (min == 0) return {isSuccess: false, message: "Network is not supported"};

    try {
        const wallet = new ethers.Wallet(claimer_pk);
        const provider = new ethers.JsonRpcProvider(RPC[sig[0].chainId], wallet);
        const bridge = new ethers.Contract(bridgeContracts[sig[0].chainId], bridge_abi, provider);

        // check receiver balance
        const min = minimalBalance[sig[0].chainId];   // user shouldn't has more money on balance to get free claim
        const balance = await provider.getBalance(sig[0].to);
        if (balance >= BigInt(min) ) {
            return {isSuccess: false, message: "Receiver balance: "+ (Number(balance)/1e18) +" is not less then required: " + (min/1e18) };
        }

        if ("toContract" in sig[0]) {
            //console.log("toContract");
            var tx = await bridge.methods.claimToContract(sig[0].originalToken, sig[0].originalChainID, txID, sig[0].to, sig[0].value, txChain, sig[0].toContract, sig[0].data, signatures);
            return {isSuccess: true, txHash: tx.hash, chainID: sig[0].chainId};
        } else {
            //console.log("claim");
            var tx = await bridge.methods.claim(sig[0].originalToken, sig[0].originalChainID, txID, sig[0].to, sig[0].value, txChain, signatures);
            return {isSuccess: true, txHash: tx.hash, chainID: sig[0].chainId};
        }
    }
    catch (e) {
        return {isSuccess: false, message: e.toString()};
    }
}

module.exports.claim = claim;