/**
 * @module disk/opener/unified-link/rest
 */
jn.define('disk/opener/unified-link/rest', (require, exports, module) => {
	const { Type } = require('type');

	const runUnifiedLinkAction = (action, uniqueCode, data = {}) => {
		if (!Type.isStringFilled(uniqueCode))
		{
			return Promise.reject(new Error('uniqueCode is required'));
		}

		return BX.ajax.runAction(action, {
			data: {
				uniqueCode,
				...Object.fromEntries(
					Object.entries(data).filter(([, value]) => value !== undefined),
				),
			},
		});
	};

	/**
	 * @param {string} uniqueCode
	 * @param {string} [attachedId]
	 * @param {string|number} [versionId]
	 * @return {Promise<UnifiedLinkObjectResponse>}
	 */
	function getUnifiedLinkData(uniqueCode, attachedId, versionId)
	{
		if (!Type.isStringFilled(uniqueCode))
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
	 * @return {Promise<UnifiedLinkObjectResponse>}
	 */
	function getUnifiedLinkDataWithRights(uniqueCode)
	{
		return runUnifiedLinkAction('disk.api.UnifiedLinkActions.getWithRights', uniqueCode);
	}

	/**
	 * @param {string} uniqueCode
	 * @param {string} password
	 * @param {string|number} [versionId]
	 * @return {Promise<UnifiedLinkObjectResponse>}
	 */
	function validateUnifiedLinkPassword(uniqueCode, password, versionId)
	{
		if (!Type.isStringFilled(uniqueCode))
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

	/**
	 * @param {string} uniqueCode
	 * @param {string} newName
	 * @param {boolean} [autoCorrect]
	 * @return {Promise<UnifiedLinkObjectResponse>}
	 */
	function renameByUnifiedLink(uniqueCode, newName, autoCorrect = false)
	{
		if (!Type.isStringFilled(newName?.trim()))
		{
			return Promise.reject(new Error('newName is required'));
		}

		return runUnifiedLinkAction(
			'disk.api.UnifiedLinkActions.rename',
			uniqueCode,
			{ newName, autoCorrect },
		);
	}

	/**
	 * @param {string} uniqueCode
	 * @return {Promise<UnifiedLinkEmptyResponse>}
	 */
	function markDeletedByUnifiedLink(uniqueCode)
	{
		return runUnifiedLinkAction('disk.api.UnifiedLinkActions.markDeleted', uniqueCode);
	}

	/**
	 * @param {string} uniqueCode
	 * @param {number} targetFolderId
	 * @return {Promise<UnifiedLinkObjectResponse>}
	 */
	function moveByUnifiedLink(uniqueCode, targetFolderId)
	{
		return runUnifiedLinkAction(
			'disk.api.UnifiedLinkActions.move',
			uniqueCode,
			{ targetFolderId },
		);
	}

	/**
	 * @param {string} uniqueCode
	 * @param {number} targetFolderId
	 * @return {Promise<UnifiedLinkObjectResponse>}
	 */
	function copyToByUnifiedLink(uniqueCode, targetFolderId)
	{
		return runUnifiedLinkAction(
			'disk.api.UnifiedLinkActions.copyTo',
			uniqueCode,
			{ targetFolderId },
		);
	}

	const CREATE_FILE_BY_CONTENT_ACTION = 'disk.api.UnifiedLinkActions.createFileByContent';

	const OBJECT_ADDRESSING_PARAMS = new Set(['action', 'folderId', 'id', 'uniqueCode']);

	const decodeParam = (value) => {
		try
		{
			return decodeURIComponent(value.replaceAll('+', ' '));
		}
		catch
		{
			return value;
		}
	};

	const encodeParams = (params) => params
		.map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
		.join('&')
	;

	const buildUnifiedLinkCommitUrl = (url, uniqueCode) => {
		const [path, query = ''] = url.split('?');

		const params = query
			.split('&')
			.filter(Boolean)
			.map((pair) => {
				const separatorIndex = pair.indexOf('=');

				return separatorIndex === -1
					? [decodeParam(pair), '']
					: [decodeParam(pair.slice(0, separatorIndex)), decodeParam(pair.slice(separatorIndex + 1))];
			})
			.filter(([name]) => !OBJECT_ADDRESSING_PARAMS.has(name));

		params.unshift(['action', CREATE_FILE_BY_CONTENT_ACTION]);
		params.push(['uniqueCode', uniqueCode]);

		return `${path}?${encodeParams(params)}`;
	};

	/**
	 * @param {string} uniqueCode
	 * @param {UnifiedLinkCommitConfig} commitConfig
	 * @return {Promise<UnifiedLinkFileResponse>}
	 */
	function createFileByContentByUnifiedLink(uniqueCode, commitConfig)
	{
		if (!Type.isStringFilled(uniqueCode))
		{
			return Promise.reject(new Error('uniqueCode is required'));
		}

		if (!Type.isStringFilled(commitConfig?.url))
		{
			return Promise.reject(new Error('commitConfig url is required'));
		}

		return BX.ajax({
			...commitConfig,
			url: buildUnifiedLinkCommitUrl(commitConfig.url, uniqueCode),
		});
	}

	/**
	 * @param {string} uniqueCode
	 * @param {string} name
	 * @param {boolean} [generateUniqueName]
	 * @return {Promise<UnifiedLinkObjectResponse>}
	 */
	function addSubFolderByUnifiedLink(uniqueCode, name, generateUniqueName = false)
	{
		if (!Type.isStringFilled(name?.trim()))
		{
			return Promise.reject(new Error('name is required'));
		}

		return runUnifiedLinkAction(
			'disk.api.UnifiedLinkActions.addSubFolder',
			uniqueCode,
			{ name, generateUniqueName },
		);
	}

	module.exports = {
		getUnifiedLinkData,
		getUnifiedLinkDataWithRights,
		validateUnifiedLinkPassword,
		renameByUnifiedLink,
		markDeletedByUnifiedLink,
		moveByUnifiedLink,
		copyToByUnifiedLink,
		addSubFolderByUnifiedLink,
		createFileByContentByUnifiedLink,
	};
});
