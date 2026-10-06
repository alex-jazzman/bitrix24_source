import { Loc, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Hint } from 'ui.hint';
import { mapGetters } from 'ui.vue3.vuex';
import { getDataTypeDescriptions } from '../types/data-types';

const MAPPING_HELP_ARTICLE = '24486426';

const NAME_MAX_LENGTH = 32;
const NAME_FORMAT_REGEXP = /^[A-Z][A-Z0-9_]*$/;
const FOCUS_COLUMN_EVENT = 'biconnector:dataset-import-v2:focus-column';
const FOCUS_FIELD_EVENT = 'biconnector:dataset-import-v2:focus-field';

export const FieldRowCard = {
	props: {
		index: {
			type: Number,
			required: true,
		},
	},
	data()
	{
		return {
			typeLabel: Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_LABEL'),
			nameLabel: Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_LABEL'),
			descriptionLabel: Loc.getMessage('DATASET_IMPORT_V2_FIELD_DESCRIPTION_LABEL'),
			showHint: Loc.getMessage('DATASET_IMPORT_V2_FIELD_INCLUDE_SHOW'),
			hideHint: Loc.getMessage('DATASET_IMPORT_V2_FIELD_INCLUDE_HIDE'),
			isFocused: false,
		};
	},
	computed:
	{
		...mapGetters(['isEditMode', 'isReadOnly', 'isSystem', 'fieldNameCounts', 'activeFieldIndex', 'connectionProperties']),
		isActive()
		{
			return this.index === this.activeFieldIndex;
		},
		isMetaLocked()
		{
			return Boolean(this.connectionProperties) && this.connectionProperties.connectionIsSupportMapping === false;
		},
		isMetaDisabled()
		{
			return !this.canEditMeta || this.isMetaLocked;
		},
		showLockHint()
		{
			return this.isMetaLocked && this.isVisible;
		},
		lockedShortHint()
		{
			return Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_LOCKED_SHORT');
		},
		lockedHintHtml()
		{
			const hintText = Text.encode(this.lockedShortHint);
			const linkLabel = Text.encode(Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_LOCKED_MORE'));
			const onClick = `top.BX.Helper.show('redirect=detail&code=${MAPPING_HELP_ARTICLE}')`;

			return `${hintText} <a href="javascript:void(0)" onclick="${onClick}">${linkLabel}</a>`;
		},
		field()
		{
			return this.$store.state.config.fieldsSettings[this.index];
		},
		typeOptions()
		{
			const map = getDataTypeDescriptions();

			return Object.entries(map).map(([value, descr]) => ({
				value,
				title: descr.title,
				icon: descr.icon,
			}));
		},
		selectedTypeIcon()
		{
			const map = getDataTypeDescriptions();

			return map[this.field?.type]?.icon ?? '--formatting';
		},
		nameValue: {
			get() { return this.field?.name ?? ''; },
			set(value) { this.commitField({ name: value }); },
		},
		typeValue: {
			get() { return this.field?.type ?? 'string'; },
			set(value) { this.commitField({ type: value }); },
		},
		descriptionValue: {
			get() { return this.field?.description ?? ''; },
			set(value) { this.commitField({ description: value }); },
		},
		nameError()
		{
			return this.validateName(this.nameValue);
		},
		canEditMeta()
		{
			return !this.isReadOnly && this.isVisible;
		},
		canEditDescription()
		{
			return !this.isSystem && this.isVisible;
		},
		canToggleVisibility()
		{
			return !this.isSystem;
		},
		isVisible: {
			get()
			{
				return this.field?.visible !== false;
			},
			set(value)
			{
				if (this.field?.visible === value)
				{
					return;
				}
				this.$store.commit('toggleRowVisibility', this.index);
			},
		},
	},
	mounted()
	{
		this.onFocusFieldEvent = (event) => {
			const data = event?.data ?? event;
			const fieldIndex = Array.isArray(data) ? data[0]?.index : data?.index;
			if (fieldIndex !== this.index)
			{
				return;
			}
			this.$el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
		};
		EventEmitter.subscribe(FOCUS_FIELD_EVENT, this.onFocusFieldEvent);
		this.$nextTick(() => this.initHint());
	},
	updated()
	{
		this.$nextTick(() => this.initHint());
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(FOCUS_FIELD_EVENT, this.onFocusFieldEvent);
	},
	methods:
	{
		commitField(patch)
		{
			this.$store.commit('setFieldRowSettings', {
				index: this.index,
				settings: patch,
			});
		},
		initHint()
		{
			if (this.showLockHint && this.$el)
			{
				Hint.init(this.$el);
			}
		},
		validateName(name)
		{
			if (!name || name.length === 0)
			{
				return Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_REQUIRED');
			}

			if (name.length > NAME_MAX_LENGTH)
			{
				return Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_TOO_LONG').replace('#MAX#', String(NAME_MAX_LENGTH));
			}

			if (!NAME_FORMAT_REGEXP.test(name))
			{
				return Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_BAD_FORMAT');
			}

			if ((this.fieldNameCounts.get(name) ?? 0) > 1)
			{
				return Loc.getMessage('DATASET_IMPORT_V2_FIELD_NAME_DUPLICATE');
			}

			return '';
		},
		onFocusIn()
		{
			if (!this.isVisible)
			{
				return;
			}
			this.$store.commit('setActiveFieldIndex', this.index);
			EventEmitter.emit(FOCUS_COLUMN_EVENT, { index: this.index });
		},
		onFocusOut(event)
		{
			if (event.relatedTarget && this.$el.contains(event.relatedTarget))
			{
				return;
			}
			this.$store.commit('setActiveFieldIndex', -1);
		},
		onCardMouseDown()
		{
			if (!this.isVisible)
			{
				return;
			}
			this.$store.commit('setActiveFieldIndex', this.index);
			EventEmitter.emit(FOCUS_COLUMN_EVENT, { index: this.index });
		},
		onToggleVisibility()
		{
			if (!this.canToggleVisibility)
			{
				return;
			}
			this.$store.commit('toggleRowVisibility', this.index);
		},
	},
	// language=Vue
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
	`,
};
