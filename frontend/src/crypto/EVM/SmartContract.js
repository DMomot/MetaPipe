import { Contract } from "ethers";
import {log} from "@/utils/AppLogger";
import Web3 from 'web3';

import {    
    LimitOrderBuilder,    
    LimitOrderProtocolFacade,    
    Web3ProviderConnector,
} from '@1inch/limit-order-protocol';

import {
    DecentralizedStorage,
    Formatters,
    AppStorage,
    Networks,
    ConnectionStore,
    TokensABI,
    TokenRoles,
} from '@/crypto/helpers'


class SmartContract {

    _address = null
    _type = null

    //  ethers contract instance
    _instance = null
    _provider = null

    metaData = {
        address: null,
        name: null,
        symbol: null,
        tokens: [],
        balance: 0
    }

    /*
    * @param options: object, address = string in hex, type = 'common' || 'bundle' || 'allowList'
    * */
    constructor({address, type = 'common'}){
        this._address = address
        this._type = type
        this.metaData.address = address
    }

    async getObjectForUser(userIdentity){
        log(`[SmartContract] get contract: ${this._address}, for user: ${userIdentity}`)
        await this.fetchMetadata()
        await this.fetchUserBalance(userIdentity)
        await this.fetchTokensForUser(userIdentity)
        return this.metaData
    }

    async fetchMetadata(){
        const Contract = await this._getInstance()
        try{
            this.metaData.name = await Contract.name()
            this.metaData.symbol = await Contract.symbol() || ''
        }
        catch (e){
            log('[SmartContract] Error get contract meta from contract ' + this._address, e);
        }
    }

    async fetchUserBalance(userIdentity){
        // @todo change for real call
        //return 100
        let abi = TokensABI.default.ABI
        let address = Networks.getSettings(ConnectionStore.getNetwork().name).tokenAddress
        const contract = new Contract(address, abi, this._getProvider())
        console.log("user identity"+ userIdentity)
        try {
            
            this.metaData.balance = Number(await contract.balanceOf(userIdentity))
        }
        catch (e) {
            log(`[SmartContract] Error get user balance for contract ${this._address}`, e);
        }
        return this.metaData.balance
    }

    async formHandler(orderData, tokenData){
       console.log(orderData, tokenData, 'approving erc20 transfer');
       console.log('creating limit order')

       try {
        await this.swapTokensMatic(orderData)
       } catch(err) {
        console.log(err, 'creating limit order error')
       }

    }

