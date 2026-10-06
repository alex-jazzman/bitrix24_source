import { Type } from 'main.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { Outline, Main } from 'ui.icon-set.api.core';
import { parseValue } from 'bizproc.setup-template';
import './constant-field.css';
import { CONSTANT_TYPES } from '../../constants';
import { buildUserPreselectedItems } from '../../lib/user-value';
import { resolveUserNames } from '../../lib/user-name-resolver';
import { getBoolValueLabel } from '../constant-value/bool';
import type { ConstantConfiguration } from '../../types';

// @vue/component
export const ConstantField = {
	name: 'ConstantField',
	components: {
		BIcon,
	},
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		/** @type ConstantConfiguration[] */
		constantConfigurationList: {
			type: Array,
			required: true,
		},
	},
	emits: ['delete', 'updateItemProperty', 'edit', 'itemDragStart'],
	setup(): { [string]: string }
	{
		return {
			Outline,
			Main,
		};
	},
	data(): Object
	{
		return {
			// Human-readable names resolved from the user-constant default tokens (`user_5`, `group_hr3`).
			resolvedUserNames: [],
		};
	},
	computed: {
		typeLabel(): string
		{
			return this.constantConfigurationList
				.find((constantConfiguration: ConstantConfiguration) => constantConfiguration.type === this.item.constantType)
				?.title
			?? this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TYPE_UNSUPPORTED');
		},
		titleWithType(): string
		{
			return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TITLE', {
				'#NAME#': this.item.name,
				'#TYPE#': this.typeLabel,
			});
		},
		isUserConstant(): boolean
		{
			return this.item.constantType === CONSTANT_TYPES.USER;
		},
		isBoolConstant(): boolean
		{
			return this.item.constantType === CONSTANT_TYPES.BOOL;
		},
		isDateConstant(): boolean
		{
			return [CONSTANT_TYPES.DATE, CONSTANT_TYPES.DATETIME].includes(this.item.constantType);
		},
		/**
		 * User, date and bool values are not plain text: they carry preselected items, a timezone suffix
		 * or the stored Y/N, so the card only shows them and the constant form owns editing. The input is
		 * readonly rather than disabled: the value stays in the Tab order, is read out by a screen reader
		 * and can be selected.
		 */
		isValueReadonly(): boolean
		{
			return this.isUserConstant || this.isDateConstant || this.isBoolConstant;
		},
		displayValue(): string
		{
			if (this.isUserConstant)
			{
				return this.resolvedUserNames.join(', ');
			}

			const value = this.item.default;
			if (this.isBoolConstant)
			{
				// The stored value stays Y/N, the card shows the human-readable option.
				return Type.isArray(value)
					? value.map((item: string) => getBoolValueLabel(item)).join(', ')
					: getBoolValueLabel(value);
			}

			// The timezone suffix stays in the stored value, the card shows the date only.
			if (this.isDateConstant)
			{
				return Type.isArray(value)
					? value.map((item: string) => parseValue(item).text).join(', ')
					: parseValue(value).text;
			}

			if (Type.isArray(value))
			{
				return value.join(', ');
			}

			return value ?? '';
		},
	},
	watch: {
		'item.default': {
			immediate: true,
			deep: true,
			handler(): void
			{
				this.resolveUserNames();
			},
		},
	},
	beforeUnmount(): void
	{
		// Invalidate in-flight resolves so a late batch response cannot touch a destroyed component.
		this.resolveGeneration = (this.resolveGeneration ?? 0) + 1;
	},
	methods: {
		async resolveUserNames(): Promise<void>
		{
			// Invalidate any in-flight resolve so a late response cannot overwrite fresh names.
			// The counter is created lazily: the immediate watcher runs before created().
			this.resolveGeneration = (this.resolveGeneration ?? 0) + 1;
			const generation = this.resolveGeneration;

			if (!this.isUserConstant)
			{
				this.resolvedUserNames = [];

				return;
			}

			const preselectedItems = buildUserPreselectedItems(this.item.default, this.item.multiple);
			if (preselectedItems.length === 0)
			{
				this.resolvedUserNames = [];

				return;
			}

			// Shared resolver: all cards rendered in the same tick are served by a single dialog load.
			const names = await resolveUserNames(preselectedItems);
			if (generation !== this.resolveGeneration)
			{
				return;
			}

			this.resolvedUserNames = names;
		},
		onInput(event: Event): void
		{
			const payload: UpdateItemPropertyEventPayload = {
				propertyValues: {
					default: event.target.value,
				},
			};
			this.$emit('updateItemProperty', payload);
		},
		onEdit(): void
		{
			this.$emit('edit');
		},
		handleDragStart(event: Event): void
		{
			this.$emit('itemDragStart', {
				event,
				element: this.$el,
			});
		},
	},
	template: `
		<div
			class="bizproc-setuptemplateactivity-field-wrapper"
			:data-testid="'bizproc-setup-template-constant-field-' + item.id"
		>
			<div
				class="bizproc-setuptemplateactivity-field-drag-icon"
				@mousedown.prevent="handleDragStart"
			>
				<BIcon :name="Main.MORE_POINTS" :size="18"/>
			</div>
			<div class="bizproc-setuptemplateactivity-constant-edit">
				<div class="bizproc-setuptemplateactivity-constant-edit__wrap">
					<div class="bizproc-setuptemplateactivity-constant-edit__input-control ui-ctl-container">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">
								{{ titleWithType }}
							</div>
						</div>
						<div class="ui-ctl ui-ctl-w100">
							<input
								:value="displayValue"
								class="ui-ctl-element"
								type="text"
								:readonly="isValueReadonly"
								data-testid="bizproc-setup-template-constant-field-value"
								@input="onInput"
							/>
						</div>
					</div>
					<div class="bizproc-setuptemplateactivity-constant-edit__btn-control">
						<BIcon
							:name="Outline.EDIT_L"
							:size="18"
							class="bizproc-setuptemplateactivity-constant-edit__control-icon"
							data-testid="bizproc-setup-template-constant-field-edit-btn"
							@click="onEdit"
						/>
						<BIcon
							:name="Outline.CROSS_L"
							:size="18"
							class="bizproc-setuptemplateactivity-constant-edit__control-icon"
							data-testid="bizproc-setup-template-constant-field-delete-btn"
							@click="$emit('delete')"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};
