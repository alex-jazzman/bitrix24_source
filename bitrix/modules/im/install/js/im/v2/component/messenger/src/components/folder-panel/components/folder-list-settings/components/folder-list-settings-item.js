import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { FolderType, RecentType } from 'im.v2.const';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { type ImModelFolder } from 'im.v2.model';

import '../css/folder-list-settings-item.css';

// @vue/component
export const FolderListSettingsItem = {
	name: 'FolderListSettingsItem',
	components: { BIcon },
	props: {
		item: {
			type: Object,
			required: true,
		},
	},
	emits: ['menuClick'],
	computed: {
		OutlineIcons: () => OutlineIcons,
		folder(): ImModelFolder
		{
			return this.item;
		},
		isPersonal(): boolean
		{
			return this.folder.type === FolderType.personal;
		},
		subtitle(): string
		{
			if (this.isPersonal)
			{
				return this.loc('IM_MESSENGER_FOLDER_LIST_PERSONAL_ITEM_SUBTITLE');
			}

			const phraseCode = this.getSystemSubtitlePhraseCode();

			return phraseCode ? this.loc(phraseCode) : '';
		},
	},
	methods: {
		getSystemSubtitlePhraseCode(): string
		{
			const isCollabV2Available = FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);

			const phraseCodeByRecentType = {
				[RecentType.default]: isCollabV2Available
					? 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_ALL_V2'
					: 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_ALL',
				[RecentType.taskComments]: 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_TASKS',
				[RecentType.copilot]: 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_COPILOT',
				[RecentType.openChannel]: 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_CHANNELS',
				[RecentType.collab]: isCollabV2Available
					? 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_COLLAB_V2'
					: 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_COLLAB',
				[RecentType.openlines]: 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_OPENLINES',
			};

			return phraseCodeByRecentType[this.folder.code] ?? '';
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-folder-list-item__container" :data-folder-id="folder.id" data-testid="folder-list-settings-item">
			<BIcon
				:name="OutlineIcons.DRAG_XS"
				:hoverable="true"
				class="bx-im-folder-list-item__handle-icon"
			/>
			<div class="bx-im-folder-list-item__text">
				<div class="bx-im-folder-list-item__title --ellipsis" :title="folder.title">
					{{ folder.title }}
				</div>
				<div class="bx-im-folder-list-item__subtitle --ellipsis" :title="subtitle">
					{{ subtitle }}
				</div>
				<button
					v-if="isPersonal"
					type="button"
					class="bx-im-folder-list-item__menu-button"
					aria-haspopup="menu"
					data-testid="folder-list-settings-item-menu-btn"
					@click="$emit('menuClick', $event)"
				>
					<BIcon
						:name="OutlineIcons.MORE_L"
						:hoverable="true"
						class="bx-im-folder-list-item__menu-icon"
					/>
				</button>
			</div>
		</div>
	`,
};
