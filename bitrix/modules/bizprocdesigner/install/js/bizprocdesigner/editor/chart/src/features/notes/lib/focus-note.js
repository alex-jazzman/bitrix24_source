/**
 * TPL-02. The link of a notification opens the editor page with a note of its own: the schema is
 * loaded as usual, the camera is brought over that note and its thread is opened.
 *
 * The note may have been completed by the time the link is followed. That is a normal end of the
 * step and not a failure of it: the template opens the way it always does, and the person is told
 * the discussion is gone (ERR-009).
 *
 * The means of the canvas come in as parameters. The composables that carry them only work inside
 * the setup() of a component of the same application, so the component reads them and hands them
 * over - a module of its own asking for them would get nothing.
 */

import { resolveMarkerPosition, type NotePoint, type NotesSchema, type TemplateNote } from '../../../entities/notes';

/** The drawn area of the canvas and the camera over it, as the editor reads them. */
export type NoteFocusViewport = {
	zoom: number,
	width: number,
	height: number,
	left: number,
	top: number,
};

/** What the editor lends for the step: the canvas, the store of the notes and the way to speak. */
export type NoteFocusMeans = {
	viewport: NoteFocusViewport,
	setCamera: (point: NotePoint) => void,
	openThread: (noteId: number) => Promise<void>,
	notifyUnavailable: () => void,
};

function isMeasured(viewport: NoteFocusViewport | null): boolean
{
	return Number.isFinite(viewport?.zoom)
		&& viewport.zoom > 0
		&& viewport.width > 0
		&& viewport.height > 0
	;
}

/**
 * The point the camera has to stand at for `target` to end up in the middle of the drawn area. The
 * canvas counts its own travels the same way, so a note lands where a node found by the search does.
 */
function cameraFor(target: NotePoint, viewport: NoteFocusViewport): NotePoint
{
	return {
		x: target.x - (viewport.width / 2 / viewport.zoom) - (viewport.left / viewport.zoom),
		y: target.y - (viewport.height / 2 / viewport.zoom) - (viewport.top / viewport.zoom),
	};
}

/**
 * Brings the editor to the note the link asked for.
 *
 * The camera is moved before the thread is opened: the thread is pinned to the marker of its note
 * and gives itself up when that marker is out of the drawn area, so an opening ahead of the travel
 * would close itself at once.
 *
 * A canvas that has not measured itself yet leaves the camera where it is - there is no screen to
 * count the travel over - and the thread is opened all the same: a link that leads nowhere would be
 * worse than a discussion opened without the travel.
 *
 * @return boolean whether the note the link asked for is still there
 */
export async function focusNote(
	noteId: number,
	notes: TemplateNote[],
	schema: NotesSchema,
	means: NoteFocusMeans,
): Promise<boolean>
{
	const note = notes.find((item: TemplateNote) => item.id === noteId) ?? null;

	if (note === null)
	{
		means.notifyUnavailable();

		return false;
	}

	if (isMeasured(means.viewport))
	{
		means.setCamera(cameraFor(resolveMarkerPosition(note, schema), means.viewport));
	}

	try
	{
		await means.openThread(noteId);
	}
	catch
	{
		// The conversation could not be read. The editor is open and workable either way, and the
		// refusal itself is named by whoever made the request.
	}

	return true;
}
