/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
this.BX.OpenLines.v2.Component = this.BX.OpenLines.v2.Component || {};
(function (exports, imopenlines_v2_css_tokens, im_v2_lib_logger, im_public, imopenlines_v2_provider_service, im_v2_component_content_elements, im_v2_component_dialog_chat, im_v2_lib_menu, im_v2_const, imopenlines_v2_lib_queue, im_v2_application_core, im_v2_component_elements_button, imopenlines_v2_const, ui_vue3_components_button, im_v2_component_elements_popup, ui_entitySelector, im_v2_component_search, ui_iconSet_api_vue, im_v2_lib_layout, im_v2_component_textarea, imopenlines_v2_lib_toolbarButtons, imopenlines_v2_lib_utils, im_v2_component_elements_loader, ui_system_input_vue, im_v2_lib_utils, main_core, imopenlines_v2_lib_quickReply, im_v2_component_elements_scrollWithGradient, main_popup, ui_system_chip_vue, im_v2_lib_directives, ui_iconSet_api_core, main_core_events, im_v2_lib_theme) {
	'use strict';

	const QUEUE_ID_PREFIX = 'queue';

	// @vue/component
	const QueueSearch = {
		name: 'QueueSearch',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			query: {
				type: String,
				default: ''
			},
			selectedItems: {
				type: Array,
				default: () => []
			}
		},
		emits: ['clickItem'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			isLinesOperator() {
				return this.$store.getters['openLines/queue/isLinesOperator'];
			},
			queues() {
				if (!this.isLinesOperator) {
					return [];
				}
				return this.$store.getters['openLines/queue/getListOfActive']();
			},
			filteredQueues() {
				if (this.query.length === 0) {
					return this.queues;
				}
				const processedQuery = this.query.toLowerCase();
				return this.queues.filter(queue => queue.lineName.toLowerCase().includes(processedQuery));
			},
			hasQueues() {
				return this.filteredQueues.length > 0;
			}
		},
		methods: {
			isSelected(queueId) {
				const queueFullId = `${QUEUE_ID_PREFIX}${queueId}`;
				return this.selectedItems.includes(queueFullId);
			},
			selectQueue(queue, nativeEvent) {
				this.$emit('clickItem', {
					queueId: queue.id,
					nativeEvent
				});
			},
			loc(key) {
				return this.$Bitrix.Loc.getMessage(key);
			}
		},
		template: `
		<div v-if="hasQueues" class="bx-imol-chat-transfer-entity-selector__queue-list">
			<div class="bx-imol-chat-transfer-entity-selector__queue-list-title">
				{{ loc('IMOL_ENTITY_SELECTOR_CHAT_TRANSFER_QUEUE_SECTION') }}
			</div>
			<div
				class="bx-im-search-item__container bx-im-search-item__scope"
				v-for="queue in filteredQueues"
				:key="queue.id"
				:class="{ '--selected': isSelected(queue.id) }"
				@click="selectQueue(queue, $event)"
			>
				<div class="bx-im-search-item__avatar-container">
					<div
						class="bx-imol-chat-transfer-entity-selector__queue-avatar"
						:style="{ backgroundColor: queue.color }"
					>
						<BIcon :name="OutlineIcons.OPEN_CHANNELS" />
					</div>
				</div>
				<div class="bx-im-search-item__content-container">
					<div class="bx-im-search-item__content_header">
						<div class="bx-imol-chat-transfer-entity-selector__queue-title">{{ queue.lineName }}</div>
					</div>
					<div class="bx-im-search-item__item-text">
						{{ loc('IMOL_ENTITY_SELECTOR_CHAT_TRANSFER_QUEUE_ITEM_SUBTITLE') }}
					</div>
				</div>
				<div v-if="isSelected(queue.id)" class="bx-im-chat-search-item__selected"></div>
			</div>
		</div>
	`
	};

	const SEARCH_ENTITY_USER = 'user';
	const SEARCH_ENTITY_QUEUE = 'queue';
	const ChatTransferContent = {
		name: 'ChatTransferContent',
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton,
			ChatSearch: im_v2_component_search.AddToChatSearch,
			QueueSearch
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				searchQuery: '',
				selectedItem: null
			};
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			ButtonColor: () => im_v2_component_elements_button.ButtonColor,
			selectedItems() {
				return this.selectedItem ? [this.selectedItem.id] : [];
			}
		},
		created() {
			this.membersSelector = this.getTagSelector();
		},
		mounted() {
			this.membersSelector.renderTo(this.$refs['tag-selector']);
			this.membersSelector.focusTextBox();
		},
		methods: {
			getTagSelector() {
				return new ui_entitySelector.TagSelector({
					maxHeight: 150,
					showAddButton: false,
					showTextBox: true,
					showCreateButton: false,
					addButtonCaption: this.loc('IMOL_CHAT_TRANSFER_ENTITY_SELECTOR_INPUT'),
					events: {
						onContainerClick: () => {
							this.focusSelector();
						},
						onBlur: () => {
							if (this.membersSelector.getTextBoxValue().length > 0) {
								return;
							}
							this.membersSelector.hideTextBox();
							this.membersSelector.showAddButton();
						},
						onAfterTagRemove: event => {
							const {
								tag
							} = event.getData();
							if (this.selectedItem?.id === tag.id) {
								this.selectedItem = null;
							}
							this.focusSelector();
						},
						onInput: () => {
							this.searchQuery = this.membersSelector.getTextBoxValue();
						}
					}
				});
			},
			focusSelector() {
				this.membersSelector.hideAddButton();
				this.membersSelector.showTextBox();
				this.membersSelector.focusTextBox();
			},
			selectItem(tag, clearQuery) {
				this.membersSelector.removeTags();
				const isSameItem = this.selectedItem?.id === tag.id;
				if (!isSameItem) {
					this.membersSelector.addTag(tag);
					this.selectedItem = tag;
				}
				this.membersSelector.clearTextBox();
				if (clearQuery) {
					this.searchQuery = '';
				}
			},
			selectUser(event) {
				const {
					dialogId,
					nativeEvent
				} = event;
				const user = this.$store.getters['users/get'](dialogId, true);
				this.selectItem({
					id: dialogId,
					entityId: SEARCH_ENTITY_USER,
					title: user.name,
					avatar: user.avatar.length > 0 ? user.avatar : null
				}, !nativeEvent.altKey);
			},
			selectQueue(event) {
				const {
					queueId,
					nativeEvent
				} = event;
				const queue = this.$store.getters['openLines/queue/getById'](queueId);
				const queueFullId = `${QUEUE_ID_PREFIX}${queueId}`;
				this.selectItem({
					id: queueFullId,
					entityId: SEARCH_ENTITY_QUEUE,
					title: queue.lineName
				}, !nativeEvent.altKey);
			},
			chatTransfer() {
				return this.getTransferService().chatTransfer(this.dialogId, this.selectedItem.id);
			},
			getTransferService() {
				if (!this.transferService) {
					this.transferService = new imopenlines_v2_provider_service.TransferService();
				}
				return this.transferService;
			},
			loc(key) {
				return this.$Bitrix.Loc.getMessage(key);
			}
		},
		template: `
		<div class="bx-imol-chat-transfer-entity-selector__container">
			<div class="bx-imol-chat-transfer-entity-selector__input" ref="tag-selector"></div>
			<div class="bx-imol-chat-transfer-entity-selector__search-result-container">
				<QueueSearch
					:query="searchQuery"
					:selectedItems="selectedItems"
					@clickItem="selectQueue"
				/>
				<ChatSearch
					:query="searchQuery"
					:dialogId="dialogId"
					:selectedItems="selectedItems"
					@clickItem="selectUser"
				/>
			</div>
			<div class="bx-imol-chat-transfer-entity-selector__buttons">
				<ChatButton
					:size="ButtonSize.L"
					:color="ButtonColor.Primary"
					:isRounded="true"
					:text="loc('IMOL_CONTENT_BUTTON_TRANSFER')"
					:isDisabled="!selectedItem"
					@click="chatTransfer"
				/>
				<ChatButton
					:size="ButtonSize.L"
					:color="ButtonColor.LightBorder"
					:isRounded="true"
					:text="loc('IMOL_ENTITY_SELECTOR_CHAT_TRANSFER_CANCEL_BUTTON')"
					@click="$emit('close')"
				/>
			</div>
		</div>
	`
	};

	const POPUP_ID$3 = 'imol-chat-transfer-popup';

	// @vue/component
	const ChatTransfer = {
		name: 'ChatTransfer',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			ChatTransferContent
		},
		props: {
			showPopup: {
				type: Boolean,
				required: true
			},
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
		computed: {
			POPUP_ID: () => POPUP_ID$3,
			config() {
				return {
					titleBar: this.$Bitrix.Loc.getMessage('IMOL_CONTENT_BUTTON_TRANSFER'),
					closeIcon: true,
					bindElement: this.bindElement,
					offsetTop: this.popupConfig.offsetTop,
					offsetLeft: this.popupConfig.offsetLeft,
					padding: 0,
					contentPadding: 0,
					contentBackground: '#fff',
					className: 'bx-imol-chat-transfer-entity-selector__container'
				};
			}
		},
		template: `
		<MessengerPopup
			v-if="showPopup"
			:config="config"
			@close="$emit('close')"
			:id="POPUP_ID"
		>
			<ChatTransferContent :dialogId="dialogId" @close="$emit('close')"/>
		</MessengerPopup>
	`
	};

	// @vue/component
	const ChatControlPanel = {
		name: 'ChatControlPanel',
		components: {
			UiButton: ui_vue3_components_button.Button,
			ChatTransfer
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isQueueTypeAll: {
				type: Boolean,
				required: true
			}
		},
		data() {
			return {
				showChatTransferPopup: false
			};
		},
		computed: {
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle
		},
		methods: {
			replyDialog() {
				return this.getAnswerService().requestAnswer(this.dialogId);
			},
			skipDialog() {
				return this.getSkipService().requestSkip(this.dialogId);
			},
			getAnswerService() {
				if (!this.answerService) {
					this.answerService = new imopenlines_v2_provider_service.AnswerService();
				}
				return this.answerService;
			},
			getSkipService() {
				if (!this.skipService) {
					this.skipService = new imopenlines_v2_provider_service.SkipService();
				}
				return this.skipService;
			},
			openChatTransferPopup() {
				this.showChatTransferPopup = true;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ul class="bx-imol-textarea_join-panel-list-button">
			<li class="bx-imol-textarea_join-panel-item-button">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_ANSWER')"
					@click="replyDialog"
				/>
			</li>
			<li v-if="!isQueueTypeAll" class="bx-imol-textarea_join-panel-item-button">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED_ALERT"
					:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_SKIP')"
					@click="skipDialog"
				/>
			</li>
			<li class="bx-imol-textarea_join-panel-item-button" ref="transfer-chat">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.OUTLINE"
					:text="loc('IMOL_CONTENT_BUTTON_TRANSFER')"
					@click="openChatTransferPopup"
				/>
			</li>
		</ul>
		<ChatTransfer
			:bindElement="$refs['transfer-chat'] || {}"
			:dialogId="dialogId"
			:showPopup="showChatTransferPopup"
			:popupConfig="{offsetTop: -700, offsetLeft: 0}"
			@close="showChatTransferPopup = false"
		/>

	`
	};

	// @vue/component
	const JoinPanel = {
		name: 'JoinPanel',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isNewSession: {
				type: Boolean,
				required: true
			},
			isClosed: {
				type: Boolean,
				required: true
			}
		},
		computed: {
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			textStartJoinButtons() {
				return this.isClosed ? this.loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_START') : this.loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_JOIN_BUTTON');
			}
		},
		methods: {
			handleDialogAccess() {
				if (this.isClosed) {
					return this.getStartService().startDialog(this.dialogId);
				}
				return this.getJoinService().joinToDialog(this.dialogId);
			},
			closeDialog() {
				void im_public.Messenger.openLines();
				im_v2_lib_layout.LayoutManager.getInstance().setLastOpenedElement(im_v2_const.Layout.openlinesV2, '');
			},
			getStartService() {
				if (!this.startService) {
					this.startService = new imopenlines_v2_provider_service.StartService();
				}
				return this.startService;
			},
			getJoinService() {
				if (!this.joinService) {
					this.joinService = new imopenlines_v2_provider_service.JoinService();
				}
				return this.joinService;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ul class="bx-imol-textarea_join-panel-list-button">
			<li v-if="!isNewSession" class="bx-imol-textarea_join-panel-item-button">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					:text=textStartJoinButtons
					@click="handleDialogAccess"
				/>
			</li>
			<li class="bx-imol-textarea_join-panel-item-button">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED_ALERT"
					:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_CLOSE')"
					@click="closeDialog"
				/>
			</li>
		</ul>
	`
	};

	// @vue/component
	const JoinPanelContainer = {
		name: 'JoinPanelContainer',
		components: {
			OpenLinesButton: im_v2_component_elements_button.ChatButton,
			ChatControlPanel,
			JoinPanel
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isQueueTypeAll: {
				type: Boolean,
				required: true
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			session() {
				return this.$store.getters['openLines/sessions/getByChatId'](this.dialog.chatId, true);
			},
			isNewSession() {
				if (!this.session) {
					return false;
				}
				return this.session.status === imopenlines_v2_const.StatusGroup.new;
			},
			isOperator() {
				const userId = im_v2_application_core.Core.getUserId();
				return userId === this.session.operatorId;
			},
			isClosed() {
				return this.session ? this.session.isClosed : false;
			}
		},
		template: `
		<div class="bx-imol-textarea_join-panel-container">
			<ChatControlPanel v-if="(isNewSession && isOperator) || isQueueTypeAll" :dialogId="dialogId" :isQueueTypeAll="isQueueTypeAll"/>
			<JoinPanel v-else :dialogId="dialogId" :isClosed="isClosed" :isNewSession="isNewSession"/>
		</div>
	`
	};

	// @vue/component
	const OpenLinesHeader = {
		name: 'OpenLinesHeader',
		components: {
			ChatHeader: im_v2_component_content_elements.ChatHeader,
			ChatTransfer
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isQueueTypeAll: {
				type: Boolean,
				required: true
			}
		},
		data() {
			return {
				showChatTransferPopup: false
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			session() {
				return this.$store.getters['openLines/sessions/getByChatId'](this.dialog.chatId, true);
			},
			isPinned() {
				return this.session ? this.session.pinned : false;
			},
			isClosed() {
				return this.session ? this.session.isClosed : false;
			},
			isOwner() {
				const ownerId = this.dialog.ownerId;
				if (!ownerId) {
					return false;
				}
				const userId = im_v2_application_core.Core.getUserId();
				return ownerId === userId;
			},
			isNewSession() {
				if (!this.session) {
					return false;
				}
				return this.session.status === imopenlines_v2_const.StatusGroup.new;
			},
			isOperator() {
				const userId = im_v2_application_core.Core.getUserId();
				return userId === this.session.operatorId;
			},
			textForPinButton() {
				return this.isPinned ? this.loc('IMOL_CONTENT_HEADER_BUTTON_UNPIN') : this.loc('IMOL_CONTENT_HEADER_BUTTON_PIN');
			},
			classIconButtonPin() {
				return this.isPinned ? 'fa-link-slash' : 'fa-link';
			}
		},
		methods: {
			onMarkSpam() {
				return this.getFinishService().markSpamChat(this.dialogId);
			},
			onFinish() {
				return this.getFinishService().finishChat(this.dialogId);
			},
			onPin() {
				if (this.isPinned) {
					return this.getPinService().unpinChat(this.dialogId);
				}
				return this.getPinService().pinChat(this.dialogId);
			},
			onIntercept() {
				return this.getInterceptService().interceptDialog(this.dialogId);
			},
			openChatTransferPopup() {
				this.showChatTransferPopup = true;
			},
			getFinishService() {
				if (!this.finishService) {
					this.finishService = new imopenlines_v2_provider_service.FinishService();
				}
				return this.finishService;
			},
			getPinService() {
				if (!this.pinService) {
					this.pinService = new imopenlines_v2_provider_service.PinService();
				}
				return this.pinService;
			},
			getInterceptService() {
				if (!this.interceptService) {
					this.interceptService = new imopenlines_v2_provider_service.InterceptService();
				}
				return this.interceptService;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-imol-header-button_container">
			<ChatHeader
				:dialogId="dialogId"
				:withCallButton="false"
				:withSearchButton="true"
			>
				<template v-if="!isClosed" #before-actions>
					<ul v-if="isOperator || isNewSession" class="bx-imol-header-button_container-list">
						<li v-if="isOperator || isQueueTypeAll" class="bx-imol-header-button_container-item">
							<button
								:title="loc('IMOL_CONTENT_HEADER_BUTTON_SPAM')"
								class="bx-imol-header-button__icon-container"
								@click="onMarkSpam"
							>
								<i class="bx-imol-header-button__icon fa-solid fa-triangle-exclamation fa-lg"></i>
							</button>
						</li>
						<template v-if="isOwner">
							<li class="bx-imol-header-button_container-item">
								<button
									:title="loc('IMOL_CONTENT_HEADER_BUTTON_FINISH')"
									class="bx-imol-header-button__icon-container"
									@click="onFinish"
								>
									<i class="bx-imol-header-button__icon fa-regular fa-circle-check fa-lg"></i>
								</button>
							</li>
							<li class="bx-imol-header-button_container-item">
								<button
									:title="textForPinButton"
									class="bx-imol-header-button__icon-container"
									@click="onPin"
								>
									<i class="bx-imol-header-button__icon fa-solid fa-lg" :class="classIconButtonPin"></i>
								</button>
							</li>
							<li class="bx-imol-header-button_container-item">
								<button
									:title="loc('IMOL_CONTENT_BUTTON_TRANSFER')"
									:class="{'--active': showChatTransferPopup}"
									class="bx-imol-header-button__icon-container"
									@click="openChatTransferPopup"
									ref="transfer-chat"
								>
									<i class="bx-imol-header-button__icon fa-solid fa-arrows-turn-right fa-lg"></i>
								</button>
							</li>
						</template>
					</ul>
					<div v-else class="bx-imol-header-button_container-item">
						<button
							:title="loc('IMOL_CONTENT_HEADER_BUTTON_INTERCEPT')"
							class="bx-imol-header-button__icon-container"
							@click="onIntercept"
						>
							<i class="bx-imol-header-button__icon fa-solid fa-arrows-left-right fa-xl"></i>
						</button>
					</div>
				</template>
			</ChatHeader>
			<ChatTransfer
				:bindElement="$refs['transfer-chat'] || {}"
				:dialogId="dialogId"
				:showPopup="showChatTransferPopup"
				:popupConfig="{offsetTop: 15, offsetLeft: -300}"
				@close="showChatTransferPopup = false"
			/>
		</div>
	`
	};

	// @vue/component
	const CrmFormSearch = {
		name: 'CrmFormSearch',
		components: {
			BInput: ui_system_input_vue.BInput
		},
		emits: ['updateQuery', 'submit'],
		data() {
			return {
				query: ''
			};
		},
		computed: {
			InputSize: () => ui_system_input_vue.InputSize,
			InputDesign: () => ui_system_input_vue.InputDesign
		},
		watch: {
			query(value) {
				this.$emit('updateQuery', value);
			}
		},
		methods: {
			onKeydown(event) {
				if (im_v2_lib_utils.Utils.key.isCombination(event, 'Enter')) {
					this.$emit('submit');
				}
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-imol-crm-form-popup__search">
			<BInput
				v-model="query"
				:design="InputDesign.LightGrey"
				:size="InputSize.Md"
				:placeholder="loc('IMOL_CONTENT_TEXTAREA_CRM_FORM_POPUP_SEARCH_PLACEHOLDER')"
				:title="loc('IMOL_CONTENT_TEXTAREA_CRM_FORM_POPUP_SEARCH_TITLE')"
				@keydown="onKeydown"
			/>
		</div>
	`
	};

	const POPUP_ID$2 = 'imol-crm-form-popup';
	const POPUP_CLASSNAME$2 = 'bx-imol-crm-form-popup__container';

	// @vue/component
	const CrmFormPopup = {
		name: 'CrmFormPopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			CrmFormSearch,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			forms: {
				type: Array,
				default: () => []
			}
		},
		emits: ['selectForm', 'close'],
		data() {
			return {
				searchQuery: ''
			};
		},
		computed: {
			POPUP_ID: () => POPUP_ID$2,
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			list() {
				if (this.searchQuery === '') {
					return this.forms;
				}
				const query = this.searchQuery.toLowerCase();
				return this.forms.filter(form => {
					return form.name.toLowerCase().includes(query);
				});
			},
			isListEmpty() {
				return this.list.length === 0;
			},
			popupConfig() {
				return {
					bindElement: this.bindElement,
					className: POPUP_CLASSNAME$2,
					width: 500,
					height: 216,
					overlay: false,
					autoHide: true,
					bindOptions: {
						position: 'top'
					},
					angle: {
						offset: 35,
						position: 'bottom'
					},
					animation: 'fading'
				};
			}
		},
		methods: {
			onSearchUpdate(query) {
				this.searchQuery = query;
			},
			onFormClick(form) {
				this.$emit('selectForm', form);
			},
			onSearchSubmit() {
				const selectedForm = this.list[0];
				if (selectedForm) {
					this.$emit('selectForm', selectedForm);
				}
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<MessengerPopup
			:config="popupConfig"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<CrmFormSearch @updateQuery="onSearchUpdate" @submit="onSearchSubmit" />
			<div class="bx-imol-crm-form-popup__list">
				<template v-if="isListEmpty">
					<div class="bx-imol-crm-form-popup__empty">
						{{ loc('IMOL_CONTENT_TEXTAREA_CRM_FORM_POPUP_EMPTY') }}
					</div>
				</template>
				<template v-else>
					<div
						v-for="form in list"
						:key="form.id"
						@click="onFormClick(form)"
						class="bx-imol-crm-form-popup__item"
					>
						<div class="bx-imol-crm-form-popup__item-icon">
							<BIcon :name="OutlineIcons.ARROW_RIGHT_M" />
						</div>
						<span class="bx-imol-crm-form-popup__item-title --ellipsis">{{ form.name }}</span>
					</div>
				</template>
			</div>
		</MessengerPopup>
	`
	};

	// @vue/component
	const CrmForm = {
		name: 'CrmForm',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			CrmFormPopup,
			Spinner: im_v2_component_elements_loader.Spinner
		},
		props: {
			forms: {
				type: Array,
				default: () => []
			},
			isLoading: {
				type: Boolean,
				default: false
			}
		},
		emits: ['open', 'close', 'selectForm'],
		data() {
			return {
				selectorElement: null,
				showPopup: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
			SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor
		},
		mounted() {
			this.selectorElement = this.$refs.crmFormButton;
		},
		methods: {
			onClick() {
				if (this.showPopup) {
					this.onPopupClose();
					return;
				}
				this.showPopup = true;
				this.$emit('open');
			},
			onPopupClose() {
				this.showPopup = false;
				this.$emit('close');
			},
			onSelectForm(form) {
				this.$emit('selectForm', form);
				this.onPopupClose();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<span ref="crmFormButton">
			<Spinner
				v-if="isLoading"
				:size="SpinnerSize.XS"
				:color="SpinnerColor.blue"
			/>
			<BIcon
				v-else
				:name="OutlineIcons.CRM_FORM"
				:title="loc('IMOL_CONTENT_TEXTAREA_CRM_FORM')"
				class="bx-imol-textarea-icon"
				:class="{ '--active': showPopup }"
				@click="onClick"
			/>
		</span>
		<CrmFormPopup
			v-if="showPopup && !isLoading"
			:bindElement="selectorElement"
			:forms="forms"
			@selectForm="onSelectForm"
			@close="onPopupClose"
		/>
	`
	};

	// @vue/component
	const QuickReplySearch = {
		name: 'QuickReplySearch',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BInput: ui_system_input_vue.BInput
		},
		props: {
			manageUrl: {
				type: String,
				default: ''
			},
			permissions: {
				type: Object,
				default: () => ({
					canView: false,
					canCreate: false
				})
			}
		},
		emits: ['queryChange', 'add'],
		data() {
			return {
				query: ''
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			InputSize: () => ui_system_input_vue.InputSize,
			InputDesign: () => ui_system_input_vue.InputDesign,
			hasQuery() {
				return this.query !== '';
			}
		},
		watch: {
			query(value) {
				this.$emit('queryChange', value);
			}
		},
		methods: {
			clearQuery() {
				this.query = '';
			},
			openManagePage() {
				window.open(this.manageUrl, '_blank', 'noopener');
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-imol-quick-reply-popup__search-row">
			<div class="bx-imol-quick-reply-popup__search">
				<BInput
					v-model="query"
					:design="InputDesign.LightGrey"
					:size="InputSize.Md"
					:placeholder="loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_POPUP_SEARCH_PLACEHOLDER')"
					:withClear="hasQuery"
					@clear="clearQuery"
				/>
			</div>
			<div class="bx-imol-quick-reply-popup__search-actions">
				<div
					v-if="permissions.canCreate"
					class="bx-imol-quick-reply-popup__action-button"
					@click="$emit('add')"
				>
					<BIcon :name="OutlineIcons.PLUS_M" />
				</div>
				<BIcon
					v-if="manageUrl"
					:name="OutlineIcons.SETTINGS"
					class="--hoverable"
					@click="openManagePage"
				/>
			</div>
		</div>
	`
	};

	const SCROLL_LOAD_OFFSET = 100;

	// @vue/component
	const QuickReplyList = {
		name: 'QuickReplyList',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			ScrollWithGradient: im_v2_component_elements_scrollWithGradient.ScrollWithGradient,
			Spinner: im_v2_component_elements_loader.Spinner
		},
		props: {
			replies: {
				type: Array,
				default: () => []
			},
			highlightedId: {
				type: Number,
				default: 0
			},
			isLoadingNextPage: {
				type: Boolean,
				default: false
			},
			hasNextPage: {
				type: Boolean,
				default: false
			}
		},
		emits: ['select', 'edit', 'loadNextPage'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
			SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor,
			isEmpty() {
				return this.replies.length === 0;
			}
		},
		methods: {
			onScroll(event) {
				if (!this.hasNextPage || this.isLoadingNextPage) {
					return;
				}
				const el = event.target;
				const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
				if (remaining <= SCROLL_LOAD_OFFSET) {
					this.$emit('loadNextPage');
				}
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ScrollWithGradient class="bx-imol-quick-reply-popup__list" @scroll="onScroll">
			<div v-if="isEmpty" class="bx-imol-quick-reply-popup__empty">
				{{ loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_POPUP_EMPTY') }}
			</div>
			<template v-else>
				<div
					v-for="reply in replies"
					:key="reply.id"
					:class="{ '--highlighted': reply.id === highlightedId }"
					class="bx-imol-quick-reply-popup__item"
					@click="$emit('select', reply)"
				>
					<span class="bx-imol-quick-reply-popup__item-text --ellipsis">{{ reply.text }}</span>
					<BIcon
						v-if="reply.canEdit"
						:name="OutlineIcons.EDIT_L"
						class="bx-imol-quick-reply-popup__item-edit"
						@click.stop="$emit('edit', reply)"
					/>
				</div>
			</template>
			<Spinner
				v-if="isLoadingNextPage"
				:size="SpinnerSize.XS"
				:color="SpinnerColor.grey"
				class="bx-imol-quick-reply-popup__list-loader"
			/>
		</ScrollWithGradient>
	`
	};

	const TEXTAREA_ROWS_COUNT = 4;
	const MAX_TEXT_LENGTH = 10000;
	const SECTION_MENU_ID = 'imol-quick-reply-section-menu';

	// @vue/component
	const QuickReplyCreateForm = {
		name: 'QuickReplyCreateForm',
		components: {
			Chip: ui_system_chip_vue.Chip,
			UiButton: ui_vue3_components_button.Button
		},
		inject: ['disableAutoHide', 'enableAutoHide'],
		props: {
			sections: {
				type: Array,
				default: () => []
			},
			editReply: {
				type: Object,
				default: null
			},
			defaultSectionId: {
				type: Number,
				default: imopenlines_v2_lib_quickReply.ALL_SECTIONS_ID
			},
			isSaving: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close', 'save'],
		data() {
			return {
				text: this.editReply?.text ?? '',
				selectedSectionId: this.editReply?.sectionId ?? this.defaultSectionId
			};
		},
		computed: {
			ChipDesign: () => ui_system_chip_vue.ChipDesign,
			ChipSize: () => ui_system_chip_vue.ChipSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			TEXTAREA_ROWS_COUNT: () => TEXTAREA_ROWS_COUNT,
			MAX_TEXT_LENGTH: () => MAX_TEXT_LENGTH,
			isEditMode() {
				return this.editReply !== null;
			},
			selectedSectionName() {
				const selectedSection = this.sections.find(section => section.id === this.selectedSectionId);
				return selectedSection?.name ?? '';
			},
			sectionLabel() {
				return this.isEditMode ? this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_EDIT_SECTION_LABEL') : this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_CREATE_SECTION_LABEL');
			},
			saveButtonText() {
				return this.isEditMode ? this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_EDIT_SAVE') : this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_CREATE_SAVE');
			},
			canSave() {
				return !this.isSaving && this.text.trim().length > 0;
			}
		},
		mounted() {
			const replyInput = this.$refs.replyInput;
			replyInput.focus();
			if (this.isEditMode) {
				const cursorEndPosition = replyInput.value.length;
				replyInput.setSelectionRange(cursorEndPosition, cursorEndPosition);
			}
		},
		beforeUnmount() {
			this.sectionMenu?.destroy();
		},
		methods: {
			openSectionMenu() {
				this.disableAutoHide();
				this.sectionMenu = main_popup.MenuManager.create({
					id: SECTION_MENU_ID,
					bindElement: this.$refs.sectionSelector.$el,
					bindOptions: {
						position: 'bottom'
					},
					offsetTop: 4,
					items: this.sections.map(section => ({
						text: section.name,
						onclick: () => {
							this.selectedSectionId = section.id;
							this.sectionMenu.close();
						}
					})),
					events: {
						onClose: () => {
							this.sectionMenu.destroy();
							this.sectionMenu = null;
							this.enableAutoHide();
						}
					}
				});
				this.sectionMenu.show();
			},
			onSave() {
				if (!this.canSave) {
					return;
				}
				this.$emit('save', {
					id: this.editReply?.id ?? 0,
					text: this.text.trim(),
					sectionId: this.selectedSectionId
				});
			},
			onClose() {
				this.$emit('close');
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-imol-quick-reply-create">
			<div class="bx-imol-quick-reply-create__section-row">
				<span class="bx-imol-quick-reply-create__section-label">
					{{ sectionLabel }}
				</span>
				<Chip
					ref="sectionSelector"
					:text="selectedSectionName"
					:size="ChipSize.Sm"
					:design="ChipDesign.Outline"
					:dropdown="true"
					@click="openSectionMenu"
				/>
			</div>
			<div class="bx-imol-quick-reply-create__divider"></div>
			<div class="bx-imol-quick-reply-create__input">
				<textarea
					ref="replyInput"
					v-model="text"
					:placeholder="loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_CREATE_PLACEHOLDER')"
					:rows="TEXTAREA_ROWS_COUNT"
					:maxlength="MAX_TEXT_LENGTH"
					class="bx-imol-quick-reply-create__textarea"
				/>
			</div>
			<div class="bx-imol-quick-reply-create__actions">
				<UiButton
					:text="loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_FORM_CLOSE')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.MEDIUM"
					@click="onClose"
				/>
				<UiButton
					:text="saveButtonText"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.MEDIUM"
					:disabled="!canSave"
					:loading="isSaving"
					@click="onSave"
				/>
			</div>
		</div>
	`
	};

	const SUCCESS_DISPLAY_TIME = 3000;

	// @vue/component
	const QuickReplySuccess = {
		name: 'QuickReplySuccess',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			isSaving: {
				type: Boolean,
				default: false
			},
			isEdit: {
				type: Boolean,
				default: false
			}
		},
		emits: ['hide'],
		data() {
			return {
				message: ''
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		watch: {
			isSaving(newVal, oldVal) {
				const savingFinished = oldVal && !newVal;
				if (!savingFinished) {
					return;
				}
				this.message = this.isEdit ? this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_SUCCESS_UPDATED') : this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_SUCCESS_ADDED');
				this.hideDelay.start(() => {
					this.message = '';
					this.$emit('hide');
				});
			}
		},
		created() {
			this.hideDelay = imopenlines_v2_lib_utils.useDelay(SUCCESS_DISPLAY_TIME);
		},
		beforeUnmount() {
			this.hideDelay.stop();
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div v-if="message" class="bx-imol-quick-reply-popup__success">
			<BIcon :name="OutlineIcons.CHECK_M" />
			<span>{{ message }}</span>
		</div>
	`
	};

	// @vue/component
	const QuickReplyFilters = {
		name: 'QuickReplyFilters',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		directives: {
			horizontalScroll: im_v2_lib_directives.horizontalScroll
		},
		props: {
			sections: {
				type: Array,
				default: () => []
			},
			activeSectionId: {
				type: Number,
				default: imopenlines_v2_lib_quickReply.ALL_SECTIONS_ID
			}
		},
		emits: ['select'],
		computed: {
			ChipSize: () => ui_system_chip_vue.ChipSize
		},
		methods: {
			getChipDesign(sectionId) {
				return sectionId === this.activeSectionId ? ui_system_chip_vue.ChipDesign.OutlineAccent : ui_system_chip_vue.ChipDesign.Outline;
			}
		},
		template: `
		<div v-horizontal-scroll class="bx-imol-quick-reply-popup__filters">
			<Chip
				v-for="section in sections"
				:key="section.id"
				:size="ChipSize.Sm"
				:design="getChipDesign(section.id)"
				:text="section.name"
				:rounded="true"
				@click="$emit('select', section.id)"
			/>
		</div>
	`
	};

	const POPUP_ID$1 = 'imol-quick-reply-popup';
	const POPUP_CLASSNAME$1 = 'bx-imol-quick-reply-popup__container';

	// @vue/component
	const QuickReplyPopup = {
		name: 'QuickReplyPopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			BIcon: ui_iconSet_api_vue.BIcon,
			QuickReplySearch,
			QuickReplyList,
			QuickReplyCreateForm,
			QuickReplySuccess,
			QuickReplyFilters
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			filteredReplies: {
				type: Array,
				default: () => []
			},
			sections: {
				type: Array,
				default: () => []
			},
			activeSectionId: {
				type: Number,
				default: imopenlines_v2_lib_quickReply.ALL_SECTIONS_ID
			},
			isSaving: {
				type: Boolean,
				default: false
			},
			isLoadingNextPage: {
				type: Boolean,
				default: false
			},
			hasNextPage: {
				type: Boolean,
				default: false
			},
			highlightedReplyId: {
				type: Number,
				default: 0
			},
			savedAsEdit: {
				type: Boolean,
				default: false
			},
			isFormOpen: {
				type: Boolean,
				default: false
			},
			editingReply: {
				type: Object,
				default: null
			},
			manageUrl: {
				type: String,
				default: ''
			},
			permissions: {
				type: Object,
				default: () => ({
					canCreate: false
				})
			}
		},
		emits: ['close', 'select', 'queryChange', 'loadNextPage', 'filter', 'save', 'successHide', 'replyAdd', 'replyEdit', 'formClose'],
		computed: {
			POPUP_ID: () => POPUP_ID$1,
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			popupConfig() {
				return {
					bindElement: this.bindElement,
					className: POPUP_CLASSNAME$1,
					width: 450,
					height: 350,
					overlay: false,
					closeIcon: false,
					autoHide: true,
					borderRadius: '20px',
					bindOptions: {
						position: 'top'
					},
					angle: {
						offset: 35,
						position: 'bottom'
					},
					animation: 'fading'
				};
			}
		},
		methods: {
			saveForm(data) {
				this.$emit('save', data);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<MessengerPopup
			:config="popupConfig"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-imol-quick-reply-popup__header">
				<span>{{ loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_POPUP_TITLE') }}</span>
				<div class="bx-imol-quick-reply-popup__close" @click="$emit('close')">
					<BIcon :name="OutlineIcons.CROSS_L" />
				</div>
			</div>
			<template v-if="isFormOpen">
				<QuickReplyCreateForm
					:sections="sections"
					:editReply="editingReply"
					:defaultSectionId="activeSectionId"
					:isSaving="isSaving"
					@close="$emit('formClose')"
					@save="saveForm"
				/>
			</template>
			<template v-else>
				<QuickReplySuccess :isSaving="isSaving" :isEdit="savedAsEdit" @hide="$emit('successHide')" />
				<QuickReplyFilters
					:sections="sections"
					:activeSectionId="activeSectionId"
					@select="$emit('filter', $event)"
				/>
				<QuickReplySearch
					:manageUrl="manageUrl"
					:permissions="permissions"
					@queryChange="$emit('queryChange', $event)"
					@add="$emit('replyAdd')"
				/>
				<QuickReplyList
					:replies="filteredReplies"
					:highlightedId="highlightedReplyId"
					:isLoadingNextPage="isLoadingNextPage"
					:hasNextPage="hasNextPage"
					@select="$emit('select', $event)"
					@edit="$emit('replyEdit', $event)"
					@loadNextPage="$emit('loadNextPage')"
				/>
			</template>
		</MessengerPopup>
	`
	};

	const SEARCH_DEBOUNCE_MS = 400;

	// @vue/component
	const QuickReply = {
		name: 'QuickReply',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			QuickReplyPopup,
			Spinner: im_v2_component_elements_loader.Spinner
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['selectReply'],
		data() {
			return {
				selectorElement: null,
				isPopupOpen: false,
				isInitialLoading: false,
				highlightedReplyId: 0,
				savedAsEdit: false,
				isFormOpen: false,
				editingReply: null,
				filter: {
					searchQuery: '',
					activeSectionId: imopenlines_v2_lib_quickReply.ALL_SECTIONS_ID
				},
				status: {
					isSaving: false,
					isLoadingNextPage: false
				}
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
			SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor,
			replies() {
				return this.$store.getters['openLines/quickReply/getList']();
			},
			filteredReplies() {
				const hasSectionFilter = this.filter.activeSectionId !== imopenlines_v2_lib_quickReply.ALL_SECTIONS_ID;
				const query = this.filter.searchQuery.toLowerCase();
				const hasFilledQuery = query !== '';
				return this.replies.filter(reply => {
					const isOutOfSection = reply.sectionId !== this.filter.activeSectionId;
					if (hasSectionFilter && isOutOfSection) {
						return false;
					}
					if (hasFilledQuery) {
						return reply.text.toLowerCase().includes(query);
					}
					return true;
				});
			},
			sections() {
				const rawSections = this.$store.getters['openLines/quickReply/getSections']();
				const allSection = {
					id: imopenlines_v2_lib_quickReply.ALL_SECTIONS_ID,
					name: this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_SECTION_ALL'),
					code: ''
				};
				return [allSection, ...rawSections];
			},
			isPopupOpenAndLoaded() {
				return this.isPopupOpen && !this.isInitialLoading;
			},
			hasNextPage() {
				return this.$store.getters['openLines/quickReply/hasNextPage']();
			},
			manageUrl() {
				return this.$store.getters['openLines/quickReply/getManageUrl']();
			},
			permissions() {
				return this.$store.getters['openLines/quickReply/getPermissions']();
			}
		},
		created() {
			this.quickReplyManager = imopenlines_v2_lib_quickReply.QuickReplyManager.getInstance();
			this.runServerSearch = main_core.Runtime.debounce(this.serverSearch, SEARCH_DEBOUNCE_MS, this);
		},
		mounted() {
			this.selectorElement = this.$refs.quickReplyButton;
		},
		methods: {
			togglePopup() {
				this.isPopupOpen = !this.isPopupOpen;
				if (this.isPopupOpen && this.quickReplyManager.hasStaleCache(this.dialogId)) {
					void this.loadInitial();
				}
			},
			onPopupClose() {
				this.isPopupOpen = false;
				this.isFormOpen = false;
				this.editingReply = null;
			},
			async loadInitial() {
				await imopenlines_v2_lib_utils.runActionWithLoading(this, 'isInitialLoading', () => {
					return this.quickReplyManager.loadList(this.dialogId, {
						search: '',
						sectionId: imopenlines_v2_lib_quickReply.ALL_SECTIONS_ID
					});
				});
			},
			async onLoadNextPage() {
				if (this.status.isLoadingNextPage) {
					return;
				}
				await imopenlines_v2_lib_utils.runActionWithLoading(this.status, 'isLoadingNextPage', () => {
					return this.quickReplyManager.loadNextPage(this.dialogId);
				});
			},
			onQueryChange(query) {
				this.filter.searchQuery = query;
				this.runServerSearch(query);
			},
			async serverSearch(query) {
				await this.quickReplyManager.search(this.dialogId, query);
			},
			async onSave(data) {
				const isEdit = data.id > 0;
				await imopenlines_v2_lib_utils.runActionWithLoading(this.status, 'isSaving', async () => {
					const savedReply = await this.quickReplyManager.save(this.dialogId, data);
					if (savedReply) {
						this.highlightedReplyId = savedReply.id;
						this.savedAsEdit = isEdit;
						this.isFormOpen = false;
						this.editingReply = null;
					}
					return savedReply;
				});
			},
			onReplyAdd() {
				this.editingReply = null;
				this.isFormOpen = true;
			},
			onReplyEdit(reply) {
				this.editingReply = reply;
				this.isFormOpen = true;
			},
			onFormClose() {
				this.isFormOpen = false;
				this.editingReply = null;
			},
			async onFilterBySection(sectionId) {
				this.filter.activeSectionId = sectionId;
				await this.quickReplyManager.loadList(this.dialogId, {
					sectionId
				});
			},
			onReplySelect(reply) {
				this.quickReplyManager.selectReply(this.dialogId, reply);
				this.$emit('selectReply', reply.text);
				this.isPopupOpen = false;
			},
			onSuccessHide() {
				this.highlightedReplyId = 0;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<span ref="quickReplyButton">
			<Spinner
				v-if="isInitialLoading"
				:size="SpinnerSize.XS"
				:color="SpinnerColor.blue"
			/>
			<BIcon
				v-else
				:name="OutlineIcons.STRESS"
				:class="{ '--active': isPopupOpen }"
				:title="loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY')"
				class="bx-imol-textarea-icon"
				@click="togglePopup"
			/>
		</span>
		<QuickReplyPopup
			v-if="isPopupOpenAndLoaded"
			:bindElement="selectorElement"
			:filteredReplies="filteredReplies"
			:sections="sections"
			:activeSectionId="filter.activeSectionId"
			:isSaving="status.isSaving"
			:isLoadingNextPage="status.isLoadingNextPage"
			:hasNextPage="hasNextPage"
			:highlightedReplyId="highlightedReplyId"
			:savedAsEdit="savedAsEdit"
			:isFormOpen="isFormOpen"
			:editingReply="editingReply"
			:manageUrl="manageUrl"
			:permissions="permissions"
			@select="onReplySelect"
			@queryChange="onQueryChange"
			@loadNextPage="onLoadNextPage"
			@filter="onFilterBySection"
			@save="onSave"
			@successHide="onSuccessHide"
			@close="onPopupClose"
			@replyAdd="onReplyAdd"
			@replyEdit="onReplyEdit"
			@formClose="onFormClose"
		/>
	`
	};

	const settings = main_core.Extension.getSettings('imopenlines.v2.component.content.openlines');
	const SALES_HUB_URL = settings.get('salesHubUrl');
	const SALES_CENTER_PARAMS = settings.get('salesCenterParams');

	// @vue/component
	const SalesCenter = {
		name: 'SalesCenter',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			sessionId() {
				const currentSession = this.$store.getters['openLines/currentSession/getByDialogId'](this.dialogId);
				return currentSession?.sessionId?.toString() ?? '';
			},
			dealId() {
				const crmData = this.$store.getters['openLines/crm/getByDialogId'](this.dialogId);
				return crmData?.dealId?.toString() ?? '';
			}
		},
		methods: {
			buildSalesCenterUrl(dialogId, sessionId, dealId) {
				const params = new URLSearchParams();
				params.set('dialogId', dialogId);
				params.set('sessionId', sessionId.toString());
				params.set('ownerId', dealId.toString());
				for (const [key, value] of Object.entries(SALES_CENTER_PARAMS)) {
					params.set(key, value);
				}
				return `${SALES_HUB_URL}?${params.toString()}`;
			},
			openSalesCenter() {
				const url = this.buildSalesCenterUrl(this.dialogId, this.sessionId, this.dealId);
				BX.SidePanel.Instance.open(url, {
					allowChangeHistory: false,
					width: 1140
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<button
			class="bx-imol-textarea-sales-center"
			:title="loc('IMOL_CONTENT_TEXTAREA_SALES_CENTER_DESCRIPTION')"
			@click="openSalesCenter"
		>
			<BIcon :name="OutlineIcons.MONEY" />
			<span class="bx-imol-textarea-sales-center__text">
				{{ loc('IMOL_CONTENT_TEXTAREA_SALES_CENTER_TITLE') }}
			</span>
		</button>
	`
	};

	const POPUP_ID = 'imol-silent-mode-popup';
	const POPUP_CLASSNAME = 'bx-imol-silent-mode-popup__container';

	// @vue/component
	const SilentModePopup = {
		name: 'SilentModePopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			POPUP_ID: () => POPUP_ID,
			popupConfig() {
				return {
					bindElement: this.bindElement,
					className: POPUP_CLASSNAME,
					offsetTop: -5,
					width: 340,
					overlay: false,
					autoHide: true,
					bindOptions: {
						position: 'top'
					},
					angle: {
						offset: 35,
						position: 'bottom'
					},
					animation: 'fading'
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
			:config="popupConfig"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-imol-silent-mode-popup__title">
				{{ loc('IMOL_CONTENT_TEXTAREA_HIDDEN_MODE_POPUP_TITLE') }}
			</div>
			<div class="bx-imol-silent-mode-popup__description">
				{{ loc('IMOL_CONTENT_TEXTAREA_HIDDEN_MODE_POPUP_DESCRIPTION') }}
			</div>
		</MessengerPopup>
	`
	};

	const POPUP_SHOW_DELAY = 600;

	// @vue/component
	const SilentMode = {
		name: 'SilentMode',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			SilentModePopup,
			Spinner: im_v2_component_elements_loader.Spinner
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isActive: {
				type: Boolean,
				required: true
			},
			isLoading: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggle'],
		data() {
			return {
				selectorElement: null,
				showPopup: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
			SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor
		},
		created() {
			this.delayedPopup = imopenlines_v2_lib_utils.useDelay(POPUP_SHOW_DELAY);
			this.onBeforeAddMessageToModel = this.onBeforeAddMessageToModel.bind(this);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.sending.onBeforeAddMessageToModel, this.onBeforeAddMessageToModel);
		},
		mounted() {
			this.selectorElement = this.$refs.silentModeButton;
		},
		beforeUnmount() {
			this.delayedPopup.stop();
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.sending.onBeforeAddMessageToModel, this.onBeforeAddMessageToModel);
		},
		methods: {
			onToggle() {
				if (this.isLoading) {
					return;
				}
				this.$emit('toggle');
			},
			onPopupOpen() {
				const shouldShowPopup = this.isActive && !this.isLoading;
				if (shouldShowPopup) {
					this.delayedPopup.start(() => {
						this.showPopup = true;
					});
				}
			},
			onPopupClose() {
				this.delayedPopup.stop();
				this.showPopup = false;
			},
			onBeforeAddMessageToModel(event) {
				const {
					dialogId
				} = event.getData();
				if (dialogId !== this.dialogId) {
					return null;
				}
				if (!this.isActive) {
					return null;
				}
				return {
					componentId: imopenlines_v2_const.OpenLinesMessageComponent.HiddenMessage
				};
			}
		},
		template: `
		<span
			ref="silentModeButton"
			@mouseenter="onPopupOpen"
			@mouseleave="onPopupClose"
		>
			<Spinner
				v-if="isLoading"
				:size="SpinnerSize.XS"
				:color="SpinnerColor.blue"
			/>
			<BIcon
				v-else
				:name="OutlineIcons.CROSSED_EYE"
				class="bx-imol-textarea-icon"
				:class="{ '--active': isActive }"
				@click="onToggle"
			/>
		</span>
		<SilentModePopup
			v-if="showPopup"
			:bindElement="selectorElement"
			@close="onPopupClose"
		/>
	`
	};

	// @vue/component
	const ToolbarButtons = {
		name: 'ToolbarButtons',
		components: {
			SilentMode,
			SalesCenter,
			CrmForm,
			QuickReply
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				crmForms: [],
				isCrmFormsLoading: false,
				isSilentModeLoading: false
			};
		},
		computed: {
			isSilentModeActive() {
				return this.toolbarButtonsManager.getSilentModeStatus(this.dialogId);
			},
			chatId() {
				return this.$store.getters['chats/get'](this.dialogId, true).chatId;
			}
		},
		created() {
			this.toolbarButtonsManager = new imopenlines_v2_lib_toolbarButtons.ToolbarButtonsManager(this.$store, this.dialogId);
		},
		beforeUnmount() {
			this.toolbarButtonsManager.destroy();
		},
		methods: {
			async onSilentModeToggle() {
				await imopenlines_v2_lib_utils.runActionWithLoading(this, 'isSilentModeLoading', () => {
					return this.toolbarButtonsManager.toggleSilentMode(this.dialogId);
				});
			},
			async onCrmFormOpen() {
				this.crmForms = await imopenlines_v2_lib_utils.runActionWithLoading(this, 'isCrmFormsLoading', () => {
					return this.toolbarButtonsManager.loadCrmForms();
				});
			},
			async onCrmFormSelect(form) {
				await imopenlines_v2_lib_utils.runActionWithLoading(this, 'isCrmFormsLoading', () => {
					return this.toolbarButtonsManager.sendCrmForm(this.dialogId, form);
				});
			},
			onQuickReplySelect(text) {
				im_public.Messenger.textarea.insertText(this.chatId, text);
			}
		},
		template: `
		<div class="bx-imol-textarea-buttons">
			<SilentMode
				:isActive="isSilentModeActive"
				:isLoading="isSilentModeLoading"
				:dialogId="dialogId"
				@toggle="onSilentModeToggle"
			/>
			<CrmForm
				:forms="crmForms"
				:isLoading="isCrmFormsLoading"
				@open="onCrmFormOpen"
				@selectForm="onCrmFormSelect"
			/>
			<QuickReply
				:dialogId="dialogId"
				@selectReply="onQuickReplySelect"
			/>
			<SalesCenter :dialogId="dialogId" />
		</div>
	`
	};

	// @vue/component
	const OpenLinesTextarea = {
		name: 'OpenLinesTextarea',
		components: {
			ChatTextarea: im_v2_component_textarea.ChatTextarea,
			ToolbarButtons
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		template: `
		<ChatTextarea :dialogId="dialogId" :key="dialogId">
			<template #bottom-panel-buttons>
				<ToolbarButtons :dialogId="dialogId" />
			</template>
		</ChatTextarea>
	`
	};

	const MenuSectionCode = {
		};
	class OpenLinesMessageMenu extends im_v2_lib_menu.MessageMenu {
		getMenuItems() {
			const firstGroupItems = [this.getReplyItem(), this.getCopyItem(), this.getMarkItem(), this.getForwardItem(), this.getFavoriteItem(), this.getDownloadFileItem(), this.getPinItem(), this.getEditItem(), this.getSaveAsQuickReplyItem(), this.getMultiDialogItem()];
			const secondGroupItems = [this.getDeleteItem(), this.getSelectItem()];
			return [...this.groupItems(firstGroupItems, MenuSectionCode.first), ...this.groupItems(secondGroupItems, MenuSectionCode.second)];
		}
		getMenuGroups() {
			return [{
				code: MenuSectionCode.first
			}, {
				code: MenuSectionCode.second
			}];
		}
		getSaveAsQuickReplyItem() {
			if (this.isDeletedMessage() || this.context.text.trim().length === 0) {
				return null;
			}
			return {
				icon: ui_iconSet_api_core.Outline.STRESS,
				title: main_core.Loc.getMessage('IMOL_DIALOG_CHAT_MENU_SAVE_QUICK_REPLY'),
				onClick: () => {
					const quickReplyService = new imopenlines_v2_provider_service.QuickReplyService();
					quickReplyService.saveFromMessage({
						dialogId: this.context.dialogId,
						messageId: this.context.id
					}).then(reply => {
						if (!reply) {
							return;
						}
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('IMOL_DIALOG_CHAT_MENU_SAVE_QUICK_REPLY_SUCCESS')
						});
					});
				}
			};
		}
		getMultiDialogItem() {
			const dialogId = this.context.dialogId;
			if (!this.#canShowMultiDialogMenu(dialogId)) {
				return null;
			}
			return {
				icon: ui_iconSet_api_core.Outline.MESSAGES_MULTI,
				title: main_core.Loc.getMessage('IMOL_DIALOG_CHAT_MENU_MULTI_DIALOG'),
				onClick: () => {
					const messageService = new imopenlines_v2_provider_service.MessageService();
					void messageService.addSession(this.context.dialogId, this.context.id);
				}
			};
		}
		#isMultiDialog(dialogId) {
			const currentSession = im_v2_application_core.Core.getStore().getters['openLines/currentSession/getByDialogId'](dialogId);
			return Boolean(currentSession?.multidialog);
		}
		#isNetworkConnector(dialogId) {
			const currentConnector = im_v2_application_core.Core.getStore().getters['openLines/connector/getByDialogId'](dialogId);
			return currentConnector?.connectorId === imopenlines_v2_const.Connector.network;
		}
		#isSupport24(dialogId) {
			return im_v2_application_core.Core.getStore().getters['users/bots/isSupport'](dialogId);
		}
		#canShowMultiDialogMenu(dialogId) {
			return !this.isDeletedMessage() && this.#isMultiDialog(dialogId) && this.#isNetworkConnector(dialogId) && this.#isSupport24(dialogId);
		}
	}

	// @vue/component
	const OpenLinesContent$1 = {
		name: 'OpenLinesContent',
		components: {
			BaseChatContent: im_v2_component_content_elements.BaseChatContent,
			JoinPanelContainer,
			OpenLinesHeader,
			ChatDialog: im_v2_component_dialog_chat.ChatDialog,
			OpenLinesTextarea
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			queueType() {
				const session = this.getSessionByDialogId(this.dialogId);
				if (!session) {
					return null;
				}
				const queue = this.$store.getters['openLines/queue/getById'](session.queueId);
				return queue?.type ?? null;
			},
			isQueueTypeAll() {
				return this.queueType === imopenlines_v2_lib_queue.QueueType.all;
			}
		},
		created() {
			this.registerMessageMenu();
		},
		methods: {
			registerMessageMenu() {
				im_v2_lib_menu.MessageMenuManager.getInstance().registerMenuByCallback(context => {
					const chat = this.$store.getters['chats/get'](context.dialogId);
					return chat.type === im_v2_const.ChatType.lines;
				}, OpenLinesMessageMenu);
			},
			getSessionByDialogId(dialogId) {
				return this.$store.getters['openLines/recent/getSession'](dialogId, true);
			}
		},
		template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<OpenLinesHeader :dialogId="dialogId" :key="dialogId" :isQueueTypeAll="isQueueTypeAll" />
			</template>
			<template #textarea="{ onTextareaMount }">
				<OpenLinesTextarea :dialogId="dialogId" @mounted="onTextareaMount"/>
			</template>
			<template #join-panel>
				<JoinPanelContainer :dialogId="dialogId" :isQueueTypeAll="isQueueTypeAll"/>
			</template>
		</BaseChatContent>
	`
	};

	// @vue/component
	const EmptyState = {
		name: 'EmptyState',
		components: {
			BaseEmptyState: im_v2_component_content_elements.BaseEmptyState
		},
		computed: {
			IconClass: () => im_v2_component_content_elements.IconClass,
			SelectableBackgroundId: () => im_v2_lib_theme.SelectableBackgroundId,
			emptyStateListItems() {
				return [{
					title: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_TITLE_1'),
					subtitle: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_SUBTITLE_1'),
					name: im_v2_component_content_elements.EmptyStateListItemName.collaboration
				}, {
					title: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_TITLE_2'),
					subtitle: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_SUBTITLE_2'),
					name: im_v2_component_content_elements.EmptyStateListItemName.business
				}, {
					title: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_TITLE_3'),
					subtitle: this.loc('IMOL_CONTENT_START_FEATURE_LIST_BLOCK_SUBTITLE_3'),
					name: im_v2_component_content_elements.EmptyStateListItemName.result
				}];
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseEmptyState
			:text="loc('IMOL_CONTENT_START_FEATURE_LIST_TITLE')"
			:backgroundId="SelectableBackgroundId.cornflower"
			:listItems="emptyStateListItems"
			:iconClassName="IconClass.list"
		/>
	`
	};

	// @vue/component
	const OpenLinesOpener = {
		name: 'OpenLinesOpener',
		components: {
			EmptyState,
			OpenLinesContent: OpenLinesContent$1
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			}
		},
		watch: {
			dialogId(newValue, oldValue) {
				im_v2_lib_logger.Logger.warn(`OpenLinesContent: switching from ${oldValue || 'empty'} to ${newValue}`);
				void this.loadChat();
			}
		},
		created() {
			if (!this.dialogId) {
				return;
			}
			void this.loadChat();
		},
		methods: {
			async loadChat() {
				if (this.dialogId === '') {
					return;
				}
				if (this.dialog.inited) {
					im_v2_lib_logger.Logger.warn(`OpenLinesContent: openlines ${this.dialogId} is already loaded`);
					return;
				}
				if (this.dialog.loading) {
					im_v2_lib_logger.Logger.warn(`OpenLinesContent: openlines ${this.dialogId} is loading`);
					return;
				}
				im_v2_lib_logger.Logger.warn(`OpenLinesContent: loading openlines ${this.dialogId}`);
				await this.getChatService().loadChatWithMessages(this.dialogId).catch(() => {
					im_public.Messenger.openLines();
				});
				im_v2_lib_logger.Logger.warn(`OpenLinesContent: openlines ${this.dialogId} is loaded`);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new imopenlines_v2_provider_service.ChatServiceOl();
				}
				return this.chatService;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-imol-content-default-openlines__container bx-imol-messenger__scope">
			<EmptyState v-if="!dialogId" />
			<OpenLinesContent
				v-else
				:dialogId="dialogId"
			/>
		</div>
	`
	};

	// @vue/component
	const OpenLinesContent = {
		name: 'OpenLinesContent',
		components: {
			OpenLinesOpener
		},
		props: {
			entityId: {
				type: String,
				default: ''
			}
		},
		template: `
		<OpenLinesOpener :dialogId="entityId" />
	`
	};

	exports.OpenLinesContent = OpenLinesContent;

})(this.BX.OpenLines.v2.Component.Content = this.BX.OpenLines.v2.Component.Content || {}, BX.OpenLines.v2.Css, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.OpenLines.v2.Provider.Service, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Dialog, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.OpenLines.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Component.Elements, BX.OpenLines.v2.Const, BX.Vue3.Components, BX.Messenger.v2.Component.Elements, BX.UI.EntitySelector, BX.Messenger.v2.Component, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Component, BX.OpenLines.v2.Lib, BX.OpenLines.v2.Lib, BX.Messenger.v2.Component.Elements, BX.UI.System.Input.Vue, BX.Messenger.v2.Lib, BX, BX.OpenLines.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Main, BX.UI.System.Chip.Vue, BX.Messenger.v2.Lib, BX.UI.IconSet, BX.Event, BX.Messenger.v2.Lib);
//# sourceMappingURL=openlines.bundle.js.map
