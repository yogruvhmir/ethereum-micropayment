const SofaCrowdSale = artifacts.require("SofaCrowdSale");
const SofaToken = artifacts.require("SofaToken");

module.exports = function(deployer) {
    deployer.deploy(SofaCrowdSale,SofaToken.address,100000000000000)
};
