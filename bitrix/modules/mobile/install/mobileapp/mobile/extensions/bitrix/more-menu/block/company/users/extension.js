/**
 * @module more-menu/block/company/users
 */
jn.define('more-menu/block/company/users', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Loc } = require('loc');
	const { Indent, Color, Corner } = require('tokens');
	const { inAppUrl } = require('in-app-url');

	const { Text3 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { AvatarStack } = require('ui-system/blocks/avatar-stack');
	const { BadgeCounter, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');

	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { RefRegistry } = require('more-menu/ref-registry');
	const { PureComponent } = require('layout/pure-component');

	/**
	 * @typedef {Object} CompanyInfo
	 * @property {array} users
	 * @property {number} totalUsersCount
	 * @property {boolean} canInvite
	 */
	/**
	 * @class MoreMenuUsers
	 */
	class MoreMenuUsers extends PureComponent
	{
		/**
		 * @param props
		 * @param {CompanyInfo} props.company
		 * @param {object} props.layout
		 * @param {boolean} props.canInvite
		 * @param {boolean} props.canUseTelephony
		 * @param {string} props.testId
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});

			this.openUsers = this.openUsers.bind(this);
			this.openInvite = this.openInvite.bind(this);
		}

		componentDidMount()
		{
			RefRegistry.register('company_users_invite_button', this.inviteButtonRef);
		}

		componentWillUnmount()
		{
			try
			{
				RefRegistry.unregister('company_users_invite_button');
			}
			catch (e)
			{
				console.error('RefRegistry unregister error', e);
			}
		}

		render()
		{
			const { company, canInvite, counters } = this.props;
			const totalInvitation = counters?.total_invitation ?? 0;

			const users = company?.users || [];
			const totalUsersCount = company?.totalUsersCount || 0;

			const usersIds = users.map((user) => user.id);

			if (totalUsersCount > users.length && users.length >= 4)
			{
				const restCount = totalUsersCount - users.length;
				usersIds.push(...Array.from({ length: restCount }).fill(env.userId)); // add fake items to show rest count
			}

			return Card(
				{
					testId: this.getTestId('card'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexGrow: 2,
						borderRadius: Corner.XL.toNumber(),
						backgroundColor: Color.bgContentSecondaryInvert.toHex(),
					},
					design: CardDesign.PRIMARY,
					border: false,
				},
				View(
					{
						style: {
							flexGrow: 2,
							flexDirection: 'row',
							alignItems: 'center',
							height: 28,
						},
						onClick: this.openUsers,
					},
					Text3({
						testId: this.getTestId('title'),
						text: Loc.getMessage('MORE_MENU_COMPANY_USERS_TITLE'),
						color: Color.base1,
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							flexShrink: 2,
						},
					}),
					totalInvitation && BadgeCounter({
						testId: this.getTestId('total-invitation-counter'),
						value: totalInvitation,
						design: BadgeCounterDesign.ALERT,
						style: {
							marginLeft: Indent.XS.toNumber(),
						},
					}),
					IconView({
						testId: this.getTestId('title-chevron'),
						size: 20,
						icon: Icon.CHEVRON_TO_THE_RIGHT,
						color: Color.base1,
						resizeMode: 'cover',
						style: {
							marginTop: 2,
							width: 10,
							height: 16,
							marginLeft: Indent.XS.toNumber(),
						},
					}),
				),
				this.shouldShowAvatarStack() && AvatarStack({
					testId: this.getTestId('avatar-stack'),
					entities: usersIds,
					size: 24,
					withRedux: true,
					visibleEntityCount: 4,
					onClick: this.openUsers,
				}),
				canInvite && this.renderInviteButton(),
			);
		}

		renderInviteButton()
		{
			if (this.shouldShowAvatarStack())
			{
				return Button({
					testId: this.getTestId('invite-button'),
					size: ButtonSize.S,
					leftIcon: Icon.PLUS,
					design: ButtonDesign.PLAN_ACCENT,
					style: {
						marginLeft: Indent.S.toNumber(),
					},
					onClick: this.openInvite,
					badge: this.getInviteButtonBadge(),
					forwardRef: (ref) => {
						this.inviteButtonRef = ref;
					},
				});
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Button({
					testId: this.getTestId('invite-button'),
					size: ButtonSize.S,
					design: ButtonDesign.FILLED,
					style: {
						marginLeft: Indent.S.toNumber(),
					},
					onClick: this.openInvite,
					text: Loc.getMessage('MORE_MENU_COMPANY_USERS_INVITE'),
					backgroundColor: Color.accentMainPrimary,
					badge: this.getInviteButtonBadge(),
					forwardRef: (ref) => {
						this.inviteButtonRef = ref;
					},
				}),
			);
		}

		shouldShowAvatarStack()
		{
			const { company } = this.props;
			const users = company?.users || [];

			return Array.isArray(users) && users.length > 1;
		}

		getInviteButtonBadge()
		{
			const { counters } = this.props;
			const menuInvite = counters?.menu_invite ?? 0;
			const totalInvitation = counters?.total_invitation ?? 0;

			if (!menuInvite || totalInvitation > 0)
			{
				return null;
			}

			return BadgeCounter({
				testId: this.getTestId('invite-button-counter'),
				value: menuInvite,
				design: BadgeCounterDesign.ALERT,
			});
		}

		openUsers()
		{
			const {
				canInvite,
				canUseTelephony,
			} = this.props;

			inAppUrl.open('/intranetmobile/users', {
				title: Loc.getMessage('MORE_MENU_COMPANY_USERS_TITLE'),
				canInvite,
				canUseTelephony,
			});
		}

		async openInvite()
		{
			const { layout } = this.props;
			const { openIntranetInviteWidget } = await requireLazy('intranet:invite-opener-new') || {};
			if (openIntranetInviteWidget)
			{
				openIntranetInviteWidget({
					analytics: new AnalyticsEvent().setSection('ava_menu'),
					parentLayout: layout,
				});
			}
			else
			{
				console.error('Invite opener not found');
			}
		}
	}

	MoreMenuUsers.propTypes = {
		company: PropTypes.object,
		layout: PropTypes.object.isRequired,
		canInvite: PropTypes.bool,
		canUseTelephony: PropTypes.bool,
		testId: PropTypes.string.isRequired,
	};

	module.exports = {
		MoreMenuUsers,
	};
});
