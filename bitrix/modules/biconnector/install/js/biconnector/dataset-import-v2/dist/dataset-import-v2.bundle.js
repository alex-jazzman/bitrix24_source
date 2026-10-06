/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
(function (exports, ui_vue3, main_core_events, ui_vue3_vuex, main_core, ui_sidepanel, ui_hint, main_popup, ui_system_dialog, ui_buttons, ui_iconSet_api_core, main_sidepanel, biconnector_fileExport, ui_analytics) {
	'use strict';

	const CollapsibleCard = {
		props: {
			id: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			hint: {
				type: String,
				default: ''
			},
			iconClass: {
				type: String,
				default: '--o-database'
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		mounted() {
			this.initHint();
		},
		updated() {
			this.initHint();
		},
		methods: {
			initHint() {
				if (this.hint && !this.disabled && this.$el) {
					ui_hint.Hint.init(this.$el);
				}
			}
		},
		template: `
		<section
			class="biconnector-dataset-import-v2-card"
			:class="{ 'biconnector-dataset-import-v2-card--disabled': disabled }"
			:data-card-id="id"
		>
			<header class="biconnector-dataset-import-v2-card__header">
				<span class="biconnector-dataset-import-v2-card__icon ui-icon-set" :class="iconClass"></span>
				<span class="biconnector-dataset-import-v2-card__title ui-typography-text-md">{{ title }}</span>
				<span
					v-if="hint && !disabled"
					class="biconnector-dataset-import-v2-card__title-hint"
					:data-hint="hint"
					data-hint-outline
				></span>
				<span v-if="!disabled" class="biconnector-dataset-import-v2-card__header-extra">
					<slot name="header-extra" />
				</span>
			</header>
			<div v-if="!disabled" class="biconnector-dataset-import-v2-card__body">
				<slot />
			</div>
		</section>
	`
	};

	const DATA_FORMATS_URL = '/bitrix/components/bitrix/biconnector.dataset.import.v2.data-formats/slider.php';
	const FileSettingsCard = {
		components: {
			CollapsibleCard
		},
		inject: ['appParams', 'sourceId'],
		data() {
			return {
				titleMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_FILE_TITLE'),
				encodingLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_FILE_ENCODING'),
				separatorLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_FILE_SEPARATOR'),
				firstLineHeaderLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_FILE_FIRST_LINE_HEADER'),
				dataFormatsLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_FILE_DATA_FORMATS')
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['isEditMode', 'hasPreview']),
			fileProperties() {
				return this.$store.state.config.fileProperties;
			},
			isCsv() {
				return this.sourceId === 'csv';
			},
			encoding: {
				get() {
					return this.fileProperties.encoding;
				},
				set(value) {
					this.$store.commit('setFileProperties', {
						encoding: value
					});
				}
			},
			separator: {
				get() {
					return this.fileProperties.separator;
				},
				set(value) {
					this.$store.commit('setFileProperties', {
						separator: value
					});
				}
			},
			firstLineHeader: {
				get() {
					return Boolean(this.fileProperties.firstLineHeader);
				},
				set(value) {
					this.$store.commit('setFileProperties', {
						firstLineHeader: value
					});
				}
			},
			isParsingOptionsEditable() {
				return !this.isEditMode || Boolean(this.fileProperties.fileToken);
			}
		},
		methods: {
			openDataFormats() {
				const params = new URLSearchParams();
				const current = this.$store.state.config.dataFormats || {};
				Object.entries(current).forEach(([key, value]) => {
					params.append(`dataFormats[${key}]`, String(value ?? ''));
				});
				ui_sidepanel.SidePanel.Instance.open(`${DATA_FORMATS_URL}?${params.toString()}`, {
					allowChangeHistory: false,
					cacheable: false,
					width: 630
				});
			}
		},
		template: `
		<CollapsibleCard
			id="file-settings"
			:title="titleMessage"
			icon-class="--o-file-settings"
			:disabled="!hasPreview"
		>
			<template #header-extra>
				<button
					v-if="isCsv"
					type="button"
					class="biconnector-dataset-import-v2-card__header-link ui-typography-text-sm"
					@click="openDataFormats"
				>
					<span class="biconnector-dataset-import-v2-card__header-link-text">{{ dataFormatsLabel }}</span>
					<span class="biconnector-dataset-import-v2-card__header-link-icon ui-icon-set --chevron-right"></span>
				</button>
			</template>
			<div v-if="isCsv" class="biconnector-dataset-import-v2-card__row">
				<label class="biconnector-dataset-import-v2-card__field">
					<span class="biconnector-dataset-import-v2-card__field-label">{{ encodingLabel }}</span>
					<select v-model="encoding" class="biconnector-dataset-import-v2-card__select" :disabled="!isParsingOptionsEditable">
						<option
							v-for="option in (appParams.encodings || [])"
							:key="option.value"
							:value="option.value"
						>{{ option.title }}</option>
					</select>
				</label>
				<label class="biconnector-dataset-import-v2-card__field">
					<span class="biconnector-dataset-import-v2-card__field-label">{{ separatorLabel }}</span>
					<select v-model="separator" class="biconnector-dataset-import-v2-card__select" :disabled="!isParsingOptionsEditable">
						<option
							v-for="option in (appParams.separators || [])"
							:key="option.value"
							:value="option.value"
						>{{ option.title }}</option>
					</select>
				</label>
			</div>
			<label v-if="isCsv" class="biconnector-dataset-import-v2-card__toggle">
				<input
					type="checkbox"
					class="biconnector-dataset-import-v2-card__toggle-input"
					v-model="firstLineHeader"
					:disabled="!isParsingOptionsEditable"
				/>
				<span class="biconnector-dataset-import-v2-card__toggle-track">
					<span class="biconnector-dataset-import-v2-card__toggle-knob"></span>
				</span>
				<span class="biconnector-dataset-import-v2-card__toggle-label">{{ firstLineHeaderLabel }}</span>
			</label>
		</CollapsibleCard>
	`
	};

	const DATASET_NAME_MAX_LENGTH = 30;
	const DATASET_NAME_PATTERN = /^[a-z][\d_a-z]*$/;
	function getDatasetNameError(value, reservedNames = []) {
		const trimmed = String(value ?? '').trim();
		if (!trimmed) {
			return 'required';
		}
		if (trimmed.length > DATASET_NAME_MAX_LENGTH) {
			return 'tooLong';
		}
		if (!DATASET_NAME_PATTERN.test(trimmed)) {
			return 'badFormat';
		}
		if (reservedNames.includes(trimmed)) {
			return 'reserved';
		}
		return null;
	}
	function hasDatasetNameError(value, reservedNames = []) {
		return getDatasetNameError(value, reservedNames) !== null;
	}

	const PropertiesCard = {
		components: {
			CollapsibleCard
		},
		inject: ['appParams'],
		setup() {
			return {
				DATASET_NAME_MAX_LENGTH
			};
		},
		data() {
			return {
				titleMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_TITLE'),
				hintMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_HINT'),
				nameLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_NAME_LABEL'),
				descriptionLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_DESCRIPTION_LABEL'),
				nameError: ''
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['isEditMode', 'isReadOnly', 'datasetProperties', 'hasPreview']),
			hint() {
				return this.isReadOnly ? '' : this.hintMessage;
			},
			reservedNames() {
				return this.appParams?.reservedNames ?? [];
			},
			name: {
				get() {
					return this.datasetProperties.name ?? '';
				},
				set(value) {
					this.$store.commit('setDatasetProperties', {
						name: value
					});
					this.refreshNameError();
				}
			},
			description: {
				get() {
					return this.datasetProperties.description ?? '';
				},
				set(value) {
					this.$store.commit('setDatasetProperties', {
						description: value
					});
				}
			}
		},
		watch: {
			name: {
				immediate: true,
				handler() {
					this.refreshNameError();
				}
			},
			hasPreview() {
				this.refreshNameError();
			},
			reservedNames() {
				this.refreshNameError();
			}
		},
		methods: {
			refreshNameError() {
				if (this.isReadOnly || !this.hasPreview) {
					this.nameError = '';
					return;
				}
				this.nameError = this.validateName(this.name);
			},
			validateName(value) {
				const error = getDatasetNameError(value, this.reservedNames);
				if (error === 'required') {
					return main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_NAME_REQUIRED');
				}
				if (error === 'tooLong') {
					return main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_NAME_TOO_LONG').replace('#MAX#', String(DATASET_NAME_MAX_LENGTH));
				}
				if (error === 'badFormat') {
					return main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_NAME_BAD_FORMAT');
				}
				if (error === 'reserved') {
					return main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_PROPERTIES_NAME_RESERVED');
				}
				return '';
			}
		},
		template: `
		<CollapsibleCard
			id="properties"
			:title="titleMessage"
			:hint="hint"
			icon-class="--graphs-settings"
			:disabled="!hasPreview"
		>
			<label class="biconnector-dataset-import-v2-card__field">
				<span class="biconnector-dataset-import-v2-card__field-label">{{ nameLabel }}</span>
				<input
					type="text"
					class="biconnector-dataset-import-v2-card__input"
					:class="{ 'biconnector-dataset-import-v2-card__input--error': !!nameError }"
					v-model.trim="name"
					:disabled="isReadOnly"
					:maxlength="DATASET_NAME_MAX_LENGTH"
					autocomplete="off"
				/>
				<span v-if="nameError" class="biconnector-dataset-import-v2-card__field-error">
					{{ nameError }}
				</span>
			</label>
			<label class="biconnector-dataset-import-v2-card__field">
				<span class="biconnector-dataset-import-v2-card__field-label">{{ descriptionLabel }}</span>
				<textarea
					class="biconnector-dataset-import-v2-card__textarea"
					v-model="description"
					rows="3"
					:disabled="isReadOnly"
				></textarea>
			</label>
		</CollapsibleCard>
	`
	};

	const DataType = {
		string: 'string',
		money: 'money',
		int: 'int',
		double: 'double',
		date: 'date',
		datetime: 'datetime'
	};
	function getDataTypeDescriptions() {
		return {
			[DataType.string]: {
				title: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_TEXT') || 'Text',
				icon: '--formatting'
			},
			[DataType.money]: {
				title: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_MONEY') || 'Money',
				icon: '--money'
			},
			[DataType.int]: {
				title: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_NUMBER') || 'Number',
				icon: '--numbers-123'
			},
			[DataType.double]: {
				title: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_DECIMAL') || 'Decimal',
				icon: '--numbers-05'
			},
			[DataType.date]: {
				title: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_DATE') || 'Date',
				icon: '--calendar-1'
			},
			[DataType.datetime]: {
				title: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_DATETIME') || 'Date & time',
				icon: '--planning-2'
			}
		};
	}

	const MAPPING_HELP_ARTICLE = '24486426';
	const NAME_MAX_LENGTH = 32;
	const NAME_FORMAT_REGEXP = /^[A-Z][A-Z0-9_]*$/;
	const FOCUS_COLUMN_EVENT$1 = 'biconnector:dataset-import-v2:focus-column';
	const FOCUS_FIELD_EVENT$1 = 'biconnector:dataset-import-v2:focus-field';
	const FieldRowCard = {
		props: {
			index: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				typeLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_LABEL'),
				nameLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_LABEL'),
				descriptionLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_DESCRIPTION_LABEL'),
				showHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_INCLUDE_SHOW'),
				hideHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_INCLUDE_HIDE'),
				isFocused: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['isEditMode', 'isReadOnly', 'isSystem', 'fieldNameCounts', 'activeFieldIndex', 'connectionProperties']),
			isActive() {
				return this.index === this.activeFieldIndex;
			},
			isMetaLocked() {
				return Boolean(this.connectionProperties) && this.connectionProperties.connectionIsSupportMapping === false;
			},
			isMetaDisabled() {
				return !this.canEditMeta || this.isMetaLocked;
			},
			showLockHint() {
				return this.isMetaLocked && this.isVisible;
			},
			lockedShortHint() {
				return main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_LOCKED_SHORT');
			},
			lockedHintHtml() {
				const hintText = main_core.Text.encode(this.lockedShortHint);
				const linkLabel = main_core.Text.encode(main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_LOCKED_MORE'));
				const onClick = `top.BX.Helper.show('redirect=detail&code=${MAPPING_HELP_ARTICLE}')`;
				return `${hintText} <a href="javascript:void(0)" onclick="${onClick}">${linkLabel}</a>`;
			},
			field() {
				return this.$store.state.config.fieldsSettings[this.index];
			},
			typeOptions() {
				const map = getDataTypeDescriptions();
				return Object.entries(map).map(([value, descr]) => ({
					value,
					title: descr.title,
					icon: descr.icon
				}));
			},
			selectedTypeIcon() {
				const map = getDataTypeDescriptions();
				return map[this.field?.type]?.icon ?? '--formatting';
			},
			nameValue: {
				get() {
					return this.field?.name ?? '';
				},
				set(value) {
					this.commitField({
						name: value
					});
				}
			},
			typeValue: {
				get() {
					return this.field?.type ?? 'string';
				},
				set(value) {
					this.commitField({
						type: value
					});
				}
			},
			descriptionValue: {
				get() {
					return this.field?.description ?? '';
				},
				set(value) {
					this.commitField({
						description: value
					});
				}
			},
			nameError() {
				return this.validateName(this.nameValue);
			},
			canEditMeta() {
				return !this.isReadOnly && this.isVisible;
			},
			canEditDescription() {
				return !this.isSystem && this.isVisible;
			},
			canToggleVisibility() {
				return !this.isSystem;
			},
			isVisible: {
				get() {
					return this.field?.visible !== false;
				},
				set(value) {
					if (this.field?.visible === value) {
						return;
					}
					this.$store.commit('toggleRowVisibility', this.index);
				}
			}
		},
		mounted() {
			this.onFocusFieldEvent = event => {
				const data = event?.data ?? event;
				const fieldIndex = Array.isArray(data) ? data[0]?.index : data?.index;
				if (fieldIndex !== this.index) {
					return;
				}
				this.$el?.scrollIntoView?.({
					behavior: 'smooth',
					block: 'center'
				});
			};
			main_core_events.EventEmitter.subscribe(FOCUS_FIELD_EVENT$1, this.onFocusFieldEvent);
			this.$nextTick(() => this.initHint());
		},
		updated() {
			this.$nextTick(() => this.initHint());
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(FOCUS_FIELD_EVENT$1, this.onFocusFieldEvent);
		},
		methods: {
			commitField(patch) {
				this.$store.commit('setFieldRowSettings', {
					index: this.index,
					settings: patch
				});
			},
			initHint() {
				if (this.showLockHint && this.$el) {
					ui_hint.Hint.init(this.$el);
				}
			},
			validateName(name) {
				if (!name || name.length === 0) {
					return main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_REQUIRED');
				}
				if (name.length > NAME_MAX_LENGTH) {
					return main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_TOO_LONG').replace('#MAX#', String(NAME_MAX_LENGTH));
				}
				if (!NAME_FORMAT_REGEXP.test(name)) {
					return main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_BAD_FORMAT');
				}
				if ((this.fieldNameCounts.get(name) ?? 0) > 1) {
					return main_core.Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_DUPLICATE');
				}
				return '';
			},
			onFocusIn() {
				if (!this.isVisible) {
					return;
				}
				this.$store.commit('setActiveFieldIndex', this.index);
				main_core_events.EventEmitter.emit(FOCUS_COLUMN_EVENT$1, {
					index: this.index
				});
			},
			onFocusOut(event) {
				if (event.relatedTarget && this.$el.contains(event.relatedTarget)) {
					return;
				}
				this.$store.commit('setActiveFieldIndex', -1);
			},
			onCardMouseDown() {
				if (!this.isVisible) {
					return;
				}
				this.$store.commit('setActiveFieldIndex', this.index);
				main_core_events.EventEmitter.emit(FOCUS_COLUMN_EVENT$1, {
					index: this.index
				});
			},
			onToggleVisibility() {
				if (!this.canToggleVisibility) {
					return;
				}
				this.$store.commit('toggleRowVisibility', this.index);
			}
		},
		template: `
		<div
			v-if="field"
			class="biconnector-dataset-import-v2-field-card"
			:class="{
				'biconnector-dataset-import-v2-field-card--active': isActive,
				'biconnector-dataset-import-v2-field-card--excluded': !isVisible,
			}"
			@focusin="onFocusIn"
			@focusout="onFocusOut"
			@mousedown="onCardMouseDown"
		>
			<button
				v-if="canToggleVisibility"
				type="button"
				class="biconnector-dataset-import-v2-field-card__visibility"
				:class="{ 'biconnector-dataset-import-v2-field-card__visibility--hidden': !isVisible }"
				:title="isVisible ? hideHint : showHint"
				@mousedown.stop.prevent
				@focusin.stop
				@click.stop="onToggleVisibility"
			>
				<span
					class="biconnector-dataset-import-v2-field-card__visibility-icon ui-icon-set"
					:class="isVisible ? '--o-observer' : '--o-crossed-eye'"
				></span>
			</button>

			<div class="biconnector-dataset-import-v2-field-card__row">
				<label
					class="biconnector-dataset-import-v2-field-card__field biconnector-dataset-import-v2-field-card__field--type"
				>
					<span class="biconnector-dataset-import-v2-field-card__field-label">{{ typeLabel }}</span>
					<span
						class="biconnector-dataset-import-v2-field-card__control"
						:data-hint="showLockHint ? lockedHintHtml : undefined"
						data-hint-no-icon
						data-hint-html
						data-hint-interactivity
					>
						<select
							v-model="typeValue"
							class="biconnector-dataset-import-v2-field-card__select"
							:class="{ 'biconnector-dataset-import-v2-field-card__select--locked': isMetaLocked }"
							:disabled="isMetaDisabled"
						>
							<option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.title }}</option>
						</select>
					</span>
				</label>

				<label
					class="biconnector-dataset-import-v2-field-card__field biconnector-dataset-import-v2-field-card__field--name"
				>
					<span class="biconnector-dataset-import-v2-field-card__field-label">{{ nameLabel }}</span>
					<span
						class="biconnector-dataset-import-v2-field-card__control"
						:data-hint="showLockHint ? lockedHintHtml : undefined"
						data-hint-no-icon
						data-hint-html
						data-hint-interactivity
					>
						<input
							v-model="nameValue"
							type="text"
							class="biconnector-dataset-import-v2-field-card__input"
							:class="{
								'biconnector-dataset-import-v2-field-card__input--error': nameError && isVisible,
								'biconnector-dataset-import-v2-field-card__input--locked': isMetaLocked,
							}"
							:disabled="isMetaDisabled"
						/>
					</span>
					<span v-if="nameError && isVisible" class="biconnector-dataset-import-v2-field-card__field-error">{{ nameError }}</span>
				</label>
			</div>

			<label
				v-if="canEditDescription || descriptionValue"
				class="biconnector-dataset-import-v2-field-card__field biconnector-dataset-import-v2-field-card__field--description"
			>
				<span class="biconnector-dataset-import-v2-field-card__field-label">{{ descriptionLabel }}</span>
				<textarea
					v-model="descriptionValue"
					class="biconnector-dataset-import-v2-field-card__textarea"
					rows="2"
					:disabled="!canEditDescription"
				></textarea>
			</label>
		</div>
	`
	};

	const SYNC_EVENT$1 = 'biconnector:dataset-import-v2:connection-sync';
	const ColumnsCard = {
		components: {
			CollapsibleCard,
			FieldRowCard
		},
		data() {
			return {
				titleMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_COLUMNS_TITLE'),
				hintMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_COLUMNS_HINT'),
				placeholderMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_COLUMNS_PLACEHOLDER'),
				syncLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_COLUMNS_SYNC')
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['isEditMode', 'isReadOnly', 'hasPreview', 'connectionProperties']),
			hint() {
				return this.isReadOnly ? '' : this.hintMessage;
			},
			fieldsSettings() {
				return this.$store.state.config.fieldsSettings;
			},
			showSync() {
				return this.isEditMode && Boolean(this.connectionProperties?.connectionId);
			}
		},
		methods: {
			onSync() {
				main_core_events.EventEmitter.emit(SYNC_EVENT$1, {});
			}
		},
		template: `
		<CollapsibleCard
			id="columns"
			:title="titleMessage"
			:hint="hint"
			icon-class="--o-set-columns"
			:disabled="!hasPreview"
		>
			<template #header-extra>
				<button
					v-if="showSync"
					type="button"
					class="biconnector-dataset-import-v2-card__header-link ui-typography-text-sm"
					@click="onSync"
				>{{ syncLabel }}</button>
			</template>
			<div v-if="!hasPreview" class="biconnector-dataset-import-v2-card__columns-empty">
				{{ placeholderMessage }}
			</div>
			<div v-else class="biconnector-dataset-import-v2-card__columns-list">
				<FieldRowCard
					v-for="(field, index) in fieldsSettings"
					:key="field.id || index"
					:index="index"
				/>
			</div>
		</CollapsibleCard>
	`
	};

	const RelatedDatasetsCard = {
		components: {
			CollapsibleCard
		},
		inject: ['appParams'],
		data() {
			return {
				titleMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_RELATED_TITLE'),
				createLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_RELATED_CREATE'),
				emptyMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_RELATED_EMPTY')
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['datasetProperties', 'connectionProperties', 'hasPreview']),
			isSupersetReady() {
				return Boolean(this.appParams?.isSupersetReady);
			},
			items() {
				return this.datasetProperties?.externalDatasets ?? [];
			},
			hasItems() {
				return this.items.length > 0;
			},
			createPhysicalDatasetUrl() {
				return this.connectionProperties?.createPhysicalDatasetUrl ?? this.datasetProperties?.createPhysicalDatasetUrl ?? '';
			},
			createVirtualDatasetUrl() {
				return this.connectionProperties?.createVirtualDatasetUrl ?? this.datasetProperties?.createVirtualDatasetUrl ?? '';
			},
			canCreate() {
				return this.isSupersetReady && Boolean(this.createPhysicalDatasetUrl || this.createVirtualDatasetUrl);
			},
			isVisible() {
				return this.hasItems || this.canCreate;
			}
		},
		beforeUnmount() {
			this.createMenu?.destroy?.();
		},
		methods: {
			datasetLabel(item) {
				return item.table_name ?? item.name ?? '';
			},
			datasetUrl(item) {
				return item.url ?? '';
			},
			onCreateClick(event) {
				if (this.createMenu) {
					this.createMenu.toggle();
					return;
				}
				const items = [];
				if (this.createPhysicalDatasetUrl) {
					items.push({
						text: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_RELATED_CREATE_PHYSICAL'),
						onclick: () => {
							window.open(this.createPhysicalDatasetUrl, '_blank')?.focus();
							this.createMenu.close();
						}
					});
				}
				if (this.createVirtualDatasetUrl) {
					items.push({
						text: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_RELATED_CREATE_VIRTUAL'),
						onclick: () => {
							window.open(this.createVirtualDatasetUrl, '_blank')?.focus();
							this.createMenu.close();
						}
					});
				}
				this.createMenu = new main_popup.Menu({
					bindElement: event.currentTarget,
					items
				});
				this.createMenu.show();
			}
		},
		template: `
		<CollapsibleCard
			v-if="isVisible"
			id="related-datasets"
			:title="titleMessage"
			icon-class="--o-links-list"
			:disabled="!hasPreview"
		>
			<template #header-extra>
				<button
					v-if="canCreate"
					type="button"
					class="biconnector-dataset-import-v2-card__header-link ui-typography-text-sm"
					@click="onCreateClick"
				>
					<span class="biconnector-dataset-import-v2-card__header-link-icon ui-icon-set --plus-20"></span>
					<span class="biconnector-dataset-import-v2-card__header-link-text">{{ createLabel }}</span>
				</button>
			</template>
			<div v-if="hasItems" class="biconnector-dataset-import-v2-related__list">
				<a
					v-for="(item, index) in items"
					:key="item.id || index"
					class="biconnector-dataset-import-v2-related__chip"
					:href="datasetUrl(item) || null"
					:target="datasetUrl(item) ? '_blank' : null"
				>{{ datasetLabel(item) }}</a>
			</div>
			<div v-else class="biconnector-dataset-import-v2-related__empty">
				{{ emptyMessage }}
			</div>
		</CollapsibleCard>
	`
	};

	const CardsColumn = {
		components: {
			FileSettingsCard,
			PropertiesCard,
			ColumnsCard,
			RelatedDatasetsCard
		},
		inject: ['sourceId'],
		computed: {
			isCsv() {
				return this.sourceId === 'csv';
			}
		},
		template: `
		<aside class="biconnector-dataset-import-v2__cards-column">
			<FileSettingsCard v-if="isCsv" />
			<PropertiesCard />
			<RelatedDatasetsCard />
			<ColumnsCard />
		</aside>
	`
	};

	function showFileActionConfirm(options, phrases) {
		const message = main_core.Loc.getMessage(phrases.textTemplate, {
			'#FILE_NAME#': `<span class="biconnector-dataset-import-v2-popup__file-name">${main_core.Text.encode(options.fileName)}</span>`
		}) ?? '';
		const content = main_core.Tag.render`<div class="biconnector-dataset-import-v2-popup__message"></div>`;
		content.innerHTML = message;
		const confirmButtonOptions = {
			text: main_core.Loc.getMessage(phrases.confirm) ?? '',
			useAirDesign: true,
			size: ui_buttons.ButtonSize.LARGE,
			style: ui_buttons.AirButtonStyle.FILLED,
			onclick: () => {
				dialog.hide();
				options.onConfirm();
				return {};
			}
		};
		const cancelButtonOptions = {
			text: main_core.Loc.getMessage(phrases.cancel) ?? '',
			useAirDesign: true,
			size: ui_buttons.ButtonSize.LARGE,
			style: ui_buttons.AirButtonStyle.PLAIN,
			onclick: () => {
				dialog.hide();
				options.onCancel?.();
				return {};
			}
		};
		const dialog = new ui_system_dialog.Dialog({
			title: main_core.Loc.getMessage(phrases.title) ?? '',
			content,
			width: 470,
			hasCloseButton: true,
			closeByEsc: true,
			hasOverlay: true,
			centerButtons: [new ui_buttons.Button(confirmButtonOptions), new ui_buttons.CancelButton(cancelButtonOptions)]
		});
		dialog.show();
	}
	function showDeleteFileConfirm(options) {
		showFileActionConfirm(options, {
			title: 'DATASET_IMPORT_V2_DELETE_FILE_TITLE',
			textTemplate: 'DATASET_IMPORT_V2_DELETE_FILE_TEXT_TEMPLATE',
			confirm: 'DATASET_IMPORT_V2_DELETE_FILE_CONFIRM',
			cancel: 'DATASET_IMPORT_V2_DELETE_FILE_CANCEL'
		});
	}
	function showReplaceFileConfirm(options) {
		showFileActionConfirm(options, {
			title: 'DATASET_IMPORT_V2_REPLACE_FILE_TITLE',
			textTemplate: 'DATASET_IMPORT_V2_REPLACE_FILE_TEXT_TEMPLATE',
			confirm: 'DATASET_IMPORT_V2_REPLACE_FILE_CONFIRM',
			cancel: 'DATASET_IMPORT_V2_REPLACE_FILE_CANCEL'
		});
	}

	const MASCOT_SRC = '/bitrix/images/biconnector/dataset-import/mascot-animated.mp4';
	const MascotVideo = {
		props: {
			playing: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		data() {
			return {
				src: MASCOT_SRC
			};
		},
		watch: {
			playing(active) {
				this.apply(active);
			}
		},
		mounted() {
			if (this.$refs.video) {
				this.$refs.video.muted = true;
			}
			this.apply(this.playing);
		},
		beforeUnmount() {
			if (this.$refs.video) {
				this.$refs.video.pause();
			}
		},
		methods: {
			apply(active) {
				const video = this.$refs.video;
				if (!video) {
					return;
				}
				if (active) {
					video.play()?.catch(() => {});
				} else {
					video.pause();
					video.currentTime = 0;
				}
			}
		},
		template: `
		<video
			ref="video"
			class="biconnector-dataset-import-v2-mascot"
			:src="src"
			muted
			loop
			playsinline
			preload="metadata"
		></video>
	`
	};

	const FileSection = {
		components: {
			MascotVideo
		},
		inject: ['sourceId'],
		emits: ['pick-file', 'remove-file'],
		data() {
			return {
				titleMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_TITLE'),
				emptyHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_EMPTY_HINT'),
				browseLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_BROWSE'),
				replaceLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_REPLACE'),
				removeHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_REMOVE'),
				dragTitle: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_DRAG_TITLE'),
				dragHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_DRAG_HINT'),
				isDragging: false,
				dragCounter: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['isEditMode', 'isUploading', 'uploadStep']),
			loadingMessage() {
				const step = Math.max(1, Math.min(3, Number(this.uploadStep) || 1));
				return main_core.Loc.getMessage(`DATASET_IMPORT_V2_FILE_SECTION_LOADING_${step}`);
			},
			fileProperties() {
				return this.$store.state.config.fileProperties;
			},
			hasLocalFile() {
				return Boolean(this.fileProperties.fileToken) || Boolean(this.fileProperties.fileName);
			},
			hasFile() {
				return this.hasLocalFile || this.isEditMode;
			},
			fileName() {
				return this.fileProperties.fileName || '';
			},
			isCsv() {
				return this.sourceId === 'csv';
			},
			canRemoveFile() {
				return !this.isEditMode || Boolean(this.fileProperties.fileToken);
			}
		},
		methods: {
			onPick() {
				if (this.$refs.input) {
					this.$refs.input.click();
				}
			},
			onReplace() {
				if (!this.hasLocalFile) {
					this.onPick();
					return;
				}
				showReplaceFileConfirm({
					fileName: this.fileName,
					onConfirm: () => this.onPick()
				});
			},
			onRemove(event) {
				if (event) {
					event.preventDefault();
					event.stopPropagation();
				}
				if (this.isEditMode) {
					this.$emit('remove-file');
					return;
				}
				showDeleteFileConfirm({
					fileName: this.fileName,
					onConfirm: () => {
						this.$emit('remove-file');
					}
				});
			},
			onInputChange(event) {
				const file = event.target.files?.[0];
				if (file) {
					this.$emit('pick-file', file);
				}
				event.target.value = '';
			},
			hasDraggedFiles(event) {
				const types = event?.dataTransfer?.types;
				if (!types) {
					return false;
				}
				for (let i = 0; i < types.length; i++) {
					if (types[i] === 'Files') {
						return true;
					}
				}
				return false;
			},
			onDragEnter(event) {
				if (!this.hasDraggedFiles(event)) {
					return;
				}
				event.preventDefault();
				this.dragCounter += 1;
				this.isDragging = true;
			},
			onDragOver(event) {
				if (!this.hasDraggedFiles(event)) {
					return;
				}
				event.preventDefault();
			},
			onDragLeave(event) {
				if (!this.hasDraggedFiles(event)) {
					return;
				}
				event.preventDefault();
				this.dragCounter = Math.max(0, this.dragCounter - 1);
				if (this.dragCounter === 0) {
					this.isDragging = false;
				}
			},
			onDrop(event) {
				event.preventDefault();
				this.dragCounter = 0;
				this.isDragging = false;
				const file = event.dataTransfer?.files?.[0];
				if (!file) {
					return;
				}
				if (this.hasLocalFile) {
					showReplaceFileConfirm({
						fileName: this.fileName,
						onConfirm: () => this.$emit('pick-file', file)
					});
					return;
				}
				this.$emit('pick-file', file);
			}
		},
		template: `
		<section
			v-if="isCsv"
			class="biconnector-dataset-import-v2-file-section"
			:class="{
				'biconnector-dataset-import-v2-file-section--empty': !hasFile,
				'biconnector-dataset-import-v2-file-section--filled': hasFile,
				'biconnector-dataset-import-v2-file-section--dragging': isDragging,
			}"
			@dragenter="onDragEnter"
			@dragover="onDragOver"
			@dragleave="onDragLeave"
			@drop="onDrop"
		>
			<input
				ref="input"
				type="file"
				accept=".csv"
				class="biconnector-dataset-import-v2-file-section__hidden-input"
				@change="onInputChange"
			/>

			<header class="biconnector-dataset-import-v2-file-section__header">
				<span class="biconnector-dataset-import-v2-file-section__header-icon ui-icon-set --o-attach"></span>
				<span class="biconnector-dataset-import-v2-file-section__header-title ui-typography-text-md">{{ titleMessage }}</span>
				<template v-if="hasFile">
					<span v-if="hasLocalFile" class="biconnector-dataset-import-v2-file-section__chip">
						<span class="biconnector-dataset-import-v2-file-section__chip-icon"></span>
						<span class="biconnector-dataset-import-v2-file-section__chip-name ui-typography-text-sm">{{ fileName }}</span>
						<button
							v-if="canRemoveFile"
							type="button"
							class="biconnector-dataset-import-v2-file-section__chip-remove ui-icon-set --cross-30"
							:title="removeHint"
							@click="onRemove"
						></button>
					</span>
					<span v-if="hasLocalFile" class="biconnector-dataset-import-v2-file-section__divider"></span>
					<button
						type="button"
						class="biconnector-dataset-import-v2-file-section__replace ui-typography-text-sm"
						@click="onReplace"
					>{{ replaceLabel }}</button>
				</template>
			</header>

			<div v-if="!hasFile" class="biconnector-dataset-import-v2-file-section__empty">
				<MascotVideo class="biconnector-dataset-import-v2-file-section__mascot" :playing="isUploading" />
				<p
					class="biconnector-dataset-import-v2-file-section__empty-text ui-typography-text-sm"
					:class="{ 'biconnector-dataset-import-v2-file-section__empty-text--loading': isUploading }"
					role="status"
					aria-live="polite"
				>{{ isUploading ? loadingMessage : emptyHint }}</p>
				<button
					type="button"
					class="biconnector-dataset-import-v2-file-section__browse"
					:class="{ 'biconnector-dataset-import-v2-file-section__browse--loading': isUploading }"
					:disabled="isUploading"
					@click="onPick"
				>
					<template v-if="isUploading">
						<span class="biconnector-dataset-import-v2-file-section__browse-spinner"></span>
					</template>
					<template v-else>
						<span class="biconnector-dataset-import-v2-file-section__browse-icon ui-icon-set --o-attach"></span>
						{{ browseLabel }}
					</template>
				</button>
			</div>

			<div
				v-if="isDragging && !hasFile"
				class="biconnector-dataset-import-v2-file-section__drag-overlay"
			>
				<div class="biconnector-dataset-import-v2-file-section__drag-content">
					<div class="biconnector-dataset-import-v2-file-section__drag-heading">
						<span class="biconnector-dataset-import-v2-file-section__drag-icon ui-icon-set --o-upload-file"></span>
						<span class="biconnector-dataset-import-v2-file-section__drag-title">{{ dragTitle }}</span>
					</div>
					<p class="biconnector-dataset-import-v2-file-section__drag-hint">{{ dragHint }}</p>
				</div>
			</div>
		</section>
	`
	};

	const CONNECTION_ENTITY_ID = 'biconnector-external-connection';
	const TABLE_ENTITY_ID = 'biconnector-external-table';
	const CONNECTION_SLIDER = '/bitrix/components/bitrix/biconnector.externalconnection/slider.php';
	const ConnectionSection = {
		components: {
			MascotVideo
		},
		inject: ['appParams'],
		emits: ['continue', 'replace'],
		props: {
			isEditing: {
				type: Boolean,
				required: false,
				default: false
			},
			isReselect: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		data() {
			return {
				titleMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_CONNECTION_SECTION_TITLE'),
				emptyHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_CONNECTION_SECTION_EMPTY_HINT'),
				continueLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CONNECTION_SECTION_CONTINUE'),
				replaceLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_REPLACE'),
				connectionLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_FIELD'),
				tableLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_TABLE_FIELD')
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['isEditMode', 'connectionProperties', 'datasetProperties']),
			connections() {
				return this.appParams?.connections ?? [];
			},
			selectedConnectionId() {
				return this.connectionProperties?.connectionId ?? 0;
			},
			selectedConnectionType() {
				return this.connectionProperties?.connectionType ?? '';
			},
			selectedConnectionName() {
				return this.connectionProperties?.connectionName ?? '';
			},
			selectedTableName() {
				return this.connectionProperties?.tableName ?? '';
			},
			datasetName() {
				return this.datasetProperties?.name ?? '';
			},
			headerTitle() {
				if (this.showSummary && !this.showSelectors && this.datasetName) {
					return this.datasetName;
				}
				return this.titleMessage;
			},
			selectedConnectionAvatar() {
				const id = this.selectedConnectionId;
				if (id > 0) {
					const connection = this.connections.find(item => parseInt(item.ID, 10) === id);
					if (connection && connection.AVATAR) {
						return connection.AVATAR;
					}
				}
				return `/bitrix/images/biconnector/database-connections/${this.selectedConnectionType}.svg`;
			},
			hasSelectedTable() {
				return this.selectedConnectionId > 0 && this.selectedTableName !== '';
			},
			showSelectors() {
				return !this.isEditMode && this.isEditing;
			},
			showSummary() {
				return this.isEditMode || this.hasSelectedTable;
			},
			canContinue() {
				return this.hasSelectedTable;
			},
			actionLabel() {
				return this.isReselect ? this.replaceLabel : this.continueLabel;
			}
		},
		watch: {
			selectedConnectionId(newConnectionId) {
				if (!this.tableSelector) {
					return;
				}
				this.tableSelector.removeTags();
				this.tableSelector.getDialog().removeItems();
				if (!newConnectionId) {
					this.tableSelector.setLocked(true);
					return;
				}
				this.tableSelector.getDialog().getEntity(TABLE_ENTITY_ID).options.connectionId = newConnectionId;
				this.tableSelector.setLocked(false);
			}
		},
		created() {
			this.connectionSelector = null;
			this.tableSelector = null;
		},
		async mounted() {
			this.onSliderMessage = event => this.handleSliderMessage(event);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', this.onSliderMessage);
			if (!this.isEditMode) {
				const {
					TagSelector
				} = await main_core.Runtime.loadExtension('ui.entity-selector');
				this.TagSelector = TagSelector;
				this.initConnectionSelector();
				this.initTableSelector();
			}
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onMessage', this.onSliderMessage);
		},
		methods: {
			preparedConnectionItems() {
				return this.connections.map(item => {
					const options = {
						id: item.ID,
						title: item.TITLE,
						entityId: CONNECTION_ENTITY_ID,
						tabs: 'connections',
						link: `${CONNECTION_SLIDER}?sourceId=${item.ID}&closeAfterCreate=Y`,
						linkTitle: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_ABOUT'),
						customData: {
							connectionType: item.TYPE,
							isSupportMapping: item.IS_SUPPORT_MAPPING ?? false
						}
					};
					if (item.AVATAR) {
						options.avatar = item.AVATAR;
					}
					if (this.selectedConnectionId) {
						options.selected = item.ID === String(this.selectedConnectionId);
					}
					return options;
				});
			},
			initConnectionSelector() {
				if (!this.$refs.connectionSelector) {
					return;
				}
				const selector = new this.TagSelector({
					id: CONNECTION_ENTITY_ID,
					multiple: false,
					addButtonCaption: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_SELECT'),
					addButtonCaptionMore: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_CHANGE'),
					dialogOptions: {
						id: CONNECTION_ENTITY_ID,
						items: this.preparedConnectionItems(),
						enableSearch: true,
						dropdownMode: true,
						popupOptions: {
							className: 'biconnector-dataset-entity-selector-popup'
						},
						showAvatars: true,
						compactView: false,
						multiple: false,
						width: 460,
						height: 420,
						tabs: [{
							id: 'connections',
							stubOptions: {
								title: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_EMPTY_TITLE'),
								subtitle: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_EMPTY_SUBTITLE')
							}
						}],
						entities: [{
							id: CONNECTION_ENTITY_ID
						}]
					},
					events: {
						onTagAdd: event => this.onConnectionSelected(event),
						onTagRemove: () => this.onConnectionDeselected()
					}
				});
				main_core.Dom.addClass(selector.getDialog().getContainer(), 'biconnector-dataset-entity-selector');
				selector.renderTo(this.$refs.connectionSelector);
				const footer = main_core.Tag.render`
				<span class="ui-selector-footer-link ui-selector-footer-link-add">
					${main_core.Text.encode(main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_CREATE'))}
				</span>
			`;
				main_core.Event.bind(footer, 'click', () => this.openConnectionSlider(0));
				selector.getDialog().getTab('connections').setFooter(footer);
				this.connectionSelector = selector;
			},
			initTableSelector() {
				if (!this.$refs.tableSelector) {
					return;
				}
				const selector = new this.TagSelector({
					id: TABLE_ENTITY_ID,
					multiple: false,
					addButtonCaption: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_SELECT'),
					addButtonCaptionMore: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_CHANGE'),
					dialogOptions: {
						id: TABLE_ENTITY_ID,
						enableSearch: true,
						dropdownMode: true,
						popupOptions: {
							className: 'biconnector-dataset-entity-selector-popup'
						},
						showAvatars: false,
						compactView: true,
						multiple: false,
						dynamicLoad: true,
						width: 460,
						height: 420,
						tabs: [{
							id: 'tables',
							stub: true,
							stubOptions: {
								title: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_TABLE_STUB_TITLE'),
								subtitle: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_TABLE_STUB_SUBTITLE')
							}
						}],
						entities: [{
							id: TABLE_ENTITY_ID,
							dynamicLoad: false,
							dynamicSearch: true,
							options: {
								...(this.selectedConnectionId && {
									connectionId: this.selectedConnectionId
								})
							}
						}]
					},
					events: {
						onTagAdd: event => this.onTableSelected(event),
						onTagRemove: () => this.onTableDeselected()
					}
				});
				main_core.Dom.addClass(selector.getDialog().getContainer(), 'biconnector-dataset-entity-selector');
				selector.setLocked(this.selectedConnectionId <= 0);
				selector.renderTo(this.$refs.tableSelector);
				this.tableSelector = selector;
			},
			onConnectionSelected(event) {
				const tag = event.data.tag;
				const dialogItems = event.target.getDialog().getItems();
				dialogItems.forEach(item => {
					if (item.getId() === tag.getId()) {
						tag.customData = item.getCustomData();
					}
				});
				const connectionId = parseInt(tag.getId(), 10);
				this.$store.commit('setConnectionProperties', {
					connectionId,
					connectionType: tag.getCustomData().get('connectionType'),
					connectionName: tag.getTitle(),
					connectionIsSupportMapping: Boolean(tag.getCustomData().get('isSupportMapping')),
					tableName: ''
				});
			},
			onConnectionDeselected() {
				this.$store.commit('setConnectionProperties', {
					connectionId: 0,
					connectionType: '',
					connectionName: '',
					connectionIsSupportMapping: false,
					tableName: ''
				});
			},
			onTableSelected(event) {
				const tag = event.data.tag;
				const dialogItems = event.target.getDialog().getItems();
				dialogItems.forEach(item => {
					if (item.getId() === tag.getId()) {
						tag.customData = item.getCustomData();
					}
				});
				this.$store.commit('setConnectionProperties', {
					...this.connectionProperties,
					tableName: tag.getTitle()
				});
				this.$store.commit('setDatasetProperties', {
					id: 0,
					name: tag.getCustomData().get('datasetName') ?? '',
					externalCode: tag.getId(),
					externalName: tag.getTitle()
				});
			},
			onTableDeselected() {
				this.$store.commit('setConnectionProperties', {
					...this.connectionProperties,
					tableName: ''
				});
				this.$store.commit('setDatasetProperties', {
					id: 0,
					name: '',
					externalCode: '',
					externalName: ''
				});
				this.$store.commit('setFieldsSettings', []);
				this.$store.commit('setPreviewData', []);
			},
			onContinue() {
				if (!this.canContinue) {
					return;
				}
				this.$emit('continue');
			},
			onReplace() {
				this.$emit('replace');
			},
			openConnectionSlider(connectionId) {
				const link = connectionId ? `${CONNECTION_SLIDER}?sourceId=${connectionId}&closeAfterCreate=Y` : `${CONNECTION_SLIDER}?closeAfterCreate=Y`;
				ui_sidepanel.SidePanel.Instance.open(link, {
					width: 564,
					allowChangeHistory: false,
					cacheable: false
				});
			},
			handleSliderMessage(event) {
				const [messageEvent] = event.getData();
				if (messageEvent.getEventId() !== 'BIConnector:ExternalConnection:onConnectionSave') {
					return;
				}
				const connection = messageEvent.data?.connection;
				if (!connection) {
					return;
				}
				const dialog = this.connectionSelector?.getDialog();
				if (!dialog) {
					return;
				}
				const connectionId = String(connection.id);
				const connectionName = main_core.Text.decode(connection.name ?? '');
				let item = dialog.getItem({
					id: connectionId,
					entityId: CONNECTION_ENTITY_ID
				});
				if (item) {
					item.setTitle({
						text: connectionName,
						type: 'text'
					});
					if (item.isSelected()) {
						this.connectionSelector.removeTags();
						item.deselect();
						item.select();
					}
				} else {
					item = dialog.addItem({
						id: connectionId,
						title: connectionName,
						entityId: CONNECTION_ENTITY_ID,
						tabs: 'connections',
						link: `${CONNECTION_SLIDER}?sourceId=${connectionId}&closeAfterCreate=Y`,
						linkTitle: main_core.Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_ABOUT'),
						avatar: connection.avatar ?? `/bitrix/images/biconnector/database-connections/${connection.type}.svg`,
						customData: {
							connectionType: connection.type ?? '',
							isSupportMapping: Boolean(connection.isSupportMapping ?? false)
						}
					});
					item.select();
				}
				dialog.hide();
			}
		},
		template: `
		<section
			class="biconnector-dataset-import-v2-connection-section"
			:class="{
				'biconnector-dataset-import-v2-connection-section--empty': showSelectors,
			}"
		>
			<header class="biconnector-dataset-import-v2-connection-section__header">
				<span class="biconnector-dataset-import-v2-connection-section__header-icon ui-icon-set --o-link-settings"></span>
				<span class="biconnector-dataset-import-v2-connection-section__header-title ui-typography-text-md">{{ headerTitle }}</span>
				<template v-if="showSummary && !showSelectors">
					<button
						type="button"
						class="biconnector-dataset-import-v2-connection-section__chip"
						@click="openConnectionSlider(selectedConnectionId)"
					>
						<span
							class="biconnector-dataset-import-v2-connection-section__chip-avatar"
							:style="{ backgroundImage: 'url(' + selectedConnectionAvatar + ')' }"
						></span>
						<span class="biconnector-dataset-import-v2-connection-section__chip-name ui-typography-text-sm">{{ selectedConnectionName }}</span>
					</button>
					<span
						v-if="!isEditMode"
						class="biconnector-dataset-import-v2-connection-section__divider"
					></span>
					<button
						v-if="!isEditMode"
						type="button"
						class="biconnector-dataset-import-v2-connection-section__replace ui-typography-text-sm"
						@click="onReplace"
					>{{ replaceLabel }}</button>
				</template>
			</header>

			<div
				v-show="showSelectors"
				class="biconnector-dataset-import-v2-connection-section__body"
			>
				<MascotVideo v-if="showSelectors" :playing="false" />
				<p class="biconnector-dataset-import-v2-connection-section__empty-text ui-typography-text-sm">{{ emptyHint }}</p>
				<div class="biconnector-dataset-import-v2-connection-section__form">
					<label class="biconnector-dataset-import-v2-connection-section__field">
						<span class="biconnector-dataset-import-v2-connection-section__field-label ui-typography-text-sm">{{ connectionLabel }}</span>
						<div ref="connectionSelector" class="biconnector-dataset-import-v2-connection-section__selector"></div>
					</label>
					<label class="biconnector-dataset-import-v2-connection-section__field">
						<span class="biconnector-dataset-import-v2-connection-section__field-label ui-typography-text-sm">{{ tableLabel }}</span>
						<div ref="tableSelector" class="biconnector-dataset-import-v2-connection-section__selector"></div>
					</label>
				</div>
				<button
					type="button"
					class="biconnector-dataset-import-v2-connection-section__continue"
					:disabled="!canContinue"
					@click="onContinue"
				>{{ actionLabel }}</button>
			</div>
		`
	};

	const FOCUS_COLUMN_EVENT = 'biconnector:dataset-import-v2:focus-column';
	const FOCUS_FIELD_EVENT = 'biconnector:dataset-import-v2:focus-field';
	const PreviewSection = {
		inject: ['sourceId'],
		data() {
			return {
				titleMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_TITLE'),
				emptyMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_EMPTY'),
				allHiddenMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_ALL_HIDDEN'),
				systemEmptyMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_SYSTEM_EMPTY'),
				scrollNextHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_SCROLL_NEXT'),
				scrollPrevHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_SCROLL_PREV'),
				invalidFormatMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_INVALID_FORMAT'),
				invalidFormatBadge: main_core.Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_INVALID_FORMAT_BADGE'),
				validatingMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_VALIDATING'),
				reloadingMessage: main_core.Loc.getMessage('DATASET_IMPORT_V2_PREVIEW_RELOADING'),
				showScrollNext: false,
				showScrollPrev: false,
				highlight: {
					left: 0,
					top: 0,
					width: 0,
					height: 0
				}
			};
		},
		beforeUnmount() {
			this.stopAutoScroll();
			window.removeEventListener('resize', this.onResize);
			main_core_events.EventEmitter.unsubscribe(FOCUS_COLUMN_EVENT, this.onFocusColumnEvent);
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['hasData', 'isSystem', 'activeFieldIndex', 'isValidating', 'isReloadingPreview', 'validationErrorsByField', 'validationErrorCellSet', 'validationErrors']),
			showLoader() {
				return this.isValidating || this.isReloadingPreview;
			},
			loaderMessage() {
				return this.isReloadingPreview ? this.reloadingMessage : this.validatingMessage;
			},
			totalErrorCount() {
				return this.visibleColumns.reduce((sum, column) => sum + column.errorCount, 0);
			},
			hasErrors() {
				return this.totalErrorCount > 0;
			},
			fieldsSettings() {
				return this.$store.state.config.fieldsSettings;
			},
			previewRows() {
				return this.$store.state.previewData.rows;
			},
			visibleColumns() {
				const errorCounts = this.validationErrorsByField;
				const columns = [];
				this.fieldsSettings.forEach((field, index) => {
					if (field.visible) {
						columns.push({
							field,
							index,
							errorCount: errorCounts[index] ?? 0
						});
					}
				});
				return columns;
			},
			visibleFields() {
				return this.visibleColumns.map(column => column.field);
			},
			previewEmptyMessage() {
				if (this.isSystem && !this.hasData) {
					return this.systemEmptyMessage;
				}
				if (this.hasData && this.visibleFields.length === 0) {
					return this.allHiddenMessage;
				}
				return this.emptyMessage;
			},
			isExternalConnection() {
				return this.sourceId !== 'csv' && this.sourceId !== 'system';
			},
			previewNoticeMessage() {
				if (this.hasData && (this.isSystem || this.isExternalConnection)) {
					return this.systemEmptyMessage;
				}
				return '';
			},
			activeVisibleColumnIndex() {
				const idx = this.activeFieldIndex;
				if (idx < 0) {
					return -1;
				}
				return this.visibleColumns.findIndex(column => column.index === idx);
			}
		},
		watch: {
			activeVisibleColumnIndex(value) {
				if (value < 0) {
					return;
				}
				this.$nextTick(() => {
					this.scrollColumnIntoView(value);
					this.updateHighlight();
				});
			},
			visibleColumns() {
				this.$nextTick(() => {
					this.updateScrollState();
					this.updateHighlight();
					this.refreshHints();
				});
			},
			previewRows() {
				this.$nextTick(() => {
					this.updateScrollState();
					this.updateHighlight();
				});
			}
		},
		mounted() {
			this.onResize = () => this.updateHighlight();
			window.addEventListener('resize', this.onResize);
			this.onFocusColumnEvent = event => {
				const data = event?.data ?? event;
				const fieldIndex = Array.isArray(data) ? data[0]?.index : data?.index;
				if (typeof fieldIndex !== 'number') {
					return;
				}
				const visibleIndex = this.visibleColumns.findIndex(column => column.index === fieldIndex);
				if (visibleIndex < 0) {
					return;
				}
				this.$nextTick(() => this.scrollColumnIntoView(visibleIndex));
			};
			main_core_events.EventEmitter.subscribe(FOCUS_COLUMN_EVENT, this.onFocusColumnEvent);
			this.$nextTick(() => {
				this.updateScrollState();
				this.updateHighlight();
				this.refreshHints();
			});
		},
		methods: {
			refreshHints() {
				if (!this.$el || typeof this.$el.querySelectorAll !== 'function') {
					return;
				}
				this.$el.querySelectorAll('[data-hint-init]').forEach(node => {
					node.removeAttribute('data-hint-init');
				});
				ui_hint.Hint.init(this.$el);
			},
			formatCell(value) {
				if (value === null || value === undefined) {
					return '';
				}
				return String(value);
			},
			cellHasError(rowIndex, fieldIndex) {
				return this.validationErrorCellSet.has(`${rowIndex}_${fieldIndex}`);
			},
			updateScrollState() {
				const scroll = this.$refs.scroll;
				if (!scroll) {
					this.showScrollNext = false;
					this.showScrollPrev = false;
					return;
				}
				this.showScrollPrev = scroll.scrollLeft > 4;
				this.showScrollNext = scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft > 4;
			},
			onScroll() {
				this.updateScrollState();
			},
			startAutoScroll(direction) {
				this.stopAutoScroll();
				const stepPx = 6;
				const tick = () => {
					const scroll = this.$refs.scroll;
					if (!scroll) {
						return;
					}
					scroll.scrollLeft += direction * stepPx;
					this.updateScrollState();
					const canContinue = direction > 0 ? this.showScrollNext : this.showScrollPrev;
					if (canContinue) {
						this.scrollRafId = requestAnimationFrame(tick);
					} else {
						this.scrollRafId = null;
					}
				};
				this.scrollRafId = requestAnimationFrame(tick);
			},
			stopAutoScroll() {
				if (this.scrollRafId) {
					cancelAnimationFrame(this.scrollRafId);
					this.scrollRafId = null;
				}
			},
			scrollColumnIntoView(visibleIndex) {
				const scroll = this.$refs.scroll;
				if (!scroll) {
					return;
				}
				const th = scroll.querySelectorAll('.biconnector-dataset-import-v2-preview__th')[visibleIndex];
				if (!th) {
					return;
				}
				const colLeft = th.offsetLeft;
				const colRight = colLeft + th.offsetWidth;
				const viewLeft = scroll.scrollLeft;
				const viewRight = viewLeft + scroll.clientWidth;
				let target = null;
				if (colLeft < viewLeft) {
					target = colLeft;
				} else if (colRight > viewRight) {
					target = colRight - scroll.clientWidth;
				}
				if (target !== null) {
					scroll.scrollTo({
						left: target,
						behavior: 'smooth'
					});
				}
			},
			onColumnClick(fieldIndex) {
				this.$store.commit('setActiveFieldIndex', fieldIndex);
				main_core_events.EventEmitter.emit(FOCUS_FIELD_EVENT, {
					index: fieldIndex
				});
			},
			updateHighlight() {
				const visibleIndex = this.activeVisibleColumnIndex;
				if (visibleIndex < 0) {
					return;
				}
				const scroll = this.$refs.scroll;
				if (!scroll) {
					return;
				}
				const th = scroll.querySelectorAll('.biconnector-dataset-import-v2-preview__th')[visibleIndex];
				const table = scroll.querySelector('.biconnector-dataset-import-v2-preview__table');
				if (!th || !table) {
					return;
				}
				const next = {
					left: th.offsetLeft,
					top: table.offsetTop,
					width: th.offsetWidth,
					height: table.offsetHeight
				};
				if (next.left === this.highlight.left && next.top === this.highlight.top && next.width === this.highlight.width && next.height === this.highlight.height) {
					return;
				}
				this.highlight = next;
			}
		},
		template: `
		<section class="biconnector-dataset-import-v2-preview">
			<header class="biconnector-dataset-import-v2-preview__header">
				<span class="biconnector-dataset-import-v2-preview__icon ui-icon-set --o-graphs-diagram"></span>
				<span class="biconnector-dataset-import-v2-preview__title ui-typography-text-md">{{ titleMessage }}</span>
				<span
					v-if="hasErrors"
					class="biconnector-dataset-import-v2-preview__header-badge"
				>
					<span class="biconnector-dataset-import-v2-preview__header-badge-icon ui-icon-set --o-alert-accent"></span>
					<span class="biconnector-dataset-import-v2-preview__header-badge-text ui-typography-text-sm">{{ invalidFormatBadge }}</span>
					<span class="biconnector-dataset-import-v2-preview__header-badge-count">{{ totalErrorCount }}</span>
				</span>
			</header>
			<div
				v-if="previewNoticeMessage"
				class="biconnector-dataset-import-v2-preview__subtitle ui-typography-text-sm"
			>{{ previewNoticeMessage }}</div>

			<div v-if="!hasData || visibleFields.length === 0" class="biconnector-dataset-import-v2-preview__empty">
				{{ previewEmptyMessage }}
			</div>

			<div v-else class="biconnector-dataset-import-v2-preview__scroll-wrapper">
				<template v-if="showLoader">
					<div class="biconnector-dataset-import-v2-preview__loader-bg"></div>
					<div class="biconnector-dataset-import-v2-preview__sticky-anchor">
						<div
							class="biconnector-dataset-import-v2-preview__loader-indicator"
							role="status"
							aria-live="polite"
						>
							<span class="biconnector-dataset-import-v2-preview__loader-spinner"></span>
							<span class="biconnector-dataset-import-v2-preview__loader-text ui-typography-text-sm">{{ loaderMessage }}</span>
						</div>
					</div>
				</template>
				<div
					v-if="showScrollPrev || showScrollNext"
					class="biconnector-dataset-import-v2-preview__sticky-anchor"
				>
					<div
						v-if="showScrollPrev"
						class="biconnector-dataset-import-v2-preview__scroll-ear biconnector-dataset-import-v2-preview__scroll-ear--prev"
						:title="scrollPrevHint"
						@mouseenter="startAutoScroll(-1)"
						@mouseleave="stopAutoScroll"
					>
						<span class="ui-icon-set --chevron-left"></span>
					</div>
					<div
						v-if="showScrollNext"
						class="biconnector-dataset-import-v2-preview__scroll-ear biconnector-dataset-import-v2-preview__scroll-ear--next"
						:title="scrollNextHint"
						@mouseenter="startAutoScroll(1)"
						@mouseleave="stopAutoScroll"
					>
						<span class="ui-icon-set --chevron-right"></span>
					</div>
				</div>
				<div
					ref="scroll"
					class="biconnector-dataset-import-v2-preview__scroll"
					@scroll="onScroll"
				>
					<div
						class="biconnector-dataset-import-v2-preview__column-highlight"
						:class="{ 'biconnector-dataset-import-v2-preview__column-highlight--visible': activeVisibleColumnIndex >= 0 }"
						:style="{ left: highlight.left + 'px', top: highlight.top + 'px', width: highlight.width + 'px', height: highlight.height + 'px' }"
					></div>
					<table class="biconnector-dataset-import-v2-preview__table">
						<thead>
							<tr class="biconnector-dataset-import-v2-preview__head-row">
								<th
									v-for="column in visibleColumns"
									:key="column.field.id || column.index"
									class="biconnector-dataset-import-v2-preview__th"
									@click="onColumnClick(column.index)"
								>
									<div class="biconnector-dataset-import-v2-preview__th-content">
										<span class="biconnector-dataset-import-v2-preview__col-name ui-typography-text-sm">{{ column.field.name }}</span>
										<span
											v-if="column.errorCount > 0"
											class="biconnector-dataset-import-v2-preview__col-badge"
										>{{ column.errorCount }}</span>
										<span
											v-if="column.field.description"
											class="biconnector-dataset-import-v2-preview__col-hint"
											:data-hint="column.field.description"
											data-hint-outline
										></span>
									</div>
								</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="(row, rowIndex) in previewRows"
								:key="rowIndex"
								class="biconnector-dataset-import-v2-preview__tr"
							>
								<td
									v-for="column in visibleColumns"
									:key="column.field.id || column.index"
									class="biconnector-dataset-import-v2-preview__td ui-typography-text-sm"
									:class="{ 'biconnector-dataset-import-v2-preview__td--error': cellHasError(rowIndex, column.index) }"
									:title="cellHasError(rowIndex, column.index) ? invalidFormatMessage : null"
									@click="onColumnClick(column.index)"
								>{{ formatCell(row[column.index]) }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</section>
	`
	};

	function showErrorPopup(error, title) {
		const safeTitle = title ?? main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE') ?? '';
		const message = error?.errors?.[0]?.message || error?.message || main_core.Loc.getMessage('DATASET_IMPORT_V2_SAVE_ERROR') || '';
		const content = main_core.Tag.render`
		<div class="biconnector-dataset-import-v2-error-popup" data-testid="dataset-import-error-popup">
			<div class="biconnector-dataset-import-v2-error-popup__body">
				<div class="biconnector-dataset-import-v2-error-popup__mascot"></div>
				<div class="biconnector-dataset-import-v2-error-popup__text">
					<h3 class="biconnector-dataset-import-v2-error-popup__title" id="biconnector-dataset-import-v2-error-popup-title">${main_core.Text.encode(safeTitle)}</h3>
					<div class="biconnector-dataset-import-v2-error-popup__description">${main_core.Text.encode(message)}</div>
				</div>
			</div>
			<div class="biconnector-dataset-import-v2-error-popup__actions"></div>
		</div>
	`;
		const popup = new main_popup.Popup({
			id: 'biconnector-import-v2-save-error',
			content,
			className: 'biconnector-dataset-import-v2-error-popup',
			width: 400,
			padding: 0,
			autoHide: false,
			fixed: true,
			overlay: true,
			closeIcon: false,
			closeByEsc: true,
			cacheable: false,
			ariaLabelledBy: 'biconnector-dataset-import-v2-error-popup-title',
			focusTrap: {
				initialFocus: 'first-tabbable'
			}
		});
		const closeButton = main_core.Tag.render`
		<button
			type="button"
			class="biconnector-dataset-import-v2-error-popup__close"
			aria-label="${main_core.Loc.getMessage('DATASET_IMPORT_V2_POPUP_CLOSE')}"
			data-testid="dataset-import-error-popup-close-btn"
		></button>
	`;
		const closeIcon = new ui_iconSet_api_core.Icon({
			icon: ui_iconSet_api_core.Outline.CROSS_L,
			size: 28
		}).render();
		closeIcon.setAttribute('aria-hidden', 'true');
		closeButton.append(closeIcon);
		closeButton.addEventListener('click', () => popup.close());
		content.prepend(closeButton);
		const okButtonOptions = {
			useAirDesign: true,
			text: main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_OK') ?? '',
			style: ui_buttons.AirButtonStyle.FILLED,
			size: ui_buttons.ButtonSize.LARGE,
			onclick: () => {
				popup.close();
				return {};
			}
		};
		const okButton = new ui_buttons.Button(okButtonOptions);
		okButton.render().dataset.testid = 'dataset-import-error-popup-ok-btn';
		content.querySelector('.biconnector-dataset-import-v2-error-popup__actions')?.append(okButton.render());
		popup.show();
	}

	const PARSING_SETTINGS_ERROR_CODES = new Set(['DIFFERENT_COUNT_FIELDS', 'EMPTY_DATA']);
	function isParsingSettingsError(error) {
		const errors = error?.errors ?? [];
		return errors.length > 0 && errors.every(({
			code
		}) => code && PARSING_SETTINGS_ERROR_CODES.has(code));
	}
	function requestDatasetView(store, sourceCode, options = {}) {
		const state = store.state.config;
		const datasetProperties = options.skipExistingSchemaCheck ? {
			...state.datasetProperties,
			id: 0
		} : state.datasetProperties;
		return main_core.ajax.runAction('biconnector.externalsource.dataset.view', {
			data: {
				type: sourceCode,
				fields: {
					fileProperties: state.fileProperties,
					datasetProperties,
					fieldsSettings: state.fieldsSettings,
					dataFormats: state.dataFormats
				}
			}
		});
	}
	function mapHeadersToFieldsSettings(headers, currentFields = []) {
		return headers.map((header, index) => {
			const currentField = currentFields[index];
			const isExistingField = (currentField?.id ?? 0) > 0;
			return {
				id: currentField?.id ?? 0,
				visible: true,
				type: isExistingField ? currentField.type : header.type,
				name: isExistingField ? currentField.name : header.name && header.name.length > 0 ? header.name : `FIELD_${index}`,
				originalName: header.externalCode,
				externalCode: header.externalCode,
				description: header.description ?? ''
			};
		});
	}
	function extractPreviewRows(response) {
		return response?.data?.data ?? [];
	}
	function hasPreviewSchemaMismatch(store, response) {
		return store.getters.isEditMode && (response?.data?.headers?.length ?? 0) !== store.state.config.fieldsSettings.length;
	}

	const STEP_FILE = 1;
	const STEP_PARSE = 2;
	const STEP_REPORT = 3;
	const STEP_3_HOLD_MS = 600;
	const MAX_FILE_SIZE = 60 * 1024 * 1024;
	class UploadController {
		store;
		sourceCode;
		uploader = null;
		currentUploadId = 0;
		constructor(store, options) {
			this.store = store;
			this.sourceCode = options.sourceCode;
		}
		destroy() {
			this.cancelPending();
			this.disposeUploader();
		}
		cancelPending() {
			this.currentUploadId++;
		}
		async upload(file) {
			const uploadId = ++this.currentUploadId;
			this.store.commit('setUploadStatus', {
				isUploading: true,
				step: STEP_FILE
			});
			try {
				const {
					token,
					name
				} = await this.runUpload(file);
				if (uploadId !== this.currentUploadId) {
					return;
				}
				this.store.commit('setFileProperties', {
					fileToken: token,
					fileName: name
				});
				const datasetName = this.store.state.config.datasetProperties.name;
				if (!datasetName || datasetName.length === 0) {
					const autoName = this.makeDatasetName(name);
					if (autoName) {
						this.store.commit('setDatasetProperties', {
							name: autoName
						});
					}
				}
				this.store.commit('setUploadStatus', {
					step: STEP_PARSE
				});
				const parsingProperties = this.getParsingProperties();
				let response;
				try {
					response = await requestDatasetView(this.store, this.sourceCode, {
						skipExistingSchemaCheck: true
					});
				} catch (error) {
					if (uploadId !== this.currentUploadId) {
						return;
					}
					if (!isParsingSettingsError(error) || !this.store.getters.isEditMode) {
						throw error;
					}
					if (this.areParsingPropertiesCurrent(parsingProperties)) {
						this.store.commit('setPreviewData', []);
						this.store.commit('setPreviewSchemaMismatch', false);
					}
					return;
				}
				if (uploadId !== this.currentUploadId || !this.areParsingPropertiesCurrent(parsingProperties)) {
					return;
				}
				this.store.commit('setUploadStatus', {
					step: STEP_REPORT
				});
				if (this.store.getters.isEditMode) {
					await this.applyEditResponse(response, parsingProperties, uploadId);
				} else {
					this.applyResponse(response);
				}
				await new Promise(resolve => setTimeout(resolve, STEP_3_HOLD_MS));
			} catch (error) {
				if (uploadId === this.currentUploadId) {
					showErrorPopup(error, main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_UPLOAD'));
				}
			} finally {
				if (uploadId === this.currentUploadId) {
					this.store.commit('setUploadStatus', {
						isUploading: false,
						step: 0
					});
				}
			}
		}
		async applyEditResponse(response, parsingProperties, uploadId) {
			const hasMismatch = hasPreviewSchemaMismatch(this.store, response);
			this.store.commit('setPreviewSchemaMismatch', hasMismatch);
			this.store.commit('setPreviewData', hasMismatch ? [] : extractPreviewRows(response));
			if (hasMismatch) {
				await this.showSchemaMismatchError(parsingProperties, uploadId);
			}
		}
		async showSchemaMismatchError(parsingProperties, uploadId) {
			try {
				await requestDatasetView(this.store, this.sourceCode);
			} catch (error) {
				if (uploadId === this.currentUploadId && this.areParsingPropertiesCurrent(parsingProperties)) {
					showErrorPopup(error, main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_UPLOAD'));
				}
			}
		}
		getParsingProperties() {
			const {
				fileToken,
				encoding,
				separator,
				firstLineHeader
			} = this.store.state.config.fileProperties;
			return {
				fileToken,
				encoding,
				separator,
				firstLineHeader
			};
		}
		areParsingPropertiesCurrent(properties) {
			const current = this.getParsingProperties();
			return Object.keys(properties).every(key => {
				const property = key;
				return properties[property] === current[property];
			});
		}
		async runUpload(file) {
			const {
				Uploader
			} = await main_core.Runtime.loadExtension('ui.uploader.core');
			this.disposeUploader();
			return new Promise((resolve, reject) => {
				const uploader = new Uploader({
					controller: 'biconnector.integration.ui.fileUploaderController.datasetUploaderController',
					controllerOptions: {},
					multiple: false,
					autoUpload: true,
					maxFileSize: MAX_FILE_SIZE,
					acceptedFileTypes: ['.csv'],
					events: {
						'File:onUploadComplete': () => {
							const f = uploader.getFiles()[0];
							if (f && (!f.isComplete || f.isComplete())) {
								resolve({
									token: f.getServerFileId(),
									name: f.getName()
								});
							}
						},
						'File:onError': event => {
							reject(this.normalizeError(event));
						},
						onError: event => {
							reject(this.normalizeError(event));
						}
					}
				});
				this.uploader = uploader;
				uploader.addFiles([file]);
			});
		}
		disposeUploader() {
			this.uploader?.destroy();
			this.uploader = null;
		}
		applyResponse(response) {
			const headers = response?.data?.headers ?? [];
			const currentFields = this.store.state.config.fieldsSettings;
			this.store.commit('setFieldsSettings', mapHeadersToFieldsSettings(headers, currentFields));
			this.store.commit('setPreviewData', extractPreviewRows(response));
		}
		normalizeError(event) {
			const data = event?.getData?.()?.[0];
			const message = data?.message || event?.message || main_core.Loc.getMessage('DATASET_IMPORT_V2_UPLOAD_ERROR') || '';
			return new Error(message);
		}
		makeDatasetName(fileName) {
			const base = String(fileName ?? '').replace(/\.[^./\\]+$/, '');
			const cleaned = base.replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
			if (cleaned.length === 0) {
				return '';
			}
			const prefixed = /^[A-Za-z]/.test(cleaned) ? cleaned : `D_${cleaned}`;
			return prefixed.slice(0, 30).toLowerCase();
		}
	}

	const LOAD_EVENT$1 = 'biconnector:dataset-import-v2:connection-load';
	const DataPanel = {
		inject: ['sourceId'],
		components: {
			FileSection,
			ConnectionSection,
			PreviewSection
		},
		data() {
			return {
				connectionReselect: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['hasFile', 'isSystem', 'connectionEditing']),
			isCsv() {
				return this.sourceId === 'csv';
			},
			isExternalConnection() {
				return this.sourceId !== 'csv' && this.sourceId !== 'system';
			},
			showPreview() {
				if (this.isCsv) {
					return this.hasFile;
				}
				if (this.isExternalConnection) {
					return !this.connectionEditing;
				}
				return this.isSystem;
			}
		},
		mounted() {
			this.initialCsvState = {
				fileProperties: {
					...this.$store.state.config.fileProperties
				},
				dataFormats: {
					...this.$store.state.config.dataFormats
				},
				previewRows: this.$store.state.previewData.rows.map(row => [...row])
			};
			this.uploadController = new UploadController(this.$store, {
				sourceCode: this.sourceId
			});
		},
		beforeUnmount() {
			this.uploadController?.destroy();
			this.uploadController = null;
		},
		methods: {
			onConnectionContinue() {
				this.connectionReselect = false;
				this.$store.commit('setConnectionEditing', false);
				main_core_events.EventEmitter.emit(LOAD_EVENT$1, {});
			},
			onConnectionReplace() {
				this.connectionReselect = true;
				this.$store.commit('setConnectionEditing', true);
				this.$store.commit('setFieldsSettings', []);
				this.$store.commit('setPreviewData', []);
			},
			onPickFile(file) {
				if (!this.uploadController) {
					return;
				}
				this.uploadController.upload(file);
			},
			onRemoveFile() {
				this.uploadController?.cancelPending();
				this.$store.commit('setUploadStatus', {
					isUploading: false,
					step: 0
				});
				this.$store.commit('setValidationLoading', false);
				if (this.$store.getters.isEditMode && this.initialCsvState) {
					this.$store.commit('setFileProperties', {
						...this.initialCsvState.fileProperties
					});
					this.$store.commit('setDataFormats', {
						...this.initialCsvState.dataFormats
					});
					this.$store.commit('setPreviewData', this.initialCsvState.previewRows.map(row => [...row]));
					this.$store.commit('setPreviewSchemaMismatch', false);
					this.$store.commit('setValidationErrors', []);
					return;
				}
				this.$store.commit('setFileProperties', {
					fileName: '',
					fileToken: ''
				});
				this.$store.commit('setFieldsSettings', []);
				this.$store.commit('setPreviewData', []);
			}
		},
		template: `
		<section class="biconnector-dataset-import-v2__data-panel">
			<FileSection
				v-if="isCsv"
				@pick-file="onPickFile"
				@remove-file="onRemoveFile"
			/>
			<ConnectionSection
				v-if="isExternalConnection"
				:is-editing="connectionEditing"
				:is-reselect="connectionReselect"
				@continue="onConnectionContinue"
				@replace="onConnectionReplace"
			/>
			<PreviewSection v-if="showPreview" />
		</section>
	`
	};

	class Analytics {
		sourceCode;
		constructor(sourceCode) {
			this.sourceCode = sourceCode;
		}
		send(params) {
			if (!this.sourceCode) {
				return;
			}
			ui_analytics.sendData({
				tool: 'BI_Builder',
				c_section: 'BI_Builder',
				category: this.sourceCode.toUpperCase(),
				...params
			});
		}
	}

	const SAVE_EVENT$1 = 'biconnector:dataset-import-v2:save';
	const MAX_DISPLAYED_ERRORS = 200;
	const ERRORS_HELP_ARTICLE = '23779844';
	const STEP_BY_MUTATION = {
		setFileProperties: 'step_1',
		setDatasetProperties: 'step_2',
		setFieldRowSettings: 'step_3',
		setFieldsSettings: 'step_3',
		toggleRowVisibility: 'step_3',
		setAllRowsVisible: 'step_3',
		setAllRowsInvisible: 'step_3',
		setDataFormats: 'step_3'
	};
	class SaveController {
		store;
		sourceCode;
		isSupersetReady;
		analytics;
		isChanged = false;
		isSaved = false;
		isConfirmedClose = false;
		lastReportedStep = '';
		ignoreFileErrors = false;
		fileErrorsPopup = null;
		reportDownloadLink = null;
		mutationUnsubscribe = null;
		sliderCloseHandler = null;
		constructor(store, options) {
			this.store = store;
			this.sourceCode = options.sourceCode;
			this.isSupersetReady = Boolean(options.isSupersetReady);
			this.analytics = new Analytics(this.sourceCode);
		}
		attach() {
			this.mutationUnsubscribe = this.store.subscribe(mutation => {
				if (mutation.type === 'setSectionsConfig' || mutation.type === 'resetSectionsConfig') {
					return;
				}
				this.isChanged = true;
				this.resetErrorLog();
				this.reportStepChange(mutation.type);
			});
			const slider = main_sidepanel.SidePanel?.Instance?.getTopSlider?.();
			if (slider) {
				this.sliderCloseHandler = event => {
					const sliderEvent = event?.getData?.()?.[0] ?? event;
					this.onSliderClose(sliderEvent);
				};
				main_core_events.EventEmitter.subscribe(slider, 'SidePanel.Slider:onClose', this.sliderCloseHandler);
			}
		}
		detach() {
			if (this.mutationUnsubscribe) {
				this.mutationUnsubscribe();
				this.mutationUnsubscribe = null;
			}
			const slider = main_sidepanel.SidePanel?.Instance?.getTopSlider?.();
			if (slider && this.sliderCloseHandler) {
				main_core_events.EventEmitter.unsubscribe(slider, 'SidePanel.Slider:onClose', this.sliderCloseHandler);
				this.sliderCloseHandler = null;
			}
			this.closeFileErrorsPopup();
			this.resetErrorLog();
		}
		resetErrorLog() {
			if (this.reportDownloadLink) {
				window.URL.revokeObjectURL(this.reportDownloadLink);
				this.reportDownloadLink = null;
			}
		}
		canSave() {
			return this.getSaveBlockReason() === null;
		}
		getSaveBlockReason() {
			const state = this.store.state.config;
			const hasConnectionSource = Boolean(state.connectionProperties?.connectionId && state.connectionProperties?.tableName);
			if (!state.fileProperties.fileToken && !state.datasetProperties.id && !hasConnectionSource) {
				return main_core.Loc.getMessage('DATASET_IMPORT_V2_SAVE_BLOCKED_NO_FILE') ?? '';
			}
			if (state.fieldsSettings.length === 0) {
				return main_core.Loc.getMessage('DATASET_IMPORT_V2_SAVE_BLOCKED_NO_FIELDS') ?? '';
			}
			if (state.fieldsSettings.every(row => !row.visible)) {
				return main_core.Loc.getMessage('DATASET_IMPORT_V2_SAVE_BLOCKED_NO_VISIBLE_FIELDS') ?? '';
			}
			if (!state.datasetProperties.name || state.datasetProperties.name.length === 0) {
				return main_core.Loc.getMessage('DATASET_IMPORT_V2_SAVE_BLOCKED_NO_NAME') ?? '';
			}
			return null;
		}
		async checkFile() {
			const state = this.store.state.config;
			try {
				const response = await main_core.ajax.runAction('biconnector.externalsource.dataset.checkFile', {
					data: {
						type: this.sourceCode,
						fields: {
							fileProperties: state.fileProperties,
							datasetProperties: state.datasetProperties,
							fieldsSettings: state.fieldsSettings,
							dataFormats: state.dataFormats
						}
					}
				});
				const errors = this.normalizeCheckErrors(response.data?.checkFileErrors);
				if (errors.length === 0) {
					this.showInfoPopup(main_core.Loc.getMessage('DATASET_IMPORT_V2_CHECK_OK_TITLE') ?? '', main_core.Loc.getMessage('DATASET_IMPORT_V2_CHECK_OK_TEXT') ?? '');
				} else {
					this.showCheckErrorsPopup(errors);
				}
			} catch (error) {
				showErrorPopup(error, main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_CHECK'));
			}
		}
		async exportFile() {
			const datasetId = this.store.state.config.datasetProperties.id;
			const title = this.store.state.config.datasetProperties.name || 'dataset';
			if (!datasetId) {
				return;
			}
			try {
				await biconnector_fileExport.FileExport.getInstance().download({
					id: datasetId,
					title
				});
			} catch (error) {
				showErrorPopup(error, main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_EXPORT'));
			}
		}
		async save() {
			const blockReason = this.getSaveBlockReason();
			if (blockReason !== null) {
				this.notify(blockReason);
				return;
			}
			const ignoreFileErrors = this.ignoreFileErrors;
			this.ignoreFileErrors = false;
			if (this.sourceCode === 'csv' && this.store.state.config.fileProperties.fileToken && !ignoreFileErrors) {
				const fileErrors = await this.collectFileErrors();
				if (fileErrors === null) {
					return;
				}
				if (fileErrors.length > 0) {
					this.showFileErrorsPopup(fileErrors);
					return;
				}
			}
			const isEditMode = this.store.getters.isEditMode;
			const action = isEditMode ? 'biconnector.externalsource.dataset.update' : 'biconnector.externalsource.dataset.add';
			const payload = {
				fileProperties: this.store.state.config.fileProperties,
				datasetProperties: this.store.state.config.datasetProperties,
				fieldsSettings: this.store.state.config.fieldsSettings,
				dataFormats: this.store.state.config.dataFormats
			};
			const connection = this.store.state.config.connectionProperties;
			if (connection) {
				payload.connectionSettings = connection;
			}
			const sourceType = connection?.connectionType || this.sourceCode;
			const data = {
				type: sourceType,
				fields: payload
			};
			if (isEditMode) {
				data.id = this.store.state.config.datasetProperties.id;
			}
			try {
				const response = await main_core.ajax.runAction(action, {
					data
				});
				this.isSaved = true;
				this.isChanged = false;
				this.isConfirmedClose = true;
				this.analytics.send({
					event: isEditMode ? 'edit_end' : 'creation_end',
					status: 'success',
					p1: `datasetName_${(this.store.state.config.datasetProperties.name || '').replaceAll('_', '')}`
				});
				main_sidepanel.SidePanel?.Instance?.postMessage(window, 'BIConnector.dataset-import:onDatasetCreated', {});
				if (isEditMode) {
					this.closeSlider();
					return;
				}
				const datasetId = Number(response?.data?.id ?? this.store.state.config.datasetProperties.id);
				const title = response?.data?.name ?? this.store.state.config.datasetProperties.name ?? '';
				const fileName = this.store.state.config.fileProperties.fileName ?? '';
				this.showSuccessPopup(datasetId, title, fileName);
			} catch (error) {
				this.analytics.send({
					event: isEditMode ? 'edit_end' : 'creation_end',
					status: 'error'
				});
				showErrorPopup(error, isEditMode ? main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_EDIT') : undefined);
			}
		}
		notify(message) {
			const center = window.BX?.UI?.Notification?.Center;
			if (center) {
				center.notify({
					content: message
				});
			}
		}
		reportStepChange(mutationType) {
			const step = STEP_BY_MUTATION[mutationType];
			if (!step || step === this.lastReportedStep) {
				return;
			}
			this.lastReportedStep = step;
			const isEditMode = this.store.getters.isEditMode;
			const params = {
				event: isEditMode ? 'edit_start' : 'creation_start',
				c_element: step
			};
			if (isEditMode) {
				const name = this.store.state.config.datasetProperties.name || '';
				params.p1 = `datasetName_${name.replaceAll('_', '')}`;
			}
			this.analytics.send(params);
		}
		onSliderClose(event) {
			if (this.isConfirmedClose || this.isSaved || this.store.getters.isEditMode) {
				return;
			}
			const fileName = this.store.state.config.fileProperties.fileName || '';
			if (!fileName) {
				this.analytics.send({
					event: this.store.getters.isEditMode ? 'edit_end' : 'creation_end',
					status: 'error'
				});
				return;
			}
			event.denyAction?.();
			showDeleteFileConfirm({
				fileName,
				onConfirm: () => {
					this.isConfirmedClose = true;
					this.isChanged = false;
					this.analytics.send({
						event: this.store.getters.isEditMode ? 'edit_end' : 'creation_end',
						status: 'error'
					});
					this.closeSlider();
				}
			});
		}
		closeSlider() {
			const slider = main_sidepanel.SidePanel?.Instance?.getTopSlider?.();
			if (slider) {
				slider.close(true);
			}
		}
		normalizeCheckErrors(raw) {
			if (!raw || typeof raw !== 'object') {
				return [];
			}
			const fields = this.store.state.config.fieldsSettings;
			const result = [];
			Object.entries(raw).forEach(([lineNumber, errs]) => {
				(errs || []).forEach(e => {
					const fieldIdx = e?.customData?.field ?? -1;
					result.push({
						lineNumber,
						columnName: fields[fieldIdx]?.name ?? '',
						errorMessage: e?.message ?? '',
						value: e?.customData?.value ?? ''
					});
				});
			});
			return result;
		}
		async collectFileErrors() {
			const state = this.store.state.config;
			try {
				const response = await main_core.ajax.runAction('biconnector.externalsource.dataset.checkFile', {
					data: {
						type: this.sourceCode,
						fields: {
							fileProperties: state.fileProperties,
							datasetProperties: state.datasetProperties,
							fieldsSettings: state.fieldsSettings,
							dataFormats: state.dataFormats
						}
					}
				});
				return this.normalizeCheckErrors(response.data?.checkFileErrors);
			} catch (error) {
				showErrorPopup(error, main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_CHECK'));
				return null;
			}
		}
		continueSaveIgnoringErrors() {
			this.ignoreFileErrors = true;
			this.closeFileErrorsPopup();
			main_core_events.EventEmitter.emit(SAVE_EVENT$1, {});
		}
		closeFileErrorsPopup() {
			if (this.fileErrorsPopup) {
				this.fileErrorsPopup.destroy();
				this.fileErrorsPopup = null;
			}
		}
		downloadErrorLog(button) {
			if (this.reportDownloadLink) {
				this.triggerLogDownload();
				return;
			}
			button.setWaiting(true);
			const state = this.store.state.config;
			main_core.ajax.runAction('biconnector.externalsource.dataset.logErrorsIntoFile', {
				data: {
					type: this.sourceCode,
					fields: state
				}
			}).then(response => {
				button.setWaiting(false);
				const blob = new Blob([response?.data ?? ''], {
					type: 'text/html'
				});
				this.reportDownloadLink = window.URL.createObjectURL(blob);
				this.triggerLogDownload();
			}).catch(() => {
				button.setWaiting(false);
			});
		}
		triggerLogDownload() {
			if (!this.reportDownloadLink) {
				return;
			}
			const link = document.createElement('a');
			link.href = this.reportDownloadLink;
			link.download = `${this.store.state.config.datasetProperties.name || 'csv_table'}_errors.html`;
			document.body.appendChild(link);
			link.click();
			link.remove();
		}
		showFileErrorsPopup(errors) {
			this.closeFileErrorsPopup();
			const displayed = errors.slice(0, MAX_DISPLAYED_ERRORS);
			const countText = errors.length > MAX_DISPLAYED_ERRORS ? `${MAX_DISPLAYED_ERRORS}+` : String(errors.length);
			const title = (main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_TITLE') ?? '').replace('#COUNT#', countText);
			const content = main_core.Tag.render`
			<div class="biconnector-dataset-import-v2-file-errors" data-testid="dataset-import-file-errors-popup">
				<div class="biconnector-dataset-import-v2-file-errors__header">
					<div class="biconnector-dataset-import-v2-file-errors__graphic"></div>
					<div class="biconnector-dataset-import-v2-file-errors__header-body">
						<h3 class="biconnector-dataset-import-v2-file-errors__title" id="biconnector-dataset-import-v2-file-errors-title">${title}</h3>
						<div class="biconnector-dataset-import-v2-file-errors__description">
							<span class="biconnector-dataset-import-v2-file-errors__description-text">${main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_DESCRIPTION')}</span>
							<a
								class="biconnector-dataset-import-v2-file-errors__more"
								href="#"
								aria-label="${main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_MORE_LABEL')}"
								data-testid="dataset-import-file-errors-help-link"
							>${main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_MORE')}</a>
						</div>
					</div>
				</div>
				<div class="biconnector-dataset-import-v2-file-errors__table" data-testid="dataset-import-file-errors-table">
					<div
						class="biconnector-dataset-import-v2-file-errors__scroll"
						role="table"
						aria-label="${main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_TABLE_LABEL')}"
					>
						<div class="biconnector-dataset-import-v2-file-errors__row biconnector-dataset-import-v2-file-errors__row--head" role="row">
							<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--head" role="columnheader">
								<span class="biconnector-dataset-import-v2-file-errors__cell-text">${main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_COL_PROBLEM')}</span>
							</div>
							<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--head" role="columnheader">
								<span class="biconnector-dataset-import-v2-file-errors__cell-text">${main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_COL_VALUE')}</span>
							</div>
							<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--head" role="columnheader">
								<span class="biconnector-dataset-import-v2-file-errors__cell-text">${main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_COL_ROW')}</span>
							</div>
							<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--head" role="columnheader">
								<span class="biconnector-dataset-import-v2-file-errors__cell-text">${main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_COL_COLUMN')}</span>
							</div>
						</div>
						<div class="biconnector-dataset-import-v2-file-errors__tbody" role="rowgroup"></div>
					</div>
				</div>
				<div class="biconnector-dataset-import-v2-file-errors__actions"></div>
			</div>
		`;
			const tbody = content.querySelector('.biconnector-dataset-import-v2-file-errors__tbody');
			displayed.forEach(error => {
				tbody?.appendChild(main_core.Tag.render`
				<div class="biconnector-dataset-import-v2-file-errors__row" role="row">
					<div class="biconnector-dataset-import-v2-file-errors__cell" role="cell">
						<span class="biconnector-dataset-import-v2-file-errors__cell-text">${main_core.Text.encode(error.errorMessage)}</span>
					</div>
					<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--value" role="cell">
						<span class="biconnector-dataset-import-v2-file-errors__cell-text">${error.value ? main_core.Text.encode(error.value) : '—'}</span>
					</div>
					<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--muted" role="cell">
						<span class="biconnector-dataset-import-v2-file-errors__cell-text">${main_core.Text.encode(error.lineNumber)}</span>
					</div>
					<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--muted" role="cell">
						<span class="biconnector-dataset-import-v2-file-errors__cell-text" title="${main_core.Text.encode(error.columnName)}">${main_core.Text.encode(error.columnName)}</span>
					</div>
				</div>
			`);
			});
			content.querySelector('.biconnector-dataset-import-v2-file-errors__more')?.addEventListener('click', event => {
				event.preventDefault();
				window.top?.BX?.Helper?.show(`redirect=detail&code=${ERRORS_HELP_ARTICLE}`);
			});
			const closeButton = main_core.Tag.render`
			<button
				type="button"
				class="biconnector-dataset-import-v2-file-errors__close"
				aria-label="${main_core.Loc.getMessage('DATASET_IMPORT_V2_POPUP_CLOSE')}"
				data-testid="dataset-import-file-errors-close-btn"
			></button>
		`;
			const closeIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CROSS_L,
				size: 28
			}).render();
			closeIcon.setAttribute('aria-hidden', 'true');
			closeButton.append(closeIcon);
			closeButton.addEventListener('click', () => this.closeFileErrorsPopup());
			content.querySelector('.biconnector-dataset-import-v2-file-errors__header')?.append(closeButton);
			const downloadButtonOptions = {
				useAirDesign: true,
				text: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_DOWNLOAD') ?? '',
				style: ui_buttons.AirButtonStyle.PLAIN,
				size: ui_buttons.ButtonSize.LARGE,
				onclick: () => {
					this.downloadErrorLog(downloadButton);
					return {};
				}
			};
			const downloadButton = new ui_buttons.Button(downloadButtonOptions);
			downloadButton.render().dataset.testid = 'dataset-import-file-errors-download-btn';
			const continueButtonOptions = {
				useAirDesign: true,
				text: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_CONTINUE') ?? '',
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.LARGE,
				onclick: () => {
					this.continueSaveIgnoringErrors();
					return {};
				}
			};
			const continueButton = new ui_buttons.Button(continueButtonOptions);
			continueButton.render().dataset.testid = 'dataset-import-file-errors-continue-btn';
			const stopButtonOptions = {
				useAirDesign: true,
				text: main_core.Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_STOP') ?? '',
				style: ui_buttons.AirButtonStyle.FILLED,
				size: ui_buttons.ButtonSize.LARGE,
				onclick: () => {
					this.closeFileErrorsPopup();
					return {};
				}
			};
			const stopButton = new ui_buttons.Button(stopButtonOptions);
			stopButton.render().dataset.testid = 'dataset-import-file-errors-stop-btn';
			const actions = content.querySelector('.biconnector-dataset-import-v2-file-errors__actions');
			actions?.append(downloadButton.render(), continueButton.render(), stopButton.render());
			const popup = new main_popup.Popup({
				id: 'biconnector-import-v2-file-errors',
				content,
				className: 'biconnector-dataset-import-v2-file-errors-popup',
				width: 1072,
				padding: 0,
				autoHide: false,
				fixed: true,
				overlay: true,
				closeIcon: false,
				closeByEsc: true,
				cacheable: false,
				ariaLabelledBy: 'biconnector-dataset-import-v2-file-errors-title',
				focusTrap: {
					initialFocus: 'first-tabbable'
				},
				events: {
					onPopupClose: () => {
						this.fileErrorsPopup = null;
					}
				}
			});
			this.fileErrorsPopup = popup;
			popup.show();
		}
		showSuccessPopup(datasetId, title, fileName) {
			const header = (main_core.Loc.getMessage('DATASET_IMPORT_V2_SUCCESS_TITLE') ?? '').replace('#NAME#', main_core.Text.encode(title));
			const description = (main_core.Loc.getMessage('DATASET_IMPORT_V2_SUCCESS_DESCRIPTION') ?? '').replace('#FILE_NAME#', main_core.Text.encode(fileName));
			const content = main_core.Tag.render`
			<div class="biconnector-dataset-import-v2-success">
				<div class="biconnector-dataset-import-v2-success__body">
					<div class="biconnector-dataset-import-v2-success__mascot"></div>
					<div class="biconnector-dataset-import-v2-success__text">
						<h3 class="biconnector-dataset-import-v2-success__title">${header}</h3>
						<div class="biconnector-dataset-import-v2-success__description">${description}</div>
					</div>
				</div>
				<div class="biconnector-dataset-import-v2-success__actions"></div>
			</div>
		`;
			const actions = content.querySelector('.biconnector-dataset-import-v2-success__actions');
			const popup = new main_popup.Popup({
				id: 'biconnector-import-v2-success',
				content,
				className: 'biconnector-dataset-import-v2-success-popup',
				width: 400,
				padding: 0,
				autoHide: false,
				fixed: true,
				overlay: true,
				closeIcon: true,
				events: {
					onPopupClose: () => this.closeSlider()
				}
			});
			const createMoreBtn = main_core.Tag.render`
			<button
				type="button"
				class="biconnector-dataset-import-v2-success__btn biconnector-dataset-import-v2-success__btn--secondary"
			>
				${main_core.Loc.getMessage('DATASET_IMPORT_V2_SUCCESS_CREATE_MORE')}
			</button>
		`;
			createMoreBtn.addEventListener('click', () => {
				window.location.reload();
			});
			actions?.append(createMoreBtn);
			if (this.isSupersetReady) {
				const createDatasetBtn = main_core.Tag.render`
				<button
					type="button"
					class="biconnector-dataset-import-v2-success__btn biconnector-dataset-import-v2-success__btn--primary"
				>
					${main_core.Loc.getMessage('DATASET_IMPORT_V2_SUCCESS_CREATE_DATASET')}
				</button>
			`;
				createDatasetBtn.addEventListener('click', () => {
					createDatasetBtn.disabled = true;
					main_core.ajax.runAction('biconnector.externalsource.dataset.getCreateUrl', {
						data: {
							id: datasetId
						}
					}).then(response => {
						const link = response?.data;
						if (link) {
							window.open(link, '_blank')?.focus();
						}
						popup.close();
					}).catch(() => {
						createDatasetBtn.disabled = false;
						popup.close();
					});
				});
				actions?.append(createDatasetBtn);
			}
			popup.show();
		}
		showInfoPopup(title, text) {
			const popup = new main_popup.Popup({
				id: 'biconnector-import-v2-info',
				content: main_core.Tag.render`
				<div class="biconnector-dataset-import-v2-popup">
					<h3 class="biconnector-dataset-import-v2-popup__header">${main_core.Text.encode(title)}</h3>
					<div class="biconnector-dataset-import-v2-popup__content">${main_core.Text.encode(text)}</div>
				</div>
			`,
				width: 440,
				autoHide: true,
				fixed: true,
				overlay: false,
				closeIcon: true
			});
			popup.show();
		}
		showCheckErrorsPopup(errors) {
			const list = errors.map(e => main_core.Tag.render`
			<li class="biconnector-dataset-import-v2-popup__error-item">
				<span class="biconnector-dataset-import-v2-popup__error-line">#${main_core.Text.encode(e.lineNumber)}</span>
				<span class="biconnector-dataset-import-v2-popup__error-col">${main_core.Text.encode(e.columnName)}</span>
				<span class="biconnector-dataset-import-v2-popup__error-msg">${main_core.Text.encode(e.errorMessage)}</span>
			</li>
		`);
			const wrapper = main_core.Tag.render`
			<div class="biconnector-dataset-import-v2-popup">
				<h3 class="biconnector-dataset-import-v2-popup__header">
					${main_core.Loc.getMessage('DATASET_IMPORT_V2_CHECK_ERRORS_TITLE')}
				</h3>
				<ul class="biconnector-dataset-import-v2-popup__error-list"></ul>
			</div>
		`;
			const ulNode = wrapper.querySelector('.biconnector-dataset-import-v2-popup__error-list');
			list.forEach(li => ulNode?.appendChild(li));
			const popup = new main_popup.Popup({
				id: 'biconnector-import-v2-check-errors',
				content: wrapper,
				width: 520,
				autoHide: true,
				fixed: true,
				overlay: false,
				closeIcon: true
			});
			popup.show();
		}
	}

	const DEBOUNCE_MS$1 = 1500;
	const PREVIEW_ROWS_LIMIT = 300;
	const TRIGGER_MUTATIONS = new Set(['setFieldRowSettings', 'setFieldsSettings', 'setDataFormats', 'setFileProperties']);
	class ValidationController {
		store;
		sourceCode;
		unsubscribe = null;
		debounceTimer = null;
		currentRequestId = 0;
		constructor(store, options) {
			this.store = store;
			this.sourceCode = options.sourceCode;
		}
		attach() {
			this.unsubscribe = this.store.subscribe(mutation => {
				if (!TRIGGER_MUTATIONS.has(mutation.type)) {
					return;
				}
				if (mutation.type === 'setFieldRowSettings' && this.isDescriptionOnly(mutation.payload)) {
					return;
				}
				this.scheduleValidate();
			});
			this.scheduleValidate();
		}
		isDescriptionOnly(payload) {
			const settings = payload?.settings;
			if (!settings) {
				return false;
			}
			const keys = Object.keys(settings);
			return keys.length > 0 && keys.every(key => key === 'description');
		}
		detach() {
			if (this.unsubscribe) {
				this.unsubscribe();
				this.unsubscribe = null;
			}
			if (this.debounceTimer !== null) {
				clearTimeout(this.debounceTimer);
				this.debounceTimer = null;
			}
		}
		cancelScheduled() {
			if (this.debounceTimer !== null) {
				clearTimeout(this.debounceTimer);
				this.debounceTimer = null;
			}
		}
		scheduleValidate() {
			this.cancelScheduled();
			this.debounceTimer = setTimeout(() => {
				this.debounceTimer = null;
				this.validate();
			}, DEBOUNCE_MS$1);
		}
		async validate() {
			const state = this.store.state.config;
			const hasFile = Boolean(state.fileProperties.fileToken) || state.datasetProperties.id > 0;
			if (this.sourceCode !== 'csv' || state.fieldsSettings.length === 0 || !hasFile) {
				this.store.commit('setValidationErrors', []);
				this.store.commit('setValidationLoading', false);
				return;
			}
			const requestId = ++this.currentRequestId;
			const requestFileToken = state.fileProperties.fileToken;
			this.store.commit('setValidationLoading', true);
			try {
				const response = await main_core.ajax.runAction('biconnector.externalsource.dataset.checkFile', {
					data: {
						type: this.sourceCode,
						rowsLimit: PREVIEW_ROWS_LIMIT,
						fields: {
							fileProperties: state.fileProperties,
							datasetProperties: state.datasetProperties,
							fieldsSettings: state.fieldsSettings,
							dataFormats: state.dataFormats
						}
					}
				});
				if (requestId !== this.currentRequestId || state.fileProperties.fileToken !== requestFileToken) {
					return;
				}
				const raw = response?.data?.checkFileErrors ?? {};
				const firstLineHeader = Boolean(state.fileProperties.firstLineHeader);
				const offset = firstLineHeader ? 2 : 1;
				const errors = [];
				Object.entries(raw).forEach(([line, errs]) => {
					const rowIndex = Number(line) - offset;
					(errs || []).forEach(e => {
						errors.push({
							rowIndex,
							fieldIndex: e?.customData?.field ?? -1,
							message: e?.message ?? ''
						});
					});
				});
				this.store.commit('setValidationErrors', errors);
			} catch {
				if (requestId === this.currentRequestId && state.fileProperties.fileToken === requestFileToken) {
					this.store.commit('setValidationErrors', []);
				}
			} finally {
				if (requestId === this.currentRequestId) {
					this.store.commit('setValidationLoading', false);
				}
			}
		}
	}

	const DEBOUNCE_MS = 400;
	const COLUMN_TRIGGER_KEYS = ['encoding', 'separator', 'firstLineHeader'];
	class PreviewReloadController {
		store;
		sourceCode;
		onReloadStart;
		onReloadFinish;
		unsubscribe = null;
		debounceTimer = null;
		currentRequestId = 0;
		pendingRebuildColumns = false;
		constructor(store, options) {
			this.store = store;
			this.sourceCode = options.sourceCode;
			this.onReloadStart = options.onReloadStart ?? null;
			this.onReloadFinish = options.onReloadFinish ?? null;
		}
		attach() {
			this.unsubscribe = this.store.subscribe(mutation => {
				const mode = this.resolveReloadMode(mutation);
				if (mode === null) {
					return;
				}
				if (mode === 'columns') {
					this.pendingRebuildColumns = true;
				}
				this.schedule();
			});
		}
		detach() {
			this.currentRequestId++;
			if (this.unsubscribe) {
				this.unsubscribe();
				this.unsubscribe = null;
			}
			if (this.debounceTimer !== null) {
				clearTimeout(this.debounceTimer);
				this.debounceTimer = null;
			}
		}
		resolveReloadMode(mutation) {
			switch (mutation.type) {
				case 'setFileProperties':
					if (!this.hasColumnTriggerKey(mutation.payload)) {
						return null;
					}
					return this.store.getters.isEditMode ? 'preview' : 'columns';
				case 'setDataFormats':
					return 'preview';
				case 'setFieldRowSettings':
					return this.isTypeChange(mutation.payload) ? 'preview' : null;
				default:
					return null;
			}
		}
		hasColumnTriggerKey(payload) {
			const patch = payload;
			if (!patch) {
				return false;
			}
			return COLUMN_TRIGGER_KEYS.some(key => key in patch);
		}
		isTypeChange(payload) {
			const settings = payload?.settings;
			return Boolean(settings) && 'type' in settings;
		}
		schedule() {
			if (this.debounceTimer !== null) {
				clearTimeout(this.debounceTimer);
			}
			this.debounceTimer = setTimeout(() => {
				this.debounceTimer = null;
				this.reload();
			}, DEBOUNCE_MS);
		}
		async reload() {
			const rebuildColumns = this.pendingRebuildColumns;
			this.pendingRebuildColumns = false;
			const state = this.store.state.config;
			if (this.sourceCode !== 'csv' || !state.fileProperties.fileToken) {
				return;
			}
			const requestId = ++this.currentRequestId;
			const requestFileToken = state.fileProperties.fileToken;
			this.store.commit('setPreviewReloading', true);
			this.onReloadStart?.();
			try {
				const response = await requestDatasetView(this.store, this.sourceCode, {
					skipExistingSchemaCheck: true
				});
				if (requestId !== this.currentRequestId || !this.isCurrentFile(requestFileToken)) {
					return;
				}
				if (rebuildColumns) {
					this.store.commit('setFieldsSettings', mapHeadersToFieldsSettings(response?.data?.headers ?? []));
				}
				const hasMismatch = hasPreviewSchemaMismatch(this.store, response);
				this.store.commit('setPreviewSchemaMismatch', hasMismatch);
				this.store.commit('setPreviewData', hasMismatch ? [] : extractPreviewRows(response));
				if (hasMismatch) {
					await this.showSchemaMismatchError(requestId, requestFileToken);
				}
			} catch (error) {
				if (requestId === this.currentRequestId && this.isCurrentFile(requestFileToken)) {
					this.store.commit('setPreviewData', []);
					if (!isParsingSettingsError(error)) {
						showErrorPopup(error, main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_LOAD'));
					}
				}
			} finally {
				if (requestId === this.currentRequestId) {
					this.onReloadFinish?.();
					this.store.commit('setPreviewReloading', false);
				}
			}
		}
		isCurrentFile(fileToken) {
			return this.store.state.config.fileProperties.fileToken === fileToken;
		}
		async showSchemaMismatchError(requestId, fileToken) {
			try {
				await requestDatasetView(this.store, this.sourceCode);
			} catch (error) {
				if (requestId === this.currentRequestId && this.isCurrentFile(fileToken)) {
					showErrorPopup(error, main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_LOAD'));
				}
			}
		}
	}

	const LOAD_EVENT = 'biconnector:dataset-import-v2:connection-load';
	const SYNC_EVENT = 'biconnector:dataset-import-v2:connection-sync';
	class ConnectionController {
		store;
		sourceCode;
		isLoading = false;
		loadHandler = null;
		syncHandler = null;
		constructor(store, options) {
			this.store = store;
			this.sourceCode = options.sourceCode;
		}
		attach() {
			this.loadHandler = () => {
				void this.load();
			};
			main_core_events.EventEmitter.subscribe(LOAD_EVENT, this.loadHandler);
			this.syncHandler = () => {
				void this.sync();
			};
			main_core_events.EventEmitter.subscribe(SYNC_EVENT, this.syncHandler);
			const connection = this.store.state.config.connectionProperties;
			if (connection?.connectionId && connection?.tableName && !this.store.getters.hasData) {
				void this.load();
			}
		}
		detach() {
			if (this.loadHandler) {
				main_core_events.EventEmitter.unsubscribe(LOAD_EVENT, this.loadHandler);
				this.loadHandler = null;
			}
			if (this.syncHandler) {
				main_core_events.EventEmitter.unsubscribe(SYNC_EVENT, this.syncHandler);
				this.syncHandler = null;
			}
		}
		async sync() {
			const datasetId = this.store.state.config.datasetProperties.id;
			if (!datasetId || this.isLoading) {
				return;
			}
			this.isLoading = true;
			this.store.commit('setValidationLoading', true);
			try {
				const response = await main_core.ajax.runAction('biconnector.externalsource.dataset.syncField', {
					data: {
						id: datasetId
					}
				});
				const responseData = response.data;
				if (!responseData) {
					return;
				}
				const headers = (responseData.headers ?? []).map((header, index) => this.prepareHeader(header, index));
				this.store.commit('setFieldsSettings', headers);
				this.store.commit('setPreviewData', responseData.data ?? []);
			} catch {
			} finally {
				this.isLoading = false;
				this.store.commit('setValidationLoading', false);
			}
		}
		async load() {
			const config = this.store.state.config;
			const connection = config.connectionProperties;
			if (!connection?.connectionId || !connection?.tableName || this.isLoading) {
				return;
			}
			this.isLoading = true;
			this.store.commit('setValidationLoading', true);
			try {
				const response = await main_core.ajax.runAction('biconnector.externalsource.dataset.view', {
					data: {
						type: connection.connectionType || this.sourceCode,
						fields: {
							datasetProperties: config.datasetProperties,
							fieldsSettings: config.fieldsSettings,
							dataFormats: config.dataFormats,
							tableName: connection.tableName,
							connectionType: connection.connectionType
						},
						sourceId: connection.connectionId
					}
				});
				const responseData = response.data;
				if (!responseData) {
					return;
				}
				const headers = (responseData.headers ?? []).map((header, index) => this.prepareHeader(header, index));
				this.store.commit('setFieldsSettings', headers);
				this.store.commit('setPreviewData', responseData.data ?? []);
			} catch (error) {
				this.store.commit('setFieldsSettings', []);
				this.store.commit('setPreviewData', []);
				showErrorPopup(error, main_core.Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_LOAD'));
			} finally {
				this.isLoading = false;
				this.store.commit('setValidationLoading', false);
			}
		}
		prepareHeader(header, index) {
			return {
				id: header.id ?? 0,
				visible: header.visible ?? true,
				type: header.type ?? 'string',
				name: header.name && header.name.length > 0 ? header.name : `FIELD_${index}`,
				originalName: header.externalCode ?? '',
				externalCode: header.externalCode ?? '',
				description: header.description ?? ''
			};
		}
	}

	const SAVE_EVENT = 'biconnector:dataset-import-v2:save';
	const CHECK_FILE_EVENT = 'biconnector:dataset-import-v2:check-file';
	const EXPORT_FILE_EVENT = 'biconnector:dataset-import-v2:export-file';
	const DATA_FORMATS_SAVE_EVENT = 'BIConnector.DatasetImportV2.DataFormats:onSave';
	const SLIDER_MESSAGE_EVENT = 'SidePanel.Slider:onMessage';
	const SAVE_BUTTON_SELECTOR = '.biconnector-dataset-import-v2-save-btn';
	const RootLayout = {
		components: {
			CardsColumn,
			DataPanel
		},
		inject: ['appParams'],
		props: {
			sourceId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isSaving: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['hasFile', 'areNoRowsVisible', 'hasFieldNameErrors', 'isSystem', 'isEditMode', 'datasetProperties', 'connectionProperties', 'connectionEditing', 'hasPreviewSchemaMismatch']),
			isExternalConnection() {
				return this.sourceId !== 'csv' && this.sourceId !== 'system';
			},
			hasSource() {
				return this.hasFile || Boolean(this.connectionProperties?.connectionId && this.connectionProperties?.tableName);
			},
			reservedNames() {
				return this.appParams?.reservedNames ?? [];
			},
			hasDatasetNameErrors() {
				if (this.isEditMode || this.isSystem) {
					return false;
				}
				return hasDatasetNameError(this.datasetProperties?.name, this.reservedNames);
			},
			isSaveEnabled() {
				return this.hasSource && (!this.isExternalConnection || !this.connectionEditing) && !this.areNoRowsVisible && !this.hasDatasetNameErrors && !this.hasFieldNameErrors && !this.hasPreviewSchemaMismatch && !this.isSystem;
			}
		},
		watch: {
			isSaveEnabled: {
				immediate: true,
				handler(value) {
					this.$nextTick(() => this.syncSaveButton(Boolean(value)));
				}
			}
		},
		created() {
			this.onSaveClick = () => this.handleSave();
			this.onCheckFileClick = () => this.saveController?.checkFile();
			this.onExportFileClick = () => this.saveController?.exportFile();
			this.onDataFormatsSaved = event => {
				const [messageEvent] = event?.getData?.() ?? [];
				if (messageEvent?.getEventId?.() !== DATA_FORMATS_SAVE_EVENT) {
					return;
				}
				const data = messageEvent.data;
				if (data && typeof data === 'object') {
					this.$store.commit('setDataFormats', data);
				}
			};
			main_core_events.EventEmitter.subscribe(SAVE_EVENT, this.onSaveClick);
			main_core_events.EventEmitter.subscribe(CHECK_FILE_EVENT, this.onCheckFileClick);
			main_core_events.EventEmitter.subscribe(EXPORT_FILE_EVENT, this.onExportFileClick);
			main_core_events.EventEmitter.subscribe(SLIDER_MESSAGE_EVENT, this.onDataFormatsSaved);
		},
		mounted() {
			this.saveController = new SaveController(this.$store, {
				sourceCode: this.sourceId,
				isSupersetReady: Boolean(this.appParams?.isSupersetReady)
			});
			this.saveController.attach();
			this.validationController = new ValidationController(this.$store, {
				sourceCode: this.sourceId
			});
			this.validationController.attach();
			this.previewReloadController = new PreviewReloadController(this.$store, {
				sourceCode: this.sourceId,
				onReloadStart: () => this.validationController.cancelScheduled(),
				onReloadFinish: () => {
					void this.validationController.validate();
				}
			});
			this.previewReloadController.attach();
			this.connectionController = new ConnectionController(this.$store, {
				sourceCode: this.sourceId
			});
			this.connectionController.attach();
			this.syncSaveButton(this.isSaveEnabled);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(SAVE_EVENT, this.onSaveClick);
			main_core_events.EventEmitter.unsubscribe(CHECK_FILE_EVENT, this.onCheckFileClick);
			main_core_events.EventEmitter.unsubscribe(EXPORT_FILE_EVENT, this.onExportFileClick);
			main_core_events.EventEmitter.unsubscribe(SLIDER_MESSAGE_EVENT, this.onDataFormatsSaved);
			this.saveController?.detach();
			this.validationController?.detach();
			this.previewReloadController?.detach();
			this.connectionController?.detach();
		},
		methods: {
			async handleSave() {
				if (!this.saveController || this.isSaving || !this.isSaveEnabled) {
					return;
				}
				this.isSaving = true;
				this.setSaveButtonWaiting(true);
				try {
					await this.saveController.save();
				} finally {
					this.isSaving = false;
					this.setSaveButtonWaiting(false);
				}
			},
			syncSaveButton(enabled) {
				const btn = document.querySelector(SAVE_BUTTON_SELECTOR);
				if (!btn) {
					return;
				}
				btn.disabled = !enabled;
				btn.classList.toggle('ui-btn-disabled', !enabled);
			},
			setSaveButtonWaiting(isWaiting) {
				const btn = document.querySelector(SAVE_BUTTON_SELECTOR);
				if (!btn) {
					return;
				}
				btn.classList.toggle('ui-btn-wait', isWaiting);
				if (isWaiting) {
					btn.setAttribute('disabled', 'disabled');
				} else {
					btn.disabled = !this.isSaveEnabled;
					btn.classList.toggle('ui-btn-disabled', !this.isSaveEnabled);
				}
			}
		},
		template: `
		<div class="biconnector-dataset-import-v2">
			<div class="biconnector-dataset-import-v2__body">
				<CardsColumn />
				<DataPanel />
			</div>
		</div>
	`
	};

	const defaultConfig = () => ({
		fileProperties: {
			encoding: 'utf-8',
			separator: ',',
			firstLineHeader: true,
			fileToken: '',
			fileName: ''
		},
		dataFormats: {
			money: '',
			date: '',
			datetime: '',
			double: '',
			timezone: ''
		},
		datasetProperties: {
			id: 0,
			name: '',
			description: '',
			externalCode: '',
			externalName: '',
			externalDatasets: []
		},
		fieldsSettings: [],
		sectionsConfig: {}
	});
	const defaultPreview = () => ({
		rows: []
	});
	function mergeInitialState(initial) {
		const config = defaultConfig();
		const initialConfig = initial?.config ?? {};
		if (initialConfig.fileProperties) {
			config.fileProperties = {
				...config.fileProperties,
				...initialConfig.fileProperties
			};
		}
		if (initialConfig.dataFormats) {
			config.dataFormats = {
				...config.dataFormats,
				...initialConfig.dataFormats
			};
		}
		if (initialConfig.datasetProperties) {
			config.datasetProperties = {
				...config.datasetProperties,
				...initialConfig.datasetProperties
			};
		}
		if (initialConfig.connectionProperties) {
			config.connectionProperties = {
				...initialConfig.connectionProperties
			};
		}
		if (Array.isArray(initialConfig.fieldsSettings)) {
			config.fieldsSettings = initialConfig.fieldsSettings.map(f => ({
				...f
			}));
		}
		if (initialConfig.sectionsConfig) {
			config.sectionsConfig = {
				...initialConfig.sectionsConfig
			};
		}
		const preview = defaultPreview();
		const initialRows = initial?.previewData?.rows;
		if (Array.isArray(initialRows)) {
			preview.rows = initialRows;
		}
		const hasConnectionTable = Boolean(config.connectionProperties?.connectionId && config.connectionProperties?.tableName);
		return {
			config,
			previewData: preview,
			upload: {
				isUploading: false,
				step: 0
			},
			ui: {
				activeFieldIndex: -1,
				validation: {
					isValidating: false,
					errors: []
				},
				isReloadingPreview: false,
				hasPreviewSchemaMismatch: false,
				connectionEditing: !(config.datasetProperties.id > 0) && !hasConnectionTable
			}
		};
	}
	function buildStore(initialData) {
		const initial = mergeInitialState(initialData);
		return ui_vue3_vuex.createStore({
			state() {
				return initial;
			},
			mutations: {
				setFileProperties(state, payload) {
					state.config.fileProperties = {
						...state.config.fileProperties,
						...payload
					};
				},
				setConnectionProperties(state, payload) {
					state.config.connectionProperties = {
						...payload
					};
				},
				setDatasetProperties(state, payload) {
					state.config.datasetProperties = {
						...state.config.datasetProperties,
						...payload
					};
				},
				toggleRowVisibility(state, rowIndex) {
					const row = state.config.fieldsSettings[rowIndex];
					if (row) {
						row.visible = !row.visible;
						if (!row.visible && state.ui.activeFieldIndex === rowIndex) {
							state.ui.activeFieldIndex = -1;
						}
					}
				},
				setAllRowsVisible(state) {
					state.config.fieldsSettings.forEach(row => {
						row.visible = true;
					});
				},
				setAllRowsInvisible(state) {
					state.config.fieldsSettings.forEach(row => {
						row.visible = false;
					});
					state.ui.activeFieldIndex = -1;
				},
				setFieldRowSettings(state, payload) {
					const current = state.config.fieldsSettings[payload.index];
					if (current) {
						state.config.fieldsSettings[payload.index] = {
							...current,
							...payload.settings
						};
					}
				},
				setDataFormats(state, payload) {
					state.config.dataFormats = {
						...state.config.dataFormats,
						...payload
					};
				},
				setPreviewData(state, rows) {
					state.previewData.rows = rows;
				},
				setFieldsSettings(state, fields) {
					state.config.fieldsSettings = fields.map(f => ({
						...f
					}));
				},
				setSectionsConfig(state, payload) {
					state.config.sectionsConfig = {
						...payload
					};
				},
				resetSectionsConfig(state) {
					state.config.sectionsConfig = {};
				},
				setUploadStatus(state, payload) {
					state.upload = {
						...state.upload,
						...payload
					};
				},
				setActiveFieldIndex(state, index) {
					state.ui.activeFieldIndex = index;
				},
				setValidationLoading(state, isValidating) {
					state.ui.validation = {
						...state.ui.validation,
						isValidating
					};
				},
				setValidationErrors(state, errors) {
					state.ui.validation = {
						...state.ui.validation,
						errors
					};
				},
				setPreviewReloading(state, isReloading) {
					state.ui.isReloadingPreview = isReloading;
				},
				setPreviewSchemaMismatch(state, hasMismatch) {
					state.ui.hasPreviewSchemaMismatch = hasMismatch;
				},
				setConnectionEditing(state, isEditing) {
					state.ui.connectionEditing = isEditing;
				}
			},
			getters: {
				isEditMode: state => state.config.datasetProperties.id > 0,
				isSystem: state => Boolean(state.config.datasetProperties.isSystem),
				isReadOnly: state => state.config.datasetProperties.id > 0 || Boolean(state.config.datasetProperties.isSystem),
				hasFile: state => Boolean(state.config.fileProperties.fileToken) || Boolean(state.config.fileProperties.fileName) || state.config.datasetProperties.id > 0,
				hasPreview: state => state.config.fieldsSettings.length > 0,
				activeFieldIndex: state => state.ui.activeFieldIndex,
				isValidating: state => state.ui.validation.isValidating,
				isReloadingPreview: state => state.ui.isReloadingPreview,
				hasPreviewSchemaMismatch: state => state.ui.hasPreviewSchemaMismatch,
				validationErrors: state => state.ui.validation.errors,
				fieldNameCounts: state => {
					const counters = new Map();
					state.config.fieldsSettings.forEach(field => {
						const name = field.name ?? '';
						counters.set(name, (counters.get(name) ?? 0) + 1);
					});
					return counters;
				},
				hasFieldNameErrors: (state, getters) => {
					const nameFormat = /^[A-Z][A-Z0-9_]*$/;
					return state.config.fieldsSettings.some(field => {
						if (field.visible === false) {
							return false;
						}
						const name = field.name ?? '';
						if (name.length === 0 || name.length > 32) {
							return true;
						}
						if (!nameFormat.test(name)) {
							return true;
						}
						return (getters.fieldNameCounts.get(name) ?? 0) > 1;
					});
				},
				validationErrorsByField: state => {
					const map = {};
					state.ui.validation.errors.forEach(e => {
						map[e.fieldIndex] = (map[e.fieldIndex] ?? 0) + 1;
					});
					return map;
				},
				validationErrorCellSet: state => {
					const set = new Set();
					state.ui.validation.errors.forEach(e => set.add(`${e.rowIndex}_${e.fieldIndex}`));
					return set;
				},
				isUploading: state => state.upload.isUploading,
				uploadStep: state => state.upload.step,
				areAllRowsVisible: state => state.config.fieldsSettings.length > 0 && state.config.fieldsSettings.every(row => row.visible),
				areNoRowsVisible: state => state.config.fieldsSettings.length > 0 && state.config.fieldsSettings.every(row => !row.visible),
				areSomeRowsVisible: (state, getters) => !getters.areAllRowsVisible && !getters.areNoRowsVisible,
				columnVisibilityMap: state => state.config.fieldsSettings.map(row => row.visible),
				hasData: state => state.previewData.rows.length > 0,
				datasetProperties: state => state.config.datasetProperties,
				connectionProperties: state => state.config.connectionProperties,
				connectionEditing: state => state.ui.connectionEditing,
				getSectionConfig: state => (sectionName, property) => {
					const section = state.config.sectionsConfig[sectionName];
					if (section && property in section) {
						return Boolean(section[property]);
					}
					return true;
				}
			}
		});
	}

	class AppFactory {
		static getApp(sourceId, initialData = {}, appParams = {}, extra = {}) {
			const store = buildStore(initialData);
			const app = ui_vue3.BitrixVue.createApp({
				name: 'DatasetImportV2',
				components: {
					RootLayout
				},
				data() {
					return {
						sourceId,
						appParams,
						extra
					};
				},
				template: `
				<RootLayout :source-id="sourceId" />
			`
			});
			app.use(store);
			app.provide('appParams', appParams);
			app.provide('extra', extra);
			app.provide('sourceId', sourceId);
			return app;
		}
	}

	const COMPONENT_LINK = '/bitrix/components/bitrix/biconnector.dataset.import.v2/slider.php';
	class Slider {
		static open(sourceId, datasetId = 0, connection = {}, sectionsConfig = {}) {
			const params = {
				sourceId
			};
			if (datasetId) {
				params.datasetId = String(datasetId);
			}
			const query = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
			if (connection && typeof connection === 'object' && Object.keys(connection).length > 0) {
				Object.entries(connection).forEach(([key, value]) => {
					query.push(`${encodeURIComponent(`connection[${key}]`)}=${encodeURIComponent(String(value))}`);
				});
			}
			if (sectionsConfig && typeof sectionsConfig === 'object' && Object.keys(sectionsConfig).length > 0) {
				Object.entries(sectionsConfig).forEach(([section, config]) => {
					Object.entries(config).forEach(([property, value]) => {
						const key = `sectionsConfig[${section}][${property}]`;
						query.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
					});
				});
			}
			const url = query.length > 0 ? `${COMPONENT_LINK}?${query.join('&')}` : COMPONENT_LINK;
			main_sidepanel.SidePanel.Instance.open(url, {
				allowChangeHistory: false,
				cacheable: false,
				customLeftBoundary: 0
			});
		}
	}

	exports.AppFactory = AppFactory;
	exports.Slider = Slider;

})(this.BX.BIConnector.DatasetImportV2 = this.BX.BIConnector.DatasetImportV2 || {}, BX.Vue3, BX.Event, BX.Vue3.Vuex, BX, BX, BX.UI, BX.Main, BX.UI.System, BX.UI, BX.UI.IconSet, BX.SidePanel, BX.BIConnector.FileExport, BX.UI.Analytics);
//# sourceMappingURL=dataset-import-v2.bundle.js.map
