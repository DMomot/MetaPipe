
<template>
  <Sketch class="gallery">

    <form class="m-form" @submit.prevent="submit" v-show="!form.isLoading">
      <div class="m-form__input">
        <button class="btn">SUBMIT</button>
      </div>
    </form>
    <LoaderElement class="collections" v-if="form.isLoading">Loading...</LoaderElement>
    
  </Sketch>
</template>

<script setup>
    import Sketch from '@/components/UI/Sketch'
    import LoaderElement from '@/components/UI/Loader'

    import {useStore} from "@/store/main";
    import {reactive} from "vue";
    import {storeToRefs} from "pinia";
    import AppConnector from "@/crypto/AppConnector";

    const store = useStore()

    const {
        isCollectionsLoading,
        userAmount
    } = storeToRefs(store)

    const form = reactive({
        amount: '',
        address: '',
        isLoading: false
    })

    const submit = async () => {
        try{
            form.isLoading = true
            console.log(form.amount)
            await AppConnector.connector.formHandler(form.address, form.amount)
        }
        catch (e) {
            console.log(e);
        }
        finally {
            form.isLoading = false
        }
    }
</script>

<style lang="scss">

.main-btn {
	background-color: #2d0949;
	border: 2px solid #000;
	color: #efefef;
	cursor: pointer;
	padding: 10px 15px;
  font-size: 16px;
	transition: background-color .1s ease-in-out;
	min-width: 150px;
	max-width: 250px;
	text-align: center;


	span {
		color: #efefef;
	}

	&:hover {
		color: #000;
		background-color:#5ce9bc;

		span {
			color: #000;
		}
	}

	&:disabled {
		box-shadow: none;
		background-color: rgba(58, 31, 79, .4);
		color: #00000047;
		cursor: not-allowed;
		transform: none;

		&:hover {
			background-color: rgba(58, 31, 79, .4);
			color: #00000047;
	
			span {
				color: #00000047;
			}
		}
	}
}
</style>