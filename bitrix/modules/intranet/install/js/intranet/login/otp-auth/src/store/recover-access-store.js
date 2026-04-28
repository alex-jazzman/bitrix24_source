import { defineStore } from 'ui.vue3.pinia';

export const useRecoverAccessStore = defineStore('recoverAccess', {
	state: () => ({
		isRequesting: false,
		isRequestSent: false,
		requestTimestamp: null,
	}),
	actions: {
		setRequesting(value)
		{
			this.isRequesting = value;
		},
		setRequestSent(timestamp = Date.now())
		{
			this.isRequestSent = true;
			this.requestTimestamp = timestamp;
		},
		resetState()
		{
			this.isRequesting = false;
			this.isRequestSent = false;
			this.requestTimestamp = null;
		},
	},
});
