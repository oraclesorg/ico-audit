/**
 * This smart contract code is Copyright 2017 TokenMarket Ltd. For more information see https://tokenmarket.net
 *
 * Licensed under the Apache License, version 2.0: https://github.com/TokenMarketNet/ico/blob/master/LICENSE.txt
 */

import "oracles-zeppelin/contracts/token/ERC20.sol";
import "oracles-zeppelin/contracts/ownership/Ownable.sol";
import './StandardToken.sol';
import "./SafeMathLibExt.sol";

pragma solidity ^0.4.6;

/**
 * A token that can increase its supply by another contract.
 *
 * This allows uncapped crowdsale by dynamically increasing the supply when money pours in.
 * Only mint agents, contracts whitelisted by owner, can mint new tokens.
 *
 */
contract MintableTokenExt is StandardToken, Ownable {

  using SafeMathLibExt for uint;

  bool public mintingFinished = false;

  /** List of agents that are allowed to create new tokens */
  mapping (address => bool) public mintAgents;

  event MintingAgentChanged(address addr, bool state  );

  struct ReservedTokensData {
    uint inTokens;
    uint inPercentage;
  }

  mapping (address => ReservedTokensData) public reservedTokensList;
  address[] public reservedTokensDestinations;
  uint public reservedTokensDestinationsLen = 0;

  function setReservedTokensList(address addr, uint inTokens, uint inPercentage) onlyOwner {
    reservedTokensDestinations.push(addr);
    reservedTokensDestinationsLen++;
    reservedTokensList[addr] = ReservedTokensData({inTokens:inTokens, inPercentage:inPercentage});
  }

  function getReservedTokensListValInTokens(address addr) constant returns (uint inTokens) {
    return reservedTokensList[addr].inTokens;
  }

  function getReservedTokensListValInPercentage(address addr) constant returns (uint inPercentage) {
    return reservedTokensList[addr].inPercentage;
  }

  function setReservedTokensListMultiple(address[] addrs, uint[] inTokens, uint[] inPercentage) onlyOwner {
    for (uint iterator = 0; iterator < addrs.length; iterator++) {
      setReservedTokensList(addrs[iterator], inTokens[iterator], inPercentage[iterator]);
    }
  }

  /**
   * Create new tokens and allocate them to an address..
   *
   * Only callably by a crowdsale contract (mint agent).
   */
  function mint(address receiver, uint amount) onlyMintAgent canMint public {
    totalSupply = totalSupply.plus(amount);
    balances[receiver] = balances[receiver].plus(amount);

    // This will make the mint transaction apper in EtherScan.io
    // We can remove this after there is a standardized minting event
    Transfer(0, receiver, amount);
  }

  /**
   * Owner can allow a crowdsale contract to mint new tokens.
   */
  function setMintAgent(address addr, bool state) onlyOwner canMint public {
    mintAgents[addr] = state;
    MintingAgentChanged(addr, state);
  }

  modifier onlyMintAgent() {
    // Only crowdsale contracts are allowed to mint new tokens
    if(!mintAgents[msg.sender]) {
        throw;
    }
    _;
  }

  /** Make sure we are not done yet. */
  modifier canMint() {
    if(mintingFinished) throw;
    _;
  }
}
