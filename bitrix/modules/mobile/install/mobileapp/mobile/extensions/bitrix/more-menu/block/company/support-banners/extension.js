/**
 * @module more-menu/block/company/support-banners
 */
jn.define('more-menu/block/company/support-banners', (require, exports, module) => {
	const { CardList } = require('ui-system/layout/card-list');
	const { Card } = require('ui-system/layout/card');
	const { Component } = require('tokens');
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');
	const { FeedbackForm } = require('layout/ui/feedback-form-opener');
	const { MoreMenuAnalytics, SupportBannerEvent } = require('more-menu/analytics');

	class SupportBanners extends LayoutComponent
	{
		render()
		{
			return CardList(
				{
					horizontal: true,
					withScroll: false,
					divided: false,
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						maxWidth: 400,
					},
				},
				Card(
					{
						testId: 'free-meetup-banner',
						onClick: () => {
							MoreMenuAnalytics.sendSupportBannerClickEvent(SupportBannerEvent.MEETUP);
							Application.openUrl('https://meetup.bitrix24.events/start/');
						},
						excludePaddingSide: { all: true },
						style: {
							flexGrow: 1,
							backgroundImage: makeLibraryImagePath('free-meetup-banner.png', 'more-menu'),
							backgroundResizeMode: 'cover',
							height: 90,
						},
					},
				),
				Spacer(),
				Card(
					{
						testId: 'free-integration-consult-banner',
						onClick: () => {
							MoreMenuAnalytics.sendSupportBannerClickEvent(SupportBannerEvent.SETUP_CONSULTATION);
							new FeedbackForm({
								formId: this.props.formCode,
								senderPage: 'more_menu',
							}).openInBackdrop(null, {
								title: Loc.getMessage('MORE_MENU_COMPANY_SUPPORT_BANNERS_FREE_INTEGRATION_CONSULT'),
							});
						},
						excludePaddingSide: { all: true },
						style: {
							flexGrow: 1,
							backgroundImage: makeLibraryImagePath('free-integration-consult-banner.png', 'more-menu'),
							backgroundResizeMode: 'cover',
							height: 90,
						},
					},
				),
			);
		}
	}

	const Spacer = () => View(
		{
			style: {
				width: Component.cardListGap.toNumber(),
				opacity: 0,
			},
		},
	);

	module.exports = { SupportBanners };
});
