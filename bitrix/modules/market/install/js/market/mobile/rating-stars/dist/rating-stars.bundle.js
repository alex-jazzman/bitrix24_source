/* eslint-disable */
this.BX = this.BX || {};
this.BX.Market = this.BX.Market || {};
(function (exports) {
	'use strict';

	const RatingStars = {
		props: {
			rating: {
				type: Number,
				default: 0
			},
			starSize: {
				type: Number,
				default: 12
			}
		},
		computed: {
			starStyle() {
				return `width: ${this.starSize}px; height: ${this.starSize}px;`;
			}
		},
		methods: {
			isActiveStar(step) {
				return step <= this.rating;
			}
		},
		template: `
		<div class="market-mobile-rating-stars">
			<span 
				v-for="step in 5"
				:key="step"
			>
				<i
					class="ui-icon-set --s-favorite market-mobile-rating-stars__icon"
					:class="{'--active': isActiveStar(step)}"
					:style="starStyle"
				></i>
			</span>
		</div>
	`
	};

	exports.RatingStars = RatingStars;

})(this.BX.Market.Mobile = this.BX.Market.Mobile || {});
