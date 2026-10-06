/**
 * @module market/utils
 */
jn.define('market/utils', (require, exports, module) => {
	const { withCurrentDomain } = require('utils/url');

	const INSTALLED_FILTER_UPDATES = 'updates';
	const MARKET_LIST_TYPE = Object.freeze({
		CATEGORY: 'category',
		INSTALLED: 'installed',
	});

	function normalizeString(value = '', fallback = '')
	{
		const normalizedValue = String(value ?? '').trim();

		return (normalizedValue || fallback);
	}

	function normalizeNonNegativeInt(value, fallback = 0)
	{
		const normalizedValue = parseInt(value, 10);

		return (Number.isNaN(normalizedValue) || normalizedValue < 0 ? fallback : normalizedValue);
	}

	function resolveProtocolPrefix()
	{
		const currentDomainUrl = String(withCurrentDomain('/'));
		const [protocol = 'https:'] = currentDomainUrl.split('//');

		return (protocol.endsWith(':') ? protocol : `${protocol}:`);
	}

	function normalizeImageUrl(uri = '')
	{
		const normalizedUri = normalizeString(uri, '');

		if (!normalizedUri)
		{
			return '';
		}

		if (normalizedUri.startsWith('//'))
		{
			return encodeURI(`${resolveProtocolPrefix()}${normalizedUri}`);
		}

		return encodeURI(withCurrentDomain(normalizedUri));
	}

	function normalizeOpenUrl(url = '')
	{
		const normalizedUrl = normalizeString(url, '');

		if (!normalizedUrl)
		{
			return '';
		}

		if (/^https?:\/\//i.test(normalizedUrl))
		{
			return normalizedUrl;
		}

		return withCurrentDomain(normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`);
	}

	function resolveTestIdPrefix(testId = '', entityId = '', prefix = '', emptyPrefix = prefix)
	{
		const normalizedTestId = normalizeString(testId, '');
		const normalizedEntityId = normalizeString(entityId, '');

		if (!normalizedTestId)
		{
			return (normalizedEntityId ? `${prefix}-${normalizedEntityId}` : emptyPrefix);
		}

		if (!normalizedEntityId || normalizedTestId.endsWith(normalizedEntityId))
		{
			return normalizedTestId;
		}

		return `${normalizedTestId}-${normalizedEntityId}`;
	}

	function normalizeHexColor(value = '', fallback = '')
	{
		const normalizedValue = normalizeString(value, '');

		return (normalizedValue.startsWith('#') ? normalizedValue : fallback);
	}

	function normalizeDeveloperTag(value = '')
	{
		const normalizedValue = normalizeString(value, '');

		return (normalizedValue === '__all__' ? '' : normalizedValue);
	}

	function normalizeInstalledFilter(value = '')
	{
		return (normalizeString(value, '') === INSTALLED_FILTER_UPDATES ? INSTALLED_FILTER_UPDATES : '');
	}

	function resolveListType(value = '')
	{
		return (normalizeString(value, '') === MARKET_LIST_TYPE.INSTALLED
			? MARKET_LIST_TYPE.INSTALLED
			: MARKET_LIST_TYPE.CATEGORY
		);
	}

	function getEntityImageUrl(entity = {})
	{
		return (
			entity?.imageUrl
			?? entity?.avatar
			?? entity?.customData?.imageUrl
			?? ''
		);
	}

	function normalizeEntityId(id)
	{
		const normalizedId = normalizeString(id, '');

		if (!normalizedId)
		{
			return '';
		}

		const userIdMatch = normalizedId.match(/^user\/(\d+)$/i);

		return userIdMatch ? userIdMatch[1] : normalizedId;
	}

	function normalizeSelectedUser(user = {})
	{
		const id = normalizeEntityId(user?.id);

		if (!id)
		{
			return null;
		}

		const title = String(
			user?.title
				?? user?.name
				?? user?.customData?.title
				?? '',
		).trim();
		const subtitle = String(
			user?.subtitle
				?? user?.position
				?? user?.customData?.position
				?? '',
		).trim();

		return {
			id,
			title: title || id,
			subtitle,
			imageUrl: normalizeImageUrl(getEntityImageUrl(user)),
		};
	}

	function getActionErrors(response = {})
	{
		return Array.isArray(response?.errors) ? response.errors : [];
	}

	function hasActionErrors(response = {})
	{
		return getActionErrors(response).length > 0;
	}

	function resolveActionErrorMessage(response = {}, fallback = '')
	{
		const errors = getActionErrors(response);
		if (errors.length > 0)
		{
			const errorMessage = normalizeString(errors[0]?.message, '');
			if (errorMessage)
			{
				return errorMessage;
			}
		}

		return fallback;
	}

	module.exports = {
		INSTALLED_FILTER_UPDATES,
		MARKET_LIST_TYPE,
		getActionErrors,
		getEntityImageUrl,
		hasActionErrors,
		normalizeDeveloperTag,
		normalizeEntityId,
		normalizeHexColor,
		normalizeImageUrl,
		normalizeInstalledFilter,
		normalizeNonNegativeInt,
		normalizeOpenUrl,
		normalizeSelectedUser,
		normalizeString,
		resolveActionErrorMessage,
		resolveListType,
		resolveProtocolPrefix,
		resolveTestIdPrefix,
	};
});
