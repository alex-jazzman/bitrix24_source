import { Type } from 'main.core';

// An allowlist of a path inside the portal or an address of this very origin - the policy
// `Page.redirect` holds the buttons of these windows to - and not a list of banned schemes, which
// obfuscation works around. It lives here so that the blocks and the windows built around them
// share one policy.
export function safeLink(link: string): string
{
	if (!Type.isStringFilled(link) || !/^(?:\/(?![/\\])|https?:\/\/)/i.test(link))
	{
		return '';
	}

	try
	{
		return new URL(link, location.href).origin === location.origin ? link : '';
	}
	catch
	{
		return '';
	}
}
