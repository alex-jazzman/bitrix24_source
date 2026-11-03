/**
 * @module my-company/entry-plate
 */
jn.define('my-company/entry-plate', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { MyCompany } = require('my-company');
	const { makeLibraryImagePath } = require('asset-manager');

	const { Card, CardCorner } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { BadgeCounter, BadgeCounterDesign, BadgeCounterSize } = require('ui-system/blocks/badges/counter');
	const { Text2, Text5 } = require('ui-system/typography/text');

	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');
	const { RefRegistry } = require('more-menu/ref-registry');

	// anchor of the first hint step: the aha-moment waits for this key in the refs registry
	const REF_KEY = 'my_company_entry_plate';

	// one step of Indent.M above the previous 40: the graphic leads the plate and reads as its subject
	const IMAGE_SIZE = 48;
	const CHEVRON_SIZE = 24;

	// The mockup names the axis 272deg, pointing at the left edge of the card. What stands here is 182,
	// which the native angle - the css one, 0 pointing up - reads as pointing down: the tone runs down
	// the plate rather than towards its left edge. Left as it is rather than repainting the plate.
	const GRADIENT_ANGLE = 182;

	// at the far end of the axis the background of the card shows through the gradient
	const GRADIENT_END_OPACITY = 0.6;

	const BORDER_OPACITY = 0.5;

	/**
	 * @class MyCompanyEntryPlate
	 */
	class MyCompanyEntryPlate extends PureComponent
	{
		/**
		 * @param props
		 * @param {object} props.layout parent layout the section widget is opened over
		 * @param {string} [props.companyName] name of the company, the title of the plate
		 * @param {string} props.testId
		 * @param {number} [props.counter]
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});

			// The very ref this plate put into the registry, so that going away it takes down its own
			// anchor and not the one a plate mounted after it has already registered under the same key.
			this.cardRef = null;
		}

		componentWillUnmount()
		{
			if (this.cardRef)
			{
				RefRegistry.unregister(REF_KEY, this.cardRef);
				this.cardRef = null;
			}
		}

		render()
		{
			return Card(
				{
					testId: this.getTestId(),
					corner: CardCorner.L,
					// the same outline the card of the working day and the check-in wears in the menu, held
					// back to half its strength so it reads as an edge rather than as a line of its own
					border: true,
					borderColor: Color.cardStrokeGradient1.toHex(BORDER_OPACITY),
					// no pressed state: `withPressed` would only repaint the background under the gradient
					ref: this.#handleRef,
					onClick: this.#handleClick,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						backgroundColorGradient: {
							start: Color.accentSoftBlue1.toHex(),
							end: Color.accentSoftBlue2.toHex(GRADIENT_END_OPACITY),
							angle: GRADIENT_ANGLE,
						},
					},
				},
				this.#renderMainContent(),
				this.#renderTrailingContent(),
			);
		}

		#renderMainContent()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexGrow: 2,
						flexShrink: 2,
					},
				},
				this.#renderIcon(),
				this.#renderTitles(),
			);
		}

		#renderTrailingContent()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexShrink: 0,
					},
				},
				this.#renderCounter(),
				this.#renderChevron(),
			);
		}

		#renderCounter()
		{
			const { counter } = this.props;

			if (!counter)
			{
				return null;
			}

			return BadgeCounter({
				testId: this.getTestId('counter'),
				value: counter,
				size: BadgeCounterSize.M,
				showRawValue: true,
				design: BadgeCounterDesign.ALERT,
				style: {
					marginLeft: Indent.M.toNumber(),
				},
			});
		}

		#renderIcon()
		{
			return Image({
				testId: this.getTestId('icon'),
				style: {
					width: IMAGE_SIZE,
					height: IMAGE_SIZE,
				},
				resizeMode: 'contain',
				uri: makeLibraryImagePath('my-company.png', 'my-company'),
			});
		}

		/**
		 * The pair of the mockup: the caption of the section over the name of the company. While the name
		 * is missing the caption stays alone and takes the accent of the absent row, so the entry point
		 * keeps a readable title instead of a lone quiet line.
		 *
		 * @return {object}
		 */
		#renderTitles()
		{
			const { companyName } = this.props;

			return View(
				{
					style: {
						flexGrow: 2,
						flexShrink: 2,
						marginLeft: Indent.M.toNumber(),
					},
				},
				companyName ? this.#renderCaption() : this.#renderTitle(),
				companyName ? this.#renderCompanyName(companyName) : null,
			);
		}

		#renderCaption()
		{
			return Text5({
				testId: this.getTestId('title'),
				text: Loc.getMessage('MY_COMPANY_ENTRY_PLATE_TITLE'),
				color: Color.base2,
				numberOfLines: 1,
				ellipsize: 'end',
			});
		}

		#renderTitle()
		{
			return Text2({
				testId: this.getTestId('title'),
				text: Loc.getMessage('MY_COMPANY_ENTRY_PLATE_TITLE'),
				color: Color.base1,
				accent: true,
				numberOfLines: 1,
				ellipsize: 'end',
			});
		}

		/**
		 * @param {string} companyName
		 * @return {object}
		 */
		#renderCompanyName(companyName)
		{
			return Text2({
				testId: this.getTestId('company-name'),
				text: companyName,
				color: Color.base1,
				accent: true,
				numberOfLines: 1,
				ellipsize: 'end',
				style: {
					marginTop: Indent.XS2.toNumber(),
				},
			});
		}

		#renderChevron()
		{
			return IconView({
				testId: this.getTestId('chevron'),
				size: CHEVRON_SIZE,
				icon: Icon.CHEVRON_TO_THE_RIGHT,
				color: Color.base3,
				style: {
					marginLeft: Indent.M.toNumber(),
				},
			});
		}

		#handleRef = (ref) => {
			if (ref)
			{
				this.cardRef = ref;
				RefRegistry.register(REF_KEY, ref);
			}
		};

		#handleClick = () => {
			const { layout } = this.props;

			MyCompany.open({ context: { parentWidget: layout } }).catch(console.error);
		};
	}

	MyCompanyEntryPlate.propTypes = {
		layout: PropTypes.object.isRequired,
		companyName: PropTypes.string,
		testId: PropTypes.string.isRequired,
		counter: PropTypes.number,
	};

	module.exports = { MyCompanyEntryPlate };
});
