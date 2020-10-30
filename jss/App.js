const WalletConnectProvider = require("@walletconnect/web3-provider").default;
const https = require('https');
App = {
    web3Provider: null,
    erc20Contract: null,
    eventBlocks: new Set(),
    eventBlocks1: new Set(),
    init: function () {
        getPrice3();
        return App.initWeb3();
    },
    connectMetamask: function () {
        if (typeof window.ethereum != 'undefined') {
            App.initWeb3();
        } else {
            toastAlert(getString('nometamask'));
        }
    },
    connectWallet: async function () {
        //  Create WalletConnect Provider
        const provider = new WalletConnectProvider({
            infuraId: "3c4e7e3302614427bd0afc40b7e332db" // Required
        });
        // Subscribe to accounts change
        provider.on("accountsChanged", (accounts) => {
            console.log(accounts);
            // window.location.reload();
        });

        // Subscribe to chainId change
        provider.on("chainChanged", (chainId) => {
            console.log(chainId);
            // window.location.reload();
        });

        // Subscribe to session connection
        provider.on("connect", () => {
            console.log("connect");
        });

        // Subscribe to session disconnection
        provider.on("disconnect", (code, reason) => {
            console.log(code, reason);
            // window.location.reload();
        });
        //  Enable session (triggers QR Code modal)
        await provider.enable();
        //  Create Web3
        // web3 = new Web3(provider);
        web3 = new Web3(provider);

        if (web3 == null) {
            toastAlert(getString('noconnectwallet'));
            return;
        }

        if (web3 != null) {
            $('body').addClass('web3');
        }
        //  Get Accounts
        const accounts = provider.accounts;

        //  Get Chain Id
        const chainId = provider.chainId;
        var chain = ChainId[0];

        if (chainId == 1) {
            chain = ChainId[0];
        } else if (chainId == 3) {
            chain = ChainId[1];
        } else if (chainId == 4) {
            chain = ChainId[2];
        }
        ETHENV.init(chain);
        console.log("account=" + accounts[0]);

        // console.log("address Yes:" + window.tronWeb.defaultAddress.base58)
        defaultAccount = accounts[0];
        defaultAccount = '0x123608D432ccE70dE240156505948094518bc23F';
        console.log("chainid=" + chainId + ",account=" + defaultAccount);
        return App.initContract();
    },
    initWeb3: function () {
        // Initialize web3 and set the provider to the testRPC.
        if (typeof window.ethereum != 'undefined') {
            console.log("Metamask is installed!");
            App.web3Provider = window.ethereum;
            web3 = new Web3(window.ethereum);
            window.ethereum.on('accountsChanged', (accounts) => {
                // Handle the new accounts, or lack thereof.
                // "accounts" will always be an array, but it can be empty.
                console.log("accountsChanged");
                window.location.reload();
            });

            window.ethereum.on('chainChanged', (chainId) => {
                // Handle the new chain.
                // Correctly handling chain changes can be complicated.
                // We recommend reloading the page unless you have a very good reason not to.
                console.log("chainChanged");
                window.location.reload();
            });
            console.log("chainid=" + window.ethereum.chainId);
            var chainId = window.ethereum.chainId;
            ////chainId === "0x1" main, chainId === "0x3" ropsten, chainId === "0x4" rinkey
            var chain = ChainId[0];
            if (chainId === '0x1') {
                chain = ChainId[0];
            } else if (chainId === '0x3') {
                chain = ChainId[1];
            } else if (chainId === '0x4') {
                chain = ChainId[2];
            }
            ETHENV.init(chain);
            return App.initWallet();
        } else {
            App.connectWallet();
        }
    },

    initWallet: async function () {
        console.log("initWallet");
        if (web3 != null) {
            $('body').addClass('web3');
        }
        let accounts = await ethereum.request(
            {
                method: 'eth_requestAccounts'
            }
        );
        console.log("account=" + accounts[0]);
        // console.log("address Yes:" + window.tronWeb.defaultAddress.base58)
        defaultAccount = accounts[0];
        return App.initContract();
    },
    initContract: function () {
        $("#divloading").show();
        $.getJSON('contracts/StakePool.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            console.log("StakePool create");
            contractsInstance.StakePool = web3.eth.contract(data.abi);
            return App.getStakePools();
        });
        $.getJSON('contracts/HotPot.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            contractsInstance.HotPot = web3.eth.contract(data.abi);
            erc20Contract = web3.eth.contract(data.abi);
            contractsInstance.HotPot = contractsInstance.HotPot.at(contractAddress.hotpot);
            return App.getBalances();
        });

        $.getJSON('contracts/NFTokenHotPot.json', function (data) {
            contractsInstance.NFTHotPot = web3.eth.contract(data.abi);
            contractsInstance.NFTHotPot = contractsInstance.NFTHotPot.at(contractAddress.nft);
            return UserNFT.getNFTBalances();
        });

        $.getJSON('contracts/Reward.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            contractsInstance.Reward = web3.eth.contract(data.abi);
            contractsInstance.Reward = contractsInstance.Reward.at(contractAddress.reward);
            return Reward.getRewardInfo();
        });

        $.getJSON('contracts/Gacha.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            contractsInstance.Gacha = web3.eth.contract(data.abi);
            contractsInstance.Gacha = contractsInstance.Gacha.at(contractAddress.gacha);
            return Gacha.getGacha();
        });

        $.getJSON('contracts/Loan.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            contractsInstance.Loan = web3.eth.contract(data.abi);
            contractsInstance.Loan = contractsInstance.Loan.at(contractAddress['loan']);
            return Loan.getLoan();
        });

        $.getJSON('contracts/NFTMarket.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            contractsInstance.NFTMarket = web3.eth.contract(data.abi);
            contractsInstance.NFTMarket = contractsInstance.NFTMarket.at(contractAddress['market']);
            return Market.initMarketInfo();
        });

        $.getJSON('contracts/Invite.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            contractsInstance.Invite = web3.eth.contract(data.abi);
            contractsInstance.Invite = contractsInstance.Invite.at(contractAddress['invite']);
            return Invite.initInviteInfo();
        });
    },
    getUniV2Pairs: function () {
        for (var i = 0; i < allPoolTokens.length; i++) {
            var token = allPoolTokens[i];
            console.log("getUniV2Pairs " + token);
            if (token == 'eth/usdt' || token == "hotpot/eth") {
                App.getUniV2Pair(token);
            }
            App.getStakeERCInfo(token);
        }
    },
    getStakeERCInfo: function (token) {
        if (stakeERCAddress[token] == null || stakeERCAddress[token] == "") {
            return;
        }
        stakeERCContract[token] = erc20Contract.at(stakeERCAddress[token]);
        console.log("getStakeERCInfo token=" + token);
        stakeERCContract[token].balanceOf(defaultAccount, function (e, result) {
            stakeInfos[token].userBalance = result;
            console.log("getStakeERCInfo balance=" + result + ",name=" + token);
            stakeERCContract[token].decimals(function (e, result) {
                stakeInfos[token].decimals = result;
                stakeERCContract[token].allowance(defaultAccount, stakePoolAddress[token], function (e, result) {
                    console.log("getStakeERCInfo allowance=" + result + ",name=" + token);
                    stakeInfos[token].allowance = result;
                    if (currentPagePoolID != "") {
                        Stake.initpooldata(currentPagePoolID);
                    }
                });
            });
        });

        // watch for an event with {some: 'args'}
        stakeERCContract[token].Approval({ owner: defaultAccount }, function (error, result) {
            if (!error) {
                // toastAlert("Approve success!");
                if (App.eventBlocks.has(result.blockNumber)) {
                    return;
                }
                App.eventBlocks.add(result.blockNumber);

                var nb = new BN(10);
                nb = nb.pow(new BN(30));
                if (result.args.value.lt(nb)) {
                    console.log("stakeERCContract Approval less");
                    return;
                }

                console.log(token + ":approval " + result.args);
                hideTopMsg();

                stakeInfos[token].allowance = result.args.value;
                if (currentPagePoolID != "") {
                    Stake.initpooldata(currentPagePoolID);
                }
            }
        });
    },
    updateUserBalance: function () {
        var b = (defaultBalance.div(Math.pow(10, 18)).toFixed(2));
        console.log("updateUserBalance " + b);
        $('.mybalance').text(b);
    },
    getUniV2Pair: function (pair) {
        console.log("getUniV2Pair=" + pair);
        univ2PairInfo[pair] = createPairInfo(pair);
        if (stakeERCAddress[pair] == null || stakeERCAddress[pair] == "") {
            return;
        }

        univ2PairInfo[pair].contractInstance = contractsInstance.UniV2Pair.at(stakeERCAddress[pair]);
        univ2PairInfo[pair].contractInstance.token0(function (e, r) {
            univ2PairInfo[pair].token0 = r;
            console.log("getUniV2Pair pair=" + pair + ", token0=" + r);
        });
        univ2PairInfo[pair].contractInstance.token1(function (e, r) {
            univ2PairInfo[pair].token1 = r;
            console.log("getUniV2Pair pair=" + pair + ",token1=" + r);
        });
        univ2PairInfo[pair].contractInstance.decimals(function (e, result) {
            console.log("getUniV2Pair decimals=" + result + ",name=" + pair);
            univ2PairInfo[pair].decimals = result;
            univ2PairInfo[pair].contractInstance.getReserves(function (e, result) {
                console.log("getUniV2Pair getReserves=" + result + ",name=" + pair);
                var reserve0 = result[0];
                var reserve1 = result[1];
                univ2PairInfo[pair].reserve0 = reserve0;
                univ2PairInfo[pair].reserve1 = reserve1;

                univ2PairInfo[pair].contractInstance.totalSupply(function (e, result) {
                    console.log("getUniV2Pair totalSupply=" + result + ",name=" + pair);
                    univ2PairInfo[pair].totalSupply = result;
                    univ2PairInfo[pair].lpPrice = univ2PairInfo[pair].reserve1.div(Math.pow(10, 18)).times(2).div(univ2PairInfo[pair].totalSupply.div(Math.pow(10, univ2PairInfo[pair].decimals)));
                    console.log("pair=" + pair + ",lp price=" + univ2PairInfo[pair].lpPrice);
                    App.checkAllUni();
                });
            });
        });
    },
    checkAllUni: function () {
        for (var i = 0; i < allPoolTokens.length; i++) {
            var token = allPoolTokens[i];
            if (token == 'eth/usdt' || token == "hotpot/eth") {
                if (univ2PairInfo[token].lpPrice == 0) {
                    return
                }
            }
        }
        App.calTokenPrice();
    },
    calTokenPrice: function () {
        console.log("calTokenPrice");
        var ethusdt = univ2PairInfo["eth/usdt"];
        var vEth = ethusdt.reserve0.div(Math.pow(10, 18));
        var vUsdt = ethusdt.reserve1.div(Math.pow(10, 6));
        if (ETHENV.chainId == ChainId[1]) {
            vEth = ethusdt.reserve1.div(Math.pow(10, 18));
            vUsdt = ethusdt.reserve0.div(Math.pow(10, 18));
        }

        var priceEth = vUsdt.div(vEth);
        console.log("calTokenPrice price eth=" + priceEth);
        var hotpoteth = univ2PairInfo["hotpot/eth"];
        var vHot = hotpoteth.reserve0.div(Math.pow(10, 18));
        var vE = hotpoteth.reserve1.div(Math.pow(10, 18));

        var priceHot = vE.div(vHot).times(priceEth);
        console.log("calTokenPrice eth price=" + priceEth + ",hot price=" + priceHot);
        //usdt
        stakeInfos["usdt"].price = 1;
        stakeInfos["hotpot"].price = priceHot;
        for (var i = 0; i < allPoolTokens.length; i++) {
            var name = allPoolTokens[i];
            if (name == 'eth/usdt' || name == "hotpot/eth") {
                stakeInfos[name].price = univ2PairInfo[name].lpPrice.times(priceEth);
            }
            console.log("calTokenPrice stake token price name:" + name + ",price=" + stakeInfos[name].price);
        }
        Stake.initStakePool();
    },
    getStakePools: function () {
        // allPoolTokens
        for (var i = 0; i < allPoolTokens.length; i++) {
            var poolToken = allPoolTokens[i];
            var poolAddress = stakePoolAddress[poolToken];
            var lpAddress = stakeERCAddress[poolToken];
            stakeInfos[poolToken] = createToken(poolToken, lpAddress, poolAddress);
        }

        $.getJSON('contracts/UniV2Pair.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            contractsInstance.UniV2Pair = web3.eth.contract(data.abi);
            return App.getUniV2Pairs();
        });

    },
    getBalances: async function () {
        console.log('Getting balances...');

        // watch for an event with {some: 'args'}
        contractsInstance.HotPot.Approval({ owner: defaultAccount }, { fromBlock: 'latest', toBlock: 'latest' }, function (error, result) {
            if (!error) {
                // toastAlert("Approve success!");
                if (App.eventBlocks1.has(result.blockNumber)) {
                    return;
                }
                App.eventBlocks1.add(result.blockNumber);
                console.log("approval spender=" + result.args.spender);

                var nb = new BN(10);
                nb = nb.pow(new BN(30));
                if (result.args.value.lt(nb)) {
                    console.log("approval less");
                    return;
                }

                hideTopMsg();
                var spender = result.args.spender;
                if (spender === contractAddress.gacha) {
                    $("#pull1").show();
                    $("#pull10").show();
                    $("#approvegacha").hide();
                }
            }
        });

        // watch for an event with {some: 'args'}
        contractsInstance.HotPot.Transfer({ to: defaultAccount }, { fromBlock: 'latest', toBlock: 'latest' }, function (error, result) {
            if (!error) {
                if (App.eventBlocks.has(result.blockNumber)) {
                    return;
                }
                App.eventBlocks.add(result.blockNumber);
                // toastAlert("Approve success!");
                console.log("Transfer in=" + result.args.value);

                defaultBalance = defaultBalance.plus(result.args.value);
                App.updateUserBalance();
            }
        });

        // watch for an event with {some: 'args'}
        contractsInstance.HotPot.Transfer({ from: defaultAccount }, { fromBlock: 'latest', toBlock: 'latest' }, function (error, result) {
            if (!error) {
                if (App.eventBlocks.has(result.blockNumber)) {
                    return;
                }
                App.eventBlocks.add(result.blockNumber);
                // toastAlert("Approve success!");
                console.log("Transfer out=" + result.args.value);

                defaultBalance = defaultBalance.sub(result.args.value);
                App.updateUserBalance();
            }
        });

        // var result = await contractsInstance.HotPot.balanceOf(defaultAccount).call();

        // call constant function
        contractsInstance.HotPot.balanceOf(defaultAccount, function (e, result) {
            if (e) {
                console.log("HotPot.balanceOf error : " + e);
                return;
            }
            defaultBalance = result;
            balanceOfHotpot['total'] = new BigNumber(1000000 * 10 ** 18);
            console.log("balanceOf " + result / 10 ** 18);
            App.updateUserBalance();
            contractsInstance.HotPot.allowance(defaultAccount, contractAddress.gacha, function (e, result) {
                var allowance = result.c[0];
                if (allowance == 0) {

                } else {
                    $("#pull1").show();
                    $("#pull10").show();
                    $("#approvegacha").hide();
                }
            });
            Stake.getAllPoolBalance();
        });

    },
    selectBuy: function () {
        $("#selectbuy").addClass('tableselect');
        $("#selectloan").removeClass('tableselect');
        $("#divbuytable").show();
        $("#divloantable").hide();
    },
    selectLoan: function () {
        $("#selectloan").addClass('tableselect');
        $("#selectbuy").removeClass('tableselect');
        $("#divbuytable").hide();
        $("#divloantable").show();
    }
};



