
/*
    call /auth?tx= transaction hash &chain= chain Id where transaction was sent
    for example: http://127.0.0.1:3000/auth?tx=0x160da6ff33bb23a6dd0f5c2b34326204fd812ecbe69e41e7c146797613b225dd&chain=56
    should returns JSON with bridge address to call function claim() and required parameters: 
    {
        signature	"0xaec01b5b8a339579f3e59b98f1b04ed37a864d3f90f78cefd361e5bb5514537c70d67351d1c33d0a1f0039908b1b01d7d5542fba481ddb7991b0a4776012c2811c"
        chainId	"820"
        to	"0xe5642553B1c96d5d9CEf55d085883Bfb5412ca39"
        bridge	"0x9a1fc8C0369D49f3040bF49c1490E7006657ea56"
        value	"382947884000000000000"
        isSuccess	true
        token	"0xbf6c50889d3a620eb42C0F188b65aDe90De958c4"
    }

    txId and fromChainId is the same as used for signature request.

    In this example the authority address: 0x3d40De3046a7D7E2Aa9E8097A86e49c699A0170B
*/

const auth = require("./authority.js");
const claimer = require("./claimer.js");

const http = require('http');
const url = require('url');
const port = 3000;


const requestHandler = (request, response) => {
    console.log(request.url);
    let url = new URL("http://"+request.host+request.url);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader("Access-Control-Allow-Methods", '*');
    response.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');


    // if request to authorize swap
    if (url.pathname == "/auth") {
        //console.log(request.url);
        let params = url.searchParams;
        let txId = params.get('tx');    // transaction ID
        let fromChainId = params.get('chain'); // transaction chain ID
        auth.authorize(txId, fromChainId, false)
        .then(resp => {
            //console.log(resp);
            response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
            response.end(JSON.stringify(resp));

        })
        .catch(err => {
            response.writeHead(404, {'Content-Type': 'text/html'});
            response.end(err.toString());            
        })
    }
    else 
    // if request to authorize NFT bridge
    if (url.pathname == "/authNFT") {
        //console.log(request.url);
        let params = url.searchParams;
        let txId = params.get('tx');    // transaction ID
        let fromChainId = params.get('chain'); // transaction chain ID
        auth.authorize(txId, fromChainId, true)
        .then(resp => {
            //console.log(resp);
            response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
            response.end(JSON.stringify(resp));

        })
        .catch(err => {
            response.writeHead(404, {'Content-Type': 'text/html'});
            response.end(err.toString());            
        })
    }
    else 
    // if request to claim behalf
    if (url.pathname == "/claim") {
        //console.log(request.url);
        let params = url.searchParams;
        let txId = params.get('tx');    // transaction ID
        let fromChainId = params.get('chain'); // transaction chain ID
        claimer.claim(txId, fromChainId)
        .then(resp => {
            //console.log(resp);
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

