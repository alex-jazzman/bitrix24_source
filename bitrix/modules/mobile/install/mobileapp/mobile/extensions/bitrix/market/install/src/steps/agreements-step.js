/**
 * @module market/install/src/steps/agreements-step
 */
jn.define('market/install/src/steps/agreements-step', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Checkbox } = require('ui-system/form/checkbox');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { Text5 } = require('ui-system/typography/text');
	const { MarketInstallBaseStep } = require('market/install/src/steps/base-step');

	class MarketInstallAgreementsStep extends MarketInstallBaseStep
	{
		getAgreements()
		{
			return Array.isArray(this.props.agreements) ? this.props.agreements : [];
		}

		getStepId()
		{
			return 'agreements';
		}

		getHeaderConfig()
		{
			return {
				id: 'agreements',
				iconName: 'agreements-icon.png',
				text: Loc.getMessage('MOBILE_MARKET_INSTALL_AGREEMENTS_PROMO_TEXT'),
			};
		}

		renderContent()
		{
			return this.renderAgreementsList(this.getAgreements());
		}

		renderAgreementsList(agreements)
		{
			const children = [];

			if (agreements.length > 0)
			{
				agreements.forEach((agreement) => {
					children.push(this.renderAgreement(agreement));
				});
			}
			else
			{
				children.push(Text5({
					testId: this.getTestId('agreements-empty'),
					text: Loc.getMessage('MOBILE_MARKET_INSTALL_AGREEMENTS_EMPTY'),
					color: Color.base3,
				}));
			}

			return View(
				{
					testId: this.getTestId('agreements-list'),
					style: {
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingTop: Indent.M.toNumber(),
					},
				},
				...children,
			);
		}

		renderAgreement(agreement)
		{
			return View(
				{
					testId: this.getTestId(`agreement-${agreement.id}`),
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
						paddingTop: Indent.XL.toNumber(),
						paddingBottom: Indent.XL.toNumber(),
					},
				},
				View(
					{
						style: {
							marginTop: 1,
						},
					},
					new Checkbox({
						testId: this.getTestId(`agreement-checkbox-${agreement.id}`),
						size: 24,
						checked: agreement.checked === true,
						useState: true,
						onClick: () => this.props.onAgreementToggle?.(agreement.id),
					}),
				),
				BBCodeText({
					testId: this.getTestId(`agreement-text-${agreement.id}`),
					value: this.getAgreementValue(agreement),
					size: 4,
					color: Color.base2,
					linksUnderline: false,
					style: {
						flex: 1,
						marginLeft: Indent.L.toNumber(),
					},
					onLinkClick: () => this.props.onAgreementLinkClick?.(agreement),
				}),
			);
		}

		getAgreementValue(agreement)
		{
			const linkColor = Color.accentMainPrimary.toHex();
			const linkText = this.props.getAgreementText?.(agreement.id) ?? '';
			const linkedValue = `[URL=${agreement.id}]${linkText}[/URL]`;

			return Loc.getMessage('MOBILE_MARKET_INSTALL_AGREEMENT_TEMPLATE', {
				'#LINK#': linkedValue,
				'#LINK_COLOR#': linkColor,
			});
		}
	}

	module.exports = {
		MarketInstallAgreementsStep: (props) => new MarketInstallAgreementsStep(props),
	};
});
