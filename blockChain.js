// const bitcoin = require("bitcoinjs-lib");
const bitcoinMessage = require("bitcoinjs-message");
const SHA256 = require("crypto-js/sha256");
const level = require("level");
const hex2ascii = require("hex2ascii");
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
    this.validateRequestByWallet();
    this.addInitialBlock();
    this.getBlockByIndex();
    this.getBlockByHash();
    this.getBlockByWalletAddress();
    this.getBlockByHeight();
    this.postNewBlock();
  }

  async addInitialBlock() {
    let newBlock = new Block("First block in the chain - Genesis block");
    newBlock.height = 0;
    newBlock.time = new Date()
      .getTime()
      .toString()
      .slice(0, -3);
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    newBlock.previousBlockHash = "";
    await this.addLevelDBData(0, newBlock);
  }

  postNewBlock() {
    this.app.post("/api/block", async (req, res) => {
      let { body } = req;
      let isValid = this.verifyAddressRequest(body.address);

      if (body !== undefined && isValid) {
        body.star.storyDecoded = hex2ascii(body.star.story);
        let newBlock = new Block(body);
        let height = await this.getBlockHeight();
        let lastBlock = await this.getBlock(height - 1);
        newBlock.previousBlockHash = lastBlock.hash;
        newBlock.time = new Date()
          .getTime()
          .toString()
          .slice(0, -3);
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        newBlock.height = height;
        await this.addLevelDBData(height, newBlock);
        res.send(newBlock);
      } else {
        res.send("please provide content");
      }
    });
  }

  getBlockByIndex() {
    this.app.get("/api/block/:index", async (req, res) => {
      let { index } = req.params;
      await db.get(index, function(err, value) {
        if (err) {
          res.send("something went wrong");
          return console.log("Not found!", err);
        }
        let block = value;
        res.send(block);
      });
    });
  }

  getBlockByHash() {
    this.app.get("/stars/hash/:hash", async (req, res) => {
      let { hash } = req.params;
      let block = {};
      await db
        .createReadStream()
        .on("data", function(data) {
          if (data.value.hash === hash) {
            block = data;
          }
        })
        .on("error", function(err) {
          res.send(err);
        })
        .on("close", function() {
          res.send(block);
        });
    });
  }

  getBlockByWalletAddress() {
    this.app.get("/stars/address/:address", async (req, res) => {
      let { address } = req.params.address;
      let arr = [];
      await db
        .createReadStream()
        .on("data", function(data) {
          if (data.value.body.address === address) {
            arr.push(data);
          }
        })
        .on("error", function(err) {
          res.send(err);
        })
        .on("close", function() {
          if (arr.length === 1) {
            res.send(arr[0]);
          } else {
            res.send(arr);
          }
        });
    });
  }

  getBlockByHeight() {
    this.app.get("/stars/height/:height", async (req, res) => {
      let { height } = req.params;
      let block = await this.getBlock(height);
      res.send(block);
    });
  }

  addLevelDBData(key, value) {
    return new Promise(function(resolve) {
      db.put(key, value, function(err) {
        if (err) {
          res.send("something went wrong");
          return console.log("Block " + key + " submission failed", err);
        }
        resolve(console.log(key, value));
      });
    });
  }

  // Get block height
  getBlockHeight() {
    let i = 0;
    return new Promise(function(resolve) {
      db.createReadStream()
        .on("data", function() {
          i++;
        })
        .on("error", function(err) {
          console.log(err);
        })
        .on("close", function() {
          resolve(i);
        });
    });
  }

  getBlock(blockHeight) {
    return new Promise(resolve => {
      db.get(blockHeight, function(err, value) {
        if (err) return console.log("Not found!", err);
        resolve(value);
      });
    });
  }

  // validate block
  async validateBlock(blockHeight) {
    // get block object
    let block = await this.getBlock(blockHeight);
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = "";
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash === validBlockHash) {
      return true;
    } else {
      console.log(
        "Block #" +
          blockHeight +
          " invalid hash:\n" +
          blockHash +
          "<>" +
          validBlockHash
      );
      return false;
    }
  }

  // Validate blockchain
  async validateChain() {
    let errorLog = [];
    let height = await this.getBlockHeight();
    for (var i = 0; i < height - 1; i++) {
      // validate block
      if (!(await this.validateBlock(i))) errorLog.push(i);
      // compare blocks hash link
      let block = await this.getBlock(i);
      let blockHash = block.hash;
      let nextBlock = await this.getBlock(i + 1);
      let previousHash = nextBlock.previousBlockHash;
      if (blockHash !== previousHash) {
        errorLog.push(i);
      }
    }
    if (errorLog.length > 0) {
      console.log("Block errors = " + errorLog.length);
      console.log("Blocks: " + errorLog);
    } else {
      console.log("No errors detected");
    }
  }
  removeValidationRequest(address) {
    delete this.timeoutRequests[address];
  }

  getValidationWindow(requestTimeStamp) {
    let timeElapse =
      new Date()
        .getTime()
        .toString()
        .slice(0, -3) - requestTimeStamp;
    let validationWindow = TimeoutRequestsWindowTime / 1000 - timeElapse;
    return validationWindow;
  }
  addRequestValidation() {
    this.app.post("/requestValidation", (req, res) => {
      let walletAddress = req.body.address;
      if (walletAddress) {
        // If the user re-submits a request, the application will not add a new request; instead,
        // it will return the same request that it is already in the mempool.
        if (this.mempool[walletAddress]) {
          res.send(this.mempool[walletAddress]);
        } else {
          //get request time
          let requestTimeStamp = new Date()
            .getTime()
            .toString()
            .slice(0, -3);
          //setTiemout for 5mins
          this.timeoutRequests[walletAddress] = setTimeout(function() {
            this.removeValidationRequest(walletAddress);
          }, TimeoutRequestsWindowTime);
          //calculate time passed
          let validationWindow = this.getValidationWindow(requestTimeStamp);
          //make message
          let message = `${walletAddress}:${requestTimeStamp}:starRegistry`;
          //put together response data
          let resData = {
            walletAddress,
            requestTimeStamp,
            message,
            validationWindow
          };
          //   save request in memory pool
          this.mempool[walletAddress] = resData;
          //send response
          res.send(resData);
        }
      } else {
        res.send("please send wallet address");
      }
    });
  }

  validateRequestByWallet() {
    this.app.post("/message-signature/validate", (req, res) => {
      let { signature, address: walletAddress } = req.body;
      let { requestTimeStamp, validationWindow, message } = this.mempool[
        walletAddress
      ];
      //   check if pass validation time
      if (validationWindow > 0) {
        // verfiy
        let isValid = bitcoinMessage.verify(message, walletAddress, signature);
        //calculate time passed
        let validationWindow = this.getValidationWindow(requestTimeStamp);
        //make response data
        let result = {
          registerStar: isValid,
          status: {
            address: walletAddress,
            requestTimeStamp,
            message,
            validationWindow,
            messageSignature: isValid
          }
        };
        //save validations to mempool
        this.mempoolValid[walletAddress] = result;
        //remove setTimeout
        this.removeValidationRequest[walletAddress];
        res.send(result);
      } else {
        res.send("validation time passed");
      }
    });
  }

  verifyAddressRequest(address) {
    return (
      this.mempoolValid[address] && this.mempoolValid[address].registerStar
    );
  }
}

module.exports = app => {
  return new Blockchain(app);
};
