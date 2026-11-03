import { Core } from 'im.v2.application.core';
import {
	FakeMessagePrefix,
	ParentChatScope,
	RecentType,
	RestMethod,
	Settings,
	type RecentTypeItem,
} from 'im.v2.const';
import { RecentManager } from 'im.v2.lib.recent';
import { UserManager } from 'im.v2.lib.user';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelRecentItem } from 'im.v2.model';
import {
	BaseRecentService,
	type BaseRecentFilterParams,
	type BaseRecentQueryParams,
	type RecentRestResult,
} from 'im.v2.provider.service.recent';
import {
	type RawMessage,
	type RawRecentConfig,
	type RawRecentItem,
	type RawUser,
} from 'im.v2.provider.service.types';

type BirthdayItems = {
	users: RawUser[],
	messages: RawMessage[],
	recentItems: RawRecentItem[],
};

// The sections the DTO-02 record carries for a row without a chat - the ones a private dialog gets.
const ROW_WITHOUT_CHAT_SECTIONS = [RecentType.default, RecentType.chat];

export class AllFolderRecentService extends BaseRecentService
{
	#folderId: number;
	#birthdaysAssembled: boolean = false;
	#deepestCursor: string = '';
	#destroyed: boolean = false;

	constructor(props: { folderId: number, unreadMode?: boolean })
	{
		super(props);

		this.#folderId = props.folderId;
	}

	// The greeting rows of a day are assembled once: the key repeats in every page of the tail, and
	// from the second page on the assembly can only rediscover rows it has already put in the model.
	loadFirstPage(): Promise
	{
		this.#birthdaysAssembled = false;

		return super.loadFirstPage();
	}

	getRestMethodName(firstPage: boolean): string
	{
		return RestMethod.imV2FolderRecentTail;
	}

	getQueryParams(firstPage: boolean = false): BaseRecentQueryParams
	{
		return {
			folderId: this.#folderId,
			limit: this.getItemsPerPage(),
			filter: this.getRequestFilter(firstPage),
		};
	}

	getRequestFilter(firstPage: boolean = false): BaseRecentFilterParams
	{
		return {
			lastMessageDate: firstPage ? null : this.getLastMessageDate(),
			unread: this.getUnreadMode(),
		};
	}

