const Telegraf = require('telegraf');
const axios = require('axios');

// Replace YOUR_API_TOKEN with your Telegram bot's API token
const bot = new Telegraf('6068590803:AAEp5TIZztA2HImc7Orh8nb6OL7Z12gx2RA');

// Replace YOUR_ETHERSCAN_API_KEY with your Etherscan API key
const etherscanApiKey = '21VJQXRGJYVJCUM539C5IWHW5TP352UESS';

// Store the last checked block number
let lastCheckedBlock = 0;

// Interval for checking new transactions (in milliseconds)
const interval = 60000;

// Function to get the latest block number
async function getLatestBlockNumber() {
  const response = await axios.get(`https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${etherscanApiKey}`);
  return parseInt(response.data.result, 16);
}

// Function to fetch the transaction details for a given transaction hash
async function getTransactionDetails(txHash) {
  const response = await axios.get(`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${etherscanApiKey}`);
  return response.data.result;
}

// Function to fetch the token details for a given contract address
async function getTokenDetails(contractAddress) {
  const response = await axios.get(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${etherscanApiKey}`);
  return response.data.result[0];
}

// Function to format the message with the token details
function formatMessage(tokenDetails, txDetails) {
  const tokenName = tokenDetails.ContractName;
  const tokenSymbol = tokenDetails.Symbol;
  const tokenTax = tokenDetails.Tax;
  const contractVerificationStatus = tokenDetails.VerifiedContract;
  const deployerBalance = txDetails.fromBalance;
  const chartLink = `https://poocoin.app/tokens/${txDetails.to}`;
  const etherscanLink = `https://etherscan.io/token/${txDetails.to}?a=${txDetails.hash}`;

  return `
    New token alert!

    Token name: ${tokenName}
    Ticker symbol: ${tokenSymbol}
    Token tax: ${tokenTax}%
    Contract verification status: ${contractVerificationStatus}
    Deployer ETH balance: ${deployerBalance} ETH
    Chart: ${chartLink}
    Etherscan mint tx: ${etherscanLink}
  `;
}

// Function to check for new transactions
async function checkForNewTransactions() {
  const latestBlock = await getLatestBlockNumber();

  // Check for new transactions since the last checked block
  const response = await axios.get(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=0x0000000000000000000000000000000000001004&startblock=${lastCheckedBlock}&endblock=${latestBlock}&apikey=${etherscanApiKey}`);

  // If there are new transactions, fetch the token and transaction details and send a message to Telegram
  if (response.data.result.length > 0) {
    for (const tx of response.data.result) {
      // Fetch the token details
      const tokenDetails = await getTokenDetails(tx.contractAddress);

      // Fetch the transaction details
      const txDetails = await getTransactionDetails(tx.hash);
      const fromBalance = await axios.get(`https://api.etherscan.io/api?module=account&action=balance&address=${txDetails.from}&tag=latest&apikey=${etherscanApiKey}`);
      txDetails.fromBalance = parseFloat(fromBalance.data.result) / 1e18;

      // Send a message to Telegram
      const message = format
      bot.telegram.sendMessage(CHAT_ID, message);
    }

    // Update the last checked block number
    lastCheckedBlock = latestBlock;
  }
}

// Start checking for new transactions
setInterval(checkForNewTransactions, interval);

// Start the bot
bot.launch();
