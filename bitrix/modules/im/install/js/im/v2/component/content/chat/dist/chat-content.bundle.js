/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, main_core_events, im_v2_const, ui_notification, im_public, im_v2_lib_analytics, im_v2_lib_channel, im_v2_lib_feature, im_v2_lib_folder, im_v2_lib_layout, im_v2_lib_logger, im_v2_lib_promo, im_v2_lib_utils, im_v2_provider_service_chat, im_v2_component_content_elements, im_v2_component_textarea, ui_iconSet_api_core, ui_system_chip_vue, aiassistant_mcpSelector, im_v2_lib_rest, im_v2_component_dialog_chat, im_v2_provider_service_comments, ui_vue3_components_button, ui_iconSet_api_vue, ui_iconSet_outline, im_v2_lib_permission, im_v2_lib_notifier, im_v2_component_elements_pulseAnimation, im_v2_component_entitySelector, main_popup, ui_dialogs_tooltip, im_v2_component_elements_loader, im_v2_component_elements_chatTitle, im_v2_component_animation, im_v2_lib_counter, im_v2_component_elements_avatar, im_v2_lib_copilot, im_v2_component_elements_popup, ui_vue3_directives_hint, ui_system_menu, ai_rolesDialog, im_v2_lib_menu, ui_a11y, im_v2_provider_service_copilot, main_sidepanel, tasks_v2_lib_resultMessageMenu, im_v2_lib_localStorage, im_v2_lib_taskResultButton, im_v2_application_core, tasks_v2_application_taskCard, im_v2_lib_a11y, main_loader, im_v2_lib_invite, im_v2_component_elements_button, im_v2_lib_createChat, im_v2_lib_theme, im_v2_lib_collab, im_v2_lib_draft, im_v2_provider_service_sending, ui_vue3_components_switcher, im_v2_component_elements_toggle, im_v2_component_messageList, im_v2_lib_messageComponent) {
	'use strict';

	class McpHintService {
		sendSelectionHintOnce(authId) {
			im_v2_lib_logger.Logger.warn('McpHintService: sendSelectionHintOnce:', authId);
			const payload = {
				data: {
					authId
				}
			};
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2McpSendSelectionHintOnce, payload).catch(errors => {
				const [firstError] = errors;
				console.error('McpHintService: sendSelectionHintOnce error:', errors);
				throw firstError;
			});
		}
	}

	const MAX_INTEGRATION_NAME_LENGTH = 20;
	const MARTA_ANALYTICS_CONTEXT = 'marta_chat';

	// @vue/component
	const McpIntegration = {
		name: 'McpIntegration',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		data() {
			return {
				isSelectorOpened: false,
				mcpAuth: null
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			ChipDesign: () => ui_system_chip_vue.ChipDesign,
			ChipSize: () => ui_system_chip_vue.ChipSize,
			hasSelectedMcpAuth() {
				return !main_core.Type.isNil(this.mcpAuth?.id);
			},
			chipDesign() {
				if (this.hasSelectedMcpAuth) {
					return ui_system_chip_vue.ChipDesign.OutlineAccent2;
				}
				return ui_system_chip_vue.ChipDesign.Outline;
			},
			isAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.aiAssistantMcpSelectorAvailable);
			},
			defaultIcon() {
				if (this.mcpIcon) {
					return null;
				}
				return ui_iconSet_api_core.Outline.APPS;
			},
			mcpIcon() {
				if (!this.mcpAuth?.icon) {
					return null;
				}
				return {
					src: this.mcpAuth.icon,
					alt: ''
				};
			},
			chipName() {
				if (!this.mcpAuth?.name) {
					return this.loc('IM_CONTENT_AI_ASSISTANT_MCP_INTEGRATIONS');
				}
				const needEllipsis = this.mcpAuth.name.length > MAX_INTEGRATION_NAME_LENGTH;
				if (needEllipsis) {
					return `${this.mcpAuth.name.slice(0, MAX_INTEGRATION_NAME_LENGTH)}...`;
				}
				return this.mcpAuth.name;
			}
		},
		beforeUnmount() {
			this.clear();
			this.selector?.destroy();
		},
		methods: {
			toggle() {
				im_v2_lib_analytics.Analytics.getInstance().aiAssistant.onMcpIntegrationClick();
				if (this.isSelectorOpened) {
					this.getSelector().hide();
					return;
				}
				this.getSelector().show();
			},
			getSelector() {
				if (this.selector) {
					return this.selector;
				}
				this.selector = new aiassistant_mcpSelector.McpSelector({
					context: MARTA_ANALYTICS_CONTEXT,
					targetNode: this.$refs.selector,
					dialogOptions: {
						popupOptions: {
							className: 'mcp-selector-dialog' // widget z-index fix
						}
					},
					entityOptions: {
						agentMode: false
					},
					events: {
						onSelect: event => {
							const {
								auth,
								mcp
							} = event.getData();
							if (!auth) {
								this.clear();
								return;
							}
							this.setMcpAuth({
								id: auth.id,
								name: auth.name,
								icon: mcp.iconUrl
							});
						},
						onHide: () => {
							this.isSelectorOpened = false;
						},
						onShow: () => {
							this.isSelectorOpened = true;
						}
					}
				});
				return this.selector;
			},
			setMcpAuth(mcpAuth) {
				this.mcpAuth = mcpAuth;
				this.$store.dispatch('aiAssistant/setMcpAuthId', this.mcpAuth.id);
				new McpHintService().sendSelectionHintOnce(this.mcpAuth.id);
			},
			clear() {
				this.mcpAuth = null;
				this.$store.dispatch('aiAssistant/setMcpAuthId', null);
			},
			onChipClearClick() {
				this.selector.clear();
				this.clear();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<span v-if="isAvailable" ref="selector" class="bx-im-mcp-integration__container">
			<Chip
				:text="chipName"
				:rounded="true"
				:size="ChipSize.Sm"
				:dropdown="!hasSelectedMcpAuth"
				:icon="defaultIcon"
				:image="mcpIcon"
				:design="chipDesign"
				:withClear="hasSelectedMcpAuth"
				@click="toggle"
				@clear="onChipClearClick"
			/>
		</span>
	`
	};

	const AiAssistantBotContent = {
		name: 'AiAssistantBotContent',
		components: {
			BaseChatContent: im_v2_component_content_elements.BaseChatContent,
			ChatTextarea: im_v2_component_textarea.ChatTextarea,
			McpIntegration
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			withSidebar: {
				type: Boolean,
				default: true
			},
			// pass-through only: this content serves both the messenger and the embeddable widget
			withKeyboardNavigation: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseChatContent :dialogId="dialogId" :withSidebar="withSidebar" :withDropArea="false">
			<template #header v-if="$slots['header']">
				<slot name="header"></slot>
			</template>
			<template #textarea>
				<ChatTextarea
					:dialogId="dialogId"
					:key="dialogId"
					:placeholder="loc('IM_CONTENT_AIASSISTANT_TEXTAREA_PLACEHOLDER_MSGVER_1')"
					:withMarket="false"
					:withEdit="false"
					:withUploadMenu="false"
					:withSmileSelector="false"
					:withKeyboardNavigation="withKeyboardNavigation"
				>
					<template #bottom-panel-buttons>
						<McpIntegration />
					</template>
				</ChatTextarea>
			</template>
		</BaseChatContent>
	`
	};

	// @vue/component
	const CommentsButton = {
		name: 'CommentsButton',
		components: {
			FloatButton: im_v2_component_dialog_chat.FloatButton
		},
		props: {
			counter: {
				type: Number,
				required: true
			}
		},
		computed: {
			floatButtonProps() {
				return {
					icon: im_v2_component_dialog_chat.FloatButtonIcon.comment,
					color: im_v2_component_dialog_chat.FloatButtonColor.success,
					counter: this.counter
				};
			}
		},
		template: `
		<FloatButton v-bind="floatButtonProps" />
	`
	};

	// Deliberately not LayoutManager.isChatLayout(): that set also holds the channels section, where
	// comments open as a nested list and a floating button would be a second way into the same place.
	const REGULAR_CHATS_LAYOUTS = new Set([im_v2_const.Layout.chat, im_v2_const.Layout.folderAll]);

	// @vue/component
	const ChannelDialog = {
		name: 'ChannelDialog',
		components: {
			ChatDialog: im_v2_component_dialog_chat.ChatDialog,
			CommentsButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				lastScrolledChatId: 0
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			isGuest() {
				return this.dialog.role === im_v2_const.UserRole.guest;
			},
			isInRegularChatsSection() {
				return REGULAR_CHATS_LAYOUTS.has(this.layout.name);
			},
			commentIdsWithCounter() {
				return this.$store.getters['counters/getChildrenIdsWithCounter'](this.dialog.chatId);
			},
			totalChannelCommentsCounter() {
				return this.$store.getters['counters/getChildrenTotalCounter'](this.dialog.chatId);
			},
			showCommentsButton() {
				return this.isInRegularChatsSection && this.totalChannelCommentsCounter > 0;
			}
		},
		beforeUnmount() {
			this.readAllChannelComments();
		},
		methods: {
			async onCommentsButtonClick() {
				const chatIdToJump = this.getNextChatIdToJump();
				this.lastScrolledChatId = chatIdToJump;
				const messageIdToJump = this.$store.getters['messages/comments/getMessageIdByChatId'](chatIdToJump);
				if (messageIdToJump) {
					this.$refs.dialog.goToMessageContext(messageIdToJump, {
						position: im_v2_component_dialog_chat.ScrollManager.scrollPosition.messageBottom
					});
					return;
				}
				await this.goToMessageContextByCommentsChatId(chatIdToJump);
			},
			async goToMessageContextByCommentsChatId(chatId) {
				this.$refs.dialog.showLoadingBar();
				const messageId = await this.$refs.dialog.getMessageService().loadContextByChatId(chatId);
				this.$refs.dialog.hideLoadingBar();
				if (!messageId) {
					// eslint-disable-next-line no-console
					console.error('ChannelDialog: no messageId after loading context');
				}
				await this.$nextTick();
				this.$refs.dialog.getScrollManager().scrollToMessage(messageId, {
					position: im_v2_component_dialog_chat.ScrollManager.scrollPosition.messageBottom
				});
				await this.$nextTick();
				this.$refs.dialog.highlightMessage(messageId);
			},
			getNextChatIdToJump() {
				const commentChatIds = [...this.commentIdsWithCounter];
				commentChatIds.sort((a, z) => a - z);
				if (this.lastScrolledChatId === 0) {
					return commentChatIds[0];
				}
				const filteredChatIds = commentChatIds.filter(chatId => chatId > this.lastScrolledChatId);
				if (filteredChatIds.length === 0) {
					return commentChatIds[0];
				}
				return filteredChatIds[0];
			},
			readAllChannelComments() {
				void im_v2_provider_service_comments.CommentsService.readAllChannelComments(this.dialogId);
			}
		},
		template: `
		<ChatDialog ref="dialog" :dialogId="dialogId" :clearOnExit="isGuest">
			<template #additional-float-button>
				<CommentsButton
					v-if="showCommentsButton"
					:dialogId="dialogId"
					:counter="totalChannelCommentsCounter"
					@click="onCommentsButtonClick"
				/>
			</template>
		</ChatDialog>
	`
	};

	const SubscribeStatus = Object.freeze({
		idle: 'idle',
		subscribing: 'subscribing',
		error: 'error'
	});

	// порог «пользователь ушёл от низа ленты» — как в макете GenuiBoard (kanaly/page-subscribe-blur)
	const SCROLL_BOTTOM_THRESHOLD = 8;
	// зазор между последним постом и верхом бара в состоянии покоя
	const FEED_RESERVE_GAP = 12;
	// резерв ленты в компактном состоянии (бар навсегда поджат после подписки и первого скролла)
	const COMPACT_FEED_RESERVE = 64;
	const CONTENT_WITH_BAR_CLASS = '--with-channel-subscribe-bar';
	const FEED_RESERVE_PROPERTY = '--im-channel-subscribe-bar-reserve';

	// @vue/component
	const ChannelSubscribeBar = {
		name: 'ChannelSubscribeBar',
		components: {
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				status: SubscribeStatus.idle,
				scrolled: false,
				textDismissed: false,
				morphWidth: null
			};
		},
		computed: {
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			Outline: () => ui_iconSet_api_vue.Outline,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isSubscribed() {
				return this.dialog.role !== im_v2_const.UserRole.guest;
			},
			// joinChat меняет роль оптимистично — до ответа сервера показываем лоудер, а не «подписан»
			showSubscribedState() {
				return this.isSubscribed && this.status !== SubscribeStatus.subscribing;
			},
			isSubscribing() {
				return this.status === SubscribeStatus.subscribing;
			},
			hasError() {
				return this.status === SubscribeStatus.error;
			},
			compact() {
				return this.scrolled || this.showSubscribedState && this.textDismissed;
			},
			compactReserveActive() {
				return this.showSubscribedState && this.textDismissed;
			},
			showCallText() {
				return !this.showSubscribedState && !this.hasError;
			},
			hintText() {
				if (this.areCommentsAvailable) {
					return this.loc('IM_CONTENT_CHANNEL_JOIN_PANEL_HINT');
				}
				return this.loc('IM_CONTENT_CHANNEL_JOIN_PANEL_HINT_NO_COMMENTS');
			},
			areCommentsAvailable() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.openComments, this.dialogId);
			},
			subscribedHintText() {
				if (this.isMuted) {
					return this.loc('IM_CONTENT_CHANNEL_SUBSCRIBED_HINT_MUTED');
				}
				return this.loc('IM_CONTENT_CHANNEL_SUBSCRIBED_HINT');
			},
			isMuted() {
				return this.dialog.isMuted;
			},
			subscribeButtonText() {
				if (this.hasError) {
					return this.loc('IM_CONTENT_CHANNEL_SUBSCRIBE_RETRY');
				}
				return this.loc('IM_CONTENT_BLOCKED_TEXTAREA_JOIN_CHANNEL_V2');
			},
			subscribeButtonIcon() {
				return this.hasError ? ui_iconSet_api_vue.Outline.REFRESH : null;
			},
			// в покое ширина естественная; px фиксируется только на время лоудера/ошибки,
			// чтобы лоудер держал ширину кнопки-источника, а «Повторить» анимированно сжимался
			morphStyle() {
				if (!this.morphWidth) {
					return {};
				}
				return {
					width: `${this.morphWidth}px`
				};
			}
		},
		watch: {
			isSubscribed(subscribed) {
				// откат оптимистичной роли при неудачном join тоже приходит сюда — его обрабатывает onSubscribeClick
				if (!subscribed && !this.isSubscribing) {
					this.status = SubscribeStatus.idle;
					this.textDismissed = false;
					this.morphWidth = null;
				}
			},
			showSubscribedState() {
				this.checkTextDismissal();
			},
			scrolled() {
				this.checkTextDismissal();
			},
			compactReserveActive() {
				this.updateFeedReserve();
			}
		},
		mounted() {
			void this.$nextTick(() => {
				this.attachFeedListener();
				this.initFeedReserve();
			});
		},
		beforeUnmount() {
			this.detachFeedListener();
			this.clearFeedReserve();
		},
		methods: {
			async onSubscribeClick() {
				if (this.isSubscribing || this.showSubscribedState) {
					return;
				}
				this.freezeMorphWidth();
				this.status = SubscribeStatus.subscribing;
				const isSuccess = await this.getChatService().joinChat(this.dialogId);
				this.status = isSuccess ? SubscribeStatus.idle : SubscribeStatus.error;
				if (!isSuccess) {
					this.morphToRetryWidth();
				}
			},
			// лоудер не должен менять габариты — ширина замораживается по факту отрисовки,
			// а не по предварительному замеру (шрифт мог доехать позже)
			freezeMorphWidth() {
				const currentWidth = this.$refs['morph']?.offsetWidth;
				if (currentWidth > 0) {
					this.morphWidth = currentWidth;
				}
			},
			morphToRetryWidth() {
				void this.$nextTick(() => {
					const retryWidth = this.$refs['retry-probe']?.offsetWidth;
					if (retryWidth > 0) {
						this.morphWidth = retryWidth;
					}
				});
			},
			onMuteClick() {
				if (this.isMuted) {
					this.getChatService().unmuteChat(this.dialogId);
					return;
				}
				this.getChatService().muteChat(this.dialogId);
			},
			checkTextDismissal() {
				if (this.showSubscribedState && this.scrolled) {
					this.textDismissed = true;
				}
			},
			attachFeedListener() {
				this.detachFeedListener();
				this.feedElement = this.getContentElement()?.querySelector('.bx-im-dialog-chat__scroll-container');
				if (!this.feedElement) {
					return;
				}
				this.feedElement.addEventListener('scroll', this.onFeedScroll, {
					passive: true
				});
				this.onFeedScroll();
			},
			detachFeedListener() {
				this.feedElement?.removeEventListener('scroll', this.onFeedScroll);
				this.feedElement = null;
			},
			onFeedScroll() {
				const feed = this.feedElement;
				if (!feed) {
					return;
				}
				const distanceToBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
				this.scrolled = distanceToBottom > SCROLL_BOTTOM_THRESHOLD;
			},
			initFeedReserve() {
				this.getContentElement()?.classList.add(CONTENT_WITH_BAR_CLASS);
				// высота бара оседает асинхронно (шрифты, стили кнопки) — держим резерв в синхроне
				this.resizeObserver = new ResizeObserver(() => this.updateFeedReserve());
				this.resizeObserver.observe(this.$el);
				this.updateFeedReserve();
			},
			updateFeedReserve() {
				const contentElement = this.getContentElement();
				if (!contentElement) {
					return;
				}
				const reserve = this.compactReserveActive ? COMPACT_FEED_RESERVE : this.$el.offsetHeight + FEED_RESERVE_GAP;
				contentElement.style.setProperty(FEED_RESERVE_PROPERTY, `${reserve}px`);
			},
			clearFeedReserve() {
				this.resizeObserver?.disconnect();
				this.resizeObserver = null;
				const contentElement = this.getContentElement();
				if (!contentElement) {
					return;
				}
				contentElement.classList.remove(CONTENT_WITH_BAR_CLASS);
				contentElement.style.removeProperty(FEED_RESERVE_PROPERTY);
			},
			getContentElement() {
				return this.$el?.closest?.('.bx-im-content-chat__content');
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-content-channel-subscribe-bar__container" :class="{'--compact': compact}">
			<div class="bx-im-content-channel-subscribe-bar__veil" aria-hidden="true"></div>
			<div class="bx-im-content-channel-subscribe-bar__frost" aria-hidden="true"></div>
			<div class="bx-im-content-channel-subscribe-bar__content">
				<div class="bx-im-content-channel-subscribe-bar__card" aria-hidden="true"></div>
				<div class="bx-im-content-channel-subscribe-bar__ring" aria-hidden="true"></div>
				<div class="bx-im-content-channel-subscribe-bar__stack">
					<div class="bx-im-content-channel-subscribe-bar__text-stack">
						<span
							class="bx-im-content-channel-subscribe-bar__text --call --line-clamp-2"
							:class="{'--visible': showCallText}"
						>{{ hintText }}</span>
						<span
							class="bx-im-content-channel-subscribe-bar__text --subscribed --line-clamp-2"
							:class="{'--visible': showSubscribedState}"
						>{{ subscribedHintText }}</span>
						<div class="bx-im-content-channel-subscribe-bar__error-row" :class="{'--visible': hasError}">
							<span class="bx-im-content-channel-subscribe-bar__error-icon">
								<BIcon :name="Outline.EXCLAMATION_CIRCLE" :size="18" color="var(--ui-color-base-1)" />
							</span>
							<span class="bx-im-content-channel-subscribe-bar__error-text">
								{{ loc('IM_CONTENT_CHANNEL_SUBSCRIBE_ERROR') }}
							</span>
						</div>
					</div>
					<div class="bx-im-content-channel-subscribe-bar__button-scale">
						<div class="bx-im-content-channel-subscribe-bar__button-stack">
							<div
								class="bx-im-content-channel-subscribe-bar__subscribe-layer"
								:class="{'--hidden': showSubscribedState, '--pressed': isSubscribing}"
							>
								<div
									ref="morph"
									class="bx-im-content-channel-subscribe-bar__morph"
									:style="morphStyle"
								>
									<UiButton
										:size="ButtonSize.LARGE"
										:style="AirButtonStyle.FILLED"
										:text="subscribeButtonText"
										:leftIcon="subscribeButtonIcon"
										:loading="isSubscribing"
										:wide="true"
										@click="onSubscribeClick"
									/>
								</div>
							</div>
							<div
								class="bx-im-content-channel-subscribe-bar__sound-layer"
								:class="{'--visible': showSubscribedState && !isMuted}"
							>
								<UiButton
									:size="ButtonSize.LARGE"
									:style="AirButtonStyle.FILLED_WHITE"
									:text="loc('IM_CONTENT_CHANNEL_MUTE')"
									:leftIcon="Outline.SOUND_ON"
									@click="onMuteClick"
								/>
							</div>
							<div
								class="bx-im-content-channel-subscribe-bar__sound-layer"
								:class="{'--visible': showSubscribedState && isMuted}"
							>
								<UiButton
									:size="ButtonSize.LARGE"
									:style="AirButtonStyle.FILLED_WHITE"
									:text="loc('IM_CONTENT_CHANNEL_UNMUTE')"
									:leftIcon="Outline.SOUND_OFF"
									@click="onMuteClick"
								/>
							</div>
						</div>
						<div class="bx-im-content-channel-subscribe-bar__probes" aria-hidden="true">
							<span ref="retry-probe" class="bx-im-content-channel-subscribe-bar__probe">
								<UiButton
									:size="ButtonSize.LARGE"
									:style="AirButtonStyle.FILLED"
									:text="loc('IM_CONTENT_CHANNEL_SUBSCRIBE_RETRY')"
									:leftIcon="Outline.REFRESH"
								/>
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ChannelTextarea = {
		name: 'ChannelTextarea',
		components: {
			ChatTextarea: im_v2_component_textarea.ChatTextarea
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ChatTextarea
			:dialogId="dialogId"
			:placeholder="this.loc('IM_CONTENT_CHANNEL_TEXTAREA_PLACEHOLDER')"
			:withMarket="false"
			:withKeyboardNavigation="true"
			class="bx-im-channel-send-panel__container"
		/>
	`
	};

	const ChannelContent = {
		name: 'ChannelContent',
		components: {
			BaseChatContent: im_v2_component_content_elements.BaseChatContent,
			ChannelDialog,
			ChannelTextarea,
			ChannelSubscribeBar
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		template: `
		<BaseChatContent :dialogId="dialogId">
			<template #dialog>
				<ChannelDialog :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #blocked-panel>
				<ChannelSubscribeBar :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #textarea>
				<ChannelTextarea :dialogId="dialogId" :key="dialogId" />
			</template>
		</BaseChatContent>
	`
	};

	const IconKey = Object.freeze({
		addToChat: 'add-to-chat',
		collabEntities: 'collab-entities'
	});

	class CollabTooltipContent {
		#title;
		#text;
		#iconKey;
		constructor(params) {
			this.#title = params.title;
			this.#text = params.text;
			this.#iconKey = params.iconKey;
		}
		render() {
			return main_core.Tag.render`
			<div class="bx-im-collab-tooltip__scope bx-im-collab-tooltip__container">
				<div class="bx-im-collab-tooltip__icon --${this.#iconKey}"></div>
				<div class="bx-im-collab-tooltip__title-container">
					<div class="bx-im-collab-tooltip__title">
						${this.#title}
					</div>
					<div class="bx-im-collab-tooltip__text">
						${this.#text}
					</div>
				</div>
			</div>
		`;
		}
	}

	const ICON_SIZE$1 = 24;
	const PromoMessages = {
		[im_v2_const.PromoId.membersNotInvitedOneDayToCollab]: {
			title: 'IM_CONTENT_COLLAB_ONBOARDING_INVITE_MEMBERS_ONE_DAY_TITLE',
			text: 'IM_CONTENT_COLLAB_ONBOARDING_INVITE_MEMBERS_ONE_DAY_TEXT'
		},
		[im_v2_const.PromoId.membersNotInvitedFourDayToCollab]: {
			title: 'IM_CONTENT_COLLAB_ONBOARDING_INVITE_MEMBERS_FOUR_DAYS_TITLE',
			text: 'IM_CONTENT_COLLAB_ONBOARDING_INVITE_MEMBERS_FOUR_DAYS_TEXT'
		}
	};

	// @vue/component
	const AddToChatButton$1 = {
		name: 'AddToChatButton',
		components: {
			AddToCollab: im_v2_component_entitySelector.AddToCollab,
			BIcon: ui_iconSet_api_vue.BIcon,
			HeaderAction: im_v2_component_content_elements.HeaderAction
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		emits: ['close'],
		data() {
			return {
				showAddToChatPopup: false
			};
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE$1,
			HeaderActionShape: () => im_v2_component_content_elements.HeaderActionShape,
			HeaderControlKey: () => im_v2_component_content_elements.HeaderControlKey,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			iconClasses() {
				return {
					'--active': this.showAddToChatPopup,
					'--with-guest': this.dialog.containsCollaber
				};
			}
		},
		mounted() {
			this.initPromo();
		},
		methods: {
			openAddToChatPopup() {
				im_v2_lib_analytics.Analytics.getInstance().userAdd.onChatHeaderClick(this.dialogId);
				this.showAddToChatPopup = true;
			},
			closeAddToChatPopup() {
				this.$emit('close');
				this.showAddToChatPopup = false;
			},
			initPromo() {
				const promoManager = im_v2_lib_promo.PromoManager.getInstance();
				Object.keys(PromoMessages).forEach(promoId => {
					const promoParams = {
						chatId: this.dialog.chatId
					};
					if (promoManager.needToShow(promoId, promoParams)) {
						void this.showMembersNotInvitedPromo(promoId, promoParams);
					}
				});
			},
			showMembersNotInvitedPromo(promoId, promoParams) {
				const tooltip = new ui_dialogs_tooltip.Tooltip({
					bindElement: this.getPopupBindElement(),
					content: this.renderTooltipContent(promoId),
					minWidth: 410,
					popupOptions: {
						offsetTop: 8,
						offsetLeft: 9,
						autoHide: true,
						closeIcon: true,
						closeIconSize: main_popup.CloseIconSize.LARGE
					}
				});
				tooltip.show();
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(promoId, promoParams);
			},
			renderTooltipContent(promoId) {
				const tooltipContent = new CollabTooltipContent({
					title: this.loc(PromoMessages[promoId].title),
					text: this.loc(PromoMessages[promoId].text),
					iconKey: IconKey.addToChat
				});
				return tooltipContent.render();
			},
			// The popup and the promo tooltip bind to the native control, and the ref of a component gives
			// its instance.
			getPopupBindElement() {
				return this.$refs['add-members']?.$el ?? {};
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// The surface behind the action is the selector dialog of the entity selector, not a disclosure of
		// this button, so it announces the type it opens and reports no expanded state of its own.
		// language=Vue
		template: `
		<HeaderAction
			:controlKey="HeaderControlKey.addToChat"
			aria-haspopup="dialog"
			:shape="HeaderActionShape.circle"
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_INVITE_POPUP_TITLE')"
			:class="iconClasses"
			class="bx-im-collab-header__add-people-icon"
			data-testid="im-collab-header-add-btn"
			ref="add-members"
			@click="openAddToChatPopup"
		>
			<BIcon :name="Outline.ADD_PERSON" :size="ICON_SIZE" />
		</HeaderAction>
		<AddToCollab
			v-if="showAddToChatPopup"
			:bindElement="getPopupBindElement()"
			:dialogId="dialogId"
			:popupConfig="{ offsetTop: 25, offsetLeft: -300 }"
			@close="closeAddToChatPopup"
		/>
	`
	};

	// @vue/component
	const CollabTitle = {
		name: 'CollabTitle',
		components: {
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle,
			HeaderAction: im_v2_component_content_elements.HeaderAction,
			LineLoader: im_v2_component_elements_loader.LineLoader,
			FadeAnimation: im_v2_component_animation.FadeAnimation
		},
		inject: {
			currentSidebarPanel: 'currentSidebarPanel',
			sidebarAreaId: {
				default: ''
			}
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			HeaderActionShape: () => im_v2_component_content_elements.HeaderActionShape,
			HeaderControlKey: () => im_v2_component_content_elements.HeaderControlKey,
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			collabInfo() {
				return this.$store.getters['chats/collabs/getByChatId'](this.dialog.chatId);
			},
			guestCounter() {
				return this.collabInfo.guestCount;
			},
			isMembersPanelActive() {
				return this.currentSidebarPanel === im_v2_const.SidebarDetailBlock.members;
			},
			userCounterText() {
				return main_core.Loc.getMessagePlural('IM_CONTENT_CHAT_HEADER_USER_COUNT', this.dialog.userCounter, {
					'#COUNT#': this.dialog.userCounter
				});
			},
			guestCounterText() {
				return main_core.Loc.getMessagePlural('IM_CONTENT_COLLAB_HEADER_GUEST_COUNT', this.guestCounter, {
					'#COUNT#': this.guestCounter
				});
			},
			// SC 2.5.3: the visible text of the row opens the name of the button, and the purpose of the
			// panel it opens closes it - otherwise the count reaches nobody but the sighted user.
			membersLabel() {
				return `${this.visibleCounterText}, ${this.loc('IM_CONTENT_CHAT_HEADER_MEMBERS_ARIA')}`;
			},
			visibleCounterText() {
				return this.guestCounter > 0 ? `${this.userCounterText} ${this.guestCounterText}` : this.userCounterText;
			}
		},
		methods: {
			onMembersClick() {
				if (this.isMembersPanelActive) {
					this.getEmitter().emit(im_v2_const.EventType.sidebar.close, {
						panel: im_v2_const.SidebarDetailBlock.members
					});
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.members,
					dialogId: this.dialogId
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// The counter opens the members panel, which holds the guests of the collab as well, so the whole
		// row is one control named after that panel. The guest count belongs to its text and stays part of
		// the decorative content. The row truncates itself, so the ring is drawn inside to stay whole.
		// language=Vue
		template: `
		<div class="bx-im-collab-header-title__container" :class="{'--air': isAirDesignEnabled}">
			<div class="bx-im-collab-header-title__title-container --ellipsis">
				<ChatTitle :dialogId="dialogId" :withAutoDelete="true" />
			</div>
			<LineLoader v-if="!dialog.inited" :width="50" :height="16" />
			<FadeAnimation :duration="100">
				<div v-if="dialog.inited" class="bx-im-collab-header-title__subtitle_container">
					<HeaderAction
						:controlKey="HeaderControlKey.members"
						:label="membersLabel"
						:expanded="isMembersPanelActive"
						:controls="sidebarAreaId"
						:shape="HeaderActionShape.text"
						:truncate="true"
						:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_MEMBERS')"
						class="bx-im-collab-header-title__subtitle_content"
						data-testid="im-collab-header-user-counter"
						@click="onMembersClick"
					>
						<span class="bx-im-collab-header-title__user-counter">{{ userCounterText }}</span>
						<span
							v-if="guestCounter > 0"
							class="bx-im-collab-header-title__guest-counter"
							data-testid="im-collab-header-guest-counter"
						>
							{{ guestCounterText }}
						</span>
					</HeaderAction>
				</div>
			</FadeAnimation>
		</div>
	`
	};

	// @vue/component
	const EntityCounter = {
		name: 'EntityCounter',
		props: {
			counter: {
				type: Number,
				required: true
			}
		},
		computed: {
			preparedCounter() {
				return im_v2_lib_counter.CounterManager.formatCounter(this.counter);
			}
		},
		template: `
		<span class="bx-im-collab-header__link-counter">
			{{ preparedCounter }}
		</span>
	`
	};

	const EntityType = {
		tasks: 'tasks',
		files: 'files',
		calendar: 'calendar'
	};

	// @vue/component
	const EntityLink = {
		name: 'EntityLink',
		components: {
			EntityCounter,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			compactMode: {
				type: Boolean,
				required: true
			},
			type: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			url: {
				type: String,
				required: true
			},
			counter: {
				type: [Number, null],
				default: null
			}
		},
		computed: {
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			iconName() {
				const iconByType = {
					[EntityType.tasks]: ui_iconSet_api_vue.Outline.TASKS,
					[EntityType.files]: ui_iconSet_api_vue.Outline.FILE,
					[EntityType.calendar]: ui_iconSet_api_vue.Outline.CALENDAR
				};
				return iconByType[this.type] ?? ui_iconSet_api_vue.Outline.FILE;
			},
			showCounter() {
				return !main_core.Type.isNull(this.counter) && this.counter > 0;
			}
		},
		methods: {
			onLinkClick() {
				im_v2_lib_analytics.Analytics.getInstance().collabEntities.onClick(this.dialogId, this.type);
				BX.SidePanel.Instance.open(this.url, {
					cacheable: false,
					customLeftBoundary: 0
				});
			}
		},
		template: `
		<a :href="url" @click.prevent="onLinkClick" class="bx-im-collab-header__link" :class="'--' + type">
			<BIcon
				v-if="compactMode && isAirDesignEnabled"
				:name="iconName"
				:hoverable="true"
				class="bx-im-collab-header__link-icon-air"
			/>
			<span v-else-if="compactMode" class="bx-im-collab-header__link-icon"></span>
			<span v-else class="bx-im-collab-header__link-text">{{ title }}</span>
			<EntityCounter v-if="showCounter" :counter="counter" />
		</a>
	`
	};

	// @vue/component
	const EntitiesPanel = {
		name: 'EntitiesPanel',
		components: {
			EntityLink
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			compactMode: {
				type: Boolean,
				required: true
			}
		},
		data() {
			return {
				highlightMode: false
			};
		},
		computed: {
			CollabEntityType: () => im_v2_const.CollabEntityType,
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			collabInfo() {
				return this.$store.getters['chats/collabs/getByChatId'](this.dialog.chatId);
			},
			tasksInfo() {
				return this.collabInfo.entities.tasks;
			},
			tasksUrl() {
				return this.tasksInfo.url;
			},
			tasksCounter() {
				return this.tasksInfo.counter;
			},
			filesInfo() {
				return this.collabInfo.entities.files;
			},
			filesUrl() {
				return this.filesInfo.url;
			},
			calendarInfo() {
				return this.collabInfo.entities.calendar;
			},
			calendarUrl() {
				return this.calendarInfo.url;
			},
			calendarCounter() {
				return this.calendarInfo.counter;
			}
		},
		mounted() {
			this.initPromo();
		},
		methods: {
			initPromo() {
				const promoManager = im_v2_lib_promo.PromoManager.getInstance();
				const promoId = im_v2_const.PromoId.collabEntities;
				const promoParams = {
					chatId: this.dialog.chatId
				};
				if (promoManager.needToShow(promoId, promoParams)) {
					void this.showCollabEntitiesPromo(promoId, promoParams);
				}
			},
			async showCollabEntitiesPromo(promoId, promoParams) {
				const tooltip = new ui_dialogs_tooltip.Tooltip({
					bindElement: this.$refs['collab-entities'],
					content: this.renderTooltipContent(),
					minWidth: 410,
					popupOptions: {
						offsetTop: 11,
						offsetLeft: 38,
						autoHide: true,
						closeIcon: true,
						closeIconSize: main_popup.CloseIconSize.LARGE,
						events: {
							onPopupShow: () => {
								this.highlightMode = true;
							},
							onPopupClose: () => {
								this.highlightMode = false;
							}
						}
					}
				});
				tooltip.show();
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(promoId, promoParams);
			},
			renderTooltipContent() {
				const tooltipContent = new CollabTooltipContent({
					title: this.loc('IM_CONTENT_COLLAB_ONBOARDING_ENTITIES_TITLE'),
					text: this.loc('IM_CONTENT_COLLAB_ONBOARDING_ENTITIES_TEXT'),
					iconKey: IconKey.collabEntities
				});
				return tooltipContent.render();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			class="bx-im-collab-header__links-container"
			:class="{'--compact': compactMode, '--highlight': highlightMode, '--air': isAirDesignEnabled}"
			ref="collab-entities"
		>
			<EntityLink
				:dialogId="dialogId"
				:compactMode="compactMode"
				:url="tasksUrl"
				:type="CollabEntityType.tasks"
				:title="loc('IM_CONTENT_COLLAB_HEADER_LINK_TASKS')"
				:counter="tasksCounter"
			/>
			<EntityLink
				:dialogId="dialogId"
				:compactMode="compactMode"
				:url="filesUrl"
				:type="CollabEntityType.files"
				:title="loc('IM_CONTENT_COLLAB_HEADER_LINK_FILES')"
			/>
			<EntityLink
				:dialogId="dialogId"
				:compactMode="compactMode"
				:url="calendarUrl"
				:type="CollabEntityType.calendar"
				:title="loc('IM_CONTENT_COLLAB_HEADER_LINK_CALENDAR')"
				:counter="calendarCounter"
			/>
		</div>
	`
	};

	// @vue/component
	const CollabHeader = {
		name: 'CollabHeader',
		components: {
			ChatHeader: im_v2_component_content_elements.ChatHeader,
			CollabTitle,
			EntitiesPanel,
			AddToChatButton: AddToChatButton$1,
			AddToChatPopup: im_v2_component_entitySelector.AddToChat,
			PulseAnimation: im_v2_component_elements_pulseAnimation.PulseAnimation
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				compactMode: false,
				showAddToChatPopupDelayed: false
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isInited() {
				return this.dialog.inited;
			},
			isCollabV2Available() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
			}
		},
		watch: {
			async isInited(isInited) {
				if (isInited && this.showAddToChatPopupDelayed) {
					await this.$nextTick();
					this.openAddToChatPopup();
				}
			}
		},
		created() {
			this.getEmitter().subscribe(im_v2_const.EventType.header.openAddToChatPopup, this.onOpenAddToChatPopup);
		},
		beforeUnmount() {
			this.getEmitter().unsubscribe(im_v2_const.EventType.header.openAddToChatPopup, this.onOpenAddToChatPopup);
		},
		methods: {
			onOpenAddToChatPopup() {
				if (!this.isInited) {
					this.showAddToChatPopupDelayed = true;
					return;
				}
				this.openAddToChatPopup();
			},
			openAddToChatPopup() {
				this.$refs['add-to-chat-button'].openAddToChatPopup();
			},
			onCompactModeChange(compactMode) {
				this.compactMode = compactMode;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<ChatHeader :dialogId="dialogId" @compactModeChange="onCompactModeChange" class="bx-im-collab-header__container">
			<template #title>
				<CollabTitle :dialogId="dialogId" />
			</template>
			<template #before-actions>
				<EntitiesPanel v-if="!isCollabV2Available" :dialogId="dialogId" :compactMode="compactMode" />
			</template>
			<template #add-to-chat-button>
				<PulseAnimation :showPulse="showAddToChatPopupDelayed" class="bx-im-collab-header__add-to-chat">
					<AddToChatButton 
						:dialogId="dialogId" 
						ref="add-to-chat-button" 
						@close="showAddToChatPopupDelayed = false"
					/>
				</PulseAnimation>
			</template>
		</ChatHeader>
	`
	};

	const CollabContent = {
		name: 'CollabContent',
		components: {
			BaseChatContent: im_v2_component_content_elements.BaseChatContent,
			CollabHeader
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
			},
			dialogInited() {
				return this.dialog.inited;
			}
		},
		watch: {
			dialogInited(newValue, oldValue) {
				if (!newValue || oldValue) {
					return;
				}
				this.initPromo();
			}
		},
		methods: {
			initPromo() {
				const promoManager = im_v2_lib_promo.PromoManager.getInstance();
				const promoId = im_v2_const.PromoId.collaberNotAcceptInvitationOneDay;
				const promoParams = {
					chatId: this.dialog.chatId
				};
				if (promoManager.needToShow(promoId, promoParams)) {
					this.showNotAcceptInvitationPromo(promoId, promoParams);
				}
			},
			showNotAcceptInvitationPromo(promoId, promoParams) {
				im_v2_lib_notifier.Notifier.collab.onCollaberNotAcceptInvitation();
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(promoId, promoParams);
			}
		},
		template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<CollabHeader :dialogId="dialogId" :key="dialogId" />
			</template>
		</BaseChatContent>
	`
	};

	const POPUP_ID$1 = 'im-add-to-chat-hint-popup';

	// @vue/component
	const AddToChatHint = {
		name: 'AddToChatHint',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			}
		},
		emits: ['close', 'hide'],
		computed: {
			POPUP_ID: () => POPUP_ID$1,
			config() {
				return {
					darkMode: true,
					bindElement: this.bindElement,
					angle: true,
					width: 346,
					closeIcon: true,
					offsetLeft: 8,
					className: 'bx-im-copilot-add-to-chat-hint__scope',
					contentBorderRadius: 0
				};
			},
			hintTitle() {
				return this.loc('IM_CONTENT_COPILOT_ADD_TO_CHAT_HINT_TITLE_MSGVER_1', {
					'#COPILOT_NAME#': this.copilotManager.getName()
				});
			},
			hintDescription() {
				return this.loc('IM_CONTENT_COPILOT_ADD_TO_CHAT_HINT_DESCRIPTION_MSGVER_1', {
					'#COPILOT_NAME#': this.copilotManager.getName()
				});
			}
		},
		created() {
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-im-copilot-add-to-chat-hint__title">{{ hintTitle }}</div>
			<br />
			<div class="bx-im-copilot-add-to-chat-hint__description">{{ hintDescription }}</div>
			<br />
			<button class="bx-im-copilot-add-to-chat-hint__hide" @click="$emit('hide')">
				{{ loc('IM_CONTENT_COPILOT_ADD_TO_CHAT_HINT_HIDE') }}
			</button>
		</MessengerPopup>
	`
	};

	const ICON_SIZE = 24;

	// @vue/component
	const AddToChatButton = {
		name: 'AddToChatButton',
		components: {
			AddToChat: im_v2_component_entitySelector.AddToChat,
			AddToChatHint,
			BIcon: ui_iconSet_api_vue.BIcon,
			HeaderAction: im_v2_component_content_elements.HeaderAction
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				showInviteButton: false,
				showAddToChatPopup: false,
				showAddToChatHint: false
			};
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE,
			HeaderActionShape: () => im_v2_component_content_elements.HeaderActionShape,
			HeaderControlKey: () => im_v2_component_content_elements.HeaderControlKey
		},
		mounted() {
			const needCopilotInRecentTabHint = im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.copilotInRecentTab);
			const needAddUsersToChatHint = im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.addUsersToCopilotChat);
			this.showAddToChatHint = !needCopilotInRecentTabHint && needAddUsersToChatHint;
		},
		methods: {
			openAddToChatPopup() {
				im_v2_lib_analytics.Analytics.getInstance().userAdd.onChatHeaderClick(this.dialogId);
				this.showAddToChatPopup = true;
			},
			closeAddToChatPopup() {
				this.showAddToChatPopup = false;
			},
			showHint() {
				this.showAddToChatHint = true;
			},
			closeHint() {
				this.showAddToChatHint = false;
			},
			onHintHide() {
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.addUsersToCopilotChat);
				this.closeHint();
			},
			// The popup and the hint bind to the native control, and the ref of a component gives its instance.
			getPopupBindElement() {
				return this.$refs['add-members']?.$el ?? {};
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// The surface behind the action is the selector dialog of the entity selector, not a disclosure of
		// this button, so it announces the type it opens and reports no expanded state of its own.
		// language=Vue
		template: `
		<HeaderAction
			:controlKey="HeaderControlKey.addToChat"
			aria-haspopup="dialog"
			:shape="HeaderActionShape.circle"
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_INVITE_POPUP_TITLE')"
			:class="{'--active': showAddToChatPopup}"
			class="bx-im-chat-header__icon --ds-icon"
			data-testid="im-copilot-header-add-btn"
			ref="add-members"
			@click="openAddToChatPopup"
		>
			<BIcon :name="Outline.ADD_PERSON" :size="ICON_SIZE" />
			<slot name="invite-hint" :inviteButtonRef="getPopupBindElement()"></slot>
		</HeaderAction>
		<AddToChat
			v-if="showAddToChatPopup"
			:bindElement="getPopupBindElement()"
			:dialogId="dialogId"
			:popupConfig="{ offsetTop: 15, offsetLeft: -300 }"
			@close="closeAddToChatPopup"
		/>
		<AddToChatHint
			v-if="showAddToChatHint"
			:bindElement="getPopupBindElement()"
			@close="closeHint"
			@hide="onHintHide"
		/>
	`
	};

	// @vue/component
	const CopilotChatHeader = {
		name: 'CopilotChatHeader',
		components: {
			ChatHeader: im_v2_component_content_elements.ChatHeader,
			EditableChatTitle: im_v2_component_elements_chatTitle.EditableChatTitle,
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			AddToChatButton,
			HeaderAction: im_v2_component_content_elements.HeaderAction
		},
		inject: {
			currentSidebarPanel: 'currentSidebarPanel',
			sidebarAreaId: {
				default: ''
			}
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				buttonPanelReady: false
			};
		},
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			HeaderActionShape: () => im_v2_component_content_elements.HeaderActionShape,
			HeaderControlKey: () => im_v2_component_content_elements.HeaderControlKey,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isInited() {
				return this.dialog.inited;
			},
			isGroupCopilotChat() {
				return new im_v2_lib_copilot.CopilotManager().isGroupCopilotChat(this.dialogId);
			},
			isMembersPanelActive() {
				return this.currentSidebarPanel === im_v2_const.SidebarDetailBlock.members;
			},
			subtitleText() {
				const role = this.$store.getters['copilot/chats/getRole'](this.dialogId);
				if (!role) {
					return '';
				}
				if (new im_v2_lib_copilot.CopilotManager().isCopilotUniversalRole(this.dialogId) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available)) {
					const agentName = this.$store.getters['copilot/getAgentName'];
					if (agentName) {
						return agentName;
					}
				}
				return role.name;
			},
			formattedUserCounter() {
				return main_core.Loc.getMessagePlural('IM_CONTENT_COPILOT_HEADER_USER_COUNT', this.dialog.userCounter, {
					'#COUNT#': this.dialog.userCounter
				});
			},
			// SC 2.5.3: the visible text of the counter opens the name of the button, and the purpose of the
			// panel it opens closes it - otherwise the count reaches nobody but the sighted user.
			membersLabel() {
				return `${this.formattedUserCounter}, ${this.loc('IM_CONTENT_CHAT_HEADER_MEMBERS_ARIA')}`;
			}
		},
		methods: {
			onNewTitleSubmit(newTitle) {
				void this.getChatService().renameChat(this.dialogId, newTitle);
			},
			onMembersClick() {
				if (!this.isInited) {
					return;
				}
				if (this.isMembersPanelActive) {
					this.getEmitter().emit(im_v2_const.EventType.sidebar.close, {
						panel: im_v2_const.SidebarDetailBlock.members
					});
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.members,
					dialogId: this.dialogId
				});
			},
			onButtonPanelReady() {
				this.buttonPanelReady = true;
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		// The picture and, in a one-to-one chat, the role are informational: neither carries an action, so
		// neither becomes a stop. The counter is the members panel it opens, named after that panel.
		// language=Vue
		template: `
		<ChatHeader
			:dialogId="dialogId"
			:withSearchButton="false"
			class="bx-im-copilot-header__container"
			@buttonPanelReady="onButtonPanelReady"
		>
			<template #left>
				<div class="bx-im-copilot-header__avatar">
					<ChatAvatar
						:avatarDialogId="dialogId"
						:contextDialogId="dialogId"
						:withSpecialTypes="false"
						:size="AvatarSize.L"
					/>
				</div>
				<div class="bx-im-copilot-header__info">
					<EditableChatTitle :dialogId="dialogId" @newTitleSubmit="onNewTitleSubmit" />
					<HeaderAction
						v-if="isGroupCopilotChat"
						:controlKey="HeaderControlKey.members"
						:label="membersLabel"
						:expanded="isMembersPanelActive"
						:controls="sidebarAreaId"
						:shape="HeaderActionShape.text"
						:truncate="true"
						:title="loc('IM_CONTENT_COPILOT_HEADER_OPEN_MEMBERS_TITLE')"
						class="bx-im-copilot-header__subtitle --click"
						data-testid="im-copilot-header-user-counter"
						@click="onMembersClick"
					>
						{{ formattedUserCounter }}
					</HeaderAction>
					<div v-else class="bx-im-copilot-header__subtitle">
						{{ subtitleText }}
					</div>
				</div>
			</template>
			<template v-if="buttonPanelReady" #add-to-chat-button>
				<AddToChatButton :dialogId="dialogId" />
			</template>
		</ChatHeader>
	`
	};

	// @vue/component
	const ReasoningButton = {
		name: 'ReasoningButton',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			ChipDesign: () => ui_system_chip_vue.ChipDesign,
			ChipSize: () => ui_system_chip_vue.ChipSize,
			isTempChat() {
				return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
			},
			isActive() {
				return this.$store.getters['copilot/chats/isReasoningEnabled'](this.dialogId);
			},
			modelCode() {
				return this.$store.getters['copilot/chats/getAIModel'](this.dialogId)?.code;
			},
			isReasoningAvailableInModel() {
				return this.$store.getters['copilot/isReasoningAvailableInModel'](this.modelCode);
			},
			design() {
				if (!this.isReasoningAvailableInModel || this.isTempChat) {
					return ui_system_chip_vue.ChipDesign.Disabled;
				}
				if (this.isActive) {
					return ui_system_chip_vue.ChipDesign.OutlineCopilot;
				}
				return ui_system_chip_vue.ChipDesign.Outline;
			},
			hint() {
				if (this.isTempChat || this.isReasoningAvailableInModel) {
					return null;
				}
				return {
					text: this.loc('IM_CONTENT_COPILOT_TEXTAREA_REASONING_BUTTON_HINT_NOT_AVAILABLE')
				};
			}
		},
		watch: {
			isReasoningAvailableInModel(isAvailable) {
				if (this.isTempChat) {
					return;
				}
				if (!isAvailable && this.isActive) {
					this.$store.dispatch('copilot/chats/toggleReasoning', this.dialogId);
				}
			}
		},
		methods: {
			toggle() {
				if (this.isTempChat || !this.isReasoningAvailableInModel) {
					return;
				}
				this.$store.dispatch('copilot/chats/toggleReasoning', this.dialogId);
				im_v2_lib_analytics.Analytics.getInstance().copilot.onToggleReasoning(this.dialogId);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<Chip
			v-hint="hint"
			:text="loc('IM_CONTENT_COPILOT_TEXTAREA_REASONING_BUTTON')"
			:rounded="true"
			:size="ChipSize.Sm"
			:icon="OutlineIcons.AI_STARS"
			:design="design"
			@click="toggle"
		/>
	`
	};

	class ModeMenu extends im_v2_lib_menu.BaseMenu {
		#rolesDialog = null;
		#hintPopup = null;
		#reasoningContext = null;
		constructor() {
			super();
			this.id = 'im-copilot-mode-menu';
			this.onSelectRoleHandler = event => this.#onSelectRole(event);
		}
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				bindOptions: {
					forceBindPosition: true,
					position: 'top'
				},
				offsetTop: 6,
				width: 280,
				closeTimeout: 700,
				closeOnItemClick: false
			};
		}
		getMenuItems() {
			return [this.getReasoningItem(), this.getRoleItem()];
		}
		getReasoningItem() {
			const context = this.context;
			const {
				dialogId
			} = context;
			this.#reasoningContext = context;
			const isTempChat = this.store.getters['copilot/chats/isTempChat'](dialogId);
			const isAvailableInModel = this.#isReasoningAvailable(dialogId);
			const isReasoningEnabled = this.store.getters['copilot/chats/isReasoningEnabled'](dialogId);
			return {
				title: main_core.Loc.getMessage('IM_CONTENT_COPILOT_MODE_MENU_REASONING'),
				icon: isReasoningEnabled ? ui_iconSet_api_core.Outline.CIRCLE_CHECK : ui_iconSet_api_core.Outline.AI_STARS,
				design: this.#getReasoningDesign(!isTempChat && isAvailableInModel, isReasoningEnabled),
				onClick: () => {
					if (this.#reasoningContext !== context || this.context !== context || this.context.dialogId !== dialogId) {
						return;
					}
					if (this.store.getters['copilot/chats/isTempChat'](dialogId)) {
						return;
					}
					if (!this.#isReasoningAvailable(dialogId)) {
						this.#showHint(main_core.Loc.getMessage('IM_CONTENT_COPILOT_TEXTAREA_REASONING_BUTTON_HINT_NOT_AVAILABLE'));
						return;
					}
					this.store.dispatch('copilot/chats/toggleReasoning', dialogId);
					im_v2_lib_analytics.Analytics.getInstance().copilot.onToggleReasoning(dialogId);
					im_v2_lib_analytics.Analytics.getInstance().copilot.onChangeReasoning(dialogId);
					this.close();
				}
			};
		}
		close() {
			this.#reasoningContext = null;
			this.#hideHint();
			super.close();
		}
		#isReasoningAvailable(dialogId) {
			const modelCode = this.store.getters['copilot/chats/getAIModel'](dialogId)?.code;
			return this.store.getters['copilot/isReasoningAvailableInModel'](modelCode);
		}
		getRoleItem() {
			return {
				title: main_core.Loc.getMessage('IM_CONTENT_COPILOT_MODE_MENU_ROLE'),
				icon: ui_iconSet_api_core.Outline.ROLES_LIBRARY,
				onClick: () => {
					this.#openRolesDialog();
					this.close();
				}
			};
		}
		#destroyRolesDialog() {
			if (!this.#rolesDialog) {
				return;
			}
			this.#rolesDialog.unsubscribe(ai_rolesDialog.RolesDialogEvents.SELECT_ROLE, this.onSelectRoleHandler);
			this.#rolesDialog.hide();
			this.#rolesDialog = null;
		}
		#showHint(text) {
			this.#hideHint();
			const menuContainer = this.menuInstance?.getPopupContainer();
			if (!menuContainer) {
				return;
			}
			this.#hintPopup = new main_popup.Popup({
				content: text,
				bindElement: menuContainer,
				className: 'ui-dialog-tooltip',
				darkMode: false,
				autoHide: true,
				maxWidth: 250,
				closeByEsc: true,
				offsetLeft: 50,
				bindOptions: {
					position: 'top'
				},
				angle: true,
				animation: 'fading-slide',
				events: {
					onAfterShow: event => {
						const popup = event.getTarget();
						main_core.Event.bindOnce(popup.getPopupContainer(), 'click', () => this.#hideHint());
					}
				}
			});
			this.#hintPopup.show();
		}
		#hideHint() {
			this.#hintPopup?.close();
			this.#hintPopup = null;
		}
		#getReasoningDesign(isAvailableInModel, isReasoningEnabled) {
			const hasUpdatedDesign = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
			if (!isAvailableInModel) {
				return ui_system_menu.MenuItemDesign.Disabled;
			}
			if (isReasoningEnabled) {
				return hasUpdatedDesign ? ui_system_menu.MenuItemDesign.Accent2 : ui_system_menu.MenuItemDesign.Copilot;
			}
			return ui_system_menu.MenuItemDesign.Default;
		}
		#openRolesDialog() {
			const currentRoleCode = this.store.getters['copilot/chats/getRole'](this.context.dialogId)?.code;
			this.#rolesDialog = new ai_rolesDialog.RolesDialog({
				moduleId: 'im',
				contextId: 'im-copilot-mode-menu',
				title: main_core.Loc.getMessage('IM_CONTENT_COPILOT_MODE_MENU_ROLE'),
				selectedRoleCode: currentRoleCode
			});
			this.#rolesDialog.subscribe(ai_rolesDialog.RolesDialogEvents.SELECT_ROLE, this.onSelectRoleHandler);
			void this.#rolesDialog.show();
		}
		#onSelectRole(event) {
			this.#destroyRolesDialog();
			const {
				role
			} = event.getData();
			if (!role) {
				return;
			}
			this.#updateRole(role);
		}
		#updateRole(newRole) {
			const {
				dialogId
			} = this.context;
			const currentRole = this.store.getters['copilot/chats/getRole'](dialogId);
			if (currentRole?.code === newRole.code) {
				return;
			}
			void this.store.dispatch('copilot/chats/set', {
				dialogId,
				role: newRole.code
			});
			void this.store.dispatch('copilot/roles/add', [newRole]);
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatCopilotUpdateRole, {
				data: {
					dialogId,
					role: newRole.code
				}
			});
		}
	}

	// @vue/component
	const ToolbarHint = {
		name: 'ToolbarHint',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			text: {
				type: String,
				required: true
			},
			hintEnabled: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			hintOptions() {
				if (!this.hintEnabled) {
					return null;
				}
				return {
					text: this.text,
					position: 'top',
					popupOptions: {
						className: 'ui-dialog-tooltip --ui-context-content-light',
						darkMode: false,
						maxWidth: 300,
						angle: {
							offset: 0
						},
						events: {
							onPopupShow: popup => {
								this.centerPopup(popup);
							}
						}
					}
				};
			}
		},
		methods: {
			centerPopup(popup) {
				const anchorWidth = popup.bindElement.offsetWidth;
				const popupWidth = popup.getPopupContainer().offsetWidth;
				const angleWidth = popup.angle.element.offsetWidth;
				if (!popupWidth) {
					return;
				}
				const angleLeftOffset = main_popup.Popup.getOption('angleLeftOffset');

				// eslint-disable-next-line no-param-reassign
				popup.offsetLeft = angleLeftOffset + (anchorWidth - popupWidth) / 2;

				// eslint-disable-next-line no-param-reassign
				popup.angle.defaultOffset = (popupWidth - angleWidth) / 2;
			}
		},
		template: `
		<span v-hint="hintOptions">
			<slot />
		</span>
	`
	};

	// @vue/component
	const ModeButton = {
		name: 'ModeButton',
		components: {
			Chip: ui_system_chip_vue.Chip,
			ToolbarHint
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
			isExpanded: {
				type: Boolean,
				default: true
			}
		},
		emits: ['clearMode'],
		data() {
			return {
				isMenuOpen: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			isTempChat() {
				return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
			},
			ChipDesign: () => ui_system_chip_vue.ChipDesign,
			ChipSize: () => ui_system_chip_vue.ChipSize,
			chipText() {
				if (this.isActive) {
					return this.loc('IM_CONTENT_COPILOT_MODE_MENU_REASONING');
				}
				return this.loc('IM_CONTENT_COPILOT_MODE_BUTTON_HINT');
			},
			chipIcon() {
				return ui_iconSet_api_core.Outline.AI_STARS;
			},
			chipDesign() {
				if (this.isTempChat) {
					return ui_system_chip_vue.ChipDesign.Outline;
				}
				if (this.isActive) {
					return ui_system_chip_vue.ChipDesign.OutlineBitrixGpt;
				}
				return ui_system_chip_vue.ChipDesign.Outline;
			}
		},
		created() {
			this.menu = new ModeMenu();
			this.menu.subscribe(ModeMenu.events.close, () => {
				this.isMenuOpen = false;
			});
		},
		beforeUnmount() {
			this.menu.close();
		},
		methods: {
			toggleMenu() {
				if (this.isTempChat) {
					return;
				}
				const menuChipElement = this.$refs.button?.$el;
				this.menu.openMenu({
					dialogId: this.dialogId
				}, menuChipElement);
				this.isMenuOpen = true;
			},
			clearMode() {
				if (this.isTempChat) {
					return;
				}
				this.$emit('clearMode');
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ToolbarHint 
			:text="loc('IM_CONTENT_COPILOT_MODE_BUTTON_HINT')" 
			:hintEnabled="!isExpanded && !isMenuOpen"
		>
			<Chip
				ref="button"
				:icon="chipIcon"
				:text="chipText"
				:rounded="true"
				:size="ChipSize.Sm"
				:design="chipDesign"
				:dropdown="!isActive && isExpanded"
				:withClear="isActive"
				:collapsed="!isExpanded"
				@click="toggleMenu"
				@clear="clearMode"
			/>
		</ToolbarHint>
	`
	};

	const COPILOT_ANALYTICS_CONTEXT = 'copilot_chat';
	const AriaLive = {
		polite: 'polite',
		assertive: 'assertive'
	};

	// @vue/component
	const CopilotMcpIntegration = {
		name: 'CopilotMcpIntegration',
		components: {
			Chip: ui_system_chip_vue.Chip,
			ToolbarHint
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isExpanded: {
				type: Boolean,
				default: true
			}
		},
		data() {
			return {
				isSelectorOpened: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			ChipDesign: () => ui_system_chip_vue.ChipDesign,
			ChipSize: () => ui_system_chip_vue.ChipSize,
			isAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.aiAssistantMcpSelectorAvailable);
			},
			isRestoreAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAiAssistantMcpSelectionRestoreAvailable);
			},
			mcpAuth() {
				return this.$store.getters['copilot/chats/getMcpAuth'](this.dialogId);
			},
			selectionStatus() {
				return this.$store.getters['copilot/chats/getMcpSelectionStatus'](this.dialogId);
			},
			hasSelectedMcpAuth() {
				return Boolean(this.mcpAuth?.id);
			},
			isMcpAuthConfirmedByServer() {
				return this.$store.getters['copilot/chats/isMcpAuthConfirmed'](this.dialogId);
			},
			awaitsMcpAuthConfirmation() {
				return this.isRestoreAvailable && !this.isMcpAuthConfirmedByServer;
			},
			outgoingMcpAuthId() {
				if (this.awaitsMcpAuthConfirmation) {
					return null;
				}
				return this.mcpAuth?.id ?? null;
			},
			hasOutgoingMcpAuth() {
				return this.outgoingMcpAuthId !== null;
			},
			chipDesign() {
				if (this.isRestoreAvailable && this.hasFailedSelection) {
					return ui_system_chip_vue.ChipDesign.OutlineAlert;
				}
				return this.hasOutgoingMcpAuth ? ui_system_chip_vue.ChipDesign.OutlineAccent2 : ui_system_chip_vue.ChipDesign.Outline;
			},
			hasFailedSelection() {
				return [im_v2_const.CopilotMcpSelectionStatus.error, im_v2_const.CopilotMcpSelectionStatus.unavailable].includes(this.selectionStatus);
			},
			withClear() {
				if (!this.isRestoreAvailable) {
					return this.hasSelectedMcpAuth;
				}
				return this.hasOutgoingMcpAuth || this.hasFailedSelection;
			},
			defaultIcon() {
				if (this.mcpIcon) {
					return null;
				}
				return ui_iconSet_api_core.Outline.MCP;
			},
			mcpIcon() {
				if (!this.mcpAuth?.icon) {
					return null;
				}
				return {
					src: this.mcpAuth.icon,
					alt: ''
				};
			},
			statusLabel() {
				switch (this.selectionStatus) {
					case im_v2_const.CopilotMcpSelectionStatus.restoring:
						return this.loc('IM_CONTENT_COPILOT_MCP_STATUS_RESTORING');
					case im_v2_const.CopilotMcpSelectionStatus.error:
						return this.loc('IM_CONTENT_COPILOT_MCP_STATUS_ERROR');
					case im_v2_const.CopilotMcpSelectionStatus.unavailable:
						return this.loc('IM_CONTENT_COPILOT_MCP_STATUS_UNAVAILABLE');
					default:
						return null;
				}
			},
			selectionLabel() {
				if (this.isRestoreAvailable && this.statusLabel && !this.hasOutgoingMcpAuth) {
					return this.statusLabel;
				}
				return this.mcpAuth?.name ?? this.loc('IM_CONTENT_COPILOT_MCP_INTEGRATIONS');
			},
			isStatusLabelMovedToHint() {
				return this.isRestoreAvailable && Boolean(this.statusLabel) && this.hasOutgoingMcpAuth;
			},
			chipText() {
				return this.selectionLabel;
			},
			hintText() {
				return this.isStatusLabelMovedToHint ? this.statusLabel : this.selectionLabel;
			},
			announcedSelection() {
				return {
					dialogId: this.dialogId,
					status: this.selectionStatus
				};
			},
			isHintEnabled() {
				if (this.isSelectorOpened) {
					return false;
				}
				return this.isStatusLabelMovedToHint || !this.isExpanded;
			}
		},
		watch: {
			// the chat and its status are watched together, so the guard does not depend on watcher order:
			// neither a chat switch nor the first status the opened chat settles on follows a user action
			announcedSelection(current, previous) {
				if (current.dialogId !== previous.dialogId) {
					this.awaitsSettledStatus = current.status === im_v2_const.CopilotMcpSelectionStatus.restoring;
					return;
				}
				if (this.awaitsSettledStatus) {
					this.awaitsSettledStatus = false;
					return;
				}
				this.announceStatus();
			}
		},
		created() {
			this.awaitsSettledStatus = this.selectionStatus === im_v2_const.CopilotMcpSelectionStatus.restoring;
		},
		beforeUnmount() {
			this.selector?.destroy();
		},
		methods: {
			announceStatus() {
				if (!this.isRestoreAvailable || !this.statusLabel) {
					return;
				}
				const politeness = this.selectionStatus === im_v2_const.CopilotMcpSelectionStatus.error ? AriaLive.assertive : AriaLive.polite;
				ui_a11y.LiveAnnouncer.announce(this.statusLabel, politeness);
			},
			toggle() {
				im_v2_lib_analytics.Analytics.getInstance().copilot.onMcpIntegrationClick(this.dialogId);
				if (this.isSelectorOpened) {
					this.selector?.hide();
					return;
				}
				if (this.isRestoreAvailable && this.hasFailedSelection) {
					this.dismissFailedSelectionLocally();
				}
				this.getSelector().show();
			},
			onMcpAuthChange(mcpAuth) {
				if (!mcpAuth) {
					this.clear();
					return;
				}
				this.setMcpAuth(mcpAuth);
			},
			// the selector takes its selected auth id only at construction, so it is rebuilt, not reused,
			// once the store moved on
			isSelectorOutdated() {
				if (!this.isRestoreAvailable || this.selectionStatus === im_v2_const.CopilotMcpSelectionStatus.restoring) {
					return false;
				}
				return this.selectorAuthId !== this.outgoingMcpAuthId;
			},
			getSelector() {
				if (this.selector && !this.isSelectorOutdated()) {
					return this.selector;
				}
				this.selector?.destroy();
				this.selector = null;
				const selectorOptions = {
					context: COPILOT_ANALYTICS_CONTEXT,
					dialogId: this.dialogId,
					targetNode: this.$refs.chip.$el,
					dialogOptions: {
						popupOptions: {
							className: 'mcp-selector-dialog'
						}
					},
					entityOptions: {
						agentMode: false
					},
					events: {
						onSelect: event => {
							const {
								auth,
								mcp
							} = event.getData();
							const selectedMcpAuth = auth ? {
								id: auth.id,
								name: auth.name,
								icon: mcp.iconUrl
							} : null;
							this.selectorAuthId = selectedMcpAuth?.id ?? null;
							this.onMcpAuthChange(selectedMcpAuth);
						},
						onHide: () => {
							this.isSelectorOpened = false;
						},
						onShow: () => {
							this.isSelectorOpened = true;
						}
					}
				};
				if (this.isRestoreAvailable) {
					selectorOptions.selectedAuthId = this.outgoingMcpAuthId;
				}
				this.selectorAuthId = this.isRestoreAvailable ? this.outgoingMcpAuthId : null;
				this.selector = new aiassistant_mcpSelector.McpSelector(selectorOptions);
				return this.selector;
			},
			getMcpSelectionService() {
				if (!this.mcpSelectionService) {
					this.mcpSelectionService = new im_v2_provider_service_copilot.McpSelection();
				}
				return this.mcpSelectionService;
			},
			setMcpAuth(mcpAuth) {
				if (this.isRestoreAvailable) {
					void this.getMcpSelectionService().save({
						dialogId: this.dialogId,
						mcpAuth
					});
				} else {
					this.$store.dispatch('copilot/chats/setMcpAuth', {
						dialogId: this.dialogId,
						mcpAuth,
						confirmed: true
					});
				}
				im_v2_lib_analytics.Analytics.getInstance().copilot.onChangeMCP(this.dialogId);
			},
			// the way back from the error state must not depend on a call that can fail the same way
			dismissFailedSelectionLocally() {
				void this.$store.dispatch('copilot/chats/setMcpSelectionStatus', {
					dialogId: this.dialogId,
					status: im_v2_const.CopilotMcpSelectionStatus.ready
				});
			},
			clear() {
				if (this.isRestoreAvailable && this.hasFailedSelection && !this.hasSelectedMcpAuth) {
					this.dismissFailedSelectionLocally();
					return;
				}
				const hadSelectedMcpAuth = this.hasSelectedMcpAuth;
				if (this.isRestoreAvailable) {
					void this.getMcpSelectionService().clear(this.dialogId);
				} else {
					this.$store.dispatch('copilot/chats/clearMcpAuth', this.dialogId);
				}
				if (hadSelectedMcpAuth) {
					im_v2_lib_analytics.Analytics.getInstance().copilot.onChangeMCP(this.dialogId);
				}
			},
			// the selector re-emits the cleared selection through onSelect, which runs clear() itself
			onChipClearClick() {
				if (this.selector) {
					this.selector.clear();
					return;
				}
				this.clear();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ToolbarHint
			v-if="isAvailable"
			:hintEnabled="isHintEnabled"
			:text="hintText"
		>
			<Chip
				ref="chip"
				data-testid="copilot-mcp-chip"
				:text="chipText"
				:trimmable="true"
				:rounded="true"
				:size="ChipSize.Sm"
				:icon="defaultIcon"
				:image="mcpIcon"
				:design="chipDesign"
				:withClear="withClear"
				:collapsed="!isExpanded"
				@click="toggle"
				@clear="onChipClearClick"
			/>
		</ToolbarHint>
	`
	};

	// @vue/component
	const SearchButton = {
		name: 'SearchButton',
		components: {
			Chip: ui_system_chip_vue.Chip,
			ToolbarHint
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isExpanded: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			ChipDesign: () => ui_system_chip_vue.ChipDesign,
			ChipSize: () => ui_system_chip_vue.ChipSize,
			isActive() {
				return this.$store.getters['copilot/chats/isForceSearchEnabled'](this.dialogId);
			},
			isDisabledByTariff() {
				return !im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotWebSearchAllowedByTariff);
			},
			isDisabledByAdmin() {
				return !im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotWebSearchEnabledByAdmin);
			},
			isDisabled() {
				return this.isDisabledByAdmin;
			},
			chipText() {
				return this.loc('IM_CONTENT_COPILOT_SEARCH_BUTTON');
			},
			hintText() {
				if (this.isDisabledByAdmin) {
					return this.loc('IM_CONTENT_COPILOT_SEARCH_DISABLED_BY_ADMIN');
				}
				return this.loc('IM_CONTENT_COPILOT_SEARCH_BUTTON');
			},
			isHintEnabled() {
				return this.isDisabledByAdmin || !this.isExpanded;
			},
			design() {
				if (this.isDisabled) {
					return ui_system_chip_vue.ChipDesign.Disabled;
				}
				if (this.isActive) {
					return ui_system_chip_vue.ChipDesign.OutlineBitrixGpt;
				}
				return ui_system_chip_vue.ChipDesign.Outline;
			}
		},
		methods: {
			onClick() {
				if (this.isDisabledByAdmin) {
					return;
				}
				this.$store.dispatch('copilot/chats/toggleForceSearch', this.dialogId);
				im_v2_lib_analytics.Analytics.getInstance().copilot.onChangeForceSearch(this.dialogId);
			},
			openTariffSlider() {
				main_core.Runtime.loadExtension('ui.info-helper').then(exports => {
					const {
						FeaturePromotersRegistry
					} = exports;
					const promoter = FeaturePromotersRegistry.getPromoter({
						code: im_v2_const.SliderCode.buyMarketPlus
					});
					promoter.show();
				}).catch(error => {
					im_v2_lib_logger.Logger.error('AiAssitantSearchButton: error loading info-helper extension', error);
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ToolbarHint
			:text="hintText"
			:hintEnabled="isHintEnabled"
		>
			<Chip
				:text="chipText"
				:collapsed="!isExpanded"
				:icon="OutlineIcons.AI_INTERNET_SEARCH"
				:rounded="true"
				:size="ChipSize.Sm"
				:design="design"
				:lock="isDisabled"
				:trimmable="true"
				@click="onClick"
			/>
		</ToolbarHint>
	`
	};

	// @vue/component
	const AgentModeButton = {
		name: 'AgentModeButton',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			isActive() {
				return this.$store.getters['copilot/chats/isAgentModeEnabled'](this.dialogId);
			},
			buttonStyle() {
				return this.isActive ? ui_vue3_components_button.AirButtonStyle.PLAIN_ACCENT : ui_vue3_components_button.AirButtonStyle.PLAIN;
			}
		},
		methods: {
			toggleAgentMode() {
				this.$store.dispatch('copilot/chats/toggleAgentMode', this.dialogId);
				im_v2_lib_analytics.Analytics.getInstance().copilot.onChangeAgentMode(this.dialogId);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-copilot-agent-mode-button__container">
			<UiButton
				:text="loc('IM_CONTENT_COPILOT_AGENT_MODE_BUTTON')"
				:leftIcon="OutlineIcons.LIST_AI_2"
				:size="ButtonSize.SMALL"
				:style="buttonStyle"
				@click="toggleAgentMode"
			/>
		</div>
	`
	};

	const COMPACT_MODE_BREAKPOINT = 400;
	const ButtonKey = {
		mode: 'mode',
		search: 'search'
	};
	const DEFAULT_EXPANDED = ButtonKey.search;

	// @vue/component
	const ToolbarButtons = {
		name: 'ToolbarButtons',
		components: {
			ModeButton,
			CopilotMcpIntegration,
			SearchButton,
			AgentModeButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isCompact: false
			};
		},
		computed: {
			isTempChat() {
				return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
			},
			expandedKey() {
				if (!this.isCompact) {
					return null;
				}
				if (this.isReasoningEnabled) {
					return ButtonKey.mode;
				}
				return DEFAULT_EXPANDED;
			},
			isModeExpanded() {
				return !this.isCompact || this.expandedKey === ButtonKey.mode;
			},
			isSearchExpanded() {
				return !this.isCompact || this.expandedKey === ButtonKey.search;
			},
			isMcpExpanded() {
				return !this.isCompact;
			},
			isSearchAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotForceSearchAvailable);
			},
			isAgentModeAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAiAssistantAgentModeAvailable);
			},
			isReasoningEnabled() {
				return this.$store.getters['copilot/chats/isReasoningEnabled'](this.dialogId);
			}
		},
		mounted() {
			this.initResizeObserver();
		},
		beforeUnmount() {
			this.getResizeObserver().disconnect();
		},
		methods: {
			initResizeObserver() {
				this.resizeObserver = new ResizeObserver(([entry]) => {
					this.onResize(entry.contentRect.width);
				});
				this.resizeObserver.observe(this.$refs.container);
			},
			onResize(width) {
				this.isCompact = width <= COMPACT_MODE_BREAKPOINT;
			},
			onClearMode() {
				if (this.isTempChat) {
					return;
				}
				this.$store.dispatch('copilot/chats/toggleReasoning', this.dialogId);
				im_v2_lib_analytics.Analytics.getInstance().copilot.onToggleReasoning(this.dialogId);
				im_v2_lib_analytics.Analytics.getInstance().copilot.onChangeReasoning(this.dialogId);
			},
			getResizeObserver() {
				return this.resizeObserver;
			}
		},
		template: `
		<div ref="container" class="bx-im-copilot-textarea__left-buttons"
		>
			<ModeButton
				:dialogId="dialogId"
				:isActive="isReasoningEnabled"
				:isExpanded="isModeExpanded"
				@clearMode="onClearMode"
			/>
			<CopilotMcpIntegration
				:dialogId="dialogId"
				:isExpanded="isMcpExpanded"
			/>
			<SearchButton
				v-if="isSearchAvailable"
				:dialogId="dialogId"
				:isExpanded="isSearchExpanded"
			/>
			<AgentModeButton
				v-if="isAgentModeAvailable"
				:dialogId="dialogId"
			/>
		</div>
	`
	};

	// @vue/component
	const CopilotTextarea = {
		name: 'CopilotTextarea',
		components: {
			ChatTextarea: im_v2_component_textarea.ChatTextarea,
			ToolbarButtons,
			ReasoningButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isFileUploadEnabled: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			withDraft: {
				/** @type boolean | { draftDialogId: string } */
				type: [Boolean, Object],
				default: true
			},
			// pass-through only: this wrapper serves both the messenger and the embeddable widget
			withKeyboardNavigation: {
				type: Boolean,
				default: false
			},
			deferredDialogPromise: {
				type: Object,
				default: null
			},
			allowBeforeSendOnUninitedTemp: {
				type: Boolean,
				default: false
			},
			heightConfig: {
				/** @type {{ storageKey?: string, minHeight?: number }} */
				type: Object,
				default: undefined
			}
		},
		computed: {
			isToolbarButtonsEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
			},
			isTempChat() {
				return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
			},
			hasUploadMenu() {
				return this.isFileUploadEnabled;
			},
			hasWithMention() {
				return !this.isTempChat;
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ChatTextarea
			:dialogId="dialogId"
			:placeholder="loc('IM_CONTENT_COPILOT_TEXTAREA_PLACEHOLDER')"
			:withMarket="false"
			:withEdit="false"
			:withUploadMenu="hasUploadMenu"
			:withMention="hasWithMention"
			:withSmileSelector="false"
			:disabled="disabled"
			:withDraft="withDraft"
			:withKeyboardNavigation="withKeyboardNavigation"
			:deferredDialogPromise="deferredDialogPromise"
			:allowBeforeSendOnUninitedTemp="allowBeforeSendOnUninitedTemp"
			:heightConfig="heightConfig"
		>
			<template #bottom-panel-buttons>
				<ToolbarButtons
					v-if="isToolbarButtonsEnabled"
					:dialogId="dialogId"
				/>
				<ReasoningButton
					v-else
					:dialogId="dialogId"
				/>
			</template>
		</ChatTextarea>
	`
	};

	// @vue/component
	const CopilotContent = {
		name: 'CopilotContent',
		components: {
			BaseChatContent: im_v2_component_content_elements.BaseChatContent,
			CopilotChatHeader,
			CopilotTextarea
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			backgroundId: {
				type: String,
				default: null
			},
			heightConfig: {
				/** @type {{ storageKey?: string, minHeight?: number }} */
				type: Object,
				default: undefined
			},
			// pass-through only: this content serves both the messenger copilot chat and the embeddable widget
			withKeyboardNavigation: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			isFileUploadEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotFileUploadAvailable);
			},
			isTempChat() {
				return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
			},
			withDropArea() {
				return this.dialogId !== '' && !this.isTempChat && this.isFileUploadEnabled;
			}
		},
		template: `
		<BaseChatContent :dialogId="dialogId" :backgroundId="backgroundId" :withDropArea="withDropArea">
			<template #header>
				<slot name="header">
					<CopilotChatHeader :dialogId="dialogId" :key="dialogId"/>
				</slot>
			</template>
			<template v-if="$slots.dialog" #dialog>
				<slot name="dialog"></slot>
			</template>
			<template #textarea>
				<CopilotTextarea
					:dialogId="dialogId"
					:isFileUploadEnabled="isFileUploadEnabled"
					:heightConfig="heightConfig"
					:withKeyboardNavigation="withKeyboardNavigation"
					:key="dialogId"
				/>
			</template>
		</BaseChatContent>
	`
	};

	// @vue/component
	const MultidialogChatTitle = {
		name: 'MultidialogChatTitle',
		components: {
			EditableChatTitle: im_v2_component_elements_chatTitle.EditableChatTitle,
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['newTitle'],
		computed: {
			isSupportBot() {
				return this.$store.getters['users/bots/isSupport'](this.dialogId);
			},
			subtitle() {
				return this.$Bitrix.Loc.getMessage('IM_CONTENT_CHAT_HEADER_SUPPORT_SUBTITLE');
			}
		},
		template: `
		<div class="bx-im-chat-header__info">
			<ChatTitle v-if="isSupportBot" :dialogId="dialogId" />
			<EditableChatTitle v-else :dialogId="dialogId" @newTitleSubmit="$emit('newTitle', $event)" />
			<div class="bx-im-chat-header__subtitle_container">
				<div class="bx-im-chat-header__subtitle_content">{{ subtitle }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const MultidialogHeader = {
		name: 'MultidialogHeader',
		components: {
			ChatHeader: im_v2_component_content_elements.ChatHeader,
			MultidialogChatTitle
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		template: `
		<ChatHeader :dialogId="dialogId">
			<template #title="{ onNewTitleHandler }">
				<MultidialogChatTitle
					:dialogId="dialogId"
					@newTitle="onNewTitleHandler"
				/>
			</template>
		</ChatHeader>
	`
	};

	const MultidialogContent = {
		name: 'MultidialogContent',
		components: {
			BaseChatContent: im_v2_component_content_elements.BaseChatContent,
			MultidialogHeader
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<MultidialogHeader :dialogId="dialogId" :key="dialogId" />
			</template>
		</BaseChatContent>
	`
	};

	// @vue/component
	const SelfChatContent = {
		name: 'SelfChatContent',
		components: {
			BaseChatContent: im_v2_component_content_elements.BaseChatContent,
			ChatHeader: im_v2_component_content_elements.ChatHeader,
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			titleType() {
				const isSelfChat = this.$store.getters['chats/isSelfChat'](this.dialogId);
				return isSelfChat ? im_v2_component_elements_chatTitle.ChatTitleType.selfChat : '';
			}
		},
		template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<ChatHeader :dialogId="dialogId" :withCallButton="false" :withAddToChatButton="false">
					<template #title>
						<ChatTitle :dialogId="dialogId" :customType="titleType" :showItsYou="false"/>
					</template>
				</ChatHeader>
			</template>
		</BaseChatContent>
	`
	};

	class AddToTaskPopupManager {
		#dialogId;
		#emitter;
		#onCandidateChange;
		#insertMentionHandler;
		#userId = null;
		#baselineText = null;
		constructor({
			dialogId,
			emitter,
			onCandidateChange
		}) {
			this.#dialogId = dialogId;
			this.#emitter = emitter;
			this.#onCandidateChange = onCandidateChange;
			this.#insertMentionHandler = event => this.#onInsertMention(event);
			this.#emitter.subscribe(im_v2_const.EventType.textarea.insertMention, this.#insertMentionHandler);
		}
		destroy() {
			this.#emitter.unsubscribe(im_v2_const.EventType.textarea.insertMention, this.#insertMentionHandler);
		}
		setDialogId(dialogId) {
			this.#dialogId = dialogId;
			this.reset();
		}
		handleTextChange({
			text,
			isAddingUser
		}) {
			if (!this.#userId || isAddingUser) {
				return;
			}
			if (this.#baselineText === null) {
				this.#baselineText = text;
				return;
			}
			if (text !== this.#baselineText) {
				this.reset();
			}
		}
		reset() {
			this.#setCandidate(null);
		}
		#onInsertMention(event) {
			const data = event.getData();
			if (data.dialogId !== this.#dialogId) {
				return;
			}
			if (!this.#canOfferAddToTask(data)) {
				return;
			}
			this.#setCandidate(data.mentionedUserId);
		}
		#canOfferAddToTask({
			mentionedUserId,
			isParticipant,
			suppressAddToChatPopup
		}) {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAddToChatPopupAvailable)) {
				return false;
			}
			if (suppressAddToChatPopup || isParticipant || !main_core.Type.isStringFilled(mentionedUserId)) {
				return false;
			}
			const mentionedChat = im_v2_application_core.Core.getStore().getters['chats/get'](mentionedUserId, true);
			if (mentionedChat.type !== im_v2_const.ChatType.user) {
				return false;
			}
			return im_v2_component_textarea.canAddToChat(this.#dialogId, mentionedUserId);
		}
		#setCandidate(userId) {
			this.#userId = userId;
			this.#baselineText = null;
			this.#onCandidateChange(userId);
		}
	}

	// @vue/component
	const TaskCommentsCard = {
		name: 'TaskCommentsCard',
		props: {
			dialogId: {
				type: String,
				required: true
			},
			taskId: {
				type: Number,
				required: true
			}
		},
		emits: ['close'],
		watch: {
			dialogId(newValue, oldValue) {
				const chatSwitched = Boolean(newValue && oldValue);
				if (chatSwitched) {
					this.destroyTaskCard();
					void this.openTaskCard();
				}
			}
		},
		created() {
			void this.openTaskCard();
		},
		beforeUnmount() {
			this.destroyTaskCard();
		},
		methods: {
			async openTaskCard() {
				const params = {
					taskId: this.taskId,
					onCloseEmbedded: () => this.$emit('close')
				};
				this.taskCardInstance = await tasks_v2_application_taskCard.TaskCard.embedFullCard(params);
				this.taskCardInstance.mount(this.$refs['task-card-container']);
			},
			destroyTaskCard() {
				this.taskCardInstance.unmount();
				this.taskCardInstance = null;
			}
		},
		template: `
		<div ref="task-card-container" class="bx-im-task-comments-card__container"></div>
	`
	};

	const POPUP_CLASSNAME = 'bx-im-task-card-promo-popup__container --line-clamp-3 --ui-context-content-dark';

	/**
	 * `main.popup` draws the close icon itself, and draws it as a native button with a tabindex of its own -
	 * so it is reachable in every engine. The promo names that very node and hands it to the header as a
	 * logical stop, instead of putting a second close button of its own beside it.
	 */
	const CLOSE_BUTTON_SELECTOR = '.popup-window-close-icon';
	const TAB_KEY$1 = 'Tab';

	// One promo shows at a time, so the text it describes the task button with carries one stable id.
	const TASK_CARD_PROMO_DESCRIPTION_ID = 'bx-im-task-card-promo-description';

	// @vue/component
	const TaskCardPromo = {
		name: 'TaskCardPromo',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup
		},
		inject: {
			chatDetailFocusContext: {
				from: im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT,
				default: null
			}
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			PopupType: () => im_v2_const.PopupType,
			TASK_CARD_PROMO_DESCRIPTION_ID: () => TASK_CARD_PROMO_DESCRIPTION_ID,
			popupConfig() {
				return {
					bindElement: this.bindElement,
					targetContainer: document.body,
					className: POPUP_CLASSNAME,
					width: 460,
					padding: 0,
					overlay: false,
					offsetTop: 8,
					offsetLeft: 17,
					bindOptions: {
						position: 'bottom'
					},
					closeIcon: true,
					/**
					 * A hint takes no focus of its own and holds none: its close button is an ordinary stop
					 * of the walk, right behind the task button the promo belongs to. Without a trap nobody
					 * puts the focus back either, which is what `returnFocusToOpener` is here for.
					 */
					focusTrap: false,
					angle: {
						position: 'top'
					},
					animation: 'fading'
				};
			}
		},
		created() {
			// Not in data(): neither the nodes of somebody else's popup nor the spent close reach the template.
			this.promoSurface = null;
			this.closeButton = null;
			this.isClosed = false;
		},
		mounted() {
			this.registerCloseButton();
		},
		beforeUnmount() {
			// A promo taken away by its owner - the chat changing under it - is no close by the user: the
			// popup tears itself down together with this component, and that teardown reports nothing.
			this.isClosed = true;
			this.unregisterCloseButton();
		},
		methods: {
			// Teleported out of the header, so the walk gets the close button by the key it logically follows.
			registerCloseButton() {
				const surface = main_popup.PopupManager.getPopupById(im_v2_const.PopupType.taskSideCardPromo)?.getPopupContainer() ?? null;
				const closeButton = surface?.querySelector(CLOSE_BUTTON_SELECTOR) ?? null;
				if (closeButton === null) {
					return;
				}
				this.promoSurface = surface;
				this.closeButton = closeButton;
				closeButton.setAttribute('aria-label', this.loc('IM_CONTENT_TASK_SIDE_CARD_PROMO_CLOSE_ARIA'));
				this.getFocusContext()?.registerHeaderControl({
					key: im_v2_component_content_elements.HeaderControlKey.promoClose,
					element: closeButton,
					after: im_v2_component_content_elements.HeaderControlKey.taskCard
				});

				// The listener of somebody else's node lives exactly as long as the branch of the walk does,
				// so the popup keeps its own keyboard model everywhere outside these two steps.
				main_core.Event.bind(closeButton, 'keydown', this.onCloseButtonKeydown);
			},
			unregisterCloseButton() {
				if (this.closeButton === null) {
					return;
				}
				main_core.Event.unbind(this.closeButton, 'keydown', this.onCloseButtonKeydown);
				this.getFocusContext()?.unregisterHeaderControl(im_v2_component_content_elements.HeaderControlKey.promoClose, this.closeButton);
				// `PopupManager` keeps its instances by id, so the name of the promo goes with the promo:
				// the next owner of the very same container would inherit it otherwise.
				this.closeButton.removeAttribute('aria-label');
				this.closeButton = null;
				this.promoSurface = null;
			},
			/**
			 * Enter, Space, Escape and the mouse all arrive here through the close of the popup itself: the
			 * close icon is a native button, and `main.popup` owns Escape for the surface it draws. That
			 * ownership is also what counts the key as handled - the shared `EscManager` stops before its own
			 * chain while a popup is shown - so the chat behind the promo does not close along with it.
			 *
			 * The popup reports its close twice, on the close and on the destroy that follows it, so the
			 * gesture is spent the first time: one activation takes the promo away exactly once.
			 */
			onPopupClose() {
				if (this.isClosed) {
					return;
				}
				this.isClosed = true;
				this.returnFocusToOpener();
				this.$emit('close');
			},
			/**
			 * The close button is drawn at the end of the document, and the walk owes it the place right
			 * behind the task button - a place no document order can give it. So `Tab` is the one key taken
			 * here: forward it steps on to whatever follows the promo in the header, back it returns to the
			 * task button the promo belongs to. Everything else stays with `main.popup`, Escape and the
			 * activation of the close included.
			 */
			onCloseButtonKeydown(event) {
				if (event.key !== TAB_KEY$1 || this.isClosed) {
					return;
				}
				const target = this.findWalkStop(event.shiftKey);
				if (target === null) {
					return;
				}
				event.preventDefault();
				ui_a11y.FocusNavigator.focusTarget(target, {
					preventScroll: true
				});
			},
			/**
			 * The nearest live stop beside the close button in the walk the header itself declares: the
			 * snapshot already carries the logical place of the teleported control, so the branch spells no
			 * order out a second time. Nothing to step on to leaves the ordinary walk alone.
			 */
			findWalkStop(isBackwards) {
				const context = this.getFocusContext();
				if (context === null) {
					return null;
				}
				const snapshot = context.getHeaderSnapshot();
				const ownIndex = snapshot.findIndex(entry => {
					return entry.key === im_v2_component_content_elements.HeaderControlKey.promoClose;
				});
				if (ownIndex === -1) {
					return null;
				}
				const side = isBackwards ? snapshot.slice(0, ownIndex).reverse() : snapshot.slice(ownIndex + 1);
				const stop = side.find(entry => entry.enabled);
				return stop === undefined ? null : context.getHeaderControlElement(stop.key);
			},
			returnFocusToOpener() {
				const opener = this.getFocusContext()?.getHeaderControlElement(im_v2_component_content_elements.HeaderControlKey.taskCard) ?? null;
				if (!this.holdsFocus() || !this.canTakeFocus(opener)) {
					return;
				}
				ui_a11y.FocusNavigator.focusTarget(opener, {
					preventScroll: true
				});
			},
			// Only a promo that holds the focus gives it back: closed by a click outside or by the chat
			// changing, it leaves the focus with whoever holds it.
			holdsFocus() {
				const activeElement = ui_a11y.FocusNavigator.getActiveElement();
				return activeElement !== null && this.promoSurface?.contains(activeElement) === true;
			},
			canTakeFocus(element) {
				if (element === null || !element.isConnected) {
					return false;
				}
				return ui_a11y.InteractivityChecker.isFocusable(element) && !ui_a11y.InteractivityChecker.isDisabled(element);
			},
			getFocusContext() {
				return this.chatDetailFocusContext;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.taskSideCardPromo"
			@close="onPopupClose"
		>
			<div class="bx-im-task-card-promo-popup__image"></div>
			<div :id="TASK_CARD_PROMO_DESCRIPTION_ID" class="bx-im-task-card-promo-popup__info">
				<div class="bx-im-task-card-promo-popup__title">
					{{ loc('IM_CONTENT_TASK_SIDE_CARD_PROMO_TITLE') }}
				</div>
				<div class="bx-im-task-card-promo-popup__text">
					{{ loc('IM_CONTENT_TASK_SIDE_CARD_PROMO_TEXT') }}
				</div>
			</div>
		</MessengerPopup>
	`
	};

	const TAB_KEY = 'Tab';

	// @vue/component
	const TaskHeaderButton = {
		name: 'TaskHeaderButton',
		components: {
			EntityControl: im_v2_component_content_elements.EntityControl,
			TaskCardPromo
		},
		inject: {
			chatDetailFocusContext: {
				from: im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT,
				default: null
			}
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			text: {
				type: String,
				default: ''
			},
			compactMode: {
				type: Boolean,
				default: false
			},
			// The card is a surface of its own, so the button reports whether it is open right now.
			expanded: {
				type: Boolean,
				default: null
			},
			withEmbeddedTaskCard: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		data() {
			return {
				showPromo: false
			};
		},
		computed: {
			// The promo tells what the task button leads to, so the button is described by that text while
			// the promo shows - and says nothing about a text that is no longer on screen.
			promoDescriptionId() {
				return this.showPromo ? TASK_CARD_PROMO_DESCRIPTION_ID : null;
			}
		},
		watch: {
			// The promo of the previous chat is no promo of this one: it goes without counting as watched.
			dialogId() {
				this.showPromo = false;
			}
		},
		mounted() {
			if (!this.withEmbeddedTaskCard) {
				return;
			}
			this.initPromo();
		},
		methods: {
			initPromo() {
				this.showPromo = true;
				this.showPromo = im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.taskSideCard);
			},
			onClosePromo() {
				this.showPromo = false;
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.taskSideCard);
			},
			/**
			 * While the promo shows, its close button is the stop right behind this one - and `main.popup`
			 * draws that button at the end of the document, so the ordinary walk would reach it only past the
			 * rest of the header. The step is taken here rather than inside the promo because the button is
			 * ours: a listener of the template goes and comes back with the element Vue renders.
			 */
			onTaskButtonKeydown(event) {
				if (event.key !== TAB_KEY || event.shiftKey || !this.showPromo) {
					return;
				}
				const closeButton = this.getPromoCloseStop();
				if (closeButton === null) {
					return;
				}
				event.preventDefault();
				ui_a11y.FocusNavigator.focusTarget(closeButton, {
					preventScroll: true
				});
			},
			// A promo without a close button of its own registers no stop, and one that cannot take the focus
			// is no stop either: the header itself answers both questions in its snapshot of the walk.
			getPromoCloseStop() {
				const context = this.getFocusContext();
				const isStopOfTheWalk = context?.getHeaderSnapshot().some(entry => {
					return entry.key === im_v2_component_content_elements.HeaderControlKey.promoClose && entry.enabled;
				});
				return isStopOfTheWalk === true ? context.getHeaderControlElement(im_v2_component_content_elements.HeaderControlKey.promoClose) : null;
			},
			getFocusContext() {
				return this.chatDetailFocusContext;
			}
		},
		template: `
		<div class="bx-im-task-comments-header-button__container">
			<div ref="entity-button">
				<EntityControl
					:text="text"
					:compactMode="compactMode"
					:expanded="expanded"
					:aria-describedby="promoDescriptionId"
					data-testid="im-task-comments-header-card-btn"
					@click="$emit('click')"
					@keydown="onTaskButtonKeydown"
				/>
			</div>
			<TaskCardPromo
				v-if="showPromo"
				:bindElement="$refs['entity-button']"
				@close="onClosePromo"
			/>
		</div>
	`
	};

	// @vue/component
	const TaskCommentsHeader = {
		name: 'TaskCommentsHeader',
		components: {
			ChatHeader: im_v2_component_content_elements.ChatHeader,
			GroupChatTitle: im_v2_component_content_elements.GroupChatTitle,
			TaskHeaderButton
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			isTaskCardOpened: {
				type: Boolean,
				required: true
			},
			withEmbeddedTaskCard: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggleTaskCard'],
		data() {
			return {
				compactMode: false
			};
		},
		computed: {
			isTaskCardAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isTaskCardAvailable);
			},
			needShowEntityLink() {
				return !this.isTaskCardAvailable;
			},
			entityText() {
				return this.isTaskCardOpened ? this.loc('IM_CONTENT_TASK_ENTITY_CONTROL_CLOSE_CARD_TEXT_MSGVER_1') : this.loc('IM_CONTENT_TASK_ENTITY_CONTROL_OPEN_CARD_TEXT');
			}
		},
		methods: {
			onCompactModeChange(compactMode) {
				this.compactMode = compactMode;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ChatHeader
			:dialogId="dialogId"
			@compactModeChange="onCompactModeChange"
		>
			<template v-if="isTaskCardAvailable" #title="{ onNewTitleHandler }">
				<GroupChatTitle
					:dialogId="dialogId"
					:withEntityLink="needShowEntityLink"
					@newTitle="onNewTitleHandler"
				>
					<template #after-user-counter>
						<TaskHeaderButton
							:dialogId="dialogId"
							:text="entityText"
							:compactMode="compactMode"
							:expanded="isTaskCardOpened"
							:withEmbeddedTaskCard="withEmbeddedTaskCard"
							@click="$emit('toggleTaskCard')"
						/>
					</template>
				</GroupChatTitle>
			</template>
		</ChatHeader>
	`
	};

	const LOADER_SIZE = 20;
	const LOADER_COLOR = '#fff';

	// @vue/component
	const AddToTaskButtonLoader = {
		name: 'AddToTaskButtonLoader',
		mounted() {
			this.loader = new main_loader.Loader({
				target: this.$refs.container,
				size: LOADER_SIZE,
				color: LOADER_COLOR
			});
			void this.loader.show();
		},
		beforeUnmount() {
			this.loader?.destroy();
		},
		template: `
		<div class="bx-im-mention-add-to-task__loading" ref="container"></div>
	`
	};

	const POPUP_ID = 'im-mention-add-to-task-popup';
	const POPUP_WIDTH = 400;
	const POPUP_OFFSET_TOP = 7;
	const DESCRIPTION_REPLACEMENTS = {
		'#NAME_START#': '<span class="bx-im-mention-add-to-task__user-name">',
		'#NAME_END#': '</span>'
	};
	const ADD_TO_TASK_DESCRIPTION = main_core.Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_TASK_POPUP_DESCRIPTION', DESCRIPTION_REPLACEMENTS);
	const ADD_TO_TASK_BUTTON = main_core.Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_TASK_COMMENTS_DROPDOWN_MENU');

	// @vue/component
	const AddToTaskPopup = {
		name: 'AddToTaskPopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			UiButton: ui_vue3_components_button.Button,
			AddToTaskButtonLoader
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			userId: {
				type: [String, Number],
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			chatId: {
				type: Number,
				required: true
			}
		},
		emits: ['close'],
		data() {
			return {
				isLoading: false
			};
		},
		computed: {
			POPUP_ID: () => POPUP_ID,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			buttonText() {
				return ADD_TO_TASK_BUTTON;
			},
			config() {
				return {
					bindElement: this.bindElement,
					bindOptions: {
						position: 'top'
					},
					angle: true,
					closeIcon: true,
					autoHide: true,
					width: POPUP_WIDTH,
					offsetTop: POPUP_OFFSET_TOP,
					borderRadius: '20px',
					padding: 0,
					background: 'var(--ui-color-bg-vibrant-default)'
				};
			},
			user() {
				return this.$store.getters['users/get'](this.userId, true);
			},
			description() {
				return ADD_TO_TASK_DESCRIPTION.replace('#NAME#', main_core.Text.encode(this.user.name));
			}
		},
		methods: {
			onAddClick() {
				if (this.isLoading) {
					return;
				}
				im_v2_lib_analytics.Analytics.getInstance().mention.onClickAddToChatFromPopup(this.dialogId);
				void this.addUserToChat();
			},
			async addUserToChat() {
				const params = {
					dialogId: this.dialogId,
					chatId: this.chatId,
					userId: this.userId
				};
				this.isLoading = true;
				try {
					const isAdded = await this.getAddUserService().addUser(params);
					if (isAdded) {
						im_v2_lib_notifier.Notifier.chat.handleUserAddComplete(im_v2_const.ChatType.taskComments);
					}
					this.$emit('close');
				} catch (error) {
					im_v2_lib_logger.Logger.error('AddToTaskPopup: addUser error', error);
					this.isLoading = false;
					im_v2_lib_notifier.Notifier.chat.handleUserAddError(im_v2_const.ChatType.taskComments);
				}
			},
			getAddUserService() {
				this.addUserService ??= new im_v2_component_textarea.MentionAddUserService({
					emitter: this.getEmitter()
				});
				return this.addUserService;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-im-mention-add-to-task__content">
				<div class="bx-im-mention-add-to-task__description" v-html="description"></div>
				<div class="bx-im-mention-add-to-task__action">
					<UiButton
						:text="buttonText"
						:style="AirButtonStyle.FILLED"
						:size="ButtonSize.SMALL"
						:leftIcon="OutlineIcons.ADD_PERSON"
						:disabled="isLoading"
						@click="onAddClick"
					/>
					<AddToTaskButtonLoader v-if="isLoading" />
				</div>
			</div>
		</MessengerPopup>
	`
	};

	const TASK_CARD_WIDTH = 567;
	const MIN_CONTENT_WIDTH_FOR_TASK_CARD = 966;

	// @vue/component
	const TaskCommentsContent = {
		name: 'TaskCommentsContent',
		components: {
			BaseChatContent: im_v2_component_content_elements.BaseChatContent,
			TaskCommentsCard,
			TaskCommentsHeader,
			SidebarAnimation: im_v2_component_animation.SidebarAnimation,
			ChatTextarea: im_v2_component_textarea.ChatTextarea,
			AddToTaskPopup
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isTaskCardOpened: false,
				withEmbeddedTaskCard: false,
				addToTaskUserId: null,
				textareaInputElement: null
			};
		},
		computed: {
			TASK_CARD_WIDTH: () => TASK_CARD_WIDTH,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			taskId() {
				return Number(this.dialog.entityLink.id);
			},
			isTaskCardAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isTaskCardAvailable);
			}
		},
		watch: {
			dialogId() {
				this.destroyTaskResultMenu();
				void this.initTaskResultMenu();
				this.addToTaskPopupManager.setDialogId(this.dialogId);
				this.destroyResultButton();
				this.initResultButton();
			}
		},
		created() {
			this.resultMenuRegistration = null;
			this.addToTaskPopupManager = new AddToTaskPopupManager({
				dialogId: this.dialogId,
				emitter: this.getEmitter(),
				onCandidateChange: userId => {
					this.addToTaskUserId = userId;
				}
			});
		},
		mounted() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.task.openCardFromMessage, this.openCardFromMessage);
			this.restoreTaskCardOpenedState();
			this.withEmbeddedTaskCard = this.canOpenEmbeddedTaskCard();
			void this.initTaskResultMenu();
			this.initResultButton();
		},
		beforeUnmount() {
			this.destroyTaskResultMenu();
			this.destroyResultButton();
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.task.openCardFromMessage, this.openCardFromMessage);
			this.addToTaskPopupManager.destroy();
		},
		methods: {
			initResultButton() {
				this.taskResultButtonController = new im_v2_lib_taskResultButton.TaskResultButtonController();
				void this.$nextTick(() => {
					this.taskResultButtonController.mount(this.$refs['result-button-container'], {
						taskId: this.taskId,
						dialogId: this.dialogId
					});
				});
			},
			async initTaskResultMenu() {
				if (!this.taskId || !this.dialog.chatId) {
					return;
				}
				this.resultMenuRegistration = await tasks_v2_lib_resultMessageMenu.resultMessageMenu.register({
					taskId: this.taskId,
					chatId: this.dialog.chatId
				});
			},
			destroyResultButton() {
				this.taskResultButtonController?.destroy();
				this.taskResultButtonController = null;
			},
			destroyTaskResultMenu() {
				this.resultMenuRegistration?.teardown();
				this.resultMenuRegistration = null;
			},
			canOpenEmbeddedTaskCard() {
				return this.$refs.content.getContainer().clientWidth >= MIN_CONTENT_WIDTH_FOR_TASK_CARD;
			},
			shouldOpenInSlider() {
				return !this.isTaskCardOpened && !this.canOpenEmbeddedTaskCard();
			},
			openCardFromMessage(event) {
				const {
					taskId
				} = event.getData();
				if (taskId !== this.taskId || this.isTaskCardOpened) {
					return;
				}
				event.preventDefault();
				im_v2_lib_analytics.Analytics.getInstance().taskComments.onOpenCardFromMessage(this.dialogId);
				im_v2_lib_analytics.Analytics.getInstance().taskComments.onOpenSideCard(this.taskId);
				if (this.shouldOpenInSlider()) {
					this.openTaskCardSlider();
					return;
				}
				this.toggleTaskCard();
			},
			handleTaskCardToggle() {
				const taskCommentsAnalytics = im_v2_lib_analytics.Analytics.getInstance().taskComments;
				if (this.isTaskCardOpened) {
					taskCommentsAnalytics.onCloseSideCard(this.taskId);
				} else {
					taskCommentsAnalytics.onOpenSideCard(this.taskId);
					taskCommentsAnalytics.onOpenCard(this.dialogId);
				}
				if (this.shouldOpenInSlider()) {
					this.openTaskCardSlider();
					return;
				}
				this.toggleTaskCard();
			},
			restoreTaskCardOpenedState() {
				const taskCardOpened = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.taskCommentsCardOpened, false);
				this.isTaskCardOpened = taskCardOpened && this.canOpenEmbeddedTaskCard();
			},
			openTaskCardSlider() {
				const entityUrl = this.dialog.entityLink.url;
				main_sidepanel.SidePanel.Instance.open(entityUrl);
			},
			toggleTaskCard() {
				this.isTaskCardOpened = !this.isTaskCardOpened;
				this.saveTaskCardOpenedState();
			},
			saveTaskCardOpenedState() {
				const WRITE_TO_STORAGE_TIMEOUT = 200;
				clearTimeout(this.saveTaskCardStateTimeout);
				this.saveTaskCardStateTimeout = setTimeout(() => {
					im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.taskCommentsCardOpened, this.isTaskCardOpened);
				}, WRITE_TO_STORAGE_TIMEOUT);
			},
			onTaskCardClose() {
				im_v2_lib_analytics.Analytics.getInstance().taskComments.onCloseSideCard(this.taskId);
				this.toggleTaskCard();
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			captureTextareaElement() {
				this.textareaInputElement = this.$refs.chatTextarea?.getInputElement() ?? null;
			},
			onTextareaTextChange(text) {
				this.addToTaskPopupManager.handleTextChange({
					text,
					isAddingUser: this.$refs['add-to-task-popup']?.isLoading ?? false
				});
			},
			closeAddToTaskPopup() {
				this.addToTaskPopupManager.reset();
			}
		},
		template: `
		<BaseChatContent :dialogId="dialogId" ref="content">
			<template #header>
				<TaskCommentsHeader
					:dialogId="dialogId"
					:isTaskCardOpened="isTaskCardOpened"
					:withEmbeddedTaskCard="withEmbeddedTaskCard"
					@toggleTaskCard="handleTaskCardToggle"
				/>
			</template>
			<template #textarea>
				<ChatTextarea
					:dialogId="dialogId"
					:withKeyboardNavigation="true"
					:key="dialogId"
					ref="chatTextarea"
					@mounted="() => { captureTextareaElement(); }"
					@textChange="onTextareaTextChange"
				>
					<template #bottom-panel-buttons>
						<div ref="result-button-container"></div>
					</template>
				</ChatTextarea>
				<AddToTaskPopup
					v-if="addToTaskUserId && textareaInputElement"
					ref="add-to-task-popup"
					:bindElement="textareaInputElement"
					:userId="addToTaskUserId"
					:dialogId="dialogId"
					:chatId="dialog.chatId"
					@close="closeAddToTaskPopup"
				/>
			</template>
			<template #extra-panel>
				<SidebarAnimation :width="TASK_CARD_WIDTH">
					<TaskCommentsCard
						v-if="isTaskCardAvailable && isTaskCardOpened"
						:dialogId="dialogId"
						:taskId="taskId"
						@close="onTaskCardClose"
					/>
				</SidebarAnimation>
			</template>
		</BaseChatContent>
	`
	};

	// @vue/component
	const ChannelEmptyState = {
		name: 'ChannelEmptyState',
		components: {
			BaseEmptyState: im_v2_component_content_elements.BaseEmptyState
		},
		computed: {
			text() {
				return this.loc('IM_CONTENT_CHANNEL_START_MESSAGE_V3');
			},
			subtext() {
				return this.loc('IM_CONTENT_CHANNEL_START_MESSAGE_SUBTITLE');
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseEmptyState :text="text" :subtext="subtext" />
	`
	};

	// @vue/component
	const EmbeddedChatEmptyState = {
		name: 'EmbeddedChatEmptyState',
		computed: {
			canInviteUsers() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.intranetInviteAvailable);
			}
		},
		methods: {
			onInviteActionClick() {
				const analyticsContext = im_v2_lib_analytics.Analytics.getInstance().sliderInvite.getEmptyStateContext();
				im_v2_lib_invite.InviteManager.openInviteSlider(analyticsContext);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-embedded-chat-start__container">
			<div class="bx-im-embedded-chat-start__image"></div>
			<div class="bx-im-embedded-chat-start__title">
				{{ loc('IM_CONTENT_EMBEDDED_CHAT_START_FEATURE_SUBTITLE') }}
			</div>
			<template v-if="canInviteUsers">
				<div class="bx-im-embedded-chat-start__separator_text">
					{{ loc('IM_CONTENT_EMBEDDED_CHAT_START_SEPARATOR_TEXT') }}
				</div>
				<div @click="onInviteActionClick" class="bx-im-embedded-chat-start__invite">
					{{ loc('IM_CONTENT_EMBEDDED_CHAT_START_INVITE_ACTION') }}
				</div>
			</template>
		</div>
	`
	};

	const SHOWCASE_TOOLS_PHRASES = [main_core.Loc.getMessage('IM_CONTENT_EMBEDDED_CHAT_START_TOOL_CHATS'), main_core.Loc.getMessage('IM_CONTENT_EMBEDDED_CHAT_START_TOOL_CALLS'), main_core.Loc.getMessage('IM_CONTENT_EMBEDDED_CHAT_START_TOOL_CHANNELS'), main_core.Loc.getMessage('IM_CONTENT_EMBEDDED_CHAT_START_TOOL_DOCS'), main_core.Loc.getMessage('IM_CONTENT_EMBEDDED_CHAT_START_TOOL_TASKS'), main_core.Loc.getMessage('IM_CONTENT_EMBEDDED_CHAT_START_TOOL_CALENDAR'), main_core.Loc.getMessage('IM_CONTENT_EMBEDDED_CHAT_START_TOOL_FILES'), main_core.Loc.getMessage('IM_CONTENT_EMBEDDED_CHAT_START_TOOL_BOARDS')];

	// @vue/component
	const EmbeddedChatPromoEmptyState = {
		name: 'EmbeddedChatPromoEmptyState',
		computed: {
			SHOWCASE_TOOLS_PHRASES: () => SHOWCASE_TOOLS_PHRASES,
			canInviteUsers() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.intranetInviteAvailable);
			},
			isCopilotAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable);
			},
			preparedTitle() {
				return main_core.Loc.getMessage('IM_CONTENT_EMBEDDED_CHAT_START_TITLE', {
					'[color]': '<span class="--brand-accent-with-icon">',
					'[/color]': '</span>'
				});
			},
			preparedInviteText() {
				const openInviteSliderHandler = 'BX.Messenger.v2.Lib.InviteManager.openInviteSlider()';
				return main_core.Loc.getMessage('IM_CONTENT_EMBEDDED_CHAT_START_FEATURE_INVITE_MSGVER_2', {
					'[action]': `<span class="bx-im-embedded-promo-start__invite-action" onclick="${openInviteSliderHandler}">`,
					'[/action]': '</span>'
				});
			},
			copilotFeatureText() {
				if (!this.isCopilotAvailable) {
					return this.loc('IM_CONTENT_EMBEDDED_CHAT_START_FEATURE_TEAM_CONTEXT');
				}
				return this.loc('IM_CONTENT_EMBEDDED_CHAT_START_FEATURE_AI');
			}
		},
		mounted() {
			void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.embeddedChatEmptyState);
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-embedded-promo-start__container">
			<div class="bx-im-embedded-promo-start__title" v-html="preparedTitle"></div>
			<div class="bx-im-embedded-promo-start__tools">
				<div
					v-for="tool in SHOWCASE_TOOLS_PHRASES"
					:key="tool"
					class="bx-im-embedded-promo-start__tools_item"
				>{{ tool }}</div>
			</div>
			<div class="bx-im-embedded-promo-start__content">
				<div class="bx-im-embedded-promo-start__features">
					<div class="bx-im-embedded-promo-start__features_content">
						<div class="bx-im-embedded-promo-start__feature_item">
							<div class="bx-im-embedded-promo-start__feature_icon --people"></div>
							<div class="bx-im-embedded-promo-start__feature_text">{{ loc('IM_CONTENT_EMBEDDED_CHAT_START_FEATURE_EASE') }}</div>
						</div>
						<div class="bx-im-embedded-promo-start__feature_item">
							<div class="bx-im-embedded-promo-start__feature_icon --shield"></div>
							<div class="bx-im-embedded-promo-start__feature_text">{{ loc('IM_CONTENT_EMBEDDED_CHAT_START_FEATURE_SAFETY') }}</div>
						</div>
						<div class="bx-im-embedded-promo-start__feature_item">
							<div class="bx-im-embedded-promo-start__feature_icon --ai"></div>
							<div class="bx-im-embedded-promo-start__feature_text">{{ copilotFeatureText }}</div>
						</div>
					</div>
					<div v-if="canInviteUsers" v-html="preparedInviteText" class="bx-im-embedded-promo-start__invite_item"></div>
				</div>
				<div class="bx-im-embedded-promo-start__image"></div>
			</div>
		</div>
	`
	};

	// @vue/component
	const CollabEmptyState = {
		name: 'CollabEmptyState',
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton,
			BaseEmptyState: im_v2_component_content_elements.BaseEmptyState
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			IconClass: () => im_v2_component_content_elements.IconClass,
			SpecialBackground: () => im_v2_lib_theme.SpecialBackground,
			canCreateCollab() {
				const isAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.collabCreationAvailable);
				const canCreate = im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createCollab);
				return isAvailable && canCreate;
			},
			createButtonColorScheme() {
				return {
					borderColor: im_v2_const.Color.transparent,
					backgroundColor: im_v2_const.Color.white,
					iconColor: im_v2_const.Color.gray90,
					textColor: im_v2_const.Color.gray90,
					hoverColor: im_v2_const.Color.white,
					textHoverColor: im_v2_const.Color.collab70
				};
			},
			collaberEmptyStateListItems() {
				return [{
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_COLLABER_TITLE_1'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_1'),
					name: im_v2_component_content_elements.EmptyStateListItemName.collaboration
				}, {
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_COLLABER_TITLE_2'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_COLLABER_SUBTITLE_2'),
					name: im_v2_component_content_elements.EmptyStateListItemName.business
				}, {
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_TITLE_3'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_3'),
					name: im_v2_component_content_elements.EmptyStateListItemName.result
				}];
			},
			baseEmptyStateListItems() {
				return [{
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_TITLE_1'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_1'),
					name: im_v2_component_content_elements.EmptyStateListItemName.collaboration
				}, {
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_TITLE_2'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_2'),
					name: im_v2_component_content_elements.EmptyStateListItemName.business
				}, {
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_TITLE_3'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_3'),
					name: im_v2_component_content_elements.EmptyStateListItemName.result
				}];
			},
			emptyStateListItems() {
				if (im_v2_lib_collab.CollabManager.isCurrentUserGuest()) {
					return this.collaberEmptyStateListItems;
				}
				return this.baseEmptyStateListItems;
			}
		},
		methods: {
			onCreateClick() {
				im_v2_lib_analytics.Analytics.getInstance().chatCreate.onProjectEmptyStateCreateClick();
				void im_public.Messenger.openChatCreation(im_v2_lib_createChat.CreatableChatType.collab);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseEmptyState
			:text="loc('IM_CONTENT_COLLAB_START_TITLE_V2')"
			:backgroundId="SpecialBackground.collab"
			:listItems="emptyStateListItems"
			:iconClassName="IconClass.list"
		>
			<template #bottom-content>
				<ChatButton
					v-if="canCreateCollab"
					:size="ButtonSize.XXL"
					:customColorScheme="createButtonColorScheme"
					:text="loc('IM_CONTENT_COLLAB_START_CREATE_BUTTON')"
					:isRounded="true"
					@click="onCreateClick"
				/>
			</template>
		</BaseEmptyState>
	`
	};

	// @vue/component
	const CollabV2EmptyState = {
		name: 'CollabV2EmptyState',
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton,
			BaseEmptyState: im_v2_component_content_elements.BaseEmptyState
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			IconClass: () => im_v2_component_content_elements.IconClass,
			SpecialBackground: () => im_v2_lib_theme.SpecialBackground,
			canCreateCollab() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createCollab);
			},
			isCopilotAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable);
			},
			createButtonColorScheme() {
				return {
					borderColor: im_v2_const.Color.transparent,
					backgroundColor: im_v2_const.Color.white,
					iconColor: im_v2_const.Color.gray90,
					textColor: im_v2_const.Color.gray90,
					hoverColor: im_v2_const.Color.white,
					textHoverColor: im_v2_const.Color.accentMainPrimaryAlt
				};
			},
			copilotTitle() {
				if (!this.isCopilotAvailable) {
					return this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_UNAVAILABLE_COPILOT_TITLE_1');
				}
				return this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_TITLE_1');
			},
			copilotSubtitle() {
				if (!this.isCopilotAvailable) {
					return this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_UNAVAILABLE_COPILOT_SUBTITLE_1');
				}
				return this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_SUBTITLE_1');
			},
			collaberEmptyStateListItems() {
				return [{
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_COLLABER_TITLE_1'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_1'),
					name: im_v2_component_content_elements.EmptyStateListItemName.collaboration
				}, {
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_COLLABER_TITLE_2'),
					subtitle: this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_COLLABER_SUBTITLE_2'),
					name: im_v2_component_content_elements.EmptyStateListItemName.business
				}, {
					title: this.loc('IM_CONTENT_COLLAB_START_BLOCK_TITLE_3'),
					subtitle: this.loc('IM_CONTENT_COLLAB_START_BLOCK_SUBTITLE_3'),
					name: im_v2_component_content_elements.EmptyStateListItemName.result
				}];
			},
			baseEmptyStateListItems() {
				return [{
					title: this.copilotTitle,
					subtitle: this.copilotSubtitle,
					name: im_v2_component_content_elements.EmptyStateListItemName.copilot
				}, {
					title: this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_TITLE_2'),
					subtitle: this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_SUBTITLE_2'),
					name: im_v2_component_content_elements.EmptyStateListItemName.messages
				}, {
					title: this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_TITLE_3'),
					subtitle: this.loc('IM_CONTENT_COLLAB_V2_START_BLOCK_SUBTITLE_3'),
					name: im_v2_component_content_elements.EmptyStateListItemName.list
				}];
			},
			emptyStateListItems() {
				if (im_v2_lib_collab.CollabManager.isCurrentUserGuest()) {
					return this.collaberEmptyStateListItems;
				}
				return this.baseEmptyStateListItems;
			}
		},
		methods: {
			onCreateClick() {
				im_v2_lib_analytics.Analytics.getInstance().chatCreate.onProjectEmptyStateCreateClick();
				void im_public.Messenger.openChatCreation(im_v2_lib_createChat.CreatableChatType.collab);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseEmptyState
			:text="loc('IM_CONTENT_COLLAB_V2_START_TITLE')"
			:backgroundId="SpecialBackground.collabV2"
			:listItems="emptyStateListItems"
			:iconClassName="IconClass.list"
		>
			<template #bottom-content>
				<ChatButton
					v-if="canCreateCollab"
					:size="ButtonSize.XXL"
					:customColorScheme="createButtonColorScheme"
					:text="loc('IM_CONTENT_COLLAB_V2_START_CREATE_BUTTON')"
					:isRounded="true"
					@click="onCreateClick"
				/>
			</template>
		</BaseEmptyState>
	`
	};

	// @vue/component
	const CollabEmptyStateWrapper = {
		name: 'CollabEmptyStateWrapper',
		components: {
			CollabEmptyState,
			CollabV2EmptyState
		},
		computed: {
			isCollabV2Available() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
			}
		},
		template: `
		<CollabV2EmptyState v-if="isCollabV2Available" />
		<CollabEmptyState v-else />
	`
	};

	const AiAssistantSuggestionDesign = Object.freeze({
		overlay: 'overlay',
		gradient: 'gradient'
	});

	// @vue/component
	const AiAssistantSuggestion = {
		name: 'AiAssistantSuggestion',
		props: {
			text: {
				type: String,
				required: true
			},
			design: {
				type: String,
				default: AiAssistantSuggestionDesign.overlay
			}
		},
		emits: ['click'],
		computed: {
			rootClasses() {
				return ['bx-im-ai-assistant-suggestion', `--${this.design}`];
			}
		},
		template: `
		<button
			type="button"
			:class="rootClasses"
			@click="$emit('click')"
		>
			<span class="bx-im-ai-assistant-suggestion__text">{{ text }}</span>
		</button>
	`
	};

	const GreetingWindow = {
		morning: 'morning',
		day: 'day',
		evening: 'evening',
		night: 'night'
	};
	const GreetingDayTag = {
		mon: 'mon',
		fri: 'fri',
		weekend: 'weekend',
		none: 'none'
	};
	const EASTER_EGG_CHANCE = 0.1;
	const LAST_GREETING_STORAGE_KEY = 'ai-assistant-greeting-last-id';
	// Date.getDay() convention; used until the portal work week arrives from the server
	const DEFAULT_WEEK_HOLIDAYS = [6, 0];

	/**
	 * Picks a greeting phrase for the empty BitrixGPT chat screen by local browser time and weekday.
	 * Randomness and storage access are injectable, so the selection is deterministic in tests.
	 */
	class GreetingSelector {
		#pool;
		#random;
		#weekHolidays;
		#getLastId;
		#saveLastId;
		constructor(pool, options = {}) {
			this.#pool = main_core.Type.isArrayFilled(pool) ? pool : [];
			this.#random = main_core.Type.isFunction(options.random) ? options.random : Math.random;
			this.#weekHolidays = main_core.Type.isArrayFilled(options.weekHolidays) ? options.weekHolidays : DEFAULT_WEEK_HOLIDAYS;
			this.#getLastId = options.getLastId;
			this.#saveLastId = options.saveLastId;
		}

		// strict window borders: morning [6,12), day [12,17), evening [17,21), night [21,24) and [0,6)
		static windowFor(hour) {
			if (hour >= 6 && hour < 12) {
				return GreetingWindow.morning;
			}
			if (hour >= 12 && hour < 17) {
				return GreetingWindow.day;
			}
			if (hour >= 17 && hour < 21) {
				return GreetingWindow.evening;
			}
			return GreetingWindow.night;
		}

		// JS weekday: 0=Sunday..6=Saturday. Weekend follows the portal work week, mon/fri stay tied to their weekdays
		static dayTagFor(weekday, weekHolidays = DEFAULT_WEEK_HOLIDAYS) {
			if (weekday === 1) {
				return GreetingDayTag.mon;
			}
			if (weekday === 5) {
				return GreetingDayTag.fri;
			}
			const holidays = main_core.Type.isArrayFilled(weekHolidays) ? weekHolidays : DEFAULT_WEEK_HOLIDAYS;
			if (holidays.includes(weekday)) {
				return GreetingDayTag.weekend;
			}
			return GreetingDayTag.none;
		}

		/**
		 * Empty pool -> empty string (blank render, not a static fallback line).
		 */
		select(now = new Date()) {
			if (!main_core.Type.isArrayFilled(this.#pool)) {
				return '';
			}
			const branch = this.#selectBranch(now);
			const candidates = this.#excludeLast(branch);
			const chosen = candidates[Math.floor(this.#random() * candidates.length)];
			this.#storeLastId(chosen.id);
			return chosen.text;
		}
		#selectBranch(now) {
			const eggs = this.#pool.filter(item => this.#isEasterEgg(item));
			if (this.#random() < EASTER_EGG_CHANCE && eggs.length > 0) {
				return eggs;
			}
			const window = GreetingSelector.windowFor(now.getHours());
			const dayTag = GreetingSelector.dayTagFor(now.getDay(), this.#weekHolidays);
			const windowItems = this.#pool.filter(item => item.timeRange === window);
			const dayItems = this.#pool.filter(item => dayTag !== GreetingDayTag.none && main_core.Type.isArray(item.days) && item.days.includes(dayTag));
			const branch = [...windowItems, ...dayItems];
			return branch.length > 0 ? branch : this.#pool;
		}
		#isEasterEgg(item) {
			return !main_core.Type.isStringFilled(item.timeRange) && !main_core.Type.isArrayFilled(item.days);
		}

		// single exclude-last rule for both branches: drop the last shown, unless it is the only candidate
		#excludeLast(branch) {
			const lastId = this.#readLastId();
			const candidates = branch.filter(item => item.id !== lastId);
			return candidates.length > 0 ? candidates : branch;
		}
		#readLastId() {
			try {
				if (main_core.Type.isFunction(this.#getLastId)) {
					return this.#getLastId();
				}
				return im_v2_lib_localStorage.LocalStorageManager.getInstance().get(LAST_GREETING_STORAGE_KEY, null);
			} catch {
				// storage is optional; selection still works without exclude-last
				return null;
			}
		}
		#storeLastId(id) {
			try {
				if (main_core.Type.isFunction(this.#saveLastId)) {
					this.#saveLastId(id);
					return;
				}
				im_v2_lib_localStorage.LocalStorageManager.getInstance().set(LAST_GREETING_STORAGE_KEY, id);
			} catch {
				// storage is optional; ignore write failures
			}
		}
	}

	// @vue/component
	const AiAssistantEmptyStateView = {
		name: 'AiAssistantEmptyStateView',
		components: {
			AiAssistantSuggestion,
			CopilotTextarea
		},
		props: {
			suggestions: {
				type: Array,
				default: () => []
			},
			dialogId: {
				type: String,
				default: ''
			},
			withDraft: {
				/** @type boolean | { draftDialogId: string } */
				type: [Boolean, Object],
				default: false
			},
			withTextArea: {
				type: Boolean,
				default: false
			},
			// pass-through only: this view serves both the messenger and the embeddable widget
			withKeyboardNavigation: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			suggestionDesign: {
				type: String,
				default: AiAssistantSuggestionDesign.overlay
			},
			deferredDialogPromise: {
				type: Object,
				default: null
			},
			allowBeforeSendOnUninitedTemp: {
				type: Boolean,
				default: false
			},
			isFileUploadEnabled: {
				type: Boolean,
				default: false
			},
			heightConfig: {
				/** @type {{ storageKey?: string, minHeight?: number }} */
				type: Object,
				default: undefined
			}
		},
		emits: ['selectSuggestion'],
		data() {
			return {
				greeting: ''
			};
		},
		computed: {
			greetingPool() {
				return this.$store.getters['copilot/getGreetings'];
			},
			greetingWeekHolidays() {
				return this.$store.getters['copilot/getGreetingWeekHolidays'];
			},
			normalizedSuggestions() {
				return this.suggestions.map(item => main_core.Type.isString(item) ? {
					text: item
				} : item).filter(item => item && item.text && item.text.length > 0);
			}
		},
		created() {
			// re-selected on every mount of the empty state (local browser time)
			this.greeting = new GreetingSelector(this.greetingPool, {
				weekHolidays: this.greetingWeekHolidays
			}).select();
		},
		methods: {
			onChipClick(item) {
				this.$emit('selectSuggestion', {
					text: item.text
				});
			}
		},
		template: `
		<div class="bx-im-ai-assistant-empty-state-view bx-im-ai-assistant-empty-state-view__scope" data-testid="im-ai-assistant-empty-state">
			<div v-if="greeting" class="bx-im-ai-assistant-empty-state-view__title" data-testid="im-ai-assistant-empty-state-greeting">{{ greeting }}</div>
			<div v-if="withTextArea" class="bx-im-ai-assistant-empty-state-view__textarea">
				<CopilotTextarea
					:dialogId="dialogId"
					:disabled="disabled"
					:withDraft="withDraft"
					:deferredDialogPromise="deferredDialogPromise"
					:allowBeforeSendOnUninitedTemp="allowBeforeSendOnUninitedTemp"
					:isFileUploadEnabled="isFileUploadEnabled"
					:heightConfig="heightConfig"
					:withKeyboardNavigation="withKeyboardNavigation"
				/>
			</div>
			<div
				v-if="normalizedSuggestions.length > 0"
				class="bx-im-ai-assistant-empty-state-view__suggestions"
			>
				<AiAssistantSuggestion
					v-for="(item, index) in normalizedSuggestions"
					:key="index"
					:text="item.text"
					:design="suggestionDesign"
					data-testid="im-ai-assistant-empty-state-suggestion"
					@click="onChipClick(item)"
				/>
			</div>
		</div>
	`
	};

	const EMPTY_STATE_TEXTAREA_MIN_HEIGHT = 40;

	// @vue/component
	const AiAssistantEmptyState = {
		name: 'AiAssistantEmptyState',
		components: {
			AiAssistantEmptyStateView,
			DropArea: im_v2_component_content_elements.DropArea
		},
		data() {
			return {
				currentDialogId: '',
				draftDialogId: '',
				deferredDialogPromise: null,
				dropAreaContainer: null
			};
		},
		computed: {
			backgroundStyle() {
				const backgroundId = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available) ? im_v2_lib_theme.SpecialBackground.aiAssistant : im_v2_lib_theme.SpecialBackground.copilot;
				return im_v2_lib_theme.ThemeManager.getBackgroundStyleById(backgroundId);
			},
			isFileUploadEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotFileUploadAvailable);
			},
			isTempChat() {
				return this.$store.getters['copilot/chats/isTempChat'](this.currentDialogId);
			},
			withDropArea() {
				return this.isFileUploadEnabled && !this.isTempChat && Boolean(this.dropAreaContainer);
			},
			suggestions() {
				return this.$store.getters['copilot/getSuggests'];
			},
			withDraft() {
				return {
					draftDialogId: this.draftDialogId
				};
			},
			textareaHeightConfig() {
				return {
					storageKey: im_v2_const.LocalStorageKey.textareaHeightAiAssistantEmptyState,
					minHeight: EMPTY_STATE_TEXTAREA_MIN_HEIGHT
				};
			},
			isCurrentChatActivated() {
				if (!this.currentDialogId) {
					return false;
				}
				if (this.$store.getters['recent/get'](this.currentDialogId)) {
					return true;
				}
				const chatId = this.$store.getters['chats/get'](this.currentDialogId)?.chatId ?? 0;
				if (chatId <= 0) {
					return false;
				}
				return Boolean(this.$store.state.messages.chatCollection[chatId]?.size);
			}
		},
		watch: {
			isCurrentChatActivated(isActivated) {
				if (isActivated) {
					this.openActivatedChat();
				}
			}
		},
		created() {
			this.isUnmounted = false;
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
			this.currentDialogId = this.copilotManager.draftChatCreate();
			this.activeTempDialogId = this.currentDialogId;
			this.draftDialogId = this.copilotManager.getEmptyStateDraftKey();
			this.deferredDialogPromise = this.copilotManager.draftChatGetRealPromise();
			void this.syncRealDialogId();
		},
		mounted() {
			this.dropAreaContainer = this.$refs.container;
		},
		beforeUnmount() {
			this.isUnmounted = true;
			this.invalidateDraftChat(this.activeTempDialogId);
		},
		methods: {
			async syncRealDialogId() {
				const tempDialogId = this.activeTempDialogId;
				let realDialogId = null;
				try {
					realDialogId = await this.deferredDialogPromise;
				} catch {
					realDialogId = null;
				}
				if (this.isUnmounted || !tempDialogId || this.activeTempDialogId !== tempDialogId) {
					return;
				}
				if (this.currentDialogId !== tempDialogId) {
					this.invalidateDraftChat(tempDialogId);
					return;
				}
				if (!realDialogId) {
					this.invalidateDraftChat(tempDialogId);
					im_v2_lib_notifier.Notifier.onDefaultError();
					void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
						name: im_v2_const.Layout.chat
					});
					return;
				}
				this.activeTempDialogId = null;
				this.currentDialogId = realDialogId;
			},
			invalidateDraftChat(tempDialogId) {
				if (this.activeTempDialogId !== tempDialogId) {
					return;
				}
				this.activeTempDialogId = null;
				if (this.currentDialogId === tempDialogId) {
					this.currentDialogId = '';
				}
				this.copilotManager.draftChatDispose();
			},
			openActivatedChat() {
				if (this.isUnmounted || !this.currentDialogId || this.isTempChat) {
					return;
				}

				// the send just activated the draft chat — let ChatOpener cross-fade this specific swap
				void this.$store.dispatch('copilot/setActivatedChatDialogId', this.currentDialogId);
				void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
					name: im_v2_const.Layout.copilot,
					entityId: this.currentDialogId,
					contextId: 0
				});
			},
			async onSuggestionSelect({
				text
			}) {
				const draftManager = im_v2_lib_draft.DraftManager.getInstance();
				draftManager.clearDraft(this.draftDialogId);
				draftManager.setDraftText(this.draftDialogId, '');
				const realDialogId = await this.deferredDialogPromise?.catch(() => null);
				if (this.isUnmounted || !realDialogId || this.currentDialogId !== realDialogId) {
					return;
				}
				void im_v2_provider_service_sending.SendingService.getInstance().sendMessage({
					text,
					dialogId: realDialogId
				});
			}
		},
		template: `
		<div class="bx-im-content-ai-assistant-empty-state__container" :style="backgroundStyle" ref="container">
			<AiAssistantEmptyStateView
				:suggestions="suggestions"
				:dialogId="currentDialogId"
				:withDraft="withDraft"
				:withTextArea="true"
				:withKeyboardNavigation="true"
				:deferredDialogPromise="deferredDialogPromise"
				:isFileUploadEnabled="isFileUploadEnabled"
				:heightConfig="textareaHeightConfig"
				@selectSuggestion="onSuggestionSelect"
			/>
			<DropArea v-if="withDropArea" :key="currentDialogId" :dialogId="currentDialogId" :container="dropAreaContainer" />
		</div>
	`
	};

	const BUTTON_BACKGROUND_COLOR = '#fff';
	const BUTTON_HOVER_COLOR = '#eee';
	const BUTTON_TEXT_COLOR = 'rgba(82, 92, 105, 0.9)';

	// @vue/component
	const CopilotLegacyEmptyState = {
		name: 'CopilotLegacyEmptyState',
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton
		},
		data() {
			return {
				isCreatingChat: false
			};
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			backgroundStyle() {
				const backgroundId = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available) ? im_v2_lib_theme.SpecialBackground.aiAssistant : im_v2_lib_theme.SpecialBackground.copilot;
				return im_v2_lib_theme.ThemeManager.getBackgroundStyleById(backgroundId);
			},
			preparedText() {
				return this.loc('IM_CONTENT_COPILOT_EMPTY_STATE_MESSAGE_MSGVER_2', {
					'#BR#': '\n',
					'#COPILOT_NAME#': this.copilotManager.getName()
				});
			},
			buttonColorScheme() {
				return {
					borderColor: im_v2_const.Color.transparent,
					backgroundColor: BUTTON_BACKGROUND_COLOR,
					iconColor: BUTTON_TEXT_COLOR,
					textColor: BUTTON_TEXT_COLOR,
					hoverColor: BUTTON_HOVER_COLOR
				};
			}
		},
		created() {
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
		},
		methods: {
			async createDefaultChat() {
				this.isCreatingChat = true;
				try {
					const newDialogId = await this.getCopilotService().createDefaultChat();
					im_v2_lib_analytics.Analytics.getInstance().copilot.onCreateChat(newDialogId);
					im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(newDialogId);
					this.isCreatingChat = false;
					void im_public.Messenger.openCopilot(newDialogId);
				} catch {
					this.isCreatingChat = false;
				}
			},
			getCopilotService() {
				if (!this.copilotService) {
					this.copilotService = new im_v2_provider_service_copilot.CopilotChatService();
				}
				return this.copilotService;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-copilot-empty-state__container" :style="backgroundStyle">
			<div class="bx-im-content-copilot-empty-state__content">
				<div class="bx-im-content-copilot-empty-state__icon"></div>
				<div class="bx-im-content-copilot-empty-state__text">{{ preparedText }}</div>
				<ChatButton
					class="--black-loader"
					:size="ButtonSize.XL"
					:customColorScheme="buttonColorScheme"
					:text="loc('IM_CONTENT_COPILOT_EMPTY_STATE_ASK_QUESTION')"
					:isRounded="true"
					:isLoading="isCreatingChat"
					@click="createDefaultChat"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const TaskEmptyState = {
		name: 'TaskFeatureListEmptyState',
		components: {
			BaseEmptyState: im_v2_component_content_elements.BaseEmptyState
		},
		computed: {
			IconClass: () => im_v2_component_content_elements.IconClass,
			isCopilotAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable);
			},
			copilotTitle() {
				if (!this.isCopilotAvailable) {
					return this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_UNAVAILABLE_COPILOT_TITLE_1');
				}
				return this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_TITLE_1');
			},
			copilotSubtitle() {
				if (!this.isCopilotAvailable) {
					return this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_UNAVAILABLE_COPILOT_SUBTITLE_1');
				}
				return this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_SUBTITLE_1');
			},
			emptyStateListItems() {
				return [{
					title: this.copilotTitle,
					subtitle: this.copilotSubtitle,
					name: im_v2_component_content_elements.EmptyStateListItemName.audio
				}, {
					title: this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_TITLE_2'),
					subtitle: this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_SUBTITLE_2'),
					name: im_v2_component_content_elements.EmptyStateListItemName.messages
				}, {
					title: this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_TITLE_3'),
					subtitle: this.loc('IM_CONTENT_TASK_START_FEATURE_LIST_BLOCK_SUBTITLE_3'),
					name: im_v2_component_content_elements.EmptyStateListItemName.chat
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
			:text="loc('IM_CONTENT_TASK_START_FEATURE_LIST_TITLE')"
			:listItems="emptyStateListItems"
			:iconClassName="IconClass.list"
		/>
	`
	};

	class UserService {
		async updateLastActivityDate(userId) {
			if (this.#isPullServerWithUserStatusSupport()) {
				const lastActivityDate = await this.#getUserActivityFromPull(userId);
				if (!lastActivityDate) {
					return;
				}
				this.#updateUserModel(userId, {
					lastActivityDate
				});
				return;
			}
			const userData = await this.#requestUserData(userId);
			this.#updateUserModel(userId, userData);
		}
		async #getUserActivityFromPull(userId) {
			const result = await im_v2_application_core.Core.getPullClient().getUsersLastSeen([userId]).catch(error => {
				console.error('UserService: error getting user activity from P&P', error);
				throw error;
			});
			if (!main_core.Type.isNumber(result[userId])) {
				return null;
			}
			const activityDateAgo = result[userId] * 1000;
			return new Date(Date.now() - activityDateAgo);
		}
		async #requestUserData(userId) {
			im_v2_lib_logger.Logger.warn(`UserService: get actual user data for - ${userId}`);
			const answer = await im_v2_application_core.Core.getRestClient().callMethod(im_v2_const.RestMethod.imUserGet, {
				ID: userId
			}).catch(result => {
				console.error('UserService: error getting user data', result.error());
			});
			return answer.data();
		}
		async #updateUserModel(userId, userFields) {
			im_v2_lib_logger.Logger.warn('UserService: update user data', userFields);
			void im_v2_application_core.Core.getStore().dispatch('users/update', {
				id: userId,
				fields: userFields
			});
		}
		#isPullServerWithUserStatusSupport() {
			return im_v2_application_core.Core.getPullClient().isJsonRpc();
		}
	}

	// @vue/component
	const ChatOpener = {
		name: 'ChatOpener',
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isUser() {
				return this.dialog.type === im_v2_const.ChatType.user;
			},
			isChannel() {
				return im_v2_lib_channel.ChannelManager.isChannel(this.dialogId);
			},
			isCollab() {
				return this.dialog.type === im_v2_const.ChatType.collab;
			},
			isMultidialog() {
				return this.$store.getters['sidebar/multidialog/isSupport'](this.dialogId);
			},
			isSelfChat() {
				return this.$store.getters['chats/isSelfChat'](this.dialogId);
			},
			isCopilot() {
				return this.dialog.type === im_v2_const.ChatType.copilot;
			},
			// Cross-fade the empty-state → chat swap only for the chat the send just activated; every
			// other navigation carries no mark, so it stays instant — as does every non-copilot chat type.
			withOpenerTransition() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotDraftChatAvailable) && this.$store.getters['copilot/isChatOpenedBySend'](this.dialogId);
			},
			isAiAssistantBot() {
				return this.$store.getters['users/bots/isAiAssistant'](this.dialogId);
			},
			isTaskComments() {
				return this.dialog.type === im_v2_const.ChatType.taskComments;
			},
			isGuest() {
				return this.dialog.role === im_v2_const.UserRole.guest;
			},
			contentComponentConfig() {
				return [{
					condition: this.isChannel,
					component: ChannelContent
				}, {
					condition: this.isCollab,
					component: CollabContent
				}, {
					condition: this.isMultidialog,
					component: MultidialogContent
				}, {
					condition: this.isSelfChat,
					component: SelfChatContent
				}, {
					condition: this.isCopilot,
					component: CopilotContent,
					props: {
						withKeyboardNavigation: true
					}
				}, {
					condition: this.isAiAssistantBot,
					component: AiAssistantBotContent,
					props: {
						withKeyboardNavigation: true
					}
				}, {
					condition: this.isTaskComments,
					component: TaskCommentsContent
				}];
			},
			matchingContentConfig() {
				return this.contentComponentConfig.find(item => item.condition === true) ?? null;
			},
			contentComponent() {
				return this.matchingContentConfig?.component ?? im_v2_component_content_elements.BaseChatContent;
			},
			contentComponentProps() {
				return this.matchingContentConfig?.props ?? {};
			},
			emptyStateComponent() {
				const copilotEmptyState = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotDraftChatAvailable) ? AiAssistantEmptyState : CopilotLegacyEmptyState;
				const EmptyStateComponentByLayout = {
					[im_v2_const.Layout.channel]: ChannelEmptyState,
					[im_v2_const.Layout.collab]: CollabEmptyStateWrapper,
					[im_v2_const.Layout.copilot]: copilotEmptyState,
					[im_v2_const.Layout.chat]: this.chatEmptyStateComponent,
					[im_v2_const.Layout.folderAll]: this.chatEmptyStateComponent,
					[im_v2_const.Layout.taskComments]: TaskEmptyState,
					default: im_v2_component_content_elements.BaseEmptyState
				};
				return EmptyStateComponentByLayout[this.layout.name] ?? EmptyStateComponentByLayout.default;
			},
			chatEmptyStateComponent() {
				const isEmbeddedMode = im_v2_lib_layout.LayoutManager.getInstance().isEmbeddedMode();
				const needToShowPromoEmptyState = im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.embeddedChatEmptyState);
				if (!isEmbeddedMode) {
					return im_v2_component_content_elements.BaseEmptyState;
				}
				return needToShowPromoEmptyState ? EmbeddedChatPromoEmptyState : EmbeddedChatEmptyState;
			}
		},
		watch: {
			dialogId: [function (newValue, oldValue) {
				im_v2_lib_logger.Logger.warn(`ChatContent: switching from ${oldValue || 'empty'} to ${newValue}`);
				this.onChatChange();
			}, {
				// clear the mark after the animated swap has rendered (post-flush, so it does not cancel
				// the running transition) — a later navigation into the same chat stays instant
				flush: 'post',
				handler() {
					if (this.$store.getters['copilot/isChatOpenedBySend'](this.dialogId)) {
						void this.$store.dispatch('copilot/setActivatedChatDialogId', '');
					}
				}
			}]
		},
		created() {
			if (!this.dialogId) {
				return;
			}
			this.onChatChange();
		},
		methods: {
			async onChatChange() {
				if (this.dialogId === '') {
					return;
				}
				if (im_v2_lib_utils.Utils.dialog.isExternalId(this.dialogId)) {
					const realDialogId = await this.getChatService().prepareDialogId(this.dialogId);
					void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
						...im_v2_lib_folder.FolderManager.getRegularChatsLayout(),
						entityId: realDialogId,
						contextId: this.layout.contextId
					});
					return;
				}
				if (this.dialog.inited) {
					im_v2_lib_logger.Logger.warn(`ChatContent: chat ${this.dialogId} is already loaded`);
					if (this.isUser) {
						const userId = parseInt(this.dialog.dialogId, 10);
						this.getUserService().updateLastActivityDate(userId);
					} else if (this.isChannel && !this.isGuest) {
						im_v2_lib_logger.Logger.warn(`ChatContent: channel ${this.dialogId} is loaded, loading comments metadata`);
						void this.getChatService().loadCommentInfo(this.dialogId);
					}
					im_v2_lib_analytics.Analytics.getInstance().onOpenChat(this.dialog);
					return;
				}
				if (this.dialog.loading) {
					im_v2_lib_logger.Logger.warn(`ChatContent: chat ${this.dialogId} is loading`);
					return;
				}
				if (this.layout.contextId) {
					await this.loadChatWithContext();
					im_v2_lib_analytics.Analytics.getInstance().onOpenChat(this.dialog);
					return;
				}
				await this.loadChat();
				im_v2_lib_analytics.Analytics.getInstance().onOpenChat(this.dialog);
			},
			async loadChatWithContext() {
				im_v2_lib_logger.Logger.warn(`ChatContent: loading chat ${this.dialogId} with context - ${this.layout.contextId}`);
				await this.getChatService().loadChatWithContext(this.dialogId, this.layout.contextId).catch(error => {
					this.sendAnalytics(error);
					im_public.Messenger.openChat();
				});
				im_v2_lib_logger.Logger.warn(`ChatContent: chat ${this.dialogId} is loaded with context of ${this.layout.contextId}`);
			},
			async loadChat() {
				im_v2_lib_logger.Logger.warn(`ChatContent: loading chat ${this.dialogId}`);
				await this.getChatService().loadChatWithMessages(this.dialogId).catch(() => {
					im_public.Messenger.openChat();
				});
				im_v2_lib_logger.Logger.warn(`ChatContent: chat ${this.dialogId} is loaded`);
			},
			sendAnalytics(error) {
				if (error.code !== im_v2_const.ErrorCode.message.notFound) {
					return;
				}
				im_v2_lib_analytics.Analytics.getInstance().messageDelete.onNotFoundNotification({
					dialogId: this.dialogId
				});
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			getUserService() {
				if (!this.userService) {
					this.userService = new UserService();
				}
				return this.userService;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-content-default-chat__container">
			<Transition name="im-content-opener-flip" :css="withOpenerTransition" :duration="400">
				<component :is="emptyStateComponent" v-if="!dialogId" />
				<component :is="contentComponent" v-else :dialogId="dialogId" v-bind="contentComponentProps" />
			</Transition>
		</div>
	`
	};

	/**
	 * The saved "subscribed or not" setting, so the control is a switch with one name and one stop. The
	 * visual toggle inside is decoration: neither the AIR switcher nor the legacy one renders a native
	 * input or button, so nothing under the control takes the focus or handles the activation on its own.
	 */
	// @vue/component
	const SubscribeToggle = {
		name: 'SubscribeToggle',
		components: {
			Toggle: im_v2_component_elements_toggle.Toggle,
			Switcher: ui_vue3_components_switcher.Switcher,
			HeaderAction: im_v2_component_content_elements.HeaderAction
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {};
		},
		computed: {
			ToggleSize: () => im_v2_component_elements_toggle.ToggleSize,
			HeaderActionShape: () => im_v2_component_content_elements.HeaderActionShape,
			HeaderControlKey: () => im_v2_component_content_elements.HeaderControlKey,
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			postMessageId() {
				return this.$store.getters['messages/comments/getMessageIdByChatId'](this.dialog.chatId);
			},
			isSubscribed() {
				return this.$store.getters['messages/comments/isUserSubscribed'](this.postMessageId);
			}
		},
		methods: {
			onToggleClick() {
				if (this.isSubscribed) {
					im_v2_provider_service_comments.CommentsService.unsubscribe(this.postMessageId);
					return;
				}
				im_v2_provider_service_comments.CommentsService.subscribe(this.postMessageId);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<HeaderAction
			:controlKey="HeaderControlKey.commentsSubscribe"
			:label="loc('IM_CONTENT_COMMENTS_FOLLOW_TOGGLE_ARIA')"
			:checked="isSubscribed"
			:shape="HeaderActionShape.rounded"
			class="bx-im-comments-header-follow__container"
			:class="{'--air': isAirDesignEnabled}"
			data-testid="im-comments-header-follow-toggle"
			@click="onToggleClick"
		>
			<div class="bx-im-comments-header-follow__text">{{ loc('IM_CONTENT_COMMENTS_FOLLOW_TOGGLE_TEXT') }}</div>
			<Switcher
				v-if="isAirDesignEnabled"
				:is-checked="isSubscribed"
				:options="{ size: 'small', useAirDesign: true }"
				class="bx-im-comments-header-follow__switcher"
			/>
			<Toggle v-else :size="ToggleSize.M" :isEnabled="isSubscribed" />
		</HeaderAction>
	`
	};

	// @vue/component
	const CommentsHeader = {
		name: 'CommentsHeader',
		components: {
			ChatHeader: im_v2_component_content_elements.ChatHeader,
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			SubscribeToggle,
			HeaderAction: im_v2_component_content_elements.HeaderAction,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			channelId: {
				type: String,
				required: true
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			HeaderActionShape: () => im_v2_component_content_elements.HeaderActionShape,
			HeaderControlKey: () => im_v2_component_content_elements.HeaderControlKey,
			channel() {
				return this.$store.getters['chats/get'](this.channelId, true);
			},
			showSubscribeToggle() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.subscribeToComments, this.dialogId);
			},
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			/**
			 * Both designs are one and the same control, so the geometry travels to it. The AIR branch shows
			 * a DS glyph and takes the shared icon-button box of the header - the very one the search and the
			 * sidebar buttons wear; the legacy branch keeps its own 24px box with the background image.
			 */
			backControlClasses() {
				if (this.isAirDesignEnabled) {
					return ['bx-im-chat-header__icon', '--ds-icon', 'bx-im-comment-header__back-icon'];
				}
				return ['bx-im-comment-header__back'];
			}
		},
		created() {
			// Not in data(): the gesture is spent once and the template knows nothing of it.
			this.isBackRequested = false;
		},
		methods: {
			// ALG-04: the control stays on screen while the layer leaves, so the gesture that closes it is
			// spent the first time - a second activation adds no second close.
			onBackClick() {
				if (this.isBackRequested) {
					return;
				}
				this.isBackRequested = true;
				this.getEmitter().emit(im_v2_const.EventType.dialog.closeComments);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ChatHeader
			:dialogId="dialogId"
			class="bx-im-comment-header__container"
			:class="{'--air': isAirDesignEnabled}"
		>
			<template #left>
				<HeaderAction
					:controlKey="HeaderControlKey.commentsBack"
					:label="loc('IM_CONTENT_COMMENTS_HEADER_BACK_ARIA')"
					:shape="HeaderActionShape.circle"
					:class="backControlClasses"
					data-testid="im-comments-header-back-btn"
					@click="onBackClick"
				>
					<BIcon v-if="isAirDesignEnabled" :name="Outline.CHEVRON_LEFT_L" :hoverable="true" />
				</HeaderAction>
				<div class="bx-im-comment-header__info">
					<div class="bx-im-comment-header__title">{{ loc('IM_CONTENT_COMMENTS_HEADER_TITLE') }}</div>
					<div class="bx-im-comment-header__subtitle">
						<div class="bx-im-comment-header__subtitle_avatar">
							<ChatAvatar :avatarDialogId="channelId" :size="AvatarSize.XS" />
						</div>
						<div class="bx-im-comment-header__subtitle_text --ellipsis">{{ channel.name }}</div>
					</div>
				</div>
			</template>
			<template v-if="showSubscribeToggle" #before-actions>
				<SubscribeToggle :dialogId="dialogId" />
			</template>
		</ChatHeader>
	`
	};

	// @vue/component
	const CommentsDialogLoader = {
		name: 'CommentsDialogLoader',
		data() {
			return {};
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-comments-dialog-loader__container">
			<div class="bx-im-comments-dialog-loader__spinner"></div>
		</div>
	`
	};

	// @vue/component
	const CommentsMessageList = {
		name: 'CommentsMessageList',
		components: {
			MessageList: im_v2_component_messageList.MessageList,
			CommentsDialogLoader,
			AuthorGroup: im_v2_component_messageList.AuthorGroup,
			...im_v2_component_messageList.MessageComponents
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
			},
			showPostMessage() {
				return this.dialog.inited && !this.dialog.hasPrevPage;
			},
			postMessageId() {
				return this.$store.getters['messages/comments/getMessageIdByChatId'](this.dialog.chatId);
			},
			postMessage() {
				return this.$store.getters['messages/getById'](this.postMessageId);
			},
			postAuthorGroup() {
				if (!this.dialog.inited) {
					return null;
				}
				const collectionManager = new im_v2_component_messageList.CollectionManager(this.dialogId);
				return collectionManager.formatAuthorGroup(this.postMessage);
			}
		},
		methods: {
			getMessageComponentName(message) {
				return new im_v2_lib_messageComponent.MessageComponentManager(message).getName();
			}
		},
		template: `
		<MessageList
			:dialogId="dialogId"
			ref="messageList"
		>
			<template #loader>
				<CommentsDialogLoader />
			</template>
			<template v-if="showPostMessage" #before-messages>
				<div class="bx-im-comments-message-list__channel-post">
					<AuthorGroup :item="postAuthorGroup" :contextDialogId="dialogId" :withAvatarMenu="false">
						<template #message>
							<component
								:is="getMessageComponentName(postMessage)"
								:item="postMessage"
								:dialogId="dialogId"
								:key="postMessage.id"
							>
							</component>
						</template>
					</AuthorGroup>
				</div>
			</template>
		</MessageList>
	`
	};

	// @vue/component
	const CommentsDialog = {
		name: 'CommentsDialog',
		components: {
			ChatDialog: im_v2_component_dialog_chat.ChatDialog,
			CommentsMessageList,
			PinnedMessages: im_v2_component_dialog_chat.PinnedMessages
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			contextId: {
				type: Number,
				default: 0
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			dialogInited() {
				return this.dialog.inited;
			},
			postMessageId() {
				return this.$store.getters['messages/comments/getMessageIdByChatId'](this.dialog.chatId);
			},
			postMessage() {
				return this.$store.getters['messages/getById'](this.postMessageId);
			}
		},
		watch: {
			dialogInited(inited) {
				if (inited) {
					void this.goToContextMessage();
				}
			}
		},
		mounted() {
			if (this.dialogInited) {
				void this.goToContextMessage();
			}
		},
		methods: {
			async goToContextMessage() {
				if (!this.contextId) {
					return;
				}
				await this.$nextTick();
				await this.$refs.dialog.goToMessageContext(this.contextId);
			},
			async goToPostMessageContext() {
				const dialog = this.$refs.dialog;
				const postMessageIsShown = this.dialogInited && !this.dialog.hasPrevPage;
				if (postMessageIsShown) {
					await dialog.getScrollManager().animatedScrollToMessage(this.postMessageId);
					dialog.highlightMessage(this.postMessageId);
					return;
				}
				dialog.showLoadingBar();
				await dialog.getMessageService().loadFirstPage();
				await this.$nextTick();
				dialog.hideLoadingBar();
				dialog.getScrollManager().scrollToMessage(this.postMessageId);
				await this.$nextTick();
				dialog.highlightMessage(this.postMessageId);
			},
			onPinnedPostMessageClick() {
				this.goToPostMessageContext();
			}
		},
		template: `
		<ChatDialog ref="dialog" :dialogId="dialogId" :saveScrollOnExit="false" :clearOnExit="true">
			<template v-if="dialogInited" #pinned-panel>
				<PinnedMessages
					:dialogId="dialogId"
					:messages="[postMessage]"
					@messageClick="onPinnedPostMessageClick"
				/>
			</template>
			<template #message-list>
				<CommentsMessageList :dialogId="dialogId" />
			</template>
		</ChatDialog>
	`
	};

	// @vue/component
	const CommentsTextarea = {
		name: 'CommentsTextarea',
		components: {
			ChatTextarea: im_v2_component_textarea.ChatTextarea
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		template: `
		<ChatTextarea
			:dialogId="dialogId"
			:withMarket="false"
			:withKeyboardNavigation="true"
			class="bx-im-comments-send-panel__container"
		/>
	`
	};

	const CommentsContent = {
		name: 'CommentsContent',
		components: {
			BaseChatContent: im_v2_component_content_elements.BaseChatContent,
			CommentsHeader,
			CommentsDialog,
			CommentsTextarea,
			ChannelSubscribeBar
		},
		inject: {
			chatDetailFocusContext: {
				from: im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT,
				default: null
			}
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			contextId: {
				type: Number,
				default: 0
			},
			channelId: {
				type: String,
				required: true
			}
		},
		// The layer over the chat is a walk of its own, and it lasts exactly as long as this content is on
		// screen: the detail belongs to the layer while it shows and goes back to the base one when it goes.
		mounted() {
			this.getFocusContext()?.setActiveLayer(im_v2_lib_a11y.DetailLayer.comments);
		},
		beforeUnmount() {
			this.getFocusContext()?.setActiveLayer(im_v2_lib_a11y.DetailLayer.base);
		},
		methods: {
			getFocusContext() {
				return this.chatDetailFocusContext;
			}
		},
		template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<CommentsHeader :dialogId="dialogId" :channelId="channelId" :key="dialogId" />
			</template>
			<template #dialog>
				<CommentsDialog :dialogId="dialogId" :contextId="contextId" :key="dialogId" />
			</template>
			<template #join-panel>
				<ChannelSubscribeBar :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #textarea>
				<CommentsTextarea :dialogId="dialogId" :key="dialogId" />
			</template>
		</BaseChatContent>
	`
	};

	// @vue/component
	const CommentsOpener = {
		name: 'CommentsOpener',
		components: {
			CommentsContent
		},
		props: {
			postId: {
				type: Number,
				required: true
			},
			contextId: {
				type: Number,
				default: 0
			},
			channelId: {
				type: String,
				required: true
			}
		},
		emits: ['close'],
		data() {
			return {};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/getByChatId'](this.commentsChatId);
			},
			commentInfo() {
				return this.$store.getters['messages/comments/getByMessageId'](this.postId);
			},
			commentsChatId() {
				return this.commentInfo.chatId;
			},
			commentsDialogId() {
				if (!this.dialog) {
					return '';
				}
				return this.dialog.dialogId;
			}
		},
		created() {
			this.onCreated();
		},
		methods: {
			async onCreated() {
				await this.loadChat();
				im_v2_lib_analytics.Analytics.getInstance().onOpenChat(this.dialog);
			},
			async loadChat() {
				im_v2_lib_logger.Logger.warn(`CommentsContent: loading comments for post ${this.postId}`);
				await this.getChatService().loadComments(this.postId).catch(() => {
					this.$emit('close');
				});
				im_v2_lib_logger.Logger.warn(`CommentsContent: comments for post ${this.postId} are loaded`);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			}
		},
		template: `
		<div class="bx-im-content-comments__container">
			<CommentsContent :dialogId="commentsDialogId" :contextId="contextId" :channelId="channelId" />
		</div>
	`
	};

	// @vue/component
	const ChatContent = {
		name: 'ChatContent',
		components: {
			ChatOpener,
			CommentsOpener
		},
		props: {
			entityId: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				commentsPostId: 0,
				commentsContextId: 0,
				commentsAnimationFlag: false,
				isLowerLayerIsolated: false
			};
		},
		computed: {
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			showComments() {
				return this.$store.getters['messages/comments/areOpened'];
			},
			/**
			 * `inert` already takes the covered content out of the walk and out of the accessibility tree,
			 * and the explicit attribute keeps the second half true whatever the browser has made of `inert`.
			 * Nothing focusable is left under it, so the region carries no unreachable stop either.
			 */
			lowerLayerAriaHidden() {
				return this.isLowerLayerIsolated ? 'true' : null;
			}
		},
		watch: {
			layout() {
				// The chat that opens owns its own focus - its text field autofocuses on its own - so the
				// layer only goes away here and asks nobody to put the focus back into the chat just left.
				this.dropCommentsLayer();
			}
		},
		created() {
			// Not in data(): the guard of ALG-04 belongs to one close and the template knows nothing of it.
			this.isClosingComments = false;
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.closeComments, this.onCloseComments);
			this.getEmitter().subscribe(im_v2_const.EventType.dialog.openComments, this.onOpenComments);
			this.getEmitter().subscribe(im_v2_const.EventType.dialog.closeComments, this.onCloseComments);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.dialog.closeComments, this.onCloseComments);
			this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.openComments, this.onOpenComments);
			this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.closeComments, this.onCloseComments);
		},
		methods: {
			onOpenComments(event) {
				const {
					messageId,
					contextId = 0
				} = event.getData();
				this.commentsPostId = messageId;
				this.commentsContextId = contextId;
				this.commentsAnimationFlag = true;
				// The layer covers the chat entirely, so the content under it stops being part of the page
				// for the keyboard and for the accessibility tree alike - a deep link opening included.
				this.isLowerLayerIsolated = true;
				this.$store.dispatch('messages/comments/setOpened', {
					channelDialogId: this.entityId,
					commentsPostId: this.commentsPostId
				});
			},
			onCloseComments() {
				void this.closeComments();
			},
			/**
			 * ALG-04. The Back button of the layer and the Escape of the shared manager both arrive here, and
			 * the second of them finds the close already under way: one gesture closes the layer once.
			 */
			async closeComments() {
				if (this.isClosingComments || !this.showComments) {
					return;
				}
				this.isClosingComments = true;
				try {
					await this.revealLowerLayer();
					await this.delegateCloseToCommentsOwner();
				} finally {
					this.dropCommentsLayer();
					this.isClosingComments = false;
				}
			},
			// The content under the layer has to be able to hold the focus again before anybody looks for a
			// target inside it, so the isolation goes first and the DOM is really rid of it before the handover.
			async revealLowerLayer() {
				this.isLowerLayerIsolated = false;
				await this.$nextTick();
			},
			/**
			 * The layer belongs to its opener: the initiator of the opening, the hierarchy of fallback targets
			 * and the moment the focus goes back are all its own. This composition hands the close over and
			 * waits for it, and it never places the focus itself - so there is no second hierarchy to disagree.
			 */
			async delegateCloseToCommentsOwner() {
				const owner = this.$refs.commentsOpener;
				if (!main_core.Type.isFunction(owner?.closeAndRestoreFocus)) {
					return;
				}
				await owner.closeAndRestoreFocus();
			},
			// The state close of the layer, and nothing else: no focus is moved from here.
			dropCommentsLayer() {
				this.commentsPostId = 0;
				this.commentsContextId = 0;
				this.isLowerLayerIsolated = false;
				this.$store.dispatch('messages/comments/setClosed');
			},
			onCommentsAnimationEnd() {
				this.commentsAnimationFlag = false;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<ChatOpener
			:dialogId="entityId"
			:class="{'--comments-show-animation': commentsAnimationFlag}"
			:inert="isLowerLayerIsolated"
			:aria-hidden="lowerLayerAriaHidden"
		/>
		<Transition name="comments-content" @after-enter="onCommentsAnimationEnd">
			<CommentsOpener
				v-if="showComments"
				ref="commentsOpener"
				:postId="commentsPostId"
				:contextId="commentsContextId"
				:channelId="entityId"
			/>
		</Transition>
	`
	};

	exports.AiAssistantBotContent = AiAssistantBotContent;
	exports.AiAssistantEmptyStateView = AiAssistantEmptyStateView;
	exports.AiAssistantSuggestionDesign = AiAssistantSuggestionDesign;
	exports.ChatContent = ChatContent;
	exports.CopilotContent = CopilotContent;
	exports.CopilotTextarea = CopilotTextarea;

})(this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}, BX, BX.Event, BX.Messenger.v2.Const, BX.UI.Notification, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component, BX.UI.IconSet, BX.UI.System.Chip.Vue, BX.AiAssistant, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Dialog, BX.Messenger.v2.Service, BX.Vue3.Components, BX.UI.IconSet, window, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.EntitySelector, BX.Main, BX.UI.Dialogs, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Animation, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Vue3.Directives, BX.UI.System, BX.AI, BX.Messenger.v2.Lib, BX.UI.Accessibility, BX.Messenger.v2.Service, BX.SidePanel, BX.Tasks.V2.Lib, BX.Messenger.v2.Lib, BX.IM.V2.Lib, BX.Messenger.v2.Application, BX.Tasks.V2.Application, BX.Messenger.v2.Lib, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.UI.Vue3.Components, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component, BX.Messenger.v2.Lib);
//# sourceMappingURL=chat-content.bundle.js.map
