/**
 * @module im/messenger/model/messages/block/normalizer
 */

jn.define('im/messenger/model/messages/block/normalizer', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * Normalizes block data from server or local DB.
	 *
	 * Accepts two formats:
	 * - New server format: { config: { background }, elements: [...] }
	 * - Legacy format (local DB): { blocks: [...], background }
	 *
	 * @param {object} blockData
	 * @return {BlockModelState|null}
	 */
	function normalize(blockData)
	{
		if (!Type.isPlainObject(blockData))
		{
			return null;
		}

		// fallback on blocks: SQLite stores legacy format with "blocks" key
		const elements = blockData.elements ?? blockData.blocks;
		if (!elements)
		{
			return null;
		}

		const normalizedElements = normalizeElements(elements);
		if (normalizedElements.length === 0)
		{
			return null;
		}

		const result = { elements: normalizedElements };

		const background = blockData.config?.background ?? blockData.background;
		if (Type.isStringFilled(background))
		{
			result.background = background;
		}

		return result;
	}

	/**
	 * @param {object} element
	 * @return {boolean}
	 */
	function isElementValid(element)
	{
		return Type.isPlainObject(element) && !Type.isNil(element.id);
	}

	/**
	 * @param {FormFieldType|BlockButtonTypeData} item
	 * @return {boolean}
	 */
	function isTransientLocked(item)
	{
		return Type.isPlainObject(item) && item.isTransientDisabled === true;
	}

	/**
	 * @param {FormFieldType} field
	 * @return {FormFieldType}
	 */
	function unlockField(field)
	{
		if (!isTransientLocked(field))
		{
			return field;
		}

		const { isTransientDisabled, ...restField } = field;

		return { ...restField, disabled: false };
	}

	/**
	 * @param {BlockButtonTypeData} button
	 * @return {BlockButtonTypeData}
	 */
	function unlockButton(button)
	{
		if (!isTransientLocked(button))
		{
			return button;
		}

		const { isTransientDisabled, hasLoader, ...restButton } = button;

		return { ...restButton, disabled: false };
	}

	/**
	 * Strips the client-only transient form lock from the element.
	 * The lock flags may leak into the local DB cache if the app dies
	 * between the submit lock and unlock, and the lock must not survive
	 * a restore (EVENT-03, direction 2). Only the fields and buttons
	 * marked with `isTransientDisabled` are unlocked: the server-driven
	 * `disabled` (TPL-01) has no marker and stays untouched.
	 *
	 * @param {BaseBlockElementType} element
	 * @return {BaseBlockElementType}
	 */
	function stripTransientLock(element)
	{
		const fields = Array.isArray(element.elements) ? element.elements : [];
		const buttonRows = Array.isArray(element.buttons) ? element.buttons : [];

		const hasTransientLock = fields.some(isTransientLocked)
			|| buttonRows.some((row) => Array.isArray(row) && row.some(isTransientLocked));

		if (!hasTransientLock)
		{
			return element;
		}

		const result = { ...element };
		if (fields.length > 0)
		{
			result.elements = fields.map(unlockField);
		}

		if (buttonRows.length > 0)
		{
			result.buttons = buttonRows.map((row) => (Array.isArray(row) ? row.map(unlockButton) : row));
		}

		return result;
	}

	/**
	 * @param {Array} elements
	 * @return {Array<BaseBlockElementType>}
	 */
	function normalizeElements(elements)
	{
		if (!Type.isArrayFilled(elements))
		{
			return [];
		}

		return elements
			.filter((element) => isElementValid(element))
			.map((element) => stripTransientLock(element));
	}

	module.exports = { normalize, isElementValid };
});
