### MicroPayment开发验证过程

#### 基本流程

- 参与角色：
alice：使用流量的客户,在这里也部署了合约
bob：提供流量的矿机
- 流程：
1. alice 部署合约
合约的功能主要是沉淀资金，验证支票信息，兑现支票（有可能有退款功能）
2. alice 向合约地址转账，作为抵押资金
```
web3.eth.sendTransaction({from:alice_address,to:contract_address,value:n})
```
3. alice 使用了bob提供的服务，签发支票给bob（可使用任何方式发送，无需保密）
支票内容包含
a.金额
b.bob地址
c.nonce，防止bob重放攻击
d.合约地址，防止重复部署合约被重放攻击
签名过程如下：
```
var h = web3.utils.soliditySha3(bob_address,value , nonce,contract.address);
var sig = await web3.eth.sign(h,alice_address);
sig = sig.slice(2);
var r = `0x${sig.slice(0, 64)}`;
var s = `0x${sig.slice(64, 128)}`;
var v = web3.utils.toDecimal(sig.slice(128, 130))
```
4.bob 接受支票，请求智能合约发放资金给自己
```
contract.claimPayment(value,nonce,v,r,s,{from:bob_address})
```

- 合约代码
```

pragma solidity >=0.4.24 <0.7.0;
contract ReceiverPays {
    address owner = msg.sender;
    mapping(uint256 => bool) usedNonces;
    function() external payable {}
    function claimPayment(uint256 amount, uint256 nonce, uint8 v, bytes32 r, bytes32 s) public {
        require(!usedNonces[nonce]);
        usedNonces[nonce] = true;
        bytes32 message = recreateMsg(msg.sender, amount, nonce,address(this));
        require(testRecovery(message,v,r,s) == owner);
        msg.sender.transfer(amount);
       }
       // this recreates the message that was signed on the client
    function recreateMsg(address add, uint256 amount, uint256 nonce,address contractAddress) public view returns (bytes32){
        return keccak256(abi.encodePacked(add, amount, nonce,contractAddress));
    }
    function testRecovery(bytes32 h, uint8 v, bytes32 r, bytes32 s) public pure returns (address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 t = keccak256(abi.encodePacked(prefix, h));
        address addr = ecrecover(t, v, r, s);
        return addr;
    }
    function kill() public {
        require(msg.sender == owner);
    selfdestruct(msg.sender);
    }
}


```