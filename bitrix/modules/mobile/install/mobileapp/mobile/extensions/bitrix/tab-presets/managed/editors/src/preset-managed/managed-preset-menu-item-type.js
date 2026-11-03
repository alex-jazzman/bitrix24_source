/**
 * @module tab-presets/managed/editors/src/preset-managed/managed-preset-menu-item-type
 */
jn.define('tab-presets/managed/editors/src/preset-managed/managed-preset-menu-item-type', (require, exports, module) => {
	/** @type {Readonly<{ ACTIVE: 'active', INACTIVE: 'inactive', STATIC: 'static' }>} */
	const ManagedPresetMenuItemType = Object.freeze({
		ACTIVE: 'active',
		INACTIVE: 'inactive',
		STATIC: 'static',
	});

	module.exports = { ManagedPresetMenuItemType };
});
