/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, im_public, im_v2_application_core, im_v2_const, im_v2_lib_access, im_v2_lib_analytics, im_v2_lib_entitySelectorConfig, im_v2_lib_guest, im_v2_lib_permission, im_v2_provider_service_chat, im_v2_lib_localStorage, ui_entitySelector, im_v2_lib_recent, im_v2_lib_search, ui_vue3_components_button, im_v2_lib_feature, im_v2_lib_notifier, im_v2_lib_utils, im_v2_provider_service_guestInvitation, main_core_events, im_v2_lib_helpdesk, im_v2_component_elements_scrollWithGradient, main_popup, ui_vue3_directives_hint, intranet_languages, ui_iconSet_api_core, ui_iconSet_api_vue, im_v2_lib_confirm, ui_system_checkbox, im_v2_lib_channel, im_v2_component_elements_button, ui_infoHelper, intranet_invitationInput, im_v2_lib_collab, im_v2_provider_service_collabInvitation, ui_vue3, im_v2_component_elements_popup, ui_a11y, im_v2_component_search, im_v2_lib_soundNotification, im_v2_provider_service_sending, im_v2_component_list_container_elements_navigationSection, im_v2_lib_a11y, im_v2_lib_copilot, ui_buttons, ui_system_dialog, im_v2_lib_folder, im_v2_lib_layout) {
	'use strict';

	function getRememberedTabId(canInviteGuests) {
		resetRememberedGuestTab();
		const savedTab = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.invitePopupTab);
		if (!canInviteGuests || !savedTab) {
			return im_v2_const.TabId.employees;
		}
		return savedTab;
	}
	function resetRememberedGuestTab() {
		const storage = im_v2_lib_localStorage.LocalStorageManager.getInstance();
		if (storage.get(im_v2_const.LocalStorageKey.invitePopupGuestTabReset) === true) {
			return;
		}
		storage.set(im_v2_const.LocalStorageKey.invitePopupGuestTabReset, true);
		if (storage.get(im_v2_const.LocalStorageKey.invitePopupTab) === im_v2_const.TabId.guests) {
			storage.remove(im_v2_const.LocalStorageKey.invitePopupTab);
		}
	}

	class GuestsStub extends ui_entitySelector.BaseStub {
		render() {
			return this.getOption('content');
		}
	}

	// The recent list of the messenger read locally: people, no guests, and no deeper than the page the
	// server answers with (RecentProvider::LIMIT), so the prefill stays a preview of that answer. The
	// rule repeats the one the recent entity asks the provider for (MESSENGER_RECENT_OPTIONS).
	const MESSENGER_RECENT_STORE_FILTER = {
		withFakeUsers: true,
		withGuests: false,
		userLimit: 30
	};
	const MILLISECONDS_IN_SECOND = 1000;

	// The same list the recent entity asks the server for, read from the messenger store instead.
	// It puts the tab on screen with the window frame; ui.entityselector.load then refines it, and
	// the dialog keeps items by entity and id, so the answer reuses these rows rather than doubling them.
	const getMessengerRecentItems = (options = {}) => {
		if (options.withRecent !== true) {
			return [];
		}
		return im_v2_lib_search.getUsersFromRecentItems(MESSENGER_RECENT_STORE_FILTER).map(({
			dialogId
		}) => buildMessengerRecentItem(dialogId));
	};
	const buildMessengerRecentItem = dialogId => {
		const user = im_v2_application_core.Core.getStore().getters['users/get'](dialogId, true);
		return {
			id: dialogId,
			entityId: im_v2_const.SelectorEntity.recent,
			entityType: im_v2_const.SearchEntityIdTypes.imUser,
			title: user.name,
			avatar: getAvatarUrl(user),
			sort: getMessengerSortSeconds(dialogId),
			customData: {
				id: user.id
			}
		};
	};
	const getAvatarUrl = user => {
		if (user.avatar.length === 0) {
			return undefined;
		}
		return decodeURI(user.avatar);
	};

	// The tab stands in the order of the messenger chat list, so the row and the comparator below read
	// the same date the recent collection sorts by: a draft or an activity newer than the last message,
	// the start of the day behind a birthday placeholder, the message date otherwise.
	const getMessengerSortTime = dialogId => {
		const sortDate = im_v2_lib_recent.RecentManager.getSortDate(dialogId);
		return sortDate ? sortDate.getTime() : null;
	};

	// The provider puts a unix timestamp in sort (RecentProvider::getBlankItem), so the local row keeps
	// the same scale and stays a preview of the answer rather than a value of its own.
	const getMessengerSortSeconds = dialogId => {
		const sortTime = getMessengerSortTime(dialogId);
		return sortTime === null ? 0 : Math.floor(sortTime / MILLISECONDS_IN_SECOND);
	};

	// The recent tab of the invitation window is ordered the way the messenger orders its chat list:
	// by the same sort date descending, equal dates apart by dialog id (recent model, #compareByDate).
	const compareRecentNodes = (nodeA, nodeB) => {
		const itemA = nodeA.getItem();
		const itemB = nodeB.getItem();
		const timeA = getNodeSortTime(itemA);
		const timeB = getNodeSortTime(itemB);
		if (timeA === timeB) {
			return String(itemA.getId()) > String(itemB.getId()) ? 1 : -1;
		}
		return timeB - timeA;
	};

	// A row the server sent and the messenger store never saw keeps the order the provider gave it:
	// its unix seconds are brought to the scale of the store dates.
	const getNodeSortTime = item => {
		const sortTime = getMessengerSortTime(String(item.getId()));
		if (sortTime !== null) {
			return sortTime;
		}
		return (item.getSort() ?? 0) * MILLISECONDS_IN_SECOND;
	};

	// The place a row took in the answer it came with. The tab appends its results in the order its own
	// relevance put them (SearchTab.appendResults), and OrderedArray weighs the row being inserted
	// against the rows already standing, always as the second argument - so stamping both sides of a
	// comparison records exactly that order. A comparator answering 0 would not keep it: an equal node
	// is inserted in front of the one already there, and the list would turn itself over row by row.
	const arrivalOrder = new WeakMap();
	let lastArrival = 0;
	const rememberArrival = item => {
		if (!arrivalOrder.has(item)) {
			lastArrival += 1;
			arrivalOrder.set(item, lastArrival);
		}
		return arrivalOrder.get(item);
	};
	const compareByArrival = (itemA, itemB) => {
		return rememberArrival(itemA) - rememberArrival(itemB);
	};

	// SORT-02: the search tab is one flat list, and people stand in it in the order the invitation window
	// has always stood them (im.v2.lib.search, sortByDate): the person talked to later first, anyone
	// talked to at all above someone the messenger has never seen, the portal above the extranet, and
	// everything the rule leaves equal in the order the answer brought it. A bot is one of the people
	// here, the way it was in the old window. The org structure is new to this list and goes below the
	// people, in the relevance the search put on it.
	const compareSearchNodes = (nodeA, nodeB) => {
		const itemA = nodeA.getItem();
		const itemB = nodeB.getItem();
		rememberArrival(itemA);
		rememberArrival(itemB);
		const isPersonA = im_v2_lib_entitySelectorConfig.isPersonEntity(itemA.getEntityId());
		const isPersonB = im_v2_lib_entitySelectorConfig.isPersonEntity(itemB.getEntityId());
		if (isPersonA !== isPersonB) {
			return isPersonA ? -1 : 1;
		}
		return isPersonA ? comparePeopleItems(itemA, itemB) : compareStructureItems(itemA, itemB);
	};
	const comparePeopleItems = (itemA, itemB) => {
		const timeA = getLastMessageTime(itemA);
		const timeB = getLastMessageTime(itemB);
		if (timeA !== null && timeB !== null && timeA !== timeB) {
			return timeB - timeA;
		}
		if (timeA === null && timeB !== null) {
			return 1;
		}
		if (timeA !== null && timeB === null) {
			return -1;
		}
		if (timeA === null && timeB === null) {
			const isExtranetA = isExtranetPerson(String(itemA.getId()));
			const isExtranetB = isExtranetPerson(String(itemB.getId()));
			if (isExtranetA !== isExtranetB) {
				return isExtranetA ? 1 : -1;
			}
		}
		return compareByArrival(itemA, itemB);
	};

	// The date the search list is ordered by: the last message of the conversation, the same one the old
	// window read (im.v2.lib.search, getRecentItemDate). The answer carries it where the provider of the
	// recent list sends it; a row of any other provider is asked of the messenger store.
	const getLastMessageTime = item => {
		const dateFromAnswer = item.getCustomData().get('dateMessage');
		if (dateFromAnswer) {
			const time = new Date(dateFromAnswer).getTime();
			return Number.isNaN(time) ? null : time;
		}
		const message = im_v2_application_core.Core.getStore().getters['recent/getMessage'](String(item.getId()));
		return message?.date ? message.date.getTime() : null;
	};

	// All the item itself holds of the cascade the search tab sorts the org structure by (search-tab,
	// appendResults): the context sort first, then the global one, a value ahead of nothing, the larger
	// one above. What neither of them tells apart keeps the order of the answer.
	const compareStructureItems = (itemA, itemB) => {
		const byContextSort = compareSortValues(itemA.getContextSort(), itemB.getContextSort());
		if (byContextSort !== 0) {
			return byContextSort;
		}
		const byGlobalSort = compareSortValues(itemA.getGlobalSort(), itemB.getGlobalSort());
		if (byGlobalSort !== 0) {
			return byGlobalSort;
		}
		return compareByArrival(itemA, itemB);
	};
	const compareSortValues = (sortA, sortB) => {
		if (sortA === null && sortB === null) {
			return 0;
		}
		if (sortA === null || sortB === null) {
			return sortA === null ? 1 : -1;
		}
		return sortB - sortA;
	};
	const isExtranetPerson = dialogId => {
		return im_v2_application_core.Core.getStore().getters['users/isExtranet'](dialogId);
	};

	// The context the chat forms keep their selector history in: a department or a team picked while
	// creating or editing a chat stands in the recent tab here as well, and the other way round.
	const SELECTOR_CONTEXT = 'IM_CHAT_CREATE';
	const RECENT_TAB_OPTIONS = {
		itemOrder: compareRecentNodes
	};
	const SEARCH_TAB_OPTIONS = {
		itemOrder: compareSearchNodes
	};
	const DEFAULT_WITH_TEAMS = true;
	const WINDOW_WIDTH = 400;
	const WINDOW_HEIGHT = 519;
	const TAB_LABELS_WIDTH = 38;
	const TAG_SELECTOR_MAX_HEIGHT = 111;
	const WINDOW_CLASS = 'bx-im-messenger__scope bx-im-entity-selector-add-to-chat__scope';
	const GUEST_TAB_CLASS = 'bx-im-entity-selector-add-to-chat__guest-tab';

	// Where in the window a person was picked. The window knows the list and the place in it; what the
	// pair means to the metrics is decided by the one that sends them.

	class AddToChatWindow {
		#options;
		#tagSelector;
		#dialog;
		constructor(options) {
			this.#options = options;
			this.#dialog = this.#createDialog();
			this.#tagSelector = this.#requireTagSelector();
			this.#fillRecentTab();
			this.#showGuestsStub();
		}
		getTagSelector() {
			return this.#tagSelector;
		}
		show() {
			this.#dialog.show();
		}
		destroy() {
			this.#dialog.destroy();
		}
		toggleGuestTab(isGuestTab) {
			const windowContainer = this.#dialog.getContainer();
			if (isGuestTab) {
				this.#dialog.selectTab(im_v2_const.TabId.guests);
				main_core.Dom.addClass(windowContainer, GUEST_TAB_CLASS);
				return;
			}
			this.#dialog.selectFirstTab();
			main_core.Dom.removeClass(windowContainer, GUEST_TAB_CLASS);
		}
		setAutoHide(autoHide) {
			this.#dialog.setAutoHide(autoHide);
		}
		getSelectedItemCount() {
			return this.#dialog.getSelectedItems().length;
		}
		getSelectedUserIds() {
			const userIds = this.#dialog.getSelectedItems().map(item => this.#getUserId(item)).filter(userId => userId !== null);
			return [...new Set(userIds)];
		}
		getSelectedStructureNodes() {
			return this.#dialog.getSelectedItems().filter(item => im_v2_lib_entitySelectorConfig.isLinkableNodeEntity(item.getEntityId())).map(item => [item.getEntityId(), item.getId()]);
		}
		#handleItemSelect(event) {
			const {
				item,
				node
			} = event.getData();
			this.#dropSelectionTwin(item);
			this.#reportUserSelect(item, node ?? null);
			this.#options.onSelectionChange();
		}

		// The same person stands in the recent tab as a chat of the messenger and in the search results
		// as a user of the portal: two entities of the dialog, two items and two tags for one addition.
		// The pick just made is the one that stays, so the field shows the person once and the footer
		// counts them once. A bot is offered by the search alone, so it never stands twice.
		#dropSelectionTwin(item) {
			if (item.getEntityId() === im_v2_const.SelectorEntity.user) {
				this.#dialog.getItem([im_v2_const.SelectorEntity.recent, this.#getUserId(item)])?.deselect();
				return;
			}
			if (this.#isRecentUser(item)) {
				this.#dialog.getItem([im_v2_const.SelectorEntity.user, this.#getUserId(item)])?.deselect();
			}
		}

		// The two picks the window is asked about: a person taken from the recent list and a person found
		// by search. A node of the org structure is neither, and a selection made without a row of the
		// list behind it — a preselection, a tag restored — comes with no place to name.
		#reportUserSelect(item, node) {
			if (this.#getUserId(item) === null) {
				return;
			}
			const tab = node?.getTab();
			const fromRecentTab = tab === this.#dialog.getRecentTab();
			if (!fromRecentTab && tab !== this.#dialog.getSearchTab()) {
				return;
			}
			this.#options.onUserSelect({
				fromRecentTab,
				position: this.#getNodePosition(node)
			});
		}

		// The place of the row in the list it was picked from, counted from one the way the window these
		// metrics come from has always counted it.
		#getNodePosition(node) {
			const parentNode = node.getParentNode();
			if (!parentNode) {
				return 1;
			}
			return Math.max(parentNode.getChildren().getIndex(node), 0) + 1;
		}
		#getUserId(item) {
			if (im_v2_lib_entitySelectorConfig.isPersonEntity(item.getEntityId())) {
				return Number(item.getId());
			}
			if (this.#isRecentUser(item)) {
				return Number(item.getCustomData().get('id'));
			}
			return null;
		}
		#isRecentUser(item) {
			return item.getEntityId() === im_v2_const.SelectorEntity.recent && item.getEntityType() === im_v2_const.SearchEntityIdTypes.imUser;
		}
		#requireTagSelector() {
			const tagSelector = this.#dialog.getTagSelector();
			if (!tagSelector) {
				throw new Error('AddToChatWindow: dialog has not created a tag selector');
			}
			return tagSelector;
		}
		#showGuestsStub() {
			this.#dialog.getTab(im_v2_const.TabId.guests)?.getStub()?.show();
		}

		// The dialog would show the recent tab empty until ui.entityselector.load answers. The messenger
		// already holds that list, so the rows go up with the window and the answer only refines them.
		#fillRecentTab() {
			const items = getMessengerRecentItems(this.#getConfigOptions()).map(itemOptions => this.#dialog.addItem(itemOptions));
			this.#dialog.getRecentTab().getRootNode().addItems(items);
		}
		#placeWindow() {
			this.#dialog.getPopup().setOffset({
				offsetTop: this.#options.offsetTop,
				offsetLeft: this.#options.offsetLeft + TAB_LABELS_WIDTH
			});
		}
		#createDialog() {
			return new ui_entitySelector.Dialog({
				context: SELECTOR_CONTEXT,
				entities: this.#getEntitiesConfig(),
				recentTabOptions: {
					...RECENT_TAB_OPTIONS
				},
				searchTabOptions: {
					...SEARCH_TAB_OPTIONS
				},
				targetNode: this.#options.bindElement,
				ariaLabel: this.#options.title,
				width: WINDOW_WIDTH,
				height: WINDOW_HEIGHT,
				header: this.#options.headerContainer,
				headerOptions: {
					containerClass: 'bx-im-entity-selector-add-to-chat__header'
				},
				footer: this.#options.footerContainer,
				footerOptions: {
					containerClass: 'bx-im-entity-selector-add-to-chat__footer'
				},
				// The field has to belong to the dialog: given a tag selector from outside, the dialog
				// treats every Tab in the field as a jump into itself and the window loops on two nodes.
				enableSearch: true,
				tagSelectorOptions: {
					maxHeight: TAG_SELECTOR_MAX_HEIGHT,
					placeholder: this.#getPlaceholder(),
					// the dialog would keep 105px for the text box, wrapping the tags a line earlier
					textBoxWidth: null,
					events: {
						onInput: () => this.#options.onSearchInput()
					}
				},
				tabs: [{
					id: im_v2_const.TabId.guests,
					visible: false,
					stub: GuestsStub,
					stubOptions: {
						autoShow: false,
						content: this.#options.guestsContainer
					}
				}],
				popupOptions: {
					className: WINDOW_CLASS,
					events: {
						onFirstShow: () => this.#placeWindow()
					}
				},
				events: {
					onHide: () => this.#options.onHide(),
					onLoad: () => this.#dropCurrentUser(),
					'SearchTab:onLoad': () => this.#dropCurrentUser(),
					'Item:onSelect': event => this.#handleItemSelect(event),
					'Item:onDeselect': () => this.#options.onSelectionChange()
				}
			});
		}
		#dropCurrentUser() {
			const userId = im_v2_application_core.Core.getUserId();
			[im_v2_const.SelectorEntity.recent, im_v2_const.SelectorEntity.user].forEach(entityId => {
				this.#dialog.removeItem([entityId, userId]);
			});
		}

		// The field promises no more than the window puts up. Where no node of the org structure can be
		// picked - the one to one chat above all, whose "+" builds a group chat of the people alone - a
		// department named in the field would be a promise the chat cannot keep.
		#getPlaceholder() {
			if (im_v2_lib_entitySelectorConfig.offersStructureNodes(this.#getConfigOptions())) {
				return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_SEARCH_PLACEHOLDER');
			}
			return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_SEARCH_PLACEHOLDER_PEOPLE');
		}
		#getEntitiesConfig() {
			return im_v2_lib_entitySelectorConfig.getEntitiesConfig(this.#getConfigOptions());
		}
		#getConfigOptions() {
			return {
				dialogId: this.#options.dialogId,
				chatType: this.#options.chatType,
				structureTarget: this.#options.structureTarget,
				withTeams: this.#options.withTeams ?? DEFAULT_WITH_TEAMS,
				withRecent: true,
				invitationPopup: true
			};
		}
	}

	// @vue/component
	const AddToChatFooter = {
		name: 'AddToChatFooter',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			disabled: {
				type: Boolean,
				default: true
			},
			loading: {
				type: Boolean,
				default: false
			}
		},
		emits: ['confirm', 'cancel'],
		computed: {
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			ButtonStyle: () => ui_vue3_components_button.AirButtonStyle
		},
		methods: {
			onConfirm() {
				if (this.disabled || this.loading) {
					return;
				}
				this.$emit('confirm');
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-add-to-chat-footer__container" data-testid="im-add-to-chat-footer">
			<UiButton
				:size="ButtonSize.LARGE"
				:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_BUTTON_MSGVER_1')"
				:loading="loading"
				:disabled="disabled"
				:style="ButtonStyle.FILLED"
				:dataset="{ testid: 'im-add-to-chat-confirm' }"
				@click="onConfirm"
			/>
			<UiButton
				:size="ButtonSize.LARGE"
				:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_CANCEL_BUTTON')"
				:style="ButtonStyle.PLAIN"
				:dataset="{ testid: 'im-add-to-chat-cancel' }"
				@click="$emit('cancel')"
			/>
		</div>
	`
	};

	const ITEM_CLASS = 'bx-im-add-guests-tab__language-selector_item';
	const ACCEPTED_ITEM_CLASS = 'menu-popup-item-accept';

	// @vue/component
	const InviteLanguageSelector = {
		name: 'InviteLanguageSelector',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			defaultLanguageCode: {
				type: String,
				required: true
			}
		},
		inject: ['enableAutoHide', 'disableAutoHide'],
		emits: ['selectLanguage'],
		data() {
			return {
				selectedLanguageCode: this.defaultLanguageCode,
				isSelectorShown: false
			};
		},
		computed: {
			selectedLanguageName() {
				const lang = this.availableLanguages[this.selectedLanguageCode];
				return lang ? lang.NAME : '';
			}
		},
		created() {
			this.availableLanguages = new intranet_languages.Languages().getLanguages();
		},
		methods: {
			languageSelectorHint() {
				return {
					text: this.loc('IM_ENTITY_SELECTOR_ADD_TO_COLLAB_LANGUAGE_SELECTOR_HINT'),
					popupOptions: {
						className: 'im-add-guests-tab__invite-language-section_hint',
						width: 270,
						bindOptions: {
							position: 'top',
							forceBindPosition: true
						},
						angle: {
							offset: 37,
							position: 'bottom'
						},
						offsetTop: -8
					}
				};
			},
			onLanguageSelected(langCode) {
				this.toggleSelector();
				this.selectedLanguageCode = langCode;
				this.$emit('selectLanguage', this.selectedLanguageCode);
			},
			toggleSelector() {
				if (this.isSelectorShown) {
					this.closeSelector();
				} else {
					this.showSelector();
				}
			},
			showSelector() {
				this.selector = this.createSelector();
				this.selector.show();
				this.isSelectorShown = true;
				this.disableAutoHide();
			},
			closeSelector() {
				this.selector.close();
				this.isSelectorShown = false;
				this.enableAutoHide();
			},
			createSelector() {
				return main_popup.PopupMenu.create({
					id: main_core.Text.getRandom().toLowerCase(),
					bindElement: this.$refs.inviteLanguageSection,
					className: 'bx-im-messenger__scope bx-im-add-guests-tab__invite-language-section_language-selector',
					items: this.getMenuItems(),
					angle: false,
					autoHide: true,
					closeByEsc: true,
					maxHeight: 207,
					contentPadding: 10,
					padding: 10,
					bindOptions: {
						forceBindPosition: true
					},
					events: {
						onPopupClose: () => {
							this.isSelectorShown = false;
							this.enableAutoHide();
						}
					}
				});
			},
			getMenuItems() {
				return Object.keys(this.availableLanguages).map(langCode => {
					return new main_popup.MenuItem({
						langCode,
						className: this.getMenuItemClass(langCode),
						text: this.getMenuItemText(langCode),
						onclick: () => this.onLanguageSelected(langCode)
					});
				});
			},
			getMenuItemClass(langCode) {
				return langCode === this.selectedLanguageCode ? `${ITEM_CLASS} ${ACCEPTED_ITEM_CLASS}` : ITEM_CLASS;
			},
			getMenuItemText(langCode) {
				const lang = this.availableLanguages[langCode];
				const langName = lang ? lang.NAME : '';
				if (langCode === this.defaultLanguageCode) {
					return this.loc('IM_ENTITY_SELECTOR_ADD_TO_COLLAB_DEFAULT_LANGUAGE_TITLE', {
						'#LANG_NAME#': langName
					});
				}
				return langName;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<section
			class="bx-im-add-guests-tab__invite-language-section"
			v-hint="languageSelectorHint"
			ref="inviteLanguageSection"
		>
			<span class="bx-im-add-guests-tab__invite-language-section_title">
				{{ loc('IM_ENTITY_SELECTOR_ADD_TO_COLLAB_INVITE_LANGUAGE_TITLE') }}
			</span>
			<div
				class="bx-im-add-guests-tab__invite-language-section_selected-language-block"
				@click="toggleSelector"
			>
				<span class="bx-im-add-guests-tab__selected-language-block_title">
					{{ selectedLanguageName }}
				</span>
				<span
					class="bx-im-add-guests-tab__selected-language-block_arrow"
					:class="{ '--open': isSelectorShown }"
				></span>
			</div>
		</section>
	`
	};

	const HELPDESK_SLIDER_CLOSE_EVENT = 'SidePanel.Slider:onClose';
	const HELPDESK_SLIDER_ID = 'main:helper';

	// @vue/component
	const AddGuestContent = {
		name: 'AddGuestsTab',
		components: {
			UiButton: ui_vue3_components_button.Button,
			ScrollWithGradient: im_v2_component_elements_scrollWithGradient.ScrollWithGradient,
			InviteLanguageSelector
		},
		inject: ['enableAutoHide', 'disableAutoHide'],
		props: {
			chatId: {
				type: Number,
				required: true
			},
			articleCode: {
				type: String,
				required: true
			},
			guestTitle: {
				type: String,
				required: true
			},
			guestDescription: {
				type: String,
				required: true
			},
			isHideLangSelector: {
				type: Boolean,
				default: false
			},
			isAddButtonDisabled: {
				type: Boolean,
				default: true
			},
			isInvitingGuests: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close', 'addGuest', 'inviteLanguageSelected'],
		computed: {
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			ButtonColor: () => ui_vue3_components_button.ButtonColor,
			ButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			defaultLanguageCode() {
				return im_v2_application_core.Core.getLanguageId();
			},
			isPhoneInviteAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.inviteByPhoneAvailable);
			},
			preparedInvitationTitle() {
				if (this.isPhoneInviteAvailable) {
					return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_GUEST_INVITE_BY_PHONE_OR_EMAIL');
				}
				return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_GUEST_INVITE_BY_EMAIL');
			},
			isChangeInviteLanguageAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.changeInviteLanguageAvailable) && !this.isHideLangSelector;
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(HELPDESK_SLIDER_CLOSE_EVENT, this.onCloseOpenHelpdeskSlider);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(HELPDESK_SLIDER_CLOSE_EVENT, this.onCloseOpenHelpdeskSlider);
		},
		methods: {
			openHelpdesk() {
				this.disableAutoHide();
				im_v2_lib_helpdesk.openHelpdeskArticle(this.articleCode);
			},
			onCloseOpenHelpdeskSlider({
				data
			}) {
				const [event] = data;
				const sliderId = event.getSlider().getUrl().toString();
				if (sliderId === HELPDESK_SLIDER_ID) {
					this.enableAutoHide();
				}
			},
			loc(phraseCode) {
				return main_core.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-add-guest-content__container">
			<div class="bx-im-add-guest-content__invite-section">
				<ScrollWithGradient :gradientHeight="28" :withShadow="true">
					<div class="bx-im-add-guest-content__content">
						<div class="bx-im-add-guest-content__description">
							<div class="bx-im-add-guest-content__description_content">
								<div class="bx-im-add-guest-content__description_title">
									{{ guestTitle }}
								</div>
								<div class="bx-im-add-guest-content__description_text">
									{{ guestDescription }}
								</div>
								<a
									class="bx-im-add-guest-content__helpdesk-link"
									data-testid="im-add-guest-helpdesk-link"
									@click.prevent="openHelpdesk"
								>
									{{ loc('IM_ENTITY_SELECTOR_ADD_GUEST_HELPDESK_LINK') }}
								</a>
							</div>
							<div class="bx-im-add-guest-content__description_icon"></div>
						</div>
						<InviteLanguageSelector
							v-if="isChangeInviteLanguageAvailable"
							:defaultLanguageCode="defaultLanguageCode"
							@selectLanguage="$emit('inviteLanguageSelected', $event)"
						/>
						<div class="bx-im-add-guest-content__actions">
							<slot name="copy-link"/>
							<div class="bx-im-add-guest-content__invite-block">
								<span class="bx-im-add-guest-content__invite-block-title --ellipsis">
									{{ preparedInvitationTitle }}
								</span>
								<slot name="invitation-input"/>
							</div>
						</div>
					</div>
				</ScrollWithGradient>
			</div>
			<div class="bx-im-add-guest-content__buttons">
				<UiButton
					:size="ButtonSize.LARGE"
					:loading="isInvitingGuests"
					:disabled="isAddButtonDisabled || isInvitingGuests"
					:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_BUTTON')"
					:dataset="{ testid: 'im-add-guest-confirm' }"
					@click="$emit('addGuest')"
				/>
				<UiButton
					:size="ButtonSize.LARGE"
					:loading="isInvitingGuests"
					:style="ButtonStyle.PLAIN"
					:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_CANCEL_BUTTON')"
					:dataset="{ testid: 'im-add-guest-cancel' }"
					@click="$emit('close')"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const CopyInviteLink = {
		name: 'CopyInviteLink',
		components: {
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: ['enableAutoHide', 'disableAutoHide'],
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isCopyingInviteLink: {
				type: Boolean,
				required: true
			},
			isUpdatingInviteLink: {
				type: Boolean,
				required: true
			},
			canUpdateLink: {
				type: Boolean,
				required: true
			}
		},
		emits: ['onCopyInviteLink', 'onUpdateInviteLink'],
		computed: {
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			ButtonIcon: () => ui_iconSet_api_core.Outline,
			IconsSet: () => ui_iconSet_api_vue.Set,
			isInviteLinkAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.inviteByLinkAvailable);
			},
			refreshIcon() {
				if (this.isUpdatingInviteLink) {
					return this.IconsSet.CLOCK_2;
				}
				return this.IconsSet.REFRESH_5;
			},
			updateLinkHint() {
				return {
					text: this.loc('IM_ENTITY_SELECTOR_ADD_GUEST_LINK_UPDATE_HINT_MSGVER_1'),
					popupOptions: {
						width: 278,
						bindOptions: {
							position: 'top'
						},
						angle: {
							offset: 36,
							position: 'top'
						},
						targetContainer: document.body,
						offsetTop: -8
					}
				};
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			},
			async confirmAndUpdateInviteLink() {
				this.disableAutoHide();
				const confirmResult = await im_v2_lib_confirm.showUpdateGuestLinkConfirm();
				if (!confirmResult) {
					this.enableAutoHide();
					return;
				}
				this.enableAutoHide();
				this.$emit('onUpdateInviteLink');
			}
		},
		template: `
		<div v-if="isInviteLinkAvailable" class="bx-im-copy-invite-link__invite-block --link">
			<span class="bx-im-copy-invite-link__invite-block-title --ellipsis">
				{{ loc('IM_ENTITY_SELECTOR_ADD_GUEST_INVITE_BY_LINK') }}
			</span>
			<UiButton
				:size="ButtonSize.SMALL"
				:left-icon="ButtonIcon.LINK"
				:loading="isCopyingInviteLink"
				:disabled="isUpdatingInviteLink"
				:text="loc('IM_ENTITY_SELECTOR_ADD_GUEST_COPY_LINK')"
				:dataset="{ testid: 'im-copy-invite-link-copy' }"
				@click="$emit('onCopyInviteLink')"
			/>
			<button
				v-if="canUpdateLink"
				v-hint="updateLinkHint"
				:aria-label="updateLinkHint.text"
				:class="{'--loading': isUpdatingInviteLink}"
				class="bx-im-copy-invite-link__update-link_button"
				data-testid="im-copy-invite-link-update"
				@click="confirmAndUpdateInviteLink"
			>
				<BIcon :name="refreshIcon" :size="20" />
			</button>
		</div>
	`
	};

	const InviteValueType = Object.freeze({
		email: 'email',
		phone: 'phone',
		error: 'error'
	});
	const ENTITY_ID = 'guest-invite';
	const INPUT_DELIMITERS = new Set([' ', ',']);
	const INPUT_SPLIT_PATTERN = /[\s,]+/;

	// @vue/component
	const ChatInvitationInput = {
		name: 'ChatInvitationInput',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			isPhoneAllowed: {
				type: Boolean,
				default: false
			}
		},
		emits: ['change', 'validityChange'],
		data() {
			return {
				candidates: []
			};
		},
		computed: {
			IconsSet: () => ui_iconSet_api_vue.Set,
			hasInvalidCandidates() {
				return this.candidates.some(tag => tag.type === InviteValueType.error);
			},
			placeholder() {
				if (this.isPhoneAllowed) {
					return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_INPUT_PLACEHOLDER_WITH_PHONE');
				}
				return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_INPUT_PLACEHOLDER_MSGVER_1');
			}
		},
		watch: {
			candidates(newValue) {
				this.$emit('change', newValue);
			}
		},
		created() {
			this.tagSelector = this.getTagSelector();
		},
		mounted() {
			this.tagSelector.renderTo(this.$refs['tag-selector']);
			this.tagSelector.focusTextBox();
		},
		methods: {
			getTagSelector() {
				return new ui_entitySelector.TagSelector({
					showAddButton: false,
					showTextBox: true,
					showCreateButton: false,
					textBoxAutoHide: false,
					tagMaxWidth: 200,
					placeholder: this.placeholder,
					events: {
						onBeforeTagAdd: this.registerNewCandidate,
						onAfterTagRemove: this.unregisterCandidate,
						onInput: this.splitInputOnDelimiter,
						onEnter: this.commitInput,
						onBlur: this.commitInput,
						onContainerClick: this.focusTextBox
					}
				});
			},
			resolveInvitationType(value) {
				if (this.isEmail(value)) {
					return InviteValueType.email;
				}
				if (this.isPhone(value)) {
					return InviteValueType.phone;
				}
				return InviteValueType.error;
			},
			isEmail(value) {
				return main_core.Validation.isEmail(value);
			},
			isPhone(value) {
				if (!this.isPhoneAllowed) {
					return false;
				}
				return BX.PhoneNumber.getValidNumberRegex().test(value);
			},
			commitInput() {
				const inputValue = this.tagSelector.getTextBoxValue();
				const inviteCandidates = inputValue.split(INPUT_SPLIT_PATTERN).filter(candidate => candidate.length > 0);
				if (inviteCandidates.length === 0) {
					return;
				}
				for (const candidate of inviteCandidates) {
					const hasDuplicate = this.candidates.some(tagItem => tagItem.value === candidate);
					if (hasDuplicate) {
						continue;
					}
					this.tagSelector.addTag({
						id: candidate,
						entityId: ENTITY_ID,
						entityType: this.resolveInvitationType(candidate),
						title: candidate
					});
				}
				this.tagSelector.clearTextBox();
			},
			registerNewCandidate(event) {
				const {
					tag
				} = event.getData();
				const textBox = event.getTarget().getTextBox();
				textBox.placeholder = '';
				const tagType = tag.getEntityType();
				if (tagType === InviteValueType.error) {
					main_core.Dom.addClass(this.tagSelector.getOuterContainer(), '--error');
				}
				this.candidates = [...this.candidates, {
					value: tag.getTitle(),
					type: tagType
				}];
				this.emitValidity();
			},
			unregisterCandidate(event) {
				const {
					tag
				} = event.getData();
				this.candidates = this.candidates.filter(tagItem => tagItem.value !== tag.getTitle());
				const remainingErrorTags = this.tagSelector.getTags().filter(tagItem => {
					return tagItem.getEntityType() === InviteValueType.error;
				});
				if (remainingErrorTags.length === 0) {
					main_core.Dom.removeClass(this.tagSelector.getOuterContainer(), '--error');
				}
				this.emitValidity();
			},
			emitValidity() {
				this.$emit('validityChange', this.candidates.length > 0 && !this.hasInvalidCandidates);
			},
			splitInputOnDelimiter(event) {
				const {
					event: nativeInputEvent
				} = event.getData();
				const typedCharacter = nativeInputEvent.data;
				if (!INPUT_DELIMITERS.has(typedCharacter)) {
					return;
				}
				const textBoxValue = this.tagSelector.getTextBoxValue();
				const valueWithoutTrailingDelimiter = textBoxValue.endsWith(typedCharacter) ? textBoxValue.slice(0, -1) : textBoxValue;
				if (valueWithoutTrailingDelimiter.length > 0) {
					this.commitInput();
				}
			},
			focusTextBox() {
				this.tagSelector.getTextBox().focus();
			},
			loc(phraseCode) {
				return main_core.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-invitation-input__container">
			<div ref="tag-selector"></div>
			<div v-if="hasInvalidCandidates" class="bx-im-invitation-input__error">
				<BIcon :name="IconsSet.WARNING" class="bx-im-invitation-input__error-icon" />
				<span class="bx-im-invitation-input__error-text">
					{{ loc('INTRANET_INVITATION_INPUT_VALIDATION_MESSAGE') }}
				</span>
			</div>
		</div>
	`
	};

	const ARTICLE_CODE = '28188420';

	// @vue/component
	const AddToChatGuests = {
		name: 'AddToChatGuests',
		components: {
			AddGuestContent,
			CopyInviteLink,
			ChatInvitationInput
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			canUpdateLink: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close'],
		data() {
			return {
				isCopyingInviteLink: false,
				isUpdatingInviteLink: false,
				isInvitingGuests: false,
				isAddButtonDisabled: true,
				candidates: []
			};
		},
		computed: {
			ARTICLE_CODE: () => ARTICLE_CODE,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			chatId() {
				return this.dialog.chatId;
			},
			guestDescriptionTitle() {
				return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_DESCRIPTION_TITLE_EMPLOYEE');
			},
			guestDescription() {
				return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_DESCRIPTION_TEXT_GUEST');
			},
			isPhoneInviteAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.inviteByPhoneAvailable);
			}
		},
		methods: {
			async copyInviteLink() {
				try {
					this.isCopyingInviteLink = true;
					const sharingLink = await new im_v2_provider_service_guestInvitation.GuestInvitationService().generateInviteLink(this.chatId);
					await im_v2_lib_utils.Utils.text.copyToClipboard(sharingLink.url);
					im_v2_lib_notifier.Notifier.onCopyLinkComplete();
					im_v2_lib_analytics.Analytics.getInstance().guest.onCopyGuestInviteLink(this.dialogId);
				} catch {
					im_v2_lib_notifier.Notifier.onDefaultError();
				} finally {
					this.isCopyingInviteLink = false;
				}
			},
			async updateLink() {
				try {
					this.isUpdatingInviteLink = true;
					const sharingLink = await new im_v2_provider_service_guestInvitation.GuestInvitationService().updateLink(this.chatId);
					try {
						await im_v2_lib_utils.Utils.text.copyToClipboard(sharingLink.url);
						im_v2_lib_notifier.Notifier.onCopyLinkComplete();
					} catch {
						im_v2_lib_notifier.Notifier.onUpdateLinkComplete();
					}
				} catch {
					im_v2_lib_notifier.Notifier.onDefaultError();
				} finally {
					this.isUpdatingInviteLink = false;
				}
			},
			onInvitationInputValidityChange(isValid) {
				this.isAddButtonDisabled = !isValid;
			},
			onInvitationInputChange(candidates) {
				this.candidates = candidates;
			},
			async addGuest() {
				if (this.isAddButtonDisabled) {
					return;
				}
				this.isInvitingGuests = true;
				const result = await this.sendGuestInvitations();
				this.showGuestInvitationsResult(result);
				this.isInvitingGuests = false;
				this.$emit('close');
			},
			async sendGuestInvitations() {
				const emails = this.candidates.filter(candidate => candidate.type === im_v2_provider_service_guestInvitation.InvitationType.email).map(candidate => ({
					email: candidate.value
				}));
				const phones = this.candidates.filter(candidate => candidate.type === im_v2_provider_service_guestInvitation.InvitationType.phone).map(candidate => ({
					phone: candidate.value
				}));
				const invitationService = new im_v2_provider_service_guestInvitation.GuestInvitationService();
				const tasks = [];
				if (emails.length > 0) {
					tasks.push(invitationService.inviteByEmail(this.chatId, emails));
				}
				if (phones.length > 0) {
					tasks.push(invitationService.inviteByPhone(this.chatId, phones));
				}
				return Promise.allSettled(tasks);
			},
			showGuestInvitationsResult(results) {
				const failed = results.filter(result => result.status === 'rejected').length;
				const isAllFailed = failed > 0 && failed === results.length;
				const isAnyFailed = failed > 0 && failed < results.length;
				if (isAllFailed) {
					im_v2_lib_notifier.Notifier.onDefaultError();
				} else if (isAnyFailed) {
					im_v2_lib_notifier.Notifier.invite.onPartialError();
				}
			}
		},
		template: `
		<AddGuestContent
			:chatId="chatId"
			:articleCode="ARTICLE_CODE"
			:guestTitle="guestDescriptionTitle"
			:guestDescription="guestDescription"
			:isAddButtonDisabled="isAddButtonDisabled"
			:isInvitingGuests="isInvitingGuests"
			:isHideLangSelector="true"
			class="bx-im-add-to-chat-guest-tab__scope"
			data-testid="im-add-to-chat-guests"
			@addGuest="addGuest"
			@close="$emit('close')"
		>
			<template #copy-link>
				<CopyInviteLink
					:dialogId="dialogId"
					:canUpdateLink="canUpdateLink"
					:isUpdatingInviteLink="isUpdatingInviteLink"
					:isCopyingInviteLink="isCopyingInviteLink"
					@onUpdateInviteLink="updateLink"
					@onCopyInviteLink="copyInviteLink"
				/>
			</template>
			<template #invitation-input>
				<ChatInvitationInput
					:isPhoneAllowed="isPhoneInviteAvailable"
					data-testid="im-add-to-chat-invite-input"
					@change="onInvitationInputChange"
					@validityChange="onInvitationInputValidityChange"
				/>
			</template>
		</AddGuestContent>
	`
	};

	const Tabs = [{
		id: im_v2_const.TabId.employees,
		title: main_core.Loc.getMessage('IM_ENTITY_SELECTOR_EMPLOYEES_TAB')
	}, {
		id: im_v2_const.TabId.guests,
		title: main_core.Loc.getMessage('IM_ENTITY_SELECTOR_GUESTS_TAB')
	}];
	const TabsWrapper = {
		name: 'TabsWrapper',
		components: {
			SegmentButton: im_v2_component_elements_button.SegmentButton
		},
		props: {
			activeTabId: {
				type: String,
				required: true
			}
		},
		emits: ['onTabSwitch'],
		computed: {
			Tabs: () => Tabs
		},
		methods: {
			switchTab(tabId) {
				im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.invitePopupTab, tabId);
				this.$emit('onTabSwitch', tabId);
			}
		},
		template: `
		<div class="bx-im-tab-wrapper__tabs">
			<SegmentButton
				:tabs="Tabs"
				:activeTabId="activeTabId"
				@segmentSelected="switchTab"
			/>
		</div>
	`
	};

	const CLOSE_ICON_SIZE = 24;

	// Take the Vue component from the parent ui.system.checkbox extension: it creates
	// the BX.UI.System.Checkbox namespace and re-exports the Vue component (export * as Vue).
	// A direct import from ui.system.checkbox.vue crashes at runtime - it has an empty rel.
	const Checkbox = ui_system_checkbox.Vue.Checkbox;

	// @vue/component
	const AddToChatHeader = {
		name: 'AddToChatHeader',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Checkbox,
			TabsWrapper
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			/** @type TagSelector */
			tagSelector: {
				type: Object,
				required: true
			},
			activeTabId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			structureTarget: {
				type: String,
				default: im_v2_lib_entitySelectorConfig.StructureTarget.chat
			},
			offersStructureNodes: {
				type: Boolean,
				default: false
			},
			canInviteGuests: {
				type: Boolean,
				default: false
			},
			showHistory: {
				type: Boolean,
				default: true
			}
		},
		emits: ['update:activeTabId', 'update:showHistory', 'close'],
		setup() {
			// two invitation windows can stand open at once, so the ids are per instance
			const suffix = main_core.Text.getRandom().toLowerCase();
			return {
				historyCheckboxId: `bx-im-add-to-chat-show-history-${suffix}`,
				hintId: `bx-im-add-to-chat-hint-${suffix}`
			};
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			CLOSE_ICON_SIZE: () => CLOSE_ICON_SIZE,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isEmployeesTab() {
				return this.activeTabId === im_v2_const.TabId.employees;
			},
			isChat() {
				return this.dialog.type !== im_v2_const.ChatType.user;
			},
			isCollab() {
				return this.dialog.type === im_v2_const.ChatType.collab;
			},
			isOpenLines() {
				return this.dialog.type === im_v2_const.ChatType.lines;
			},
			isChannel() {
				return im_v2_lib_channel.ChannelManager.isChannel(this.dialogId);
			},
			showHistoryOption() {
				return !this.isCollab && this.isChat && !this.isChannel && !this.isOpenLines;
			},
			showStructureHint() {
				// the hint speaks of connecting a department to the chat, and a collab links to its project instead
				if (this.structureTarget === im_v2_lib_entitySelectorConfig.StructureTarget.collabProject) {
					return false;
				}
				return this.offersStructureNodes;
			},
			historyHintId() {
				return this.showStructureHint ? this.hintId : null;
			},
			hintPhraseCode() {
				return this.showHistoryOption ? 'IM_ENTITY_SELECTOR_ADD_TO_CHAT_STRUCTURE_AND_HISTORY_HINT' : 'IM_ENTITY_SELECTOR_ADD_TO_CHAT_STRUCTURE_HINT';
			}
		},
		mounted() {
			this.tagSelector.renderTo(this.$refs.field);
		},
		methods: {
			onTabSwitch(tabId) {
				this.$emit('update:activeTabId', tabId);
			},
			onHistoryChange(nextValue) {
				this.$emit('update:showHistory', nextValue);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-add-to-chat-header__container" data-testid="im-add-to-chat-header">
			<div class="bx-im-add-to-chat-header__title-bar">
				<div class="bx-im-add-to-chat-header__title" data-testid="im-add-to-chat-title">
					{{ title }}
				</div>
				<button
					type="button"
					class="bx-im-add-to-chat-header__close"
					:aria-label="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_CLOSE_BUTTON')"
					data-testid="im-add-to-chat-close"
					@click="$emit('close')"
				>
					<BIcon :name="Outline.CROSS_L" :size="CLOSE_ICON_SIZE"/>
				</button>
			</div>
			<TabsWrapper
				v-if="canInviteGuests"
				:activeTabId="activeTabId"
				data-testid="im-add-to-chat-tabs"
				@onTabSwitch="onTabSwitch"
			/>
			<div v-show="isEmployeesTab" class="bx-im-add-to-chat-header__field" ref="field"></div>
			<div
				v-if="showHistoryOption"
				v-show="isEmployeesTab"
				class="bx-im-add-to-chat-header__history"
			>
				<Checkbox
					:id="historyCheckboxId"
					:modelValue="showHistory"
					:aria-describedby="historyHintId"
					data-testid="im-add-to-chat-history"
					@update:modelValue="onHistoryChange"
				/>
				<label :for="historyCheckboxId">
					{{ loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_SHOW_HISTORY_MSGVER_1') }}
				</label>
			</div>
			<div
				v-if="showStructureHint"
				v-show="isEmployeesTab"
				:id="hintId"
				class="bx-im-add-to-chat-header__hint"
				data-testid="im-add-to-chat-hint"
			>
				{{ loc(hintPhraseCode) }}
			</div>
		</div>
	`
	};

	// the invitation window of a chat offers cross functional teams; a collab links to its project instead
	const WITH_TEAMS = true;

	// @vue/component
	const AddToChat = {
		name: 'AddToChat',
		components: {
			AddToChatHeader,
			AddToChatFooter,
			AddToChatGuests
		},
		provide() {
			return {
				disableAutoHide: this.disableAutoHide,
				enableAutoHide: this.enableAutoHide
			};
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			popupConfig: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		data() {
			return {
				isLoading: false,
				activeTabId: im_v2_const.TabId.employees,
				showHistory: true,
				selectedItemCount: 0
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isGuestTab() {
				if (!this.canInviteGuests) {
					return false;
				}
				return this.activeTabId === im_v2_const.TabId.guests;
			},
			isChat() {
				return this.dialog.type !== im_v2_const.ChatType.user;
			},
			chatId() {
				return this.dialog.chatId;
			},
			canManageGuestLinks() {
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				const canPerformActionByRole = permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.manageGuestLink, this.dialogId);
				const canPerformActionByUserType = permissionManager.canPerformActionByUserType(im_v2_const.ActionByUserType.manageGuestLink);
				return canPerformActionByRole && canPerformActionByUserType;
			},
			isChatWithGuestsAvailable() {
				return im_v2_lib_guest.GuestManager.getInstance().isGuestLinkAvailable(this.dialogId);
			},
			canInviteGuests() {
				if (!this.isChatWithGuestsAvailable) {
					return false;
				}
				return this.canManageGuestLinks;
			},
			offersStructureNodes() {
				return im_v2_lib_entitySelectorConfig.offersStructureNodes({
					dialogId: this.dialogId,
					chatType: this.dialog.type,
					withTeams: WITH_TEAMS,
					invitationPopup: true
				});
			},
			windowTitle() {
				return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_ADD_MEMBERS_TITLE_MSGVER_1');
			},
			headerContainer() {
				return main_core.Tag.render`<div></div>`;
			},
			footerContainer() {
				return main_core.Tag.render`<div></div>`;
			},
			guestsContainer() {
				return main_core.Tag.render`<div></div>`;
			}
		},
		watch: {
			isGuestTab(isGuestTab) {
				this.selectorWindow.toggleGuestTab(isGuestTab);
			}
		},
		created() {
			this.chatService = new im_v2_provider_service_chat.ChatService();
			this.activeTabId = getRememberedTabId(this.canInviteGuests);
			this.selectorWindow = this.createSelectorWindow();
		},
		mounted() {
			this.selectorWindow.show();
			this.selectorWindow.toggleGuestTab(this.isGuestTab);
		},
		beforeUnmount() {
			im_v2_lib_analytics.Analytics.getInstance().userAdd.onClosePopup();
			this.selectorWindow.destroy();
		},
		methods: {
			createSelectorWindow() {
				return new AddToChatWindow({
					bindElement: this.bindElement,
					dialogId: this.dialogId,
					chatType: this.dialog.type,
					withTeams: WITH_TEAMS,
					title: this.windowTitle,
					offsetTop: this.popupConfig.offsetTop,
					offsetLeft: this.popupConfig.offsetLeft,
					headerContainer: this.headerContainer,
					footerContainer: this.footerContainer,
					guestsContainer: this.guestsContainer,
					onHide: () => this.$emit('close'),
					onSelectionChange: () => {
						this.selectedItemCount = this.selectorWindow.getSelectedItemCount();
					},
					onUserSelect: params => this.sendUserSelectAnalytics(params),
					onSearchInput: () => {
						im_v2_lib_analytics.Analytics.getInstance().userAdd.onStartSearch({
							dialogId: this.dialogId
						});
					}
				});
			},
			sendUserSelectAnalytics({
				fromRecentTab,
				position
			}) {
				const {
					userAdd
				} = im_v2_lib_analytics.Analytics.getInstance();
				const params = {
					dialogId: this.dialogId,
					position
				};
				if (fromRecentTab) {
					userAdd.onSelectUserFromRecent(params);
					return;
				}
				userAdd.onSelectUserFromSearchResult(params);
			},
			async onConfirm() {
				if (this.isLoading) {
					return;
				}
				const members = this.selectorWindow.getSelectedUserIds();
				const structureNodes = this.selectorWindow.getSelectedStructureNodes();
				if (members.length === 0 && structureNodes.length === 0) {
					return;
				}
				this.isLoading = true;
				// the parent chat is asked about the whole selection: a linked node reaches it as well,
				// since the server mirrors the link onto the parent and resolves the people behind the node there
				const canAdd = await im_v2_lib_access.ChatAccessManager.canAddSelection(this.dialogId, members, structureNodes);
				if (!canAdd) {
					this.isLoading = false;
					return;
				}
				await this.inviteMembers(members, structureNodes);
			},
			async inviteMembers(members, structureNodes) {
				if (this.isChat) {
					await this.extendChat(members, structureNodes);
					return;
				}
				members.push(this.dialogId, im_v2_application_core.Core.getUserId());
				await this.extendToGroupChat(members);
			},
			async extendChat(members, structureNodes) {
				const isAdded = await this.chatService.addSelection({
					chatId: this.chatId,
					userIds: members,
					nodes: structureNodes,
					showHistory: this.showHistory
				});
				this.isLoading = false;
				if (!isAdded) {
					return;
				}
				this.$emit('close');
			},
			async extendToGroupChat(members) {
				const {
					newDialogId
				} = await this.chatService.extendToGroupChat({
					users: members,
					ownerId: im_v2_application_core.Core.getUserId()
				}).catch(() => {
					this.isLoading = false;
				});
				this.isLoading = false;
				this.$emit('close');
				void im_public.Messenger.openChat(newDialogId);
			},
			enableAutoHide() {
				this.selectorWindow.setAutoHide(true);
			},
			disableAutoHide() {
				this.selectorWindow.setAutoHide(false);
			}
		},
		template: `
		<Teleport :to="headerContainer">
			<AddToChatHeader
				v-model:activeTabId="activeTabId"
				v-model:showHistory="showHistory"
				:dialogId="dialogId"
				:title="windowTitle"
				:tagSelector="selectorWindow.getTagSelector()"
				:canInviteGuests="canInviteGuests"
				:offersStructureNodes="offersStructureNodes"
				@close="$emit('close')"
			/>
		</Teleport>
		<Teleport :to="guestsContainer">
			<KeepAlive>
				<AddToChatGuests
					v-if="isGuestTab"
					:dialogId="dialogId"
					:canUpdateLink="canManageGuestLinks"
					@close="$emit('close')"
				/>
			</KeepAlive>
		</Teleport>
		<Teleport :to="footerContainer">
			<AddToChatFooter
				v-if="!isGuestTab"
				:disabled="selectedItemCount === 0"
				:loading="isLoading"
				@confirm="onConfirm"
				@cancel="$emit('close')"
			/>
		</Teleport>
	`
	};

	// @vue/component
	const AddEmployeesTab = {
		name: 'AddEmployeesTab',
		components: {
			AddToChatFooter
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			/** @type number[] */
			members: {
				type: Array,
				default: () => []
			},
			/** @type SelectorEntityItem[] */
			structureNodes: {
				type: Array,
				default: () => []
			}
		},
		emits: ['close'],
		data() {
			return {
				isLoading: false
			};
		},
		computed: {
			hasSelection() {
				return this.members.length > 0 || this.structureNodes.length > 0;
			}
		},
		methods: {
			async inviteMembers() {
				if (this.isLoading || !this.hasSelection) {
					return;
				}
				this.isLoading = true;
				const canAdd = await im_v2_lib_access.ChatAccessManager.canAddSelection(this.dialogId, this.members, this.structureNodes);
				if (!canAdd) {
					this.isLoading = false;
					return;
				}
				try {
					await new im_v2_provider_service_collabInvitation.CollabInvitationService().addEmployees({
						dialogId: this.dialogId,
						members: this.members,
						structureNodes: this.structureNodes
					});
				} catch {
					im_v2_lib_notifier.Notifier.onDefaultError();
					return;
				} finally {
					this.isLoading = false;
				}
				this.$emit('close');
			}
		},
		template: `
		<AddToChatFooter
			:disabled="!hasSelection"
			:loading="isLoading"
			@confirm="inviteMembers"
			@cancel="$emit('close')"
		/>
	`
	};

	// @vue/component
	const AddToCollab = {
		name: 'AddToCollab',
		components: {
			AddGuestContent,
			AddEmployeesTab,
			AddToChatHeader,
			CopyInviteLink
		},
		provide() {
			return {
				disableAutoHide: this.disableAutoHide,
				enableAutoHide: this.enableAutoHide
			};
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			popupConfig: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		data() {
			return {
				activeTabId: im_v2_const.TabId.employees,
				selectedMembers: [],
				selectedStructureNodes: [],
				isCopyingInviteLink: false,
				isUpdatingInviteLink: false,
				isAddButtonDisabled: true,
				isInvitingGuests: false,
				invitationLangCode: ''
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			defaultLanguageCode() {
				return im_v2_application_core.Core.getLanguageId();
			},
			isGuestTab() {
				return this.activeTabId === im_v2_const.TabId.guests;
			},
			isEnabledCollabersInvitation() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.enabledCollabersInvitation);
			},
			isCollabV2Available() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
			},
			chatId() {
				return this.dialog.chatId;
			},
			collabChatId() {
				const collab = this.$store.getters['chats/collabs/getByChatId'](this.chatId);
				return collab.collabId;
			},
			windowTitle() {
				return im_v2_lib_collab.CollabManager.getInviteHeaderText();
			},
			guestDescription() {
				return im_v2_lib_collab.CollabManager.getInviteDescriptionText();
			},
			guestDescriptionTitle() {
				return im_v2_lib_collab.CollabManager.getInviteTitleText();
			},
			helpdeskArticleCode() {
				return im_v2_lib_collab.CollabManager.getInviteArticleCode();
			},
			structureTarget() {
				return im_v2_lib_entitySelectorConfig.StructureTarget.collabProject;
			},
			canUpdateLink() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.updateInviteLink, this.dialogId);
			},
			headerContainer() {
				return main_core.Tag.render`<div></div>`;
			},
			footerContainer() {
				return main_core.Tag.render`<div></div>`;
			},
			guestsContainer() {
				return main_core.Tag.render`<div></div>`;
			}
		},
		watch: {
			activeTabId() {
				this.selectorWindow.toggleGuestTab(this.isGuestTab);
				this.initInvitationInput();
			}
		},
		created() {
			this.setInitialActiveTab();
			this.selectorWindow = this.createSelectorWindow();
		},
		mounted() {
			this.selectorWindow.show();
			this.selectorWindow.toggleGuestTab(this.isGuestTab);
			this.initInvitationInput();
		},
		beforeUnmount() {
			im_v2_lib_analytics.Analytics.getInstance().userAdd.onClosePopup();
			this.destroyInvitationInput();
			this.selectorWindow.destroy();
		},
		methods: {
			createSelectorWindow() {
				return new AddToChatWindow({
					bindElement: this.bindElement,
					dialogId: this.dialogId,
					chatType: this.dialog.type,
					structureTarget: this.structureTarget,
					title: this.windowTitle,
					offsetTop: this.popupConfig.offsetTop,
					offsetLeft: this.popupConfig.offsetLeft,
					headerContainer: this.headerContainer,
					footerContainer: this.footerContainer,
					guestsContainer: this.guestsContainer,
					onHide: () => this.$emit('close'),
					onSelectionChange: () => {
						this.selectedMembers = this.selectorWindow.getSelectedUserIds();
						this.selectedStructureNodes = this.selectorWindow.getSelectedStructureNodes();
					},
					onUserSelect: params => this.sendUserSelectAnalytics(params),
					onSearchInput: () => {
						im_v2_lib_analytics.Analytics.getInstance().userAdd.onStartSearch({
							dialogId: this.dialogId
						});
					}
				});
			},
			sendUserSelectAnalytics({
				fromRecentTab,
				position
			}) {
				const {
					userAdd
				} = im_v2_lib_analytics.Analytics.getInstance();
				const params = {
					dialogId: this.dialogId,
					position
				};
				if (fromRecentTab) {
					userAdd.onSelectUserFromRecent(params);
					return;
				}
				userAdd.onSelectUserFromSearchResult(params);
			},
			setInitialActiveTab() {
				if (this.isEnabledCollabersInvitation && !this.isCollabV2Available) {
					this.activeTabId = im_v2_const.TabId.guests;
				}
			},
			onInvitationGuest() {
				if (!this.isEnabledCollabersInvitation) {
					this.showHelper();
				}
			},
			showHelper() {
				new ui_infoHelper.FeaturePromoter({
					code: im_v2_const.SliderCode.collabInviteOff
				}).show();
			},
			async copyInviteLink() {
				if (!this.isEnabledCollabersInvitation) {
					this.showHelper();
					return;
				}
				try {
					this.isCopyingInviteLink = true;
					const link = await new im_v2_provider_service_collabInvitation.CollabInvitationService().copyLink(this.collabChatId, this.invitationLangCode);
					await im_v2_lib_utils.Utils.text.copyToClipboard(link);
					im_v2_lib_notifier.Notifier.onCopyLinkComplete();
				} catch (error) {
					im_v2_lib_notifier.Notifier.collab.onCopyLinkError(error);
				} finally {
					this.isCopyingInviteLink = false;
				}
			},
			async updateLink() {
				if (!this.isEnabledCollabersInvitation) {
					this.showHelper();
					return;
				}
				try {
					this.isUpdatingInviteLink = true;
					await new im_v2_provider_service_collabInvitation.CollabInvitationService().updateLink(this.collabChatId);
					im_v2_lib_notifier.Notifier.collab.onUpdateLinkComplete();
				} catch (error) {
					im_v2_lib_notifier.Notifier.collab.onUpdateLinkError(error);
				} finally {
					this.isUpdatingInviteLink = false;
				}
			},
			onReadySaveInputHandler() {
				this.isAddButtonDisabled = false;
			},
			onUnreadySaveInputHandler() {
				this.isAddButtonDisabled = true;
			},
			initInvitationInput() {
				if (this.invitationGuests || this.activeTabId !== im_v2_const.TabId.guests) {
					return;
				}
				this.invitationGuests = new intranet_invitationInput.InvitationInput();
				this.invitationGuests.subscribe('onReadySave', this.onReadySaveInputHandler);
				this.invitationGuests.subscribe('onUnreadySave', this.onUnreadySaveInputHandler);
				void this.renderInvitationInput();
			},
			destroyInvitationInput() {
				if (!this.invitationGuests) {
					return;
				}
				this.invitationGuests.unsubscribe('onReadySave', this.onReadySaveInputHandler);
				this.invitationGuests.unsubscribe('onUnreadySave', this.onUnreadySaveInputHandler);
			},
			async renderInvitationInput() {
				await this.$nextTick();
				this.invitationGuests.renderTo(this.$refs['collab-invitation-input']);
				this.invitationLangCode = this.defaultLanguageCode;
			},
			async addGuest() {
				if (this.isInvitingGuests) {
					return;
				}
				this.isInvitingGuests = true;
				try {
					await this.invitationGuests.inviteToGroup(this.collabChatId);
					this.$emit('close');
				} catch {
					this.isAddButtonDisabled = this.invitationGuests.isEmptyTags() || this.invitationGuests.hasErrorTags();
				} finally {
					this.isInvitingGuests = false;
				}
			},
			onInviteLanguageSelected(langCode) {
				this.invitationLangCode = langCode;
				this.invitationGuests.changeLanguage(langCode);
			},
			enableAutoHide() {
				this.selectorWindow.setAutoHide(true);
			},
			disableAutoHide() {
				this.selectorWindow.setAutoHide(false);
			}
		},
		template: `
		<Teleport :to="headerContainer">
			<AddToChatHeader
				v-model:activeTabId="activeTabId"
				:dialogId="dialogId"
				:title="windowTitle"
				:tagSelector="selectorWindow.getTagSelector()"
				:structureTarget="structureTarget"
				canInviteGuests
				@close="$emit('close')"
			/>
		</Teleport>
		<Teleport :to="guestsContainer">
			<KeepAlive>
				<AddGuestContent
					v-if="isGuestTab"
					:chatId="chatId"
					:articleCode="helpdeskArticleCode"
					:guestTitle="guestDescriptionTitle"
					:guestDescription="guestDescription"
					:isAddButtonDisabled="isAddButtonDisabled"
					:isInvitingGuests="isInvitingGuests"
					class="bx-im-add-to-collab-guest-tab__scope"
					data-testid="im-add-to-collab-guests"
					@addGuest="addGuest"
					@inviteLanguageSelected="onInviteLanguageSelected"
					@close="$emit('close')"
				>
					<template #copy-link>
						<CopyInviteLink
							:dialogId="dialogId"
							:canUpdateLink="canUpdateLink"
							:isUpdatingInviteLink="isUpdatingInviteLink"
							:isCopyingInviteLink="isCopyingInviteLink"
							@onUpdateInviteLink="updateLink"
							@onCopyInviteLink="copyInviteLink"
						/>
					</template>
					<template #invitation-input>
						<div
							ref="collab-invitation-input"
							class="bx-im-add-to-collab__invite-block-input"
							data-testid="im-add-to-collab-invite-input"
							@click="onInvitationGuest"
						/>
					</template>
				</AddGuestContent>
			</KeepAlive>
		</Teleport>
		<Teleport :to="footerContainer">
			<AddEmployeesTab
				v-if="!isGuestTab"
				:dialogId="dialogId"
				:members="selectedMembers"
				:structureNodes="selectedStructureNodes"
				@close="$emit('close')"
			/>
		</Teleport>
	`
	};

	// The tab set is horizontal; the vertical arrows belong to the result list under it.
	const TAB_BIND_KEYS = ui_a11y.FocusKeys.ArrowHorizontal | ui_a11y.FocusKeys.HomeAndEnd;

	// @vue/component
	const ForwardNavigation = {
		name: 'ForwardNavigation',
		components: {
			ScrollWithGradient: im_v2_component_elements_scrollWithGradient.ScrollWithGradient,
			NavigationSection: im_v2_component_list_container_elements_navigationSection.NavigationSection
		},
		inject: {
			// Provided by ForwardPopup, unwrapped by Vue into a plain boolean. The default keeps the tab set
			// working when the navigation is mounted without the window around it.
			isForwardContentVisible: {
				default: true
			}
		},
		props: {
			sections: {
				type: Array,
				required: true
			},
			currentSection: {
				type: String,
				default: null
			},
			namespace: {
				type: String,
				required: true
			},
			panelId: {
				type: String,
				required: true
			}
		},
		emits: ['selectSection'],
		computed: {
			ScrollDirection: () => im_v2_component_elements_scrollWithGradient.ScrollDirection,
			items() {
				return this.sections;
			},
			// A blank aria-label would wipe the name of the tab set instead of leaving it computable, so a
			// missing phrase yields no attribute at all.
			tabsLabel() {
				return this.loc('IM_ENTITY_SELECTOR_FORWARD_TABS_ARIA') || null;
			}
		},
		watch: {
			isForwardContentVisible(isVisible) {
				// The window holds its content at zero opacity until it has finished opening, so every tab
				// counted as invisible while mounted() ran and the zone collected nothing. The opacity of an
				// ancestor is not something its MutationObserver sees, hence the explicit second enable.
				if (isVisible) {
					this.enableFocusZone();
				}
			}
		},
		created() {
			this.focusZone = null;
		},
		mounted() {
			this.enableFocusZone();
		},
		beforeUnmount() {
			this.focusZone?.deactivate();
			this.focusZone = null;
		},
		methods: {
			tabId(sectionId) {
				return `${this.namespace}-tab-${sectionId}`;
			},
			enableFocusZone() {
				const container = this.$refs.tabs;
				if (!container) {
					return;
				}
				if (!this.focusZone) {
					this.focusZone = im_v2_lib_a11y.createListFocusZone(container, {
						bindKeys: TAB_BIND_KEYS
					});
				}

				// Idempotent: both mounted() and the visibility signal enable the same zone.
				if (this.focusZone.isActive()) {
					this.focusZone.refreshElements();
					return;
				}
				this.focusZone.activate();
			},
			onActivateSection(sectionId) {
				this.selectSection(sectionId);

				// A click on the wrapper area outside the chip moves no focus, while the zone moves its tab
				// stop on focusin only - without this the stop and aria-selected would part ways. Deferred, so
				// the section is already switched and the focusin of this very move stays a no-op.
				void this.$nextTick(() => {
					this.findTab(sectionId)?.focus();
				});
			},
			onTabFocusIn(event) {
				// Automatic activation: the tab the arrows bring the focus to becomes the active section. The
				// tab is matched by its own id, so a focus landing on anything else here activates nothing.
				const focusedSection = this.items.find(({
					type
				}) => this.tabId(type) === event.target?.id);
				if (focusedSection) {
					this.selectSection(focusedSection.type);
				}
			},
			selectSection(sectionId) {
				if (sectionId === this.currentSection) {
					return;
				}
				this.$emit('selectSection', sectionId);
			},
			findTab(sectionId) {
				// Attribute form instead of an id selector: the section type needs no escaping this way.
				return this.$refs.tabs?.querySelector(`[id="${this.tabId(sectionId)}"]`);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ScrollWithGradient :direction="ScrollDirection.horizontal">
			<div
				ref="tabs"
				class="bx-im-entity-selector-forward-navigation__section_container"
				role="tablist"
				:aria-label="tabsLabel"
				@focusin="onTabFocusIn"
			>
				<NavigationSection
					v-for="{ type, getTitle } in items"
					:key="type"
					semanticRole="tab"
					:rootId="tabId(type)"
					:controls="panelId"
					:rootTabIndex="-1"
					:rootTestId="'im-forward-tab-' + type"
					:text="getTitle()"
					:isSelected="currentSection === type"
					@activate="onActivateSection(type)"
				/>
			</div>
		</ScrollWithGradient>
	`
	};

	const getCurrentUser = () => {
		return im_v2_application_core.Core.getStore().getters['users/get'](im_v2_application_core.Core.getUserId());
	};
	const currentUserHasChannels = () => {
		return getCurrentUser()?.type === im_v2_const.UserType.user;
	};
	const isCurrentUserGuest = () => {
		return getCurrentUser()?.type === im_v2_const.UserType.guest;
	};

	const getCopilotTitle = () => main_core.Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_COPILOT', {
		'#COPILOT_NAME#': new im_v2_lib_copilot.CopilotManager().getName()
	});
	const ForwardSectionConfig = {
		[im_v2_component_search.ForwardAllSection]: {
			type: im_v2_component_search.ForwardAllSection,
			getTitle: () => main_core.Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_ALL'),
			isAvailable: () => true
		},
		[im_v2_const.RecentType.default]: {
			type: im_v2_const.RecentType.default,
			getTitle: () => main_core.Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_CHATS'),
			isAvailable: () => true
		},
		[im_v2_const.RecentType.taskComments]: {
			type: im_v2_const.RecentType.taskComments,
			getTitle: () => main_core.Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_TASKS'),
			isAvailable: () => true
		},
		[im_v2_const.RecentType.collab]: {
			type: im_v2_const.RecentType.collab,
			getTitle: () => {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available) ? main_core.Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_COLLABS_V2') : main_core.Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_COLLABS');
			},
			isAvailable: () => true
		},
		[im_v2_const.RecentType.openChannel]: {
			type: im_v2_const.RecentType.openChannel,
			getTitle: () => main_core.Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_CHANNELS'),
			isAvailable: () => currentUserHasChannels()
		},
		[im_v2_const.RecentType.copilot]: {
			type: im_v2_const.RecentType.copilot,
			getTitle: getCopilotTitle,
			isAvailable: () => im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotActive)
		}
	};

	const ForwardChatOpeners = {
		[im_v2_const.ChatType.taskComments]: dialogId => im_public.Messenger.openTaskComments(dialogId),
		[im_v2_const.ChatType.collab]: dialogId => im_public.Messenger.openCollab(dialogId),
		[im_v2_const.ChatType.openChannel]: dialogId => im_public.Messenger.openChannel(dialogId),
		[im_v2_const.ChatType.generalChannel]: dialogId => im_public.Messenger.openChannel(dialogId),
		[im_v2_const.ChatType.copilot]: dialogId => im_public.Messenger.openCopilot(dialogId),
		default: dialogId => im_public.Messenger.openChat(dialogId)
	};

	async function openForwardChat(dialogId) {
		const {
			type,
			parentChatId
		} = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
		const isNestedInCollab = parentChatId > 0 && !im_v2_lib_recent.RecentManager.isTypeWithNestedChats(type);
		if (!isNestedInCollab) {
			const openLayout = ForwardChatOpeners[type] ?? ForwardChatOpeners.default;
			return openLayout(dialogId);
		}
		return ForwardChatOpeners[im_v2_const.ChatType.collab](dialogId);
	}

	const ID_NAMESPACE_PREFIX = 'im-forward-';
	const MAX_SELECTED_RECIPIENTS = 20;
	let windowInstanceIndex = 0;

	// The single owner of the window id space: every aria relation inside the window - the listbox and
	// status ids below, the panel id, the tab and option ids of the child components - is derived from
	// the namespace this returns, so two windows on one page never share an id. The same value addresses
	// the shared search key channel, so a keystroke only acts in the window it was typed in.
	const nextIdNamespace = () => `${ID_NAMESPACE_PREFIX}${++windowInstanceIndex}`;

	// @vue/component
	const ForwardContent = {
		name: 'ForwardContent',
		components: {
			ForwardNavigation,
			ForwardSearch: im_v2_component_search.ForwardSearch,
			ChatSearchInput: im_v2_component_search.ChatSearchInput,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			messagesIds: {
				type: Array,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			directForward: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close'],
		data() {
			return {
				namespace: nextIdNamespace(),
				searchQuery: '',
				isLoading: false,
				currentSection: null,
				selectedDialogIds: [],
				hasAnnouncedSelectionLimit: false
			};
		},
		computed: {
			navigationSections() {
				if (isCurrentUserGuest()) {
					return [];
				}
				return Object.values(ForwardSectionConfig).filter(section => section.isAvailable());
			},
			showSectionTabs() {
				return this.navigationSections.length > 0;
			},
			// The window owns the tab set, so it is the only one that can name the active section for the
			// announcement of the list. A guest has no tabs, hence no name to hand over.
			currentSectionName() {
				const activeSection = this.navigationSections.find(({
					type
				}) => type === this.currentSection);
				return activeSection?.getTitle() ?? null;
			},
			panelId() {
				return `${this.namespace}-panel`;
			},
			// The ids below are pure functions of the namespace, so they are computed here instead of being
			// asked from the components that own the nodes.
			activeTabId() {
				return `${this.namespace}-tab-${this.currentSection}`;
			},
			listboxId() {
				return `${this.namespace}-listbox`;
			},
			statusId() {
				return `${this.namespace}-status`;
			},
			isMultipleRecipientsAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isForwardMultipleRecipientsAvailable);
			},
			selectedCount() {
				return this.selectedDialogIds.length;
			},
			selectionLimitReached() {
				return this.selectedCount >= MAX_SELECTED_RECIPIENTS;
			},
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			ButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			// Only a rendered tab can name the panel, so the results become a panel together with the tab set
			// and stay a standalone listbox without it - as they do for a guest, who gets no tabs at all. No
			// tabindex here: Tab from the search field has to reach the list itself.
			panelAttrs() {
				if (!this.showSectionTabs) {
					return {};
				}
				return {
					id: this.panelId,
					role: 'tabpanel',
					'aria-labelledby': this.activeTabId
				};
			}
		},
		created() {
			this.currentSection = this.navigationSections[0]?.type ?? im_v2_const.RecentType.default;
		},
		beforeUnmount() {
			im_v2_lib_analytics.Analytics.getInstance().messageForward.onClosePopup();
		},
		methods: {
			onSelectSection(section) {
				this.currentSection = section;
			},
			onLoading(value) {
				this.isLoading = value;
			},
			onSearchZoneKeydown(event) {
				// Kept local: the arrow is never published to the shared key channel, so it acts in this
				// window only. keydown, because the page scroll has to be cancelled before it happens.
				// Exact combination, so Shift/Cmd + arrow stays native text navigation in the field.
				if (!im_v2_lib_utils.Utils.key.isExactCombination(event, 'ArrowDown')) {
					return;
				}
				event.preventDefault();
				this.$refs.searchResults.focusFirstResult();
			},
			// The list has nothing left to hold the focus and asks for it to go back where the window put it on
			// opening. The field is ours, so the node is looked up inside this window and nowhere else; it is
			// found by the very id we hand the field as aria-controls.
			onReturnFocusToSearch() {
				this.$el?.querySelector(`[aria-controls="${this.listboxId}"]`)?.focus();
			},
			onUpdateSearch(query) {
				im_v2_lib_analytics.Analytics.getInstance().messageForward.onStartSearch({
					dialogId: this.dialogId,
					section: this.currentSection
				});
				this.searchQuery = query.trim().toLowerCase();
			},
			isSelfChat(dialogId) {
				return this.$store.getters['chats/isSelfChat'](dialogId);
			},
			async forwardDirectly(forwardDialogId) {
				try {
					const isComplete = await im_v2_provider_service_sending.SendingService.getInstance().forwardMessages({
						forwardIds: this.messagesIds,
						dialogId: forwardDialogId
					});
					if (isComplete === false) {
						im_v2_lib_notifier.Notifier.onDefaultError();
						return;
					}
					im_v2_lib_notifier.Notifier.message.onForwardComplete(this.messagesIds, () => {
						void openForwardChat(forwardDialogId);
					});
					im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playOnce(im_v2_const.SoundType.send);
				} catch {
					im_v2_lib_notifier.Notifier.onDefaultError();
				}
			},
			async onSelectItem(event) {
				const {
					dialogId: forwardDialogId
				} = event;
				this.getEmitter().emit(im_v2_const.EventType.dialog.closeBulkActionsMode, {
					dialogId: this.dialogId
				});
				const isSelfChatForward = this.isSelfChat(forwardDialogId);
				const isSelfChatOpen = this.isSelfChat(this.dialogId);
				if (this.directForward || isSelfChatForward && !isSelfChatOpen) {
					void this.forwardDirectly(forwardDialogId);
				} else {
					await openForwardChat(forwardDialogId);
					this.getEmitter().emit(im_v2_const.EventType.textarea.insertForward, {
						messagesIds: this.messagesIds,
						dialogId: forwardDialogId
					});
				}
				this.$emit('close');
			},
			onToggleItem(event) {
				const {
					dialogId
				} = event;
				if (this.selectedDialogIds.includes(dialogId)) {
					this.selectedDialogIds = this.selectedDialogIds.filter(selectedDialogId => {
						return selectedDialogId !== dialogId;
					});
					return;
				}
				if (this.selectionLimitReached) {
					return;
				}
				this.selectedDialogIds = [...this.selectedDialogIds, dialogId];
				if (this.selectionLimitReached && !this.hasAnnouncedSelectionLimit) {
					this.hasAnnouncedSelectionLimit = true;
					ui_a11y.LiveAnnouncer.announce(this.loc('IM_ENTITY_SELECTOR_FORWARD_RECIPIENT_LIMIT_REACHED'), 'polite');
				}
			},
			onSubmit() {
				if (this.selectedCount === 0) {
					return;
				}
				if (this.selectedCount === 1) {
					void this.onSelectItem({
						dialogId: this.selectedDialogIds[0],
						nativeEvent: null
					});
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.dialog.closeBulkActionsMode, {
					dialogId: this.dialogId
				});
				const operation = im_v2_provider_service_sending.SendingService.getInstance().createForwardOperation({
					forwardIds: [...this.messagesIds],
					recipientDialogIds: [...this.selectedDialogIds]
				});
				const sourceDialogId = this.dialogId;
				const limitReached = this.selectedCount === MAX_SELECTED_RECIPIENTS;
				const reportResult = result => {
					const failedRecipients = result.recipients.filter(({
						state
					}) => state !== 'success');
					const reasonGroups = failedRecipients.flatMap(({
						messages = []
					}) => {
						return messages.map(({
							failureGroup
						}) => failureGroup).filter(Boolean);
					});
					im_v2_lib_analytics.Analytics.getInstance().messageForward.onOperationResult({
						dialogId: sourceDialogId,
						recipientCount: result.totalRecipients,
						unsuccessfulCount: result.totalRecipients - result.successfulRecipients,
						reasonGroups,
						limitReached,
						isRetry: result.isRetry
					});
				};
				const retry = async () => {
					const result = await operation.retry();
					reportResult(result);
					return result;
				};
				const runOperation = async () => {
					try {
						const result = await operation.run();
						reportResult(result);
						try {
							await im_v2_lib_notifier.Notifier.forward.showResult({
								operationId: result.operationId,
								result,
								retry: operation.canRetry() ? retry : undefined
							});
						} catch {
							im_v2_lib_notifier.Notifier.onDefaultError();
						}
						if (result.successfulRecipients > 0) {
							im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playOnce(im_v2_const.SoundType.send);
						}
					} catch {
						im_v2_lib_notifier.Notifier.onDefaultError();
					}
				};
				void runOperation();
				this.$emit('close');
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-entity-selector-forward__container">
			<div class="bx-im-entity-selector-forward__input" @keydown="onSearchZoneKeydown">
				<ChatSearchInput
					:searchMode="true"
					:isLoading="isLoading"
					:withIcon="false"
					autofocusOnTrapActivation
					:withGlobalEscapeHandling="false"
					:clearButtonLabel="loc('IM_ENTITY_SELECTOR_FORWARD_SEARCH_CLEAR_ARIA')"
					inputRole="searchbox"
					:inputControlsId="listboxId"
					:inputDescribedById="statusId"
					:searchContext="namespace"
					@updateSearch="onUpdateSearch"
				/>
			</div>
			<ForwardNavigation
				v-if="showSectionTabs"
				:sections="navigationSections"
				:currentSection="currentSection"
				:namespace="namespace"
				:panelId="panelId"
				@selectSection="onSelectSection"
			/>
			<div class="bx-im-entity-selector-forward__search-result-container" v-bind="panelAttrs">
				<ForwardSearch
					ref="searchResults"
					:query="searchQuery"
					:dialogId="dialogId"
					:recentSection="currentSection"
					:searchContext="namespace"
					:sectionName="currentSectionName"
					:multiple="isMultipleRecipientsAvailable"
					:selectedDialogIds="selectedDialogIds"
					:selectionLimitReached="selectionLimitReached"
					@clickItem="onSelectItem"
					@toggleItem="onToggleItem"
					@loading="onLoading"
					@returnFocusToSearch="onReturnFocusToSearch"
				/>
			</div>
			<div v-if="isMultipleRecipientsAvailable" class="bx-im-entity-selector-forward__footer">
				<span class="bx-im-entity-selector-forward__selected-count">
					{{ loc('IM_ENTITY_SELECTOR_FORWARD_SELECTED_COUNT').replace('#COUNT#', selectedCount) }}
				</span>
				<UiButton
					:size="ButtonSize.LARGE"
					:text="loc('IM_ENTITY_SELECTOR_FORWARD_SUBMIT')"
					:disabled="selectedCount === 0"
					:style="ButtonStyle.FILLED"
					:dataset="{ testid: 'im-forward-submit' }"
					@click="onSubmit"
				/>
			</div>
		</div>
	`
	};

	const POPUP_ID$1 = 'im-forward-popup';
	const AFTER_SHOW_EVENT = 'onAfterShow';

	// @vue/component
	const ForwardPopup = {
		name: 'ForwardPopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			ForwardContent
		},
		provide() {
			// provide() runs before created(), so the signal is born here and kept on the instance.
			this.contentVisibleRef = ui_vue3.ref(false);
			return {
				isForwardContentVisible: this.contentVisibleRef
			};
		},
		props: {
			messagesIds: {
				type: Array,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			directForward: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close'],
		computed: {
			POPUP_ID: () => POPUP_ID$1,
			config() {
				return {
					titleBar: this.popupTitle,
					closeIcon: true,
					targetContainer: document.body,
					fixed: true,
					draggable: true,
					padding: 0,
					autoHide: false,
					contentPadding: 0,
					contentBackground: '#fff',
					overlay: true,
					className: 'bx-im-entity-selector-forward__scope',
					// Popup.shouldUseFocusTrapByDefault() answers false while the opener focus sits in a text
					// input - the usual way of forwarding - so the trap is asked for explicitly. No restore
					// target: an explicit one would disable the trap's own "keep the live outside focus" path.
					focusTrap: {
						looped: true
					}
				};
			},
			popupTitle() {
				return this.messagesIds.length > 1 ? this.loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_FORWARD_TITLE_SEVERAL_MESSAGES') : this.loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_FORWARD_TITLE');
			}
		},
		created() {
			this.popupInstance = null;
		},
		mounted() {
			this.popupInstance = this.$refs.popup.getPopupInstance();
			this.popupInstance.subscribe(AFTER_SHOW_EVENT, this.onPopupAfterShow);
		},
		beforeUnmount() {
			// Cached instance only: MessengerPopup nulls its own on close, so getPopupInstance() here would
			// construct a second Popup and leave it hanging in PopupManager after every close.
			this.popupInstance?.unsubscribe(AFTER_SHOW_EVENT, this.onPopupAfterShow);
			this.popupInstance = null;
		},
		methods: {
			onPopupAfterShow() {
				this.contentVisibleRef.value = true;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<MessengerPopup
			ref="popup"
			:id="POPUP_ID"
			:config="config"
			@close="$emit('close')"
		>
			<ForwardContent
				:dialogId="dialogId"
				:messagesIds="messagesIds"
				:directForward="directForward"
				@close="$emit('close')"
			/>
		</MessengerPopup>
	`
	};

	const EVENT_NAMESPACE = 'BX.Messenger.v2.Component.AttachToCollabV2Confirm';
	class AttachToCollabV2Confirm extends main_core_events.EventEmitter {
		static events = {
			onConfirm: 'onConfirm',
			onCancel: 'onCancel'
		};
		#dialog;
		constructor(context) {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.context = context;
			this.#initDialog();
		}
		show() {
			this.#dialog.show();
		}
		#hide() {
			this.#dialog.hide();
		}
		#initDialog() {
			const params = {
				title: main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ATTACH_TO_COLLAB_V2_CONFIRM_TITLE'),
				closeByEsc: false,
				closeByClickOutside: false,
				hasOverlay: true,
				content: this.#getContainer(),
				centerButtons: [this.#getConfirmButton(), this.#getCancelButton()]
			};
			this.#dialog = new ui_system_dialog.Dialog(params);
		}
		#getContainer() {
			return main_core.Tag.render`
			<div class="bx-im-entity-selector-attach-to-collab-v2-confirm__container bx-im-messenger__scope">
				<div class="bx-im-entity-selector-attach-to-collab-v2-confirm__text">
					${main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ATTACH_TO_COLLAB_V2_CONFIRM_TEXT')}
				</div>
				<div class="bx-im-entity-selector-attach-to-collab-v2-confirm__image"></div>
			</div>
		`;
		}
		#getConfirmButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ATTACH_TO_COLLAB_V2_CONFIRM_BUTTON'),
				useAirDesign: true,
				size: ui_buttons.ButtonSize.LARGE,
				wide: true,
				onclick: async () => {
					this.#hide();
					this.#attachChatByRecentType();
				}
			});
		}
		#getCancelButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ATTACH_TO_COLLAB_V2_CANCEL_BUTTON'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.LARGE,
				wide: true,
				onclick: () => this.#hide()
			});
		}
		#attachChatByRecentType() {
			const handleByRecentType = {
				[im_v2_const.RecentType.collab]: () => this.#attachCurrentChatToCollab(),
				default: () => this.#attachSelectedChatToCollab()
			};
			const recentType = this.context.recentType;
			if (!handleByRecentType[recentType]) {
				handleByRecentType.default();
				return;
			}
			handleByRecentType[recentType]();
		}
		async #attachCurrentChatToCollab() {
			const {
				chatId: parentChatId
			} = im_v2_application_core.Core.getStore().getters['chats/get'](this.context.selectedDialogId);
			void this.#attachToParent(this.context.currentDialogId, parentChatId);
		}
		async #attachSelectedChatToCollab() {
			const {
				chatId: parentChatId
			} = im_v2_application_core.Core.getStore().getters['chats/get'](this.context.currentDialogId);
			void this.#attachToParent(this.context.selectedDialogId, parentChatId);
		}
		async #attachToParent(dialogId, parentChatId) {
			await new im_v2_provider_service_chat.ChatService().attachToParent(dialogId, parentChatId);
			void this.#openAttachedChat(dialogId, parentChatId);
		}
		async #openAttachedChat(dialogId, parentChatId) {
			const {
				dialogId: parentDialogId
			} = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](parentChatId);
			main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.openNestedList, {
				parentDialogId
			});
			void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
				...im_v2_lib_folder.FolderManager.getRegularChatsLayout(),
				entityId: dialogId
			});
		}
	}

	// @vue/component
	const AttachToCollabV2Content = {
		name: 'AttachToCollabV2Content',
		components: {
			ChatSearchInput: im_v2_component_search.ChatSearchInput,
			RecentSearch: im_v2_component_search.RecentSearch
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			recentSectionType: {
				type: String || null,
				default: null
			},
			searchParams: {
				type: Object,
				default: () => ({})
			}
		},
		emits: ['popupClose'],
		data() {
			return {
				searchQuery: '',
				isLoading: false
			};
		},
		methods: {
			onSearchLoading(value) {
				this.isLoading = value;
			},
			onUpdateSearch(query) {
				this.searchQuery = query.trim().toLowerCase();
			},
			onOpenSearchItem(event) {
				const {
					dialogId: selectedDialogId
				} = event;
				const confirm = new AttachToCollabV2Confirm({
					currentDialogId: this.dialogId,
					selectedDialogId,
					recentType: this.recentSectionType
				});
				this.$emit('popupClose');
				confirm.show();
			}
		},
		template: `
		<div class="bx-im-entity-selector-attach-to-collab-v2__container">
			<div class="bx-im-entity-selector-attach-to-collab-v2__input">
				<ChatSearchInput
					:searchMode="true"
					:isLoading="isLoading"
					:withIcon="false"
					:delayForFocusOnStart="1"
					@updateSearch="onUpdateSearch"
				/>
			</div>
			<div class="bx-im-entity-selector-attach-to-collab-v2__search-result-container">
				<RecentSearch
					:searchMode="true"
					:showUsersCarousel="false"
					:additionalSearchParams="searchParams"
					:recentSectionType="recentSectionType"
					:query="searchQuery"
					@loading="onSearchLoading"
					@openItem="onOpenSearchItem"
				/>
			</div>
		</div>
	`
	};

	const POPUP_ID = 'im-attach-to-collab-v2-popup';

	// @vue/component
	const AttachToCollabV2 = {
		name: 'AttachToCollabV2',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			AttachToCollabV2Content
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			recentSectionType: {
				type: String || null,
				default: null
			},
			popupTitle: {
				type: String,
				required: true
			},
			searchParams: {
				type: Object,
				default: () => ({})
			}
		},
		emits: ['close'],
		computed: {
			POPUP_ID: () => POPUP_ID,
			config() {
				return {
					titleBar: this.popupTitle,
					closeIcon: true,
					overlay: {
						backgroundColor: '#00204E75',
						opacity: 100
					},
					padding: 0,
					contentPadding: 0,
					contentBackground: '#fff',
					className: 'bx-im-attach-to-collab-v2__scope'
				};
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<MessengerPopup
			:id="POPUP_ID"
			:config="config"
			@close="$emit('close')"
		>
			<AttachToCollabV2Content
				:dialogId="dialogId"
				:recentSectionType="recentSectionType"
				:searchParams="searchParams"
				@popupClose="$emit('close')"
			/>
		</MessengerPopup>
	`
	};

	exports.AddToChat = AddToChat;
	exports.AddToCollab = AddToCollab;
	exports.AttachToCollabV2 = AttachToCollabV2;
	exports.ForwardPopup = ForwardPopup;

})(this.BX.Messenger.v2.Component.EntitySelector = this.BX.Messenger.v2.Component.EntitySelector || {}, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.UI.EntitySelector, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Vue3.Components, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Event, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Main, BX.Vue3.Directives, BX.Intranet, BX.UI.IconSet, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.UI.System.Checkbox, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.UI, BX.Intranet, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Vue3, BX.Messenger.v2.Component.Elements, BX.UI.Accessibility, BX.Messenger.v2.Component, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI, BX.UI.System, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
