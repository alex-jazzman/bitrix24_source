/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
this.BX.BIConnector.ApacheSuperset = this.BX.BIConnector.ApacheSuperset || {};
this.BX.BIConnector.ApacheSuperset.Dashboard = this.BX.BIConnector.ApacheSuperset.Dashboard || {};
(function (exports, main_core, main_core_events, main_loader, im_public, biconnector_apacheSupersetDashboardManager, biconnector_apacheSupersetAnalytics, main_popup, ui_vue3, market_ratingReview, market_marketLinks, market_ratingStarsInput) {
	'use strict';

	class VendorBlock {
		constructor(partnerName, dashboardType) {
			this.partnerName = partnerName;
			this.dashboardType = dashboardType;
		}
		getLabel() {
			if (this.dashboardType === 'CUSTOM') {
				return this.getCustomDashboardLabel();
			}
			if (!main_core.Type.isStringFilled(this.partnerName)) {
				return '';
			}
			return main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_VENDOR', {
				'#PARTNER_NAME#': main_core.Text.encode(this.partnerName)
			}) ?? '';
		}
		getCustomDashboardLabel() {
			return main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_CUSTOM_VENDOR') ?? '';
		}
		render() {
			const vendorLabel = this.getLabel();
			if (!main_core.Type.isStringFilled(vendorLabel)) {
				return '';
			}
			return `<span>${vendorLabel}</span>`;
		}
	}

	class ViewsBlock {
		constructor(viewsCountRaw) {
			this.viewsCountRaw = viewsCountRaw;
		}
		getCount() {
			return Math.max(0, main_core.Text.toNumber(this.viewsCountRaw));
		}
		render() {
			const viewsCount = this.getCount();
			const viewsTitle = main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_VIEWS_TITLE') ?? '';
			return `
			<span class="report__views" title="${main_core.Text.encode(viewsTitle)}">
				<div class="ui-icon-set --o-observer"></div>
				${viewsCount}
			</span>
		`;
		}
	}

	class ButtonsBlock {
		static render(canShowMoreMenu = false) {
			const buttonDiscuss = main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_BUTTON_DISCUSS') ?? '';
			const moreButton = canShowMoreMenu ? `
				<button id="more-btn" class="ui-btn ui-btn-md --air ui-btn-no-caps --style-outline --with-left-icon dashboard-info-header-buttons-more">
					<div class="ui-icon-set --more-m"></div>
				</button>
			` : '';
			return `
			<button id="discuss-btn" class="ui-btn ui-btn-md ui-btn-primary --air ui-btn-no-caps --with-left-icon dashboard-info-header-buttons-discuss">
				<div class="ui-icon-set --o-chats"></div>
				${main_core.Text.encode(buttonDiscuss)}
			</button>
			${moreButton}
		`;
		}
	}
	class MoreMenu {
		constructor(options) {
			this.button = options.button;
			this.menuId = options.menuId;
			this.canModifySettings = options.canModifySettings === true;
			this.canDelete = options.canDelete === true;
			this.onEdit = main_core.Type.isFunction(options.onEdit) ? options.onEdit : () => {};
			this.onDelete = main_core.Type.isFunction(options.onDelete) ? options.onDelete : () => {};
			this.onButtonClickHandler = this.onButtonClick.bind(this);
		}
		bind() {
			if (!main_core.Type.isDomNode(this.button)) {
				return;
			}
			main_core.Event.unbindAll(this.button);
			main_core.Event.bind(this.button, 'click', this.onButtonClickHandler);
		}
		onButtonClick() {
			if (!main_core.Type.isDomNode(this.button)) {
				return;
			}
			const openedMenu = main_popup.MenuManager.getMenuById(this.menuId);
			if (openedMenu) {
				openedMenu.close();
				return;
			}
			const menuItems = this.getMenuItems();
			if (menuItems.length === 0) {
				return;
			}
			const angleOffset = Math.round(this.button.offsetWidth / 2 + main_popup.Popup.getOption('angleMinTop'));
			const moreMenu = main_popup.MenuManager.create({
				id: this.menuId,
				closeByEsc: true,
				closeIcon: false,
				cacheable: false,
				className: 'report-more-menu',
				angle: {
					offset: angleOffset
				},
				items: menuItems,
				autoHide: true,
				bindElement: this.button
			});
			moreMenu.show();
		}
		getMenuItems() {
			const items = [];
			if (this.canModifySettings) {
				items.push({
					html: main_core.Tag.render`
					<span class="report-more-menu-item">
						<span class="report-more-menu-item__text">
							${main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_MORE_MENU_EDIT') ?? ''}
						</span>
						<span class="ui-icon-set --edit-m"></span>
					</span>
				`,
					onclick: () => {
						this.onEdit();
						this.close();
					}
				});
			}
			if (this.canDelete) {
				items.push({
					html: main_core.Tag.render`
					<span class="report-more-menu-item report-more-menu-item--danger">
						<span class="report-more-menu-item__text">
							${main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_MORE_MENU_DELETE') ?? ''}
						</span>
						<span class="ui-icon-set --o-trashcan"></span>
					</span>
				`,
					onclick: () => {
						this.onDelete();
						this.close();
					}
				});
			}
			return items;
		}
		close() {
			const menu = main_popup.MenuManager.getMenuById(this.menuId);
			if (menu) {
				menu.close();
			}
		}
	}

	function normalizeImageUrl(url) {
		if (!main_core.Type.isStringFilled(url)) {
			return '';
		}
		const normalizedUrl = url.trim();
		if (!main_core.Type.isStringFilled(normalizedUrl)) {
			return '';
		}
		const isRootRelative = normalizedUrl.startsWith('/');
		const hasScheme = /^[a-z][a-z\d+\-.]*:/i.test(normalizedUrl);
		if (!isRootRelative && !hasScheme) {
			return '';
		}
		try {
			const parsedUrl = new URL(normalizedUrl, window.location.origin);
			const protocol = parsedUrl.protocol.toLowerCase();
			if (protocol !== 'http:' && protocol !== 'https:') {
				return '';
			}
		} catch (error) {
			return '';
		}
		return normalizedUrl;
	}

	class CoverBlock {
		constructor(options) {
			this.icon = options.icon;
			this.dashboardType = options.dashboardType;
			this.emptyIconPath = options.emptyIconPath;
			this.marketBackgroundPath = options.marketBackgroundPath;
		}
		static getRandomMarketBackgroundPath(isMarketModuleInstalled) {
			if (!isMarketModuleInstalled) {
				return '';
			}
			const maxBackgrounds = 30;
			const backgroundIndex = Math.floor(Math.random() * maxBackgrounds) + 1;
			return `/bitrix/js/market/images/backgrounds/${backgroundIndex}.png`;
		}
		static isMarketDashboardType(dashboardType) {
			return dashboardType === 'MARKET' || dashboardType === 'SYSTEM';
		}
		render() {
			const safeImageUrl = normalizeImageUrl(this.icon);
			if (main_core.Type.isStringFilled(safeImageUrl)) {
				const safeIcon = main_core.Text.encode(safeImageUrl);
				if (CoverBlock.isMarketDashboardType(this.dashboardType)) {
					const coverStyle = this.marketBackgroundPath ? ` style="--report-market-background-image: url('${main_core.Text.encode(this.marketBackgroundPath)}');"` : '';
					return `
					<div class="report__cover report__cover--market"${coverStyle}>
						<img class="report__cover-image report__cover-image--market" src="${safeIcon}" alt=""/>
					</div>
				`;
				}
				return `
				<div class="report__cover">
					<img class="report__cover-image" src="${safeIcon}" alt=""/>
				</div>
			`;
			}
			const safeIconPath = main_core.Text.encode(this.emptyIconPath);
			return `
			<div class="report__cover">
				<div class="report__cover-empty">
					<img class="report__cover-empty-image" src="${safeIconPath}" alt=""/>
				</div>
			</div>
		`;
		}
	}

	class InfoBlock {
		constructor(options) {
			this.dashboardTitle = options.dashboard?.TITLE ?? '';
			this.dashboard = options.dashboard;
			this.publishedDate = options.publishedDate;
			this.updatedDate = options.updatedDate;
			this.period = options.period;
			this.reloadDashboardCallback = options.reloadDashboardCallback;
			this.isMarketModuleInstalled = options.isMarketModuleInstalled;
			this.appCode = main_core.Type.isStringFilled(options.appCode) ? options.appCode : '';
			this.imagesPath = options.imagesPath;
			this.ratingInfo = null;
			this.rating = 0;
			this.reviewsCount = 0;
			this.canReview = false;
			this.fullFilledStars = 0;
			this.reviewPopup = null;
			this.ratingStarsApp = null;
			if (this.isRatingAvailable()) {
				this.ratingInfo = this.dashboard?.RATING_INFO ?? {};
				this.rating = main_core.Type.isNumber(this.ratingInfo?.RATING?.RATING) ? this.ratingInfo.RATING.RATING : 0;
				this.reviewsCount = main_core.Type.isNumber(this.ratingInfo?.RATING?.COUNT) ? this.ratingInfo.RATING.COUNT : 0;
				this.canReview = this.ratingInfo?.CAN_REVIEW === 'Y';
				this.fullFilledStars = this.canReview ? 0 : this.ratingInfo.USER_RATING;
			}
		}
		static getDateValue(dateRaw) {
			return main_core.Type.isStringFilled(dateRaw) ? main_core.Text.encode(dateRaw) : '&ndash;';
		}
		static getPeriodValue(periodRaw) {
			return main_core.Type.isStringFilled(periodRaw) ? main_core.Text.encode(periodRaw) : '&ndash;';
		}
		render() {
			const publishedLabel = this.getPublishedLabel();
			const publishedRow = this.renderPublishedRow(publishedLabel);
			const updatedLabel = main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_UPDATED') ?? '';
			const periodLabel = main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_PERIOD') ?? '';
			const periodHint = main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_PERIOD_HINT') ?? '';
			let ratingHintText = '';
			let ratingCountText = '';
			let ratingHintIcon = '';
			if (this.isRatingAvailable()) {
				ratingHintText = (this.canReview ? main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_RATING_HINT') : main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_RATING_ALREADY_HAS_REVIEW')) ?? '';
				ratingCountText = main_core.Loc.getMessagePlural('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_RATING_COUNT', this.reviewsCount, {
					'#COUNT#': this.reviewsCount
				}) ?? '';
			} else {
				ratingHintText = main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_RATING_CAN_NOT_REVIEW') ?? '';
				const ratingHintTooltip = main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_RATING_CAN_NOT_REVIEW_HINT', {
					'[br]': '\n'
				}) ?? '';
				ratingHintIcon = `<span data-hint="${main_core.Text.encode(ratingHintTooltip)}"></span>`;
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
							${main_core.Text.encode(ratingCountText)}
						</div>
					</div>

					<div class="report-info__action-block" data-role="rating-add-review">
						<div class="report-info__rating-stars" data-role="rating-stars-input"></div>
						<div class="report-info__hint">
							${main_core.Text.encode(ratingHintText)}
							${ratingHintIcon}
						</div>
					</div>
				</div>

				<div class="report-info__list">
					${publishedRow}

					<div class="report-info__row">
						<div class="report-info__label">${main_core.Text.encode(updatedLabel)}</div>
						<div class="report-info__value">
							${this.getUpdatedSourceMarkup()}
							<span>${this.updatedDate}</span>
						</div>
					</div>

						<div class="report-info__row">
							<div class="report-info__label">
								${main_core.Text.encode(periodLabel)}
								<span data-hint="${main_core.Text.encode(periodHint)}"></span>
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
		isRatingAvailable() {
			return this.isMarketModuleInstalled && main_core.Type.isStringFilled(this.appCode);
		}
		getPublishedLabel() {
			if (this.dashboard.TYPE === 'SYSTEM' || this.dashboard.TYPE === 'MARKET') {
				return main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_INSTALLED') ?? '';
			}
			return main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_PUBLISHED') ?? '';
		}
		renderPublishedRow(label) {
			if (!this.shouldShowPublishedRow()) {
				return '';
			}
			return `
			<div class="report-info__row">
				<div class="report-info__label">${main_core.Text.encode(label)}</div>
				<div class="report-info__value">
					${this.getAvatarMarkup(this.dashboard.PUBLISHED_BY_ID, this.dashboard.PUBLISHED_BY_PERSONAL_PHOTO)}
					<span>${this.publishedDate}</span>
				</div>
			</div>
		`;
		}
		shouldShowPublishedRow() {
			return !(this.dashboard.TYPE === 'CUSTOM' && this.dashboard.STATUS === 'D');
		}
		getUpdatedSourceMarkup() {
			if (this.dashboard.TYPE === 'SYSTEM' || this.dashboard.TYPE === 'MARKET') {
				return '<div class="ui-icon-set --o-refresh report-info__value-icon"></div>';
			}
			return this.getAvatarMarkup(this.dashboard.UPDATED_BY_ID, this.dashboard.UPDATED_BY_PERSONAL_PHOTO, !main_core.Type.isStringFilled(this.dashboard.UPDATED_DATE));
		}
		mountRatingStarsInput(container) {
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			this.unmountRatingStarsInput();
			this.ratingStarsApp = ui_vue3.BitrixVue.createApp(market_ratingStarsInput.RatingStarsInput, {
				modelValue: Math.max(0, Math.min(5, main_core.Text.toNumber(this.fullFilledStars))),
				hoverable: this.canReview,
				clickable: this.canReview,
				allowClear: false,
				disabled: false,
				error: false,
				size: 26,
				emptyStrokeColor: 'var(--ui-color-base-3)',
				emptyHoverStrokeColor: 'var(--ui-color-base-2)',
				onChange: rating => {
					const ratingNumber = main_core.Text.toNumber(rating);
					if (ratingNumber > 0) {
						this.showReviewPopup(ratingNumber);
					}
				}
			});
			this.ratingStarsApp.mount(container);
		}
		unmountRatingStarsInput() {
			if (this.ratingStarsApp) {
				this.ratingStarsApp.unmount();
				this.ratingStarsApp = null;
			}
		}
		destroy() {
			this.closeReviewPopup();
			this.unmountRatingStarsInput();
		}
		openMarketDetailSlider() {
			if (!this.isRatingAvailable()) {
				return;
			}
			const url = market_marketLinks.MarketLinks.appDetail({
				CODE: this.appCode
			}, {
				from: 'bi_dashboard'
			});
			BX.SidePanel.Instance.open(url, {
				width: 1100,
				cacheable: false
			});
		}
		getAvatarMarkup(userIdRaw, personalPhotoRaw, forceEmpty = false) {
			if (forceEmpty) {
				return '';
			}
			const userId = main_core.Text.toNumber(userIdRaw);
			const personalPhoto = main_core.Type.isStringFilled(personalPhotoRaw) ? main_core.Text.encode(personalPhotoRaw) : '';
			const style = personalPhoto ? ` style="background-image: url('${personalPhoto}');"` : '';
			const avatar = `<span class="report-info__avatar ui-icon ui-icon-common-user"><i${style}></i></span>`;
			if (userId > 0) {
				return `
				<a class="report-info__avatar-link" href="/company/personal/user/${userId}/">
					${avatar}
				</a>
			`;
			}
			return avatar;
		}
		showReviewPopup(initialRatingRaw = 0) {
			if (!this.isRatingAvailable() || !this.canReview) {
				return;
			}
			const initialRating = Math.max(0, Math.min(5, main_core.Text.toNumber(initialRatingRaw)));
			const popupContainer = document.createElement('div');
			const appInfo = {
				REVIEW_APP_CODE: this.appCode,
				NAME: this.dashboardTitle,
				ICON: this.dashboard?.ICON ?? `${this.imagesPath}/icon_empty.png`,
				REVIEWS: {
					CAN_REVIEW: this.ratingInfo?.CAN_REVIEW ?? 'N'
				}
			};
			this.reviewPopup = ui_vue3.BitrixVue.createApp(market_ratingReview.RatingReview, {
				appInfo,
				initialRating,
				isSite: false,
				notifyPosition: BX.UI.Notification.Position.TOP_RIGHT,
				onSuccess: event => {
					this.successReviewHandler(event);
				},
				onClose: () => {
					this.closeReviewPopup();
				}
			});
			this.reviewPopup.mount(popupContainer);
		}
		successReviewHandler() {
			this.closeReviewPopup();
			if (main_core.Type.isFunction(this.reloadDashboardCallback)) {
				this.reloadDashboardCallback({
					refreshMarket: true
				});
			}
		}
		closeReviewPopup() {
			if (this.reviewPopup) {
				this.reviewPopup.unmount();
				this.reviewPopup = null;
			}
		}
	}

	class GalleryBlock {
		constructor(gallery, options) {
			this.gallery = gallery;
			this.eps = options.eps;
			this.defaultStep = options.defaultStep;
			this.viewport = null;
			this.btnPrev = null;
			this.btnNext = null;
			this.resizeObserver = null;
			this.isWindowLoadBound = false;
			this.onPrev = () => {
				if (main_core.Type.isDomNode(this.viewport)) {
					this.viewport.scrollBy({
						left: -this.getStepPx(),
						behavior: 'smooth'
					});
				}
			};
			this.onNext = () => {
				if (main_core.Type.isDomNode(this.viewport)) {
					this.viewport.scrollBy({
						left: this.getStepPx(),
						behavior: 'smooth'
					});
				}
			};
			this.onScroll = () => this.update();
			this.onResize = () => this.update();
			this.onWindowLoad = () => {
				this.isWindowLoadBound = false;
				this.update();
			};
		}
		static normalizeImages(imagesRaw) {
			if (!Array.isArray(imagesRaw)) {
				return [];
			}
			return imagesRaw.map(image => normalizeImageUrl(GalleryBlock.getImageSrc(image))).filter(imageSrc => main_core.Type.isStringFilled(imageSrc));
		}
		static render(images, viewerGroupId) {
			if (!main_core.Type.isArrayFilled(images)) {
				return '';
			}
			const items = images.map(imageSrc => {
				const normalizedImageSrc = normalizeImageUrl(imageSrc);
				if (!main_core.Type.isStringFilled(normalizedImageSrc)) {
					return '';
				}
				const safeImageSrc = main_core.Text.encode(normalizedImageSrc);
				return `
					<a
						class="report-gallery__item"
						href="${safeImageSrc}"
						target="_blank"
						rel="noopener"
						style="background-image: url('${safeImageSrc}')"
						data-viewer
						data-viewer-type="image"
						data-src="${safeImageSrc}"
						data-viewer-group-by="${main_core.Text.encode(viewerGroupId)}"
					></a>
				`;
			}).filter(item => item !== '').join('');
			if (items === '') {
				return '';
			}
			return `
			<div class="report__row">
				<div class="report__gallery" data-role="gallery">
					<button class="report-gallery__nav report-gallery__nav--left" type="button" aria-label="Назад" data-role="prev">
						<div class="ui-icon-set --chevron-left-l"></div>
					</button>

					<div class="report-gallery__viewport" tabindex="0" data-role="viewport">
						<div class="report-gallery__track" data-role="track">
							${items}
						</div>
					</div>

					<button class="report-gallery__nav report-gallery__nav--right" type="button" aria-label="Вперёд" data-role="next">
						<div class="ui-icon-set --chevron-right-l"></div>
					</button>

					<div class="report-gallery__fade report-gallery__fade--left" aria-hidden="true" data-role="fade-left"></div>
					<div class="report-gallery__fade report-gallery__fade--right" aria-hidden="true" data-role="fade-right"></div>
				</div>
			</div>
		`;
		}
		bind() {
			const viewport = this.gallery.querySelector('[data-role="viewport"]');
			if (!main_core.Type.isDomNode(viewport)) {
				return;
			}
			this.destroy();
			this.viewport = viewport;
			this.btnPrev = this.gallery.querySelector('[data-role="prev"]');
			this.btnNext = this.gallery.querySelector('[data-role="next"]');
			main_core.Event.bind(this.btnPrev, 'click', this.onPrev);
			main_core.Event.bind(this.btnNext, 'click', this.onNext);
			main_core.Event.bind(this.viewport, 'scroll', this.onScroll, {
				passive: true
			});
			if (main_core.Type.isFunction(window.ResizeObserver)) {
				this.resizeObserver = new ResizeObserver(this.onResize);
				this.resizeObserver.observe(this.viewport);
				this.resizeObserver.observe(this.gallery);
			}
			if (document.readyState === 'complete') {
				this.update();
			} else {
				this.isWindowLoadBound = true;
				main_core.Event.bind(window, 'load', this.onWindowLoad, {
					once: true
				});
			}
		}
		destroy() {
			if (main_core.Type.isDomNode(this.btnPrev)) {
				main_core.Event.unbind(this.btnPrev, 'click', this.onPrev);
			}
			if (main_core.Type.isDomNode(this.btnNext)) {
				main_core.Event.unbind(this.btnNext, 'click', this.onNext);
			}
			if (main_core.Type.isDomNode(this.viewport)) {
				main_core.Event.unbind(this.viewport, 'scroll', this.onScroll);
			}
			if (this.isWindowLoadBound) {
				main_core.Event.unbind(window, 'load', this.onWindowLoad);
				this.isWindowLoadBound = false;
			}
			if (this.resizeObserver) {
				this.resizeObserver.disconnect();
				this.resizeObserver = null;
			}
			this.viewport = null;
			this.btnPrev = null;
			this.btnNext = null;
		}
		update() {
			const viewport = this.gallery.querySelector('[data-role="viewport"]');
			const track = this.gallery.querySelector('[data-role="track"]');
			const btnPrev = this.gallery.querySelector('[data-role="prev"]');
			const btnNext = this.gallery.querySelector('[data-role="next"]');
			if (!main_core.Type.isDomNode(viewport) || !main_core.Type.isDomNode(track)) {
				return;
			}
			const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
			const isScrollable = maxScrollLeft > this.eps;
			this.toggleClass(this.gallery, 'is-static', !isScrollable);
			if (!isScrollable) {
				main_core.Dom.removeClass(this.gallery, 'has-left-fade');
				main_core.Dom.removeClass(this.gallery, 'has-right-fade');
				this.setButtonVisibility(btnPrev, false);
				this.setButtonVisibility(btnNext, false);
				return;
			}
			const atStart = viewport.scrollLeft <= this.eps;
			const atEnd = viewport.scrollLeft >= maxScrollLeft - this.eps;
			this.toggleClass(this.gallery, 'has-left-fade', !atStart);
			this.toggleClass(this.gallery, 'has-right-fade', !atEnd);
			this.setButtonVisibility(btnPrev, !atStart);
			this.setButtonVisibility(btnNext, !atEnd);
		}
		getStepPx() {
			const item = this.gallery.querySelector('.report-gallery__item');
			const track = this.gallery.querySelector('[data-role="track"]');
			if (!main_core.Type.isDomNode(item) || !main_core.Type.isDomNode(track)) {
				return this.defaultStep;
			}
			const itemWidth = item.getBoundingClientRect().width;
			const styles = getComputedStyle(track);
			const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
			return Math.round(itemWidth + gap);
		}
		setButtonVisibility(button, isVisible) {
			if (!main_core.Type.isDomNode(button)) {
				return;
			}
			main_core.Dom.style(button, 'visibility', isVisible ? 'visible' : 'hidden');
		}
		toggleClass(node, className, isEnabled) {
			if (isEnabled) {
				main_core.Dom.addClass(node, className);
			} else {
				main_core.Dom.removeClass(node, className);
			}
		}
		static getImageSrc(image) {
			if (main_core.Type.isStringFilled(image)) {
				return image;
			}
			if (main_core.Type.isPlainObject(image) && main_core.Type.isStringFilled(image.SRC)) {
				return image.SRC;
			}
			if (main_core.Type.isPlainObject(image) && main_core.Type.isStringFilled(image.src)) {
				return image.src;
			}
			return '';
		}
	}

	class DescriptionBlock {
		constructor(description) {
			this.description = description;
		}
		render() {
			const descriptionTitle = main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_DESCRIPTION_TITLE') ?? '';
			return `
			<div class="report__row">
				<div class="report__description">
					<div class="report__description-title">
						${main_core.Text.encode(descriptionTitle)}
					</div>
					<div class="report__description-content">
						${this.description}
					</div>
				</div>
			</div>
		`;
		}
		static getDescriptionValue(descriptionRaw, emptyDescriptionPath) {
			if (main_core.Type.isStringFilled(descriptionRaw)) {
				return DescriptionBlock.prepareDescriptionMarkup(descriptionRaw);
			}
			return DescriptionBlock.getDescriptionEmptyMarkup(emptyDescriptionPath);
		}
		static prepareDescriptionMarkup(descriptionRaw) {
			if (!main_core.Type.isStringFilled(descriptionRaw)) {
				return '';
			}
			const container = document.createElement('div');
			container.innerHTML = descriptionRaw;
			container.querySelectorAll('a[href]').forEach(link => {
				link.setAttribute('target', '_blank');
				link.setAttribute('data-slider-ignore-autobinding', 'true');
				const relValues = new Set((link.getAttribute('rel') ?? '').split(/\s+/).filter(Boolean));
				relValues.add('noopener');
				relValues.add('noreferrer');
				link.setAttribute('rel', Array.from(relValues).join(' '));
			});
			return container.innerHTML;
		}
		static getDescriptionEmptyMarkup(emptyDescriptionPath) {
			const safeDescriptionPath = main_core.Text.encode(emptyDescriptionPath);
			const emptyMessage = main_core.Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_DESCRIPTION_EMPTY') ?? '';
			return `
			<div class="report__description-empty">
				<div class="report__description-empty__image">
					<img src="${safeDescriptionPath}" alt=""/>
				</div>
				<div class="report__description-empty__text">
					${main_core.Text.encode(emptyMessage)}
				</div>
			</div>
		`;
		}
	}

	class InfoInstance {
		constructor(config = {}) {
			this.eps = 2;
			this.defaultStep = 240;
			this.dashboardId = main_core.Type.isNumber(config.dashboardId) ? config.dashboardId : 0;
			this.componentName = main_core.Type.isStringFilled(config.componentName) ? config.componentName : 'bitrix:biconnector.apachesuperset.dashboard.detail.info';
			this.appNodeId = main_core.Type.isStringFilled(config.appNodeId) ? config.appNodeId : 'biconnector-dashboard-detail-info-app';
			this.appNode = document.getElementById(this.appNodeId);
			this.viewerGroupId = `biconnector-dashboard-detail-info-gallery-${this.dashboardId || 'default'}`;
			this.moreMenuId = `biconnector-dashboard-detail-info-more-menu-${this.dashboardId || 'default'}`;
			this.dashboardListUrl = main_core.Type.isStringFilled(config.dashboardListUrl) ? config.dashboardListUrl : '/bi/dashboard/';
			this.imagesPath = main_core.Type.isStringFilled(config.imagesPath) ? config.imagesPath : '';
			this.emptyIconPath = this.imagesPath ? `${this.imagesPath}/icon_empty.png` : '';
			this.emptyDescriptionPath = this.imagesPath ? `${this.imagesPath}/description_empty.png` : '';
			this.isMarketModuleInstalled = config.isMarketModuleInstalled === true;
			this.marketBackgroundPath = CoverBlock.getRandomMarketBackgroundPath(this.isMarketModuleInstalled);
			this.canModifySettings = config.canModifySettings === true;
			this.canDelete = config.canDelete === true;
			this.currentCanModifySettings = this.canModifySettings;
			this.currentCanDelete = this.canDelete;
			this.dashboardType = '';
			this.appCode = '';
			this.dashboardManager = null;
			this.loader = null;
			this.discussButton = null;
			this.isDiscussRequestRunning = false;
			this.moreButton = null;
			this.moreMenuBlock = null;
			this.galleries = [];
			this.galleryBlocks = [];
			this.infoBlock = null;
			this.dashboardSavedEventName = 'BIConnector.CreateForm:onDashboardSaved';
			this.settingsSavedEventName = 'BX.BIConnector.Settings:onAfterSave';
			this.onDashboardSavedHandler = this.onDashboardSaved.bind(this);
			this.onSettingsSavedHandler = this.onSettingsSaved.bind(this);
			this.onWindowUnloadHandler = this.onWindowUnload.bind(this);
			this.init();
		}
		init() {
			if (!main_core.Type.isDomNode(this.appNode)) {
				return;
			}
			this.bindLifecycleEvents();
			this.subscribeToDashboardSavedEvent();
			this.subscribeToSettingsSavedEvent();
			this.loadDashboardData().then(response => {
				const dashboard = response?.data?.dashboard;
				if (!main_core.Type.isPlainObject(dashboard)) {
					throw new TypeError('Dashboard data was not returned.');
				}
				this.renderDashboard(dashboard);
				this.bindDynamicElements();
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('view', 'card_report_view', {
					type: (dashboard.TYPE ?? '').toLowerCase(),
					c_element: 'context_menu',
					status: 'success'
				});
			}).catch(response => {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('view', 'card_report_view', {
					c_element: 'context_menu',
					status: 'error'
				});
				this.renderError(this.getErrorMessage(response));
			});
		}
		bindLifecycleEvents() {
			main_core.Event.bind(window, 'unload', this.onWindowUnloadHandler);
		}
		onWindowUnload() {
			this.destroyGalleryBlocks();
			this.unsubscribeFromDashboardSavedEvent();
			this.unsubscribeFromSettingsSavedEvent();
		}
		subscribeToDashboardSavedEvent() {
			const eventBus = this.getEventBus();
			if (!eventBus) {
				return;
			}
			if (main_core.Type.isFunction(eventBus.unsubscribe)) {
				eventBus.unsubscribe(this.dashboardSavedEventName, this.onDashboardSavedHandler);
			}
			if (eventBus && main_core.Type.isFunction(eventBus.subscribe)) {
				eventBus.subscribe(this.dashboardSavedEventName, this.onDashboardSavedHandler);
			}
		}
		unsubscribeFromDashboardSavedEvent() {
			const eventBus = this.getEventBus();
			if (eventBus && main_core.Type.isFunction(eventBus.unsubscribe)) {
				eventBus.unsubscribe(this.dashboardSavedEventName, this.onDashboardSavedHandler);
			}
		}
		subscribeToSettingsSavedEvent() {
			main_core_events.EventEmitter.unsubscribe(this.settingsSavedEventName, this.onSettingsSavedHandler);
			main_core_events.EventEmitter.subscribe(this.settingsSavedEventName, this.onSettingsSavedHandler);
		}
		unsubscribeFromSettingsSavedEvent() {
			main_core_events.EventEmitter.unsubscribe(this.settingsSavedEventName, this.onSettingsSavedHandler);
		}
		getEventBus() {
			return window.top?.BX?.Event?.EventEmitter ?? main_core_events.EventEmitter;
		}
		onDashboardSaved(event) {
			if (!this.isDocumentAttached()) {
				return;
			}
			const rawData = event && main_core.Type.isFunction(event.getData) ? event.getData() : null;
			const data = Array.isArray(rawData) ? rawData[0] : rawData;
			const dashboardId = main_core.Text.toNumber(data?.dashboard?.id);
			const isEditMode = data?.isEditMode === true;
			if (!isEditMode || dashboardId <= 0 || dashboardId !== this.dashboardId) {
				return;
			}
			this.reloadDashboard();
		}
		onSettingsSaved() {
			if (!this.isDocumentAttached()) {
				return;
			}
			this.reloadDashboard();
		}
		isDocumentAttached() {
			return main_core.Type.isDomNode(this.appNode) && Boolean(document.body?.contains(this.appNode));
		}
		loadDashboardData(options = {}) {
			if (this.dashboardId <= 0) {
				return Promise.reject(new TypeError(this.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_LOAD_ERROR')));
			}
			if (!this.isDocumentAttached()) {
				return Promise.reject(new Error('Document is detached.'));
			}
			const refreshMarket = options?.refreshMarket === true;
			this.showLoader();
			const requestPromise = main_core.ajax.runComponentAction(this.componentName, 'getDashboardData', {
				mode: 'class',
				data: {
					dashboardId: this.dashboardId,
					refreshMarket: refreshMarket ? 1 : 0
				}
			});
			return requestPromise.then(response => {
				this.hideLoader();
				return response;
			}).catch(error => {
				this.hideLoader();
				return Promise.reject(error);
			});
		}
		showLoader() {
			if (!main_core.Type.isDomNode(this.appNode)) {
				return;
			}
			if (!this.loader) {
				this.loader = new main_loader.Loader({
					target: this.appNode,
					size: 80
				});
			}
			this.loader.show();
		}
		hideLoader() {
			if (this.loader) {
				this.loader.hide();
			}
		}
		updateTitle(title) {
			if (!main_core.Type.isStringFilled(title)) {
				return;
			}
			BX.ajax?.UpdatePageTitle?.(title);
			BX.ajax?.UpdateWindowTitle?.(title);
			const sidePanel = BX.SidePanel?.Instance;
			const slider = sidePanel?.getSliderByWindow?.(window);
			if (slider && main_core.Type.isFunction(slider.setTitle)) {
				slider.setTitle(title);
			}
			if (main_core.Type.isFunction(sidePanel?.updateBrowserTitle)) {
				sidePanel.updateBrowserTitle();
			}
		}
		renderDashboard(dashboard) {
			if (!main_core.Type.isDomNode(this.appNode)) {
				return;
			}
			if (this.infoBlock) {
				this.infoBlock.destroy();
				this.infoBlock = null;
			}
			this.destroyGalleryBlocks();
			this.dashboardType = main_core.Type.isStringFilled(dashboard.TYPE) ? dashboard.TYPE : '';
			this.appCode = main_core.Type.isStringFilled(dashboard.APP_CODE) ? dashboard.APP_CODE : '';
			this.currentCanModifySettings = dashboard.CAN_MODIFY_SETTINGS === true || this.canModifySettings === true;
			this.currentCanDelete = dashboard.CAN_DELETE === true || this.canDelete === true;
			if (main_core.Type.isStringFilled(dashboard.TITLE)) {
				this.updateTitle(dashboard.TITLE);
			}
			this.appNode.innerHTML = this.getDashboardMarkup(dashboard);
		}
		renderError(message) {
			if (!main_core.Type.isDomNode(this.appNode)) {
				return;
			}
			this.destroyGalleryBlocks();
			const safeMessage = main_core.Type.isStringFilled(message) ? main_core.Text.encode(message) : main_core.Text.encode(this.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_LOAD_ERROR'));
			this.appNode.innerHTML = `
			<section class="report">
				<div class="report__row">
					<div class="report__description">
						<div class="report__description-title">
							${main_core.Text.encode(this.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_DESCRIPTION_TITLE'))}
						</div>
						<div class="report__description-content">${safeMessage}</div>
					</div>
				</div>
			</section>
		`;
		}
		getErrorMessage(response, fallbackMessage = '') {
			const defaultMessage = main_core.Type.isStringFilled(fallbackMessage) ? fallbackMessage : this.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_LOAD_ERROR');
			if (response instanceof Error && main_core.Type.isStringFilled(response.message)) {
				return response.message;
			}
			const firstError = response?.errors?.[0];
			if (main_core.Type.isStringFilled(firstError?.message)) {
				return firstError.message;
			}
			return defaultMessage;
		}
		bindDynamicElements() {
			if (!main_core.Type.isDomNode(this.appNode)) {
				return;
			}
			this.destroyGalleryBlocks();
			if (BX?.UI?.Hint && main_core.Type.isFunction(BX.UI.Hint.init)) {
				BX.UI.Hint.init(this.appNode);
			}
			this.discussButton = this.appNode.querySelector('#discuss-btn');
			this.moreButton = this.appNode.querySelector('#more-btn');
			this.galleries = [...this.appNode.querySelectorAll('[data-role="gallery"]')];
			const marketDetailNodes = [...this.appNode.querySelectorAll('[data-role="open-market-detail"]')];
			if (this.infoBlock) {
				marketDetailNodes.forEach(marketDetailNode => {
					if (main_core.Type.isDomNode(marketDetailNode)) {
						main_core.Event.bind(marketDetailNode, 'click', () => this.infoBlock.openMarketDetailSlider());
					}
				});
			}
			const reviewNode = this.appNode.querySelector('[data-role="rating-add-review"]');
			if (main_core.Type.isDomNode(reviewNode) && this.infoBlock) {
				main_core.Event.bind(reviewNode, 'click', () => this.infoBlock.showReviewPopup());
			}
			const ratingStarsNode = this.appNode.querySelector('[data-role="rating-stars-input"]');
			if (main_core.Type.isDomNode(ratingStarsNode) && this.infoBlock) {
				this.infoBlock.mountRatingStarsInput(ratingStarsNode);
			}
			this.initActionButtons();
			this.initMoreMenu();
			if (this.galleries.length === 0) {
				return;
			}
			this.galleryBlocks = this.galleries.map(gallery => new GalleryBlock(gallery, {
				eps: this.eps,
				defaultStep: this.defaultStep
			}));
			this.galleryBlocks.forEach(galleryBlock => galleryBlock.bind());
		}
		destroyGalleryBlocks() {
			this.galleryBlocks.forEach(galleryBlock => galleryBlock.destroy());
			this.galleryBlocks = [];
			this.galleries = [];
		}
		getDashboardMarkup(dashboard) {
			const vendorBlock = new VendorBlock(dashboard.PARTNER_NAME, dashboard.TYPE);
			const viewsBlock = new ViewsBlock(dashboard.VIEWS_COUNT);
			const canShowMoreMenu = this.currentCanModifySettings || this.currentCanDelete;
			const publishedDate = InfoBlock.getDateValue(dashboard.PUBLISHED_DATE);
			const updatedDate = InfoBlock.getDateValue(dashboard.UPDATED_DATE);
			const period = InfoBlock.getPeriodValue(dashboard.PERIOD);
			const description = DescriptionBlock.getDescriptionValue(dashboard.DESCRIPTION, this.emptyDescriptionPath);
			const images = GalleryBlock.normalizeImages(dashboard.IMAGES);
			return `
			<section class="report">
				${this.getTopRowMarkup(vendorBlock.render(), viewsBlock.render(), canShowMoreMenu)}
				${this.getOverviewMarkup(dashboard, publishedDate, updatedDate, period)}
				${GalleryBlock.render(images, this.viewerGroupId)}
				${new DescriptionBlock(description).render()}
			</section>
		`;
		}
		getTopRowMarkup(vendorMarkup, viewsMarkup, canShowMoreMenu) {
			return `
			<div class="report__row report__row--top">
				<div class="report__meta">
					${vendorMarkup}
					${viewsMarkup}
				</div>

				<div class="report__actions">
					${ButtonsBlock.render(canShowMoreMenu)}
				</div>
			</div>
		`;
		}
		getOverviewMarkup(dashboard, publishedDate, updatedDate, period) {
			const coverBlock = new CoverBlock({
				icon: dashboard.ICON,
				dashboardType: dashboard.TYPE,
				emptyIconPath: this.emptyIconPath,
				marketBackgroundPath: this.marketBackgroundPath
			});
			this.infoBlock = new InfoBlock({
				dashboard,
				publishedDate,
				updatedDate,
				period,
				reloadDashboardCallback: this.reloadDashboard.bind(this),
				isMarketModuleInstalled: this.isMarketModuleInstalled,
				appCode: this.appCode,
				imagesPath: this.imagesPath
			});
			return `
			<div class="report__row report__row--overview">
				${coverBlock.render()}

				<div class="report__info">
					${this.infoBlock.render()}
				</div>
			</div>
		`;
		}
		initMoreMenu() {
			if (!main_core.Type.isDomNode(this.moreButton)) {
				if (this.moreMenuBlock) {
					this.moreMenuBlock.close();
				}
				this.moreMenuBlock = null;
				return;
			}
			if (this.moreMenuBlock) {
				this.moreMenuBlock.close();
			}
			this.moreMenuBlock = new MoreMenu({
				button: this.moreButton,
				menuId: this.moreMenuId,
				canModifySettings: this.currentCanModifySettings,
				canDelete: this.currentCanDelete,
				onEdit: this.handleEditCardClick.bind(this),
				onDelete: this.showDeletePopup.bind(this)
			});
			this.moreMenuBlock.bind();
		}
		initActionButtons() {
			if (main_core.Type.isDomNode(this.discussButton)) {
				main_core.Event.unbindAll(this.discussButton);
				main_core.Event.bind(this.discussButton, 'click', event => {
					event.preventDefault();
					this.handleDiscussClick();
				});
			}
		}
		handleEditCardClick() {
			if (this.dashboardId <= 0) {
				return;
			}
			biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'editing_card_report', {
				type: (this.dashboardType ?? '').toLowerCase(),
				c_element: 'card_report',
				status: 'success'
			});
			biconnector_apacheSupersetDashboardManager.DashboardManager.openSettingsSlider(this.dashboardId, this.dashboardType);
		}
		handleDiscussClick() {
			if (this.dashboardId <= 0 || this.isDiscussRequestRunning) {
				return;
			}
			this.isDiscussRequestRunning = true;
			const fallbackMessage = this.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_DISCUSS_OPEN_ERROR');
			const finishRequest = () => {
				this.isDiscussRequestRunning = false;
			};
			this.getDashboardManager().openDiscussionChat(this.dashboardId).then(response => {
				const chatId = main_core.Text.toNumber(response?.data?.chatId);
				const responseDialogId = response?.data?.dialogId;
				const dialogId = main_core.Type.isStringFilled(responseDialogId) ? responseDialogId : chatId > 0 ? `chat${chatId}` : '';
				if (!main_core.Type.isStringFilled(dialogId)) {
					throw new TypeError(fallbackMessage);
				}
				const messenger = window.top?.BX?.Messenger?.Public ?? im_public.Messenger;
				if (!messenger || !main_core.Type.isFunction(messenger.openChat)) {
					throw new TypeError(fallbackMessage);
				}
				messenger.openChat(dialogId);
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('chat', 'create_discussion', {
					type: (this.dashboardType ?? '').toLowerCase(),
					c_element: 'discuss_button',
					status: 'success'
				});
				finishRequest();
			}).catch(response => {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('chat', 'create_discussion', {
					type: (this.dashboardType ?? '').toLowerCase(),
					c_element: 'discuss_button',
					status: 'error'
				});
				BX.UI.Notification.Center.notify({
					content: main_core.Text.encode(this.getErrorMessage(response, fallbackMessage))
				});
				finishRequest();
			});
		}
		showDeletePopup() {
			if (this.dashboardId <= 0) {
				return;
			}
			this.getDashboardManager().showDeleteDashboardDialog({
				dashboardId: this.dashboardId,
				dashboardType: this.dashboardType
			}).then(result => {
				if (result.status !== 'deleted') {
					return;
				}
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'delete_report', {
					type: (this.dashboardType ?? '').toLowerCase(),
					c_element: 'card_report',
					status: 'success'
				});
				this.openDashboardList();
			}).catch(() => {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'delete_report', {
					type: (this.dashboardType ?? '').toLowerCase(),
					c_element: 'card_report',
					status: 'error'
				});
			});
		}
		openDashboardList() {
			const dashboardListUrl = main_core.Type.isStringFilled(this.dashboardListUrl) ? this.dashboardListUrl : '/bi/dashboard/';
			if (window.top && window.top.location) {
				window.top.location.href = dashboardListUrl;
				return;
			}
			window.location.href = dashboardListUrl;
		}
		getDashboardManager() {
			if (!this.dashboardManager) {
				this.dashboardManager = new biconnector_apacheSupersetDashboardManager.DashboardManager();
			}
			return this.dashboardManager;
		}
		getMessage(code, replacements = {}) {
			return main_core.Loc.getMessage(code, replacements) ?? '';
		}
		reloadDashboard(options = {}) {
			const refreshMarket = options?.refreshMarket === true;
			this.loadDashboardData({
				refreshMarket
			}).then(response => {
				const dashboard = response?.data?.dashboard;
				if (main_core.Type.isPlainObject(dashboard)) {
					this.renderDashboard(dashboard);
					this.bindDynamicElements();
				}
			}).catch(() => {});
		}
	}

	class Info {
		static create(config = {}) {
			if (!Info.instance) {
				Info.instance = new InfoInstance(config);
			}
			return Info.instance;
		}
	}
	Info.instance = null;

	exports.Info = Info;

})(this.BX.BIConnector.ApacheSuperset.Dashboard.Detail = this.BX.BIConnector.ApacheSuperset.Dashboard.Detail || {}, BX, BX.Event, BX, BX.Messenger.v2.Lib, BX.BIConnector, BX.BIConnector, BX.Main, BX.Vue3, BX.Market, BX.Market, BX.Market);
