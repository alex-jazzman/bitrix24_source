/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, main_core) {
	'use strict';

	class AiAgentLauncherService {
		#isPullSubscribed = false;
		async launch() {
			try {
				const {
					SetupTemplate
				} = await main_core.Runtime.loadExtension('bizproc.setup-template');
				if (!this.#isPullSubscribed) {
					SetupTemplate.subscribeOnPull();
					this.#isPullSubscribed = true;
				}
			} catch (e) {
				console.error('bizproc.setup-template extension is not available', e);
				return;
			}
			await main_core.ajax.runAction('booking.api_v1.AiAgent.launch', {
				json: {}
			});
		}
	}
	const aiAgentLauncherService = new AiAgentLauncherService();

	exports.aiAgentLauncherService = aiAgentLauncherService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX);
//# sourceMappingURL=ai-agent-launcher-service.bundle.js.map
