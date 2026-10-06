import { Dom } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { Phrase } from '../../const';
import { buildInitialBody } from '../../feature/build-message-body/build-message-body';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { type EditorUnsubscribe } from '../../infrastructure/adapter/editor/types';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';

import './editor-host.css';

/**
 * Holds the server-rendered `main.post.form` markup in a node Vue creates once and never patches:
 * everything inside the slot is owned by the editor runtime, so it carries no directive and no
 * interpolation. The runtime itself is reached only through the adapter.
 */
// @vue/component
export const EditorHost = defineComponent({
	name: 'MailComposeEditorHost',

	setup()
	{
		const editor = useComposeEditor();

		// Handed over before mount: the adapter applies it on editor readiness, ahead of every other reader
		// of that readiness. The signature node is written on the same readiness, and a full body
		// replacement afterwards would drop it.
		editor.setInitialBody(buildInitialBody(editor, useComposeState().body));

		return {
			editor,
			// Own subscriptions only: the editor adapter is shared with the rest of the form and outlives it.
			subscriptions: [] as EditorUnsubscribe[],
		};
	},

	data()
	{
		return {
			isEditorShown: false,
			editorNode: null as HTMLElement | null,
			editorHome: null as HTMLElement | null,
		};
	},

	mounted(): void
	{
		this.attachEditor();
		this.subscriptions.push(this.editor.subscribeBodyPlaceholder(loc(Phrase.BodyPlaceholder)));
	},

	beforeUnmount(): void
	{
		this.detachEditor();
		this.subscriptions.forEach((unsubscribe: EditorUnsubscribe): void => {
			unsubscribe();
		});
		this.subscriptions.length = 0;
	},

	methods: {
		attachEditor(): void
		{
			const node = this.editor.getHostNode();
			if (!node)
			{
				return;
			}

			this.editorNode = node;
			this.editorHome = node.parentElement;

			this.subscriptions.push(this.editor.subscribeVisibilityChange(this.handleVisibilityChange));

			// The node is moved before the editor initializes: BXHtmlEditor builds its iframe inside
			// this node, and the browser reloads a reparented iframe, losing the content.
			Dom.append(node, this.$refs.editorSlot as HTMLElement);
			this.editor.show();
		},

		detachEditor(): void
		{
			const node = this.editorNode;
			if (!node)
			{
				return;
			}

			// The node belongs to the form, not to this component: give it back before Vue removes the
			// host element with everything inside it.
			Dom.append(node, this.editorHome);

			this.editorNode = null;
			this.editorHome = null;
		},

		handleVisibilityChange(isShown: boolean): void
		{
			this.isEditorShown = isShown;
		},
	},

	template: `
		<div class="mail-compose-editor-host">
			<div
				v-if="!isEditorShown"
				class="mail-compose-editor-host__placeholder"
				data-testid="mail-compose-editor-placeholder"
			></div>
			<div
				ref="editorSlot"
				class="mail-compose-editor-host__slot"
				data-testid="mail-compose-editor-slot"
			></div>
		</div>
	`,
});
