import { Type } from 'main.core';
import { ConstantTextual } from './constant-field/textual';
import { ConstantSelect } from './constant-field/select';
import { ConstantUser } from './constant-field/user';
import { ConstantTextarea } from './constant-field/textarea';
import { ConstantKnowledge } from './constant-field/knowledge';
import { ConstantProject } from './constant-field/project';
import { ConstantFile } from './constant-field/file';
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
	emits: ['constantUpdate'],
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
			<div class="ui-form-row" :class="{ '--error': error }">
				<div
					:class="{ '--required': isRequired }"
					class="ui-form-label bizproc-setup-template__label"
				>
					<div class="ui-ctl-label-text bizproc-setup-template__label-text">{{ item.name }}</div>
				</div>
				<div class="ui-form-content">
					<component
						v-if="fieldComponent"
						:is="fieldComponent"
						:item="item"
						v-model="constantValue"
					/>
					<div v-if="error" class="bizproc-setup-template__error-text">
						<div class="ui-icon-set --warning"></div>
						{{ error }}
					</div>
				</div>
			</div>
		</template>
	`,
};
