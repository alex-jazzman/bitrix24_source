/**
 * @module disk/opener/unified-link/rest
 */
jn.define('disk/opener/unified-link/rest', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @param {string} uniqueCode
	 * @param {string} [attachedId]
	 * @param {string|number} [versionId]
	 * @returns {Promise<Object>}
	 */
	function getUnifiedLinkData(uniqueCode, attachedId, versionId)
	{
		if (!Type.isStringFilled(uniqueCode?.trim()))
		{
			return Promise.reject(new Error('uniqueCode is required'));
		}

		const data = Object.fromEntries(
			Object.entries({
				versionId,
				uniqueCode,
				attachedObjectId: attachedId,
			}).filter(([_, value]) => Boolean(value)),
		);

		return BX.ajax.runAction(
			'disk.api.UnifiedLinkActions.get',
			{ data },
		);
	}

	/**
	 * @param {string} uniqueCode
	 * @param {string} password
	 * @param {string|number} [versionId]
	 * @returns {Promise<Object>}
	 */
	function validateUnifiedLinkPassword(uniqueCode, password, versionId)
	{
		if (!Type.isStringFilled(uniqueCode?.trim()))
		{
			return Promise.reject(new Error('uniqueCode is required'));
		}

		if (!Type.isStringFilled(password?.trim()))
		{
			return Promise.reject(new Error('password is required'));
		}

		const data = {
			uniqueCode,
			password,
		};

		if (versionId)
		{
			data.versionId = versionId;
		}

		return BX.ajax.runAction(
			'disk.api.UnifiedLinkActions.validatePassword',
			{ data },
		);
	}

	module.exports = {
		getUnifiedLinkData,
		validateUnifiedLinkPassword,
	};
});
