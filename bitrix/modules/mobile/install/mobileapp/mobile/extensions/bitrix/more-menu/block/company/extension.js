/**
 * @module more-menu/block/company
 */
jn.define('more-menu/block/company', (require, exports, module) => {
	const { isModuleInstalled } = require('module');

	const { Area } = require('ui-system/layout/area');
	const { CardList } = require('ui-system/layout/card-list');

	const { WhatsNewButton } = require('more-menu/block/company/whats-new');
	const { MoreMenuUsers } = require('more-menu/block/company/users');
	const { PersonalAccountSection } = require('more-menu/block/company/personal-account');
	const { SupportButton } = require('more-menu/block/company/support');
	const { SupportBanners } = require('more-menu/block/company/support-banners');

	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');

	/**
	 * @typedef {Object} CompanyInfo
	 * @property {array} users
	 * @property {number} totalUsersCount
	 * @property {boolean} canInvite
	 */

	/**
	 * @typedef {Object} LicenseInfo
	 * @property {string} licenseName
	 * @property {?number} tillDate Unix timestamp or null
	 * @property {boolean} isDemo
	 * @property {boolean} isLicenseExpired
	 * @property {boolean} isLicenseAlmostExpired
	 * @property {string} type
	 * @property {boolean} isFreeLicense
	 * @property {boolean} isEnterprise
	 * @property {boolean} isDemoTrialAvailable
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
		 * @param {CompanyInfo} props.company
		 * @param {LicenseInfo} props.license
		 * @param {number} props.supportBotId
		 * @param {SupportBannersInfo|null} props.supportBanners
		 * @param {object} props.layout
		 * @param {boolean} props.canUseSupport
		 * @param {boolean} props.canInvite
		 * @param {boolean} props.canUseTelephony
		 * @param {boolean} props.shouldShowWhatsNew
		 * @param {boolean} props.canUsePersonalAccount
		 * @param {array} props.personalAccountCompanies
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

			this.state = {
				showResultYearButton: false,
			};
		}

		render()
		{
			const {
				shouldShowWhatsNew,
				canUseSupport,
				helpdeskUrl,
				supportBotId,
				onWhatsNewCounterChange,
			} = this.props;

			return Area(
				{
					excludePaddingSide: {
						bottom: true,
					},
				},
				CardList(
					{
						withScroll: false,
					},
					this.#renderMoreMenuUsers(),
					this.#renderPersonalAccount(),
					View(
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
					),
					this.#renderSupportBanners(),
				),
			);
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
				company,
				canInvite,
				canUseTelephony,
				counters,
			} = this.props;

			if (!this.#isIntranetInstalled() || !company)
			{
				return null;
			}

			return new MoreMenuUsers({
				company,
				layout,
				canInvite,
				canUseTelephony,
				testId: this.getTestId('users'),
				counters,
			});
		}

		#renderPersonalAccount()
		{
			const { canUsePersonalAccount, personalAccountCompanies, layout } = this.props;

			if (!canUsePersonalAccount)
			{
				return null;
			}

			return new PersonalAccountSection({
				layout,
				companies: personalAccountCompanies,
				testId: this.getTestId('personal-account'),
			});
		}

		#isIntranetInstalled()
		{
			return isModuleInstalled('intranet');
		}
	}

	MoreMenuCompany.propTypes = {
		company: PropTypes.object,
		license: PropTypes.object,
		supportBotId: PropTypes.number,
		layout: PropTypes.object.isRequired,
		canUseSupport: PropTypes.bool,
		canInvite: PropTypes.bool,
		canUseTelephony: PropTypes.bool,
		shouldShowWhatsNew: PropTypes.bool,
		canUsePersonalAccount: PropTypes.bool,
		personalAccountCompanies: PropTypes.array,
		testId: PropTypes.string,
		helpdeskUrl: PropTypes.string,
		counters: PropTypes.object,
		onWhatsNewCounterChange: PropTypes.func,
	};

	module.exports = {
		MoreMenuCompany,
	};
});
