import { defineComponent, type Component, type PropType } from 'ui.vue3';

import {
	FormFieldType,
	RestMethod,
	type FormBlockType,
	type FormFieldBlockType,
	type RequestButtonBlockType,
} from 'im.v2.const';
import { runAction, type RunActionError } from 'im.v2.lib.rest';
import { type ImModelMessage } from 'im.v2.model';

import { BaseBlock } from '../base/base';
import { ButtonBlock } from '../button/button';
import { FormFieldCheckbox } from './components/field-checkbox';
import { FormFieldRadio } from './components/field-radio';
import { FormFieldSelect } from './components/field-select';
import { FormFieldText } from './components/field-text';

import './form.css';

type FieldValue = string | Array<string>;
type FormValues = { [fieldId: string]: FieldValue };

// TPL-F01: field wire-type -> field component.
const FIELD_COMPONENT_BY_TYPE: { [key: string]: Component } = {
	[FormFieldType.singleLineText]: FormFieldText,
	[FormFieldType.multilineText]: FormFieldText,
	[FormFieldType.select]: FormFieldSelect,
	[FormFieldType.radio]: FormFieldRadio,
	[FormFieldType.checkbox]: FormFieldCheckbox,
};

// @vue/component
export const FormBlock = defineComponent({
	name: 'FormBlock',
	components: { BaseBlock, ButtonBlock },
	props: {
		message: {
			type: Object as PropType<ImModelMessage>,
			required: true,
		},
		block: {
			type: Object as PropType<FormBlockType>,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): { values: FormValues; isSubmitting: boolean; hasSubmitError: boolean }
	{
		// FormBlock is the single owner of user-entered values (never persisted to Vuex).
		// All fields start empty (AC-007); checkbox aggregates to a list, others to a string (DTO-02).
		const values: FormValues = {};
		const elements: FormFieldBlockType[] = this.block.elements ?? [];
		for (const field of elements)
		{
			values[field.id] = field.type === FormFieldType.checkbox ? [] : '';
		}

		return {
			values,
			// Transient, per-instance submit lock — enforces the "one submit in flight" invariant.
			// Never mirrored to Vuex: a submit by one participant must not lock the form on other clients (ADR).
			isSubmitting: false,
			// Transient in-block error signal for the last local attempt (AC-031); non-persistent.
			hasSubmitError: false,
		};
	},
	computed: {
		formBlock(): FormBlockType
		{
			return this.block;
		},
		elements(): FormFieldBlockType[]
		{
			return this.formBlock.elements ?? [];
		},
		buttonRows(): RequestButtonBlockType[][]
		{
			return this.formBlock.buttons ?? [];
		},
		// Resolve each field's component once (TPL-F01); fields with an unknown type get `component: null`
		// so the template renders the rest of the form but no sub-component for them.
		resolvedFields(): Array<{ field: FormFieldBlockType, component: Component | null }>
		{
			return this.elements.map((field) => {
				return { field, component: this.getFieldComponent(field.type) };
			});
		},
	},
	watch: {
		// Any fresh block from the server ends the local attempt (mirrors Keyboard.watch.buttons).
		block(): void
		{
			this.isSubmitting = false;
			this.hasSubmitError = false;
		},
	},
	methods: {
		getFieldComponent(type: string): Component | null
		{
			return FIELD_COMPONENT_BY_TYPE[type] ?? null;
		},
		isFieldDisabled(field: FormFieldBlockType): boolean
		{
			return field.disabled || this.isSubmitting;
		},
		onFieldValueUpdate(fieldId: string, value: FieldValue): void
		{
			this.values[fieldId] = value;
		},
		// ALG-F01: collect local values and submit; the network flow is bound to this Vue instance
		// because it needs the component-local `values` (unavailable to the generic click router).
		async onSubmitClick(button: RequestButtonBlockType): Promise<void>
		{
			// Guard: ignore repeat clicks while a submit is in flight or the button is disabled.
			if (this.isSubmitting || button.disabled)
			{
				return;
			}

			this.isSubmitting = true;
			this.hasSubmitError = false;

			// Identify the request by stable ids from the saved block (DTO-01) — not generated on the client.
			// Submit only fields that are currently present, enabled and non-empty: an empty text/select/radio
			// value (empty string) drops its key so the wire payload matches mobile (bug 252015). The backend
			// also rejects values for server-disabled fields (FIELD_DISABLED) and empty single-option
			// select/radio (UNKNOWN_OPTION_ID), while the contract (DTO-02) accepts a partial/empty payload.
			// Checkbox aggregates to a list and is sent as-is (incl. the empty "[]" = "none selected").
			// Collecting from `this.elements` also drops stale keys left over from a previous block revision.
			const values: FormValues = {};
			for (const field of this.elements)
			{
				const value = this.values[field.id];

				if (!field.disabled && value !== undefined && value !== '')
				{
					values[field.id] = value;
				}
			}

			const payload = {
				messageId: this.message.id,
				blockId: this.block.id,
				buttonId: button.id,
				values,
			};

			try
			{
				// A successful `{ status: 'accepted' }` ack (API-01) carries no block update (SC-006 / AC-032),
				// so release the lock right here instead of waiting only for `watch.block`. The form never
				// enters a success state on its own (AC-029 / AC-031); no store mutation, no values reset.
				await runAction(RestMethod.imV2ChatMessageBlockFormSubmit, { data: payload });
				this.isSubmitting = false;
			}
			catch (errors)
			{
				// End of the local attempt (AC-031). `values` are kept intact for retry (AC-030 / AC-042);
				// the user sees a single generic localized message, never raw code/message (AC-043).
				this.isSubmitting = false;
				this.hasSubmitError = true;
				this.logSubmitErrors(errors as RunActionError[]);
			}
		},
		logSubmitErrors(errors: RunActionError[]): void
		{
			// Technical details go to the console only, never to the user (AC-043) — cf. SendingService#logSendErrors.
			const list = Array.isArray(errors) ? errors : [errors];
			list.forEach((error) => {
				console.error(`FormBlock: submit error: code: ${error?.code} message: ${error?.message}`);
			});
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="formBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-form__container" data-testid="im-message-form">
				<div v-if="elements.length > 0" class="bx-im-message-block-form__fields" data-testid="im-message-form-fields">
					<template v-for="{ field, component } in resolvedFields" :key="field.id">
						<component
							v-if="component"
							:is="component"
							:field="field"
							:value="values[field.id]"
							:disabled="isFieldDisabled(field)"
							@update:value="onFieldValueUpdate(field.id, $event)"
						/>
					</template>
				</div>
				<div v-if="buttonRows.length > 0" class="bx-im-message-block-form__buttons" data-testid="im-message-form-buttons">
					<div
						v-for="(buttonsRow, rowIndex) in buttonRows"
						:key="rowIndex"
						class="bx-im-message-block-form__buttons-row"
					>
						<!-- ButtonBlock has inheritAttrs: false, so data-testid can't pass through to its root.
							 The transparent (display: contents) wrapper carries the testid without changing the wide layout. -->
						<div
							v-for="button in buttonsRow"
							:key="button.id"
							style="display: contents;"
							data-testid="im-message-form-submit"
						>
							<ButtonBlock
								:block="button"
								:dialogId="dialogId"
								:message="message"
								:loading="isSubmitting"
								:disabled="button.disabled || isSubmitting"
								:wide="true"
								@click="onSubmitClick(button)"
							/>
						</div>
					</div>
					<div v-if="hasSubmitError" class="bx-im-message-block-form__error" role="alert" data-testid="im-message-form-error">
						{{ loc('IM_MESSAGE_BUILDER_FORM_SUBMIT_ERROR') }}
					</div>
				</div>
			</div>
		</BaseBlock>
	`,
});
