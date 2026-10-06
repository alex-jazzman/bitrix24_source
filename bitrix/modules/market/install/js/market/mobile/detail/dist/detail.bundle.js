/* eslint-disable */
this.BX = this.BX || {};
this.BX.Market = this.BX.Market || {};
(function (exports, market_mobile_utils, ui_system_typography_vue, ui_vue3_components_button, market_mobile_ratingStars) {
	'use strict';

	const AppData = {
		components: {
			Text: ui_system_typography_vue.Text
		},
		props: {
			app: {
				type: Object,
				default: () => ({})
			}
		},
		computed: {
			showCategories() {
				return this.app?.CATEGORIES?.length > 0;
			}
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
	`
	};

	const Description = {
		components: {
			Text: ui_system_typography_vue.Text
		},
		props: {
			desc: {
				type: String
			}
		},
		data() {
			return {
				isDescriptionExpanded: false,
				showMoreButton: false
			};
		},
		methods: {
			toggleDesc() {
				if (!this.showMoreButton) {
					return;
				}
				this.isDescriptionExpanded = !this.isDescriptionExpanded;
				this.showMoreButton = false;
			}
		},
		mounted() {
			const descNode = document.querySelector('.market-mobile-detail__description');
			this.showMoreButton = descNode.scrollHeight > descNode.clientHeight;
		},
		template: `
		<div class="market-mobile-detail__description-wrapper">
			<Text
				tag="span"
				size="md"
				v-html="desc"
				:class="[
						'market-mobile-detail__description',
						{ 'market-mobile-detail__description--expanded': isDescriptionExpanded },
					]"
			/>
			<Text
				v-if="showMoreButton"
				tag="span"
				size="sm"
				@click="toggleDesc()"
				class="market-mobile-detail__more"
			>
				{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_MORE') }}
			</Text>
		</div>
	`
	};

	const HeaderInfo = {
		components: {
			Text: ui_system_typography_vue.Text,
			Headline: ui_system_typography_vue.Headline,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			app: {
				type: Object
			}
		},
		data() {
			return {
				buttonSizeSmall: ui_vue3_components_button.ButtonSize.SMALL,
				buttonStyleFilled: ui_vue3_components_button.AirButtonStyle.FILLED
			};
		},
		computed: {
			actionMode() {
				const buttons = this.app?.BUTTONS ?? {};
				if (buttons.UPDATE === 'Y') {
					return 'update';
				}
				if (buttons.INSTALL === 'Y') {
					return 'install';
				}
				if (buttons.NO_ACCESS_INSTALL === 'Y') {
					return 'noAccessInstall';
				}
				if (market_mobile_utils.MarketMobileHelper.normalizeString(this.app?.BUTTON_OPEN_APP, '') !== '') {
					return 'open';
				}
				return 'none';
			},
			buttonText() {
				if (this.actionMode === 'update') {
					return this.$Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_UPDATE');
				}
				if (this.actionMode === 'install' || this.actionMode === 'noAccessInstall') {
					return this.$Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_INSTALL');
				}
				return this.$Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_OPEN');
			},
			isButtonDisabled() {
				return this.actionMode === 'none' || this.actionMode === 'noAccessInstall';
			}
		},
		methods: {
			buttonClick() {
				if (this.actionMode === 'install' || this.actionMode === 'update') {
					market_mobile_utils.MarketMobileHelper.openAppInstall(this.app, {
						from: 'detail',
						title: this.app?.NAME ?? ''
					});
					return;
				}
				if (this.actionMode === 'open') {
					market_mobile_utils.MarketMobileHelper.openApp(this.app?.BUTTON_OPEN_APP ?? '', {
						title: this.app?.NAME ?? ''
					});
				}
			}
		},
		template: `
		<div class="market-mobile-detail-page__header">
			<div class="market-mobile-detail-page__header-icon">
				<img :src="app.ICON" class="market-mobile-detail-page__header-img">
			</div>
			<div class="market-mobile-detail-page__header-info">
				<Headline size='sm'>
					{{ app.NAME }}
				</Headline>
				<Text
					v-if="app.PARTNER_NAME"
					tag="div"
					size="xs"
					className="market-mobile-detail-page__subtitle"
				>
					{{ app.PARTNER_NAME }}
				</Text>
				<div v-if="actionMode !== 'none'" class="market-mobile-detail-page__button">
					<UiButton
						:text="buttonText"
						:size="buttonSizeSmall"
						:style="buttonStyleFilled"
						:disabled="isButtonDisabled"
						@click="buttonClick"
					/>
				</div>
			</div>
		</div>
	`
	};

	const MainInfo = {
		components: {
			Text: ui_system_typography_vue.Text,
			RatingStars: market_mobile_ratingStars.RatingStars
		},
		props: {
			app: {
				type: Object,
				default: () => ({})
			}
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
	`
	};

	const Gallery = {
		props: {
			images: {
				type: Array,
				default: () => []
			}
		},
		template: `
		<div class="market-mobile-detail-gallery__items">
			<div
				v-for="(imageData, index) in images"
				:key="'img-' + index"
				class="market-mobile-detail-gallery__item"
			>
				<img :src="imageData.PREVIEW">
			</div>
		</div>
	`
	};

	const Rating = {
		components: {
			Text: ui_system_typography_vue.Text,
			Headline: ui_system_typography_vue.Headline,
			UiButton: ui_vue3_components_button.Button,
			RatingStars: market_mobile_ratingStars.RatingStars
		},
		props: {
			reviews: {
				type: Object,
				default: () => ({})
			}
		},
		data() {
			return {
				buttonSizeExtraSmall: ui_vue3_components_button.ButtonSize.EXTRA_SMALL,
				buttonStyleOutline: ui_vue3_components_button.AirButtonStyle.OUTLINE
			};
		},
		computed: {
			totalRating() {
				if (this.reviews?.RATING && this.reviews?.RATING?.RATING) {
					return this.reviews.RATING.RATING;
				}
				return 0;
			},
			totalCountMessage() {
				let num = 0;
				if (this.reviews?.RATING && this.reviews?.RATING?.COUNT) {
					num = this.reviews.RATING.COUNT;
				}
				return this.$Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_RATING_COUNT_WITH_NUM', {
					'#NUM#': num
				});
			}
		},
		methods: {
			openAllReviews() {
				alert('TODO');
			}
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
	`
	};

	const ReviewItem = {
		components: {
			Text: ui_system_typography_vue.Text,
			RatingStars: market_mobile_ratingStars.RatingStars
		},
		props: {
			review: {
				type: Object
			}
		},
		data() {
			return {
				showAnswerBlock: false,
				isReviewTextExpanded: false,
				showReviewMoreButton: false,
				isAnswerTextExpanded: false,
				showAnswerMoreButton: false
			};
		},
		created() {
			if (this.review.REVIEW_TEXT_SHORT && this.review.REVIEW_TEXT_FULL && this.review.REVIEW_TEXT_SHORT.length > 0 && this.review.REVIEW_TEXT_FULL.length > 0) {
				this.showReviewMoreButton = true;
			}
			if (this.review.REVIEW_ANSWER_TEXT_FULL && this.review.REVIEW_ANSWER_TEXT_FULL.length > 0) {
				this.showAnswerBlock = true;
			}
			if (this.review.REVIEW_ANSWER_TEXT_SHORT && this.review.REVIEW_ANSWER_TEXT_FULL && this.review.REVIEW_ANSWER_TEXT_SHORT.length > 0 && this.review.REVIEW_ANSWER_TEXT_FULL.length > 0) {
				this.showAnswerMoreButton = true;
			}
			this.reviewShortText = this.review.REVIEW_TEXT_SHORT ? `${this.review.REVIEW_TEXT_SHORT}...` : this.review.REVIEW_TEXT_FULL;
			this.answerShortText = this.review.REVIEW_ANSWER_TEXT_SHORT ? `${this.review.REVIEW_ANSWER_TEXT_SHORT}...` : this.review.REVIEW_ANSWER_TEXT_FULL;
		},
		methods: {
			getReviewText() {
				if (this.isReviewTextExpanded) {
					return this.review.REVIEW_TEXT_FULL;
				}
				return this.reviewShortText;
			},
			toggleReviewFullText() {
				if (!this.showReviewMoreButton) {
					return;
				}
				this.isReviewTextExpanded = !this.isReviewTextExpanded;
				this.showReviewMoreButton = false;
			},
			getAnswerText() {
				if (this.isAnswerTextExpanded) {
					return this.review.REVIEW_ANSWER_TEXT_FULL;
				}
				return this.answerShortText;
			},
			toggleAnswerFullText() {
				if (!this.showAnswerMoreButton) {
					return;
				}
				this.isAnswerTextExpanded = !this.isAnswerTextExpanded;
				this.showAnswerMoreButton = false;
			}
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
	`
	};

	const Reviews = {
		components: {
			ReviewItem
		},
		props: {
			reviews: {
				type: Object,
				default: () => ({
					TOTAL_COUNT: 0,
					ITEMS: []
				})
			}
		},
		data() {
			const totalCount = this.reviews?.TOTAL_COUNT ?? 0;
			return {
				isReviewBlockVisible: totalCount > 0
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
	`
	};

	const Detail = {
		components: {
			HeaderInfo,
			MainInfo,
			Gallery,
			Description,
			Rating,
			Reviews,
			AppData
		},
		props: {
			params: {
				type: Object,
				default: () => ({})
			},
			result: {
				type: Object,
				default: () => ({})
			}
		},
		data() {
			return {
				app: this.result?.APP || {}
			};
		},
		computed: {
			toolbarTitle() {
				return this.result?.TITLE || this.app?.NAME || '';
			}
		},
		mounted() {
			this.syncMobileUi();
		},
		methods: {
			syncMobileUi() {
				this.$emit('mobile-ui-update', {
					title: this.toolbarTitle,
					menu: this.prepareNativeMenuData()
				});
			},
			prepareNativeMenuData() {
				const app = market_mobile_utils.MarketMobileHelper.cloneObject(this.app);
				const buttons = market_mobile_utils.MarketMobileHelper.cloneObject(app.BUTTONS);
				const openAppUrl = market_mobile_utils.MarketMobileHelper.normalizeString(app.BUTTON_OPEN_APP, '');
				const canUpdate = buttons.UPDATE === 'Y';
				return {
					isAvailable: true,
					shareUrl: this.prepareShareUrl(app),
					contactDeveloperUrl: market_mobile_utils.MarketMobileHelper.normalizeString(app.CONTACT_DEVELOPER, ''),
					requestDemoUrl: market_mobile_utils.MarketMobileHelper.normalizeString(app.REQUEST_DEMO, ''),
					partnerPageUrl: market_mobile_utils.MarketMobileHelper.normalizeString(app.PARTNER_URL, ''),
					openAppUrl,
					canOpenApp: openAppUrl !== '',
					canUpdate,
					canDelete: buttons.DELETE === 'Y',
					installInfo: canUpdate ? this.prepareInstallInfo(app.INSTALL_INFO, app) : null
				};
			},
			prepareShareUrl(app = {}) {
				const appCode = market_mobile_utils.MarketMobileHelper.resolveAppCode(app);
				if (appCode === '') {
					return '';
				}
				return market_mobile_utils.MarketMobileHelper.buildAbsoluteUrl(`/market/detail/${encodeURIComponent(appCode)}/`);
			},
			prepareInstallInfo(installInfo = {}, app = {}) {
				const preparedInstallInfo = market_mobile_utils.MarketMobileHelper.cloneObject(installInfo);
				const code = market_mobile_utils.MarketMobileHelper.normalizeString(preparedInstallInfo.CODE || app.CODE, '');
				if (code === '') {
					return null;
				}
				return {
					code,
					version: market_mobile_utils.MarketMobileHelper.normalizeNonNegativeInt(preparedInstallInfo.VERSION || app.VERSION || app.VER, 0),
					checkHash: market_mobile_utils.MarketMobileHelper.normalizeString(preparedInstallInfo.CHECK_HASH, ''),
					installHash: market_mobile_utils.MarketMobileHelper.normalizeString(preparedInstallInfo.INSTALL_HASH, '')
				};
			}
		},
		template: `
		<div class="market-mobile-detail-page">
			<HeaderInfo :app/>
			<MainInfo :app/>
			<Gallery :images="app.SLIDER_IMAGES"/>
			<Description :desc="app.SHORT_DESC"/>
			<Rating :reviews="app.REVIEWS"/>
			<Reviews :reviews="app.REVIEWS"/>
			<AppData :app/>
		</div>
	`
	};

	exports.Detail = Detail;

})(this.BX.Market.Mobile = this.BX.Market.Mobile || {}, BX.Market.Mobile, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.Market.Mobile);
