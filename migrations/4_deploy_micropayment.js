const PayToCheck = artifacts.require("PayToCheck");
const SofaToken = artifacts.require("SofaToken");

module.exports = function(deployer) {
  deployer.deploy(PayToCheck,SofaToken.address);
};
