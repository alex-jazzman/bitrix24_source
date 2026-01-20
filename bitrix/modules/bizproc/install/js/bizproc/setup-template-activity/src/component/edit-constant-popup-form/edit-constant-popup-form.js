import { Type } from 'main.core';
import {
	Button as UiButton,
	AirButtonStyle,
	ButtonSize,
} from 'ui.vue3.components.button';
import { CONSTANT_TYPES } from '../../constants';
import './edit-constant-popup-form.css';
// eslint-disable-next-line no-unused-vars
import type { ConstantItem } from '../../types';

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
	options: Array<Record<string, string>>;
	required: boolean;
};

// @vue/component
export const EditConstantPopupForm = {
	name: 'EditConstantPopupForm',
	components: {
		UiButton,
	},
	inject: ['editSlider'],
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		/** Record<string, string> */
		fieldTypeNames: {
			type: Object,
			required: true,
		},
		isCreation: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:item', 'cancel'],
	setup(): { [string]: string }
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): EditConstantPopupFormData
	{
		return {
			id: this.item.id,
			name: this.item.name,
			constantType: this.item.constantType,
			multiple: this.item.multiple,
			description: this.item.description,
			defaultValue: this.item.default,
			options: [...this.item.options],
			required: this.item.required,
			errors: {
				id: '',
				name: '',
				options: this.item.options.map(() => ''),
			},
		};
	},
	computed: {
		isSelectType(): boolean
		{
			return this.constantType === CONSTANT_TYPES.SELECT;
		},
		errorMessages(): string
		{
			return {
				required: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_LABEL_REQUIRED'),
				idFormat: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_ID_FORMAT'),
				idUnique: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_ID_UNIQUE'),
			};
		},
	},
	watch: {
		constantType(): void
		{
			this.options = [];
		},
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
				if (Type.isStringFilled(option.name.trim()))
				{
					this.errors.options[index] = '';
				}
				else
				{
					errorsCount += 1;
					this.errors.options[index] = this.errorMessages.required;
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
					options: [...this.options],
					default: this.defaultValue,
					required: this.required,
				},
				setError: setUniqueError,
			});
		},
		onCancel(): void
		{
			this.editSlider?.close();
			this.$emit('cancel');
		},
	},
	template: `
		<div class="bizproc-setuptemplateactivity-edit-constant-popup">
			<div class="bizproc-setuptemplateactivity-edit-constant-popup__container">
				<div class="bizproc-setuptemplateactivity-edit-constant-popup__header">
					<h1 class="bizproc-setuptemplateactivity-edit-constant-popup__title">
						{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_SLIDER_TITLE') }}
					</h1>
				</div>

				<div class="bizproc-setuptemplateactivity-edit-constant-popup__content">
					<div class="bizproc-setuptemplateactivity-edit-constant-popup__block">
						<div class="ui-ctl-container">
							<div class="ui-ctl-top">
								<div class="ui-ctl-title">
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_NAME_LABEL') }}
								</div>
							</div>
							<div class="ui-ctl ui-ctl-w100">
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
							<div class="ui-ctl ui-ctl-w100">
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
							<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
								<div class="ui-ctl-after ui-ctl-icon-angle"></div>
								<select
									v-model="constantType"
									class="ui-ctl-element"
								>
									<option
										v-for="[fieldType, fieldText] in Object.entries(fieldTypeNames)"
										:key="fieldType"
										:value="fieldType"
									>
										{{ fieldText }}
									</option>
								</select>
							</div>
						</div>
						<div class="ui-ctl-container">
							<div class="ui-ctl-top">
								<div class="ui-ctl-title">
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_LABEL') }}
								</div>
							</div>
							<div>
								<label class="ui-ctl ui-ctl-radio ui-ctl-inline">
									<input
										v-model="multiple"
										type="radio"
										class="ui-ctl-element"
										:value="true"
									/>
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_VALUE_YES') }}
								</label>
								<label class="ui-ctl ui-ctl-radio ui-ctl-inline">
									<input
										v-model="multiple"
										type="radio"
										class="ui-ctl-element"
										:value="false"
									/>
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_VALUE_NO') }}
								</label>
							</div>
						</div>

						<div class="ui-ctl-container">
							<div class="ui-ctl-top">
								<div class="ui-ctl-title">
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_LABEL') }}
								</div>
							</div>
							<div>
								<label class="ui-ctl ui-ctl-radio ui-ctl-inline">
									<input
										v-model="required"
										type="radio"
										class="ui-ctl-element"
										:value="true"
									/>
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_VALUE_YES') }}
								</label>
								<label class="ui-ctl ui-ctl-radio ui-ctl-inline">
									<input
										v-model="required"
										type="radio"
										class="ui-ctl-element"
										:value="false"
									/>
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_VALUE_NO') }}
								</label>
							</div>
						</div>

						<div class="ui-ctl-container">
							<div class="ui-ctl-top">
								<label class="ui-ctl-title">
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE') }}
								</label>
							</div>
							<div class="ui-ctl ui-ctl-w100">
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
								<div class="ui-ctl ui-ctl-w100">
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
							<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
								<textarea
									v-model="description"
									class="ui-ctl-element"
									type="text"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="bizproc-setuptemplateactivity-edit-constant-popup__footer">
				<UiButton
					:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_SAVE')"
					:size="ButtonSize.LARGE"
					@click="onSave"
				/>
				<UiButton
					:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_CANCEL')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.LARGE"
					@click="onCancel"
				/>
			</div>
		</div>
	`,
};
