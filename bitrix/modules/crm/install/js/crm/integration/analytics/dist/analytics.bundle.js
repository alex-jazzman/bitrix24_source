/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Integration = this.BX.Crm.Integration || {};
(function (exports, main_core, crm_integration_analytics) {
	'use strict';

	/**
	 * @memberOf BX.Crm.Integration.Analytics
	 */
	const Dictionary = Object.freeze({
		TOOL_CRM: 'crm',
		TOOL_AI: 'AI',
		CATEGORY_ENTITY_OPERATIONS: 'entity_operations',
		CATEGORY_CRM_OPERATIONS: 'crm_operations',
		CATEGORY_AI_OPERATIONS: 'ai_operations',
		CATEGORY_AUTOMATION_OPERATIONS: 'automation_operations',
		CATEGORY_KANBAN_OPERATIONS: 'kanban_operations',
		CATEGORY_POPUP_OPERATIONS: 'popup_operations',
		CATEGORY_COMMUNICATION_OPERATIONS: 'communication',
		CATEGORY_BANNERS: 'banners',
		CATEGORY_EDITOR: 'editor',
		CATEGORY_IMPORT: 'import_operations',
		// region Event const
		EVENT_ENTITY_ADD_OPEN: 'entity_add_open',
		EVENT_ENTITY_ADD: 'entity_add',
		EVENT_ENTITY_CREATE: 'entity_create',
		EVENT_ENTITY_CLOSE: 'entity_close',
		EVENT_ENTITY_COMPLETE: 'entity_complete',
		EVENT_ENTITY_COPY_OPEN: 'entity_copy_open',
		EVENT_ENTITY_COPY: 'entity_copy',
		EVENT_ENTITY_CONVERT: 'entity_convert',
		EVENT_ENTITY_CONVERT_BATCH: 'entity_convert_batch',
		EVENT_ENTITY_CONVERT_OPEN: 'entity_convert_open',
		EVENT_ENTITY_UPDATE: 'entity_update',
		EVENT_ENTITY_EDIT: 'entity_edit',
		EVENT_ENTITY_CHANGE_STAGE: 'entity_change_stage',
		EVENT_CALL_PARSING: 'call_parsing',
		EVENT_AUDIO_TO_TEXT: 'audio_to_text',
		EVENT_SUMMARY: 'summary',
		EVENT_EXTRACT_FIELDS: 'extract_fields',
		EVENT_CALL_ACTIVITY_WITH_AUDIO_RECORDING: 'activity_call_with_audio_recording',
		EVENT_AUTOMATION_CREATE: 'automation_create',
		EVENT_AUTOMATION_EDIT: 'automation_edit',
		EVENT_AUTOMATION_DELETE: 'automation_delete',
		EVENT_BLOCK_CLOSE: 'block_close',
		EVENT_BLOCK_ENABLE: 'block_enable',
		EVENT_BLOCK_LINK: 'block_link',
		EVENT_WA_CONNECT: 'wa_connect',
		EVENT_WA_POPUP: 'wa_popup',
		EVENT_WA_UPDATE: 'wa_update',
		EVENT_WA_SEND: 'wa_send',
		EVENT_WA_TIMELINE: 'wa_timeline',
		EVENT_WA_DELETE: 'wa_delete',
		EVENT_CONNECT: 'connect',
		EVENT_INVITE: 'invite',
		EVENT_VIEW: 'view',
		EVENT_EDIT: 'edit',
		EVENT_SEND: 'send',
		EVENT_RESEND: 'resend',
		EVENT_CANCEL: 'cancel',
		EVENT_COPILOT: 'copilot',
		EVENT_REPEAT_SALE_BANNER_VIEW: 'banner_view',
		EVENT_REPEAT_SALE_BANNER_CLICK: 'banner_click',
		EVENT_REPEAT_SALE_BANNER_CLOSE: 'banner_close',
		EVENT_REPEAT_SALE_SEGMENT_VIEW: 'view',
		EVENT_REPEAT_SALE_SEGMENT_EDIT: 'edit',
		EVENT_REPEAT_SALE_SEGMENT_CANCEL: 'cancel',
		EVENT_OLD_INVOICE_READONLY_ALERT_VIEW: 'banner_view',
		EVENT_OLD_INVOICE_READONLY_ALERT_CLICK: 'banner_click',
		EVENT_OLD_INVOICE_READONLY_ALERT_CLOSE: 'banner_close',
		EVENT_EINVOICE_PROMO_VIEW: 'banner_view',
		EVENT_EINVOICE_PROMO_CLICK: 'banner_click',
		EVENT_EINVOICE_PROMO_CLOSE: 'banner_close',
		EVENT_IMPORT_VIEW: 'view',
		EVENT_IMPORT_EDIT: 'edit',
		EVENT_IMPORT_CREATE: 'create',
		EVENT_IMPORT_CANCEL: 'cancel',
		// endregion

		// region Type const
		TYPE_MANUAL: 'manual',
		TYPE_AUTO: 'auto',
		TYPE_AUTOMATED_SOLUTION: 'automated_solution',
		TYPE_DYNAMIC: 'dynamic',
		TYPE_CONTACT_CENTER: 'contact_center',
		TYPE_ITEM_INDUSTRY: 'item_industry',
		TYPE_POPUP_AI_TRANSCRIPT: 'popup_ai_transcript',
		TYPE_WA_CONNECT: 'wa_connect',
		TYPE_WA_EDIT: 'wa_edit',
		TYPE_WA_ACTIVITY_CREATE: 'wa_activity_create',
		TYPE_WA_ACTIVITY_DELETE: 'wa_activity_delete',
		TYPE_CHANNEL: 'channel',
		TYPE_MESSAGE: 'message',
		TYPE_REPEAT_SALE_SEGMENT: 'repeat_sale',
		TYPE_REPEAT_SALE_BANNER_NULL: 'repeat_sale_null',
		TYPE_REPEAT_SALE_BANNER_START_EMPTY: 'repeat_sale_start_empty',
		TYPE_REPEAT_SALE_BANNER_START: 'repeat_sale_start',
		TYPE_REPEAT_SALE_BANNER_START_FORCE: 'repeat_sale_force_start',
		TYPE_REPEAT_SALE_BANNER_STATISTICS: 'repeat_sale_statistics',
		TYPE_OLD_INVOICE_READONLY_ALERT: 'old_invoice',
		TYPE_EINVOICE_PROMO: 'einvoice_promo',
		// endregion

		// region Section const
		SECTION_CRM: 'crm',
		SECTION_AUTOMATION: 'automation',
		SECTION_LEAD: 'lead_section',
		SECTION_DEAL: 'deal_section',
		SECTION_CONTACT: 'contact_section',
		SECTION_COMPANY: 'company_section',
		SECTION_MYCOMPANY: 'my_company_section',
		SECTION_QUOTE: 'quote_section',
		SECTION_INVOICE: 'invoice_section',
		SECTION_SMART_INVOICE: 'smart_invoice_section',
		SECTION_DYNAMIC: 'dynamic_section',
		SECTION_CUSTOM: 'custom_section',
		/**
		 * @see \Bitrix\Crm\Service\Factory\SmartDocument::CONTACT_CATEGORY_CODE
		 */
		SECTION_SMART_DOCUMENT_CONTACT: 'smart_document_contact_section',
		/**
		 * @see \Bitrix\Crm\Integration\Catalog\Contractor\CategoryRepository::CATALOG_CONTRACTOR_CONTACT
		 */
		SECTION_CATALOG_CONTRACTOR_CONTACT: 'catalog_contractor_contact_section',
		/**
		 * @see \Bitrix\Crm\Integration\Catalog\Contractor\CategoryRepository::CATALOG_CONTRACTOR_COMPANY
		 */
		SECTION_CATALOG_CONTRACTOR_COMPANY: 'catalog_contractor_company_section',
		SECTION_SALESCENTER_SLIDER: 'sale_center_slider_section',
		SECTION_DOCUMENT: 'document_section',
		// endregion

		// region Sub Section const
		SUB_SECTION_LIST: 'list',
		SUB_SECTION_KANBAN: 'kanban',
		SUB_SECTION_ACTIVITIES: 'activities',
		SUB_SECTION_CALENDAR: 'calendar',
		SUB_SECTION_DEADLINES: 'deadlines',
		SUB_SECTION_DETAILS: 'details',
		SUB_SECTION_GRID_ROW_MENU: 'grid_row_menu',
		SUB_SECTION_KANBAN_DROPZONE: 'kanban_dropzone',
		SUB_SECTION_ACTION_BUTTON: 'action_button',
		SUB_SECTION_DEAL: 'deal',
		SUB_SECTION_LEAD: 'lead',
		SUB_SECTION_CONNECTION_SLIDER: 'connections_slider',
		// endregion

		// region Element const
		ELEMENT_CREATE_BUTTON: 'create_button',
		ELEMENT_CONTROL_PANEL_CREATE_BUTTON: 'control_panel_create_button',
		ELEMENT_QUICK_BUTTON: 'quick_button',
		ELEMENT_SETTINGS_BUTTON: 'settings_button',
		ELEMENT_GRID_ROW_CONTEXT_MENU: 'grid_row_context_menu',
		ELEMENT_GRID_GROUP_ACTIONS: 'grid_group_actions',
		ELEMENT_CONVERT_BUTTON: 'convert_button',
		ELEMENT_TERMINATION_CONTROL: 'termination_control',
		ELEMENT_CREATE_LINKED_ENTITY_BUTTON: 'create_linked_entity_button',
		ELEMENT_DRAG_N_DROP: 'drag_n_drop',
		ELEMENT_FILL_REQUIRED_FIELDS_POPUP: 'fill_required_fields_popup',
		ELEMENT_CRM_MODE_CHANGE_POPUP: 'crm_mode_change_popup',
		ELEMENT_COPILOT_BUTTON: 'copilot_button',
		ELEMENT_FEEDBACK_SEND: 'feedback_send',
		ELEMENT_FEEDBACK_REFUSED: 'feedback_refused',
		ELEMENT_CONFLICT_ACCEPT_CHANGES: 'conflict_accept_changes',
		ELEMENT_CONFLICT_CANCEL_CHANGES: 'conflict_cancel_changes',
		ELEMENT_WON_BUTTON: 'won_button',
		ELEMENT_LOSE_BUTTON: 'lose_button',
		ELEMENT_CANCEL_BUTTON: 'cancel_button',
		ELEMENT_ESC_BUTTON: 'esc_button',
		ELEMENT_DELETE_BUTTON: 'delete_button',
		ELEMENT_GRID_PROGRESS_BAR: 'grid_progress_bar',
		ELEMENT_LOSE_COLUMN: 'lose_column',
		ELEMENT_GRID_GROUP_ACTIONS_WON_STAGE: 'grid_group_actions_won_stage',
		ELEMENT_GRID_GROUP_ACTIONS_LOSE_STAGE: 'grid_group_actions_lose_stage',
		ELEMENT_LOSE_TOP_ACTIONS: 'lose_top_actions',
		ELEMENT_WON_TOP_ACTIONS: 'won_top_actions',
		ELEMENT_DETAILS_PROGRESS_BAR: 'details_progress_bar',
		ELEMENT_SAVE_IS_REQUIRED_TO_PROCEED_POPUP: 'save_is_required_to_proceed_popup',
		ELEMENT_CLOSE_BUTTON: 'close_button',
		ELEMENT_HIDE_CONTACT_CENTER: 'hide_contact_center',
		ELEMENT_ENABLE_CONTACT_CENTER: 'enable_contact_center',
		ELEMENT_CONTACT_CENTER_MARKETPLACE: 'contact_center_marketplace',
		ELEMENT_CONTACT_CENTER_IMPORTEXCEL: 'contact_center_importexcel',
		ELEMENT_ITEM_CONTACT_CENTER: 'item_contact_center',
		ELEMENT_ITEM_INDUSTRY_BUTTON: 'item_industry_button',
		ELEMENT_STAGE_BAR_BUTTON: 'stage_bar_btn',
		ELEMENT_STREAM_CONTENT_WHATSAPP: 'stream_content_wa',
		ELEMENT_WA_PREVIEW: 'wa_preview',
		ELEMENT_WA_HELP: 'wa_help_link',
		ELEMENT_WA_TEMPLATE_SELECTOR: 'wa_template_selector',
		ELEMENT_WA_TEMPLATE_OFFER: 'wa_template_offer',
		ELEMENT_WA_POPUP_GUIDE: 'wa_popup_guide',
		ELEMENT_WA_POPUP_CLOSE: 'wa_popup_close',
		ELEMENT_WA_SEND: 'wa_send',
		ELEMENT_WA_CANCEL: 'wa_cancel',
		ELEMENT_WA_RESEND: 'wa_resend',
		ELEMENT_WA_NOTE: 'wa_note',
		ELEMENT_WA_NOTE_PIN: 'wa_note_pin',
		ELEMENT_WA_MESSAGE_DELETE: 'wa_message_delete',
		ELEMENT_WA_NOTE_DELETE: 'wa_note_delete',
		ELEMENT_MENU_BUTTON: 'menu_button',
		ELEMENT_BANNER_BUTTON: 'banner_button',
		ELEMENT_NO_CONNECTION_BUTTON: 'no_connection_button',
		ELEMENT_PREVIEW: 'preview',
		ELEMENT_TEMPLATE_SELECTOR: 'template_selector',
		ELEMENT_TEMPLATE_OFFER: 'template_offer',
		ELEMENT_CHANNEL_SELECTOR: 'channel_selector',
		ELEMENT_CHANNEL_LIST_CHANGE: 'channel_list_change',
		ELEMENT_ELEMENT_ADD: 'element_add',
		ELEMENT_AHA_MOMENT: 'aha_moment',
		ELEMENT_INFO_BUTTON: 'info_button',
		ELEMENT_GOTOCHAT: 'gotochat',
		// endregion

		// region Status const
		STATUS_ATTEMPT: 'attempt',
		STATUS_SUCCESS: 'success',
		STATUS_ERROR: 'error',
		STATUS_CANCEL: 'cancel',
		STATUS_SUCCESS_FIELDS: 'success_fields',
		STATUS_SUCCESS_COMMENT: 'success_comment_only',
		STATUS_ERROR_NO_LIMITS: 'error_no_limits',
		STATUS_ERROR_AGREEMENT: 'error_agreement',
		STATUS_ERROR_LIMIT_DAILY: 'error_limit_daily',
		STATUS_ERROR_LIMIT_MONTHLY: 'error_limit_monthly',
		STATUS_ERROR_PROVIDER: 'error_provider',
		STATUS_ERROR_B24: 'error_b24',
		STATUS_ERROR_PERMISSIONS: 'error_permissions',
		STATUS_ERROR_FILLING_FIELDS: 'error_fillingFields'
		// endregion
	});

	let extensionSettings = null;
	function getAnalyticsEntityType(entityType) {
		let entityTypeName = null;
		if (BX.CrmEntityType.isDefined(entityType)) {
			entityTypeName = BX.CrmEntityType.resolveName(entityType);
		} else if (BX.CrmEntityType.isDefinedByName(entityType)) {
			entityTypeName = entityType;
		}
		if (!main_core.Type.isStringFilled(entityTypeName)) {
			return null;
		}
		if (BX.CrmEntityType.isDynamicTypeByName(entityTypeName)) {
			return 'dynamic';
		}
		return entityTypeName.toLowerCase();
	}
	function getCrmMode() {
		if (!extensionSettings) {
			extensionSettings = main_core.Extension.getSettings('crm.integration.analytics');
		}
		return `crmMode_${extensionSettings.get('crmMode', '').toLowerCase()}`;
	}
	function filterOutNilValues(object) {
		const result = {};
		Object.entries(object).forEach(([key, value]) => {
			if (!main_core.Type.isNil(value)) {
				result[key] = value;
			}
		});
		return result;
	}
	function normalizeChannelId(channelId) {
		return channelId.replaceAll('_', '-').replaceAll('~~~', '-');
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.AI
	 */
	class CallParsingEvent {
		#entityType;
		#tool = Dictionary.TOOL_AI;
		#category = Dictionary.CATEGORY_CRM_OPERATIONS;
		#type = Dictionary.TYPE_MANUAL;
		#element;
		#activityId;
		#activityDirection;
		#status;
		static createDefault(entityType, activityId, status) {
			const self = new CallParsingEvent();
			self.#entityType = entityType;
			self.#activityId = main_core.Text.toInteger(activityId);
			self.#status = status;
			return self;
		}
		setTool(tool) {
			this.#tool = tool;
			return this;
		}
		setCategory(category) {
			this.#category = category;
			return this;
		}
		setType(type) {
			this.#type = type;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setActivityDirection(direction) {
			this.#activityDirection = direction;
			return this;
		}
		buildData() {
			const analyticsEntityType = getAnalyticsEntityType(this.#entityType);
			if (!analyticsEntityType) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			if (this.#activityId <= 0) {
				console.error('crm.integration.analytics: invalid activity id');
				return null;
			}
			if (this.#activityDirection !== 'incoming' && this.#activityDirection !== 'outgoing') {
				console.error('crm.integration.analytics: invalid activity direction', this.#activityDirection);
				return null;
			}
			return filterOutNilValues({
				tool: this.#tool,
				category: this.#category,
				event: Dictionary.EVENT_CALL_PARSING,
				type: this.#type,
				c_section: Dictionary.SECTION_CRM,
				c_sub_section: analyticsEntityType,
				c_element: this.#element,
				status: this.#status,
				p1: getCrmMode(),
				p2: `callDirection_${this.#activityDirection}`,
				p5: `idCall_${this.#activityId}`
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Automation.AutomatedSolution
	 */
	let CreateEvent$2 = class CreateEvent {
		#element;
		#status;
		#id;
		#typeIds = [];
		setElement(element) {
			this.#element = element;
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		setId(id) {
			this.#id = main_core.Text.toInteger(id);
			if (this.#id <= 0) {
				this.#id = null;
			}
			return this;
		}
		setTypeIds(ids) {
			if (main_core.Type.isArrayFilled(ids)) {
				this.#typeIds = ids.map(id => main_core.Text.toInteger(id)).filter(id => id > 0).sort();
			}
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_AUTOMATION_OPERATIONS,
				event: Dictionary.EVENT_AUTOMATION_CREATE,
				type: Dictionary.TYPE_AUTOMATED_SOLUTION,
				c_section: Dictionary.SECTION_AUTOMATION,
				c_element: this.#element,
				status: this.#status,
				p1: getCrmMode(),
				p2: this.#id > 0 ? `id_${this.#id}` : null,
				p3: main_core.Type.isArrayFilled(this.#typeIds) ? `typeIds_${this.#typeIds.join(',')}` : null
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Automation.AutomatedSolution
	 */
	let DeleteEvent$2 = class DeleteEvent {
		#element;
		#status;
		#id;
		setElement(element) {
			this.#element = element;
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		setId(id) {
			this.#id = main_core.Text.toInteger(id);
			if (this.#id <= 0) {
				this.#id = null;
			}
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_AUTOMATION_OPERATIONS,
				event: Dictionary.EVENT_AUTOMATION_DELETE,
				type: Dictionary.TYPE_AUTOMATED_SOLUTION,
				c_section: Dictionary.SECTION_AUTOMATION,
				c_element: this.#element,
				status: this.#status,
				p1: getCrmMode(),
				p2: this.#id > 0 ? `id_${this.#id}` : null
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Automation.AutomatedSolution
	 */
	let EditEvent$3 = class EditEvent {
		#element;
		#status;
		#id;
		#typeIds = [];
		setElement(element) {
			this.#element = element;
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		setId(id) {
			this.#id = main_core.Text.toInteger(id);
			if (this.#id <= 0) {
				this.#id = null;
			}
			return this;
		}
		setTypeIds(ids) {
			if (main_core.Type.isArrayFilled(ids)) {
				this.#typeIds = ids.map(id => main_core.Text.toInteger(id)).filter(id => id > 0).sort();
			}
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_AUTOMATION_OPERATIONS,
				event: Dictionary.EVENT_AUTOMATION_EDIT,
				type: Dictionary.TYPE_AUTOMATED_SOLUTION,
				c_section: Dictionary.SECTION_AUTOMATION,
				c_element: this.#element,
				status: this.#status,
				p1: getCrmMode(),
				p2: this.#id > 0 ? `id_${this.#id}` : null,
				p3: main_core.Type.isArrayFilled(this.#typeIds) ? `typeIds_${this.#typeIds.join(',')}` : null
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Automation.Type
	 */
	let CreateEvent$1 = class CreateEvent {
		#element;
		#status;
		#isExternal;
		#id;
		#preset;
		setIsExternal(isExternal) {
			this.#isExternal = Boolean(isExternal);
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		setId(id) {
			this.#id = main_core.Text.toInteger(id);
			if (this.#id <= 0) {
				this.#id = null;
			}
			return this;
		}
		setPreset(presetId) {
			this.#preset = String(presetId);
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_AUTOMATION_OPERATIONS,
				event: Dictionary.EVENT_AUTOMATION_CREATE,
				type: Dictionary.TYPE_DYNAMIC,
				c_section: this.#isExternal ? Dictionary.SECTION_AUTOMATION : Dictionary.SECTION_CRM,
				c_element: this.#element,
				status: this.#status,
				p1: getCrmMode(),
				p2: this.#id > 0 ? `id_${this.#id}` : null,
				p4: main_core.Type.isStringFilled(this.#preset) ? `preset_${this.#preset}` : null
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Automation.Type
	 */
	let DeleteEvent$1 = class DeleteEvent {
		#subSection;
		#status;
		#isExternal;
		#element;
		#id;
		setIsExternal(isExternal) {
			this.#isExternal = Boolean(isExternal);
			return this;
		}
		setSubSection(subSection) {
			this.#subSection = main_core.Type.isNil(subSection) ? null : String(subSection);
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setId(id) {
			this.#id = main_core.Text.toInteger(id);
			if (this.#id <= 0) {
				this.#id = null;
			}
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_AUTOMATION_OPERATIONS,
				event: Dictionary.EVENT_AUTOMATION_DELETE,
				type: Dictionary.TYPE_DYNAMIC,
				c_section: this.#isExternal ? Dictionary.SECTION_AUTOMATION : Dictionary.SECTION_CRM,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				status: this.#status,
				p1: getCrmMode(),
				p2: this.#id > 0 ? `id_${this.#id}` : null
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Automation.Type
	 */
	let EditEvent$2 = class EditEvent {
		#subSection;
		#element;
		#status;
		#isExternal;
		#id;
		#preset;
		setIsExternal(isExternal) {
			this.#isExternal = Boolean(isExternal);
			return this;
		}
		setSubSection(subSection) {
			this.#subSection = String(subSection);
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		setId(id) {
			this.#id = main_core.Text.toInteger(id);
			if (this.#id <= 0) {
				this.#id = null;
			}
			return this;
		}
		setPreset(presetId) {
			this.#preset = String(presetId);
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_AUTOMATION_OPERATIONS,
				event: Dictionary.EVENT_AUTOMATION_EDIT,
				type: Dictionary.TYPE_DYNAMIC,
				c_section: this.#isExternal ? Dictionary.SECTION_AUTOMATION : Dictionary.SECTION_CRM,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				status: this.#status,
				p1: getCrmMode(),
				p2: this.#id > 0 ? `id_${this.#id}` : null,
				p4: main_core.Type.isStringFilled(this.#preset) ? `preset_${this.#preset}` : null
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Block
	 */
	let CloseEvent$4 = class CloseEvent {
		#entityType;
		#subSection = Dictionary.SUB_SECTION_KANBAN;
		#element;
		#type = Dictionary.TYPE_CONTACT_CENTER;
		static createDefault(entityType) {
			const self = new CloseEvent();
			self.#entityType = entityType;
			return self;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setType(type) {
			this.#type = type;
			return this;
		}
		buildData() {
			const type = getAnalyticsEntityType(this.#entityType);
			if (!type) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_KANBAN_OPERATIONS,
				event: Dictionary.EVENT_BLOCK_CLOSE,
				type: this.#type,
				c_section: `${type}_section`,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: getCrmMode()
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Block
	 */
	class EnableEvent {
		#entityType;
		#subSection;
		#element;
		#type = Dictionary.TYPE_CONTACT_CENTER;
		static createDefault(entityType) {
			const self = new EnableEvent();
			self.#entityType = entityType;
			return self;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setType(type) {
			this.#type = type;
			return this;
		}
		buildData() {
			const type = getAnalyticsEntityType(this.#entityType);
			if (!type) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_KANBAN_OPERATIONS,
				event: Dictionary.EVENT_BLOCK_ENABLE,
				type: this.#type,
				c_section: `${type}_section`,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: getCrmMode()
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Block
	 */
	class LinkEvent {
		#entityType;
		#element = Dictionary.ELEMENT_ITEM_CONTACT_CENTER;
		#type = Dictionary.TYPE_CONTACT_CENTER;
		static createDefault(entityType) {
			const self = new LinkEvent();
			self.#entityType = entityType;
			return self;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setType(type) {
			this.#type = type;
			return this;
		}
		buildData() {
			const type = getAnalyticsEntityType(this.#entityType);
			if (!type) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_KANBAN_OPERATIONS,
				event: Dictionary.EVENT_BLOCK_LINK,
				type: this.#type,
				c_section: `${type}_section`,
				c_sub_section: Dictionary.SUB_SECTION_KANBAN,
				c_element: this.#element,
				p1: getCrmMode()
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Channel
	 */
	class ConnectEvent {
		#section;
		#subSection;
		#element;
		#channelId;
		#connectStatus;
		setSection(section) {
			this.#section = section;
			return this;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setChannelId(channelId) {
			this.#channelId = channelId;
			return this;
		}
		setConnectStatus(connectStatus) {
			this.#connectStatus = connectStatus;
			return this;
		}
		buildData() {
			let p2 = null;
			if (main_core.Type.isStringFilled(this.#channelId)) {
				p2 = `channel_${normalizeChannelId(this.#channelId)}`;
			}
			let p3 = null;
			if (main_core.Type.isStringFilled(this.#connectStatus)) {
				p3 = `connectStatus_${this.#connectStatus}`;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
				event: Dictionary.EVENT_CONNECT,
				type: Dictionary.TYPE_CHANNEL,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: getCrmMode(),
				p2,
				p3
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Channel
	 */
	class InviteEvent {
		#section;
		#subSection;
		#element;
		#channelId;
		setSection(section) {
			this.#section = section;
			return this;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setChannelId(channelId) {
			this.#channelId = channelId;
			return this;
		}
		buildData() {
			let p2 = null;
			if (main_core.Type.isStringFilled(this.#channelId)) {
				p2 = `channel_${normalizeChannelId(this.#channelId)}`;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
				event: Dictionary.EVENT_INVITE,
				type: Dictionary.TYPE_CHANNEL,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: getCrmMode(),
				p2
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Communication
	 */
	class DeleteEvent {
		#entityType;
		#element;
		static createDefault(entityType) {
			const self = new DeleteEvent();
			self.#entityType = entityType;
			return self;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		buildData() {
			const type = getAnalyticsEntityType(this.#entityType);
			if (!type) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
				event: Dictionary.EVENT_WA_DELETE,
				type: Dictionary.TYPE_WA_ACTIVITY_DELETE,
				c_section: `${type}_section`,
				c_sub_section: Dictionary.SUB_SECTION_DETAILS,
				c_element: this.#element,
				p1: getCrmMode()
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Editor
	 */
	class ResendEvent {
		#section;
		#subSection;
		#templateId;
		#channelId;
		static createDefault(channelId) {
			const self = new ResendEvent();
			self.#channelId = channelId;
			return self;
		}
		setSection(section) {
			this.#section = section;
			return this;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setTemplateId(templateId) {
			this.#templateId = templateId;
			return this;
		}
		buildData() {
			let p3 = null;
			if (this.#templateId) {
				p3 = `template_${this.#templateId}`;
			}
			let p5 = null;
			if (!main_core.Type.isNil(this.#channelId)) {
				p5 = `channel_${normalizeChannelId(this.#channelId)}`;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
				event: Dictionary.EVENT_RESEND,
				type: Dictionary.TYPE_MESSAGE,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				p1: getCrmMode(),
				p3,
				p5
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Editor
	 */
	let SendEvent$1 = class SendEvent {
		#section;
		#subSection;
		#templateId;
		#channelId;
		static createDefault(channelId) {
			const self = new SendEvent();
			self.#channelId = channelId;
			return self;
		}
		setSection(section) {
			this.#section = section;
			return this;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setTemplateId(templateId) {
			this.#templateId = templateId;
			return this;
		}
		buildData() {
			let p3 = null;
			if (this.#templateId) {
				p3 = `template_${this.#templateId}`;
			}
			let p5 = null;
			if (!main_core.Type.isNil(this.#channelId)) {
				p5 = `channel_${normalizeChannelId(this.#channelId)}`;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
				event: Dictionary.EVENT_SEND,
				type: Dictionary.TYPE_MESSAGE,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				p1: getCrmMode(),
				p3,
				p5
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Communication
	 */
	class FormEvent {
		#entityType;
		#event;
		#element;
		#subSection;
		static createDefault(entityType) {
			const self = new FormEvent();
			self.#entityType = entityType;
			return self;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setEvent(event) {
			this.#event = event;
			return this;
		}
		buildData() {
			const type = getAnalyticsEntityType(this.#entityType);
			if (!type) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
				event: this.#event,
				type: Dictionary.TYPE_WA_EDIT,
				c_section: `${type}_section`,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: getCrmMode()
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Communication
	 */
	class SendEvent {
		#entityType;
		#event;
		#element;
		#subSection;
		#contactsCount;
		#templateId;
		#resend = false;
		static createDefault(entityType) {
			const self = new SendEvent();
			self.#entityType = entityType;
			return self;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setEvent(event) {
			this.#event = event;
			return this;
		}
		setContactsCount(count) {
			if (count === 'all') {
				this.#contactsCount = 'all';
			} else {
				this.#contactsCount = main_core.Text.toInteger(count);
				if (this.#contactsCount <= 0) {
					this.#contactsCount = null;
				}
			}
			return this;
		}
		setTemplateId(id) {
			this.#templateId = main_core.Text.toInteger(id);
			if (this.#templateId <= 0) {
				this.#templateId = null;
			}
			return this;
		}
		setResend() {
			this.#resend = true;
			return this;
		}
		buildData() {
			const type = getAnalyticsEntityType(this.#entityType);
			if (!type) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
				event: this.#event,
				type: Dictionary.TYPE_WA_ACTIVITY_CREATE,
				c_section: `${type}_section`,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: getCrmMode(),
				p2: this.#contactsCount,
				p3: this.#templateId,
				p4: this.#resend ? 'resend' : null
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Entity
	 */
	class AddEvent {
		#entityType;
		#subSection;
		#element;
		static createDefault(entityType) {
			const self = new AddEvent();
			self.#entityType = entityType;
			return self;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		buildData() {
			const type = getAnalyticsEntityType(this.#entityType);
			if (!type) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_ENTITY_OPERATIONS,
				event: Dictionary.EVENT_ENTITY_CREATE,
				type,
				c_section: `${type}_section`,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: getCrmMode()
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Entity
	 */
	class ChangeStageEvent {
		#entityType;
		#subSection;
		#element;
		#status;
		#countEntityChangeStage;
		static createDefault(entityType, countEntityChangeStage = 1) {
			const self = new ChangeStageEvent();
			self.#entityType = entityType;
			self.#countEntityChangeStage = countEntityChangeStage;
			return self;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		buildData() {
			const type = getAnalyticsEntityType(this.#entityType);
			if (!type) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			const analyticsData = {
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_ENTITY_OPERATIONS,
				event: Dictionary.EVENT_ENTITY_CHANGE_STAGE,
				type,
				c_section: `${type}_section`,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				status: this.#status,
				p1: getCrmMode()
			};
			if (this.#countEntityChangeStage > 1) {
				analyticsData.p2 = `entityCount_${this.#countEntityChangeStage}`;
			}
			return filterOutNilValues(analyticsData);
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Entity
	 */
	let CloseEvent$3 = class CloseEvent {
		#entityType;
		#subSection;
		#element;
		#entityId;
		static createDefault(entityType, entityId) {
			const self = new CloseEvent();
			self.#entityType = entityType;
			self.#entityId = entityId;
			return self;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		buildData() {
			const type = getAnalyticsEntityType(this.#entityType);
			if (!type) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_ENTITY_OPERATIONS,
				event: Dictionary.EVENT_ENTITY_COMPLETE,
				type,
				c_section: `${type}_section`,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: getCrmMode(),
				p2: this.#entityId
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Entity
	 */
	class ConvertBatchEvent {
		#srcEntityType;
		#dstEntityType;
		#section;
		#subSection;
		#element;
		#status;
		static createDefault(srcEntityType, dstEntityType) {
			const self = new ConvertBatchEvent();
			self.#srcEntityType = srcEntityType;
			self.#dstEntityType = dstEntityType;
			return self;
		}
		setSection(section) {
			this.#section = section;
			return this;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		buildData() {
			const srcType = getAnalyticsEntityType(this.#srcEntityType);
			const dstType = getAnalyticsEntityType(this.#dstEntityType);
			if (!srcType || !dstType) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_ENTITY_OPERATIONS,
				event: Dictionary.EVENT_ENTITY_CONVERT_BATCH,
				type: dstType,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				status: this.#status,
				p1: getCrmMode(),
				p2: `from_${main_core.Text.toCamelCase(srcType)}`
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.Entity
	 */
	class ConvertEvent {
		#srcEntityType;
		#dstEntityType;
		#section;
		#subSection;
		#element;
		#status;
		static createDefault(srcEntityType, dstEntityType) {
			const self = new ConvertEvent();
			self.#srcEntityType = srcEntityType;
			self.#dstEntityType = dstEntityType;
			return self;
		}
		setSection(section) {
			this.#section = section;
			return this;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		buildData() {
			const srcType = getAnalyticsEntityType(this.#srcEntityType);
			const dstType = getAnalyticsEntityType(this.#dstEntityType);
			if (!srcType || !dstType) {
				console.error('crm.integration.analytics: Unknown entity type');
				return null;
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_ENTITY_OPERATIONS,
				event: Dictionary.EVENT_ENTITY_CONVERT,
				type: dstType,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				status: this.#status,
				p1: getCrmMode(),
				p2: `from_${main_core.Text.toCamelCase(srcType)}`
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.RepeatSale.Banner
	 */
	let ClickEvent$2 = class ClickEvent {
		#type;
		#section = Dictionary.SECTION_DEAL;
		#subSection = Dictionary.SUB_SECTION_KANBAN;
		#element;
		#period;
		static createDefault(type, subSection) {
			const self = new ClickEvent();
			self.#type = type;
			self.#subSection = subSection;
			return self;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setPeriod(period) {
			this.#period = period;
			return this;
		}
		setSection(section) {
			this.#section = section;
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_BANNERS,
				event: Dictionary.EVENT_REPEAT_SALE_BANNER_CLICK,
				type: this.#type,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: getCrmMode(),
				p3: this.#period ? `period_${this.#period}` : null
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.RepeatSale.Banner
	 */
	let CloseEvent$2 = class CloseEvent {
		#type;
		#section = Dictionary.SECTION_DEAL;
		#subSection = Dictionary.SUB_SECTION_KANBAN;
		#element = Dictionary.ELEMENT_CLOSE_BUTTON;
		static createDefault(type, subSection) {
			const self = new CloseEvent();
			self.#type = type;
			self.#subSection = subSection;
			return self;
		}
		setSection(section) {
			this.#section = section;
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_BANNERS,
				event: Dictionary.EVENT_REPEAT_SALE_BANNER_CLOSE,
				type: this.#type,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: getCrmMode()
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.RepeatSale.Banner
	 */
	let ViewEvent$4 = class ViewEvent {
		#section = Dictionary.SECTION_DEAL;
		#subSection = Dictionary.SUB_SECTION_KANBAN;
		#type;
		static createDefault(type, subSection) {
			const self = new ViewEvent();
			self.#type = type;
			self.#subSection = subSection;
			return self;
		}
		setSection(section) {
			this.#section = section;
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_BANNERS,
				event: Dictionary.EVENT_REPEAT_SALE_BANNER_VIEW,
				type: this.#type,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				p1: getCrmMode()
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.RepeatSale.Segment
	 */
	let CancelEvent$1 = class CancelEvent {
		#section = Dictionary.SECTION_DEAL;
		static createDefault(section) {
			const self = new CancelEvent();
			self.#section = section;
			return self;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_EDITOR,
				event: Dictionary.EVENT_REPEAT_SALE_SEGMENT_CANCEL,
				type: Dictionary.TYPE_REPEAT_SALE_SEGMENT,
				c_section: this.#section,
				p1: getCrmMode()
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.RepeatSale.Segment
	 */
	let EditEvent$1 = class EditEvent {
		#section = Dictionary.SECTION_DEAL;
		#isActivityTextChanged = false;
		#isEntityTitlePatternChanged = false;
		#isCopilotEnabled = null;
		#segmentCode = null;
		static createDefault(section) {
			const self = new EditEvent();
			self.#section = section;
			return self;
		}
		setIsCopilotEnabled(isCopilotEnabled) {
			this.#isCopilotEnabled = isCopilotEnabled;
			return this;
		}
		setIsActivityTextChanged(isActivityTextChanged) {
			this.#isActivityTextChanged = isActivityTextChanged;
			return this;
		}
		setIsEntityTitlePatternChanged(isEntityTitlePatternChanged) {
			this.#isEntityTitlePatternChanged = isEntityTitlePatternChanged;
			return this;
		}
		setSegmentCode(code) {
			this.#segmentCode = code;
			return this;
		}
		#getP5() {
			switch (this.#segmentCode) {
				case 'deal_activity_less_12_month':
					return 'deal-activity-less-12m';
				case 'deal_lost_more_12_month':
					return 'deal-lost-more-12m';
				case 'deal_every_year':
					return 'deal-annual';
				case 'deal_every_half_year':
					return 'deal-semiannual';
				case 'deal_every_month_year':
					return 'deal-month-yr';
				case 'ai_screening':
					return 'deal-ai-screening';
				case 'ai_approve':
					return 'deal-ai-approve';
				case 'remaining':
					return 'deal-remaining';
				default:
					return null;
			}
		}
		buildData() {
			let p1 = null;
			if (this.#isCopilotEnabled === true) {
				p1 = 'scenario-copilot-enable-on';
			} else if (this.#isCopilotEnabled === false) {
				p1 = 'scenario-copilot-enable-off';
			}
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_EDITOR,
				event: Dictionary.EVENT_REPEAT_SALE_SEGMENT_EDIT,
				type: Dictionary.TYPE_REPEAT_SALE_SEGMENT,
				c_section: this.#section,
				p1,
				p2: this.#isActivityTextChanged ? 'scenario-text-deal-box' : null,
				p3: this.#isEntityTitlePatternChanged ? 'scenario-deal-name' : null,
				p5: this.#getP5()
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.RepeatSale.Segment
	 */
	let ViewEvent$3 = class ViewEvent {
		#section = Dictionary.SECTION_DEAL;
		static createDefault(section) {
			const self = new ViewEvent();
			self.#section = section;
			return self;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_EDITOR,
				event: Dictionary.EVENT_REPEAT_SALE_SEGMENT_VIEW,
				type: Dictionary.TYPE_REPEAT_SALE_SEGMENT,
				c_section: this.#section,
				p1: getCrmMode()
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.OldEntityView.OldInvoiceReadonly
	 */

	let ViewEvent$2 = class ViewEvent {
		static buildData() {
			return {
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_BANNERS,
				event: Dictionary.EVENT_OLD_INVOICE_READONLY_ALERT_VIEW,
				type: Dictionary.TYPE_OLD_INVOICE_READONLY_ALERT,
				c_section: Dictionary.SECTION_INVOICE,
				p1: getCrmMode()
			};
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.OldEntityView.OldInvoiceReadonly
	 */

	let ClickEvent$1 = class ClickEvent {
		static buildData() {
			return {
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_BANNERS,
				event: Dictionary.EVENT_OLD_INVOICE_READONLY_ALERT_CLICK,
				type: Dictionary.TYPE_OLD_INVOICE_READONLY_ALERT,
				c_section: Dictionary.SECTION_INVOICE,
				c_element: Dictionary.ELEMENT_INFO_BUTTON,
				p1: getCrmMode()
			};
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.OldEntityView.OldInvoiceReadonly
	 */

	let CloseEvent$1 = class CloseEvent {
		static buildData() {
			return {
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_BANNERS,
				event: Dictionary.EVENT_OLD_INVOICE_READONLY_ALERT_CLOSE,
				type: Dictionary.TYPE_OLD_INVOICE_READONLY_ALERT,
				c_section: Dictionary.SECTION_INVOICE,
				c_element: Dictionary.ELEMENT_CLOSE_BUTTON,
				p1: getCrmMode()
			};
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.EInvoicePromo
	 */
	let ViewEvent$1 = class ViewEvent {
		#section;
		#subSection;
		static createDefault(section, subSection) {
			const self = new ViewEvent();
			self.#section = section;
			self.#subSection = subSection;
			return self;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_BANNERS,
				event: Dictionary.EVENT_EINVOICE_PROMO_VIEW,
				type: Dictionary.TYPE_EINVOICE_PROMO,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				p1: getCrmMode()
			});
		}
	};

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.EInvoicePromo
	 */
	class ClickEvent {
		#section;
		#subSection;
		static createDefault(section, subSection) {
			const self = new ClickEvent();
			self.#section = section;
			self.#subSection = subSection;
			return self;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_BANNERS,
				event: Dictionary.EVENT_EINVOICE_PROMO_CLICK,
				type: Dictionary.TYPE_EINVOICE_PROMO,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				p1: getCrmMode()
			});
		}
	}

	/**
	 * @memberof BX.Crm.Integration.Analytics.Builder.EInvoicePromo
	 */
	class CloseEvent {
		#section;
		#subSection;
		static createDefault(section, subSection) {
			const self = new CloseEvent();
			self.#section = section;
			self.#subSection = subSection;
			return self;
		}
		buildData() {
			return filterOutNilValues({
				tool: Dictionary.TOOL_CRM,
				category: Dictionary.CATEGORY_BANNERS,
				event: Dictionary.EVENT_EINVOICE_PROMO_CLOSE,
				type: Dictionary.TYPE_EINVOICE_PROMO,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				p1: getCrmMode()
			});
		}
	}

	class ViewEvent {
		#entityType;
		#origin = null;
		#isMigration = false;
		static createDefault(entityType) {
			const self = new ViewEvent();
			self.#entityType = entityType;
			return self;
		}
		setOrigin(origin) {
			this.#origin = origin;
			return this;
		}
		setIsMigration(isMigration) {
			this.#isMigration = isMigration;
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: crm_integration_analytics.Dictionary.TOOL_CRM,
				category: crm_integration_analytics.Dictionary.CATEGORY_IMPORT,
				event: crm_integration_analytics.Dictionary.EVENT_IMPORT_VIEW,
				type: getAnalyticsEntityType(this.#entityType),
				c_sub_section: this.#origin,
				c_element: this.#isMigration ? 'migration_button' : null,
				p1: crm_integration_analytics.getCrmMode()
			});
		}
	}

	class EditEvent {
		#entityType;
		#origin = null;
		#control = null;
		#status = null;
		#duplicateControl = null;
		static createDefault(entityType) {
			const self = new EditEvent();
			self.#entityType = entityType;
			return self;
		}
		setOrigin(origin) {
			this.#origin = origin;
			return this;
		}
		setIsDefaultOpened() {
			this.#control = 'import_default_opened';
			return this;
		}
		setIsImportRequisite() {
			this.#control = 'import_requisite';
			return this;
		}
		setIsDeleteButton() {
			this.#control = 'delete_button';
			return this;
		}
		setIsCreateButton() {
			this.#control = 'create_button';
			return this;
		}
		unsetControl() {
			this.#control = null;
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		setDuplicateControl(duplicateControl) {
			this.#duplicateControl = duplicateControl?.toLowerCase();
			return this;
		}
		buildData() {
			let p2 = null;
			if (this.#duplicateControl) {
				p2 = `importDuplicateControlType_${this.#duplicateControl}`;
			}
			return filterOutNilValues({
				tool: crm_integration_analytics.Dictionary.TOOL_CRM,
				category: crm_integration_analytics.Dictionary.CATEGORY_IMPORT,
				event: crm_integration_analytics.Dictionary.EVENT_IMPORT_EDIT,
				type: getAnalyticsEntityType(this.#entityType),
				c_sub_section: this.#origin,
				c_element: this.#control,
				status: this.#status,
				p1: crm_integration_analytics.getCrmMode(),
				p2
			});
		}
	}

	class CreateEvent {
		#entityType;
		#origin = null;
		#importCompleteElement = null;
		#successCount = null;
		#errorCount = null;
		#duplicateCount = null;
		#status = null;
		static createDefault(entityType) {
			const self = new CreateEvent();
			self.#entityType = entityType;
			return self;
		}
		setOrigin(origin) {
			this.#origin = origin;
			return this;
		}
		setImportCompleteButton(element) {
			this.#importCompleteElement = element;
			return this;
		}
		setSuccessCount(successCount) {
			this.#successCount = successCount;
			return this;
		}
		setErrorCount(errorCount) {
			this.#errorCount = errorCount;
			return this;
		}
		setDuplicateCount(duplicateCount) {
			this.#duplicateCount = duplicateCount;
			return this;
		}
		setStatus(status) {
			this.#status = status;
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: crm_integration_analytics.Dictionary.TOOL_CRM,
				category: crm_integration_analytics.Dictionary.CATEGORY_IMPORT,
				event: crm_integration_analytics.Dictionary.EVENT_IMPORT_CREATE,
				type: getAnalyticsEntityType(this.#entityType),
				c_sub_section: this.#origin,
				c_element: this.#importCompleteElement,
				status: this.#status,
				p1: crm_integration_analytics.getCrmMode(),
				p2: this.moreZeroOrNull('successCount', this.#successCount),
				p3: this.moreZeroOrNull('errorCount', this.#errorCount),
				p4: this.moreZeroOrNull('duplicateCount', this.#duplicateCount)
			});
		}
		moreZeroOrNull(key, value) {
			if (main_core.Type.isNumber(value) && value > 0) {
				return `${key}_${value}`;
			}
			return null;
		}
	}

	class CancelEvent {
		#entityType;
		#origin;
		#step;
		static createDefault(entityType) {
			const self = new CancelEvent();
			self.#entityType = entityType;
			return self;
		}
		setOrigin(origin) {
			this.#origin = origin;
			return this;
		}
		setStep(step) {
			this.#step = step;
			return this;
		}
		buildData() {
			return filterOutNilValues({
				tool: crm_integration_analytics.Dictionary.TOOL_CRM,
				category: crm_integration_analytics.Dictionary.CATEGORY_IMPORT,
				event: crm_integration_analytics.Dictionary.EVENT_IMPORT_CANCEL,
				type: getAnalyticsEntityType(this.#entityType),
				c_sub_section: this.#origin,
				p1: crm_integration_analytics.getCrmMode(),
				p2: this.filledStringOrNull('step', this.#step)
			});
		}
		filledStringOrNull(key, value) {
			if (main_core.Type.isStringFilled(value)) {
				return `${key}_${value}`;
			}
			return null;
		}
	}

	const Builder = Object.freeze({
		Entity: {
			AddEvent: AddEvent,
			ConvertEvent: ConvertEvent,
			ConvertBatchEvent: ConvertBatchEvent,
			CloseEvent: CloseEvent$3,
			ChangeStageEvent: ChangeStageEvent
		},
		AI: {
			CallParsingEvent: CallParsingEvent
		},
		Automation: {
			AutomatedSolution: {
				CreateEvent: CreateEvent$2,
				EditEvent: EditEvent$3,
				DeleteEvent: DeleteEvent$2
			},
			Type: {
				CreateEvent: CreateEvent$1,
				EditEvent: EditEvent$2,
				DeleteEvent: DeleteEvent$1
			}
		},
		Block: {
			CloseEvent: CloseEvent$4,
			EnableEvent: EnableEvent,
			LinkEvent: LinkEvent
		},
		Communication: {
			DeleteEvent: DeleteEvent,
			FormEvent: FormEvent,
			SendEvent: SendEvent,
			Channel: {
				ConnectEvent: ConnectEvent,
				InviteEvent: InviteEvent
			},
			Editor: {
				SendEvent: SendEvent$1,
				ResendEvent: ResendEvent
			}
		},
		RepeatSale: {
			Banner: {
				ViewEvent: ViewEvent$4,
				ClickEvent: ClickEvent$2,
				CloseEvent: CloseEvent$2
			},
			Segment: {
				ViewEvent: ViewEvent$3,
				CancelEvent: CancelEvent$1,
				EditEvent: EditEvent$1
			}
		},
		OldEntityView: {
			OldInvoiceReadonly: {
				ViewEvent: ViewEvent$2,
				ClickEvent: ClickEvent$1,
				CloseEvent: CloseEvent$1
			}
		},
		EInvoicePromo: {
			ViewEvent: ViewEvent$1,
			ClickEvent: ClickEvent,
			CloseEvent: CloseEvent
		},
		Import: {
			ViewEvent: ViewEvent,
			EditEvent: EditEvent,
			CreateEvent: CreateEvent,
			CancelEvent: CancelEvent
		}
	});

	exports.Builder = Builder;
	exports.Dictionary = Dictionary;
	exports.getCrmMode = getCrmMode;

})(this.BX.Crm.Integration.Analytics = this.BX.Crm.Integration.Analytics || {}, BX, BX.Crm.Integration.Analytics);
//# sourceMappingURL=analytics.bundle.js.map
