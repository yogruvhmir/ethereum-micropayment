const SofaToken = artifacts.require('./SofaToken.sol')
const CrowedSale = artifacts.require('./SofaCrowdSale.sol')
var Web3 = require("web3")
let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"))


contract('SofaToken',(accounts)=>{
    before(async () =>{
        this.sofaToken = await SofaToken.deployed()
        this.crowedSale = await CrowedSale.deployed()
        this.accounts = await web3.eth.getAccounts()
    })
    it('sofaToken contract deployed successfully', async ()=>{
        const address = await this.sofaToken.address
        assert.notEqual(address, 0x0)
        assert.notEqual(address, '')
        assert.notEqual(address, null)
        assert.notEqual(address, undefined)
        const name = await this.sofaToken.name()
        const symbol = await this.sofaToken.symbol()
        assert.equal(name,"Sofa Token")
        assert.equal(symbol,"SOFA")
        const totalSupply = await this.sofaToken.totalSupply()
        assert.equal(totalSupply.toNumber(),1000000000000)
        let admin = accounts[0]
        assert.equal(totalSupply.toNumber(),await this.sofaToken.balanceOf(admin))
    })
    it('crowd sale contract depolyed successfully',async ()=>{
        const address = await this.crowedSale.address
        assert.notEqual(address, 0x0)
        assert.notEqual(address, '')
        assert.notEqual(address, null)
        assert.notEqual(address, undefined)
        assert.equal(await this.sofaToken.address,await this.crowedSale.tokenContract())
    })
    it('crowd sale is operational',async () =>{
        const address = await this.crowedSale.address
        //send token to crowd sale contract
        await this.sofaToken.transfer(address,10000)
        assert.equal((await this.sofaToken.balanceOf(address)).toNumber(),10000)
        await this.CrowedSale.buyToken(100,{from:this.accounts[1]})
        assert.equal((await this.sofaToken.balanceOf(accounts[1])).toNumber(),100)
    })
})