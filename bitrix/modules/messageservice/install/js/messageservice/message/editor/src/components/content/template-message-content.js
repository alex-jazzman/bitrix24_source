import { Runtime, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Text } from 'ui.system.typography.vue';
import { mapGetters, mapState } from 'ui.vue3.vuex';

import { type Editor, type FilledPlaceholder } from 'messageservice.template.editor';

import { ContentBody } from './layout/content-body';
import { ContentFooter } from './layout/content-footer';
import { MessagePreview } from './message-preview';
import { TemplateSkeleton } from './template-message-content/template-skeleton';

// @vue/component
export const TemplateMessageContent = {
	name: 'TemplateMessageContent',
	components: {
		BText: Text,
		ContentBody,
		ContentFooter,
		MessagePreview,
		TemplateSkeleton,
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
			isLoadingTemplates: (state) => state.application.progress.isLoadingTemplates,
			isMessagePreviewShown: (state) => state.application.layout.isMessagePreviewShown,
			templateMessages: (state) => state.application.messages?.template,
		}),
		templateTitle(): string
		{
			if (Type.isNil(this.template))
			{
				return this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_NO_TEMPLATE_TITLE');
			}

			return this.template.TITLE ?? '';
		},
		templateBody(): string
		{
			if (Type.isNil(this.template))
			{
				return this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_NO_TEMPLATE_BODY');
			}

			return this.template.PREVIEW.replaceAll('\n', '<br>') ?? '';
		},
		bodyColor(): string
		{
			return this.isLoadingTemplates ? '#F9F9F9' : 'var(--ui-color-accent-soft-blue-3)';
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
	beforeCreate(): any
	{
		// start preloading the extension while the component is mounting
		void Runtime.loadExtension('messageservice.template.editor');
	},
	created()
	{
		this.ensureTemplatesLoaded();
	},
	mounted(): void
	{
		void Runtime.loadExtension('messageservice.template.editor').then((exports: { Editor: Editor }) => {
			this.editor = new exports.Editor({
				target: this.$refs.body,
				canUsePreview: false, // we render it ourselves
				canUseFieldsDialog: true,
				canUseFieldValueInput: true,
				messages: this.templateMessages,
				events: {
					onShowFieldsDialog: (event: BaseEvent) => {
						const proxyEvent = new BaseEvent({
							data: {
								...event.getData(),
								updatePlaceholder: this.editor.updatePlaceholder.bind(this.editor),
							},
						});

						this.$Bitrix.Data.get('locator').getEventEmitter().emit('Template:onShowFieldsDialog', proxyEvent);
					},
					onUpdatePlaceholder: (event: BaseEvent<{ filledPlaceholder: FilledPlaceholder }>) => {
						const { filledPlaceholder } = event.getData();

						this.createOrUpdatePlaceholder(filledPlaceholder);

						this.$store.dispatch('templates/setFilledPlaceholder', {
							filledPlaceholder,
						});
					},
				},
			});

			this.adjustEditor();
		});
	},
	beforeUnmount(): void
	{
		this.editor?.destroy();
	},
	methods: {
		/**
		 * load templates only when we start working with the specific channel
		 */
		ensureTemplatesLoaded(): void
		{
			void this.$Bitrix.Data.get('locator').getTemplateService().loadTemplates();
		},
		createOrUpdatePlaceholder(filledPlaceholder: FilledPlaceholder): void
		{
			this.$Bitrix.Data.get('locator').getTemplateService().createOrUpdatePlaceholder(filledPlaceholder);
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
		<ContentBody :bgColor="bodyColor">
			<TemplateSkeleton v-show="isLoadingTemplates"/>
			<div v-show="!isLoadingTemplates" class="messageservice-message-editor__flex-column">
				<BText
					tag="div"
					size="md"
					style="color: var(--ui-color-base-4);"
				>{{ templateTitle }}</BText>
				<div ref="body"></div>
			</div>
		</ContentBody>
		<ContentFooter>
			<MessagePreview v-if="isMessagePreviewShown"/>
		</ContentFooter>
	`,
};
