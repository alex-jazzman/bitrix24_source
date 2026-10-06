/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
(function (exports, main_core, main_core_cache, sign_type, sign_v2_analytics, sign_v2_documentSetup, sign_v2_preview, ui_wizard) {
	'use strict';

	function decorateResultBeforeCompletion(innerCallback, onSuccess, onFail) {
		return async () => {
			let result = false;
			try {
				result = await innerCallback();
			} catch (e) {
				await onFail();
				throw e;
			}
			if (result) {
				await onSuccess();
			} else {
				await onFail();
			}
			return result;
		};
	}
	function isTemplateMode(mode) {
		return mode === sign_type.DocumentMode.template;
	}
	function getFilledStringOrUndefined(value) {
		return main_core.Type.isStringFilled(value) ? value : undefined;
	}
	function setInitialNextButtonState(wizard, uid) {
		wizard.toggleBtnActiveState('next', !main_core.Type.isStringFilled(uid));
	}

	class SignSettings {
		#cache = new main_core_cache.MemoryCache();
		#containerId;
		#preview;
		#type;
		#wizardOptions;
		#previewLayout = null;
		#container = null;
		#overlayContainer = null;
		#currentOverlay = null;
		#isEditMode = false;
		#isSameBlankSelected = false;
		hasPreviewUrls = false;
		constructor(containerId, signOptions = {}, wizardOptions = {}) {
			this.#containerId = containerId;
			this.#wizardOptions = wizardOptions;
			const {
				type = '',
				config = {},
				documentMode,
				initiatedByType
			} = signOptions;
			this.documentMode = documentMode;
			this.#type = type;
			this.documentsGroup = new Map();
			this.documentsGroupUids = [];
			const {
				languages,
				needSkipEditorStep
			} = config.documentSendConfig ?? {};
			const EditorConstructor = main_core.Reflection.getClass('top.BX.Sign.V2.Editor');
			this.editor = new EditorConstructor(type, {
				languages,
				isTemplateMode: this.isTemplateMode(),
				documentInitiatedByType: initiatedByType,
				needSkipEditorStep
			});
			this.#preview = new sign_v2_preview.Preview({
				layout: {
					getAfterPreviewLayoutCallback: () => this.getAfterPreviewLayout()
				}
			});
		}
		#createHead() {
			const headerTitle = this.#getHeaderTitleText();
			const headerTitleSub = this.#getHeaderTitleSubText();
			return main_core.Tag.render`
			<div class="sign-settings__head">
				<div>
					<p class="sign-settings__head_title">${headerTitle}</p>
					<p class="sign-settings__head_title --sub">
						${headerTitleSub}
					</p>
				</div>
			</div>
		`;
		}
		#getHeaderTitleSubText() {
			if (this.#type === 'b2b') {
				return main_core.Loc.getMessage('SIGN_SETTINGS_B2B_TITLE_SUB');
			}
			if (this.isTemplateMode() && this.#isEditMode) {
				return null;
			}
			return main_core.Loc.getMessage('SIGN_SETTINGS_B2E_TITLE_SUB');
		}
		#getHeaderTitleText() {
			if (this.isTemplateMode()) {
				return this.#isEditMode ? main_core.Loc.getMessage('SIGN_SETTINGS_TITLE_TEMPLATE_EDIT') : main_core.Loc.getMessage('SIGN_SETTINGS_TITLE_TEMPLATE');
			}
			return main_core.Loc.getMessage('SIGN_SETTINGS_TITLE');
		}
		isTemplateMode() {
			return this.documentMode === sign_type.DocumentMode.template;
		}
		isDocumentMode() {
			return this.documentMode === sign_type.DocumentMode.document;
		}
		#getLayout() {
			this.#previewLayout = this.#preview.getLayout();
			this.#container = this.getLayoutTemplate(this.#createHead(), this.wizard.getLayout(), this.#previewLayout);
			return this.#container;
		}
		getLayoutTemplate(header, wizard, preview) {
			const className = this.#type === 'b2e' ? 'sign-settings --b2e' : 'sign-settings';
			return main_core.Tag.render`
			<div class="sign-settings__scope ${className}">
				<div class="sign-settings__sidebar">
					${header}
					${wizard}
				</div>
				<div class="sing-settings-preview-block">
					${preview}
				</div>
			</div>
		`;
		}
		#getOverlayContainer() {
			if (!this.#overlayContainer) {
				this.#overlayContainer = main_core.Tag.render`<div class="sign-settings__overlay"></div>`;
			}
			main_core.Dom.hide(this.#overlayContainer);
			return this.#overlayContainer;
		}
		#showCompleteNotification() {
			const Notification = main_core.Reflection.getClass('top.BX.UI.Notification');
			const notificationText = this.isGroupDocuments() ? main_core.Loc.getMessage('SIGN_SETTINGS_COMPLETE_NOTIFICATION_TEXT_GROUP') : main_core.Loc.getMessage('SIGN_SETTINGS_COMPLETE_NOTIFICATION_TEXT');
			Notification.Center.notify({
				content: notificationText,
				autoHideDelay: 4000
			});
		}
		onComplete(showNotification = true) {
			BX.SidePanel.Instance.close();
			if (showNotification) {
				this.#showCompleteNotification();
			}
			if (this.isSingleDocument()) {
				const queryString = window.location.search;
				const urlParams = new URLSearchParams(queryString);
				if (!urlParams.has('noRedirect')) {
					const {
						entityTypeId,
						entityId
					} = this.documentSetup.setupData;
					const detailsUrl = `/crm/type/${entityTypeId}/details/${entityId}/`;
					BX.SidePanel.Instance.open(detailsUrl);
				}
			}
		}
		isSingleDocument() {
			return this.documentsGroup.size === 1;
		}
		isGroupDocuments() {
			return this.documentsGroup.size > 1;
		}
		async renderPages(documentData, preparedPages = false, isSelectBlank = true) {
			this.#preview.urls = [];
			this.disablePreviewReady();
			this.#preview.setBlocks(documentData.blocks);
			this.editor.setUrls([], 0);
			this.wizard.toggleBtnActiveState('back', true);
			this.wizard.toggleBtnActiveState('complete', true);
			const handler = (urls, totalPages, newBlocks) => {
				this.enablePreviewReady();
				this.#preview.urls = urls;
				this.editor.setUrls(urls, totalPages);
				if (main_core.Type.isArray(newBlocks)) {
					this.#preview.setBlocks(newBlocks);
				}
				this.hasPreviewUrls = true;
				if (this.documentSetup.isEditorFlowPending) {
					return;
				}
				this.wizard.toggleBtnActiveState('back', false);
				this.wizard.toggleBtnActiveState('complete', false);
			};
			this.pagesLoadingPromise = this.documentSetup.waitForPagesList(documentData, handler, preparedPages, isSelectBlank);
		}
		getFirstDocumentUidFromGroup() {
			return this.documentsGroup.keys().next().value;
		}
		getFirstDocumentDataFromGroup() {
			return this.documentsGroup.values().next().value;
		}

		/**
		 * Returns document data with settings in the wizard
		 */
		getDocumentSetupData() {
			const firstDocumentData = this.getFirstDocumentDataFromGroup() || {};
			const setupData = this.documentSetup.setupData || {};
			return {
				...firstDocumentData,
				...setupData
			};
		}
		#subscribeOnEditorEvents() {
			this.editor.subscribe('save', ({
				data
			}) => {
				const blocks = data.blocks;
				const uid = data.uid;
				if (this.documentsGroup.has(uid) === false) {
					return;
				}
				const selectedDocument = this.documentsGroup.get(uid);
				selectedDocument.blocks = blocks;
				if (uid === this.getFirstDocumentUidFromGroup()) {
					this.#preview.setBlocks(blocks);
					this.documentSetup.setupData = {
						...this.documentSetup.setupData,
						blocks
					};
				}
			});
		}
		subscribeOnEvents() {
			const settingsEvents = [{
				type: 'toggleActivity',
				stage: 'setup',
				method: ({
					data
				}) => {
					if (this.documentSetup.isEditorFlowPending) {
						return;
					}
					const {
						selected
					} = data;
					this.wizard.toggleBtnActiveState('next', !selected);
				}
			}, {
				type: 'addFile',
				stage: 'setup',
				method: ({
					data
				}) => {
					if (this.documentSetup.isEditorFlowPending) {
						return;
					}
					this.wizard.toggleBtnActiveState('next', !data.ready);
				}
			}, {
				type: 'removeFile',
				stage: 'setup',
				method: ({
					data
				}) => {
					if (this.documentSetup.isEditorFlowPending) {
						return;
					}
					this.wizard.toggleBtnActiveState('next', !data.ready);
				}
			}, {
				type: 'clearFiles',
				stage: 'setup',
				method: () => {
					if (this.documentSetup.isEditorFlowPending) {
						return;
					}
					this.wizard.toggleBtnActiveState('next', true);
				}
			}, {
				type: 'showEditor',
				stage: 'send',
				method: async event => {
					const {
						uid
					} = event.getData();
					if (uid && this.isGroupDocuments()) {
						await this.#executeEditorActionsForGroup(uid);
					}
					this.editor.show();
				}
			}, {
				type: 'changeTitle',
				stage: 'send',
				method: ({
					data
				}) => {
					this.documentSetup.setupData = {
						...this.documentSetup.setupData,
						title: data.title
					};
					const {
						blankTitle
					} = data;
					if (blankTitle) {
						const {
							blankSelector,
							setupData
						} = this.documentSetup;
						blankSelector.modifyBlankTitle(setupData.blankId, blankTitle);
					}
				}
			}, {
				type: 'close',
				stage: 'send',
				method: () => this.onComplete(false)
			}, {
				type: 'hidePreview',
				stage: 'send',
				method: () => main_core.Dom.style(this.#previewLayout, 'display', 'none')
			}, {
				type: 'showPreview',
				stage: 'send',
				method: () => main_core.Dom.style(this.#previewLayout, 'display', 'flex')
			}, {
				type: 'appendOverlay',
				stage: 'send',
				method: event => this.#appendOverlay(event?.data?.overlay)
			}, {
				type: 'showOverlay',
				stage: 'send',
				method: () => this.#showOverlay()
			}, {
				type: 'hideOverlay',
				stage: 'send',
				method: () => this.#hideOverlay()
			}];
			settingsEvents.forEach(({
				type,
				method,
				stage
			}) => {
				const step = stage === 'setup' ? this.documentSetup : this.documentSend;
				step.subscribe(type, method);
			});
			this.#subscribeOnEditorEvents();
		}
		async getPagesUrls(data, preparedPages = false) {
			const documentUrls = [];
			const handler = urls => {
				const targetDocument = this.documentsGroup.get(data.uid);
				documentUrls.push(...urls);
				targetDocument.urls = documentUrls;
			};
			await this.documentSetup.waitForPagesList(data, handler, preparedPages);
		}
		async #executeEditorActionsForGroup(uid) {
			this.editor.setUrls([], 0);
			const setupData = this.documentsGroup.get(uid);
			if (!setupData.urls) {
				const openEditorButton = this.#container.querySelector(`span[data-id="${setupData.id}"]`);
				main_core.Dom.addClass(openEditorButton, 'ui-btn-clock');
				await this.getPagesUrls(setupData);
				main_core.Dom.removeClass(openEditorButton, 'ui-btn-clock');
				this.documentSetup.blankSelector.disableSelectedBlank(setupData.blankId);
				this.documentSetup.resetDocument();
				this.wizard.toggleBtnActiveState('next', false);
			}
			const targetDocument = this.documentsGroup.get(uid);
			this.editor.documentData = targetDocument;
			this.editor.setUrls(targetDocument.urls, targetDocument.urls.length);
			await this.editor.waitForPagesUrls();
			await this.editor.renderDocument();
		}
		#appendOverlay(overlay) {
			if (!overlay) {
				return;
			}
			if (this.#currentOverlay) {
				main_core.Dom.remove(this.#currentOverlay);
			}
			this.#currentOverlay = overlay;
			main_core.Dom.append(this.#currentOverlay, this.#overlayContainer);
		}
		async setupDocument(uid, preparedPages = false) {
			if (this.documentSetup.isSameBlankSelected()) {
				void (await this.documentSetup.setup(uid));
				this.#isSameBlankSelected = true;
				return this.documentSetup.setupData;
			}
			if (this.documentsGroup.size === 0) {
				this.#preview.urls = [];
				this.editor.setUrls([], 0);
				this.#preview.setBlocks();
			}
			await this.documentSetup.setup(uid);
			const {
				setupData
			} = this.documentSetup;
			if (!setupData) {
				return null;
			}
			await this.renderPages(setupData, preparedPages);
			if (this.#preview.hasUrls()) {
				this.hasPreviewUrls = true;
				if (!this.documentSetup.isEditorFlowPending) {
					this.wizard.toggleBtnActiveState('next', false);
				}
			}
			this.#isSameBlankSelected = false;
			return setupData;
		}
		async init(uid, templateUid) {
			this.#isEditMode = main_core.Type.isStringFilled(uid) || main_core.Type.isStringFilled(templateUid);
			const metadata = this.getStepsMetadata(this, getFilledStringOrUndefined(uid), getFilledStringOrUndefined(templateUid));
			const {
				complete,
				...rest
			} = this.#wizardOptions;
			const title = this.isTemplateMode() ? main_core.Loc.getMessage('SIGN_SETTINGS_CREATE_TEMPLATE') : main_core.Loc.getMessage('SIGN_SETTINGS_SEND_FOR_SIGN');
			this.wizard = new ui_wizard.Wizard(metadata, {
				back: {
					className: 'ui-btn-light-border'
				},
				next: {
					className: 'ui-btn-primary'
				},
				complete: {
					className: 'ui-btn-primary',
					title,
					onComplete: () => this.onComplete(),
					...complete
				},
				...rest
			});
			if (uid) {
				await this.applyDocumentData(uid);
			}
			if (templateUid) {
				await this.applyTemplateData(templateUid);
			}
			this.#render(uid);
		}
		async applyTemplateData(templateUid)
		// eslint-disable-next-line no-empty-function
		{}
		#render(uid) {
			const container = document.getElementById(this.#containerId);
			main_core.Dom.append(this.#getOverlayContainer(), container);
			main_core.Dom.append(this.#getLayout(), container);
			const step = this.#getInitialStepIndex();
			setInitialNextButtonState(this.wizard, uid);
			this.wizard.moveOnStep(step);
		}
		#getInitialStepIndex() {
			const query = new URLSearchParams(window.location.search);
			const stepId = query.get('stepId');
			if (stepId === 'changePartner' && this.isTemplateMode()) {
				return 0;
			}
			return this.documentSetup.setupData ? 1 : 0;
		}
		getStepsMetadata(signSettings, documentUid, templateUid) {
			return {};
		}
		#showOverlay() {
			main_core.Dom.style(this.#container, 'display', 'none');
			main_core.Dom.show(this.#overlayContainer);
		}
		#hideOverlay() {
			main_core.Dom.style(this.#container, 'display', 'flex');
			main_core.Dom.hide(this.#overlayContainer);
		}
		setAnalyticsContext(context) {
			this.getAnalytics().setContext(new sign_v2_analytics.Context(context));
		}
		getAnalytics() {
			return this.#cache.remember('analytics', () => new (top.BX?.Sign.V2.Analytics ?? sign_v2_analytics.Analytics)());
		}
		isEditMode() {
			return this.#isEditMode;
		}
		resetPreview() {
			this.#preview.urls = [];
			this.#preview.setBlocks();
		}
		disablePreviewReady() {
			this.#preview.ready = false;
		}
		enablePreviewReady() {
			this.#preview.ready = true;
		}
		setSingleDocument(setupData) {
			this.documentsGroup.clear();
			this.documentsGroup.set(setupData.uid, setupData);
			this.documentsGroupUids.length = 0;
			this.documentsGroupUids.push(setupData.uid);
			this.documentSend.setDocumentsBlock(this.documentsGroup);
			if (!this.#isSameBlankSelected) {
				this.resetPreview();
				this.editor.setUrls([]);
				this.disablePreviewReady();
			}
		}
		isFirstDocumentSelected(uid) {
			return this.documentsGroupUids[0] === uid;
		}
		getAfterPreviewLayout() {
			return null;
		}
		async applyDocumentData(uid) {}
	}

	exports.SignSettings = SignSettings;
	exports.decorateResultBeforeCompletion = decorateResultBeforeCompletion;
	exports.isTemplateMode = isTemplateMode;

})(this.BX.Sign.V2 = this.BX.Sign.V2 || {}, BX, BX.Cache, BX.Sign, BX.Sign.V2, BX.Sign.V2, BX.Sign.V2, BX.Ui);
//# sourceMappingURL=sign-settings.bundle.js.map
