/**
 * @module layout/socialnetwork/permission-menu
 */
jn.define('layout/socialnetwork/permission-menu', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');

	const PermissionValueType = {
		ALL: 'K',
		OWNER_AND_MODERATORS: 'E',
		OWNER: 'A',
	};

	const PermissionBooleanValueType = {
		TRUE: 'Y',
		FALSE: 'N',
	};

	const buildMenuItems = ({
		values,
		keys = Object.keys(values),
		currentValue,
		onSelect,
		getTitle,
		getTestId = null,
		selectedIconName = Icon.CHECK,
		selectedIconColor = Color.accentMainPrimary,
	}) => {
		return keys.map((key) => {
			const value = values[key];

			return {
				id: value,
				testId: getTestId?.(key, value),
				title: getTitle(key, value),
				iconName: currentValue === value ? selectedIconName : null,
				iconColor: selectedIconColor,
				onItemSelected: () => onSelect(value, key),
			};
		});
	};

	const buildRoleMenuItems = (params) => buildMenuItems({
		...params,
		values: PermissionValueType,
	});

	const buildBooleanMenuItems = (params) => buildMenuItems({
		...params,
		values: PermissionBooleanValueType,
	});

	module.exports = {
		PermissionValueType,
		PermissionBooleanValueType,
		buildRoleMenuItems,
		buildBooleanMenuItems,
	};
});
