/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, call_adapter_desktopApi, call_infrastructure_broadcastChannel) {
	'use strict';

	class ConferenceChannel {
		static #instance = null;
		callMultiBroadcastClient;
		constructor() {
			this.callMultiBroadcastClient = new call_infrastructure_broadcastChannel.BroadcastRequestChannel('call_conf_controller_multi_channel');
		}
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		async sendRequest(conferenceCode) {
			if (!call_adapter_desktopApi.DesktopApi.isDesktop()) {
				return [];
			}
			return this.callMultiBroadcastClient.broadcastRequest(conferenceCode, {
				timeout: 100
			});
		}
		setExecuter(handle) {
			this.callMultiBroadcastClient.executer(handle);
		}
	}

	exports.ConferenceChannel = ConferenceChannel;

})(this.BX.Messenger.Application = this.BX.Messenger.Application || {}, BX.Call.Adapter, BX.Call.Infrastructure);
//# sourceMappingURL=conference-channel.bundle.js.map
