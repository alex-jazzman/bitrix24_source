import { Loc, Text } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HeadlineLg, TextSm } from 'ui.system.typography.vue';

import 'ui.icon-set.outline';

import { type HtmlEditorAdapter } from '../adapter/html-editor';
import { type EditorError, type EditorStore } from '../model/editor-store';
import { EditorActions, type EditorActionsInstance } from '../component/actions';
import { EditorHost } from '../component/editor-host';
import { EditorProperties, type EditorPropertiesInstance } from '../component/properties';
import { EditorSender, type EditorSenderInstance } from '../component/sender';
import { EditorSubject, type EditorSubjectInstance } from '../component/subject';
import { PlaceholderSelector, type PlaceholderSelectorInstance } from '../component/placeholder-selector';

export type EditorAppInstance = {
	handleSave(): void;
	cancelPlaceholders(): void;
	focusError(error: EditorError): void;
};

export const App = defineComponent({
	name: 'CrmMailTemplateEditorApp',
	components: {
		BIcon,
		HeadlineLg,
		TextSm,
		EditorActions,
		EditorHost,
		EditorProperties,
		EditorSender,
		EditorSubject,
		PlaceholderSelector,
	},
	props: {
		store: {
			type: Object as PropType<EditorStore>,
			required: true,
		},
		adapter: {
			type: Object as PropType<HtmlEditorAdapter>,
			required: true,
		},
		editorContainerId: {
			type: String,
			required: true,
		},
	},
	emits: ['ready', 'error', 'save', 'cancel'],
	expose: ['handleSave', 'cancelPlaceholders', 'focusError'],
	setup()
	{
		return { Loc, Outline };
	},
	computed: {
		title(): string
		{
			const messageId = this.store.state.id > 0
				? 'CRM_MAIL_TEMPLATE_EDITOR_EDIT_TITLE'
				: 'CRM_MAIL_TEMPLATE_EDITOR_CREATE_TITLE'
			;

			return Loc.getMessage(messageId) ?? '';
		},
	},
	methods: {
		rememberBodySelection(onInvalidated: () => void): boolean
		{
			return this.adapter.rememberSelection(onInvalidated);
		},
		insertBodyPlaceholder(marker: string): boolean
		{
			return this.adapter.insertPlaceholder(Text.encode(marker).replaceAll('&#39;', '&#039;'));
		},
		clearBodySelection(): void
		{
			this.adapter.clearSelection();
		},
		cancelPlaceholders(): void
		{
			(this.$refs.bodyPlaceholder as PlaceholderSelectorInstance | undefined)?.cancel();
			(this.$refs.subject as EditorSubjectInstance | undefined)?.cancelPlaceholder();
		},
		focusError(error: EditorError): void
		{
			const properties = this.$refs.properties as EditorPropertiesInstance | undefined;
			if (error.field && properties?.focusField(error.field))
			{
				return;
			}

			if (error.field === 'subject')
			{
				(this.$refs.subject as EditorSubjectInstance | undefined)?.focus();

				return;
			}

			if (error.field === 'emailFrom')
			{
				(this.$refs.sender as EditorSenderInstance | undefined)?.focus();

				return;
			}

			if (error.field === 'bodyHtml' && this.adapter.focus())
			{
				return;
			}

			(this.$refs.actions as EditorActionsInstance | undefined)?.focusErrors();
		},
		handleSave(): void
		{
			this.$emit('save');
		},
	},
	template: `
		<div
			class="crm-mail-template-editor --ui-context-content-light"
			:aria-labelledby="editorContainerId + '-title'"
			:aria-busy="store.state.busy"
			role="region"
			data-testid="crm-mail-template-editor"
		>
			<div class="crm-mail-template-editor__header">
				<BIcon :name="Outline.MAIL" :size="20" color="var(--ui-color-accent-main-primary)" aria-hidden="true"/>
				<HeadlineLg
					:id="editorContainerId + '-title'"
					class="crm-mail-template-editor__title"
					tag="h1"
					wrap="break-words"
				>{{ title }}</HeadlineLg>
			</div>
			<div class="crm-mail-template-editor__content">
				<TextSm
					v-if="!store.state.canEdit"
					class="crm-mail-template-editor__readonly"
					tag="div"
					wrap="break-words"
					role="status"
				>{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_READONLY') }}</TextSm>
				<EditorProperties ref="properties" :store="store"/>
				<EditorSender ref="sender" :store="store"/>
				<EditorSubject ref="subject" :store="store" @error="$emit('error', $event)"/>
				<PlaceholderSelector
					ref="bodyPlaceholder"
					class="crm-mail-template-editor__body-placeholder"
					:store="store"
					:text="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_INSERT_BODY_FIELD')"
					testId="crm-mail-template-body-placeholder"
					:rememberSelection="rememberBodySelection"
					:insertPlaceholder="insertBodyPlaceholder"
					:clearSelection="clearBodySelection"
					@error="$emit('error', $event)"
				/>
				<EditorHost
					:editorContainerId="editorContainerId"
					:adapter="adapter"
					:store="store"
					@ready="$emit('ready')"
					@error="$emit('error', $event)"
				/>
			</div>
			<EditorActions ref="actions" :store="store" @save="handleSave" @cancel="$emit('cancel')"/>
		</div>
	`,
});
