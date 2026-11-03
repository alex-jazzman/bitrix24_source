// @flow

import { Loc } from 'main.core';
import { resolveFileNodes } from '../../utils/resolve-file-nodes';
import { DiskAttachmentStore } from '../../services/disk-attachment-store';
import { resolveDiskAttachmentNodes } from '../../utils/resolve-disk-attachment-nodes';
import {
	collectMentions,
	createMentionSnapshot,
	MENTION_BATCH_LIMIT,
	resolveMentionsBatch,
} from '../../utils/resolve-mentions';
import { normalizeDateString } from '../../extensions/date/note-date-parser';
import { formatDateCaption } from '../../extensions/date/note-date-node';

const MENTION_NODE_TYPE = 'noteMention';
const DATE_NODE_TYPE = 'noteDate';
const MENTION_EXPORT_CONCURRENCY = 3;

const ASSET_NODE_TYPES: Set<string> = new Set(['imageAttachment', 'fileAttachment', 'video']);

// Maps the ProseMirror node type name to the wire assetType used in the [[type fileId=N]] token.
const ASSET_NODE_TYPE_TO_ASSET_TYPE: { [string]: string } = {
	imageAttachment: 'image',
	fileAttachment: 'file',
	video: 'video',
};

// Mirrors MENTION_TOKEN_RE from note-mention-node.js (`/^@\{([a-z]+):(\d+)\}/`), but global and
// unanchored so a `.replace()` over the whole markdown string catches every occurrence, not just
// one match at the string start.
const MENTION_TOKEN_RE: RegExp = /@\{([a-z]+):(\d+)\}/g;

// Mirrors the token core matched by NOTE_ASSET_RE in note-asset-parser.js (type/fileId/attrs).
// The block-level indentation and trailing-newline capture from that regex are dropped here:
// a global replace only needs to swap the token substring itself, leaving surrounding
// whitespace/newlines in the source markdown untouched.
const ASSET_TOKEN_RE: RegExp = /\[\[(image|file|video) fileId=(\d+)(?:[ \t]+[a-z]+=[^\s\]]+)*\]\]/g;

// Same, for attachments living on Disk. They always export as a link, never as an archived file:
// the file belongs to Disk, and packing its bytes would hand it to whoever opens the archive.
const DISK_ASSET_TOKEN_RE: RegExp = /\[\[disk (image|file|video) objectId=(\d+)(?:[ \t]+[a-z]+=[^\s\]]+)*\]\]/g;

// Mirrors DATE_TOKEN_PATTERN from note-date-parser.js, but global so a `.replace()` over the whole
// markdown string catches every occurrence, not just one match at the string start.
const DATE_TOKEN_RE: RegExp = /\[\[date (\d{4}-\d{2}-\d{2})]]/g;

