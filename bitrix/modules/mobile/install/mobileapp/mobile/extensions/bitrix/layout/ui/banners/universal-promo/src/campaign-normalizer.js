/**
 * @module layout/ui/banners/universal-promo/src/campaign-normalizer
 */
jn.define('layout/ui/banners/universal-promo/src/campaign-normalizer', (require, exports, module) => {
	const { Type } = require('type');
	const { URL } = require('utils/url');

	const PORTAL_TYPES = Object.freeze(['cloud', 'box']);
	const AGE_SEGMENT = '61_plus';

	const normalizeString = (value) => {
		if (!Type.isString(value))
		{
			return null;
		}

		const normalizedValue = value.trim();

		return Type.isStringFilled(normalizedValue) ? normalizedValue : null;
	};

	const isValidHostname = (hostname) => {
		if (!Type.isStringFilled(hostname) || hostname.length > 253)
		{
			return false;
		}

		return hostname.split('.').every((label) => (
			label.length <= 63
			&& /^[\da-z](?:[\da-z-]*[\da-z])?$/i.test(label)
		));
	};

	const TARGET_PROTOCOLS = ['http:', 'https:'];

	const normalizeUrl = (value, allowedProtocols) => {
		const normalizedValue = normalizeString(value);
		if (normalizedValue === null || !/^https?:\/\//i.test(normalizedValue) || /\s/.test(normalizedValue))
		{
			return null;
		}

		const authority = normalizedValue.match(/^https?:\/\/([^#/?]*)/i)?.[1];
		if (!Type.isStringFilled(authority) || authority.includes('@'))
		{
			return null;
		}

		try
		{
			const parsedUrl = URL(normalizedValue);
			const protocol = parsedUrl?.protocol?.toLowerCase();

			if (
				!allowedProtocols.includes(protocol)
				|| parsedUrl?.host?.toLowerCase() !== authority.toLowerCase()
				|| !isValidHostname(parsedUrl?.hostname)
			)
			{
				return null;
			}
		}
		catch
		{
			return null;
		}

		return normalizedValue;
	};

	const normalizeAnalytics = (analytics) => {
		if (!Type.isPlainObject(analytics))
		{
			return null;
		}

		const region = normalizeString(analytics.region);
		const portalType = normalizeString(analytics.portalType);
		const ageSegment = normalizeString(analytics.ageSegment);
		const targetScenario = normalizeString(analytics.targetScenario);

		if (
			region === null
			|| !PORTAL_TYPES.includes(portalType)
			|| ageSegment !== AGE_SEGMENT
			|| targetScenario === null
		)
		{
			return null;
		}

		return {
			region,
			portalType,
			ageSegment,
			targetScenario,
		};
	};

	const normalizeCampaign = (campaign) => {
		if (!Type.isPlainObject(campaign))
		{
			return null;
		}

		const id = normalizeString(campaign.id);
		const imageUrl = normalizeUrl(campaign.imageUrl, ['https:']);
		const accessibilityDescription = normalizeString(campaign.accessibilityDescription);
		const targetUrl = normalizeUrl(campaign.targetUrl, TARGET_PROTOCOLS);
		const analytics = normalizeAnalytics(campaign.analytics);

		if (
			id === null
			|| imageUrl === null
			|| accessibilityDescription === null
			|| targetUrl === null
			|| analytics === null
		)
		{
			return null;
		}

		return {
			id,
			imageUrl,
			accessibilityDescription,
			targetUrl,
			analytics,
		};
	};

	const normalizeTargetUrl = (value) => normalizeUrl(value, TARGET_PROTOCOLS);

	module.exports = { normalizeCampaign, normalizeTargetUrl };
});
