import { Event, Loc, Runtime } from 'main.core';
import { shallowRef } from 'ui.vue3';
import { mapGetters } from 'ui.vue3.vuex';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { Notifier } from 'ui.notification-manager';

import { AiCallBannerMode, EventName, Model } from 'booking.const';
import { AiCallBannerAnalytics } from 'booking.lib.analytics';
import { Resolvable } from 'booking.lib.resolvable';
import { mainPageService } from 'booking.provider.service.main-page-service';

export const BannerAiCall = {
	data(): Object
	{
		return {
			bannerComponent: null,
			isBannerActivated: false,
		};
	},
	created(): void
	{
		this.autoCloseTimerId = null;
	},
	computed: {
		...mapGetters({
			aiCallBannerMode: `${Model.Interface}/aiCallBannerMode`,
		}),
	},
	watch: {
		aiCallBannerMode(value: $Values<typeof AiCallBannerMode> | null): void
		{
			if (value === AiCallBannerMode.Invitation && !this.bannerComponent)
			{
				void this.showBanner();
			}
		},
	},
	mounted(): void
	{
		if (this.aiCallBannerMode === AiCallBannerMode.Invitation)
		{
			void this.showBanner();
		}
	},
	methods: {
		async showBanner(): Promise<void>
		{
			BannerDispatcher.high.toQueue(async (onDone) => {
				const { BannerAiCall } = await Runtime.loadExtension('booking.component.banner-ai-call');

				this.bannerComponent = shallowRef(BannerAiCall);

				void mainPageService.registerAiCallBannerShown();
				AiCallBannerAnalytics.sendBannerView();

				this.bannerClosed = new Resolvable();
				await this.bannerClosed;

				onDone();
			});
		},
		closeBanner(): void
		{
			if (this.autoCloseTimerId)
			{
				clearTimeout(this.autoCloseTimerId);
				this.autoCloseTimerId = null;
			}

			if (!this.bannerComponent)
			{
				return;
			}

			this.bannerComponent = null;
			this.bannerClosed?.resolve();
			Event.EventEmitter.emit(EventName.AiCallBannerClosed);
		},
		async onEnable(): Promise<void>
		{
			const result = await mainPageService.switchAllToAiCall();
			if (result === false)
			{
				this.notifyEnableError();
				this.closeBanner();

				return;
			}

			AiCallBannerAnalytics.sendBannerClickStartFlow();

			this.isBannerActivated = true;
			this.autoCloseTimerId = setTimeout(() => this.closeBanner(), 2000);
		},
		onSkip(): void
		{
			AiCallBannerAnalytics.sendBannerCloseSkip();
			this.closeBanner();
		},
		onClose(): void
		{
			if (!this.isBannerActivated)
			{
				AiCallBannerAnalytics.sendBannerCloseCross();
			}
			this.closeBanner();
		},
		notifyEnableError(): void
		{
			Notifier.notify({
				id: 'booking-banner-ai-call-enable-error',
				text: Loc.getMessage('BOOKING_COMPONENT_BANNER_AI_CALL_ENABLE_ERROR'),
			});
		},
	},
	template: `
		<component
			v-if="bannerComponent"
			:is="bannerComponent"
			:activated="isBannerActivated"
			@enable="onEnable"
			@skip="onSkip"
			@close="onClose"
		/>
	`,
};
