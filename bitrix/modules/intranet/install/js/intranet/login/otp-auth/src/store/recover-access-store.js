import { defineStore } from 'ui.vue3.pinia';

export const useRecoverAccessStore = defineStore('recoverAccess', {
	state: () => ({
		isRequesting: false,
		isRequestSent: false,
		canSendRequest: true,
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
			this.canSendRequest = false;
			this.requestTimestamp = timestamp;
		},
		clearRequestSent()
		{
			this.isRequestSent = false;
			this.requestTimestamp = null;
		},
		setCanSendRequest(value: boolean)
		{
			this.canSendRequest = value;
		},
		resetState()
		{
			this.isRequesting = false;
			this.isRequestSent = false;
			this.canSendRequest = true;
			this.requestTimestamp = null;
		},
	},
});
