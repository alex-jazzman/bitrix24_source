/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_dialogs_messagebox, ui_buttons, ui_notification_center, crm_router, ui_infoHelper, main_sidepanel, crm_common, crm_dataStructures, main_core_events) {
	'use strict';

	const Types = Object.freeze({
		bitrix24: 'bitrix24',
		sms: 'sms_provider'
	});
	class ConsentApprover {
		#senderType = null;
		constructor(senderType = null) {
			this.#senderType = senderType;
		}
		async checkAndApprove() {
			if (this.#senderType !== Types.bitrix24) {
				return Promise.resolve(true);
			}
			return new Promise(resolve => {
				main_core.ajax.runAction('notifications.consent.Agreement.get').then(({
					data
				}) => {
					if (!data || !data.html) {
						resolve(true);
						return;
					}
					this.#showConsentAgreementBox(data, resolve);
				}).catch(() => {
					this.#showErrorNotify();
					resolve(false);
				});
			});
		}
		#showConsentAgreementBox({
			title,
			html: message
		}, resolve) {
			ui_dialogs_messagebox.MessageBox.show({
				modal: true,
				message,
				buttons: this.#getButtons(resolve),
				popupOptions: {
					className: 'crm-agreement-terms-popup'
				}
			});
		}
		#getButtons(resolve) {
			return [new ui_buttons.Button({
				className: 'ui-btn-round',
				color: ui_buttons.ButtonColor.SUCCESS,
				text: main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_CONSENT_ACCEPT'),
				onclick: button => {
					this.#approveConsent().then(isApprovedConsent => {
						if (isApprovedConsent) {
							this.#showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_AGREEMENT_ACCEPT'));
						}
						this.#closeAgreementBox(button);
						resolve(true);
					}).catch(() => {
						this.#showErrorNotify();
						resolve(false);
					});
				}
			}), new ui_buttons.Button({
				className: 'ui-btn-round',
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				text: main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_CONSENT_REJECT'),
				onclick: button => {
					this.#closeAgreementBox(button);
					resolve(false);
				}
			})];
		}
		#approveConsent() {
			return new Promise(resolve => {
				main_core.ajax.runAction('notifications.consent.Agreement.approve').then(response => {
					if (response?.status === 'success' && response?.data) {
						resolve(true);
						return;
					}
					resolve(false);
				}).catch(() => {
					resolve(false);
				});
			});
		}
		#closeAgreementBox({
			context
		}) {
			context.close();
		}
		#showErrorNotify() {
			this.#showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_CONSENT_AGREEMENT_VALIDATION_ERROR'));
		}
		#showNotify(content) {
			BX.UI.Notification.Center.notify({
				content
			});
		}
	}

	const showNotify = content => {
		BX.UI.Notification.Center.notify({
			content
		});
	};

	class Base {
		openLineItems = null;
		senderType = null;
		entityTypeId = null;
		constructor(params) {
			if (main_core.Type.isPlainObject(params?.openLineItems)) {
				this.openLineItems = params.openLineItems ?? null;
				this.senderType = params.senderType ?? null;
			}
			if (main_core.Type.isNumber(params?.entityTypeId)) {
				this.entityTypeId = params.entityTypeId;
			}
		}
		getOpenLineCode() {
			throw new Error('Must be implement in child class');
		}
		async checkAndGetLineId() {
			await this.#showConnectAlertMessage();
			return Promise.resolve(null);
		}
		async isOpenLineItemSelected(force = false) {
			const item = await this.getOpenLineItem(force);
			if (!item) {
				throw new ReferenceError(`OpenLine item with code: ${this.getOpenLineCode()} not found`);
			}
			return item.selected;
		}
		async getOpenLineItem(force = false, openLineCode = null) {
			if (this.openLineItems === null || force) {
				this.openLineItems = await this.fetchOpenLineItems();
			}
			return this.openLineItems[openLineCode ?? this.getOpenLineCode()];
		}
		async fetchOpenLineItems() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.controller.integration.openlines.getItems').then(({
					status,
					data,
					errors
				}) => {
					if (status === 'success') {
						resolve(data);
						return;
					}
					reject(errors);
				}).catch(data => {
					reject(data);
				});
			});
		}
		async getLineId() {
			return new Promise(resolve => {
				const connectorId = this.getOpenLineCode();
				const ajaxParameters = {
					connectorId: this.getOpenLineCode(),
					withConnector: true
				};
				main_core.ajax.runAction('imconnector.Openlines.list', {
					data: ajaxParameters
				}).then(({
					data
				}) => {
					if (main_core.Type.isArrayFilled(data)) {
						let lineId = data[data.length - 1].lineId;
						const openLineItemsList = this.openLineItems[connectorId]?.list ?? null;
						if (openLineItemsList) {
							const selectedItem = openLineItemsList.find(item => item.selected) ?? null;
							if (selectedItem) {
								lineId = selectedItem.id;
							}
						}
						resolve(lineId);
						return;
					}
					resolve(null);
				}).catch(() => {
					showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_OPENLINE_LINEID_ERROR'));
				});
			});
		}
		async canEditConnector() {
			return new Promise(resolve => {
				main_core.ajax.runAction('imconnector.Openlines.hasAccess').then(({
					data
				}) => {
					if (data.canEditConnector) {
						resolve(true);
						return;
					}
					resolve(false);
				}).catch(() => this.#showConnectAlertMessage());
			});
		}
		async #showConnectAlertMessage() {
			const item = await this.getOpenLineItem();
			const message = main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_CONNECT_ACCESS_DENIED', {
				'#SERVICE_NAME#': item.name
			});
			showNotify(message);
		}
		async openConnectSidePanel(url, onCloseCallback) {
			return new Promise(resolve => {
				if (main_core.Type.isStringFilled(url)) {
					void crm_router.Router.openSlider(url, {
						width: 700,
						cacheable: false
					}).then(() => {
						onCloseCallback(resolve);
					});
					return;
				}
				showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_OPENLINE_LINEID_ERROR'));
				resolve(null);
			});
		}
	}

	class Max extends Base {
		async checkAndGetLineId() {
			const isSelected = await this.isOpenLineItemSelected();
			if (isSelected) {
				const isApproved = await this.#checkConsentApproved();
				if (isApproved) {
					const lineId = await this.getLineId();
					if (!lineId) {
						const item = await this.getOpenLineItem();
						return this.openConnectSidePanel(item.url, this.onConnect.bind(this));
					}
					return Promise.resolve(lineId);
				}
				showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_AGREEMENT_NOTIFY'));
				return Promise.resolve(null);
			}
			const canEditConnector = await this.canEditConnector();
			if (canEditConnector) {
				const item = await this.getOpenLineItem();
				return this.openConnectSidePanel(item.url, this.onConnect.bind(this));
			}
			return super.checkAndGetLineId();
		}
		async onConnect(resolve) {
			const lineId = await this.getLineId();
			if (lineId === null) {
				showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_OPENLINE_LINEID_ERROR'));
				return resolve(null);
			}
			const item = await this.getOpenLineItem(true);
			showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_CONNECT_SUCCESS', {
				'#LINE_NAME#': item.name
			}));
			const isApproved = await this.#checkConsentApproved();
			if (isApproved) {
				return resolve(lineId);
			}
			showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_AGREEMENT_NOTIFY'));
			return resolve(null);
		}
		async #checkConsentApproved() {
			return new ConsentApprover(this.senderType).checkAndApprove();
		}
		getOpenLineCode() {
			return 'max';
		}
	}

	class RuWhatsApp extends Base {
		async checkAndGetLineId() {
			const isWhatsAppAvailable = await this.#checkVirtualWhatsAppAvailable();
			if (!isWhatsAppAvailable) {
				return null;
			}
			const isSelected = await this.isOpenLineItemSelected();
			if (isSelected) {
				if (await this.#isVirtualWhatsAppConnected()) {
					return this.getLineId();
				}
				const canEditConnector = await this.canEditConnector();
				if (canEditConnector) {
					const url = this.openLineItems?.virtual_whatsapp?.url;
					return this.openConnectSidePanel(url, this.onConnectVirtualWhatsApp.bind(this));
				}
				return super.checkAndGetLineId();
			}
			const canEditConnector = await this.canEditConnector();
			if (canEditConnector) {
				const item = await this.getOpenLineItem();
				return this.openConnectSidePanel(item.url, this.onConnect.bind(this));
			}
			return super.checkAndGetLineId();
		}
		async #checkVirtualWhatsAppAvailable() {
			const config = await this.#fetchVirtualWhatsAppConfig();
			if (main_core.Type.isStringFilled(config.infoHelperCode)) {
				if (main_core.Reflection.getClass('BX.UI.InfoHelper.show')) {
					BX.UI.InfoHelper.show(config.infoHelperCode);
				}
				return false;
			}
			return true;
		}
		#fetchVirtualWhatsAppConfig() {
			const {
				entityTypeId
			} = this;
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.controller.messagesender.conditionchecker.getVirtualWhatsAppConfig', {
					data: {
						entityTypeId
					}
				}).then(({
					status,
					data,
					errors
				}) => {
					if (status === 'success') {
						resolve(data);
						return;
					}
					reject(errors);
				}).catch(data => reject(data));
			});
		}
		async onConnectVirtualWhatsApp(resolve) {
			if (await this.#isVirtualWhatsAppConnected()) {
				return resolve(this.getLineId());
			}
			showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_OPENLINE_LINEID_ERROR'));
			return resolve(null);
		}
		async #isVirtualWhatsAppConnected() {
			const virtualWhatsAppItem = await this.getOpenLineItem(true, 'virtual_whatsapp');
			return virtualWhatsAppItem?.selected;
		}
		async onConnect(resolve) {
			const isSelected = await this.isOpenLineItemSelected(true);
			if (isSelected) {
				return resolve(this.checkAndGetLineId());
			}
			showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_OPENLINE_LINEID_ERROR'));
			return resolve(null);
		}
		getOpenLineCode() {
			return 'notifications';
		}
	}

	class Telegram extends Base {
		async checkAndGetLineId() {
			const isSelected = await this.isOpenLineItemSelected();
			if (isSelected) {
				const isApproved = await this.#checkConsentApproved();
				if (isApproved) {
					const lineId = await this.getLineId();
					if (!lineId) {
						const item = await this.getOpenLineItem();
						return this.openConnectSidePanel(item.url, this.onConnect.bind(this));
					}
					return Promise.resolve(lineId);
				}
				showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_AGREEMENT_NOTIFY'));
				return Promise.resolve(null);
			}
			const canEditConnector = await this.canEditConnector();
			if (canEditConnector) {
				const item = await this.getOpenLineItem();
				return this.openConnectSidePanel(item.url, this.onConnect.bind(this));
			}
			return super.checkAndGetLineId();
		}
		async onConnect(resolve) {
			const lineId = await this.getLineId();
			if (lineId === null) {
				showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_OPENLINE_LINEID_ERROR'));
				return resolve(null);
			}
			const item = await this.getOpenLineItem(true);
			showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_CONNECT_SUCCESS', {
				'#LINE_NAME#': item.name
			}));
			const isApproved = await this.#checkConsentApproved();
			if (isApproved) {
				return resolve(lineId);
			}
			showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_AGREEMENT_NOTIFY'));
			return resolve(null);
		}
		async #checkConsentApproved() {
			return new ConsentApprover(this.senderType).checkAndApprove();
		}
		getOpenLineCode() {
			return 'telegrambot';
		}
	}

	class WhatsApp extends Base {
		async checkAndGetLineId() {
			const isWhatsAppAvailable = await this.#checkVirtualWhatsAppAvailable();
			if (!isWhatsAppAvailable) {
				return null;
			}
			if (await this.#isVirtualWhatsAppConnected()) {
				const hasAvailableProvider = await this.#hasAvailableSmsProvider();
				if (hasAvailableProvider) {
					// notification connector does not take into account the open line number when generating the link
					return Promise.resolve(0);
				}
				const canEditConnector = await this.canEditConnector();
				if (canEditConnector) {
					return this.#showMarketplaceDialog();
				}
				return super.checkAndGetLineId();
			}
			const canEditConnector = await this.canEditConnector();
			if (canEditConnector) {
				const url = this.openLineItems?.virtual_whatsapp?.url;
				return this.openConnectSidePanel(url, this.onConnectVirtualWhatsApp.bind(this));
			}
			return super.checkAndGetLineId();
		}
		async #checkVirtualWhatsAppAvailable() {
			const config = await this.#fetchVirtualWhatsAppConfig();
			if (main_core.Type.isStringFilled(config.infoHelperCode)) {
				if (main_core.Reflection.getClass('BX.UI.InfoHelper.show')) {
					BX.UI.InfoHelper.show(config.infoHelperCode);
				}
				return false;
			}
			return true;
		}
		#fetchVirtualWhatsAppConfig() {
			const {
				entityTypeId
			} = this;
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.controller.messagesender.conditionchecker.getVirtualWhatsAppConfig', {
					data: {
						entityTypeId
					}
				}).then(({
					status,
					data,
					errors
				}) => {
					if (status === 'success') {
						resolve(data);
						return;
					}
					reject(errors);
				}).catch(data => reject(data));
			});
		}
		async onConnectVirtualWhatsApp(resolve) {
			if (await this.#isVirtualWhatsAppConnected()) {
				return resolve(this.checkAndGetLineId());
			}
			showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_OPENLINE_LINEID_ERROR'));
			return resolve(null);
		}
		async #isVirtualWhatsAppConnected() {
			const virtualWhatsAppItem = await this.getOpenLineItem(true, 'virtual_whatsapp');
			return virtualWhatsAppItem?.selected;
		}
		getOpenLineCode() {
			return 'notifications';
		}
		async #hasAvailableSmsProvider() {
			const smsSenders = await this.#getSmsSenders();
			return Promise.resolve(smsSenders.some(provider => provider.canUse && !provider.isTemplatesBased));
		}
		async #getSmsSenders() {
			const {
				entityTypeId
			} = this;
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.controller.messagesender.conditionchecker.getSmsSenders', {
					data: {
						entityTypeId
					}
				}).then(({
					status,
					data,
					errors
				}) => {
					if (status === 'success') {
						resolve(data);
						return;
					}
					reject(errors);
				}).catch(data => reject(data));
			});
		}
		#showMarketplaceDialog() {
			return new Promise(resolve => {
				ui_dialogs_messagebox.MessageBox.show({
					message: main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_CONDITION_CHECKER_MARKET_MESSAGE'),
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					okCaption: main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_CONDITION_CHECKER_OK_BTN_TEXT'),
					onOk: messageBox => {
						void this.#openMarketplace(resolve);
						messageBox.close();
					}
				});
			});
		}
		#openMarketplace(resolve) {
			const marketUrl = this.#getSettings().marketUrl;
			main_sidepanel.SidePanel.Instance.open(marketUrl, {
				cacheable: false,
				events: {
					onClose: () => {
						void this.#onCloseMarketplace(resolve);
					}
				}
			});
		}
		async #onCloseMarketplace(resolve) {
			const hasAvailableSmsProvider = await this.#hasAvailableSmsProvider();
			if (hasAvailableSmsProvider) {
				resolve(0);
				return;
			}
			showNotify(main_core.Loc.getMessage('CRM_MESSAGESENDER_B24_OPENLINE_LINEID_ERROR'));
			resolve(null);
		}
		#getSettings() {
			return main_core.Extension.getSettings('crm.messagesender');
		}
	}

	class Factory {
		static getScenarioInstance(name, params) {
			if (name === 'telegrambot') {
				return new Telegram(params);
			}
			if (name === 'ru-whatsapp')
				// for RU region
				{
					return new RuWhatsApp(params);
				}
			if (name === 'whatsapp')
				// for not RU region
				{
					return new WhatsApp(params);
				}
			if (name === 'max') {
				return new Max(params);
			}
			throw new RangeError(`Unknown scenario name: ${name}`);
		}
	}

	class ConditionChecker {
		#openLineItems = null;
		#senderType;
		#serviceId;
		#entityTypeId;

		/**
		 * @param {SenderType} senderType
		 * @param {OpenLineItems | null} openLineItems
		 * @param {string | null} serviceId
		 * @param {number | null} entityTypeId
		 * @returns {Promise<number|null>}
		 */
		static async checkAndGetLine({
			senderType,
			openLineItems = null,
			serviceId = null,
			entityTypeId = null
		}) {
			const instance = new ConditionChecker({
				senderType
			});
			if (main_core.Type.isObjectLike(openLineItems)) {
				instance.setOpenLineItems(openLineItems);
			}
			if (main_core.Type.isStringFilled(serviceId)) {
				instance.setServiceId(serviceId);
			} else {
				throw new TypeError('ServiceId is required');
			}
			if (BX.CrmEntityType.isDefined(entityTypeId)) {
				instance.setEntityTypeId(entityTypeId);
			} else {
				throw new TypeError('EntityTypeId is not specified or incorrect');
			}
			return instance.check();
		}
		static async checkIsApproved({
			senderType
		}) {
			const instance = new ConditionChecker({
				senderType
			});
			return instance.checkApproveConsent();
		}

		/**
		 * @param {string} openLineCode
		 * @param {string} senderType
		 */
		constructor({
			senderType
		}) {
			this.#senderType = senderType;
		}
		setOpenLineItems(items) {
			this.#openLineItems = items;
			return this;
		}
		setServiceId(serviceId) {
			this.#serviceId = serviceId;
			return this;
		}
		setEntityTypeId(entityTypeId) {
			this.#entityTypeId = entityTypeId;
			return this;
		}
		async check() {
			const scenario = Factory.getScenarioInstance(this.#serviceId, {
				senderType: this.#senderType,
				openLineItems: this.#openLineItems,
				entityTypeId: this.#entityTypeId
			});
			return scenario.checkAndGetLineId();
		}
		async checkApproveConsent() {
			const isApproved = await new ConsentApprover(this.#senderType).checkAndApprove();
			if (isApproved) {
				return Promise.resolve(true);
			}
			return Promise.resolve(null);
		}
	}

	function ensureIsItemIdentifier(candidate) {
		if (candidate instanceof crm_dataStructures.ItemIdentifier) {
			return;
		}
		throw new Error('Argument should be an instance of ItemIdentifier');
	}
	function ensureIsReceiver(candidate) {
		if (candidate instanceof Receiver) {
			return;
		}
		throw new Error('Argument should be an instance of Receiver');
	}
	function ensureIsValidMultifieldValue(candidate) {
		// noinspection OverlyComplexBooleanExpressionJS
		const isValidValue = main_core.Type.isPlainObject(candidate) && (main_core.Type.isNil(candidate.id) || main_core.Type.isInteger(candidate.id)) && main_core.Type.isStringFilled(candidate.typeId) && (main_core.Type.isNil(candidate.typeCaption) || main_core.Type.isStringFilled(candidate.typeCaption)) && main_core.Type.isStringFilled(candidate.valueType) && (main_core.Type.isNil(candidate.valueTypeCaption) || main_core.Type.isStringFilled(candidate.valueTypeCaption)) && main_core.Type.isStringFilled(candidate.value) && (main_core.Type.isNil(candidate.valueFormatted) || main_core.Type.isStringFilled(candidate.valueFormatted));
		if (isValidValue) {
			return;
		}
		throw new Error('Argument should be an object of valid MultifieldValue structure');
	}
	function ensureIsValidSourceData(candidate) {
		const isValid = main_core.Type.isPlainObject(candidate) && main_core.Type.isStringFilled(candidate.title);
		if (isValid) {
			return;
		}
		throw new Error('Argument should be an object of valid SourceData structure');
	}

	class Receiver {
		#rootSource;
		#addressSource;
		#addressSourceData = null;
		#address;
		constructor(rootSource, addressSource, address, addressSourceData = null) {
			ensureIsItemIdentifier(rootSource);
			this.#rootSource = rootSource;
			ensureIsItemIdentifier(addressSource);
			this.#addressSource = addressSource;
			ensureIsValidMultifieldValue(address);
			this.#address = Object.freeze({
				id: address.id,
				typeId: address.typeId,
				valueType: address.valueType,
				valueTypeCaption: address.valueTypeCaption,
				complexId: address.complexId,
				value: address.value,
				valueFormatted: address.valueFormatted
			});
			if (addressSourceData) {
				ensureIsValidSourceData(addressSourceData);
				this.#addressSourceData = Object.freeze({
					title: addressSourceData.title
				});
			}
		}
		static fromJSON(data) {
			const rootSource = crm_dataStructures.ItemIdentifier.fromJSON(data?.rootSource);
			if (!rootSource) {
				return null;
			}
			const addressSource = crm_dataStructures.ItemIdentifier.fromJSON(data?.addressSource);
			if (!addressSource) {
				return null;
			}
			try {
				return new Receiver(rootSource, addressSource, data?.address, data?.addressSourceData);
			} catch (e) {
				return null;
			}
		}
		get rootSource() {
			return this.#rootSource;
		}
		get addressSource() {
			return this.#addressSource;
		}
		get addressSourceData() {
			return this.#addressSourceData;
		}
		get address() {
			return this.#address;
		}
		isEqualTo(another) {
			if (!(another instanceof Receiver)) {
				return false;
			}

			// noinspection OverlyComplexBooleanExpressionJS
			return this.rootSource.isEqualTo(another.rootSource) && this.addressSource.isEqualTo(another.addressSource) && String(this.address.typeId) === String(another.address.typeId) && String(this.address.valueType) === String(another.address.valueType) && String(this.address.value) === String(another.address.value);
		}
		toJSON() {
			return {
				rootSource: this.rootSource,
				addressSource: this.addressSource,
				addressSourceData: this.addressSourceData,
				address: this.address
			};
		}
	}

	function extractReceivers(item, entityData) {
		const receivers = [];
		if (entityData?.hasOwnProperty('MULTIFIELD_DATA')) {
			receivers.push(...extractReceiversFromMultifieldData(item, entityData));
		}
		if (entityData?.hasOwnProperty('CLIENT_INFO')) {
			receivers.push(...extractReceiversFromClientInfo(item, entityData.CLIENT_INFO));
		}
		return unique(receivers);
	}
	function extractReceiversFromMultifieldData(item, entityData) {
		const receivers = [];
		const multifields = entityData.MULTIFIELD_DATA;
		for (const multifieldTypeId in multifields) {
			if (!multifields.hasOwnProperty(multifieldTypeId) || !main_core.Type.isPlainObject(multifields[multifieldTypeId])) {
				continue;
			}
			for (const itemSlug in multifields[multifieldTypeId]) {
				if (!multifields[multifieldTypeId].hasOwnProperty(itemSlug) || !main_core.Type.isArrayFilled(multifields[multifieldTypeId][itemSlug])) {
					continue;
				}
				const [entityTypeId, entityId] = itemSlug.split('_');
				let addressSource;
				try {
					addressSource = new crm_dataStructures.ItemIdentifier(main_core.Text.toInteger(entityTypeId), main_core.Text.toInteger(entityId));
				} catch (e) {
					continue;
				}
				const addressSourceTitle = getAddressSourceTitle(item, addressSource, entityData);
				for (const singleMultifield of multifields[multifieldTypeId][itemSlug]) {
					try {
						receivers.push(new Receiver(item, addressSource, {
							id: main_core.Text.toInteger(singleMultifield.ID),
							typeId: String(multifieldTypeId),
							valueType: stringOrUndefined(singleMultifield.VALUE_TYPE),
							value: stringOrUndefined(singleMultifield.VALUE),
							valueFormatted: stringOrUndefined(singleMultifield.VALUE_FORMATTED),
							complexId: stringOrUndefined(singleMultifield.COMPLEX_ID),
							valueTypeCaption: stringOrUndefined(singleMultifield.COMPLEX_NAME)
						}, {
							title: addressSourceTitle
						}));
					} catch (e) {}
				}
			}
		}
		return receivers;
	}
	function getAddressSourceTitle(rootSource, addressSource, entityData) {
		if (rootSource.isEqualTo(addressSource)) {
			return entityData?.TITLE ?? entityData.FORMATTED_NAME ?? '';
		}
		const clientDataKey = `${BX.CrmEntityType.resolveName(addressSource.entityTypeId)}_DATA`;
		if (main_core.Type.isArrayFilled(entityData?.CLIENT_INFO?.[clientDataKey])) {
			const client = entityData.CLIENT_INFO[clientDataKey].find(clientInfo => {
				return main_core.Text.toInteger(clientInfo.id) === addressSource.entityId;
			});
			if (main_core.Type.isString(client?.title)) {
				return client.title;
			}
		}
		return '';
	}
	function extractReceiversFromClientInfo(item, clientInfo) {
		const receivers = [];
		for (const clientsOfSameType of Object.values(clientInfo)) {
			if (!main_core.Type.isArrayFilled(clientsOfSameType)) {
				continue;
			}
			for (const singleClient of clientsOfSameType) {
				if (!main_core.Type.isPlainObject(singleClient)) {
					continue;
				}
				let addressSource;
				try {
					addressSource = new crm_dataStructures.ItemIdentifier(BX.CrmEntityType.resolveId(singleClient.typeName), singleClient.id);
				} catch (e) {
					continue;
				}
				const multifields = singleClient.advancedInfo?.multiFields;
				if (!main_core.Type.isArrayFilled(multifields)) {
					continue;
				}
				for (const singleMultifield of multifields) {
					try {
						receivers.push(new Receiver(item, addressSource, {
							id: main_core.Text.toInteger(singleMultifield.ID),
							typeId: stringOrUndefined(singleMultifield.TYPE_ID),
							valueType: stringOrUndefined(singleMultifield.VALUE_TYPE),
							value: stringOrUndefined(singleMultifield.VALUE),
							valueFormatted: stringOrUndefined(singleMultifield.VALUE_FORMATTED)
						}, {
							title: stringOrUndefined(singleClient.title)
						}));
					} catch (e) {}
				}
			}
		}
		return receivers;
	}
	function stringOrUndefined(value) {
		return main_core.Type.isNil(value) ? undefined : String(value);
	}
	function unique(receivers) {
		return receivers.filter((receiver, index) => {
			const anotherIndex = receivers.findIndex(anotherReceiver => receiver.isEqualTo(anotherReceiver));
			return anotherIndex === index;
		});
	}

	const OBSERVED_EVENTS = new Set(['onCrmEntityCreate', 'onCrmEntityUpdate', 'onCrmEntityDelete']);

	/**
	 * @memberOf BX.Crm.MessageSender
	 * @mixes EventEmitter
	 *
	 * @emits BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged
	 * @emits BX.Crm.MessageSender.ReceiverRepository:OnItemDeleted
	 *
	 * Currently, this class is supposed to work only in the context of entity details tab.
	 * In the future, it can be extended to work on any page. (see todos)
	 */
	class ReceiverRepository {
		static #instance;
		#onDetailsTabChangeEventHandler;
		#storage = {};
		#observedItems = {};
		static get Instance() {
			if (!ReceiverRepository.#instance) {
				ReceiverRepository.#instance = new ReceiverRepository();
			}
			return ReceiverRepository.#instance;
		}

		/**
		 * @internal This class is a singleton. Use Instance getter instead of constructing a new instance
		 */
		constructor() {
			if (ReceiverRepository.#instance) {
				throw new Error('Attempt to make a new instance of a singleton');
			}
			this.#init();
		}
		#init() {
			main_core_events.EventEmitter.makeObservable(this, 'BX.Crm.MessageSender.ReceiverRepository');
			this.#onDetailsTabChangeEventHandler = event => {
				if (!(event instanceof main_core_events.BaseEvent)) {
					console.error('unexpected event type', event);
					return;
				}
				if (!main_core.Type.isArrayFilled(event.getData()) || !main_core.Type.isPlainObject(event.getData()[0])) {
					return;
				}
				this.#onCrmEntityChange(event.getType(), event.getData()[0]);
			};
			this.#onDetailsTabChangeEventHandler = this.#onDetailsTabChangeEventHandler.bind(this);
			for (const eventName of OBSERVED_EVENTS) {
				// todo use BX.Crm.EntityEvent.subscribe instead, we will get data from all tabs/sliders
				main_core_events.EventEmitter.subscribe(eventName, this.#onDetailsTabChangeEventHandler);
			}
			if (BX.SidePanel?.Instance?.isOpen()) {
				// we are on entity details slider
				main_core_events.EventEmitter.subscribe('SidePanel.Slider:onDestroy', this.#destroy.bind(this));
			}
		}
		#destroy() {
			for (const eventName of OBSERVED_EVENTS) {
				main_core_events.EventEmitter.unsubscribe(eventName, this.#onDetailsTabChangeEventHandler);
			}
			ReceiverRepository.#instance = null;
		}
		#onCrmEntityChange(eventType, {
			entityTypeId,
			entityId,
			entityData
		}) {
			if (!this.#observedItems[entityTypeId]?.has(entityId)) {
				return;
			}
			const item = new crm_dataStructures.ItemIdentifier(entityTypeId, entityId);
			if (eventType.toLowerCase() === 'onCrmEntityCreate'.toLowerCase() || eventType.toLowerCase() === 'onCrmEntityUpdate'.toLowerCase()) {
				const oldReceivers = this.#storage[item.hash] ?? [];
				const newReceivers = extractReceivers(item, entityData);
				this.#storage[item.hash] = newReceivers;
				const added = newReceivers.filter(newReceiver => {
					return main_core.Type.isNil(oldReceivers.find(oldReceiver => oldReceiver.isEqualTo(newReceiver)));
				});
				const deleted = oldReceivers.filter(oldReceiver => {
					return main_core.Type.isNil(newReceivers.find(newReceiver => newReceiver.isEqualTo(oldReceiver)));
				});
				if (added.length > 0 || deleted.length > 0) {
					this.emit('OnReceiversChanged', {
						item,
						previous: oldReceivers,
						current: newReceivers,
						added,
						deleted
					});
				}
			} else if (eventType.toLowerCase() === 'onCrmEntityDelete'.toLowerCase()) {
				delete this.#storage[item.hash];
				this.#observedItems[item.entityTypeId].delete(item.entityId);
				this.emit('OnItemDeleted', {
					item
				});
			} else {
				console.error('unknown event type', eventType);
			}
		}

		/**
		 * @internal
		 */
		static onDetailsLoad(entityTypeId, entityId, receiversJSONString) {
			let item = null;
			try {
				item = new crm_dataStructures.ItemIdentifier(entityTypeId, entityId);
			} catch {
				return;
			}
			const instance = ReceiverRepository.Instance;
			// todo notify instances of this class on other tabs/sliders
			instance.#startObservingItem(item);
			const receiversJSON = JSON.parse(receiversJSONString);
			if (main_core.Type.isArrayFilled(receiversJSON)) {
				const receivers = [];
				for (const singleReceiverJSON of receiversJSON) {
					const receiver = Receiver.fromJSON(singleReceiverJSON);
					if (!main_core.Type.isNil(receiver)) {
						receivers.push(receiver);
					}
				}
				if (main_core.Type.isArrayFilled(receivers)) {
					// todo add receivers to instances of this class on other tabs/sliders
					instance.#addReceivers(item, receivers);
				}
			}
		}
		#addReceivers(item, receivers) {
			ensureIsItemIdentifier(item);
			this.#storage[item.hash] = [];
			for (const receiver of receivers) {
				ensureIsReceiver(receiver);
				this.#storage[item.hash].push(receiver);
			}
			this.#startObservingItem(item);
		}
		#startObservingItem(item) {
			ensureIsItemIdentifier(item);
			const observedItemsOfThisType = this.#observedItems[item.entityTypeId] ?? new Set();
			observedItemsOfThisType.add(item.entityId);
			this.#observedItems[item.entityTypeId] = observedItemsOfThisType;
		}
		getReceivers(entityTypeId, entityId) {
			try {
				return this.getReceiversByIdentifier(new crm_dataStructures.ItemIdentifier(entityTypeId, entityId));
			} catch {
				return [];
			}
		}
		getReceiversByIdentifier(item) {
			ensureIsItemIdentifier(item);
			return this.#storage[item.hash] ?? [];
		}
	}

	exports.ConditionChecker = ConditionChecker;
	exports.Receiver = Receiver;
	exports.ReceiverRepository = ReceiverRepository;
	exports.Types = Types;

})(this.BX.Crm.MessageSender = this.BX.Crm.MessageSender || {}, BX, BX.UI.Dialogs, BX.UI, BX, BX.Crm, BX.UI, BX.SidePanel, BX, BX.Crm.DataStructures, BX.Event);
//# sourceMappingURL=messagesender.bundle.js.map
