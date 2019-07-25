pragma solidity >=0.4.24 <0.7.0;

import "./SofaToken.sol";

contract SofaCrowdSale {
    using SafeMath for uint256;
    address private admin;
    SofaToken public tokenContract;
    uint256 public tokenSold;
    uint256 public tokenPrice;
    bool public saleOpen;

    event Sell(address _buyer, uint256 amount);

    constructor(SofaToken _sofaToken, uint256 _initalPrice) public {
        admin = msg.sender;
        tokenContract = _sofaToken;
        tokenPrice = _initalPrice;
    }

    modifier openToMarket(){
        require(saleOpen, "market closed");
        _;
    }

    modifier isAdmin(){
        require(msg.sender==admin, "operation do not approved");
        _;
    }

    function resetTokenPrice(uint256 _tokenPrice) public isAdmin{
        require(_tokenPrice > 0, "tokenPrice should be positive in Wei");
        tokenPrice = _tokenPrice;
    }

    function openForSale() public isAdmin {
        require(!saleOpen, "sale is already open");
        saleOpen = true;
    }

    function buyToken(uint256 _numberOfTokens) public payable openToMarket{
        require(msg.value == _numberOfTokens.mul(tokenPrice),"please recalculate value");
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens, "require more token than this can provide");
        require(tokenContract.transfer(msg.sender,_numberOfTokens), "transaction failed");
        tokenSold += _numberOfTokens;
        emit Sell(msg.sender,_numberOfTokens);
    }

    function endSale() public openToMarket isAdmin{
        require(tokenContract.transfer(admin,tokenContract.balanceOf(address(this))),"failed to return unsold token to admin");
        saleOpen = false;
    }

}