	// The cursor of the base service is the lower bound of the page it has just read, so rereading the
	// first page would raise it and cut the list back to one page. What the list shows is the depth it
	// has already been given, and that depth only grows: the oldest bound of the session wins.
	handlePaginationField(result: RecentRestResult)
	{
		super.handlePaginationField(result);

		const cursor = super.getLastMessageDate();
		if (cursor !== '' && (this.#deepestCursor === '' || cursor < this.#deepestCursor))
		{
			this.#deepestCursor = cursor;
		}
	}

	getLastMessageDate(): string
	{
		return this.#deepestCursor;
	}

	// Neither the request nor the seeding uses a single section - both are overridden.
	// The inherited RecentType.default would seed the composite tail into the general chat list.
	getRecentType(): ?RecentTypeItem
	{
		return null;
	}

	saveRecentItems(restResult: RecentRestResult): Promise
	{
		if (this.#destroyed)
		{
			return Promise.resolve();
		}

		const birthdayItems = this.#extractBirthdayItems(restResult);
		const seedResult = {
			...restResult,
			recentItems: [...this.#withoutBirthdayPlaceholder(restResult), ...birthdayItems.recentItems],
			recentConfigs: this.#getConfigsForBirthdayRows(restResult, birthdayItems),
		};

		const seedPromises = [...this.#groupItemsBySection(seedResult)].map(([section, items]) => {
			return Core.getStore().dispatch('recent/setCollection', {
				type: section,
				items,
				parentChatId: ParentChatScope.topLevel,
				unread: this.getUnreadMode(),
			});
		});

		return Promise.all([...seedPromises, this.#saveBirthdayAuthors(birthdayItems)]);
	}

	getCollection(): ImModelRecentItem[]
	{
		const sections = Core.getStore().getters['recent/folders/getSourceSections'](this.#folderId);
		const union = Core.getStore().getters['recent/getRootUnionCollection']({
			sections,
			unread: this.getUnreadMode(),
		});

		return this.#cutByCursor(union);
	}

	// The real conversation of a colleague may lie deeper than the page that greeted them, and the model
	// keeps a field the response does not mention. Without this the row stays a placeholder for the rest
	// of the session: out of search and hidden once the greetings are switched off.
	#withoutBirthdayPlaceholder(restResult: RecentRestResult): RawRecentItem[]
	{
		return (restResult.recentItems ?? []).map((recentItem: RawRecentItem) => {
			return { ...recentItem, isBirthdayPlaceholder: false };
		});
	}

	// Today's birthdays come with every tail response, but only the old chat list turns them into rows,
	// so a colleague without a conversation is missing from "All". The row is built here and not in the
	// base service: personal folders have no such rows.
	#extractBirthdayItems(restResult: RecentRestResult): BirthdayItems
	{
		const items: BirthdayItems = { users: [], messages: [], recentItems: [] };

		const { birthdayList = [], recentItems = [] } = restResult;
		// A greeting row carries nothing unread, so it has no place in the unread list.
		if (
			this.getUnreadMode()
			|| this.#birthdaysAssembled
			|| birthdayList.length === 0
			|| !this.#birthdayRowsAllowed()
		)
		{
			return items;
		}

		this.#birthdaysAssembled = true;

		const store = Core.getStore();
		const currentUserId = String(Core.getUserId());
		const deliveredDialogIds = new Set(
			recentItems.map((recentItem: RawRecentItem) => String(recentItem.dialogId)),
		);

		birthdayList.forEach((user: RawUser) => {
			const dialogId = String(user.id);
			// a row of their own - delivered now or by an earlier page - already shows the colleague
			if (dialogId === currentUserId || deliveredDialogIds.has(dialogId) || store.getters['recent/get'](dialogId))
			{
				return;
			}

			const messageId = `${FakeMessagePrefix}-${user.id}`;
			items.users.push(user);
			items.messages.push({ id: messageId });
			// chatId 0 is the key the composition record of a row without a chat comes under
			items.recentItems.push({ id: user.id, chatId: 0, isBirthdayPlaceholder: true, messageId });
		});

		return items;
	}

	// The record for a row without a chat rides the meta-stream gate, and that gate is the "show
	// colleagues" switch, while the greeting row is on the "show birthdays" one. With the first switch
	// off the record does not come and the row would lose its sections silently, so the sections are
	// assumed here - the same ones the record carries, and the same row the old chat list keeps showing.
	#getConfigsForBirthdayRows(restResult: RecentRestResult, birthdayItems: BirthdayItems): RawRecentConfig[]
	{
		const recentConfigs = restResult.recentConfigs ?? [];
		if (birthdayItems.recentItems.length === 0)
		{
			return recentConfigs;
		}

		const hasRowWithoutChatConfig = recentConfigs.some((config: RawRecentConfig) => config.chatId === 0);
		if (hasRowWithoutChatConfig)
		{
			return recentConfigs;
		}

		return [...recentConfigs, { chatId: 0, sections: ROW_WITHOUT_CHAT_SECTIONS }];
	}

	// The server limits the key by the portal option only, the personal switch is the client's to read.
	#birthdayRowsAllowed(): boolean
	{
		return Core.getStore().getters['application/settings/get'](Settings.recent.showBirthday) === true;
	}

	#saveBirthdayAuthors(birthdayItems: BirthdayItems): Promise
	{
		const { users, messages } = birthdayItems;
		if (users.length === 0)
		{
			return Promise.resolve();
		}

		// the profile carries the chat placeholder with it, as it does for the users of the response
		return Promise.all([
			(new UserManager()).setUsersToModel(users),
			Core.getStore().dispatch('messages/store', messages),
		]);
	}

	destroy(): void
	{
		this.#destroyed = true;
	}

	// Composite tail rows arrive flat: a row belongs to every section its chat is listed in.
	// Seeding all of them, not just the folder composition, keeps the model consistent with pull and sync.
	#groupItemsBySection(restResult: RecentRestResult): Map<RecentTypeItem, RawRecentItem[]>
	{
		const { recentItems = [], recentConfigs = [] } = restResult;

		const sectionsByChatId = new Map(
			recentConfigs.map((config: RawRecentConfig) => [config.chatId, config.sections]),
		);

		const itemsBySection = new Map();
		recentItems.forEach((recentItem: RawRecentItem) => {
			const sections = sectionsByChatId.get(recentItem.chatId) ?? [];

			sections.forEach((section: RecentTypeItem) => {
				const sectionItems = itemsBySection.get(section) ?? [];
				sectionItems.push(recentItem);
				itemsBySection.set(section, sectionItems);
			});
		});

		return itemsBySection;
	}

	// The cursor is the lower activity bound of what the tail has already delivered, while source sections
	// may hold older rows loaded elsewhere. An empty cursor (before the first page) means no cut.
	// Pinned rows are never cut - the cursor does not account for them either.
	#cutByCursor(items: ImModelRecentItem[]): ImModelRecentItem[]
	{
		const cursorDate: ?Date = Utils.date.cast(this.getLastMessageDate(), null);
		if (!cursorDate)
		{
			return items;
		}

		return items.filter((item: ImModelRecentItem) => {
			if (item.pinned)
			{
				return true;
			}

			// activity is the scale the server pages by, so the cut shows exactly the delivered depth
			const { dialogId, lastActivityDate } = item;
			if (!lastActivityDate || lastActivityDate >= cursorDate)
			{
				return true;
			}

			// the list shows such a row high regardless of the delivered depth, so the cut must keep it
			return RecentManager.hasFakeActivityDate(dialogId);
		});
	}
}
