const multisig = "0x6A56D0f7498C9f2AEb9Bb6892Ade5b2E0A50379F";
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
        name: "Upgrade",   // 0
        //chainId: "0x334",
        address: "0x9a1fc8C0369D49f3040bF49c1490E7006657ea56",
        ABI: {
            name: 'upgrade',
            type: 'function',
            inputs: []    
        }
    },
    {
        name: "Add owner", // 1
        //chainId: "0x334",
        address: "0x6A56D0f7498C9f2AEb9Bb6892Ade5b2E0A50379F",
        ABI: {
            name: 'addOwner',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'owner'
            }]    
        }
    },
    {
        name: "Remove owner", // 2
        //chainId: "0x334",
        address: "0x6A56D0f7498C9f2AEb9Bb6892Ade5b2E0A50379F",
        ABI: {
            name: 'removeOwner',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'owner'
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
    /*
    if (web3.eth.currentProvider.chainId != Rules[ruleId].chainId) {
        alert("Switch chain");
        return;
    }
    */
    let send = web3.eth.sendTransaction({from:web3.eth.defaultAccount,to:multisig, value:0, data: data});
    console.log(send);
}
