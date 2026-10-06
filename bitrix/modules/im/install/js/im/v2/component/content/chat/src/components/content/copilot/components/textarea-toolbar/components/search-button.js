import { SliderCode } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Runtime } from 'main.core';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Logger } from 'im.v2.lib.logger';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { ChipDesign, ChipSize, Chip } from 'ui.system.chip.vue';

import { ToolbarHint } from './toolbar-hint';

// @vue/component
export const SearchButton = {
	name: 'SearchButton',
	components: { Chip, ToolbarHint },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		isExpanded: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		ChipDesign: () => ChipDesign,
		ChipSize: () => ChipSize,
		isActive(): boolean
		{
			return this.$store.getters['copilot/chats/isForceSearchEnabled'](this.dialogId);
		},
		isDisabledByTariff(): boolean
		{
			return !FeatureManager.isFeatureAvailable(Feature.isCopilotWebSearchAllowedByTariff);
		},
		isDisabledByAdmin(): boolean
		{
			return !FeatureManager.isFeatureAvailable(Feature.isCopilotWebSearchEnabledByAdmin);
		},
		isDisabled(): boolean
		{
			return this.isDisabledByAdmin;
		},
		chipText(): string
		{
			return this.loc('IM_CONTENT_COPILOT_SEARCH_BUTTON');
		},
		hintText(): string
		{
			if (this.isDisabledByAdmin)
			{
				return this.loc('IM_CONTENT_COPILOT_SEARCH_DISABLED_BY_ADMIN');
			}

			return this.loc('IM_CONTENT_COPILOT_SEARCH_BUTTON');
		},
		isHintEnabled(): boolean
		{
			return this.isDisabledByAdmin || !this.isExpanded;
		},
		design(): string
		{
			if (this.isDisabled)
			{
				return ChipDesign.Disabled;
			}

			if (this.isActive)
			{
				return ChipDesign.OutlineBitrixGpt;
			}

			return ChipDesign.Outline;
		},
	},
	methods: {
		onClick()
		{
			if (this.isDisabledByAdmin)
			{
				return;
			}

			this.$store.dispatch('copilot/chats/toggleForceSearch', this.dialogId);
			Analytics.getInstance().copilot.onChangeForceSearch(this.dialogId);
		},
		openTariffSlider()
		{
			Runtime.loadExtension('ui.info-helper').then((exports) => {
				const { FeaturePromotersRegistry } = exports;
				const promoter = FeaturePromotersRegistry.getPromoter({
					code: SliderCode.buyMarketPlus,
				});
				promoter.show();
			}).catch((error) => {
				Logger.error('AiAssitantSearchButton: error loading info-helper extension', error);
			});
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
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
	`,
};
