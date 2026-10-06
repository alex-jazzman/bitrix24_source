import { Type } from 'main.core';
import { type BitrixVueComponentProps } from 'ui.vue3';
import {
	Button as UiButton,
	AirButtonStyle,
	ButtonSize,
} from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextXs } from 'ui.system.typography.vue';
import { CONSTANT_TYPES } from '../../constants';
import { normalizeUserValue } from '../../lib/user-value';
import { toSingleDefaultValue } from '../../lib/constant-default';
import './edit-constant-popup-form.css';
// eslint-disable-next-line no-unused-vars
import type { ConstantItem, ConstantConfiguration } from '../../types';

type OptionModel = {
	value: string,
	name: string,
};

import { EntitySelectorConstantSettings } from '../constant-settings/entity-selector/entity-selector';
import { ConstantValueUser } from '../constant-value/user';
import { ConstantValueBool } from '../constant-value/bool';
import { ConstantValueDate } from '../constant-value/date';
import { ConstantValueDateTime } from '../constant-value/datetime';

const CONSTANT_SETTINGS_COMPONENT = Object.freeze({
	[CONSTANT_TYPES.ENTITY_SELECTOR]: EntitySelectorConstantSettings,
});

// Types whose default value is edited by a dedicated control instead of the plain text input.
const CONSTANT_VALUE_COMPONENT = Object.freeze({
	[CONSTANT_TYPES.BOOL]: ConstantValueBool,
	[CONSTANT_TYPES.DATE]: ConstantValueDate,
	[CONSTANT_TYPES.DATETIME]: ConstantValueDateTime,
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
		BIcon,
		TextXs,
		EntitySelectorConstantSettings,
		ConstantValueUser,
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
			Outline,
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
			isDateMissing: false,
			errors: {
				id: '',
				name: '',
				value: '',
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
		isUserType(): boolean
		{
			return this.constantType === CONSTANT_TYPES.USER;
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
				|| (
					this.isUserType
						? JSON.stringify(normalizeUserValue(this.defaultValue, this.multiple))
							!== JSON.stringify(normalizeUserValue(this.item.default, this.item.multiple))
						: this.defaultValue !== this.item.default
				)
				|| JSON.stringify(this.options) !== this.initialOptionsSnapshot;
		},
		errorMessages(): string
		{
			return {
				required: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_LABEL_REQUIRED'),
				idFormat: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_ID_FORMAT'),
				idUnique: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_ID_UNIQUE'),
				optionUnique: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_OPTION_UNIQUE'),
				dateRequired: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_DATE_REQUIRED'),
			};
		},
		constantValueComponent(): ?BitrixVueComponentProps
		{
			return CONSTANT_VALUE_COMPONENT[this.constantType] ?? null;
		},
		/**
		 * The controls above edit a single value, so an array default of a multiple constant is shown
		 * by its first element instead of leaving the control blank; editing replaces the whole
		 * default, the way the plain text input of any other type does.
		 */
		scalarDefaultValue: {
			get(): string
			{
				return toSingleDefaultValue(this.defaultValue);
			},
			set(value: string): void
			{
				this.defaultValue = value;
			},
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
			this.defaultValue = '';
			this.isDateMissing = false;
			this.errors.value = '';
		},
		multiple(value: boolean): void
		{
			if (!this.isUserType)
			{
				return;
			}

			// Keep defaultValue in sync with the multiple flag without discarding the user's choice:
			// scalar -> array on enable, array -> first element (or empty string) on disable. Matches
			// how ConstantValueUser.syncValue emits (single -> string, multiple -> array).
			const normalized = normalizeUserValue(this.defaultValue, value);
			this.defaultValue = value ? normalized : (normalized[0] ?? '');
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
			const optionLabel = this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_LABEL');
			this.options.push({
				value: '',
				name: `${optionLabel} ${this.options.length + 1}`,
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
		getOptionValue(option: OptionModel): string
		{
			const value = option.value.trim();

			return Type.isStringFilled(value) ? value : option.name.trim();
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

			const value = this.getOptionValue(this.options[index]);
			for (const [optionKey: number, option: OptionModel] of this.options.entries())
			{
				if (optionKey !== index && this.getOptionValue(option) === value)
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
				value: '',
				options: [],
			};
		},
		onDateMissingChange(isDateMissing: boolean): void
		{
			this.isDateMissing = isDateMissing;

			if (!isDateMissing)
			{
				this.errors.value = '';
			}
		},
		/**
		 * A time picked with no date is not a value: the control publishes an empty default, so the
		 * constant would be saved without the time the form still shows. The date is asked for whether
		 * or not the constant is required — the same rule the launch form follows.
		 */
		validateDefaultValue(): boolean
		{
			this.errors.value = '';

			if (this.isDateMissing)
			{
				this.errors.value = this.errorMessages.dateRequired;

				return false;
			}

			return true;
		},
		onSave(): void
		{
			const isValid = ([
				this.validateId(),
				this.validateName(),
				this.validateOptions(),
				this.validateDefaultValue(),
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
			Object.entries(options).forEach(([value: string, name: string]) => {
				if (Type.isStringFilled(value))
				{
					models.push({ value, name });
				}
			});

			return models;
		},
		convertOptionModelsToMap(models: Array<OptionModel>): Record<string, string>
		{
			const options: Record<string, string> = {};
			for (const model of models)
			{
				const value = this.getOptionValue(model);
				if (Type.isStringFilled(value))
				{
					options[value] = model.name.trim();
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
		<div
			class="bizproc-setuptemplateactivity-edit-constant-popup"
			data-testid="bizproc-setup-template-constant-editor"
		>
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
								data-testid="bizproc-setup-template-constant-edit-name-input"
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
								data-testid="bizproc-setup-template-constant-edit-id-input"
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
								data-testid="bizproc-setup-template-constant-edit-type-select"
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
								data-testid="bizproc-setup-template-constant-edit-multiple-checkbox"
							/>
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_LABEL') }}
						</label>
						<label class="ui-ctl ui-ctl-checkbox ui-ctl-xs">
							<input
								v-model="required"
								type="checkbox"
								class="ui-ctl-element"
								data-testid="bizproc-setup-template-constant-edit-required-checkbox"
							/>
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_LABEL') }}
						</label>
					</div>
					<div
						class="ui-ctl-container"
						v-if="!isEntitySelector && !isUserType"
						:data-testid="constantValueComponent ? 'bizproc-setup-template-constant-edit-value-control' : null"
					>
						<div class="ui-ctl-top">
							<label class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE') }}
							</label>
						</div>
						<component
							:is="constantValueComponent"
							v-if="constantValueComponent"
							v-model="scalarDefaultValue"
							@dateMissingChange="onDateMissingChange"
						/>
						<div v-else class="ui-ctl ui-ctl-w100 ui-ctl-sm">
							<input
								v-model="defaultValue"
								class="ui-ctl-element"
								type="text"
								data-testid="bizproc-setup-template-constant-edit-value-input"
							/>
						</div>
						<div
							v-if="errors.value"
							class="ui-ctl-label-text-error"
							role="alert"
							data-testid="bizproc-setup-template-constant-edit-value-error"
						>
							{{ errors.value }}
						</div>
					</div>

					<div
						class="ui-ctl-container"
						v-if="isUserType"
						data-testid="bizproc-setup-template-constant-edit-value-user"
					>
						<div class="ui-ctl-top">
							<label class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE') }}
							</label>
						</div>
						<ConstantValueUser
							:item="item"
							:multiple="multiple"
							v-model="defaultValue"
						/>
					</div>

					<template v-if="isSelectType">
							<div
								v-for="(option, index) in options"
								:key="index"
								class="bizproc-setuptemplateactivity-edit-constant-popup__option"
							>
								<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-fields">
									<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-bracket" aria-hidden="true"></div>
									<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-fields-inner">
										<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-field">
											<TextXs className="bizproc-setuptemplateactivity-edit-constant-popup__option-field-label">
												{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_NAME_LABEL') }}
											</TextXs>
											<div
												class="bizproc-setuptemplateactivity-edit-constant-popup__option-field-control"
												:class="{ '--error': errors.options[index] !== '' }"
											>
												<input
													v-model="option.name"
													class="bizproc-setuptemplateactivity-edit-constant-popup__option-field-input"
													type="text"
													:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_NAME_LABEL')"
													:aria-invalid="errors.options[index] !== ''"
													:aria-describedby="errors.options[index] ? ('bizproc-setuptemplateactivity-option-error-' + index) : null"
													@blur="validateOption(index)"
												/>
											</div>
										</div>
										<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-field">
											<TextXs className="bizproc-setuptemplateactivity-edit-constant-popup__option-field-label">
												{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_VALUE_LABEL') }}
											</TextXs>
											<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-field-control">
												<input
													v-model="option.value"
													class="bizproc-setuptemplateactivity-edit-constant-popup__option-field-input"
													type="text"
													:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_VALUE_LABEL')"
													:aria-invalid="errors.options[index] !== ''"
													:aria-describedby="errors.options[index] ? ('bizproc-setuptemplateactivity-option-error-' + index) : null"
													@blur="validateOption(index)"
												/>
											</div>
										</div>
										<div
											v-if="errors.options[index]"
											:id="'bizproc-setuptemplateactivity-option-error-' + index"
											class="ui-ctl-label-text-error"
											role="alert"
										>
											{{ errors.options[index] }}
										</div>
									</div>
								</div>
								<button
									type="button"
									class="bizproc-setuptemplateactivity-edit-constant-popup__option-delete"
									:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DELETE_OPTION')"
									@click="onDeleteOption(index)"
								>
									<BIcon :name="Outline.CROSS_L" :color="'var(--ui-color-base-4)'" :size="20"/>
								</button>
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
								data-testid="bizproc-setup-template-constant-edit-description-input"
							/>
						</div>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-edit-constant-popup__footer">
					<UiButton
						:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_CANCEL')"
						:style="AirButtonStyle.OUTLINE"
						:size="ButtonSize.MEDIUM"
						:dataset="{ testid: 'bizproc-setup-template-constant-edit-cancel-btn' }"
						@click="onCancel"
					/>
					<UiButton
						:text="submitButtonText"
						:size="ButtonSize.MEDIUM"
						:dataset="{ testid: 'bizproc-setup-template-constant-edit-save-btn' }"
						@click="onSave"
					/>
				</div>
			</div>
		</div>
	`,
};
