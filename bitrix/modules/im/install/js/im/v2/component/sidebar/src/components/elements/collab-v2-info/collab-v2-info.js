import { Runtime, type JsonObject } from 'main.core';

import { Logger } from 'im.v2.lib.logger';
import { type ImModelChat } from 'im.v2.model';

import { ChatDescription } from '../chat-description/chat-description';

import './css/collab-v2-info.css';

type ProjectInfoInstance = {
	mount: (container: HTMLElement) => void,
	unmount: () => void,
};

type ProjectInfoEmbedExtension = {
	embedProjectInfo?: (params: {
		projectId: number,
		onReady?: () => void,
	}) => ProjectInfoInstance,
};

// @vue/component
export const CollabV2Info = {
	name: 'CollabV2Info',
	components: { ChatDescription },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			isLoading: true,
			showFallback: false,
		};
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		projectId(): number
		{
			return Number(this.dialog.entityLink.id);
		},
	},
	created(): void
	{
		this.projectInfoInstance = null;
	},
	mounted(): void
	{
		void this.mountProjectInfo();
	},
	beforeUnmount(): void
	{
		this.unmountProjectInfo();
	},
	methods: {
		async mountProjectInfo(): Promise<void>
		{
			try
			{
				const extension: ProjectInfoEmbedExtension = await Runtime.loadExtension(
					'socialnetwork.v2.application.project-info-embed',
				);
				const container = this.$refs.embedContainer;
				if (!container)
				{
					return;
				}

				if (!extension.embedProjectInfo)
				{
					this.handleExtensionLoadError(new Error('embedProjectInfo factory is not available'));

					return;
				}

				this.projectInfoInstance = extension.embedProjectInfo({
					projectId: this.projectId,
					onReady: () => this.handleReady(),
				});
				this.projectInfoInstance.mount(container);
			}
			catch (error)
			{
				this.handleExtensionLoadError(error);
			}
		},
		handleReady(): void
		{
			this.isLoading = false;
		},
		handleExtensionLoadError(error: Error): void
		{
			Logger.warn('Sidebar: failed to mount CollabV2Info:', error);
			this.unmountProjectInfo();
			this.isLoading = false;
			this.showFallback = true;
		},
		unmountProjectInfo(): void
		{
			this.projectInfoInstance?.unmount();
			this.projectInfoInstance = null;
		},
	},
	template: `
		<ChatDescription
			v-if="showFallback"
			:dialogId="dialogId"
		/>
		<div
			v-else
			class="bx-im-sidebar-collab-v2-info__container"
			data-testid="im-collab-v2-info"
		>
			<div
				v-if="isLoading"
				class="bx-im-sidebar-collab-v2-info__skeleton"
				data-testid="im-collab-v2-info-skeleton"
				aria-hidden="true"
			></div>
			<div
				ref="embedContainer"
				class="bx-im-sidebar-collab-v2-info__content"
			></div>
		</div>
	`,
};
