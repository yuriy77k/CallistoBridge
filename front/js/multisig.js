const multisig = "0xb623E7A53835Ed23b23D13B77EC12493fF1eA70F";
var params = {};
var BN;
var gasPrice;

// function vote(address to, uint256 value, bytes calldata data)
const voteFunc = {
    name: 'vote',
    type: 'function',
    inputs: [{
        type: 'address',
        name: 'to'
    },{
        type: 'uint256',
        name: 'value'
    },{
        type: 'bytes',
        name: 'date'
    }]    
}

const Rules = [
    {
        name: "Issue BUSDT (amount)",   // 0
        chainId: "0x334",
        address: "0xbf6c50889d3a620eb42C0F188b65aDe90De958c4",
        ABI: {
            name: 'issue',
            type: 'function',
            inputs: [{
                type: 'uint256',
                name: 'value'
            }]    
        }
    },
    {
        name: "Transfer BUSDT (to, amount)", // 1
        chainId: "0x334",
        address: "0xbf6c50889d3a620eb42C0F188b65aDe90De958c4",
        ABI: {
            name: 'transfer',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'receiver'
            },{
                type: 'uint256',
                name: 'value'
            }]    
        }
    },
    {
        name: "Transfer USDT on BSC (to, amount)", // 2
        chainId: "0x38",
        address: "0x55d398326f99059ff775485246999027b3197955",
        ABI: {
            name: 'transfer',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'receiver'
            },{
                type: 'uint256',
                name: 'value'
            }]    
        }
    },
    {
        name: "Transfer USDT on ETH (to, amount)", // 3
        chainId: "0x1",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ABI: {
            name: 'transfer',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'receiver'
            },{
                type: 'uint256',
                name: 'value'
            }]    
        }
    },
    {
        name: "Transfer USDT to bridge", // 4 (BSC)
        chainId: "0x38",
        address: "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",
        ABI: {
            name: 'depositTokens',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'token'
            },{
                type: 'uint256',
                name: 'value'
            },{
                type: 'uint256',
                name: 'toChainId'
            }]    
        }
    },
    {
        name: "Approve USDT to bridge", // 5 (BSC)
        chainId: "0x38",
        address: "0x55d398326f99059ff775485246999027b3197955",
        ABI: {
            name: 'approve',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'spender'
            },{
                type: 'uint256',
                name: 'value'

            }]    
        }
    },
    {
        name: "Approve USDT to bridge", // 6 (ETH)
        chainId: "0x1",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ABI: {
            name: 'approve',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'spender'
            },{
                type: 'uint256',
                name: 'value'
            }]    
        }
    },
]    

async function login() {
    //clean();
    if (typeof ethereum !== 'undefined') {
        window.web3 = new Web3(ethereum);
        address = await ethereum.enable()
        web3.eth.defaultAccount = address[0];
        console.log(web3.eth.defaultAccount);
        var gas = await web3.eth.getGasPrice();
        gasPrice = parseInt(gas*1).toString();

        params = {
            from: web3.eth.defaultAccount, //addr[0]
            gasPrice: 0,//parseInt(gas*1),//web3.utils.toWei(10, "Gwei"),
            value: 0,
            gas: 300000,
        };
        BN = web3.utils.BN;
        //token_main = new web3.eth.Contract(token_abi, token_main_addr, params);
        document.getElementById("login").innerHTML=web3.eth.defaultAccount;
    }
    //setTimeout(update_proposals,1000);
}

// if args use as is.
async function vote(ruleId, argsNum) {
    var i = 0;
    var val = [];
    while (i<argsNum) {
        let el = document.getElementById("arg"+i+"_r"+ruleId);
        var value = el.value;
        if (el.type == "number") {
            value = web3.utils.toWei(value.toString());
        }
        val.push(value);
        i++;
    }
    //console.log(val, Rules[ruleId]);
    var args  = web3.eth.abi.encodeFunctionCall(Rules[ruleId].ABI, val);
    //var args = encodeArgs(Rules[ruleId].ABI, val);
    //console.log(args);
    var data = web3.eth.abi.encodeFunctionCall(voteFunc,[Rules[ruleId].address,"0",args]);
    console.log(data);
    document.getElementById("msg").innerHTML = data;
    if (web3.eth.currentProvider.chainId != Rules[ruleId].chainId) {
        alert("Switch chain");
        return;
    }
    let send = web3.eth.sendTransaction({from:web3.eth.defaultAccount,to:multisig, value:0, data: data});
    console.log(send);
}