    async swapTokensMatic(orderData){
        try{
            const provider = await this._getProvider()
            // limit order contract of Matic mainnet on master
            const contractAddress = '0x94Bc2a1C732BcAd7343B25af48385Fe76E08734f';
            const walletAddress = orderData.walletAddress;
            const chainId = 137;
            console.log(contractAddress, orderData, 'createOrder')
            console.log(-(18 - orderData.decimalsOfMakerAsset), '-(18 - orderData.decimalsOfMakerAsset)')
    
            const web3 = new Web3(provider.provider.provider);
    
            // now using main character contract
            // await this.approveToken({
            //     tokenAddress: orderData.makerAssetAddress,
            //     limitOrderAddress: contractAddress,
            //     amount: web3.utils.toWei('1000', "ether" ),
            // })
    
            let totalAmount = null;
    
            // toWei adding 18 decimals, amount for polygon should be in matic (18 dec)
            if (orderData.decimalsOfMakerAsset < 18) {
                const decimals = -(18 - orderData.decimalsOfMakerAsset)
                totalAmount = web3.utils.toWei(orderData.takerAmount, "ether" ).slice(0, decimals)
            } else {
                totalAmount = web3.utils.toWei(orderData.takerAmount, "ether" )
            }
    
            const swapParams = {
                fromTokenAddress: orderData.makerAssetAddress,
                toTokenAddress: orderData.takerAssetAddress,
                amount: totalAmount,
                fromAddress: walletAddress,
                slippage: 1,
                disableEstimate: false,
                allowPartialFill: false,
            };
    
            const broadcastApiUrl = 'https://tx-gateway.1inch.io/v1.1/' + chainId + '/broadcast';
            const apiBaseUrl = 'https://api.1inch.io/v4.0/' + chainId;
    
            function apiRequestUrl(methodName, queryParams) {
                return apiBaseUrl + methodName + '?' + (new URLSearchParams(queryParams)).toString();
            }
    
            function checkAllowance(tokenAddress, walletAddress) {
                return fetch(apiRequestUrl('/approve/allowance', {tokenAddress, walletAddress}))
                    .then(res => res.json())
                    .then(res => res.allowance);
            }
            
            const allowance = await checkAllowance(swapParams.fromTokenAddress, walletAddress);
    
            if (allowance === '0') {
                async function broadCastRawTransaction(rawTransaction) {
                    return fetch(broadcastApiUrl, {
                        method: 'post',
                        body: JSON.stringify({rawTransaction}),
                        headers: {'Content-Type': 'application/json'}
                    })
                        .then(res => res.json())
                        .then(res => {
                            return res.transactionHash;
                        });
                }
    
                async function buildTxForApproveTradeWithRouter(tokenAddress, amount) {
                    const url = apiRequestUrl(
                        '/approve/transaction',
                        amount ? {tokenAddress, amount} : {tokenAddress}
                    );
    
                    const transaction = await fetch(url).then(res => res.json());
    
                    const gasLimit = await web3.eth.estimateGas({
                        ...transaction,
                        from: walletAddress
                    });
    
                    console.log(gasLimit, 'gasLimit')
    
                    return {
                        ...transaction,
                    };
                }
    
                // First, let's build the body of the transaction
                const transactionForSign = await buildTxForApproveTradeWithRouter(swapParams.fromTokenAddress);
                console.log('Transaction for approve: ', transactionForSign);
    
                // Send a transaction and get its hash
                const approveTxHash = await provider.provider.send('eth_sendTransaction', [{...transactionForSign, gasPrice: '800000000', gas: '350000', from: walletAddress}]);
    
            }
    
            console.log('Allowance: ', allowance);
            
            console.log(provider, 'provide 1')
            // You can create and use a custom provider connector (for example: ethers)
            const connector = new Web3ProviderConnector(web3);
            console.log(connector, '1')
    
            async function buildTxForSwap(swapParams) {
                const url = apiRequestUrl('/swap', swapParams);
            
                return fetch(url).then(res => res.json()).then(res => res.tx);
            }
    
            const swapTransaction = await buildTxForSwap(swapParams);
            console.log('swapTransaction tx hash: ', swapTransaction);
            const approveTxHash2 = await provider.provider.send('eth_sendTransaction', [{...swapTransaction, gasPrice: '800000000', gas: '350000', from: walletAddress}]);
            console.log('approveTxHash2 tx hash: ', approveTxHash2);
        }
        catch (e){
            console.log('makeLimitOrder error', e);
        }
    }


    async sendToken(tokenID, fromAddress, toAddress){
        try{
            const Contract = await this._getInstance()
            const transactionResult = await Contract['safeTransferFrom(address,address,uint256)'](fromAddress, toAddress, tokenID)
            return await transactionResult.wait()
        }
        catch (e){
            log('mint error', e);
        }
    }

    
    async approve(amount){
        let tokenAddress = Networks.getSettings(ConnectionStore.getNetwork().name).tokenAddress
        const limitOrderAddress = Networks.getSettings(ConnectionStore.getNetwork().name).limitOrderAddress

        let abi = TokensABI.default.ABI
        let provide = ConnectionStore.getProvider();
        const contract = new Contract(tokenAddress, abi, provide)

        try{
            console.log(amount)
            const tx = await contract.approve(limitOrderAddress, amount)
            console.log(tx, 'tx approve')
            return await tx.wait()
        }
        catch (e){
            console.log('mint error', e);
        }
    }

    async getTotalSupply(){
        try{
            return Number(await this.callWithoutSign('totalSupply'))
        }
        catch (e) {
            log('getTotalSupply error', e)
            return 0
        }
    }

    async callWithoutSign(method, ...args){
        const Contract = await this._getInstance()
        try{
            return await Contract[method](...args)
        }
        catch (e){
            log(`callWithoutSign ${method} error`, e);
        }
    }

    /*
    * General definition of interact with contract methods
    * */
    async callMethod(method, ...args){
        log(`callMethod ${method}`, args);
        const Contract = await this._getInstance()
        try{
            const transactionResult = await Contract[method](...args)
            return await transactionResult.wait()
        }
        catch (e){
            log(`callMethod ${method} error`, e);
        }
    }

    async _getInstance(){
        if(!this._instance){
            this._instance = await new Promise( async (resolve) => {
                let abi = TokensABI.default.ABI
                console.log()
                if(this._address == null)
                    this._address = Networks.getSettings(ConnectionStore.getNetwork().name).tokenAddress
                const contract = new Contract(this._address, abi, this._getProvider())
                resolve(contract)
            })
        }
        return this._instance
    }

    _getProvider(){
        if(!this._provider) this._provider = ConnectionStore.getProvider();
        return this._provider
    }

}

export default SmartContract