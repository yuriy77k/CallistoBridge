const Authorities = [
  //"http://127.0.0.1:3000/auth?"
  "https://ip-159-225.cust.aspone.cz/auth?",
  "https://z3ks0jkyd5.execute-api.us-east-2.amazonaws.com/default/auth/",
  "https://a78aj8vsu0.execute-api.us-west-2.amazonaws.com/auth/"
]

const bridgeContracts = {
  "20729" : "0xE1AF7a91EBC36E66D89a6201680dC5242796b246", // CLO test net
  "820" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56", // CLO main net
  "97" : "0x3777c0b1CBFC65743149D5559db0bC199B7C647c",  // BSC test net
  "56" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",  // BSC main net
  "42" : "0x9b5e4b10b405cd5cd4b056a1b57c1c653379db3c",  // ETH KOVAN test net 
  "1" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",   // ETH main net
  "61" : "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",  // ETC main net
};

const Networks = {
  "20729" : "Callisto Network testnet", // CLO test net
  "820" : "Callisto Network", // CLO main net
  "97" : "Binance Smart Chain testnet",  // BSC test net
  "56" : "Binance Smart Chain",  // BSC main net
  "42" : "Ethereum testnet Kovan",  // ETH KOVAN test net 
  "1" : "Ethereum",   // ETH main net
  "61" : "Ethereum Classic", // ETC main net
};

const Tokens = {
  "CLO" : {
    "20729" : "0x0000000000000000000000000000000000000001", // CLO test net
    "820": "0x0000000000000000000000000000000000000001",  // CLO main net
    "97" : "0xCCEA50dDA26F141Fcc41Ad7e94755936d8C57e28",  // BSC test net
    "56" : "0xCcbf1C9E8b4f2cDF3Bfba1098b8f56f97d219D53",  // BSC main net
    "42" : "0xcc48d2250b55b82696978184e75811f1c0ef383f",  // ETH KOVAN test net 
    "1" : "0xCcbf1C9E8b4f2cDF3Bfba1098b8f56f97d219D53",   // ETH main net
    "61" : "0xCcbf1C9E8b4f2cDF3Bfba1098b8f56f97d219D53"   // ETC main net
  },
  "ETH" : {
    "820": "0xcC00860947035a26Ffe24EcB1301ffAd3a89f910",  // CLO main net
    "1" : "0x0000000000000000000000000000000000000002"    // ETH main net
  },
  "BNB" : {
    "820": "0xCC78D0A86B0c0a3b32DEBd773Ec815130F9527CF",  // CLO main net
    "56" : "0x0000000000000000000000000000000000000003"    // ETH main net
  },
  "ETC" : {
    "820": "0xCc944bF3e76d483e41CC6154d5196E2e5d348fB0",  // CLO main net
    "61" : "0x0000000000000000000000000000000000000004"    // ETC main net
  }
}
// var chainId = parseInt(window.ethereum.chainId, 16)

$(function(){
  
  $('li.dropdown > a').on('click',function(event){
    
    event.preventDefault()
    
    $(this).parent().find('ul').first().toggle(300,'swing');
    
    $(this).parent().siblings().find('ul').hide(200);
    
    $(this).parent().find('ul').mouseleave(function(){  
      var thisUI = $(this);
      $('html').click(function(){
        thisUI.hide();
        $('html').unbind('click');
      });
    });
    
    
  });
});


function myMenu() {
    var x = document.getElementById("top-nav");
    if (x.style.display === "block") {
      x.style.display = "none";
    } else {
      x.style.display = "block";
    }
  }

const modals = document.querySelectorAll('[data-modal]');

modals.forEach(function(trigger) {
  trigger.addEventListener('click', function(event) {
    event.preventDefault();
    const modal = document.getElementById(trigger.dataset.modal);
    modal.classList.add('open');
    const exits = modal.querySelectorAll('.modal-exit');
    exits.forEach(function(exit) {
      exit.addEventListener('click', function(event) {
        event.preventDefault();
        modal.classList.remove('open');
      });
    });
  });
});

