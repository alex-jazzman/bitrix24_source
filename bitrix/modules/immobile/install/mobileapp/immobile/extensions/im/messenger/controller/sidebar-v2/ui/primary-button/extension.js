/**
 * @module im/messenger/controller/sidebar-v2/ui/primary-button
 */
jn.define('im/messenger/controller/sidebar-v2/ui/primary-button', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Text6 } = require('ui-system/typography/text');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { IconView } = require('ui-system/blocks/icon');
	const { BadgeCounter, BadgeCounterDesign, BadgeCounterSize } = require('ui-system/blocks/badges/counter');
	const { Promotion } = require('im/messenger/lib/promotion');

	/**
	 * @param {object} props
	 * @param {string} props.testId
	 * @param {string} props.title
	 * @param {function} props.onClick
	 * @param {BaseIcon} props.icon
	 * @param {number} [props.counter=0]
	 * @param {boolean} [props.disabled=false]
	 * @param {boolean} [props.selected=false]
	 * @param {object} [props.style={}]
	 * @param {object} [props.testIdSuffix]
	 * @param {function} [props.renderCustomContent]
	 * @param {string} [props.ahaMoment]
	 */
	class PrimaryButton extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.cardRef = null;
		}

		componentDidMount()
		{
			if (this.props.ahaMoment)
			{
				this.#showAhaMoment();
			}
		}

		render()
		{
			const { testId, testIdSuffix, selected, disabled = false, style = {} } = this.props;

			const testIdModifier = [
				'container',
				selected ? 'selected' : null,
				disabled ? 'disabled' : null,
				testIdSuffix,
			].filter(Boolean).join('-');

			return Card(
				{
					ref: (ref) => {
						this.cardRef = ref;
					},
					testId: `${testId}-${testIdModifier}`,
					border: true,
					design: CardDesign.PRIMARY,
					onClick: this.handleOnClick,
					withPressed: true,
					style: {
						minWidth: 86,
						maxWidth: 112,
						height: 78,
						...style,
					},
				},
				View(
					{
						style: {
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					this.renderBadgeCounter(),
					...this.renderButtonContent(),
				),
			);
		}

		/**
		 * @return {Array<LayoutComponent>}
		 */
		renderButtonContent()
		{
			const { testId, title, disabled = false, renderCustomContent } = this.props;

			return renderCustomContent
				? renderCustomContent()
				: [
					this.renderIcon(),
					Text6({
						testId: `${testId}-text`,
						color: disabled ? Color.base5 : Color.base1,
						text: title,
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							marginBottom: Indent.XS2.toNumber(),
						},
					}),
				];
		}

		renderBadgeCounter()
		{
			const { testId, counter = 0 } = this.props;

			if (counter === 0)
			{
				return null;
			}

			return BadgeCounter({
				value: counter,
				testId: `${testId}-badge`,
				size: BadgeCounterSize.XS,
				design: BadgeCounterDesign.ALERT,
				style: {
					position: 'absolute',
					right: 5,
					top: 0,
				},
			});
		}

		renderIcon()
		{
			const { testId, icon, disabled = false, selected } = this.props;

			let color = Color.base0;

			if (disabled)
			{
				color = Color.base5;
			}
			else if (selected)
			{
				color = Color.accentMainPrimary;
			}

			return IconView({
				icon,
				color,
				testId: `${testId}-icon`,
				size: 32,
				style: {
					marginBottom: Indent.XS.toNumber(),
				},
			});
		}

		handleOnClick = () => {
			const { onClick } = this.props;

			onClick?.(this.cardRef);
		};

		#showAhaMoment()
		{
			const promotion = Promotion.getInstance();
			promotion.addToPromoQueue({
				promoId: this.props.ahaMoment,
				callback: () => promotion.showCopilotSidebarChangeEnginePromotion(this.cardRef),
			});
		}
	}

	module.exports = {
		PrimaryButton: (props) => new PrimaryButton(props),
	};
});
