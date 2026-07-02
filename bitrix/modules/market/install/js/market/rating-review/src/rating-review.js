import { nextTick } from 'ui.vue3';
import { PopupWrapper } from './popup-wrapper';
import { RatingStarsInput } from 'market.rating-stars-input';

import './style.css';

export const RatingReview = {
	components: {
		PopupWrapper,
		RatingStarsInput,
	},
	props: {
		appInfo: {
			type: Object,
			required: true,
		},
		initialRating: {
			type: [Number, String],
			required: false,
			default: 0,
		},
		isSite: {
			type: Boolean,
			required: false,
			default: false,
		},
		notifyPosition: {
			type: String,
			required: false,
			default: BX.UI.Notification.Position.BOTTOM_LEFT,
		},
	},
	emits: ['close', 'success'],
	data()
	{
		return {
			application: {},
			isAllowed: true,
			policyChecked: false,
			rulesChecked: false,
			reviewText: '',
			currentRating: 0,
			starsError: false,
			sendingReview: false,
		};
	},
	beforeMount()
	{
		this.application = this.appInfo;
		this.isAllowed = this.application.REVIEWS?.CAN_REVIEW === 'Y';

		const initialRating = Math.max(0, Math.min(5, parseInt(this.initialRating, 10) || 0));
		if (initialRating > 0)
		{
			this.currentRating = initialRating;
		}
	},
	mounted()
	{
		if (!this.showPolicy)
		{
			this.policyChecked = true;
		}

		if (!this.showRules)
		{
			this.rulesChecked = true;
		}
		nextTick(() => {
			if (this.$refs.marketFeedbackText)
			{
				this.$refs.marketFeedbackText.focus();
			}
		});
	},
	computed: {
		canReview() {
			return this.application.REVIEWS.CAN_REVIEW === 'Y';
		},
		showPolicy() {
			return this.application.REVIEWS.SHOW_POLICY_CHECKBOX === 'Y';
		},
		showRules() {
			return this.application.REVIEWS.SHOW_RULES_CHECKBOX === 'Y';
		},
		allChecked() {
			return this.policyChecked && this.rulesChecked;
		},
		canRatingClick() {
			return (this.canReview && !this.sendingReview);
		},
	},
	methods: {
		encode(value): string {
			return BX.Text.encode(value);
		},
		addReview() {
			if (!this.allChecked)
			{
				return;
			}

			if (this.currentRating <= 0)
			{
				this.starsError = true;
				setTimeout(() => this.starsError = false, 200);
				this.showNotify(this.$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_STARS_ERROR'));

				return;
			}

			this.sendingReview = true;
			const isSiteTemplate = this.isSite === true ? 'Y' : 'N';

			BX.ajax.runAction('market.Application.addReview', {
				data: {
					appCode: this.application.REVIEW_APP_CODE,
					reviewText: this.reviewText,
					currentRating: this.currentRating,
					isSite: isSiteTemplate,
				},
				analyticsLabel: {
					appCode: this.application.REVIEW_APP_CODE,
					currentRating: this.currentRating,
					isSite: isSiteTemplate,
				},
			}).then(
				(response) => {
					this.sendingReview = false;
					if (response.data && response.data.success === 'Y')
					{
						this.successReviewHandler(response.data);
					}
					else if (response.data && response.data.error)
					{
						const errors = [...response.data.error];
						const firstError = errors.shift();
						if (firstError === 'NOT_FOUND_TEXT')
						{
							this.showNotify(this.$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_TEXT_ERROR'));

							return;
						}
						const errorText = response.data.error.filter(Boolean).join(', ');
						const message = errorText
							? `${this.$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_ERROR')} (${errorText})`
							: this.$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_ERROR');
						this.showNotify(message);
					}
					else
					{
						this.showNotify(this.$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_ERROR'));
					}
				},
				(response) => {
					this.sendingReview = false;
					this.showNotify(this.$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_ERROR'));
				},
			);
		},
		showNotify(text) {
			BX.UI.Notification.Center.notify({
				content: text,
				position: this.notifyPosition ?? BX.UI.Notification.Position.BOTTOM_LEFT,
			});
		},
		successReviewHandler(data) {
			this.showNotify(this.$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_SUCCESS'));
			this.$emit('success', data);
			this.closeForm();
		},
		closeForm()
		{
			this.$emit('close');
		},
	},
	template: `
		<PopupWrapper v-if="isAllowed" @close="closeForm">
			<div class="market-detail__app-rating_feedback-form">
				<div class="market-detail__app-rating_feedback-img" v-if="isSite !== true">
					<img :src="application.ICON" alt="icon">
				</div>
				<div class="market-detail__app-rating_feedback-subtitle"
					 v-html="$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_TITLE', {'#APP_NAME#' : encode(application.NAME)})"
				></div>
				<p class="market-detail__app-rating_feedback-text">{{
						$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_FEEDBACK_TEXT')
					}}</p>
				<RatingStarsInput
					v-model="currentRating"
					:hoverable="canRatingClick"
					:clickable="canRatingClick"
					:error="starsError"
					:size="33"
					class-name="market-rating-review__stars"
				/>
				<div class="ui-ctl ui-ctl-textarea ui-ctl-no-resize ui-ctl-w100 ui-ctl-lg">
						<textarea class="ui-ctl-element market-detail__app-rating_feedback-textarea"
								  ref="marketFeedbackText"
								  :disabled="sendingReview"
								  v-model="reviewText"
						></textarea>
				</div>
				<div class="market-detail__app-rating_feedback-checkbox-wrapper">
					<label
						class="ui-ctl ui-ctl-checkbox ui-ctl-wa market-detail__app-rating_feedback-checkbox"
						v-if="showPolicy"
					>
						<input type="checkbox" class="ui-ctl-element"
							   v-model="policyChecked"
						>
						<span class="ui-ctl-label-text market-detail__app-rating_feedback-label"
							  v-html="$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_POLICY', {'#POLICY_URL#': encode(application.REVIEWS.POLICY_URL)})"
						>
							</span>
					</label>
					<label
						class="ui-ctl ui-ctl-checkbox ui-ctl-wa market-detail__app-rating_feedback-checkbox"
						v-if="showRules"
					>
						<input type="checkbox" class="ui-ctl-element"
							   v-model="rulesChecked"
						>
						<span class="ui-ctl-label-text market-detail__app-rating_feedback-label"
							  v-html="$Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_POSTING_GUIDELINES', {'#RULES_URL#': encode(application.REVIEWS.POSTING_GUIDELINES_URL)})"
						>
							</span>
					</label>
				</div>
				<div class="market-detail__app-rating_feedback-buttons">
					<button class="ui-btn ui-btn-sm"
							:class="{
										'ui-btn-wait': sendingReview, 
										'ui-btn-primary': allChecked,
										'ui-btn-default': !allChecked,
										'ui-btn-disabled': !allChecked,
									}"
							:disabled="sendingReview || !allChecked"
							@click="addReview"
					>
						{{ $Bitrix.Loc.getMessage('MARKET_RATING_JS_ADD_REVIEW_SEND') }}
					</button>
				</div>
			</div>
		</PopupWrapper>
	`,
};
