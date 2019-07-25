App = {
    loading: false,
    contracts: {},
    checkArray : [],
    tokenAccountList:[],
    load: async () => {
      await App.loadWeb3()
      await App.loadAccount()
      await App.loadContract()
      await App.initDisplay()
      App.initBinding()
    },
    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
      
      // Modern dapp browsers...
      if (window.ethereum) {
        window.web3 = new Web3(ethereum)
        try {
          // Request account access if needed
          await ethereum.enable()
          // Acccounts now exposed
          web3.eth.sendTransaction({/* ... */})
        } catch (error) {
          // User denied account access...
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        App.web3Provider = web3.currentProvider
        window.web3 = new Web3(web3.currentProvider)
        // Acccounts always exposed
        web3.eth.sendTransaction({/* ... */})
      }
      // Non-dapp browsers...
      else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
      }
      if (typeof web3 !== 'undefined') {
        App.web3Provider = web3.currentProvider
        web3 = new Web3(web3.currentProvider)
      } else {
        window.alert("Please connect to Metamask.")
      }
    },
    loadAccount: async () => {
      // Set the current blockchain account
      t = await web3.eth.getAccounts()
      App.account = t[0]
      $("#sender_address").html("address:"+App.account)
    },
    loadContract: async () => {
      // token contract
      const SofaToken = await $.getJSON('SofaToken.json')
      App.contracts.SofaToken = TruffleContract(SofaToken)
      App.contracts.SofaToken.setProvider(App.web3Provider)
      App.SofaToken = await App.contracts.SofaToken.deployed()
      // crowd sale contract
      const CrowdSale = await $.getJSON('SofaCrowdSale.json')
      App.contracts.CrowdSale = TruffleContract(CrowdSale)
      App.contracts.CrowdSale.setProvider(App.web3Provider)
      App.CrowdSale = await App.contracts.CrowdSale.deployed()
      // micropayment contract
      const PayToCheck = await $.getJSON('PayToCheck.json')
      App.contracts.PayToCheck = TruffleContract(PayToCheck)
      App.contracts.PayToCheck.setProvider(App.web3Provider)
      App.PayToCheck = await App.contracts.PayToCheck.deployed()
    },
    initBinding : ()=>{
      $( "#deposite" ).bind( "click", App.deposite)
      $("#query_sofa").bind("click",App.queryAccount)
      $("#sofa_transfer").bind("click",App.sofaTransfer)
      $("#set_token_price").bind("click",App.setTokenPrice)
      $("#open_sale").bind('click',App.crowdOpenSale)
      $("#buy_amount").bind('keydown',App.calculateCost)
      $("#buy_token").bind('click',App.buySofa)
    },
    initDisplay: async () =>{
      $("#sender_address").html("address: "+App.account)
      $("#contract_address").html("contract address: "+App.PayToCheck.address)
      $("#sofa_token_contract_address").html(App.SofaToken.address)
      $("#crowdsale-contract-address").html(App.CrowdSale.address)
      App.refreshCrowdSale()
      App.refresh();
    },  
    refresh: async ()=>{
      //show token
      let totalSupply = await App.SofaToken.totalSupply()
      $("#total_supply").html(totalSupply.toNumber())
      //refrash contract balance
      let sb = await App.SofaToken.balanceOf(App.account)
      $("#sender_balance").html("balance: "+sb.toNumber()+" SOFA")
     App.senderBalance = sb
     //refresh sender balance
     let cb = await App.SofaToken.balanceOf(App.PayToCheck.address)
    //  cb = web3.utils.fromWei(cb,'ether')
     $("#contract_balance").html("balance: "+cb.toNumber()+" SOFA")
     App.contractBalance = cb
     //refrsh receiver balance
     App.setAccount()
     App.refreshCheck()
     App.refreshSaleState()
     App.refreshTokenBalance()
     App.refreshCrowdSale()
    },
    queryAccount: async() =>{
      let account = $("#sofa_token_account").val().replace(/\s/g, '');
      if(!web3.utils.isAddress(account)){
        alert("not a valid address")
      }else{
        if(!App.tokenAccountList.includes(account)){
          App.tokenAccountList.push(account)
          App.traceAccount(account)
        }
      }
    },
    traceAccount: async (account)=>{
        let $temp0 = $("#template0")
        let $0 = $temp0.clone()
        let balance = await App.SofaToken.balanceOf(account)
        let eth = web3.utils.fromWei(await web3.eth.getBalance(account),'ether')
        $0.html(account+": " +"<p>"+balance+"  SOFA & "+ eth+" ETH</p>").attr("account",account)
        $("#sofa_accounts_list").append($0)
        $0.show()
    },
    refreshTokenBalance: async()=>{
      $("#sofa_accounts_list").html("")
      for(var i in App.tokenAccountList){
        let account = App.tokenAccountList[i]
        App.traceAccount(account)
      }
    },
    sofaTransfer: async()=>{
      let rAddress = $("#sofa_receiver").val();
      if(!web3.utils.isAddress(rAddress)){
        alert("address not valid")
      }else{
        let amount = $("#transfer_amount").val()
        let balance = (await App.SofaToken.balanceOf($("#current_account").html())).toNumber()
        if(balance<amount){
          alert("can't transfer amount over balance")
        }else{
          await App.SofaToken.transfer(rAddress,amount)
          App.refresh()
        }
      }
    },
    buySofa: async ()=>{
      var currentAccount = (await web3.eth.getAccounts())[0]
      var amount = $("#buy_amount").val()
      var cost = amount * App.tokenPrice
      await App.CrowdSale.buyToken(amount,{from:currentAccount,to:App.CrowdSale.address,value:cost})
      App.refresh()
    },
    refreshSaleState: async ()=>{
      let openstate = await App.CrowdSale.saleOpen()
      if(openstate){
        $("#crowdtitle").html("SOFA CrowdSale (open)").attr("style","color:deepskyblue")
        $("#open_sale").html("close sale")
      }else{
        $("#crowdtitle").html("SOFA CrowdSale (close)").attr("style","color:gray")
        $("#open_sale").html("open sale")
      }
    },
    refreshCrowdSale: async ()=>{
      $("#crowdsale-contract-balance").html((await App.SofaToken.balanceOf(App.CrowdSale.address)).toNumber() + " SOFA & "
      + web3.utils.fromWei((await web3.eth.getBalance(App.CrowdSale.address)),"ether") +" ETH"
      )
      let price = (await App.CrowdSale.tokenPrice()).toNumber().toString()
      $("#token_price").val(price)
      $("#equal_ether").html(" = "+web3.utils.fromWei(price,'ether')+" ETH per SOFA").show()
      App.tokenPrice = price
      let tokenSold = (await App.CrowdSale.tokenSold()).toNumber()
      $("#token_sold").html(tokenSold)
    },
    crowdOpenSale: async ()=>{
      let openstate = await App.CrowdSale.saleOpen()
      if(openstate){
        await App.CrowdSale.endSale()
        App.refreshSaleState()
      }else{
        await App.CrowdSale.openForSale()
        App.refreshSaleState()
      }
    },
    calculateCost: ()=>{
      let amount = $("#buy_amount").val()
      let price = $("#token_price").val()
      if(price < 1000000000){
        $("#ether_cost").html(App.tokenPrice*amount+" Wei")
      }else{
        $("#ether_cost").html(web3.utils.fromWei(App.tokenPrice,'ether')*amount+" ETH")
      }
    },
    setTokenPrice: async ()=>{
      let price = $("#token_price").val()
      App.tokenPrice = price
      if(price%1>0 || price<=0){
        alert("price should be uint256 in Wei")
      }else{
        await App.CrowdSale.resetTokenPrice(price)
        if(price < 1000000000){
          $("#equal_ether").html(" = "+price +" Wei per SOFA").show()
        }else{
          $("#equal_ether").html(" = "+web3.utils.fromWei(price,'ether')+" ETH per SOFA").show()
        }
        
      }
    },
    refreshCheck: async ()=>{
      let $temp1 = $('#template1')
      $("#checklist").html("")
      for(i=0;i<App.checkArray.length;i++){
        let nonce = App.checkArray[i]
        let state = await App.PayToCheck.returnCheckState(nonce)
        state = state.toNumber()
        let $t1 = $temp1.clone()
        if(state==0){
          $t1.find("span").prop("style","color:springgreen")
        }else if(state==1){
          $t1.find("span").prop("style","color:gray")
        }else{
          $t1.find("span").prop("style","color:red")
        }
        $t1.append(nonce)
        $("#checklist").append($t1)
        $t1.show()
      }
    },
    deposite: async() =>{
      let depos = $("#deposite_value").val()
      if(App.checkValue(depos)){
        await App.SofaToken.transfer(App.PayToCheck.address,depos)
        App.refresh()
        // web3.eth.sendTransaction({from:App.account,to:App.PayToCheck.address,value:web3.utils.toWei(depos),gas:300000}).then(function(res)
        // })
      }
    },
    checkValue: (value)=>{
      if(value<=0){
        alert("can't send zero or negative value")
        return false;
      }else if(value>App.senderBalance){
        alert("can't send value over balance")
        return false;
      }
      return true;
    },
    // cancelCheck: async ()=>{
    //   let nonce = $("#nonce_to_cancel").val()
    //   await App.PayToCheck.cancelNonce(nonce)
    //   if(!(nonce in App.checkArray)){
    //     App.checkArray.push(nonce)
    //   }
    //   App.refreshCheck()
    // },
    setAccount: async ()=>{
      //show current account
      $("#current_account").html((await web3.eth.getAccounts())[0])
      //refresh receiver balance
      let rAddress =  $("#receiver_address").val()
      if(web3.utils.isAddress(rAddress)){
        let rb = await App.SofaToken.balanceOf(rAddress)
        $("#receiver_balance").html("balance: "+rb.toNumber()+"SOFA")
      }
    },
    claim: async (nonce)=>{
      let rAddress =  $("#receiver_address").val()
      if(!web3.utils.isAddress(rAddress)){
        alert("receiver address not valid")
        return
      }else{
        let check = $("div[nonce='"+nonce+"']")
        value = check.attr("sendValue")
        s = check.attr("s")
        r = check.attr("r")
        v = check.attr("v")
        await App.PayToCheck.claimPayment(value,nonce,v,r,s)
        App.refresh()
      }
    },
    createCheck: async ()=>{
      let rAddress = $("#send_to").val()
      let sendValue = $("#send_value").val() 
      let nonce = $("#nonce").val()
      let state = await App.PayToCheck.returnCheckState(nonce)
      if(state.toNumber()!=0){
        alert("not a valid nonce")
        return
      }
      if (!web3.utils.isAddress(rAddress)){
        alert("send to a invalid address")
        return
      }else{
        if(App.checkValue(sendValue)){
          var h = web3.utils.soliditySha3(rAddress,sendValue , nonce,App.PayToCheck.address);
          var sig = await web3.eth.sign(h,App.account);
          sig = sig.slice(2);
          var r = `0x${sig.slice(0, 64)}`;
          var s = `0x${sig.slice(64, 128)}`;
          var v = web3.utils.toDecimal(sig.slice(128, 130))
          const $temp2 = $('#template2')
            const $t2 = $temp2.clone()
            $t2.attr("nonce",nonce)
            .attr("sendValue",sendValue)
            .attr("r",r)
            .attr("s",s)
            .attr("v",v)
            .attr("h",h)
            .html("nonce: "+nonce+" sendValue: "+sendValue+" SOFA  "+
            "<button onclick = 'App.claim("+nonce+")'>claim</button>"
            )
            $("#receiver_check_list").append($t2)
            $t2.show()
            App.checkArray.push(nonce)
            App.refreshCheck()
        }
      }
    },
  }
  $(() => {
    $(window).load(() => {
      App.load()
    })
  })
