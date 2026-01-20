import { Editor, type FilledPlaceholder } from 'crm.template.editor';
import { Type } from 'main.core';
import { Text } from 'ui.system.typography.vue';
import { hint } from 'ui.vue3.directives.hint';
import { mapState } from 'ui.vue3.vuex';
import { type NotificationTemplate } from '../../editor';
import { ContentBody } from './layout/content-body';

// @vue/component
export const NotificationMessageContent = {
	name: 'NotificationMessageContent',
	components: {
		BText: Text,
		ContentBody,
	},
	directives: {
		hint,
	},
	editor: null,
	computed: {
		...mapState({
			notificationTemplate: (state) => state.application.notificationTemplate,
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
				text: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_PLACEHOLDER_FILLED_LATER_HINT'),
				position: 'top',
			};
		},
	},
	mounted(): void
	{
		this.editor = new Editor({
			...this.context,
			target: this.$refs.body,
			canUsePreview: false,
			isReadOnly: true,
		});

		this.editor
			.setPlaceholders({
				PREVIEW: this.previewPlaceholders,
			})
			.setFilledPlaceholders(this.filledPlaceholders)
			.setBody(this.notificationTemplate?.translation?.TEXT || this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_TEMPLATE_MESSAGE'))
		;
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
	},
	template: `
		<ContentBody bgColor="var(--ui-color-accent-soft-blue-3)" borderColor="var(--ui-color-accent-soft-blue-3)">
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
