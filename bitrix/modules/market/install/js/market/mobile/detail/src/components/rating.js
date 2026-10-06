import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Text, Headline } from 'ui.system.typography.vue';
import { RatingStars } from 'market.mobile.rating-stars';

export const Rating = {
	components: {
		Text,
		Headline,
		UiButton,
		RatingStars,
	},
	props: {
		reviews: {
			type: Object,
			default: () => ({}),
		},
	},
	data()
	{
		return {
			buttonSizeExtraSmall: ButtonSize.EXTRA_SMALL,
			buttonStyleOutline: AirButtonStyle.OUTLINE,
		};
	},
	computed: {
		totalRating(): number
		{
			if (this.reviews?.RATING && this.reviews?.RATING?.RATING)
			{
				return this.reviews.RATING.RATING;
			}

			return 0;
		},
		totalCountMessage(): String
		{
			let num = 0;

			if (this.reviews?.RATING && this.reviews?.RATING?.COUNT)
			{
				num = this.reviews.RATING.COUNT;
			}

			return this.$Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_RATING_COUNT_WITH_NUM', {
				'#NUM#': num,
			});
		},
	},
	methods: {
		openAllReviews()
		{
			alert('TODO');
		},
	},
	template: `
		<div class="market-mobile-detail__rating-reviews">
			<Text tag="div" size="md" class="market-mobile-detail__rating-reviews-title">
				{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_REVIEWS_AND_RATINGS') }}
			</Text>
			<UiButton
				:text="$Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_ALL')"
				:size="buttonSizeExtraSmall"
				:style="buttonStyleOutline"
				@click="openAllReviews"
			/>
		</div>
		<div class="market-mobile-detail__rating-wrap">
			<div class="market-mobile-detail__rating-number">
				<span class="market-mobile-detail__rating-number-current">{{ totalRating }}</span>
				<span class="market-mobile-detail__rating-number-all">/5</span>
			</div>

			<div class="market-mobile-detail__rating-info">
				<RatingStars
					:rating="reviews?.RATING?.RATING"
					:starSize="14"
				/>
				<Text size='sm' tag="div" >
					{{ totalCountMessage }}
				</Text>
			</div>
		</div>
	`,
};
