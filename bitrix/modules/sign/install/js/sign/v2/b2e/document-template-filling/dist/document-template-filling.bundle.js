/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, ui_vue3, main_core, main_date, sign_type, sign_v2_b2e_signSettingsTemplates, sign_v2_b2e_vueUtil, ui_vue3_pinia, crm_router, ui_vue3_components_switcher, ui_switcher, ui_vue3_components_hint) {
	'use strict';

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

	const ExternalSourceType = {
		HCMLINK: 'hcmlink'};
	const defaultSigningDateMonth = 3;

	// @vue/component
	const DocumentFillingApp = {
		name: 'DocumentFillingApp',
		components: {
			DateSelector: sign_v2_b2e_vueUtil.DateSelector,
			DocumentPreview,
			Switcher,
			DocumentPreviewList
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		data() {
			return {
				isApplySettingsForAll: false,
				commonSettings: null,
				documentsSettings: {},
				signUntilDateErrorByDoc: {},
				signUntilDateErrorCommon: '',
				isValid: true,
				isValidMap: {}
			};
		},
		computed: {
			documents() {
				return ui_vue3_pinia.mapState(sign_v2_b2e_signSettingsTemplates.useDocumentTemplateFillingStore, ['documents']).documents();
			},
			ruRegionFieldsVisible() {
				return ui_vue3_pinia.mapState(sign_v2_b2e_signSettingsTemplates.useDocumentTemplateFillingStore, ['ruRegionFieldsVisible']).ruRegionFieldsVisible();
			},
			documentPreviewList() {
				return this.documents.map(doc => ({
					uid: doc.uid,
					documentId: this.getSmartDocumentId(doc),
					previewUrl: this.getPreviewUrl(doc),
					title: doc.title
				}));
			},
			signingMinMinutes() {
				const settings = main_core.Extension.getSettings('sign.v2.b2e.document-template-filling');
				return settings.get('signingMinMinutes', 5);
			},
			signingMaxMonth() {
				const settings = main_core.Extension.getSettings('sign.v2.b2e.document-template-filling');
				return settings.get('signingMaxMonth', 3);
			},
			switcherAllHint() {
				return this.ruRegionFieldsVisible ? this.loc('SIGN_B2E_DOCUMENT_FILLING_APPLY_FOR_ALL_HINT') : '';
			}
		},
		watch: {
			documents: {
				immediate: true,
				handler(newDocs) {
					const newSettings = {};
					newDocs.forEach(doc => {
						const defaultRegistrationNumber = this.getDefaultRegistrationNumber(doc);
						newSettings[doc.uid] = {
							...this.makeDefaultDocumentSettings(doc),
							registrationNumber: defaultRegistrationNumber
						};
					});
					this.documentsSettings = newSettings;
				}
			},
			isApplySettingsForAll(newVal) {
				if (newVal) {
					this.signUntilDateErrorByDoc = {};
					this.signUntilDateErrorCommon = '';
					this.isValid = true;
					this.isValidMap = {};
					this.setStorageSettingsFromCommon();
				}
			},
			documentsSettings: {
				handler(newValue) {
					sign_v2_b2e_signSettingsTemplates.useDocumentTemplateFillingStore().setSettings(newValue);
				},
				immediate: true,
				deep: true
			},
			commonSettings: {
				handler() {
					if (this.isApplySettingsForAll) {
						this.setStorageSettingsFromCommon();
					}
				},
				deep: true
			}
		},
		created() {
			this.commonSettings = this.makeDefaultDocumentSettings();
		},
		methods: {
			removeDocument(uid) {
				sign_v2_b2e_signSettingsTemplates.useDocumentTemplateFillingStore().removeDocument(uid);
			},
			selectCreationDate(uid, date) {
				if (this.documentsSettings[uid]) {
					this.documentsSettings[uid].creationDate = date;
				}
			},
			async selectSigningDate(uid, date) {
				const isValid = this.validateDateSignUntil(date, uid);
				if (!isValid) {
					return;
				}
				if (this.documentsSettings[uid]) {
					this.documentsSettings[uid].signingDate = this.convertFromUTCtoUserDate(date);
				}
			},
			selectCreationDateForAll(date) {
				this.commonSettings.creationDate = date;
			},
			async selectSigningDateForAll(date) {
				const isValid = this.validateDateSignUntil(date);
				if (!isValid) {
					return;
				}
				this.commonSettings.signingDate = this.convertFromUTCtoUserDate(date);
			},
			getSmartDocumentId(doc) {
				return doc?.id ?? 0;
			},
			getPreviewUrl(doc) {
				return doc?.previewUrl ?? '';
			},
			getCurrentSettings(uid) {
				return this.isApplySettingsForAll ? this.commonSettings : this.documentsSettings[uid];
			},
			isExternalIdFromIntegration(doc) {
				return doc.externalIdSourceType === ExternalSourceType.HCMLINK;
			},
			isExternalDateFromIntegration(doc) {
				return doc.externalDateCreateSourceType === ExternalSourceType.HCMLINK;
			},
			areAllExternalIdsFromIntegration() {
				return this.documents.every(doc => doc.externalIdSourceType === ExternalSourceType.HCMLINK);
			},
			areAllExternalDatesFromIntegration() {
				return this.documents.every(doc => doc.externalDateCreateSourceType === ExternalSourceType.HCMLINK);
			},
			validateDateSignUntil(date, uid) {
				if (uid) {
					this.signUntilDateErrorByDoc[uid] = '';
				} else {
					this.signUntilDateErrorCommon = '';
				}
				const creationDateSource = uid ? this.documentsSettings[uid].creationDate : this.commonSettings.creationDate;
				let validationErrorMessage = '';
				if (!creationDateSource) {
					console.error('Creation date is not available');
					return false;
				}
				const creationDate = new Date(creationDateSource);
				const selectedUserDate = this.convertFromUTCtoUserDate(date);
				const minValidDateTime = new Date(creationDate.getTime());
				minValidDateTime.setMinutes(minValidDateTime.getMinutes() + this.signingMinMinutes);
				if (selectedUserDate.getTime() < minValidDateTime.getTime()) {
					validationErrorMessage = main_core.Loc.getMessagePlural('PERIOD_TOO_SHORT', this.signingMinMinutes, {
						'#MIN_PERIOD#': this.signingMinMinutes
					});
				} else {
					const maxValidDate = new Date(creationDate.getTime());
					maxValidDate.setMonth(maxValidDate.getMonth() + this.signingMaxMonth);
					if (selectedUserDate.getTime() > maxValidDate.getTime()) {
						validationErrorMessage = main_core.Loc.getMessagePlural('PERIOD_TOO_LONG', this.signingMaxMonth, {
							'#MAX_PERIOD#': this.signingMaxMonth
						});
					}
				}
				if (validationErrorMessage) {
					if (this.isApplySettingsForAll) {
						this.signUntilDateErrorCommon = validationErrorMessage;
					} else {
						this.signUntilDateErrorByDoc[uid] = validationErrorMessage;
					}
					return false;
				}
				return true;
			},
			makeDefaultDocumentSettings(doc) {
				return {
					registrationNumber: this.getDefaultRegistrationNumber(),
					creationDate: main_date.Timezone.UserTime.getDate(),
					signingDate: doc && doc.dateSignUntilUserTime ? new Date(doc.dateSignUntilUserTime) : this.getFallbackSignigningDate()
				};
			},
			getFallbackSignigningDate() {
				const signingDate = main_date.Timezone.UserTime.getDate();
				signingDate.setMonth(signingDate.getMonth() + defaultSigningDateMonth);
				return signingDate;
			},
			getDefaultRegistrationNumber(doc) {
				const shouldUseHcmLinkPlaceholder = doc ? this.isExternalIdFromIntegration(doc) : this.areAllExternalIdsFromIntegration();
				return this.loc(shouldUseHcmLinkPlaceholder ? 'SIGN_B2E_DOCUMENT_FILLING_INPUT_REG_NUMBER_PLACEHOLDER_HCMLINK' : 'SIGN_B2E_DOCUMENT_FILLING_INPUT_REG_NUMBER_PLACEHOLDER');
			},
			setStorageSettingsFromCommon() {
				const newSettings = {};
				this.documents.forEach(doc => {
					newSettings[doc.uid] = {
						registrationNumber: this.commonSettings.registrationNumber,
						signingDate: this.commonSettings.signingDate,
						creationDate: this.commonSettings.creationDate
					};
				});
				sign_v2_b2e_signSettingsTemplates.useDocumentTemplateFillingStore().setSettings(newSettings);
			},
			validate() {
				if (this.isApplySettingsForAll) {
					const value = this.commonSettings.registrationNumber;
					this.isValid = Boolean(value) && value.trim() !== '';
					return this.isValid;
				}
				this.isValid = true;
				this.isValidMap = {};
				for (const doc of this.documents) {
					const value = this.documentsSettings[doc.uid]?.registrationNumber;
					const isFilled = Boolean(value) && value.trim() !== '';
					this.isValidMap[doc.uid] = isFilled;
					if (!isFilled) {
						this.isValid = false;
					}
				}
				return this.isValid;
			},
			convertFromUTCtoUserDate(dateInUTC) {
				const year = dateInUTC.getUTCFullYear();
				const month = dateInUTC.getUTCMonth();
				const day = dateInUTC.getUTCDate();
				const hours = dateInUTC.getUTCHours();
				const minutes = dateInUTC.getUTCMinutes();
				return new Date(year, month, day, hours, minutes, 0, 0);
			},
			isGosKeyProvider(doc) {
				const isGoskey = providerCode => {
					return providerCode === sign_type.ProviderCode.goskey;
				};
				if (doc) {
					return isGoskey(doc.providerCode);
				}
				return this.documents.some(item => isGoskey(item.providerCode));
			},
			isGoskeyLiteProvider(doc) {
				const isLite = providerCode => {
					return providerCode === sign_type.ProviderCode.goskeyLite;
				};
				if (doc) {
					return isLite(doc.providerCode);
				}
				return this.documents.some(item => isLite(item.providerCode));
			}
		},
		template: `
		<h1 class="sign-b2e-settings__header">
			{{ loc('SIGN_B2E_DOCUMENT_FILLING_TITLE_HEAD_LABEL') }}
		</h1>

		<template v-if="documents.length > 1">
			<div class="sign-b2e-document-filling__item">
				<Switcher
					v-model="isApplySettingsForAll"
					:title="loc('SIGN_B2E_DOCUMENT_FILLING_APPLY_FOR_ALL_TITLE')"
					:hint="switcherAllHint"
				/>

				<template v-if="isApplySettingsForAll">
					<div class="sign-b2e-document-filling__item-text">
						{{ loc('SIGN_B2E_DOCUMENT_FILLING_DOCUMENT_IN_PROCESS') }}
					</div>
					<DocumentPreviewList
						:document-list="documentPreviewList"
						:max-preview-count="7"
					/>
					<div class="sign-b2e-document-filling__item-content">
						<div v-if="ruRegionFieldsVisible">
							<span class="sign-b2e-document-filling__item-text">
								{{ loc('SIGN_B2E_DOCUMENT_FILLING_INPUT_REG_NUMBER_LABEL') }}
							</span>
							<input
								v-model="commonSettings.registrationNumber"
								:title="areAllExternalIdsFromIntegration()
									? loc('SIGN_B2E_DOCUMENT_FILLING_INPUT_REG_NUMBER_HCMLINK_HINT')
									: ''"
								:disabled="areAllExternalIdsFromIntegration()"
								type="text"
								class="ui-ctl-element sign-b2e-document-filling-reg-number-input"
								:class="{ '--error': isApplySettingsForAll && !isValid }"
								maxlength="255"
							>
						</div>
						<div class="sign-b2e-settings__date-row">
							<div class="sign-b2e-settings__date-item" v-if="ruRegionFieldsVisible">
								<span class="sign-b2e-document-filling__item-text-date">
									{{ loc('SIGN_B2E_DOCUMENT_FILLING_DATE_CREATE_LABEL') }}
								</span>
								<span
									v-if="areAllExternalDatesFromIntegration()"
									class="sign-b2e-settings__date-selector-text"
									:title="areAllExternalDatesFromIntegration() 
									? loc('SIGN_B2E_DOCUMENT_FILLING_DATE_CREATE_HCMLINK_HINT')
									: ''"
								>
									{{ loc('SIGN_B2E_DOCUMENT_FILLING_DATE_CREATE_HCMLINK') }}
								</span>
								<DateSelector
									v-else
									:value="commonSettings.creationDate"
									@onSelect="date => selectCreationDateForAll(date)"
									class="sign-b2e-settings__date-selector"
								/>
							</div>
							<div class="sign-b2e-settings__date-item">
								<span class="sign-b2e-document-filling__item-text-date">
									{{ loc('SIGN_B2E_DOCUMENT_FILLING_DATE_EXPIRE_LABEL') }}
								</span>
								<DateSelector
									:value="commonSettings.signingDate"
									showTime
									@onSelect="date => selectSigningDateForAll(date)"
									class="sign-b2e-settings__date-selector"
									:class="{ '--error': signUntilDateErrorCommon }"
								/>
							</div>
							<div v-if="signUntilDateErrorCommon" class="sign-b2e-settings__date-error">
								{{ signUntilDateErrorCommon }}
							</div>
						</div>
						<p v-if="isGosKeyProvider() || isGoskeyLiteProvider()" class="sign-b2e-document-filling__notice">
							{{ loc('SIGN_DOCUMENT_SEND_DATETIME_LIMIT_SELECTOR_GOSKEY_ALERT') }}
						</p>
					</div>
				</template>
			</div>
		</template>

		<template v-if="!isApplySettingsForAll">
			<div
				v-for="doc in documents"
				:key="doc.uid"
				class="sign-b2e-document-filling__item"
			>
				<div class="sign-b2e-document-filling__item-container">
					<div class="sign-b2e-document-filling__item-preview">
						<DocumentPreview
							:document-id="getSmartDocumentId(doc)"
							:preview-src="getPreviewUrl(doc)"
							:is-icon-visible="true"
							class="sign-b2e_document_preview_container"
							preview-image-class="sign-b2e_document_preview_image sign-b2e-document-filling__preview"
						/>
					</div>
					<div class="sign-b2e-document-filling__item-content">
						<div class="sign-b2e-document-filling__header">
							<span class="sign-b2e-document-filling__item-title">
								{{ doc.title }}
							</span>
							<button
								v-if="documents.length > 1"
								class="sign-b2e-document-filling__remove-btn"
								@click="removeDocument(doc.uid)"
								:title="loc('SIGN_B2E_DOCUMENT_FILLING_REMOVE_TEMPLATE')"
							></button>
						</div>
						<div v-if="ruRegionFieldsVisible">
							<span class="sign-b2e-document-filling__item-text">
								{{ loc('SIGN_B2E_DOCUMENT_FILLING_INPUT_REG_NUMBER_LABEL') }}
							</span>
							<input
								v-model="documentsSettings[doc.uid].registrationNumber"
								:title="isExternalIdFromIntegration(doc) 
								? loc('SIGN_B2E_DOCUMENT_FILLING_INPUT_REG_NUMBER_HCMLINK_HINT')
								: ''"
								:disabled="isExternalIdFromIntegration(doc)"
								type="text"
								class="ui-ctl-element sign-b2e-document-filling-reg-number-input"
								:class="{ '--error': !isApplySettingsForAll && isValidMap[doc.uid] === false }"
								maxlength="255"
							/>
						</div>

						<div class="sign-b2e-settings__date-row">
							<div class="sign-b2e-settings__date-item" v-if="ruRegionFieldsVisible">
								<span class="sign-b2e-document-filling__item-text-date">
									{{ loc('SIGN_B2E_DOCUMENT_FILLING_DATE_CREATE_LABEL') }}
								</span>
								<span
									v-if="isExternalDateFromIntegration(doc)"
									class="sign-b2e-settings__date-selector-text"
									:title="isExternalIdFromIntegration(doc) 
									? loc('SIGN_B2E_DOCUMENT_FILLING_DATE_CREATE_HCMLINK_HINT')
									: ''"
								>
									{{ loc('SIGN_B2E_DOCUMENT_FILLING_DATE_CREATE_HCMLINK') }}
								</span>
								<DateSelector
									v-else
									:value="documentsSettings[doc.uid].creationDate"
									@onSelect="date => selectCreationDate(doc.uid, date)"
									class="sign-b2e-settings__date-selector"
								/>
							</div>
							<div class="sign-b2e-settings__date-item">
								<span class="sign-b2e-document-filling__item-text-date">
									{{ loc('SIGN_B2E_DOCUMENT_FILLING_DATE_EXPIRE_LABEL') }}
								</span>
								<DateSelector
									:value="documentsSettings[doc.uid].signingDate"
									showTime
									@onSelect="date => selectSigningDate(doc.uid, date)"
									:class="{ '--error': signUntilDateErrorByDoc[doc.uid] }"
									class="sign-b2e-settings__date-selector"
								/>
							</div>
						</div>
						<p v-if="isGosKeyProvider(doc) || isGoskeyLiteProvider(doc)" class="sign-b2e-document-filling__notice">
							{{ loc('SIGN_DOCUMENT_SEND_DATETIME_LIMIT_SELECTOR_GOSKEY_ALERT') }}
						</p>
						<div v-if="signUntilDateErrorByDoc[doc.uid]" class="sign-b2e-settings__date-error --individual">
							{{ signUntilDateErrorByDoc[doc.uid] }}
						</div>
					</div>
				</div>
			</div>
		</template>
	`
	};

	class DocumentTemplateFilling {
		#app;
		#vueApp;
		#container;
		#options;
		constructor(documentFillingOptions) {
			this.#options = documentFillingOptions;
		}
		#createApp(container) {
			this.#app = ui_vue3.BitrixVue.createApp(DocumentFillingApp);
			this.#app.use(this.#options.store);
			this.#vueApp = this.#app.mount(container);
		}
		getLayout() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = BX.Tag.render`<div></div>`;
			this.#createApp(this.#container);
			if (BX.UI?.Hint) {
				BX.UI.Hint.init(this.#container);
			}
			return this.#container;
		}
		validate() {
			return this.#vueApp.validate();
		}
		unmount() {
			this.#app?.unmount();
		}
	}

	exports.DocumentTemplateFilling = DocumentTemplateFilling;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX.Vue3, BX, BX.Main, BX.Sign, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Vue3.Pinia, BX.Crm, BX.UI.Vue3.Components, BX.UI, BX.Vue3.Components);
