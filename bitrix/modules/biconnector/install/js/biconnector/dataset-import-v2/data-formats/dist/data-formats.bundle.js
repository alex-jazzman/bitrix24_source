/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
(function (exports, ui_vue3, main_core, main_core_events, ui_sidepanel) {
	'use strict';

	const FIELD_KEYS = ['date', 'datetime', 'money', 'double', 'timezone'];
	const CUSTOM_FORMAT_KEYS = ['date', 'datetime'];
	const CUSTOM_OPTION_TYPE = 'custom';
	const CUSTOM_OPTION_VALUE = 'custom';
	const DATA_FORMATS_HELP_ARTICLE = '23378698';
	const SAVE_EVENT = 'biconnector:dataset-import-v2:formats-save';
	const RESULT_EVENT = 'BIConnector.DatasetImportV2.DataFormats:onSave';
	const SAVE_BUTTON_ID = 'biconnector-dataset-import-v2-formats-save';
	const BUTTON_WAIT_CLASS = 'ui-btn-wait';
	const DataFormatsDialog = {
		props: {
			initial: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				timezoneLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_TIMEZONE_LABEL'),
				timezoneHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_TIMEZONE_HINT'),
				dateLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATE_LABEL'),
				dateHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATE_HINT'),
				datetimeLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATETIME_LABEL'),
				datetimeHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATETIME_HINT'),
				moneyLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_MONEY_LABEL'),
				moneyHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_MONEY_HINT'),
				doubleLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DOUBLE_LABEL'),
				doubleHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DOUBLE_HINT'),
				customFormatLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_CUSTOM_FORMAT'),
				customFormatError: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_CUSTOM_FORMAT_ERROR'),
				datePlaceholder: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_CUSTOM_DATE_PLACEHOLDER'),
				datetimePlaceholder: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_CUSTOM_DATETIME_PLACEHOLDER'),
				draft: this.makeDraft(),
				customDraft: this.makeCustomDraft(),
				invalidCustomKeys: []
			};
		},
		computed: {
			hintParts() {
				const message = main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_HINT') ?? '';
				const [textBeforeLink, messageTail = ''] = message.split('[link]');
				const [linkText, textAfterLink = ''] = messageTail.split('[/link]');
				return {
					textBeforeLink,
					linkText,
					textAfterLink
				};
			},
			dateOptions() {
				return this.prepareOptions('date');
			},
			datetimeOptions() {
				return this.prepareOptions('datetime');
			},
			moneyOptions() {
				return this.initial?.templates?.money ?? [];
			},
			doubleOptions() {
				return this.initial?.templates?.double ?? [];
			},
			timezoneOptions() {
				return this.initial?.templates?.timezone ?? [];
			}
		},
		mounted() {
			this.onSaveClick = () => this.onSave();
			main_core_events.EventEmitter.subscribe(SAVE_EVENT, this.onSaveClick);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(SAVE_EVENT, this.onSaveClick);
		},
		methods: {
			showHelpArticle() {
				main_core.Reflection.getClass('top.BX.Helper')?.show(`redirect=detail&code=${DATA_FORMATS_HELP_ARTICLE}`);
			},
			makeDraft() {
				const current = this.initial?.current ?? {};
				const draft = {};
				FIELD_KEYS.forEach(key => {
					const value = current[key] ?? '';
					draft[key] = this.isCustomFormat(key, value) ? CUSTOM_OPTION_VALUE : value;
				});
				return draft;
			},
			makeCustomDraft() {
				const customDraft = {};
				CUSTOM_FORMAT_KEYS.forEach(key => {
					customDraft[key] = this.getCustomOption(key)?.value ?? '';
				});
				return customDraft;
			},
			getCustomOption(key) {
				return (this.initial?.templates?.[key] ?? []).find(option => option.type === CUSTOM_OPTION_TYPE);
			},
			isCustomFormat(key, value) {
				if (!CUSTOM_FORMAT_KEYS.includes(key) || value === '') {
					return false;
				}
				return !(this.initial?.templates?.[key] ?? []).some(option => option.type !== CUSTOM_OPTION_TYPE && option.value === value);
			},
			prepareOptions(key) {
				return (this.initial?.templates?.[key] ?? []).map(option => option.type === CUSTOM_OPTION_TYPE ? {
					...option,
					value: CUSTOM_OPTION_VALUE,
					title: this.customFormatLabel
				} : option);
			},
			isCustomSelected(key) {
				return CUSTOM_FORMAT_KEYS.includes(key) && this.draft[key] === CUSTOM_OPTION_VALUE;
			},
			onCustomInput(key) {
				this.invalidCustomKeys = this.invalidCustomKeys.filter(invalidKey => invalidKey !== key);
			},
			validateCustomFormats() {
				this.invalidCustomKeys = CUSTOM_FORMAT_KEYS.filter(key => this.isCustomSelected(key) && this.customDraft[key].trim() === '');
				return this.invalidCustomKeys.length === 0;
			},
			buildPayload() {
				const payload = {};
				FIELD_KEYS.forEach(key => {
					payload[key] = this.isCustomSelected(key) ? this.customDraft[key].trim() : this.draft[key];
				});
				return payload;
			},
			releaseSaveButton() {
				requestAnimationFrame(() => {
					main_core.Dom.removeClass(document.getElementById(SAVE_BUTTON_ID), BUTTON_WAIT_CLASS);
				});
			},
			onSave() {
				if (!this.validateCustomFormats()) {
					this.releaseSaveButton();
					return;
				}
				ui_sidepanel.SidePanel.Instance.postMessage(window, RESULT_EVENT, this.buildPayload());
				const slider = ui_sidepanel.SidePanel.Instance.getTopSlider?.();
				slider?.close();
			}
		},
		template: `
		<div class="biconnector-dataset-import-v2-formats">
			<div class="biconnector-dataset-import-v2-formats__body">
				<div class="biconnector-dataset-import-v2-formats__hint">
					{{ hintParts.textBeforeLink }}<a
						v-if="hintParts.linkText"
						href="#"
						class="biconnector-dataset-import-v2-formats__hint-link"
						@click.prevent="showHelpArticle"
					>{{ hintParts.linkText }}</a>{{ hintParts.textAfterLink }}
				</div>

				<label class="biconnector-dataset-import-v2-formats__field">
					<span class="biconnector-dataset-import-v2-formats__field-label">{{ timezoneLabel }}</span>
					<span class="biconnector-dataset-import-v2-formats__field-sublabel">{{ timezoneHint }}</span>
					<select v-model="draft.timezone" class="biconnector-dataset-import-v2-formats__select">
						<option
							v-for="opt in timezoneOptions"
							:key="opt.value"
							:value="opt.value"
						>{{ opt.title || opt.value }}</option>
					</select>
				</label>

				<label class="biconnector-dataset-import-v2-formats__field">
					<span class="biconnector-dataset-import-v2-formats__field-label">{{ dateLabel }}</span>
					<span class="biconnector-dataset-import-v2-formats__field-sublabel">{{ dateHint }}</span>
					<select v-model="draft.date" class="biconnector-dataset-import-v2-formats__select">
						<option
							v-for="opt in dateOptions"
							:key="opt.value"
							:value="opt.value"
						>{{ opt.title || opt.value }}</option>
					</select>
					<input
						v-if="isCustomSelected('date')"
						v-model="customDraft.date"
						type="text"
						class="biconnector-dataset-import-v2-formats__custom-input"
						:class="{ '--error': invalidCustomKeys.includes('date') }"
						:placeholder="datePlaceholder"
						@input="onCustomInput('date')"
					>
					<span
						v-if="invalidCustomKeys.includes('date')"
						class="biconnector-dataset-import-v2-formats__error"
					>{{ customFormatError }}</span>
				</label>

				<label class="biconnector-dataset-import-v2-formats__field">
					<span class="biconnector-dataset-import-v2-formats__field-label">{{ datetimeLabel }}</span>
					<span class="biconnector-dataset-import-v2-formats__field-sublabel">{{ datetimeHint }}</span>
					<select v-model="draft.datetime" class="biconnector-dataset-import-v2-formats__select">
						<option
							v-for="opt in datetimeOptions"
							:key="opt.value"
							:value="opt.value"
						>{{ opt.title || opt.value }}</option>
					</select>
					<input
						v-if="isCustomSelected('datetime')"
						v-model="customDraft.datetime"
						type="text"
						class="biconnector-dataset-import-v2-formats__custom-input"
						:class="{ '--error': invalidCustomKeys.includes('datetime') }"
						:placeholder="datetimePlaceholder"
						@input="onCustomInput('datetime')"
					>
					<span
						v-if="invalidCustomKeys.includes('datetime')"
						class="biconnector-dataset-import-v2-formats__error"
					>{{ customFormatError }}</span>
				</label>

				<label class="biconnector-dataset-import-v2-formats__field">
					<span class="biconnector-dataset-import-v2-formats__field-label">{{ moneyLabel }}</span>
					<span class="biconnector-dataset-import-v2-formats__field-sublabel">{{ moneyHint }}</span>
					<select v-model="draft.money" class="biconnector-dataset-import-v2-formats__select">
						<option
							v-for="opt in moneyOptions"
							:key="opt.value"
							:value="opt.value"
						>{{ opt.title || opt.value }}</option>
					</select>
				</label>

				<label class="biconnector-dataset-import-v2-formats__field">
					<span class="biconnector-dataset-import-v2-formats__field-label">{{ doubleLabel }}</span>
					<span class="biconnector-dataset-import-v2-formats__field-sublabel">{{ doubleHint }}</span>
					<select v-model="draft.double" class="biconnector-dataset-import-v2-formats__select">
						<option
							v-for="opt in doubleOptions"
							:key="opt.value"
							:value="opt.value"
						>{{ opt.title || opt.value }}</option>
					</select>
				</label>
			</div>
		</div>
	`
	};

	class DataFormatsAppFactory {
		static getApp(initialData) {
			return ui_vue3.BitrixVue.createApp({
				name: 'DataFormatsApp',
				components: {
					DataFormatsDialog
				},
				data() {
					return {
						initialData
					};
				},
				template: '<DataFormatsDialog :initial="initialData" />'
			});
		}
	}

	exports.DataFormatsAppFactory = DataFormatsAppFactory;

})(this.BX.BIConnector.DatasetImportV2 = this.BX.BIConnector.DatasetImportV2 || {}, BX.Vue3, BX, BX.Event, BX);
//# sourceMappingURL=data-formats.bundle.js.map
