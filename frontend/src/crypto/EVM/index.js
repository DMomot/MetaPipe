import {
    Ethereum,
    ConnectionStore,
} from '@/crypto/helpers'
import SmartContract from '@/crypto/EVM/SmartContract.js'
import {stringCompare} from "@/utils/string";
import alert from "@/utils/alert";

class EVM {

    constructor(){

    }


    /* ---------- Connected methods ON  ----------  */
    async init(){
        return await this.connector.init(this)
    }
    async connectToWallet(value){
        return await this.connector.connectToWallet(value)
    }
    async disconnect(){
        return await this.connector.disconnect()
    }
    async isUserConnected(){
        return await this.connector.isUserConnected()
    }
    /*  ----------  Connected methods OFF  ----------  */


    async fetchUserAmount(){
        const storage = Ethereum.AppStorage.getStore()
        const userIdentity = ConnectionStore.getUserIdentity()
        const {fetchAmount} = Ethereum.getData(ConnectionStore.getNetwork().name)

        const Contract = new SmartContract({
            address: fetchAmount
        })
        const amount = await Contract.fetchUserBalance(userIdentity)
        storage.setUserAmount(amount)
    }

    async formHandler(address, amount){
        const {fetchAmount} = Ethereum.getData(ConnectionStore.getNetwork().name)

        const Contract = new SmartContract({
            address: fetchAmount
        })
        console.log(amount)
        Contract.formHandler(amount, address)
    }

    async getContractProvider(){
        const {fetchAmount} = Ethereum.getData(ConnectionStore.getNetwork().name)

        const Contract = new SmartContract({
            address: fetchAmount
        })

        return Contract._getProvider()
    }

    async sendNFT(tokenObject, toAddressPlain) {
        console.log('sendNFT', tokenObject, toAddressPlain);

        const {realAddress: toAddress} = await this.checkForENSName(toAddressPlain)
        const [contractAddress, tokenID] = tokenObject.identity.split(':')
        const fromAddress = ConnectionStore.getUserIdentity()
        if(stringCompare(fromAddress, toAddress)) throw Error('THE_SAME_ADDRESS_ERROR')

        console.log(`[Send NFT] contract: ${contractAddress}, token: ${tokenID}, from: ${fromAddress}, to: ${toAddress}`)

        const Contract = new SmartContract({
            address: contractAddress
        })
        return await Contract.sendToken(tokenID, fromAddress, toAddress)
    }


    tryToConnectToUnsupportedNetwork(){
        console.log('network not supported')
        alert.open('Sorry, we did not support this network')
    }

}

export default EVM