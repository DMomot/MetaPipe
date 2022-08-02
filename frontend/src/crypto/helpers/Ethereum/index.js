import {ethers} from "ethers";

export function getProvider(provider) {
    return new ethers.providers.Web3Provider(provider, "any")
}