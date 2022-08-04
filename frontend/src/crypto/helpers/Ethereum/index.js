import {ethers} from "ethers";
import {useStore} from "@/store/main";

const networks = {
    mainnet: {
        name: "mainnet",
        chainId: 1,
        transactionExplorer: "https://etherscan.io/tx/",
        accountExplorer: "https://etherscan.io/address/",
        marketplaceExplorer: (contractAddress, tokenID) => `https://opensea.io/assets/ethereum/${contractAddress}/${tokenID}`,
        gasLimit: 400000
    },
    kovan_testnet: {
        name: "kovan_testnet",
        chainId: 42,
        transactionExplorer: "https://kovan.etherscan.io/tx",
        accountExplorer: "https://kovan.etherscan.io/address/",
        marketplaceExplorer: (contractAddress, tokenID) => `https://opensea.io/assets/ethereum/${contractAddress}/${tokenID}`,
        gasLimit: 400000
    },
    maticmum: {
        name: "maticmum",
        chainId: 80001,
        transactionExplorer: "https://mumbai.polygonscan.com/tx/",
        accountExplorer: "https://mumbai.polygonscan.com/address/",
        marketplaceExplorer: (contractAddress, tokenID) => `https://testnets.opensea.io/assets/mumbai/${contractAddress}/${tokenID}`,
        gasLimit: 400000
    },
    polygon_mainnet: {
        name: "polygon_mainnet",
        chainId: 137,
        transactionExplorer: "https://polygonscan.com/tx/",
        accountExplorer: "https://polygonscan.com/address/",
        marketplaceExplorer: (contractAddress, tokenID) => `https://opensea.io/assets/matic/${contractAddress}/${tokenID}`,
        gasLimit: 400000
    }
}

const settings = {
    mainnet: {
        api: 'https://api.rarible.org/v0.1',
        blockchain: 'ETHEREUM',
        adminAddress: '0xD25A41039DEfD7c7F0fBF6Db3D1Df60b232c6067',
        //place1: address of ERC20 smart contract
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        limitOrderAddress: '0x5fa31604fc5dcebfcac2481f9fa59d174126e5e6'
    },
    maticmum: {
        api: 'https://api.rarible.org/v0.1',
        store: 'https://testnets.opensea.io',
        blockchain: 'POLYGON',
        characterContract: '0x610d1f5149031185b264245d340108c15a1a01dc',
        thingContract: '0xfa44bb5e1b8c7be977cd5001008bc1caeee16e6a',
        colorContract: '0xa95107620a198d7b141b32e42ff298f935a97585',
        achievements: '0x1AF0454bcc3944B2cc94BD2D95A5E8354A0d68aa',

        whiteListContract: '0x4a74ba982b0229fdb4c9e69930ad9bb4a8bf9810',
    },
    kovan_testnet: {
        api: 'https://api.rarible.org/v0.1',
        blockchain: 'ETHEREUM',
        adminAddress: '0xD25A41039DEfD7c7F0fBF6Db3D1Df60b232c6067',
        //place1: address of ERC20 smart contract
        tokenAddress: '0xc2569dd7d0fd715B054fBf16E75B001E5c0C1115',
        limitOrderAddress: '0x94Bc2a1C732BcAd7343B25af48385Fe76E08734f'
    },
    polygon_mainnet: {
        api: 'https://api.rarible.org/v0.1',
        blockchain: 'POLYGON',
        adminAddress: '0xD25A41039DEfD7c7F0fBF6Db3D1Df60b232c6067',
        //place1: address of ERC20 smart contract
        tokenAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        limitOrderAddress: '0x94Bc2a1C732BcAd7343B25af48385Fe76E08734f'
    }
}

export function getProvider(provider) {
    return new ethers.providers.Web3Provider(provider, "any")
}

export const ConnectorTypes = {
    RARIBLE: 'rarible',
}


/*
* Bridge to vue store pinia
* */

export const AppStorage = {
    _store: null,

    getStore(){
        if(!this._store) this._store = useStore();
        return this._store
    },
}

export function getNameByChainID(chainID){
    const [name] = Object.entries(networks).find(([, data]) => data.chainId === chainID) || ['unknown']
    let isSupport = (name !== 'unknown')? !!+process.env[`VUE_APP_NETWORK_${name.toUpperCase()}_SUPPORT`] : false

    return isSupport? name : 'unknown'
}

export function getData(networkName){
    return networks[networkName.toLowerCase()] || null
}

export function getSettings(networkName){
    return settings[networkName.toLowerCase()] || null
}