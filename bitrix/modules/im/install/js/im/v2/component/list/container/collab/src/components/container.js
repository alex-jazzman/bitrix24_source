import { CreateChatPromo } from 'im.v2.component.list.container.elements.create-chat-promo';
import { CreateChatButton } from 'im.v2.component.list.container.elements.create-chat-button';
import { CollabList } from 'im.v2.component.list.items.collab';
import { Layout, ChatType, ActionByUserType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { CreateChatManager } from 'im.v2.lib.create-chat';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Logger } from 'im.v2.lib.logger';
import { PermissionManager } from 'im.v2.lib.permission';

import '../css/container.css';

// @vue/component
export const CollabListContainer = {
	name: 'CollabListContainer',
	components: { CollabList, CreateChatPromo, CreateChatButton },
	emits: ['selectChat'],
	computed:
	{
		ChatType: () => ChatType,
		canCreate(): boolean
		{
			const creationAvailable = FeatureManager.isFeatureAvailable(Feature.collabCreationAvailable);
			const hasAccess = PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createCollab);

			return creationAvailable && hasAccess;
		},
	},
	created()
	{
		Logger.warn('List: Collab container created');
	},
	methods:
	{
		onSelectChat(dialogId: string): void
		{
			this.$emit('selectChat', { layoutName: Layout.collab, dialogId });
		},
		onCreateClick(): void
		{
			Analytics.getInstance().chatCreate.onStartClick(ChatType.collab);
			this.startCollabCreation();
		},
		startCollabCreation()
		{
			void CreateChatManager.getInstance().startChatCreation(ChatType.collab);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-container-collab__container">
			<div class="bx-im-list-container-collab__header_container">
				<div class="bx-im-list-container-collab__header_title">
					{{ loc('IM_LIST_CONTAINER_COLLAB_HEADER_TITLE') }}
				</div>
				<CreateChatButton
					v-if="canCreate"
					@click="onCreateClick"
					class="bx-im-list-container-collab__header_create-collab"
				/>
			</div>
			<div class="bx-im-list-container-collab__elements_container">
				<div class="bx-im-list-container-collab__elements">
					<CollabList @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
	`,
};
