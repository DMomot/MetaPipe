<template>
  <div class="sketch">
    <div class="sketch__logo">
      <a href="#">
        Some logo
      </a>
    </div>
    <div class="sketch__header">
      <div class="header">
        <div>
          <!--<span class="header__return">
            <span>
              <svg viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.73633 13.5039C7.01462 13.7722 7.45776 13.7642 7.72611 13.4859C7.99447 13.2076 7.98641 12.7645 7.70812 12.4961L6.73633 13.5039ZM1 7L0.514105 6.49611C0.377288 6.62804 0.3 6.80994 0.3 7C0.3 7.19007 0.377288 7.37196 0.514105 7.50389L1 7ZM7.70812 1.50389C7.98641 1.23554 7.99447 0.792396 7.72611 0.514105C7.45776 0.235814 7.01462 0.227757 6.73633 0.496109L7.70812 1.50389ZM17 7.7C17.3866 7.7 17.7 7.3866 17.7 7C17.7 6.6134 17.3866 6.3 17 6.3L17 7.7ZM7.70812 12.4961L1.48589 6.49611L0.514105 7.50389L6.73633 13.5039L7.70812 12.4961ZM1.48589 7.50389L7.70812 1.50389L6.73633 0.496109L0.514105 6.49611L1.48589 7.50389ZM1 7.7L17 7.7L17 6.3L1 6.3L1 7.7Z"></path></svg>
            </span>
            <span>
              Return
            </span>
          </span>-->
        </div>
        <div>
          <div class="header__right">
            <div>

            </div>
            <div>
              <div class="identity box" v-if="connection.userIdentity">
                <a
                  class="identity__wallet"
                  target="_blank"
                  :href="getExplorerLink('account', connection.userIdentity)"
                >
                  <div v-text="userIdentityShort"></div>
                  <div v-text="connection.userNetworkName || ''"></div>
                </a>
                <div class="identity__logout" @click="logout">
                  <svg viewBox="0 0 24 24"><path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="sketch__main" :class="$attrs.class">
      <slot></slot>
    </div>
  </div>
</template>

<script>
    export default {
        inheritAttrs: false
    }
</script>
<script setup>
    import {useStore} from "@/store/main";
    import {storeToRefs} from "pinia";
    import {catToFixed} from "@/utils/string";
    import {ConnectionStore} from '@/crypto/helpers'
    const store = useStore()
    const {
        connection,
        userIdentityShort,
        getExplorerLink
    } = storeToRefs(store);
    const openContractManage = () => store.changeManageContractView(true)
    const logout = async () => {
        await ConnectionStore.logOut()
    }
</script>