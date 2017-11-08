const SafeMathLibExt = artifacts.require("./SafeMathLibExt.sol");
const CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
const FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const NullFinalizeAgentExt = artifacts.require("./NullFinalizeAgentExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");

const constants = require("../test/constants");
const utils = require("../test/utils");
const Web3 = require("web3");

let web3;
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}

const tokenParams = [
	constants.token.name,
  	constants.token.ticker,
  	parseInt(constants.token.supply, 10),
  	parseInt(constants.token.decimals, 10),
  	constants.token.isMintable,
  	constants.token.globalmincap
];

const pricingStrategyParams = [
	web3.toWei(1/constants.pricingStrategy.rate, "ether"),
    constants.crowdsale.isUpdatable
];

const crowdsaleParams = [
	constants.crowdsale.start,
	constants.crowdsale.end,
	constants.crowdsale.minimumFundingGoal,
	constants.crowdsale.maximumSellableTokens,
	constants.crowdsale.isUpdatable,
	constants.crowdsale.isWhiteListed
];

let nullFinalizeAgentParams = [];
let reservedTokensFinalizeAgentParams = [];

module.exports = function(deployer, network, accounts) {
  	deployer.deploy(SafeMathLibExt).then(async () => {
	  	await deployer.link(SafeMathLibExt, CrowdsaleTokenExt);
  		await deployer.deploy(CrowdsaleTokenExt, ...tokenParams);
		await deployer.link(SafeMathLibExt, FlatPricingExt);
  		await deployer.deploy(FlatPricingExt, ...pricingStrategyParams);
  		crowdsaleParams.unshift(accounts[3]);
		crowdsaleParams.unshift(FlatPricingExt.address);
		crowdsaleParams.unshift(CrowdsaleTokenExt.address);

		await deployer.link(SafeMathLibExt, MintedTokenCappedCrowdsaleExt);
    	await deployer.deploy(MintedTokenCappedCrowdsaleExt, ...crowdsaleParams);

    	nullFinalizeAgentParams.push(MintedTokenCappedCrowdsaleExt.address);
    	reservedTokensFinalizeAgentParams.push(CrowdsaleTokenExt.address);
    	reservedTokensFinalizeAgentParams.push(MintedTokenCappedCrowdsaleExt.address);

    	await deployer.link(SafeMathLibExt, NullFinalizeAgentExt);
    	await deployer.deploy(NullFinalizeAgentExt, ...nullFinalizeAgentParams);
    	await deployer.link(SafeMathLibExt, ReservedTokensFinalizeAgent);
    	await deployer.deploy(ReservedTokensFinalizeAgent, ...reservedTokensFinalizeAgentParams);

    	await FlatPricingExt.deployed().then(async (instance) => {
	    	instance.setLastCrowdsale(MintedTokenCappedCrowdsaleExt.address);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	//todo: setReservedTokensListMultiple
	    	//let addrs = [];
	    	//addrs.push(constants.reservedTokens.addr);
	    	//let inTokens = [];
	    	//inTokens.push(constants.reservedTokens.reservedTokens);
	    	//let inTokensPercentage = [];
	    	//inTokensPercentage.push(constants.reservedTokens.reservedTokensInPercentage);
	    	//instance.setReservedTokensListMultiple(addrs, inTokens, inTokensPercentage);
	    	await instance.setReservedTokensList(accounts[2], constants.reservedTokens.reservedTokensInTokens, constants.reservedTokens.reservedTokensInPercentage);
	    });

	    await MintedTokenCappedCrowdsaleExt.deployed().then(async (instance) => {
	    	//instance.updateJoinedCrowdsalesMultiple(MintedTokenCappedCrowdsaleExt.address);
	    	await instance.clearJoinedCrowdsales();
	    	//await instance.updateJoinedCrowdsales(instance.address);
	    });

	    await MintedTokenCappedCrowdsaleExt.deployed().then(async (instance) => {
	    	await instance.setLastCrowdsale(instance.address);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	await instance.setMintAgent(MintedTokenCappedCrowdsaleExt.address, true);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	await instance.setMintAgent(NullFinalizeAgentExt.address, true);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	await instance.setMintAgent(ReservedTokensFinalizeAgent.address, true);
	    });

	    await MintedTokenCappedCrowdsaleExt.deployed().then(async (instance) => {
	    	await instance.setEarlyParicipantWhitelist(accounts[2], constants.whiteListItem.status, constants.whiteListItem.minCap, constants.whiteListItem.maxCap);
	    });

	    await MintedTokenCappedCrowdsaleExt.deployed().then(async (instance) => {
	    	await instance.setFinalizeAgent(ReservedTokensFinalizeAgent.address);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	await instance.setReleaseAgent(ReservedTokensFinalizeAgent.address);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	await instance.transferOwnership(ReservedTokensFinalizeAgent.address);
	    });
  	});
};