// Normative source for the zip entry naming contract: DocumentZipExportService::sanitizeFileName
// (PHP) MUST fold identically. The client writes `attachments/{fileId}-{name}` links into the .md
// and the server names the archived file the same way — they only resolve if both produce a
// byte-identical string. We fold every character outside printable ASCII (0x20-0x7E) plus the
// forbidden punctuation class to '_': CZip stores entry names as CP866 without the ZIP UTF-8 flag
// (main zip.php:1164), so a non-ASCII name is mojibake in external extractors and characters
// outside CP866 (é, emoji, CJK) become '?', breaking the link even on Windows. The unicode flag
// folds an astral character (emoji) to a single '_' so it matches the PHP /u pattern.
const FORBIDDEN_NAME_CHARS_RE: RegExp = /[^\x20-\x7E]|[\\/:*?"'<>|~#&;]/gu;

// Cap the entry base name so `{fileId}-{name}` stays under the filesystem's 255-byte per-component
// limit. Mirrored by the server; after the fold the name is pure ASCII, so length == bytes and
// slicing is byte-exact on both sides.
const MAX_ENTRY_BASE_NAME: number = 100;

function capEntryBaseName(name: string): string
{
	if (name.length <= MAX_ENTRY_BASE_NAME)
	{
		return name;
	}

	const dot = name.lastIndexOf('.');
	if (dot > 0 && name.length - dot <= 16)
	{
		const ext = name.slice(dot);
		const keep = MAX_ENTRY_BASE_NAME - ext.length;

		return keep > 0 ? name.slice(0, keep) + ext : name.slice(0, MAX_ENTRY_BASE_NAME);
	}

	return name.slice(0, MAX_ENTRY_BASE_NAME);
}

/**
 * Forces resolution of unresolved mention/file nodes before export.
 *
 * Mention presentation is session-local and never written to the ProseMirror node. Export uses
 * the current projection and resolves only keys that do not have a fresh server snapshot yet.
 *
 * One forced attempt per export call — no retry loop if resolveMentionsBatch reports a
 * transient failure (null); unresolved mentions are exported with a neutral unavailable label.
 *
 * @param {Object} editor - Tiptap editor instance.
 * @param {number} documentId - owning document id.
 * @returns {Promise<Map<string, Object>>}
 */
export async function ensureResolved(editor: Object, documentId: number): Promise<Map<string, Object>>
{
	await resolveFileNodes(editor, documentId);
	// Disk attachments too: an export fired before the editor's own resolve pass has run would
	// otherwise write out placeholders for files the reader can perfectly well see.
	await resolveDiskAttachmentNodes(editor, documentId);

	const projection = editor.storage?.noteMentionResolver ?? null;
	const snapshots = new Map();
	const items = collectMentions(editor.state.doc, new Set()).filter(({ type, id }) => {
		const key = `${type}:${id}`;
		const snapshot = projection?.getFresh?.(key) ?? null;
		if (snapshot)
		{
			snapshots.set(key, snapshot);

			return false;
		}

		return true;
	});

	const batches = [];
	for (let offset = 0; offset < items.length; offset += MENTION_BATCH_LIMIT)
	{
		batches.push(items.slice(offset, offset + MENTION_BATCH_LIMIT));
	}

	let nextBatchIndex = 0;
	const resolveNext = async (): Promise<void> => {
		while (nextBatchIndex < batches.length)
		{
			const batch = batches[nextBatchIndex];
			nextBatchIndex += 1;
			const resolvedMap = await resolveMentionsBatch(batch);
			if (resolvedMap === null)
			{
				for (const { type, id } of batch)
				{
					snapshots.set(`${type}:${id}`, createMentionSnapshot());
				}

				continue;
			}

			for (const { type, id } of batch)
			{
				const key = `${type}:${id}`;
				const resolvedMention = resolvedMap.get(key);
				const snapshot = createMentionSnapshot(resolvedMention);
				snapshots.set(key, snapshot);
			}
		}
	};
	await Promise.all(
		Array.from({ length: Math.min(MENTION_EXPORT_CONCURRENCY, batches.length) }, () => resolveNext()),
	);

	return snapshots;
}

/**
 * Builds the deterministic zip entry name for an attachment: `{fileId}-{sanitizedBaseName}`.
 *
 * @param {number} fileId
 * @param {string} originalName - may include a path; only the base name is kept.
 * @returns {string}
 */
export function zipEntryName(fileId: number, originalName: string): string
{
	const baseName = String(originalName ?? '').replace(/^.*[\\/]/, '');
	const sanitizedBaseName = capEntryBaseName(baseName.replace(FORBIDDEN_NAME_CHARS_RE, '_'));

	return `${fileId}-${sanitizedBaseName}`;
}

/**
 * Percent-encodes a zip entry name for use inside a markdown/HTML link destination. Spaces and
 * parentheses left in a file name (e.g. "img 1 (2).png") otherwise terminate the `](...)`
 * destination early and break the link. encodeURIComponent leaves `!'()*` intact, so those are
 * encoded explicitly. The archived file keeps its raw name; a compliant renderer percent-decodes
 * the destination back to it.
 *
 * @param {string} entryName
 * @returns {string}
 */
function encodeZipEntryPath(entryName: string): string
{
	return encodeURIComponent(String(entryName ?? ''))
		.replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Escapes markdown link/image text so a `]`, `[` or `\` in a file name or mention label does not
 * terminate the `[...]`/`![...]` span early.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeLinkText(text: string): string
{
	return String(text ?? '').replace(/[[\]\\]/g, (char) => `\\${char}`);
}

function buildMentionMap(doc: Object, snapshots: Map<string, Object>): Map<string, Object>
{
	const mentionMap = new Map();

	doc.descendants((node) => {
		if (node.type.name !== MENTION_NODE_TYPE)
		{
			return;
		}

		const { entityType, entityId } = node.attrs;
		if (!entityType || !Number.isInteger(entityId) || entityId <= 0)
		{
			return;
		}

		const key = `${entityType}:${entityId}`;
		const snapshot = snapshots.get(key);
		if (snapshot)
		{
			mentionMap.set(key, snapshot);
		}
	});

	return mentionMap;
}

function buildAssetMap(doc: Object): Map<number, Object>
{
	const assetMap = new Map();

	doc.descendants((node) => {
		if (!ASSET_NODE_TYPES.has(node.type.name))
		{
			return;
		}

		const { fileId, name, downloadUrl } = node.attrs;
		if (!Number.isInteger(fileId) || fileId <= 0)
		{
			return;
		}

		assetMap.set(fileId, { name, downloadUrl, assetType: ASSET_NODE_TYPE_TO_ASSET_TYPE[node.type.name] });
	});

	return assetMap;
}

// Disk attachments are described outside the document (DiskAttachmentStore): the node carries only
// the object id, so what to write into the export is asked of the store, per document.
function buildDiskAssetMap(doc: Object, documentId: number): Map<number, Object>
{
	const diskAssetMap = new Map();

	doc.descendants((node) => {
		if (!ASSET_NODE_TYPES.has(node.type.name))
		{
			return;
		}

		const { diskObjectId } = node.attrs;
		if (!Number.isInteger(diskObjectId) || diskObjectId <= 0)
		{
			return;
		}

		const entry = DiskAttachmentStore.get(documentId, diskObjectId) ?? {};

		diskAssetMap.set(diskObjectId, {
			name: entry.name ?? '',
			// The view link opens the file on Disk with its own permission check — the right thing for
			// an exported document to point at. Absent for a file this reader may not see.
			url: entry.showUrl ?? entry.downloadUrl ?? null,
			assetType: ASSET_NODE_TYPE_TO_ASSET_TYPE[node.type.name],
		});
	});

	return diskAssetMap;
}

// A value only counts once it round-trips through the same normalization the node itself trusts:
// no partial trust for an attribute that reached the doc past the tokenizer.
function collectDateValues(doc: Object): Set<string>
{
	const dateSet = new Set();

	doc.descendants((node) => {
		if (node.type.name !== DATE_NODE_TYPE)
		{
			return;
		}

		const value = normalizeDateString(node.attrs.value);
		if (value !== null)
		{
			dateSet.add(value);
		}
	});

	return dateSet;
}

/**
 * Canonical export algorithm (ALG-01): turns the live editor document into readable markdown
 * with mentions replaced by markdown links (or bare labels when unavailable), attachment
 * tokens replaced by absolute download links (`mode: 'links'`) or `attachments/...` zip paths
 * (`mode: 'zip'`), and date tokens replaced by a formatted caption in the portal's culture.
 *
 * A regex match that has no counterpart in the mention/asset map (e.g. hand-typed text that
 * happens to look like a token) is left untouched rather than replaced with an empty/undefined
 * label — the map is the only source of truth for what is a real node-backed token.
 *
 * @param {Object} editor - Tiptap editor instance.
 * @param {number} documentId - owning document id, forwarded to ensureResolved.
 * @param {'links' | 'zip'} mode
 * @returns {Promise<string>}
 */
export async function exportMarkdown(editor: Object, documentId: number, mode: 'links' | 'zip'): Promise<string>
{
	const mentionSnapshots = await ensureResolved(editor, documentId);

	const mentionMap = buildMentionMap(editor.state.doc, mentionSnapshots);
	const assetMap = buildAssetMap(editor.state.doc);
	const diskAssetMap = buildDiskAssetMap(editor.state.doc, documentId);
	const dateSet = collectDateValues(editor.state.doc);
	const { origin } = window.location;

	let markdown = editor.getMarkdown();

	markdown = markdown.replace(MENTION_TOKEN_RE, (raw, type, idStr) => {
		const mention = mentionMap.get(`${type}:${Number(idStr)}`);
		if (!mention)
		{
			return raw;
		}

		const label = mention.available === true
			? (mention.label ?? '')
			: Loc.getMessage('NOTE_MENTION_UNAVAILABLE')
		;

		return mention.available === true
			? `[${escapeLinkText(label)}](${origin}${mention.url ?? ''})`
			: label;
	});

	markdown = markdown.replace(ASSET_TOKEN_RE, (raw, type, idStr) => {
		const asset = assetMap.get(Number(idStr));
		if (!asset)
		{
			return raw;
		}

		const name = asset.name ?? '';
		const target = mode === 'zip'
			? `attachments/${encodeZipEntryPath(zipEntryName(Number(idStr), name))}`
			: `${origin}${asset.downloadUrl ?? ''}`;
		const text = escapeLinkText(name);

		return asset.assetType === 'image' ? `![${text}](${target})` : `[${text}](${target})`;
	});

	// A Disk attachment becomes a plain link in both modes — including zip, where the attachments
	// folder holds only files this module owns. An image is not embedded either: the link needs
	// Disk's own permission check, and an `![...]` would render as a broken image to anyone without
	// access to the file.
	markdown = markdown.replace(DISK_ASSET_TOKEN_RE, (raw, type, idStr) => {
		const asset = diskAssetMap.get(Number(idStr));
		const name = asset?.name ?? '';
		if (!asset?.url)
		{
			// No link means the reader could not see the file, so there is nothing to point at. The
			// name (when known) goes in as plain text — the same way an unavailable mention degrades.
			// What must not happen is the raw token leaking into a document meant for a human.
			return escapeLinkText(name === '' ? Loc.getMessage('NOTE_EDITOR_FILE_ATTACHMENT_UNAVAILABLE') : name);
		}

		// Disk hands back either an absolute link or a site-root path, depending on the file type.
		const target = /^https?:\/\//.test(asset.url) ? asset.url : `${origin}${asset.url}`;

		return `[${escapeLinkText(name)}](${target})`;
	});

	// The caption is built by the same code the node itself uses: a mismatch here
	// would mean the exported date reads differently from the one shown in the editor.
	markdown = markdown.replace(DATE_TOKEN_RE, (raw, value) => {
		if (!dateSet.has(value))
		{
			return raw;
		}

		return formatDateCaption(value);
	});

	return markdown;
}

/**
 * @param {Object} editor - Tiptap editor instance.
 * @returns {boolean} true if the document has at least one image/file/video node with a
 * positive integer fileId.
 */
export function hasAttachments(editor: Object): boolean
{
	let found = false;

	editor.state.doc.descendants((node) => {
		if (ASSET_NODE_TYPES.has(node.type.name) && Number.isInteger(node.attrs.fileId) && node.attrs.fileId > 0)
		{
			found = true;
		}
	});

	return found;
}
