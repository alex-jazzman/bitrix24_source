/**
 * @module layout/ui/step-progress-bar
 */
jn.define('layout/ui/step-progress-bar', (require, exports, module) => {
	const { Color, Corner, Indent } = require('tokens');
	const { H4 } = require('ui-system/typography/heading');
	const { createTestIdGenerator } = require('utils/test');

	const BADGE_DIAMETER = 40;
	const BADGE_BORDER_WIDTH = 2;
	const SEGMENT_HEIGHT = 4;

	/**
	 * @typedef {object} StepProgressBarStep
	 * @property {string|number} [id]
	 * @property {string} label
	 */

	/**
	 * @class StepProgressBar
	 * @param {object} props
	 * @param {string} props.testId
	 * @param {StepProgressBarStep[]} props.steps
	 * @param {number} props.currentStepIndex
	 * @param {object} [props.style]
	 */
	class StepProgressBar extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: 'step-progress-bar', context: this });
		}

		get steps()
		{
			return Array.isArray(this.props.steps) ? this.props.steps : [];
		}

		get currentStepIndex()
		{
			const lastIndex = this.steps.length - 1;
			const index = Number(this.props.currentStepIndex) || 0;

			return Math.max(0, Math.min(index, lastIndex));
		}

		render()
		{
			if (this.steps.length === 0)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId(),
					style: {
						width: '100%',
						...this.props.style,
					},
				},
				this.#renderBadgesRow(),
				this.#renderTrack(),
			);
		}

		#renderBadgesRow()
		{
			const current = this.currentStepIndex;
			const hasNext = current + 1 < this.steps.length;

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							flexShrink: 1,
						},
					},
					this.#renderBadge(current),
					this.#renderActiveLabel(),
				),
				hasNext ? this.#renderBadge(current + 1) : null,
			);
		}

		#renderBadge(index)
		{
			const isUpcoming = index > this.currentStepIndex;
			const circleStyle = {
				width: BADGE_DIAMETER,
				height: BADGE_DIAMETER,
				borderRadius: BADGE_DIAMETER / 2,
				alignItems: 'center',
				justifyContent: 'center',
			};

			if (isUpcoming)
			{
				circleStyle.borderWidth = BADGE_BORDER_WIDTH;
				circleStyle.borderColor = Color.base4.toHex();
			}
			else
			{
				circleStyle.backgroundColor = Color.accentMainPrimary.toHex();
			}

			return View(
				{
					testId: this.getTestId(`step-${index}`),
					style: circleStyle,
				},
				H4({
					testId: this.getTestId(`step-${index}-number`),
					text: String(index + 1),
					accent: true,
					color: isUpcoming ? Color.base4 : Color.baseWhiteFixed,
					style: { textAlign: 'center' },
				}),
			);
		}

		#renderActiveLabel()
		{
			const label = this.steps[this.currentStepIndex]?.label;
			if (!label)
			{
				return null;
			}

			return H4({
				testId: this.getTestId('active-label'),
				text: String(label),
				accent: true,
				color: Color.base1,
				numberOfLines: 1,
				ellipsize: 'end',
				style: {
					marginLeft: Indent.XL.toNumber(),
					flexShrink: 1,
				},
			});
		}

		#renderTrack()
		{
			const current = this.currentStepIndex;
			const gap = Indent.XS2.toNumber();
			const segments = this.steps.map((step, index) => {
				const color = index <= current ? Color.accentMainPrimary : Color.base5;

				return View({
					testId: this.getTestId(`segment-${index}`),
					style: {
						height: SEGMENT_HEIGHT,
						width: '100%',
						flexShrink: 1,
						borderRadius: Corner.XS.toNumber(),
						backgroundColor: color.toHex(),
						marginHorizontal: gap,
					},
				});
			});

			return View(
				{
					testId: this.getTestId('track'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginTop: Indent.XL2.toNumber(),
					},
				},
				...segments,
			);
		}
	}

	module.exports = { StepProgressBar };
});
