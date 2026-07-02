import { Loc, Text, Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { RatingReview } from 'market.rating-review';
import { MarketLinks } from 'market.market-links';
import { RatingStarsInput } from 'market.rating-stars-input';

type InfoBlockOptions = {
	dashboard: Object,
	publishedDate: string,
	updatedDate: string,
	period: string,
	reloadDashboardCallback: Function,
	isMarketModuleInstalled: boolean,
	appCode: string,
	imagesPath: string,
};

export class InfoBlock
{
	constructor(options: InfoBlockOptions)
	{
		this.dashboardTitle = options.dashboard?.TITLE ?? '';
		this.dashboard = options.dashboard;
		this.publishedDate = options.publishedDate;
		this.updatedDate = options.updatedDate;
		this.period = options.period;
		this.reloadDashboardCallback = options.reloadDashboardCallback;
		this.isMarketModuleInstalled = options.isMarketModuleInstalled;
		this.appCode = Type.isStringFilled(options.appCode) ? options.appCode : '';
		this.imagesPath = options.imagesPath;

		this.ratingInfo = null;
		this.rating = 0;
		this.reviewsCount = 0;
		this.canReview = false;
		this.fullFilledStars = 0;
		this.reviewPopup = null;
		this.ratingStarsApp = null;

		if (this.isRatingAvailable())
		{
			this.ratingInfo = this.dashboard?.RATING_INFO ?? {};
			this.rating = Type.isNumber(this.ratingInfo?.RATING?.RATING) ? this.ratingInfo.RATING.RATING : 0;
			this.reviewsCount = Type.isNumber(this.ratingInfo?.RATING?.COUNT) ? this.ratingInfo.RATING.COUNT : 0;
			this.canReview = this.ratingInfo?.CAN_REVIEW === 'Y';
			this.fullFilledStars = this.canReview ? 0 : this.ratingInfo.USER_RATING;
		}
	}

	static getDateValue(dateRaw: any): string
	{
		return Type.isStringFilled(dateRaw) ? Text.encode(dateRaw) : '&ndash;';
	}

	static getPeriodValue(periodRaw: any): string
	{
		return Type.isStringFilled(periodRaw) ? Text.encode(periodRaw) : '&ndash;';
	}

	render(): string
	{
		const publishedLabel = this.getPublishedLabel();
		const publishedRow = this.renderPublishedRow(publishedLabel);
		const updatedLabel = Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_UPDATED') ?? '';
		const periodLabel = Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_PERIOD') ?? '';
		const periodHint = Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_PERIOD_HINT') ?? '';
		let ratingHintText = '';
		let ratingCountText = '';
		let ratingHintIcon = '';
		if (this.isRatingAvailable())
		{
			ratingHintText = (this.canReview
				? Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_RATING_HINT')
				: Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_RATING_ALREADY_HAS_REVIEW'))
				?? ''
			;

			ratingCountText = Loc.getMessagePlural(
				'BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_RATING_COUNT',
				this.reviewsCount,
				{ '#COUNT#': this.reviewsCount },
			)
				?? ''
			;
		}
		else
		{
			ratingHintText = Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_RATING_CAN_NOT_REVIEW') ?? '';
			const ratingHintTooltip = Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_RATING_CAN_NOT_REVIEW_HINT', { '[br]': '\n' }) ?? '';
			ratingHintIcon = `<span data-hint="${Text.encode(ratingHintTooltip)}"></span>`;
		}

		const disabledClass = this.isRatingAvailable() ? '' : 'report-info--rating-disabled';

		return `
			<div class="report-info ${disabledClass}">
				<div class="report-info__header">

					<div class="report-info__rating" data-role="open-market-detail">
						<div class="report-info__rating-value">
							<span class="report-info__rating-star" aria-hidden="true"></span>
							<span class="report-info__rating-number">${this.rating}</span>
						</div>
						<div class="report-info__rating-count">
							${Text.encode(ratingCountText)}
						</div>
					</div>

					<div class="report-info__action-block" data-role="rating-add-review">
						<div class="report-info__rating-stars" data-role="rating-stars-input"></div>
						<div class="report-info__hint">
							${Text.encode(ratingHintText)}
							${ratingHintIcon}
						</div>
					</div>
				</div>

				<div class="report-info__list">
					${publishedRow}

					<div class="report-info__row">
						<div class="report-info__label">${Text.encode(updatedLabel)}</div>
						<div class="report-info__value">
							${this.getUpdatedSourceMarkup()}
							<span>${this.updatedDate}</span>
						</div>
					</div>

						<div class="report-info__row">
							<div class="report-info__label">
								${Text.encode(periodLabel)}
								<span data-hint="${Text.encode(periodHint)}"></span>
							</div>
							<div class="report-info__value">
								<div class="ui-icon-set --o-calendar-with-slots report-info__value-icon"></div>
								<span>${this.period}</span>
							</div>
						</div>
				</div>
			</div>
		`;
	}

	isRatingAvailable(): boolean
	{
		return this.isMarketModuleInstalled && Type.isStringFilled(this.appCode);
	}

	getPublishedLabel(): string
	{
		if (this.dashboard.TYPE === 'SYSTEM' || this.dashboard.TYPE === 'MARKET')
		{
			return Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_INSTALLED') ?? '';
		}

		return Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_PUBLISHED') ?? '';
	}

	renderPublishedRow(label: string): string
	{
		if (!this.shouldShowPublishedRow())
		{
			return '';
		}

		return `
			<div class="report-info__row">
				<div class="report-info__label">${Text.encode(label)}</div>
				<div class="report-info__value">
					${this.getAvatarMarkup(this.dashboard.PUBLISHED_BY_ID, this.dashboard.PUBLISHED_BY_PERSONAL_PHOTO)}
					<span>${this.publishedDate}</span>
				</div>
			</div>
		`;
	}

	shouldShowPublishedRow(): boolean
	{
		return !(this.dashboard.TYPE === 'CUSTOM' && this.dashboard.STATUS === 'D');
	}

	getUpdatedSourceMarkup(): string
	{
		if (this.dashboard.TYPE === 'SYSTEM' || this.dashboard.TYPE === 'MARKET')
		{
			return '<div class="ui-icon-set --o-refresh report-info__value-icon"></div>';
		}

		return this.getAvatarMarkup(
			this.dashboard.UPDATED_BY_ID,
			this.dashboard.UPDATED_BY_PERSONAL_PHOTO,
			!Type.isStringFilled(this.dashboard.UPDATED_DATE),
		);
	}

	mountRatingStarsInput(container: HTMLElement): void
	{
		if (!Type.isDomNode(container))
		{
			return;
		}

		this.unmountRatingStarsInput();

		this.ratingStarsApp = BitrixVue.createApp(RatingStarsInput, {
			modelValue: Math.max(0, Math.min(5, Text.toNumber(this.fullFilledStars))),
			hoverable: this.canReview,
			clickable: this.canReview,
			allowClear: false,
			disabled: false,
			error: false,
			size: 26,
			emptyStrokeColor: 'var(--ui-color-base-3)',
			emptyHoverStrokeColor: 'var(--ui-color-base-2)',
			onChange: (rating) => {
				const ratingNumber = Text.toNumber(rating);
				if (ratingNumber > 0)
				{
					this.showReviewPopup(ratingNumber);
				}
			},
		});

		this.ratingStarsApp.mount(container);
	}

	unmountRatingStarsInput(): void
	{
		if (this.ratingStarsApp)
		{
			this.ratingStarsApp.unmount();
			this.ratingStarsApp = null;
		}
	}

	destroy(): void
	{
		this.closeReviewPopup();
		this.unmountRatingStarsInput();
	}

	openMarketDetailSlider(): void
	{
		if (!this.isRatingAvailable())
		{
			return;
		}

		const url = MarketLinks.appDetail({ CODE: this.appCode }, { from: 'bi_dashboard' });

		BX.SidePanel.Instance.open(url, {
			width: 1100,
			cacheable: false,
		});
	}

	getAvatarMarkup(userIdRaw: number, personalPhotoRaw: string, forceEmpty: boolean = false): string
	{
		if (forceEmpty)
		{
			return '';
		}

		const userId = Text.toNumber(userIdRaw);
		const personalPhoto = Type.isStringFilled(personalPhotoRaw) ? Text.encode(personalPhotoRaw) : '';
		const style = personalPhoto ? ` style="background-image: url('${personalPhoto}');"` : '';
		const avatar = `<span class="report-info__avatar ui-icon ui-icon-common-user"><i${style}></i></span>`;

		if (userId > 0)
		{
			return `
				<a class="report-info__avatar-link" href="/company/personal/user/${userId}/">
					${avatar}
				</a>
			`;
		}

		return avatar;
	}

	showReviewPopup(initialRatingRaw: number = 0): void
	{
		if (!this.isRatingAvailable() || !this.canReview)
		{
			return;
		}

		const initialRating = Math.max(0, Math.min(5, Text.toNumber(initialRatingRaw)));

		const popupContainer = document.createElement('div');
		const appInfo = {
			REVIEW_APP_CODE: this.appCode,
			NAME: this.dashboardTitle,
			ICON: this.dashboard?.ICON ?? `${this.imagesPath}/icon_empty.png`,
			REVIEWS: {
				CAN_REVIEW: this.ratingInfo?.CAN_REVIEW ?? 'N',
			},
		};

		this.reviewPopup = BitrixVue.createApp(RatingReview, {
			appInfo,
			initialRating,
			isSite: false,
			notifyPosition: BX.UI.Notification.Position.TOP_RIGHT,
			onSuccess: (event) => {
				this.successReviewHandler(event);
			},
			onClose: () => {
				this.closeReviewPopup();
			},
		});
		this.reviewPopup.mount(popupContainer);
	}

	successReviewHandler()
	{
		this.closeReviewPopup();
		if (Type.isFunction(this.reloadDashboardCallback))
		{
			this.reloadDashboardCallback({ refreshMarket: true });
		}
	}

	closeReviewPopup()
	{
		if (this.reviewPopup)
		{
			this.reviewPopup.unmount();
			this.reviewPopup = null;
		}
	}
}
