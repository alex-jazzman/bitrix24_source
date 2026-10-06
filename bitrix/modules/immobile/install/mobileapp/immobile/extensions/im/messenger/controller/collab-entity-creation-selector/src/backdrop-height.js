/**
 * @module im/messenger/controller/collab-entity-creation-selector/src/backdrop-height
 */
jn.define('im/messenger/controller/collab-entity-creation-selector/src/backdrop-height', (require, exports, module) => {
	const { Component } = require('tokens');
	const { getMediumHeight } = require('utils/page-manager');

	const ITEM_HEIGHT = 69;

	/**
	 * @desc Returns the backdrop content height: Area paddings + item rows.
	 * The native side adds the widget title height and the bottom inset on top of this value itself.
	 * @param {number} itemsCount
	 * @return {number}
	 */
	function calculateBackdropHeight(itemsCount)
	{
		const areaPaddings = Component.areaPaddingTFirst.toNumber() + Component.areaPaddingB.toNumber();

		return getMediumHeight({ height: areaPaddings + itemsCount * ITEM_HEIGHT });
	}

	module.exports = {
		calculateBackdropHeight,
		ITEM_HEIGHT,
	};
});
