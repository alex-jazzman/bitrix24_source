import { ajax, Type } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';
import { ITEM_TYPES, CONSTANT_TYPES, TEMPLATE_SETUP_EVENT_NAME } from '../constants';
import { FormElement } from './item';
import 'ui.alerts';
import 'ui.sidepanel-content';
import 'ui.forms';
import 'ui.layout-form';
import '../css/style.css';

import type { Block, ConstantItem, FieldsSubmitReview } from '../types';

const TOTAL_STEPS_COUNT = 2;

const BEFORE_SUBMIT_EVENT = 'Bizproc:SetupTemplate:beforeSubmit';

const FOCUSABLE_SELECTOR = 'input:not([type="hidden"]), textarea, select, button, [role="button"], [tabindex]:not([tabindex="-1"])';

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
			default: '',
		},
		templateDescription: {
			type: String,
			default: '',
		},
		instanceId: {
			type: String,
			default: '',
		},
		/** @type Array<Block> */
		blocks: {
			type: Array,
			required: true,
		},
		/**
		 * Render-only mode: collect constant values and hand them to this
		 * callback instead of running a workflow fill session. Used by the
		 * agent upgrade fill scenario (Design A). Receives the prepared
		 * `{ <constantCode>: <value> }` map and returns a Promise resolving to a
		 * review payload (repeated needs_review — keep the panel open, re-render
		 * and explain why), `false` (keep open unchanged) or null/undefined
		 * (flow complete — close the panel).
		 * @type ?(constantValues: { [key: string]: any }) => Promise<?FieldsSubmitReview | boolean>
		 */
		onSubmit: {
			type: Function,
			default: null,
		},
		/** Skip the intro step and render the fields immediately. */
		singleStep: {
			type: Boolean,
			default: false,
		},
		/** Overrides the submit button caption on the fields step. */
		submitCaption: {
			type: String,
			default: '',
		},
		/** Overrides the panel header title (defaults to the common setup title). */
		title: {
			type: String,
			default: '',
		},
	},
	data(): {
		isLoading: boolean,
		submitError: string,
		formData: { [key: string]: any },
		validationErrors: { [key: string]: string },
		dateMissingConstants: { [key: string]: boolean },
		currentStep: number,
		renderBlocks: Array<Block>,
		}
	{
		return {
			currentStep: this.singleStep ? TOTAL_STEPS_COUNT : 1,
			isLoading: false,
			submitError: '',
			validationErrors: {},
			// A date and time field with a time but no date: the value is empty while the field looks
			// filled in, so the check runs on submit and asks for the date by name.
			dateMissingConstants: {},
			// Local copy so the callback flow (Design A) can swap in the blocks
			// still required on a repeated needs_review without a remount.
			renderBlocks: this.blocks,
			formData: this.getFormDataWithDefaultValues(),
		};
	},
	computed:
	{
		allConstants(): Array<ConstantItem>
		{
			return this.renderBlocks
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
			if (!this.isFirstStep && this.submitCaption)
			{
				return this.submitCaption;
			}

			const messageCode = this.isFirstStep
				? 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_CONTINUE_BUTTON'
				: 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_RUN_BUTTON'
			;

			return this.$Bitrix.Loc.getMessage(messageCode);
		},
		showProgressBar(): boolean
		{
			return !this.singleStep;
		},
		panelTitle(): string
		{
			return this.title || this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_TITLE');
		},
		buttonClickHandler(): Function
		{
			return this.isFirstStep ? this.proceedToNextStep : this.handleSubmit;
		},
	},
	methods: {
		getFormDataWithDefaultValues(blocks: Array<Block> = this.blocks): { [key: string]: any }
		{
			const initialData = {};
			blocks.forEach((block) => {
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
				// client-side validation only highlights fields; the screen reader
				// gets nothing unless we announce the summary and move focus to the
				// first invalid field (which then reads its aria-invalid + error text)
				LiveAnnouncer.announce(this.getValidationSummaryMessage(), 'assertive');
				const target = await this.syncErrorAnchors();
				target?.focus();

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

				if (Type.isFunction(this.onSubmit))
				{
					await this.submitViaCallback();
				}
				else
				{
					await this.submitViaFillRequest();
				}
			}
			catch (error)
			{
				this.submitError = this.getErrorFromResponse(error);
			}

			this.isLoading = false;
		},
		async submitViaFillRequest(): Promise<void>
		{
			await this.activateTemplateRequest();
			const event = new BaseEvent({
				data: {
					templateId: this.templateId,
				},
			});
			EventEmitter.emit(TEMPLATE_SETUP_EVENT_NAME.SUCCESS, event);
			BX.SidePanel.Instance.close();
		},
		/**
		 * Render-only mode: hand collected values to the owner callback. The
		 * server re-validates. The callback resolves:
		 *  - a review payload — repeated needs_review, re-render the prefilled
		 *    blocks, highlight the reported fields and explain why the panel
		 *    stayed open;
		 *  - `false` — keep the panel open unchanged (e.g. a handled error);
		 *  - null/undefined — the flow is complete, close the panel.
		 */
		async submitViaCallback(): Promise<void>
		{
			const result: ?FieldsSubmitReview | boolean = await this.onSubmit(this.getPreparedDataForRequest());

			if (result === false)
			{
				return;
			}

			if (Type.isPlainObject(result))
			{
				this.applyReview(result);

				return;
			}

			BX.SidePanel.Instance.close();
		},
		/**
		 * Repeated needs_review: re-render the blocks (already prefilled with the
		 * values the server echoed, so input is not lost), highlight the fields
		 * the server reported and show a non-blocking message explaining why the
		 * panel did not close.
		 */
		applyReview(review: FieldsSubmitReview): void
		{
			this.renderBlocks = review.blocks;
			this.formData = this.getFormDataWithDefaultValues(review.blocks);
			this.validationErrors = this.getReviewFieldErrors(review);
			this.submitError = this.getReviewMessage(review);
			void this.syncErrorAnchors();
		},
		getReviewFieldErrors(review: FieldsSubmitReview): { [key: string]: string }
		{
			const errors = {};
			const requiredMessage = this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALIDATION_ERROR');
			const invalidMessage = this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALIDATION_ERROR_GENERIC');

			(review.requiredConstants ?? []).forEach((code) => {
				errors[code] = requiredMessage;
			});
			(review.invalidConstants ?? []).forEach((code) => {
				errors[code] = invalidMessage;
			});

			return errors;
		},
		getReviewMessage(review: FieldsSubmitReview): string
		{
			if (Type.isArrayFilled(review.requiredConstants))
			{
				return this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_REQUIRED');
			}

			if (Type.isArrayFilled(review.invalidConstants))
			{
				return this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_INVALID');
			}

			return this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_GENERAL');
		},
		handleCancel(): void
		{
			BX.SidePanel.Instance.close();
		},
		onConstantUpdate(constantId: string, value: any): void
		{
			this.formData[constantId] = value;

			if (this.validationErrors[constantId] && !this.isValueEmpty(value))
			{
				delete this.validationErrors[constantId];
				void this.syncErrorAnchors();
			}
		},
		/**
		 * A date and time field reports a time picked with no date. The form keeps the flag and uses it
		 * on submit only: the field is not highlighted while the user is still filling it in.
		 */
		onConstantDateMissing(constantId: string, isDateMissing: boolean): void
		{
			this.dateMissingConstants[constantId] = isDateMissing;
		},
		isValueEmpty(value: any): boolean
		{
			// A list of values is empty when every row of it is: getPreparedDataForRequest drops empty
			// rows, so a list of blank rows reaches the server as no value at all.
			if (Type.isArray(value))
			{
				return value.every((item) => this.isValueEmpty(item));
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
				// A time picked with no date is not a value, so the process would start without the time
				// the field still shows: the date is asked for whether or not the constant is required.
				// This branch goes first, because "required field is empty" would read as wrong next to
				// a field showing the picked time.
				if (this.dateMissingConstants[item.id])
				{
					this.validationErrors[item.id] = this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALIDATION_ERROR_DATE');
				}
				else if (item.required && this.isValueEmpty(value))
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
			this.focusFirstField();
		},
		async focusFirstField(): void
		{
			await this.$nextTick();
			const content = this.$refs.contentInner;
			if (!content)
			{
				return;
			}

			const focusable = content.querySelector(FOCUSABLE_SELECTOR);
			focusable?.focus();
		},
		/**
		 * Invalid rows carry the --error modifier (constant.js). A row whose control
		 * cannot take focus (the uploader drop zone) is turned into a real tab stop
		 * (tabindex="0") so the user reaches it during normal navigation and the
		 * screen reader reads its label + error (the row is aria-labelledby/
		 * aria-describedby). Anchors are removed once the field becomes valid or
		 * gains a focusable control. Returns the first field to focus.
		 */
		async syncErrorAnchors(): ?HTMLElement
		{
			await this.$nextTick();
			const content = this.$refs.contentInner;
			if (!content)
			{
				return null;
			}

			let firstTarget = null;
			content.querySelectorAll('.ui-form-row').forEach((row) => {
				const isInvalid = row.classList.contains('--error');
				const focusable = row.querySelector(FOCUSABLE_SELECTOR);

				if (isInvalid && !focusable)
				{
					row.setAttribute('tabindex', '0');
					row.dataset.a11yErrorAnchor = 'true';
				}
				else if (row.dataset.a11yErrorAnchor === 'true')
				{
					row.removeAttribute('tabindex');
					delete row.dataset.a11yErrorAnchor;
				}

				if (isInvalid && !firstTarget)
				{
					firstTarget = focusable ?? row;
				}
			});

			return firstTarget;
		},
		getInvalidFieldNames(): Array<string>
		{
			return this.allConstants
				.filter((item) => this.validationErrors[item.id])
				.map((item) => item.name)
				.filter((name) => Type.isStringFilled(name))
			;
		},
		getValidationSummaryMessage(): string
		{
			const hasRequiredError = this.allConstants.some(
				(item) => item.required && this.isValueEmpty(this.formData[item.id]),
			);
			const fieldNames = this.getInvalidFieldNames();

			if (fieldNames.length === 0)
			{
				return hasRequiredError
					? this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_REQUIRED')
					: this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_INVALID')
				;
			}

			const messageCode = hasRequiredError
				? 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_REQUIRED_FIELDS'
				: 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_INVALID_FIELDS'
			;

			return this.$Bitrix.Loc.getMessage(messageCode, { '#FIELDS#': fieldNames.join(', ') });
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
					{{ panelTitle }}
				</div>
			</div>
			<div class="ui-sidepanel-layout-content ui-sidepanel-layout-content-margin">
				<div class="ui-sidepanel-layout-content-inner" ref="contentInner">
					<div v-if="showProgressBar" class="bizproc-setup-template__progress-bar">
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
						<div v-if="submitError" class="ui-alert ui-alert-danger" role="alert">
							<span class="ui-alert-message">{{ submitError }}</span>
						</div>
						<template v-for="block in renderBlocks" :key="block.id">
							<div class="ui-slider-section">
								<div class="ui-slider-content-box">
									<FormElement
										v-for="item in block.items"
										:key="item.id"
										:item="item"
										:formData="formData"
										:errors="validationErrors"
										@constantUpdate="onConstantUpdate"
										@constantDateMissing="onConstantDateMissing"
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
