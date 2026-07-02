/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_integration_analytics, main_core, main_core_events, main_popup, ui_entityCatalog, crm_autorun, ui_notification) {
	'use strict';

	async function fetchTemplates(entityTypeId, entityCategoryId) {
		const resp = await BX.ajax.runAction('crm.activity.sms.getTemplates', {
			data: {
				senderId: DEFAULT_PROVIDER,
				context: {
					module: 'crm',
					entityTypeId,
					entityCategoryId,
					entityId: null
				}
			}
		});
		return resp.data.templates;
	}
	async function fetchSmsProvidersConfig() {
		const resp = await main_core.ajax.runAction('crm.api.messagesender.providersConfig', {
			data: {
				providerName: DEFAULT_PROVIDER
			}
		});
		return resp.data || [];
	}

	/**
	 * Currently only 'ednaru' provider is supported. To extend must implement select provider logic
	 */
	class SettingsCreator {
		#instance = null;
		#currentFromNumberId = null;
		#rawProviders = [];
		constructor(currentFromNumber) {
			this.#currentFromNumberId = currentFromNumber;
		}
		async create() {
			this.#rawProviders = await fetchSmsProvidersConfig();
			if (this.#currentFromNumberId === null) {
				this.#currentFromNumberId = this.#getEdnaProviderFromRaw(this.#rawProviders).fromList[0].id;
			}
			const menuId = 'crm-whatsapp-channels-settings-menu';
			this.#instance = main_popup.MenuManager.create({
				id: menuId,
				bindElement: document.querySelector('.bx-crm-group-actions-messages-settings-icon'),
				items: [{
					delimiter: true,
					text: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_SETTINGS')
				}, {
					id: 'channelSubmenu',
					text: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_SENDER_SELECTOR'),
					items: this.#createProvidersMenu(this.#rawProviders)
				}, {
					id: 'phoneSubmenu',
					text: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_NUMBER_SELECTOR'),
					items: this.#createFromNumberMenus(this.#getEdnaProviderFromRaw(this.#rawProviders).fromList, this.#currentFromNumberId)
				}]
			});
			return this.#instance;
		}
		#getEdnaProviderFromRaw(rawProviders) {
			if (this.#rawProviders.length !== 1 && rawProviders[0].id !== DEFAULT_PROVIDER) {
				throw new Error(`Currently only ${DEFAULT_PROVIDER} is supported.`);
			}
			return this.#rawProviders[0];
		}
		#createProvidersMenu(providers) {
			const ednaProvider = this.#getEdnaProviderFromRaw(providers);
			return [{
				id: ednaProvider.id,
				title: ednaProvider.name,
				text: ednaProvider.name,
				disabled: true,
				className: 'menu-popup-item-accept'
			}];
		}
		#createFromNumberMenus(fromList, currentFromNumber) {
			return fromList.map(fromNumber => {
				const className = fromNumber.id === currentFromNumber ? 'menu-popup-item-accept' : 'menu-popup-item-none';
				return {
					id: fromNumber.id,
					title: fromNumber.name,
					text: fromNumber.name,
					onclick: this.#onFromNumbersChange.bind(this),
					className
				};
			});
		}
		#onFromNumbersChange(event, fromMenu) {
			const selectedChannelPhone = fromMenu.id;
			BX.Event.EventEmitter.emit('BX.Crm.GroupActionsWhatsApp.FromPhoneSelected', {
				phone: selectedChannelPhone
			});
			this.#instance.close();
		}
	}

	let editorInstance = null;
	function createOrUpdatePlaceholder(templateId, entityTypeId, entityCategoryId, params) {
		const {
			id,
			value,
			entityType,
			text
		} = params;
		main_core.ajax.runAction('crm.activity.smsplaceholder.createOrUpdatePlaceholder', {
			data: {
				placeholderId: id,
				fieldName: main_core.Type.isStringFilled(value) ? value : null,
				entityType: main_core.Type.isStringFilled(entityType) ? entityType : null,
				fieldValue: main_core.Type.isStringFilled(text) ? text : null,
				templateId,
				entityTypeId,
				entityCategoryId
			}
		});
	}
	const SmsEditorWrapper = {
		name: 'SmsEditorWrapper',
		props: {
			templateParam: Object,
			title: String,
			entityTypeId: Number,
			categoryId: Number
		},
		data() {
			return {
				counter: 0,
				editorInstance: null,
				messages: {
					send: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_POPUP_SEND')
				}
			};
		},
		methods: {
			onSend() {
				if (!editorInstance) {
					console.error('SmsEditorWrapper: editorInstance is null');
					return;
				}
				let text = '';
				if (editorInstance) {
					const tplEditorData = editorInstance.getData();
					if (main_core.Type.isPlainObject(tplEditorData)) {
						text = tplEditorData.body;
					}
				}
				if (text === '') {
					text = this.templateParam.PREVIEW;
				}
				const templateId = this.templateParam.ID;
				const originalTemplateId = this.templateParam.ORIGINAL_ID;
				main_core_events.EventEmitter.emit('BX.Crm.SmsEditorWrapperOnSend:click', {
					text,
					templateId,
					originalTemplateId
				});
			}
		},
		mounted() {
			const editorParams = {
				target: this.$refs.editorContainerEl,
				categoryId: this.categoryId,
				entityId: 0,
				entityTypeId: this.entityTypeId,
				onSelect: params => {
					// this callback is called when templates placeholder is changed
					createOrUpdatePlaceholder(this.templateParam.ORIGINAL_ID, this.entityTypeId, this.categoryId, {
						id: params.id,
						value: params.value,
						entityType: params.entityType,
						text: params.text
					});
				}
			};
			const preview = this.templateParam.PREVIEW;
			const placeholders = this.templateParam.PLACEHOLDERS || {};
			const filledPlaceholders = this.templateParam.FILLED_PLACEHOLDERS || [];
			editorInstance = new BX.Crm.Template.Editor(editorParams).setPlaceholders(placeholders).setFilledPlaceholders(filledPlaceholders);
			editorInstance.setBody(preview);
		},
		unmounted() {
			editorInstance = null;
		},
		template: `
		<div class="bx-crm-group-actions-messages__item">
			<div class="bx-crm-group-actions-messages__item-title">{{ title }}</div>
			<div class="bx-crm-group-actions-messages__editor" ref="editorContainerEl"></div>

			<button
				@click="onSend"
				class="ui-btn ui-btn-primary ui-btn-md bx-crm-group-actions-messages__button"
			>{{ messages.send }}</button>
		</div>
	`
	};

	class TemplateCatalogCreator {
		#messages = {
			startConversation: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_POPUP_START'),
			sendFirst: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_POPUP_FIRST'),
			howItWork: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_POPUP_HOW'),
			learnCompliance: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_POPUP_COMPLIANCE'),
			learnMore: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_POPUP_MORE')
		};
		#entityTypeId;
		async create(entityTypeId, categoryId) {
			this.#entityTypeId = entityTypeId;
			const rawTemplates = await fetchTemplates(entityTypeId, categoryId);
			const itemsData = this.#getTemplateItems(entityTypeId, categoryId, rawTemplates);
			const itemSlot = this.#itemSlot();
			return new ui_entityCatalog.EntityCatalog({
				canDeselectGroups: false,
				showEmptyGroups: false,
				customComponents: {
					SmsEditorWrapper
				},
				slots: {
					[ui_entityCatalog.EntityCatalog.SLOT_MAIN_CONTENT_ITEM]: itemSlot,
					[ui_entityCatalog.EntityCatalog.SLOT_MAIN_CONTENT_HEADER]: this.#catalogHeader(),
					[ui_entityCatalog.EntityCatalog.SLOT_MAIN_CONTENT_FOOTER]: this.#catalogFooter()
				},
				groups: itemsData.groups,
				items: itemsData.templateItems,
				title: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_POPUP_TITLE'),
				popupOptions: {
					overlay: true,
					events: {
						onPopupClose: () => {
							this.#submitAnalytics();
						}
					}
				}
			});
		}
		#itemSlot() {
			return `
			<div>
				<SmsEditorWrapper  
					:templateParam="itemSlotProps.itemData.customData"
					:title="itemSlotProps.itemData.title" 
					:entityTypeId="itemSlotProps.itemData.entityTypeId"
					:categoryId="itemSlotProps.itemData.categoryId"
				/>
			</div>
		`;
		}
		#getTemplateItems(entityTypeId, categoryId, templates) {
			const groups = templates.map(template => {
				return {
					id: template.ID,
					name: template.TITLE
				};
			});
			if (groups.length > 0) {
				groups[0].selected = true;
			}
			const templateItems = templates.map(template => {
				return {
					id: template.ORIGINAL_ID,
					title: template.TITLE,
					entityTypeId,
					categoryId,
					groupIds: [template.ID],
					customData: {
						title: template.TITLE,
						FILLED_PLACEHOLDERS: template.FILLED_PLACEHOLDERS || [],
						...template
					}
				};
			});
			return {
				groups,
				templateItems
			};
		}
		#catalogHeader() {
			return `
			<div class="bx-crm-group-actions-messages-tpl-header">
				<div class="bx-crm-group-actions-messages-tpl-header-left">
					<div class="bx-crm-group-actions-messages-whatsapp-icon"></div>
				</div>
				<div class="bx-crm-group-actions-messages-tpl-header-center">
					<strong 
						class="bx-crm-group-actions-messages-tpl-header-center-title"
					>${this.#messages.startConversation}</strong><br>
					<span class="bx-crm-group-actions-messages-tpl-header_gray">${this.#messages.sendFirst}</span><br>
					<a 
							href="#" 
							onclick="BX.Event.EventEmitter.emit('BX.Crm.GroupActionsWhatsApp.Settings:help', { code: 20526810});"
						>${this.#messages.howItWork}</a>
				</div>
				<div class="bx-crm-group-actions-messages-tpl-header-right">
					<div 
						class="bx-crm-group-actions-messages-settings-icon"
						onclick="BX.Event.EventEmitter.emit('BX.Crm.GroupActionsWhatsApp.Settings:click');"
					></div>
				</div>
			</div>
		`;
		}
		#catalogFooter() {
			return `
			<div class="bx-crm-group-actions-messages-compliance">
				${this.#messages.learnCompliance}
			</div>
		`;
		}
		#submitAnalytics() {
			const analyticsData = crm_integration_analytics.Builder.Communication.FormEvent.createDefault(this.#entityTypeId).setEvent(crm_integration_analytics.Dictionary.EVENT_WA_POPUP).setSubSection(crm_integration_analytics.Dictionary.SUB_SECTION_LIST).setElement(crm_integration_analytics.Dictionary.ELEMENT_WA_POPUP_CLOSE).buildData();
			BX.UI.Analytics.sendData(analyticsData);
		}
	}

	const DEFAULT_PROVIDER = 'ednaru';
	const SELECTED_FROM_NUMBER_LOCALSTORE_KEY = 'bx.crm.group_actions.messages.selected_from_number';
	class Messages {
		static #instance = null;
		#options;
		#progressBarRepo;
		#catalog;
		#settingsMenu = null;
		#selectedFromNumber = null;
		#messages = {
			inProgress: main_core.Loc.getMessage('CRM_GROUP_ACTIONS_WHATSAPP_MESSAGE_IN_PROGRESS')
		};
		#isHelpShown = false;
		static getInstance(progressBarRepo, options) {
			if (Messages.#instance) {
				Messages.#instance.setOptions(options);
			} else {
				Messages.#instance = new Messages(progressBarRepo, options);
			}
			return Messages.#instance;
		}
		constructor(progressBarRepo, options) {
			this.#progressBarRepo = progressBarRepo;
			this.#options = options;
			this.#selectedFromNumber = this.#restoreLastSelectedFromNumber();
		}
		setOptions(options) {
			this.#options = options;
		}
		async execute() {
			main_core_events.EventEmitter.subscribeOnce('BX.Crm.SmsEditorWrapperOnSend:click', this.#sendMessages.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.GroupActionsWhatsApp.FromPhoneSelected', this.#fromPhoneSelected.bind(this));
			this.#showGridLoader();
			this.#catalog = await new TemplateCatalogCreator().create(this.#options.entityTypeId, this.#options.categoryId);
			this.#hideGridLoader();
			this.#catalog.show();
			const popup = this.#catalog.getPopup();
			popup.subscribeOnce('onClose', this.#destroy.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.GroupActionsWhatsApp.Settings:click', this.#showSettingsMenu.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.GroupActionsWhatsApp.Settings:help', this.#showHelpArticle.bind(this));
		}
		async #showSettingsMenu(event) {
			if (this.#settingsMenu !== null) {
				this.#settingsMenu.close();
				this.#settingsMenu.destroy();
				this.#settingsMenu = null;
			}
			this.#settingsMenu = await new SettingsCreator(this.#selectedFromNumber).create();
			this.#settingsMenu.show();
		}
		#showHelpArticle(event) {
			const articleCode = event.getData().code;
			if (!articleCode) {
				throw new Error('articleCode is not defined');
			}
			const Helper = main_core.Reflection.getClass('top.BX.Helper');
			if (Helper) {
				Helper.show(`redirect=detail&code=${articleCode}`);
			}
			this.#submitAnalytics('showHelp');
		}
		#destroy() {
			main_core_events.EventEmitter.unsubscribeAll('BX.Crm.SmsEditorWrapperOnSend:click');
			main_core_events.EventEmitter.unsubscribeAll('BX.Crm.GroupActionsWhatsApp.Settings:click');
			main_core_events.EventEmitter.unsubscribeAll('BX.Crm.GroupActionsWhatsApp.Settings:help');
			main_core_events.EventEmitter.unsubscribeAll('BX.Crm.GroupActionsWhatsApp.FromPhoneSelected');
			if (this.#catalog) {
				this.#catalog.getPopup().unsubscribeAll('onClose');
				this.#catalog.close();
				this.#catalog = null;
			}
			if (this.#settingsMenu) {
				this.#settingsMenu.close();
				this.#settingsMenu.destroy();
				this.#settingsMenu = null;
			}
		}
		#fromPhoneSelected(event) {
			const fromNumber = event.getData().phone;
			this.#storeLastSelectedFromNumber(fromNumber);
			this.#selectedFromNumber = fromNumber;
		}
		async #sendMessages(event) {
			const gridId = this.#options.gridId;
			const entityTypeId = this.#options.entityTypeId;
			const messageBody = event.getData()?.text || '';
			const messageTemplate = event.getData()?.templateId || null;
			const originalTempalteId = event.getData()?.originalTemplateId || null;
			const container = this.#progressBarRepo.getOrCreateProgressBarContainer('whatsapp-message').id;
			const settings = {
				gridId,
				entityTypeId,
				container
			};
			const bwmManager = crm_autorun.BatchWhatsappMessageManager.getInstance(gridId, settings);
			if (bwmManager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(gridId)) {
				this.#showAnotherProcessRunningNotification();
				return;
			}
			bwmManager.setTemplateParams({
				messageBody,
				messageTemplate,
				fromPhone: this.#selectedFromNumber
			});
			if (this.#options.forAll) {
				bwmManager.resetEntityIds();
			} else {
				bwmManager.setEntityIds(this.#options.selectedIds);
			}
			bwmManager.execute();
			this.#submitAnalytics('sendMessage', originalTempalteId);
			this.#destroy();
		}
		#showAnotherProcessRunningNotification() {
			ui_notification.UI.Notification.Center.notify({
				content: this.#messages.inProgress,
				autoHide: true,
				autoHideDelay: 5000
			});
		}
		#showGridLoader() {
			const gridLoader = this.#getGridLoader();
			if (gridLoader) {
				gridLoader.show();
			}
		}
		#hideGridLoader() {
			const gridLoader = this.#getGridLoader();
			if (gridLoader) {
				gridLoader.hide();
			}
		}
		#getGridLoader() {
			return BX.Main.gridManager.getById(this.#options.gridId)?.instance?.getLoader();
		}
		#restoreLastSelectedFromNumber() {
			return localStorage.getItem(SELECTED_FROM_NUMBER_LOCALSTORE_KEY) || null;
		}
		#storeLastSelectedFromNumber(fromNumber) {
			localStorage.setItem(SELECTED_FROM_NUMBER_LOCALSTORE_KEY, fromNumber);
		}
		#submitAnalytics(eventElement, templateId = null) {
			let analyticsData = null;
			if (eventElement === 'showHelp' && !this.#isHelpShown) {
				analyticsData = crm_integration_analytics.Builder.Communication.FormEvent.createDefault(this.#options.entityTypeId).setEvent(crm_integration_analytics.Dictionary.EVENT_WA_POPUP).setSubSection(crm_integration_analytics.Dictionary.SUB_SECTION_LIST).setElement(crm_integration_analytics.Dictionary.ELEMENT_WA_HELP);
				this.#isHelpShown = true;
			}
			if (eventElement === 'sendMessage') {
				analyticsData = crm_integration_analytics.Builder.Communication.SendEvent.createDefault(this.#options.entityTypeId).setEvent(crm_integration_analytics.Dictionary.EVENT_WA_SEND).setSubSection(crm_integration_analytics.Dictionary.SUB_SECTION_LIST).setElement(crm_integration_analytics.Dictionary.ELEMENT_WA_SEND).setContactsCount(this.#options.forAll ? 'all' : this.#options.selectedIds.length).setTemplateId(templateId);
			}
			if (analyticsData) {
				BX.UI.Analytics.sendData(analyticsData.buildData());
			}
		}
	}

	exports.DEFAULT_PROVIDER = DEFAULT_PROVIDER;
	exports.Messages = Messages;

})(this.BX.Crm.GroupActions = this.BX.Crm.GroupActions || {}, BX.Crm.Integration.Analytics, BX, BX.Event, BX.Main, BX.UI, BX.Crm.Autorun, BX);
//# sourceMappingURL=messages.bundle.js.map
