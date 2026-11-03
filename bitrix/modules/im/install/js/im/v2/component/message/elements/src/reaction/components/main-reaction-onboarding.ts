import { type PopupOptions } from 'main.popup';
import 'ui.icon-set.outline';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { defineComponent, nextTick, type PropType } from 'ui.vue3';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PromoId } from 'im.v2.const';
import { PromoManager } from 'im.v2.lib.promo';

import '../css/main-reaction-onboarding.css';

export type MainReactionOnboardingGeometry = {
	popoverRect: DOMRect,
	selectorRect: DOMRect,
};

type MainReactionOnboardingData = {
	isClosed: boolean,
	isDisplayConfirmed: boolean,
};

type PopupPosition = 'top' | 'bottom';

const POPUP_OFFSET_LEFT = 40;

// @vue/component
export const MainReactionOnboarding = defineComponent({
	name: 'MainReactionOnboarding',
	components: { MessengerPopup, BIcon } as {
		MessengerPopup: typeof MessengerPopup,
		BIcon: typeof BIcon,
	},
	props: {
		geometry: {
			type: Object as PropType<MainReactionOnboardingGeometry | null>,
			default: null,
		},
		messageId: {
			type: [String, Number],
			required: true,
		},
	},
	emits: ['mouseEnter', 'mouseLeave'],
	data(): MainReactionOnboardingData
	{
		return {
			isClosed: false,
			isDisplayConfirmed: false,
		};
	},
	computed: {
		closeIcon(): string
		{
			return Outline.CROSS_M;
		},
		isVisible(): boolean
		{
			return (
				this.geometry !== null
				&& !this.isClosed
				&& (
					this.isDisplayConfirmed
					|| PromoManager.getInstance().needToShow(PromoId.mainReactionOnboarding)
				)
			);
		},
		popupId(): string
		{
			return `im-main-reaction-onboarding-popup-${this.messageId}`;
		},
		position(): PopupPosition
		{
			const { popoverRect, selectorRect } = this.geometry!;

			return popoverRect.bottom <= selectorRect.top ? 'top' : 'bottom';
		},
		width(): number
		{
			return this.geometry!.popoverRect.width;
		},
		config(): PopupOptions
		{
			return {
				bindElement: this.geometry!.popoverRect,
				bindOptions: {
					position: this.position,
				},
				width: this.width,
				...(this.position === 'top' ? { offsetTop: 0 } : {}),
				offsetLeft: POPUP_OFFSET_LEFT,
				angle: true,
				autoHide: true,
				className: 'bx-im-main-reaction-onboarding-popup',
			};
		},
	},
	watch:
	{
		isVisible(isVisible: boolean): void
		{
			if (isVisible && !this.isDisplayConfirmed)
			{
				void this.confirmDisplay();
			}
		},
		geometry(newGeometry: MainReactionOnboardingGeometry | null)
		{
			if (newGeometry)
			{
				this.isClosed = false;
				this.isDisplayConfirmed = false;
			}
		},
	},
	methods:
	{
		async confirmDisplay(): Promise<void>
		{
			await nextTick();
			await new Promise((resolve) => {
				requestAnimationFrame(resolve);
			});

			const content = this.$refs.content as HTMLElement | undefined;
			if (!this.isVisible || !content?.isConnected)
			{
				return;
			}

			this.isDisplayConfirmed = PromoManager.getInstance().confirmShown(
				PromoId.mainReactionOnboarding,
			);
			if (!this.isDisplayConfirmed)
			{
				this.isClosed = true;
			}
		},
		close(): void
		{
			this.isClosed = true;
		},
		complete(): void
		{
			this.isClosed = true;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<MessengerPopup
			v-if="isVisible"
			:id="popupId"
			:config="config"
			@close="close"
		>
			<div
				ref="content"
				class="bx-im-main-reaction-onboarding-popup__container --ui-context-content-light"
				data-testid="im-message-main-reaction-onboarding"
				@mouseenter="$emit('mouseEnter')"
				@mouseleave="$emit('mouseLeave')"
			>
				<div class="bx-im-main-reaction-onboarding-popup__content">
					<div class="bx-im-main-reaction-onboarding-popup__content-title">
						{{ loc('IM_MESSENGER_MESSAGE_REACTION_SELECTOR_MAIN_REACTION_ONBOARDING-PART1') }}
					</div>
					<div class="bx-im-main-reaction-onboarding-popup__content-description">
						{{ loc('IM_MESSENGER_MESSAGE_REACTION_SELECTOR_MAIN_REACTION_ONBOARDING-PART2') }}
					</div>
				</div>
				<button
					type="button"
					class="bx-im-main-reaction-onboarding-popup__close"
					data-testid="im-message-main-reaction-onboarding-close"
					@click="complete"
				>
					<BIcon
						:name="closeIcon"
						color="var(--ui-color-accent-main-primary-alt-2)"
					/>
				</button>
			</div>
		</MessengerPopup>
	`,
});
