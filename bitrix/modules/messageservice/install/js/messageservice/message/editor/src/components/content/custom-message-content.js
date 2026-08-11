import { Plugins, TextEditor, TextEditorComponent, Constants, type TextEditorOptions } from 'ui.text-editor';
import { $getRoot, $setSelection } from 'ui.lexical.core';
import { shallowRef } from 'ui.vue3';
import { mapGetters, mapState } from 'ui.vue3.vuex';

import { ContentProviderFactory } from '../../content-provider/content-provider-factory';
import {
	INSERT_PLACEHOLDER_COMMAND,
	INSERT_PLACEHOLDER_TEXT_COMMAND,
	INSERT_TEXT_COMMAND,
	PlaceholderPlugin,
} from '../../integration/text-editor/placeholder/placeholder-plugin';
import { type LexicalService } from '../../service/lexical-service';
import { BodyActions } from './custom-message-content/body-actions';
import { LengthCounter } from './custom-message-content/length-counter';
import { ContentBody } from './layout/content-body';
import { ContentFooter } from './layout/content-footer';
import { MessagePreview } from './message-preview';

const { INSERT_COPILOT_DIALOG_COMMAND } = Plugins.Copilot;

// @vue/component
export const CustomMessageContent = {
	name: 'CustomMessageContent',
	components: {
		TextEditorComponent,
		MessagePreview,
		ContentBody,
		ContentFooter,
		LengthCounter,
		BodyActions,
	},
	setup(): Object
	{
		const providerInstances = shallowRef([]);

		return {
			providerInstances,
		};
	},
	data(): Object
	{
		return {
			pendingEditorUpdates: 0,
		};
	},
	computed: {
		...mapGetters({
			/** @type boolean */
			isProgress: 'application/isProgress',
		}),
		...mapState({
			contentProviders: (state) => state.application.contentProviders,
			/** @type {Layout} */
			layout: (state) => state.application.layout,
		}),
		bgColor(): string
		{
			return this.layout.isMessageTextReadOnly ? 'var(--ui-color-accent-soft-blue-3)' : undefined;
		},
		editorOptions(): TextEditorOptions
		{
			const copilotProvider = this.providerInstances.find((p) => p.getId() === 'copilot');
			const plugins = ['RichText', 'Paragraph', 'Clipboard', 'History', 'Placeholder'];

			const options: TextEditorOptions = {
				plugins,
				extraPlugins: [PlaceholderPlugin],
				toolbar: [],
				newLineMode: Constants.NewLineMode.LINE_BREAK,
				minHeight: 50,
				maxHeight: 150,
				editorState: () => {
					const nodes = this.getLexicalService().$importToLexicalNodes(
						this.$store.state.message.text,
					);
					$getRoot().append(...nodes);
				},
				placeholder: this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_PLACEHOLDER'),
			};

			if (copilotProvider && !copilotProvider.getCustomData().isLocked)
			{
				plugins.push('Copilot');
				options.copilot = {
					copilotOptions: copilotProvider.getCustomData(),
					triggerBySpace: false,
				};
			}

			return options;
		},
		editorEvents(): Object
		{
			return {
				onChange: () => {
					const text = this.textEditor.getEditorState().read(
						() => this.getLexicalService().$exportFromLexical($getRoot()),
					);
					this.pendingEditorUpdates++;
					void this.$store.dispatch('message/setText', { text })
						.finally(() => {
							this.pendingEditorUpdates--;
						});
				},
			};
		},
	},
	watch: {
		contentProviders(newVal): void
		{
			const factory = this.getProviderFactory();
			factory.reconcile(newVal);
			this.providerInstances = factory.getProviders();
		},
		'$store.state.message.text': function(newText: string): void
		{
			if (this.pendingEditorUpdates > 0)
			{
				return;
			}

			this.textEditor.update(() => {
				const root = $getRoot();
				root.clear();
				root.append(...this.getLexicalService().$importToLexicalNodes(newText));
				$setSelection(null);
			});
		},
	},
	created()
	{
		const factory = this.getProviderFactory();
		factory.reconcile(this.contentProviders);
		this.providerInstances = factory.getProviders();

		this.textEditor = new TextEditor(this.editorOptions);

		this.insertContext = Object.freeze({
			insertText: (text: string) => {
				this.textEditor.dispatchCommand(INSERT_TEXT_COMMAND, { text });
			},
			insertPlaceholderText: (text: string) => {
				this.textEditor.dispatchCommand(INSERT_PLACEHOLDER_TEXT_COMMAND, { text });
			},
			insertPlaceholder: (code: string, caption: string, options?: {
				removable?: boolean,
				copyable?: boolean,
				customData?: { [key: string]: string },
			}) => {
				this.textEditor.dispatchCommand(INSERT_PLACEHOLDER_COMMAND, {
					code,
					caption,
					removable: options?.removable,
					copyable: options?.copyable,
					customData: options?.customData ?? {},
				});
			},
			getBindElement: () => {
				return this.$refs.actions.$el;
			},
			trackAction: (element: string) => {
				this.$Bitrix.Data.get('locator').getAnalyticsService().onContentProviderAction(element);
			},
			setLoading: (isLoading: boolean) => {
				void this.$store.dispatch('application/setProgress', { isLoading });
			},
		});
	},
	unmounted(): any
	{
		this.textEditor.destroy();
		this.textEditor = null;

		this.insertContext = null;
	},
	methods: {
		showCopilot(): void
		{
			this.textEditor.focus();
			this.textEditor.dispatchCommand(INSERT_COPILOT_DIALOG_COMMAND, {});
		},
		getProviderFactory(): ContentProviderFactory
		{
			return this.$Bitrix.Data.get('locator').getProviderFactory();
		},
		getLexicalService(): LexicalService
		{
			return this.$Bitrix.Data.get('locator').getLexicalService();
		},
	},
	template: `
		<ContentBody
			padding="0"
			:bgColor="bgColor"
			data-test-role="message-text-input"
		>
			<TextEditorComponent
				ref="textEditorComponent"
				:editorInstance="textEditor"
				:events="editorEvents"
				:editable="!isProgress && !layout.isMessageTextReadOnly"
			>
				<template #footer>
					<BodyActions
						ref="actions"
						:providerInstances="providerInstances"
						:insertContext="insertContext"
						@showCopilot="showCopilot"
					/>
				</template>
			</TextEditorComponent>
		</ContentBody>
		<ContentFooter v-if="layout.isMessagePreviewShown || layout.isMessageLengthCounterShown">
			<MessagePreview v-if="layout.isMessagePreviewShown"/>
			<div v-else></div>
			<LengthCounter v-if="layout.isMessageLengthCounterShown"/>
			<div v-else></div>
		</ContentFooter>
	`,
};
