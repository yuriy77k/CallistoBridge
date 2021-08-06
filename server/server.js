
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

    In this example the authority address: 0x3d40De3046a7D7E2Aa9E8097A86e49c699A0170B
*/

const auth = require("./authority.js");
const http = require('http');
const url = require('url');
const port = 3000;


const requestHandler = (request, response) => {
    console.log(request.url);
    let url = new URL("http://"+request.host+request.url);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader("Access-Control-Allow-Methods", '*');
    response.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');


    // if process request to authorize swap
    if (url.pathname == "/auth") {
        //console.log(request.url);
        let params = url.searchParams;
        let txId = params.get('tx');    // transaction ID
        let fromChainId = params.get('chain'); // transaction chain ID
        auth.authorize(txId, fromChainId)
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

