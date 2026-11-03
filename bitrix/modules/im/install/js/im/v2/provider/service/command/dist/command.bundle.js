/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_rest, im_v2_lib_user) {
	'use strict';

	// shared across all service instances so parallel consumers coalesce into one request per dialogId
	const requestsInFlight = new Map();
	class CommandService {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		loadCommands(dialogId, options = {}) {
			const requestInFlight = requestsInFlight.get(dialogId);
			if (requestInFlight) {
				return requestInFlight;
			}
			const {
				silent = false
			} = options;
			if (!silent) {
				void this.#store.dispatch('commands/startLoading', {
					dialogId
				});
			}
			const request = this.#requestCommands(dialogId).finally(() => {
				requestsInFlight.delete(dialogId);
			});
			requestsInFlight.set(dialogId, request);
			return request;
		}
		async #requestCommands(dialogId) {
			try {
				const response = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatCommandList, {
					data: {
						dialogId
					}
				});
				this.#hydrateBots(response.users);
				void this.#store.dispatch('commands/set', {
					dialogId,
					items: response.commands
				});
			} catch (error) {
				console.error('CommandService: load commands error', error);
				void this.#store.dispatch('commands/setError', {
					dialogId
				});
			}
		}
		#hydrateBots(users) {
			if (!users) {
				return;
			}
			void new im_v2_lib_user.UserManager().setUsersToModel(Object.values(users));
		}
	}

	exports.CommandService = CommandService;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=command.bundle.js.map
