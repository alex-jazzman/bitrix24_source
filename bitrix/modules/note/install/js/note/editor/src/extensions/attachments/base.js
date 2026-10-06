import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, NodeSelection } from '@tiptap/pm/state';
import { Loc, Type } from 'main.core';
import { VueAttachmentNodeView } from './node-view';
import { normalizeFileSize } from '../../utils/file-size';

type AssetType = 'image' | 'file' | 'video';

type NodeConfig = {
	name: string,
	dataType: string,
	className: string,
	defaultNameMessage: string,
	defaultTypeMessage: string,
	assetType: AssetType,
	inline?: boolean,
	commandName?: string,
	nodeViewComponent?: Object | null,
	extraAttrs?: (() => Object) | Object,
	dataAttributes?: ((attrs: Object) => Object) | Object,
	parseHTMLTags?: string[],
	resizable?: boolean,
};

type BaseAttrs = {
	name: string,
	size: number,
	mimeType: string,
	fileId: number | null,
	documentId: number | null,
	downloadUrl: string | null,
	showUrl: string | null,
	viewerAttrs: Object | null,
};

function buildBaseAttributes(config: NodeConfig): Object
{
	return {
		name: {
			default: Loc.getMessage(config.defaultNameMessage),
		},
		size: {
			default: 0,
		},
		mimeType: {
			default: '',
		},
		fileId: {
			default: null,
		},
		documentId: {
			default: null,
		},
		downloadUrl: {
			default: null,
		},
		showUrl: {
			default: null,
		},
		viewerAttrs: {
			default: null,
		},
		// Set when the backend reports the fileId as unresolvable (not linked / missing source).
		// Session-transient: cleared on a successful re-resolve, so access granted later recovers.
		unavailable: {
			default: false,
		},
		// Rendered width as a percentage of the container (image resize), >0..100, fractional
		// allowed (0.01% steps). null = natural size. Persisted in markdown as `width=N` (bare
		// number = percent).
		width: {
			default: null,
		},
		// Float-based image alignment: 'left' | 'right'. null = center (default, no float).
		// Persisted in markdown as `align=left|right` (center is never serialized).
		align: {
			default: null,
		},
		// [version-diff] 'added' | 'removed' | null. Set only inside the read-only version preview to
		// tag the node in the diff; the NodeView turns it into a CSS class. Not serialized to markdown
		// (renderMarkdown emits only fileId/width/align) and preserved across resolve (see
		// resolve-file-nodes.js), so it rides along like width/align.
		diffState: {
			default: null,
		},
	};
}

function resolveExtraAttributes(config: NodeConfig): Object
{
	if (Type.isFunction(config.extraAttrs))
	{
		return config.extraAttrs();
	}

	return config.extraAttrs || {};
}

function resolveExtraDataAttributes(config: NodeConfig, attrs: Object): Object
{
	if (Type.isFunction(config.dataAttributes))
	{
		return config.dataAttributes(attrs);
	}

	return config.dataAttributes || {};
}

function resolveParseHtml(config: NodeConfig): Object[]
{
	if (Array.isArray(config.parseHTMLTags) && config.parseHTMLTags.length > 0)
	{
		return config.parseHTMLTags.map((tag) => ({ tag }));
	}

	return [{ tag: `div[data-type="${config.dataType}"]` }];
}

function renderFallback(config: NodeConfig, attrs: Object): Array<mixed>
{
	return [config.inline === true ? 'span' : 'div', { class: `${config.className}-fallback` },
		attrs.name || Loc.getMessage(config.defaultNameMessage),
		' · ',
		attrs.mimeType || Loc.getMessage(config.defaultTypeMessage),
		' · ',
		normalizeFileSize(attrs.size),
	];
}

function createCommandFactory(config: NodeConfig): () => Object
{
	return function commandFactory()
	{
		if (!config.commandName)
		{
			return {};
		}

		return {
			[config.commandName]: (attrs) => ({ commands }) => commands.insertContent({
				type: config.name,
				attrs,
			}),
		};
	};
}

