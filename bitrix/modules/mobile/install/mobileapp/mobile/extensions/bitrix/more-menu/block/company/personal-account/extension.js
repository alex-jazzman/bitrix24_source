/**
 * @module more-menu/block/company/personal-account
 */
jn.define('more-menu/block/company/personal-account', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');

	const { Card, CardCorner, CardDesign } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text2, Text3 } = require('ui-system/typography/text');

	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');
	const { getCardBorderColor } = require('more-menu/block/company/card-border');

	const ItemType = {
		SALARY: 'salary',
		VACATION: 'vacation',
	};

	/**
	 * The card shows the same two rows whatever it knows: nothing of the list of the companies is drawn,
	 * and it is the flow behind a tap that needs it. The list is handed over by the owner that mounted
	 * the card, and the section offers no card at all to a user with no company behind them.
	 *
	 * @class PersonalAccountSection
	 */
	class PersonalAccountSection extends PureComponent
	{
		/**
		 * @param props
		 * @param {object} props.layout
		 * @param {Array} props.companies the companies the user may ask a document of
		 * @param {string} props.testId
		 * @param {function} [props.onCardClick] a row of the card was tapped
		 * @param {function} [props.onFlowStateChange] the flow behind a row came to this state
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});
		}

		render()
		{
			return Card(
				{
					testId: this.getTestId('card'),
					corner: CardCorner.XL,
					design: CardDesign.PRIMARY,
					border: true,
					borderColor: getCardBorderColor(),
				},
				Text2({
					testId: this.getTestId('title'),
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_TITLE'),
					color: Color.base1,
					accent: true,
					style: {
						marginBottom: Indent.L.toNumber(),
					},
				}),
				this.#renderItem({
					type: ItemType.SALARY,
					icon: Icon.RECEIPT,
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_SALARY'),
				}),
				this.#renderItem({
					type: ItemType.VACATION,
					icon: Icon.VACATION,
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_VACATION'),
				}),
			);
		}

		#renderItem({ type, icon, text })
		{
			return View(
				{
					testId: this.getTestId(`item-${type}`),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: Indent.M.toNumber(),
					},
					onClick: () => this.#openItem(type),
				},
				IconView({
					testId: this.getTestId(`item-${type}-icon`),
					size: 24,
					icon,
					color: Color.accentMainPrimary,
				}),
				Text3({
					testId: this.getTestId(`item-${type}-text`),
					text,
					color: Color.base1,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flexGrow: 2,
						flexShrink: 2,
						marginLeft: Indent.XL.toNumber(),
					},
				}),
				IconView({
					testId: this.getTestId(`item-${type}-chevron`),
					size: 24,
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: Color.base4,
					style: {
						marginLeft: Indent.XS.toNumber(),
					},
				}),
			);
		}

		#openItem(type)
		{
			const { companies, layout, onCardClick, onFlowStateChange } = this.props;

			// The tap itself, whatever the list of the companies turns out to be: the owner of the card
			// hears of it before anything of the flow is decided.
			onCardClick?.(type);

			// A card offered to a user with no company behind them is a card with nothing to open.
			if (companies.length === 0)
			{
				return;
			}

			PersonalAccountSection.open({
				layout,
				type,
				companies,
				onFlowStateChange,
			});
		}

		/**
		 * Opens the personal account flow for the requested section.
		 * @param {object} params
		 * @param {object} params.layout parent layout for the future bottom-sheet flow
		 * @param {string} params.type one of ItemType (salary | vacation)
		 * @param {Array} params.companies companies the user may ask a document of
		 * @param {function} [params.onFlowStateChange] how the run of the flow went
		 */
		static open(params)
		{
			const { layout, type, companies, onFlowStateChange } = params;
			const { PersonalAccountFlow } = require('more-menu/block/company/personal-account/src/flow');

			return PersonalAccountFlow.open({ type, companies, parentLayout: layout, onFlowStateChange });
		}
	}

	PersonalAccountSection.propTypes = {
		layout: PropTypes.object.isRequired,
		companies: PropTypes.array,
		testId: PropTypes.string.isRequired,
		// the two below are listened to by the section; nobody else mounting the card hands them over
		onCardClick: PropTypes.func,
		onFlowStateChange: PropTypes.func,
	};

	module.exports = { PersonalAccountSection };
});
