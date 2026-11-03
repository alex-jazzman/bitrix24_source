/**
 * @module layout/ui/field-filter/filter/src/fields/controls/additional-filter
 */
jn.define('layout/ui/field-filter/filter/src/fields/controls/additional-filter', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { PureComponent } = require('layout/pure-component');
	const { Icon } = require('ui-system/blocks/icon');
	const { Input } = require('ui-system/form/inputs/input');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { IconAction, ICON_SIZE } = require('layout/ui/field-filter/filter/src/layout/icon-action');
	const {
		getAdditionalFilterLabel,
		getAdditionalFilterMenuLabel,
	} = require('layout/ui/field-filter/filter/src/model/value-formatter');
	const { AdditionalFilter } = require('layout/ui/field-filter/values');

	// the order of the items is a decision of this control, not of the enum
	const ADDITIONAL_ORDER = [
		AdditionalFilter.IS_EMPTY.getValue(),
		AdditionalFilter.HAS_ANY_VALUE.getValue(),
	];

	/**
	 * Article the "---" menu of the web filter points at, behind the same wording.
	 * @type {string}
	 */
	const HELP_ARTICLE_CODE = '14006190';

	const HELP_ITEM_ID = 'help';

	/**
	 * Conditions on the presence of a value the field allows, in the order they are offered. The list
	 * comes from the web descriptor (`ADDITIONAL_FILTER_ALLOWED`), so a field that declares none offers
	 * none - and a locked field offers none either, being edited in the web altogether.
	 *
	 * @param {FieldDescriptor} descriptor
	 * @return {AdditionalFilter[]}
	 */
	const getAllowedAdditional = (descriptor) => {
		const allowed = descriptor?.additionalFilter;

		if (descriptor?.locked || !Type.isArrayFilled(allowed))
		{
			return [];
		}

		return ADDITIONAL_ORDER.filter((additional) => allowed.includes(additional));
	};

	/**
	 * The "---" of the web filter: the conditions on the presence of a value the field allows, with the
	 * same wording and the same article behind them. Draws nothing for a field that allows none.
	 *
	 * The tapped item comes out as it is, including the one already chosen - what choosing the chosen
	 * condition means belongs to the field, not to the menu.
	 *
	 * @extends {PureComponent<AdditionalFilterButtonProps>}
	 */
	class AdditionalFilterButton extends PureComponent
	{
		/**
		 * @param {AdditionalFilterButtonProps} props
		 */
		constructor(props)
		{
			super(props);

			this.open = this.open.bind(this);
			this.openHelp = this.openHelp.bind(this);

			// the menu is anchored to the icon that opens it, the way a web dropdown is
			this.bindRef = (ref) => {
				this.ref = ref;
			};
		}

		getAllowed()
		{
			return getAllowedAdditional(this.props.descriptor);
		}

		openHelp()
		{
			helpdesk.openHelpArticle(HELP_ARTICLE_CODE);
		}

		/**
		 * The conditions the field allows and, behind them, the article of the web filter. The article
		 * is worded by `M_FIELD_FILTER_ADDITIONAL_HELP` and carries the question mark the design
		 * system marks help with - the ready-made `MenuType.HELPDESK` item draws the same mark but
		 * comes with a name of its own, so the item is built here to keep the phrase of the filter.
		 *
		 * @return {PopupMenuActionItem[]}
		 */
		getMenuItems()
		{
			const { testId, value = null, onSelect } = this.props;

			return [
				...this.getAllowed().map((additional) => ({
					id: additional,
					testId: `${testId}-${additional}`,
					title: getAdditionalFilterMenuLabel(additional),
					checked: additional === value,
					onItemSelected: () => onSelect?.(additional),
				})),
				{
					id: HELP_ITEM_ID,
					testId: `${testId}-${HELP_ITEM_ID}`,
					title: Loc.getMessage('M_FIELD_FILTER_ADDITIONAL_HELP'),
					icon: Icon.QUESTION,
					onItemSelected: this.openHelp,
				},
			];
		}

		open()
		{
			this.menu = new PopupMenu(this.getMenuItems());

			this.menu.show({ target: this.ref });
		}

		render()
		{
			const { testId, size = ICON_SIZE, marginLeft, marginRight } = this.props;

			if (this.getAllowed().length === 0)
			{
				return null;
			}

			return IconAction({
				testId,
				icon: Icon.MORE,
				size,
				marginLeft,
				marginRight,
				forwardRef: this.bindRef,
				onClick: this.open,
			});
		}
	}

	/**
	 * The chosen condition where the value of the field would stand, worded the way the web words it
	 * in the field (`ADDITIONAL_FILTER_PLACEHOLDER_*`). The input is switched off: there is nothing
	 * left to fill in while the condition holds.
	 *
	 * The cross at its right edge drops the condition and gives the field back to its own control,
	 * together with what it held before - the same way the cross on the web tag reads.
	 *
	 * @param {AdditionalFilterValueProps} props
	 */
	function AdditionalFilterValue(props)
	{
		const { testId, additional, size, style, onClear } = props;

		return Input({
			testId,
			value: getAdditionalFilterLabel(additional),
			size,
			disabled: true,
			rightContent: Icon.CROSS,
			onClickRightContent: onClear,
			style,
		});
	}

	module.exports = {
		AdditionalFilterButton: (props) => new AdditionalFilterButton(props),
		AdditionalFilterValue,
		getAllowedAdditional,
		ADDITIONAL_ORDER,
	};
});
