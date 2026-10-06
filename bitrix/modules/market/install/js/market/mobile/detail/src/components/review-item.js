import { Text } from 'ui.system.typography.vue';
import { RatingStars } from 'market.mobile.rating-stars';

export const ReviewItem = {
	components: {
		Text,
		RatingStars,
	},
	props: {
		review: {
			type: Object,
		},
	},
	data(): Object
	{
		return {
			showAnswerBlock: false,
			isReviewTextExpanded: false,
			showReviewMoreButton: false,
			isAnswerTextExpanded: false,
			showAnswerMoreButton: false,
		};
	},
	created(): void
	{
		if (
			this.review.REVIEW_TEXT_SHORT
			&& this.review.REVIEW_TEXT_FULL
			&& this.review.REVIEW_TEXT_SHORT.length > 0
			&& this.review.REVIEW_TEXT_FULL.length > 0
		)
		{
			this.showReviewMoreButton = true;
		}

		if (
			this.review.REVIEW_ANSWER_TEXT_FULL
			&& this.review.REVIEW_ANSWER_TEXT_FULL.length > 0
		)
		{
			this.showAnswerBlock = true;
		}

		if (
			this.review.REVIEW_ANSWER_TEXT_SHORT
			&& this.review.REVIEW_ANSWER_TEXT_FULL
			&& this.review.REVIEW_ANSWER_TEXT_SHORT.length > 0
			&& this.review.REVIEW_ANSWER_TEXT_FULL.length > 0
		)
		{
			this.showAnswerMoreButton = true;
		}

		this.reviewShortText = (this.review.REVIEW_TEXT_SHORT) ? `${this.review.REVIEW_TEXT_SHORT}...` : this.review.REVIEW_TEXT_FULL;
		this.answerShortText = (this.review.REVIEW_ANSWER_TEXT_SHORT) ? `${this.review.REVIEW_ANSWER_TEXT_SHORT}...` : this.review.REVIEW_ANSWER_TEXT_FULL;
	},
	methods: {
		getReviewText(): string
		{
			if (this.isReviewTextExpanded)
			{
				return this.review.REVIEW_TEXT_FULL;
			}

			return this.reviewShortText;
		},
		toggleReviewFullText(): void
		{
			if (!this.showReviewMoreButton)
			{
				return;
			}

			this.isReviewTextExpanded = !this.isReviewTextExpanded;
			this.showReviewMoreButton = false;
		},
		getAnswerText(): string
		{
			if (this.isAnswerTextExpanded)
			{
				return this.review.REVIEW_ANSWER_TEXT_FULL;
			}

			return this.answerShortText;
		},
		toggleAnswerFullText(): void
		{
			if (!this.showAnswerMoreButton)
			{
				return;
			}

			this.isAnswerTextExpanded = !this.isAnswerTextExpanded;
			this.showAnswerMoreButton = false;
		},
	},
	template: `
		<div class="market-mobile-detail-review__item-wrap">
			<div class="market-mobile-detail-review__item-title">
				<Text tag="div" size="sm">
					{{ review.USER_NAME }}
				</Text>
				<Text
					tag="div"
					size="sm"
					className="market-mobile-detail-review__item-title-date"
				>
					{{ review.DATE_CREATE }}
				</Text>
			</div>
			<RatingStars
				:rating="review.RATING"
				:starSize="11"
			/>
			<div>
				<Text
					tag="span"
					size="sm"
					className="market-mobile-detail-review__item-text"
					v-html="getReviewText()"
				>
				</Text>
				<Text
					v-if="showReviewMoreButton"
					tag="span"
					size="sm"
					@click="toggleReviewFullText()"
					class="market-mobile-detail-review__more"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_MORE') }}
				</Text>
			</div>	
		</div>
		<div v-if="showAnswerBlock" class="market-mobile-detail-review__item-answer-wrap">
			<div class="market-mobile-detail-review__item-title">
				<Text tag="div" size="sm">
					{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_REVIEW_ANSWER') }}
				</Text>
				<Text
					tag="div"
					size="sm"
					className="market-mobile-detail-review__item-title-date"
				>
					{{ review.REVIEW_ANSWER_DATE }}
				</Text>
			</div>	
			<div>
				<Text
					tag="span"
					size="sm"
					className="market-mobile-detail-review__item-text"
					v-html="getAnswerText()"
				>
				</Text>
				<Text
					v-if="showAnswerMoreButton"
					tag="span"
					size="sm"
					@click="toggleAnswerFullText()"
					class="market-mobile-detail-review__more"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_MORE') }}
				</Text>
			</div>
		</div>
	`,
};
