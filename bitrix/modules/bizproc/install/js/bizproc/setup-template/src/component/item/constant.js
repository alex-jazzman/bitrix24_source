import { Type } from 'main.core';
import { ConstantTextual } from './constant-field/textual';
import { ConstantSelect } from './constant-field/select';
import { ConstantUser } from './constant-field/user';
import { ConstantTextarea } from './constant-field/textarea';
import { ConstantKnowledge } from './constant-field/knowledge';
import { ConstantProject } from './constant-field/project';
import { ConstantFile } from './constant-field/file';
import { ConstantEntitySelector } from './constant-field/entity-selector';
import { ConstantTime } from './constant-field/time';
import { ConstantDate } from './constant-field/date-field';
import { ConstantDatetime } from './constant-field/datetime-field';
import { ConstantBool } from './constant-field/bool-field';
import { ConstantBIDashboard } from './constant-field/bi-dashboard';
import { CONSTANT_TYPES } from '../../constants';

const ConstantFieldMap = {
	[CONSTANT_TYPES.TEXT]: 'ConstantTextarea',
	[CONSTANT_TYPES.STRING]: 'ConstantTextual',
	[CONSTANT_TYPES.INT]: 'ConstantTextual',
	[CONSTANT_TYPES.SELECT]: 'ConstantSelect',
	[CONSTANT_TYPES.USER]: 'ConstantUser',
	[CONSTANT_TYPES.KNOWLEDGE]: 'ConstantKnowledge',
	[CONSTANT_TYPES.PROJECT]: 'ConstantProject',
	[CONSTANT_TYPES.FILE]: 'ConstantFile',
	[CONSTANT_TYPES.ENTITY_SELECTOR]: 'ConstantEntitySelector',
	[CONSTANT_TYPES.TIME]: 'ConstantTime',
	[CONSTANT_TYPES.DATE]: 'ConstantDate',
	[CONSTANT_TYPES.DATETIME]: 'ConstantDatetime',
	[CONSTANT_TYPES.BOOL]: 'ConstantBool',
	[CONSTANT_TYPES.BI_DASHBOARD]: 'ConstantBIDashboard',
};

// @vue/component
export const ConstantComponent = {
	name: 'ConstantComponent',
	components: {
		ConstantTextual,
		ConstantSelect,
		ConstantUser,
		ConstantTextarea,
		ConstantKnowledge,
		ConstantProject,
		ConstantFile,
		ConstantEntitySelector,
		ConstantTime,
		ConstantDate,
		ConstantDatetime,
		ConstantBool,
		ConstantBIDashboard,
	},
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		formData: {
			type: Object,
			required: true,
		},
		error: {
			type: String,
			default: '',
		},
	},
	emits: ['constantUpdate', 'constantDateMissing'],
	computed:
	{
		constantValue:
		{
			get(): string | Array<string>
			{
				return this.getCurrentConstantValue();
			},
			set(newValue): void
			{
				this.$emit('constantUpdate', this.item.id, newValue);
			},
		},
		fieldComponent(): ?string
		{
			return ConstantFieldMap[this.item.constantType] || null;
		},
		isRequired(): boolean
		{
			return this.item.required;
		},
		isKnowledgeField(): boolean
		{
			return this.item.constantType === CONSTANT_TYPES.KNOWLEDGE;
		},
		labelId(): string
		{
			return `bizproc-setup-template-label-${this.item.id}`;
		},
		errorId(): string
		{
			return `bizproc-setup-template-error-${this.item.id}`;
		},
		hasNativeControl(): boolean
		{
			return [
				CONSTANT_TYPES.STRING,
				CONSTANT_TYPES.INT,
				CONSTANT_TYPES.TEXT,
				CONSTANT_TYPES.TIME,
				CONSTANT_TYPES.DATE,
				CONSTANT_TYPES.DATETIME,
			].includes(this.item.constantType);
		},
		hasGroupControl(): boolean
		{
			return this.item.constantType === CONSTANT_TYPES.SELECT;
		},
		// The bool field carries the name of the constant next to its switcher, and a multiple one
		// next to every switcher of the list, so the row has no label above the control.
		hasSwitchControl(): boolean
		{
			return this.item.constantType === CONSTANT_TYPES.BOOL;
		},
		/**
		 * Only a date and time field reports a time picked with no date, and a listener a field does
		 * not declare would fall through to its markup, so it is bound to that type alone.
		 */
		fieldListeners(): Object
		{
			if (this.item.constantType !== CONSTANT_TYPES.DATETIME)
			{
				return {};
			}

			return {
				dateMissingChange: (isDateMissing: boolean) => {
					this.$emit('constantDateMissing', this.item.id, isDateMissing);
				},
			};
		},
		// Associate the visible label, required state and error text with the
		// native controls (text/textarea/int/time/date/datetime), with the select
		// group container (role="group") and with the bool switch (role="switch").
		// Other library-backed fields keep their own markup.
		fieldAccessibilityProps(): Object
		{
			if (!this.hasGroupControl && !this.hasNativeControl && !this.hasSwitchControl)
			{
				return {};
			}

			const props = { labelledbyId: this.labelId };
			if (this.isRequired)
			{
				props.required = true;
			}

			if (this.error)
			{
				props.describedbyId = this.errorId;
				props.invalid = true;
			}

			return props;
		},
	},
	methods: {
		getCurrentConstantValue(): string | Array<string>
		{
			const currentValue = this.formData[this.item.id];

			if (this.item.multiple)
			{
				if (Type.isArray(currentValue))
				{
					return currentValue;
				}

				if (currentValue)
				{
					return [currentValue];
				}

				return [];
			}

			return currentValue ?? '';
		},
	},
	template: `
		<template v-if="isKnowledgeField">
			<component
				:is="fieldComponent"
				:item="item"
				v-model="constantValue"
				:isRequired="isRequired"
			/>
		</template>
		<template v-else>
			<div
				class="ui-form-row"
				:class="{ '--error': error }"
				:aria-labelledby="hasSwitchControl ? null : labelId"
				:aria-describedby="error ? errorId : null"
				:data-test-id="'bizproc-setup-template__form-field-' + item.id"
			>
				<div
					v-if="!hasSwitchControl"
					:class="{ '--required': isRequired }"
					class="ui-form-label bizproc-setup-template__label"
				>
					<div :id="labelId" class="ui-ctl-label-text bizproc-setup-template__label-text">{{ item.name }}</div>
				</div>
				<div class="ui-form-content">
					<component
						v-if="fieldComponent"
						:is="fieldComponent"
						:item="item"
						v-model="constantValue"
						v-bind="fieldAccessibilityProps"
						v-on="fieldListeners"
					/>
					<div v-if="error" :id="errorId" class="bizproc-setup-template__error-text">
						<div class="ui-icon-set --warning"></div>
						{{ error }}
					</div>
				</div>
			</div>
		</template>
	`,
};
