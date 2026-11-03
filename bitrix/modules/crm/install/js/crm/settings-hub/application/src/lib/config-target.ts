export type ConfigTarget =
	| Readonly<{ type: 'url', href: string }>
	| Readonly<{ type: 'helper', id: string }>
	| Readonly<{ type: 'unavailable' }>;

type InfoHelperApi = {
	show: (id: string) => void,
};

type TopWindow = Window & {
	BX?: {
		UI?: {
			InfoHelper?: InfoHelperApi,
		},
	},
};

export function isConfigTargetFollowable(target: ConfigTarget): boolean
{
	if (target.type === 'helper')
	{
		return target.id.trim() !== '';
	}

	return target.type === 'url' && normalizeSafeUrl(target.href) !== null;
}

export function activateConfigTarget(target: ConfigTarget): boolean
{
	if (target.type === 'url')
	{
		const href = normalizeSafeUrl(target.href);
		if (href === null)
		{
			return false;
		}

		window.location.href = href;

		return true;
	}

	if (target.type === 'helper' && target.id.trim() !== '')
	{
		const infoHelper = (window.top as TopWindow | null)?.BX?.UI?.InfoHelper;
		if (infoHelper?.show)
		{
			infoHelper.show(target.id);

			return true;
		}
	}

	return false;
}

export function normalizeSafeUrl(value: string): string | null
{
	const href = value.trim();
	if (href === '' || href.startsWith('//') || href.startsWith('\\') || /\p{Cc}/u.test(href))
	{
		return null;
	}

	if (/^https?:\/\//i.test(href))
	{
		return href;
	}

	if (/^[a-z][\d+.a-z-]*:/i.test(href))
	{
		return null;
	}

	return href;
}
