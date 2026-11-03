/**
 * @module more-menu/block/company
 */
jn.define('more-menu/block/company', (require, exports, module) => {
	const { isModuleInstalled } = require('module');
	const { Indent } = require('tokens');

	const { Area } = require('ui-system/layout/area');
	const { CardList } = require('ui-system/layout/card-list');

	const { MyCompanyEntryPlate } = require('my-company/entry-plate');
	const { getMyCompanyCounter } = require('my-company/counter');
	const { WhatsNewButton } = require('more-menu/block/company/whats-new');
	const { MoreMenuUsers } = require('more-menu/block/company/users');
	const { SupportButton, subscribeToSupportRequests } = require('more-menu/block/company/support');
	const { SupportBanners } = require('more-menu/block/company/support-banners');
	const { resolveCardSet } = require('more-menu/block/company/tariff-plate');
	const { DemoPlate } = require('more-menu/block/company/tariff-plate/demo/plate');
	const { SubscriptionState } = require('more-menu/block/company/tariff-plate/subscription/plate');
	const { connect } = require('statemanager/redux/connect');
	const { selectNewCount } = require('statemanager/redux/slices/whats-new');

	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');

	/**
	 * The counter of the plate sums up the counters the whole app shares and the one of the news. The
	 * news counter lives in the slice the carousel of the section is drawn from, and the plate follows
	 * that slice itself: the section is a context of its own, and a value carried over from it would
	 * mean the menu showing whatever the section last told it rather than what the store holds.
	 *
	 * @type {function(object): object}
	 */
	const MyCompanyEntryPlateWithCounter = connect(
		(state, { counters, shouldShowWhatsNew }) => ({
			counter: getMyCompanyCounter(counters, shouldShowWhatsNew ? selectNewCount(state) : 0),
		}),
	)(MyCompanyEntryPlate);

	/**
	 * @typedef {Object} EmployeesInfo
	 * @property {array} users
	 * @property {number} totalUsersCount
	 */

	/**
	 * @typedef {Object} SupportBannersInfo
	 * @property {boolean} shouldShow
	 * @property {string} formCode
	 */

	/**
	 * @class MoreMenuCompany
	 */
	class MoreMenuCompany extends PureComponent
	{
		/**
		 * @param props
		 * @param {?EmployeesInfo} props.employees preview of the staff, the payload of the employees card
		 * @param {string} [props.companyName] name of the portal, the title of the entry plate
		 * @param {number} props.supportBotId
		 * @param {SupportBannersInfo|null} props.supportBanners
		 * @param {object|null} props.tariffPlate
		 * @param {object} props.layout
		 * @param {boolean} props.canUseSupport
		 * @param {boolean} props.canInvite
		 * @param {boolean} props.canUseTelephony
		 * @param {boolean} props.shouldShowWhatsNew
		 * @param {boolean} props.canUseMyCompany
		 * @param {string} props.testId
		 * @param {string} props.helpdeskUrl
		 * @param {object} props.counters
		 * @param {function} props.onWhatsNewCounterChange
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});

			this.unsubscribeFromSupportRequests = null;
		}

		/**
		 * The menu is the context support is opened from while the section of the company is closed before
		 * the panel goes up. Once the section stays behind the panel, it takes the request over and this
		 * subscription goes away with the workaround that closes it.
		 */
		componentDidMount()
		{
			this.unsubscribeFromSupportRequests = subscribeToSupportRequests();
		}

		componentWillUnmount()
		{
			this.unsubscribeFromSupportRequests?.();
			this.unsubscribeFromSupportRequests = null;
		}

		render()
		{
			const { canUseMyCompany } = this.props;

			return Area(
				{
					excludePaddingSide: {
						bottom: true,
					},
					// The block above pays its own bottom padding, and the top one of this area lands on top
					// of it: the two together read as a gap twice the one between the cards. The margin gives
					// part of it back; the area keeps its padding, so nothing else in the block moves.
					style: {
						marginTop: -Indent.XL3.toNumber(),
					},
				},
				canUseMyCompany ? this.#renderEntryCardList() : this.#renderLegacyCardList(),
			);
		}

		/**
		 * The block leads into the section and keeps only what the section does not carry: the demo tariff
		 * offer and the third-party banners.
		 */
		#renderEntryCardList()
		{
			return CardList(
				{
					withScroll: false,
				},
				this.#renderMyCompany(),
				this.#renderTariffDemoPlate(),
				this.#renderSupportBanners(),
			);
		}

		/**
		 * Composition for portals without the section: exactly the blocks the menu had before the section
		 * appeared, with nothing of the tariff domain. A new card belongs to the section alone and is
		 * never added here.
		 */
		#renderLegacyCardList()
		{
			return CardList(
				{
					withScroll: false,
				},
				this.#renderMoreMenuUsers(),
				this.#renderWhatsNewWithSupportRow(),
				this.#renderSupportBanners(),
			);
		}

		#renderMyCompany()
		{
			const { layout, companyName, counters, shouldShowWhatsNew } = this.props;

			return MyCompanyEntryPlateWithCounter({
				layout,
				companyName,
				counters,
				shouldShowWhatsNew,
				testId: this.getTestId('my-company'),
			});
		}

		/**
		 * Without the section the news stay in the menu as a compact button, and that button shares one
		 * row with the support one.
		 */
		#renderWhatsNewWithSupportRow()
		{
			const {
				shouldShowWhatsNew,
				onWhatsNewCounterChange,
				canUseSupport,
				helpdeskUrl,
				supportBotId,
			} = this.props;

			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				shouldShowWhatsNew && WhatsNewButton({
					testId: this.getTestId('whats-new-button'),
					onCounterChange: onWhatsNewCounterChange,
				}),
				(canUseSupport || helpdeskUrl) && new SupportButton({
					testId: this.getTestId('support-button-2'),
					canUseSupport,
					helpdeskUrl,
					supportBotId,
				}),
			);
		}

		/**
		 * The tariff cards belong to the section; the demo offer is the one the menu shows beside it, so
		 * the block asks the card set rule about it and mounts the plate on its own.
		 */
		#renderTariffDemoPlate()
		{
			const { tariffPlate, layout } = this.props;

			if (!resolveCardSet(tariffPlate, SubscriptionState).demo)
			{
				return null;
			}

			return new DemoPlate({
				showPurchaseCta: Boolean(tariffPlate.tariff.cta),
				isCtaForced: Boolean(tariffPlate.tariff.ctaForced),
				layout,
				// DemoPlate already prefixes its own locators with `demo-`, and the root stays the one of
				// the tariff block, so the locators of the plate do not depend on who mounts it
				testId: this.getTestId('tariff-plate'),
			});
		}

		#renderSupportBanners()
		{
			const { shouldShow, formCode } = this.props.supportBanners || {};

			if (!shouldShow)
			{
				return null;
			}

			return new SupportBanners({
				formCode,
			});
		}

		#renderMoreMenuUsers()
		{
			const {
				layout,
				employees,
				canInvite,
				canUseTelephony,
				counters,
			} = this.props;

			if (!this.#isIntranetInstalled() || !employees)
			{
				return null;
			}

			return new MoreMenuUsers({
				employees,
				layout,
				canInvite,
				canUseTelephony,
				testId: this.getTestId('users'),
				counters,
			});
		}

		#isIntranetInstalled()
		{
			return isModuleInstalled('intranet');
		}
	}

	MoreMenuCompany.propTypes = {
		employees: PropTypes.object,
		companyName: PropTypes.string,
		supportBotId: PropTypes.number,
		tariffPlate: PropTypes.object,
		layout: PropTypes.object.isRequired,
		canUseSupport: PropTypes.bool,
		canInvite: PropTypes.bool,
		canUseTelephony: PropTypes.bool,
		shouldShowWhatsNew: PropTypes.bool,
		canUseMyCompany: PropTypes.bool,
		testId: PropTypes.string,
		helpdeskUrl: PropTypes.string,
		counters: PropTypes.object,
		onWhatsNewCounterChange: PropTypes.func,
	};

	module.exports = {
		MoreMenuCompany,
	};
});
