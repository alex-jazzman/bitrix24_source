import { LiveAnnouncer } from 'ui.a11y';

export type AnnounceOptions = {
	assertive?: boolean,
	inTopWindow?: boolean,
};

type AnnouncerHostWindow = Window & {
	BX?: { UI?: { Accessibility?: { LiveAnnouncer?: typeof LiveAnnouncer } } },
};

export function announce(message: string, options: AnnounceOptions = {}): void
{
	const announcer = options.inTopWindow === true ? resolveTopAnnouncer() : LiveAnnouncer;

	announcer.announce(message, options.assertive === true ? 'assertive' : 'polite');
}

function resolveTopAnnouncer(): typeof LiveAnnouncer
{
	// a message about a closing slider has to outlive its own document, so it is spoken
	// from the live region of the top window
	try
	{
		const topWindow = window.top as AnnouncerHostWindow | null;

		return topWindow?.BX?.UI?.Accessibility?.LiveAnnouncer ?? LiveAnnouncer;
	}
	catch
	{
		return LiveAnnouncer;
	}
}
