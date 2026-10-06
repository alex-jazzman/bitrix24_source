/**
 * Keeps the focus alive when the application destroys a part of the right panel on its own
 * initiative: the agent-driven series replaces the content of the settings panel and removes the
 * data block section without the user asking for it, and a focus left inside such a subtree lands
 * on <body>.
 *
 * The panels register the containers involved, so the destroying code does not reach into the DOM
 * itself and the containers stay owned by the components that render them.
 */

const anchors = new Map();

export const FocusAnchor = Object.freeze({
	// Section of the right panel: survives the settings content being replaced.
	settingsPanel: 'settingsPanel',
	// Header of the settings panel: the receiver whenever it outlives the destruction, which it does
	// when the data block section is removed. A replacement of the settings content takes the header
	// down together with the rest of it, and then the section of the panel is the receiver left.
	settingsHeader: 'settingsHeader',
	// Section of the data block, removed for the whole length of a series.
	dataInspectorPanel: 'dataInspectorPanel',
});

// Receivers of a rescued focus, best first: the header is named after the node the panel is about,
// the section of the panel only after the panel. Only the ones outliving the destruction are used.
const FOCUS_RECEIVERS = [FocusAnchor.settingsHeader, FocusAnchor.settingsPanel];

export function setFocusAnchor(key: string, element: ?HTMLElement): void
{
	if (element)
	{
		anchors.set(key, element);

		return;
	}

	anchors.delete(key);
}

// By identity: two panels share the header anchor, and the one being unmounted must not drop the
// registration of the one that has just replaced it.
export function clearFocusAnchor(key: string, element: HTMLElement): void
{
	if (anchors.get(key) === element)
	{
		anchors.delete(key);
	}
}

// The registered container outlives a replacement of its own content, so it may take the focus
// itself. Anything strictly inside the doomed subtree goes away with it and would lose the focus
// again the moment that happens.
function outlivesDestruction(element: ?HTMLElement, doomed: HTMLElement): boolean
{
	return Boolean(element) && (element === doomed || !doomed.contains(element));
}

/**
 * Moves the focus out of a subtree about to be destroyed, and only from there: taking the focus
 * away from a user working elsewhere on the page is never right.
 *
 * `doomedKey` names the registered container the destruction starts from, and the receiver is the
 * first one that outlives it. The header of the panel wins whenever it does — that is the removal
 * of the data block; the section of the panel itself receives the focus when the destruction is a
 * replacement of its content, header included.
 */
export function rescueFocus(doomedKey: string): boolean
{
	const doomed = anchors.get(doomedKey);
	const active = document.activeElement;

	if (!doomed || !active || active === doomed || !doomed.contains(active))
	{
		return false;
	}

	const receiver = FOCUS_RECEIVERS
		.map((key: string): ?HTMLElement => anchors.get(key))
		.find((element: ?HTMLElement): boolean => outlivesDestruction(element, doomed));

	if (!receiver)
	{
		return false;
	}

	receiver.focus({ preventScroll: true });

	return true;
}
