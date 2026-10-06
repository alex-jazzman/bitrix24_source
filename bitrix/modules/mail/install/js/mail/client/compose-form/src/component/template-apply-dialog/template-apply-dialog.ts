import { Text } from 'main.core';
import { type PopupOptions } from 'main.popup';
import { HeadlineSm, TextMd } from 'ui.system.typography.vue';
import { defineComponent, type PropType } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Popup } from 'ui.vue3.components.popup';

import { Phrase } from '../../const';
import { type TemplateApplyDecision } from '../../feature/apply-template/apply-template';
import { completeSelectedTemplate } from '../../feature/template-application/template-application';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';
import { type PreparedTemplate } from '../../model/compose/types';

const TestId = Object.freeze({
	dialog: 'mail-compose-template-apply',
	cancel: 'mail-compose-template-apply-cancel',
	insert: 'mail-compose-template-apply-insert',
	replace: 'mail-compose-template-apply-replace',
});

const DialogPadding = 24;

// @vue/component
export const TemplateApplyDialog = defineComponent({
	name: 'MailComposeTemplateApplyDialog',

	components: {
		HeadlineSm,
		Popup,
		TextMd,
		UiButton,
	},

	props: {
		popupId: {
			type: String,
			default: () => `mail-compose-template-apply-${Text.getRandom()}`,
		},
		formId: {
			type: String,
			required: true,
		},
		template: {
			type: Object as PropType<PreparedTemplate>,
			required: true,
		},
	},

	emits: ['insert', 'replace', 'cancel', 'applied', 'close'],

	setup()
	{
		return {
			state: useComposeState(),
			editor: useComposeEditor(),
			cancelStyle: AirButtonStyle.PLAIN,
			insertStyle: AirButtonStyle.OUTLINE,
			replaceStyle: AirButtonStyle.FILLED,
			buttonSize: ButtonSize.MEDIUM,
			testId: TestId,
		};
	},

	data()
	{
		return {
			isPending: false,
			isCompleted: false,
			hasError: false,
		};
	},

	computed: {
		options(): PopupOptions
		{
			return {
				targetContainer: document.body,
				overlay: true,
				closeIcon: true,
				closeByEsc: true,
				padding: DialogPadding,
				focusTrap: true,
				ariaLabelledBy: this.titleId,
			};
		},

		titleId(): string
		{
			return `${this.popupId}-title`;
		},

		title(): string
		{
			return loc(Phrase.TemplateApplyTitle);
		},

		errorText(): string
		{
			return loc(Phrase.TemplateApplyError);
		},

		labels(): Record<string, string>
		{
			return {
				cancel: loc(Phrase.TemplateApplyCancel),
				insert: loc(Phrase.TemplateApplyInsert),
				replace: loc(Phrase.TemplateApplyReplace),
			};
		},
	},

	methods: {
		restoreEditorFocus(): boolean
		{
			try
			{
				return this.editor.focus();
			}
			catch
			{
				return false;
			}
		},

		handleInsert(): void
		{
			this.apply('insert');
		},

		handleReplace(): void
		{
			this.apply('replace');
		},

		handleCancel(): void
		{
			if (this.isPending || this.isCompleted)
			{
				return;
			}

			this.isPending = true;
			this.$emit('cancel');
			void completeSelectedTemplate({
				editor: this.editor,
				state: this.state,
				formId: this.formId,
			}, 'cancel').then((): void => {
				this.isCompleted = true;
				this.restoreEditorFocus();
				this.$emit('close');
			});
		},

		apply(decision: Exclude<TemplateApplyDecision, 'cancel'>): void
		{
			const prepared = this.state.templates.prepared;
			const isSelected = prepared?.reference.source === this.template.reference.source
				&& prepared.reference.id === this.template.reference.id;
			if (this.isPending || this.isCompleted || !isSelected)
			{
				return;
			}

			this.isPending = true;
			this.hasError = false;
			this.$emit(decision);
			void completeSelectedTemplate({
				editor: this.editor,
				state: this.state,
				formId: this.formId,
			}, decision).then(
				(result): void => {
					this.isPending = false;
					if (result.status !== 'applied')
					{
						this.hasError = true;

						return;
					}

					this.isCompleted = true;
					this.restoreEditorFocus();
					this.$emit('applied');
					this.$emit('close');
				},
				(): void => {
					this.isPending = false;
					this.hasError = true;
				},
			);
		},
	},

	template: `
		<Popup :id="popupId" :options="options" @close="handleCancel">
			<div class="mail-compose-template-apply" :data-testid="testId.dialog">
				<HeadlineSm :id="titleId">{{ title }}</HeadlineSm>
				<TextMd v-if="hasError" className="mail-compose-template-apply__error">{{ errorText }}</TextMd>
				<div class="mail-compose-template-apply__actions">
					<UiButton
						:text="labels.cancel"
						:style="cancelStyle"
						:size="buttonSize"
						:disabled="isPending"
						:dataset="{ testid: testId.cancel }"
						@click="handleCancel"
					/>
					<UiButton
						:text="labels.insert"
						:style="insertStyle"
						:size="buttonSize"
						:loading="isPending"
						:disabled="isPending"
						:dataset="{ testid: testId.insert }"
						@click="handleInsert"
					/>
					<UiButton
						:text="labels.replace"
						:style="replaceStyle"
						:size="buttonSize"
						:loading="isPending"
						:disabled="isPending"
						:dataset="{ testid: testId.replace }"
						@click="handleReplace"
					/>
				</div>
			</div>
		</Popup>
	`,
});
