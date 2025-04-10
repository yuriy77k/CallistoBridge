const {authorize, addToken} = require("./authorityV2.js");
//const {claim} = require("./claimV2.js");
// Handler
exports.handler = async (event) => {
    if (event.rawPath == "/auth") {
        return authorize(event.queryStringParameters.tx, event.queryStringParameters.chain);
    } else if (event.rawPath == "/addToken") {
        return addToken(event.queryStringParameters.token, event.queryStringParameters.chain);
    }
    //else if (event.rawPath == "/claim") return claim(event.queryStringParameters.tx, event.queryStringParameters.chain);
    return {isSuccess: false, message: "API not found"};
};
