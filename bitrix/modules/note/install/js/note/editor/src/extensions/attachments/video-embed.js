import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, NodeSelection } from '@tiptap/pm/state';
import { VideoService } from 'ui.video-service';
import {
	normalizeVideoUrl,
	isAllowedEmbedSrc,
	findBareUrlLineStart,
	matchBareUrlLine,
} from './video-embed-parser';
import { buildVideoEmbedAsset, matchVideoEmbedAsset, findVideoEmbedAssetStart } from './video-embed-asset-parser';
import { VueAttachmentNodeView } from './node-view';
import { VideoEmbedNodeViewComponent } from '../../components/nodes/video-embed-card';

type EmbedAttrs = {
	source: string,
	src: string,
};

type MarkdownToken = {
	type: 'videoEmbed',
	raw: string,
	attrs: EmbedAttrs,
};

// Iframe permissions mirror what ui.video-service / landing grant their players. No `sandbox`: the
// security boundary is isAllowedEmbedSrc, re-checked wherever a stored src becomes an iframe, and
// video players need scripts + same-origin to run, which a meaningful sandbox forbids.
const IFRAME_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';

/**
 * Resolves a raw video URL to its embeddable form via ui.video-service.
 *
 * The resolved src is re-checked host-wise: ui.video-service recognises a URL by a matcher that is
 * not always anchored to its start, so a crafted URL can carry a foreign prefix into the embed src.
 *
 * @return {EmbedAttrs | null} null when the host is not a supported video provider - the caller
 *   then leaves the URL as a normal link.
 */
function resolveEmbed(rawUrl: string): EmbedAttrs | null
{
	const service = VideoService.createByUrl(normalizeVideoUrl(rawUrl));
	if (!service)
	{
		return null;
	}

	const src = service.getEmbeddedUrl();
	if (!isAllowedEmbedSrc(src))
	{
		return null;
	}

	return { source: String(rawUrl).trim(), src };
}

// Normalizes a width attr to a percentage (>0..100, fractional allowed) or null.
function normalizeWidth(value: mixed): number | null
{
	const width = Number(value);

	return (Number.isFinite(width) && width > 0) ? Math.min(width, 100) : null;
}

// Normalizes an align attr to a float direction; center is the default and stored as null.
function normalizeAlign(value: mixed): string | null
{
	return (value === 'left' || value === 'right') ? value : null;
}

/**
 * Turns a standalone whitelisted video URL (YouTube/Vimeo/RuTube/VK/...) into an inline player.
 *
 * A bare video URL on its own line becomes a `videoEmbed` block that renders a responsive iframe,
 * using ui.video-service (the same resolver ui.text-editor uses) to map the URL to its embed src.
 * The player can be resized (width %) and aligned (left/right float) exactly like an image; those
 * settings round-trip through the `[[video-embed ...]]` markdown form (see renderMarkdown). URLs that
 * ui.video-service does not recognise are left untouched and stay ordinary links.
 */
