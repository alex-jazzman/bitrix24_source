/**
 * @module intranet/invite-new
 */
jn.define('intranet/invite-new', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { AnalyticsEvent, IntranetInviteAnalytics } = require('intranet/invite-new/src/analytics');
	const { Indent } = require('tokens');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { UIMenu } = require('layout/ui/menu');
	const { ContentStatusBlock } = require('intranet/invite-new/src/content-status-block');
	const { InviterFactory } = require('intranet/invite-new/src/inviter/factory');
	const { InviteCases } = require('intranet/invite-new/src/inviter/type');
	const { getSmartphoneContacts } = require('layout/ui/smartphone-contact-selector');
	const { createTestIdGenerator } = require('utils/test');

	class Invite extends PureComponent
	{
		static getAjaxErrorText(errors)
		{
			return errors.map((errorMessage) => {
				if (errorMessage.message)
				{
					return errorMessage.message.replace('<br/>:', '\n').replace('<br/>', '\n');
				}

				return errorMessage.replace('<br/>:', '\n').replace('<br/>', '\n');
			}).filter((errorMessage) => {
				return errorMessage.length > 0;
			}).join('\n');
		}

		constructor(props)
		{
			super(props);
			this.smartphoneContacts = null;
			this.getTestId = createTestIdGenerator({
				prefix: 'invite',
			});
			this.#initState(props);
		}

		async componentDidMount()
		{
			const { department = null } = this.state;
			this.updateDepartmentInInviters(department);
			this.smartphoneContacts = await getSmartphoneContacts();
		}

		#initState(props)
		{
			const { department = null } = props;

			this.state = {
				department,
			};

			this.inviters = Object.values(InviteCases).map(
				(inviteCase) => InviterFactory.createInviterByCase(inviteCase, this.#getInviterProps()),
			).sort((a, b) => {
				return a.getSortOrder() - b.getSortOrder();
			});
		}

		updateDepartmentInInviters(department)
		{
			this.inviters.forEach((inviter) => inviter.updateDepartment(department));
		}

		#getInviterProps = () => {
			const {
				canInviteByLink,
				canInviteByEmail,
				canInviteBySMS,
				adminConfirm,
				analytics,
				layout,
				isBitrix24Included,
				isInviteWithLocalEmailAppEnabled,
				creatorEmailConfirmed = false,
				multipleInvite = true,
				onInviteSentHandler = null,
				onInviteError = null,
			} = this.props;

			return {
				canInviteByLink,
				canInviteByEmail,
				canInviteBySMS,
				adminConfirm,
				analytics,
				layout,
				isBitrix24Included,
				isInviteWithLocalEmailAppEnabled,
				creatorEmailConfirmed,
				multipleInvite,
				onInviteSentHandler,
				onInviteError,
				selectedDepartmentChanged: this.#selectedDepartmentChanged,
				initialContacts: this.smartphoneContacts,
				onUIMenuItemSelected: this.onUIMenuItemSelected,
				getDepartment: this.getDepartment,
				onInviteLinkChanged: this.onInviteLinkChanged,
			};
		};

		onUIMenuItemSelected = () => {
			this.menu.hide();
		};

		onInviteLinkChanged = (newLink) => {
			this.inviters
				.filter((inviter) => inviter.shouldUpdateInviteLink())
				.forEach((inviter) => {
					inviter.setInviteLink?.(newLink);
				});
		};

		getDepartment = () => {
			return this.state.department;
		};

		render()
		{
			const { analytics, layout } = this.props;
			const { department } = this.state;

			return Box(
				{
					footer: this.#renderButtons(),
					style: {
						paddingVertical: Indent.XL3.toNumber(),
					},
				},
				ContentStatusBlock({
					testId: this.getTestId('status-block'),
					analytics,
					layout,
					department,
					selectedDepartmentChanged: this.#selectedDepartmentChanged,
					graphicsUri: this.#getInviterForMainButton().getGraphicsUri(),
				}),
			);
		}

		#selectedDepartmentChanged = (department) => {
			const { analytics } = this.props;
			analytics.setDepartmentParam(department !== null);

			this.setState({
				department,
			}, () => {
				this.updateDepartmentInInviters(department);
			});
		};

		#renderButtons()
		{
			const { isBitrix24Included } = this.props;

			return BoxFooter(
				{
					safeArea: true,
					testId: this.getTestId('buttons'),
				},
				this.#getInviterForMainButton().renderMainButton(),
				isBitrix24Included && Button(
					{
						testId: this.getTestId('by-other-button'),
						forwardRef: this.#bindInviteCasesButtonRef,
						text: Loc.getMessage('INTRANET_INVITE_BY_OTHER_BUTTON_TEXT'),
						size: ButtonSize.M,
						design: ButtonDesign.PLAN_ACCENT,
						stretched: true,
						onClick: () => {
							this.#openOtherInviteCasesMenu();
						},
					},
				),
			);
		}

		#getAvailableInviters()
		{
			return this.inviters.filter((inviter) => inviter.isAvailableInviteMethod());
		}

		#getInviterForMainButton()
		{
			const availableInviters = this.#getAvailableInviters().filter((inviter) => !inviter.isDisabledInviteMethod());
			if (availableInviters.length > 0)
			{
				return availableInviters[0];
			}

			return this.inviters[0];
		}

		#bindInviteCasesButtonRef = (ref) => {
			this.inviteCasesButtonRef = ref;
		};

		#openOtherInviteCasesMenu = () => {
			this.menu = new UIMenu(this.#getInviteCasesItems());
			this.menu.show({
				target: this.inviteCasesButtonRef,
			});
		};

		#getInviteCasesItems = () => {
			const mainButtonInviteCase = this.#getInviterForMainButton().getInviteCase();

			return this.#getAvailableInviters()
				.filter((inviter) => inviter.getInviteCase() !== mainButtonInviteCase)
				.map((inviter) => inviter.getItemForUIMenu());
		};
	}

	module.exports = { Invite, AnalyticsEvent, IntranetInviteAnalytics };
});
