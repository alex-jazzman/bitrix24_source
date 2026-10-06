/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, im_public, im_v2_application_core, im_v2_component_elements_popup, im_v2_const, im_v2_lib_analytics, im_v2_lib_feature, im_v2_lib_guest, im_v2_lib_localStorage, im_v2_lib_notifier, im_v2_lib_permission, im_v2_lib_utils, im_v2_provider_service_chat, im_v2_provider_service_guestInvitation, main_core_events, ui_vue3_components_button, im_v2_lib_helpdesk, im_v2_component_elements_scrollWithGradient, main_popup, ui_vue3_directives_hint, intranet_languages, ui_entitySelector, im_v2_component_search, im_v2_lib_channel, im_v2_lib_access, ui_iconSet_api_core, ui_iconSet_api_vue, im_v2_lib_confirm, im_v2_component_elements_button, ui_infoHelper, intranet_invitationInput, im_v2_lib_collab, im_v2_provider_service_collabInvitation, im_v2_lib_soundNotification, im_v2_provider_service_sending, ui_buttons, ui_system_dialog, im_v2_lib_layout) {
	'use strict';

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
								<a class="bx-im-add-guest-content__helpdesk-link" @click.prevent="openHelpdesk"> 
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
					@click="$emit('addGuest')"
				/>
				<UiButton
					:size="ButtonSize.LARGE"
					:loading="isInvitingGuests"
					:style="ButtonStyle.PLAIN"
					:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_CANCEL_BUTTON')"
					@click="$emit('close')"
				/>
			</div>
		</div>
	`
	};

	const SEARCH_ENTITY_ID = 'user';

	// @vue/component
	const AddToChatContent = {
		name: 'AddToChatContent',
		components: {
			AddToChat: im_v2_component_search.AddToChatSearch,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['inviteMembers', 'close'],
		data() {
			return {
				isLoading: false,
				searchQuery: '',
				showHistory: true,
				selectedItems: new Set()
			};
		},
		computed: {
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			ButtonColor: () => ui_vue3_components_button.ButtonColor,
			ButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
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
			}
		},
		created() {
			this.membersSelector = this.getTagSelector();
		},
		mounted() {
			this.membersSelector.renderTo(this.$refs['tag-selector']);
			this.membersSelector.focusTextBox();
		},
		beforeUnmount() {
			im_v2_lib_analytics.Analytics.getInstance().userAdd.onClosePopup();
		},
		activated() {
			this.membersSelector.hideAddButton();
			this.membersSelector.showTextBox();
			this.membersSelector.focusTextBox();
		},
		methods: {
			getTagSelector() {
				let timeoutId = null;
				return new ui_entitySelector.TagSelector({
					maxHeight: 111,
					showAddButton: false,
					showTextBox: true,
					addButtonCaption: this.loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_ADD_MSGVER_1'),
					addButtonCaptionMore: this.loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_ADD_MORE'),
					showCreateButton: false,
					events: {
						onBeforeTagAdd: () => {
							clearTimeout(timeoutId);
						},
						onAfterTagAdd: event => {
							const {
								tag
							} = event.getData();
							this.selectedItems.add(tag.id);
							this.focusSelector();
						},
						onKeyUp: event => {
							const {
								event: keyboardEvent
							} = event.getData();
							this.getEmitter().emit(im_v2_const.EventType.search.keyPressed, {
								keyboardEvent
							});
						},
						onBeforeTagRemove: () => {
							clearTimeout(timeoutId);
						},
						onAfterTagRemove: event => {
							const {
								tag
							} = event.getData();
							this.selectedItems.delete(tag.id);
							this.focusSelector();
						},
						onInput: () => {
							im_v2_lib_analytics.Analytics.getInstance().userAdd.onStartSearch({
								dialogId: this.dialogId
							});
							this.searchQuery = this.membersSelector.getTextBoxValue().trim().toLowerCase();
						},
						onBlur: () => {
							const inputText = this.membersSelector.getTextBoxValue();
							if (inputText.length > 0) {
								return;
							}
							timeoutId = setTimeout(() => {
								this.membersSelector.hideTextBox();
								this.membersSelector.showAddButton();
							}, 200);
						},
						onContainerClick: () => {
							this.focusSelector();
						}
					}
				});
			},
			focusSelector() {
				this.membersSelector.hideAddButton();
				this.membersSelector.showTextBox();
				this.membersSelector.focusTextBox();
			},
			onSelectItem(event) {
				const {
					dialogId,
					nativeEvent
				} = event;
				if (this.selectedItems.has(dialogId)) {
					const tag = {
						id: dialogId,
						entityId: SEARCH_ENTITY_ID
					};
					this.membersSelector.removeTag(tag);
				} else {
					const tag = this.getTagByDialogId(dialogId);
					this.membersSelector.addTag(tag);
				}
				this.membersSelector.clearTextBox();
				if (!nativeEvent.altKey) {
					this.searchQuery = '';
				}
			},
			getTagByDialogId(dialogId) {
				const user = this.$store.getters['users/get'](dialogId, true);
				const isExtranet = user.type === im_v2_const.UserType.extranet;
				const entityType = isExtranet ? 'extranet' : 'employee';
				return {
					id: dialogId,
					entityId: SEARCH_ENTITY_ID,
					entityType,
					title: user.name,
					avatar: user.avatar.length > 0 ? user.avatar : null
				};
			},
			async onInviteClick() {
				const members = [...this.selectedItems];
				this.isLoading = true;
				const canAdd = await im_v2_lib_access.ChatAccessManager.canAddUsers(this.dialogId, members);
				if (!canAdd) {
					this.isLoading = false;
					return;
				}
				this.isLoading = false;
				this.$emit('inviteMembers', {
					members,
					showHistory: this.showHistory
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(key) {
				return this.$Bitrix.Loc.getMessage(key);
			}
		},
		template: `
		<div class="bx-im-entity-selector-add-to-chat__container">
			<div class="bx-im-entity-selector-add-to-chat__input" ref="tag-selector"></div>
			<div v-if="showHistoryOption" class="bx-im-entity-selector-add-to-chat__show-history">
				<input type="checkbox" id="bx-im-entity-selector-add-to-chat-show-history" v-model="showHistory">
				<label for="bx-im-entity-selector-add-to-chat-show-history">
					{{ loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_SHOW_HISTORY_MSGVER_1')}}
				</label>
			</div>
			<div class="bx-im-entity-selector-add-to-chat__search-result-container">
				<AddToChat
					:query="searchQuery"
					:dialogId="dialogId"
					:selectedItems="[...selectedItems]"
					@clickItem="onSelectItem"
				/>
			</div>
			<div class="bx-im-entity-selector-add-to-chat__buttons">
				<UiButton
					:size="ButtonSize.LARGE"
					:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_BUTTON')"
					:loading="isLoading"
					:disabled="selectedItems.size === 0"
					:style="ButtonStyle.FILLED"
					@click="onInviteClick"
				/>
				<UiButton
					:size="ButtonSize.LARGE"
					:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_CANCEL_BUTTON')"
					:style="ButtonStyle.PLAIN"
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
				@click="$emit('onCopyInviteLink')"
			/>
			<button
				v-if="canUpdateLink"
				v-hint="updateLinkHint"
				:class="{'--loading': isUpdatingInviteLink}"
				class="bx-im-copy-invite-link__update-link_button"
				@click="confirmAndUpdateInviteLink"
			>
				<BIcon :name="refreshIcon" :size="20" />
			</button>
		</div>
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

	const POPUP_ID$3 = 'im-add-to-chat-popup';
	const ARTICLE_CODE = '28188420';

	// @vue/component
	const AddToChat = {
		name: 'AddToChat',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			AddToChatContent,
			TabsWrapper,
			AddGuestContent,
			CopyInviteLink,
			ChatInvitationInput
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
				activeTabId: im_v2_const.TabId.guests,
				isCopyingInviteLink: false,
				isUpdatingInviteLink: false,
				isInvitingGuests: false,
				isAddButtonDisabled: true,
				candidates: []
			};
		},
		computed: {
			POPUP_ID: () => POPUP_ID$3,
			ARTICLE_CODE: () => ARTICLE_CODE,
			config() {
				return {
					titleBar: main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_ADD_MEMBERS_TITLE_MSGVER_1'),
					closeIcon: true,
					bindElement: this.bindElement,
					offsetTop: this.popupConfig.offsetTop,
					offsetLeft: this.popupConfig.offsetLeft,
					padding: 0,
					contentPadding: 0,
					contentBackground: '#fff',
					className: 'bx-im-entity-selector-add-to-chat__scope'
				};
			},
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
			guestDescriptionTitle() {
				return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_DESCRIPTION_TITLE_EMPLOYEE');
			},
			guestDescription() {
				return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_DESCRIPTION_TEXT_GUEST');
			},
			isPhoneInviteAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.inviteByPhoneAvailable);
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
			}
		},
		created() {
			this.chatService = new im_v2_provider_service_chat.ChatService();
		},
		mounted() {
			const savedTab = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.invitePopupTab);
			if (this.canInviteGuests && savedTab) {
				this.activeTabId = savedTab;
			}
		},
		methods: {
			inviteMembers(event) {
				const {
					members,
					showHistory
				} = event;
				if (this.isChat) {
					this.extendChat(members, showHistory);
				} else {
					members.push(this.dialogId, im_v2_application_core.Core.getUserId());
					void this.extendToGroupChat(members);
				}
			},
			extendChat(members, showHistory) {
				this.isLoading = true;
				this.chatService.addToChat({
					chatId: this.chatId,
					members,
					showHistory
				}).then(() => {
					this.isLoading = false;
					this.$emit('close');
				}).catch(() => {
					this.isLoading = false;
					this.$emit('close');
				});
			},
			async extendToGroupChat(members) {
				this.isLoading = true;
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
			onTabSwitch(tabId) {
				this.activeTabId = tabId;
			},
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
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<TabsWrapper
				v-if="canInviteGuests"
				:activeTabId="activeTabId"
				@onTabSwitch="onTabSwitch"
			/>
			<KeepAlive>
				<AddGuestContent
					v-if="isGuestTab"
					:chatId="chatId"
					:articleCode="ARTICLE_CODE"
					:guestTitle="guestDescriptionTitle"
					:guestDescription="guestDescription"
					:isAddButtonDisabled="isAddButtonDisabled"
					:isInvitingGuests="isInvitingGuests"
					:isHideLangSelector="true"
					class="bx-im-add-to-chat-guest-tab__scope"
					@addGuest="addGuest"
					@close="$emit('close')"
				>
					<template #copy-link>
						<CopyInviteLink
							:dialogId="dialogId"
							:canUpdateLink="canManageGuestLinks"
							:isUpdatingInviteLink="isUpdatingInviteLink"
							:isCopyingInviteLink="isCopyingInviteLink"
							@onUpdateInviteLink="updateLink"
							@onCopyInviteLink="copyInviteLink"
						/>
					</template>
					<template #invitation-input>
						<ChatInvitationInput
							:isPhoneAllowed="isPhoneInviteAvailable"
							@change="onInvitationInputChange"
							@validityChange="onInvitationInputValidityChange"
						/>
					</template>
				</AddGuestContent>
				<AddToChatContent
					v-else
					:dialogId="dialogId"
					class="bx-im-add-to-chat-guest-tab__scope"
					@inviteMembers="inviteMembers"
					@close="$emit('close')"
				/>
			</KeepAlive>
		</MessengerPopup>
	`
	};

	// @vue/component
	const AddEmployeesTab = {
		name: 'AddEmployeesTab',
		components: {
			AddToChatContent
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['close'],
		methods: {
			inviteMembers({
				members
			}) {
				new im_v2_provider_service_collabInvitation.CollabInvitationService().addEmployees({
					dialogId: this.dialogId,
					members
				});
				this.$emit('close');
			}
		},
		template: `
		<div class="bx-im-add-to-collab__employees-tab-container">
			<AddToChatContent
				:dialogId="dialogId"
				class="bx-im-add-to-collab-guest-tab__scope"
				@inviteMembers="inviteMembers"
				@close="$emit('close')"
			/>
		</div>
	`
	};

	const POPUP_ID$2 = 'im-add-to-collab-popup';

	// @vue/component
	const AddToCollab = {
		name: 'AddToCollab',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			AddGuestContent,
			AddEmployeesTab,
			TabsWrapper,
			CopyInviteLink
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
				isCopyingInviteLink: false,
				isUpdatingInviteLink: false,
				isAddButtonDisabled: true,
				isInvitingGuests: false,
				invitationLangCode: ''
			};
		},
		computed: {
			POPUP_ID: () => POPUP_ID$2,
			config() {
				return {
					titleBar: im_v2_lib_collab.CollabManager.getInviteHeaderText(),
					closeIcon: true,
					bindElement: this.bindElement,
					offsetTop: this.popupConfig.offsetTop,
					offsetLeft: this.popupConfig.offsetLeft,
					padding: 0,
					contentPadding: 0,
					contentBackground: '#fff',
					className: 'bx-im-add-to-collab__scope'
				};
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
				const chat = this.$store.getters['chats/get'](this.dialogId, true);
				return chat.chatId;
			},
			collabChatId() {
				const collab = this.$store.getters['chats/collabs/getByChatId'](this.chatId);
				return collab.collabId;
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
			canUpdateLink() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.updateInviteLink, this.dialogId);
			}
		},
		watch: {
			activeTabId() {
				this.initInvitationInput();
			}
		},
		created() {
			this.setInitialActiveTab();
		},
		mounted() {
			this.initInvitationInput();
		},
		beforeUnmount() {
			this.destroyInvitationInput();
		},
		methods: {
			setInitialActiveTab() {
				if (this.isEnabledCollabersInvitation && !this.isCollabV2Available) {
					this.activeTabId = im_v2_const.TabId.guests;
				}
			},
			onTabSwitch(tabId) {
				this.activeTabId = tabId;
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
				} catch {
					im_v2_lib_notifier.Notifier.collab.onCopyLinkError();
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
				} catch {
					im_v2_lib_notifier.Notifier.onDefaultError();
				} finally {
					this.isUpdatingInviteLink = false;
				}
			},
			onReadySaveInputHandler() {
				this.isAddButtonDisabled = false;
			},
			onUnreadySaveInputHandler() {
				this.isAddButtonDisabled = true;
				this.isInvitingGuests = false;
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
				this.isInvitingGuests = true;
				await this.invitationGuests.inviteToGroup(this.collabChatId);
				this.isInvitingGuests = false;
				this.$emit('close');
			},
			onInviteLanguageSelected(langCode) {
				this.invitationLangCode = langCode;
				this.invitationGuests.changeLanguage(langCode);
			}
		},
		template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<TabsWrapper
				:activeTabId="activeTabId"
				@onTabSwitch="onTabSwitch"
			/>
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
							@click="onInvitationGuest"
						/>
					</template>
				</AddGuestContent>
				<AddEmployeesTab v-else :dialogId="dialogId" @close="$emit('close')"/>
			</KeepAlive>
		</MessengerPopup>
	`
	};

	// @vue/component
	const ForwardContent = {
		name: 'ForwardContent',
		components: {
			ForwardSearch: im_v2_component_search.ForwardSearch,
			ChatSearchInput: im_v2_component_search.ChatSearchInput
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
				searchQuery: '',
				isLoading: false
			};
		},
		beforeUnmount() {
			im_v2_lib_analytics.Analytics.getInstance().messageForward.onClosePopup();
		},
		methods: {
			onLoading(value) {
				this.isLoading = value;
			},
			onUpdateSearch(query) {
				im_v2_lib_analytics.Analytics.getInstance().messageForward.onStartSearch({
					dialogId: this.dialogId
				});
				this.searchQuery = query.trim().toLowerCase();
			},
			isSelfChat(dialogId) {
				return this.$store.getters['chats/isSelfChat'](dialogId);
			},
			async forwardDirectly(forwardDialogId) {
				await im_v2_provider_service_sending.SendingService.getInstance().forwardMessages({
					forwardIds: this.messagesIds,
					dialogId: forwardDialogId
				});
				im_v2_lib_notifier.Notifier.message.onForwardComplete(this.messagesIds, forwardDialogId);
				im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playOnce(im_v2_const.SoundType.send);
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
					await im_public.Messenger.openChat(forwardDialogId);
					this.getEmitter().emit(im_v2_const.EventType.textarea.insertForward, {
						messagesIds: this.messagesIds,
						dialogId: forwardDialogId
					});
				}
				this.$emit('close');
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div class="bx-im-entity-selector-forward__container">
			<div class="bx-im-entity-selector-forward__input">
				<ChatSearchInput 
					:searchMode="true" 
					:isLoading="isLoading" 
					:withIcon="false" 
					:delayForFocusOnStart="1"
					@updateSearch="onUpdateSearch"
				/>
			</div>
			<div class="bx-im-entity-selector-forward__search-result-container">
				<ForwardSearch
					:query="searchQuery"
					:dialogId="dialogId"
					@clickItem="onSelectItem"
					@loading="onLoading"
				/>
			</div>
		</div>
	`
	};

	const POPUP_ID$1 = 'im-forward-popup';

	// @vue/component
	const ForwardPopup = {
		name: 'ForwardPopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			ForwardContent
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
					className: 'bx-im-entity-selector-forward__scope'
				};
			},
			popupTitle() {
				return this.messagesIds.length > 1 ? this.loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_FORWARD_TITLE_SEVERAL_MESSAGES') : this.loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_FORWARD_TITLE');
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
				name: im_v2_const.Layout.chat,
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

})(this.BX.Messenger.v2.Component.EntitySelector = this.BX.Messenger.v2.Component.EntitySelector || {}, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Event, BX.Vue3.Components, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Main, BX.Vue3.Directives, BX.Intranet, BX.UI.EntitySelector, BX.Messenger.v2.Component, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI.IconSet, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.UI, BX.Intranet, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.UI, BX.UI.System, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
