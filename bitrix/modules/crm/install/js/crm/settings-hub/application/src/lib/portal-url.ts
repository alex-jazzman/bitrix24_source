import { Loc } from 'main.core';

export function buildPortalUrl(path: string, siteDir: string = Loc.getMessage('SITE_DIR') ?? '/'): string
{
	const normalizedSiteDir = siteDir.trim().replaceAll(/^\/+|\/+$/g, '');
	const normalizedPath = path.trim().replace(/^\/+/, '');
	const siteDirPrefix = normalizedSiteDir === '' ? '' : `${normalizedSiteDir}/`;

	return `/${siteDirPrefix}${normalizedPath}`;
}
