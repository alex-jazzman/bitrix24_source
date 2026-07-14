import { TariffManager } from 'im.v2.lib.feature';
import { Analytics } from 'im.v2.lib.analytics';
import { type ImModelChat } from 'im.v2.model';

import './tariff-limit.css';

// @vue/component
export const TariffLimit = {
	name: 'TariffLimit',
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		panel: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		title(): string
		{
			return TariffManager.chatHistory.getLimitTitle();
		},
		preparedDescription(): string
		{
			return TariffManager.chatHistory.getLimitSubtitle(true)
				.replace('[action_emphasis]', '<em class="bx-im-sidebar-elements-tariff-limit__description-accent">')
				.replace('[/action_emphasis]', '</em>');
		},
		tooltipText(): string
		{
			return TariffManager.chatHistory.getTooltipText();
		},
	},
	watch:
	{
		dialogId()
		{
			this.sendAnalyticsOnCreate();
		},
		panel()
		{
			this.sendAnalyticsOnCreate();
		},
	},
	created()
	{
		this.sendAnalyticsOnCreate();
	},
	methods:
	{
		onDetailClick()
		{
			this.sendAnalyticsOnClick();
			TariffManager.chatHistory.openFeatureSlider();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		sendAnalyticsOnClick()
		{
			Analytics.getInstance().historyLimit.onSidebarBannerClick({
				dialogId: this.dialogId,
				panel: this.panel,
			});
		},
		sendAnalyticsOnCreate()
		{
			Analytics.getInstance().historyLimit.onSidebarLimitExceeded({
				dialogId: this.dialogId,
				panel: this.panel,
			});
		},
	},
	template: `
		<div
			class="bx-im-sidebar-elements-tariff-limit__container"
			:title="tooltipText"
			@click="onDetailClick"
		>
			<div class="bx-im-sidebar-elements-tariff-limit__header">
				<div class="bx-im-sidebar-elements-tariff-limit__title-container">
					<div class="bx-im-sidebar-elements-tariff-limit__icon"></div>
					<div class="bx-im-sidebar-elements-tariff-limit__title --line-clamp-2">{{ title }}</div>
				</div>
				<div class="bx-im-sidebar-elements-tariff-limit__arrow bx-im-sidebar__forward-green-icon"></div>
			</div>
			<div class="bx-im-sidebar-elements-tariff-limit__delimiter"></div>
			<div class="bx-im-sidebar-elements-tariff-limit__content">
				<div class="bx-im-sidebar-elements-tariff-limit__description" v-html="preparedDescription"></div>
			</div>
		</div>
	`,
};