export const VideoEmbed: Object = Node.create({
	name: 'videoEmbed',
	group: 'block',
	atom: true,
	selectable: true,
	draggable: true,

	addAttributes()
	{
		return {
			// Original URL as written in markdown - the round-trip source of truth.
			source: {
				default: null,
			},
			// Resolved iframe URL (derived from `source` via ui.video-service at parse time).
			src: {
				default: null,
			},
			// Rendered width as a percentage of the container (>0..100, fractional). null = default size.
			// Persisted in markdown via the `[[video-embed ... width=N]]` form.
			width: {
				default: null,
			},
			// Float alignment: 'left' | 'right'. null = center (default, no float).
			align: {
				default: null,
			},
		};
	},

	addOptions()
	{
		return {
			// Vue component the node-view mounts (renders the iframe + resize/align controls).
			nodeViewComponent: VideoEmbedNodeViewComponent,
			// Enables resize/align/float-stacking via the shared VueAttachmentNodeView.
			resizable: true,
			// No file-replace for an external embed.
			uploadService: null,
			defaultTypeMessage: 'NOTE_EDITOR_FILE_ATTACHMENT_TYPE_VIDEO',
		};
	},

	parseHTML()
	{
		return [{
			tag: 'div[data-type="videoEmbed"]',
			getAttrs: (dom) => {
				// Re-resolve the embed src from the declared source URL rather than trusting the
				// pasted `<iframe src>`. A crafted HTML paste that points the iframe at an arbitrary
				// host is thus ignored - only a source resolving to a known player host yields a src
				// (anything else leaves src null -> renders nothing).
				const source = dom.getAttribute('data-source') || null;
				const embed = source ? resolveEmbed(source) : null;

				return {
					source: embed ? embed.source : source,
					src: embed ? embed.src : null,
					width: normalizeWidth(dom.getAttribute('data-width')),
					align: normalizeAlign(dom.getAttribute('data-align')),
				};
			},
		}];
	},

	renderHTML({ HTMLAttributes, node })
	{
		const safeSrc = isAllowedEmbedSrc(node.attrs.src) ? node.attrs.src : '';
		const source = typeof node.attrs.source === 'string' ? node.attrs.source : '';
		const width = normalizeWidth(node.attrs.width);
		const align = normalizeAlign(node.attrs.align);

		// Width/align mirrored onto the exported element so copy/paste and non-editor HTML keep sizing.
		const alignClass = `note-editor-media--align-${align || 'center'}`;
		const style = width !== null ? `width:${width}%` : '';

		return [
			'div',
			mergeAttributes(HTMLAttributes, {
				'data-type': 'videoEmbed',
				'data-source': source,
				'data-width': width !== null ? String(width) : '',
				'data-align': align || '',
				class: `note-editor-video-embed note-editor-media ${alignClass}`,
				style,
				contenteditable: 'false',
			}),
			['div', { class: 'note-editor-video-embed__frame' },
				['iframe', {
					src: safeSrc,
					class: 'note-editor-video-embed__iframe',
					frameborder: '0',
					allow: IFRAME_ALLOW,
					allowfullscreen: 'true',
					loading: 'lazy',
					referrerpolicy: 'strict-origin-when-cross-origin',
				}],
			],
		];
	},

	addNodeView()
	{
		return ({ node, editor, getPos }) => new VueAttachmentNodeView({
			node,
			editor,
			getPos,
			extension: this,
			dataType: 'videoEmbed',
			className: 'note-editor-video-embed',
			inline: false,
			uploadService: null,
		});
	},

	addProseMirrorPlugins()
	{
		const nodeName = this.name;

		return [
			new Plugin({
				props: {
					// Click on the frame chrome (around the iframe) selects the node so it can be
					// deleted/dragged; clicks on the resize handles drive their own UI.
					handleClickOn(view, pos, node, nodePos, event, direct)
					{
						if (!direct || node.type.name !== nodeName || !view.editable)
						{
							return false;
						}

						if (event.target instanceof Element
							&& event.target.closest('.note-editor-media-resize-handle'))
						{
							return false;
						}

						const { selection } = view.state;
						if (selection instanceof NodeSelection && selection.from === nodePos)
						{
							return false;
						}

						view.dispatch(view.state.tr.setSelection(
							NodeSelection.create(view.state.doc, nodePos),
						));

						return true;
					},
				},
			}),
		];
	},

	markdownTokenizer: {
		name: 'videoEmbed',
		level: 'block',
		start(src: string): number
		{
			return findBareUrlLineStart(src);
		},
		tokenize(src: string): MarkdownToken | null
		{
			const line = matchBareUrlLine(src);
			if (!line)
			{
				return null;
			}

			const embed = resolveEmbed(line.url);
			if (!embed)
			{
				return null;
			}

			return {
				type: 'videoEmbed',
				raw: line.raw,
				attrs: embed,
			};
		},
		childTokens: [],
	},

	parseMarkdown(token: MarkdownToken): Object
	{
		return {
			type: 'videoEmbed',
			attrs: {
				source: token.attrs.source,
				src: token.attrs.src,
				width: normalizeWidth(token.attrs.width),
				align: normalizeAlign(token.attrs.align),
			},
		};
	},

	renderMarkdown(node): string
	{
		const source = typeof node?.attrs?.source === 'string' ? node.attrs.source : '';
		if (source === '')
		{
			return '';
		}

		const width = normalizeWidth(node?.attrs?.width);
		const align = normalizeAlign(node?.attrs?.align);

		// No sizing/positioning -> keep the clean bare-URL form (imported docs stay idempotent).
		// Any width/align -> the richer [[video-embed ...]] token that can carry them.
		if (width === null && align === null)
		{
			return source;
		}

		return buildVideoEmbedAsset(source, width, align);
	},
});

/**
 * Tokenizer-only extension for the `[[video-embed url=.. width=.. align=..]]` markdown form.
 *
 * Mirrors EnrichedAssetTokenizer: it is never inserted as a `videoEmbedAsset` node - its token is
 * re-mapped to a real `videoEmbed` node by parseMarkdown, re-resolving the embed src from the URL.
 */
export const VideoEmbedAssetTokenizer: Object = Node.create({
	name: 'videoEmbedAsset',

	markdownTokenizer: {
		name: 'videoEmbedAsset',
		level: 'block',
		start(src: string): number
		{
			return findVideoEmbedAssetStart(src);
		},
		tokenize(src: string): Object | null
		{
			const asset = matchVideoEmbedAsset(src);
			if (!asset)
			{
				return null;
			}

			const embed = resolveEmbed(asset.url);

			return {
				type: 'videoEmbedAsset',
				raw: asset.raw,
				attrs: {
					source: asset.url,
					// Re-resolved src; empty if the host is no longer recognised (rare) - renders blank.
					src: embed ? embed.src : '',
					width: asset.width,
					align: asset.align,
				},
			};
		},
		childTokens: [],
	},

	parseMarkdown(token: Object): Object
	{
		return {
			type: 'videoEmbed',
			attrs: {
				source: token.attrs.source,
				src: token.attrs.src,
				width: normalizeWidth(token.attrs.width),
				align: normalizeAlign(token.attrs.align),
			},
		};
	},
});
