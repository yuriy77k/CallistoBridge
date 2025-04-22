//const {authorize, addToken} = require("./authorityV2.js");
const {claim} = require("./claimerV2.js");
// Handler
exports.handler = async (event) => {
    if (event.rawPath == "/claim") {
        return claim(event.queryStringParameters.tx, event.queryStringParameters.chain);
    }
    //else if (event.rawPath == "/claim") return claim(event.queryStringParameters.tx, event.queryStringParameters.chain);
    return {isSuccess: false, message: "API not found"};
};
