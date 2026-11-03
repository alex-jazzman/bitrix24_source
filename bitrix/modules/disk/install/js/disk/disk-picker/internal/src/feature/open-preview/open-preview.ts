import { PageSize } from '../../const/picker';
import { getViewerAttributes } from '../../infrastructure/service/file-picker/file-picker';
import {
	type ViewerAttributesEntry,
	type ViewerAttributesRequest,
	type ViewerAttributesResult,
} from '../../infrastructure/service/file-picker/types';
import { type ViewerAdapter } from '../../infrastructure/service/viewer/types';
import { viewerAdapter } from '../../infrastructure/service/viewer/viewer';
import { useItemStore } from '../../model/item/item';
import { type PickerItem } from '../../model/item/types';
import { useSessionStore } from '../../model/session/session';
import { useViewerStore } from '../../model/viewer/viewer';

export const PREVIEW_UNAVAILABLE_MESSAGE = 'DISK_PICKER_NOTIFY_PREVIEW_UNAVAILABLE';

export type ViewerAttributesService = {
	getViewerAttributes: (request: ViewerAttributesRequest) => Promise<ViewerAttributesResult>,
};

export type OpenPreviewDeps = {
	notify: (messageCode: string, replacements?: { [key: string]: string }) => void,
	service: ViewerAttributesService,
	viewer: ViewerAdapter,
	// The picker window node: the subtree held out of reach while the viewer is shown,
	// and the focus target of last resort when the initiator the preview was started
	// from is gone by the time the viewer closes.
	windowContainer: HTMLElement | null,
};

// One shown preview. Kept out of the store because none of it is state the UI
// renders: it exists so the close subscription is dropped exactly once, whether
// the viewer closes or the whole window does.
type PreviewSession = {
	initiator: HTMLElement | null,
	windowContainer: HTMLElement | null,
	unsubscribe: () => void,
	// Told when the viewer covers the window and when it is gone, so the host keeps the
	// window open for the clicks the overlay takes.
	setShown: (shown: boolean) => void,
	shown: boolean,
};

let activeSession: PreviewSession | null = null;

// The viewer shows itself outside the picker window and declares no modal semantics of its
// own, so Tab would walk out of the overlay and into the window behind it. The window is put
// out of reach for the length of the session instead; it is given back before the focus is,
// because focus() on an inert subtree does nothing.
function setWindowInert(container: HTMLElement | null, inert: boolean): void
{
	if (container === null)
	{
		return;
	}

	if (inert)
	{
		container.setAttribute('inert', '');

		return;
	}

	container.removeAttribute('inert');
}

// The component layer must not reach infrastructure (dependency matrix), so the
// real service and viewer adapter are bound here.
export function createOpenPreviewDeps(
	notify: (messageCode: string, replacements?: { [key: string]: string }) => void,
	windowContainer: HTMLElement | null,
): OpenPreviewDeps
{
	return {
		notify,
		windowContainer,
		service: { getViewerAttributes },
		viewer: viewerAdapter,
	};
}

function detachSession(): PreviewSession | null
{
	const session = activeSession;
	if (session === null)
	{
		return null;
	}

	activeSession = null;
	if (session.shown)
	{
		session.shown = false;
		session.setShown(false);
	}
	setWindowInert(session.windowContainer, false);
	session.unsubscribe();

	return session;
}

// Called when the picker window goes away while a preview is still shown: a close
// event arriving later must not reach a disposed store.
export function releasePreviewLayer(): void
{
	detachSession();
}

function returnFocus(session: PreviewSession): void
{
	const initiator = session.initiator;
	const target = initiator !== null && initiator.isConnected ? initiator : session.windowContainer;

	try
	{
		target?.focus();
	}
	catch
	{
		// A detached or non-focusable target is not fatal.
	}
}

function endPreview(): void
{
	const session = detachSession();
	if (session === null)
	{
		return;
	}

	returnFocus(session);
	useViewerStore().reset();
}

// Nothing is shown. A session already registered by the time the failure happened is
// dropped with the focus given back to its initiator, and the store is reset either way.
function failPreview(deps: OpenPreviewDeps): void
{
	endPreview();
	deps.notify(PREVIEW_UNAVAILABLE_MESSAGE);
	useViewerStore().reset();
}

// The feed grows page by page past the hundred object ids the attributes action
// accepts, so the set is a window of that size around the initiator instead of the
// head of the feed: the initiator is always inside it and the arrows walk its
// neighbours on both sides, as far as the feed edges allow.
function windowAroundInitiator(candidates: PickerItem[], initiatorIndex: number): PickerItem[]
{
	if (candidates.length <= PageSize.Max)
	{
		return candidates;
	}

	const before = Math.floor((PageSize.Max - 1) / 2);
	const lastStart = candidates.length - PageSize.Max;
	const start = Math.min(Math.max(initiatorIndex - before, 0), lastStart);

	return candidates.slice(start, start + PageSize.Max);
}

