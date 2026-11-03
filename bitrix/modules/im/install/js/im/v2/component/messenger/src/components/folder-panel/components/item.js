import { CounterSize, CounterStyle } from 'ui.cnt';
import { BIcon, Solid as SolidIcons } from 'ui.icon-set.api.vue';
import { Counter as BCounter } from 'ui.vue3.components.counter';

import 'ui.icon-set.solid';
import 'ui.system.highlighter';

import { FolderType, SystemFolderCode } from 'im.v2.const';
import { type ImModelFolder } from 'im.v2.model';
import { CounterManager } from 'im.v2.lib.counter';
import { FolderManager } from 'im.v2.lib.folder';

import { isSelectedFolder } from '../functions/layout';

import '../css/item.css';

// @vue/component
export const PanelItem = {
	name: 'PanelItem',
	components: { BCounter, BIcon },
	props: {
		item: {
			type: Object,
			required: true,
		},
		highlighted: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return { CounterSize, CounterStyle };
	},
	computed: {
		folder(): ImModelFolder
		{
			return this.item;
		},
		isSelected(): boolean
		{
			return isSelectedFolder(this.folder);
		},
		isSystemFolder(): boolean
		{
			return this.folder.type === FolderType.system;
		},
		counter(): number
		{
			const { definition } = this.folder;
			if (this.$store.getters['recent/folders/isComposite'](this.folder.id))
			{
				const sourceDefinitions = this.$store.getters['recent/folders/getSourceDefinitions'](this.folder.id);

				return this.$store.getters['counters/getCounterByRecentSections'](sourceDefinitions);
			}

			if (this.isSystemFolder)
			{
				const folderRecentType = definition.recentSection;

				return this.$store.getters['counters/getCounterByRecentType'](folderRecentType);
			}

			const folderChatIds = definition.chats.map((chat) => chat.chatId);

			return this.$store.getters['counters/getTotalCounterByIdsWithChildren'](folderChatIds);
		},
		showCounter(): boolean
		{
			// "Channels" is a company-wide showcase folder, not a personal one, so no unread counter there
			return this.counter > 0 && this.folder.code !== SystemFolderCode.openChannel;
		},
		maxCounterValue(): number
		{
			return CounterManager.getCounterDisplayLimit() - 1;
		},
		containerClasses(): Record<string, boolean>
		{
			return { '--selected': this.isSelected, 'ui-highlighter': this.highlighted };
		},
		iconName(): string
		{
			// A personal folder has no system code, so the map of the library has nothing to answer for it
			return this.isSystemFolder ? FolderManager.getFolderIcon(this.folder.code) : SolidIcons.CHATS;
		},
		// The colour BitrixGPT logo the tile draws is a temporary stand-in: the design system carries no
		// colour glyph for this folder yet.
		isCopilotFolder(): boolean
		{
			return this.isSystemFolder && this.folder.code === SystemFolderCode.copilot;
		},
		// The badge stands before the title in the DOM and the glyph says nothing at all, so the name of
		// the tile is spelled out: read off the content it would come out as "1 All".
		ariaLabel(): string
		{
			if (!this.showCounter)
			{
				return this.folder.title;
			}

			// A locale that has no phrase gets an empty string back from Loc, and an empty name is no name
			// at all: the reader falls back to the content and says "1 All". The title alone stands in.
			const phrase = this.loc('IM_MESSENGER_FOLDER_PANEL_ITEM_UNREAD_ARIA_LABEL');
			if (!phrase)
			{
				return this.folder.title;
			}

			// The real number and not the capped one the badge draws: "99+" is a size of the badge.
			// The phrase is filled in a single pass, because Loc fills it in as many passes as there are
			// placeholders: a folder named "#count#" would land in the title and be read as the number.
			const values = new Map([
				['#TITLE#', this.folder.title],
				['#COUNT#', String(this.counter)],
			]);

			return phrase
				.replaceAll(/#TITLE#|#COUNT#/gi, (placeholder: string) => values.get(placeholder.toUpperCase()));
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<button
			type="button"
			class="bx-im-messenger-folder-panel__item --focus-visible"
			:class="containerClasses"
			:aria-label="ariaLabel"
			:aria-current="isSelected ? 'true' : null"
			aria-haspopup="menu"
			data-testid="folder-panel-item"
			:data-folder-code="folder.code || null"
		>
			<BIcon
				:name="iconName"
				class="bx-im-messenger-folder-panel-item__glyph"
				:class="{ '--bitrix-gpt-logo': isCopilotFolder }"
				data-testid="folder-panel-item-icon"
			/>
			<div
				v-if="showCounter"
				class="bx-im-messenger-folder-panel-item__counter"
				data-testid="folder-panel-counter"
			>
				<BCounter
					:value="counter"
					:maxValue="maxCounterValue"
					:style="CounterStyle.FILLED"
					:size="CounterSize.MEDIUM"
				/>
			</div>
			<div
				class="bx-im-messenger-folder-panel-item__title --ellipsis"
				:title="folder.title"
				data-testid="folder-panel-item-title"
			>
				{{ folder.title }}
			</div>
		</button>
	`,
};
