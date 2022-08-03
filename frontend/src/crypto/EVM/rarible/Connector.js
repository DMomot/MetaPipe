import ProviderStorage from "@/crypto/EVM/rarible/ProviderStorage";
import ConnectionSteps from "@/crypto/EVM/rarible/ConnectionSteps";

import {Connector, InjectedWeb3ConnectionProvider} from "@rarible/connector";
import {WalletConnectConnectionProvider} from "@rarible/connector-walletconnect";
import {mapEthereumWallet} from "@rarible/connector-helper";
import {stringCompare} from "@/utils/string";
import router from "@/router";
import {Ethereum, ConnectionStore} from '@/crypto/helpers'

export default {
    controllerClass: null,

    // connector instance from Rarible
    _RaribleConnector: null,
    _connectingOptions: [],

    // to disconnect when user connect to unsupported network
    _disconnectMethod: null,

    _waitingForUserConnected: [],

    _status: '',

    // for use inside this class only
    _connectedOptions: {
        blockchain: null,
        chainId: null,
        address: null,
        provider: null,
        wallet: null
    },

    setStatus(value){
        console.log('setStatus', value);
        this._status = value
    },
    getStatus(){
        return this._status
    },

    makeConnectedCallbackFunction(){
        const add = {};
        const promise = new Promise((resolve, reject) => {
            add.resolve = resolve
            add.reject = reject
        })
        this._waitingForUserConnected.push(add)
        return promise
    },
    getConnectedCallbackFunction(){
        return this._waitingForUserConnected
    },
    clearConnectedCallbackFunctions(){
        this._waitingForUserConnected = []
    },

    async disconnect(){
        localStorage.removeItem('walletconnect')
        location.reload()
    },

    async init(controllerClass = null){
        if(this._RaribleConnector) return true

        if(controllerClass) this.controllerClass = controllerClass

        const injected = mapEthereumWallet(new InjectedWeb3ConnectionProvider())
        const walletConnect = mapEthereumWallet(new WalletConnectConnectionProvider({
            rpc: {
                80001: 'https://rpc-mumbai.matic.today',
            },
            qrcodeModal: {
                open: (uri, closeTrigger) => {
                    console.log('open qrcodeModal trigger')

                    const closeWrapper = () => {
                        const status = this.getStatus()
                        // user was connected, then lost session (in walletConnect), and cancel to reconnect
                        if(status === 'connected'){
                            if(this._disconnectMethod) this._disconnectMethod()
                            // location.reload()
                        }
                        closeTrigger()
                    }

                    const store = Ethereum.AppStorage.getStore()
                    store.openWalletConnectQR(uri, closeWrapper)

                    // AppStorage.getLandingStore().changeWalletConnectQRState(true, uri, closeWrapper)
                },
                close: () => {
                    const store = Ethereum.AppStorage.getStore()
                    store.closeWalletConnectQR({isAutomatic: true})
                    console.log('Success automatic close qrcodeModal trigger (when user scan and accept connect in app)')
                    // AppStorage.getLandingStore().changeWalletConnectQRState(false, '', null, true)
                }
            }
        }))

        this._RaribleConnector = Connector.create(injected, ProviderStorage).add(walletConnect)

        this._connectingOptions = await this._RaribleConnector.getOptions()

        this._RaribleConnector.connection.subscribe(async (con) => {
            console.log('Connector events', con)
            this.setStatus(con.status)

            if(con.status === ConnectionSteps.connected && con.connection){
                const connection = con.connection
                this._disconnectMethod = con.disconnect || null

                // skip repeated callback (when using walletConnect)
                if(
                    this._connectedOptions.blockchain === connection.blockchain &&
                    stringCompare(this._connectedOptions.address, connection.address) &&
                    this._connectedOptions.chainId === await connection.wallet.ethereum.getChainId()
                ) {
                    console.log('Skip repeated connected event')
                    return
                }

                this._connectedOptions.blockchain = connection.blockchain
                this._connectedOptions.chainId = await connection.wallet.ethereum.getChainId()
                this._connectedOptions.address = connection.address
                this._connectedOptions.provider = connection.wallet.ethereum.config.web3.currentProvider
                this._connectedOptions.wallet = connection.wallet
                console.log('connection options', this._connectedOptions)

                const updateUserTokensAction = () => {
                    router.push({name: 'Characters'})
                }

                let connectedNetworkName = Ethereum.getNameByChainID(this._connectedOptions.chainId)
                const provider = Ethereum.getProvider(this._connectedOptions.provider)

                if(connectedNetworkName !== 'unknown'){
                    const needToUpdateUserTokens = !!ConnectionStore.getProvider()

                    ConnectionStore.setConnection({
                        network: {
                            name: connectedNetworkName,
                            id: this._connectedOptions.chainId
                        },
                        userIdentity: this._connectedOptions.address,
                        disconnectMethod: this._disconnectMethod,
                        provider,
                        providerType: 'Web3Provider',
                        blockchain: this._connectedOptions.blockchain,
                        wallet: this._connectedOptions.wallet
                    })

                    this.getConnectedCallbackFunction().forEach(promise => promise.resolve(this._connectedOptions.address))
                    this.clearConnectedCallbackFunctions()

                    if(this.controllerClass) {
                        await this.controllerClass.fetchUserAmount()
                    }

                    // update only if user change network
                    // if(needToUpdateUserTokens) updateUserTokensAction()

                    // update tokens after connected
                    // if(this.controllerClass) this.controllerClass.fetchUserTokens()
                }
                else {
                    console.log('try to connect to unsupported network')
                    // if connecting to unsupported Ethereum not allowed
                    this.getConnectedCallbackFunction().forEach(promise => promise.reject())
                    this.clearConnectedCallbackFunctions()
                    this.controllerClass.tryToConnectToUnsupportedNetwork()
                    if(this._disconnectMethod) this._disconnectMethod()
                }
            }
            else if(con.status === ConnectionSteps.disconnected) {
                const reloadPage = !!ConnectionStore.getProvider()

                // clear connection data
                ConnectionStore.clearConnection()
                this._connectedOptions.blockchain =
                this._connectedOptions.chainId =
                this._connectedOptions.address =
                this._connectedOptions.provider =
                this._connectedOptions.wallet = null

                this.getConnectedCallbackFunction().forEach(promise => promise.reject())
                this.clearConnectedCallbackFunctions()

                console.log('reloadPage', reloadPage);
                // if(reloadPage) location.reload()
            }
        })

        return await this.makeConnectedCallbackFunction()
    },

    async connectToWallet(walletName){
        if(this.getStatus() === ConnectionSteps.connected) return this.getStatus()

        const provider = this._connectingOptions.find(option => option.option === walletName)

        await this._RaribleConnector.connect(provider)
        return await this.makeConnectedCallbackFunction()
    },

    async isUserConnected(){
        const status = this.getStatus()
        if(status === ConnectionSteps.connected) return ConnectionStore.getUserIdentity()
        else if(status === ConnectionSteps.initializing || status === ConnectionSteps.connecting) return await this.makeConnectedCallbackFunction()
    }
}