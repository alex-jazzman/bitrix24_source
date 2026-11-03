/**
 * @module more-menu/block/company/whats-new
 */
jn.define('more-menu/block/company/whats-new', (require, exports, module) => {
	const { inAppUrl } = require('in-app-url');
	const { Loc } = require('loc');
	const { PureComponent } = require('layout/pure-component');
	const { ShimmerView } = require('layout/polyfill');
	const { connect } = require('statemanager/redux/connect');
	const store = require('statemanager/redux/store');
	const {
		fetchWhatsNewThunk,
		fetchUrlParamsThunk,
		selectAll,
		selectCategories,
		selectIsFailedStatus,
		selectIsIdleStatus,
		selectIsLoadingStatus,
		selectIsSuccessStatus,
		selectNewCount,
		selectUrlParams,
		statusReset,
		updateLocalWhatsNewsParamsThunk,
		updateReadNewsThunk,
	} = require('statemanager/redux/slices/whats-new');
	const carouselModel = require('more-menu/block/company/whats-new/src/carousel-model');
	const { createWhatsNewButton } = require('more-menu/block/company/whats-new/src/whats-new-button');
	const { Indent, Color, Corner } = require('tokens');
	const { MoreMenuAnalytics } = require('more-menu/analytics');
	const { getCardBorderColor } = require('more-menu/block/company/card-border');
	const { WhatsNewAnalytics } = require('layout/ui/whats-new/analytics');
	const { PropTypes } = require('utils/validation');
	const { Card, CardCorner, CardDesign } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text2, Text3 } = require('ui-system/typography/text');
	const { BadgeCounter, BadgeCounterSize, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');
	const { ChipStatus, ChipStatusDesign, ChipStatusMode } = require('ui-system/blocks/chips/chip-status');
	const { SwipeSlider, SliderNavigationMode } = require('ui-system/layout/swipe-slider');
	const { SafeImage } = require('layout/ui/safe-image');
	const sendHelpdeskAnalytics = (articleId) => {
		new WhatsNewAnalytics()
			.setEvent(WhatsNewAnalytics.Event.openHelpdesk)
			.setP4(WhatsNewAnalytics.getWhatsNewItemId(articleId))
			.send();
	};

	const BaseWhatsNewButton = createWhatsNewButton({
		PureComponent,
		View,
		helpdesk,
		inAppUrl,
		Loc,
		ShimmerView,
		carouselModel,
		Indent,
		Color,
		Corner,
		MoreMenuAnalytics,
		getCardBorderColor,
		sendHelpdeskAnalytics,
		PropTypes,
		Card,
		CardCorner,
		CardDesign,
		IconView,
		Icon,
		Text2,
		Text3,
		BadgeCounter,
		BadgeCounterSize,
		BadgeCounterDesign,
		ChipStatus,
		ChipStatusDesign,
		ChipStatusMode,
		SwipeSlider,
		SliderNavigationMode,
		SafeImage,
	});

	const mapStateToProps = (state) => {
		return {
			articles: selectAll(state),
			categories: selectCategories(state),
			counter: selectNewCount(state),
			isFailed: selectIsFailedStatus(state),
			isIdle: selectIsIdleStatus(state),
			isLoading: selectIsLoadingStatus(state),
			isSucceeded: selectIsSuccessStatus(state),
			urlParams: selectUrlParams(state),
		};
	};

	const dispatchProps = {
		fetchWhatsNewThunk: (...args) => store.dispatch(fetchWhatsNewThunk(...args)),
		fetchUrlParamsThunk: (...args) => store.dispatch(fetchUrlParamsThunk(...args)),
		statusReset: (...args) => store.dispatch(statusReset(...args)),
		updateLocalWhatsNewsParamsThunk: (...args) => store.dispatch(updateLocalWhatsNewsParamsThunk(...args)),
		updateReadNewsThunk: (...args) => store.dispatch(updateReadNewsThunk(...args)),
	};
	const mapDispatchToProps = () => dispatchProps;

	module.exports = {
		/**
		 * The articles of the card live in a slice of the whole app, so the card fills itself in wherever
		 * it is mounted: the answer of the section carries no news.
		 */
		WhatsNewButton: connect(mapStateToProps, mapDispatchToProps)(BaseWhatsNewButton),
	};
});