function toggleTextFirst(btn, chainId)    
{  
  document.getElementById("blockNameFirst").innerHTML = btn.innerHTML
}
function toggleTextSecond(btn, chainId)    
{  
  toChain = chainId;
  document.getElementById("blockNameSecond").innerHTML = btn.innerHTML
}
// function toggleAssets(btn)    
// {  
//     var parent = document.querySelector('#crypto-block')
//     var childname = parent.querySelector('#crypto-name')
//     var childimg = parent.querySelector('#crypto-img')
//     var blockimg = document.getElementById("blockImg").firstElementChild
//     document.getElementById("blockNameFirst").innerHTML = childname.innerHTML
//     blockimg.firstElementChild.srcset = childimg.src
// }
function toggleAssets(btn)    
{  
    var cryptoimg = btn.firstElementChild.firstElementChild.lastElementChild
    var name = btn.firstElementChild.lastElementChild.lastElementChild

    var blockimg = document.getElementById("blockImg").firstElementChild

    document.getElementById("blockNameFirst").innerHTML = name.innerHTML
    blockimg.firstElementChild.srcset = cryptoimg.src
}

function toggleAssetsTop(btn)    
{  
    var cryptoimg = btn.firstElementChild.firstElementChild.lastElementChild
    var name = btn.firstElementChild.lastElementChild.firstElementChild

    var blockimg = document.getElementById("asset-img").firstElementChild

    document.getElementById("asset-shot-name").innerHTML = name.innerHTML
    blockimg.firstElementChild.srcset = cryptoimg.src
}
function email_test(input) {
	return !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/.test(input.value);
}







// ============================================== Metamask ======================================


var chainId;
var currentAccount = null;
var step = 0;
var txHash = "";
let txChain = 0;
let toChain = 97; // destination chain

if (window.ethereum) {
  window.web3 = new Web3(ethereum);
  handleEthereum();
  console.log("1")
} else {
  window.addEventListener('ethereum#initialized', handleEthereum, {
    once: true,
  });

  // If the event is not dispatched by the end of the timeout,
  // the user probably doesn't have MetaMask installed.
  setTimeout(handleEthereum, 3000); // 3 seconds
}



async function handleEthereum() {
  const { ethereum } = window;
  if (ethereum && ethereum.isMetaMask) {
    console.log('Ethereum successfully detected!');
    // Access the decentralized web!

/**********************************************************/
/* Handle chain (network) and chainChanged (per EIP-1193) */
/**********************************************************/

chainId = await ethereum.request({ method: 'eth_chainId' });
handleChainChanged(chainId);

ethereum.on('chainChanged', handleChainChanged);

function handleChainChanged(_chainId) {
  // We recommend reloading the page, unless you must do otherwise
  //window.location.reload();
  chainId = parseInt(_chainId, 16);
  let network = Networks[chainId];
  if (toChain == chainId && step == 2) {
    step = 3;
    document.getElementById("main_button").innerHTML = "Claim tokens";
  }
  document.getElementById("blockNameFirst").innerHTML = network;
  console.log("chainId:", chainId);
}

/***********************************************************/
/* Handle user accounts and accountsChanged (per EIP-1193) */
/***********************************************************/

ethereum
  .request({ method: 'eth_accounts' })
  .then(handleAccountsChanged)
  .catch((err) => {
    // Some unexpected error.
    // For backwards compatibility reasons, if no accounts are available,
    // eth_accounts will return an empty array.
    console.error(err);
  });

// Note that this event is emitted on page load.
// If the array of accounts is non-empty, you're already
// connected.
ethereum.on('accountsChanged', handleAccountsChanged);



  } else {
    console.log('Please install MetaMask!');
  }
}

// For now, 'eth_accounts' will continue to always return an array
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log('Please connect to MetaMask.');
  } else if (accounts[0] !== currentAccount) {
    currentAccount = accounts[0];
    console.log("currentAccount:", currentAccount);

    // Do any other work!
    if (step == 0) {
      document.getElementById("main_button").innerHTML = "Swap";
      step = 1;
    }
  }
}

