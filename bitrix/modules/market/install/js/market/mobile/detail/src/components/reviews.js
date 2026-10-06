import { ReviewItem } from './review-item';

export const Reviews = {
	components: {
		ReviewItem,
	},
	props: {
		reviews: {
			type: Object,
			default: () => ({
				TOTAL_COUNT: 0,
				ITEMS: [],
			}),
		},
	},
	data(): Object
	{
		const totalCount = this.reviews?.TOTAL_COUNT ?? 0;

		return {
			isReviewBlockVisible: totalCount > 0,
		};
	},
	template: `
		<div v-if="isReviewBlockVisible" class="market-mobile-detail-review__items">
			<div
				v-for="(review, index) in this.reviews.ITEMS"
				:key="index"
				class="market-mobile-detail-review__item"
			>
				<ReviewItem :review />
			</div>
		</div>
	`,
};
