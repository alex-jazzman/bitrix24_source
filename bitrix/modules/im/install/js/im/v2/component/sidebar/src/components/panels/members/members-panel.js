import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { type BitrixVueComponentProps } from 'ui.vue3';

import { Analytics } from 'im.v2.lib.analytics';
import { ChatType, EventType, SidebarDetailBlock } from 'im.v2.const';
import { AddToChat, AddToCollab } from 'im.v2.component.entity-selector';
import { Loader } from 'im.v2.component.elements.loader';
import { ChatButton, ButtonColor, ButtonSize } from 'im.v2.component.elements.button';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PermissionManager } from 'im.v2.lib.permission';
import { Notifier } from 'im.v2.lib.notifier';
import { ChatManager } from 'im.v2.lib.chat';
import { type ImModelChat } from 'im.v2.model';

import { DetailUser } from './detail-user';
import { DetailHeader } from '../../elements/detail-header/detail-header';
import { DetailEmptyState } from '../../elements/detail-empty-state/detail-empty-state';
import { DetailEmptySearchState } from '../../elements/detail-empty-search-state/detail-empty-search-state';
import { MembersService } from '../../../classes/panels/members';
import { filterMembers } from '../../../classes/panels/helpers/filter-members';
import { MembersMenu } from '../../../classes/context-menu/main/members-menu';

import './css/members-panel.css';

const MemberTitleByChatType = {
	[ChatType.channel]: 'IM_SIDEBAR_MEMBERS_CHANNEL_DETAIL_TITLE',
	[ChatType.openChannel]: 'IM_SIDEBAR_MEMBERS_CHANNEL_DETAIL_TITLE',
	[ChatType.generalChannel]: 'IM_SIDEBAR_MEMBERS_CHANNEL_DETAIL_TITLE',
	default: 'IM_SIDEBAR_MEMBERS_DETAIL_TITLE',
};

// AddToChat/AddToCollab popup content is 400px; the add icon is 22px at the sidebar's right edge.
// Shifting the popup left by (400 - 22) aligns its right edge to the icon so it opens leftward and
// never overflows the viewport (Bug fix: add popup widened the page).
const MEMBERS_ADD_POPUP_OFFSET_LEFT = -378;

