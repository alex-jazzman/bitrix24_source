/**
 * @module market/install/src/steps/access-step
 */
jn.define('market/install/src/steps/access-step', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Switcher, SwitcherSize } = require('ui-system/blocks/switcher');
	const { Area } = require('ui-system/layout/area');
	const { Text2, Text3, Text5 } = require('ui-system/typography/text');
	const { MarketInstallBaseStep } = require('market/install/src/steps/base-step');

	const EMPLOYEE_AVATAR_SIZE = 40;
	const ADD_ROW_ICON_SIZE = 40;
	const ROW_DIVIDER_LEFT_OFFSET = 70;

	class MarketInstallAccessStep extends MarketInstallBaseStep
	{
		isAllEmployeesSelected()
		{
			return this.props.isAllEmployeesSelected === true;
		}

		getSelectedUsers()
		{
			return Array.isArray(this.props.selectedUsers) ? this.props.selectedUsers : [];
		}

		getStepId()
		{
			return 'access';
		}

		getHeaderConfig()
		{
			return {
				id: 'access',
				iconName: 'access-icon.png',
				text: Loc.getMessage('MOBILE_MARKET_INSTALL_ACCESS_PROMO_TEXT'),
			};
		}

		renderContent()
		{
			return View(
				{
					testId: this.getTestId('access-content'),
				},
				this.renderAccessModeRow(),
				this.renderEmployeesArea(),
			);
		}

		renderAccessModeRow()
		{
			return View(
				{
					testId: this.getTestId('access-mode-row'),
					style: {
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingTop: Indent.XL.toNumber(),
						paddingBottom: Indent.XL.toNumber(),
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
					},
				},
				View(
					{
						style: {
							flex: 1,
							marginRight: Indent.XL2.toNumber(),
						},
					},
					Text3({
						testId: this.getTestId('access-mode-title'),
						text: Loc.getMessage('MOBILE_MARKET_INSTALL_ACCESS_ALL'),
						color: Color.base1,
					}),
				),
				Switcher({
					testId: this.getTestId('access-mode-switcher'),
					checked: this.isAllEmployeesSelected(),
					useState: true,
					onClick: this.props.onAccessModeToggle,
					size: SwitcherSize.L,
				}),
			);
		}

		renderEmployeesArea()
		{
			if (this.isAllEmployeesSelected())
			{
				return null;
			}

			const selectedUsers = this.getSelectedUsers();

			return Area(
				{
					testId: this.getTestId('employees-area'),
					title: Loc.getMessage('MOBILE_MARKET_INSTALL_ACCESS_EMPLOYEES_TITLE'),
					excludePaddingSide: {
						horizontal: true,
						bottom: true,
					},
				},
				this.renderEmployeesList(selectedUsers),
			);
		}

		renderEmployeesList(selectedUsers)
		{
			const children = [
				this.renderAddEmployeeRow(selectedUsers.length === 0),
			];

			selectedUsers.forEach((user, index) => {
				children.push(this.renderSelectedUser(user, index === selectedUsers.length - 1));
			});

			return View(
				{
					testId: this.getTestId('employees-list'),
				},
				...children,
			);
		}

		renderAddEmployeeRow(isLast)
		{
			return View(
				{
					testId: this.getTestId('add-employee-row'),
					style: {
						position: 'relative',
					},
					onClick: this.props.onAddEmployeesClick,
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							paddingHorizontal: Indent.XL3.toNumber(),
							paddingTop: 14,
							paddingBottom: 15,
						},
					},
					View(
						{
							style: {
								width: ADD_ROW_ICON_SIZE,
								height: ADD_ROW_ICON_SIZE,
								borderRadius: ADD_ROW_ICON_SIZE / 2,
								backgroundColor: Color.accentMainPrimary.toHex(),
								alignItems: 'center',
								justifyContent: 'center',
							},
						},
						IconView({
							testId: this.getTestId('add-employee-icon'),
							icon: Icon.ADD_PERSON,
							size: 20,
							color: Color.baseWhiteFixed,
						}),
					),
					Text2({
						testId: this.getTestId('add-employee-title'),
						text: Loc.getMessage('MOBILE_MARKET_INSTALL_ACCESS_ADD_EMPLOYEES'),
						color: Color.accentMainLink,
						style: {
							flex: 1,
							marginLeft: Indent.XL.toNumber(),
						},
					}),
				),
				isLast ? null : this.renderDivider('add-employee-divider'),
			);
		}

		renderSelectedUser(user, isLast)
		{
			return View(
				{
					testId: this.getTestId(`selected-user-${user.id}`),
					style: {
						position: 'relative',
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							paddingHorizontal: Indent.XL3.toNumber(),
							paddingTop: 14,
							paddingBottom: 15,
						},
					},
					Avatar({
						testId: this.getTestId(`selected-user-avatar-${user.id}`),
						id: user.id,
						uri: user.imageUrl,
						name: user.title,
						size: EMPLOYEE_AVATAR_SIZE,
						withRedux: false,
					}),
					View(
						{
							style: {
								flex: 1,
								marginLeft: Indent.XL.toNumber(),
							},
						},
						Text2({
							testId: this.getTestId(`selected-user-title-${user.id}`),
							text: user.title,
							numberOfLines: 1,
							ellipsize: 'end',
							color: Color.base1,
						}),
						user.subtitle
							? Text5({
								testId: this.getTestId(`selected-user-subtitle-${user.id}`),
								text: user.subtitle,
								color: Color.base3,
								numberOfLines: 1,
								ellipsize: 'end',
								style: {
									marginTop: Indent.XS2.toNumber(),
								},
							})
							: null,
					),
					View(
						{
							testId: this.getTestId(`selected-user-remove-${user.id}`),
							style: {
								width: 28,
								height: 28,
								alignItems: 'center',
								justifyContent: 'center',
								marginLeft: Indent.M.toNumber(),
							},
							onClick: () => this.props.onEmployeeRemove?.(user.id),
						},
						IconView({
							icon: Icon.CROSS,
							size: 24,
							color: Color.base4,
						}),
					),
				),
				isLast ? null : this.renderDivider(`selected-user-divider-${user.id}`),
			);
		}

		renderDivider(testIdSuffix)
		{
			return View(
				{
					testId: this.getTestId(testIdSuffix),
					style: {
						position: 'absolute',
						left: ROW_DIVIDER_LEFT_OFFSET,
						right: 0,
						bottom: 0,
						height: 1,
						backgroundColor: Color.bgSeparatorSecondary.toHex(),
					},
				},
			);
		}
	}

	module.exports = {
		MarketInstallAccessStep: (props) => new MarketInstallAccessStep(props),
	};
});
