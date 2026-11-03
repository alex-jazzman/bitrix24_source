import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { FolderType } from 'im.v2.const';
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
		isComposite(): boolean
		{
			return this.$store.getters['recent/folders/isComposite'](this.folder.id);
		},
		subtitle(): string
		{
			// One line for every personal folder: it describes this surface, not the folder, so the
			// server does not send it.
			if (this.isPersonal)
			{
				return this.loc('IM_MESSENGER_FOLDER_LIST_PERSONAL_ITEM_SUBTITLE');
			}

			return this.folder.description ?? '';
		},
		// The list holds a menu button on every row it lets the user act on, so the name of the button
		// carries the folder: without it the rows are told apart by nothing at all on a screen reader.
		menuAriaLabel(): string
		{
			return this.loc('IM_MESSENGER_FOLDER_LIST_ITEM_MENU_ARIA_LABEL', { '#TITLE#': this.folder.title });
		},
	},
	methods: {
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div
			class="bx-im-folder-list-item__container"
			role="listitem"
			:data-folder-id="folder.id"
			:data-folder-code="folder.code || null"
			data-testid="folder-list-settings-item"
		>
			<BIcon
				:name="OutlineIcons.DRAG_XS"
				:hoverable="true"
				class="bx-im-folder-list-item__handle-icon"
				data-testid="folder-list-settings-item-handle"
			/>
			<div class="bx-im-folder-list-item__text">
				<div
					class="bx-im-folder-list-item__title --ellipsis"
					:title="folder.title"
					data-testid="folder-list-settings-item-title"
				>
					{{ folder.title }}
				</div>
				<div
					class="bx-im-folder-list-item__subtitle --ellipsis"
					:title="subtitle"
					data-testid="folder-list-settings-item-subtitle"
				>
					{{ subtitle }}
				</div>
			</div>
			<button
				v-if="isPersonal || isComposite"
				type="button"
				class="bx-im-folder-list-item__menu-button --focus-visible"
				aria-haspopup="menu"
				:aria-label="menuAriaLabel"
				data-testid="folder-list-settings-item-menu-btn"
				@click="$emit('menuClick', $event.currentTarget)"
			>
				<BIcon
					:name="OutlineIcons.MORE_L"
					:hoverable="true"
					class="bx-im-folder-list-item__menu-icon"
				/>
			</button>
		</div>
	`,
};
