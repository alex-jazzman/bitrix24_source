/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_const) {
	'use strict';

	const MILLISECONDS_IN_SECOND = 1000;
	class DeliveryWatchdog {
		static #instance;
		#timers = {};
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		schedule(message) {
			this.cancel(message.id);
			if (!this.#isPending(message)) {
				return;
			}
			const sendingTs = this.#getSendingTs(message);
			if (sendingTs <= 0) {
				return;
			}
			const threshold = this.#hasFiles(message) ? im_v2_const.DeliveryTimeout.WithFiles : im_v2_const.DeliveryTimeout.Default;
			const remainingMs = (sendingTs + threshold) * MILLISECONDS_IN_SECOND - Date.now();
			if (remainingMs <= 0) {
				// Still pending with the threshold already behind us: nothing left to wait for, so flag
				// it now. Happens when a params update reports SENDING with an old timestamp (delayed
				// pull, reconnect) - without this the message would stay plain until the chat reloads.
				this.#markAsNotDelivered(message.id, {
					requirePendingTimestamp: false
				});
				return;
			}
			this.#timers[message.id] = setTimeout(() => {
				this.#markAsNotDelivered(message.id, {
					requirePendingTimestamp: true
				});
				delete this.#timers[message.id];
			}, remainingMs);
		}
		cancel(messageId) {
			if (!this.#timers[messageId]) {
				return;
			}
			clearTimeout(this.#timers[messageId]);
			delete this.#timers[messageId];
		}
		#markAsNotDelivered(messageId, options = {}) {
			if (!this.#isStillPendingInStore(messageId, options.requirePendingTimestamp === true)) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('messages/update', {
				id: messageId,
				fields: {
					notDelivered: true
				}
			});
		}

		// The top-level `sending` flag is no help here: it is only the client-side optimistic-send
		// marker, cleared once the server assigns a real id. What does survive in the store is
		// `sendingTs`, which the connector zeroes together with SENDING once delivery is confirmed
		// (imopenlines: connector.php, Im\V2\Message\Params::SENDING_TS => 0), so a zero timestamp
		// means the message is no longer awaiting delivery.
		//
		// That check applies only to a timer that actually waited: callers that flag an already
		// expired message do so right after receiving its params, and the store update they race with
		// is dispatched without awaiting (pull handlers), so the timestamp may not be there yet.
		#isStillPendingInStore(messageId, requirePendingTimestamp) {
			const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
			if (!message || message.notDelivered === true) {
				return false;
			}
			return !requirePendingTimestamp || this.#getSendingTs(message) > 0;
		}
		#isPending(message) {
			return message.sending === true || message.params?.SENDING === 'Y';
		}
		#getSendingTs(message) {
			if (message.sendingTs > 0) {
				return message.sendingTs;
			}
			return main_core.Text.toInteger(message.params?.SENDING_TS);
		}
		#hasFiles(message) {
			if (main_core.Type.isArrayFilled(message.files)) {
				return true;
			}
			return main_core.Type.isArrayFilled(message.params?.FILE_ID) || main_core.Type.isArrayFilled(message.params?.FILES);
		}
	}

	exports.DeliveryWatchdog = DeliveryWatchdog;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Const);
//# sourceMappingURL=delivery-watchdog.bundle.js.map
