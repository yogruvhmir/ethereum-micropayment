const SofaToken = artifacts.require("SofaToken");
const PayToCheck = artifacts.require("PayToCheck");


module.exports = async function(deployer) {
  deployer.deploy(SofaToken,1000000000000)
};

