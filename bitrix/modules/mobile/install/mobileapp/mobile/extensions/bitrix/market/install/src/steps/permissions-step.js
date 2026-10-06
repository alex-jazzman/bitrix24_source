/**
 * @module market/install/src/steps/permissions-step
 */
jn.define('market/install/src/steps/permissions-step', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Text2, Text4, Text5 } = require('ui-system/typography/text');
	const { MarketInstallBaseStep } = require('market/install/src/steps/base-step');

	class MarketInstallPermissionsStep extends MarketInstallBaseStep
	{
		getScopes()
		{
			return Array.isArray(this.props.scopes) ? this.props.scopes : [];
		}

		getStepId()
		{
			return 'permissions';
		}

		getStepStyle()
		{
			return {
				marginTop: Indent.XL.toNumber(),
			};
		}

		getHeaderConfig()
		{
			return {
				id: 'permissions',
				iconName: 'permissions-icon.png',
				text: Loc.getMessage('MOBILE_MARKET_INSTALL_PERMISSIONS_PROMO_TEXT'),
				paddingTop: 0,
			};
		}

		renderContent()
		{
			return View(
				{
					testId: this.getTestId('permissions-content'),
				},
				this.renderSectionTitle(),
				this.renderScopesList(this.getScopes()),
			);
		}

		renderScopesList(scopes)
		{
			const children = [];

			if (scopes.length > 0)
			{
				scopes.forEach((scope, index) => {
					children.push(this.renderScope(scope, index === scopes.length - 1));
				});
			}
			else
			{
				children.push(Text5({
					testId: this.getTestId('permissions-empty'),
					text: Loc.getMessage('MOBILE_MARKET_INSTALL_APP_PERMISSIONS_EMPTY'),
					color: Color.base3,
					style: {
						marginTop: Indent.S.toNumber(),
						paddingHorizontal: Indent.XL3.toNumber(),
					},
				}));
			}

			return View(
				{
					testId: this.getTestId('permissions-scopes-list'),
				},
				...children,
			);
		}

		renderSectionTitle()
		{
			return View(
				{
					testId: this.getTestId('permissions-section-title-container'),
					style: {
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingTop: Indent.M.toNumber(),
						paddingBottom: Indent.S.toNumber(),
					},
				},
				Text4({
					testId: this.getTestId('permissions-section-title'),
					text: Loc.getMessage('MOBILE_MARKET_INSTALL_PERMISSIONS_SECTION_TITLE'),
					color: Color.base4,
				}),
			);
		}

		renderScope(scope, isLast)
		{
			const scopeCode = scope.CODE || 'unknown';
			const scopeTitle = scope.TITLE ?? scope.CODE ?? '';
			const scopeDescription = scope.DESCRIPTION ?? '';

			return View(
				{
					testId: this.getTestId(`scope-${scopeCode}`),
					style: {
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingTop: 14,
						paddingBottom: 15,
						borderBottomWidth: isLast ? 0 : 1,
						borderBottomColor: Color.bgSeparatorSecondary.toHex(),
					},
				},
				View(
					{},
					Text2({
						testId: this.getTestId(`scope-title-${scopeCode}`),
						text: scopeTitle,
						color: Color.base1,
					}),
					scopeDescription
						? Text5({
							testId: this.getTestId(`scope-description-${scopeCode}`),
							text: scopeDescription,
							color: Color.base3,
							style: {
								marginTop: Indent.XS2.toNumber(),
							},
						})
						: null,
				),
			);
		}
	}

	module.exports = {
		MarketInstallPermissionsStep: (props) => new MarketInstallPermissionsStep(props),
	};
});
