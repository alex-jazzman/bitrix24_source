import { Dom, Event, Type } from 'main.core';

type NavigationWindow = EventTarget & Pick<Window, 'document'> & {
	location: Pick<Location, 'origin' | 'pathname' | 'assign'>,
};

const boundMarker = Symbol.for('crm.config.bp.settingsHubNavigation');

export function bindSettingsHubNavigation(targetWindow: NavigationWindow = window): void
{
	const currentDocument = targetWindow.document as Document & { [boundMarker]?: boolean };
	if (currentDocument[boundMarker])
	{
		return;
	}

	Event.bind(targetWindow, 'click', (event: MouseEvent): void => {
		const target = event.target as Element;
		if (event.defaultPrevented || event.button !== 0 || !Type.isElementNode(target))
		{
			return;
		}

		const anchor = target.closest<HTMLAnchorElement>('a[href]');
		const cancelButton = target.closest('button#ui-button-panel-cancel');
		const container = (cancelButton ?? anchor)?.closest('[data-crm-bp-hub-navigation]');
		if (!container)
		{
			return;
		}

		const destination = cancelButton
			? Dom.create('a', {
				attrs: { href: container.getAttribute('data-crm-bp-hub-list-url') ?? '' },
			}, currentDocument) as HTMLAnchorElement
			: anchor;
		if (!destination || destination.hasAttribute('download'))
		{
			return;
		}

		const href = (destination.getAttribute('href') ?? '').trim();
		if (
			href === ''
			|| href.startsWith('#')
			|| !['http:', 'https:'].includes(destination.protocol)
			|| destination.origin !== targetWindow.location.origin
			|| destination.pathname !== targetWindow.location.pathname
		)
		{
			return;
		}

		event.stopPropagation();
		const linkTarget = destination.target.toLowerCase();
		if (
			!cancelButton
			&& (
				event.ctrlKey || event.metaKey || event.shiftKey || event.altKey
				|| (linkTarget !== '' && linkTarget !== '_self')
			)
		)
		{
			return;
		}

		event.preventDefault();
		targetWindow.location.assign(destination.href);
	}, true);

	currentDocument[boundMarker] = true;
}

bindSettingsHubNavigation();