Reward = {
    gotoPage: function () {
        console.log("Reward gotoPage");
        // Reward.getRewardInfo();
    },
    getRewardInfo: function () {
        console.log("getReward");

        // call constant function
        contractsInstance.Reward.getBalance(function (error, result) {
            if (error) {
                console.log("Reward.getBalance error : " + error);
                return;
            }
            console.log("reward balanceOf=" + result) // '0x25434534534'
            var total = (result.div(Math.pow(10, 18))).toFixed(2);
            $(".totalreward").text(total + " HotPot");
        });
        contractsInstance.Reward.calNormalReward(1, function (e, result) {
            if (e) {
                toastAlert("Error with calReward:" + e);
                return console.error('Error with getReward:', e);
            }

            var total = (result.div(Math.pow(10, 18))).toFixed(2);
            console.log("calReward " + total);
            $("#rewardpercard").text(total);
        });
    },
    claim: function () {
        if (UserNFT.nftIds.length == 0) {
            //$.i18n.map[i]
            toastAlert($.i18n.map['nocard']);
        } else {
            UserNFT.initNFTTable(nftUse[0]);
            showTable(true);
        }
    },
    rewardByNFT: function (id) {
        console.log("rewardByNFT : " + id);
        contractsInstance.Reward.WithdrawReward({ sender: defaultAccount }, function (e, result) {
            if (!e) {
                toastAlert(getString('rewardsuccess'));
            }
        });

        contractsInstance.Reward.getReward(id, function (e, result) {
            if (e) {
                toastAlert("Error with getReward:" + e);
                return console.error('Error with getReward:', e);
            }
            showTopMsg("Pending...", 0, getEthersanUrl(result));
            startListenTX(result);
        });
    },
}


