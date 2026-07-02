/**
 * @module im/messenger/controller/recent/service/invite-banner/common
 */
jn.define('im/messenger/controller/recent/service/invite-banner/common', (require, exports, module) => {
	const { Color } = require('tokens');
	const { AnalyticsEvent } = require('analytics');
	const { makeLibraryImagePath } = require('asset-manager');
	const { EventType, Analytics } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { RecentEventType } = require('im/messenger/controller/recent/const');
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');
	const { UserItem, ExtranetUserItem, InvitedUserItem } = require('im/messenger/lib/element/recent');

	const INVITE_BANNER_ID = 'invite-banner';
	const INVITE_BANNER_ACCENT_THRESHOLD = 5;
	const INVITE_BANNER_USER_SET_CONSTRUCTORS = new Set([UserItem, ExtranetUserItem, InvitedUserItem]);

	/**
	 * @class CommonInviteBannerService
	 * @extends {IInviteBannerService}
	 */
	class CommonInviteBannerService extends BaseUiRecentService
	{
		onInit()
		{
			this.logger.log('onInit');

			if (!Feature.isIntranetInvitationAvailable)
			{
				this.logger.log('onInit: invite not available, skip');
				this.isAvailable = false;

				return;
			}

			this.isAvailable = true;
		}

		/**
		 * @return {boolean}
		 */
		get hasSelectedFilter()
		{
			if (!this.recentLocator.has('filter'))
			{
				return false;
			}

			return this.recentLocator.get('filter').hasSelectedFilter();
		}

		async onUiReady(ui)
		{
			this.logger.log('onUiReady');

			if (!this.isAvailable)
			{
				return;
			}

			this.ui = ui;
			this.ui.on(EventType.recent.itemSelected, this.#onItemSelected);
		}

		// region public interface

		subscribeEvents()
		{
			if (!this.isAvailable)
			{
				return;
			}

			this.recentLocator.get('emitter')
				.on(
					RecentEventType.render.itemCollectionSizeChanged,
					this.#itemCollectionSizeChangedHandler,
				)
			;
		}

		redraw()
		{
			if (!this.isAvailable)
			{
				return;
			}

			void this.#itemCollectionSizeChangedHandler();
		}

		// endregion public interface

		#itemCollectionSizeChangedHandler = async () => {
			if (this.hasSelectedFilter)
			{
				this.logger.log('itemCollectionSizeChangedHandler: filter is active, skip');

				return;
			}

			const items = this.recentLocator.get('render').getItemList();
			const itemUsers = items
				.filter((item) => INVITE_BANNER_USER_SET_CONSTRUCTORS.has(item.constructor));
			const itemUsersLength = itemUsers.length;

			this.logger.log('itemCollectionSizeChangedHandler', itemUsersLength);

			const isAccent = itemUsersLength < INVITE_BANNER_ACCENT_THRESHOLD;
			this.logger.log('itemCollectionSizeChangedHandler: upserting banner', { isAccent });
			this.#upsertBanner(isAccent);
		};

		/**
		 * @param {boolean} accent
		 */
		#upsertBanner(accent)
		{
			const renderService = this.recentLocator.get('render');
			const bannerItem = this.#createBannerItem(accent);
			renderService.upsertPreparedItems([bannerItem]);
		}

		/**
		 * @param {ItemSelectedEventData} itemData
		 */
		#onItemSelected = (itemData) => {
			if (String(itemData.id) !== INVITE_BANNER_ID)
			{
				return;
			}

			this.logger.log('onItemSelected: banner tapped');
			this.#openInviteWidget();
		};

		#openInviteWidget()
		{
			const { openIntranetInviteWidget } = require('intranet/invite-opener-new');
			openIntranetInviteWidget?.({
				analytics: new AnalyticsEvent().setSection(Analytics.Section.chatList),
			});
		}

		/**
		 * @param {boolean} accent
		 * @return {object}
		 */
		#createBannerItem(accent = false)
		{
			return {
				id: INVITE_BANNER_ID,
				type: 'invite',
				sectionCode: 'general',
				useLetterImage: true,
				imageUrl: encodeURI(
					makeLibraryImagePath(`add-3${accent ? '-active' : ''}.png`, 'volumetric'),
				),
				title: Loc.getMessage('IMMOBILE_RECENT_INVITE_BANNER_TITLE'),
				subtitle: Loc.getMessage('IMMOBILE_RECENT_INVITE_BANNER_SUBTITLE'),
				sortValues: {
					order: 0,
				},
				params: {
					disableTap: true,
					type: INVITE_BANNER_ID,
				},
				styles: {
					image: {
						backgroundColor: '#00000000',
						image: {
							borderRadius: 0,
						},
					},
					title: {
						font: {
							typographyName: 'text4Accent',
							color: accent ? Color.baseWhiteFixed.toHex() : Color.accentMainLink.toHex(),
							useColor: true,
						},
					},
					subtitle: {
						font: {
							typographyName: 'text6',
							color: accent ? Color.chatOverallBaseWhite2.toHex() : Color.base3.toHex(),
							useColor: true,
						},
					},
					innerContent: {
						backgroundColor: accent ? Color.accentMainPrimary.toHex() : Color.accentSoftBlue2.toHex(),
						cornerRadius: 32,
					},
					arrow: {
						backgroundColor: accent ? Color.chatMyPrimary3.toHex() : Color.accentSoftBlue3.toHex(),
						image: {
							tintColor: accent ? Color.baseWhiteFixed.toHex() : Color.accentMainPrimaryalt.toHex(),
						},
					},
				},
			};
		}
	}

	module.exports = CommonInviteBannerService;
});
