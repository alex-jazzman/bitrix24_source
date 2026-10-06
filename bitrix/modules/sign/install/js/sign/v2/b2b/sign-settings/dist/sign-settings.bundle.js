/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, sign_v2_b2b_documentSend, sign_v2_b2b_requisites, sign_v2_documentSetup, sign_v2_signSettings) {
	'use strict';

	class B2BSignSettings extends sign_v2_signSettings.SignSettings {
		#requisites;
		constructor(containerId, signOptions) {
			super(containerId, signOptions);
			const {
				config,
				chatId = 0
			} = signOptions;
			const {
				blankSelectorConfig,
				documentSendConfig
			} = config;
			blankSelectorConfig.chatId = chatId;
			this.documentSetup = new sign_v2_documentSetup.DocumentSetup(blankSelectorConfig);
			this.documentSend = new sign_v2_b2b_documentSend.DocumentSend(documentSendConfig);
			this.#requisites = new sign_v2_b2b_requisites.Requisites();
			this.subscribeOnEvents();
		}
		async applyDocumentData(uid) {
			const applied = Boolean(await this.setupDocument(uid));
			if (!applied) {
				return false;
			}
			const {
				setupData
			} = this.documentSetup;
			this.#requisites.documentData = setupData;
			this.editor.documentData = setupData;
			this.#sendAnalyticsOnDocumentApply(setupData.id);
			this.documentsGroup.set(setupData.uid, setupData);
			return true;
		}
		getStepsMetadata(signSettings, documentUid) {
			this.#sendAnalyticsOnStart(documentUid);
			const steps = {
				setup: {
					get content() {
						return signSettings.documentSetup.layout;
					},
					title: main_core.Loc.getMessage('SIGN_SETTINGS_B2B_LOAD_DOCUMENT'),
					beforeCompletion: async () => {
						const setupData = await this.setupDocument();
						if (!setupData) {
							return false;
						}
						this.setSingleDocument(setupData);
						const {
							uid,
							entityId,
							initiator
						} = setupData;
						this.#requisites.documentData = {
							uid,
							entityId,
							initiator
						};
						return true;
					}
				},
				requisites: {
					get content() {
						return signSettings.#requisites.getLayout();
					},
					title: main_core.Loc.getMessage('SIGN_SETTINGS_B2B_PREPARING_DOCUMENT'),
					beforeCompletion: async () => {
						const {
							uid,
							isTemplate,
							title,
							initiator,
							initiatedByType
						} = this.documentSetup.setupData;
						const valid = this.#requisites.checkInitiator(initiator);
						if (!valid) {
							return false;
						}
						const entityData = await this.#requisites.processMembers();
						if (!entityData) {
							return false;
						}
						const blocks = await this.documentSetup.loadBlocks(uid);
						this.editor.documentData = {
							isTemplate,
							uid,
							blocks
						};
						this.editor.entityData = entityData;
						this.editor.setSenderType(initiatedByType);
						this.documentSend.documentData = {
							uid,
							title,
							blocks,
							initiator
						};
						this.documentSend.entityData = entityData;
						await this.editor.waitForPagesUrls();
						await this.editor.renderDocument();
						this.wizard.toggleBtnLoadingState('next', false);
						await this.editor.show();
						return true;
					}
				},
				send: {
					get content() {
						return signSettings.documentSend.getLayout();
					},
					title: main_core.Loc.getMessage('SIGN_SETTINGS_SEND_DOCUMENT'),
					beforeCompletion: () => {
						return this.documentSend.sendForSign();
					}
				}
			};
			this.#decorateStepsBeforeCompletionWithAnalytics(steps);
			return steps;
		}
		subscribeOnEvents() {
			super.subscribeOnEvents();
			this.#requisites.subscribe('changeInitiator', ({
				data
			}) => {
				this.documentSetup.setupData = {
					...this.documentSetup.setupData,
					initiator: data.initiator
				};
			});
		}
		#decorateStepsBeforeCompletionWithAnalytics(steps) {
			const analytics = this.getAnalytics();
			steps.send.beforeCompletion = sign_v2_signSettings.decorateResultBeforeCompletion(steps.send.beforeCompletion, () => {
				analytics.sendWithDocId({
					event: 'sent_document_to_sign',
					status: 'success'
				}, this.documentSend.documentData.uid);
			}, () => {
				analytics.send({
					event: 'sent_document_to_sign',
					status: 'error'
				});
			});
		}
		#sendAnalyticsOnStart() {
			const analytics = this.getAnalytics();
			if (!this.isEditMode()) {
				analytics.send({
					event: 'click_create_document'
				});
			}
		}
		#sendAnalyticsOnDocumentApply(documentId) {
			this.getAnalytics().sendWithDocId({
				event: 'click_create_document'
			}, documentId);
		}
	}

	exports.B2BSignSettings = B2BSignSettings;

})(this.BX.Sign.V2.B2b = this.BX.Sign.V2.B2b || {}, BX, BX.Sign.V2, BX.Sign.V2, BX.Sign.V2, BX.Sign.V2);
//# sourceMappingURL=sign-settings.bundle.js.map
