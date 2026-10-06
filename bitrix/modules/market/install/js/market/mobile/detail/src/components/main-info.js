import { Text } from 'ui.system.typography.vue';
import { RatingStars } from 'market.mobile.rating-stars';

export const MainInfo = {
	components: {
		Text,
		RatingStars,
	},
	props: {
		app: {
			type: Object,
			default: () => ({}),
		},
	},
	template: `
		<div class="market-mobile-detail-page__main-info">
			<div class="market-mobile-detail-page__main-info-item">
				<Text
					tag="div"
					size="2xs"
					className="market-mobile-detail-page__main-info-title"
					transform="uppercase"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_RATING') }}
				</Text>
				<RatingStars 
					:rating="app?.REVIEWS?.RATING?.RATING"
					:starSize="14"
				/>
			</div>
			<div class="market-mobile-detail-page__main-info-item">
				<Text
					tag="div"
					size="2xs"
					className="market-mobile-detail-page__main-info-title"
					transform="uppercase"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_RATING_COUNT') }}
				</Text>
				<Text tag="div" size="sm">
					{{ app?.REVIEWS?.RATING?.COUNT || 0 }}
				</Text>
			</div>
			<div class="market-mobile-detail-page__main-info-item">
				<Text
					tag="div"
					size="2xs"
					className="market-mobile-detail-page__main-info-title"
					transform="uppercase"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_INSTALLS') }}
				</Text>
				<Text tag="div" size="sm">
					{{ app?.NUM_INSTALLS }}
				</Text>
			</div>
		</div>
	`,
};
