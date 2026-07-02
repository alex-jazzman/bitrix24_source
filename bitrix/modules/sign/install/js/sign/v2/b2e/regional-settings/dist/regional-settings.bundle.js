/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, ui_vue3, ui_vue3_pinia, sign_v2_b2e_vueUtil, main_date, sign_v2_api, ui_vue3_components_hint, main_popup, ui_vue3_components_switcher, ui_switcher, sign_v2_b2e_hcmLinkCompanySelector, crm_router, main_core_events) {
	'use strict';

	const DefaultDocumentSettings = {
		date: {
			sourceType: 'manual',
			value: new Date(),
			hcmLinkSettingId: null
		},
		externalId: {
			sourceType: 'manual',
			value: null,
			hcmLinkSettingId: null
		},
		hcmLinkDocumentTypeSettingId: null,
		documentType: null
	};
	const useRegionalSettingsStore = ui_vue3_pinia.defineStore('sign-b2e-regional-settings-store', {
		state: () => ({
			currentDocumentUid: null,
			companyId: null,
			isIntegrationEnabled: false,
			isIntegrationVisible: true,
			documentTypeList: [],
			hcmLinkCompanyId: null,
			hcmLinkAvailableSettings: {
				documentTypeList: [],
				externalIdTypeList: [],
				dateTypeList: []
			},
			documentSettingsMap: new Map(),
			documentsGroup: new Map(),
			previewUrlList: new Map()
		}),
		getters: {
			currentDocumentSettings(state) {
				if (!state.currentDocumentUid || !state.documentSettingsMap.has(state.currentDocumentUid)) {
					return DefaultDocumentSettings;
				}
				return state.documentSettingsMap.get(state.currentDocumentUid);
			}
		},
		actions: {
			init(options) {
				this.documentTypeList = options.documentTypeList;
			},
			updateDocumentsGroup(documentsGroup) {
				const documentsToDelete = [...this.documentsGroup.keys()].filter(key => !documentsGroup.has(key));
				documentsToDelete.forEach(key => {
					this.documentsGroup.delete(key);
					this.documentSettingsMap.delete(key);
				});
				for (const [uid, documentDetail] of documentsGroup) {
					const documentDetailPrevious = this.documentsGroup.has(uid) ? this.documentsGroup.get(uid) : {};
					if (documentDetail.previewUrl === null) {
						this.previewUrlList.delete(uid);
					}
					this.documentsGroup.set(uid, {
						...documentDetailPrevious,
						...documentDetail
					});
					if (this.documentSettingsMap.has(uid)) {
						continue;
					}
					const settings = {
						date: {
							sourceType: documentDetail.externalDateCreateSourceType,
							hcmLinkSettingId: documentDetail.hcmLinkDateSettingId,
							value: documentDetail.externalDateCreate ? new Date(documentDetail.externalDateCreate) : new Date()
						},
						externalId: {
							sourceType: documentDetail.externalIdSourceType,
							hcmLinkSettingId: documentDetail.hcmLinkExternalIdSettingId,
							value: documentDetail.externalId
						},
						hcmLinkDocumentTypeSettingId: documentDetail.hcmLinkDocumentTypeSettingId,
						documentType: documentDetail.regionDocumentType
					};
					this.documentSettingsMap.set(uid, settings);
					if (this.hcmLinkCompanyId === null) {
						this.modifyHcmLinkCompanyId(documentDetail.hcmLinkCompanyId);
					}
				}
				if (documentsToDelete.includes(this.currentDocumentUid)) {
					this.currentDocumentUid = null;
				}
				const documentsToAdd = [...documentsGroup.keys()].filter(key => !this.documentSettingsMap.has(key));
				documentsToAdd.forEach(key => {
					this.documentSettingsMap.set(key, {
						...DefaultDocumentSettings,
						documentType: this.documentTypeList[0].code ?? null
					});
				});
				if (this.currentDocumentUid === null) {
					this.currentDocumentUid = documentsToAdd[0] ?? null;
				}
			},
			modifyHcmLinkCompanyId(id) {
				if (id === null) {
					for (const [uid, settings] of this.documentSettingsMap) {
						this.documentSettingsMap.set(uid, {
							...settings,
							date: {
								...settings.date,
								sourceType: 'manual',
								hcmLinkSettingId: null
							},
							externalId: {
								...settings.externalId,
								sourceType: 'manual',
								hcmLinkSettingId: null
							},
							hcmLinkDocumentTypeSettingId: null
						});
					}
				}
				this.hcmLinkCompanyId = id;
			},
			modifyAvailableHcmLinkSettings(settings) {
				this.hcmLinkAvailableSettings = settings;
				const documentUids = [...this.documentSettingsMap.keys()];
				documentUids.forEach(uid => {
					if (!this.documentSettingsMap.has(uid)) {
						return;
					}
					const stored = this.documentSettingsMap.get(uid);
					if (!this.documentsGroup.has(uid)) {
						return;
					}
					const documentDetails = this.documentsGroup.get(uid);
					if (documentDetails.hcmLinkCompanyId === this.hcmLinkCompanyId) {
						return;
					}
					this.documentSettingsMap.set(uid, {
						...stored,
						date: {
							...stored.date,
							hcmLinkSettingId: settings?.dateTypeList[0]?.id ?? null
						},
						externalId: {
							...stored.externalId,
							hcmLinkSettingId: settings?.externalIdTypeList[0]?.id ?? null
						},
						hcmLinkDocumentTypeSettingId: null
					});
				});
			},
			modifyCurrentDocumentSettings(settings) {
				if (!this.currentDocumentUid) {
					return;
				}
				const storedSettings = this.documentSettingsMap.get(this.currentDocumentUid);
				this.documentSettingsMap.set(this.currentDocumentUid, {
					...storedSettings,
					...settings
				});
			},
			async loadDocumentPreviewUrl(uid) {
				if (this.previewUrlList.has(uid)) {
					return;
				}
				this.previewUrlList.set(uid, '');
				const data = await new sign_v2_api.Api().getDocumentPreviewUrl(uid);
				this.previewUrlList.set(uid, data?.url ?? '');
			},
			setDocumentSettings(uid, settings) {
				if (!uid) {
					return;
				}
				if (!this.documentSettingsMap.has(uid)) {
					return;
				}
				const storedSettings = this.documentSettingsMap.get(uid);
				this.documentSettingsMap.set(uid, {
					...storedSettings,
					...settings
				});
			},
			async save() {
				const api = new sign_v2_api.Api();
				const documentUids = [...this.documentSettingsMap.keys()];
				await Promise.all(documentUids.map(uid => {
					return api.changeIntegrationId(uid, this.hcmLinkCompanyId);
				}));
				await Promise.all(documentUids.map(uid => {
					const {
						documentType,
						externalId,
						date,
						hcmLinkDocumentTypeSettingId
					} = this.documentSettingsMap.get(uid);
					let dateValue = date.value;
					if (date.value) {
						dateValue = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_DATE_FORMAT'), date.value);
					}
					const apiPromises = [api.changeRegionDocumentType(uid, documentType)];
					if (this.isIntegrationVisible) {
						apiPromises.push(api.changeHcmLinkDocumentType(uid, hcmLinkDocumentTypeSettingId), api.changeExternalDate(uid, dateValue, date.sourceType, date.hcmLinkSettingId), api.changeExternalId(uid, externalId.value, externalId.sourceType, externalId.hcmLinkSettingId));
					}
					return Promise.all(apiPromises);
				}));
			}
		}
	});

	// @vue/component
	const DocumentTypeSelector = {
		name: 'DocumentTypeSelector',
		components: {
			SignDropdownComponent: sign_v2_b2e_vueUtil.SignDropdownComponent,
			Hint: ui_vue3_components_hint.Hint
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			typeList: {
				type: Array,
				required: true,
				default: () => []
			},
			selectedId: {
				type: String,
				required: true
			}
		},
		emits: ['onSelected'],
		computed: {
			dropdownItems() {
				return this.typeList.map(({
					code,
					description
				}) => ({
					id: code,
					title: code,
					caption: `(${description})`,
					entityId: 'b2e-document-code',
					tabId: 'b2e-document-codes'
				}));
			}
		},
		methods: {
			setType(item) {
				this.$emit('onSelected', item.id);
			}
		},
		template: `
		<div class="sign-b2e-regional-settings__item">
			<p class="sign-b2e-regional-settings__item-text">
				<span>{{ loc('SIGN_DOCUMENT_SETUP_TYPE') }}</span>
					<Hint class="sign-b2e-regional-settings__hint" :text="loc('SIGN_DOCUMENT_SETUP_TYPE_HINT')"/>
			</p>
			<SignDropdownComponent 
				class="sign-b2e-regional-settings-dropdown"
				:entities="[{ id: 'b2e-document-code', searchFields: [{ name: 'caption', system: true }] }]"
				:tabs="[{ id: 'b2e-document-codes', title: ' ' }]"
				:items="dropdownItems"
				:isEnableSearch="true"
				:isWithCaption="true"
				:selectedId="selectedId"
				@onSelected="setType"
			/>
		</div>
	`
	};

	const NotSelectedItem = Object.freeze({
		id: null,
		title: main_core.Loc.getMessage('SIGN_V2_B2E_REGIONAL_SETTINGS_NOT_SELECTED_ITEM')
	});

	// @vue/component
	const HcmLinkDocumentTypeSelector = {
		name: 'HcmLinkDocumentTypeSelector',
		components: {
			SignSelector: sign_v2_b2e_vueUtil.SignSelector
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			typeList: {
				type: Array,
				required: true,
				default: () => []
			},
			selectedId: {
				type: [Number, null],
				required: true
			}
		},
		emits: ['onSelected'],
		computed: {
			dropdownItems() {
				const typeList = this.typeList.length > 0 ? [NotSelectedItem, ...this.typeList] : [NotSelectedItem];
				return typeList.map(({
					id,
					title
				}) => ({
					id,
					title
				}));
			}
		},
		methods: {
			onSelected(id) {
				this.$emit('onSelected', id);
			}
		},
		template: `
		<div class="sign-b2e-regional-settings__item">
			<p class="sign-b2e-regional-settings__item-text">
				<span>{{ loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_HCMLINK_UID_TYPE') }}</span>
			</p>
			<SignSelector
					:items="dropdownItems"
				:selectedId="selectedId"
				@onSelect="onSelected"
			/>
		</div>
	`
	};

	// @vue/component
	const RegistrationNumberSettings = {
		name: 'RegistrationNumberSettings',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			SignSelector: sign_v2_b2e_vueUtil.SignSelector,
			Notice: sign_v2_b2e_vueUtil.Notice
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			hcmLinkTypeList: {
				type: Array,
				required: false,
				default: () => []
			},
			templateMode: {
				type: Boolean,
				required: false,
				default: false
			},
			settings: {
				/** @type ExternalIdSettings */
				type: Object,
				required: true
			},
			isIntegrationEnabled: {
				type: Boolean,
				required: false,
				default: false
			},
			isIntegrationDisabledByProvider: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		emits: ['onChange'],
		data() {
			return {
				isValid: true,
				switcherSize: ui_switcher.SwitcherSize.extraSmall
			};
		},
		computed: {
			dropdownItems() {
				return this.hcmLinkTypeList.map(({
					id,
					title
				}) => ({
					id,
					title
				}));
			},
			isChecked() {
				return this.settings.sourceType === 'hcmlink' && this.isIntegrationEnabled;
			}
		},
		watch: {
			isChecked(newValue) {
				this.toggleHcmLink(newValue);
			}
		},
		methods: {
			toggleHcmLink(value) {
				this.$emit('onChange', this.settings);
				if (value === true) {
					if (this.hcmLinkTypeList.length <= 0 || !this.isIntegrationEnabled) {
						return;
					}
					this.changeSettings({
						...this.settings,
						sourceType: 'hcmlink'
					});
					return;
				}
				this.changeSettings({
					...this.settings,
					sourceType: 'manual'
				});
			},
			selectHcmLinkSetting(id) {
				this.changeSettings({
					...this.settings,
					hcmLinkSettingId: id
				});
			},
			changeManualValue(value) {
				this.changeSettings({
					...this.settings,
					value
				});
			},
			changeSettings(settings) {
				this.$emit('onChange', settings);
			},
			validate() {
				this.isValid = !(this.isChecked === false && !this.settings.value);
				return this.isValid;
			},
			showHideTooltipIfDisabled(event) {
				this.hintDisabled?.close();
				this.hintDisabled?.destroy();
				const commonHintSettings = {
					bindElement: event?.target,
					darkMode: true,
					autoHide: true,
					cacheable: false
				};
				if (this.isIntegrationDisabledByProvider) {
					this.hintDisabled = new main_popup.Popup({
						content: main_core.Tag.render`
						<span class='ui-hint-content'>
							${main_core.Text.encode(this.loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_EXTERNAL_ID_DISABLED_HINT'))}
						</span>
					`,
						...commonHintSettings
					});
				} else if (this.isIntegrationEnabled && this.hcmLinkTypeList.length === 0) {
					this.hintDisabled = new main_popup.Popup({
						content: main_core.Tag.render`
						<span class='ui-hint-content'>
							${main_core.Text.encode(this.loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_EXTERNAL_ID_NO_SETTINGS'))}
						</span>
					`,
						...commonHintSettings
					});
				}
				this.hintDisabled?.show();
			},
			created() {
				this.hintDisabled = null;
			}
		},
		template: `
		<div class="sign-b2e-regional-settings__item">
			<p class="sign-b2e-regional-settings__item-text">
				<Switcher style="height: 13px"
					:isChecked="isChecked"
					:options="{ size: switcherSize }"
					@check="toggleHcmLink(true)"
					@uncheck="toggleHcmLink(false)"
					@click="showHideTooltipIfDisabled"
				/>
				<span style="margin-left: 8px">
					{{ loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_EXTERNAL_ID_HCMLINK_SWITCHER_TEXT') }}
				</span>
				</p>
			<SignSelector v-if="isChecked"
				:items="dropdownItems"
				:selectedId="settings.hcmLinkSettingId"
				@onSelect="selectHcmLinkSetting"
			/>
			<div v-else-if="!templateMode"
				class="ui-ctl-textbox ui-ctl-w100 ui-ctl-md"
			>
				<input
					:value="settings.value"
					:placeholder="loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_EXTERNAL_ID_INPUT_HINT')" 
					type="text" 
					class="ui-ctl-element sign-b2e-regional-settings-reg-number-input"
					:class="{'ui-element-invalid': !isValid}"
					maxlength="255"
					@input="changeManualValue($event.target.value)"
				>
			</div>
				<Notice style="margin-top: 8px">
				{{ loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_EXTERNAL_ID_NOTICE') }}
			</Notice>
		</div>
	`
	};

	// @vue/component
	const DateSettings = {
		name: 'DateSettings',
		components: {
			DateSelector: sign_v2_b2e_vueUtil.DateSelector,
			SignSelector: sign_v2_b2e_vueUtil.SignSelector,
			Switcher: ui_vue3_components_switcher.Switcher,
			RoundedSmallSelectedItemView: sign_v2_b2e_vueUtil.RoundedSmallSelectedItemView,
			Hint: ui_vue3_components_hint.Hint
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			hcmLinkTypeList: {
				type: Array,
				required: true,
				default: () => []
			},
			templateMode: {
				type: Boolean,
				required: false,
				default: false
			},
			isIntegrationEnabled: {
				type: Boolean,
				required: false,
				default: false
			},
			settings: {
				/** @type DateSettingsType */
				type: Object,
				required: true
			},
			isIntegrationDisabledByProvider: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		emits: ['onChange'],
		data() {
			return {
				switcherSize: ui_switcher.SwitcherSize.extraSmall
			};
		},
		computed: {
			dropdownItems() {
				return this.hcmLinkTypeList.map(({
					id,
					title
				}) => ({
					id,
					title
				}));
			},
			isChecked() {
				return this.settings.sourceType === 'hcmlink' && this.isIntegrationEnabled;
			}
		},
		watch: {
			isChecked(newValue) {
				this.toggleHcmLink(newValue);
			}
		},
		methods: {
			toggleHcmLink(value) {
				if (value === true) {
					if (this.hcmLinkTypeList.length <= 0 || !this.isIntegrationEnabled) {
						return;
					}
					this.changeSettings({
						...this.settings,
						sourceType: 'hcmlink'
					});
					return;
				}
				this.changeSettings({
					...this.settings,
					sourceType: 'manual'
				});
			},
			selectHcmLinkSetting(id) {
				this.changeSettings({
					...this.settings,
					hcmLinkSettingId: id
				});
			},
			selectDate(date) {
				this.changeSettings({
					...this.settings,
					value: date
				});
			},
			changeSettings(settings) {
				this.$emit('onChange', settings);
			},
			showHideTooltipIfDisabled(event) {
				this.hintDisabled?.close();
				this.hintDisabled?.destroy();
				const commonHintSettings = {
					bindElement: event?.target,
					darkMode: true,
					autoHide: true,
					cacheable: false
				};
				if (this.isIntegrationDisabledByProvider) {
					this.hintDisabled = new main_popup.Popup({
						content: main_core.Tag.render`
						<span class='ui-hint-content'>
							${main_core.Text.encode(this.loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_DATE_DISABLED_HINT'))}
						</span>
					`,
						...commonHintSettings
					});
				} else if (this.isIntegrationEnabled && this.hcmLinkTypeList.length === 0) {
					this.hintDisabled = new main_popup.Popup({
						content: main_core.Tag.render`
						<span class='ui-hint-content'>
							${main_core.Text.encode(this.loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_DATE_NO_SETTINGS'))}
						</span>
					`,
						...commonHintSettings
					});
				}
				this.hintDisabled?.show();
			},
			created() {
				this.hintDisabled = null;
			}
		},
		template: `
		<div class="sign-b2e-regional-settings__item --row">
			<p class="sign-b2e-regional-settings__item-text">
				<Switcher style="height: 13px"
					:isChecked="isChecked"
					:options="{ size: switcherSize }"
					@check="toggleHcmLink(true)"
					@uncheck="toggleHcmLink(false)"
					 @click="showHideTooltipIfDisabled"
				/>
				<span style="margin-left: 8px">
					{{ loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_DATE_HCMLINK_SWITCHER_TEXT') }}
				</span>
			</p>
			<div class="sign-b2e-regional-settings_date_container">
				<SignSelector v-if="isChecked"
					:items="dropdownItems"
					:selectedId="settings.hcmLinkSettingId"
					@onSelect="selectHcmLinkSetting"
					v-slot="{ title }"
				>
					<RoundedSmallSelectedItemView
						:title="title"
					/>
				</SignSelector>
				<div v-else-if="!templateMode">
					<DateSelector
						:value="settings.value"
						@onSelect="selectDate"
					/>
				</div>
			</div>
			<Hint v-if="isChecked" class="sign-b2e-regional-settings__hint sign-b2e-regional-settings_date_hint" :text="loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_DATE_HCMLINK_SWITCHER_HINT')"/>
		</div>
	`
	};

	// @vue/component
	const Switcher = {
		// eslint-disable-next-line vue/multi-word-component-names
		name: 'Switcher',
		components: {
			UiSwitcher: ui_vue3_components_switcher.Switcher,
			Hint: ui_vue3_components_hint.Hint
		},
		props: {
			modelValue: {
				type: Boolean,
				default: false
			},
			title: {
				type: String,
				required: false,
				default: ''
			},
			hint: {
				type: String,
				required: false,
				default: ''
			},
			isEnabled: {
				type: Boolean,
				default: true
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				isChecked: false,
				switcherSize: ui_switcher.SwitcherSize.extraSmall
			};
		},
		watch: {
			modelValue(newValue) {
				this.isChecked = newValue;
			}
		},
		mounted() {
			this.isChecked = this.isEnabled && this.modelValue;
		},
		methods: {
			setValue(value) {
				if (this.isEnabled === false) {
					return;
				}
				this.isChecked = value;
				this.$emit('update:modelValue', value);
			}
		},
		template: `
		<div>
			<UiSwitcher class="sign-b2e_switcher"
						:isChecked="isChecked"
						:options="{ size: switcherSize }"
						@check="setValue(true)" 
						@uncheck="setValue(false)"
			/>
			<span @click="setValue(!isChecked)" class="sign-b2e-settings__item_title sign-b2e_switcher__title">{{ title }}</span>
			<Hint v-if="hint" class="sign-b2e_switcher__hint" :text="hint"/>
		</div>
	`
	};

	// @vue/component
	const CompanySelector = {
		name: 'CompanySelector',
		components: {
			Switcher,
			Notice: sign_v2_b2e_vueUtil.Notice,
			Hint: ui_vue3_components_hint.Hint
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			companyId: {
				type: Number,
				required: true
			},
			isChecked: {
				type: Boolean,
				default: false
			},
			isEnabled: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isHcmLinkCompanySelectorVisible: false,
				isCompanySelectorActive: false
			};
		},
		watch: {
			companyId(newValue, oldValue) {
				if (!this.isHcmLinkCompanySelectorVisible) {
					return;
				}
				if (newValue === oldValue) {
					return;
				}
				this.hcmLinkCompanySelector.setCompanyId(newValue);
			},
			isChecked(newValue) {
				this.isHcmLinkCompanySelectorVisible = newValue;
			},
			isHcmLinkCompanySelectorVisible(newValue, oldValue) {
				if (newValue === oldValue) {
					return;
				}
				this.onHcmLinkCompanySelectorVisibleChange(newValue);
			},
			isEnabled(newValue) {
				if (newValue) {
					return;
				}
				this.isHcmLinkCompanySelectorVisible = newValue;
			}
		},
		created() {
			this.initCompanySelector();
		},
		mounted() {
			if (this.$refs.hcmLinkCompanySelector) {
				main_core.Dom.append(this.hcmLinkCompanySelector.render(), this.$refs.hcmLinkCompanySelector);
			}
			this.isHcmLinkCompanySelectorVisible = this.isEnabled && this.isChecked;
		},
		methods: {
			onHcmLinkCompanySelectorVisibleChange(isVisible) {
				if (this.isEnabled === false) {
					return;
				}
				if (isVisible && this.companyId > 0) {
					this.hcmLinkCompanySelector.setCompanyId(this.companyId);
				} else {
					this.$emit('on-change', null, [], [], []);
				}
			},
			initCompanySelector() {
				this.hcmLinkCompanySelector = new sign_v2_b2e_hcmLinkCompanySelector.HcmLinkCompanySelector();
				this.hcmLinkCompanySelector.setAvailability(true);
				this.hcmLinkCompanySelector.subscribe('selected', event => {
					const {
						id,
						availableSettings
					} = event.data;
					this.$emit('on-change', id ?? 0, availableSettings?.documentType ?? [], availableSettings?.externalId ?? [], availableSettings?.date ?? []);
				});
			}
		},
		template: `
		<div>
			<p class="sign-b2e-settings__item_title">
				<Switcher
					v-model="isHcmLinkCompanySelectorVisible"
					:title="loc('SIGN_V2_B2E_REGIONAL_SETTINGS_HCMLINK_INTEGRATION')"
					:is-enabled="isEnabled"
				/>
			</p>
			<div v-show="isHcmLinkCompanySelectorVisible" ref="hcmLinkCompanySelector"></div>
			<Notice class="sign-b2e-regional-settings-company_selector_notice">
				<template v-if="isHcmLinkCompanySelectorVisible">
					{{ loc('SIGN_V2_B2E_REGIONAL_SETTINGS_HCMLINK_INTEGRATION_ENABLED_NOTICE') }}
				</template>
				<template v-else>
					{{ loc('SIGN_V2_B2E_REGIONAL_SETTINGS_HCMLINK_INTEGRATION_DISABLED_NOTICE') }}
				</template>
			</Notice>
		</div>
	`
	};

	// @vue/component
	const DocumentPreview = {
		name: 'DocumentPreview',
		props: {
			previewSrc: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: false,
				default: ''
			},
			documentId: {
				type: Number,
				required: true
			},
			previewImageClass: {
				type: String,
				required: false,
				default: ''
			},
			isIconVisible: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		methods: {
			previewDocument() {
				if (this.documentId < 1) {
					return Promise.resolve();
				}
				return crm_router.Router.openSlider(`/sign/b2e/preview/0/?documentId=${this.documentId}&noRedirect=Y`, {
					width: 800,
					cacheable: false
				});
			}
		},
		template: `
		<div class="sign-b2e_document_preview_container">
			<div v-if="isIconVisible" @click="previewDocument()" class="sign-b2e_document_preview_icon"></div>
			<img v-if="previewSrc" @click="previewDocument()" :class="previewImageClass" :src="previewSrc" :alt="title">
		</div>	
	`
	};

	// @vue/component
	const DocumentRegionalSettings = {
		name: 'DocumentRegionalSettings',
		components: {
			DocumentTypeSelector,
			HcmLinkDocumentTypeSelector,
			RegistrationNumberSettings,
			DateSettings,
			DocumentPreview
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			templateMode: {
				type: Boolean,
				required: false,
				default: false
			},
			documentTypeList: {
				type: Array,
				required: true
			},
			externalIdTypeList: {
				type: Array,
				required: true
			},
			dateTypeList: {
				type: Array,
				required: true
			},
			hcmLinkDocumentTypeList: {
				type: Array,
				required: true
			},
			previewSrc: {
				type: [String, null],
				required: false,
				default: null
			},
			documentId: {
				type: Number,
				required: false,
				default: 0
			},
			uid: {
				type: [String, null],
				required: false,
				default: null
			},
			title: {
				type: [String, null],
				required: false,
				default: null
			},
			isPreviewVisible: {
				type: Boolean,
				required: false,
				default: true
			},
			settings: {
				/** @type DocumentSettings */
				type: Object,
				required: true
			},
			isIntegrationEnabled: {
				type: Boolean,
				required: false,
				default: false
			},
			isHcmLinkDocumentTypeVisible: {
				type: Boolean,
				required: false,
				default: true
			},
			isDocumentTypeVisible: {
				type: Boolean,
				required: false,
				default: true
			},
			isRegistrationNumberVisible: {
				type: Boolean,
				required: false,
				default: true
			},
			isDateVisible: {
				type: Boolean,
				required: false,
				default: true
			},
			isIntegrationDisabledByProvider: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		data() {
			return {
				currentValue: {}
			};
		},
		watch: {
			isIntegrationEnabled(newVal) {
				if (newVal === false) {
					this.currentValue.hcmLinkDocumentTypeSettingId = 0;
					return;
				}
				this.setDefaultValues(this.settings);
			}
		},
		created() {
			this.setDefaultValues(this.settings);
		},
		methods: {
			modifyDocumentType(code) {
				this.currentValue.documentType = code;
				this.$emit('on-change-document-type', this.currentValue, this.uid);
				this.$emit('on-change', this.currentValue, this.uid);
			},
			modifyDateSettings(settings) {
				this.currentValue.date = settings;
				this.$emit('on-change-date-created', this.currentValue, this.uid);
				this.$emit('on-change', this.currentValue, this.uid);
			},
			modifyRegistrationNumberSettings(settings) {
				this.currentValue.externalId = settings;
				this.$emit('on-change-registration-number', this.currentValue, this.uid);
				this.$emit('on-change', this.currentValue, this.uid);
			},
			modifyHcmLinkDocumentType(id) {
				this.currentValue.hcmLinkDocumentTypeSettingId = id;
				this.$emit('on-change-hcm-link-document-type', this.currentValue, this.uid);
				this.$emit('on-change', this.currentValue, this.uid);
			},
			validate() {
				if (!this.isRegistrationNumberVisible) {
					return true;
				}
				return this.$refs.registrationNumberSettings.validate();
			},
			setDefaultValues(settings) {
				this.currentValue = this.getDefaultValues(settings);
				this.$emit('on-change', this.currentValue, this.uid);
			},
			getDefaultValues(settings) {
				return {
					date: this.getDateDefaultValue(settings),
					externalId: this.getExternalIdDefaultValue(settings),
					hcmLinkDocumentTypeSettingId: this.getHcmLinkDocumentTypeSettingIdDefaultValue(settings),
					documentType: this.getDocumentTypeDefaultValue(settings)
				};
			},
			getHcmLinkDocumentTypeSettingIdDefaultValue(settings) {
				return settings.hcmLinkDocumentTypeSettingId ?? null;
			},
			getDocumentTypeDefaultValue(settings) {
				return settings.documentType ?? this.documentTypeList[0]?.code;
			},
			getExternalIdDefaultValue(settings) {
				return {
					sourceType: settings.externalId.sourceType,
					value: settings.externalId.value ?? this.loc('SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_EXTERNAL_ID_WITHOUT_NUMBER'),
					hcmLinkSettingId: settings.externalId.hcmLinkSettingId ?? this.externalIdTypeList[0]?.id
				};
			},
			getDateDefaultValue(settings) {
				return {
					sourceType: settings.date.sourceType,
					value: settings.date.value ?? new Date(),
					hcmLinkSettingId: settings.date.hcmLinkSettingId ?? this.dateTypeList[0]?.id
				};
			}
		},
		template: `
		<div :class="{'sign-b2e-regional-settings__step_settings_wrapper': uid}" v-if="currentValue" >
			<div>
				<DocumentPreview
					v-if="isPreviewVisible"
					:title="title ?? ''"
					:preview-src="previewSrc ?? ''"
					:document-id="documentId"
					:is-icon-visible="true"
					class="sign-b2e_document_preview_container"
					preview-image-class="sign-b2e_document_preview_image">
				</DocumentPreview>
			</div>
			<div class="sign-b2e-regional-settings-gap">
				<span v-if="title" class="sign-b2e-regional-settings-company_selector_title">
					{{ title }}
				</span>
				<HcmLinkDocumentTypeSelector v-if="isHcmLinkDocumentTypeVisible && hcmLinkDocumentTypeList.length > 0 && isIntegrationEnabled"
					:typeList="hcmLinkDocumentTypeList"
					:selectedId="currentValue.hcmLinkDocumentTypeSettingId"
					:is-integration-enabled="isIntegrationEnabled"
					@onSelected="modifyHcmLinkDocumentType"
				/>
				<DocumentTypeSelector v-if="isDocumentTypeVisible && documentTypeList.length > 0"
					:typeList="documentTypeList"
					:selectedId="currentValue.documentType"
					@onSelected="modifyDocumentType"
				/>
				<RegistrationNumberSettings
					v-if="isRegistrationNumberVisible"
					ref="registrationNumberSettings"
					:hcmLinkTypeList="externalIdTypeList"
					:templateMode="templateMode"
					:settings="currentValue.externalId"
					:is-integration-enabled="isIntegrationEnabled"
					:is-integration-disabled-by-provider="isIntegrationDisabledByProvider"
					@onChange="modifyRegistrationNumberSettings"
				/>
				<DateSettings
					v-if="isDateVisible"
					:hcmLinkTypeList="dateTypeList"
						:templateMode="templateMode"
					:settings="currentValue.date"
					:is-integration-enabled="isIntegrationEnabled"
					:is-integration-disabled-by-provider="isIntegrationDisabledByProvider"
					@onChange="modifyDateSettings"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const DocumentPreviewList = {
		name: 'DocumentPreviewList',
		components: {
			DocumentPreview
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			documentList: {
				type: Array,
				required: true
			},
			maxPreviewCount: {
				type: Number,
				default: 7
			}
		},
		data() {
			return {
				isShowMoreButtonVisible: true,
				previewCount: 0
			};
		},
		computed: {
			showMoreCount() {
				return this.documentCount - this.maxPreviewCount;
			},
			isShowMoreVisible() {
				return this.showMoreCount > 0;
			},
			documentCount() {
				return this.documentList.length;
			},
			documentPreviewList() {
				const result = [];
				for (const document of this.documentList) {
					result.push(document);
					if (result.length >= this.previewCount) {
						break;
					}
				}
				return result;
			}
		},
		created() {
			this.previewCount = this.maxPreviewCount;
		},
		methods: {
			onShowMoreClick() {
				this.previewCount = this.documentCount;
				this.isShowMoreButtonVisible = false;
			},
			onShowLessClick() {
				this.previewCount = this.maxPreviewCount;
				this.isShowMoreButtonVisible = true;
			}
		},
		template: `
		<div class="sign-b2e-settings__item sign-b2e-regional-settings_apply_for_all_list">
			<template v-for="document in documentPreviewList">
				<div class="sign-b2e-regional-settings_apply_for_all_settings_preview_block">
					<DocumentPreview
						:document-id="document?.documentId"
						:preview-src="document?.previewUrl"
						:is-icon-visible="true"
						preview-image-class="sign-b2e-regional-settings_apply_for_all_settings_preview">
					</DocumentPreview>
					<div class="sign-b2e-regional-settings_apply_for_all_settings_preview_title">
						{{ document.title }}
					</div>
				</div>
			</template>
			<div v-if="isShowMoreVisible" class="sign-b2e-regional-settings_apply_for_all_settings_preview_show_more_less">
				<span v-if="isShowMoreButtonVisible" @click="onShowMoreClick" class="sign-b2e-regional-settings_apply_for_all_settings_more_less_button">
					{{ loc('SIGN_V2_B2E_DOCUMENT_PREVIEW_LIST_MORE_TITLE', { '#COUNT#': String(showMoreCount) }) }}
				</span>
				<span v-else @click="onShowLessClick" class="sign-b2e-regional-settings_apply_for_all_settings_more_less_button">
					{{ loc('SIGN_V2_B2E_DOCUMENT_PREVIEW_LIST_LESS_TITLE') }}
				</span>
			</div>
		</div>
	`
	};

	const maxPreviewCount = 7;

	// @vue/component
	const RegionalSettingsApp = {
		name: 'RegionalSettingsApp',
		components: {
			DocumentTypeSelector,
			HcmLinkDocumentTypeSelector,
			RegistrationNumberSettings,
			DateSettings,
			DocumentRegionalSettings,
			CompanySelector,
			DocumentPreview,
			DocumentPreviewList,
			Notice: sign_v2_b2e_vueUtil.Notice,
			Switcher
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			templateMode: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		data() {
			return {
				selectedCompanyId: 0,
				isApplySettingsForAll: false,
				previewCount: maxPreviewCount
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useRegionalSettingsStore, ['companyId']),
			...ui_vue3_pinia.mapState(useRegionalSettingsStore, ['currentDocumentSettings']),
			...ui_vue3_pinia.mapState(useRegionalSettingsStore, ['hcmLinkCompanyId']),
			...ui_vue3_pinia.mapState(useRegionalSettingsStore, ['hcmLinkAvailableSettings']),
			...ui_vue3_pinia.mapState(useRegionalSettingsStore, ['documentTypeList']),
			...ui_vue3_pinia.mapState(useRegionalSettingsStore, ['documentSettingsMap']),
			...ui_vue3_pinia.mapState(useRegionalSettingsStore, ['documentsGroup']),
			...ui_vue3_pinia.mapState(useRegionalSettingsStore, ['previewUrlList']),
			...ui_vue3_pinia.mapState(useRegionalSettingsStore, ['isIntegrationEnabled']),
			...ui_vue3_pinia.mapState(useRegionalSettingsStore, ['isIntegrationVisible']),
			showMoreCount() {
				return this.documentCount - maxPreviewCount;
			},
			isShowMoreVisible() {
				return this.showMoreCount > 0;
			},
			documentCount() {
				return this.documentsGroup.size;
			},
			isHcmLinkCompanyIdSet() {
				return Number(this.hcmLinkCompanyId) > 0;
			},
			documentPreviewList() {
				const result = [];
				for (const [uid] of this.documentsGroup) {
					result.push({
						uid,
						documentId: this.getDocumentId(uid),
						previewUrl: this.getDocumentPreviewUrl(uid),
						title: this.getDocumentTitle(uid)
					});
				}
				return result;
			},
			documentList() {
				const result = [];
				for (const [uid, documentDetails] of this.documentsGroup) {
					result.push({
						uid,
						id: documentDetails.id,
						previewUrl: this.getDocumentPreviewUrl(uid),
						title: documentDetails.title
					});
				}
				return result;
			},
			isIntegrationDisabledByProvider() {
				return this.isHcmLinkCompanyIdSet && !this.isIntegrationEnabled;
			}
		},
		watch: {
			companyId(newVal, oldVal) {
				if (newVal !== oldVal) {
					this.selectedCompanyId = newVal;
				}
			},
			isIntegrationEnabled(newVal) {
				if (newVal) {
					return;
				}
				useRegionalSettingsStore().modifyAvailableHcmLinkSettings({
					documentTypeList: [],
					externalIdTypeList: [],
					dateTypeList: []
				});
			},
			documentCount(newVal) {
				if (newVal < 2) {
					this.isApplySettingsForAll = false;
				}
			}
		},
		created() {
			this.selectedCompanyId = this.companyId;
		},
		methods: {
			getDocumentSettings(uid = null) {
				if (!uid || !this.documentSettingsMap.has(uid)) {
					return DefaultDocumentSettings;
				}
				return this.documentSettingsMap.get(uid);
			},
			getDocumentDetails(uid = null) {
				if (!uid || !this.documentsGroup.has(uid)) {
					return null;
				}
				return this.documentsGroup.get(uid);
			},
			getDocumentId(uid) {
				const documentDetails = this.getDocumentDetails(uid);
				if (documentDetails === null) {
					return 0;
				}
				return documentDetails.id;
			},
			getDocumentPreviewUrl(uid) {
				const documentDetails = this.getDocumentDetails(uid);
				if (documentDetails === null) {
					return null;
				}
				if (documentDetails.previewUrl) {
					return documentDetails.previewUrl;
				}
				useRegionalSettingsStore().loadDocumentPreviewUrl(uid);
				if (!this.previewUrlList.has(uid)) {
					return null;
				}
				return this.previewUrlList.get(uid);
			},
			getDocumentTitle(uid) {
				const documentDetails = this.getDocumentDetails(uid);
				if (documentDetails === null) {
					return '';
				}
				return documentDetails.title;
			},
			onCompanySelectorChange(id, documentTypeList, externalIdTypeList, dateTypeList) {
				useRegionalSettingsStore().modifyHcmLinkCompanyId(id);
				useRegionalSettingsStore().modifyAvailableHcmLinkSettings({
					documentTypeList,
					externalIdTypeList,
					dateTypeList
				});
			},
			setAllDocumentSettings(settings) {
				for (const uid of this.documentSettingsMap.keys()) {
					useRegionalSettingsStore().setDocumentSettings(uid, settings);
				}
			},
			setSettings(settings, uid) {
				if (this.isApplySettingsForAll) {
					this.setAllDocumentSettings(settings);
					return;
				}
				useRegionalSettingsStore().setDocumentSettings(uid, settings);
			},
			validate() {
				let result = true;
				if (this.isApplySettingsForAll) {
					return this.$refs.applySettingsForAll.validate();
				}
				for (const uid of this.documentSettingsMap.keys()) {
					if (!this.$refs[`document_settings_${uid}`][0]?.validate()) {
						if (result === true && this.documentCount > 1) {
							document.getElementById(`document_settings_${uid}`).scrollIntoView({
								behavior: 'smooth'
							});
						}
						result = false;
					}
				}
				return result;
			}
		},
		template: `
		<h1 class="sign-b2e-settings__header">
			{{ loc('SIGN_SETTINGS_B2E_REGIONAL_SETTINGS') }}
		</h1>
		<div v-if="isIntegrationVisible" class="sign-b2e-settings__item">
			<div class="sign-b2e-settings__counter">
				<span class="sign-b2e-settings__counter_num" data-num="1"></span>
			</div>
			<CompanySelector 
				:is-enabled="true" 
				:is-checked="isHcmLinkCompanyIdSet" 
				@onChange="onCompanySelectorChange" 
				:company-id="Number(selectedCompanyId)"
			/>
		</div>
		<div v-if="documentCount > 1 && isIntegrationVisible" class="sign-b2e-settings__item">
			<div class="sign-b2e-settings__counter">
				<span class="sign-b2e-settings__counter_num" :data-num="2"></span>
				<span v-if="isApplySettingsForAll" class="sign-b2e-settings__counter_connect"></span>
			</div>
			<Switcher 
				v-model="isApplySettingsForAll"
				:title="loc('SIGN_V2_B2E_REGIONAL_SETTINGS_APPLY_FOR_ALL_TITLE')"
				:hint="loc('SIGN_V2_B2E_REGIONAL_SETTINGS_APPLY_FOR_ALL_HINT')"
			/>
			<div v-if="isApplySettingsForAll">
				<div class="sign-b2e-regional-settings__item-text sign-b2e-regional-settings_apply_for_all_title">
					{{ loc('SIGN_V2_B2E_REGIONAL_SETTINGS_APPLY_FOR_ALL_DOCUMENTS_TITLE') }}
				</div>
				<DocumentPreviewList 
					:document-list="documentPreviewList"
					:max-preview-count="maxPreviewCount"
				/>
			</div>
			<DocumentRegionalSettings
				v-if="isApplySettingsForAll"
				ref="applySettingsForAll"
				:is-preview-visible="false"
				:template-mode="templateMode"
				:document-type-list="documentTypeList"
				:external-id-type-list="hcmLinkAvailableSettings.externalIdTypeList"
				:date-type-list="hcmLinkAvailableSettings.dateTypeList"
				:hcm-link-document-type-list="hcmLinkAvailableSettings.documentTypeList"
				:settings="getDocumentSettings()"
				@onChange="setSettings"
				class="sign-b2e-regional-settings_apply_for_all_settings"
				:is-integration-enabled="isIntegrationEnabled && isHcmLinkCompanyIdSet"
				:is-integration-disabled-by-provider="isIntegrationDisabledByProvider"
			/>
		</div>
		<template v-if="!isApplySettingsForAll" v-for="(document, index) in documentList" :key="document.uid">
			<div class="sign-b2e-settings__item">
				<div class="sign-b2e-settings__counter"  :class="{'sign-b2e-regional-settings__counter_connect_with_margin': index > 0 && index < (documentCount - 1), 'sign-b2e-regional-settings__counter_connect_with_left': index === (documentCount - 1)}">
					<span v-if="index === 0" class="sign-b2e-settings__counter_num" :data-num="isIntegrationVisible ? (index + (documentCount > 1 ? 3 : 2)) : 1"></span>
					<span v-if="index === (documentCount - 1)" 
							class="sign-b2e-settings__counter_connect" 
							:class="{'sign-b2e-regional-settings__counter_connect': index > 0}">
					</span>
				</div>
				<DocumentRegionalSettings
					:ref="'document_settings_' + document.uid"
					:id="'document_settings_' + document.uid"
					:document-id="document.id"
					:preview-src="document.previewUrl"
					:template-mode="templateMode"
					:document-type-list="documentTypeList"
					:external-id-type-list="hcmLinkAvailableSettings.externalIdTypeList"
					:date-type-list="hcmLinkAvailableSettings.dateTypeList"
					:hcm-link-document-type-list="hcmLinkAvailableSettings.documentTypeList"
					:uid="document.uid"
					:title="document.title"
					:settings="getDocumentSettings(document.uid)"
					@onChange="setSettings"
					:is-integration-enabled="isIntegrationEnabled && isHcmLinkCompanyIdSet"
					:is-hcm-link-document-type-visible="isIntegrationVisible"
					:is-registration-number-visible="isIntegrationVisible"
					:is-date-visible="isIntegrationVisible"
					:is-integration-disabled-by-provider="isIntegrationDisabledByProvider"
				/>
			</div>
		</template>
	`
	};

	class RegionalSettings {
		#app;
		#vueApp;
		#options;
		#companyId;
		#container;
		constructor(regionalSettingsOptions) {
			this.#options = regionalSettingsOptions;
			this.#container = this.getLayout();
		}
		getLayout() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = main_core.Tag.render`<div></div>`;
			this.#createApp(this.#container);
			if (BX.UI.Hint) {
				BX.UI.Hint.init(this.#container);
			}
			return this.#container;
		}
		#createApp(container) {
			const store = ui_vue3_pinia.createPinia();
			this.#app = ui_vue3.BitrixVue.createApp(RegionalSettingsApp, {
				templateMode: this.#options.templateMode
			});
			this.#app.use(store);
			useRegionalSettingsStore().init({
				documentTypeList: this.#options.regionDocumentTypes
			});
			this.#vueApp = this.#app.mount(container);
			const onClose = () => {
				main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onCloseByEsc', onClose);
				main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onClose', onClose);
				this.#app?.unmount();
			};
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseByEsc', onClose);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', onClose);
		}
		async save() {
			if (!this.#vueApp.validate()) {
				throw new Error('Validation error');
			}
			await useRegionalSettingsStore().save();
		}
		set companyId(id) {
			this.#companyId = id;
			const store = useRegionalSettingsStore();
			store.companyId = this.#companyId;
		}
		set isIntegrationEnabled(isEnabled) {
			const store = useRegionalSettingsStore();
			store.isIntegrationEnabled = isEnabled;
		}
		set isIntegrationVisible(isVisible) {
			const store = useRegionalSettingsStore();
			store.isIntegrationVisible = isVisible;
		}
		set documentsGroup(documentGroup) {
			useRegionalSettingsStore().updateDocumentsGroup(documentGroup);
		}
		getSelectedHcmLinkCompanyId() {
			const store = useRegionalSettingsStore();
			return store.hcmLinkCompanyId;
		}
		setLastSavedHcmLinkCompanyId(id) {
			/* @todo */
			//this.#hcmLinkCompanySelector.setLastSavedId(id);
		}
	}

	exports.RegionalSettings = RegionalSettings;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Vue3, BX.Vue3.Pinia, BX.Sign.V2.B2e, BX.Main, BX.Sign.V2, BX.Vue3.Components, BX.Main, BX.UI.Vue3.Components, BX.UI, BX.Sign.V2.B2e, BX.Crm, BX.Event);
//# sourceMappingURL=regional-settings.bundle.js.map
