/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, ui_designTokens, ui_fonts_opensans, im_v2_component_elements_loader, im_v2_component_elements_scrollWithGradient, im_v2_const, im_v2_lib_a11y, im_v2_lib_analytics, im_v2_lib_utils, im_v2_application_core, im_v2_lib_search, im_v2_lib_menu, im_v2_provider_service_chat, im_v2_component_elements_avatar, im_v2_component_elements_chatTitle, im_v2_component_elements_searchItemLayout, im_v2_lib_dateFormatter, im_v2_lib_textHighlighter, im_v2_lib_collab, im_v2_provider_service_search, im_v2_component_elements_searchInput) {
	'use strict';

	const NavigationSection = Object.freeze({
		carousel: 'carousel',
		list: 'list'
	});

	/**
	 * Identity of an item of the traversal order is the pair (section, dialogId) and never the dialogId
	 * alone: the same interlocutor may be present in the carousel and in the list at once.
	 */

	function sameDescriptor(first, second) {
		return first.section === second.section && first.dialogId === second.dialogId;
	}
	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}
	function toCarouselDescriptors(dialogIds) {
		return dialogIds.map(dialogId => ({
			section: NavigationSection.carousel,
			dialogId
		}));
	}
	function toListDescriptors(items) {
		return items.map(({
			dialogId
		}) => ({
			section: NavigationSection.list,
			dialogId
		}));
	}

	/**
	 * Traversal order of the search results: the index of a descriptor here is its data-nav-index.
	 *
	 * The branch is taken by `showLatestSearchResult`, the very value the template branches on, so the
	 * order can never disagree with the rendered markup. On a whitespace-only query the user sees the
	 * carousel and the recent list while `searchResult` is already empty, and the order follows the markup.
	 */
	function buildOrder(state) {
		if (!state.showLatestSearchResult) {
			return toListDescriptors(state.searchResult);
		}
		return [...toCarouselDescriptors(state.carouselItems), ...toListDescriptors(state.recentItems)];
	}

	/**
	 * Single keyboard cursor over the whole search results: exactly one item is active at any moment, or
	 * none at all while the results are empty. The carousel is one row horizontally, the lists are one row
	 * per item; the cursor stops at the bounds instead of wrapping around.
	 *
	 * Knows nothing about keys, Vue or the DOM - it only takes intents.
	 */
	class SearchNavigationController {
		#order = [];
		#activeIndex = null;
		// Standing on the anchor is where the cursor starts, not where the user put it: only a movement of
		// this visit makes the position a choice of the user's, and only a choice is worth preserving. A
		// choice whose item is gone from the results is not one either, so falling back to the anchor drops
		// this as much as starting over does.
		#isMoved = false;
		// The remembered tile the cursor left downwards, not a movement bound: clamping moveLeft/moveRight by
		// it would make the carousel impassable to the right (from the very first tile clamp(1, 0, 0) === 0).
		#carouselReturnIndex = 0;
		getActive() {
			return this.#activeIndex === null ? null : this.#order[this.#activeIndex] ?? null;
		}
		getActiveIndex() {
			return this.#activeIndex;
		}

		/**
		 * Rebuild of the same query: server results arrived, the store changed. A cursor the user has moved holds
		 * on to its own item so the results do not jump under the user's fingers; a cursor with no item of its own
		 * -- an untouched one, or one whose item is gone from the new order -- takes the anchor, so the index never
		 * points past the array.
		 */
		setOrder(order) {
			const ownItem = this.#isMoved ? this.getActive() : null;
			this.#order = order;
			if (this.#order.length === 0) {
				this.#activeIndex = null;
				this.#carouselReturnIndex = 0;
				return;
			}
			const ownItemIndex = this.#indexOfOwnItem(ownItem);

			// The cursor owns a position only while the item it was put on is still in the results: once that
			// item is gone the anchor it falls back to is no choice of the user's, and the next rebuild
			// re-anchors it the way it would an untouched one.
			this.#isMoved = ownItemIndex !== null;
			this.#activeIndex = ownItemIndex ?? this.#getAnchorIndex();
			this.#carouselReturnIndex = this.#clampToCarousel(this.#carouselReturnIndex);
			this.#rememberIfInCarousel();
		}

		/** Query changed or the search was just entered: the cursor starts over from its anchor. */
		reset() {
			this.#activeIndex = this.#getAnchorIndex();
			this.#carouselReturnIndex = 0;
			this.#isMoved = false;
		}
		moveDown() {
			if (this.#activeIndex === null) {
				return;
			}
			this.#isMoved = true;
			this.#activeIndex = this.#getIndexBelow(this.#activeIndex);
			this.#rememberIfInCarousel();
		}
		moveUp() {
			if (this.#activeIndex === null) {
				return;
			}
			this.#isMoved = true;
			this.#activeIndex = this.#getIndexAbove(this.#activeIndex);
			this.#rememberIfInCarousel();
		}
		moveLeft() {
			this.#moveAlongCarousel(-1);
		}
		moveRight() {
			this.#moveAlongCarousel(1);
		}
		moveToStart() {
			if (this.#activeIndex === null) {
				return;
			}
			this.#isMoved = true;
			this.#activeIndex = 0;
			this.#rememberIfInCarousel();
		}
		moveToEnd() {
			if (this.#activeIndex === null) {
				return;
			}
			this.#isMoved = true;
			this.#activeIndex = this.#getLastIndex();
			this.#rememberIfInCarousel();
		}

		// Post-operation of every movement: a tile is only ever reached by moving onto it, so by the time
		// the cursor leaves the carousel downwards the memory already points at the tile it left from.
		#rememberIfInCarousel() {
			if (this.#activeIndex !== null && this.#isInCarousel(this.#activeIndex)) {
				this.#carouselReturnIndex = this.#activeIndex;
			}
		}
		#getIndexBelow(index) {
			if (this.#isInCarousel(index)) {
				// The carousel is a single row: down leaves it for the list, and stays put when there is none.
				return this.#getListFirstIndex() ?? index;
			}
			return Math.min(index + 1, this.#getLastIndex());
		}
		#getIndexAbove(index) {
			const listFirstIndex = this.#getListFirstIndex();
			if (index === listFirstIndex && this.#hasCarousel()) {
				return this.#carouselReturnIndex;
			}
			if (this.#isInCarousel(index)) {
				return index;
			}
			return Math.max(index - 1, listFirstIndex ?? 0);
		}
		#moveAlongCarousel(step) {
			if (this.#activeIndex === null || !this.#isInCarousel(this.#activeIndex)) {
				return;
			}
			this.#isMoved = true;
			this.#activeIndex = this.#clampToCarousel(this.#activeIndex + step);
			this.#rememberIfInCarousel();
		}
		#clampToCarousel(index) {
			const carouselLastIndex = this.#getCarouselLastIndex();
			return carouselLastIndex === null ? 0 : clamp(index, 0, carouselLastIndex);
		}

		/**
		 * Where a cursor with no item of its own stands: on the first row of the list, and on the head of the order
		 * only when the results hold no list at all. The mark is drawn on this item and Enter opens this item, so
		 * both answers are taken from here and cannot part ways. The carousel is left one step up: its tiles are
		 * reached by ArrowUp from the row the cursor starts on.
		 */
		#getAnchorIndex() {
			if (this.#order.length === 0) {
				return null;
			}
			return this.#getListFirstIndex() ?? 0;
		}
		#indexOfOwnItem(descriptor) {
			if (!descriptor) {
				return null;
			}
			const index = this.#order.findIndex(item => sameDescriptor(item, descriptor));
			return index === -1 ? null : index;
		}
		#isInCarousel(index) {
			return this.#order[index]?.section === NavigationSection.carousel;
		}
		#hasCarousel() {
			return this.#getCarouselLastIndex() !== null;
		}
		#getCarouselLastIndex() {
			// The carousel always heads the order, so its tiles occupy the indexes 0..tilesCount - 1.
			const tilesCount = this.#order.filter(item => item.section === NavigationSection.carousel).length;
			return tilesCount === 0 ? null : tilesCount - 1;
		}
		#getListFirstIndex() {
			const index = this.#order.findIndex(item => item.section === NavigationSection.list);
			return index === -1 ? null : index;
		}
		#getLastIndex() {
			return this.#order.length - 1;
		}
	}

	// The carousel holds six tiles at most: the notes chat plus up to five interlocutors.
	const CAROUSEL_USERS_LIMIT = 5;

	/**
	 * Composition of the recent chats carousel in the order its tiles are rendered: the notes chat first, then
	 * the most recent interlocutors. The only place the chat of the notes tile is worked out - the tile itself
	 * and the traversal order both take it from here, so a click and an Enter on that tile cannot part ways.
	 */
	function getCarouselItems() {
		const notesDialogId = im_v2_application_core.Core.getUserId().toString();
		const userDialogIds = im_v2_lib_search.getUsersFromRecentItems({
			withFakeUsers: false,
			userLimit: CAROUSEL_USERS_LIMIT
		}).map(({
			dialogId
		}) => dialogId);
		return [notesDialogId, ...userDialogIds];
	}

	const getFirstItemFromSearchResults = ({
		searchResult,
		recentItems
	}) => {
		if (searchResult.length > 0) {
			return searchResult[0];
		}
		if (recentItems.length > 0) {
			return recentItems[0];
		}
		return null;
	};

	/**
	 * Fail closed: an unaddressed area (imopenlines, popups) must never be driven by another area's input,
	 * and two empty ids must not read as a match. The rule is the whole safety of the search channels, so it
	 * lives here alone - a third subscriber gets it by calling, not by copying.
	 */
	function isOwnSearchArea(searchAreaId, ownSearchAreaId) {
		return main_core.Type.isStringFilled(searchAreaId) && searchAreaId === ownSearchAreaId;
	}

	const ID_PREFIX = 'bx-im-search';
	function encodeIdPart(value) {
		const encodedValue = [...String(value)].map(character => character.codePointAt(0).toString(16)).join('-');
		return encodedValue || 'empty';
	}
	function getSearchListboxId(searchAreaId) {
		return `${ID_PREFIX}-${encodeIdPart(searchAreaId)}-listbox`;
	}
	function getSearchOptionId(searchAreaId, navIndex, dialogId) {
		return `${ID_PREFIX}-${encodeIdPart(searchAreaId)}-option-${encodeIdPart(navIndex)}-${encodeIdPart(dialogId)}`;
	}
	function getSearchGroupId(searchAreaId, groupId) {
		return `${ID_PREFIX}-${encodeIdPart(searchAreaId)}-group-${encodeIdPart(groupId)}`;
	}
	function getSearchGroupTitleId(searchAreaId, groupId) {
		return `${getSearchGroupId(searchAreaId, groupId)}-title`;
	}

	function getVisibleScrollTop(element, topTarget, scrollContainer) {
		// Both positions are page-relative, so the difference between them is the distance to scroll. The
		// offsets are measured against the scroll area itself and never against the window.
		const containerPosition = main_core.Dom.getPosition(scrollContainer);
		const topTargetPosition = main_core.Dom.getPosition(topTarget);
		const elementPosition = main_core.Dom.getPosition(element);
		if (topTargetPosition.top < containerPosition.top) {
			return scrollContainer.scrollTop - (containerPosition.top - topTargetPosition.top);
		}
		if (elementPosition.bottom > containerPosition.bottom) {
			return scrollContainer.scrollTop + (elementPosition.bottom - containerPosition.bottom);
		}
		return scrollContainer.scrollTop;
	}

	/**
	 * Brings the item holding the given traversal index into the visible part of the search results.
	 *
	 * The item is looked up inside the scroll area of `ScrollWithGradient`, because the results container is
	 * rendered in its slot; an item that is already fully visible leaves the scroll position untouched.
	 */
	function scrollToActiveItem(scrollContainer, navIndex) {
		if (!main_core.Type.isElementNode(scrollContainer) || !main_core.Type.isNumber(navIndex)) {
			return;
		}

		// The results are rebuilt on every change of the query, so a missing node is a normal state and not an
		// error: the scroll is silently skipped.
		const activeItem = scrollContainer.querySelector(`[data-nav-index="${navIndex}"]`);
		if (!activeItem) {
			return;
		}

		// Upwards the scroll aims at the node its section starts with and not at the item alone: that node
		// holds the title of the section and carries no traversal index, so aligning the item with the top edge
		// would leave the title above it. The view marks the head of a section with the indexes of the items
		// standing in its first row; for every other item nothing is found and the item is its own target.
		// Downwards the target stays the item: a whole section is not expected to fit the screen.
		const sectionHead = scrollContainer.querySelector(`[data-nav-section-head~="${navIndex}"]`);
		scrollContainer.scrollTo({
			top: getVisibleScrollTop(activeItem, sectionHead ?? activeItem, scrollContainer)
		});
	}

	// @vue/component
	const BaseEmptyState = {
		name: 'BaseEmptyState',
		props: {
			title: {
				type: String,
				required: true
			},
			subtitle: {
				type: String,
				default: ''
			}
		},
		template: `
		<div class="bx-im-search-empty-state__container bx-im-search-empty-state__scope">
			<div class="bx-im-search-empty-state__icon"></div>
			<div class="bx-im-search-empty-state__title">
				{{ title }}
			</div>
			<div v-if="subtitle" class="bx-im-search-empty-state__subtitle">
				{{ subtitle }}
			</div>
		</div>
	`
	};

	// @vue/component
	const SearchEmptyState = {
		name: 'SearchEmptyState',
		components: {
			BaseEmptyState
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseEmptyState
			:title="loc('IM_SEARCH_RESULT_NOT_FOUND')"
			:subtitle="loc('IM_SEARCH_RESULT_NOT_FOUND_DESCRIPTION')"
			data-testid="im-search-empty-state"
		/>
	`
	};

	// @vue/component
	const RecentEmptyState = {
		name: 'RecentEmptyState',
		components: {
			BaseEmptyState
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseEmptyState :title="loc('IM_SEARCH_RESULT_NO_RECENT')" data-testid="im-search-recent-empty-state" />
	`
	};

	class SearchContextMenu extends im_v2_lib_menu.RecentMenu {
		static events = {
			...im_v2_lib_menu.BaseMenu.events,
			openItem: 'openItem'
		};
		constructor(applicationContext) {
			super(applicationContext);
			this.id = 'im-chat-search-context-menu';
			this.chatService = new im_v2_provider_service_chat.ChatService();
		}
		getMenuItems() {
			return [this.getOpenItem(), this.getOpenProfileItem(), this.getChatsWithUserItem(), this.getPinMessageItem(), this.getJoinItem()];
		}
		getOpenItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN'),
				onClick: () => {
					this.emit(SearchContextMenu.events.openItem, {
						dialogId: this.context.dialogId
					});
					this.menuInstance.close();
				}
			};
		}
		getJoinItem() {
			const {
				dialogId
			} = this.context;
			if (!this.isGuestRole()) {
				return null;
			}
			let title = main_core.Loc.getMessage('IM_SEARCH_ITEM_JOIN_TO_CHAT');
			if (this.isChannel()) {
				title = main_core.Loc.getMessage('IM_SEARCH_ITEM_JOIN_TO_CHANNEL');
			}
			return {
				title,
				onClick: () => {
					this.chatService.joinChat(dialogId);
					this.menuInstance.close();
				}
			};
		}
	}

	// @vue/component
	const SelfChat = {
		name: 'SelfChat',
		props: {
			// Comes from the composition of the carousel and is not worked out here: the chat this tile opens
			// by click has to be the very chat the traversal order opens by Enter.
			dialogId: {
				type: String,
				required: true
			},
			active: {
				type: Boolean,
				default: false
			},
			navIndex: {
				type: Number,
				default: null
			}
		},
		emits: ['clickItem'],
		computed: {
			name() {
				return this.$Bitrix.Loc.getMessage('IM_SEARCH_MY_NOTES');
			}
		},
		created() {
			this.contextMenuManager = new SearchContextMenu({
				emitter: this.getEmitter()
			});
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
		},
		methods: {
			onClick(event) {
				this.$emit('clickItem', {
					dialogId: this.dialogId,
					nativeEvent: event
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div
			:data-id="dialogId"
			:data-testid="'im-search-carousel-item-' + dialogId"
			:data-nav-index="navIndex"
			class="bx-im-search-self-chat__container bx-im-search-self-chat__scope"
			:class="{'--keyboard-active': active}"
			@click="onClick"
			@click.right.prevent
		>
			<div class="bx-im-search-self-chat__avatar"></div>
			<div class="bx-im-search-self-chat__title" :title="name">{{ name }}</div>
		</div>
	`
	};

	// @vue/component
	const CarouselUser = {
		name: 'CarouselUser',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar
		},
		props: {
			userDialogId: {
				type: String,
				required: true
			},
			selected: {
				type: Boolean,
				default: false
			},
			active: {
				type: Boolean,
				default: false
			},
			navIndex: {
				type: Number,
				default: null
			}
		},
		emits: ['clickItem', 'openContextMenu'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			user() {
				return this.$store.getters['users/get'](this.userDialogId, true);
			},
			name() {
				return this.user.firstName ?? this.user.name;
			},
			fullName() {
				return this.user.name || this.name;
			},
			isExtranet() {
				return this.user.type === im_v2_const.UserType.extranet;
			}
		},
		created() {
			this.contextMenuManager = new SearchContextMenu({
				emitter: this.getEmitter()
			});
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
		},
		methods: {
			onClick(event) {
				this.$emit('clickItem', {
					dialogId: this.userDialogId,
					nativeEvent: event
				});
			},
			onRightClick(event) {
				if (event.altKey && event.shiftKey) {
					return;
				}
				this.$emit('openContextMenu', {
					dialogId: this.userDialogId,
					nativeEvent: event
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div
			:data-id="userDialogId"
			:data-testid="'im-search-carousel-item-' + userDialogId"
			:data-nav-index="navIndex"
			:aria-label="fullName"
			class="bx-im-carousel-user__container bx-im-carousel-user__scope"
			:class="{'--extranet': isExtranet, '--selected': selected, '--keyboard-active': active}"
			@click="onClick"
			@click.right.prevent="onRightClick"
		>
			<div v-if="selected" class="bx-im-carousel-user__selected-mark"></div>
			<ChatAvatar aria-hidden="true" :avatarDialogId="userDialogId" :size="AvatarSize.XL" />
			<div class="bx-im-carousel-user__title" :title="name">
				{{ name }}
			</div>
		</div>
	`
	};

	// @vue/component
	const RecentUsersCarousel = {
		name: 'RecentUsersCarousel',
		components: {
			CarouselUser,
			SelfChat
		},
		props: {
			/**
			 * Dialog ids of the tiles in the order they are rendered, the notes chat first: the head is the
			 * chat the notes tile opens, the rest are the interlocutors. The whole composition is needed and
			 * not the interlocutors alone -- the traversal indexes of the tiles are counted along it, and the
			 * numbering of the list below starts where it ends.
			 *
			 * @type string[]
			 */
			itemsWithNotesFirst: {
				type: Array,
				default: () => []
			},
			activeNavIndex: {
				type: Number,
				default: null
			},
			navIndexBase: {
				type: Number,
				default: null
			},
			searchAreaId: {
				type: String,
				default: null
			}
		},
		emits: ['clickItem', 'openContextMenu'],
		computed: {
			// The notes chat is handed down instead of being worked out again, so the tile opens by click exactly
			// the chat the traversal order opens by Enter. A composition without a head renders no tile at all:
			// one tile per item is what keeps the number of tiles and the numbering of the list below together.
			notesDialogId() {
				return this.itemsWithNotesFirst[0] ?? null;
			},
			userDialogIds() {
				return this.itemsWithNotesFirst.slice(1);
			},
			withAriaNavigation() {
				return main_core.Type.isStringFilled(this.searchAreaId) && this.navIndexBase !== null;
			},
			groupId() {
				return this.withAriaNavigation ? getSearchGroupId(this.searchAreaId, 'carousel') : null;
			},
			groupTitleId() {
				return this.withAriaNavigation ? getSearchGroupTitleId(this.searchAreaId, 'carousel') : null;
			}
		},
		methods: {
			getNavIndex(tileIndex) {
				return this.navIndexBase === null ? null : this.navIndexBase + tileIndex;
			},
			isActive(tileIndex) {
				const navIndex = this.getNavIndex(tileIndex);

				// Highlight follows the traversal index and never the dialogId: the same interlocutor
				// is present both here and in the recent list, so a dialogId match would light up two items.
				return navIndex !== null && navIndex === this.activeNavIndex;
			},
			getOptionId(dialogId, tileIndex) {
				const navIndex = this.getNavIndex(tileIndex);
				if (!this.withAriaNavigation || navIndex === null) {
					return null;
				}
				return getSearchOptionId(this.searchAreaId, navIndex, dialogId);
			},
			isChat(dialogId) {
				return dialogId.startsWith(im_v2_const.DialogIdChatPrefix);
			},
			loc(key) {
				return this.$Bitrix.Loc.getMessage(key);
			}
		},
		template: `
		<div
			:id="groupId"
			:role="withAriaNavigation ? 'group' : null"
			:aria-labelledby="groupTitleId"
			class="bx-im-recent-users-carousel__container bx-im-recent-users-carousel__scope"
			data-testid="im-search-carousel"
		>
			<div class="bx-im-recent-users-carousel__title-container" data-testid="im-search-carousel-title">
				<span :id="groupTitleId" class="bx-im-recent-users-carousel__section-title">
					{{ loc('IM_SEARCH_SECTION_RECENT_CHATS') }}
				</span>
			</div>
			<div class="bx-im-recent-users-carousel__users-container">
				<SelfChat
					v-if="notesDialogId"
					:dialogId="notesDialogId"
					:active="isActive(0)"
					:navIndex="getNavIndex(0)"
					:id="getOptionId(notesDialogId, 0)"
					:role="withAriaNavigation ? 'option' : null"
					:aria-selected="withAriaNavigation ? isActive(0) : null"
					@clickItem="$emit('clickItem', $event)"
				/>
				<CarouselUser
					v-for="(userDialogId, index) in userDialogIds"
					:key="userDialogId"
					:userDialogId="userDialogId"
					:active="isActive(index + 1)"
					:navIndex="getNavIndex(index + 1)"
					:id="getOptionId(userDialogId, index + 1)"
					:role="withAriaNavigation ? 'option' : null"
					:aria-selected="withAriaNavigation ? isActive(index + 1) : null"
					@clickItem="$emit('clickItem', $event)"
					@openContextMenu="$emit('openContextMenu', $event)"
				/>
			</div>
		</div>
	`
	};

	const ItemTextByChatType = {
		[im_v2_const.ChatType.openChannel]: () => main_core.Loc.getMessage('IM_SEARCH_ITEM_OPEN_CHANNEL_TYPE_GROUP'),
		[im_v2_const.ChatType.generalChannel]: () => main_core.Loc.getMessage('IM_SEARCH_ITEM_OPEN_CHANNEL_TYPE_GROUP'),
		[im_v2_const.ChatType.channel]: () => main_core.Loc.getMessage('IM_SEARCH_ITEM_PRIVATE_CHANNEL_TYPE_GROUP'),
		[im_v2_const.ChatType.collab]: () => im_v2_lib_collab.CollabManager.getSearchItemSubtitleText(),
		[im_v2_const.ChatType.taskComments]: () => main_core.Loc.getMessage('IM_SEARCH_ITEM_TASK_COMMENTS_TYPE'),
		default: () => main_core.Loc.getMessage('IM_SEARCH_ITEM_CHAT_TYPE_GROUP_V2')
	};

	// @vue/component
	const SearchItem = {
		name: 'SearchItem',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			ChatTitleWithHighlighting: im_v2_component_elements_chatTitle.ChatTitleWithHighlighting,
			SearchItemLayout: im_v2_component_elements_searchItemLayout.SearchItemLayout
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			dateMessage: {
				type: String,
				default: ''
			},
			withDate: {
				type: Boolean,
				default: false
			},
			selected: {
				type: Boolean,
				required: false
			},
			query: {
				type: String,
				default: ''
			},
			selfChatReplace: {
				type: Boolean,
				default: true
			},
			titleTwoLine: {
				type: Boolean,
				default: false
			},
			active: {
				type: Boolean,
				default: false
			},
			navIndex: {
				type: Number,
				default: null
			}
		},
		emits: ['clickItem', 'openContextMenu'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isChat() {
				return !this.isUser;
			},
			isUser() {
				return this.dialog.type === im_v2_const.ChatType.user;
			},
			needToReplaceSelfChat() {
				if (!this.selfChatReplace) {
					return false;
				}
				return this.$store.getters['chats/isSelfChat'](this.dialogId);
			},
			avatarType() {
				if (!this.selfChatReplace) {
					return '';
				}
				return this.needToReplaceSelfChat ? im_v2_component_elements_avatar.ChatAvatarType.selfChat : '';
			},
			titleType() {
				if (!this.selfChatReplace) {
					return '';
				}
				return this.needToReplaceSelfChat ? im_v2_component_elements_chatTitle.ChatTitleType.selfChat : '';
			},
			position() {
				if (!this.isUser) {
					return '';
				}
				return this.$store.getters['users/getPosition'](this.dialogId);
			},
			userItemText() {
				if (!this.position) {
					return this.loc('IM_SEARCH_ITEM_USER_TYPE_GROUP_V2');
				}
				return im_v2_lib_textHighlighter.highlightText(main_core.Text.encode(this.position), this.query);
			},
			chatItemText() {
				const handler = ItemTextByChatType[this.dialog.type] ?? ItemTextByChatType.default;
				return handler();
			},
			itemText() {
				if (this.needToReplaceSelfChat) {
					return this.selfChatText;
				}
				return this.isUser ? this.userItemText : this.chatItemText;
			},
			itemTextForTitle() {
				if (this.needToReplaceSelfChat) {
					return this.selfChatText;
				}
				return this.isUser ? this.position : this.chatItemText;
			},
			selfChatText() {
				return this.loc('IM_LIST_RECENT_CHAT_SELF_SUBTITLE');
			},
			formattedDate() {
				if (!this.dateMessage) {
					return null;
				}
				const date = im_v2_lib_utils.Utils.date.cast(this.dateMessage);
				return this.formatDate(date);
			}
		},
		methods: {
			onClick(event) {
				this.$emit('clickItem', {
					dialogId: this.dialogId,
					nativeEvent: event
				});
			},
			onRightClick(event) {
				if (event.altKey && event.shiftKey) {
					return;
				}
				this.$emit('openContextMenu', {
					dialogId: this.dialogId,
					nativeEvent: event
				});
			},
			formatDate(date) {
				return im_v2_lib_dateFormatter.DateFormatter.formatByTemplate(date, im_v2_lib_dateFormatter.DateTemplate.recent);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// data-id and data-testid are the shared row contract on every search surface; data-nav-index is optional.
		template: `
		<SearchItemLayout
			:selected="selected"
			:centered="selfChatReplace"
			:keyboardActive="active"
			:data-id="dialogId"
			:data-testid="'im-search-item-' + dialogId"
			:data-nav-index="navIndex"
			@click="onClick"
			@contextmenu="onRightClick"
		>
			<template #avatar>
				<ChatAvatar
					aria-hidden="true"
					:avatarDialogId="dialogId"
					:contextDialogId="dialogId"
					:size="AvatarSize.XL"
					:customType="avatarType"
				/>
			</template>
			<template #header>
				<ChatTitleWithHighlighting
					:dialogId="dialogId"
					:textToHighlight="query"
					:customType="titleType"
					:showItsYou="!selfChatReplace"
					:twoLine="titleTwoLine"
				/>
				<div v-if="withDate && formattedDate" class="bx-im-search-item__date">
					<span>{{ formattedDate }}</span>
				</div>
			</template>
			<template #subtitle>
				<span v-if="itemText" :title="itemTextForTitle" v-html="itemText"></span>
			</template>
		</SearchItemLayout>
	`
	};

	// Key code -> cursor intent: the controller knows nothing about keys, and this is the whole mapping.
	// Split by what the move is counted from: a relative one steps away from the item the cursor stands on,
	// an absolute one lands on the same item wherever it stood. Only the first kind needs the user to have
	// been shown that item -- see isCursorShownByKey.
	const RelativeCursorMoveByKey = Object.freeze({
		ArrowDown: cursor => cursor.moveDown(),
		ArrowUp: cursor => cursor.moveUp()
	});
	const AbsoluteCursorMoveByKey = Object.freeze({
		Home: cursor => cursor.moveToStart(),
		End: cursor => cursor.moveToEnd()
	});
	const CursorMoveByKey = Object.freeze({
		...RelativeCursorMoveByKey,
		...AbsoluteCursorMoveByKey
	});

	// Horizontal moves belong to the carousel row alone: in the lists the arrows keep moving the caret
	// through the query text. Relative as well: the step is counted from the tile the cursor stands on.
	const CarouselCursorMoveByKey = Object.freeze({
		ArrowLeft: cursor => cursor.moveLeft(),
		ArrowRight: cursor => cursor.moveRight()
	});

	// @vue/component
	const RecentSearchView = {
		name: 'ChatSearch',
		components: {
			ScrollWithGradient: im_v2_component_elements_scrollWithGradient.ScrollWithGradient,
			SearchItem,
			SearchEmptyState,
			RecentEmptyState,
			RecentUsersCarousel,
			Loader: im_v2_component_elements_loader.Loader
		},
		props: {
			searchResult: {
				type: Array,
				default: () => []
			},
			recentItems: {
				type: Array,
				default: () => []
			},
			isRecentLoading: {
				type: Boolean,
				default: false
			},
			query: {
				type: String,
				default: ''
			},
			searchMode: {
				type: Boolean,
				required: true
			},
			showUsersCarousel: {
				type: Boolean,
				default: true
			},
			withKeyboardNavigation: {
				type: Boolean,
				default: false
			},
			// Identifies the search area these results belong to. A keystroke is only taken from the input of
			// the same area: several search results can be mounted at once (the collab drawer over the root
			// list, a cached container under KeepAlive), and one keystroke must move exactly one cursor.
			searchAreaId: {
				type: String,
				default: null
			},
			parentChatId: {
				type: Number,
				default: 0
			}
		},
		emits: ['openItem', 'closeSearch', 'clickItem', 'openContextMenu', 'closeContextMenu'],
		data() {
			return {
				// Mirror of the cursor position: the controller itself must stay out of the reactive state, so
				// the template reads the active traversal index from here.
				activeNavIndex: null,
				// Kept apart from the position on purpose: the cursor stands on an item from the very first
				// moment, but its mark is only shown once the user is known to be on the keyboard -- the same
				// rule the browsers apply to :focus-visible.
				isCursorVisible: false
			};
		},
		computed: {
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			layoutName() {
				return this.layout.name;
			},
			chatEntityId() {
				return this.layout.entityId;
			},
			cleanQuery() {
				return this.query.trim().toLowerCase();
			},
			showLatestSearchResult() {
				return this.cleanQuery.length === 0;
			},
			carouselItems() {
				return getCarouselItems();
			},
			isCarouselVisible() {
				return this.showLatestSearchResult && this.showUsersCarousel;
			},
			isEmptyState() {
				return this.searchResult.length === 0;
			},
			isEmptyRecentState() {
				return this.recentItems.length === 0;
			},
			hasRecentSearchSection() {
				return this.recentItems.length > 0 || this.isRecentLoading;
			},
			navigationOrder() {
				// A watcher is subscribed to this computed, so it is rebuilt on every change of its dependencies
				// instead of lazily on read: while nothing walks the results it must not reach the store at all.
				// Entering the search resets the cursor, so the order of a closed one is never read.
				if (!this.withKeyboardNavigation || !this.searchMode) {
					return [];
				}
				return buildOrder({
					showLatestSearchResult: this.showLatestSearchResult,
					// The composition the tiles are rendered from, and the only thing the order is told about the
					// carousel: a hidden carousel is an empty composition, so the order cannot disagree with the
					// markup. Reading it only where the tiles are rendered also keeps a query branch from paying
					// for a carousel nobody sees.
					carouselItems: this.isCarouselVisible ? this.carouselItems : [],
					recentItems: this.recentItems,
					searchResult: this.searchResult
				});
			},
			carouselNavIndexBase() {
				// The carousel heads the traversal order, so its first tile is the very first index.
				return this.withKeyboardNavigation ? 0 : null;
			},
			listNavIndexBase() {
				return this.isCarouselVisible ? this.carouselItems.length : 0;
			},
			// The head of a section is the node the section starts with: scrolling to it is what brings the
			// section title back into view together with the item under the cursor. Marked with the indexes of
			// the items standing in the first row of the section, because only for those does the title sit
			// right above the item. The carousel is a single row, so its title heads every tile at once, and
			// its own container is the node that starts with that title.
			carouselSectionHeadNavIndexes() {
				if (!this.withKeyboardNavigation) {
					return null;
				}
				return this.carouselItems.map((dialogId, tileIndex) => this.carouselNavIndexBase + tileIndex).join(' ');
			},
			listSectionHeadNavIndex() {
				return this.withKeyboardNavigation ? this.listNavIndexBase : null;
			},
			highlightedNavIndex() {
				// The single lever of the keyboard mode: the traversal order, the cursor and the anchors do not
				// depend on it, only the mark that goes into the items of the results does.
				return this.isCursorVisible ? this.activeNavIndex : null;
			},
			withAriaNavigation() {
				return this.withKeyboardNavigation && main_core.Type.isStringFilled(this.searchAreaId);
			},
			listboxId() {
				return this.withAriaNavigation ? getSearchListboxId(this.searchAreaId) : null;
			},
			recentGroupId() {
				return this.withAriaNavigation ? getSearchGroupId(this.searchAreaId, 'recent') : null;
			},
			recentGroupTitleId() {
				return this.withAriaNavigation ? getSearchGroupTitleId(this.searchAreaId, 'recent') : null;
			},
			activeDescendantId() {
				if (!this.withAriaNavigation || !this.searchMode || !this.isCursorVisible || this.activeNavIndex === null) {
					return null;
				}
				const activeDescriptor = this.navigationOrder[this.activeNavIndex];
				if (!activeDescriptor) {
					return null;
				}
				return getSearchOptionId(this.searchAreaId, this.activeNavIndex, activeDescriptor.dialogId);
			}
		},
		watch: {
			cleanQuery() {
				this.resetNavigationCursor();
			},
			searchMode(newValue) {
				// The cursor is not carried over a visit: a closed search has no order, and the next entry
				// starts it over regardless. The mark is dropped exactly here and nowhere else: the next
				// entry may well be a mouse one, and it must not find the mark left on from this visit.
				if (!newValue) {
					this.isCursorVisible = false;
					this.publishActiveDescendant(null);
					return;
				}
				this.resetNavigationCursor();
			},
			navigationOrder() {
				// Same query, new data (server results merged in, recent list or carousel reloaded): the cursor
				// holds on to its own item instead of jumping back to the top.
				this.updateNavigationOrder();
			},
			activeDescendantId(activeDescendantId) {
				this.publishActiveDescendant(activeDescendantId);
			},
			chatEntityId(newEntityId, oldEntityId) {
				this.settleFocusHandoff(newEntityId, oldEntityId);
			}
		},
		created() {
			// Not a data() field on purpose: Vue would wrap the instance in a Proxy and break its private fields.
			this.navigationCursor = null;
			this.lastPublishedActiveDescendantId = null;
			this.getEmitter().subscribe(im_v2_const.EventType.search.keyPressed, this.onKeyPressed);
			if (!this.withKeyboardNavigation) {
				return;
			}
			this.navigationCursor = new SearchNavigationController();
			this.getEmitter().subscribe(im_v2_const.EventType.search.keyDown, this.onSearchKeyDown);
			this.getEmitter().subscribe(im_v2_const.EventType.search.inputBlur, this.onSearchInputBlur);
			this.resetNavigationCursor();
		},
		beforeUnmount() {
			this.getEmitter().unsubscribe(im_v2_const.EventType.search.keyPressed, this.onKeyPressed);
			if (this.withKeyboardNavigation) {
				this.getEmitter().unsubscribe(im_v2_const.EventType.search.keyDown, this.onSearchKeyDown);
				this.getEmitter().unsubscribe(im_v2_const.EventType.search.inputBlur, this.onSearchInputBlur);
			}
			this.publishActiveDescendant(null);

			// Nobody is left to watch the layout for this area, so a handoff of ours would never be settled.
			im_v2_lib_a11y.clearKeyboardFocusHandoff(this.searchAreaId);
		},
		methods: {
			onOpenContextMenu(event) {
				const {
					dialogId,
					nativeEvent
				} = event;
				if (im_v2_lib_utils.Utils.key.isAltOrOption(nativeEvent)) {
					return;
				}
				this.$emit('openContextMenu', {
					dialogId,
					target: nativeEvent.currentTarget
				});
			},
			onScroll() {
				this.$emit('closeContextMenu');
			},
			// The three handlers of the sections report the pick of their own section and hand the item over to
			// the opening itself. They answer the mouse and the keyboard alike, so each passes the answer of
			// `onClickItem()` on: the keyboard path acts on it, and there is no second way to learn it.
			onClickRecentChatItem(event) {
				im_v2_lib_analytics.Analytics.getInstance().recentSearch.onSelectFromRecentChats(this.layoutName, event.dialogId, this.parentChatId);
				return this.onClickItem(event);
			},
			onClickRecentSearchItem(event) {
				im_v2_lib_analytics.Analytics.getInstance().recentSearch.onSelectFromRecentSearch(this.layoutName, event.dialogId, this.parentChatId);
				return this.onClickItem(event);
			},
			onClickSearchResultItem(event, itemIndex) {
				im_v2_lib_analytics.Analytics.getInstance().recentSearch.onSelectFromSearchResult(this.layoutName, itemIndex + 1, this.parentChatId);
				return this.onClickItem(event);
			},
			// Tells whether the search was closed behind the item: Alt/Option is the existing "open it and keep
			// the results on the screen", and a caller whose work only makes sense on a closed search has no
			// other way to tell the two apart.
			onClickItem(event) {
				const {
					dialogId,
					nativeEvent
				} = event;
				this.$emit('clickItem', {
					dialogId
				});
				this.$emit('openItem', {
					dialogId
				});
				if (im_v2_lib_utils.Utils.key.isAltOrOption(nativeEvent)) {
					return false;
				}
				this.$emit('closeSearch');
				return true;
			},
			onKeyPressed(event) {
				// With the navigation on, Enter is handled on keydown: running this keyup branch as well would
				// open the active item and the first one on a single keystroke.
				if (this.withKeyboardNavigation) {
					return;
				}
				if (!this.searchMode) {
					return;
				}
				const {
					keyboardEvent,
					context
				} = event.getData();

				// EVENT-01: the list owns no id space, so it acts on unaddressed keystrokes only. It stays
				// subscribed while hidden and shares the emitter with the forward window, whose keystrokes
				// belong to that window alone.
				if ((context ?? null) !== null) {
					return;
				}
				if (im_v2_lib_utils.Utils.key.isCombination(keyboardEvent, 'Enter')) {
					this.onPressEnterKey(event);
				}
			},
			onPressEnterKey(keyboardEvent) {
				const firstItem = getFirstItemFromSearchResults({
					searchResult: this.searchResult,
					recentItems: this.recentItems
				});
				if (!firstItem) {
					return;
				}
				this.onClickItem({
					dialogId: firstItem.dialogId,
					nativeEvent: keyboardEvent
				});
			},
			onSearchKeyDown(event) {
				if (!this.withKeyboardNavigation) {
					return;
				}
				const {
					keyboardEvent,
					searchAreaId
				} = event.getData();
				if (!isOwnSearchArea(searchAreaId, this.searchAreaId)) {
					return;
				}

				// A keystroke of this area that arrives before the search is open can only be the one that is
				// opening it: while collapsed the field is a button, and a mouse click on it produces no keydown.
				// Nothing is navigated here -- entering from the keyboard is only what shows the cursor.
				if (!this.searchMode) {
					this.isCursorVisible = true;
					return;
				}

				// Empty results: there is nothing to navigate, so the keystroke stays with the input.
				if (this.navigationOrder.length === 0) {
					return;
				}
				const isCursorShown = this.isCursorShownByKey(keyboardEvent);
				const isCursorMoved = !isCursorShown && this.moveCursorByKey(keyboardEvent);
				const isItemOpened = this.openActiveItemByKey(keyboardEvent);

				// The keystroke spent on showing the mark is taken from the caret all the same: it was answered
				// here, and left to the input it would walk the caret through the query nobody asked it to walk.
				if (isCursorShown || isCursorMoved || isItemOpened) {
					keyboardEvent.preventDefault();
				}

				// Scrolling follows movement and not interception: Enter hides the results, and the keys left to
				// the caret never move the cursor. A handled navigation key is also the second way into the
				// keyboard mode: whoever started walking the results must see where the cursor stands, no matter
				// what opened the search. The key that only shows the mark scrolls too: the results may have been
				// scrolled away with the mouse, and the item the mark lights up has to be on the screen.
				if (isCursorShown || isCursorMoved) {
					this.isCursorVisible = true;
					// A keystroke leaves the markup as it was -- only the mark moves between two nodes that are
					// already there -- so the geometry of the item is read right away.
					this.scrollActiveItemIntoView();
				}
			},
			// The keys of the walk reach the results through the input, so a cursor whose input no longer holds the
			// focus cannot be moved by any of them: its mark would point at an item nobody can operate, next to the
			// ring of whatever took the focus. The hidden position goes with the mark, so returning focus cannot
			// leave Enter targeting an item the user can no longer see as active.
			onSearchInputBlur(event) {
				if (!isOwnSearchArea(event.getData().searchAreaId, this.searchAreaId)) {
					return;
				}
				this.isCursorVisible = false;
				this.publishActiveDescendant(null);
				this.resetNavigationCursor();
			},
			publishActiveDescendant(activeDescendantId) {
				if (!this.withAriaNavigation || this.lastPublishedActiveDescendantId === activeDescendantId) {
					return;
				}
				this.lastPublishedActiveDescendantId = activeDescendantId;
				this.getEmitter().emit(im_v2_const.EventType.search.activeDescendantChanged, {
					searchAreaId: this.searchAreaId,
					activeDescendantId
				});
			},
			// The key a hidden mark is shown by instead of walked with. A relative move steps away from the item
			// the cursor stands on, and while the mark is hidden the user has never been shown that item: counted
			// from it right away, the first arrow of a search entered with the mouse lit the mark on the item next
			// to the one it was pressed for. So that key shows the mark where the cursor already stands, and the
			// walk starts with the next one. The absolute jumps land on the same item wherever the cursor stood,
			// so they are walked with at once; the arrows the caret keeps are no move here either.
			isCursorShownByKey(keyboardEvent) {
				if (this.isCursorVisible || !this.findCursorMove(keyboardEvent)) {
					return false;
				}
				return !Object.keys(AbsoluteCursorMoveByKey).some(code => {
					return im_v2_lib_utils.Utils.key.isExactCombination(keyboardEvent, code);
				});
			},
			moveCursorByKey(keyboardEvent) {
				const moveCursor = this.findCursorMove(keyboardEvent);
				if (!moveCursor) {
					return false;
				}
				moveCursor(this.navigationCursor);
				this.syncActiveNavIndex();
				return true;
			},
			findCursorMove(keyboardEvent) {
				const availableMoves = this.isCursorInCarousel() ? {
					...CursorMoveByKey,
					...CarouselCursorMoveByKey
				} : CursorMoveByKey;

				// Only the pure form of a key navigates: Shift+Arrow selects text and Ctrl/Cmd+Home jumps
				// through the document, so combinations with modifiers must reach the input untouched.
				const keyCode = Object.keys(availableMoves).find(code => {
					return im_v2_lib_utils.Utils.key.isExactCombination(keyboardEvent, code);
				});
				return keyCode === undefined ? null : availableMoves[keyCode];
			},
			openActiveItemByKey(keyboardEvent) {
				// Enter is matched loosely on purpose: Alt+Enter is the existing "open the item, keep the search
				// open", and an exact match would lose it.
				if (!im_v2_lib_utils.Utils.key.isCombination(keyboardEvent, 'Enter')) {
					return false;
				}

				// The item under the cursor and nothing else: the mark of the results is drawn on this very item, so
				// what is highlighted and what Enter opens can never be two different chats. An untouched cursor
				// stands on the anchor of the order - the first row of the results, the row Enter has always opened.
				const itemToOpen = this.navigationCursor.getActive();
				if (!itemToOpen) {
					return false;
				}

				// Read before the chat is opened: it lands in the layout synchronously, and from then on the chat
				// that was already there is indistinguishable from the one this keystroke has just opened.
				const wasItemChatOpened = this.chatEntityId === itemToOpen.dialogId;
				const isSearchClosed = this.openItemBySection(itemToOpen, keyboardEvent);

				// A promise of the focus is only worth making by the branch that closes the search: the focus goes
				// back onto the collapsed pill, and Alt+Enter leaves no collapsed pill to put it on.
				if (isSearchClosed) {
					// The chat is already in the layout by now (its store commit is synchronous), so the layout read
					// here is the one the chat was opened in. From this moment on the focus is owed back to the
					// search: the walk was a keyboard one, and the mouse path never comes here.
					im_v2_lib_a11y.armKeyboardFocusHandoff({
						searchAreaId: this.searchAreaId,
						layoutName: this.layoutName,
						dialogId: itemToOpen.dialogId
					});

					// The chat of the item was the one already on the screen: it is not re-mounted, so no input of
					// its own autofocuses, and the closing search would land the focus on its collapsed pill --
					// away from the chat the user has just asked for. The input is asked and no more than asked:
					// one that cannot take the focus (a guest, a chat nobody may write in) leaves it to the pill.
					if (wasItemChatOpened) {
						this.getEmitter().emit(im_v2_const.EventType.textarea.focusInput, {
							dialogId: itemToOpen.dialogId
						});
					}
				}
				return true;
			},
			// The keyboard opens the item through the handler of the section it stands in -- the very one its
			// mouse path goes through. Each of them reports the pick of its own section, and opening the item
			// past them would leave the whole keyboard walk unreported.
			openItemBySection(itemToOpen, keyboardEvent) {
				const clickEvent = {
					dialogId: itemToOpen.dialogId,
					nativeEvent: keyboardEvent
				};
				if (itemToOpen.section === NavigationSection.carousel) {
					return this.onClickRecentChatItem(clickEvent);
				}

				// One section of the order, two sections of the results: the rows below the carousel are the recent
				// search, and the rows of a query are the search output. The branch is the one the template renders
				// by, so the handler is always the one the mouse of those very rows would reach.
				if (this.showLatestSearchResult) {
					return this.onClickRecentSearchItem(clickEvent);
				}

				// The position inside the output, counted the way the rows are numbered: the traversal index runs
				// over the whole results, and the rows of the output start at `listNavIndexBase`.
				const itemIndex = this.navigationCursor.getActiveIndex() - this.listNavIndexBase;
				return this.onClickSearchResultItem(clickEvent, itemIndex);
			},
			isCursorInCarousel() {
				return this.navigationCursor.getActive()?.section === NavigationSection.carousel;
			},
			// The layout moved, and with it the fate of the focus owed to the search. The promise lives exactly as
			// long as the surfaces the same keystroke opened: the exit of its chat hands the focus over, while any
			// move away from the walk (another chat opened, another section entered) makes the promise stale.
			settleFocusHandoff(newEntityId, oldEntityId) {
				const handoff = im_v2_lib_a11y.getKeyboardFocusHandoff(this.searchAreaId);
				if (!handoff) {
					return;
				}

				// Another section renders this very container, and the collapsed pill left behind in the one the
				// walk started in is owed nothing.
				if (handoff.layoutName !== this.layoutName) {
					im_v2_lib_a11y.clearKeyboardFocusHandoff(this.searchAreaId);
					return;
				}

				// The nested list opened together with that chat holds the promise: it is the last surface of the
				// walk, so what happens to the chats above it settles nothing.
				if (im_v2_lib_a11y.isKeyboardFocusHandoffOfAreaHeldByNestedList(this.searchAreaId)) {
					return;
				}
				if (newEntityId) {
					// The chat of the promise is simply on screen; anything else took its place and the promise
					// went with it.
					if (newEntityId !== handoff.dialogId) {
						im_v2_lib_a11y.clearKeyboardFocusHandoff(this.searchAreaId);
					}
					return;
				}

				// The layout is only being cleared to make room for the chat of the promise: a collab opens its
				// nested list first and its own chat after. The walk is not over - it has not started.
				if (oldEntityId !== handoff.dialogId) {
					return;
				}
				im_v2_lib_a11y.clearKeyboardFocusHandoff(this.searchAreaId);
				// The search owns the element that takes the focus; all it needs from here is the moment.
				this.getEmitter().emit(im_v2_const.EventType.search.returnFocusToSearch, {
					searchAreaId: this.searchAreaId
				});
			},
			updateNavigationOrder() {
				this.changeCursorPosition(() => this.navigationCursor.setOrder(this.navigationOrder));
			},
			resetNavigationCursor() {
				this.changeCursorPosition(() => {
					// reset() takes no arguments and works over the current order, so the order is rebuilt first.
					this.navigationCursor.setOrder(this.navigationOrder);
					this.navigationCursor.reset();
				});
			},
			// Every move of the cursor that no keystroke asked for: the results were rebuilt under it, or the walk
			// started over on a new query. The scroll position of the visit outlives both, so the item the cursor
			// lands on has to be brought back into view -- otherwise the mark, and with it the target of Enter,
			// stands where the user cannot see it. A position that did not change asks for nothing.
			changeCursorPosition(moveCursor) {
				if (!this.navigationCursor) {
					return;
				}
				const previousNavIndex = this.activeNavIndex;
				moveCursor();
				this.syncActiveNavIndex();
				if (this.isCursorVisible && this.activeNavIndex !== previousNavIndex) {
					// This runs in a pre-flush watcher, i.e. on the markup the new order is about to replace: the
					// item and the head of its section are only there to be measured once that order is rendered.
					this.$nextTick(() => this.scrollActiveItemIntoView());
				}
			},
			syncActiveNavIndex() {
				this.activeNavIndex = this.navigationCursor?.getActiveIndex() ?? null;
			},
			scrollActiveItemIntoView() {
				scrollToActiveItem(this.$refs['scroll-gradient']?.getContainer(), this.activeNavIndex);
			},
			getListNavIndex(itemIndex) {
				return this.withKeyboardNavigation ? this.listNavIndexBase + itemIndex : null;
			},
			isListItemActive(itemIndex) {
				const navIndex = this.getListNavIndex(itemIndex);

				// Highlight follows the traversal index and never the dialogId: the same interlocutor is present
				// both in the carousel and in the recent list, so a dialogId match would light up two items.
				return navIndex !== null && navIndex === this.highlightedNavIndex;
			},
			getListOptionId(dialogId, itemIndex) {
				const navIndex = this.getListNavIndex(itemIndex);
				if (!this.withAriaNavigation || navIndex === null) {
					return null;
				}
				return getSearchOptionId(this.searchAreaId, navIndex, dialogId);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(key) {
				return this.$Bitrix.Loc.getMessage(key);
			}
		},
		template: `
		<ScrollWithGradient v-if="searchMode" ref="scroll-gradient" @scroll="onScroll">
			<div
				:id="listboxId"
				:role="withAriaNavigation ? 'listbox' : null"
				:aria-label="withAriaNavigation ? loc('IM_SEARCH_RESULTS_ARIA') : null"
				class="bx-im-chat-search__container"
				data-testid="im-search-results"
			>
				<template v-if="showLatestSearchResult">
					<RecentUsersCarousel
						v-if="showUsersCarousel"
						:itemsWithNotesFirst="carouselItems"
						:activeNavIndex="highlightedNavIndex"
						:navIndexBase="carouselNavIndexBase"
						:searchAreaId="withAriaNavigation ? searchAreaId : null"
						:data-nav-section-head="carouselSectionHeadNavIndexes"
						@clickItem="onClickRecentChatItem"
						@openContextMenu="onOpenContextMenu"
					/>
					<div
						v-if="hasRecentSearchSection"
						:id="recentGroupId"
						:role="withAriaNavigation ? 'group' : null"
						:aria-labelledby="recentGroupTitleId"
					>
						<div
							:id="recentGroupTitleId"
							class="bx-im-chat-search__title"
							data-testid="im-search-recent-title"
							:data-nav-section-head="listSectionHeadNavIndex"
						>
							{{ loc('IM_SEARCH_SECTION_RECENT') }}
						</div>
						<SearchItem
							v-for="(item, index) in recentItems"
							:key="item.dialogId"
							:dialogId="item.dialogId"
							:titleTwoLine="true"
							:active="isListItemActive(index)"
							:navIndex="getListNavIndex(index)"
							:id="getListOptionId(item.dialogId, index)"
							:role="withAriaNavigation ? 'option' : null"
							:aria-selected="withAriaNavigation ? isListItemActive(index) : null"
							@clickItem="onClickRecentSearchItem"
							@openContextMenu="onOpenContextMenu"
						/>
						<Loader v-if="isRecentLoading" class="bx-im-chat-search__loader" />
					</div>
					<RecentEmptyState v-else-if="isEmptyRecentState" />
				</template>
				<template v-else>
					<SearchItem
						v-for="(item, index) in searchResult"
						:key="item.dialogId"
						:dialogId="item.dialogId"
						:dateMessage="item.dateMessage"
						:withDate="true"
						:query="cleanQuery"
						:titleTwoLine="true"
						:active="isListItemActive(index)"
						:navIndex="getListNavIndex(index)"
						:id="getListOptionId(item.dialogId, index)"
						:role="withAriaNavigation ? 'option' : null"
						:aria-selected="withAriaNavigation ? isListItemActive(index) : null"
						@clickItem="onClickSearchResultItem($event, index)"
						@openContextMenu="onOpenContextMenu"
					/>
					<SearchEmptyState v-if="isEmptyState" />
				</template>
			</div>
		</ScrollWithGradient>
	`
	};

	const DEFAULT_MIN_TOKEN_SIZE = 3;
	const getMinTokenSize = () => {
		const settings = main_core.Extension.getSettings('im.v2.component.search');
		return settings.get('minTokenSize', DEFAULT_MIN_TOKEN_SIZE);
	};

	const SEARCH_DEBOUNCE_MS = 400;

	// @vue/component
	const RecentSearch = {
		name: 'RecentSearch',
		components: {
			RecentSearchView
		},
		props: {
			query: {
				type: String,
				default: ''
			},
			searchMode: {
				type: Boolean,
				required: true
			},
			showUsersCarousel: {
				type: Boolean,
				default: true
			},
			withKeyboardNavigation: {
				type: Boolean,
				default: false
			},
			searchAreaId: {
				type: String,
				default: null
			},
			recentSectionType: {
				type: String || null,
				default: im_v2_const.RecentType.default
			},
			parentChatId: {
				type: Number || null,
				default: 0
			},
			additionalSearchParams: {
				type: Object,
				default: () => ({})
			}
		},
		emits: ['loading', 'openItem', 'closeSearch'],
		data() {
			return {
				isRecentLoading: false,
				isServerLoading: false,
				searchResult: [],
				recentItems: [],
				currentServerQueries: 0
			};
		},
		computed: {
			layoutName() {
				return this.$store.getters['application/getLayout'].name;
			},
			preparedQuery() {
				return this.query.trim().toLowerCase();
			}
		},
		watch: {
			preparedQuery(newQuery) {
				if (newQuery.length === 0) {
					this.isServerLoading = false;
					this.cleanSearchResult();
					return;
				}
				this.startSearch(newQuery);
			},
			isServerLoading(newValue) {
				this.$emit('loading', newValue);
			},
			searchMode(newValue) {
				if (!newValue) {
					this.searchService.clearSessionResult();
					void this.loadLatestSearchResults();
				}
			}
		},
		created() {
			const searchParams = {
				searchRecentSection: this.recentSectionType,
				parentId: this.parentChatId,
				...this.additionalSearchParams
			};
			this.searchService = new im_v2_provider_service_search.SearchService(searchParams);
			this.runServerSearch = main_core.Runtime.debounce(this.searchOnServer, SEARCH_DEBOUNCE_MS, this);
			this.initContextMenu();
			void this.loadLatestSearchResults();
		},
		beforeUnmount() {
			this.runServerSearch = null;
			this.searchService = null;
			this.contextMenuManager = null;
		},
		methods: {
			async loadLatestSearchResults() {
				this.isRecentLoading = true;
				this.recentItems = await this.searchService.loadLatestResults();
				this.isRecentLoading = false;
			},
			startSearch(query) {
				const result = this.searchService.searchLocal(query);
				const isUserTyping = query !== this.preparedQuery;
				if (isUserTyping) {
					return;
				}
				this.searchResult = im_v2_lib_search.sortByDate(result);
				if (query.length >= getMinTokenSize()) {
					this.isServerLoading = true;
					this.runServerSearch(query);
				}
				this.sendSearchResultAnalytics();
				im_v2_lib_analytics.Analytics.getInstance().recentSearch.onStart(this.layoutName, this.parentChatId);
			},
			cleanSearchResult() {
				this.searchResult = [];
				this.searchService.clearSessionResult();
			},
			async searchOnServer(query) {
				this.currentServerQueries++;
				const serverResult = await this.searchService.search(query);
				const isUserTyping = query !== this.preparedQuery;
				if (isUserTyping) {
					this.stopLoader();
					return;
				}
				const mergedItems = im_v2_lib_search.mergeSearchItems(this.searchResult, serverResult);
				this.searchResult = im_v2_lib_search.sortByDate(mergedItems);
				this.stopLoader();
			},
			sendSearchResultAnalytics() {
				if (this.searchResult.length === 0) {
					im_v2_lib_analytics.Analytics.getInstance().recentSearch.onShowNotFoundResult(this.layoutName, this.parentChatId);
					return;
				}
				im_v2_lib_analytics.Analytics.getInstance().recentSearch.onShowSuccessResult(this.layoutName, this.parentChatId);
			},
			stopLoader() {
				this.currentServerQueries--;
				if (this.currentServerQueries > 0) {
					return;
				}
				this.isServerLoading = false;
			},
			initContextMenu() {
				this.contextMenuManager = new SearchContextMenu({
					emitter: this.getEmitter()
				});
				this.contextMenuManager.subscribe(SearchContextMenu.events.openItem, event => {
					this.$emit('openItem', event.getData());
				});
			},
			onOpenContextMenu(event) {
				this.contextMenuManager.openMenu({
					dialogId: event.dialogId
				}, event.target);
			},
			onCloseContextMenu() {
				this.contextMenuManager.destroy();
			},
			onClickItem(event) {
				this.searchService.saveItemToRecentSearch(event.dialogId);
			},
			onOpenItem(event) {
				this.$emit('openItem', event);
			},
			onCloseSearch() {
				this.$emit('closeSearch');
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<RecentSearchView
			:searchMode="searchMode"
			:searchResult="searchResult"
			:recentItems="recentItems"
			:isRecentLoading="isRecentLoading"
			:query="query"
			:showUsersCarousel="showUsersCarousel"
			:withKeyboardNavigation="withKeyboardNavigation"
			:searchAreaId="searchAreaId"
			:parentChatId="parentChatId"
			@clickItem="onClickItem"
			@openItem="onOpenItem"
			@closeSearch="onCloseSearch"
			@openContextMenu="onOpenContextMenu"
			@closeContextMenu="onCloseContextMenu"
		/>
	`
	};

	// The numeric keypad carries its own code for Enter, and the helper compares event.code.
	const ENTER_KEYS$1 = ['Enter', 'NumpadEnter'];

	// @vue/component
	const ChatSearchInput = {
		name: 'ChatSearchInput',
		components: {
			SearchInput: im_v2_component_elements_searchInput.SearchInput
		},
		props: {
			searchMode: {
				type: Boolean,
				required: true
			},
			isLoading: {
				type: Boolean,
				required: false
			},
			delayForFocusOnStart: {
				type: [Number, null],
				default: null
			},
			autofocusOnTrapActivation: {
				type: Boolean,
				default: false
			},
			withIcon: {
				type: Boolean,
				default: true
			},
			placeholder: {
				type: String,
				default: main_core.Loc.getMessage('IM_SEARCH_INPUT_PLACEHOLDER_V2')
			},
			activateOnEnter: {
				type: Boolean,
				default: false
			},
			// Identifies the search area this input belongs to, so that of the several search outputs that can be
			// mounted at once only the one from the same area reacts to a keystroke. Set it from the parent that
			// owns both this input and its output; left empty, this input puts nothing on the bus at all and no
			// navigation subscriber can be driven by it.
			// It only buys the navigation, though: handing the focus back to the search additionally needs
			// `activateOnEnter`, so a parent that sets this prop alone gets a working walk and a dead return.
			searchAreaId: {
				type: String,
				default: null
			},
			withGlobalEscapeHandling: {
				type: Boolean,
				default: true
			},
			clearButtonLabel: {
				type: String,
				default: null
			},
			inputRole: {
				type: String,
				default: null
			},
			inputControlsId: {
				type: String,
				default: null
			},
			inputDescribedById: {
				type: String,
				default: null
			},
			// Addresses the shared key channel to one window instance. Left empty, the keystroke is
			// published unaddressed and only the context-free subscribers act on it.
			searchContext: {
				type: String,
				default: null
			}
		},
		emits: ['closeSearch', 'openSearch', 'updateSearch'],
		data() {
			return {
				activeDescendantId: null
			};
		},
		computed: {
			listboxId() {
				if (!main_core.Type.isStringFilled(this.searchAreaId)) {
					return null;
				}
				return getSearchListboxId(this.searchAreaId);
			},
			// Each attribute may be written once, and two consumers describe the field: a window passes the values
			// outright, a search area gets them from its own listbox. The explicit prop wins where both are given.
			resolvedInputRole() {
				return this.inputRole ?? (this.listboxId ? 'combobox' : null);
			},
			resolvedInputControlsId() {
				return this.inputControlsId ?? this.listboxId;
			}
		},
		watch: {
			searchMode(isOpen) {
				if (!isOpen) {
					this.activeDescendantId = null;
				}
			}
		},
		created() {
			this.getEmitter().subscribe(im_v2_const.EventType.search.returnFocusToSearch, this.onReturnFocusToSearch);
			if (this.listboxId) {
				this.getEmitter().subscribe(im_v2_const.EventType.search.activeDescendantChanged, this.onActiveDescendantChanged);
			}
		},
		beforeUnmount() {
			this.getEmitter().unsubscribe(im_v2_const.EventType.search.returnFocusToSearch, this.onReturnFocusToSearch);
			if (this.listboxId) {
				this.getEmitter().unsubscribe(im_v2_const.EventType.search.activeDescendantChanged, this.onActiveDescendantChanged);
			}
		},
		methods: {
			onActiveDescendantChanged(event) {
				const {
					searchAreaId,
					activeDescendantId
				} = event.getData();
				if (!this.searchMode || !isOwnSearchArea(searchAreaId, this.searchAreaId)) {
					return;
				}
				this.activeDescendantId = main_core.Type.isStringFilled(activeDescendantId) ? activeDescendantId : null;
			},
			// The results know when the focus is the search's again; the input owns the element that takes it.
			onReturnFocusToSearch(event) {
				const {
					searchAreaId
				} = event.getData();
				if (!isOwnSearchArea(searchAreaId, this.searchAreaId)) {
					return;
				}
				this.$refs.searchInput?.returnFocusToPill();
			},
			onInputFocus() {
				this.$emit('openSearch');
			},
			// Addressed like keyDown and for the same reason: the keys of the navigation travel from this very
			// field, so only the results of this area may act on the loss of its focus. An input with no area of
			// its own says nothing on either channel: they are public constants, and an unaddressed event is one
			// more thing every subscriber, ours or not, would have to fail closed on.
			onInputBlur() {
				if (!main_core.Type.isStringFilled(this.searchAreaId)) {
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.search.inputBlur, {
					searchAreaId: this.searchAreaId
				});
			},
			onClose() {
				this.activeDescendantId = null;
				this.$emit('closeSearch');
			},
			onInputUpdate(query) {
				this.$emit('updateSearch', query);
			},
			onKeyPressed(event) {
				// Enter is the only key the shared channel has an action for, and every subscriber tests it
				// with the same helper. Arrows stay out: entering the results is a local handler of the
				// window. The component event of SearchInput is deliberately left wide.
				if (!im_v2_lib_utils.Utils.key.isCombination(event, ENTER_KEYS$1)) {
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.search.keyPressed, {
					keyboardEvent: event,
					context: this.searchContext
				});
			},
			onRawKeyDown(event) {
				if (!main_core.Type.isStringFilled(this.searchAreaId)) {
					return;
				}

				// Synchronous emit on purpose: the subscriber's preventDefault() only has an effect while this
				// very keydown is being dispatched, so emitAsync would silently turn interception into a no-op.
				this.getEmitter().emit(im_v2_const.EventType.search.keyDown, {
					keyboardEvent: event,
					searchAreaId: this.searchAreaId
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<SearchInput
			ref="searchInput"
			:placeholder="placeholder"
			:searchMode="searchMode"
			:isLoading="isLoading"
			:withLoader="true"
			:delayForFocusOnStart="delayForFocusOnStart"
			:autofocusOnTrapActivation="autofocusOnTrapActivation"
			:withIcon="withIcon"
			:activateOnEnter="activateOnEnter"
			:withResultsNavigation="Boolean(listboxId)"
			:ariaActiveDescendantId="activeDescendantId"
			:withGlobalEscapeHandling="withGlobalEscapeHandling"
			:clearButtonLabel="clearButtonLabel"
			:inputRole="resolvedInputRole"
			:inputControlsId="resolvedInputControlsId"
			:inputDescribedById="inputDescribedById"
			@inputFocus="onInputFocus"
			@inputBlur="onInputBlur"
			@queryChange="onInputUpdate"
			@keyPressed="onKeyPressed"
			@rawKeyDown="onRawKeyDown"
			@close="onClose"
			@closeByEsc="onClose"
		/>
	`
	};

	const EntitySearchType = {
		addToChat: 'addToChat',
		messageForward: 'messageForward'
	};

	// pseudo-section of the forward picker: search runs across all recent sections at once
	const ForwardAllSection = 'all';
	const EntitySearchConfig = {
		[EntitySearchType.addToChat]: {
			exclude: [im_v2_lib_search.EntitySearch.chats],
			excludeGuests: true
		},
		[EntitySearchType.messageForward]: {
			exclude: [],
			onlyWithManageMessagesRight: true,
			fillDialogByRecent: true,
			// entityConfig holds fields of the ui.EntitySelector entity itself, not provider options;
			// getSearchConfig lifts them onto the entity, while everything else goes to entity.options.
			entityConfig: {
				// The forward picker shows "Recent" strictly by chat activity, not by the EntitySelector
				// usage history (the IM_CHAT_SEARCH context is shared with the regular messenger search).
				// Otherwise items previously picked in search float up as pseudo-pinned and push active
				// task chats past the recent limit. Read on the server in ui/lib/entityselector/entity.php.
				fillRecentItems: false
			}
		}
	};

	const mergeSearchItems = (originalItems, newItems) => {
		const mergedItems = [...originalItems, ...newItems].map(item => {
			return [item.dialogId, item];
		});
		const result = new Map(mergedItems);
		return [...result.values()];
	};

	// @vue/component
	const AddToChatSearch = {
		name: 'AddToChat',
		components: {
			ScrollWithGradient: im_v2_component_elements_scrollWithGradient.ScrollWithGradient,
			SearchItem,
			SearchEmptyState
		},
		props: {
			query: {
				type: String,
				default: ''
			},
			dialogId: {
				type: String,
				required: true
			},
			selectedItems: {
				type: Array,
				required: false,
				default: () => []
			}
		},
		emits: ['clickItem'],
		data() {
			return {
				isLoading: false,
				currentServerQueries: 0,
				searchResult: []
			};
		},
		computed: {
			showLatestSearchResult() {
				return this.query.length === 0;
			},
			isEmptyState() {
				return this.searchResult.length === 0;
			}
		},
		watch: {
			query(newQuery) {
				if (newQuery.length === 0) {
					this.cleanSearchResult();
				}
				this.startSearch(newQuery);
			}
		},
		created() {
			this.searchService = new im_v2_provider_service_search.SearchService(EntitySearchConfig[EntitySearchType.addToChat]);
			this.searchOnServerDelayed = main_core.Runtime.debounce(this.searchOnServer, 400, this);
			this.recentSearchItems = im_v2_lib_search.getUsersFromRecentItems({
				withFakeUsers: true,
				withGuests: false
			});
			this.getEmitter().subscribe(im_v2_const.EventType.search.keyPressed, this.onKeyPressed);
		},
		beforeUnmount() {
			this.getEmitter().unsubscribe(im_v2_const.EventType.search.keyPressed, this.onKeyPressed);
		},
		methods: {
			startSearch(query) {
				if (query.length > 0) {
					const result = this.searchService.searchLocal(query);
					if (query !== this.query) {
						return;
					}
					this.searchResult = im_v2_lib_search.sortByDate(result);
				}
				if (query.length >= getMinTokenSize()) {
					this.isLoading = true;
					this.searchOnServerDelayed(query);
				}
			},
			cleanSearchResult() {
				this.searchService.clearSessionResult();
				this.searchResult = [];
			},
			async searchOnServer(query) {
				this.currentServerQueries++;
				const searchResult = await this.searchService.search(query);
				if (query !== this.query) {
					this.stopLoader();
					return;
				}
				const mergedItems = mergeSearchItems(this.searchResult, searchResult);
				this.searchResult = im_v2_lib_search.sortByDate(mergedItems);
				this.stopLoader();
			},
			stopLoader() {
				this.currentServerQueries--;
				if (this.currentServerQueries > 0) {
					return;
				}
				this.isLoading = false;
			},
			async onClickItem(event, itemIndex) {
				im_v2_lib_analytics.Analytics.getInstance().userAdd.onSelectUserFromSearchResult({
					dialogId: this.dialogId,
					position: itemIndex + 1
				});
				this.$emit('clickItem', event);
			},
			async onClickItemRecentItem(event, itemIndex) {
				im_v2_lib_analytics.Analytics.getInstance().userAdd.onSelectUserFromRecent({
					dialogId: this.dialogId,
					position: itemIndex + 1
				});
				this.$emit('clickItem', event);
			},
			onKeyPressed(event) {
				const {
					keyboardEvent,
					context
				} = event.getData();

				// EVENT-01: the list owns no id space, so it acts on unaddressed keystrokes only and leaves
				// an addressed one to the window it was typed in.
				if ((context ?? null) !== null) {
					return;
				}
				if (im_v2_lib_utils.Utils.key.isCombination(keyboardEvent, 'Enter')) {
					this.onPressEnterKey(event);
				}
			},
			onPressEnterKey(keyboardEvent) {
				const firstItem = getFirstItemFromSearchResults({
					searchResult: this.searchResult,
					recentItems: this.recentSearchItems
				});
				if (!firstItem) {
					return;
				}
				void this.onClickItem({
					dialogId: firstItem.dialogId,
					nativeEvent: keyboardEvent
				});
			},
			isSelected(dialogId) {
				return this.selectedItems.includes(dialogId);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(key) {
				return this.$Bitrix.Loc.getMessage(key);
			}
		},
		template: `
		<ScrollWithGradient> 
			<div class="bx-im-chat-search__container">
				<div class="bx-im-chat-search__title">
					{{ loc('IM_SEARCH_SECTION_RECENT_CHATS') }}
				</div>
				<template v-if="showLatestSearchResult">
					<SearchItem
						v-for="(item, index) in recentSearchItems"
						:key="item.dialogId"
						:dialogId="item.dialogId"
						:selected="isSelected(item.dialogId)"
						:selfChatReplace="false"
						@clickItem="onClickItemRecentItem($event, index)"
					/>
				</template>
				<template v-else>
					<SearchItem
						v-for="(item, index) in searchResult"
						:key="item.dialogId"
						:dialogId="item.dialogId"
						:dateMessage="item.dateMessage"
						:withDate="true"
						:isSelected="isSelected(item.dialogId)"
						:query="query"
						:selfChatReplace="false"
						@clickItem="onClickItem($event, index)"
					/>
					<SearchEmptyState v-if="isEmptyState" />
				</template>
			</div>
		</ScrollWithGradient> 
	`
	};

	const SectionsWithNotes = new Set([ForwardAllSection, im_v2_const.RecentType.default]);
	const SectionsWithNestedChats = new Set([ForwardAllSection, im_v2_const.RecentType.taskComments]);

	// The role every row of the result list carries. FocusZone has no public focus move, so the row to
	// enter is looked up in the DOM by it.
	const RESULT_OPTION_SELECTOR = '[role="option"]';

	// The numeric keypad carries its own code for Enter, and the helper compares event.code.
	const ENTER_KEYS = ['Enter', 'NumpadEnter'];

	// Every key that confirms the focused recipient. Exact, so Ctrl+Enter and Shift+Space stay native.
	const SELECT_OPTION_KEYS = [...ENTER_KEYS, 'Space'];

	// An id may not carry every character a dialogId may (ALG-01).
	const UNSAFE_ID_CHARS = /[^\w-]/g;

	// @vue/component
	const ForwardSearch = {
		name: 'ForwardSearch',
		components: {
			ScrollWithGradient: im_v2_component_elements_scrollWithGradient.ScrollWithGradient,
			SearchItem,
			RecentEmptyState,
			SearchEmptyState,
			Loader: im_v2_component_elements_loader.Loader
		},
		inject: {
			// Provided by ForwardPopup, unwrapped by Vue into a plain boolean. The default keeps the list
			// working when it is mounted without the window around it.
			isForwardContentVisible: {
				default: true
			}
		},
		props: {
			query: {
				type: String,
				default: ''
			},
			dialogId: {
				type: String,
				required: true
			},
			recentSection: {
				type: String,
				default: null
			},
			// EVENT-01: the id space of the window this list belongs to. A keystroke from the shared
			// channel acts here only when it was typed in the same window.
			searchContext: {
				type: String,
				default: null
			},
			// The name of the active section, ready to be spoken. Only the window owns the tab set and the
			// phrase of every tab, so the list is handed the name instead of deriving it: without one the
			// announcement of a section switch carries the size of the list alone.
			sectionName: {
				type: String,
				default: null
			},
			multiple: {
				type: Boolean,
				default: false
			},
			selectedDialogIds: {
				type: Array,
				default: () => []
			},
			selectionLimitReached: {
				type: Boolean,
				default: false
			}
		},
		emits: ['clickItem', 'toggleItem', 'loading', 'returnFocusToSearch'],
		data() {
			return {
				isLoading: false,
				isRecentLoading: false,
				currentServerQueries: 0,
				recentItemsBySection: {},
				searchResult: [],
				// The option of the listbox the tab stop of the zone is on. The focusin of the container puts it
				// on the row the zone moved the focus to, and a list whose rows were replaced under it follows
				// the zone as well, so this and aria-selected never name a row the Tab key does not lead to.
				activeDialogId: null,
				// The one line the status region of the window carries. Empty while the list is loading: the
				// channel reports the settled result, never the loading itself.
				statusText: '',
				// True while the list on screen is the one a section switch has just brought in. The name of
				// the section belongs to that announcement only, and a query starts a story of its own.
				afterSectionSwitch: false
			};
		},
		computed: {
			showLatestSearchResult() {
				return this.query.length === 0;
			},
			currentSection() {
				return this.recentSection ?? im_v2_const.RecentType.default;
			},
			needShowNotes() {
				return SectionsWithNotes.has(this.currentSection);
			},
			recentItems() {
				return this.recentItemsBySection[this.currentSection] ?? [];
			},
			recentSearchItems() {
				const selfChatId = im_v2_application_core.Core.getUserId().toString();
				const filteredRecent = this.filterAvailableRecipients(this.recentItems).filter(({
					dialogId
				}) => dialogId !== selfChatId);
				if (this.needShowNotes) {
					filteredRecent.unshift({
						dialogId: selfChatId,
						dateMessage: ''
					});
				}
				return filteredRecent;
			},
			isEmptyState() {
				return this.searchResult.length === 0;
			},
			showRecentEmptyState() {
				return this.showLatestSearchResult && !this.isRecentLoading && this.recentSearchItems.length === 0;
			},
			showSearchEmptyState() {
				return !this.showLatestSearchResult && this.isEmptyState;
			},
			// The rows the user sees, whichever of the two lists is on screen.
			shownItems() {
				return this.showLatestSearchResult ? this.recentSearchItems : this.searchResult;
			},
			// Both requests fill the same list, so either of them makes it busy.
			isBusy() {
				return this.isLoading || this.isRecentLoading;
			},
			// A loading list counts as nothing to enter: the rows are about to be replaced.
			canEnterResults() {
				if (this.isBusy) {
					return false;
				}
				return this.shownItems.length > 0;
			},
			// The active option, as long as the list still offers its row - the last guard against a row that
			// left the screen between a keystroke and the update of the active option. The row is the one
			// aria-selected and the tab stop of the zone are on, so it is the recipient the reader has named -
			// and the one an Enter typed back in the search field has to confirm.
			activeOptionDialogId() {
				const isShown = this.shownItems.some(item => item.dialogId === this.activeDialogId);
				return isShown ? this.activeDialogId : null;
			},
			// The heading over the list on screen. A named section is what the announcement of a switch calls
			// that list, and two names for one list is one name too many, so the heading says the same. Without
			// a name of its own - the window of a guest renders no tabs, and a search result belongs to no
			// section - the phrase of the recent chats stays.
			listTitle() {
				if (this.showLatestSearchResult && this.sectionName) {
					return this.sectionName;
				}
				return this.loc('IM_SEARCH_SECTION_RECENT_CHATS');
			},
			// A blank aria-label would wipe the name of the list instead of leaving it computable, so a
			// missing phrase yields no attribute at all.
			recipientsLabel() {
				return this.loc('IM_SEARCH_FORWARD_RECIPIENTS_ARIA') || null;
			},
			// ALG-01: the ids of the window come from the namespace ForwardContent owns and hands over as the
			// search context. The search field of the same window already points its aria-controls here.
			listboxId() {
				if (!this.searchContext) {
					return null;
				}
				return `${this.searchContext}-listbox`;
			},
			// ALG-01 as well: the aria-describedby of the search field is already pointing at this id.
			statusId() {
				if (!this.searchContext) {
					return null;
				}
				return `${this.searchContext}-status`;
			},
			// Everything one published line is built from, in a single value: the watcher over it runs once
			// per update no matter how many of the three moved together, so the region never says it twice.
			statusSource() {
				return {
					isBusy: this.isBusy,
					total: this.shownItems.length,
					showsRecent: this.showLatestSearchResult
				};
			}
		},
		watch: {
			query(newQuery) {
				// Whatever the list shows from here on is the answer to a query, not to a section switch.
				this.afterSectionSwitch = false;
				// The active option belongs to the result it was picked in. An Enter in the field that arrives
				// before the answer to this query does must not confirm a recipient of the previous one, so the
				// option goes away together with the query it was named for.
				this.activeDialogId = null;
				if (newQuery.length === 0) {
					this.cleanSearchResult();
				}
				this.startSearch(newQuery);
			},
			recentSection() {
				this.afterSectionSwitch = true;
				this.switchSearchService();
				void this.loadRecentItems();
			},
			isLoading(newValue) {
				this.$emit('loading', newValue);
			},
			statusSource({
				isBusy
			}) {
				// A loading list has nothing final to say, and narrating the loading itself is exactly the
				// speech noise a single status channel exists to avoid.
				this.statusText = isBusy ? '' : this.buildStatusText();
			},
			shownItems() {
				// Read before Vue patches the rows: by the time the new rows are in place the browser has
				// already dropped the focus of a removed row to body, and there would be no telling that
				// from a focus the user had moved to the search field or the tabs himself.
				const focusWasInList = this.isFocusInsideList();
				void this.$nextTick(() => {
					this.syncActiveOption(focusWasInList);
				});
			},
			isForwardContentVisible(isVisible) {
				// The window holds its content at zero opacity until it has finished opening, so every row
				// counted as invisible while mounted() ran and the zone collected nothing. The opacity of an
				// ancestor is not something its MutationObserver sees, hence the explicit second enable.
				if (isVisible) {
					this.enableFocusZone();
				}
			}
		},
		created() {
			this.searchServices = {};
			this.searchService = this.getSearchService(this.currentSection);
			this.searchOnServerDelayed = main_core.Runtime.debounce(this.searchOnServer, 400, this);
			// The zone over the listbox container. Non-reactive on purpose: a class instance behind a Vue
			// proxy breaks its own private fields.
			this.focusZone = null;
			this.getEmitter().subscribe(im_v2_const.EventType.search.keyPressed, this.onKeyPressed);
			void this.loadRecentItems();
		},
		mounted() {
			this.enableFocusZone();
		},
		beforeUnmount() {
			this.getEmitter().unsubscribe(im_v2_const.EventType.search.keyPressed, this.onKeyPressed);
			this.focusZone?.deactivate();
			this.focusZone = null;
		},
		methods: {
			getSearchService(section) {
				this.searchServices[section] ??= new im_v2_provider_service_search.SearchService(this.getSectionSearchConfig(section));
				return this.searchServices[section];
			},
			getSectionSearchConfig(section) {
				const withNestedChats = SectionsWithNestedChats.has(section);
				const searchConfig = {
					...EntitySearchConfig[EntitySearchType.messageForward],
					parentId: withNestedChats ? im_v2_const.ParentChatScope.all : im_v2_const.ParentChatScope.topLevel
				};
				if (section === ForwardAllSection) {
					return {
						...searchConfig,
						searchAllChats: true
					};
				}
				return {
					...searchConfig,
					searchRecentSection: section
				};
			},
			async loadRecentItems() {
				const requestedSection = this.currentSection;
				if (this.recentItemsBySection[requestedSection]) {
					this.isRecentLoading = false;
					return;
				}
				this.isRecentLoading = true;
				this.recentItemsBySection[requestedSection] = await this.getSearchService(requestedSection).loadLatestResults();
				if (requestedSection === this.currentSection) {
					this.isRecentLoading = false;
				}
			},
			switchSearchService() {
				this.searchService = this.getSearchService(this.currentSection);
				this.cleanSearchResult();
				if (this.query.length > 0) {
					this.startSearch(this.query);
				}
			},
			filterAvailableRecipients(items) {
				return items.filter(({
					dialogId
				}) => {
					const chat = this.$store.getters['chats/get'](dialogId);
					return chat?.type !== im_v2_const.ChatType.videoconf && chat?.entityType !== 'VIDEOCONF';
				});
			},
			startSearch(query) {
				if (query.length > 0) {
					const result = this.searchService.searchLocal(query);
					if (query !== this.query) {
						return;
					}
					this.searchResult = im_v2_lib_search.sortByDate(this.filterAvailableRecipients(result));
				}
				if (query.length >= getMinTokenSize()) {
					this.isLoading = true;
					this.searchOnServerDelayed(query);
				}
			},
			cleanSearchResult() {
				this.searchResult = [];
				this.searchService.clearSessionResult();
			},
			async searchOnServer(query) {
				this.currentServerQueries++;

				// The section is captured with the query: the pending promise holds the SearchService of the
				// section that started it, so with the query kept across a tab switch the old answer would
				// otherwise be merged into the list of the new one.
				const requestedSection = this.currentSection;
				const searchResult = await this.searchService.search(query);
				if (query !== this.query || requestedSection !== this.currentSection) {
					this.stopLoader();
					return;
				}
				const mergedItems = mergeSearchItems(this.searchResult, searchResult);
				this.searchResult = im_v2_lib_search.sortByDate(this.filterAvailableRecipients(mergedItems));
				this.stopLoader();
			},
			stopLoader() {
				this.currentServerQueries--;
				if (this.currentServerQueries > 0) {
					return;
				}
				this.isLoading = false;
			},
			onClickItem(event, itemIndex) {
				if (this.isOptionDisabled(event.dialogId)) {
					return;
				}
				if (!this.isRemovingSelection(event.dialogId)) {
					im_v2_lib_analytics.Analytics.getInstance().messageForward.onSelectRecipientFromSearchResult({
						dialogId: this.dialogId,
						position: itemIndex + 1
					});
				}
				this.emitSelectItem(event);
			},
			onClickRecentItem(event, itemIndex) {
				if (this.isOptionDisabled(event.dialogId)) {
					return;
				}
				if (!this.isRemovingSelection(event.dialogId)) {
					im_v2_lib_analytics.Analytics.getInstance().messageForward.onSelectRecipientFromRecent({
						dialogId: this.dialogId,
						position: itemIndex + 1,
						section: this.currentSection
					});
				}
				this.emitSelectItem(event);
			},
			isRemovingSelection(dialogId) {
				return this.multiple && this.selectedDialogIds.includes(dialogId);
			},
			emitSelectItem(event) {
				this.$emit(this.multiple ? 'toggleItem' : 'clickItem', event);
			},
			enableFocusZone() {
				const container = this.$refs.listbox;
				if (!container) {
					return;
				}
				this.focusZone ??= im_v2_lib_a11y.createListFocusZone(container);

				// Idempotent: both mounted() and the visibility signal enable the same zone.
				if (this.focusZone.isActive()) {
					this.focusZone.refreshElements();
					return;
				}
				this.focusZone.activate();
			},
			// The whole content of the status region for the list as it stands now.
			buildStatusText() {
				if (this.shownItems.length === 0) {
					// Every phrase the visible empty state carries, so what is heard matches what is seen: the
					// empty search shows a hint under its title, the empty section has none to show.
					if (this.showLatestSearchResult) {
						return this.loc('IM_SEARCH_RESULT_NO_RECENT');
					}
					return [this.loc('IM_SEARCH_RESULT_NOT_FOUND'), this.loc('IM_SEARCH_RESULT_NOT_FOUND_DESCRIPTION')].join('. ');
				}

				// Plural forms live on the Loc of main.core: $Bitrix.Loc has no getMessagePlural at all, and
				// its second argument is a default value rather than a set of replacements.
				const result = main_core.Loc.getMessagePlural('IM_SEARCH_FORWARD_RESULT_COUNT_ARIA', this.shownItems.length, {
					'#COUNT#': this.shownItems.length
				});
				if (!this.afterSectionSwitch || !this.showLatestSearchResult || !this.sectionName) {
					return result;
				}

				// A section is named together with the size of its list, and only once the list has arrived:
				// said any earlier this would land on top of the announcement of the tab itself.
				return main_core.Loc.getMessage('IM_SEARCH_FORWARD_SECTION_RESULT_ARIA_TEMPLATE', {
					'#SECTION#': this.sectionName,
					'#RESULT#': result
				});
			},
			// The rows are patched by now: the active option ends up on the row the tab stop of the zone ends up
			// on, and a focus the patch dropped goes back to whatever is active after it.
			syncActiveOption(focusWasInList) {
				const previousActive = this.activeDialogId;
				if (!focusWasInList) {
					// Nobody is in the list, so where the tab stop lands is the zone's call alone: it keeps it on
					// its row while the patch spares that row and hands it to the first row of the new set
					// otherwise - which is what crossing between the recent list and a search result does, they
					// are two branches of the template. The active option follows it or goes away with it, back
					// to the state of a list nobody has entered.
					const isTabStopRowKept = this.focusZone?.getCurrentFocusedElement()?.isConnected === true;
					this.activeDialogId = isTabStopRowKept ? previousActive : null;

					// With no option of its own, the list is one nobody has entered, and the row it is entered at
					// is its first one. The zone alone would leave the stop wherever it survived: on the row of an
					// option a changed query has just dropped, or on the row that was first before the answer
					// re-sorted them.
					if (this.activeDialogId === null) {
						this.resetTabStopToFirstOption();
					}
					return;
				}

				// The set of the zone is needed right here, and before the focus is restored. Everywhere else the
				// observer of the zone re-collects the rows in this very frame on its own, so an unconditional
				// refresh would walk the whole list twice per update.
				this.focusZone?.refreshElements();
				const isActiveKept = previousActive !== null && this.shownItems.some(item => item.dialogId === previousActive);

				// A list nobody has entered yet keeps its "no active option" state; an option whose row is
				// gone moves to the first row of the new list, or to nothing at all when it came back empty.
				if (previousActive !== null && !isActiveKept) {
					this.activeDialogId = this.shownItems[0]?.dialogId ?? null;
				}
				if (!this.isFocusInsideList()) {
					this.restoreListFocus();
					return;
				}
				if (isActiveKept) {
					// The focus has not moved, so nothing but this brings the kept row back into view.
					this.findOption(previousActive)?.scrollIntoView({
						block: 'nearest'
					});
				}
			},
			// The tab stop of the zone sits on a node, not on a position: FocusZone keeps it on its row for as long
			// as the patch spares that row, and offers no move of its own. Re-activating the zone over the same
			// container is that move - activate() puts the stop on the first element of the set it collects - and
			// it writes tabindex alone, so a user standing on a row is never pulled off it.
			resetTabStopToFirstOption() {
				const firstOption = this.$refs.listbox?.querySelector(RESULT_OPTION_SELECTOR);
				const tabStopRow = this.focusZone?.getCurrentFocusedElement();

				// A stop that is nowhere yet, and one left on a row the patch removed, are both handed to the first
				// row by the zone itself: collecting the set again for either of them would buy nothing.
				if (!firstOption || !tabStopRow?.isConnected || tabStopRow === firstOption) {
					return;
				}
				this.focusZone.deactivate();
				this.enableFocusZone();
			},
			// FocusZone only hands the tab stop over when the focused row disappears - it never calls focus()
			// itself, and the browser has dropped the focus to body by now. isFocusOwnedByPopup() is
			// deliberately not consulted: the forward window is a popup, so the guard would always refuse.
			restoreListFocus() {
				const activeOption = this.findOption(this.activeDialogId);
				if (activeOption) {
					activeOption.focus();
					return;
				}

				// Nothing left to hold the focus: it goes back where the window put it on opening. The field
				// belongs to the window, so the window is asked to take the focus back instead of the list
				// reaching for a node of its neighbour.
				this.$emit('returnFocusToSearch');
			},
			isFocusInsideList() {
				const container = this.$refs.listbox;
				return Boolean(container) && container.contains(document.activeElement);
			},
			findOption(dialogId) {
				if (!dialogId) {
					return null;
				}

				// Attribute form instead of an id selector: a dialogId needs no escaping this way.
				return this.$refs.listbox?.querySelector(`[data-id="${dialogId}"]`);
			},
			optionId(dialogId) {
				if (!this.searchContext) {
					return null;
				}
				return `${this.searchContext}-option-${dialogId.replaceAll(UNSAFE_ID_CHARS, '_')}`;
			},
			// The per-row half of what makes a row an option of the listbox: only the attributes that depend on
			// the row itself. The constant ones are static in the template, so walking the list with the arrows
			// rebuilds three attributes per row instead of five. Like them, these fall through SearchItem to the
			// root of SearchItemLayout, which carries none of them itself, so no other consumer of the row is
			// affected.
			optionAttrs(dialogId) {
				return {
					id: this.optionId(dialogId),
					'aria-selected': this.multiple ? this.selectedDialogIds.includes(dialogId) : dialogId === this.activeDialogId,
					'aria-disabled': this.isOptionDisabled(dialogId) || null,
					// The dialogId of the row as it is: the delegated handlers below read it back from the
					// focused node instead of reversing the escaped option id, which is not one to one.
					'data-id': dialogId
				};
			},
			isOptionDisabled(dialogId) {
				return this.multiple && this.selectionLimitReached && !this.selectedDialogIds.includes(dialogId);
			},
			onOptionFocusIn(event) {
				// The row the arrows bring the focus to becomes the active option, so the active dialogId, the
				// DOM focus, the tab stop of the zone and aria-selected stay on one and the same row.
				const dialogId = this.getOptionDialogId(event.target);
				if (dialogId) {
					this.activeDialogId = dialogId;
				}
			},
			onOptionKeydown(event) {
				if (!im_v2_lib_utils.Utils.key.isExactCombination(event, SELECT_OPTION_KEYS)) {
					return;
				}
				const dialogId = this.getOptionDialogId(event.target);
				if (!dialogId) {
					return;
				}

				// Space would otherwise scroll the page behind the window; Enter is cancelled with it, so
				// neither key reaches anything above the list.
				event.preventDefault();
				this.selectOption(dialogId, event);
			},
			getOptionDialogId(target) {
				return target?.closest?.(RESULT_OPTION_SELECTOR)?.dataset.id ?? null;
			},
			selectOption(dialogId, keyboardEvent) {
				// The path of a click on the very same row, analytics included: the position of a recipient is
				// its place in the list the user sees.
				const itemIndex = this.shownItems.findIndex(item => item.dialogId === dialogId);
				if (itemIndex === -1) {
					return;
				}
				const event = {
					dialogId,
					nativeEvent: keyboardEvent
				};
				if (this.showLatestSearchResult) {
					void this.onClickRecentItem(event, itemIndex);
					return;
				}
				void this.onClickItem(event, itemIndex);
			},
			// Public: ForwardContent calls this on ArrowDown in the search zone. The last response may have
			// replaced the rows, so the zone re-collects them before the first one takes the focus.
			focusFirstResult() {
				if (!this.canEnterResults || !this.focusZone) {
					return;
				}
				this.focusZone.refreshElements();
				this.$refs.listbox?.querySelector(RESULT_OPTION_SELECTOR)?.focus();
			},
			onKeyPressed(event) {
				const {
					keyboardEvent,
					context
				} = event.getData();

				// A publisher rolled back to the previous contract carries no context field at all, which
				// has to read the same as an explicit null on both sides of the comparison.
				if ((context ?? null) !== (this.searchContext ?? null)) {
					return;
				}
				if (im_v2_lib_utils.Utils.key.isCombination(keyboardEvent, ENTER_KEYS)) {
					this.onPressEnterKey(event);
				}
			},
			onPressEnterKey(keyboardEvent) {
				// The active option wins over the first row: it is the one the reader announced as selected and
				// the one the tab stop stayed on when the focus went back to the field. With no active option
				// the key keeps its previous action and takes the first row of the list on screen - the rows the
				// user cannot see are none of its business.
				const dialogId = this.activeOptionDialogId ?? this.shownItems[0]?.dialogId;
				if (!dialogId) {
					return;
				}

				// The very path a click on that row takes, so the recipient is reported with its place in the
				// list and from the list it was actually picked in.
				this.selectOption(dialogId, keyboardEvent);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(key) {
				return this.$Bitrix.Loc.getMessage(key);
			}
		},
		template: `
		<ScrollWithGradient>
			<div class="bx-im-chat-search__container">
				<div v-if="!showRecentEmptyState" class="bx-im-chat-search__title">
					{{ listTitle }}
				</div>
				<div
					ref="listbox"
					:id="listboxId"
					data-testid="im-forward-recipient-list"
					class="bx-im-chat-search__result-list"
					role="listbox"
					:aria-label="recipientsLabel"
					:aria-busy="isBusy"
					:aria-multiselectable="multiple || null"
					@focusin="onOptionFocusIn"
					@keydown="onOptionKeydown"
				>
					<!-- role and tabindex are the same for every row and never change: the roving tab stop is
							 the zone's to write, and a row with no tabindex of its own would not even be
							 collected as focusable. Static here, so the arrows do not rebuild them per row. -->
					<template v-if="showLatestSearchResult">
						<SearchItem
							v-for="(item, index) in recentSearchItems"
							:key="item.dialogId"
							:dialogId="item.dialogId"
							:selected="multiple && selectedDialogIds.includes(item.dialogId)"
							role="option"
							tabindex="-1"
							v-bind="optionAttrs(item.dialogId)"
							@clickItem="onClickRecentItem($event, index)"
						/>
					</template>
					<template v-else>
						<SearchItem
							v-for="(item, index) in searchResult"
							:key="item.dialogId"
							:dialogId="item.dialogId"
							:selected="multiple && selectedDialogIds.includes(item.dialogId)"
							:dateMessage="item.dateMessage"
							:withDate="true"
							:query="query"
							role="option"
							tabindex="-1"
							v-bind="optionAttrs(item.dialogId)"
							@clickItem="onClickItem($event, index)"
						/>
					</template>
				</div>
				<!-- Decoration only: the loading is carried by aria-busy above, and the text of both empty
						 states - the hint of the empty search included - is what the status region below says. -->
				<Loader v-if="showLatestSearchResult && isRecentLoading" class="bx-im-chat-search__loader" aria-hidden="true" />
				<RecentEmptyState v-if="showRecentEmptyState" aria-hidden="true" />
				<SearchEmptyState v-if="showSearchEmptyState" aria-hidden="true" />
				<!-- The single status channel of the window. Rendered from mount on, only its text changes:
						 a region that appears together with its text is announced by nothing, and the
						 aria-describedby of the search field would hang on a missing node until then. The
						 style is inline because the region has no visual design of its own to name a class for. -->
				<div
					:id="statusId"
					role="status"
					aria-live="polite"
					aria-atomic="true"
					style="position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;"
				>{{ statusText }}</div>
			</div>
		</ScrollWithGradient>
	`
	};

	exports.AddToChatSearch = AddToChatSearch;
	exports.ChatSearchInput = ChatSearchInput;
	exports.ForwardAllSection = ForwardAllSection;
	exports.ForwardSearch = ForwardSearch;
	exports.RecentSearch = RecentSearch;
	exports.RecentSearchView = RecentSearchView;

})(this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {}, BX, window, BX, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Component.Elements);
//# sourceMappingURL=registry.bundle.js.map
