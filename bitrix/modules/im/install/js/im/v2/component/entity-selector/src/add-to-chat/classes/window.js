import { Dom, Loc } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import {
	Dialog as SelectorDialog,
	type EntityOptions,
	type Item as SelectorItem,
	type ItemNode as SelectorItemNode,
	type ItemOptions,
	type TagSelector,
} from 'ui.entity-selector';

import { Core } from 'im.v2.application.core';
import { SearchEntityIdTypes, SelectorEntity, type SelectorEntityItem, TabId } from 'im.v2.const';
import {
	getEntitiesConfig,
	isLinkableNodeEntity,
	isPersonEntity,
	offersStructureNodes,
	type EntitySelectorConfigOptions,
} from 'im.v2.lib.entity-selector-config';

import { GuestsStub } from './guests-stub';
import { compareRecentNodes, getMessengerRecentItems } from './messenger-recent';
import { compareSearchNodes } from './search-order';

// The context the chat forms keep their selector history in: a department or a team picked while
// creating or editing a chat stands in the recent tab here as well, and the other way round.
const SELECTOR_CONTEXT = 'IM_CHAT_CREATE';
const RECENT_TAB_OPTIONS = { itemOrder: compareRecentNodes };
const SEARCH_TAB_OPTIONS = { itemOrder: compareSearchNodes };
const DEFAULT_WITH_TEAMS = true;
const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 519;
const TAB_LABELS_WIDTH = 38;
const TAG_SELECTOR_MAX_HEIGHT = 111;
const WINDOW_CLASS = 'bx-im-messenger__scope bx-im-entity-selector-add-to-chat__scope';
const GUEST_TAB_CLASS = 'bx-im-entity-selector-add-to-chat__guest-tab';

// Where in the window a person was picked. The window knows the list and the place in it; what the
// pair means to the metrics is decided by the one that sends them.
export type SelectedUserParams = {
	fromRecentTab: boolean,
	position: number,
};

export type AddToChatWindowOptions = {
	bindElement: HTMLElement,
	dialogId: string,
	chatType: string,
	structureTarget?: string,
	withTeams?: boolean,
	title: string,
	offsetTop: number,
	offsetLeft: number,
	headerContainer: HTMLElement,
	footerContainer: HTMLElement,
	guestsContainer: HTMLElement,
	onHide: () => void,
	onSelectionChange: () => void,
	onUserSelect: (params: SelectedUserParams) => void,
	onSearchInput: () => void,
};

export class AddToChatWindow
{
	#options: AddToChatWindowOptions;
	#tagSelector: TagSelector;
	#dialog: SelectorDialog;

	constructor(options: AddToChatWindowOptions)
	{
		this.#options = options;
		this.#dialog = this.#createDialog();
		this.#tagSelector = this.#requireTagSelector();
		this.#fillRecentTab();
		this.#showGuestsStub();
	}

	getTagSelector(): TagSelector
	{
		return this.#tagSelector;
	}

	show()
	{
		this.#dialog.show();
	}

	destroy()
	{
		this.#dialog.destroy();
	}

	toggleGuestTab(isGuestTab: boolean)
	{
		const windowContainer = this.#dialog.getContainer();
		if (isGuestTab)
		{
			this.#dialog.selectTab(TabId.guests);
			Dom.addClass(windowContainer, GUEST_TAB_CLASS);

			return;
		}

		this.#dialog.selectFirstTab();
		Dom.removeClass(windowContainer, GUEST_TAB_CLASS);
	}

	setAutoHide(autoHide: boolean)
	{
		this.#dialog.setAutoHide(autoHide);
	}

	getSelectedItemCount(): number
	{
		return this.#dialog.getSelectedItems().length;
	}

