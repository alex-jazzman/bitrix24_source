/**
 * @module layout/ui/field-filter/filter/src/layout/selectable-row
 */
jn.define('layout/ui/field-filter/filter/src/layout/selectable-row', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Icon } = require('ui-system/blocks/icon');
	const { SettingSelector, SettingMode } = require('ui-system/blocks/setting-selector');
	const {
		getRowStyle,
		RowDivider,
		ROW_ICON_SIZE,
	} = require('layout/ui/field-filter/filter/src/layout/row-layout');
	const { createTestIdGenerator } = require('utils/test');

	/**
	 * Icon size of SettingSelector, shared by the check on the right and the leading icon.
	 * @type {number}
	 */
	const ICON_SIZE = ROW_ICON_SIZE;

	/**
	 * Row of a choice list: the chosen one carries a check on the right and an accent title
	 * (BXML `SettingsCell mode="icon" rightIcon="Outline/Check"`). Shared by the sorting
	 * section and the value pickers, so "chosen" reads the same everywhere.
	 *
	 * The check stays mounted and is hidden by its opacity: a right icon that comes and goes
	 * between renders keeps the previous row marked, since the native layer applies changed
	 * properties but not an appearing or disappearing child.
	 *
	 * A list of rows under a title that stands in the icon column asks for that column itself
	 * (`iconColumn`): rows kept at the edge would stand to the left of the group they belong to.
	 *
	 * @param {SelectableRowProps} props
	 */
	function SelectableRow(props = {})
	{
		const {
			testId,
			title,
			selected = false,
			icon = null,
			iconColumn: keepsColumn = false,
			divider = true,
			onClick,
		} = props;

		const getTestId = createTestIdGenerator({ prefix: testId });
		const titleColor = selected ? Color.accentMainPrimary : Color.base1;
		const hasIcon = Boolean(icon);
		const iconColumn = hasIcon || keepsColumn;

		return View(
			{ style: { flexDirection: 'column' } },
			SettingSelector({
				testId,
				title,
				color: titleColor,
				icon,
				iconColor: titleColor,
				mode: SettingMode.RIGHT_ICON,
				modeParams: {
					icon: Icon.CHECK,
					size: ICON_SIZE,
					color: Color.accentMainPrimary,
					opacity: selected ? 1 : 0,
				},
				divider: false,
				style: getRowStyle({ hasIcon, iconColumn }),
				onClick,
			}),
			divider ? RowDivider({ testId: getTestId('divider'), iconColumn }) : null,
		);
	}

	module.exports = { SelectableRow };
});
