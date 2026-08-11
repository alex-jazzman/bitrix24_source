import { Type } from 'main.core';
import { type BitrixVueComponentProps } from 'ui.vue3';
import {
	Button as UiButton,
	AirButtonStyle,
	ButtonSize,
} from 'ui.vue3.components.button';
import { CONSTANT_TYPES } from '../../constants';
import './edit-constant-popup-form.css';
// eslint-disable-next-line no-unused-vars
import type { ConstantItem, ConstantConfiguration } from '../../types';

type OptionModel = {
	name: string,
};

import { EntitySelectorConstantSettings } from '../constant-settings/entity-selector/entity-selector';

const CONSTANT_SETTINGS_COMPONENT = Object.freeze({
	[CONSTANT_TYPES.ENTITY_SELECTOR]: EntitySelectorConstantSettings,
});

type EditConstantPopupFormData = {
	id: string;
	errors: {
		id: string;
		name: string;
		options: Array<string>;
	};
	name: string;
	constantType: string;
	multiple: boolean;
	description: string;
	defaultValue: string;
	options: Array<OptionModel>;
	required: boolean;
};

// @vue/component
export const EditConstantPopupForm = {
	name: 'EditConstantPopupForm',
	components: {
		UiButton,
		EntitySelectorConstantSettings,
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
		isCreation: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:item', 'cancel', 'update:changed'],
	setup(): { [string]: string }
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): EditConstantPopupFormData
	{
		const options = this.convertMapToOptionsModelArray(this.item.options);

		return {
			id: this.item.id,
			name: this.item.name,
			constantType: this.item.constantType,
			multiple: this.item.multiple,
			description: this.item.description,
			defaultValue: this.item.default,
			options,
			settings: this.item.settings,
			required: this.item.required,
			initialOptionsSnapshot: JSON.stringify(options),
			errors: {
				id: '',
				name: '',
				options: options.map(() => ''),
			},
		};
	},
	computed: {
		isSelectType(): boolean
		{
			return this.constantType === CONSTANT_TYPES.SELECT;
		},
		isEntitySelector(): boolean
		{
			return this.constantType === CONSTANT_TYPES.ENTITY_SELECTOR;
		},
		submitButtonText(): string
		{
			const key = this.isCreation
				? 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_ADD'
				: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_EDIT';

			return this.$Bitrix.Loc.getMessage(key);
		},
		isChanged(): boolean
		{
			return this.id !== this.item.id
				|| this.name !== this.item.name
				|| this.constantType !== this.item.constantType
				|| this.multiple !== this.item.multiple
				|| this.required !== this.item.required
				|| this.description !== this.item.description
				|| this.defaultValue !== this.item.default
				|| JSON.stringify(this.options) !== this.initialOptionsSnapshot;
		},
		errorMessages(): string
		{
			return {
				required: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_LABEL_REQUIRED'),
				idFormat: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_ID_FORMAT'),
				idUnique: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_ID_UNIQUE'),
				optionUnique: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_OPTION_UNIQUE'),
			};
		},
		constantSettingsComponent(): ?BitrixVueComponentProps
		{
			const types = this.constantConfigurationList.map((constant) => constant.type);
			if (!types.includes(this.constantType))
			{
				return null;
			}

			return CONSTANT_SETTINGS_COMPONENT[this.constantType];
		},
		currentConstantConfiguration(): ConstantConfiguration
		{
			return this.constantConfigurationList
				.find((constantConfiguration: ConstantConfiguration) => constantConfiguration.type === this.constantType)
			;
		},
	},
	watch: {
		constantType(): void
		{
			this.options = [];
		},
		isChanged(value: boolean): void
		{
			this.$emit('update:changed', value);
		},
	},
	mounted(): any
	{
		this.resetUnsupportedType();
	},
	methods: {
		onAddOption(): void
		{
			this.options.push({
				name: '',
			});
			this.errors.options.push('');
		},
		onDeleteOption(index: number): void
		{
			this.options.splice(index, 1);
			this.errors.options.splice(index, 1);
		},
		validateName(): boolean
		{
			this.errors.name = '';

			if (!Type.isStringFilled(this.name.trim()))
			{
				this.errors.name = this.errorMessages.required;

				return false;
			}

			return true;
		},
		validateId(): boolean
		{
			this.errors.id = '';
			const id = this.id.trim();

			if (!Type.isStringFilled(id))
			{
				this.errors.id = this.errorMessages.required;

				return false;
			}

			if (!/^[A-Za-z]\w*$/.test(id))
			{
				this.errors.id = this.errorMessages.idFormat;

				return false;
			}

			return true;
		},
		validateOption(index: number): boolean
		{
			const name = this.options[index].name.trim();
			this.errors.options[index] = '';

			if (!Type.isStringFilled(name))
			{
				this.errors.options[index] = this.errorMessages.required;

				return false;
			}

			for (const [optionKey: number, option: OptionModel] of this.options.entries())
			{
				if (optionKey !== index && option.name.trim() === name)
				{
					this.errors.options[index] = this.errorMessages.optionUnique;

					return false;
				}
			}

			return true;
		},
		validateOptions(): boolean
		{
			if (this.constantType !== CONSTANT_TYPES.SELECT)
			{
				return true;
			}

			let errorsCount = 0;
			this.errors.options = [];

			this.options.forEach((option, index) => {
				if (this.validateOption(index))
				{
					this.errors.options[index] = '';
				}
				else
				{
					errorsCount += 1;
				}
			});

			return errorsCount === 0;
		},
		resetErrors(): void
		{
			this.errors = {
				id: '',
				name: '',
				options: [],
			};
		},
		onSave(): void
		{
			const isValid = ([
				this.validateId(),
				this.validateName(),
				this.validateOptions(),
			])
				.every((value: boolean) => value);

			if (!isValid)
			{
				return;
			}

			const setUniqueError = () => {
				this.errors.id = this.errorMessages.idUnique;
			};

			this.$emit('update:item', {
				propertyValues: {
					...this.item,
					id: this.id.trim(),
					name: this.name,
					description: this.description,
					constantType: this.constantType,
					multiple: this.multiple,
					options: this.convertOptionModelsToMap(this.options),
					settings: this.settings,
					default: this.defaultValue,
					required: this.required,
				},
				setError: setUniqueError,
			});
		},
		onCancel(): void
		{
			this.$emit('cancel');
		},
		convertMapToOptionsModelArray(options: Record<string, string>): Array<OptionModel>
		{
			const models = [];
			Object.values(options).forEach((value: string) => {
				if (Type.isStringFilled(value))
				{
					models.push({ name: value });
				}
			});

			return models;
		},
		convertOptionModelsToMap(models: Array<OptionModel>): Record<string, string>
		{
			const options: Record<string, string> = {};
			for (const model of models)
			{
				if (Type.isStringFilled(model.name))
				{
					options[model.name] = model.name;
				}
			}

			return options;
		},
		resetUnsupportedType(): void
		{
			const types = this.constantConfigurationList.map((constant) => constant.type);
			if (!types.includes(this.constantType))
			{
				this.constantType = types[0];
			}
		},
	},
	template: `
		<div class="bizproc-setuptemplateactivity-edit-constant-popup">
			<div class="bizproc-setuptemplateactivity-edit-constant-popup__content">
				<div class="bizproc-setuptemplateactivity-edit-constant-popup__block">
					<div class="ui-ctl-container">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_NAME_VALUE') }}
							</div>
						</div>
						<div class="ui-ctl ui-ctl-w100 ui-ctl-sm">
							<input
								v-model="name"
								class="ui-ctl-element"
								:class="{ '--error': errors.name !== '' }"
								type="text"
								@blur="validateName"
							/>
						</div>
						<div
							v-if="errors.name"
							class="ui-ctl-label-text-error">
							{{ errors.name }}
						</div>
					</div>

					<div class="ui-ctl-container">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_ID_LABEL') }}
							</div>
						</div>
						<div class="ui-ctl ui-ctl-w100 ui-ctl-sm">
							<input
								v-model="id"
								class="ui-ctl-element"
								:class="{ '--error': errors.id !== '' }"
								type="text"
								:disabled="!isCreation"
								@blur="validateId"
							/>
						</div>
						<div
							v-if="errors.id"
							class="ui-ctl-label-text-error"
						>
							{{ errors.id }}
						</div>
					</div>
					<div class="ui-ctl-container">
						<div class="ui-ctl-top">
							<label class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TYPE_LABEL') }}
							</label>
						</div>
						<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100 ui-ctl-sm">
							<div class="ui-ctl-after ui-ctl-icon-angle"></div>
							<select
								v-model="constantType"
								class="ui-ctl-element"
							>
								<option
									v-for="constantConfiguration in constantConfigurationList"
									:key="constantConfiguration.type"
									:value="constantConfiguration.type"
								>
									{{ constantConfiguration.title }}
								</option>
							</select>
						</div>
					</div>
					<template v-if="constantSettingsComponent">
						<component
							:is="constantSettingsComponent"
							:constantConfiguration="currentConstantConfiguration"
							v-model="settings"
						/>
					</template>
					<div class="ui-ctl-container">
						<label class="ui-ctl ui-ctl-checkbox ui-ctl-xs">
							<input
								v-model="multiple"
								type="checkbox"
								class="ui-ctl-element"
							/>
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_LABEL') }}
						</label>
						<label class="ui-ctl ui-ctl-checkbox ui-ctl-xs">
							<input
								v-model="required"
								type="checkbox"
								class="ui-ctl-element"
							/>
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_LABEL') }}
						</label>
					</div>
					<div class="ui-ctl-container" v-if="!isEntitySelector">
						<div class="ui-ctl-top">
							<label class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE') }}
							</label>
						</div>
						<div class="ui-ctl ui-ctl-w100 ui-ctl-sm">
							<input
								v-model="defaultValue"
								class="ui-ctl-element"
								type="text"
							/>
						</div>
					</div>

					<template v-if="isSelectType">
						<div
							v-for="(option, index) in options"
							class="ui-ctl-container"
						>
							<div class="ui-ctl-top">
								<div class="ui-ctl-title">
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_LABEL')  }} {{ index + 1 }}
								</div>
							</div>
							<div class="ui-ctl ui-ctl-w100 ui-ctl-sm">
								<div
									class="ui-ctl-after ui-ctl-icon-clear"
									@click="onDeleteOption(index)"
								>
								</div>
								<input
									v-model="option.name"
									class="ui-ctl-element"
									:class="{ '--error': errors.options[index] !== '' }"
									type="text"
									@blur="validateOption(index)"
								/>
							</div>
							<div
								v-if="errors.options[index]"
								class="ui-ctl-label-text-error">
								{{ errors.options[index] }}
							</div>
						</div>
					</template>

					<div
						v-if="isSelectType"
						class="ui-ctl-container"
					>
						<button
							class="ui-btn --air --wide --style-outline-no-accent ui-btn-no-caps"
							type="button"
							@click="onAddOption"
						>
							<div class="ui-icon-set --plus-l"/>
							<span class="ui-btn-text">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_ADD_OPTION_BTN') }}
							</span>
						</button>
					</div>

					<div class="ui-ctl-container">
						<div class="ui-ctl-top">
							<label class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DESCRIPTION') }}
							</label>
						</div>
						<div class="ui-ctl ui-ctl-textarea ui-ctl-w100 ui-ctl-sm">
							<textarea
								v-model="description"
								class="ui-ctl-element"
								type="text"
							/>
						</div>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-edit-constant-popup__footer">
					<UiButton
						:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_CANCEL')"
						:style="AirButtonStyle.OUTLINE"
						:size="ButtonSize.MEDIUM"
						@click="onCancel"
					/>
					<UiButton
						:text="submitButtonText"
						:size="ButtonSize.MEDIUM"
						@click="onSave"
					/>
				</div>
			</div>
		</div>
	`,
};