// @vue/component
export const MembersPanel = {
	name: 'MembersPanel',
	components: { DetailUser, ChatButton, DetailHeader, DetailEmptyState, DetailEmptySearchState, Loader, AddToChat },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		secondLevel: {
			type: Boolean,
			default: false,
		},
	},
	data(): JsonObject
	{
		return {
			isLoading: false,
			isLoadingAllPages: false,
			hasLoadError: false,
			reloadPending: false,
			isReloading: false,
			showAddToChatPopup: false,
			showAddToChatTarget: null,
			isSearchHeaderOpened: false,
			searchQuery: '',
		};
	},
	computed:
	{
		SidebarDetailBlock: () => SidebarDetailBlock,
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isCollab(): boolean
		{
			return this.dialog.type === ChatType.collab;
		},
		userDialogIds(): string[]
		{
			const users = this.$store.getters['sidebar/members/get'](this.chatId);

			return users.map((userId) => userId.toString());
		},
		isSearchActive(): boolean
		{
			return this.isSearchHeaderOpened && this.searchQuery.trim().length > 0;
		},
		// Descriptors for the pure filter (name + position). Order follows the loaded (server-sorted)
		// list, so clearing the search restores the full list in the server order.
		searchMembers(): {id: string, name: string, position: string}[]
		{
			return this.userDialogIds.map((userDialogId) => {
				const user = this.$store.getters['users/get'](userDialogId, true);

				return {
					id: userDialogId,
					name: user?.name ?? '',
					position: this.$store.getters['users/getPosition'](userDialogId),
				};
			});
		},
		visibleUserDialogIds(): string[]
		{
			if (!this.isSearchActive)
			{
				return this.userDialogIds;
			}

			return filterMembers(this.searchMembers, this.searchQuery).map((member) => member.id);
		},
		showEmptySearchState(): boolean
		{
			// Show the empty state only once the panel is fully loaded (search triggers a full
			// load) and nothing matches; while loading or on error the load/error states take over.
			return this.isSearchActive
				&& !this.isLoading
				&& !this.hasLoadError
				&& !this.hasNextPage
				&& this.visibleUserDialogIds.length === 0;
		},
		hasNextPage(): boolean
		{
			return this.$store.getters['sidebar/members/hasNextPage'](this.chatId);
		},
		panelInited(): boolean
		{
			return this.$store.getters['sidebar/members/getInited'](this.chatId);
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
		title(): string
		{
			let usersInChatCount = this.dialog.userCounter;
			if (usersInChatCount >= 1000)
			{
				usersInChatCount = `${Math.floor(usersInChatCount / 1000)}k`;
			}

			const phrase = MemberTitleByChatType[this.dialog.type] ?? MemberTitleByChatType.default;

			return this.loc(phrase, {
				'#NUMBER#': usersInChatCount,
			});
		},
		needAddButton(): boolean
		{
			return PermissionManager.getInstance().canManageUsersAdd(this.dialogId);
		},
		needCopyLinkButton(): boolean
		{
			if (FeatureManager.isFeatureAvailable(Feature.chatSharedLinkAvailable))
			{
				return false;
			}

			if (!BX.clipboard.isCopySupported())
			{
				return false;
			}

			return !this.isCollab;
		},
		addMembersPopupComponent(): BitrixVueComponentProps
		{
			return this.isCollab ? AddToCollab : AddToChat;
		},
		addPopupConfig(): {offsetTop: number, offsetLeft: number}
		{
			// The add-members icon sits at the right edge of the sidebar; AddToChat/AddToCollab
			// content is ~400px, wider than the 320px sidebar. With offsetLeft 0 the popup would
			// open rightward past the viewport edge and widen the page. Shift it left by ~its width
			// (minus the 22px icon) so its right edge aligns to the icon and it stays inside the
			// viewport, opening into the chat area on the left.
			return {
				offsetTop: 10,
				offsetLeft: MEMBERS_ADD_POPUP_OFFSET_LEFT,
			};
		},
	},
	watch:
	{
		dialogId(dialogId: string)
		{
			this.isSearchHeaderOpened = false;
			this.searchQuery = '';
			this.service = new MembersService({ dialogId });
			void this.loadFirstPage();
		},
		async panelInited(inited: boolean)
		{
			// A pull handler can reset the members model (e.g. collab add/leave clears the loaded
			// members so the grouped first page is re-requested). Reset drops `inited`, so while
			// the panel stays open we re-load the first page to reflect the new order.
			// `isReloading` skips the inited transitions our own reset-recovery causes (no loop).
			if (inited || this.isReloading)
			{
				return;
			}

			// If a page load is in flight, its result (old cursor) will re-populate the model with a
			// partial, mid-list page and flip `inited` back to true - and this watcher will not re-fire.
			// Defer the recovery until the in-flight load settles (see runPendingReload).
			if (this.isLoading)
			{
				this.reloadPending = true;

				return;
			}

			// The pull handler already reset the model, so the first page is clean.
			await this.reloadAfterReset(false);
		},
	},
	created()
	{
		this.contextMenu = new MembersMenu({ emitter: this.getEmitter() });
		this.service = new MembersService({ dialogId: this.dialogId });
		void this.loadFirstPage();
	},
	beforeUnmount()
	{
		this.contextMenu.destroy();
	},
	methods:
	{
		async loadFirstPage()
		{
			if (this.panelInited || this.isLoading)
			{
				return;
			}

			this.isLoading = true;
			this.hasLoadError = false;
			try
			{
				this.chats = await this.service.loadFirstPage();
			}
			catch
			{
				this.hasLoadError = true;
			}
			finally
			{
				this.isLoading = false;
				this.runPendingReload();
			}
		},
		async reloadAfterReset(needsReset: boolean)
		{
			this.isReloading = true;
			try
			{
				// A deferred recovery runs after an in-flight page settled: the model then holds a
				// stale partial page (and a mid-list cursor), so drop it before re-requesting page one.
				if (needsReset)
				{
					this.$store.dispatch('sidebar/members/reset', { chatId: this.chatId });
				}

				await this.loadFirstPage();

				// Re-run the eager full load if the search is open, so the client-side filter sees the
				// whole list. On failure the error state + retry take over.
				if (this.isSearchHeaderOpened && !this.hasLoadError)
				{
					await this.loadAllPages();
				}
			}
			finally
			{
				this.isReloading = false;
			}
		},
		runPendingReload()
		{
			// A reset arrived while a load was in flight (see the panelInited watcher). Now that the
			// load settled, recover to a clean first page, dropping the stale in-flight page.
			if (this.reloadPending)
			{
				this.reloadPending = false;
				void this.reloadAfterReset(true);
			}
		},
		isOwner(userDialogId: string): boolean
		{
			const userId = Number.parseInt(userDialogId, 10);

			return this.dialog.ownerId === userId;
		},
		isManager(userDialogId: string): boolean
		{
			const userId = Number.parseInt(userDialogId, 10);

			return this.dialog.managerList.includes(userId);
		},
		onContextMenuClick(event)
		{
			const user = this.$store.getters['users/get'](event.userDialogId, true);
			const item = {
				user,
				dialog: this.dialog,
			};

			this.contextMenu.openMenu(item, event.target);
		},
		onCopyInviteClick()
		{
			const chatLink = ChatManager.buildChatLink(this.dialogId);
			if (BX.clipboard.copy(chatLink))
			{
				Notifier.onCopyLinkComplete();
			}

			Analytics.getInstance().chatInviteLink.onCopyMembersPanel(this.dialogId);
		},
		onBackClick()
		{
			this.getEmitter().emit(EventType.sidebar.close, { panel: SidebarDetailBlock.members });
		},
		needToLoadNextPage(event: Event): boolean
		{
			const target = event.target;
			const isAtThreshold = target.scrollTop + target.clientHeight >= target.scrollHeight - target.clientHeight;

			return isAtThreshold && this.hasNextPage;
		},
		async onScroll(event: Event)
		{
			this.contextMenu.destroy();

			if (this.isLoading || this.hasLoadError || !this.needToLoadNextPage(event))
			{
				return;
			}

			await this.loadNextPage();
		},
		async loadNextPage()
		{
			this.isLoading = true;
			this.hasLoadError = false;
			try
			{
				await this.service.loadNextPage();
			}
			catch
			{
				this.hasLoadError = true;
			}
			finally
			{
				this.isLoading = false;
				this.runPendingReload();
			}
		},
		async onRetryClick()
		{
			// Retry re-requests the page that failed without reloading the page.
			// The already loaded members stay in the model, so first-page vs next-page is decided
			// by whether the panel is inited: not inited -> the initial page failed.
			// Invariant: panelInited === true means the first page loaded successfully, because
			// `requestPage` throws before `updateModels` (which is what flips inited to true).
			if (this.panelInited)
			{
				await this.loadNextPage();
			}
			else
			{
				await this.loadFirstPage();
			}

			// If the failure happened while eagerly filling the list for search, keep loading the
			// remaining pages after a successful retry so the client-side filter sees everyone.
			if (this.isSearchHeaderOpened && !this.hasLoadError)
			{
				await this.loadAllPages();
			}
		},
		onChangeQuery(query: string)
		{
			this.searchQuery = query;
		},
		async toggleSearchPanelOpened()
		{
			this.isSearchHeaderOpened = !this.isSearchHeaderOpened;
			if (!this.isSearchHeaderOpened)
			{
				this.searchQuery = '';

				return;
			}

			// The filter is client-side, so the full member list must be loaded before it can be
			// trusted. Eagerly fetch the remaining pages; on failure the error state + retry
			// take over instead of silently filtering a partial list.
			await this.loadAllPages();
		},
		async loadAllPages()
		{
			// Guard against two concurrent full-load cycles (e.g. search toggle + reset recovery)
			// issuing loadNextPage with the same cursor - a duplicate request.
			if (this.isLoadingAllPages)
			{
				return;
			}

			this.isLoadingAllPages = true;
			try
			{
				while (this.hasNextPage && !this.hasLoadError)
				{
					// Sequential paging: each page depends on the cursor from the previous response, so awaits run in order.
					// eslint-disable-next-line no-await-in-loop
					await this.loadNextPage();
				}
			}
			finally
			{
				this.isLoadingAllPages = false;
			}
		},
		onAddClick(event)
		{
			Analytics.getInstance().userAdd.onChatSidebarClick(this.dialogId);
			this.showAddToChatPopup = true;
			this.showAddToChatTarget = event.target;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-sidebar-main-detail__scope">
			<DetailHeader
				:dialogId="dialogId"
				:title="title"
				:secondLevel="secondLevel"
				:withAddButton="needAddButton"
				:addButtonAsIcon="true"
				:isSearchHeaderOpened="isSearchHeaderOpened"
				:searchPlaceholder="'IM_SIDEBAR_MEMBERS_SEARCH_PLACEHOLDER'"
				:searchInputTestId="'im-sidebar-members-search-input'"
				:delayForFocusOnStart="0"
				withSearch
				@changeQuery="onChangeQuery"
				@toggleSearchPanelOpened="toggleSearchPanelOpened"
				@addClick="onAddClick"
				@back="onBackClick"
			/>
			<div class="bx-im-sidebar-detail__container bx-im-sidebar-main-detail__container" @scroll="onScroll">
				<div v-if="needCopyLinkButton && !isSearchHeaderOpened" class="bx-im-sidebar-main-detail__invitation-button-container">
					<ChatButton
						:text="loc('IM_SIDEBAR_COPY_INVITE_LINK')"
						:size="ButtonSize.M"
						:color="ButtonColor.PrimaryBorder"
						:isRounded="true"
						:isUppercase="false"
						icon="link"
						@click="onCopyInviteClick"
					/>
				</div>
				<DetailUser
					v-for="userDialogId in visibleUserDialogIds"
					:key="userDialogId"
					:dialogId="userDialogId"
					:contextDialogId="dialogId"
					:isOwner="isOwner(userDialogId)"
					:isManager="isManager(userDialogId)"
					:highlightQuery="isSearchActive ? searchQuery.trim() : ''"
					@contextMenuClick="onContextMenuClick"
				/>
				<DetailEmptySearchState
					v-if="showEmptySearchState"
					:title="loc('IM_SIDEBAR_MEMBERS_SEARCH_NOT_FOUND_TITLE')"
					:subTitle="loc('IM_SIDEBAR_MEMBERS_SEARCH_NOT_FOUND_SUBTITLE')"
					role="status"
					aria-live="polite"
					data-testid="im-sidebar-members-search-empty"
				/>
				<Loader v-if="isLoading" class="bx-im-sidebar-detail__loader-container" />
				<div
					v-else-if="hasLoadError"
					class="bx-im-sidebar-main-detail__error-container"
					data-testid="im-sidebar-members-error"
					role="alert"
				>
					<DetailEmptyState
						:title="loc('IM_SIDEBAR_MEMBERS_LOAD_ERROR')"
						:iconType="SidebarDetailBlock.messageSearch"
						data-testid="im-sidebar-members-error-message"
					/>
					<ChatButton
						:text="loc('IM_SIDEBAR_MEMBERS_LOAD_ERROR_RETRY')"
						:size="ButtonSize.M"
						:color="ButtonColor.PrimaryBorder"
						:isRounded="true"
						:isUppercase="false"
						data-testid="im-sidebar-members-retry-btn"
						@click="onRetryClick"
					/>
				</div>
			</div>
			<component
				v-if="showAddToChatPopup"
				:is="addMembersPopupComponent"
				:bindElement="showAddToChatTarget || {}"
				:dialogId="dialogId"
				:popupConfig="addPopupConfig"
				@close="showAddToChatPopup = false"
			/>
		</div>
	`,
};
