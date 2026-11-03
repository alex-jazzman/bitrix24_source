import { type JsonObject } from 'main.core';

import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { ActionByRole, UserRole } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { ChatService } from 'im.v2.provider.service.chat';
import { type ImModelChat } from 'im.v2.model';

import '../css/subscribe-bar.css';

export const SubscribeStatus = Object.freeze({
	idle: 'idle',
	subscribing: 'subscribing',
	error: 'error',
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
export const ChannelSubscribeBar = {
	name: 'ChannelSubscribeBar',
	components: { UiButton, BIcon },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			status: SubscribeStatus.idle,
			scrolled: false,
			textDismissed: false,
			morphWidth: null,
		};
	},
	computed:
	{
		ButtonSize: () => ButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		Outline: () => Outline,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isSubscribed(): boolean
		{
			return this.dialog.role !== UserRole.guest;
		},
		// joinChat меняет роль оптимистично — до ответа сервера показываем лоудер, а не «подписан»
		showSubscribedState(): boolean
		{
			return this.isSubscribed && this.status !== SubscribeStatus.subscribing;
		},
		isSubscribing(): boolean
		{
			return this.status === SubscribeStatus.subscribing;
		},
		hasError(): boolean
		{
			return this.status === SubscribeStatus.error;
		},
		compact(): boolean
		{
			return this.scrolled || (this.showSubscribedState && this.textDismissed);
		},
		compactReserveActive(): boolean
		{
			return this.showSubscribedState && this.textDismissed;
		},
		showCallText(): boolean
		{
			return !this.showSubscribedState && !this.hasError;
		},
		hintText(): string
		{
			if (this.areCommentsAvailable)
			{
				return this.loc('IM_CONTENT_CHANNEL_JOIN_PANEL_HINT');
			}

			return this.loc('IM_CONTENT_CHANNEL_JOIN_PANEL_HINT_NO_COMMENTS');
		},
		areCommentsAvailable(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.openComments, this.dialogId);
		},
		subscribedHintText(): string
		{
			if (this.isMuted)
			{
				return this.loc('IM_CONTENT_CHANNEL_SUBSCRIBED_HINT_MUTED');
			}

			return this.loc('IM_CONTENT_CHANNEL_SUBSCRIBED_HINT');
		},
		isMuted(): boolean
		{
			return this.dialog.isMuted;
		},
		subscribeButtonText(): string
		{
			if (this.hasError)
			{
				return this.loc('IM_CONTENT_CHANNEL_SUBSCRIBE_RETRY');
			}

			return this.loc('IM_CONTENT_BLOCKED_TEXTAREA_JOIN_CHANNEL_V2');
		},
		subscribeButtonIcon(): ?string
		{
			return this.hasError ? Outline.REFRESH : null;
		},
		// в покое ширина естественная; px фиксируется только на время лоудера/ошибки,
		// чтобы лоудер держал ширину кнопки-источника, а «Повторить» анимированно сжимался
		morphStyle(): Object
		{
			if (!this.morphWidth)
			{
				return {};
			}

			return { width: `${this.morphWidth}px` };
		},
	},
	watch:
	{
		isSubscribed(subscribed: boolean)
		{
			// откат оптимистичной роли при неудачном join тоже приходит сюда — его обрабатывает onSubscribeClick
			if (!subscribed && !this.isSubscribing)
			{
				this.status = SubscribeStatus.idle;
				this.textDismissed = false;
				this.morphWidth = null;
			}
		},
		showSubscribedState()
		{
			this.checkTextDismissal();
		},
		scrolled()
		{
			this.checkTextDismissal();
		},
		compactReserveActive()
		{
			this.updateFeedReserve();
		},
	},
	mounted()
	{
		void this.$nextTick(() => {
			this.attachFeedListener();
			this.initFeedReserve();
		});
	},
	beforeUnmount()
	{
		this.detachFeedListener();
		this.clearFeedReserve();
	},
	methods:
	{
		async onSubscribeClick(): Promise<void>
		{
			if (this.isSubscribing || this.showSubscribedState)
			{
				return;
			}

			this.freezeMorphWidth();
			this.status = SubscribeStatus.subscribing;

			const isSuccess = await this.getChatService().joinChat(this.dialogId);
			this.status = isSuccess ? SubscribeStatus.idle : SubscribeStatus.error;
			if (!isSuccess)
			{
				this.morphToRetryWidth();
			}
		},
		// лоудер не должен менять габариты — ширина замораживается по факту отрисовки,
		// а не по предварительному замеру (шрифт мог доехать позже)
		freezeMorphWidth()
		{
			const currentWidth = this.$refs['morph']?.offsetWidth;
			if (currentWidth > 0)
			{
				this.morphWidth = currentWidth;
			}
		},
		morphToRetryWidth()
		{
			void this.$nextTick(() => {
				const retryWidth = this.$refs['retry-probe']?.offsetWidth;
				if (retryWidth > 0)
				{
					this.morphWidth = retryWidth;
				}
			});
		},
		onMuteClick()
		{
			if (this.isMuted)
			{
				this.getChatService().unmuteChat(this.dialogId);

				return;
			}

			this.getChatService().muteChat(this.dialogId);
		},
		checkTextDismissal()
		{
			if (this.showSubscribedState && this.scrolled)
			{
				this.textDismissed = true;
			}
		},
		attachFeedListener()
		{
			this.detachFeedListener();
			this.feedElement = this.getContentElement()?.querySelector('.bx-im-dialog-chat__scroll-container');
			if (!this.feedElement)
			{
				return;
			}

			this.feedElement.addEventListener('scroll', this.onFeedScroll, { passive: true });
			this.onFeedScroll();
		},
		detachFeedListener()
		{
			this.feedElement?.removeEventListener('scroll', this.onFeedScroll);
			this.feedElement = null;
		},
		onFeedScroll()
		{
			const feed = this.feedElement;
			if (!feed)
			{
				return;
			}

			const distanceToBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
			this.scrolled = distanceToBottom > SCROLL_BOTTOM_THRESHOLD;
		},
		initFeedReserve()
		{
			this.getContentElement()?.classList.add(CONTENT_WITH_BAR_CLASS);
			// высота бара оседает асинхронно (шрифты, стили кнопки) — держим резерв в синхроне
			this.resizeObserver = new ResizeObserver(() => this.updateFeedReserve());
			this.resizeObserver.observe(this.$el);
			this.updateFeedReserve();
		},
		updateFeedReserve()
		{
			const contentElement = this.getContentElement();
			if (!contentElement)
			{
				return;
			}

			const reserve = this.compactReserveActive
				? COMPACT_FEED_RESERVE
				: this.$el.offsetHeight + FEED_RESERVE_GAP
			;
			contentElement.style.setProperty(FEED_RESERVE_PROPERTY, `${reserve}px`);
		},
		clearFeedReserve()
		{
			this.resizeObserver?.disconnect();
			this.resizeObserver = null;

			const contentElement = this.getContentElement();
			if (!contentElement)
			{
				return;
			}

			contentElement.classList.remove(CONTENT_WITH_BAR_CLASS);
			contentElement.style.removeProperty(FEED_RESERVE_PROPERTY);
		},
		getContentElement(): ?HTMLElement
		{
			return this.$el?.closest?.('.bx-im-content-chat__content');
		},
		getChatService(): ChatService
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			return this.chatService;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
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
	`,
};
