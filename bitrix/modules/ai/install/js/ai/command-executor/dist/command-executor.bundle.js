/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ai_engine, ai_payload_textpayload, main_core) {
	'use strict';

	const CommandCodes = Object.freeze({
		createChecklist: 'create_checklist'
	});
	class CommandExecutor {
		#engine;
		#isAgreementAccepted;
		constructor(options) {
			this.#checkOptions(options);
			this.#initEngine({
				moduleId: options.moduleId,
				contextId: options.contextId,
				contextParameters: options.contextParameters || {}
			});
			this.#isAgreementAccepted = main_core.Extension.getSettings('ai.command-executor').isAgreementAccepted === true;
		}
		async makeChecklistFromText(text) {
			return new Promise((resolve, reject) => {
				if (!text) {
					throw new Error('AI.CommandExecutor.makeChecklistFromText: text is required parameter');
				}
				if (this.#isAgreementAccepted === false) {
					this.#checkAgreement(() => {
						this.#isAgreementAccepted = true;
						this.makeChecklistFromText(text).then(result => {
							resolve(result);
						}).catch(err => {
							reject(err);
						});
					}, () => {
						reject(new Error('Agreement is not accepted'));
					});
				} else {
					const payload = new ai_payload_textpayload.Text({
						prompt: {
							code: CommandCodes.createChecklist
						}
					});
					payload.setMarkers({
						original_message: text
					});
					this.#engine.setPayload(payload);
					this.#engine.setAnalyticParameters({
						c_section: 'tasks'
					});
					this.#engine.textCompletions(payload).then(result => {
						resolve(result.data.result);
					}).catch(err => {
						const errorFromServer = err?.errors?.[0];
						if (errorFromServer?.code === 'CLOUD_REGISTRATION_DATA_NOT_FOUND') {
							this.#showNotification(errorFromServer.message);
						}
						reject(err);
					});
				}
			});
		}
		#checkOptions(options) {
			if (!options.moduleId) {
				throw new Error('BX.AI.CommandExecutor: moduleId is required option');
			}
			if (!options.contextId) {
				throw new Error('BX.AI.CommandExecutor: contextId is required option');
			}
		}
		#initEngine(options) {
			this.#engine = new ai_engine.Engine();
			this.#engine.setContextId(options.contextId).setModuleId(options.moduleId).setContextParameters(options.contextParameters);
		}
		async #checkAgreement(onAccept, onCancel) {
			const {
				CopilotAgreement
			} = await main_core.Runtime.loadExtension('ai.copilot-agreement');
			const options = {
				moduleId: this.#engine.getModuleId(),
				contextId: this.#engine.getContextId(),
				events: {
					onAccept,
					onCancel
				}
			};
			const agreement = new CopilotAgreement(options);
			return agreement.checkAgreement();
		}
		async #showNotification(message) {
			await main_core.Runtime.loadExtension('ui.notification');
			const notificationCenter = main_core.Reflection.getClass('BX.UI.Notification.Center');
			notificationCenter.notify({
				id: 'command-executor-notification',
				content: message
			});
		}
	}

	exports.CommandExecutor = CommandExecutor;

})(this.BX.AI = this.BX.AI || {}, BX.AI, BX.AI.Payload, BX);
//# sourceMappingURL=command-executor.bundle.js.map
