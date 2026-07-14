import { Node, mergeAttributes } from '@tiptap/core';
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
	commandName?: string,
	nodeViewComponent?: Object | null,
	extraAttrs?: (() => Object) | Object,
	dataAttributes?: ((attrs: Object) => Object) | Object,
	parseHTMLTags?: string[],
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
	return ['div', { class: `${config.className}-fallback` },
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
		return Node.create({
			name: config.name,
			group: 'block',
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
					'div',
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
				});
			},
			addCommands: createCommandFactory(config),
			renderMarkdown(node)
			{
				const fileId = Number(node?.attrs?.fileId);
				if (!Number.isInteger(fileId) || fileId <= 0)
				{
					return '';
				}

				return `[[${config.assetType} fileId=${fileId}]]`;
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