// Whether a preview would start right now. The caller asks before it undoes what the
// click of the user did: a double click that opens nothing has to leave the set alone.
export function canOpenPreview(item: PickerItem): boolean
{
	return item.previewable
		&& !item.isFolder
		&& !useViewerStore().isBusy
		&& !useSessionStore().confirming;
}

// ALG-01. The set is the previewable files of the feed in feed order around the
// initiator, asked for in one batch while ui.viewer loads in parallel. The attributes
// action is the only source of truth: a file the optimistic `previewable` flag
// promised but the action did not return is a plain notification, not an open viewer.
// Separate items (the unified link) open on their own in a browser tab and stay out
// of the arrow set.
export async function openPreview(
	item: PickerItem,
	initiator: HTMLElement | null,
	deps: OpenPreviewDeps,
): Promise<void>
{
	const viewer = useViewerStore();
	const session = useSessionStore();
	if (!canOpenPreview(item))
	{
		return;
	}

	viewer.startOpening(item.objectId);
	// The list the set is taken from: walking onto another disk, searching or filtering
	// replaces it, and a set of files that are no longer on screen is not what a preview
	// started here may show.
	const revision = session.feedRevision;
	const feed = useItemStore().items.filter((entry) => !entry.isFolder && entry.previewable);
	const candidates = windowAroundInitiator(
		feed,
		feed.findIndex((entry) => entry.objectId === item.objectId),
	);

	let result: ViewerAttributesResult;
	try
	{
		[result] = await Promise.all([
			deps.service.getViewerAttributes({
				objectIds: candidates.map((entry) => entry.objectId),
				signedConfig: session.constraints.signedConfig,
			}),
			deps.viewer.ensureLoaded(),
		]);
	}
	catch
	{
		failPreview(deps);

		return;
	}

	// The window may have closed while the attributes were loading, and the user may have
	// walked away from the list the set was taken from. Neither is a failure of the
	// action, so nothing is said about either.
	if (!session.isSessionActive() || session.feedRevision !== revision)
	{
		viewer.reset();

		return;
	}

	const entryById = new Map<number, ViewerAttributesEntry>(
		result.items.map((entry) => [entry.objectId, entry]),
	);
	if (!entryById.has(item.objectId))
	{
		failPreview(deps);

		return;
	}

	const shown = candidates.filter((entry) => entryById.has(entry.objectId));

	// Building the nodes belongs here and not before the try: a server attribute the DOM
	// refuses throws, and a throw outside would leave the store busy for good.
	try
	{
		const nodes = shown.map(
			(entry) => deps.viewer.buildNode(entryById.get(entry.objectId) as ViewerAttributesEntry, entry.name),
		);
		const initiatorNode = nodes[shown.findIndex((entry) => entry.objectId === item.objectId)];

		const previewSession: PreviewSession = {
			initiator,
			windowContainer: deps.windowContainer,
			unsubscribe: deps.viewer.onClose(endPreview),
			setShown: session.callbacks.setPreviewShown,
			shown: false,
		};
		activeSession = previewSession;

		if (deps.viewer.isSeparate(initiatorNode))
		{
			// A unified link opens a browser tab: nothing is shown here and no close event
			// will ever arrive, so the session ends as soon as the tab is asked for. A tab
			// the browser refused comes back later and is all that is left to say then.
			await deps.viewer.openSeparate(
				initiatorNode,
				() => deps.notify(PREVIEW_UNAVAILABLE_MESSAGE),
			);
			endPreview();

			return;
		}

		const embedded = nodes.filter((node) => !deps.viewer.isSeparate(node));
		const show = await deps.viewer.prepare(embedded);

		// Nothing has been shown yet, so the window stayed usable while the viewer was loading:
		// its Escape still closed it, and its list still answered a click on another disk, a
		// folder, the search or the filter. A wait abandoned or outlived that way ends here and
		// leaves neither the window out of reach nor the store holding a session. The focus is
		// left where the user put it meanwhile - the search, the sidebar - and not dragged back
		// to the row the wait started from.
		if (activeSession !== previewSession || !session.isSessionActive() || session.feedRevision !== revision)
		{
			detachSession();
			viewer.reset();

			return;
		}

		// Out of reach and marked shown only now: the overlay appears with this very call.
		setWindowInert(deps.windowContainer, true);
		previewSession.shown = true;
		previewSession.setShown(true);
		viewer.markOpen();
		show(embedded.indexOf(initiatorNode));
	}
	catch
	{
		failPreview(deps);
	}
}
