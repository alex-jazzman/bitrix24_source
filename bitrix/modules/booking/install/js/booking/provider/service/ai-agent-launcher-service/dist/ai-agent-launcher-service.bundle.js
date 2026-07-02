/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, main_core, booking_core, booking_const) {
	'use strict';

	const ACTION_COPY_AND_START = 'bizproc.v2.Integration.AiAgent.Template.copyAndStart';
	const ACTION_START = 'bizproc.v2.Integration.AiAgent.Template.start';
	class AiAgentLauncherService {
		#isPullSubscribed = false;
		async launch() {
			const aiAgent = this.$store.getters[`${booking_const.Model.AiAgent}/aiAgent`];
			if (!aiAgent?.templateId) {
				return;
			}
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
			const actionName = aiAgent.action === 'copyAndStart' ? ACTION_COPY_AND_START : ACTION_START;
			const response = await main_core.ajax.runAction(actionName, {
				json: {
					templateId: aiAgent.templateId
				}
			});
			if (aiAgent.action === 'copyAndStart' && response?.data?.id) {
				this.$store.dispatch(`${booking_const.Model.AiAgent}/setAiAgent`, {
					templateId: response.data.id,
					action: 'start',
					error: null
				});
			}
		}
		async launchInBackground() {
			const aiAgent = this.$store.getters[`${booking_const.Model.AiAgent}/aiAgent`];
			if (!aiAgent?.templateId || aiAgent.action !== 'copyAndStart') {
				return;
			}
			await main_core.ajax.runAction(ACTION_COPY_AND_START, {
				json: {
					templateId: aiAgent.templateId
				}
			});
		}
		get $store() {
			return booking_core.Core.getStore();
		}
	}
	const aiAgentLauncherService = new AiAgentLauncherService();

	exports.aiAgentLauncherService = aiAgentLauncherService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX, BX.Booking, BX.Booking.Const);
//# sourceMappingURL=ai-agent-launcher-service.bundle.js.map
