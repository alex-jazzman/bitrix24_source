import { Loc, Type } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextXs } from 'ui.system.typography.vue';

import { ConstantTextual } from './constant-field/textual';
import { ConstantSelect } from './constant-field/select';
import { ConstantUser } from './constant-field/user';
import { ConstantTextarea } from './constant-field/textarea';
import { ConstantKnowledge } from './constant-field/knowledge';
import { ConstantProject } from './constant-field/project';
import { ConstantFile } from './constant-field/file';
import { ConstantEntitySelector } from './constant-field/entity-selector';
import { ConstantTime } from './constant-field/time-field';
import { ConstantDate } from './constant-field/date-field';
import { ConstantDatetime } from './constant-field/datetime-field';
import { ConstantBool } from './constant-field/bool-field';
import { ConstantBIDashboard } from './constant-field/bi-dashboard';
import { CONSTANT_TYPES, VALUE_RULE_KEYS } from '../../constants';
import { getValueRuleKind, readRuleBound, VALUE_RULE_KINDS } from '../../lib/constant-value-rule/constant-value-rule';
import {
	getDeletedProjectIds,
	isDeletedProjectSelected,
} from '../../lib/project-field-state/project-field-state';
import { type ConstantValueRule } from '../../types';

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
		BIcon,
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
		TextXs,
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
		hintId(): string
		{
			return `bizproc-setup-template-hint-${this.item.id}`;
		},
		valueRule(): ?ConstantValueRule
		{
			const rule = this.item.settings?.[VALUE_RULE_KEYS.ROOT];

			return Type.isPlainObject(rule) && Object.keys(rule).length > 0 ? rule : null;
		},
		valueRuleHint(): string
		{
			const rule = this.valueRule;
			if (!rule)
			{
				return '';
			}

			const kind = getValueRuleKind(this.item.constantType);
			if (kind === VALUE_RULE_KINDS.BOUNDS)
			{
				return this.getBoundsHint(rule);
			}

			if (kind === VALUE_RULE_KINDS.LENGTH)
			{
				return this.getLengthHint(rule);
			}

			return '';
		},
		// The field takes both accompanying texts as one list of ids, so the hint joins the error
		// text instead of asking every field component for a second prop. An id enters the list
		// only once its node is rendered.
		describedbyIds(): ?string
		{
			const ids = [];
			if (this.valueRuleHint !== '')
			{
				ids.push(this.hintId);
			}

			if (this.error)
			{
				ids.push(this.errorId);
			}

			return ids.length > 0 ? ids.join(' ') : null;
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
		isDeletedProject(): boolean
		{
			return this.item.constantType === CONSTANT_TYPES.PROJECT
				&& isDeletedProjectSelected(this.item.meta?.projectState, this.formData[this.item.id])
			;
		},
		deletedProjectIds(): Array<string>
		{
			return getDeletedProjectIds(this.item.meta?.projectState);
		},
		projectDeletedHint(): string
		{
			return Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_PROJECT_DELETED_HINT') ?? '';
		},
		iconSet(): typeof Outline
		{
			return Outline;
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
		// Associate the visible label, required state and accompanying texts
		// (value rule hint, error) with the native controls
		// (text/textarea/int/time/date/datetime), with the select group container
		// (role="group") and with the bool switch (role="switch").
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

			if (this.describedbyIds)
			{
				props.describedbyId = this.describedbyIds;
			}

			if (this.error)
			{
				props.invalid = true;
			}

			return props;
		},
	},
	methods: {
		getBoundsHint(rule: ConstantValueRule): string
		{
			const min = readRuleBound(rule, VALUE_RULE_KEYS.MIN);
			const max = readRuleBound(rule, VALUE_RULE_KEYS.MAX);

			if (min !== null && max !== null)
			{
				return this.$Bitrix.Loc.getMessage(
					'BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALUE_RULE_HINT_RANGE',
					{ '#MIN#': min, '#MAX#': max },
				);
			}

			if (min !== null)
			{
				return this.$Bitrix.Loc.getMessage(
					'BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALUE_RULE_HINT_MIN',
					{ '#MIN#': min },
				);
			}

			if (max !== null)
			{
				return this.$Bitrix.Loc.getMessage(
					'BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALUE_RULE_HINT_MAX',
					{ '#MAX#': max },
				);
			}

			return '';
		},
		getLengthHint(rule: ConstantValueRule): string
		{
			const maxLength = readRuleBound(rule, VALUE_RULE_KEYS.MAX_LENGTH);
			if (maxLength === null)
			{
				return '';
			}

			return this.$Bitrix.Loc.getMessage(
				'BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALUE_RULE_HINT_MAX_LENGTH',
				{ '#LENGTH#': maxLength },
			);
		},
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
				:aria-describedby="describedbyIds"
				:data-test-id="'bizproc-setup-template__form-field-' + item.id"
			>
				<div
					v-if="!hasSwitchControl"
					:class="{ '--required': isRequired && !isDeletedProject }"
					class="ui-form-label bizproc-setup-template__label"
				>
					<div :id="labelId" class="ui-ctl-label-text bizproc-setup-template__label-text">
						<span>{{ item.name }}</span>
						<span
							v-if="isDeletedProject && isRequired"
							class="bizproc-setup-template__label-required-mark"
						>*</span>
						<span
							v-if="isDeletedProject"
							class="bizproc-setup-template__project-warning"
							:title="projectDeletedHint"
							:aria-label="projectDeletedHint"
							role="img"
							data-test-id="bizproc-setup-template__project-deleted-warning"
						>
							<BIcon
								:name="iconSet.ALERT_ACCENT"
								:size="16"
								color="var(--ui-color-accent-main-warning)"
							/>
						</span>
					</div>
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
					<TextXs
						v-if="valueRuleHint"
						:id="hintId"
						tag="div"
						className="bizproc-setup-template__hint-text"
						data-testid="bizproc-setup-template-form-value-rule-hint"
					>{{ valueRuleHint }}</TextXs>
					<div
						v-if="error"
						:id="errorId"
						class="bizproc-setup-template__error-text"
						data-testid="bizproc-setup-template-form-error-text"
					>
						<div class="ui-icon-set --warning"></div>
						{{ error }}
					</div>
				</div>
			</div>
		</template>
	`,
};
