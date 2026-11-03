/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
(function (exports, main_core, main_core_events, sign_v2_blankSelector, sign_v2_api, sign_v2_signSettings, ui_buttons, ui_alerts) {
	'use strict';

	class DocumentSetup extends main_core_events.EventEmitter {
		#notificationContainer;
		#changeDomainWarningContainer;
		#scenarioType;
		#api;
		#uids;
		#documentMode;
		#chatId;
		#actionMode = 'create';
		#templateFolderId;
		constructor(blankSelectorConfig) {
			super();
			this.setEventNamespace('BX.Sign.V2.DocumentSetup');
			this.blankSelector = new sign_v2_blankSelector.BlankSelector({
				...blankSelectorConfig,
				events: {
					toggleSelection: ({
						data
					}) => {
						this.emit('toggleActivity', {
							...data,
							blankSelector: this.blankSelector
						});
					},
					addFile: ({
						data
					}) => {
						this.emit('addFile', {
							ready: this.blankSelector.isFilesReadyForUpload()
						});
					},
					removeFile: () => this.emit('removeFile', {
						ready: this.blankSelector.isFilesReadyForUpload()
					}),
					clearFiles: () => this.emit('clearFiles')
				}
			});
			const {
				type,
				portalConfig,
				documentMode,
				chatId,
				templateFolderId
			} = blankSelectorConfig;
			this.setupData = null;
			this.blankIsNotSelected = true;
			this.#scenarioType = type;
			this.#api = new sign_v2_api.Api();
			this.#uids = new Map();
			this.#documentMode = documentMode;
			this.#templateFolderId = templateFolderId;
			this.#chatId = chatId;
			this.initLayout();
			this.#initNotifications(portalConfig);
		}
		#initNotifications(portalConfig) {
			this.#notificationContainer = main_core.Tag.render`<div></div>`;
			const buttonsContainer = this.layout.querySelector('.sign-blank-selector__tile-widget');
			main_core.Dom.insertBefore(this.#notificationContainer, buttonsContainer);
			const {
				isDomainChanged,
				isEdoRegion,
				isUnsecuredScheme
			} = portalConfig;
			if (this.#isChatCreated() && this.#scenarioType !== 'b2e') {
				this.#appendChatWarningContainer();
			}
			if (isDomainChanged) {
				this.#appendChangeDomainWarningContainer();
			}
			if (isUnsecuredScheme) {
				this.#appendUnsecuredSchemeWarningContainer();
			}
			if (isEdoRegion && this.#scenarioType !== 'b2e') {
				this.#appendEdoWarningContainer();
			}
		}
		#isChatCreated() {
			return this.#chatId > 0;
		}
		#appendChatWarningContainer() {
			const text = `<div>${main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_COLLAB_WARNING')}</div>`;
			const warning = this.#getWarning();
			warning.setText(text);
			main_core.Dom.append(warning.getContainer(), this.#notificationContainer);
		}
		async #register(blankId, isTemplateMode = false, chatId = 0, initiatedByType = null) {
			const data = await this.#api.register(blankId, this.#scenarioType, isTemplateMode, chatId, this.#templateFolderId, initiatedByType);
			return data ?? {};
		}
		async #changeDocumentBlank(uid, blankId) {
			const data = await this.#api.changeBlank(uid, blankId);
			return data ?? {};
		}
		async #getPages(uid) {
			const data = await this.#api.getPages(uid);
			return data.pages ?? [];
		}
		async #convertToBase64(pages) {
			const promises = pages.map(async page => {
				const data = await fetch(page.url);
				const blob = await data.blob();
				const fileReader = new FileReader();
				await new Promise(resolve => {
					main_core.Event.bindOnce(fileReader, 'loadend', resolve);
					fileReader.readAsDataURL(blob);
				});
				return fileReader.result;
			});
			return Promise.all(promises);
		}
		#setDocumentData(setupData) {
			this.setupData = setupData;
			this.blankSelector.clearFiles({
				removeFromServer: false
			});
		}
		async #processPages(urls, cb, newBlocks) {
			let startIndex = 0;
			const pagesCount = 3;
			while (startIndex < urls.length) {
				const sliced = urls.slice(startIndex, startIndex + pagesCount);
				const convertedPages = await this.#convertToBase64(sliced);
				this.emit('toggleActivity', {
					selected: true
				});
				startIndex += pagesCount;
				cb(convertedPages, urls.length, newBlocks);
			}
		}
		#appendUnsecuredSchemeWarningContainer() {
			const text = `<div>${main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_USE_UNSECURED_SCHEME_WARNING')}</div>`;
			const warning = this.#getWarning();
			warning.setText(text);
			main_core.Dom.append(warning.getContainer(), this.#notificationContainer);
		}
		#appendChangeDomainWarningContainer() {
			const domainChangeButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_REFRESH_DOMAIN_BUTTON_TEXT'),
				color: ui_buttons.Button.Color.LINK,
				onclick: () => this.#api.changeDomain().then(() => this.#removeChangeDomainWarningContainer()),
				className: 'sign-document-setup__change-domain-button',
				size: ui_buttons.Button.Size.EXTRA_SMALL
			});
			const text = `<p>${main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_CHANGE_DOMAIN_WARNING')}</p>`;
			const warning = this.#getWarning();
			warning.setText(text);
			this.#changeDomainWarningContainer = warning.getContainer();
			main_core.Dom.append(domainChangeButton.getContainer(), this.#changeDomainWarningContainer);
			main_core.Dom.append(this.#changeDomainWarningContainer, this.#notificationContainer);
		}
		#getWarning() {
			return new ui_alerts.Alert({
				size: ui_alerts.Alert.Size.MD,
				color: ui_alerts.Alert.Color.WARNING,
				icon: ui_alerts.Alert.Icon.DANGER,
				customClass: 'sign-document-setup__change-domain-wrapper'
			});
		}
		#removeChangeDomainWarningContainer() {
			main_core.Dom.remove(this.#changeDomainWarningContainer);
		}
		#appendEdoWarningContainer() {
			const text = main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_EDO_TEXT', {
				'[helpdesklink]': '<a class="sign-document-setup__helpdesk-article" href="javascript:top.BX.Helper.show(\'redirect=detail&code=18453372\');">',
				'[/helpdesklink]': '</a>'
			});
			const alert = this.#getWarning();
			alert.setColor(ui_alerts.Alert.Color.PRIMARY);
			alert.setIcon(ui_alerts.Alert.Icon.INFO);
			alert.setText(text);
			main_core.Dom.append(alert.getContainer(), this.#notificationContainer);
		}
		initLayout() {
			this.layout = main_core.Tag.render`
			<div class="sign-document-setup">
				<p class="sign-document-setup__add-title">
					${main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_ADD_TITLE')}
				</p>
				${this.blankSelector.getLayout()}
			</div>
		`;
		}
		isSameBlankSelected() {
			const {
				selectedBlankId
			} = this.blankSelector;
			const {
				blankId: lastBlankId
			} = this.setupData ?? {};
			return selectedBlankId > 0 && lastBlankId === selectedBlankId;
		}
		handleError(blankId) {
			this.#setDocumentData(null);
			this.blankSelector.resetSelectedBlank();
			this.blankSelector.deleteBlank(blankId);
		}
		loadBlocks(uid) {
			return this.#api.loadBlocksByDocument(uid);
		}
		async setup(uid, isTemplateMode = false, initiatedByType = null) {
			this.#actionMode = main_core.Type.isStringFilled(uid) ? 'edit' : 'create';
			if (this.isSameBlankSelected()) {
				this.setupData = {
					...this.setupData,
					isTemplate: true
				};
				return;
			}
			const {
				selectedBlankId
			} = this.blankSelector;
			let blankId = 0;
			try {
				if (uid) {
					const [loadedData, blocks] = await Promise.all([this.#api.loadDocument(uid), this.loadBlocks(uid)]);
					this.#setDocumentData({
						...loadedData,
						blocks,
						isTemplate: true
					});
					const {
						blankId
					} = loadedData;
					this.blankIsNotSelected = false;
					if (!this.blankSelector.hasBlank(blankId)) {
						await this.blankSelector.loadBlankById(blankId);
					}
					this.blankSelector.selectBlank(blankId, {
						isInitial: true
					});
				} else {
					this.ready = false;
					blankId = selectedBlankId || (await this.blankSelector.createBlank());
					if (!blankId) {
						this.blankIsNotSelected = true;
						return;
					}
					let documentUid = this.setupData?.uid;
					let documentTemplateUid = null;
					const isRegistered = this.#uids.has(blankId);
					const {
						uid,
						templateUid
					} = isRegistered ? await this.#changeDocumentBlank(this.#uids.get(blankId), blankId) : await this.#register(blankId, isTemplateMode, this.#chatId, initiatedByType);
					documentUid = uid;
					documentTemplateUid = templateUid;
					this.#uids.set(blankId, documentUid);
					await this.#api.upload(documentUid);
					const [loadedData, blocks] = await Promise.all([this.#api.loadDocument(documentUid), this.#api.loadBlocksByDocument(documentUid)]);
					const isTemplate = Boolean(selectedBlankId);
					this.#setDocumentData({
						...loadedData,
						blocks,
						isTemplate,
						templateUid: documentTemplateUid
					});
				}
			} catch {
				this.handleError(blankId);
			}
			this.ready = true;
		}
		async waitForPagesList(documentData, cb, preparedPages = false, isSelectBlank = true) {
			let pollTimeout = 0;
			let isPagesReady = false;
			const requestTime = 10 * 1000;
			const {
				uid,
				blankId,
				isTemplate
			} = documentData;
			if (!isTemplate && isSelectBlank) {
				this.blankSelector.selectBlank(blankId);
			}
			this.emit('toggleActivity', {
				selected: false
			});
			const promises = [new Promise(resolve => {
				BX.PULL?.subscribe({
					moduleId: 'sign',
					command: 'blankIsReady',
					callback: result => {
						if (!isPagesReady && result?.pages && result?.uid === uid) {
							resolve(result?.pages);
						}
					}
				});
			}),
			// The next poll is scheduled only after the previous answer: pages come from the signing
			// service, and on a slow answer a fixed interval would stack requests that never finish,
			// exhausting the php-fpm pool instead of waiting.
			new Promise(resolve => {
				const poll = async () => {
					if (isPagesReady) {
						return;
					}
					let urls = [];
					try {
						urls = await this.#getPages(uid);
					} catch {
						// a failed poll must not stop the waiting: the next one is scheduled anyway
					}
					if (isPagesReady) {
						return;
					}
					if (urls.length > 0) {
						resolve(urls);
						return;
					}
					pollTimeout = setTimeout(poll, requestTime);
				};
				pollTimeout = setTimeout(poll, requestTime);
			})];
			if (preparedPages) {
				promises.push(new Promise(resolve => {
					this.#getPages(uid).then(urls => {
						if (urls.length > 0) {
							resolve(urls);
						}
					});
				}));
			}
			const urls = await Promise.race(promises);
			if (!isTemplate && urls.length > 0) {
				const blank = this.blankSelector.getBlank(blankId);
				if (!main_core.Type.isNil(blank)) {
					blank.setPreview(urls[0].url);
				}
			}
			let blocks = null;
			if (this.isTemplateMode()) {
				blocks = await this.loadBlocks(uid);
				this.setupData.blocks = blocks;
			}
			isPagesReady = true;
			clearTimeout(pollTimeout);
			await this.#processPages(urls, cb, blocks);
		}
		set ready(isReady) {
			if (isReady) {
				main_core.Dom.removeClass(this.layout, '--pending');
			} else {
				main_core.Dom.addClass(this.layout, '--pending');
			}
		}
		get isEditorFlowPending() {
			return false;
		}
		isTemplateMode() {
			return sign_v2_signSettings.isTemplateMode(this.#documentMode);
		}
		deleteDocumentFromList(blankId) {
			this.#uids.delete(blankId);
		}
		getActionMode() {
			return this.#actionMode;
		}
		isEditActionMode() {
			return this.getActionMode() === 'edit';
		}
	}

	exports.DocumentSetup = DocumentSetup;

})(this.BX.Sign.V2 = this.BX.Sign.V2 || {}, BX, BX.Event, BX.Sign.V2, BX.Sign.V2, BX.Sign.V2, BX.UI, BX.UI);
//# sourceMappingURL=document-setup.bundle.js.map
