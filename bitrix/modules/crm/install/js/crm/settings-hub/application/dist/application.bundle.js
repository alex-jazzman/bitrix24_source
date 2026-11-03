/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.SettingsHub = this.BX.Crm.SettingsHub || {};
(function (exports, main_core, ui_notification, ui_vue3, ui_vue3_mixins_locMixin, ui_system_input_vue, ui_vue3_components_popup, ui_vue3_components_button, ui_iconSet_api_vue, ui_iconSet_outline, ui_buttons, ui_system_label, ui_system_label_vue, ui_vue3_components_switcher, ui_switcher) {
	'use strict';

	const CrmSettingsHubHubSearch = ui_vue3.defineComponent({
		name: 'CrmSettingsHubHubSearch',
		components: {
			BInput: ui_system_input_vue.BInput
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			modelValue: {
				type: String,
				required: true
			}
		},
		emits: ['update:modelValue', 'clear', 'focus'],
		setup() {
			return {
				InputDesign: ui_system_input_vue.InputDesign,
				InputSize: ui_system_input_vue.InputSize
			};
		},
		computed: {
			placeholderText() {
				return this.loc('CRM_SETTINGS_HUB_SEARCH_PLACEHOLDER');
			}
		},
		template: `
		<div
			class="crm-settings-hub-application__search"
			data-testid="crm-settings-hub-application-search-input"
			role="search"
		>
			<BInput
				:model-value="modelValue"
				:placeholder="placeholderText"
				:aria-label="placeholderText"
				type="search"
				:size="InputSize.Lg"
				:design="InputDesign.Grey"
				:with-search="true"
				:with-clear="modelValue !== ''"
				:stretched="true"
				@update:model-value="$emit('update:modelValue', $event)"
				@clear="$emit('clear')"
				@focus="$emit('focus')"
			/>
		</div>
	`
	});

	const CrmSettingsHubHubSidebar = ui_vue3.defineComponent({
		name: 'CrmSettingsHubHubSidebar',
		components: {
			CrmSettingsHubHubSearch
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			sections: {
				type: Array,
				required: true
			},
			selectedId: {
				type: String,
				default: null
			},
			query: {
				type: String,
				required: true
			}
		},
		emits: ['select-section', 'update-query', 'clear-query'],
		computed: {
			menuTitle() {
				return this.loc('CRM_SETTINGS_HUB_TITLE');
			},
			emptyMenuText() {
				return this.loc('CRM_SETTINGS_HUB_MENU_EMPTY');
			}
		},
		template: `
		<aside
			class="crm-settings-hub-application__menu"
			data-testid="crm-settings-hub-application-sidebar"
			:aria-label="menuTitle"
		>
			<div class="crm-settings-hub-application__menu-title">{{ menuTitle }}</div>
			<CrmSettingsHubHubSearch
				:model-value="query"
				@update:model-value="$emit('update-query', $event)"
				@clear="$emit('clear-query')"
			/>
			<nav
				class="crm-settings-hub-application__menu-list"
				data-testid="crm-settings-hub-application-sidebar-menu-list"
			>
				<button
					v-for="section in sections"
					:key="section.id"
					type="button"
					class="crm-settings-hub-application__menu-item"
					:class="{ '--active': section.id === selectedId }"
					:data-testid="'crm-settings-hub-application-menu-' + section.id"
					:aria-current="section.id === selectedId ? 'page' : null"
					@click="section.id !== selectedId && $emit('select-section', section.id)"
				>
					<span class="crm-settings-hub-application__menu-text">{{ section.title }}</span>
				</button>
				<div v-if="sections.length === 0" class="crm-settings-hub-application__menu-empty">
					{{ emptyMenuText }}
				</div>
			</nav>
		</aside>
	`
	});

	const navigation = {
		kind: 'navigation'
	};
	const aiTuningMutationGroup = 'ai:tuning';
	function v2(code, valuePath) {
		return {
			kind: 'v2',
			code,
			valuePath
		};
	}
	function aiTuning(code) {
		return {
			kind: 'v2',
			code,
			mutationGroup: aiTuningMutationGroup
		};
	}
	const settingBindingRegistry = new Map([['enable_slider', v2('crm.layout.slider.enabled')], ['enable_user_name_sorting', v2('crm.layout.user_name_sorting.enabled')], ['lead_opened_flag', v2('crm.lead.opened')], ['lead_default_list_view', v2('crm.lead.default_list_view')], ['enable_auto_gen_rc', v2('crm.lead.return_customer_auto_generation.enabled')], ['enable_auto_using_finished_lead', v2('crm.lead.finished_for_return_customer.enabled')], ['contact_opened_flag', v2('crm.contact.opened')], ['contact_default_list_view', v2('crm.contact.default_list_view')], ['company_opened_flag', v2('crm.company.opened')], ['company_default_list_view', v2('crm.company.default_list_view')], ['deal_opened_flag', v2('crm.deal.opened')], ['deal_default_list_view', v2('crm.deal.default_list_view')], ['enable_close_date_sync', v2('crm.deal.close_date_sync.enabled')], ['invoice_default_list_view', v2('crm.invoice.default_list_view')], ['quote_opened_flag', v2('crm.quote.opened')], ['conversion_enable_autocreate', v2('crm.conversion.autocreation.enabled')], ['crm_sender', v2('crm.notifications.sender')], ['rest_enable_req_uf_check', v2('crm.rest.required_user_field_check.enabled')], ['is_create_calendar_event_for_call', v2('crm.activity.call_creates_calendar_event.enabled')], ['act_cal_show_compl_call', v2('crm.activity.calendar.completed_calls.displayed')], ['act_cal_show_compl_meeting', v2('crm.activity.calendar.completed_meetings.displayed')], ['act_cal_keep_reassign_call', v2('crm.activity.calendar.reassigned_calls.kept')], ['act_cal_keep_reassign_meeting', v2('crm.activity.calendar.reassigned_meetings.kept')], ['act_task_keep_unbound', v2('crm.activity.unbound_tasks.kept')], ['is_counters_use_activity_responsible', v2('crm.counter.activity_responsible.used')], ['lead_act_completion_cfg', v2('crm.lead.conversion.completed_activity_provider_codes')], ['activity_remove_entity_badges_interval_days', v2('crm.activity.entity_badge_removal_days')], ['act_mark_fwd_emai_outgoing', v2('crm.activity.forwarded_email_as_outgoing.enabled')], ['activity_enable_unconnected_recipients', v2('crm.activity.unconnected_recipients.enabled')], ['activity_outgoing_email_owner_type', v2('crm.activity.outgoing_email_owner_type')], ['email_service_code_allocation', v2('crm.email.service_code_allocation')], ['enable_b24_email_sign', v2('crm.email.bitrix24_signature.enabled')], ['history_enable_export_event', v2('crm.history.export_event.enabled')], ['history_enable_view_event', v2('crm.history.view_event.enabled')], ['history_view_event_group_interval', v2('crm.history.view_event_grouping_interval')], ['history_enable_lead_rm_event', v2('crm.history.lead_deletion_event.enabled')], ['history_enable_contact_rm_event', v2('crm.history.contact_deletion_event.enabled')], ['history_enable_company_rm_event', v2('crm.history.company_deletion_event.enabled')], ['history_enable_deal_rm_event', v2('crm.history.deal_deletion_event.enabled')], ['history_enable_quote_rm_event', v2('crm.history.quote_deletion_event.enabled')], ['prsn_nm_frmt_id', v2('crm.format.person_name')], ['callto_frmt', v2('crm.format.callto', 'format')], ['callto_url_template', v2('crm.format.callto', 'urlTemplate')], ['callto_click_handler', v2('crm.format.callto', 'clickHandler')], ['callto_normalize_number', v2('crm.format.callto', 'normalizeNumber')], ['enable_simple_time_format', v2('crm.format.simple_time.enabled')], ['ent_addr_frmt_id', v2('crm.format.entity_address')], ['dup_ctrl_lead', v2('crm.duplicate_control.lead.enabled')], ['dup_ctrl_contact', v2('crm.duplicate_control.contact.enabled')], ['dup_ctrl_company', v2('crm.duplicate_control.company.enabled')], ['enable_depricated_statuses', v2('crm.status.deprecated.enabled')], ['enable_lead_recycle_bin', v2('crm.recycle_bin.lead.enabled')], ['enable_contact_recycle_bin', v2('crm.recycle_bin.contact.enabled')], ['enable_company_recycle_bin', v2('crm.recycle_bin.company.enabled')], ['enable_deal_recycle_bin', v2('crm.recycle_bin.deal.enabled')], ['recyclebin_ttl', v2('crm.recycle_bin.ttl_days')], ['permissions', navigation], ['bizproc', navigation], ['deal_automation', navigation], ['lead_automation', navigation], ['order_automation', navigation], ['currencies', navigation], ['measures', navigation], ['product_props', navigation], ['taxes', navigation], ['integrations', navigation], ['mail_sendsave', navigation], ['mail_templates', navigation], ['mail_tracker', navigation], ['sms_limits', navigation], ['sms_marketplace', navigation], ['doc_numerators', navigation], ['my_companies_requisites', navigation], ['numerator_invoices_old', navigation], ['numerator_invoices', navigation], ['numerator_quotes', navigation], ['payment_marketplace', navigation], ['payment_systems', navigation], ['requisites_templates', navigation], ['volume', navigation], ['crm_migration', navigation], ['external_sale', navigation], ['integrations_1c', navigation], ['integrations_sms', navigation], ['app_configuration', navigation], ['marketplace', navigation], ['analytics_reports', navigation], ['directories', navigation], ['locations', navigation], ['pipelines', navigation], ['stop_list', navigation], ['user_fields', navigation], ['ai_call_processing_auto', v2('crm.copilot.call_processing.automatic.enabled')], ['copilot_analyze_communication', aiTuning('crm.copilot.analyze_communication.enabled')], ['copilot_call_assessment', aiTuning('crm.copilot.call_assessment.enabled')], ['copilot_fill_crm_text', aiTuning('crm.copilot.fill_crm_text.enabled')], ['copilot_fill_item_from_call', aiTuning('crm.copilot.fill_item_from_call.enabled')], ['copilot_message_sender_editor', aiTuning('crm.copilot.message_sender_editor.enabled')], ['copilot_repeat_sale', aiTuning('crm.copilot.repeat_sale.enabled')], ['copilot_summarize', aiTuning('crm.copilot.summarize.enabled')]]);

	function fail$1(path, message) {
		throw new TypeError(`Invalid settings presentation at ${path}: ${message}`);
	}
	function isPlainRecord(value) {
		return main_core.Type.isPlainObject(value);
	}
	function readRecord$1(value, path) {
		return isPlainRecord(value) ? value : fail$1(path, 'plain object expected');
	}
	function assertExactKeys$1(record, keys, path) {
		const actualKeys = Object.keys(record);
		if (actualKeys.length !== keys.length || actualKeys.some(key => !keys.includes(key))) {
			fail$1(path, `expected fields ${keys.join(', ')}`);
		}
	}
	function readString(value, path) {
		return main_core.Type.isString(value) ? value : fail$1(path, 'string expected');
	}
	function readNonEmptyString(value, path) {
		const result = readString(value, path);
		return result === '' ? fail$1(path, 'non-empty string expected') : result;
	}
	function readNullableString(value, path) {
		return value === null ? null : readString(value, path);
	}
	function readBoolean(value, path) {
		return main_core.Type.isBoolean(value) ? value : fail$1(path, 'boolean expected');
	}
	function readInteger(value, path) {
		return Number.isInteger(value) ? value : fail$1(path, 'integer expected');
	}
	function readNullableInteger(value, path) {
		return value === null ? null : readInteger(value, path);
	}
	function parseScalarValue(value, path) {
		if (main_core.Type.isBoolean(value) || main_core.Type.isString(value)) {
			return value;
		}
		return readInteger(value, path);
	}
	function parseOption(value, path) {
		const option = readRecord$1(value, path);
		assertExactKeys$1(option, ['value', 'title', 'hint'], path);
		return {
			value: parseScalarValue(option.value, `${path}.value`),
			title: readString(option.title, `${path}.title`),
			hint: readNullableString(option.hint, `${path}.hint`)
		};
	}
	function parseOptions(value, path) {
		if (!Array.isArray(value) || value.length === 0) {
			fail$1(path, 'non-empty options list expected');
		}
		const options = value.map((option, index) => parseOption(option, `${path}[${index}]`));
		for (const [index, option] of options.entries()) {
			if (options.slice(0, index).some(existing => existing.value === option.value)) {
				fail$1(`${path}[${index}].value`, 'duplicate option value');
			}
		}
		return options;
	}
	function parseObjectField(value, path) {
		const field = readRecord$1(value, path);
		assertExactKeys$1(field, ['code', 'title', 'hint', 'required', 'schema'], path);
		return {
			code: readNonEmptyString(field.code, `${path}.code`),
			title: readString(field.title, `${path}.title`),
			hint: readNullableString(field.hint, `${path}.hint`),
			required: readBoolean(field.required, `${path}.required`),
			schema: parseSettingSchema(field.schema, `${path}.schema`)
		};
	}
	function parseIntegerSchema(schema, path) {
		assertExactKeys$1(schema, ['type', 'min', 'max', 'step'], path);
		const min = readNullableInteger(schema.min, `${path}.min`);
		const max = readNullableInteger(schema.max, `${path}.max`);
		const step = readInteger(schema.step, `${path}.step`);
		if (step < 1 || min !== null && max !== null && min > max) {
			fail$1(path, 'invalid integer constraints');
		}
		return {
			type: 'integer',
			min,
			max,
			step
		};
	}
	function parseStringSchema(schema, path) {
		assertExactKeys$1(schema, ['type', 'minLength', 'maxLength'], path);
		const minLength = readNullableInteger(schema.minLength, `${path}.minLength`);
		const maxLength = readNullableInteger(schema.maxLength, `${path}.maxLength`);
		if (minLength !== null && minLength < 0 || maxLength !== null && maxLength < 0 || minLength !== null && maxLength !== null && minLength > maxLength) {
			fail$1(path, 'invalid string constraints');
		}
		return {
			type: 'string',
			minLength,
			maxLength
		};
	}
	function parseObjectSchema(schema, path) {
		assertExactKeys$1(schema, ['type', 'fields'], path);
		if (!Array.isArray(schema.fields) || schema.fields.length === 0) {
			fail$1(`${path}.fields`, 'non-empty fields list expected');
		}
		const fields = schema.fields.map((field, index) => parseObjectField(field, `${path}.fields[${index}]`));
		for (const [index, field] of fields.entries()) {
			if (fields.slice(0, index).some(existing => existing.code === field.code)) {
				fail$1(`${path}.fields[${index}].code`, 'duplicate object field');
			}
		}
		return {
			type: 'object',
			fields
		};
	}
	function parseSettingSchema(value, path) {
		const schema = readRecord$1(value, path);
		const type = readString(schema.type, `${path}.type`);
		switch (type) {
			case 'boolean':
				assertExactKeys$1(schema, ['type'], path);
				return {
					type
				};
			case 'integer':
				return parseIntegerSchema(schema, path);
			case 'string':
				return parseStringSchema(schema, path);
			case 'select':
			case 'multiSelect':
				assertExactKeys$1(schema, ['type', 'options'], path);
				return {
					type,
					options: parseOptions(schema.options, `${path}.options`)
				};
			case 'object':
				return parseObjectSchema(schema, path);
			default:
				return fail$1(`${path}.type`, `unknown schema type "${type}"`);
		}
	}
	function parseIntegerValue(value, schema, path) {
		const integer = readInteger(value, path);
		const stepBase = schema.min ?? 0;
		if (schema.min !== null && integer < schema.min || schema.max !== null && integer > schema.max || (integer - stepBase) % schema.step !== 0) {
			fail$1(path, 'integer violates schema constraints');
		}
		return integer;
	}
	function parseStringValue(value, schema, path) {
		const string = readString(value, path);
		const length = [...string].length;
		if (schema.minLength !== null && length < schema.minLength || schema.maxLength !== null && length > schema.maxLength) {
			fail$1(path, 'string violates schema constraints');
		}
		return string;
	}
	function parseSelectValue(value, schema, path) {
		const scalar = parseScalarValue(value, path);
		if (!schema.options.some(option => option.value === scalar)) {
			fail$1(path, 'value is not an allowed option');
		}
		return scalar;
	}
	function parseMultiSelectValue(value, schema, path) {
		if (!Array.isArray(value)) {
			fail$1(path, 'list expected');
		}
		const result = value.map((item, index) => parseScalarValue(item, `${path}[${index}]`));
		for (const [index, item] of result.entries()) {
			if (!schema.options.some(option => option.value === item)) {
				fail$1(`${path}[${index}]`, 'value is not an allowed option');
			}
			if (result.slice(0, index).includes(item)) {
				fail$1(`${path}[${index}]`, 'duplicate value');
			}
		}
		return result;
	}
	function parseObjectValue(value, schema, path) {
		const object = readRecord$1(value, path);
		const fieldsByCode = new Map(schema.fields.map(field => [field.code, field]));
		for (const code of Object.keys(object)) {
			if (!fieldsByCode.has(code)) {
				fail$1(`${path}.${code}`, 'unknown object field');
			}
		}
		const result = {};
		for (const field of schema.fields) {
			if (!Object.hasOwn(object, field.code)) {
				if (field.required) {
					fail$1(`${path}.${field.code}`, 'required object field is missing');
				}
				continue;
			}
			result[field.code] = parseValue(object[field.code], field.schema, `${path}.${field.code}`);
		}
		return result;
	}
	function parseValue(value, schema, path) {
		switch (schema.type) {
			case 'boolean':
				return readBoolean(value, path);
			case 'integer':
				return parseIntegerValue(value, schema, path);
			case 'string':
				return parseStringValue(value, schema, path);
			case 'select':
				return parseSelectValue(value, schema, path);
			case 'multiSelect':
				return parseMultiSelectValue(value, schema, path);
			case 'object':
				return parseObjectValue(value, schema, path);
			default:
				return fail$1(path, 'unknown schema type');
		}
	}
	function parseSettingPresentation(value, path) {
		const setting = readRecord$1(value, path);
		assertExactKeys$1(setting, ['code', 'value', 'visible', 'canEdit', 'meta'], path);
		if (setting.visible !== true) {
			fail$1(`${path}.visible`, 'literal true expected');
		}
		const meta = readRecord$1(setting.meta, `${path}.meta`);
		assertExactKeys$1(meta, ['title', 'hint', 'schema'], `${path}.meta`);
		const schema = parseSettingSchema(meta.schema, `${path}.meta.schema`);
		return {
			code: readNonEmptyString(setting.code, `${path}.code`),
			value: parseValue(setting.value, schema, `${path}.value`),
			visible: true,
			canEdit: readBoolean(setting.canEdit, `${path}.canEdit`),
			meta: {
				title: readString(meta.title, `${path}.meta.title`),
				hint: readNullableString(meta.hint, `${path}.meta.hint`),
				schema
			}
		};
	}
	function parseSettingsPresentation(value) {
		const presentation = readRecord$1(value, 'root');
		assertExactKeys$1(presentation, ['settings'], 'root');
		if (!Array.isArray(presentation.settings)) {
			fail$1('root.settings', 'list expected');
		}
		const settings = presentation.settings.map((setting, index) => parseSettingPresentation(setting, `root.settings[${index}]`));
		const codes = new Set();
		for (const setting of settings) {
			if (codes.has(setting.code)) {
				fail$1('root.settings', `duplicate setting code "${setting.code}"`);
			}
			codes.add(setting.code);
		}
		return {
			settings
		};
	}
	function getProjectedSetting(setting, valuePath) {
		if (valuePath === undefined) {
			return {
				value: setting.value,
				title: setting.meta.title,
				hint: setting.meta.hint,
				schema: setting.meta.schema
			};
		}
		if (setting.meta.schema.type !== 'object' || !isPlainRecord(setting.value)) {
			return fail$1(setting.code, `object schema expected for value path "${valuePath}"`);
		}
		const field = setting.meta.schema.fields.find(item => item.code === valuePath);
		if (field === undefined || !Object.hasOwn(setting.value, valuePath)) {
			return fail$1(setting.code, `value path "${valuePath}" is missing`);
		}
		return {
			value: setting.value[valuePath],
			title: field.title,
			hint: field.hint,
			schema: field.schema
		};
	}
	function createHydratedState(setting, binding) {
		const projected = getProjectedSetting(setting, binding.valuePath);
		const commonState = {
			state: 'explicit',
			raw: projected.value,
			code: setting.code,
			valuePath: binding.valuePath,
			canEdit: setting.canEdit,
			title: projected.title,
			hint: projected.hint,
			schema: projected.schema,
			setting
		};
		if (projected.schema.type === 'select') {
			return {
				...commonState,
				label: projected.schema.options.find(option => option.value === projected.value)?.title
			};
		}
		if (projected.schema.type === 'string' || projected.schema.type === 'integer') {
			return {
				...commonState,
				label: String(projected.value)
			};
		}
		if (projected.schema.type === 'multiSelect' && Array.isArray(projected.value)) {
			const selectedValues = projected.value;
			return {
				...commonState,
				matrix: {
					types: projected.schema.options.map(option => ({
						id: String(option.value),
						name: option.title,
						checked: selectedValues.includes(option.value)
					}))
				}
			};
		}
		return commonState;
	}
	function hydrateSettingsPresentation(value) {
		const presentation = parseSettingsPresentation(value);
		const settingsByCode = new Map(presentation.settings.map(setting => [setting.code, setting]));
		const settingsState = {};
		const visibleSettingIds = new Set();
		for (const [id, binding] of settingBindingRegistry) {
			if (binding.kind === 'navigation') {
				visibleSettingIds.add(id);
				continue;
			}
			if (binding.kind === 'unsupported') {
				continue;
			}
			const setting = settingsByCode.get(binding.code);
			if (setting === undefined) {
				continue;
			}
			settingsState[id] = createHydratedState(setting, binding);
			visibleSettingIds.add(id);
		}
		return {
			presentation,
			settingsByCode,
			settingsState,
			visibleSettingIds
		};
	}

	const settingsStateKey = Symbol('crm-settings-hub-settings-state');
	const unknownSettingState = {
		state: 'undefined'
	};
	const ignoreUpdate = async () => {};
	function isHydratedPresentation(value) {
		return 'settingsByCode' in value && value.settingsByCode instanceof Map;
	}
	function isPresentation(value) {
		return 'settings' in value && Array.isArray(value.settings);
	}
	function isRuntimeContext(value) {
		if (!('get' in value) || !('update' in value) || !('isPending' in value)) {
			return false;
		}
		return main_core.Type.isFunction(value.get) && main_core.Type.isFunction(value.update) && main_core.Type.isFunction(value.isPending);
	}
	function collectSchemaSearchText(schema) {
		if (schema.type === 'select' || schema.type === 'multiSelect') {
			return schema.options.flatMap(option => [option.title, option.hint ?? '']);
		}
		if (schema.type === 'object') {
			return schema.fields.flatMap(field => [field.title, field.hint ?? '', ...collectSchemaSearchText(field.schema)]);
		}
		return [];
	}
	function resolveHydratedPresentation(input) {
		if (isHydratedPresentation(input)) {
			return input;
		}
		return isPresentation(input) ? hydrateSettingsPresentation(input) : null;
	}
	function replacePresentationSetting(presentation, snapshot) {
		const hasSetting = presentation.settings.some(setting => setting.code === snapshot.code);
		const settings = presentation.settings.map(setting => setting.code === snapshot.code ? snapshot : setting);
		return {
			settings: hasSetting ? settings : [...settings, snapshot]
		};
	}
	function updatePendingCodes(pendingCodes, code, pending) {
		const nextPendingCodes = new Set(pendingCodes);
		if (pending) {
			nextPendingCodes.add(code);
		} else {
			nextPendingCodes.delete(code);
		}
		return nextPendingCodes;
	}
	function createSettingsStateContext(input) {
		const initialHydrated = resolveHydratedPresentation(input);
		const hydrated = ui_vue3.shallowRef(initialHydrated);
		const legacyState = ui_vue3.shallowRef(initialHydrated === null ? input : {});
		const pendingCodes = ui_vue3.shallowRef(new Set());
		let updateHandler = ignoreUpdate;
		function replacePresentation(presentation) {
			hydrated.value = hydrateSettingsPresentation(presentation);
			legacyState.value = {};
		}
		function replaceSetting(snapshot) {
			const current = hydrated.value;
			if (current === null) {
				return;
			}
			replacePresentation(replacePresentationSetting(current.presentation, snapshot));
		}
		const controller = {
			get(id) {
				return hydrated.value?.settingsState[id] ?? legacyState.value[id] ?? unknownSettingState;
			},
			async update(id, value) {
				await updateHandler(id, value);
			},
			isPending(id) {
				const code = hydrated.value?.settingsState[id]?.code;
				return code !== undefined && pendingCodes.value.has(code);
			},
			applyOptimisticValue(code, value) {
				const setting = hydrated.value?.settingsByCode.get(code);
				if (setting === undefined) {
					throw new TypeError(`Unknown setting code: "${code}"`);
				}
				replaceSetting({
					...setting,
					value
				});
			},
			getHydrated(id) {
				return hydrated.value?.settingsState[id] ?? null;
			},
			getPresentation() {
				return hydrated.value?.presentation ?? null;
			},
			getSearchText(id) {
				const state = hydrated.value?.settingsState[id];
				if (state === undefined) {
					return [];
				}
				return [state.title, state.hint ?? '', ...collectSchemaSearchText(state.schema)];
			},
			isCodePending(code) {
				return pendingCodes.value.has(code);
			},
			isVisible(id) {
				return hydrated.value?.visibleSettingIds.has(id) ?? Object.hasOwn(legacyState.value, id);
			},
			replacePresentation,
			restoreSnapshot(snapshot) {
				replaceSetting(snapshot);
			},
			setPending(code, pending) {
				pendingCodes.value = updatePendingCodes(pendingCodes.value, code, pending);
			},
			setUpdateHandler(handler) {
				updateHandler = handler;
			}
		};
		return controller;
	}
	function provideSettingsState(input) {
		const context = isRuntimeContext(input) ? input : createSettingsStateContext(input);
		ui_vue3.provide(settingsStateKey, context);
		return context;
	}
	function useSettingsStateContext() {
		const context = ui_vue3.inject(settingsStateKey, null);
		if (context === null) {
			throw new Error('CRM Settings Hub settings state provider is missing');
		}
		return context;
	}
	function useSettingState(id) {
		return useSettingsStateContext().get(id);
	}

	const CrmSettingsHubMatrixDialog = ui_vue3.defineComponent({
		name: 'CrmSettingsHubMatrixDialog',
		components: {
			Popup: ui_vue3_components_popup.Popup,
			UiButton: ui_vue3_components_button.Button
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			settingId: {
				type: String,
				default: null
			},
			matrix: {
				type: Object,
				default: null
			},
			open: {
				type: Boolean,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				settingsStateContext: useSettingsStateContext(),
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				initialSelectedIds: [],
				selectedIds: []
			};
		},
		computed: {
			pending() {
				return this.settingId !== null && this.settingsStateContext.isPending(this.settingId);
			},
			controlsDisabled() {
				return this.settingId === null || this.settingsStateContext.get(this.settingId).canEdit !== true || this.pending;
			},
			popupId() {
				return 'crm-settings-hub-application-matrix-dialog';
			},
			titleId() {
				return `${this.popupId}-title`;
			},
			popupOptions() {
				return {
					id: this.popupId,
					className: 'crm-settings-hub-application-matrix-dialog',
					ariaLabelledBy: this.titleId,
					bindElement: window,
					width: 480,
					overlay: true,
					closeByEsc: true,
					autoHide: true,
					closeIcon: true,
					cacheable: false,
					padding: 0,
					animation: 'fading-slide'
				};
			},
			title() {
				return this.loc('CRM_SETTINGS_HUB_MATRIX_TITLE');
			},
			subtitle() {
				return this.loc('CRM_SETTINGS_HUB_MATRIX_SUBTITLE');
			},
			emptyText() {
				return this.loc('CRM_SETTINGS_HUB_MATRIX_EMPTY');
			},
			isDirty() {
				const initialSelectedIds = this.normalizeSelectedIds(this.initialSelectedIds);
				const selectedIds = this.normalizeSelectedIds(this.selectedIds);
				return initialSelectedIds.length !== selectedIds.length || initialSelectedIds.some((id, index) => id !== selectedIds[index]);
			}
		},
		watch: {
			open: {
				immediate: true,
				handler(isOpen) {
					if (isOpen) {
						this.syncSelection();
					}
				}
			}
		},
		mounted() {
			this.markPopupTestIds();
		},
		updated() {
			this.markPopupTestIds();
		},
		methods: {
			normalizeSelectedIds(selectedIds) {
				const selectedIdsSet = new Set(selectedIds);
				return this.matrix?.types.filter(type => selectedIdsSet.has(type.id)).map(type => type.id) ?? [];
			},
			syncSelection() {
				const selectedIds = this.matrix?.types.filter(type => type.checked === true).map(type => type.id) ?? [];
				this.initialSelectedIds = [...selectedIds];
				this.selectedIds = [...selectedIds];
			},
			isSelected(id) {
				return this.selectedIds.includes(id);
			},
			handleSelectionChange(id, event) {
				if (this.controlsDisabled) {
					return;
				}
				const checked = event.target.checked;
				this.selectedIds = this.normalizeSelectedIds(checked ? [...new Set([...this.selectedIds, id])] : this.selectedIds.filter(selectedId => selectedId !== id));
			},
			async handleSave() {
				const settingId = this.settingId;
				if (settingId === null || this.controlsDisabled) {
					return;
				}
				if (!this.isDirty) {
					this.handleCancel();
					return;
				}
				try {
					await this.settingsStateContext.update(settingId, this.normalizeSelectedIds(this.selectedIds));
				} finally {
					this.handleCancel();
				}
			},
			handleCancel() {
				this.$emit('close');
			},
			markPopupTestIds() {
				const popup = this.$refs.popup;
				const container = popup?.container;
				if (container instanceof HTMLElement) {
					container.dataset.testid = this.popupId;
					const closeButton = container.querySelector('.popup-window-close-icon');
					if (closeButton !== null) {
						closeButton.dataset.testid = `${this.popupId}-close`;
					}
				}
				const overlay = document.getElementById(`popup-window-overlay-${this.popupId}`);
				if (overlay !== null) {
					overlay.dataset.testid = `${this.popupId}-overlay`;
				}
			}
		},
		template: `
		<Popup
			v-if="open && matrix"
			ref="popup"
			:id="popupId"
			:options="popupOptions"
			@close="handleCancel"
		>
			<div
				class="crm-settings-hub-application__matrix"
				data-testid="crm-settings-hub-application-matrix-dialog-content"
			>
				<div class="crm-settings-hub-application__matrix-header">
					<span :id="titleId" class="crm-settings-hub-application__matrix-title">{{ title }}</span>
					<span class="crm-settings-hub-application__matrix-subtitle">{{ subtitle }}</span>
				</div>
				<div
					v-if="matrix.types.length"
					class="crm-settings-hub-application__matrix-list"
					data-testid="crm-settings-hub-application-matrix-list"
				>
					<label
						v-for="type in matrix.types"
						:key="type.id"
						class="crm-settings-hub-application__matrix-row"
						:data-testid="'crm-settings-hub-application-matrix-row-' + type.id"
					>
						<input
							type="checkbox"
							class="crm-settings-hub-application__matrix-check"
							:data-testid="'crm-settings-hub-application-matrix-checkbox-' + type.id"
							:aria-label="type.name"
							:checked="isSelected(type.id)"
							:disabled="controlsDisabled"
							@change="handleSelectionChange(type.id, $event)"
						>
						<span class="crm-settings-hub-application__matrix-name">{{ type.name }}</span>
					</label>
				</div>
				<div
					v-else
					class="crm-settings-hub-application__matrix-empty"
					data-testid="crm-settings-hub-application-matrix-empty"
				>
					{{ emptyText }}
				</div>
				<div class="crm-settings-hub-application__matrix-actions">
					<UiButton
						:text="loc('UI_BUTTONS_SAVE_BTN_TEXT')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED_SUCCESS"
						:disabled="!isDirty || controlsDisabled"
						:loading="pending"
						:dataset="{ testid: 'crm-settings-hub-application-matrix-save' }"
						@click="handleSave"
					/>
					<UiButton
						:text="loc('UI_BUTTONS_CANCEL_BTN_TEXT')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.PLAIN"
						:disabled="pending"
						:dataset="{ testid: 'crm-settings-hub-application-matrix-cancel' }"
						@click="handleCancel"
					/>
				</div>
			</div>
		</Popup>
	`
	});

	const CrmSettingsHubEmptyState = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEmptyState',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			narrowed: {
				type: Boolean,
				required: true
			}
		},
		emits: ['reset'],
		setup() {
			return {
				searchIcon: ui_iconSet_api_vue.Outline.SEARCH
			};
		},
		computed: {
			title() {
				return this.loc(this.narrowed ? 'CRM_SETTINGS_HUB_EMPTY_SEARCH_TITLE' : 'CRM_SETTINGS_HUB_EMPTY_SECTION_TITLE');
			},
			text() {
				return this.loc(this.narrowed ? 'CRM_SETTINGS_HUB_EMPTY_SEARCH_TEXT' : 'CRM_SETTINGS_HUB_EMPTY_SECTION_TEXT');
			},
			resetText() {
				return this.loc('CRM_SETTINGS_HUB_SEARCH_RESET');
			}
		},
		template: `
		<div
			class="crm-settings-hub-application__empty"
			data-testid="crm-settings-hub-application-empty-state"
			role="status"
		>
			<BIcon :name="searchIcon" class="crm-settings-hub-application__empty-icon"/>
			<span class="crm-settings-hub-application__empty-title">{{ title }}</span>
			<span class="crm-settings-hub-application__empty-text">{{ text }}</span>
			<button
				v-if="narrowed"
				type="button"
				class="ui-btn ui-btn-light-border ui-btn-sm crm-settings-hub-application__empty-reset"
				data-testid="crm-settings-hub-application-empty-state-reset"
				@click="$emit('reset')"
			>
				{{ resetText }}
			</button>
		</div>
	`
	});

	const DEFAULT_SECTION_ICON = 'o-settings';
	const UNSAFE_SECTION_ICON_PATTERN = /[^\da-z-]/g;
	function resolveSectionIcon(icon) {
		const normalizedIcon = icon?.replaceAll(UNSAFE_SECTION_ICON_PATTERN, '') ?? '';
		return normalizedIcon === '' ? DEFAULT_SECTION_ICON : normalizedIcon;
	}

	const CrmSettingsHubSettingsBlock = ui_vue3.defineComponent({
		name: 'CrmSettingsHubSettingsBlock',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			id: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			icon: {
				type: String,
				default: ''
			},
			visible: {
				type: Boolean,
				required: true
			}
		},
		computed: {
			blockTitleId() {
				return `crm-settings-hub-settings-block-${this.id}-title`;
			},
			safeIcon() {
				return resolveSectionIcon(this.icon);
			}
		},
		template: `
		<section
			v-if="visible"
			class="crm-settings-hub-application__settings-block"
			:class="{ '--has-visible-settings': visible }"
			:data-testid="'crm-settings-hub-application-settings-block-' + id"
			role="region"
			:aria-labelledby="blockTitleId"
		>
			<header class="crm-settings-hub-application__settings-block-header">
				<BIcon
					v-if="icon"
					:name="safeIcon"
					class="crm-settings-hub-application__settings-block-icon"
				/>
				<h2
					:id="blockTitleId"
					class="crm-settings-hub-application__settings-block-title"
				>
					{{ title }}
				</h2>
			</header>
			<div
				class="crm-settings-hub-application__settings-block-content"
				:data-testid="'crm-settings-hub-application-settings-block-' + id + '-content'"
			>
				<slot />
			</div>
		</section>
	`
	});

	const CrmSettingsHubSettingsGroupPanel = ui_vue3.defineComponent({
		name: 'CrmSettingsHubSettingsGroupPanel',
		components: {
			CrmSettingsHubEmptyState,
			CrmSettingsHubSettingsBlock
		},
		props: {
			section: {
				type: Object,
				required: true
			},
			visibleSettingIds: {
				type: Set,
				required: true
			},
			isNarrowed: {
				type: Boolean,
				required: true
			}
		},
		emits: ['reset-search', 'activate'],
		computed: {
			titleId() {
				return `crm-settings-hub-settings-section-${this.section.id}-title`;
			},
			visibleBlocks() {
				return this.section.blocks.filter(block => this.hasVisibleSettings(block));
			}
		},
		methods: {
			visibleRootSettings(block) {
				return block.settings.filter(setting => setting.parentId === undefined && this.visibleSettingIds.has(setting.id));
			},
			hasVisibleSettings(block) {
				return this.visibleRootSettings(block).length > 0;
			},
			activate(action) {
				this.$emit('activate', action);
			},
			resetSearch() {
				this.$emit('reset-search');
			}
		},
		template: `
		<div
			class="crm-settings-hub-application__settings-panel"
			data-testid="crm-settings-hub-application-settings-panel"
		>
			<h1 :id="titleId" class="crm-settings-hub-application__title">{{ section.title }}</h1>
			<CrmSettingsHubSettingsBlock
				v-for="block in visibleBlocks"
				:key="block.id"
				:id="block.id"
				:title="block.title"
				:icon="block.icon"
				:visible="true"
			>
				<component
					:is="setting.component"
					v-for="setting in visibleRootSettings(block)"
					:key="setting.id"
					:data-testid="'crm-settings-hub-application-setting-' + setting.id"
					@activate="activate"
				/>
			</CrmSettingsHubSettingsBlock>
			<CrmSettingsHubEmptyState
				v-if="visibleSettingIds.size === 0"
				:narrowed="isNarrowed"
				@reset="resetSearch"
			/>
		</div>
	`
	});

	const navigationContextKey = Symbol('crm-settings-hub-navigation');
	function createNavigationContext(navigation) {
		return {
			get(navigationId) {
				return Object.hasOwn(navigation, navigationId) ? navigation[navigationId] : null;
			}
		};
	}
	function useNavigationContext() {
		const context = ui_vue3.inject(navigationContextKey, null);
		if (context === null) {
			throw new Error('CRM Settings Hub navigation provider is missing');
		}
		return context;
	}

	const ignoreUpdateError$1 = () => {};
	function isSettingObjectValue(value) {
		return main_core.Type.isPlainObject(value);
	}
	function applyOptimisticValues(presentation, optimisticValues) {
		return {
			settings: presentation.settings.map(setting => {
				const optimisticValue = optimisticValues.get(setting.code);
				return optimisticValue === undefined ? setting : {
					...setting,
					value: optimisticValue
				};
			})
		};
	}
	function createUpdateSetting(context, service, onError = ignoreUpdateError$1) {
		const mutationQueues = new Map();
		const optimisticValues = new Map();
		return async (id, projectedValue) => {
			const binding = settingBindingRegistry.get(id);
			const state = context.getHydrated(id);
			if (binding?.kind !== 'v2' || state === null || !state.canEdit || context.isCodePending(binding.code)) {
				return;
			}
			const snapshot = state.setting;
			let value = projectedValue;
			if (binding.valuePath !== undefined) {
				if (!isSettingObjectValue(snapshot.value)) {
					return;
				}
				value = {
					...snapshot.value,
					[binding.valuePath]: projectedValue
				};
			}
			try {
				context.applyOptimisticValue(binding.code, value);
			} catch {
				return;
			}
			optimisticValues.set(binding.code, value);
			const update = async () => {
				try {
					const presentation = await service.update(binding.code, value);
					optimisticValues.delete(binding.code);
					context.replacePresentation(applyOptimisticValues(presentation, optimisticValues));
				} catch {
					optimisticValues.delete(binding.code);
					context.restoreSnapshot(snapshot);
					onError();
				} finally {
					context.setPending(binding.code, false);
				}
			};
			context.setPending(binding.code, true);
			if (binding.mutationGroup === undefined) {
				await update();
				return;
			}
			const previous = mutationQueues.get(binding.mutationGroup);
			const queued = previous === undefined ? update() : previous.catch(ignoreUpdateError$1).then(update);
			mutationQueues.set(binding.mutationGroup, queued);
			try {
				await queued;
			} finally {
				if (mutationQueues.get(binding.mutationGroup) === queued) {
					mutationQueues.delete(binding.mutationGroup);
				}
			}
		};
	}

	function isConfigTargetFollowable(target) {
		if (target.type === 'helper') {
			return target.id.trim() !== '';
		}
		return target.type === 'url' && normalizeSafeUrl(target.href) !== null;
	}
	function activateConfigTarget(target) {
		if (target.type === 'url') {
			const href = normalizeSafeUrl(target.href);
			if (href === null) {
				return false;
			}
			window.location.href = href;
			return true;
		}
		if (target.type === 'helper' && target.id.trim() !== '') {
			const infoHelper = window.top?.BX?.UI?.InfoHelper;
			if (infoHelper?.show) {
				infoHelper.show(target.id);
				return true;
			}
		}
		return false;
	}
	function normalizeSafeUrl(value) {
		const href = value.trim();
		if (href === '' || href.startsWith('//') || href.startsWith('\\') || /\p{Cc}/u.test(href)) {
			return null;
		}
		if (/^https?:\/\//i.test(href)) {
			return href;
		}
		if (/^[a-z][\d+.a-z-]*:/i.test(href)) {
			return null;
		}
		return href;
	}

	const emptyChangeHandler = () => {};
	class HubFilter {
		#query = '';
		#capability = null;
		#onChange;
		constructor(onChange = emptyChangeHandler) {
			this.#onChange = onChange;
		}
		get query() {
			return this.#query;
		}
		get capability() {
			return this.#capability;
		}
		setQuery(value) {
			const query = value.trim();
			if (query === this.#query) {
				return;
			}
			this.#query = query;
			this.#notify();
		}
		setCapability(capability) {
			if (capability.id.trim() === '') {
				return;
			}
			if (this.#capability === capability && this.#query === '') {
				return;
			}
			this.#capability = capability;
			this.#query = '';
			this.#notify();
		}
		reset() {
			if (this.#query === '') {
				return;
			}
			this.#query = '';
			this.#notify();
		}
		clearCapability() {
			if (this.#capability === null) {
				return;
			}
			this.#capability = null;
			this.#notify();
		}
		matchesCapability(capability) {
			return this.#matchesText([capability.title, capability.task]);
		}
		matchesSetting(setting) {
			return this.#matchesText(setting.searchText);
		}
		filterBlock(title, settings) {
			const blockMatchesQuery = this.#query !== '' && this.#matchesText([title]);
			const matchingIds = new Set();
			settings.forEach(setting => {
				const matches = blockMatchesQuery || this.matchesSetting(setting);
				if (!matches) {
					return;
				}
				matchingIds.add(setting.id);
				if (setting.parentId !== undefined) {
					matchingIds.add(setting.parentId);
				}
			});
			return settings.filter(setting => matchingIds.has(setting.id));
		}
		#matchesText(values) {
			const query = this.#query.toLowerCase();
			return values.some(value => value.toLowerCase().includes(query));
		}
		#notify() {
			this.#onChange({
				query: this.#query,
				capability: this.#capability
			});
		}
	}

	const CrmSettingsHubSettingField = ui_vue3.defineComponent({
		name: 'CrmSettingsHubSettingField',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			UiLabel: ui_system_label_vue.Label
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				default: ''
			},
			titleId: {
				type: String,
				default: ''
			},
			showChevron: {
				type: Boolean,
				default: false
			},
			unavailable: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				LabelSize: ui_system_label.LabelSize,
				LabelStyle: ui_system_label.LabelStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			hasControl() {
				return Boolean(this.$slots.control);
			},
			unavailableTestId() {
				const titleSuffix = '-title';
				if (this.titleId === '') {
					return null;
				}
				return this.titleId.endsWith(titleSuffix) ? `${this.titleId.slice(0, -titleSuffix.length)}-unavailable` : `${this.titleId}-unavailable`;
			}
		},
		template: `
		<div class="crm-settings-hub-application__setting-field" :class="{ '--no-toggle': !hasControl }">
			<div class="crm-settings-hub-application__setting-field-header">
				<slot name="control"/>
				<div :id="titleId || null" class="crm-settings-hub-application__setting-field-title">
					{{ title }}
					<UiLabel
						v-if="unavailable"
						:size="LabelSize.SM"
						:style="LabelStyle.FILLED_NO_ACCENT"
						:value="loc('CRM_SETTINGS_HUB_SETTING_UNAVAILABLE_BADGE')"
						:data-testid="unavailableTestId"
					/>
				</div>
				<BIcon
					v-if="showChevron"
					:name="Outline.CHEVRON_RIGHT_M"
					class="crm-settings-hub-application__setting-field-chevron"
				/>
			</div>
			<div class="crm-settings-hub-application__setting-field-body">
				<div class="crm-settings-hub-application__setting-field-main">
					<div class="crm-settings-hub-application__setting-field-desc">{{ description }}</div>
					<slot name="value"/><slot name="dependents"/>
				</div>
			</div>
		</div>
	`
	});

	const CrmSettingsHubSettingRow = ui_vue3.defineComponent({
		name: 'CrmSettingsHubSettingRow',
		inheritAttrs: false,
		props: {
			action: {
				type: Object,
				default: null
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['activate'],
		computed: {
			actionTestId() {
				const rootTestId = this.$attrs['data-testid'];
				return main_core.Type.isString(rootTestId) ? `${rootTestId}-action` : null;
			},
			isFollowable() {
				if (this.disabled || this.action === null) {
					return false;
				}
				return this.action.type === 'matrix' || isConfigTargetFollowable(this.action);
			},
			actionAttributes() {
				if (this.isFollowable) {
					return {
						role: 'button',
						tabindex: 0
					};
				}
				return this.action !== null || this.disabled ? {
					'aria-disabled': 'true'
				} : {};
			},
			actionListeners() {
				return this.isFollowable ? {
					click: this.handleClick,
					keydown: this.handleKeydown
				} : {};
			}
		},
		methods: {
			handleClick(event) {
				if (this.isNestedControl(event)) {
					return;
				}
				event.preventDefault();
				this.emitAction();
			},
			handleKeydown(event) {
				if (this.isNestedControl(event) || !['Enter', ' '].includes(event.key)) {
					return;
				}
				event.preventDefault();
				this.emitAction();
			},
			isNestedControl(event) {
				const target = event.target;
				const currentTarget = event.currentTarget;
				if (!(target instanceof Element) || !(currentTarget instanceof Element) || target === currentTarget) {
					return false;
				}
				const control = target.closest('input, button, select, textarea, [role="switch"], .ui-system-input, .ui-switcher');
				return control !== null && currentTarget.contains(control);
			},
			emitAction() {
				if (this.action !== null) {
					this.$emit('activate', this.action);
				}
			}
		},
		template: `
		<div class="crm-settings-hub-application__settings-row" v-bind="$attrs">
			<div
				class="crm-settings-hub-application__settings-row-action"
				:class="{ '--followable': isFollowable }"
				:data-testid="actionTestId"
				v-bind="actionAttributes"
				v-on="actionListeners"
			>
				<slot/>
			</div>
		</div>
	`
	});

	const CrmSettingsHubConfigSettingView = ui_vue3.defineComponent({
		name: 'CrmSettingsHubConfigSettingView',
		components: {
			CrmSettingsHubSettingField,
			CrmSettingsHubSettingRow
		},
		props: {
			settingId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				default: ''
			},
			target: {
				type: Object,
				default: null
			}
		},
		emits: ['activate'],
		setup(props) {
			const settingsStateContext = useSettingsStateContext();
			ui_vue3.onBeforeMount(() => {
				settingsStateContext.get(props.settingId);
			});
			return {};
		},
		computed: {
			titleId() {
				return `crm-settings-hub-application-setting-${this.settingId}-title`;
			}
		},
		template: `
		<CrmSettingsHubSettingRow :action="target" @activate="$emit('activate', $event)">
			<CrmSettingsHubSettingField
				:title="title"
				:title-id="titleId"
				:description="description"
				:show-chevron="target !== null"
				:unavailable="target?.type === 'unavailable'"
			>
			</CrmSettingsHubSettingField>
		</CrmSettingsHubSettingRow>
	`
	});

	const sidePanelOptionsByNavigationId = {
		'business-processes': {
			cacheable: false,
			allowChangeHistory: false
		},
		currencies: {
			cacheable: false
		},
		taxes: {
			cacheable: false,
			allowChangeHistory: false
		},
		'product-properties': {
			cacheable: false,
			allowChangeHistory: false
		},
		'mail-sendsave': {
			cacheable: false,
			allowChangeHistory: false
		},
		'sms-marketplace': {
			cacheable: false,
			customLeftBoundary: 0
		},
		'document-numerators': {
			cacheable: false,
			allowChangeHistory: false
		},
		'smart-invoice-numerator': {
			width: 480
		},
		'legacy-invoice-numerator': {
			width: 480
		},
		'quote-numerator': {
			width: 480
		},
		'payment-systems': {
			cacheable: false,
			allowChangeHistory: false
		},
		'requisite-templates': {
			cacheable: false,
			allowChangeHistory: false
		},
		'external-sale': {
			cacheable: false,
			allowChangeHistory: false
		},
		'exchange-1c': {
			cacheable: false,
			allowChangeHistory: false
		},
		locations: {
			cacheable: false,
			customLeftBoundary: 40
		},
		directories: {
			cacheable: false,
			allowChangeHistory: false,
			customLeftBoundary: 40
		},
		pipelines: {
			cacheable: false,
			allowChangeHistory: false,
			customLeftBoundary: 40
		},
		'user-fields': {
			cacheable: false,
			allowChangeHistory: false
		},
		'analytics-reports': {
			cacheable: false
		},
		'crm-volume': {
			cacheable: false,
			allowChangeHistory: false
		}
	};

	function sanitizeOptions(options) {
		const sanitizedOptions = {};
		if (main_core.Type.isBoolean(options.cacheable)) {
			sanitizedOptions.cacheable = options.cacheable;
		}
		if (main_core.Type.isBoolean(options.allowChangeHistory)) {
			sanitizedOptions.allowChangeHistory = options.allowChangeHistory;
		}
		if (main_core.Type.isNumber(options.width)) {
			sanitizedOptions.width = options.width;
		}
		if (main_core.Type.isNumber(options.customLeftBoundary)) {
			sanitizedOptions.customLeftBoundary = options.customLeftBoundary;
		}
		return sanitizedOptions;
	}
	const CrmSettingsHubSidePanelLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubSidePanelLink',
		components: {
			CrmSettingsHubConfigSettingView
		},
		props: {
			settingId: {
				type: String,
				required: true
			},
			navigationId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				default: ''
			}
		},
		emits: ['activate'],
		setup(props) {
			const navigation = useNavigationContext();
			const normalizedUrl = ui_vue3.computed(() => {
				const navigationTarget = navigation.get(props.navigationId);
				return navigationTarget?.available === true ? normalizeSafeUrl(navigationTarget.url) : null;
			});
			const target = ui_vue3.computed(() => {
				return normalizedUrl.value === null ? {
					type: 'unavailable'
				} : {
					type: 'url',
					href: normalizedUrl.value
				};
			});
			const activate = async () => {
				const url = normalizedUrl.value;
				if (url !== null) {
					const exports = await main_core.Runtime.loadExtension('main.sidepanel').catch(() => null);
					if (!main_core.Type.isFunction(exports?.SidePanel?.Instance?.open)) {
						return;
					}
					exports.SidePanel.Instance.open(url, sanitizeOptions(sidePanelOptionsByNavigationId[props.navigationId] ?? {}));
				}
			};
			return {
				activate,
				target
			};
		},
		template: `
		<CrmSettingsHubConfigSettingView
			:data-testid="$attrs['data-testid'] ?? ('crm-settings-hub-application-setting-' + settingId)"
			:setting-id="settingId"
			:title="title"
			:description="description"
			:target="target"
			@activate="activate"
		/>
	`
	});

	function getMessage$1N(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1z = 'permissions';
	const navigationId$z = 'crm-permissions';
	const title$1z = getMessage$1N('CRM_SETTINGS_HUB_SETTING_PERMISSIONS_TITLE');
	const why$1z = getMessage$1N('CRM_SETTINGS_HUB_SETTING_PERMISSIONS_WHY');
	const note$1h = getMessage$1N('CRM_SETTINGS_HUB_SETTING_PERMISSIONS_NOTE');
	const optionKey$1z = '';
	const description$1z = why$1z || note$1h || optionKey$1z;
	const CrmSettingsHubPermissionsLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubPermissionsSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$1z,
				navigationId: navigationId$z,
				settingId: settingId$1z,
				title: title$1z
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1z = {
		id: settingId$1z,
		navigationId: navigationId$z,
		component: CrmSettingsHubPermissionsLink,
		searchText: [title$1z, why$1z, note$1h]
	};

	const CrmSettingsHubToggleSettingView = ui_vue3.defineComponent({
		name: 'CrmSettingsHubToggleSettingView',
		components: {
			CrmSettingsHubSettingField,
			CrmSettingsHubSettingRow,
			Switcher: ui_vue3_components_switcher.Switcher
		},
		props: {
			settingId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				default: ''
			}
		},
		setup() {
			return {
				AirSwitcherStyle: ui_switcher.AirSwitcherStyle,
				SwitcherSize: ui_switcher.SwitcherSize,
				settingsStateContext: useSettingsStateContext()
			};
		},
		computed: {
			state() {
				return this.settingsStateContext.get(this.settingId);
			},
			displayTitle() {
				return this.title === '' ? this.state.title ?? '' : this.title;
			},
			displayDescription() {
				return this.description === '' ? this.state.hint ?? '' : this.description;
			},
			isDisabled() {
				return this.state.canEdit !== true || this.settingsStateContext.isPending(this.settingId);
			},
			titleId() {
				return `crm-settings-hub-application-setting-${this.settingId}-title`;
			}
		},
		methods: {
			updateValue(value) {
				if (this.isDisabled) {
					return;
				}
				void this.settingsStateContext.update(this.settingId, value);
			}
		},
		template: `
		<CrmSettingsHubSettingRow :action="null">
			<CrmSettingsHubSettingField
				:title="displayTitle"
				:title-id="titleId"
				:description="displayDescription"
				:unavailable="state.canEdit === false"
			>
				<template #control>
					<Switcher
						class="crm-settings-hub-application__setting-field-switch"
						:data-testid="'crm-settings-hub-application-setting-' + settingId + '-switcher'"
						:is-checked="state.raw === true"
						:is-disabled="isDisabled"
						:options="{
							accessible: true,
							ariaLabelledBy: titleId,
							size: SwitcherSize.medium,
							useAirDesign: true,
							style: AirSwitcherStyle.SOLID,
						}"
						@click.stop
						@keydown.stop
						@check="updateValue(true)"
						@uncheck="updateValue(false)"
					/>
				</template>
				<template #dependents><slot name="dependents"/></template>
			</CrmSettingsHubSettingField>
		</CrmSettingsHubSettingRow>
	`
	});

	function getMessage$1M(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1y = 'lead_opened_flag';
	const title$1y = getMessage$1M('CRM_SETTINGS_HUB_SETTING_LEAD_OPENED_FLAG_TITLE');
	const why$1y = getMessage$1M('CRM_SETTINGS_HUB_SETTING_LEAD_OPENED_FLAG_WHY');
	const note$1g = '';
	const optionKey$1y = 'lead_opened_flag';
	const description$1y = why$1y || note$1g || optionKey$1y;
	const CrmSettingsHubLeadOpenedFlagSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubLeadOpenedFlagSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1y);
			return {
				description: description$1y,
				title: title$1y
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="lead_opened_flag"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1y = {
		id: settingId$1y,
		component: CrmSettingsHubLeadOpenedFlagSetting,
		searchText: [title$1y, why$1y, optionKey$1y]
	};

	function getMessage$1L(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1x = 'contact_opened_flag';
	const title$1x = getMessage$1L('CRM_SETTINGS_HUB_SETTING_CONTACT_OPENED_FLAG_TITLE');
	const why$1x = getMessage$1L('CRM_SETTINGS_HUB_SETTING_CONTACT_OPENED_FLAG_WHY');
	const note$1f = '';
	const optionKey$1x = 'contact_opened_flag';
	const description$1x = why$1x || note$1f || optionKey$1x;
	const CrmSettingsHubContactOpenedFlagSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubContactOpenedFlagSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1x);
			return {
				description: description$1x,
				title: title$1x
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="contact_opened_flag"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1x = {
		id: settingId$1x,
		component: CrmSettingsHubContactOpenedFlagSetting,
		searchText: [title$1x, why$1x, optionKey$1x]
	};

	function getMessage$1K(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1w = 'company_opened_flag';
	const title$1w = getMessage$1K('CRM_SETTINGS_HUB_SETTING_COMPANY_OPENED_FLAG_TITLE');
	const why$1w = getMessage$1K('CRM_SETTINGS_HUB_SETTING_COMPANY_OPENED_FLAG_WHY');
	const note$1e = '';
	const optionKey$1w = 'company_opened_flag';
	const description$1w = why$1w || note$1e || optionKey$1w;
	const CrmSettingsHubCompanyOpenedFlagSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCompanyOpenedFlagSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1w);
			return {
				description: description$1w,
				title: title$1w
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="company_opened_flag"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1w = {
		id: settingId$1w,
		component: CrmSettingsHubCompanyOpenedFlagSetting,
		searchText: [title$1w, why$1w, optionKey$1w]
	};

	function getMessage$1J(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1v = 'deal_opened_flag';
	const title$1v = getMessage$1J('CRM_SETTINGS_HUB_SETTING_DEAL_OPENED_FLAG_TITLE');
	const why$1v = getMessage$1J('CRM_SETTINGS_HUB_SETTING_DEAL_OPENED_FLAG_WHY');
	const note$1d = '';
	const optionKey$1v = 'deal_opened_flag';
	const description$1v = why$1v || note$1d || optionKey$1v;
	const CrmSettingsHubDealOpenedFlagSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubDealOpenedFlagSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1v);
			return {
				description: description$1v,
				title: title$1v
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="deal_opened_flag"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1v = {
		id: settingId$1v,
		component: CrmSettingsHubDealOpenedFlagSetting,
		searchText: [title$1v, why$1v, optionKey$1v]
	};

	function getMessage$1I(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1u = 'quote_opened_flag';
	const title$1u = getMessage$1I('CRM_SETTINGS_HUB_SETTING_QUOTE_OPENED_FLAG_TITLE');
	const why$1u = getMessage$1I('CRM_SETTINGS_HUB_SETTING_QUOTE_OPENED_FLAG_WHY');
	const note$1c = '';
	const optionKey$1u = 'quote_opened_flag';
	const description$1u = why$1u || note$1c || optionKey$1u;
	const CrmSettingsHubQuoteOpenedFlagSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubQuoteOpenedFlagSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1u);
			return {
				description: description$1u,
				title: title$1u
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="quote_opened_flag"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1u = {
		id: settingId$1u,
		component: CrmSettingsHubQuoteOpenedFlagSetting,
		searchText: [title$1u, why$1u, optionKey$1u]
	};

	function getMessage$1H(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const accessSection = {
		id: 'access',
		title: getMessage$1H('CRM_SETTINGS_HUB_SECTION_ACCESS_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'rights',
			title: getMessage$1H('CRM_SETTINGS_HUB_BLOCK_RIGHTS_TITLE'),
			icon: 'o-key',
			settings: [registration$1z]
		}, {
			id: 'default_openness',
			title: getMessage$1H('CRM_SETTINGS_HUB_BLOCK_DEFAULT_OPENNESS_TITLE'),
			icon: 'o-three-persons',
			settings: [registration$1y, registration$1x, registration$1w, registration$1v, registration$1u]
		}]
	};

	const CrmSettingsHubSelectSettingView = ui_vue3.defineComponent({
		name: 'CrmSettingsHubSelectSettingView',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			CrmSettingsHubSettingField,
			CrmSettingsHubSettingRow,
			Popup: ui_vue3_components_popup.Popup
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			settingId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				default: ''
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				settingsStateContext: useSettingsStateContext()
			};
		},
		data() {
			return {
				open: false,
				activeOptionIndex: 0
			};
		},
		computed: {
			state() {
				return this.settingsStateContext.get(this.settingId);
			},
			displayTitle() {
				return this.title === '' ? this.state.title ?? '' : this.title;
			},
			displayDescription() {
				return this.description === '' ? this.state.hint ?? '' : this.description;
			},
			displayValue() {
				return this.state.label ?? '';
			},
			placeholder() {
				return this.loc('CRM_SETTINGS_HUB_VALUE_EMPTY');
			},
			titleId() {
				return `crm-settings-hub-application-setting-${this.settingId}-title`;
			},
			popupId() {
				return `crm-settings-hub-application-setting-${this.settingId}-select-popup`;
			},
			options() {
				return this.state.schema?.type === 'select' ? this.state.schema.options : [];
			},
			isDisabled() {
				return this.state.canEdit !== true || this.settingsStateContext.isPending(this.settingId);
			},
			selectedOptionIndex() {
				const selectedIndex = this.options.findIndex(option => option.value === this.state.raw);
				return selectedIndex === -1 ? 0 : selectedIndex;
			},
			popupOptions() {
				return {
					id: this.popupId,
					ariaLabelledBy: this.titleId,
					bindElement: this.$refs.selectAnchor ?? window,
					closeByEsc: true,
					autoHide: true,
					cacheable: false,
					padding: 0
				};
			}
		},
		watch: {
			isDisabled(disabled) {
				if (disabled) {
					this.closePopup(false);
				}
			}
		},
		methods: {
			openPopup() {
				if (this.isDisabled || this.open) {
					return;
				}
				this.activeOptionIndex = this.selectedOptionIndex;
				this.open = true;
				this.$nextTick(() => this.focusOption(this.activeOptionIndex));
			},
			closePopup(restoreFocus = true) {
				if (!this.open) {
					return;
				}
				this.open = false;
				if (restoreFocus) {
					this.$nextTick(() => this.$refs.selectTrigger?.focus());
				}
			},
			focusOption(index) {
				const optionButtons = this.$refs.optionButtons;
				optionButtons?.[index]?.focus();
			},
			handleOptionKeydown(event, index) {
				const lastIndex = this.options.length - 1;
				let nextIndex = index;
				switch (event.key) {
					case 'ArrowDown':
						nextIndex = index === lastIndex ? 0 : index + 1;
						break;
					case 'ArrowUp':
						nextIndex = index === 0 ? lastIndex : index - 1;
						break;
					case 'Home':
						nextIndex = 0;
						break;
					case 'End':
						nextIndex = lastIndex;
						break;
					default:
						return;
				}
				event.preventDefault();
				this.activeOptionIndex = nextIndex;
				this.$nextTick(() => this.focusOption(nextIndex));
			},
			selectOption(option) {
				if (this.isDisabled) {
					return;
				}
				this.closePopup();
				void this.settingsStateContext.update(this.settingId, option.value);
			}
		},
		template: `
		<CrmSettingsHubSettingRow :action="null">
			<CrmSettingsHubSettingField
				:title="displayTitle"
				:title-id="titleId"
				:description="displayDescription"
				:unavailable="state.canEdit === false"
			>
				<template #value>
					<div
						ref="selectAnchor"
						class="crm-settings-hub-application__setting-field-value"
					>
						<div
							class="ui-system-input --l --stretched --dropdown crm-settings-hub-application__select"
							:class="{ '--disabled': isDisabled, '--active': open }"
						>
							<button
								ref="selectTrigger"
								type="button"
								class="ui-system-input-container crm-settings-hub-application__select-trigger"
								:data-testid="'crm-settings-hub-application-setting-' + settingId + '-select'"
								:aria-expanded="open"
								:aria-labelledby="titleId"
								:aria-controls="popupId"
								aria-haspopup="listbox"
								:disabled="isDisabled"
								@click.stop="openPopup"
								@keydown.enter.stop.prevent="openPopup"
								@keydown.space.stop.prevent="openPopup"
							>
								<span
									class="ui-system-input-value crm-settings-hub-application__select-value"
									:class="{ '--placeholder': !displayValue }"
								>
									{{ displayValue || placeholder }}
								</span>
								<BIcon class="ui-system-input-dropdown" :name="Outline.CHEVRON_DOWN_L"/>
							</button>
						</div>
						<Popup
							v-if="open"
							:id="popupId"
							:options="popupOptions"
							@close="closePopup"
						>
							<div
								class="crm-settings-hub-application__select-options"
								role="listbox"
								:aria-labelledby="titleId"
							>
								<button
									v-for="(option, index) in options"
									:key="index"
									ref="optionButtons"
									type="button"
									class="crm-settings-hub-application__select-option"
									role="option"
									:aria-selected="option.value === state.raw"
									:tabindex="activeOptionIndex === index ? 0 : -1"
									:data-testid="popupId + '-option-' + index"
									@click="selectOption(option)"
									@keydown="handleOptionKeydown($event, index)"
								>
									<span class="crm-settings-hub-application__select-option-title">{{ option.title }}</span>
									<span v-if="option.hint" class="crm-settings-hub-application__select-option-hint">{{ option.hint }}</span>
								</button>
							</div>
						</Popup>
					</div>
				</template>
			</CrmSettingsHubSettingField>
		</CrmSettingsHubSettingRow>
	`
	});

	function getMessage$1G(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1t = 'is_counters_use_activity_responsible';
	const title$1t = getMessage$1G('CRM_SETTINGS_HUB_SETTING_IS_COUNTERS_USE_ACTIVITY_RESPONSIBLE_TITLE');
	const why$1t = getMessage$1G('CRM_SETTINGS_HUB_SETTING_IS_COUNTERS_USE_ACTIVITY_RESPONSIBLE_WHY');
	const note$1b = '';
	const optionKey$1t = 'is_counters_use_activity_responsible';
	const description$1t = why$1t || note$1b || optionKey$1t;
	const options$d = [{
		value: 'act',
		label: getMessage$1G('CRM_SETTINGS_HUB_SETTING_IS_COUNTERS_USE_ACTIVITY_RESPONSIBLE_OPTION_ACT')
	}, {
		value: 'entity',
		label: getMessage$1G('CRM_SETTINGS_HUB_SETTING_IS_COUNTERS_USE_ACTIVITY_RESPONSIBLE_OPTION_ENTITY')
	}];
	const CrmSettingsHubIsCountersUseActivityResponsibleSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubIsCountersUseActivityResponsibleSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$1t);
			return {
				description: description$1t,
				options: options$d,
				title: title$1t
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="is_counters_use_activity_responsible"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1t = {
		id: settingId$1t,
		component: CrmSettingsHubIsCountersUseActivityResponsibleSetting,
		searchText: [title$1t, why$1t, optionKey$1t, ...options$d.map(({
			label
		}) => label)]
	};

	function getMessage$1F(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1s = 'activity_remove_entity_badges_interval_days';
	const title$1s = getMessage$1F('CRM_SETTINGS_HUB_SETTING_ACTIVITY_REMOVE_ENTITY_BADGES_INTERVAL_DAYS_TITLE');
	const why$1s = getMessage$1F('CRM_SETTINGS_HUB_SETTING_ACTIVITY_REMOVE_ENTITY_BADGES_INTERVAL_DAYS_WHY');
	const note$1a = '';
	const optionKey$1s = 'activity_remove_entity_badges_interval_days';
	const description$1s = why$1s || note$1a || optionKey$1s;
	const options$c = [{
		value: '30',
		label: getMessage$1F('CRM_SETTINGS_HUB_SETTING_ACTIVITY_REMOVE_ENTITY_BADGES_INTERVAL_DAYS_OPTION_30')
	}, {
		value: '60',
		label: getMessage$1F('CRM_SETTINGS_HUB_SETTING_ACTIVITY_REMOVE_ENTITY_BADGES_INTERVAL_DAYS_OPTION_60')
	}, {
		value: '90',
		label: getMessage$1F('CRM_SETTINGS_HUB_SETTING_ACTIVITY_REMOVE_ENTITY_BADGES_INTERVAL_DAYS_OPTION_90')
	}];
	const CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$1s);
			return {
				description: description$1s,
				options: options$c,
				title: title$1s
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="activity_remove_entity_badges_interval_days"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1s = {
		id: settingId$1s,
		component: CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting,
		searchText: [title$1s, why$1s, optionKey$1s, ...options$c.map(({
			label
		}) => label)]
	};

	const CrmSettingsHubMatrixSettingView = ui_vue3.defineComponent({
		name: 'CrmSettingsHubMatrixSettingView',
		components: {
			CrmSettingsHubSettingField,
			CrmSettingsHubSettingRow
		},
		props: {
			settingId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				default: ''
			}
		},
		emits: ['activate'],
		setup() {
			return {
				settingsStateContext: useSettingsStateContext()
			};
		},
		computed: {
			state() {
				return this.settingsStateContext.get(this.settingId);
			},
			displayTitle() {
				return this.title === '' ? this.state.title ?? '' : this.title;
			},
			displayDescription() {
				return this.description === '' ? this.state.hint ?? '' : this.description;
			},
			titleId() {
				return `crm-settings-hub-application-setting-${this.settingId}-title`;
			},
			matrixAction() {
				const {
					matrix
				} = this.state;
				if (matrix === undefined || matrix === null) {
					return null;
				}
				return {
					type: 'matrix',
					settingId: this.settingId
				};
			},
			isDisabled() {
				return this.matrixAction === null || this.state.canEdit !== true || this.settingsStateContext.isPending(this.settingId);
			}
		},
		methods: {
			handleActivate(action) {
				if (!this.isDisabled) {
					this.$emit('activate', action);
				}
			}
		},
		template: `
		<CrmSettingsHubSettingRow
			:action="matrixAction"
			:disabled="isDisabled"
			@activate="handleActivate"
		>
			<CrmSettingsHubSettingField
				:title="displayTitle"
				:title-id="titleId"
				:description="displayDescription"
				:show-chevron="true"
				:unavailable="state.canEdit === false"
			>
			</CrmSettingsHubSettingField>
		</CrmSettingsHubSettingRow>
	`
	});

	function getMessage$1E(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1r = 'lead_act_completion_cfg';
	const title$1r = getMessage$1E('CRM_SETTINGS_HUB_SETTING_LEAD_ACT_COMPLETION_CFG_TITLE');
	const why$1r = getMessage$1E('CRM_SETTINGS_HUB_SETTING_LEAD_ACT_COMPLETION_CFG_WHY');
	const note$19 = getMessage$1E('CRM_SETTINGS_HUB_SETTING_LEAD_ACT_COMPLETION_CFG_NOTE');
	const optionKey$1r = 'lead_act_completion_cfg';
	const description$1r = why$1r || note$19 || optionKey$1r;
	const CrmSettingsHubLeadActCompletionCfgSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubLeadActCompletionCfgSetting',
		components: {
			CrmSettingsHubMatrixSettingView
		},
		emits: ['activate'],
		setup() {
			useSettingState(settingId$1r);
			return {
				description: description$1r,
				title: title$1r
			};
		},
		template: `
		<CrmSettingsHubMatrixSettingView
			setting-id="lead_act_completion_cfg"
			:description="description"
			:title="title"
			@activate="$emit('activate', $event)"
		/>
	`
	});
	const registration$1r = {
		id: settingId$1r,
		component: CrmSettingsHubLeadActCompletionCfgSetting,
		searchText: [title$1r, why$1r, note$19, optionKey$1r]
	};

	function getMessage$1D(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1q = 'is_create_calendar_event_for_call';
	const title$1q = getMessage$1D('CRM_SETTINGS_HUB_SETTING_IS_CREATE_CALENDAR_EVENT_FOR_CALL_TITLE');
	const why$1q = getMessage$1D('CRM_SETTINGS_HUB_SETTING_IS_CREATE_CALENDAR_EVENT_FOR_CALL_WHY');
	const note$18 = '';
	const optionKey$1q = 'is_create_calendar_event_for_call';
	const description$1q = why$1q || note$18 || optionKey$1q;
	const CrmSettingsHubIsCreateCalendarEventForCallSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubIsCreateCalendarEventForCallSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1q);
			return {
				description: description$1q,
				title: title$1q
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="is_create_calendar_event_for_call"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1q = {
		id: settingId$1q,
		component: CrmSettingsHubIsCreateCalendarEventForCallSetting,
		searchText: [title$1q, why$1q, optionKey$1q]
	};

	function getMessage$1C(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1p = 'act_cal_show_compl_call';
	const title$1p = getMessage$1C('CRM_SETTINGS_HUB_SETTING_ACT_CAL_SHOW_COMPL_CALL_TITLE');
	const why$1p = getMessage$1C('CRM_SETTINGS_HUB_SETTING_ACT_CAL_SHOW_COMPL_CALL_WHY');
	const note$17 = '';
	const optionKey$1p = 'act_cal_show_compl_call';
	const description$1p = why$1p || note$17 || optionKey$1p;
	const CrmSettingsHubActCalShowComplCallSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubActCalShowComplCallSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1p);
			return {
				description: description$1p,
				title: title$1p
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="act_cal_show_compl_call"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1p = {
		id: settingId$1p,
		component: CrmSettingsHubActCalShowComplCallSetting,
		searchText: [title$1p, why$1p, optionKey$1p]
	};

	function getMessage$1B(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1o = 'act_cal_show_compl_meeting';
	const title$1o = getMessage$1B('CRM_SETTINGS_HUB_SETTING_ACT_CAL_SHOW_COMPL_MEETING_TITLE');
	const why$1o = getMessage$1B('CRM_SETTINGS_HUB_SETTING_ACT_CAL_SHOW_COMPL_MEETING_WHY');
	const note$16 = '';
	const optionKey$1o = 'act_cal_show_compl_meeting';
	const description$1o = why$1o || note$16 || optionKey$1o;
	const CrmSettingsHubActCalShowComplMeetingSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubActCalShowComplMeetingSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1o);
			return {
				description: description$1o,
				title: title$1o
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="act_cal_show_compl_meeting"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1o = {
		id: settingId$1o,
		component: CrmSettingsHubActCalShowComplMeetingSetting,
		searchText: [title$1o, why$1o, optionKey$1o]
	};

	function getMessage$1A(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1n = 'act_cal_keep_reassign_call';
	const title$1n = getMessage$1A('CRM_SETTINGS_HUB_SETTING_ACT_CAL_KEEP_REASSIGN_CALL_TITLE');
	const why$1n = getMessage$1A('CRM_SETTINGS_HUB_SETTING_ACT_CAL_KEEP_REASSIGN_CALL_WHY');
	const note$15 = '';
	const optionKey$1n = 'act_cal_keep_reassign_call';
	const description$1n = why$1n || note$15 || optionKey$1n;
	const CrmSettingsHubActCalKeepReassignCallSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubActCalKeepReassignCallSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1n);
			return {
				description: description$1n,
				title: title$1n
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="act_cal_keep_reassign_call"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1n = {
		id: settingId$1n,
		component: CrmSettingsHubActCalKeepReassignCallSetting,
		searchText: [title$1n, why$1n, optionKey$1n]
	};

	function getMessage$1z(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1m = 'act_cal_keep_reassign_meeting';
	const title$1m = getMessage$1z('CRM_SETTINGS_HUB_SETTING_ACT_CAL_KEEP_REASSIGN_MEETING_TITLE');
	const why$1m = getMessage$1z('CRM_SETTINGS_HUB_SETTING_ACT_CAL_KEEP_REASSIGN_MEETING_WHY');
	const note$14 = '';
	const optionKey$1m = 'act_cal_keep_reassign_meeting';
	const description$1m = why$1m || note$14 || optionKey$1m;
	const CrmSettingsHubActCalKeepReassignMeetingSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubActCalKeepReassignMeetingSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1m);
			return {
				description: description$1m,
				title: title$1m
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="act_cal_keep_reassign_meeting"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1m = {
		id: settingId$1m,
		component: CrmSettingsHubActCalKeepReassignMeetingSetting,
		searchText: [title$1m, why$1m, optionKey$1m]
	};

	function getMessage$1y(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const activitiesSection = {
		id: 'activities',
		title: getMessage$1y('CRM_SETTINGS_HUB_SECTION_ACTIVITIES_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'activity',
			title: getMessage$1y('CRM_SETTINGS_HUB_BLOCK_ACTIVITY_TITLE'),
			icon: 'o-activity',
			settings: [registration$1t, registration$1s, registration$1r]
		}, {
			id: 'calendar',
			title: getMessage$1y('CRM_SETTINGS_HUB_BLOCK_CALENDAR_TITLE'),
			icon: 'o-calendar',
			settings: [registration$1q, registration$1p, registration$1o, registration$1n, registration$1m]
		}]
	};

	function getMessage$1x(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1l = 'lead_automation';
	const navigationId$y = 'automation-lead';
	const title$1l = getMessage$1x('CRM_SETTINGS_HUB_SETTING_LEAD_AUTOMATION_TITLE');
	const why$1l = getMessage$1x('CRM_SETTINGS_HUB_SETTING_LEAD_AUTOMATION_WHY');
	const optionKey$1l = '';
	const description$1l = why$1l || optionKey$1l;
	const CrmSettingsHubLeadAutomationLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubLeadAutomationSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$1l,
				navigationId: navigationId$y,
				settingId: settingId$1l,
				title: title$1l
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1l = {
		id: settingId$1l,
		navigationId: navigationId$y,
		component: CrmSettingsHubLeadAutomationLink,
		searchText: [title$1l, why$1l]
	};

	function getMessage$1w(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1k = 'deal_automation';
	const navigationId$x = 'automation-deal';
	const title$1k = getMessage$1w('CRM_SETTINGS_HUB_SETTING_DEAL_AUTOMATION_TITLE');
	const why$1k = getMessage$1w('CRM_SETTINGS_HUB_SETTING_DEAL_AUTOMATION_WHY');
	const optionKey$1k = '';
	const description$1k = why$1k || optionKey$1k;
	const CrmSettingsHubDealAutomationLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubDealAutomationSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$1k,
				navigationId: navigationId$x,
				settingId: settingId$1k,
				title: title$1k
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1k = {
		id: settingId$1k,
		navigationId: navigationId$x,
		component: CrmSettingsHubDealAutomationLink,
		searchText: [title$1k, why$1k]
	};

	function getMessage$1v(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1j = 'order_automation';
	const navigationId$w = 'automation-order';
	const title$1j = getMessage$1v('CRM_SETTINGS_HUB_SETTING_ORDER_AUTOMATION_TITLE');
	const why$1j = getMessage$1v('CRM_SETTINGS_HUB_SETTING_ORDER_AUTOMATION_WHY');
	const optionKey$1j = '';
	const description$1j = why$1j || optionKey$1j;
	const CrmSettingsHubOrderAutomationLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubOrderAutomationSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$1j,
				navigationId: navigationId$w,
				settingId: settingId$1j,
				title: title$1j
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1j = {
		id: settingId$1j,
		navigationId: navigationId$w,
		component: CrmSettingsHubOrderAutomationLink,
		searchText: [title$1j, why$1j]
	};

	function getMessage$1u(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1i = 'bizproc';
	const navigationId$v = 'business-processes';
	const title$1i = getMessage$1u('CRM_SETTINGS_HUB_SETTING_BIZPROC_TITLE');
	const why$1i = getMessage$1u('CRM_SETTINGS_HUB_SETTING_BIZPROC_WHY');
	const optionKey$1i = '';
	const description$1i = why$1i || optionKey$1i;
	const CrmSettingsHubBusinessProcessesLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubBizprocSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$1i,
				navigationId: navigationId$v,
				settingId: settingId$1i,
				title: title$1i
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1i = {
		id: settingId$1i,
		navigationId: navigationId$v,
		component: CrmSettingsHubBusinessProcessesLink,
		searchText: [title$1i, why$1i]
	};

	function getMessage$1t(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const automationSection = {
		id: 'automation',
		title: getMessage$1t('CRM_SETTINGS_HUB_SECTION_AUTOMATION_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'robots',
			title: getMessage$1t('CRM_SETTINGS_HUB_BLOCK_ROBOTS_TITLE'),
			icon: 'o-robot',
			settings: [registration$1l, registration$1k, registration$1j]
		}, {
			id: 'business_processes',
			title: getMessage$1t('CRM_SETTINGS_HUB_BLOCK_BUSINESS_PROCESSES_TITLE'),
			icon: 'o-business-process',
			settings: [registration$1i]
		}]
	};

	function getMessage$1s(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1h = 'currencies';
	const navigationId$u = 'currencies';
	const title$1h = getMessage$1s('CRM_SETTINGS_HUB_SETTING_CURRENCIES_TITLE');
	const why$1h = getMessage$1s('CRM_SETTINGS_HUB_SETTING_CURRENCIES_WHY');
	const optionKey$1h = '';
	const description$1h = why$1h || optionKey$1h;
	const CrmSettingsHubCurrenciesLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCurrenciesSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$1h,
				navigationId: navigationId$u,
				settingId: settingId$1h,
				title: title$1h
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1h = {
		id: settingId$1h,
		navigationId: navigationId$u,
		component: CrmSettingsHubCurrenciesLink,
		searchText: [title$1h, why$1h]
	};

	function getMessage$1r(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1g = 'taxes';
	const navigationId$t = 'taxes';
	const title$1g = getMessage$1r('CRM_SETTINGS_HUB_SETTING_TAXES_TITLE');
	const why$1g = getMessage$1r('CRM_SETTINGS_HUB_SETTING_TAXES_WHY');
	const optionKey$1g = '';
	const description$1g = why$1g || optionKey$1g;
	const CrmSettingsHubTaxesLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubTaxesSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$1g,
				navigationId: navigationId$t,
				settingId: settingId$1g,
				title: title$1g
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1g = {
		id: settingId$1g,
		navigationId: navigationId$t,
		component: CrmSettingsHubTaxesLink,
		searchText: [title$1g, why$1g]
	};

	function getMessage$1q(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1f = 'measures';
	const navigationId$s = 'measures';
	const title$1f = getMessage$1q('CRM_SETTINGS_HUB_SETTING_MEASURES_TITLE');
	const why$1f = getMessage$1q('CRM_SETTINGS_HUB_SETTING_MEASURES_WHY');
	const optionKey$1f = '';
	const description$1f = why$1f || optionKey$1f;
	const CrmSettingsHubMeasuresLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubMeasuresSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$1f,
				navigationId: navigationId$s,
				settingId: settingId$1f,
				title: title$1f
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1f = {
		id: settingId$1f,
		navigationId: navigationId$s,
		component: CrmSettingsHubMeasuresLink,
		searchText: [title$1f, why$1f]
	};

	function getMessage$1p(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1e = 'product_props';
	const navigationId$r = 'product-properties';
	const title$1e = getMessage$1p('CRM_SETTINGS_HUB_SETTING_PRODUCT_PROPS_TITLE');
	const why$1e = getMessage$1p('CRM_SETTINGS_HUB_SETTING_PRODUCT_PROPS_WHY');
	const optionKey$1e = '';
	const description$1e = why$1e || optionKey$1e;
	const CrmSettingsHubProductPropsLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubProductPropsSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$1e,
				navigationId: navigationId$r,
				settingId: settingId$1e,
				title: title$1e
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1e = {
		id: settingId$1e,
		navigationId: navigationId$r,
		component: CrmSettingsHubProductPropsLink,
		searchText: [title$1e, why$1e]
	};

	function getMessage$1o(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const catalogSection = {
		id: 'catalog',
		title: getMessage$1o('CRM_SETTINGS_HUB_SECTION_CATALOG_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'products_and_directories',
			title: getMessage$1o('CRM_SETTINGS_HUB_BLOCK_PRODUCTS_AND_DIRECTORIES_TITLE'),
			icon: 'o-product',
			settings: [registration$1h, registration$1g, registration$1f, registration$1e]
		}]
	};

	function getMessage$1n(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1d = 'dup_ctrl_lead';
	const title$1d = getMessage$1n('CRM_SETTINGS_HUB_SETTING_DUP_CTRL_LEAD_TITLE');
	const why$1d = getMessage$1n('CRM_SETTINGS_HUB_SETTING_DUP_CTRL_LEAD_WHY');
	const note$13 = '';
	const optionKey$1d = 'dup_ctrl';
	const description$1d = why$1d || note$13 || optionKey$1d;
	const CrmSettingsHubDupCtrlLeadSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubDupCtrlLeadSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1d);
			return {
				description: description$1d,
				title: title$1d
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="dup_ctrl_lead"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1d = {
		id: settingId$1d,
		component: CrmSettingsHubDupCtrlLeadSetting,
		searchText: [title$1d, why$1d, optionKey$1d]
	};

	function getMessage$1m(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1c = 'dup_ctrl_contact';
	const title$1c = getMessage$1m('CRM_SETTINGS_HUB_SETTING_DUP_CTRL_CONTACT_TITLE');
	const why$1c = getMessage$1m('CRM_SETTINGS_HUB_SETTING_DUP_CTRL_CONTACT_WHY');
	const note$12 = '';
	const optionKey$1c = 'dup_ctrl';
	const description$1c = why$1c || note$12 || optionKey$1c;
	const CrmSettingsHubDupCtrlContactSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubDupCtrlContactSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1c);
			return {
				description: description$1c,
				title: title$1c
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="dup_ctrl_contact"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1c = {
		id: settingId$1c,
		component: CrmSettingsHubDupCtrlContactSetting,
		searchText: [title$1c, why$1c, optionKey$1c]
	};

	function getMessage$1l(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1b = 'dup_ctrl_company';
	const title$1b = getMessage$1l('CRM_SETTINGS_HUB_SETTING_DUP_CTRL_COMPANY_TITLE');
	const why$1b = getMessage$1l('CRM_SETTINGS_HUB_SETTING_DUP_CTRL_COMPANY_WHY');
	const note$11 = '';
	const optionKey$1b = 'dup_ctrl';
	const description$1b = why$1b || note$11 || optionKey$1b;
	const CrmSettingsHubDupCtrlCompanySetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubDupCtrlCompanySetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1b);
			return {
				description: description$1b,
				title: title$1b
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="dup_ctrl_company"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1b = {
		id: settingId$1b,
		component: CrmSettingsHubDupCtrlCompanySetting,
		searchText: [title$1b, why$1b, optionKey$1b]
	};

	function getMessage$1k(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1a = 'prsn_nm_frmt_id';
	const title$1a = getMessage$1k('CRM_SETTINGS_HUB_SETTING_PRSN_NM_FRMT_ID_TITLE');
	const why$1a = getMessage$1k('CRM_SETTINGS_HUB_SETTING_PRSN_NM_FRMT_ID_WHY');
	const note$10 = '';
	const optionKey$1a = 'prsn_nm_frmt_id';
	const description$1a = why$1a || note$10 || optionKey$1a;
	const options$b = [{
		value: '1',
		label: getMessage$1k('CRM_SETTINGS_HUB_SETTING_PRSN_NM_FRMT_ID_OPTION_1')
	}, {
		value: '6',
		label: getMessage$1k('CRM_SETTINGS_HUB_SETTING_PRSN_NM_FRMT_ID_OPTION_6')
	}, {
		value: '2',
		label: getMessage$1k('CRM_SETTINGS_HUB_SETTING_PRSN_NM_FRMT_ID_OPTION_2')
	}, {
		value: '3',
		label: getMessage$1k('CRM_SETTINGS_HUB_SETTING_PRSN_NM_FRMT_ID_OPTION_3')
	}, {
		value: '4',
		label: getMessage$1k('CRM_SETTINGS_HUB_SETTING_PRSN_NM_FRMT_ID_OPTION_4')
	}, {
		value: '5',
		label: getMessage$1k('CRM_SETTINGS_HUB_SETTING_PRSN_NM_FRMT_ID_OPTION_5')
	}];
	const CrmSettingsHubPrsnNmFrmtIdSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubPrsnNmFrmtIdSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$1a);
			return {
				description: description$1a,
				options: options$b,
				title: title$1a
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="prsn_nm_frmt_id"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1a = {
		id: settingId$1a,
		component: CrmSettingsHubPrsnNmFrmtIdSetting,
		searchText: [title$1a, why$1a, optionKey$1a, ...options$b.map(({
			label
		}) => label)]
	};

	function getMessage$1j(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$19 = 'ent_addr_frmt_id';
	const title$19 = getMessage$1j('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_TITLE');
	const why$19 = getMessage$1j('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_WHY');
	const note$$ = getMessage$1j('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_NOTE');
	const optionKey$19 = 'ent_addr_frmt_id';
	const description$19 = why$19 || note$$ || optionKey$19;
	const options$a = [{
		value: '1',
		label: getMessage$1j('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_1')
	}, {
		value: '2',
		label: getMessage$1j('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_2')
	}, {
		value: '3',
		label: getMessage$1j('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_3')
	}, {
		value: '4',
		label: getMessage$1j('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_4')
	}, {
		value: '5',
		label: getMessage$1j('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_5')
	}, {
		value: '6',
		label: getMessage$1j('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_6')
	}];
	const CrmSettingsHubEntAddrFrmtIdSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEntAddrFrmtIdSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$19);
			return {
				description: description$19,
				options: options$a,
				title: title$19
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="ent_addr_frmt_id"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$19 = {
		id: settingId$19,
		component: CrmSettingsHubEntAddrFrmtIdSetting,
		searchText: [title$19, why$19, note$$, optionKey$19, ...options$a.map(({
			label
		}) => label)]
	};

	function getMessage$1i(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const clientsSection = {
		id: 'clients',
		title: getMessage$1i('CRM_SETTINGS_HUB_SECTION_CLIENTS_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'duplicates',
			title: getMessage$1i('CRM_SETTINGS_HUB_BLOCK_DUPLICATES_TITLE'),
			icon: 'o-duplicate',
			settings: [registration$1d, registration$1c, registration$1b]
		}, {
			id: 'data_formats',
			title: getMessage$1i('CRM_SETTINGS_HUB_BLOCK_DATA_FORMATS_TITLE'),
			icon: 'o-text',
			settings: [registration$1a, registration$19]
		}]
	};

	function getMessage$1h(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$18 = 'integrations';
	const navigationId$q = 'contact-center';
	const title$18 = getMessage$1h('CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_TITLE');
	const why$18 = getMessage$1h('CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_WHY');
	const note$_ = getMessage$1h('CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_NOTE');
	const optionKey$18 = '';
	const description$18 = why$18 || note$_ || optionKey$18;
	const CrmSettingsHubIntegrationsSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubIntegrationsSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$18,
				navigationId: navigationId$q,
				settingId: settingId$18,
				title: title$18
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$18 = {
		id: settingId$18,
		navigationId: navigationId$q,
		component: CrmSettingsHubIntegrationsSetting,
		searchText: [title$18, why$18, note$_]
	};

	function getMessage$1g(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$17 = 'sms_marketplace';
	const navigationId$p = 'sms-marketplace';
	const title$17 = getMessage$1g('CRM_SETTINGS_HUB_SETTING_SMS_MARKETPLACE_TITLE');
	const why$17 = getMessage$1g('CRM_SETTINGS_HUB_SETTING_SMS_MARKETPLACE_WHY');
	const note$Z = getMessage$1g('CRM_SETTINGS_HUB_SETTING_SMS_MARKETPLACE_NOTE');
	const optionKey$17 = '';
	const description$17 = why$17 || note$Z || optionKey$17;
	const CrmSettingsHubSmsMarketplaceSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubSmsMarketplaceSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$17,
				navigationId: navigationId$p,
				settingId: settingId$17,
				title: title$17
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$17 = {
		id: settingId$17,
		navigationId: navigationId$p,
		component: CrmSettingsHubSmsMarketplaceSetting,
		searchText: [title$17, why$17, note$Z]
	};

	function getMessage$1f(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$16 = 'mail_sendsave';
	const navigationId$o = 'mail-sendsave';
	const title$16 = getMessage$1f('CRM_SETTINGS_HUB_SETTING_MAIL_SENDSAVE_TITLE');
	const why$16 = getMessage$1f('CRM_SETTINGS_HUB_SETTING_MAIL_SENDSAVE_WHY');
	const optionKey$16 = '';
	const description$16 = why$16 || optionKey$16;
	const CrmSettingsHubMailSendsaveLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubMailSendsaveSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$16,
				navigationId: navigationId$o,
				settingId: settingId$16,
				title: title$16
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$16 = {
		id: settingId$16,
		navigationId: navigationId$o,
		component: CrmSettingsHubMailSendsaveLink,
		searchText: [title$16, why$16]
	};

	function getMessage$1e(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$15 = 'act_mark_fwd_emai_outgoing';
	const title$15 = getMessage$1e('CRM_SETTINGS_HUB_SETTING_ACT_MARK_FWD_EMAI_OUTGOING_TITLE');
	const why$15 = getMessage$1e('CRM_SETTINGS_HUB_SETTING_ACT_MARK_FWD_EMAI_OUTGOING_WHY');
	const note$Y = '';
	const optionKey$15 = 'act_mark_fwd_emai_outgoing';
	const description$15 = why$15 || note$Y || optionKey$15;
	const CrmSettingsHubActMarkFwdEmaiOutgoingSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubActMarkFwdEmaiOutgoingSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$15);
			return {
				description: description$15,
				title: title$15
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="act_mark_fwd_emai_outgoing"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$15 = {
		id: settingId$15,
		component: CrmSettingsHubActMarkFwdEmaiOutgoingSetting,
		searchText: [title$15, why$15, optionKey$15]
	};

	const CrmSettingsHubDependentSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubDependentSetting',
		props: {
			visible: {
				type: Boolean,
				required: true
			}
		},
		template: `
		<div class="crm-settings-hub-application__setting-field-divider" :hidden="!visible"></div>
		<div class="crm-settings-hub-application__setting-field-value" :hidden="!visible">
			<div class="crm-settings-hub-application__dependent">
				<slot/>
			</div>
		</div>
	`
	});

	function getMessage$1d(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$14 = 'activity_outgoing_email_owner_type';
	const title$14 = getMessage$1d('CRM_SETTINGS_HUB_SETTING_ACTIVITY_OUTGOING_EMAIL_OWNER_TYPE_TITLE');
	const why$14 = getMessage$1d('CRM_SETTINGS_HUB_SETTING_ACTIVITY_OUTGOING_EMAIL_OWNER_TYPE_WHY');
	const note$X = getMessage$1d('CRM_SETTINGS_HUB_SETTING_ACTIVITY_OUTGOING_EMAIL_OWNER_TYPE_NOTE');
	const optionKey$14 = 'activity_outgoing_email_owner_type';
	const description$14 = why$14 || note$X || optionKey$14;
	const options$9 = [{
		value: '1',
		label: getMessage$1d('CRM_SETTINGS_HUB_SETTING_ACTIVITY_OUTGOING_EMAIL_OWNER_TYPE_OPTION_1')
	}, {
		value: '3',
		label: getMessage$1d('CRM_SETTINGS_HUB_SETTING_ACTIVITY_OUTGOING_EMAIL_OWNER_TYPE_OPTION_3')
	}];
	const CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$14);
			return {
				description: description$14,
				options: options$9,
				title: title$14
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="activity_outgoing_email_owner_type"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$14 = {
		id: settingId$14,
		component: CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting,
		searchText: [title$14, why$14, note$X, optionKey$14, ...options$9.map(({
			label
		}) => label)],
		parentId: 'activity_enable_unconnected_recipients'
	};

	function getMessage$1c(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$13 = 'activity_enable_unconnected_recipients';
	const title$13 = getMessage$1c('CRM_SETTINGS_HUB_SETTING_ACTIVITY_ENABLE_UNCONNECTED_RECIPIENTS_TITLE');
	const why$13 = getMessage$1c('CRM_SETTINGS_HUB_SETTING_ACTIVITY_ENABLE_UNCONNECTED_RECIPIENTS_WHY');
	const note$W = getMessage$1c('CRM_SETTINGS_HUB_SETTING_ACTIVITY_ENABLE_UNCONNECTED_RECIPIENTS_NOTE');
	const optionKey$13 = 'activity_enable_unconnected_recipients';
	const description$13 = why$13 || note$W || optionKey$13;
	const CrmSettingsHubActivityEnableUnconnectedRecipientsSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubActivityEnableUnconnectedRecipientsSetting',
		components: {
			CrmSettingsHubToggleSettingView,
			CrmSettingsHubDependentSetting,
			CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting
		},
		setup() {
			const settingsStateContext = useSettingsStateContext();
			return {
				dependentVisible: ui_vue3.computed(() => settingsStateContext.get(settingId$13).raw === true),
				description: description$13,
				title: title$13
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="activity_enable_unconnected_recipients"
			:description="description"
			:title="title"
		>
			<template #dependents>
				<CrmSettingsHubDependentSetting :visible="dependentVisible">
					<CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting
						data-testid="crm-settings-hub-application-setting-activity_outgoing_email_owner_type"
					/>
				</CrmSettingsHubDependentSetting>
			</template>
		</CrmSettingsHubToggleSettingView>
	`
	});
	const registration$13 = {
		id: settingId$13,
		component: CrmSettingsHubActivityEnableUnconnectedRecipientsSetting,
		searchText: [title$13, why$13, note$W, optionKey$13]
	};

	function getMessage$1b(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$12 = 'email_service_code_allocation';
	const title$12 = getMessage$1b('CRM_SETTINGS_HUB_SETTING_EMAIL_SERVICE_CODE_ALLOCATION_TITLE');
	const why$12 = getMessage$1b('CRM_SETTINGS_HUB_SETTING_EMAIL_SERVICE_CODE_ALLOCATION_WHY');
	const note$V = '';
	const optionKey$12 = 'email_service_code_allocation';
	const description$12 = why$12 || note$V || optionKey$12;
	const options$8 = [{
		value: '2',
		label: getMessage$1b('CRM_SETTINGS_HUB_SETTING_EMAIL_SERVICE_CODE_ALLOCATION_OPTION_2')
	}, {
		value: '1',
		label: getMessage$1b('CRM_SETTINGS_HUB_SETTING_EMAIL_SERVICE_CODE_ALLOCATION_OPTION_1')
	}, {
		value: '0',
		label: getMessage$1b('CRM_SETTINGS_HUB_SETTING_EMAIL_SERVICE_CODE_ALLOCATION_OPTION_0')
	}];
	const CrmSettingsHubEmailServiceCodeAllocationSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEmailServiceCodeAllocationSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$12);
			return {
				description: description$12,
				options: options$8,
				title: title$12
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="email_service_code_allocation"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$12 = {
		id: settingId$12,
		component: CrmSettingsHubEmailServiceCodeAllocationSetting,
		searchText: [title$12, why$12, optionKey$12, ...options$8.map(({
			label
		}) => label)]
	};

	function getMessage$1a(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$11 = 'enable_b24_email_sign';
	const title$11 = getMessage$1a('CRM_SETTINGS_HUB_SETTING_ENABLE_B24_EMAIL_SIGN_TITLE');
	const why$11 = getMessage$1a('CRM_SETTINGS_HUB_SETTING_ENABLE_B24_EMAIL_SIGN_WHY');
	const note$U = '';
	const optionKey$11 = 'enable_b24_email_sign';
	const description$11 = why$11 || note$U || optionKey$11;
	const CrmSettingsHubEnableB24EmailSignSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableB24EmailSignSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$11);
			return {
				description: description$11,
				title: title$11
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_b24_email_sign"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$11 = {
		id: settingId$11,
		component: CrmSettingsHubEnableB24EmailSignSetting,
		searchText: [title$11, why$11, optionKey$11]
	};

	function getMessage$19(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$10 = 'mail_tracker';
	const navigationId$n = 'mail-client';
	const title$10 = getMessage$19('CRM_SETTINGS_HUB_SETTING_MAIL_TRACKER_TITLE');
	const why$10 = getMessage$19('CRM_SETTINGS_HUB_SETTING_MAIL_TRACKER_WHY');
	const note$T = getMessage$19('CRM_SETTINGS_HUB_SETTING_MAIL_TRACKER_NOTE');
	const optionKey$10 = '';
	const description$10 = why$10 || note$T || optionKey$10;
	const CrmSettingsHubMailTrackerSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubMailTrackerSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$10,
				navigationId: navigationId$n,
				settingId: settingId$10,
				title: title$10
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$10 = {
		id: settingId$10,
		navigationId: navigationId$n,
		component: CrmSettingsHubMailTrackerSetting,
		searchText: [title$10, why$10, note$T]
	};

	function getMessage$18(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$$ = 'mail_templates';
	const navigationId$m = 'mail-templates';
	const title$$ = getMessage$18('CRM_SETTINGS_HUB_SETTING_MAIL_TEMPLATES_TITLE');
	const why$$ = getMessage$18('CRM_SETTINGS_HUB_SETTING_MAIL_TEMPLATES_WHY');
	const optionKey$$ = '';
	const description$$ = why$$ || optionKey$$;
	const CrmSettingsHubMailTemplatesLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubMailTemplatesSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$$,
				navigationId: navigationId$m,
				settingId: settingId$$,
				title: title$$
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$$ = {
		id: settingId$$,
		navigationId: navigationId$m,
		component: CrmSettingsHubMailTemplatesLink,
		searchText: [title$$, why$$]
	};

	function getMessage$17(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$_ = 'callto_frmt';
	const title$_ = getMessage$17('CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_TITLE');
	const why$_ = getMessage$17('CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_WHY');
	const note$S = '';
	const optionKey$_ = 'callto_frmt';
	const description$_ = why$_ || note$S || optionKey$_;
	const options$7 = [{
		value: '1',
		label: getMessage$17('CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_OPTION_1')
	}, {
		value: '2',
		label: getMessage$17('CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_OPTION_2')
	}, {
		value: '4',
		label: getMessage$17('CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_OPTION_4')
	}, {
		value: '3',
		label: getMessage$17('CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_OPTION_3')
	}];
	const CrmSettingsHubCalltoFrmtSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCalltoFrmtSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$_);
			return {
				description: description$_,
				options: options$7,
				title: title$_
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="callto_frmt"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$_ = {
		id: settingId$_,
		component: CrmSettingsHubCalltoFrmtSetting,
		searchText: [title$_, why$_, optionKey$_, ...options$7.map(({
			label
		}) => label)]
	};

	const CrmSettingsHubTextSettingView = ui_vue3.defineComponent({
		name: 'CrmSettingsHubTextSettingView',
		components: {
			CrmSettingsHubSettingField,
			CrmSettingsHubSettingRow
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			settingId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				default: ''
			}
		},
		setup() {
			return {
				settingsStateContext: useSettingsStateContext()
			};
		},
		data() {
			return {
				draft: '',
				draftActive: false,
				validationError: false
			};
		},
		computed: {
			state() {
				return this.settingsStateContext.get(this.settingId);
			},
			displayTitle() {
				return this.title === '' ? this.state.title ?? '' : this.title;
			},
			displayDescription() {
				return this.description === '' ? this.state.hint ?? '' : this.description;
			},
			displayValue() {
				return this.draftActive ? this.draft : this.state.label ?? '';
			},
			placeholder() {
				return this.loc('CRM_SETTINGS_HUB_VALUE_EMPTY');
			},
			titleId() {
				return `crm-settings-hub-application-setting-${this.settingId}-title`;
			},
			errorId() {
				return `crm-settings-hub-application-setting-${this.settingId}-error`;
			},
			isDisabled() {
				return this.state.canEdit !== true || this.settingsStateContext.isPending(this.settingId);
			},
			inputType() {
				return this.state.schema?.type === 'integer' ? 'number' : 'text';
			},
			integerMin() {
				return this.state.schema?.type === 'integer' ? this.state.schema.min ?? undefined : undefined;
			},
			integerMax() {
				return this.state.schema?.type === 'integer' ? this.state.schema.max ?? undefined : undefined;
			},
			integerStep() {
				return this.state.schema?.type === 'integer' ? this.state.schema.step : undefined;
			}
		},
		methods: {
			updateDraft(value) {
				if (this.isDisabled) {
					return;
				}
				this.draft = value;
				this.draftActive = true;
				this.validationError = false;
			},
			commitDraft() {
				if (this.isDisabled || !this.draftActive) {
					return;
				}
				const {
					schema
				} = this.state;
				if (schema?.type === 'string') {
					this.saveValue(this.draft);
					return;
				}
				if (schema?.type !== 'integer') {
					return;
				}
				const normalizedDraft = this.draft.trim();
				if (!/^-?\d+$/.test(normalizedDraft)) {
					this.validationError = true;
					return;
				}
				const value = Number(normalizedDraft);
				const min = schema.min ?? Number.MIN_SAFE_INTEGER;
				const max = schema.max ?? Number.MAX_SAFE_INTEGER;
				const stepBase = schema.min ?? 0;
				if (Number.isSafeInteger(value) && value >= min && value <= max && (value - stepBase) % schema.step === 0) {
					this.saveValue(value);
					return;
				}
				this.validationError = true;
			},
			saveValue(value) {
				this.draftActive = false;
				this.validationError = false;
				void this.settingsStateContext.update(this.settingId, value);
			}
		},
		template: `
		<CrmSettingsHubSettingRow :action="null">
			<CrmSettingsHubSettingField
				:title="displayTitle"
				:title-id="titleId"
				:description="displayDescription"
				:unavailable="state.canEdit === false"
			>
				<template #value>
					<div
						class="crm-settings-hub-application__setting-field-value"
						:data-testid="'crm-settings-hub-application-setting-' + settingId + '-input'"
					>
						<div
							class="ui-system-input --l --stretched"
							:class="{ '--disabled': isDisabled, '--error': validationError }"
						>
							<div class="ui-system-input-container">
								<input
									class="ui-system-input-value"
									:value="displayValue"
									:placeholder="placeholder"
									:aria-label="displayTitle"
									:aria-invalid="validationError ? 'true' : null"
									:aria-describedby="validationError ? errorId : null"
									:disabled="isDisabled"
									:type="inputType"
									:min="integerMin"
									:max="integerMax"
									:step="integerStep"
									@click.stop
									@keydown.enter.stop.prevent="commitDraft"
									@input="updateDraft($event.target.value)"
									@blur="commitDraft"
								>
							</div>
							<div
								v-if="validationError"
								:id="errorId"
								class="ui-system-input-label --error"
								role="alert"
							>
								{{ loc('CRM_SETTINGS_HUB_INVALID_INTEGER') }}
							</div>
						</div>
					</div>
				</template>
			</CrmSettingsHubSettingField>
		</CrmSettingsHubSettingRow>
	`
	});

	function getMessage$16(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$Z = 'callto_url_template';
	const title$Z = getMessage$16('CRM_SETTINGS_HUB_SETTING_CALLTO_URL_TEMPLATE_TITLE');
	const why$Z = getMessage$16('CRM_SETTINGS_HUB_SETTING_CALLTO_URL_TEMPLATE_WHY');
	const note$R = getMessage$16('CRM_SETTINGS_HUB_SETTING_CALLTO_URL_TEMPLATE_NOTE');
	const optionKey$Z = 'callto_custom_settings';
	const description$Z = why$Z || note$R || optionKey$Z;
	const CrmSettingsHubCalltoUrlTemplateSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCalltoUrlTemplateSetting',
		components: {
			CrmSettingsHubTextSettingView
		},
		setup() {
			useSettingState(settingId$Z);
			return {
				description: description$Z,
				title: title$Z
			};
		},
		template: `
		<CrmSettingsHubTextSettingView
			setting-id="callto_url_template"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$Z = {
		id: settingId$Z,
		component: CrmSettingsHubCalltoUrlTemplateSetting,
		searchText: [title$Z, why$Z, note$R, optionKey$Z]
	};

	function getMessage$15(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$Y = 'callto_click_handler';
	const title$Y = getMessage$15('CRM_SETTINGS_HUB_SETTING_CALLTO_CLICK_HANDLER_TITLE');
	const why$Y = getMessage$15('CRM_SETTINGS_HUB_SETTING_CALLTO_CLICK_HANDLER_WHY');
	const note$Q = getMessage$15('CRM_SETTINGS_HUB_SETTING_CALLTO_CLICK_HANDLER_NOTE');
	const optionKey$Y = 'callto_custom_settings';
	const description$Y = why$Y || note$Q || optionKey$Y;
	const CrmSettingsHubCalltoClickHandlerSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCalltoClickHandlerSetting',
		components: {
			CrmSettingsHubTextSettingView
		},
		setup() {
			useSettingState(settingId$Y);
			return {
				description: description$Y,
				title: title$Y
			};
		},
		template: `
		<CrmSettingsHubTextSettingView
			setting-id="callto_click_handler"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$Y = {
		id: settingId$Y,
		component: CrmSettingsHubCalltoClickHandlerSetting,
		searchText: [title$Y, why$Y, note$Q, optionKey$Y]
	};

	function getMessage$14(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$X = 'callto_normalize_number';
	const title$X = getMessage$14('CRM_SETTINGS_HUB_SETTING_CALLTO_NORMALIZE_NUMBER_TITLE');
	const why$X = getMessage$14('CRM_SETTINGS_HUB_SETTING_CALLTO_NORMALIZE_NUMBER_WHY');
	const note$P = getMessage$14('CRM_SETTINGS_HUB_SETTING_CALLTO_NORMALIZE_NUMBER_NOTE');
	const optionKey$X = 'callto_custom_settings';
	const description$X = why$X || note$P || optionKey$X;
	const CrmSettingsHubCalltoNormalizeNumberSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCalltoNormalizeNumberSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$X);
			return {
				description: description$X,
				title: title$X
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="callto_normalize_number"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$X = {
		id: settingId$X,
		component: CrmSettingsHubCalltoNormalizeNumberSetting,
		searchText: [title$X, why$X, note$P, optionKey$X]
	};

	function getMessage$13(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$W = 'sms_limits';
	const navigationId$l = 'sms-limits';
	const title$W = getMessage$13('CRM_SETTINGS_HUB_SETTING_SMS_LIMITS_TITLE');
	const why$W = getMessage$13('CRM_SETTINGS_HUB_SETTING_SMS_LIMITS_WHY');
	const note$O = getMessage$13('CRM_SETTINGS_HUB_SETTING_SMS_LIMITS_NOTE');
	const optionKey$W = '';
	const description$W = why$W || note$O || optionKey$W;
	const CrmSettingsHubSmsLimitsSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubSmsLimitsSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$W,
				navigationId: navigationId$l,
				settingId: settingId$W,
				title: title$W
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$W = {
		id: settingId$W,
		navigationId: navigationId$l,
		component: CrmSettingsHubSmsLimitsSetting,
		searchText: [title$W, why$W, note$O]
	};

	function getMessage$12(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$V = 'crm_sender';
	const title$V = getMessage$12('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_TITLE');
	const why$V = getMessage$12('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_WHY');
	const note$N = getMessage$12('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_NOTE');
	const optionKey$V = '~CRM_SENDER';
	const description$V = why$V || note$N || optionKey$V;
	const options$6 = [{
		value: 'auto',
		label: getMessage$12('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_OPTION_AUTO')
	}, {
		value: 'bitrix24',
		label: getMessage$12('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_OPTION_BITRIX24')
	}, {
		value: 'sms_provider',
		label: getMessage$12('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_OPTION_SMS_PROVIDER')
	}, {
		value: 'mail',
		label: getMessage$12('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_OPTION_MAIL')
	}];
	const CrmSettingsHubCrmSenderSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCrmSenderSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$V);
			return {
				description: description$V,
				options: options$6,
				title: title$V
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="crm_sender"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$V = {
		id: settingId$V,
		component: CrmSettingsHubCrmSenderSetting,
		searchText: [title$V, why$V, note$N, optionKey$V, ...options$6.map(({
			label
		}) => label)]
	};

	function getMessage$11(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const commsSection = {
		id: 'comms',
		title: getMessage$11('CRM_SETTINGS_HUB_SECTION_COMMS_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'mail_and_channels',
			title: getMessage$11('CRM_SETTINGS_HUB_BLOCK_MAIL_AND_CHANNELS_TITLE'),
			icon: 'o-open-channels',
			settings: [registration$18, registration$17, registration$16]
		}, {
			id: 'emails',
			title: getMessage$11('CRM_SETTINGS_HUB_BLOCK_EMAILS_TITLE'),
			icon: 'o-mail',
			settings: [registration$15, registration$13, registration$14, registration$12, registration$11, registration$10, registration$$]
		}, {
			id: 'telephony',
			title: getMessage$11('CRM_SETTINGS_HUB_BLOCK_TELEPHONY_TITLE'),
			icon: 'o-telephony',
			settings: [registration$_, registration$Z, registration$Y, registration$X]
		}, {
			id: 'sms',
			title: getMessage$11('CRM_SETTINGS_HUB_BLOCK_SMS_TITLE'),
			icon: 'o-sms',
			settings: [registration$W]
		}, {
			id: 'notifications',
			title: getMessage$11('CRM_SETTINGS_HUB_BLOCK_NOTIFICATIONS_TITLE'),
			icon: 'o-notification',
			settings: [registration$V]
		}]
	};

	function getMessage$10(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$U = 'ai_call_processing_auto';
	const title$U = getMessage$10('CRM_SETTINGS_HUB_SETTING_AI_CALL_PROCESSING_AUTO_TITLE');
	const why$U = getMessage$10('CRM_SETTINGS_HUB_SETTING_AI_CALL_PROCESSING_AUTO_WHY');
	const note$M = getMessage$10('CRM_SETTINGS_HUB_SETTING_AI_CALL_PROCESSING_AUTO_NOTE');
	const optionKey$U = 'AI_CALL_PROCESSING_ALLOWED_AUTO_V2';
	const description$U = why$U || note$M || optionKey$U;
	const CrmSettingsHubAiCallProcessingAutoSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubAiCallProcessingAutoSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$U);
			return {
				description: description$U,
				title: title$U
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="ai_call_processing_auto"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$U = {
		id: settingId$U,
		component: CrmSettingsHubAiCallProcessingAutoSetting,
		searchText: [title$U, why$U, note$M, optionKey$U]
	};

	function getMessage$$(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$T = 'copilot_fill_item_from_call';
	const title$T = getMessage$$('CRM_SETTINGS_HUB_SETTING_COPILOT_FILL_ITEM_FROM_CALL_TITLE');
	const why$T = getMessage$$('CRM_SETTINGS_HUB_SETTING_COPILOT_FILL_ITEM_FROM_CALL_WHY');
	const note$L = '';
	const optionKey$T = 'crm_copilot_fill_item_from_call_enabled';
	const description$T = why$T || note$L || optionKey$T;
	const CrmSettingsHubCopilotFillItemFromCallSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCopilotFillItemFromCallSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$T);
			return {
				description: description$T,
				title: title$T
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="copilot_fill_item_from_call"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$T = {
		id: settingId$T,
		component: CrmSettingsHubCopilotFillItemFromCallSetting,
		searchText: [title$T, why$T, optionKey$T]
	};

	function getMessage$_(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$S = 'copilot_call_assessment';
	const title$S = getMessage$_('CRM_SETTINGS_HUB_SETTING_COPILOT_CALL_ASSESSMENT_TITLE');
	const why$S = getMessage$_('CRM_SETTINGS_HUB_SETTING_COPILOT_CALL_ASSESSMENT_WHY');
	const note$K = '';
	const optionKey$S = 'crm_copilot_call_assessment_enabled';
	const description$S = why$S || note$K || optionKey$S;
	const CrmSettingsHubCopilotCallAssessmentSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCopilotCallAssessmentSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$S);
			return {
				description: description$S,
				title: title$S
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="copilot_call_assessment"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$S = {
		id: settingId$S,
		component: CrmSettingsHubCopilotCallAssessmentSetting,
		searchText: [title$S, why$S, optionKey$S]
	};

	function getMessage$Z(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$R = 'copilot_analyze_communication';
	const title$R = getMessage$Z('CRM_SETTINGS_HUB_SETTING_COPILOT_ANALYZE_COMMUNICATION_TITLE');
	const why$R = getMessage$Z('CRM_SETTINGS_HUB_SETTING_COPILOT_ANALYZE_COMMUNICATION_WHY');
	const note$J = '';
	const optionKey$R = 'crm_copilot_analyze_communication_enabled';
	const description$R = why$R || note$J || optionKey$R;
	const CrmSettingsHubCopilotAnalyzeCommunicationSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCopilotAnalyzeCommunicationSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$R);
			return {
				description: description$R,
				title: title$R
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="copilot_analyze_communication"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$R = {
		id: settingId$R,
		component: CrmSettingsHubCopilotAnalyzeCommunicationSetting,
		searchText: [title$R, why$R, optionKey$R]
	};

	function getMessage$Y(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$Q = 'copilot_summarize';
	const title$Q = getMessage$Y('CRM_SETTINGS_HUB_SETTING_COPILOT_SUMMARIZE_TITLE');
	const why$Q = getMessage$Y('CRM_SETTINGS_HUB_SETTING_COPILOT_SUMMARIZE_WHY');
	const note$I = '';
	const optionKey$Q = 'crm_copilot_summarize_enabled';
	const description$Q = why$Q || note$I || optionKey$Q;
	const CrmSettingsHubCopilotSummarizeSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCopilotSummarizeSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$Q);
			return {
				description: description$Q,
				title: title$Q
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="copilot_summarize"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$Q = {
		id: settingId$Q,
		component: CrmSettingsHubCopilotSummarizeSetting,
		searchText: [title$Q, why$Q, optionKey$Q]
	};

	function getMessage$X(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$P = 'copilot_repeat_sale';
	const title$P = getMessage$X('CRM_SETTINGS_HUB_SETTING_COPILOT_REPEAT_SALE_TITLE');
	const why$P = getMessage$X('CRM_SETTINGS_HUB_SETTING_COPILOT_REPEAT_SALE_WHY');
	const note$H = '';
	const optionKey$P = 'crm_copilot_repeat_sale_enabled';
	const description$P = why$P || note$H || optionKey$P;
	const CrmSettingsHubCopilotRepeatSaleSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCopilotRepeatSaleSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$P);
			return {
				description: description$P,
				title: title$P
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="copilot_repeat_sale"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$P = {
		id: settingId$P,
		component: CrmSettingsHubCopilotRepeatSaleSetting,
		searchText: [title$P, why$P, optionKey$P]
	};

	function getMessage$W(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$O = 'copilot_fill_crm_text';
	const title$O = getMessage$W('CRM_SETTINGS_HUB_SETTING_COPILOT_FILL_CRM_TEXT_TITLE');
	const why$O = getMessage$W('CRM_SETTINGS_HUB_SETTING_COPILOT_FILL_CRM_TEXT_WHY');
	const note$G = '';
	const optionKey$O = 'crm_copilot_fill_crm_text_enabled';
	const description$O = why$O || note$G || optionKey$O;
	const CrmSettingsHubCopilotFillCrmTextSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCopilotFillCrmTextSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$O);
			return {
				description: description$O,
				title: title$O
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="copilot_fill_crm_text"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$O = {
		id: settingId$O,
		component: CrmSettingsHubCopilotFillCrmTextSetting,
		searchText: [title$O, why$O, optionKey$O]
	};

	function getMessage$V(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$N = 'copilot_message_sender_editor';
	const title$N = getMessage$V('CRM_SETTINGS_HUB_SETTING_COPILOT_MESSAGE_SENDER_EDITOR_TITLE');
	const why$N = getMessage$V('CRM_SETTINGS_HUB_SETTING_COPILOT_MESSAGE_SENDER_EDITOR_WHY');
	const note$F = '';
	const optionKey$N = 'crm_copilot_message_sender_editor_enabled';
	const description$N = why$N || note$F || optionKey$N;
	const CrmSettingsHubCopilotMessageSenderEditorSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCopilotMessageSenderEditorSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$N);
			return {
				description: description$N,
				title: title$N
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="copilot_message_sender_editor"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$N = {
		id: settingId$N,
		component: CrmSettingsHubCopilotMessageSenderEditorSetting,
		searchText: [title$N, why$N, optionKey$N]
	};

	function getMessage$U(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const copilotSection = {
		id: 'copilot',
		title: getMessage$U('CRM_SETTINGS_HUB_SECTION_COPILOT_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'copilot_calls',
			title: getMessage$U('CRM_SETTINGS_HUB_BLOCK_COPILOT_CALLS_TITLE'),
			icon: 'o-telephony',
			settings: [registration$U, registration$T, registration$S, registration$R, registration$Q]
		}, {
			id: 'copilot_assist',
			title: getMessage$U('CRM_SETTINGS_HUB_BLOCK_COPILOT_ASSIST_TITLE'),
			icon: 'o-ai-stars',
			settings: [registration$P, registration$O, registration$N]
		}]
	};

	function getMessage$T(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$M = 'payment_systems';
	const navigationId$k = 'payment-systems';
	const title$M = getMessage$T('CRM_SETTINGS_HUB_SETTING_PAYMENT_SYSTEMS_TITLE');
	const why$M = getMessage$T('CRM_SETTINGS_HUB_SETTING_PAYMENT_SYSTEMS_WHY');
	const note$E = '';
	const optionKey$M = '';
	const description$M = why$M || note$E || optionKey$M;
	const CrmSettingsHubPaymentSystemsLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubPaymentSystemsSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$M,
				navigationId: navigationId$k,
				settingId: settingId$M,
				title: title$M
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$M = {
		id: settingId$M,
		navigationId: navigationId$k,
		component: CrmSettingsHubPaymentSystemsLink,
		searchText: [title$M, why$M]
	};

	function getMessage$S(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$L = 'payment_marketplace';
	const navigationId$j = 'payment-marketplace';
	const title$L = getMessage$S('CRM_SETTINGS_HUB_SETTING_PAYMENT_MARKETPLACE_TITLE');
	const why$L = getMessage$S('CRM_SETTINGS_HUB_SETTING_PAYMENT_MARKETPLACE_WHY');
	const note$D = getMessage$S('CRM_SETTINGS_HUB_SETTING_PAYMENT_MARKETPLACE_NOTE');
	const optionKey$L = '';
	const description$L = why$L || note$D || optionKey$L;
	const CrmSettingsHubPaymentMarketplaceSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubPaymentMarketplaceSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$L,
				navigationId: navigationId$j,
				settingId: settingId$L,
				title: title$L
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$L = {
		id: settingId$L,
		navigationId: navigationId$j,
		component: CrmSettingsHubPaymentMarketplaceSetting,
		searchText: [title$L, why$L, note$D]
	};

	function getMessage$R(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$K = 'requisites_templates';
	const navigationId$i = 'requisite-templates';
	const title$K = getMessage$R('CRM_SETTINGS_HUB_SETTING_REQUISITES_TEMPLATES_TITLE');
	const why$K = getMessage$R('CRM_SETTINGS_HUB_SETTING_REQUISITES_TEMPLATES_WHY');
	const optionKey$K = '';
	const description$K = why$K || optionKey$K;
	const CrmSettingsHubRequisitesTemplatesLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubRequisitesTemplatesSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$K,
				navigationId: navigationId$i,
				settingId: settingId$K,
				title: title$K
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$K = {
		id: settingId$K,
		navigationId: navigationId$i,
		component: CrmSettingsHubRequisitesTemplatesLink,
		searchText: [title$K, why$K]
	};

	function getMessage$Q(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$J = 'my_companies_requisites';
	const navigationId$h = 'my-companies';
	const title$J = getMessage$Q('CRM_SETTINGS_HUB_SETTING_MY_COMPANIES_REQUISITES_TITLE');
	const why$J = getMessage$Q('CRM_SETTINGS_HUB_SETTING_MY_COMPANIES_REQUISITES_WHY');
	const optionKey$J = '';
	const description$J = why$J || optionKey$J;
	const CrmSettingsHubMyCompaniesRequisitesLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubMyCompaniesRequisitesSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$J,
				navigationId: navigationId$h,
				settingId: settingId$J,
				title: title$J
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$J = {
		id: settingId$J,
		navigationId: navigationId$h,
		component: CrmSettingsHubMyCompaniesRequisitesLink,
		searchText: [title$J, why$J]
	};

	function getMessage$P(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$I = 'doc_numerators';
	const navigationId$g = 'document-numerators';
	const title$I = getMessage$P('CRM_SETTINGS_HUB_SETTING_DOC_NUMERATORS_TITLE');
	const why$I = getMessage$P('CRM_SETTINGS_HUB_SETTING_DOC_NUMERATORS_WHY');
	const note$C = '';
	const optionKey$I = '';
	const description$I = why$I || note$C || optionKey$I;
	const CrmSettingsHubDocNumeratorsLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubDocNumeratorsSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$I,
				navigationId: navigationId$g,
				settingId: settingId$I,
				title: title$I
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$I = {
		id: settingId$I,
		navigationId: navigationId$g,
		component: CrmSettingsHubDocNumeratorsLink,
		searchText: [title$I, why$I]
	};

	function getMessage$O(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$H = 'numerator_invoices';
	const navigationId$f = 'smart-invoice-numerator';
	const title$H = getMessage$O('CRM_SETTINGS_HUB_SETTING_NUMERATOR_INVOICES_TITLE');
	const why$H = getMessage$O('CRM_SETTINGS_HUB_SETTING_NUMERATOR_INVOICES_WHY');
	const note$B = '';
	const optionKey$H = '';
	const description$H = why$H || note$B || optionKey$H;
	const CrmSettingsHubNumeratorInvoicesSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubNumeratorInvoicesSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$H,
				navigationId: navigationId$f,
				settingId: settingId$H,
				title: title$H
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$H = {
		id: settingId$H,
		navigationId: navigationId$f,
		component: CrmSettingsHubNumeratorInvoicesSetting,
		searchText: [title$H, why$H]
	};

	function getMessage$N(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$G = 'numerator_invoices_old';
	const navigationId$e = 'legacy-invoice-numerator';
	const title$G = getMessage$N('CRM_SETTINGS_HUB_SETTING_NUMERATOR_INVOICES_OLD_TITLE');
	const why$G = getMessage$N('CRM_SETTINGS_HUB_SETTING_NUMERATOR_INVOICES_OLD_WHY');
	const note$A = getMessage$N('CRM_SETTINGS_HUB_SETTING_NUMERATOR_INVOICES_OLD_NOTE');
	const optionKey$G = '';
	const description$G = why$G || note$A || optionKey$G;
	const CrmSettingsHubNumeratorInvoicesOldSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubNumeratorInvoicesOldSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$G,
				navigationId: navigationId$e,
				settingId: settingId$G,
				title: title$G
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$G = {
		id: settingId$G,
		navigationId: navigationId$e,
		component: CrmSettingsHubNumeratorInvoicesOldSetting,
		searchText: [title$G, why$G, note$A]
	};

	function getMessage$M(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$F = 'numerator_quotes';
	const navigationId$d = 'quote-numerator';
	const title$F = getMessage$M('CRM_SETTINGS_HUB_SETTING_NUMERATOR_QUOTES_TITLE');
	const why$F = getMessage$M('CRM_SETTINGS_HUB_SETTING_NUMERATOR_QUOTES_WHY');
	const note$z = '';
	const optionKey$F = '';
	const description$F = why$F || note$z || optionKey$F;
	const CrmSettingsHubNumeratorQuotesSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubNumeratorQuotesSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$F,
				navigationId: navigationId$d,
				settingId: settingId$F,
				title: title$F
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$F = {
		id: settingId$F,
		navigationId: navigationId$d,
		component: CrmSettingsHubNumeratorQuotesSetting,
		searchText: [title$F, why$F]
	};

	function getMessage$L(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const docsSection = {
		id: 'docs',
		title: getMessage$L('CRM_SETTINGS_HUB_SECTION_DOCS_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'payment',
			title: getMessage$L('CRM_SETTINGS_HUB_BLOCK_PAYMENT_TITLE'),
			icon: 'o-payment',
			settings: [registration$M, registration$L]
		}, {
			id: 'requisites',
			title: getMessage$L('CRM_SETTINGS_HUB_BLOCK_REQUISITES_TITLE'),
			icon: 'o-company',
			settings: [registration$K, registration$J]
		}, {
			id: 'numerators',
			title: getMessage$L('CRM_SETTINGS_HUB_BLOCK_NUMERATORS_TITLE'),
			icon: 'o-numbered-list',
			settings: [registration$I, registration$H, registration$G, registration$F]
		}]
	};

	function getMessage$K(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$E = 'history_enable_export_event';
	const title$E = getMessage$K('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_EXPORT_EVENT_TITLE');
	const why$E = getMessage$K('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_EXPORT_EVENT_WHY');
	const note$y = '';
	const optionKey$E = 'history_enable_export_event';
	const description$E = why$E || note$y || optionKey$E;
	const CrmSettingsHubHistoryEnableExportEventSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubHistoryEnableExportEventSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$E);
			return {
				description: description$E,
				title: title$E
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="history_enable_export_event"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$E = {
		id: settingId$E,
		component: CrmSettingsHubHistoryEnableExportEventSetting,
		searchText: [title$E, why$E, optionKey$E]
	};

	function getMessage$J(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$D = 'history_enable_view_event';
	const title$D = getMessage$J('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_VIEW_EVENT_TITLE');
	const why$D = getMessage$J('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_VIEW_EVENT_WHY');
	const note$x = '';
	const optionKey$D = 'history_enable_view_event';
	const description$D = why$D || note$x || optionKey$D;
	const CrmSettingsHubHistoryEnableViewEventSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubHistoryEnableViewEventSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$D);
			return {
				description: description$D,
				title: title$D
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="history_enable_view_event"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$D = {
		id: settingId$D,
		component: CrmSettingsHubHistoryEnableViewEventSetting,
		searchText: [title$D, why$D, optionKey$D]
	};

	function getMessage$I(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$C = 'history_view_event_group_interval';
	const title$C = getMessage$I('CRM_SETTINGS_HUB_SETTING_HISTORY_VIEW_EVENT_GROUP_INTERVAL_TITLE');
	const why$C = getMessage$I('CRM_SETTINGS_HUB_SETTING_HISTORY_VIEW_EVENT_GROUP_INTERVAL_WHY');
	const note$w = '';
	const optionKey$C = 'history_view_event_group_interval';
	const description$C = why$C || note$w || optionKey$C;
	const CrmSettingsHubHistoryViewEventGroupIntervalSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubHistoryViewEventGroupIntervalSetting',
		components: {
			CrmSettingsHubTextSettingView
		},
		setup() {
			useSettingState(settingId$C);
			return {
				description: description$C,
				title: title$C
			};
		},
		template: `
		<CrmSettingsHubTextSettingView
			setting-id="history_view_event_group_interval"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$C = {
		id: settingId$C,
		component: CrmSettingsHubHistoryViewEventGroupIntervalSetting,
		searchText: [title$C, why$C, optionKey$C]
	};

	function getMessage$H(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$B = 'history_enable_lead_rm_event';
	const title$B = getMessage$H('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_LEAD_RM_EVENT_TITLE');
	const why$B = getMessage$H('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_LEAD_RM_EVENT_WHY');
	const note$v = '';
	const optionKey$B = 'history_enable_lead_rm_event';
	const description$B = why$B || note$v || optionKey$B;
	const CrmSettingsHubHistoryEnableLeadRmEventSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubHistoryEnableLeadRmEventSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$B);
			return {
				description: description$B,
				title: title$B
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="history_enable_lead_rm_event"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$B = {
		id: settingId$B,
		component: CrmSettingsHubHistoryEnableLeadRmEventSetting,
		searchText: [title$B, why$B, optionKey$B]
	};

	function getMessage$G(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$A = 'history_enable_contact_rm_event';
	const title$A = getMessage$G('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_CONTACT_RM_EVENT_TITLE');
	const why$A = getMessage$G('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_CONTACT_RM_EVENT_WHY');
	const note$u = '';
	const optionKey$A = 'history_enable_contact_rm_event';
	const description$A = why$A || note$u || optionKey$A;
	const CrmSettingsHubHistoryEnableContactRmEventSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubHistoryEnableContactRmEventSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$A);
			return {
				description: description$A,
				title: title$A
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="history_enable_contact_rm_event"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$A = {
		id: settingId$A,
		component: CrmSettingsHubHistoryEnableContactRmEventSetting,
		searchText: [title$A, why$A, optionKey$A]
	};

	function getMessage$F(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$z = 'history_enable_company_rm_event';
	const title$z = getMessage$F('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_COMPANY_RM_EVENT_TITLE');
	const why$z = getMessage$F('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_COMPANY_RM_EVENT_WHY');
	const note$t = '';
	const optionKey$z = 'history_enable_company_rm_event';
	const description$z = why$z || note$t || optionKey$z;
	const CrmSettingsHubHistoryEnableCompanyRmEventSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubHistoryEnableCompanyRmEventSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$z);
			return {
				description: description$z,
				title: title$z
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="history_enable_company_rm_event"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$z = {
		id: settingId$z,
		component: CrmSettingsHubHistoryEnableCompanyRmEventSetting,
		searchText: [title$z, why$z, optionKey$z]
	};

	function getMessage$E(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$y = 'history_enable_deal_rm_event';
	const title$y = getMessage$E('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_DEAL_RM_EVENT_TITLE');
	const why$y = getMessage$E('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_DEAL_RM_EVENT_WHY');
	const note$s = '';
	const optionKey$y = 'history_enable_deal_rm_event';
	const description$y = why$y || note$s || optionKey$y;
	const CrmSettingsHubHistoryEnableDealRmEventSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubHistoryEnableDealRmEventSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$y);
			return {
				description: description$y,
				title: title$y
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="history_enable_deal_rm_event"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$y = {
		id: settingId$y,
		component: CrmSettingsHubHistoryEnableDealRmEventSetting,
		searchText: [title$y, why$y, optionKey$y]
	};

	function getMessage$D(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$x = 'history_enable_quote_rm_event';
	const title$x = getMessage$D('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_QUOTE_RM_EVENT_TITLE');
	const why$x = getMessage$D('CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_QUOTE_RM_EVENT_WHY');
	const note$r = '';
	const optionKey$x = 'history_enable_quote_rm_event';
	const description$x = why$x || note$r || optionKey$x;
	const CrmSettingsHubHistoryEnableQuoteRmEventSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubHistoryEnableQuoteRmEventSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$x);
			return {
				description: description$x,
				title: title$x
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="history_enable_quote_rm_event"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$x = {
		id: settingId$x,
		component: CrmSettingsHubHistoryEnableQuoteRmEventSetting,
		searchText: [title$x, why$x, optionKey$x]
	};

	function getMessage$C(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$w = 'enable_deal_recycle_bin';
	const title$w = getMessage$C('CRM_SETTINGS_HUB_SETTING_ENABLE_DEAL_RECYCLE_BIN_TITLE');
	const why$w = getMessage$C('CRM_SETTINGS_HUB_SETTING_ENABLE_DEAL_RECYCLE_BIN_WHY');
	const note$q = '';
	const optionKey$w = 'enable_deal_recycle_bin';
	const description$w = why$w || note$q || optionKey$w;
	const CrmSettingsHubEnableDealRecycleBinSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableDealRecycleBinSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$w);
			return {
				description: description$w,
				title: title$w
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_deal_recycle_bin"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$w = {
		id: settingId$w,
		component: CrmSettingsHubEnableDealRecycleBinSetting,
		searchText: [title$w, why$w, optionKey$w]
	};

	function getMessage$B(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$v = 'enable_lead_recycle_bin';
	const title$v = getMessage$B('CRM_SETTINGS_HUB_SETTING_ENABLE_LEAD_RECYCLE_BIN_TITLE');
	const why$v = getMessage$B('CRM_SETTINGS_HUB_SETTING_ENABLE_LEAD_RECYCLE_BIN_WHY');
	const note$p = '';
	const optionKey$v = 'enable_lead_recycle_bin';
	const description$v = why$v || note$p || optionKey$v;
	const CrmSettingsHubEnableLeadRecycleBinSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableLeadRecycleBinSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$v);
			return {
				description: description$v,
				title: title$v
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_lead_recycle_bin"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$v = {
		id: settingId$v,
		component: CrmSettingsHubEnableLeadRecycleBinSetting,
		searchText: [title$v, why$v, optionKey$v]
	};

	function getMessage$A(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$u = 'enable_contact_recycle_bin';
	const title$u = getMessage$A('CRM_SETTINGS_HUB_SETTING_ENABLE_CONTACT_RECYCLE_BIN_TITLE');
	const why$u = getMessage$A('CRM_SETTINGS_HUB_SETTING_ENABLE_CONTACT_RECYCLE_BIN_WHY');
	const note$o = '';
	const optionKey$u = 'enable_contact_recycle_bin';
	const description$u = why$u || note$o || optionKey$u;
	const CrmSettingsHubEnableContactRecycleBinSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableContactRecycleBinSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$u);
			return {
				description: description$u,
				title: title$u
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_contact_recycle_bin"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$u = {
		id: settingId$u,
		component: CrmSettingsHubEnableContactRecycleBinSetting,
		searchText: [title$u, why$u, optionKey$u]
	};

	function getMessage$z(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$t = 'enable_company_recycle_bin';
	const title$t = getMessage$z('CRM_SETTINGS_HUB_SETTING_ENABLE_COMPANY_RECYCLE_BIN_TITLE');
	const why$t = getMessage$z('CRM_SETTINGS_HUB_SETTING_ENABLE_COMPANY_RECYCLE_BIN_WHY');
	const note$n = '';
	const optionKey$t = 'enable_company_recycle_bin';
	const description$t = why$t || note$n || optionKey$t;
	const CrmSettingsHubEnableCompanyRecycleBinSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableCompanyRecycleBinSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$t);
			return {
				description: description$t,
				title: title$t
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_company_recycle_bin"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$t = {
		id: settingId$t,
		component: CrmSettingsHubEnableCompanyRecycleBinSetting,
		searchText: [title$t, why$t, optionKey$t]
	};

	function getMessage$y(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$s = 'recyclebin_ttl';
	const title$s = getMessage$y('CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_TITLE');
	const why$s = getMessage$y('CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_WHY');
	const note$m = '';
	const optionKey$s = 'recyclebin_ttl';
	const description$s = why$s || note$m || optionKey$s;
	const options$5 = [{
		value: '30',
		label: getMessage$y('CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_OPTION_30')
	}, {
		value: '60',
		label: getMessage$y('CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_OPTION_60')
	}, {
		value: '90',
		label: getMessage$y('CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_OPTION_90')
	}, {
		value: '0',
		label: getMessage$y('CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_OPTION_0')
	}];
	const CrmSettingsHubRecyclebinTtlSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubRecyclebinTtlSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$s);
			return {
				description: description$s,
				options: options$5,
				title: title$s
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="recyclebin_ttl"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$s = {
		id: settingId$s,
		component: CrmSettingsHubRecyclebinTtlSetting,
		searchText: [title$s, why$s, optionKey$s, ...options$5.map(({
			label
		}) => label)]
	};

	function getMessage$x(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$r = 'volume';
	const navigationId$c = 'crm-volume';
	const title$r = getMessage$x('CRM_SETTINGS_HUB_SETTING_VOLUME_TITLE');
	const why$r = getMessage$x('CRM_SETTINGS_HUB_SETTING_VOLUME_WHY');
	const note$l = getMessage$x('CRM_SETTINGS_HUB_SETTING_VOLUME_NOTE');
	const optionKey$r = '';
	const description$r = why$r || note$l || optionKey$r;
	const CrmSettingsHubVolumeSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubVolumeSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$r,
				navigationId: navigationId$c,
				settingId: settingId$r,
				title: title$r
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$r = {
		id: settingId$r,
		navigationId: navigationId$c,
		component: CrmSettingsHubVolumeSetting,
		searchText: [title$r, why$r, note$l]
	};

	function getMessage$w(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const historySection = {
		id: 'history',
		title: getMessage$w('CRM_SETTINGS_HUB_SECTION_HISTORY_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'events',
			title: getMessage$w('CRM_SETTINGS_HUB_BLOCK_EVENTS_TITLE'),
			icon: 'o-timeline',
			settings: [registration$E, registration$D, registration$C, registration$B, registration$A, registration$z, registration$y, registration$x]
		}, {
			id: 'recycle_bin',
			title: getMessage$w('CRM_SETTINGS_HUB_BLOCK_RECYCLE_BIN_TITLE'),
			icon: 'o-trashcan',
			settings: [registration$w, registration$v, registration$u, registration$t, registration$s]
		}, {
			id: 'disk_space',
			title: getMessage$w('CRM_SETTINGS_HUB_BLOCK_DISK_SPACE_TITLE'),
			icon: 'o-storage',
			settings: [registration$r]
		}]
	};

	function getMessage$v(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$q = 'external_sale';
	const navigationId$b = 'external-sale';
	const title$q = getMessage$v('CRM_SETTINGS_HUB_SETTING_EXTERNAL_SALE_TITLE');
	const why$q = getMessage$v('CRM_SETTINGS_HUB_SETTING_EXTERNAL_SALE_WHY');
	const optionKey$q = '';
	const description$q = why$q || optionKey$q;
	const CrmSettingsHubExternalSaleLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubExternalSaleSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$q,
				navigationId: navigationId$b,
				settingId: settingId$q,
				title: title$q
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$q = {
		id: settingId$q,
		navigationId: navigationId$b,
		component: CrmSettingsHubExternalSaleLink,
		searchText: [title$q, why$q]
	};

	function getMessage$u(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$p = 'integrations_sms';
	const navigationId$a = 'sms-integrations';
	const title$p = getMessage$u('CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_SMS_TITLE');
	const why$p = getMessage$u('CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_SMS_WHY');
	const optionKey$p = '';
	const description$p = why$p || optionKey$p;
	const CrmSettingsHubIntegrationsSmsLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubIntegrationsSmsSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$p,
				navigationId: navigationId$a,
				settingId: settingId$p,
				title: title$p
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$p = {
		id: settingId$p,
		navigationId: navigationId$a,
		component: CrmSettingsHubIntegrationsSmsLink,
		searchText: [title$p, why$p]
	};

	function getMessage$t(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$o = 'integrations_1c';
	const navigationId$9 = 'exchange-1c';
	const title$o = getMessage$t('CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_1C_TITLE');
	const why$o = getMessage$t('CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_1C_WHY');
	const optionKey$o = '';
	const description$o = why$o || optionKey$o;
	const CrmSettingsHubIntegrations1cLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubIntegrations1cSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$o,
				navigationId: navigationId$9,
				settingId: settingId$o,
				title: title$o
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$o = {
		id: settingId$o,
		navigationId: navigationId$9,
		component: CrmSettingsHubIntegrations1cLink,
		searchText: [title$o, why$o]
	};

	function getMessage$s(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$n = 'crm_migration';
	const navigationId$8 = 'crm-migration';
	const title$n = getMessage$s('CRM_SETTINGS_HUB_SETTING_CRM_MIGRATION_TITLE');
	const why$n = getMessage$s('CRM_SETTINGS_HUB_SETTING_CRM_MIGRATION_WHY');
	const note$k = getMessage$s('CRM_SETTINGS_HUB_SETTING_CRM_MIGRATION_NOTE');
	const optionKey$n = '';
	const description$n = why$n || note$k || optionKey$n;
	const CrmSettingsHubCrmMigrationSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCrmMigrationSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$n,
				navigationId: navigationId$8,
				settingId: settingId$n,
				title: title$n
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$n = {
		id: settingId$n,
		navigationId: navigationId$8,
		component: CrmSettingsHubCrmMigrationSetting,
		searchText: [title$n, why$n, note$k]
	};

	function getMessage$r(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const integrationsSection = {
		id: 'integrations',
		title: getMessage$r('CRM_SETTINGS_HUB_SECTION_INTEGRATIONS_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'external_systems',
			title: getMessage$r('CRM_SETTINGS_HUB_BLOCK_EXTERNAL_SYSTEMS_TITLE'),
			icon: 'o-connection',
			settings: [registration$q, registration$p, registration$o, registration$n]
		}]
	};

	function getMessage$q(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$m = 'lead_default_list_view';
	const title$m = getMessage$q('CRM_SETTINGS_HUB_SETTING_LEAD_DEFAULT_LIST_VIEW_TITLE');
	const why$m = getMessage$q('CRM_SETTINGS_HUB_SETTING_LEAD_DEFAULT_LIST_VIEW_WHY');
	const note$j = '';
	const optionKey$m = 'lead_default_list_view';
	const description$m = why$m || note$j || optionKey$m;
	const options$4 = [{
		value: '1',
		label: getMessage$q('CRM_SETTINGS_HUB_SETTING_LEAD_DEFAULT_LIST_VIEW_OPTION_1')
	}, {
		value: '3',
		label: getMessage$q('CRM_SETTINGS_HUB_SETTING_LEAD_DEFAULT_LIST_VIEW_OPTION_3')
	}];
	const CrmSettingsHubLeadDefaultListViewSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubLeadDefaultListViewSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$m);
			return {
				description: description$m,
				options: options$4,
				title: title$m
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="lead_default_list_view"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$m = {
		id: settingId$m,
		component: CrmSettingsHubLeadDefaultListViewSetting,
		searchText: [title$m, why$m, optionKey$m, ...options$4.map(({
			label
		}) => label)]
	};

	function getMessage$p(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$l = 'contact_default_list_view';
	const title$l = getMessage$p('CRM_SETTINGS_HUB_SETTING_CONTACT_DEFAULT_LIST_VIEW_TITLE');
	const why$l = getMessage$p('CRM_SETTINGS_HUB_SETTING_CONTACT_DEFAULT_LIST_VIEW_WHY');
	const note$i = getMessage$p('CRM_SETTINGS_HUB_SETTING_CONTACT_DEFAULT_LIST_VIEW_NOTE');
	const optionKey$l = 'contact_default_list_view';
	const description$l = why$l || note$i || optionKey$l;
	const options$3 = [{
		value: '1',
		label: getMessage$p('CRM_SETTINGS_HUB_SETTING_CONTACT_DEFAULT_LIST_VIEW_OPTION_1')
	}];
	const CrmSettingsHubContactDefaultListViewSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubContactDefaultListViewSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$l);
			return {
				description: description$l,
				options: options$3,
				title: title$l
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="contact_default_list_view"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$l = {
		id: settingId$l,
		component: CrmSettingsHubContactDefaultListViewSetting,
		searchText: [title$l, why$l, note$i, optionKey$l, ...options$3.map(({
			label
		}) => label)]
	};

	function getMessage$o(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$k = 'company_default_list_view';
	const title$k = getMessage$o('CRM_SETTINGS_HUB_SETTING_COMPANY_DEFAULT_LIST_VIEW_TITLE');
	const why$k = getMessage$o('CRM_SETTINGS_HUB_SETTING_COMPANY_DEFAULT_LIST_VIEW_WHY');
	const note$h = getMessage$o('CRM_SETTINGS_HUB_SETTING_COMPANY_DEFAULT_LIST_VIEW_NOTE');
	const optionKey$k = 'company_default_list_view';
	const description$k = why$k || note$h || optionKey$k;
	const options$2 = [{
		value: '1',
		label: getMessage$o('CRM_SETTINGS_HUB_SETTING_COMPANY_DEFAULT_LIST_VIEW_OPTION_1')
	}];
	const CrmSettingsHubCompanyDefaultListViewSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubCompanyDefaultListViewSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$k);
			return {
				description: description$k,
				options: options$2,
				title: title$k
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="company_default_list_view"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$k = {
		id: settingId$k,
		component: CrmSettingsHubCompanyDefaultListViewSetting,
		searchText: [title$k, why$k, note$h, optionKey$k, ...options$2.map(({
			label
		}) => label)]
	};

	function getMessage$n(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$j = 'deal_default_list_view';
	const title$j = getMessage$n('CRM_SETTINGS_HUB_SETTING_DEAL_DEFAULT_LIST_VIEW_TITLE');
	const why$j = getMessage$n('CRM_SETTINGS_HUB_SETTING_DEAL_DEFAULT_LIST_VIEW_WHY');
	const note$g = '';
	const optionKey$j = 'deal_default_list_view';
	const description$j = why$j || note$g || optionKey$j;
	const options$1 = [{
		value: '1',
		label: getMessage$n('CRM_SETTINGS_HUB_SETTING_DEAL_DEFAULT_LIST_VIEW_OPTION_1')
	}, {
		value: '3',
		label: getMessage$n('CRM_SETTINGS_HUB_SETTING_DEAL_DEFAULT_LIST_VIEW_OPTION_3')
	}];
	const CrmSettingsHubDealDefaultListViewSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubDealDefaultListViewSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$j);
			return {
				description: description$j,
				options: options$1,
				title: title$j
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="deal_default_list_view"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$j = {
		id: settingId$j,
		component: CrmSettingsHubDealDefaultListViewSetting,
		searchText: [title$j, why$j, optionKey$j, ...options$1.map(({
			label
		}) => label)]
	};

	function getMessage$m(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$i = 'invoice_default_list_view';
	const title$i = getMessage$m('CRM_SETTINGS_HUB_SETTING_INVOICE_DEFAULT_LIST_VIEW_TITLE');
	const why$i = getMessage$m('CRM_SETTINGS_HUB_SETTING_INVOICE_DEFAULT_LIST_VIEW_WHY');
	const note$f = '';
	const optionKey$i = 'invoice_default_list_view';
	const description$i = why$i || note$f || optionKey$i;
	const options = [{
		value: '1',
		label: getMessage$m('CRM_SETTINGS_HUB_SETTING_INVOICE_DEFAULT_LIST_VIEW_OPTION_1')
	}, {
		value: '3',
		label: getMessage$m('CRM_SETTINGS_HUB_SETTING_INVOICE_DEFAULT_LIST_VIEW_OPTION_3')
	}];
	const CrmSettingsHubInvoiceDefaultListViewSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubInvoiceDefaultListViewSetting',
		components: {
			CrmSettingsHubSelectSettingView
		},
		setup() {
			useSettingState(settingId$i);
			return {
				description: description$i,
				options,
				title: title$i
			};
		},
		template: `
		<CrmSettingsHubSelectSettingView
			setting-id="invoice_default_list_view"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$i = {
		id: settingId$i,
		component: CrmSettingsHubInvoiceDefaultListViewSetting,
		searchText: [title$i, why$i, optionKey$i, ...options.map(({
			label
		}) => label)]
	};

	function getMessage$l(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$h = 'enable_user_name_sorting';
	const title$h = getMessage$l('CRM_SETTINGS_HUB_SETTING_ENABLE_USER_NAME_SORTING_TITLE');
	const why$h = getMessage$l('CRM_SETTINGS_HUB_SETTING_ENABLE_USER_NAME_SORTING_WHY');
	const note$e = '';
	const optionKey$h = 'enable_user_name_sorting';
	const description$h = why$h || note$e || optionKey$h;
	const CrmSettingsHubEnableUserNameSortingSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableUserNameSortingSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$h);
			return {
				description: description$h,
				title: title$h
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_user_name_sorting"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$h = {
		id: settingId$h,
		component: CrmSettingsHubEnableUserNameSortingSetting,
		searchText: [title$h, why$h, optionKey$h]
	};

	function getMessage$k(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$g = 'enable_simple_time_format';
	const title$g = getMessage$k('CRM_SETTINGS_HUB_SETTING_ENABLE_SIMPLE_TIME_FORMAT_TITLE');
	const why$g = getMessage$k('CRM_SETTINGS_HUB_SETTING_ENABLE_SIMPLE_TIME_FORMAT_WHY');
	const note$d = '';
	const optionKey$g = 'enable_simple_time_format';
	const description$g = why$g || note$d || optionKey$g;
	const CrmSettingsHubEnableSimpleTimeFormatSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableSimpleTimeFormatSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$g);
			return {
				description: description$g,
				title: title$g
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_simple_time_format"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$g = {
		id: settingId$g,
		component: CrmSettingsHubEnableSimpleTimeFormatSetting,
		searchText: [title$g, why$g, optionKey$g]
	};

	function getMessage$j(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const interfaceSection = {
		id: 'interface',
		title: getMessage$j('CRM_SETTINGS_HUB_SECTION_INTERFACE_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'list_views',
			title: getMessage$j('CRM_SETTINGS_HUB_BLOCK_LIST_VIEWS_TITLE'),
			icon: 'o-list-viewer',
			settings: [registration$m, registration$l, registration$k, registration$j, registration$i]
		}, {
			id: 'display',
			title: getMessage$j('CRM_SETTINGS_HUB_BLOCK_DISPLAY_TITLE'),
			icon: 'o-screen',
			settings: [registration$h, registration$g]
		}]
	};

	function getMessage$i(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$f = 'enable_slider';
	const title$f = getMessage$i('CRM_SETTINGS_HUB_SETTING_ENABLE_SLIDER_TITLE');
	const why$f = getMessage$i('CRM_SETTINGS_HUB_SETTING_ENABLE_SLIDER_WHY');
	const note$c = getMessage$i('CRM_SETTINGS_HUB_SETTING_ENABLE_SLIDER_NOTE');
	const optionKey$f = 'enable_slider';
	const description$f = why$f || note$c || optionKey$f;
	const CrmSettingsHubEnableSliderSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableSliderSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$f);
			return {
				description: description$f,
				title: title$f
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_slider"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$f = {
		id: settingId$f,
		component: CrmSettingsHubEnableSliderSetting,
		searchText: [title$f, why$f, note$c, optionKey$f]
	};

	function getMessage$h(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$e = 'enable_depricated_statuses';
	const title$e = getMessage$h('CRM_SETTINGS_HUB_SETTING_ENABLE_DEPRICATED_STATUSES_TITLE');
	const why$e = getMessage$h('CRM_SETTINGS_HUB_SETTING_ENABLE_DEPRICATED_STATUSES_WHY');
	const note$b = '';
	const optionKey$e = 'enable_depricated_statuses';
	const description$e = why$e || note$b || optionKey$e;
	const CrmSettingsHubEnableDepricatedStatusesSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableDepricatedStatusesSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$e);
			return {
				description: description$e,
				title: title$e
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_depricated_statuses"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$e = {
		id: settingId$e,
		component: CrmSettingsHubEnableDepricatedStatusesSetting,
		searchText: [title$e, why$e, optionKey$e]
	};

	function getMessage$g(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$d = 'enable_auto_using_finished_lead';
	const title$d = getMessage$g('CRM_SETTINGS_HUB_SETTING_ENABLE_AUTO_USING_FINISHED_LEAD_TITLE');
	const why$d = getMessage$g('CRM_SETTINGS_HUB_SETTING_ENABLE_AUTO_USING_FINISHED_LEAD_WHY');
	const note$a = '';
	const optionKey$d = 'enable_auto_using_finished_lead';
	const description$d = why$d || note$a || optionKey$d;
	const CrmSettingsHubEnableAutoUsingFinishedLeadSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableAutoUsingFinishedLeadSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$d);
			return {
				description: description$d,
				title: title$d
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_auto_using_finished_lead"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$d = {
		id: settingId$d,
		component: CrmSettingsHubEnableAutoUsingFinishedLeadSetting,
		searchText: [title$d, why$d, optionKey$d]
	};

	function getMessage$f(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const legacySection = {
		id: 'legacy',
		title: getMessage$f('CRM_SETTINGS_HUB_SECTION_LEGACY_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'compatibility',
			title: getMessage$f('CRM_SETTINGS_HUB_BLOCK_COMPATIBILITY_TITLE'),
			icon: 'o-alert',
			settings: [registration$f, registration$e, registration$d]
		}]
	};

	function getMessage$e(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$c = 'rest_enable_req_uf_check';
	const title$c = getMessage$e('CRM_SETTINGS_HUB_SETTING_REST_ENABLE_REQ_UF_CHECK_TITLE');
	const why$c = getMessage$e('CRM_SETTINGS_HUB_SETTING_REST_ENABLE_REQ_UF_CHECK_WHY');
	const note$9 = getMessage$e('CRM_SETTINGS_HUB_SETTING_REST_ENABLE_REQ_UF_CHECK_NOTE');
	const optionKey$c = 'rest_enable_req_uf_check';
	const description$c = why$c || note$9 || optionKey$c;
	const CrmSettingsHubRestEnableReqUfCheckSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubRestEnableReqUfCheckSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$c);
			return {
				description: description$c,
				title: title$c
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="rest_enable_req_uf_check"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$c = {
		id: settingId$c,
		component: CrmSettingsHubRestEnableReqUfCheckSetting,
		searchText: [title$c, why$c, note$9, optionKey$c]
	};

	function getMessage$d(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$b = 'marketplace';
	const navigationId$7 = 'crm-marketplace';
	const title$b = getMessage$d('CRM_SETTINGS_HUB_SETTING_MARKETPLACE_TITLE');
	const why$b = getMessage$d('CRM_SETTINGS_HUB_SETTING_MARKETPLACE_WHY');
	const note$8 = getMessage$d('CRM_SETTINGS_HUB_SETTING_MARKETPLACE_NOTE');
	const optionKey$b = '';
	const description$b = why$b || note$8 || optionKey$b;
	const CrmSettingsHubMarketplaceSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubMarketplaceSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$b,
				navigationId: navigationId$7,
				settingId: settingId$b,
				title: title$b
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$b = {
		id: settingId$b,
		navigationId: navigationId$7,
		component: CrmSettingsHubMarketplaceSetting,
		searchText: [title$b, why$b, note$8]
	};

	function getMessage$c(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$a = 'app_configuration';
	const navigationId$6 = 'app-configuration';
	const title$a = getMessage$c('CRM_SETTINGS_HUB_SETTING_APP_CONFIGURATION_TITLE');
	const why$a = getMessage$c('CRM_SETTINGS_HUB_SETTING_APP_CONFIGURATION_WHY');
	const note$7 = getMessage$c('CRM_SETTINGS_HUB_SETTING_APP_CONFIGURATION_NOTE');
	const optionKey$a = '';
	const description$a = why$a || note$7 || optionKey$a;
	const CrmSettingsHubAppConfigurationSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubAppConfigurationSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$a,
				navigationId: navigationId$6,
				settingId: settingId$a,
				title: title$a
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$a = {
		id: settingId$a,
		navigationId: navigationId$6,
		component: CrmSettingsHubAppConfigurationSetting,
		searchText: [title$a, why$a, note$7]
	};

	function getMessage$b(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const restSection = {
		id: 'rest',
		title: getMessage$b('CRM_SETTINGS_HUB_SECTION_REST_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'rest_api',
			title: getMessage$b('CRM_SETTINGS_HUB_BLOCK_REST_API_TITLE'),
			icon: 'o-developer-resources',
			settings: [registration$c]
		}, {
			id: 'applications',
			title: getMessage$b('CRM_SETTINGS_HUB_BLOCK_APPLICATIONS_TITLE'),
			icon: 'o-apps',
			settings: [registration$b, registration$a]
		}]
	};

	function getMessage$a(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$9 = 'pipelines';
	const navigationId$5 = 'pipelines';
	const title$9 = getMessage$a('CRM_SETTINGS_HUB_SETTING_PIPELINES_TITLE');
	const why$9 = getMessage$a('CRM_SETTINGS_HUB_SETTING_PIPELINES_WHY');
	const optionKey$9 = '';
	const description$9 = why$9 || optionKey$9;
	const CrmSettingsHubPipelinesLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubPipelinesSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$9,
				navigationId: navigationId$5,
				settingId: settingId$9,
				title: title$9
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$9 = {
		id: settingId$9,
		navigationId: navigationId$5,
		component: CrmSettingsHubPipelinesLink,
		searchText: [title$9, why$9]
	};

	function getMessage$9(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$8 = 'user_fields';
	const navigationId$4 = 'user-fields';
	const title$8 = getMessage$9('CRM_SETTINGS_HUB_SETTING_USER_FIELDS_TITLE');
	const why$8 = getMessage$9('CRM_SETTINGS_HUB_SETTING_USER_FIELDS_WHY');
	const optionKey$8 = '';
	const description$8 = why$8 || optionKey$8;
	const CrmSettingsHubUserFieldsLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubUserFieldsSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$8,
				navigationId: navigationId$4,
				settingId: settingId$8,
				title: title$8
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$8 = {
		id: settingId$8,
		navigationId: navigationId$4,
		component: CrmSettingsHubUserFieldsLink,
		searchText: [title$8, why$8]
	};

	function getMessage$8(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$7 = 'directories';
	const navigationId$3 = 'directories';
	const title$7 = getMessage$8('CRM_SETTINGS_HUB_SETTING_DIRECTORIES_TITLE');
	const why$7 = getMessage$8('CRM_SETTINGS_HUB_SETTING_DIRECTORIES_WHY');
	const note$6 = getMessage$8('CRM_SETTINGS_HUB_SETTING_DIRECTORIES_NOTE');
	const optionKey$7 = '';
	const description$7 = why$7 || note$6 || optionKey$7;
	const CrmSettingsHubDirectoriesSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubDirectoriesSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$7,
				navigationId: navigationId$3,
				settingId: settingId$7,
				title: title$7
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$7 = {
		id: settingId$7,
		navigationId: navigationId$3,
		component: CrmSettingsHubDirectoriesSetting,
		searchText: [title$7, why$7, note$6]
	};

	function getMessage$7(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$6 = 'stop_list';
	const navigationId$2 = 'stop-list';
	const title$6 = getMessage$7('CRM_SETTINGS_HUB_SETTING_STOP_LIST_TITLE');
	const why$6 = getMessage$7('CRM_SETTINGS_HUB_SETTING_STOP_LIST_WHY');
	const optionKey$6 = '';
	const description$6 = why$6 || optionKey$6;
	const CrmSettingsHubStopListLink = ui_vue3.defineComponent({
		name: 'CrmSettingsHubStopListSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$6,
				navigationId: navigationId$2,
				settingId: settingId$6,
				title: title$6
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$6 = {
		id: settingId$6,
		navigationId: navigationId$2,
		component: CrmSettingsHubStopListLink,
		searchText: [title$6, why$6]
	};

	function getMessage$6(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$5 = 'analytics_reports';
	const navigationId$1 = 'analytics-reports';
	const title$5 = getMessage$6('CRM_SETTINGS_HUB_SETTING_ANALYTICS_REPORTS_TITLE');
	const why$5 = getMessage$6('CRM_SETTINGS_HUB_SETTING_ANALYTICS_REPORTS_WHY');
	const note$5 = getMessage$6('CRM_SETTINGS_HUB_SETTING_ANALYTICS_REPORTS_NOTE');
	const optionKey$5 = '';
	const description$5 = why$5 || note$5 || optionKey$5;
	const CrmSettingsHubAnalyticsReportsSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubAnalyticsReportsSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$5,
				navigationId: navigationId$1,
				settingId: settingId$5,
				title: title$5
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$5 = {
		id: settingId$5,
		navigationId: navigationId$1,
		component: CrmSettingsHubAnalyticsReportsSetting,
		searchText: [title$5, why$5, note$5]
	};

	function getMessage$5(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$4 = 'locations';
	const navigationId = 'locations';
	const title$4 = getMessage$5('CRM_SETTINGS_HUB_SETTING_LOCATIONS_TITLE');
	const why$4 = getMessage$5('CRM_SETTINGS_HUB_SETTING_LOCATIONS_WHY');
	const note$4 = getMessage$5('CRM_SETTINGS_HUB_SETTING_LOCATIONS_NOTE');
	const optionKey$4 = '';
	const description$4 = why$4 || note$4 || optionKey$4;
	const CrmSettingsHubLocationsSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubLocationsSetting',
		components: {
			CrmSettingsHubSidePanelLink
		},
		setup() {
			return {
				description: description$4,
				navigationId,
				settingId: settingId$4,
				title: title$4
			};
		},
		template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$4 = {
		id: settingId$4,
		navigationId,
		component: CrmSettingsHubLocationsSetting,
		searchText: [title$4, why$4, note$4]
	};

	function getMessage$4(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$3 = 'conversion_enable_autocreate';
	const title$3 = getMessage$4('CRM_SETTINGS_HUB_SETTING_CONVERSION_ENABLE_AUTOCREATE_TITLE');
	const why$3 = getMessage$4('CRM_SETTINGS_HUB_SETTING_CONVERSION_ENABLE_AUTOCREATE_WHY');
	const note$3 = '';
	const optionKey$3 = 'conversion_enable_autocreate';
	const description$3 = why$3 || note$3 || optionKey$3;
	const CrmSettingsHubConversionEnableAutocreateSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubConversionEnableAutocreateSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$3);
			return {
				description: description$3,
				title: title$3
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="conversion_enable_autocreate"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$3 = {
		id: settingId$3,
		component: CrmSettingsHubConversionEnableAutocreateSetting,
		searchText: [title$3, why$3, optionKey$3]
	};

	function getMessage$3(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$2 = 'enable_auto_gen_rc';
	const title$2 = getMessage$3('CRM_SETTINGS_HUB_SETTING_ENABLE_AUTO_GEN_RC_TITLE');
	const why$2 = getMessage$3('CRM_SETTINGS_HUB_SETTING_ENABLE_AUTO_GEN_RC_WHY');
	const note$2 = '';
	const optionKey$2 = 'enable_auto_gen_rc';
	const description$2 = why$2 || note$2 || optionKey$2;
	const CrmSettingsHubEnableAutoGenRcSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableAutoGenRcSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$2);
			return {
				description: description$2,
				title: title$2
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_auto_gen_rc"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$2 = {
		id: settingId$2,
		component: CrmSettingsHubEnableAutoGenRcSetting,
		searchText: [title$2, why$2, optionKey$2]
	};

	function getMessage$2(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId$1 = 'enable_close_date_sync';
	const title$1 = getMessage$2('CRM_SETTINGS_HUB_SETTING_ENABLE_CLOSE_DATE_SYNC_TITLE');
	const why$1 = getMessage$2('CRM_SETTINGS_HUB_SETTING_ENABLE_CLOSE_DATE_SYNC_WHY');
	const note$1 = '';
	const optionKey$1 = 'enable_close_date_sync';
	const description$1 = why$1 || note$1 || optionKey$1;
	const CrmSettingsHubEnableCloseDateSyncSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubEnableCloseDateSyncSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId$1);
			return {
				description: description$1,
				title: title$1
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="enable_close_date_sync"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration$1 = {
		id: settingId$1,
		component: CrmSettingsHubEnableCloseDateSyncSetting,
		searchText: [title$1, why$1, optionKey$1]
	};

	function getMessage$1(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const settingId = 'act_task_keep_unbound';
	const title = getMessage$1('CRM_SETTINGS_HUB_SETTING_ACT_TASK_KEEP_UNBOUND_TITLE');
	const why = getMessage$1('CRM_SETTINGS_HUB_SETTING_ACT_TASK_KEEP_UNBOUND_WHY');
	const note = '';
	const optionKey = 'act_task_keep_unbound';
	const description = why || note || optionKey;
	const CrmSettingsHubActTaskKeepUnboundSetting = ui_vue3.defineComponent({
		name: 'CrmSettingsHubActTaskKeepUnboundSetting',
		components: {
			CrmSettingsHubToggleSettingView
		},
		setup() {
			useSettingState(settingId);
			return {
				description,
				title
			};
		},
		template: `
		<CrmSettingsHubToggleSettingView
			setting-id="act_task_keep_unbound"
			:description="description"
			:title="title"
		/>
	`
	});
	const registration = {
		id: settingId,
		component: CrmSettingsHubActTaskKeepUnboundSetting,
		searchText: [title, why, optionKey]
	};

	function getMessage(key) {
		return main_core.Loc.getMessage(key) ?? '';
	}
	const salesSection = {
		id: 'sales',
		title: getMessage('CRM_SETTINGS_HUB_SECTION_SALES_TITLE'),
		type: 'settings-group',
		blocks: [{
			id: 'funnels',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_FUNNELS_TITLE'),
			icon: 'o-filter-funnel',
			settings: [registration$9]
		}, {
			id: 'fields_and_reports',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_FIELDS_AND_REPORTS_TITLE'),
			icon: 'o-table',
			settings: [registration$8, registration$7, registration$6, registration$5, registration$4]
		}, {
			id: 'deals',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_DEALS_TITLE'),
			icon: 'o-handshake',
			settings: [registration$3, registration$2, registration$1, registration]
		}]
	};

	const settingsSectionRegistry = [salesSection, clientsSection, activitiesSection, automationSection, copilotSection, commsSection, docsSection, catalogSection, accessSection, integrationsSection, interfaceSection, historySection, restSection, legacySection];

	const callToCode = 'crm.format.callto';
	const callToValuePaths = ['format', 'urlTemplate', 'clickHandler', 'normalizeNumber'];
	function validateBindingIds(registry, bindings) {
		for (const id of registry.keys()) {
			if (!bindings.has(id)) {
				throw new Error(`Missing setting binding: "${id}"`);
			}
		}
		for (const id of bindings.keys()) {
			if (!registry.has(id)) {
				throw new Error(`Unknown setting binding id: "${id}"`);
			}
		}
	}
	function validateValuePath(id, binding) {
		if (binding.valuePath === undefined) {
			if (binding.code === callToCode) {
				throw new Error(`Missing value path for setting binding: "${id}"`);
			}
			return;
		}
		if (binding.code !== callToCode || !callToValuePaths.includes(binding.valuePath)) {
			throw new Error(`Unknown setting binding value path: "${binding.valuePath}"`);
		}
	}
	function validateCodeCounts(codeCounts) {
		for (const [code, count] of codeCounts) {
			if (count > 1 && code !== callToCode) {
				throw new Error(`Duplicate setting binding code: "${code}"`);
			}
		}
	}
	function validateV2Bindings(bindings) {
		const codeCounts = new Map();
		const actualCallToPaths = new Set();
		for (const [id, binding] of bindings) {
			if (binding.kind !== 'v2') {
				continue;
			}
			validateValuePath(id, binding);
			codeCounts.set(binding.code, (codeCounts.get(binding.code) ?? 0) + 1);
			if (binding.valuePath !== undefined) {
				actualCallToPaths.add(binding.valuePath);
			}
		}
		validateCodeCounts(codeCounts);
		if (codeCounts.get(callToCode) !== callToValuePaths.length || actualCallToPaths.size !== callToValuePaths.length) {
			throw new Error(`Invalid repeated setting binding code: "${callToCode}"`);
		}
	}
	function validateNavigationBindings(registry, bindings) {
		const navigationIds = new Set();
		for (const [id, registration] of registry) {
			const binding = bindings.get(id);
			if (binding === undefined) {
				throw new Error(`Missing setting binding: "${id}"`);
			}
			const {
				navigationId
			} = registration;
			if (binding.kind === 'navigation') {
				if (navigationId === undefined || navigationId.trim() === '') {
					throw new Error(`Missing navigation id for setting registration: "${id}"`);
				}
			} else if (navigationId !== undefined) {
				throw new Error(`Unexpected navigation id for setting registration: "${id}"`);
			}
			if (navigationId !== undefined) {
				if (navigationIds.has(navigationId)) {
					throw new Error(`Duplicate setting navigation id: "${navigationId}"`);
				}
				navigationIds.add(navigationId);
			}
		}
	}
	function validateSettingBindings(registry, bindings) {
		validateBindingIds(registry, bindings);
		validateNavigationBindings(registry, bindings);
		validateV2Bindings(bindings);
	}
	function createSettingRegistry(sections, bindings = settingBindingRegistry) {
		const registry = new Map();
		for (const section of sections) {
			for (const block of section.blocks) {
				for (const setting of block.settings) {
					if (registry.has(setting.id)) {
						throw new Error(`Duplicate setting registration id: "${setting.id}"`);
					}
					registry.set(setting.id, setting);
				}
			}
		}
		validateSettingBindings(registry, bindings);
		return registry;
	}
	const settingRegistry = createSettingRegistry(settingsSectionRegistry);

	const defaultSectionId = settingsSectionRegistry[0]?.id ?? null;
	function collectVisibleSettingIds(section, filter, settingsStateContext, navigationContext) {
		const ids = new Set();
		for (const block of section.blocks) {
			const availableSettings = block.settings.filter(setting => setting.navigationId === undefined || navigationContext.get(setting.navigationId) !== null).filter(setting => settingsStateContext.isVisible(setting.id)).map(setting => ({
				...setting,
				searchText: [...setting.searchText, ...settingsStateContext.getSearchText(setting.id)]
			}));
			for (const setting of filter.filterBlock(block.title, availableSettings)) {
				ids.add(setting.id);
			}
		}
		return ids;
	}
	function createRootState() {
		return {
			rootElement: ui_vue3.ref(null),
			contentElement: ui_vue3.ref(null),
			query: ui_vue3.ref(''),
			selectedSectionId: ui_vue3.ref(defaultSectionId),
			activeMatrixSettingId: ui_vue3.ref(null)
		};
	}
	function createFilter(query) {
		const filter = new HubFilter();
		filter.setQuery(query);
		return filter;
	}
	function createRootDerived(state, settingsStateContext, navigationContext) {
		const activeMatrix = ui_vue3.computed(() => {
			const id = state.activeMatrixSettingId.value;
			return id === null ? null : settingsStateContext.get(id).matrix ?? null;
		});
		const visibleSections = ui_vue3.computed(() => {
			const filter = createFilter(state.query.value);
			return settingsSectionRegistry.filter(section => collectVisibleSettingIds(section, filter, settingsStateContext, navigationContext).size > 0);
		});
		const currentSection = ui_vue3.computed(() => settingsSectionRegistry.find(section => section.id === state.selectedSectionId.value) ?? null);
		const visibleSettingIds = ui_vue3.computed(() => {
			if (currentSection.value === null) {
				return new Set();
			}
			return collectVisibleSettingIds(currentSection.value, createFilter(state.query.value), settingsStateContext, navigationContext);
		});
		const isNarrowed = ui_vue3.computed(() => state.query.value !== '');
		const titleId = ui_vue3.computed(() => currentSection.value === null ? null : `crm-settings-hub-settings-section-${currentSection.value.id}-title`);
		return {
			activeMatrix,
			currentSection,
			isNarrowed,
			titleId,
			visibleSections,
			visibleSettingIds
		};
	}
	function resetContentScroll(element) {
		const scrollContainer = element;
		if (scrollContainer !== null) {
			scrollContainer.scrollTop = 0;
		}
	}
	function focusWithin(root, selector) {
		root?.querySelector(selector)?.focus({
			preventScroll: true
		});
	}
	function createQueryCommands(state, derived) {
		const {
			contentElement,
			query,
			selectedSectionId
		} = state;
		let queryTimer = null;
		function cancelPendingQuery() {
			if (queryTimer !== null) {
				window.clearTimeout(queryTimer);
				queryTimer = null;
			}
		}
		function applyQuery(value) {
			query.value = createFilter(value).query;
			queryTimer = null;
			if (derived.visibleSections.value.some(section => section.id === selectedSectionId.value)) {
				return;
			}
			const [firstVisibleSection] = derived.visibleSections.value;
			if (firstVisibleSection !== undefined) {
				selectedSectionId.value = firstVisibleSection.id;
				ui_vue3.nextTick(() => resetContentScroll(contentElement.value));
			}
		}
		function updateQuery(value) {
			cancelPendingQuery();
			queryTimer = window.setTimeout(() => applyQuery(value), 150);
		}
		function resetQuery() {
			cancelPendingQuery();
			query.value = '';
		}
		return {
			cancelPendingQuery,
			resetQuery,
			updateQuery
		};
	}
	function createNavigationCommands(state, derived) {
		const {
			contentElement,
			rootElement,
			selectedSectionId
		} = state;
		function selectSection(id) {
			if (!derived.visibleSections.value.some(section => section.id === id)) {
				return;
			}
			selectedSectionId.value = id;
			ui_vue3.nextTick(() => {
				resetContentScroll(contentElement.value);
				focusWithin(rootElement.value, '.crm-settings-hub-application__menu-item[aria-current="page"]');
			});
		}
		return {
			selectSection
		};
	}
	function createSettingCommands(state, settingsStateContext) {
		const {
			activeMatrixSettingId
		} = state;
		function activate(action) {
			if (action.type === 'matrix') {
				const matrix = settingRegistry.has(action.settingId) ? settingsStateContext.get(action.settingId).matrix ?? null : null;
				activeMatrixSettingId.value = matrix === null ? null : action.settingId;
				return;
			}
			activateConfigTarget(action);
		}
		function closeMatrix() {
			activeMatrixSettingId.value = null;
		}
		return {
			activate,
			closeMatrix
		};
	}
	const ignoreUpdateError = () => {};
	const CrmSettingsHubRoot = ui_vue3.defineComponent({
		name: 'CrmSettingsHubRoot',
		components: {
			CrmSettingsHubHubSidebar,
			CrmSettingsHubMatrixDialog,
			CrmSettingsHubSettingsGroupPanel
		},
		props: {
			settingsState: {
				type: Object,
				required: true
			},
			settingsService: {
				type: Object,
				default: null
			},
			onUpdateError: {
				type: Function,
				default: ignoreUpdateError
			},
			readOnly: {
				type: Boolean,
				default: true
			}
		},
		setup(props) {
			const {
				onUpdateError,
				settingsService,
				settingsState
			} = ui_vue3.toRefs(props);
			const navigationContext = useNavigationContext();
			const settingsStateContext = provideSettingsState(settingsState.value);
			if (settingsService.value !== null) {
				settingsStateContext.setUpdateHandler(createUpdateSetting(settingsStateContext, settingsService.value, onUpdateError.value));
			}
			const state = createRootState();
			const derived = createRootDerived(state, settingsStateContext, navigationContext);
			const queryCommands = createQueryCommands(state, derived);
			const navigationCommands = createNavigationCommands(state, derived);
			const settingCommands = createSettingCommands(state, settingsStateContext);
			ui_vue3.onBeforeUnmount(() => {
				queryCommands.cancelPendingQuery();
				state.activeMatrixSettingId.value = null;
			});
			return {
				...state,
				...derived,
				activate: settingCommands.activate,
				closeMatrix: settingCommands.closeMatrix,
				resetQuery: queryCommands.resetQuery,
				selectSection: navigationCommands.selectSection,
				updateQuery: queryCommands.updateQuery
			};
		},
		template: `
		<div
			ref="rootElement"
			class="crm-settings-hub-application"
			data-testid="crm-settings-hub-application-root"
		>
			<div
				class="crm-settings-hub-application__layout"
				data-testid="crm-settings-hub-application-layout"
			>
				<CrmSettingsHubHubSidebar
					:sections="visibleSections"
					:selected-id="selectedSectionId"
					:query="query"
					@select-section="selectSection"
					@update-query="updateQuery"
					@clear-query="resetQuery"
				/>
				<div
					ref="contentElement"
					class="crm-settings-hub-application__content"
					data-testid="crm-settings-hub-application-content"
				>
					<section
						class="crm-settings-hub-application__panel"
						data-testid="crm-settings-hub-application-panel"
						role="region"
						tabindex="-1"
						:aria-labelledby="titleId"
					>
						<CrmSettingsHubSettingsGroupPanel
							v-if="currentSection"
							:section="currentSection"
							:visible-setting-ids="visibleSettingIds"
							:is-narrowed="isNarrowed"
							@reset-search="resetQuery"
							@activate="activate"
						/>
					</section>
				</div>
			</div>
			<CrmSettingsHubMatrixDialog
				:setting-id="activeMatrixSettingId"
				:matrix="activeMatrix"
				:open="activeMatrix !== null"
				@close="closeMatrix"
			/>
		</div>
	`
	});

	function fail(path, message) {
		throw new TypeError(`Invalid Settings Hub bootstrap at ${path}: ${message}`);
	}
	function readRecord(value, path) {
		return main_core.Type.isPlainObject(value) ? value : fail(path, 'plain object expected');
	}
	function assertExactKeys(record, keys, path) {
		const actualKeys = Object.keys(record);
		if (actualKeys.length !== keys.length || actualKeys.some(key => !keys.includes(key))) {
			fail(path, `expected fields ${keys.join(', ')}`);
		}
	}
	function parseNavigationTarget(value, path) {
		const target = readRecord(value, path);
		if (target.available === false) {
			assertExactKeys(target, ['available'], path);
			return {
				available: false
			};
		}
		if (target.available !== true) {
			return fail(`${path}.available`, 'boolean expected');
		}
		assertExactKeys(target, ['available', 'url'], path);
		if (!main_core.Type.isString(target.url) || target.url.trim() === '') {
			return fail(`${path}.url`, 'non-empty string expected');
		}
		return {
			available: true,
			url: target.url
		};
	}
	function parseNavigationTargets(value, path) {
		const source = readRecord(value, path);
		const navigation = Object.create(null);
		for (const [navigationId, target] of Object.entries(source)) {
			navigation[navigationId] = parseNavigationTarget(target, `${path}.${navigationId}`);
		}
		return navigation;
	}
	function hydrateSettingsHubBootstrap(value) {
		const bootstrap = readRecord(value, 'root');
		assertExactKeys(bootstrap, ['settings', 'navigation'], 'root');
		return {
			settings: hydrateSettingsPresentation({
				settings: bootstrap.settings
			}),
			navigation: parseNavigationTargets(bootstrap.navigation, 'root.navigation')
		};
	}

	const UPDATE_ACTION = 'crm.v2.Settings.Update.update';
	class SettingsService {
		#ajaxClient;
		constructor(ajaxClient = main_core.ajax) {
			this.#ajaxClient = ajaxClient;
		}
		async update(code, value) {
			const response = await this.#ajaxClient.runAction(UPDATE_ACTION, {
				json: {
					code,
					value
				}
			});
			return parseSettingsPresentation(response.data.presentation);
		}
	}

	class App {
		static #application = null;
		static start(container, bootstrap) {
			if (!main_core.Type.isElementNode(container)) {
				throw new TypeError('App.start expects an existing DOM element');
			}
			const {
				settings: settingsState,
				navigation
			} = hydrateSettingsHubBootstrap(bootstrap);
			const settingsService = new SettingsService();
			this.stop();
			const application = ui_vue3.BitrixVue.createApp(CrmSettingsHubRoot, {
				settingsState,
				settingsService,
				onUpdateError: () => {
					ui_notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_SETTINGS_HUB_SAVE_ERROR') ?? '',
						autoHideDelay: 5000
					});
				}
			});
			application.provide(navigationContextKey, createNavigationContext(navigation));
			this.#application = application;
			try {
				application.mount(container);
			} catch (error) {
				this.stop();
				throw error;
			}
		}
		static stop() {
			try {
				this.#application?.unmount();
			} finally {
				this.#application = null;
			}
		}
	}

	exports.App = App;
	exports.CrmSettingsHubSidePanelLink = CrmSettingsHubSidePanelLink;

})(this.BX.Crm.SettingsHub.Application = this.BX.Crm.SettingsHub.Application || {}, BX, BX.UI.Notification, BX.Vue3, BX.Vue3.Mixins, BX.UI.System.Input.Vue, BX.UI.Vue3.Components, BX.Vue3.Components, BX.UI.IconSet, window, BX.UI, BX.UI.System.Label, BX.UI.System.Label.Vue, BX.UI.Vue3.Components, BX.UI);
//# sourceMappingURL=application.bundle.js.map
