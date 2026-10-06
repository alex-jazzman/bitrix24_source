import { type InsertedLink } from './link-inserter';

// Pure detection core for the post-send scenario (SC-004), kept free of UI imports so it can be
// unit-tested without DOM or the message-box extension.

// A link is present when the sent body contains its public url. The href is stored HTML-encoded
// (Text.encode), so an ampersand in the url becomes &amp; in the editor content.
export function isLinkPresentInBody(body: string, publicUrl: string): boolean
{
	if (publicUrl.length === 0)
	{
		return true;
	}

	if (body.includes(publicUrl))
	{
		return true;
	}

	return body.includes(publicUrl.replaceAll('&', '&amp;'));
}

// Links the user removed from the letter before sending: inserted, but absent from the sent body.
export function findOrphanedLinks(body: string, inserted: InsertedLink[]): InsertedLink[]
{
	return inserted.filter((link: InsertedLink): boolean => !isLinkPresentInBody(body, link.publicUrl));
}
