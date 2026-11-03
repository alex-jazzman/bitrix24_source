import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { hint } from 'ui.vue3.directives.hint';

import { Messenger } from 'im.public';
import { LocalStorageKey, ChatType } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { PromoManager } from 'im.v2.lib.promo';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelChat } from 'im.v2.model';

import { CallTypes } from 'call.const';
import { CallAI } from 'call.core';
import { Analytics } from 'call.lib.analytics';
import { CallManager } from 'call.lib.call-manager';

import { CallMenu } from './classes/call-menu';
import { CallButtonPromo } from './components/call-button-promo';
import { CallButtonTitle } from './components/call-button-title';
import { PulseAnimation } from './components/pulse-animation/pulse-animation';

import './css/call-button.css';

const PROMO_SHOW_DELAY_MS = 20000;

// v-hint payload; kept local because ui.vue3's HintParams/PopupOptions are stricter than the runtime accepts
type LimitHintContent = {
	text: string,
	popupOptions: {
		bindOptions: { position: string },
		angle: { position: string },
		targetContainer: HTMLElement,
		offsetLeft: number,
		offsetTop: number,
	},
};

export const CallButton = defineComponent({
	directives: { hint },
	components: { CallButtonTitle, CallButtonPromo, PulseAnimation },
	props: {
		dialog: {
			type: Object as PropType<ImModelChat>,
			required: true,
		},
		compactMode: {
			type: Boolean,
			default: false,
		},
	},
	data()
	{
		return {
			lastCallType: '',
			isMenuOpen: false,
			copilotMinUserLimit: CallAI.recordingMinUsers,
			isCopilotActive: CallAI.serviceEnabled,
			isMarketSubscriptionActive: CallAI.marketSubscriptionEnabled,
			isTariffAvailable: CallAI.tariffAvailable,
			showPromo: false,
			showPromoTimer: null as ReturnType<typeof setTimeout> | null,
			promoId: 'call:copilot-call-button:29102024:all',
			// menu instance is cached lazily and kept non-reactive via markRaw
			callMenu: null as CallMenu | null,
		};
	},
	computed: {
		dialogId(): string
		{
			return this.dialog.dialogId;
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
		userCount(): number
		{
			return this.dialog.userCounter;
		},
		isConference(): boolean
		{
			return this.dialog.type === ChatType.videoconf;
		},
		callButtonText(): string
		{
			let locCode = CallTypes[this.lastCallType as keyof typeof CallTypes].locCode;

			if (this.hasActiveCurrentCall)
			{
				locCode = 'CALL_CHAT_HEADER_BUTTON_RETURN_TO_CALL_TEXT';
			}

			return this.loc(locCode);
		},
		hasActiveCurrentCall(): boolean
		{
			return CallManager.getInstance().hasActiveCurrentCall(this.dialogId);
		},
		hasActiveAnotherCall(): boolean
		{
			return CallManager.getInstance().hasActiveAnotherCall(this.dialogId);
		},
		isActive(): boolean
		{
			if (this.hasActiveCurrentCall)
			{
				return true;
			}

			if (this.hasActiveAnotherCall)
			{
				return false;
			}

			return CallManager.getInstance().chatCanBeCalled(this.dialogId);
		},
		userLimit(): number
		{
			return CallManager.getInstance().getCallUserLimit();
		},
		isChatUserLimitExceeded(): boolean
		{
			return CallManager.getInstance().isChatUserLimitExceeded(this.dialogId);
		},
		shouldShowMenu(): boolean
		{
			return this.isActive;
		},
		limitHintText(): string
		{
			return this.loc('CALL_LIB_CALL_USER_LIMIT_EXCEEDED_TOOLTIP', { '#USER_LIMIT#': String(this.userLimit) });
		},
		limitHintId(): string
		{
			// unique per chat so aria-describedby never collides across button instances
			return `bx-call-chat-header-call-button-limit-hint-${this.chatId}`;
		},
		hintContent(): LimitHintContent | null
		{
			if (!this.isChatUserLimitExceeded)
			{
				return null;
			}

			return {
				text: this.limitHintText,
				popupOptions: {
					bindOptions: {
						position: 'bottom',
					},
					angle: { position: 'top' },
					targetContainer: document.body,
					offsetLeft: 63,
					offsetTop: 0,
				},
			};
		},
		isCopilotCall(): boolean
		{
			return (
				this.isCopilotActive
				&& this.userCount >= this.copilotMinUserLimit
				&& !this.isConference
				&& this.isTariffAvailable
				&& this.isMarketSubscriptionActive
			);
		},
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		callButtonContainerClasses(): string[]
		{
			return [
				'--ui-context-content-light',
				'bx-call-chat-header-call-button__scope',
				'bx-call-chat-header-call-button__container',
				...(this.isAirDesignEnabled ? ['--air'] : []),
				...(this.isConference ? ['--conference'] : []),
				...(this.isCopilotCall && !this.hasActiveCurrentCall ? ['--copilot'] : []),
				...(this.isActive ? [] : ['--disabled']),
				...(this.hasActiveCurrentCall ? ['--return'] : []),
			];
		},
		canShowPromo(): boolean
		{
			return (
				this.isCopilotCall
				&& PromoManager.getInstance().needToShow(this.promoId)
				&& !this.hasActiveCurrentCall
				&& this.isActive
			);
		},
	},
	watch: {
		hasActiveCurrentCall(isActive: boolean)
		{
			if (!isActive)
			{
				return;
			}

			// the chevron the menu is anchored to leaves the markup once the call becomes the
			// current one, so a menu left open has to go with it. Focus is not touched here:
			// the call window is the one that takes it
			if (this.isMenuOpen)
			{
				this.getCallMenu().close();
			}
		},
	},
	created()
	{
		this.lastCallType = this.getLastCallChoice();
		this.subscribeToMenuEvents();
		EventEmitter.subscribe('BX.Call.View:onShow', this.onShowCallView);
	},
	mounted()
	{
		this.showPromoTimer = setTimeout(() => {
			this.showPromo = this.canShowPromo;
		}, PROMO_SHOW_DELAY_MS);
	},
	beforeUnmount()
	{
		this.clearShowPromoTimer();
		this.showPromo = false;
		EventEmitter.unsubscribe('BX.Call.View:onShow', this.onShowCallView);
	},
	methods: {
		startVideoCall()
		{
			if (!this.isActive)
			{
				return;
			}

			void Messenger.startVideoCall(this.dialogId);
		},
		subscribeToMenuEvents()
		{
			const menu = this.getCallMenu();
			menu.subscribe(CallMenu.events.onMenuItemClick, (event) => {
				const { id: callTypeId } = event.getData();
				this.saveLastCallChoice(callTypeId);
			});
			// focus restore on close belongs to the platform menu; here we only reset the disclosure state
			menu.subscribe(CallMenu.events.close, () => {
				this.isMenuOpen = false;
			});
		},
		onShowCallView()
		{
			this.onClosePromo();
		},
		onButtonClick()
		{
			if (!this.isActive)
			{
				return;
			}

			if (this.isCopilotCall)
			{
				this.onClosePromo();
			}

			Analytics.getInstance().onChatHeaderStartCallClick({
				dialog: this.dialog,
				callType: this.lastCallType,
			});

			CallTypes[this.lastCallType as keyof typeof CallTypes].start(this.dialogId);
		},
		onMenuClick()
		{
			if (!this.shouldShowMenu)
			{
				return;
			}
			this.getCallMenu().openMenu(this.dialog, this.$refs.menu as HTMLElement);
			this.isMenuOpen = true;
		},
		onStartConferenceClick()
		{
			if (!this.isActive)
			{
				return;
			}

			if (this.isCopilotCall)
			{
				this.onClosePromo();
			}

			Analytics.getInstance().onStartConferenceClick({ chatId: String(this.chatId) });

			void Messenger.openConference({ code: this.dialog.public.code });
		},
		getLastCallChoice(): string
		{
			return LocalStorageManager.getInstance().get(LocalStorageKey.lastCallType, CallTypes.video.id);
		},
		saveLastCallChoice(callTypeId: string)
		{
			this.lastCallType = callTypeId;
			LocalStorageManager.getInstance().set(LocalStorageKey.lastCallType, callTypeId);
		},
		getCallMenu(): CallMenu
		{
			if (!this.callMenu)
			{
				this.callMenu = markRaw(new CallMenu());
			}

			return this.callMenu as CallMenu;
		},
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return Loc.getMessage(phraseCode, replacements) ?? '';
		},
		onClosePromo()
		{
			this.clearShowPromoTimer();
			this.showPromo = false;
			void PromoManager.getInstance().markAsWatched(this.promoId);
		},
		clearShowPromoTimer()
		{
			clearTimeout(this.showPromoTimer ?? undefined);
			this.showPromoTimer = null;
		},
	},
	/*
	 * The `tabindex="0"` of the three buttons is not redundant, so do not drop it as such: WebKit keeps a
	 * native <button> out of the sequential walk until it has a tabindex of its own, because "Full keyboard
	 * access" is off by default on macOS. Without it Safari steps over the main action of the chat header
	 * altogether. In Chromium and Firefox it changes nothing - the order stays the DOM order.
	 *
	 * The buttons are marked `aria-disabled` rather than `disabled` when the call cannot be started, i.e.
	 * they stay focusable on purpose; the tabindex does not touch that state.
	 */
	template: `
		<PulseAnimation :showPulse="showPromo" :isConference="isConference">
			<div
				v-if="isConference"
				:class="callButtonContainerClasses"
				ref="call-button"
				data-testid="im-call-header-call-btn"
			>
				<button
					type="button"
					tabindex="0"
					class="bx-call-chat-header-call-button__action"
					data-testid="im-call-header-call-btn-conference"
					:aria-label="loc('IM_CONTENT_CHAT_HEADER_START_CONFERENCE')"
					:aria-disabled="isActive ? null : 'true'"
					@click="onStartConferenceClick"
				>
					<CallButtonTitle :compactMode="compactMode" :copilotMode="isCopilotCall" :text="loc('IM_CONTENT_CHAT_HEADER_START_CONFERENCE')" />
				</button>
			</div>
			<div
				v-else
				:class="callButtonContainerClasses"
				ref="call-button"
				data-testid="im-call-header-call-btn"
			>
				<button
					type="button"
					tabindex="0"
					class="bx-call-chat-header-call-button__action"
					data-testid="im-call-header-call-btn-action"
					:aria-label="callButtonText"
					:aria-disabled="isActive ? null : 'true'"
					:aria-describedby="isChatUserLimitExceeded ? limitHintId : null"
					v-hint="hintContent"
					@click="onButtonClick"
					ref="action"
				>
					<CallButtonTitle :showIcon="!hasActiveCurrentCall" :compactMode="compactMode" :copilotMode="isCopilotCall" :text="callButtonText" />
				</button>
				<div v-if="!hasActiveCurrentCall" class="bx-call-chat-header-call-button__separator"></div>
				<button
					v-if="!hasActiveCurrentCall"
					type="button"
					tabindex="0"
					class="bx-call-chat-header-call-button__chevron_button"
					data-testid="im-call-header-call-btn-chevron"
					:aria-label="loc('CALL_CONTENT_CHAT_HEADER_CALL_TYPE_MENU_ARIA')"
					:aria-disabled="isActive ? null : 'true'"
					aria-haspopup="menu"
					:aria-expanded="isMenuOpen"
					@click.stop="onMenuClick"
					ref="menu"
				>
					<span class="bx-call-chat-header-call-button__chevron" aria-hidden="true"></span>
				</button>
				<span
					v-if="isChatUserLimitExceeded"
					:id="limitHintId"
					class="bx-call-chat-header-call-button__sr-only"
				>{{ limitHintText }}</span>
			</div>
			<CallButtonPromo
				v-if="showPromo"
				:bindElement="$refs['call-button']"
				@close="onClosePromo"
			/>
		</PulseAnimation>
	`,
});
