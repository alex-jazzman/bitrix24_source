import { Type } from 'main.core';
import { Text as BText } from 'ui.system.typography.vue';
import { hint } from 'ui.vue3.directives.hint';
import { mapGetters } from 'ui.vue3.vuex';

import { Editor, type FilledPlaceholder } from 'messageservice.template.editor';

import { type NotificationTemplate } from '../../editor';
import { ContentBody } from './layout/content-body';

// @vue/component
export const NotificationMessageContent = {
	name: 'NotificationMessageContent',
	components: {
		BText,
		ContentBody,
	},
	directives: {
		hint,
	},
	editor: null,
	computed: {
		...mapGetters({
			notificationTemplate: 'notificationTemplates/current',
		}),
		title(): string
		{
			return this.notificationTemplate?.translation?.TITLE || '';
		},
		placeholders(): NotificationTemplate['placeholders']
		{
			return this.notificationTemplate?.placeholders ?? [];
		},
		previewPlaceholders(): string[]
		{
			return this.placeholders.map((placeholder) => this.makeTranslationPlaceholderName(placeholder.name));
		},
		filledPlaceholders(): FilledPlaceholder[]
		{
			return this.placeholders
				.map((placeholder) => {
					return {
						PLACEHOLDER_ID: this.makeTranslationPlaceholderName(placeholder.name),
						FIELD_VALUE: placeholder.value ?? placeholder.caption ?? '',
					};
				})
			;
		},
		hasNotFilledPlaceholders(): boolean
		{
			return this.placeholders.some((placeholder) => Type.isNil(placeholder.value));
		},
		hint(): ?Object
		{
			if (!this.hasNotFilledPlaceholders)
			{
				return null;
			}

			return {
				text: this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_PLACEHOLDER_FILLED_LATER_HINT'),
				position: 'top',
			};
		},
	},
	watch: {
		notificationTemplate(): void
		{
			if (!this.editor || !this.notificationTemplate)
			{
				return;
			}

			this.adjustEditor();
		},
	},
	mounted(): void
	{
		this.editor = new Editor({
			target: this.$refs.body,
			canUsePreview: false,
			isReadOnly: true,
		});

		this.adjustEditor();
	},
	beforeUnmount()
	{
		this.editor?.destroy();
	},
	methods: {
		makeTranslationPlaceholderName(placeholderName: string): string
		{
			return `#${placeholderName}#`;
		},
		adjustEditor(): void
		{
			this.editor
				.setPlaceholders({
					PREVIEW: this.previewPlaceholders,
				})
				.setFilledPlaceholders(this.filledPlaceholders)
				.setBody(this.notificationTemplate?.translation?.TEXT || this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_TEMPLATE_MESSAGE'))
			;
		},
	},
	template: `
		<ContentBody bgColor="var(--ui-color-accent-soft-blue-3)">
			<BText
				v-if="title"
				tag="div"
				size="md"
				style="
					color: var(--ui-color-base-4);
					margin-bottom: 8px;
				"
			>{{ title }}</BText>
			<div
				ref="body"
				v-hint="hint"
			></div>
		</ContentBody>
	`,
};
