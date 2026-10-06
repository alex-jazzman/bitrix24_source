// @flow

import { resolveFileNodes } from '../../utils/resolve-file-nodes';
import { collectUnresolvedMentions, resolveMentionsBatch } from '../../utils/resolve-mentions';

const MENTION_NODE_TYPE = 'noteMention';

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
 * Export reads mention/asset attrs straight off the node — attrs that are normally filled in
 * asynchronously by the debounced background resolver (RESOLVE_DEBOUNCE_MS/RESOLVE_MAX_WAIT_MS).
 * Without this, exporting right after inserting a mention/file would carry empty label/url.
 *
 * One forced attempt per export call — no retry loop if resolveMentionsBatch reports a
 * transient failure (null); any mentions left unresolved stay in their current node state.
 *
 * @param {Object} editor - Tiptap editor instance.
 * @param {number} documentId - owning document id.
 * @returns {Promise<void>}
 */
export async function ensureResolved(editor: Object, documentId: number): Promise<void>
{
	await resolveFileNodes(editor, documentId);

	const items = collectUnresolvedMentions(editor.state.doc, new Set());
	if (items.length === 0)
	{
		return;
	}

	const resolvedMap = await resolveMentionsBatch(items);
	if (resolvedMap === null)
	{
		return;
	}

	const { tr, doc } = editor.state;
	let changed = false;

	doc.descendants((node, pos) => {
		if (node.type.name !== MENTION_NODE_TYPE)
		{
			return;
		}

		const { entityType, entityId, available } = node.attrs;
		if (available !== null)
		{
			return; // already resolved
		}

		const mention = resolvedMap.get(`${entityType}:${entityId}`);

		// Same attribute set as note-mention-resolver-extension.js:106-129 — a missing key means
		// the backend reported the entity as gone/no-access, so it becomes unavailable:true.
		tr.setNodeMarkup(pos, undefined, {
			...node.attrs,
			label: mention?.label ?? null,
			avatar: mention?.avatar ?? null,
			url: mention?.url ?? null,
			available: Boolean(mention?.available),
			isCurrentUser: Boolean(mention?.isCurrentUser),
			unavailable: !mention?.available,
		});
		changed = true;
	});

	if (changed)
	{
		editor.view.dispatch(tr);
	}
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

function buildMentionMap(doc: Object): Map<string, Object>
{
	const mentionMap = new Map();

	doc.descendants((node) => {
		if (node.type.name !== MENTION_NODE_TYPE)
		{
			return;
		}

		const { entityType, entityId, label, url, available } = node.attrs;
		if (!entityType || !Number.isInteger(entityId) || entityId <= 0)
		{
			return;
		}

		mentionMap.set(`${entityType}:${entityId}`, { label, url, available });
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

/**
 * Canonical export algorithm (ALG-01): turns the live editor document into readable markdown
 * with mentions replaced by markdown links (or bare labels when unavailable) and attachment
 * tokens replaced by absolute download links (`mode: 'links'`) or `attachments/...` zip paths
 * (`mode: 'zip'`).
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
	await ensureResolved(editor, documentId);

	const mentionMap = buildMentionMap(editor.state.doc);
	const assetMap = buildAssetMap(editor.state.doc);
	const { origin } = window.location;

	let markdown = editor.getMarkdown();

	markdown = markdown.replace(MENTION_TOKEN_RE, (raw, type, idStr) => {
		const mention = mentionMap.get(`${type}:${Number(idStr)}`);
		if (!mention)
		{
			return raw;
		}

		const label = mention.label ?? '';

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
