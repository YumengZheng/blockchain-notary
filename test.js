const bitcoin = require("bitcoinjs-lib");
const bitcoinMessage = require("bitcoinjs-message");
const SHA256 = require("crypto-js/sha256");
const level = require("level");
const chainDB = "./chaindata";
const db = level(chainDB, { valueEncoding: "json" });

const TimeoutRequestsWindowTime = 5 * 60 * 1000;

class Block {
  constructor(data) {
    (this.hash = ""),
      (this.height = 0),
      (this.body = data),
      (this.time = 0),
      (this.previousBlockHash = "");
  }
}

class Blockchain {
  constructor(app) {
    this.app = app;
    this.mempool = {};
    this.timeoutRequests = {};
    this.mempoolValid = {};
    this.addRequestValidation();
    // this.addInitialBlock();
    // this.getBlockByIndex();
    // this.postNewBlock();
  }

  //   async addInitialBlock() {
  //     let newBlock = new Block("First block in the chain - Genesis block");
  //     newBlock.height = 0;
  //     newBlock.time = new Date()
  //       .getTime()
  //       .toString()
  //       .slice(0, -3);
  //     newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
  //     newBlock.previousBlockHash = "";
  //     await this.addLevelDBData(0, newBlock);
  //   }

  //   postNewBlock() {
  //     this.app.post("/api/block", async (req, res) => {
  //       let data = req.body.data;
  //       let newBlock = new Block(data);
  //       let height = await this.getBlockHeight();
  //       let lastBlock = await this.getBlock(height - 1);
  //       newBlock.previousBlockHash = lastBlock.hash;
  //       newBlock.time = new Date()
  //         .getTime()
  //         .toString()
  //         .slice(0, -3);
  //       newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
  //       newBlock.height = height;
  //       await this.addLevelDBData(height, newBlock);
  //       res.send("saved");
  //     });
  //   }

  //   getBlockByIndex() {
  //     this.app.get("/api/block/:index", async (req, res) => {
  //       let index = req.params.index;
  //       await db.get(index, function(err, value) {
  //         if (err) {
  //           res.send("something went wrong");
  //           return console.log("Not found!", err);
  //         }
  //         let block = value;
  //         res.send(block);
  //       });
  //     });
  //   }

  //   addLevelDBData(key, value) {
  //     return new Promise(function(resolve) {
  //       db.put(key, value, function(err) {
  //         if (err) {
  //           res.send("something went wrong");
  //           return console.log("Block " + key + " submission failed", err);
  //         }
  //         resolve(console.log(key, value));
  //       });
  //     });
  //   }

  //   // Get block height
  //   getBlockHeight() {
  //     let i = 0;
  //     return new Promise(function(resolve) {
  //       db.createReadStream()
  //         .on("data", function() {
  //           i++;
  //         })
  //         .on("error", function(err) {
  //           console.log(err);
  //         })
  //         .on("close", function() {
  //           resolve(i);
  //         });
  //     });
  //   }

  //   getBlock(blockHeight) {
  //     return new Promise(resolve => {
  //       db.get(blockHeight, function(err, value) {
  //         if (err) return console.log("Not found!", err);
  //         resolve(value);
  //       });
  //     });
  //   }

  //   // validate block
  //   async validateBlock(blockHeight) {
  //     // get block object
  //     let block = await this.getBlock(blockHeight);
  //     // get block hash
  //     let blockHash = block.hash;
  //     // remove block hash to test block integrity
  //     block.hash = "";
  //     // generate block hash
  //     let validBlockHash = SHA256(JSON.stringify(block)).toString();
  //     // Compare
  //     if (blockHash === validBlockHash) {
  //       return true;
  //     } else {
  //       console.log(
  //         "Block #" +
  //           blockHeight +
  //           " invalid hash:\n" +
  //           blockHash +
  //           "<>" +
  //           validBlockHash
  //       );
  //       return false;
  //     }
  //   }

  //   // Validate blockchain
  //   async validateChain() {
  //     let errorLog = [];
  //     let height = await this.getBlockHeight();
  //     for (var i = 0; i < height - 1; i++) {
  //       // validate block
  //       if (!(await this.validateBlock(i))) errorLog.push(i);
  //       // compare blocks hash link
  //       let block = await this.getBlock(i);
  //       let blockHash = block.hash;
  //       let nextBlock = await this.getBlock(i + 1);
  //       let previousHash = nextBlock.previousBlockHash;
  //       if (blockHash !== previousHash) {
  //         errorLog.push(i);
  //       }
  //     }
  //     if (errorLog.length > 0) {
  //       console.log("Block errors = " + errorLog.length);
  //       console.log("Blocks: " + errorLog);
  //     } else {
  //       console.log("No errors detected");
  //     }
  //   }
  //   removeValidationRequest = address => {
  //     delete this.timeoutRequests[address];
  //   };

  addRequestValidation() {
    this.app.post("/requestValidation", (req, res) => {
      console.log(
        "req.body.address",
        req.body.address,
        "req.requestTimeStamp",
        req.requestTimeStamp
      );
    });
  }
  //   let walletAddress = req.body.address;
  //   if (walletAddress) {
  //     let requestTimeStamp = new Date()
  //       .getTime()
  //       .toString()
  //       .slice(0, -3);

  //     this.timeoutRequests[walletAddress] = setTimeout(function() {
  //       removeValidationRequest(walletAddress);
  //     }, TimeoutRequestsWindowTime);

  //     this.timeoutRequests[walletAddress]();

  //     let resData = {
  //       walletAddress,
  //       requestTimeStamp,
  //       message: `${walletAddress}:${requestTimeStamp}:starRegistry`, //???
  //       validationWindow: timeLeft
  //     };
  //     this.mempool[walletAddress] = resData;
  //     res.send(resData);
  //   } else {
  //     res.send("please send wallet address");
  //   }

  //   validateRequestByWallet = () => {
  //     this.app.post("/message-signature/validate", (req, res) => {
  //       let { signature, walletAddress } = req.body;
  //       let { requestTimeStamp, validationWindow } = this.mempool[walletAddress];
  //       let message = `${walletAddress}:${requestTimeStamp}:starRegistry`;
  //       let isValid = bitcoinMessage.verify(message, address, signature);
  //       if (isValid) {
  //         let result = {
  //           registerStar: isValid,
  //           status: {
  //             address: walletAddress,
  //             requestTimeStamp,
  //             message,
  //             validationWindow,
  //             messageSignature: isValid
  //           }
  //         };
  //         this.mempoolValid[walletAddress] = result;
  //         res.end(result);
  //       } else {
  //         res.end("wrong");
  //       }
  //     });
  //   };

  //   verifyAddressRequest = address => {
  //     if (
  //       this.mempoolValid[address] &&
  //       this.mempoolValid[address].status.messageSignature
  //     ) {
  //       return true;
  //     }
  //     return false;
  //   };
}

module.exports = app => {
  return new Blockchain(app);
};
