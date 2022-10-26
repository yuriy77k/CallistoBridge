# Setup Authority on AWS Lambda

1. Create [AWS](https://aws.amazon.com/) account or use existing. Can be used free account as well.

2. Update [index.js](https://github.com/Degenswap/Bridge/blob/master/AWS_Lambda/index.js) [RPC providers](https://github.com/yuriy77k/CallistoBridge/blob/f73fccc5232f5e987f163a1fa745d34a1f6a6869/server/AWS_Lambda/index.js#L38-L48) list with your own RPC (if you have). If you are using RPC from [Infura.io](https://github.com/yuriy77k/CallistoBridge/blob/f73fccc5232f5e987f163a1fa745d34a1f6a6869/server/AWS_Lambda/index.js#L44-L45) add your project ID to the link. I.e. `https://mainnet.infura.io/v3/123456789`, where: `123456789` is your project ID from Infura.

3. Add updated `index.js` to archive [aws_lambda.zip](./aws_lambda.zip)

4. Create Lambda function like on the screenshot.
![Create Lambda Function](./lambda1.jpg)

5. Copy `URL` - it's your authority API entrypoint. 
![API URL](./lambda2.jpg)

6. Upload `aws_lambda.zip` (authority code) to the server.
![Upload aws_lambda.zip](./lambda3.jpg)

7. Open `Configuration` tab and `Environment variables` in it. Click `Edit`.
![Environment variables](./lambda4.jpg)

8. Add environment variable `AUTHORITY_PK` and `private key` of your Authority wallet.
![AUTHORITY_PK environment variables](./lambda5.jpg)