async function clickButton(btn) {
  if (!currentAccount) {  // connect ot metamask
    connect();
  } else if (step == 1) { //Swap
    let amount = web3.utils.toWei(document.getElementById("amount").value); // TODO use decimals of tokens
    let token = document.getElementById("asset-shot-name").innerText;
    token = Tokens[token][chainId];
    let bridge_addr = bridgeContracts[chainId];
    if (!token || !bridge_addr) {
      console.log("Wrong token or bridge");
      alert("ERROR: Wrong token or bridge!");
      return;
    }
    if (chainId == toChain) {
      console.log("Swap to the same chain is not allowed");
      alert("ERROR: wap to the same chain is not allowed!");
      return;      
    }

    txChain = chainId;
    var gas = await web3.eth.getGasPrice();
    gas = parseInt(gas*1.1).toString(); // add 10% to average gas price
    let value = 0;
    let params = {
      from: currentAccount, //addr[0]
      gasPrice: gas,//parseInt(gas*1),//web3.utils.toWei(10, "Gwei"),
      gas: 100000,
    };    
    if (token.slice(0,-2) == "0x00000000000000000000000000000000000000") {
      value = amount;
    } else {
      let tokens = new web3.eth.Contract(token_abi, token, params);
      let allowed = await tokens.methods.allowance(currentAccount, bridge_addr).call();
      if (allowed < amount) {
        await tokens.methods.approve(bridge_addr,"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff").send();
      }
    }

    let bridge = new web3.eth.Contract(bridge_abi, bridge_addr, params);
    bridge.methods.depositTokens(token, amount, toChain).send({value: value})
    .then(tx => {
      console.log(tx);
      txHash = tx.transactionHash;
      step = 2;
      document.getElementById("amount").value = txHash;
      document.getElementById("main_button").innerHTML = "Switch network to claim";

    })
    .catch(e => {
      console.log(e);
      alert("ERROR: depositTokens failed!");
    });
  } else if (step == 3) { // claim token
    signatures = [];
    let i = 0;
    var respJSON;
    var tx = document.getElementById("amount").value;
    while (i < Authorities.length) {
      var url = Authorities[i]+"tx="+tx+"&chain="+txChain;
      var resp = await fetch(url);
      respJSON = await resp.json();
      if (!respJSON.isSuccess) {
        console.log("ERROR authorization: "+respJSON.message);
        alert("ERROR: authorization failed!");
        return; 
      }
      signatures.push(respJSON.signature);
      i++;
    }
    // call smart contract
    var gas = await web3.eth.getGasPrice();
    gas = parseInt(gas*1.1).toString(); // add 10% to average gas price    
    let params = {
      from: currentAccount, //addr[0]
      gasPrice: gas,//parseInt(gas*1),//web3.utils.toWei(10, "Gwei"),
      value: 0,
      gas: 200000,
    };    
    let bridge = new web3.eth.Contract(bridge_abi, respJSON.bridge, params);
    //bridge.methods.claimMultiSig(respJSON.token, tx, respJSON.to, respJSON.value, txChain, signatures).send(params)
    bridge.methods.claim(respJSON.token, tx, respJSON.to, respJSON.value, txChain, signatures).send(params)
    .then(tx => {
      console.log(tx);
      txHash = "";
      step = 1;
      txChain = 0;
      document.getElementById("amount").value = "";
      document.getElementById("main_button").innerHTML = "Swap";

    })
    .catch(e => {
      console.log(e);
      alert("ERROR: claimMultiSig failed!");
    });
  }
}

// While you are awaiting the call to eth_requestAccounts, you should disable
// any buttons the user can click to initiate the request.
// MetaMask will reject any additional requests while the first is still
// pending.
function connect() {
  window.ethereum
    .request({ method: 'eth_requestAccounts' })
    .then(handleAccountsChanged)
    .catch((err) => {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.');
      } else {
        console.error(err);
      }
    });
  }