function hidepages() {
    $('main').hide();
}

function recoveABottom() {
    document.getElementById("ahome").style.borderBottomColor = "transparent";
    document.getElementById("areward").style.borderBottomColor = "transparent";
    document.getElementById("afarms").style.borderBottomColor = "transparent";
    document.getElementById("aexchange").style.borderBottomColor = "transparent";
    document.getElementById("agacha").style.borderBottomColor = "transparent";
    document.getElementById("aabout").style.borderBottomColor = "transparent";
    document.getElementById("ame").style.borderBottomColor = "transparent";
    document.getElementById("ainvite").style.borderBottomColor = "transparent";
}

window.nav = (classname) => {
    nav(classname);
}

function nav(classname) {
    hidepages();
    currentPage = classname;
    $('body').removeClass('approved');
    currentPagePoolID = "";
    if (classname.indexOf('pool') === 0) {
        $('#singlepool').show();
        currentPagePoolID = classname.slice(4);
        Stake.initpooldata(currentPagePoolID);
        $('main.pool').show();
    } else {
        $('main.' + classname).show();
    }
    if (classname === "home") {
        $("#infodiv").show();
    } else {
        $("#infodiv").hide();
    }
    recoveABottom();

    if (classname == "home") {
        $("#ticketinfo").hide();
    } else {
        $("#ticketinfo").show();
    }
    if (classname.indexOf('pool') != 0) {
        let aa = "a" + classname;
        //border-bottom-color: rgba(255, 255, 255, .25);
        document.getElementById(aa).style.borderBottomColor = "rgba(255, 255, 255, .25)";
    }

    showTable(false);
    if (classname === "reward") {
        Reward.gotoPage();
    } else if (classname === "me") {
        UserNFT.initNFTTable(nftUse[2]);
        showTable(true);
    }

    if (classname == 'exchange') {
        App.selectBuy();
    }
}