export class FileAssetNodeFactory
{
	static normalizeSize(bytes: mixed): string
	{
		return normalizeFileSize(bytes);
	}

	static createNode(config: NodeConfig): Object
	{
		const isInline = config.inline === true;

		return Node.create({
			name: config.name,
			group: isInline ? 'inline' : 'block',
			inline: isInline,
			atom: true,
			selectable: true,
			draggable: true,
			addAttributes()
			{
				return {
					...buildBaseAttributes(config),
					...resolveExtraAttributes(config),
				};
			},
			parseHTML()
			{
				return resolveParseHtml(config);
			},
			renderHTML({ HTMLAttributes, node })
			{
				return [
					isInline ? 'span' : 'div',
					mergeAttributes(HTMLAttributes, {
						'data-type': config.dataType,
						class: config.className,
						contenteditable: 'false',
						'data-file-id': node.attrs.fileId || '',
						'data-document-id': node.attrs.documentId || '',
						'data-download-url': node.attrs.downloadUrl || '',
						'data-show-url': node.attrs.showUrl || '',
						...resolveExtraDataAttributes(config, node.attrs),
					}),
					renderFallback(config, node.attrs),
				];
			},
			addOptions()
			{
				return {
					nodeViewComponent: config.nodeViewComponent || null,
					defaultTypeMessage: config.defaultTypeMessage,
					// Injected for image replace (see media-extensions/registry). null for file/video.
					uploadService: null,
					// Enables resize/align/float-stacking for this node type (image, video).
					resizable: config.resizable === true,
				};
			},
			addNodeView()
			{
				return ({ node, editor, getPos }) => new VueAttachmentNodeView({
					node,
					editor,
					getPos,
					extension: this,
					dataType: config.dataType,
					className: config.className,
					inline: isInline,
					uploadService: this.options.uploadService,
				});
			},
			addProseMirrorPlugins()
			{
				const nodeName = config.name;

				return [
					new Plugin({
						props: {
							// Deterministic click-to-select: PM's native click handling leaves inline atoms
							// selected-or-not depending on click x-position. Force a NodeSelection instead.
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

								// Already selected: let the click pass through natively (link → viewer),
								// and don't block ProseMirror's drag-and-drop of the selected node.
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
			addCommands: createCommandFactory(config),
			renderMarkdown(node)
			{
				const fileId = Number(node?.attrs?.fileId);
				if (!Number.isInteger(fileId) || fileId <= 0)
				{
					return '';
				}

				// width is a percentage (>0..100, fractional allowed); serialize as a bare number.
				const width = Number(node?.attrs?.width);
				const widthAttr = (Number.isFinite(width) && width > 0 && width <= 100) ? ` width=${width}` : '';

				const align = node?.attrs?.align;
				const alignAttr = (align === 'left' || align === 'right') ? ` align=${align}` : '';

				return `[[${config.assetType} fileId=${fileId}${widthAttr}${alignAttr}]]`;
			},
		});
	}

	static createAttrs(file: Object | null): BaseAttrs
	{
		if (!file)
		{
			return {
				name: Loc.getMessage('NOTE_EDITOR_FILE_ATTACHMENT_UNTITLED'),
				size: 0,
				mimeType: '',
				fileId: null,
				documentId: null,
				downloadUrl: null,
				showUrl: null,
				viewerAttrs: null,
			};
		}

		return {
			name: file.getName?.() || Loc.getMessage('NOTE_EDITOR_FILE_ATTACHMENT_UNTITLED'),
			size: file.getSize?.() || 0,
			mimeType: file.getType?.() || '',
			fileId: file.getServerFileId?.() || null,
			documentId: null,
			downloadUrl: file.getDownloadUrl?.() || null,
			showUrl: file.getDownloadUrl?.() || null,
			viewerAttrs: file.getViewerAttrs?.() || null,
		};
	}
}
