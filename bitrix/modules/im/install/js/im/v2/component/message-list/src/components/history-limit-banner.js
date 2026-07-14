import { Analytics } from 'im.v2.lib.analytics';
import { TariffManager } from 'im.v2.lib.feature';

import '../css/history-limit-banner.css';

// @vue/component
export const HistoryLimitBanner = {
	name: 'HistoryLimitBanner',
	props:
	{
		noMessages: {
			type: Boolean,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		title(): string
		{
			return TariffManager.chatHistory.getLimitTitle();
		},
		subtitle(): string
		{
			return TariffManager.chatHistory.getLimitSubtitle();
		},
		buttonText(): string
		{
			return TariffManager.chatHistory.getLearnMoreText();
		},
	},
	mounted()
	{
		this.sendAnalytics();
	},
	methods:
	{
		onButtonClick(): void
		{
			Analytics.getInstance().historyLimit.onDialogBannerClick({ dialogId: this.dialogId });
			TariffManager.chatHistory.openFeatureSlider();
		},
		sendAnalytics()
		{
			Analytics.getInstance().historyLimit.onDialogLimitExceeded({
				dialogId: this.dialogId,
				noMessages: this.noMessages,
			});
		},
	},
	// language=Vue
	template: `
		<div class="bx-im-message-list-history-banner__container" :class="{'--no-messages': noMessages}">
			<div class="bx-im-message-list-history-banner__left">
				<div class="bx-im-message-list-history-banner__title">
					<div class="bx-im-message-list-history-banner__icon bx-im-messenger__lock-icon"></div>
					<div class="bx-im-message-list-history-banner__title_text --ellipsis" :title="title">
						{{ title }}
					</div>
				</div>
				<div class="bx-im-message-list-history-banner__subtitle --line-clamp-2" :title="subtitle">
					{{ subtitle }}
				</div>
			</div>
			<div class="bx-im-message-list-history-banner__right">
				<div class="bx-im-message-list-history-banner__button" @click="onButtonClick">
					{{ buttonText }}
				</div>
			</div>
		</div>
	`,
};
