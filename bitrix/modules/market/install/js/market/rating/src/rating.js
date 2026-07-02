import { Ears } from 'ui.ears'
import { RatingItem } from "./rating-item";
import 'ui.design-tokens';
import { BitrixVue } from 'ui.vue3';
import { RatingReview } from 'market.rating-review';

import './rating.css';

export const Rating = {
	components: {
		RatingItem,
	},
	props: [
		'appInfo', 'isSite', 'showNoAccessInstallButton',
	],
	data() {
		return {
			application: {},
			needInstallBeforeAdd: true,
			ratingClickState: false, // клик по звёздам, когда не установлено
			feedbackBlock: null, // блок с отзывами, чтобы прикрутить уши для прокрутки
			reviewPopup: null,
		};
	},
	beforeMount() {
		this.application = this.appInfo;
		this.needInstallBeforeAdd = this.isSite !== true;
	},
	computed: {
		canReview: function () {
			return this.application.REVIEWS.CAN_REVIEW === 'Y';
		},
		appWasInstalled: function () {
			return this.application.WAS_INSTALLED && this.application.WAS_INSTALLED === 'Y';
		},
		showInstallState: function () {
			return this.needInstallBeforeAdd && !this.appWasInstalled && (!this.countReviews);
		},
		canRatingClick: function () {
			return (this.canReview && !this.sendingReview);
		},
		countReviews: function () {
			return parseInt(this.application.REVIEWS.RATING.COUNT, 10);
		},
		totalRating: function () {
			if (this.application.REVIEWS.RATING && this.application.REVIEWS.RATING.RATING) {
				return this.application.REVIEWS.RATING.RATING
			}

			return 0;
		},
	},
	mounted() {
		this.feedbackBlock = this.$refs.marketFeedback;
		if (this.feedbackBlock) {
			(new Ears({
				container: this.feedbackBlock,
				smallSize: true,
				noScrollbar: true,
			})).init();
		}

		if (false) {
			this.scrollToUserReview();
		}
	},
	beforeUnmount()
	{
		this.cancelAddingReviewClick();
	},
	methods: {
		scrollToUserReview: function () {
			window.scrollTo({
				top: this.feedbackBlock.getBoundingClientRect().top,
				behavior: 'smooth',
			});
		},
		ratingClick: function () {
			this.ratingClickState = true;
			setTimeout(() => this.ratingClickState = false, 2000);
		},
		isActiveStar: function (currentStar, rating) {
			return currentStar <= parseInt(rating, 10);
		},
		addingReviewClick() {
			if (this.reviewPopup)
			{
				return;
			}

			const popupContainer = document.createElement('div');
			this.reviewPopup = BitrixVue.createApp(RatingReview, {
				appInfo: this.appInfo,
				isSite: this.isSite,
				onSuccess: (event) => {
					this.successReviewHandler(event);
				},
				onClose: () => {
					this.cancelAddingReviewClick();
				},
			});
			this.reviewPopup.mount(popupContainer);
		},
		cancelAddingReviewClick() {
			if (this.reviewPopup)
			{
				this.reviewPopup.unmount();
				this.reviewPopup = null;
			}
		},
		showNotify(text) {
			BX.UI.Notification.Center.notify({
				content: text,
				position: BX.UI.Notification.Position.BOTTOM_LEFT,
			});
		},
		getCountStars: function (star) {
			if (!this.application.REVIEWS.RATING || !this.application.REVIEWS.RATING.RATING_DETAIL) {
				return 0;
			}

			if (this.application.REVIEWS.RATING.RATING_DETAIL[star]) {
				return this.application.REVIEWS.RATING.RATING_DETAIL[star];
			}

			return 0;
		},
		getStarWidth: function (star) {
			if (this.getCountStars(star) === 0 || !this.countReviews) {
				return '0%';
			}

			return (this.getCountStars(star) / this.countReviews) * 100 + '%';
		},
		successReviewHandler: function (data) {
			if (data && data.hasOwnProperty('can_review')) {
				this.application.REVIEWS.CAN_REVIEW = data.can_review
			}

			if (data && data.hasOwnProperty('review_info') && BX.Type.isArray(this.application.REVIEWS.ITEMS)) {
				this.application.REVIEWS.ITEMS.unshift(data.review_info);
			}

			if (data && data.hasOwnProperty('rating') && data.rating.hasOwnProperty('RATING_DETAIL')) {
				this.application.REVIEWS.RATING = data.rating;
			}
		},
	},
	template: `
		<div class="market-detail__app-rating-info">
			<div class="market-detail__app-rating-info_container">
				<div class="market-detail__app-rating-info_stars-block">
					<div class="market-rating__app-rating-info_stars">

						<div class="market-rating__app-rating-info_stars-name">
							{{ $Bitrix.Loc.getMessage('MARKET_RATING_JS_RATING_TITLE') }}
						</div>

						<div class="market-rating__app-rating-info_stars-container">
							<svg class="market-rating__app-rating_star"
								 :class="{'--active': isActiveStar(1, totalRating)}"
								 @click="ratingClick"
								 width="18" height="18" viewBox="0 0 18 18"
								 fill="none" xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M8.53505 1.17539C8.70176 0.753948 9.29824 0.753947 9.46495 1.17539L11.389 6.03945C11.4589 6.21604 11.6227 6.33781 11.812 6.35377L16.8494 6.7784C17.2857 6.81517 17.4673 7.35515 17.142 7.64815L13.2679 11.1376C13.1333 11.2587 13.0748 11.4432 13.1149 11.6197L14.292 16.8084C14.391 17.2448 13.9107 17.5815 13.5342 17.3397L9.27019 14.6013C9.10558 14.4955 8.89442 14.4955 8.72981 14.6013L4.46583 17.3397C4.08928 17.5815 3.60902 17.2448 3.70803 16.8084L4.88514 11.6197C4.92519 11.4432 4.86667 11.2587 4.73215 11.1376L0.857968 7.64815C0.532662 7.35515 0.714337 6.81517 1.15059 6.7784L6.18805 6.35377C6.37728 6.33781 6.54114 6.21604 6.61099 6.03945L8.53505 1.17539Z"/>
							</svg>

							<svg class="market-rating__app-rating_star "
								 :class="{'--active': isActiveStar(2, totalRating)}"
								 @click="ratingClick"
								 width="18" height="18" viewBox="0 0 18 18"
								 fill="none" xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M8.53505 1.17539C8.70176 0.753948 9.29824 0.753947 9.46495 1.17539L11.389 6.03945C11.4589 6.21604 11.6227 6.33781 11.812 6.35377L16.8494 6.7784C17.2857 6.81517 17.4673 7.35515 17.142 7.64815L13.2679 11.1376C13.1333 11.2587 13.0748 11.4432 13.1149 11.6197L14.292 16.8084C14.391 17.2448 13.9107 17.5815 13.5342 17.3397L9.27019 14.6013C9.10558 14.4955 8.89442 14.4955 8.72981 14.6013L4.46583 17.3397C4.08928 17.5815 3.60902 17.2448 3.70803 16.8084L4.88514 11.6197C4.92519 11.4432 4.86667 11.2587 4.73215 11.1376L0.857968 7.64815C0.532662 7.35515 0.714337 6.81517 1.15059 6.7784L6.18805 6.35377C6.37728 6.33781 6.54114 6.21604 6.61099 6.03945L8.53505 1.17539Z"/>
							</svg>

							<svg class="market-rating__app-rating_star"
								 :class="{'--active': isActiveStar(3, totalRating)}"
								 @click="ratingClick"
								 width="18" height="18" viewBox="0 0 18 18"
								 fill="none" xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M8.53505 1.17539C8.70176 0.753948 9.29824 0.753947 9.46495 1.17539L11.389 6.03945C11.4589 6.21604 11.6227 6.33781 11.812 6.35377L16.8494 6.7784C17.2857 6.81517 17.4673 7.35515 17.142 7.64815L13.2679 11.1376C13.1333 11.2587 13.0748 11.4432 13.1149 11.6197L14.292 16.8084C14.391 17.2448 13.9107 17.5815 13.5342 17.3397L9.27019 14.6013C9.10558 14.4955 8.89442 14.4955 8.72981 14.6013L4.46583 17.3397C4.08928 17.5815 3.60902 17.2448 3.70803 16.8084L4.88514 11.6197C4.92519 11.4432 4.86667 11.2587 4.73215 11.1376L0.857968 7.64815C0.532662 7.35515 0.714337 6.81517 1.15059 6.7784L6.18805 6.35377C6.37728 6.33781 6.54114 6.21604 6.61099 6.03945L8.53505 1.17539Z"/>
							</svg>

							<svg class="market-rating__app-rating_star"
								 :class="{'--active': isActiveStar(4, totalRating)}"
								 @click="ratingClick"
								 width="18" height="18" viewBox="0 0 18 18"
								 fill="none" xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M8.53505 1.17539C8.70176 0.753948 9.29824 0.753947 9.46495 1.17539L11.389 6.03945C11.4589 6.21604 11.6227 6.33781 11.812 6.35377L16.8494 6.7784C17.2857 6.81517 17.4673 7.35515 17.142 7.64815L13.2679 11.1376C13.1333 11.2587 13.0748 11.4432 13.1149 11.6197L14.292 16.8084C14.391 17.2448 13.9107 17.5815 13.5342 17.3397L9.27019 14.6013C9.10558 14.4955 8.89442 14.4955 8.72981 14.6013L4.46583 17.3397C4.08928 17.5815 3.60902 17.2448 3.70803 16.8084L4.88514 11.6197C4.92519 11.4432 4.86667 11.2587 4.73215 11.1376L0.857968 7.64815C0.532662 7.35515 0.714337 6.81517 1.15059 6.7784L6.18805 6.35377C6.37728 6.33781 6.54114 6.21604 6.61099 6.03945L8.53505 1.17539Z"/>
							</svg>

							<svg class="market-rating__app-rating_star"
								 :class="{'--active': isActiveStar(5, totalRating)}"
								 @click="ratingClick"
								 width="18" height="18" viewBox="0 0 18 18"
								 fill="none" xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M8.53505 1.17539C8.70176 0.753948 9.29824 0.753947 9.46495 1.17539L11.389 6.03945C11.4589 6.21604 11.6227 6.33781 11.812 6.35377L16.8494 6.7784C17.2857 6.81517 17.4673 7.35515 17.142 7.64815L13.2679 11.1376C13.1333 11.2587 13.0748 11.4432 13.1149 11.6197L14.292 16.8084C14.391 17.2448 13.9107 17.5815 13.5342 17.3397L9.27019 14.6013C9.10558 14.4955 8.89442 14.4955 8.72981 14.6013L4.46583 17.3397C4.08928 17.5815 3.60902 17.2448 3.70803 16.8084L4.88514 11.6197C4.92519 11.4432 4.86667 11.2587 4.73215 11.1376L0.857968 7.64815C0.532662 7.35515 0.714337 6.81517 1.15059 6.7784L6.18805 6.35377C6.37728 6.33781 6.54114 6.21604 6.61099 6.03945L8.53505 1.17539Z"/>
							</svg>
						</div>

						<div class="market-rating__app-rating-info_stars-number">
							{{ totalRating }}
							<span class="market-rating__app-rating-info_stars-all-number">/5</span>
						</div>
					</div>

					<div class="market-rating__app-rating-info_scale">
						<div class="market-rating__app-rating-info_scale-item">
							<div class="market-rating__app-rating-info_scale-item-name">
								{{ $Bitrix.Loc.getMessage('MARKET_RATING_JS_FIVE_STARS') }}
							</div>
							<div class="market-rating__app-rating-info_scale-item-line-container">
								<div class="market-rating__app-rating-info_scale-item-line-active"
									 :style="{'width': getStarWidth(5)}"
								></div>
							</div>
							<div class="market-rating__app-rating-info_scale-item-number">{{ getCountStars(5) }}</div>
						</div>
						<div class="market-rating__app-rating-info_scale-item">
							<div class="market-rating__app-rating-info_scale-item-name">
								{{ $Bitrix.Loc.getMessage('MARKET_RATING_JS_FOUR_STARS') }}
							</div>
							<div class="market-rating__app-rating-info_scale-item-line-container">
								<div class="market-rating__app-rating-info_scale-item-line-active"
									 :style="{'width': getStarWidth(4)}"
								></div>
							</div>
							<div class="market-rating__app-rating-info_scale-item-number">{{ getCountStars(4) }}</div>
						</div>
						<div class="market-rating__app-rating-info_scale-item">
							<div class="market-rating__app-rating-info_scale-item-name">
								{{ $Bitrix.Loc.getMessage('MARKET_RATING_JS_THREE_STARS') }}
							</div>
							<div class="market-rating__app-rating-info_scale-item-line-container">
								<div class="market-rating__app-rating-info_scale-item-line-active"
									 :style="{'width': getStarWidth(3)}"
								></div>
							</div>
							<div class="market-rating__app-rating-info_scale-item-number">{{ getCountStars(3) }}</div>
						</div>
						<div class="market-rating__app-rating-info_scale-item">
							<div class="market-rating__app-rating-info_scale-item-name">
								{{ $Bitrix.Loc.getMessage('MARKET_RATING_JS_TWO_STARS') }}
							</div>
							<div class="market-rating__app-rating-info_scale-item-line-container">
								<div class="market-rating__app-rating-info_scale-item-line-active"
									 :style="{'width': getStarWidth(2)}"
								></div>
							</div>
							<div class="market-rating__app-rating-info_scale-item-number">{{ getCountStars(2) }}</div>
						</div>
						<div class="market-rating__app-rating-info_scale-item">
							<div class="market-rating__app-rating-info_scale-item-name">
								{{ $Bitrix.Loc.getMessage('MARKET_RATING_JS_ONE_STAR') }}
							</div>
							<div class="market-rating__app-rating-info_scale-item-line-container">
								<div class="market-rating__app-rating-info_scale-item-line-active"
									 :style="{'width': getStarWidth(1)}"
								></div>
							</div>
							<div class="market-rating__app-rating-info_scale-item-number">{{ getCountStars(1) }}</div>
						</div>
					</div>

				</div>
				<div class="market-detail__app-rating_feedback-block">
					<div class="market-detail__app-rating_feedback-header">
						<div class="market-detail__app-rating_feedback-title">
							{{ $Bitrix.Loc.getMessage('MARKET_RATING_JS_REVIEWS_TITLE') }}
						</div>
	
						<div class="market-detail__app-rating_feedback-info"
							 v-if="countReviews"
						>{{ $Bitrix.Loc.getMessage('MARKET_RATING_JS_REVIEWS_TOTAL', { '#NUMBER#': countReviews }) }}
						</div>
					</div>
					<div class="market-detail__app-rating_feedback-content">
						<div class="market-detail__app-rating_feedback-empty"
							 :class="{'--animation': ratingClickState === true}"
							 v-show="showInstallState"
						>
							<div class="market-detail__app-rating_feedback-empty-icon">
								<svg width="79" height="78" viewBox="0 0 79 78" fill="none"
									 xmlns="http://www.w3.org/2000/svg">
									<path fill-rule="evenodd" clip-rule="evenodd"
										  d="M21.3519 39C20.0466 39 18.868 39.7809 18.3591 40.9828L13.5 52.4588H65.5L60.6409 40.9828C60.132 39.7809 58.9534 39 57.6481 39H56.092L59.3331 47.502C59.7385 48.5657 58.953 49.7059 57.8146 49.7059H20.9232C19.7679 49.7059 18.9816 48.5343 19.4194 47.4652L22.8852 39H21.3519ZM65.5 52.4588H13.5V61.7502C13.5 63.5451 14.9551 65.0002 16.75 65.0002H62.25C64.0449 65.0002 65.5 63.5451 65.5 61.7502V52.4588ZM55.75 61.3298C57.5449 61.3298 59 59.9016 59 58.1399C59 56.3781 57.5449 54.95 55.75 54.95C53.9551 54.95 52.5 56.3781 52.5 58.1399C52.5 59.9016 53.9551 61.3298 55.75 61.3298Z"
										  fill="#D5D7DB"/>
									<path
										d="M41 16.25C41 15.4216 40.3284 14.75 39.5 14.75C38.6716 14.75 38 15.4216 38 16.25L41 16.25ZM38.4393 43.3107C39.0251 43.8964 39.9749 43.8964 40.5607 43.3107L50.1066 33.7647C50.6924 33.1789 50.6924 32.2292 50.1066 31.6434C49.5208 31.0576 48.5711 31.0576 47.9853 31.6434L39.5 40.1287L31.0147 31.6434C30.4289 31.0576 29.4792 31.0576 28.8934 31.6434C28.3076 32.2292 28.3076 33.1789 28.8934 33.7647L38.4393 43.3107ZM38 16.25L38 42.25L41 42.25L41 16.25L38 16.25Z"
										fill="#D5D7DB"/>
								</svg>
							</div>
							<div class="market-detail__app-rating_feedback-empty-description"
								 v-html="$Bitrix.Loc.getMessage('MARKET_RATING_JS_INSTALL_TEXT')"
							></div>
							<button class="ui-btn ui-btn-xs ui-btn-success market-detail__app-rating_install-btn"
									:class="{'ui-btn-disabled': showNoAccessInstallButton}"
									@click="$emit('installApp')"
							>
								{{ $Bitrix.Loc.getMessage('MARKET_DETAIL_ACTION_JS_INSTALL') }}
							</button>
						</div>
						<div class="market-detail__app-rating_feedback-wrapper"
							 v-show="!showInstallState"
						>
							<div class="market-detail__app-rating_feedback-ready"
								 ref="marketFeedback"
							>
								<div class="market-detail__feedback-item market-detail__app-rating_add-feedback-btn"
									 v-if="canReview"
									 @click="addingReviewClick"
								>
										<span class="market-detail__app-rating_add-feedback-btn-icon">
											<svg width="25" height="24" viewBox="0 0 25 24" fill="none"
												 xmlns="http://www.w3.org/2000/svg">
												<path fill-rule="evenodd" clip-rule="evenodd"
													  d="M13.5 6H11.5V11H6.5V13H11.5V18H13.5V13H18.5V11H13.5V6Z"
													  fill="#559BE6"/>
											</svg>
										</span>
									<span class="market-detail__app-rating_add-feedback-btn-text"
										  v-html="$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW')"
									></span>
								</div>

								<RatingItem
									v-for="review in application.REVIEWS.ITEMS"
									:review="review"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