	getSelectedUserIds(): number[]
	{
		const userIds = this.#dialog.getSelectedItems()
			.map((item: SelectorItem) => this.#getUserId(item))
			.filter((userId: number | null) => userId !== null)
		;

		return [...new Set(userIds)];
	}

	getSelectedStructureNodes(): SelectorEntityItem[]
	{
		return this.#dialog.getSelectedItems()
			.filter((item: SelectorItem) => isLinkableNodeEntity(item.getEntityId()))
			.map((item: SelectorItem) => [item.getEntityId(), item.getId()])
		;
	}

	#handleItemSelect(event: BaseEvent)
	{
		const { item, node } = event.getData();

		this.#dropSelectionTwin(item);
		this.#reportUserSelect(item, node ?? null);
		this.#options.onSelectionChange();
	}

	// The same person stands in the recent tab as a chat of the messenger and in the search results
	// as a user of the portal: two entities of the dialog, two items and two tags for one addition.
	// The pick just made is the one that stays, so the field shows the person once and the footer
	// counts them once. A bot is offered by the search alone, so it never stands twice.
	#dropSelectionTwin(item: SelectorItem)
	{
		if (item.getEntityId() === SelectorEntity.user)
		{
			this.#dialog.getItem([SelectorEntity.recent, this.#getUserId(item)])?.deselect();

			return;
		}

		if (this.#isRecentUser(item))
		{
			this.#dialog.getItem([SelectorEntity.user, this.#getUserId(item)])?.deselect();
		}
	}

	// The two picks the window is asked about: a person taken from the recent list and a person found
	// by search. A node of the org structure is neither, and a selection made without a row of the
	// list behind it — a preselection, a tag restored — comes with no place to name.
	#reportUserSelect(item: SelectorItem, node: SelectorItemNode | null)
	{
		if (this.#getUserId(item) === null)
		{
			return;
		}

		const tab = node?.getTab();
		const fromRecentTab = tab === this.#dialog.getRecentTab();
		if (!fromRecentTab && tab !== this.#dialog.getSearchTab())
		{
			return;
		}

		this.#options.onUserSelect({ fromRecentTab, position: this.#getNodePosition(node) });
	}

	// The place of the row in the list it was picked from, counted from one the way the window these
	// metrics come from has always counted it.
	#getNodePosition(node: SelectorItemNode): number
	{
		const parentNode = node.getParentNode();
		if (!parentNode)
		{
			return 1;
		}

		return Math.max(parentNode.getChildren().getIndex(node), 0) + 1;
	}

	#getUserId(item: SelectorItem): number | null
	{
		if (isPersonEntity(item.getEntityId()))
		{
			return Number(item.getId());
		}

		if (this.#isRecentUser(item))
		{
			return Number(item.getCustomData().get('id'));
		}

		return null;
	}

	#isRecentUser(item: SelectorItem): boolean
	{
		return item.getEntityId() === SelectorEntity.recent
			&& item.getEntityType() === SearchEntityIdTypes.imUser;
	}

	#requireTagSelector(): TagSelector
	{
		const tagSelector = this.#dialog.getTagSelector();
		if (!tagSelector)
		{
			throw new Error('AddToChatWindow: dialog has not created a tag selector');
		}

		return tagSelector;
	}

	#showGuestsStub()
	{
		this.#dialog.getTab(TabId.guests)?.getStub()?.show();
	}

	// The dialog would show the recent tab empty until ui.entityselector.load answers. The messenger
	// already holds that list, so the rows go up with the window and the answer only refines them.
	#fillRecentTab()
	{
		const items = getMessengerRecentItems(this.#getConfigOptions())
			.map((itemOptions: ItemOptions) => this.#dialog.addItem(itemOptions))
		;

		this.#dialog.getRecentTab().getRootNode().addItems(items);
	}

	#placeWindow()
	{
		this.#dialog.getPopup().setOffset({
			offsetTop: this.#options.offsetTop,
			offsetLeft: this.#options.offsetLeft + TAB_LABELS_WIDTH,
		});
	}

	#createDialog(): SelectorDialog
	{
		return new SelectorDialog({
			context: SELECTOR_CONTEXT,
			entities: this.#getEntitiesConfig(),
			recentTabOptions: { ...RECENT_TAB_OPTIONS },
			searchTabOptions: { ...SEARCH_TAB_OPTIONS },
			targetNode: this.#options.bindElement,
			ariaLabel: this.#options.title,
			width: WINDOW_WIDTH,
			height: WINDOW_HEIGHT,
			header: this.#options.headerContainer,
			headerOptions: { containerClass: 'bx-im-entity-selector-add-to-chat__header' },
			footer: this.#options.footerContainer,
			footerOptions: { containerClass: 'bx-im-entity-selector-add-to-chat__footer' },
			// The field has to belong to the dialog: given a tag selector from outside, the dialog
			// treats every Tab in the field as a jump into itself and the window loops on two nodes.
			enableSearch: true,
			tagSelectorOptions: {
				maxHeight: TAG_SELECTOR_MAX_HEIGHT,
				placeholder: this.#getPlaceholder(),
				// the dialog would keep 105px for the text box, wrapping the tags a line earlier
				textBoxWidth: null,
				events: {
					onInput: () => this.#options.onSearchInput(),
				},
			},
			tabs: [{
				id: TabId.guests,
				visible: false,
				stub: GuestsStub,
				stubOptions: { autoShow: false, content: this.#options.guestsContainer },
			}],
			popupOptions: {
				className: WINDOW_CLASS,
				events: { onFirstShow: () => this.#placeWindow() },
			},
			events: {
				onHide: () => this.#options.onHide(),
				onLoad: () => this.#dropCurrentUser(),
				'SearchTab:onLoad': () => this.#dropCurrentUser(),
				'Item:onSelect': (event: BaseEvent) => this.#handleItemSelect(event),
				'Item:onDeselect': () => this.#options.onSelectionChange(),
			},
		});
	}

	#dropCurrentUser()
	{
		const userId = Core.getUserId();

		[SelectorEntity.recent, SelectorEntity.user].forEach((entityId: string) => {
			this.#dialog.removeItem([entityId, userId]);
		});
	}

	// The field promises no more than the window puts up. Where no node of the org structure can be
	// picked - the one to one chat above all, whose "+" builds a group chat of the people alone - a
	// department named in the field would be a promise the chat cannot keep.
	#getPlaceholder(): string
	{
		if (offersStructureNodes(this.#getConfigOptions()))
		{
			return Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_SEARCH_PLACEHOLDER');
		}

		return Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_SEARCH_PLACEHOLDER_PEOPLE');
	}

	#getEntitiesConfig(): EntityOptions[]
	{
		return getEntitiesConfig(this.#getConfigOptions());
	}

	#getConfigOptions(): EntitySelectorConfigOptions
	{
		return {
			dialogId: this.#options.dialogId,
			chatType: this.#options.chatType,
			structureTarget: this.#options.structureTarget,
			withTeams: this.#options.withTeams ?? DEFAULT_WITH_TEAMS,
			withRecent: true,
			invitationPopup: true,
		};
	}
}
