import { Text } from 'ui.system.typography.vue';

export const AppData = {
	components: {
		Text,
	},
	props: {
		app: {
			type: Object,
			default: () => ({}),
		},
	},
	computed: {
		showCategories()
		{
			return this.app?.CATEGORIES?.length > 0;
		},
	},
	template: `
		<div class="market-mobile-detail__info">
			<div v-if="showCategories" class="market-mobile-detail__info-wrap">
				<Text 
					tag="div" 
					size="md"
					class="market-mobile-detail__info-title"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_CATEGORY') }}
				</Text>
				<Text
					tag="div"
					size="md"
					class="market-mobile-detail__info-desc"
				>
					{{ app.CATEGORIES[0] }}
				</Text>
			</div>
	
			<div class="market-mobile-detail__info-wrap">
				<Text
					tag="div"
					size="md"
					class="market-mobile-detail__info-title"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_PUBLISHED') }}
				</Text>
				<Text
					tag="div"
					size="md"
					class="market-mobile-detail__info-desc"
				>
					{{ app.DATE_PUBLIC }}
				</Text>
			</div>
			<div class="market-mobile-detail__info-wrap">
				<Text
					tag="div"
					size="md"
					class="market-mobile-detail__info-title"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_VERSION') }}
				</Text>
				<Text
					tag="div"
					size="md"
					class="market-mobile-detail__info-desc"
				>
					{{ app.VER}}
				</Text>
			</div>
		</div>
	`,
};