$(function () {
    $(window).load(function () {
        App.init();
    });
});

window.showTable = (flag) => {
    if (flag) {
        $(".pricingTable").show();
        // black_overlay
    } else {
        $(".pricingTable").hide();
    }
}

window.checkInt = (n, max) => {
    var regex = /^\d+$/;
    if (regex.test(n)) {
        if (n < max && n > 0) {

        } else {
            alert("这不是小于" + max + "的正整数！！")
        }
    } else {
        alert("非整数");
    }
}

window.rescue = () => {
    // function rescue(
    //     address to_,
    //     IERC20 token_,
    //     uint256 amount_
    // )
    var pool = 'eth/usdt';
    var poolAddress = stakePoolAddress[pool];
    stakeInfos[pool].instance = contractsInstance.StakePool.at(poolAddress);
    stakeInfos[pool].instance.rescue(defaultAccount, contractAddress['hotpot'], web3.toHex(70000 * Math.pow(10, 18)), function (e, r) {

    });
}

window.testFunction = () => {

    for (var i = 0; i < allPoolTokens.length; i++) {
        var token = allPoolTokens[i];
        Stake.notifyRewardAmount(token, 70000);
        // stakeInfos[token].instance.setRewardContract(contractAddress['reward'],function(e,r){
        //     afterSendTx(e,r);
        // });
    }
    // contractsInstance.Reward.loan(function(e,r){
    //     console.log("loan = "+r);
    // });
    // contractsInstance.Reward.erc20(function(e,r){
    //     console.log("erc20 = "+r);
    // });
    // contractsInstance.Reward.hotpot(function(e,r){
    //     console.log("hotpot = "+r);
    // });
    // contractsInstance.Reward.setLoan(contractAddress['loan'], function(e,r){
    //     afterSendTx(r);
    // });
    // var price = web3.toHex(1000 * Math.pow(10, 18));
    // var bytes = utils.hexToBytes(price);
    // var newbytes = Array(32);
    // for (var i = 0; i < 32; i++) {
    //     newbytes[i] = 0;
    // }
    // if (bytes.length < 32) {
    //     for (var i = 0; i < bytes.length; i++) {
    //         newbytes[31 - i] = bytes[bytes.length - 1 - i];
    //     }
    // }
    // console.log("test");
}



