import { Dom, Loc } from 'main.core';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { TextSm } from 'ui.system.typography.vue';

import { HtmlEditorErrorCode, type HtmlEditorAdapter } from '../adapter/html-editor';
import { type EditorStore } from '../model/editor-store';

type NativeHost = {
	container: HTMLElement | null;
	parent: Node | null;
	nextSibling: ChildNode | null;
	hidden: boolean;
	unmounted: boolean;
	unsubscribeFiles: (() => void) | null;
};

export const EditorHost = defineComponent({
	name: 'CrmMailTemplateEditorHost',
	components: { TextSm },
	props: {
		editorContainerId: {
			type: String,
			required: true,
		},
		adapter: {
			type: Object as PropType<HtmlEditorAdapter>,
			required: true,
		},
		store: {
			type: Object as PropType<EditorStore>,
			required: true,
		},
	},
	emits: ['ready', 'error'],
	setup(): { Loc: typeof Loc; nativeHost: NativeHost }
	{
		return {
			Loc,
			nativeHost: markRaw({
				container: null,
				parent: null,
				nextSibling: null,
				hidden: false,
				unmounted: false,
				unsubscribeFiles: null,
			}),
		};
	},
	async mounted(): Promise<void>
	{
		try
		{
			const container = document.getElementById(this.editorContainerId);
			const host = this.$refs.host as HTMLElement;
			if (!container || !container.parentNode || container.contains(host))
			{
				throw new Error(HtmlEditorErrorCode.ContainerUnavailable);
			}

			this.adapter.prepareToMove();
			this.nativeHost.container = container;
			this.nativeHost.parent = container.parentNode;
			this.nativeHost.nextSibling = container.nextSibling;
			this.nativeHost.hidden = container.hidden;
			Dom.append(container, host);
			container.hidden = false;
			this.nativeHost.unsubscribeFiles = this.adapter.subscribeFiles((fileState) => {
				this.store.syncFiles(fileState);
			});
			await this.adapter.start();
			if (!this.nativeHost.unmounted)
			{
				this.$emit('ready');
			}
		}
		catch (error)
		{
			this.nativeHost.unsubscribeFiles?.();
			this.nativeHost.unsubscribeFiles = null;
			this.adapter.destroy();
			if (!this.nativeHost.unmounted)
			{
				this.$emit('error', error);
			}
		}
	},
	beforeUnmount(): void
	{
		this.nativeHost.unmounted = true;
		this.nativeHost.unsubscribeFiles?.();
		this.nativeHost.unsubscribeFiles = null;
		try
		{
			this.adapter.prepareToMove();
		}
		finally
		{
			this.adapter.destroy();
			const { container, parent, nextSibling, hidden } = this.nativeHost;
			if (container && parent?.isConnected)
			{
				container.hidden = hidden;
				if (nextSibling?.parentNode === parent)
				{
					Dom.insertBefore(container, nextSibling as HTMLElement);
				}
				else
				{
					Dom.append(container, parent as HTMLElement);
				}
			}
		}
	},
	template: `
		<div ref="host" class="crm-mail-template-editor__host" data-testid="crm-mail-template-editor-host"/>
		<TextSm
			v-if="store.state.uploadsPending || store.state.uploadsFailed"
			class="crm-mail-template-editor__files-status"
			tag="div"
			wrap="break-words"
			:role="store.state.uploadsFailed ? 'alert' : 'status'"
		>
			{{ Loc.getMessage(store.state.uploadsFailed
				? 'CRM_MAIL_TEMPLATE_EDITOR_FILES_UPLOAD_ERROR'
				: 'CRM_MAIL_TEMPLATE_EDITOR_FILES_UPLOADING') }}
		</TextSm>
	`,
});
