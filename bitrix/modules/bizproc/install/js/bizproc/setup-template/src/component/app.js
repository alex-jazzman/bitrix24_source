import { ajax, Type } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { ITEM_TYPES, CONSTANT_TYPES, TEMPLATE_SETUP_EVENT_NAME } from '../constants';
import { FormElement } from './item';
import 'ui.alerts';
import 'ui.sidepanel-content';
import 'ui.forms';
import 'ui.layout-form';
import '../css/style.css';

import type { ConstantItem } from '../types';

const TOTAL_STEPS_COUNT = 2;

const BEFORE_SUBMIT_EVENT = 'Bizproc:SetupTemplate:beforeSubmit';

// @vue/component
export const ActivatorAppComponent = {
	name: 'ActivatorAppComponent',
	components: { FormElement },
	provide(): {templateId: number}
	{
		return {
			templateId: this.templateId,
		};
	},
	props: {
		templateId: {
			type: Number,
			required: true,
		},
		templateName: {
			type: String,
			required: true,
		},
		templateDescription: {
			type: String,
			default: '',
		},
		instanceId: {
			type: String,
			required: true,
		},
		/** @type Array<Block> */
		blocks: {
			type: Array,
			required: true,
		},
	},
	data(): {
		isLoading: boolean,
		submitError: string,
		formData: { [key: string]: any },
		validationErrors: { [key: string]: string },
		currentStep: number,
		}
	{
		return {
			currentStep: 1,
			isLoading: false,
			submitError: '',
			validationErrors: {},
			formData: this.getFormDataWithDefaultValues(),
		};
	},
	computed:
	{
		allConstants(): Array<ConstantItem>
		{
			return this.blocks
				.flatMap((block) => block.items)
				.filter((item) => item.itemType === ITEM_TYPES.CONSTANT)
			;
		},
		isBtnDisabled(): boolean
		{
			return this.isLoading;
		},
		isFirstStep(): boolean
		{
			return this.currentStep === 1;
		},
		totalSteps(): number
		{
			return TOTAL_STEPS_COUNT;
		},
		buttonText(): string
		{
			const messageCode = this.isFirstStep
				? 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_CONTINUE_BUTTON'
				: 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_RUN_BUTTON'
			;

			return this.$Bitrix.Loc.getMessage(messageCode);
		},
		buttonClickHandler(): Function
		{
			return this.isFirstStep ? this.proceedToNextStep : this.handleSubmit;
		},
	},
	methods: {
		getFormDataWithDefaultValues(): { [key: string]: any }
		{
			const initialData = {};
			this.blocks.forEach((block) => {
				block.items.forEach((item) => {
					if (item.itemType === ITEM_TYPES.CONSTANT)
					{
						initialData[item.id] = item.default ?? '';
					}
				});
			});

			return initialData;
		},
		getPreparedDataForRequest(): { [key: string]: any }
		{
			const preparedData = {};

			this.allConstants.forEach((item) => {
				const key = item.id;
				const value = this.formData[key];

				if (this.isValueEmpty(value))
				{
					return;
				}

				if (Type.isArray(value))
				{
					let preparedValues = value.filter((val) => !this.isValueEmpty(val));
					if (preparedValues.length === 0)
					{
						return;
					}

					if (item.constantType === CONSTANT_TYPES.INT)
					{
						preparedValues = preparedValues.map(Number);
					}

					preparedData[key] = preparedValues;
				}
				else if (item.constantType === CONSTANT_TYPES.INT)
				{
					preparedData[key] = Number(value);
				}
				else
				{
					preparedData[key] = value;
				}
			});

			return preparedData;
		},
		activateTemplateRequest(): Promise<void>
		{
			const FILL_TEMPLATE_ACTION = 'bizproc.v2.SetupTemplate.fill';

			const constantValues = this.getPreparedDataForRequest();

			return ajax.runAction(FILL_TEMPLATE_ACTION, {
				data: {
					templateId: this.templateId,
					instanceId: this.instanceId,
					constantValues,
				},
			});
		},
		getErrorFromResponse(response: Object): string
		{
			if (!response.errors)
			{
				return '';
			}

			if (!Type.isArrayFilled(response.errors))
			{
				return this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_UNEXPECTED_ERROR');
			}

			const [firstError] = response.errors;

			return firstError.message;
		},
		async handleSubmit(): Promise<void>
		{
			if (!this.validateForm())
			{
				return;
			}

			this.isLoading = true;
			this.submitError = '';
			try
			{
				const eventRes: boolean[] = await EventEmitter.emitAsync(BEFORE_SUBMIT_EVENT);
				if (eventRes.includes(false))
				{
					this.isLoading = false;

					return;
				}
				await this.activateTemplateRequest();
				const event = new BaseEvent(
					{
						data: {
							templateId: this.templateId,
						},
					},
				);
				EventEmitter.emit(TEMPLATE_SETUP_EVENT_NAME.SUCCESS, event);
				BX.SidePanel.Instance.close();
			}
			catch (error)
			{
				this.submitError = this.getErrorFromResponse(error);
			}

			this.isLoading = false;
		},
		handleCancel(): void
		{
			BX.SidePanel.Instance.close();
		},
		onConstantUpdate(constantId: string, value: string): void
		{
			this.formData[constantId] = value;

			if (this.validationErrors[constantId] && !this.isValueEmpty(value))
			{
				delete this.validationErrors[constantId];
			}
		},
		isValueEmpty(value: string): boolean
		{
			if (Type.isArray(value) && value.length === 0)
			{
				return true;
			}

			const stringValue = (value ?? '').toString();

			return stringValue.trim().length === 0;
		},
		validateForm(): boolean
		{
			this.validationErrors = {};
			const simpleConstants = this.allConstants.filter((item) => item.constantType !== CONSTANT_TYPES.KNOWLEDGE);

			simpleConstants.forEach((item) => {
				const value = this.formData[item.id];
				if (item.required && this.isValueEmpty(value))
				{
					this.validationErrors[item.id] = this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALIDATION_ERROR');
				}
				else if (item.constantType === CONSTANT_TYPES.INT && this.isNotNumber(value))
				{
					this.validationErrors[item.id] = this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALIDATION_ERROR_INT', { '#FIELD_NAME#': item.name });
				}
			});

			return Object.keys(this.validationErrors).length === 0;
		},
		isNotNumber(value: string): boolean
		{
			const check = (val) => {
				if (this.isValueEmpty(val))
				{
					return false;
				}

				return Number.isNaN(Number(val));
			};

			if (Type.isArray(value))
			{
				return value.some((item) => check(item));
			}

			return check(value);
		},
		proceedToNextStep(): void
		{
			this.currentStep++;
		},
		isCurrentStep(step: number): boolean
		{
			return this.currentStep === step;
		},
	},
	template: `
		<div class="bizproc-setup-template__form" data-test-id="bizproc-setup-template__form-container">
			<div class="ui-sidepanel-layout-header">
				<div class="ui-sidepanel-layout-title">
					{{ $Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_TITLE') }}
				</div>
			</div>
			<div class="ui-sidepanel-layout-content ui-sidepanel-layout-content-margin">
				<div class="ui-sidepanel-layout-content-inner">
					<div class="bizproc-setup-template__progress-bar">
						<div
							v-for="step in totalSteps"
							:key="step"
							class="bizproc-setup-template__progress-item"
							:class="{ '--active': isCurrentStep(step) }"
						></div>
					</div>
					<template v-if="isFirstStep">
						<div class="ui-slider-section">
							<div class="bizproc-setup-template__heading">
								{{ templateName }}
							</div>
							<div class="bizproc-setup-template__subject">
								{{ templateDescription }}
							</div>
						</div>
					</template>
					<template v-else>
						<div v-if="submitError" class="ui-alert ui-alert-danger">
							<span class="ui-alert-message">{{ submitError }}</span>
						</div>
						<template v-for="block in blocks" :key="block.id">
							<div class="ui-slider-section">
								<div class="ui-slider-content-box">
									<FormElement
										v-for="item in block.items"
										:key="item.id"
										:item="item"
										:formData="formData"
										:errors="validationErrors"
										@constantUpdate="onConstantUpdate"
									/>
								</div>
							</div>
						</template>
					</template>
				</div>
			</div>
			<div class="ui-sidepanel-layout-footer-anchor"></div>
			<div class="ui-sidepanel-layout-footer">
				<div class="ui-sidepanel-layout-buttons ui-sidepanel-layout-buttons-align-left">
					<button
						class="ui-btn --air ui-btn-lg --style-filled ui-btn-no-caps"
						:class="{'ui-btn-wait': isLoading}"
						:disabled="isBtnDisabled"
						type="button"
						@click="buttonClickHandler"
						data-test-id="bizproc-setup-template__form-submit-button"
					>
						<span class="ui-btn-text">
							<span class="ui-btn-text-inner">
								{{ buttonText }}
							</span>
						</span>
					</button>
					<button
						class="ui-btn --air ui-btn-lg --style-plain ui-btn-no-caps"
						type="button"
						@click="handleCancel"
						data-test-id="bizproc-setup-template__form-cancel-button"
					>
						<span class="ui-btn-text">
							<span class="ui-btn-text-inner">
								{{ $Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_CANCEL_BUTTON') }}
							</span>
						</span>
					</button>
				</div>
			</div>
		</div>
	`,
};
