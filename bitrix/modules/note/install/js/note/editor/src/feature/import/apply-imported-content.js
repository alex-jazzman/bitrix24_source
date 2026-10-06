import { yUndoPluginKey } from '@tiptap/y-tiptap';
import { readMarkdownFile } from './import-md-service';
import { safeParseMarkdown } from '../../utils/safe-parse-markdown';

// Reads, parses and applies a `.md` file as the single, entire content of the editor.
// Callers (create-document-feature.js) are responsible for permission/mode gating and
// for resolving the currently mounted editor instance.
export async function applyImportedContent(
	editor: Object,
	file: File,
): Promise<{ degraded: boolean, droppedCount: number }>
{
	const text = await readMarkdownFile(file);
	const { doc, degraded, droppedCount } = safeParseMarkdown(editor, text);

	// Under an active Yjs provider, yUndoPlugin already owns an UndoManager (see
	// @tiptap/extension-collaboration). Closing its current capture boundary keeps the
	// replacement as one isolated undo step instead of merging with prior edits.
	// Without a provider this is undefined — the native UndoRedo extension handles undo instead.
	const undoManager = yUndoPluginKey.getState(editor.state)?.undoManager ?? null;
	if (undoManager)
	{
		undoManager.stopCapturing();
	}

	editor.commands.setContent(doc);

	// setContent stamps a fresh change time on the Yjs undo item, so without closing the capture
	// boundary again a keystroke within the default 500 ms captureTimeout would merge into the import
	// step and get rolled back together with it. Close it so the next edit is its own undo step.
	if (undoManager)
	{
		undoManager.stopCapturing();
	}

	return { degraded, droppedCount };
}
