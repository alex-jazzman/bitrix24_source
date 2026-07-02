/**
 * @module mail/mailbox/settings/src/settings-ui
 */
jn.define('mail/mailbox/settings/src/settings-ui', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Text3, Text4, Text5 } = require('ui-system/typography/text');
	const { Checkbox } = require('ui-system/form/checkbox');
	const { Switcher, SwitcherSize } = require('ui-system/blocks/switcher');
	const { Link4, LinkMode } = require('ui-system/blocks/link');
	const { Icon } = require('ui-system/blocks/icon');
	const { ChipButton } = require('ui-system/blocks/chips/chip-button');
	const { ChipButtonDesign } = require('ui-system/blocks/chips/chip-button/src/design-enum');
	const { ChipButtonMode } = require('ui-system/blocks/chips/chip-button/src/mode-enum');
	const { ChipButtonSize } = require('ui-system/blocks/chips/chip-button/src/size-enum');

	/**
	 * @param {object} params
	 * @param {string} params.testId
	 * @param {string} params.title
	 * @param {boolean} params.checked
	 * @param {boolean} [params.disabled=false]
	 * @param {Function} params.onChange
	 * @returns {object}
	 */
	function renderCardTitleWithToggle({ testId, title, checked, disabled = false, onChange })
	{
		return View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					paddingTop: Indent.S.toNumber(),
					paddingBottom: Indent.M.toNumber(),
				},
				onClick: disabled ? undefined : () => onChange(!checked),
			},
			Text3({
				text: title,
				color: Color.base1,
				testId: `${testId}-title`,
			}),
			Switcher({
				checked,
				disabled,
				useState: false,
				size: SwitcherSize.L,
				testId: `${testId}_toggle`,
			}),
		);
	}

	/**
	 * @param {object} params
	 * @param {string} params.testId
	 * @param {boolean} params.checked
	 * @param {string} params.text
	 * @param {Function} params.onCheckboxClick
	 * @returns {object}
	 */
	function renderCheckboxRow({ testId, checked, text, onCheckboxClick })
	{
		return View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'flex-start',
				},
				onClick: () => onCheckboxClick(!checked),
			},
			View(
				{},
				new Checkbox({
					checked,
					useState: false,
					testId: `${testId}-checkbox`,
				}),
			),
			View(
				{
					style: {
						flex: 1,
						flexShrink: 1,
						marginLeft: Indent.XL.toNumber(),
					},
				},
				Text4({
					text,
					color: Color.base1,
					testId: `${testId}-text`,
				}),
			),
		);
	}

	/**
	 * @param {object} params
	 * @param {string} params.testId
	 * @param {boolean} params.checked
	 * @param {string} params.text
	 * @param {string} params.linkText
	 * @param {Function} params.onCheckboxClick
	 * @param {Function} params.onLinkClick
	 * @param {Function} params.linkRef
	 * @returns {object}
	 */
	function renderCheckboxWithLink({ testId, checked, text, linkText, onCheckboxClick, onLinkClick, linkRef })
	{
		return View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'flex-start',
				},
			},
			View(
				{
					onClick: () => onCheckboxClick(!checked),
				},
				new Checkbox({
					checked,
					useState: false,
					testId: `${testId}-checkbox`,
				}),
			),
			View(
				{
					style: {
						flex: 1,
						marginLeft: Indent.XL.toNumber(),
					},
				},
				View(
					{
						onClick: () => onCheckboxClick(!checked),
					},
					Text4({
						text,
						color: Color.base1,
						testId: `${testId}-text`,
					}),
				),
				Link4({
					text: linkText,
					forwardRef: linkRef,
					mode: LinkMode.PLAIN,
					onClick: onLinkClick,
					testId: `${testId}-link`,
					rightIcon: Icon.CHEVRON_DOWN,
					style: { alignSelf: 'flex-start', marginTop: Indent.XS2.toNumber() },
				}),
			),
		);
	}

	/**
	 * @param {object} params
	 * @param {string} params.testId
	 * @param {string} params.text
	 * @returns {object}
	 */
	function renderSectionTitle({ testId, text })
	{
		return View(
			{
				style: {
					paddingTop: Indent.S.toNumber(),
					paddingBottom: Indent.M.toNumber(),
				},
			},
			Text3({
				testId: `${testId}-text`,
				text,
				color: Color.base1,
			}),
		);
	}

	/**
	 * @param {object} params
	 * @param {string} params.testId
	 * @param {string} params.text
	 * @returns {object}
	 */
	function renderMainSectionTitle({ testId, text })
	{
		return Text5({
			testId: `${testId}-text`,
			text,
			color: Color.base3,
		});
	}

	/**
	 * @param {object} params
	 * @param {string} [params.testId]
	 * @returns {object}
	 */
	function renderSectionDivider({ testId } = {})
	{
		return View({
			testId,
			style: {
				height: 1,
				backgroundColor: Color.bgSeparatorPrimary.toHex(),
			},
		});
	}

	/**
	 * @param {object} params
	 * @param {string} params.testId
	 * @param {string} params.text
	 * @param {Function} params.onClick
	 * @param {Function} [params.forwardRef]
	 * @param {boolean} [params.disabled=false]
	 * @returns {object}
	 */
	function renderChipSelector({ testId, text, onClick, forwardRef, disabled = false })
	{
		return ChipButton({
			testId,
			text,
			mode: ChipButtonMode.OUTLINE,
			design: ChipButtonDesign.PRIMARY,
			size: ChipButtonSize.S,
			dropdown: true,
			disabled,
			forwardRef,
			onClick,
		});
	}

	/**
	 * @param {object} params
	 * @param {string} params.testId
	 * @param {boolean} params.checked
	 * @param {string} params.text
	 * @param {Function} params.onToggle
	 * @param {string} [params.alignItems='center']
	 * @param {boolean} [params.disabled=false]
	 * @returns {object}
	 */
	function renderToggleRow({ testId, checked, text, onToggle, alignItems = 'center', disabled = false })
	{
		const handleToggle = disabled ? undefined : () => onToggle(!checked);
		const textColor = disabled ? Color.base4 : Color.base1;

		return View(
			{
				style: {
					flexDirection: 'row',
					alignItems,
					justifyContent: 'space-between',
				},
			},
			View(
				{
					style: {
						flex: 1,
						flexShrink: 1,
						paddingRight: Indent.XL.toNumber(),
					},
					onClick: handleToggle,
				},
				Text4({
					testId: `${testId}-text`,
					text,
					color: textColor,
				}),
			),
			View(
				{
					onClick: handleToggle,
				},
				Switcher({
					testId: `${testId}_toggle`,
					checked,
					disabled,
					useState: false,
					size: SwitcherSize.L,
				}),
			),
		);
	}

	/**
	 * @param {object} params
	 * @param {string} params.testId
	 * @param {boolean} params.checked
	 * @param {string} params.text
	 * @param {string} params.chipText
	 * @param {Function} params.onToggle
	 * @param {Function} params.onChipClick
	 * @param {Function} [params.chipRef]
	 * @param {boolean} [params.disabled=false]
	 * @returns {object}
	 */
	function renderToggleWithChip(
		{ testId, checked, text, chipText, onToggle, onChipClick, chipRef, disabled = false },
	)
	{
		const handleToggle = disabled ? undefined : () => onToggle(!checked);
		const textColor = disabled ? Color.base4 : Color.base1;

		return View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'flex-start',
					justifyContent: 'space-between',
				},
			},
			View(
				{
					style: {
						flex: 1,
						flexShrink: 1,
						paddingRight: Indent.XL.toNumber(),
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							flexWrap: 'wrap',
							alignItems: 'center',
						},
					},
					View(
						{
							onClick: handleToggle,
						},
						Text4({
							testId: `${testId}-text`,
							text,
							color: textColor,
						}),
					),
					View(
						{
							style: {
								marginLeft: Indent.XS.toNumber(),
								marginTop: Indent.XS2.toNumber(),
							},
						},
						renderChipSelector({
							testId: `${testId}-selector`,
							text: chipText,
							forwardRef: chipRef,
							disabled,
							onClick: onChipClick,
						}),
					),
				),
			),
			View(
				{
					style: {
						marginTop: Indent.XS2.toNumber(),
					},
					onClick: handleToggle,
				},
				Switcher({
					testId: `${testId}_toggle`,
					checked,
					disabled,
					useState: false,
					size: SwitcherSize.L,
				}),
			),
		);
	}

	/**
	 * @param {string|number} days
	 * @param {Array<{value: string, label: string}>} options
	 * @returns {string}
	 */
	function getPeriodText(days, options = [])
	{
		const normalizedValue = days !== null && days !== undefined ? String(days) : '';
		const option = options.find((opt) => opt.value === normalizedValue);

		return option ? option.label : normalizedValue;
	}

	module.exports = {
		renderCardTitleWithToggle,
		renderCheckboxWithLink,
		renderCheckboxRow,
		renderChipSelector,
		renderMainSectionTitle,
		renderSectionDivider,
		renderSectionTitle,
		renderToggleRow,
		renderToggleWithChip,
		getPeriodText,
	};
});
