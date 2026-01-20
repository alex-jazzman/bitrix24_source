import { Editor, type OnSelectParams } from 'crm.template.editor';
import { Runtime, Type } from 'main.core';
import { Text } from 'ui.system.typography.vue';
import { mapGetters, mapState } from 'ui.vue3.vuex';
import type { Template } from '../../model/templates-model';
import { ContentBody } from './layout/content-body';
import { ContentFooter } from './layout/content-footer';
import { MessagePreview } from './message-preview';

// @vue/component
export const TemplateMessageContent = {
	name: 'TemplateMessageContent',
	components: {
		BText: Text,
		ContentBody,
		ContentFooter,
		MessagePreview,
	},
	editor: null,
	computed: {
		...mapGetters({
			/** @type Channel */
			currentChannel: 'channels/current',
			/** @type ?Template */
			template: 'templates/current',
		}),
		...mapState({
			context: (state) => state.application.context,
			isMessagePreviewShown: (state) => state.application.layout.isMessagePreviewShown,
		}),
		templateTitle(): string
		{
			if (Type.isNil(this.template))
			{
				return this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_NO_TEMPLATE_TITLE');
			}

			return this.template.TITLE ?? '';
		},
		templateBody(): string
		{
			if (Type.isNil(this.template))
			{
				return this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_NO_TEMPLATE_BODY');
			}

			return this.template.PREVIEW.replaceAll('\n', '<br>') ?? '';
		},
	},
	watch: {
		'currentChannel.id': function(): void
		{
			this.ensureTemplatesLoaded();
		},
		template(): void
		{
			this.adjustEditor();
		},
	},
	created()
	{
		this.ensureTemplatesLoaded();
	},
	mounted(): void
	{
		this.editor = new Editor({
			...this.context,
			target: this.$refs.body,
			canUsePreview: false, // we render it ourselves
			canUseFieldsDialog: true,
			canUseFieldValueInput: true,
			onSelect: (params: OnSelectParams) => {
				this.createOrUpdatePlaceholder(params);

				this.$store.dispatch('templates/setFilledPlaceholder', {
					filledPlaceholder: {
						PLACEHOLDER_ID: params.id,
						FIELD_NAME: params.value,
						FIELD_VALUE: params.text,
						PARENT_TITLE: params.parentTitle,
						TITLE: params.title,
					},
				});
			},
		});

		this.adjustEditor();
	},
	beforeUnmount(): void
	{
		this.editor?.destroy();
	},
	methods: {
		ensureTemplatesLoaded(): void
		{
			// hack to load templates only when we start working with the specific channel
			this.$Bitrix.Data.get('locator').getTemplateService().loadTemplates();
		},
		createOrUpdatePlaceholder(params: OnSelectParams): void
		{
			this.$Bitrix.Data.get('locator').getTemplateService().createOrUpdatePlaceholder(params);
		},
		adjustEditor(): void
		{
			this.editor
				.setPlaceholders(Runtime.clone(this.template?.PLACEHOLDERS ?? []))
				.setFilledPlaceholders(Runtime.clone(this.template?.FILLED_PLACEHOLDERS ?? []))
				.setBody(this.templateBody)
			;
		},
	},
	template: `
		<ContentBody bgColor="var(--ui-color-accent-soft-blue-3)" borderColor="var(--ui-color-accent-soft-blue-3)">
			<BText
				tag="div"
				size="md"
				style="
						color: var(--ui-color-base-4);
						margin-bottom: 8px;
					"
			>{{ templateTitle }}</BText>
			<div ref="body"></div>
		</ContentBody>
		<ContentFooter>
			<MessagePreview v-if="isMessagePreviewShown"/>
		</ContentFooter>
	`,
};