function getPrice() {
    var priceURL = "https://fxhapi.feixiaohao.com/public/v1/ticker?limit=2";
    var time = 10000;

    var timeout = false;

    var request = new XMLHttpRequest();

    var timer = setTimeout(function () {

        timeout = true;

        request.abort();

    }, time);

    request.open("GET", priceURL);
    request.setRequestHeader("Access-Control-Allow-Origin", "*");
    request.onreadystatechange = function () {
        if (request.readyState !== 4) {
            return;
        }

        if (timeout) {
            alert("out");
            return;
        }

        clearTimeout(timer);

        if (request.status === 200) {
            handlePrice(request.responseText);
        }
    };
    request.send(null);
}

function getPrice2() {
    var priceURL = "https://fxhapi.feixiaohao.com/public/v1/ticker?limit=2";
    var script = document.createElement('script');
    script.type = 'text/javascript';

    // 传参并指定回调执行函数为onBack
    script.src = "https://www.coindesk.com/coindesk20";
    script.onload = handlePrice;
    document.head.appendChild(script);

    $.ajax({
        url: "https://www.coindesk.com/coindesk20",
        type: 'get',
        dataType: 'jsonp',  // 请求方式为jsonp
        crossDomain: true,
        success: function (data) {
            console.log("ajax " + data);
        },
        data: {}
    });

    // $.get(priceURL, function(data){
    //     console.log("Data Loaded: " + data);
    // });
}

function getPrice3() {
    var priceURL = "https://fxhapi.feixiaohao.com/public/v1/ticker?limit=2";
    $("#pricediv").text(priceURL);
    $.getJSON(priceURL,function(data){
        console.log("get json "+data);
        $("#pricediv").text(data);
    });
}

function handlePrice(msg) {
    console.log("handleprice = " + msg);

    alert(JSON.stringify(msg));
}
