/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, main_core) {
	'use strict';

	// Stable error codes returned by the `booking.api_v1.AiAgent.launch` action.
	// Source of truth: Bitrix\Bizproc\Public\Provider\WorkflowTemplate\AiAgentProvider::LAUNCH_ACCESS_DENIED_CODE (module bizproc).
	const AiAgentErrorCode = {
		START_ACCESS_DENIED: 'AI_AGENT_START_ACCESS_DENIED'
	};

	class AiAgentLauncherService {
		#isPullSubscribed = false;
		async launch() {
			try {
				await this.#setupTemplate();
			} catch (e) {
				console.error('bizproc.setup-template extension is not available', e);
				return {
					success: false,
					errors: [{
						message: 'bizproc.setup-template extension is not available',
						code: '',
						customData: {}
					}]
				};
			}
			try {
				await main_core.ajax.runAction('booking.api_v1.AiAgent.launch', {
					json: {}
				});
			} catch (response) {
				return {
					success: false,
					errors: response?.errors ?? []
				};
			}
			return {
				success: true,
				errors: []
			};
		}
		async #setupTemplate() {
			const {
				SetupTemplate
			} = await main_core.Runtime.loadExtension('bizproc.setup-template');
			if (!this.#isPullSubscribed) {
				SetupTemplate.subscribeOnPull();
				this.#isPullSubscribed = true;
			}
		}
	}
	const aiAgentLauncherService = new AiAgentLauncherService();

	exports.AiAgentErrorCode = AiAgentErrorCode;
	exports.aiAgentLauncherService = aiAgentLauncherService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX);
//# sourceMappingURL=ai-agent-launcher-service.bundle.js.map
