/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_events, main_date, sign_v2_signSettings, sign_v2_b2e_userParty, sign_v2_b2e_reminderSelector, sign_type, main_loader, ui_entitySelector, sign_v2_api, sign_v2_documentSummary, sign_v2_langSelector, sign_v2_datetimeLimitSelector, sign_v2_helper, ui_progressbar, sign_v2_b2e_hcmLinkPartyChecker) {
	'use strict';

	const EntityTypes = Object.freeze({
		User: 'user',
		Company: 'company',
		Role: 'structure-node-role'
	});
	class Item {
		#api;
		#ui = {
			container: HTMLDivElement = null,
			avatar: HTMLDivElement = null,
			title: {
				container: HTMLDivElement = null,
				header: HTMLDivElement = null,
				footer: HTMLDivElement = null
			}
		};
		#dataDialog = null;
		#loader = null;
		#data = null;
		#viewData = null;
		constructor(data) {
			this.#api = new sign_v2_api.Api();
			this.#data = data;
			this.#ui.container = this.getLayout();
			if (main_core.Type.isStringFilled(data?.entityType) && main_core.Type.isInteger(data?.entityId)) {
				this.#load();
			}
		}
		setItemData(data) {
			if (this.#data.entityId === data.entityId && this.#data.entityType === data.entityType) {
				return;
			}
			this.#data = data;
			if (main_core.Type.isStringFilled(data?.entityType) && main_core.Type.isInteger(data?.entityId)) {
				this.#load();
			}
		}
		getLayout() {
			if (this.#ui.container) {
				return this.#ui.container;
			}
			const modifier = this.#data.entityType === EntityTypes.User ? ' --user' : '';
			this.#ui.avatar = main_core.Tag.render`<div class="sign-b2e-send__party_item-info-avatar${modifier}"></div>`;
			this.#ui.title.header = main_core.Tag.render`<div class="sign-b2e-send__party_item-info-header"></div>`;
			this.#ui.title.footer = main_core.Tag.render`<div class="sign-b2e-send__party_item-info-footer"></div>`;
			this.#ui.title.container = main_core.Tag.render`
			<div class="sign-b2e-send__party_item-info-title">
				${this.#ui.title.header}
				${this.#ui.title.footer}
			</div>
		`;
			this.#ui.container = main_core.Tag.render`
			<div class="sign-b2e-send__party_item-info">
				${this.#ui.avatar}
				${this.#ui.title.container}
			</div>
		`;
			return this.#ui.container;
		}
		async #load() {
			this.#showLoader();
			switch (this.#data.entityType) {
				case EntityTypes.Company:
					{
						await this.#loadCompany();
						break;
					}
				case EntityTypes.User:
					{
						await this.#loadUser();
						break;
					}
				case EntityTypes.Role:
					{
						await this.#loadRole();
						break;
					}
			}
			this.#refreshView();
			this.#hideLoader();
		}
		#loadCompany() {
			return this.#api.loadB2eCompanyList().then(data => {
				if (main_core.Type.isObject(data.companies) && main_core.Type.isArray(data.companies)) {
					const company = data.companies.filter(company => company.id === this.#data.entityId)[0] ?? null;
					if (company === null) {
						return;
					}
					const footer = main_core.Type.isBoolean(data?.showTaxId) && data?.showTaxId && company?.rqInn ? main_core.Loc.getMessage('SIGN_DOCUMENT_SUMMARY_COMPANY_INN', {
						'%innValue%': main_core.Text.encode(company?.rqInn)
					}) : null;
					this.#viewData = {
						header: company?.title,
						footer: footer,
						avatar: null
					};
					this.#refreshView();
				}
				this.#hideLoader();
			}).catch(response => {
				console.log(response);
			});
		}
		#loadUser() {
			return new Promise(resolve => {
				this.#dataDialog = new ui_entitySelector.Dialog({
					entities: [{
						id: EntityTypes.User
					}],
					events: {
						'onLoad': event => {
							const user = this.#dataDialog.getSelectedItems()[0] ?? null;
							if (main_core.Type.isObject(user)) {
								const lastName = user?.customData?.get('lastName') ?? '';
								this.#viewData = {
									header: user?.customData?.get('name') + ' ' + lastName,
									footer: user?.customData?.get('position') ?? '',
									avatar: user?.avatar ?? null
								};
								this.#refreshView();
							}
							this.#hideLoader();
							resolve();
						}
					},
					preselectedItems: [[EntityTypes.User, this.#data.entityId]]
				});
				this.#dataDialog.load();
			});
		}
		#loadRole() {
			return new Promise(resolve => {
				this.#dataDialog = new ui_entitySelector.Dialog({
					entities: [{
						id: EntityTypes.Role,
						dynamicLoad: true
					}],
					events: {
						'onLoad': event => {
							const data = this.#dataDialog.getSelectedItems()[0] ?? null;
							if (main_core.Type.isObject(data)) {
								this.#viewData = {
									header: data.title ?? '',
									footer: '',
									avatar: data?.avatar ?? null
								};
								this.#refreshView();
							}
							this.#hideLoader();
							resolve();
						}
					},
					preselectedItems: [[EntityTypes.Role, this.#data.entityId]]
				});
				this.#dataDialog.load();
			});
		}
		#refreshView() {
			if (this.#viewData?.avatar) {
				this.#ui.avatar.style.backgroundImage = `url("${this.#viewData.avatar}")`;
			}
			this.#ui.title.header.innerText = this.#viewData.header;
			this.#ui.title.header.title = this.#viewData.header;
			this.#ui.title.footer.innerText = this.#viewData.footer;
			this.#ui.title.footer.title = this.#viewData.footer;
		}
		#getLoader() {
			if (this.#loader) {
				return this.#loader;
			}
			this.#loader = new BX.Loader({
				target: this.#ui.container,
				mode: 'inline',
				size: 40
			});
			return this.#loader;
		}
		#hideLoader() {
			this.#ui.title.container.style.display = 'flex';
			this.#ui.avatar.style.display = 'block';
			this.#getLoader().hide();
		}
		#showLoader() {
			this.#ui.avatar.style.display = 'none';
			this.#ui.title.container.style.display = 'none';
			this.#getLoader().show(this.#ui.container);
		}
	}

	const ReminderSelectorOptionsByRole = {
		[sign_type.MemberRole.assignee]: {
			preSelectedType: sign_type.Reminder.oncePerDay
		},
		[sign_type.MemberRole.signer]: {
			preSelectedType: sign_type.Reminder.twicePerDay
		}
	};
	const idleCommunication = 'idle';
	class DocumentSend extends main_core_events.EventEmitter {
		events = Object.freeze({
			onTemplateComplete: 'onTemplateComplete'
		});
		#ui = {
			container: HTMLDivElement = null,
			employeesTitle: HTMLParagraphElement
		};
		#communicationSelectedOption = {
			company: {
				id: 'company',
				option: idleCommunication
			},
			employee: {
				id: 'employee',
				option: idleCommunication
			},
			validation: {
				id: 'validation',
				option: idleCommunication
			}
		};
		#items = {
			company: Item,
			representative: Item,
			employees: sign_v2_b2e_userParty.UserParty,
			reviewers: sign_v2_b2e_userParty.UserParty,
			editor: Item
		};
		#partiesData = null;
		#documentSummary;
		#documentData;
		#langSelector;
		#dateTimeLimitSelector = null;
		#progress;
		#progressOverlay;
		#progressContainer;
		#itemsToHide = [];
		#reminderSelectorByRole = {};
		#documentMode;
		#isExistingTemplate = false;
		#isOpenedFromRobot = false;
		#templateFolderId = 0;
		#analytics;
		#hcmLinkPartyChecker = null;
		#provider = null;
		constructor(documentSendConfig) {
			super();
			this.setEventNamespace('BX.Sign.V2.B2e.DocumentSend');
			this.#items.company = new Item({
				entityType: EntityTypes.Company
			});
			this.#items.representative = new Item({
				entityType: EntityTypes.User
			});
			this.#items.editor = new Item({
				entityType: EntityTypes.User
			});
			this.#items.employees = new sign_v2_b2e_userParty.UserParty({
				mode: 'view',
				role: sign_type.MemberRole.signer
			});
			this.#items.reviewers = new sign_v2_b2e_userParty.UserParty({
				mode: 'view',
				role: sign_type.MemberRole.reviewer
			});
			this.#documentSummary = new sign_v2_documentSummary.DocumentSummary({
				events: {
					changeTitle: event => {
						const data = event.getData();
						this.emit('changeTitle', data);
					},
					showEditor: event => {
						const data = event.getData();
						this.emit('showEditor', data);
					},
					showPlaceholderEditor: event => {
						this.emit('showPlaceholderEditor', event.getData());
					}
				}
			});
			const {
				region,
				languages,
				documentMode,
				isOpenedFromRobot,
				analytics,
				templateFolderId
			} = documentSendConfig;
			this.#isOpenedFromRobot = isOpenedFromRobot;
			this.#langSelector = new sign_v2_langSelector.LangSelector(region, languages);
			this.#documentData = {};
			this.#analytics = analytics;
			this.#documentMode = documentMode;
			this.#templateFolderId = templateFolderId;
			this.#ui.employeesTitle = main_core.Tag.render`
			<p class="sign-b2e-send__party_signing-employees">
				${main_core.Loc.getMessage('SIGN_SEND_SIGNING_EMPLOYEES', {
			'#CNT#': 0
		})}
			</p>
		`;
			this.#progress = new ui_progressbar.ProgressBar({
				maxValue: 100,
				value: 0,
				colorTrack: '#dfe3e6'
			});
			[sign_type.MemberRole.assignee, sign_type.MemberRole.signer].forEach(role => {
				this.#getOrCreateReminderSelectorForRole(role);
			});
			if (!this.#isTemplateMode()) {
				this.#hcmLinkPartyChecker = new sign_v2_b2e_hcmLinkPartyChecker.HcmLinkPartyChecker({
					api: new sign_v2_api.Api()
				});
				this.#hcmLinkPartyChecker.subscribe('updateValidation', event => this.#onHcmLinkCheckerUpdateValidation(event));
			}
			if (!this.#isTemplateMode()) {
				this.#dateTimeLimitSelector = new sign_v2_datetimeLimitSelector.DatetimeLimitSelector();
				this.#dateTimeLimitSelector.subscribe('beforeDateModify', () => {
					this.emit('disableComplete');
				}).subscribe('afterDateModify', () => {
					this.emit('enableComplete');
				});
			}
		}
		get documentData() {
			return this.#documentData;
		}
		set hcmLinkEnabled(value) {
			this.#hcmLinkPartyChecker?.setEnabled(value);
		}
		set documentData(documentData) {
			documentData.forEach(data => {
				const {
					uid,
					id,
					title,
					blocks,
					externalId,
					isTemplate,
					entityId,
					urls,
					hasPlaceholders
				} = data;
				this.#documentSummary.addItem(uid, {
					uid,
					id,
					title,
					blocks,
					externalId,
					isTemplate,
					entityId,
					urls,
					hasPlaceholders
				});
			});
			this.#documentData = documentData;
			const uids = [...documentData.values()].map(data => data.uid);
			const lastUid = [...documentData.values()].pop().uid;
			const documentGroupUids = [...documentData.keys()];
			this.#langSelector.setDocumentUids(uids);
			if (!main_core.Type.isNull(this.#dateTimeLimitSelector)) {
				this.#dateTimeLimitSelector.setDocumentUids(uids);
				const untilDate = documentData?.values().next().value?.dateSignUntilUserTime;
				if (untilDate) {
					this.#dateTimeLimitSelector.setDate(new Date(untilDate));
				}
			}
			this.#items.employees.setDocumentUid(lastUid);
			this.#items.reviewers.setDocumentUid(lastUid);
			this.#hcmLinkPartyChecker?.setDocumentGroupUids(documentGroupUids);
			void this.#hcmLinkPartyChecker?.check();
		}
		#getProgressAnimateLayout() {
			const createDocumentOverlapLayout = docsCount => {
				return main_core.Tag.render`
				<div class="sign-b2e-overlay__overlap-docs">
					${Array.from({
				length: docsCount
			}).map(() => {
				return main_core.Tag.render`
							<div class="sign-b2e-overlay__overlap-doc"></div>
						`;
			})}
				</div>
			`;
			};
			return main_core.Tag.render`
			<div class="sign-b2e-overlay__animate-layout">
				${createDocumentOverlapLayout(4)}
				${createDocumentOverlapLayout(3)}
			</div>
		`;
		}
		getLayout() {
			const layout = main_core.Tag.render`
			<div class="sign-b2e-send">
				<h1 class="sign-b2e-settings__header">${main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_HEADER_1')}</h1>
			</div>
		`;
			const summaryTitle = this.#isTemplateMode() ? main_core.Loc.getMessage('SIGN_DOCUMENT_SUMMARY_TEMPLATE_TITLE') : main_core.Loc.getMessage('SIGN_DOCUMENT_SUMMARY_TITLE');
			this.#itemsToHide = [];
			const summaryLayout = main_core.Tag.render`
			<div class="sign-b2e-settings__item">
				<p class="sign-b2e-settings__item_title">
					${summaryTitle}
				</p>
				${this.#documentSummary.getLayout()}
				${this.#renderLangAndDateContainer()}
			</div>
		`;
			this.#itemsToHide.push(summaryLayout);
			let usersLayout = null;
			if (!this.#isTemplateMode()) {
				usersLayout = main_core.Tag.render`
				<div class="sign-b2e-settings__item">
					<p class="sign-b2e-settings__item_title">
						${main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_SECOND_PARTY')}
					</p>
					${this.#ui.employeesTitle}
					${this.#items.employees.getLayout()}
					<div class="sign-b2e-send__config-container">
						${this.#getCommunicationsLayout('employee')}
						${this.#getReminderSelectorLayout(sign_type.MemberRole.signer)}
					</div>
					${this.#hcmLinkPartyChecker.render()}
				</div>
			`;
				this.#itemsToHide.push(usersLayout);
			}
			const itemTitleText = this.#isTemplateMode() ? main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_FIRST_PARTY_TEMPLATE') : main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_FIRST_PARTY');
			const companyLayout = main_core.Tag.render`
			<div class="sign-b2e-settings__item">
				<p class="sign-b2e-settings__item_title">
					${itemTitleText}
				</p>
				<div class="sign-b2e-send__company-items">
					<div class="sign-b2e-send__company-items_flex">
						<p class="sign-b2e-send__company-items_item-title">
							${main_core.Loc.getMessage('SIGN_SEND_SIGNING_COMPANY')}
						</p>
						<span class="sign-b2e-send__company-items_shrunk"></span>
						<p class="sign-b2e-send__company-items_item-title">
							${main_core.Loc.getMessage('SIGN_SEND_SIGNING_REPRESENTATIVE')}
						</p>
					</div>
					<div class="sign-b2e-send__company-items_flex">
						${this.#items.company.getLayout()}
						<span class="sign-b2e-send__company-items_shrunk sign-b2e-send__party-item-separator">
							&#43;
						</span>
						${this.#items.representative.getLayout()}
					</div>
				</div>
				<div class="sign-b2e-send__config-container">
					${this.#getCommunicationsLayout('company')}
					${this.#getReminderSelectorLayout(sign_type.MemberRole.assignee)}
				</div>
			</div>
		`;
			this.#itemsToHide.push(companyLayout);
			main_core.Dom.append(summaryLayout, layout);
			const reviewerHeaderText = this.#isTemplateMode() ? main_core.Loc.getMessage('SIGN_SEND_SIGNING_VALIDATION_HEAD_REVIEWER_TEMPLATE') : main_core.Loc.getMessage('SIGN_SEND_SIGNING_VALIDATION_HEAD_REVIEWER');
			const validationTitles = {
				[sign_type.MemberRole.editor]: {
					header: main_core.Loc.getMessage('SIGN_SEND_SIGNING_VALIDATION_HEAD_EDITOR'),
					hint: main_core.Loc.getMessage('SIGN_SEND_SIGNING_VALIDATION_TITLE_EDITOR')
				}
			};
			this.#partiesData.validation.forEach(({
				role
			}) => {
				if (role === sign_type.MemberRole.reviewer) {
					return;
				}
				const roleBlockLayout = this.#items[role].getLayout();
				if (!roleBlockLayout) {
					return;
				}
				const {
					hint,
					header
				} = validationTitles[role];
				const validationLayout = this.#getPartyLayout(header, hint, roleBlockLayout);
				this.#itemsToHide.push(validationLayout);
				main_core.Dom.append(validationLayout, layout);
			});
			if (this.#items.reviewers.getPreselectedUserData().length > 0) {
				const reviewerListLayout = main_core.Tag.render`
				<div class="sign-b2e-document-send-reviewers">
					${this.#items.reviewers.getLayout()}
				</div>
			`;
				const reviewersLayout = this.#getPartyLayout(reviewerHeaderText, main_core.Loc.getMessage('SIGN_SEND_SIGNING_VALIDATION_TITLE_REVIEWER_MSGVER_1'), reviewerListLayout);
				this.#itemsToHide.push(reviewersLayout);
				main_core.Dom.append(reviewersLayout, layout);
			}
			main_core.Dom.append(companyLayout, layout);
			if (!main_core.Type.isNull(usersLayout)) {
				main_core.Dom.append(usersLayout, layout);
			}
			this.#progressContainer = main_core.Tag.render`<div class="send-b2e-progress-container"></div>`;
			this.#progress.renderTo(this.#progressContainer);
			this.#progressOverlay = this.#isTemplateMode() ? this.#getTemplateProgressOverlay() : this.#getProgressOverlay();
			main_core.Dom.style(this.#progressOverlay, 'display', 'none');
			this.emit('appendOverlay', {
				overlay: this.#progressOverlay
			});
			sign_v2_helper.Hint.create(layout);
			return layout;
		}
		#getPartyLayout(header, hint, layout) {
			return main_core.Tag.render`
			<div class="sign-b2e-settings__item">
				<p class="sign-b2e-settings__item_title">
					${header}
				</p>
				<div class="sign-b2e-send__party_item">
					<p class="sign-b2e-send__company-items_item-title">
						${hint}
					</p>
					${layout}
					${this.#getCommunicationsLayout('validation')}
				</div>
			</div>
		`;
		}
		#renderLangAndDateContainer() {
			const showSignUntil = !main_core.Type.isNull(this.#dateTimeLimitSelector);
			const dateSignUntilLayout = showSignUntil ? this.#renderDateSignUntilSelectorLayout() : null;
			const goskeySignUntilNotice = showSignUntil && this.#provider?.code === sign_type.ProviderCode.goskey ? this.#renderGoskeyAlertForSignUntilSelector() : null;
			return main_core.Tag.render`
			<div class="sign-b2e-send__lang-dt-container">
				${this.#renderLangSelectorLayout()}
				${dateSignUntilLayout}
				${goskeySignUntilNotice}
			</div>
		`;
		}
		#renderLangSelectorLayout() {
			return main_core.Tag.render`
			<div class="sign-b2e-send__lang-selector">
				${this.#langSelector.getLayout()}
				<span
					data-hint="${main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_LANG_SELECTOR_HINT')}"
				></span>
			</div>
		`;
		}
		#renderDateSignUntilSelectorLayout() {
			return main_core.Tag.render`
			<div class="sign-b2e-send__datetime-limit-selector">
				${this.#dateTimeLimitSelector.getLayout()}
				<span
					data-hint="${main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_DATETIME_LIMIT_SELECTOR_HINT')}"
				></span>
			</div>
		`;
		}
		#renderGoskeyAlertForSignUntilSelector() {
			return main_core.Tag.render`
			<p class="sign-wizard__notice">
				${main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_DATETIME_LIMIT_SELECTOR_GOSKEY_ALERT')}
			</p>
		`;
		}
		#getProgressOverlay() {
			const closeDescriptionText = main_core.Loc.getMessage('SIGN_SEND_CLOSE_DESCRIPTION');
			return main_core.Tag.render`
			<div class="send-b2e-overlay">
				<div class="sign-b2e-overlay-content">
					${this.#getProgressAnimateLayout()}
					<div class="sign-b2e-overlay-progress-title">
						${main_core.Loc.getMessage('SIGN_SEND_PROGRESS_TITLE')}
					</div>
					<div class="sign-b2e-overlay-close-description">
						${closeDescriptionText}
					</div>
					<div>
						${this.#getCloseBtn()}
					</div>
				</div>
				${this.#progressContainer}
			</div>
		`;
		}
		#getTemplateProgressOverlay() {
			const templateTitle = this.#isExistingTemplate ? main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATE_CHANGED') : main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATE_CREATED');
			return main_core.Tag.render`
			<div class="sign-b2e-template-status">
				<div class="sign-b2e-template-status-inner">
					<div class="sign-b2e-template-status-img"></div>
					<div class="sign-b2e-template-status-title">${templateTitle}</div>
					<div class="sign-b2e-template-status-info">${main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATE_CREATED_INFO')}</div>
					${this.#getAllTemplatesBtn()}
					</div>
			 </div>
		`;
		}
		setExistingTemplate() {
			this.#isExistingTemplate = true;
		}
		#getCloseBtn() {
			return main_core.Tag.render`
			<button
				class="ui-btn ui-btn-light-border ui-btn-round"
				onclick="${() => this.emit('close')}">
				${main_core.Loc.getMessage('SIGN_SEND_CLOSE_BTN')}
			</button>
		`;
		}
		#getAllTemplatesBtn() {
			if (this.#isOpenedFromRobot) {
				return null;
			}
			return main_core.Tag.render`
			<button class="ui-btn ui-btn-light-border ui-btn-round" onclick="BX.SidePanel.Instance.close();">
				${main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_LIST')}
			</button>
		`;
		}
		resetUserPartyPopup() {
			this.#items.employees.resetUserPartyPopup();
			this.#items.reviewers.resetUserPartyPopup();
			return this;
		}
		setProvider(provider) {
			this.#provider = provider;
			return this;
		}
		setPartiesData(parties) {
			this.#partiesData = parties;
			if (main_core.Type.isNumber(parties?.company?.entityId)) {
				this.#items.company.setItemData({
					entityId: parties?.company?.entityId,
					entityType: parties?.company?.entityType
				});
			}
			if (main_core.Type.isNumber(parties?.representative?.entityId)) {
				this.#items.representative.setItemData({
					entityId: parties?.representative?.entityId,
					entityType: parties?.representative?.entityType
				});
			}
			if (main_core.Type.isArrayFilled(parties?.employees)) {
				this.#items.employees.setUserIds(parties?.employees.map(employee => {
					return {
						entityId: employee.entityId,
						entityType: employee.entityType
					};
				}));
			}
			if (main_core.Type.isArrayFilled(parties?.validation)) {
				const reviewerIdList = [];
				parties.validation.forEach(party => {
					const {
						entityId,
						entityType,
						role
					} = party;
					if (role === sign_type.MemberRole.reviewer) {
						reviewerIdList.push({
							entityId,
							entityType
						});
						return;
					}
					this.#items[role].setItemData({
						entityId,
						entityType
					});
				});
				if (reviewerIdList.length > 0) {
					this.#items.reviewers.setUserIds(reviewerIdList);
				}
			}
			this.#refreshView();
			return this;
		}
		async sendForSign() {
			const api = new sign_v2_api.Api();
			try {
				this.emit('disableBack');
				await this.#saveReminderTypesForRoles();
				if (this.#dateTimeLimitSelector) {
					await this.#dateTimeLimitSelector.saveSelectedDateForUids();
				}
				this.#showProgressOverlay();
				if (this.#isTemplateMode()) {
					const documentTemplateId = this.documentData.values().next().value.templateUid;
					const {
						template: {
							id: templateId
						}
					} = await api.template.completeTemplate(documentTemplateId, this.#templateFolderId);
					this.emit('onTemplateComplete', {
						templateId,
						templateUid: documentTemplateId
					});
				} else if (this.#isGroupDocuments()) {
					const groupId = this.#getGroupIdFromGroup();
					const configureDocumentGroupPromise = api.configureDocumentGroup(groupId);
					const groupCheckFillAndStartProgressPromise = this.#groupCheckFillAndStartProgress(groupId);
					await Promise.all([configureDocumentGroupPromise, groupCheckFillAndStartProgressPromise]);
				} else {
					for (const [uid] of this.documentData) {
						const configureDocumentPromise = api.configureDocument(uid);
						const checkFillAndStartProgressPromise = this.#checkFillAndStartProgress(uid);
						await Promise.all([configureDocumentPromise, checkFillAndStartProgressPromise]);
					}
				}
				return true;
			} catch (ex) {
				console.error(ex);
				this.#hideProgressOverlay();
				this.emit('enableBack');
				return false;
			}
		}
		deleteDocument(uid) {
			this.#documentSummary.deleteItem(uid);
		}
		setDocumentsBlock(documents) {
			const documentsObject = Object.fromEntries(documents);
			this.#documentSummary.setItems(documentsObject);
		}
		async #checkFillAndStartProgress(uid) {
			const api = new sign_v2_api.Api();
			let completed = false;
			while (!completed) {
				// eslint-disable-next-line no-await-in-loop
				const result = await api.getDocumentFillAndStartProgress(uid);
				completed = result.completed;
				this.#progress.update(Math.round(result.progress));
				// eslint-disable-next-line no-await-in-loop
				await this.#sleep(1000);
			}
		}
		async #groupCheckFillAndStartProgress(groupId) {
			const api = new sign_v2_api.Api();
			let completed = false;
			while (!completed) {
				// eslint-disable-next-line no-await-in-loop
				const result = await api.getDocumentGroupFillAndStartProgress(groupId);
				completed = result.completed;
				this.#progress.update(Math.round(result.progress));
				// eslint-disable-next-line no-await-in-loop
				await this.#sleep(2000);
			}
		}
		isDateTimeLimitSelectorValid() {
			return this.#dateTimeLimitSelector ? this.#dateTimeLimitSelector.isValid() : true;
		}
		#sleep(ms) {
			return new Promise(resolve => {
				setTimeout(resolve, ms);
			});
		}
		#refreshView() {
			this.#ui.employeesTitle.innerText = main_core.Loc.getMessage('SIGN_SEND_SIGNING_EMPLOYEES', {
				'#CNT#': this.#partiesData?.employees?.length ?? 0
			});
		}
		#getCommunicationsLayout(communicationChannelId) {
			return main_core.Tag.render`
			<div class="sign-b2e-send__communications">
				<span class="sign-b2e-send__communications_title">
					${main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_COMMUNICATION_TITLE_MSGVER_1')}
				</span>
				<div class="sign-b2e-send__communications_communication-type">
					<span class="sign-b2e-send__communications_communication-type-text">
						${main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_COMMUNICATION_CHANEL_IDLE')}
					</span>
					<span
						data-hint="${main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_COMMUNICATION_CHANEL_HINT')}"
					></span>
				</div>
			</div>
		`;
		}
		#showProgressOverlay() {
			this.#progress.update(0);
			this.emit('hidePreview');
			this.#itemsToHide.forEach(item => main_core.Dom.hide(item));
			main_core.Dom.style(this.#progressOverlay, 'display', 'flex');
			this.emit('showOverlay');
		}
		#hideProgressOverlay() {
			this.#itemsToHide.forEach(item => main_core.Dom.show(item));
			this.emit('hideOverlay');
			main_core.Dom.style(this.#progressOverlay, 'display', 'none');
			this.emit('showPreview');
		}
		#getReminderSelectorLayout(role) {
			return main_core.Tag.render`
			<div class="sign-b2e-send__reminder-selector">
				${this.#getOrCreateReminderSelectorForRole(role).getLayout()}
				<span
					data-hint="${main_core.Loc.getMessage('SIGN_DOCUMENT_SEND_REMINDER_TYPE_SELECTOR_HINT')}"
				></span>
			</div>
		`;
		}
		#getOrCreateReminderSelectorForRole(role) {
			this.#reminderSelectorByRole[role] ??= new sign_v2_b2e_reminderSelector.ReminderSelector(ReminderSelectorOptionsByRole[role] ?? {});
			return this.#reminderSelectorByRole[role];
		}
		#saveReminderTypesForRoles() {
			const uid = this.#getFirstDocumentUidFromGroup();
			const promises = Object.entries(this.#reminderSelectorByRole).map(([role, selector]) => selector.save(uid, role));
			return Promise.all(promises);
		}
		#getFirstDocumentUidFromGroup() {
			return this.documentData.keys().next().value;
		}
		#isTemplateMode() {
			return sign_v2_signSettings.isTemplateMode(this.#documentMode);
		}
		#isGroupDocuments() {
			return this.documentData.size > 1;
		}
		#getGroupIdFromGroup() {
			return this.documentData.values().next().value.groupId;
		}
		#onHcmLinkCheckerUpdateValidation(event) {
			const enableComplete = event?.data ?? false;
			this.emit(enableComplete ? 'enableComplete' : 'disableComplete');
		}
	}

	exports.DocumentSend = DocumentSend;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Event, BX.Main, BX.Sign.V2, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign, BX, BX.UI.EntitySelector, BX.Sign.V2, BX.Sign.V2, BX.Sign.V2, BX.Sign.V2, BX.Sign.V2, BX.UI, BX.Sign.V2.B2e);
//# sourceMappingURL=document-send.bundle.js.map
