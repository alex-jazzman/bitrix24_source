/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_cache, sign_featureStorage, sign_type, sign_v2_api, sign_v2_b2e_documentSend, sign_v2_b2e_documentSetup, sign_v2_b2e_parties, sign_v2_b2e_regionalSettings, sign_v2_b2e_userParty, sign_v2_editor, sign_v2_helper, sign_v2_signSettings, ui_sidepanel_layout, ui_uploader_core, sign_v2_b2e_signDropdown) {
	'use strict';

	const acceptedUploaderFileTypes = new Set(['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'rtf', 'odt']);
	class B2ESignSettings extends sign_v2_signSettings.SignSettings {
		#companyParty;
		#regionalSettings;
		#userParty;
		#api;
		#maxDocumentCount;
		#cache = new main_core_cache.MemoryCache();
		#saveButton;
		#isMultiDocumentSaveProcessGone = false;
		#needSkipEditorStep;
		#previewDocumentDropdown = null;
		#preventPreviewReady = false;
		#waitingForPreviewAfterReplace = false;
		constructor(containerId, signOptions) {
			super(containerId, signOptions, {
				next: {
					className: 'ui-btn-success'
				},
				complete: {
					className: 'ui-btn-success'
				},
				swapButtons: true
			});
			const {
				b2eFeatureConfig,
				blankSelectorConfig,
				documentSendConfig,
				userPartyConfig
			} = this.#prepareConfig(signOptions);
			this.documentSetup = new sign_v2_b2e_documentSetup.DocumentSetup(blankSelectorConfig);
			this.documentSend = new sign_v2_b2e_documentSend.DocumentSend(documentSendConfig);
			this.#companyParty = new sign_v2_b2e_parties.Parties({
				...blankSelectorConfig,
				documentInitiatedType: signOptions.initiatedByType,
				documentMode: signOptions.documentMode
			}, b2eFeatureConfig.hcmLinkAvailable);
			this.#regionalSettings = new sign_v2_b2e_regionalSettings.RegionalSettings({
				templateMode: this.isTemplateMode(),
				regionDocumentTypes: blankSelectorConfig.regionDocumentTypes
			});
			this.#regionalSettings.isIntegrationVisible = !(this.isTemplateMode() && signOptions.initiatedByType === sign_type.DocumentInitiated.employee);
			this.#api = new sign_v2_api.Api();
			this.#maxDocumentCount = signOptions.b2eDocumentLimitCount;
			this.#userParty = new sign_v2_b2e_userParty.UserParty({
				mode: 'edit',
				...userPartyConfig
			});
			this.subscribeOnEvents();
			this.#needSkipEditorStep = documentSendConfig.needSkipEditorStep;
			this.editor.setIsB2eDocumentSectionDisabled(!this.documentSetup.isRuRegion());
			this.editor.setSectionVisibilityByType(sign_v2_editor.SectionType.HcmLinkIntegration, false);
			this.#companyParty.subscribe('onCompanySelect', event => {
				this.documentSend.setProvider(event.data.provider);
				this.#regionalSettings.isIntegrationEnabled = this.#isIntegrationEnabled(event.data?.provider?.code);
			});
			this.#companyParty.subscribe('onProviderSelect', event => {
				this.documentSend.setProvider(event.data.provider);
				this.#regionalSettings.isIntegrationEnabled = this.#isIntegrationEnabled(event.data?.provider?.code);
			});
			this.#createPreviewDocumentDropdown();
		}
		#prepareConfig(signOptions) {
			const {
				config,
				documentMode,
				fromRobot,
				fromTemplateFolder,
				b2eDocumentLimitCount,
				templateFolderId,
				isOpenedAsFolder,
				initiatedByType,
				type
			} = signOptions;
			const {
				blankSelectorConfig,
				documentSendConfig
			} = config;
			blankSelectorConfig.documentMode = documentMode;
			blankSelectorConfig.isOpenedFromRobot = fromRobot;
			blankSelectorConfig.b2eDocumentLimitCount = b2eDocumentLimitCount;
			blankSelectorConfig.isOpenedFromTemplateFolder = fromTemplateFolder;
			blankSelectorConfig.templateFolderId = templateFolderId;
			blankSelectorConfig.isOpenedAsFolder = isOpenedAsFolder;
			blankSelectorConfig.initiatedByType = initiatedByType;
			blankSelectorConfig.type = type;
			documentSendConfig.documentMode = documentMode;
			documentSendConfig.isOpenedFromRobot = fromRobot;
			documentSendConfig.templateFolderId = templateFolderId;
			return config;
		}
		subscribeOnEvents() {
			super.subscribeOnEvents();
			this.documentSend.subscribe('changeTitle', ({
				data
			}) => {
				const title = data?.title;
				if (!title) {
					return;
				}
				const uid = data?.uid;
				if (!uid) {
					return;
				}
				const encodedTitle = main_core.Text.encode(title);
				this.documentSetup.setDocumentTitle(encodedTitle);
				if (this.documentsGroup.has(uid) === false) {
					return;
				}
				const documentDetails = this.documentsGroup.get(uid);
				documentDetails.title = encodedTitle;
				this.documentsGroup.set(uid, documentDetails);
				this.documentSetup.updateDocumentBlock(documentDetails.id, title);
				this.#regionalSettings.documentsGroup = this.documentsGroup;
				if (!this.isGroupDocuments()) {
					return;
				}
				this.addInDocumentsGroupUids(documentDetails.uid);
				const selectedItemUid = this.#previewDocumentDropdown.getSelectedId();
				this.#setPreviewDocumentDropdownItems();
				if (!selectedItemUid) {
					return;
				}
				this.#previewDocumentDropdown.setItemSelected(selectedItemUid);
			});
			this.documentSend.subscribe('disableBack', () => {
				this.wizard.toggleBtnActiveState('back', true);
			});
			this.documentSend.subscribe('enableBack', () => {
				this.wizard.toggleBtnActiveState('back', false);
			});
			this.documentSetup.subscribe('addDocument', async () => {
				try {
					await this.setDocumentsGroup();
				} finally {
					this.documentSetup.emit('addDocumentCompleted');
				}
			});
			this.documentSetup.subscribe('changeDocumentTitle', this.#onChangeDocumentTitle.bind(this));
			this.documentSetup.subscribe('deleteDocument', ({
				data
			}) => {
				this.#deleteDocument(data);
			});
			this.documentSetup.subscribe('editDocument', ({
				data
			}) => {
				this.#editDocumentData(data.uid);
			});
			this.documentSetup.subscribe('replaceDocumentStart', this.#onReplaceDocumentStart.bind(this));
			this.documentSetup.subscribe('replaceDocumentFinish', this.#onReplaceDocumentFinish.bind(this));
			this.documentSetup.subscribe('replaceDocument', this.#onReplaceDocument.bind(this));
			this.documentSend.subscribe('enableComplete', () => {
				this.wizard.toggleBtnActiveState('complete', false);
			});
			this.documentSend.subscribe('disableComplete', () => {
				this.wizard.toggleBtnActiveState('complete', true);
			});
			this.documentSetup.subscribe('documentsLimitExceeded', () => {
				this.documentSetup.setAvailabilityDocumentSection(false);
			});
			this.documentSetup.subscribe('documentsLimitNotExceeded', () => {
				this.documentSetup.setAvailabilityDocumentSection(true);
			});
			this.documentSetup.subscribe('clearFiles', this.#onDocumentSetupClearFiles.bind(this));
			this.documentSend.subscribe(this.documentSend.events.onTemplateComplete, event => {
				if (this.isTemplateMode() && !this.isEditMode()) {
					const templateId = event.getData().templateId;
					this.getAnalytics().send({
						event: 'turn_on_off_template',
						type: 'auto',
						c_element: 'on',
						p5: `templateId_${templateId}`
					});
					this.getAnalytics().send({
						event: 'click_save_template',
						c_element: 'create_button',
						p5: `templateId_${templateId}`,
						status: 'success'
					});
				}
			});
			this.editor.subscribe('save', ({
				data
			}) => {
				const uid = data.uid;
				if (this.documentsGroup.has(uid) === false) {
					return;
				}
				this.#previewDocumentDropdown.selectItem(uid);
			});
			const showBlockEditorHandler = async ({
				data
			}) => {
				const {
					uid
				} = data;
				if (!uid || !this.documentsGroup.has(uid)) {
					return;
				}
				const documentData = this.documentsGroup.get(uid);
				this.documentSetup.ready = false;
				this.#preventPreviewReady = true;
				this.disablePreviewReady();
				try {
					if (this.isGroupDocuments()) {
						if (!documentData.urls) {
							await this.getPagesUrls(documentData, true);
						}
						this.editor.setUrls([], 0);
						this.editor.setUrls(documentData.urls, documentData.urls.length);
						await this.editor.waitForPagesUrls();
					} else if (this.pagesLoadingPromise) {
						await this.pagesLoadingPromise;
					}
				} finally {
					this.#preventPreviewReady = false;
					this.documentSetup.ready = true;
					this.enablePreviewReady();
				}
				this.editor.documentData = documentData;
				const editorPromise = this.editor.show();
				await this.editor.renderDocument();
				await editorPromise;
			};
			const showPlaceholderEditorHandler = async ({
				data
			}) => {
				const {
					uid
				} = data;
				if (!uid || !this.documentsGroup.has(uid)) {
					return;
				}
				const documentData = this.documentsGroup.get(uid);
				await this.documentSetup.openOnlineEditor(documentData);
			};
			this.documentSetup.subscribe('editorLock', () => {
				this.wizard.toggleBtnActiveState('back', true);
				this.wizard.toggleBtnActiveState('next', true);
				this.wizard.toggleBtnActiveState('complete', true);
			});
			this.documentSetup.subscribe('editorUnlock', () => {
				this.wizard.toggleBtnActiveState('back', false);
				this.wizard.toggleBtnActiveState('next', false);
				this.wizard.toggleBtnActiveState('complete', false);
			});
			this.documentSetup.subscribe('showBlockEditor', showBlockEditorHandler);
			this.documentSend.subscribe('showPlaceholderEditor', showPlaceholderEditorHandler);
		}
		async #onReplaceDocument(event) {
			const documentData = event?.getData?.()?.documentData;
			if (!documentData) {
				return;
			}
			if (this.documentsGroup.has(documentData.uid)) {
				this.documentsGroup.set(documentData.uid, documentData);
			}
			if (this.editedDocument?.uid === documentData.uid) {
				this.editedDocument = documentData;
			}
			this.documentSend.setDocumentsBlock(this.documentsGroup);
			this.#regionalSettings.documentsGroup = this.documentsGroup;
			if (this.isGroupDocuments()) {
				this.#previewDocumentDropdown.setItemSelected(documentData.uid);
			}
			this.#waitingForPreviewAfterReplace = true;
			try {
				// The replaced document keeps the same uid, so prepared pages may still belong to the previous file.
				await this.renderPages(documentData, false, false);
				await this.pagesLoadingPromise;
			} finally {
				this.#waitingForPreviewAfterReplace = false;
			}
		}
		#blockNextWhilePreviewLoading() {
			if (!this.#waitingForPreviewAfterReplace || !this.pagesLoadingPromise) {
				return;
			}
			this.wizard.toggleBtnActiveState('next', true);
			this.pagesLoadingPromise.finally(() => {
				this.wizard.toggleBtnActiveState('next', false);
			});
		}
		#enableNextWhenPreviewReady() {
			if (this.documentSetup.isEditorFlowPending) {
				return;
			}
			if (!this.pagesLoadingPromise) {
				this.wizard.toggleBtnActiveState('next', false);
				return;
			}
			this.wizard.toggleBtnActiveState('next', true);
			this.pagesLoadingPromise.finally(() => {
				if (!this.documentSetup.isEditorFlowPending) {
					this.wizard.toggleBtnActiveState('next', false);
				}
			});
		}
		#onReplaceDocumentStart() {
			this.wizard.toggleBtnActiveState('next', true);
		}
		#onReplaceDocumentFinish(event) {
			const data = event?.getData?.() ?? event?.data ?? {};
			if (data?.isSuccess !== false) {
				return;
			}
			this.wizard.toggleBtnActiveState('next', false);
		}
		#onDocumentSetupClearFiles() {
			if (this.documentSetup.isEditorFlowPending) {
				return;
			}
			if (this.documentsGroup.size > 0) {
				this.wizard.toggleBtnActiveState('next', false);
			}
		}
		#onChangeDocumentTitle(event) {
			const data = event?.getData?.() ?? event?.data ?? {};
			const title = data?.title;
			if (!title) {
				return;
			}
			const uid = data?.uid;
			if (!uid) {
				return;
			}
			if (!this.documentsGroup.has(uid)) {
				return;
			}
			const documentDetails = this.documentsGroup.get(uid);
			documentDetails.title = main_core.Text.encode(title);
			this.documentsGroup.set(uid, documentDetails);
			this.#regionalSettings.documentsGroup = this.documentsGroup;
			if (!this.isGroupDocuments()) {
				return;
			}
			const selectedItemUid = this.#previewDocumentDropdown.getSelectedId();
			this.#setPreviewDocumentDropdownItems();
			if (!selectedItemUid) {
				return;
			}
			this.#previewDocumentDropdown.setItemSelected(selectedItemUid);
		}
		async #editDocumentData(uid) {
			if (this.documentsGroup.has(uid) === false) {
				return;
			}
			if (!this.documentSetup.editMode) {
				this.#disableDocumentSectionIfLimitReached();
				this.#resetDocument();
				return;
			}
			if (this.editedDocument && this.isGroupDocuments()) {
				this.#setPreviewDocumentDropdownItems();
			}
			this.editedDocument = this.documentsGroup.get(uid);
			this.documentSetup.setAvailabilityDocumentSection(true);
			this.#scrollToDown();
			this.documentSetup.setDocumentTitle(this.editedDocument.title);
			if (this.isGroupDocuments() === false) {
				return;
			}
			await this.renderPages(this.editedDocument, true, false);
			this.#previewDocumentDropdown.setItemSelected(uid);
		}
		enablePreviewReady() {
			if (this.#preventPreviewReady) {
				return;
			}
			super.enablePreviewReady();
		}
		async renderPages(documentData, preparedPages = false, isSelectBlank = true) {
			// Reset until the new pages finish loading, otherwise #processSetupData() re-enables "next"
			// on the stale flag and the user can advance past a still-loading document.
			this.hasPreviewUrls = false;
			await super.renderPages(documentData, preparedPages, isSelectBlank);
		}
		getLayoutTemplate(header, wizard, preview) {
			const previewDocumentDropdown = this.#previewDocumentDropdown.getLayout();
			this.#togglePreviewDocumentDropdown();
			return main_core.Tag.render`
			<div class="sign-settings__scope sign-settings --b2e">
				<div class="sign-settings__sidebar">
					${header}
					${wizard}
				</div>
				<div class="sing-settings-preview-block">
					${previewDocumentDropdown}
					${preview}
				</div>
			</div>
		`;
		}
		#createPreviewDocumentDropdown() {
			this.#previewDocumentDropdown = new sign_v2_b2e_signDropdown.SignDropdown({
				tabs: [{
					id: 'sign-preview-document-dropdown',
					title: ' '
				}],
				entities: [],
				className: 'sign-preview-document-dropdown',
				withCaption: true,
				isEnableSearch: false,
				width: 444
			});
			this.#togglePreviewDocumentDropdown();
			this.#previewDocumentDropdown.subscribe('onSelect', item => {
				const uidFromEvent = item.data?.item?.id;
				if (uidFromEvent === null) {
					return;
				}
				if (this.documentsGroup.has(uidFromEvent) === false) {
					return;
				}
				const documentDetails = this.documentsGroup.get(uidFromEvent);
				this.#resetDocument();
				this.documentSetup.setDocumentTitle(documentDetails.title);
				this.renderPages(documentDetails, true, false);
			});
		}
		#setPreviewDocumentDropdownItems() {
			const selectedUid = this.documentSetup?.setupData?.uid;
			if (selectedUid === null) {
				return;
			}
			this.#previewDocumentDropdown.removeItems();
			this.documentsGroupUids.forEach(uid => {
				if (this.documentsGroup.has(uid) === false) {
					return;
				}
				const documentDetails = this.documentsGroup.get(uid);
				this.#previewDocumentDropdown.addItem({
					id: documentDetails.uid,
					title: documentDetails.title,
					entityId: 'b2e-document-detail',
					tabs: 'sign-preview-document-dropdown',
					deselectable: false
				});
			});
			this.#previewDocumentDropdown.setItemSelected(selectedUid);
		}
		async setDocumentsGroup() {
			if (this.documentSetup.blankIsNotSelected || !this.documentSetup.validate()) {
				return;
			}
			this.wizard.toggleBtnActiveState('next', true);
			try {
				const documentData = await this.setupDocument();
				this.documentsGroup.set(documentData.uid, documentData);
				this.addInDocumentsGroupUids(documentData.uid);
				this.documentSetup.blankSelector.disableSelectedBlank(documentData.blankId);
				await this.#attachGroupToDocument(documentData);
				if (this.editedDocument) {
					let uid = documentData.uid;
					if ((this.documentSetup.blankIsNotSelected || documentData.blankId === this.editedDocument.blankId) && !this.documentSetup.isFileAdded) {
						uid = this.editedDocument.uid;
					}
					await this.#handleEditedDocument(documentData).then(() => {
						this.#previewDocumentDropdown.selectItem(uid);
					}).catch(() => {});
				} else {
					this.documentSetup.renderDocumentBlock(documentData);
					if (this.isGroupDocuments()) {
						this.#setPreviewDocumentDropdownItems();
					}
					this.#togglePreviewDocumentDropdown();
				}
				this.documentSetup.blankSelector.clearFiles({
					removeFromServer: false
				});
			} catch {
				this.documentSetup.cancelEditorFlow();
			}
			this.#scrollToTop();
			this.documentSetup.documentCounters?.update(this.documentsGroup.size);
			this.#resetDocument();
			this.#enableNextWhenPreviewReady();
		}
		addInDocumentsGroupUids(uid) {
			if (!this.documentsGroupUids.includes(uid)) {
				this.documentsGroupUids.push(uid);
			}
		}
		async #handleEditedDocument(documentData) {
			if ((this.documentSetup.blankIsNotSelected || documentData.blankId === this.editedDocument.blankId) && !this.documentSetup.isFileAdded) {
				await this.#saveUpdatedDocumentData(this.editedDocument.uid);
				if (this.isGroupDocuments()) {
					await this.#setPreviewDocumentDropdownItems();
				}
				return;
			}
			this.deleteFromDocumentsGroupUids(documentData.uid);
			this.replaceInDocumentsGroupUids(this.editedDocument.uid, documentData.uid);
			this.documentSetup.replaceDocumentBlock(this.editedDocument, documentData);
			await this.#deleteDocument(this.editedDocument);
			await this.#attachGroupToDocument(documentData);
			this.editor.setUrls([]);
		}
		replaceInDocumentsGroupUids(oldUid, newUid) {
			const index = this.documentsGroupUids.indexOf(oldUid);
			if (index !== -1) {
				this.documentsGroupUids.splice(index, 1, newUid);
			}
		}
		deleteFromDocumentsGroupUids(uid) {
			const index = this.documentsGroupUids.indexOf(uid);
			if (index === -1) {
				return;
			}
			this.documentsGroupUids.splice(index, 1);
		}
		#removeDocumentElement(documentId) {
			const deletedElement = this.documentSetup.layout.querySelector(`[data-id="document-id-${documentId}"]`);
			deletedElement?.remove();
		}
		async #attachGroupToDocument(documentData) {
			if (this.isTemplateMode()) {
				return;
			}
			if (!this.groupId) {
				const {
					groupId
				} = await this.#api.createDocumentsGroup();
				this.groupId = groupId;
			}
			try {
				const targetDocument = this.documentsGroup.get(documentData.uid);
				if (targetDocument && !targetDocument.groupId) {
					await this.#api.attachGroupToDocument(documentData.uid, this.groupId);
					targetDocument.groupId = this.groupId;
				}
			} catch (error) {
				console.error(error);
			}
		}
		async #saveUpdatedDocumentData(uid) {
			const updatedDocumentData = await this.documentSetup.updateDocumentData(this.editedDocument);
			this.documentSetup.updateDocumentBlock(this.editedDocument.id);
			if (uid) {
				this.documentsGroup.set(this.editedDocument.uid, updatedDocumentData);
				this.addInDocumentsGroupUids(this.editedDocument.uid);
				this.documentSend.setDocumentsBlock(this.documentsGroup);
				this.#regionalSettings.documentsGroup = this.documentsGroup;
			}
		}
		#togglePreviewDocumentDropdown() {
			if (this.isGroupDocuments()) {
				this.#previewDocumentDropdown.show();
				return;
			}
			this.#previewDocumentDropdown.hide();
		}
		async #deleteDocument(data) {
			const {
				id,
				uid,
				blankId,
				deleteButton
			} = data;
			this.documentSetup.ready = false;
			if (this.documentsGroup.has(uid) === false) {
				return;
			}
			try {
				await this.#api.removeDocument(uid);
				this.documentSetup.ready = true;
				if (this.isFirstDocumentSelected(uid)) {
					this.resetPreview();
					this.hasPreviewUrls = false;
				}
				this.#removeDocumentElement(id);
				this.documentSend.deleteDocument(uid);
				this.documentsGroup.delete(uid);
				this.deleteFromDocumentsGroupUids(uid);
				this.documentSetup.blankSelector.enableSelectedBlank(blankId);
				this.documentSetup.deleteDocumentFromList(blankId);
				this.documentSetup.documentCounters?.update(this.documentsGroup.size);
				if (this.documentsGroup.size === 0) {
					this.wizard.toggleBtnActiveState('next', true);
				} else {
					this.documentSetup.setupData = this.getFirstDocumentDataFromGroup();
				}
				if (this.documentsGroup.size === 0) {
					return;
				}
				const lastDocumentDetails = [...this.documentsGroup.values()].pop();
				await this.renderPages(lastDocumentDetails, false, false);
				if (this.isGroupDocuments()) {
					this.#setPreviewDocumentDropdownItems();
				}
				this.#togglePreviewDocumentDropdown();
				this.#resetDocument();
			} catch {
				this.documentSetup.toggleDeleteBtnLoadingState(deleteButton);
				this.documentSetup.ready = true;
			}
		}
		async #setupParties() {
			const {
				representative
			} = this.#companyParty.getParties();
			const {
				members,
				signerParty
			} = this.#makeSetupMembers();
			const documentUids = [...this.documentsGroup.keys()];
			for (const documentUid of documentUids) {
				// eslint-disable-next-line no-await-in-loop
				await this.#api.setupB2eParties(documentUid, representative.entityId, members, this.#userParty.isRejectExcludedEnabled());
			}
			const uid = this.#documentUid;
			const membersData = await this.#api.loadMembers(uid);
			if (!main_core.Type.isArrayFilled(membersData)) {
				throw new Error('Members are empty');
			}
			const syncMemberPromises = documentUids.map(uid => this.#syncMembersWithDepartments(uid, signerParty));
			await Promise.all(syncMemberPromises);
			return membersData.map(memberData => {
				return {
					presetId: memberData?.presetId,
					part: memberData?.party,
					uid: memberData?.uid,
					entityTypeId: memberData?.entityTypeId ?? null,
					entityId: memberData?.entityId ?? null,
					role: memberData?.role ?? null
				};
			});
		}
		#isTemplateModeForCompany() {
			const isInitiatedByCompany = this.documentSetup.setupData.initiatedByType === sign_type.DocumentInitiated.company;
			return sign_v2_signSettings.isTemplateMode(this.documentMode) && isInitiatedByCompany;
		}
		async #syncMembersWithDepartments(uid, signerParty) {
			let syncFinished = false;
			while (!syncFinished) {
				// eslint-disable-next-line no-await-in-loop
				const response = await this.#api.syncB2eMembersWithDepartments(uid, signerParty, this.#userParty.isRejectExcludedEnabled());
				syncFinished = response.syncFinished;
				// eslint-disable-next-line no-await-in-loop
				await this.#sleep(1000);
			}
		}
		#sleep(ms) {
			return new Promise(resolve => {
				setTimeout(resolve, ms);
			});
		}
		get #documentUid() {
			return this.documentSetup.setupData.uid;
		}
		get #isDocumentInitiatedByEmployee() {
			return this.documentSetup.setupData.initiatedByType === sign_type.DocumentInitiated.employee;
		}
		#getAssignee(currentParty, companyId) {
			const {
				representative
			} = this.#companyParty.getParties();
			let type = sign_type.EntityType.COMPANY;
			if (representative.entityType !== sign_type.EntityType.USER) {
				type = representative.entityType;
			}
			return {
				entityType: type,
				entityId: companyId,
				party: currentParty,
				role: sign_type.MemberRole.assignee
			};
		}
		#getSigner(currentParty, entity) {
			return {
				entityType: entity.entityType,
				entityId: entity.entityId,
				party: currentParty,
				role: sign_type.MemberRole.signer
			};
		}
		#makeSetupMembers() {
			const {
				company,
				validation
			} = this.#companyParty.getParties();
			const userPartyEntities = this.#userParty.getEntities();
			let currentParty = this.#isDocumentInitiatedByEmployee ? 2 : 1;
			const members = validation.map(item => {
				const result = {
					...item,
					party: currentParty
				};
				currentParty++;
				return result;
			});
			members.push(this.#getAssignee(currentParty, company.entityId));
			let signerParty = currentParty;
			if (this.isDocumentMode()) {
				signerParty = this.#isDocumentInitiatedByEmployee ? 1 : currentParty + 1;
				const signers = userPartyEntities.map(entity => this.#getSigner(signerParty, entity));
				members.push(...signers);
			}
			return {
				members,
				signerParty
			};
		}
		#parseMembers(loadedMembers) {
			return loadedMembers.reduce((acc, member) => {
				const {
					entityType,
					entityId
				} = member;
				if (entityType !== sign_type.EntityType.USER && entityType !== sign_type.EntityType.STRUCTURE_NODE_ROLE) {
					return acc;
				}
				const role = `${member.role}s`;
				return {
					...acc,
					[role]: [...(acc[role] ?? []), entityId]
				};
			}, {});
		}
		async applyDocumentData(uid) {
			const setupData = await this.setupDocument(uid, true);
			if (!setupData) {
				return false;
			}
			if (setupData.groupId) {
				const documentsGroupData = await this.#api.getDocumentListInGroup(setupData.groupId);
				for (const item of documentsGroupData) {
					this.addInDocumentsGroupUids(item.uid);
					const blocks = await this.#api.loadBlocksByDocument(item.uid);
					const updatedItem = {
						...item,
						blocks
					};
					this.documentsGroup.set(item.uid, updatedItem);
					this.documentSetup.renderDocumentBlock(updatedItem);
					this.documentSetup.blankSelector.disableSelectedBlank(updatedItem.blankId);
				}
				this.groupId = setupData.groupId;
				this.documentSetup.documentCounters?.update(this.documentsGroup.size);
				this.#resetDocument();
			} else {
				this.documentsGroup.set(setupData.uid, setupData);
				this.addInDocumentsGroupUids(setupData.uid);
				if (this.isTemplateMode()) {
					this.documentSetup.renderDocumentBlock(setupData);
				}
			}
			const firstDocument = this.getFirstDocumentDataFromGroup();
			const {
				entityId,
				representativeId,
				companyUid,
				companyEntityId,
				hcmLinkCompanyId
			} = firstDocument;
			this.documentSend.documentData = this.documentsGroup;
			this.#disableDocumentSectionIfLimitReached();
			if (this.isSingleDocument()) {
				this.editor.documentData = firstDocument;
			}
			const members = await this.#api.loadMembers(uid);
			if (representativeId) {
				const memberEntityType = this.#getMemberEntityTypeByRole(members, sign_type.MemberRole.assignee);
				this.#companyParty.loadRepresentative(representativeId, memberEntityType);
			}
			const parsedMembers = this.#parseMembers(members);
			const {
				signers = [],
				assignees = []
			} = parsedMembers;
			this.#companyParty.setEntityId(entityId);
			if (companyUid) {
				this.#regionalSettings.setLastSavedHcmLinkCompanyId(hcmLinkCompanyId);
				this.#companyParty.loadCompany(companyUid,
				// workaround (assignee member) for old drafts/templates
				companyEntityId ?? assignees[0] ?? null);
			}
			if (signers.length > 0) {
				this.#userParty.load(signers);
			}
			this.#companyParty.loadValidator(members);
			return true;
		}
		#getMemberEntityTypeByRole(members, role) {
			const member = members.find(setupMemberItem => setupMemberItem.role === role);
			return member?.entityType === sign_type.EntityType.STRUCTURE_NODE_ROLE ? sign_type.EntityType.STRUCTURE_NODE_ROLE : sign_type.EntityType.USER;
		}
		async applyTemplateData(templateUid) {
			super.applyTemplateData(templateUid);
			this.documentSetup.setupData.templateUid = templateUid;
			this.documentSend.setExistingTemplate();
			return true;
		}
		#getSetupStep(signSettings, documentUid) {
			return {
				get content() {
					const layout = signSettings.documentSetup.layout;
					sign_v2_helper.SignSettingsItemCounter.numerate(layout);
					if (!main_core.Type.isNull(signSettings.getAfterPreviewLayout())) {
						BX.show(signSettings.getAfterPreviewLayout());
					}
					return layout;
				},
				title: main_core.Loc.getMessage('SIGN_SETTINGS_B2B_LOAD_DOCUMENT'),
				beforeCompletion: async () => {
					const blankIsSelected = this.documentSetup.blankSelector.selectedBlankId !== 0;
					if (blankIsSelected || this.documentSetup.isFileAdded) {
						const isValid = this.documentSetup.validate();
						if (!isValid) {
							return false;
						}
					}
					const hadStagedFiles = blankIsSelected || this.documentSetup.isFileAdded;
					const setupData = await this.setupDocument();
					if (!setupData) {
						if (this.documentsGroup.size === 0 || hadStagedFiles) {
							return false;
						}
						this.documentSetup.setupData = this.getFirstDocumentDataFromGroup();
						return true;
					}
					await this.#setDocumentInGroup(setupData).then(() => {
						if (this.isGroupDocuments()) {
							this.#setPreviewDocumentDropdownItems();
						}
						this.#togglePreviewDocumentDropdown();
					}).catch(() => {});
					if (this.editedDocument) {
						let uid = setupData.uid;
						if ((this.documentSetup.blankIsNotSelected || setupData.blankId === this.editedDocument.blankId) && !this.documentSetup.isFileAdded) {
							uid = this.editedDocument.uid;
						}
						await this.#handleEditedDocument(setupData).then(() => {
							this.#previewDocumentDropdown.selectItem(uid);
						}).catch(() => {});
					}
					this.#resetDocument();
					this.#processSetupData();
					this.#disableDocumentSectionIfLimitReached();
					if (!main_core.Type.isNull(this.getAfterPreviewLayout())) {
						BX.hide(this.getAfterPreviewLayout());
					}
					return true;
				}
			};
		}
		#getCompanyStep(signSettings) {
			const titleLocCode = this.isTemplateMode() ? 'SIGN_SETTINGS_B2E_ROUTES' : 'SIGN_SETTINGS_B2E_COMPANY';
			return {
				get content() {
					const layout = signSettings.#companyParty.getLayout();
					const isTemplateModeForCompany = signSettings.#isTemplateModeForCompany();
					if (signSettings.isTemplateMode()) {
						signSettings.#companyParty.setEditorAvailability(isTemplateModeForCompany);
					}
					sign_v2_helper.SignSettingsItemCounter.numerate(layout);
					if (!signSettings.isEditMode()) {
						if (!signSettings.#companyParty.isRepresentativeSelected()) {
							signSettings.#companyParty.loadFirstRepresentative();
						}
						if (!signSettings.#companyParty.isProviderSelected()) {
							signSettings.#companyParty.loadFirstCompany();
						}
					}
					signSettings.#blockNextWhilePreviewLoading();
					return layout;
				},
				title: main_core.Loc.getMessage(titleLocCode),
				beforeCompletion: async () => {
					const {
						initiatedByType
					} = this.documentSetup.setupData;
					try {
						for (const [uid] of this.documentsGroup) {
							// eslint-disable-next-line no-await-in-loop
							await this.#companyParty.save(uid);
						}
						this.#regionalSettings.companyId = this.#companyParty.getSelectedCompanyId();
						this.#regionalSettings.documentsGroup = this.documentsGroup;
						this.editor.setSenderType(initiatedByType);
						this.#setSecondPartySectionVisibility();
						if (this.isTemplateMode()) {
							this.#executeDocumentSendActions();
							this.#regionalSettings.isIntegrationVisible = !this.#isInitiatedByEmployee();
							if (!this.#isRegionalSettingsStepEnabled()) {
								await this.#executeTemplateSetupPartyActions();
							}
						}
					} catch (e) {
						console.warn(e);
						return false;
					}
					return true;
				}
			};
		}
		#getRegionalSettingsStep(signSettings, documentUid) {
			return {
				get content() {
					return signSettings.#regionalSettings.getLayout();
				},
				title: main_core.Loc.getMessage('SIGN_SETTINGS_B2E_REGIONAL_SETTINGS_SHORT'),
				beforeCompletion: async () => {
					try {
						await this.#regionalSettings.save();
					} catch {
						return false;
					}
					this.documentSetup.setupData.hcmLinkCompanyId = this.#regionalSettings.getSelectedHcmLinkCompanyId();
					this.documentSend.hcmLinkEnabled = this.documentSetup.setupData.hcmLinkCompanyId > 0;
					await this.#setHcmLinkIntegrationSectionVisibility();
					if (this.isTemplateMode()) {
						await this.#executeTemplateSetupPartyActions();
					}
					return true;
				}
			};
		}
		#getEmployeeStep(signSettings) {
			return {
				get content() {
					const layout = signSettings.#userParty.getLayout();
					sign_v2_helper.SignSettingsItemCounter.numerate(layout);
					return layout;
				},
				title: main_core.Loc.getMessage('SIGN_SETTINGS_B2E_EMPLOYEES'),
				beforeCompletion: async () => {
					try {
						const isValid = this.#userParty.validate();
						if (!isValid) {
							return isValid;
						}
						this.editor.entityData = await this.#setupParties();
						const {
							uid,
							isTemplate,
							entityId,
							hasPlaceholders
						} = this.documentSetup.setupData;
						const blocks = await this.documentSetup.loadBlocks(uid);
						this.#executeDocumentSendActions();
						const editorData = {
							isTemplate,
							uid,
							blocks,
							entityId,
							hasPlaceholders
						};
						await this.#executeEditorActions(editorData);
						return true;
					} catch (e) {
						console.error(e);
						return false;
					}
				}
			};
		}
		async #executeDocumentSendActions() {
			const partiesData = this.#companyParty.getParties();
			Object.assign(partiesData, {
				employees: this.#userParty.getEntities().map(entity => {
					return {
						entityType: entity.entityType,
						entityId: entity.entityId
					};
				})
			});
			this.documentSend.documentData = this.documentsGroup;
			this.documentSend.resetUserPartyPopup();
			this.documentSend.setPartiesData(partiesData);
		}
		async #executeEditorActions(editorData) {
			if (this.isTemplateCreateMode()) {
				this.editor.setAnalytics(this.getAnalytics());
			}
			this.wizard.toggleBtnLoadingState('next', false);
			if (this.isSingleDocument()) {
				this.editor.documentData = editorData;
				if (!editorData.hasPlaceholders) {
					await this.editor.renderDocument();
					if (!this.#needSkipEditorStep || this.isTemplateMode()) {
						await this.editor.show();
					}
				}
			}
		}
		#getSendStep(signSettings) {
			const titleLocCode = this.isTemplateMode() ? 'SIGN_SETTINGS_SEND_DOCUMENT_CREATE' : 'SIGN_SETTINGS_SEND_DOCUMENT';
			return {
				get content() {
					const layout = signSettings.documentSend.getLayout();
					sign_v2_helper.SignSettingsItemCounter.numerate(layout);
					if (!signSettings.documentSend.isDateTimeLimitSelectorValid()) {
						signSettings.wizard.toggleBtnActiveState('complete', true);
					}
					return layout;
				},
				title: main_core.Loc.getMessage(titleLocCode),
				beforeCompletion: async () => {
					return this.documentSend.sendForSign();
				}
			};
		}
		getStepsMetadata(signSettings, documentUid, templateUid) {
			this.#sendAnalyticsOnStart(documentUid);
			const steps = {
				setup: this.#getSetupStep(signSettings, documentUid),
				company: this.#getCompanyStep(signSettings)
			};
			if (this.#isRegionalSettingsStepEnabled()) {
				steps.regionalSettings = this.#getRegionalSettingsStep(signSettings, documentUid);
			}
			if (this.isDocumentMode()) {
				steps.employees = this.#getEmployeeStep(signSettings);
			}
			steps.send = this.#getSendStep(signSettings);
			this.#decorateStepsBeforeCompletionWithAnalytics(steps, documentUid);
			return steps;
		}
		#isRegionalSettingsStepEnabled() {
			return this.documentSetup.isRuRegion();
		}
		async init(uid, templateUid) {
			await super.init(uid, templateUid);
			this.#setPreviewDocumentDropdownItems();
			if (this.isEditMode() && !main_core.Type.isNull(this.getAfterPreviewLayout())) {
				BX.hide(this.getAfterPreviewLayout());
			}
			if (this.isEditMode()) {
				this.documentSetup.setDocumentTitle(this.documentSetup.setupData.title);
				this.documentSetup.enableDocumentInputs();
			}
		}
		onComplete(showNotification = true) {
			if (this.isTemplateMode()) {
				return;
			}
			super.onComplete(showNotification);
		}
		isTemplateCreateMode() {
			return sign_v2_signSettings.isTemplateMode(this.documentMode) && !this.isEditMode();
		}
		#setSecondPartySectionVisibility() {
			const selectedProvider = this.#companyParty.getSelectedProvider();
			const isNotSesRuProvider = selectedProvider.code !== sign_type.ProviderCode.sesRu;
			const isSecondPartySectionVisible = isNotSesRuProvider || sign_v2_signSettings.isTemplateMode(this.documentMode) && this.#isInitiatedByEmployee();
			this.editor.setSectionVisibilityByType(sign_v2_editor.SectionType.SecondParty, isSecondPartySectionVisible);
		}
		async #setHcmLinkIntegrationSectionVisibility() {
			const isInitiatedByCompany = this.documentSetup.setupData.initiatedByType === sign_type.DocumentInitiated.company;
			if (this.#isInitiatedByEmployee() && this.documentSetup.isRuRegion()) {
				await this.#api.changeIntegrationId(this.documentSetup.setupData.uid, null);
			}
			const isHcmLinkIntegrationSectionVisible = this.documentSetup.setupData.hcmLinkCompanyId > 0 && isInitiatedByCompany;
			this.editor.setSectionVisibilityByType(sign_v2_editor.SectionType.HcmLinkIntegration, isHcmLinkIntegrationSectionVisible);
		}
		#isInitiatedByEmployee() {
			return this.documentSetup.setupData.initiatedByType === sign_type.DocumentInitiated.employee;
		}
		#decorateStepsBeforeCompletionWithAnalytics(steps, documentUid) {
			const analytics = this.getAnalytics();
			if (main_core.Type.isPlainObject(steps.setup)) {
				steps.setup.beforeCompletion = sign_v2_signSettings.decorateResultBeforeCompletion(steps.setup.beforeCompletion, () => this.#sendAnalyticsOnSetupStep(analytics, documentUid), () => this.#sendAnalyticsOnSetupError(analytics));
			}
			if (main_core.Type.isPlainObject(steps.company)) {
				steps.company.beforeCompletion = sign_v2_signSettings.decorateResultBeforeCompletion(steps.company.beforeCompletion, () => this.#sendAnalyticsOnCompanyStepSuccess(analytics), () => this.#sendAnalyticsOnCompanyStepError(analytics));
			}
			if (main_core.Type.isPlainObject(steps.send)) {
				steps.send.beforeCompletion = sign_v2_signSettings.decorateResultBeforeCompletion(steps.send.beforeCompletion, () => this.#sendAnalyticsOnSendStepSuccess(analytics, this.documentSetup.setupData.uid), () => this.#sendAnalyticsOnSendStepError(analytics, this.documentSetup.setupData.uid));
			}
		}
		#sendAnalyticsOnSetupStep(analytics, documentUid) {
			if (this.isTemplateCreateMode()) {
				analytics.send({
					event: 'proceed_step_document',
					c_element: 'create_button',
					status: 'success'
				});
				analytics.send({
					event: 'turn_on_off_template',
					type: 'auto',
					c_element: 'off',
					p5: `templateId_${this.documentSetup.setupData.templateId}`
				});
			}
		}
		#sendAnalyticsOnSetupError(analytics) {
			if (this.isTemplateCreateMode()) {
				analytics.send({
					event: 'proceed_step_document',
					status: 'error',
					c_element: 'create_button'
				});
			}
		}
		#sendAnalyticsOnCompanyStepSuccess(analytics) {
			if (this.isTemplateCreateMode()) {
				analytics.send({
					event: 'proceed_step_route',
					status: 'success',
					c_element: 'create_button'
				});
			}
		}
		#sendAnalyticsOnCompanyStepError(analytics) {
			if (this.isTemplateCreateMode()) {
				analytics.send({
					event: 'proceed_step_route',
					status: 'error',
					c_element: 'create_button'
				});
			}
		}
		async #sendAnalyticsOnSendStepSuccess(analytics, documentUid) {
			if (this.isDocumentMode()) {
				analytics.sendWithProviderTypeAndDocId({
					event: 'sent_document_to_sign',
					c_element: 'create_button',
					status: 'success'
				}, documentUid);
			}
		}
		async #sendAnalyticsOnSendStepError(analytics, documentUid) {
			if (this.isTemplateCreateMode()) {
				this.getAnalytics().send({
					event: 'click_save_template',
					status: 'error',
					c_element: 'create_button'
				});
			}
			if (this.isDocumentMode()) {
				analytics.sendWithProviderTypeAndDocId({
					event: 'sent_document_to_sign',
					c_element: 'create_button',
					status: 'error'
				}, documentUid);
			}
		}
		#sendAnalyticsOnStart(documentUid) {
			const analytics = this.getAnalytics();
			if (this.isTemplateCreateMode()) {
				analytics.send({
					event: 'open_wizard',
					c_element: 'create_button'
				});
			} else if (this.isDocumentMode()) {
				const context = {
					event: 'click_create_document',
					c_element: 'create_button'
				};
				if (this.isEditMode() && main_core.Type.isStringFilled(documentUid)) {
					analytics.sendWithDocId(context, documentUid);
				} else {
					analytics.send(context);
				}
			}
		}
		async #processSetupData() {
			const setupData = this.getDocumentSetupData();
			this.#companyParty.setInitiatedByType(setupData.initiatedByType);
			this.#companyParty.setEntityId(setupData.entityId);
			if (this.isTemplateMode()) {
				this.#companyParty.reloadCompanyProviders();
			}
			this.editedDocument = null;
			if (this.hasPreviewUrls && !this.documentSetup.isEditorFlowPending) {
				this.wizard.toggleBtnActiveState('next', false);
			}
		}
		async #setDocumentInGroup(setupData) {
			if (this.documentSetup.blankIsNotSelected) {
				return;
			}
			if (!sign_featureStorage.FeatureStorage.isGroupSendingEnabled()) {
				this.setSingleDocument(setupData);
				return;
			}
			if (this.isTemplateMode()) {
				this.setSingleDocument(setupData);
				this.documentSetup.renderDocumentBlock(setupData);
				return;
			}
			this.documentsGroup.set(setupData.uid, setupData);
			this.addInDocumentsGroupUids(setupData.uid);
			this.documentSetup.blankSelector.disableSelectedBlank(setupData.blankId);
			if (!setupData.groupId && !this.editedDocument) {
				await this.#attachGroupToDocument(setupData);
			}
			if (!this.isTemplateMode()) {
				this.documentSetup.documentCounters?.update(this.documentsGroup.size);
			}
			if (!this.editedDocument) {
				this.documentSetup.renderDocumentBlock(setupData);
			}
		}
		#scrollToTop() {
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		}
		#scrollToDown() {
			window.scrollTo({
				top: document.body.scrollHeight,
				behavior: 'smooth'
			});
		}
		#resetDocument() {
			if (this.isTemplateMode() || !sign_featureStorage.FeatureStorage.isGroupSendingEnabled()) {
				return;
			}
			this.documentSetup.resetDocument();
			this.editedDocument = null;
		}
		#disableDocumentSectionIfLimitReached() {
			if (this.documentsGroup.size >= this.#maxDocumentCount) {
				this.documentSetup.setAvailabilityDocumentSection(false);
			}
		}
		getAfterPreviewLayout() {
			if (!this.isDocumentMode() || !sign_featureStorage.FeatureStorage.isMultiDocumentLoadingEnabled()) {
				return null;
			}
			return this.#cache.remember('beforePreviewLayout', () => main_core.Tag.render`
			<button class="ui-btn ui-btn-light-border ui-btn-md" style="margin-top: 20px;" onclick="${() => this.#onBeforePreviewBtnClick()}">
				${main_core.Loc.getMessage('SIGN_SETTINGS_B2E_BEFORE_PREVIEW')}
			</button>
		`);
		}
		#onBeforePreviewBtnClick() {
			// eslint-disable-next-line unicorn/no-this-assignment
			const self = this;
			BX.SidePanel.Instance.open('sign-settings:afterPreviewSidePanel', {
				cacheable: false,
				width: 750,
				contentCallback: () => {
					self.#resetAfterPreviewSidePanel();
					return ui_sidepanel_layout.Layout.createContent({
						extensions: ['ui.forms'],
						title: 'Добавить папку с файлами',
						content() {
							self.#getUploader();
							return self.#getMultiDocumentAddSidePanelContent();
						},
						buttons({
							cancelButton,
							SaveButton
						}) {
							self.#saveButton = new SaveButton({
								onclick: () => self.#onBeforePreviewSaveBtnClick()
							});
							return [self.#saveButton];
						}
					});
				},
				events: {
					onClose: event => {
						if (this.#isMultiDocumentSaveProcessGone) {
							event.denyAction();
						}
						this.#resetAfterPreviewSidePanel();
					}
				}
			});
		}
		#getMultiDocumentAddSidePanelContent() {
			return this.#cache.remember('multiDocumentAddSidePanelContent', () => main_core.Tag.render`
			<div id="multiple-document-add-container" style="display: flex; flex-direction: column;">
				<div style="flex-direction: row;">
					${this.#getUploadFileFromDirButton().root}
					${this.#getUploadFileButton()}
				</div>
			</div>
		`);
		}
		#getUploader() {
			return this.#cache.remember('uploader', () => {
				return new ui_uploader_core.Uploader({
					id: 'sign-settings-uploader',
					controller: 'sign.upload.blankUploadController',
					acceptedFileTypes: [...acceptedUploaderFileTypes.values()].map(a => `.${a}`),
					multiple: true,
					autoUpload: false,
					maxFileSize: 52_428_800,
					imageMaxFileSize: 10_485_760,
					maxTotalFileSize: 52_428_800,
					events: {
						[ui_uploader_core.UploaderEvent.BEFORE_FILES_ADD]: event => this.#onBeforeFilesAdd(event),
						[ui_uploader_core.UploaderEvent.FILE_ADD]: event => this.#onFileAdd(event.getData().file),
						[ui_uploader_core.UploaderEvent.UPLOAD_COMPLETE]: event => this.#onUploadComplete(event)
					}
				});
			});
		}
		#resetAfterPreviewSidePanel() {
			this.#cache.delete('uploader');
			this.#cache.delete('uploadButton');
			this.#cache.delete('uploadFromDirButton');
			this.#cache.delete('multiDocumentAddSidePanelContent');
		}
		#getUploadFileButton() {
			return this.#cache.remember('uploadButton', () => {
				const layout = main_core.Tag.render`
				<div>
					<button class="ui-btn ui-btn-light-border" style="margin-top: 15px;" onclick="${() => layout.fileInput.click()}">${main_core.Loc.getMessage('SIGN_V2_B2E_SIGN_SETTINGS_ADD_FILE')}</button>
					<input ref="fileInput" hidden type="file" multiple ref="fileInput" onchange="${event => {
				this.#onInputFileChange(event);
				event.target.value = '';
			}}"
						accept="${[...acceptedUploaderFileTypes.values()].map(n => `.${n}`).join(', ')}"
					>
				</div>
			`;
				return layout.root;
			});
		}
		#getUploadFileFromDirButton() {
			return this.#cache.remember('uploadFromDirButton', () => {
				const layout = main_core.Tag.render`
				<div>
					<button class="ui-btn ui-btn-primary" style="margin-top: 15px;" onclick="${() => layout.fileInput.click()}">${main_core.Loc.getMessage('SIGN_V2_B2E_SIGN_SETTINGS_LOAD_FROM_DIRS')}</button>
					<input hidden type="file" webkitdirectory multiple ref="fileInput" onchange="${event => {
				this.#onInputFileChange(event);
				event.target.value = '';
			}}">
				</div>
			`;
				return layout;
			});
		}
		#onInputFileChange(event) {
			const target = event.target;
			const files = target.files;
			const validatedFiles = [...files].filter(f => acceptedUploaderFileTypes.has(f.name.split('.').at(-1)));
			this.#getUploader().addFiles(validatedFiles);
		}
		#onFileAdd(file) {
			main_core.Dom.insertAfter(main_core.Tag.render`<p style="color: #666">${main_core.Loc.getMessage('SIGN_V2_B2E_SIGN_SETTINGS_LOADED_FILE_NAME', {
			'#FILENAME#': main_core.Text.encode(file.getName())
		})}</p>`, this.#getUploadFileButton());
		}
		#onBeforePreviewSaveBtnClick() {
			if (this.#getUploader().getFiles().length === 0) {
				alert(main_core.Loc.getMessage('SIGN_V2_B2E_SIGN_SETTINGS_NO_FILES_SELECTED'));
				return;
			}
			main_core.Dom.style(this.#getMultiDocumentAddSidePanelContent(), {
				opacity: 0.6,
				'pointer-events': 'none'
			});
			this.#isMultiDocumentSaveProcessGone = true;
			this.#getUploader().start();
			this.#saveButton.setClocking(true);
		}
		async #onUploadComplete(event) {
			const uploader = this.#getUploader();
			for (const file of uploader.getFiles()) {
				try {
					const blankId = await this.documentSetup.blankSelector.createBlankFromOuterUploaderFiles([file]);
					this.documentSetup.blankSelector.selectBlank(blankId);
					await this.setDocumentsGroup();
				} catch (e) {
					console.error(`Error while add file with name ${file.getName()}`, e);
				}
			}
			main_core.Dom.style(this.#getMultiDocumentAddSidePanelContent(), {
				opacity: 1,
				'pointer-events': 'auto'
			});
			this.#isMultiDocumentSaveProcessGone = false;
			this.#saveButton.setClocking(false);
			BX.SidePanel.Instance.close();
		}
		#onBeforeFilesAdd(event) {
			const uploaderConfig = {
				maxFileSize: 52_428_800,
				imageMaxFileSize: 10_485_760,
				maxTotalFileSize: 52_428_800
			};
			const data = event.getData();
			const files = data.files;
			const uploader = this.#getUploader();
			const allFilesWithNew = [...files, ...uploader.getFiles()];
			if (allFilesWithNew.length + this.documentsGroup.size > this.#maxDocumentCount) {
				alert(main_core.Loc.getMessage('SIGN_V2_B2E_SIGN_SETTINGS_MAX_DOCUMENTS_COUNT_EXCEEDED_NOTICE'));
				event.preventDefault();
				return;
			}
			for (const file of files) {
				if (file.getSize() > uploaderConfig.maxFileSize) {
					alert(main_core.Loc.getMessage('SIGN_V2_B2E_SIGN_SETTINGS_INVALID_FILE_SIZE'));
					event.preventDefault();
					return;
				}
				if (file.isImage() && file.getSize() > uploaderConfig.imageMaxFileSize) {
					alert(main_core.Loc.getMessage('SIGN_V2_B2E_SIGN_SETTINGS_INVALID_IMAGE_FILE_SIZE'));
					event.preventDefault();
					return;
				}
			}
			const totalFileSize = allFilesWithNew.reduce((acc, file) => acc + file.getSize(), 0);
			if (totalFileSize > uploaderConfig.maxTotalFileSize) {
				alert(main_core.Loc.getMessage('SIGN_V2_B2E_SIGN_SETTINGS_MAX_TOTAL_FILE_SIZE_EXCEEDED'));
				event.preventDefault();
			}
		}
		#isIntegrationEnabled(code) {
			return code && code !== sign_type.ProviderCode.sesRu;
		}
		async #executeTemplateSetupPartyActions() {
			const {
				uid
			} = this.documentSetup.setupData;
			const isB2eDocumentSectionDisabled = !this.documentSetup.isRuRegion() || this.#isInitiatedByEmployee();
			this.editor.setIsB2eDocumentSectionDisabled(isB2eDocumentSectionDisabled);
			this.editor.entityData = await this.#setupParties();
			const {
				isTemplate,
				entityId,
				hasPlaceholders
			} = this.documentSetup.setupData;
			const blocks = await this.documentSetup.loadBlocks(uid);
			const editorData = {
				isTemplate,
				uid,
				blocks,
				entityId,
				hasPlaceholders
			};
			this.#executeEditorActions(editorData);
		}
	}

	exports.B2ESignSettings = B2ESignSettings;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Cache, BX.Sign, BX.Sign, BX.Sign.V2, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2, BX.Sign.V2, BX.Sign.V2, BX.UI.SidePanel, BX.UI.Uploader, BX.Sign.V2.B2e);
//# sourceMappingURL=sign-settings.bundle.js.map
