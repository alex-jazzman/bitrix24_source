import { Dom, Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { toPositiveInt } from '../../utils/normalize';

const IMAGE_EXTENSIONS = new Set([
	'jpg',
	'jpeg',
	'png',
	'gif',
	'webp',
	'bmp',
	'svg',
	'avif',
	'heic',
	'heif',
]);

const VIDEO_EXTENSIONS = new Set([
	'mp4',
	'webm',
	'mov',
	'm4v',
	'mkv',
	'avi',
	'wmv',
	'flv',
	'3gp',
	'mpeg',
	'mpg',
]);

function getFileExtension(fileName: mixed): string
{
	if (!Type.isStringFilled(fileName))
	{
		return '';
	}

	const normalizedName = fileName.trim();
	const dotPosition = normalizedName.lastIndexOf('.');
	if (dotPosition <= 0 || dotPosition === normalizedName.length - 1)
	{
		return '';
	}

	return normalizedName.slice(dotPosition + 1).toLowerCase();
}

export function resolveTargetNodeTypeByPayload(payload: Object): string
{
	const mimeType = String(payload?.mimeType || '').toLowerCase();
	if (mimeType.startsWith('image/'))
	{
		return 'imageAttachment';
	}

	if (mimeType.startsWith('video/'))
	{
		return 'video';
	}

	const extension = getFileExtension(payload?.name);
	if (IMAGE_EXTENSIONS.has(extension))
	{
		return 'imageAttachment';
	}

	if (VIDEO_EXTENSIONS.has(extension))
	{
		return 'video';
	}

	return 'fileAttachment';
}

export function buildAttachmentAttrs(payload: Object, targetNodeType: string): Object | null
{
	const documentId = toPositiveInt(payload.documentId);
	const fileId = toPositiveInt(payload.fileId);
	const showUrl = Type.isStringFilled(payload.showUrl) ? payload.showUrl : '';
	if (documentId === null || fileId === null || showUrl === '')
	{
		return null;
	}

	const downloadUrl = Type.isStringFilled(payload.downloadUrl) ? payload.downloadUrl : showUrl;
	const viewerAttrs = Type.isPlainObject(payload.viewerAttrs) ? payload.viewerAttrs : {};
	const attrs = {
		name: payload.name || '',
		size: Number(payload.size) || 0,
		mimeType: payload.mimeType || '',
		fileId,
		documentId,
		downloadUrl,
		showUrl,
		viewerAttrs,
	};

	if (targetNodeType === 'video')
	{
		return {
			...attrs,
			src: showUrl,
			controls: true,
		};
	}

	return attrs;
}

function isUploaderInteractiveElement(target: EventTarget | null): boolean
{
	if (!(target instanceof Element))
	{
		return false;
	}

	const interactiveSelectors = [
		'input[type="file"]',
		'button',
		'a',
		'[role="button"]',
		'.ui-tile-uploader-selector-link',
		'.ui-tile-uploader-item-menu',
		'.ui-tile-uploader-item-remove',
		'.ui-tile-uploader-item-state-remove',
	];

	return interactiveSelectors.some((selector) => target.closest(selector));
}

export class VueUploadAssetNodeView
{
	node: Object;
	editor: Object;
	getPos: () => number | undefined;
	extension: Object;
	dataType: string;
	className: string;
	app: Object | null;
	vm: Object | null;
	dom: HTMLElement;

	constructor({ node, editor, getPos, extension, dataType, className }: {
		node: Object,
		editor: Object,
		getPos: () => number | undefined,
		extension: Object,
		dataType: string,
		className: string,
	})
	{
		this.node = node;
		this.editor = editor;
		this.getPos = getPos;
		this.extension = extension;
		this.dataType = dataType;
		this.className = className;
		this.app = null;
		this.vm = null;
		this.lastEditable = Boolean(this.editor?.isEditable);

		this.dom = document.createElement('div');
		this.dom.setAttribute('data-type', dataType);
		this.dom.className = className;
		this.dom.contentEditable = 'false';
		this.applyVisibility(this.lastEditable);

		this.handleEditorUpdate = () => this.syncEditableState();
		this.editor?.on('update', this.handleEditorUpdate);

		this.mountVue();
	}

	applyVisibility(editable: boolean): void
	{
		Dom.style(this.dom, 'display', editable ? '' : 'none');
		this.dom.setAttribute('aria-hidden', editable ? 'false' : 'true');
	}

	syncEditableState(): void
	{
		const editable = Boolean(this.editor?.isEditable);
		if (editable === this.lastEditable)
		{
			return;
		}

		this.lastEditable = editable;
		this.applyVisibility(editable);

		if (!editable)
		{
			this.unmountVue();

			return;
		}

		if (!this.vm)
		{
			this.mountVue();
		}
	}

	unmountVue(): void
	{
		this.app?.unmount();
		this.app = null;
		this.vm = null;
		this.dom.innerHTML = '';
	}

	mountVue(): void
	{
		const component = this.extension.options.nodeViewComponent;
		if (!component || !this.editor?.isEditable)
		{
			return;
		}

		this.app = BitrixVue.createApp({
			components: {
				UploadAssetNodeViewComponent: component,
			},
			data: () => ({
				attrs: this.node.attrs,
			}),
			methods: {
				handleComplete: (payload) => {
					setTimeout(() => {
						this.replaceWithAttachment(payload);
					}, 0);
				},
			},
			// language=Vue
			template: `
				<UploadAssetNodeViewComponent
					:attrs="attrs"
					:on-complete="handleComplete"
				/>
			`,
		});
		this.vm = this.app.mount(this.dom);
	}

	update(node: Object): boolean
	{
		if (node.type !== this.node.type)
		{
			return false;
		}

		this.node = node;
		this.syncEditableState();

		if (this.vm)
		{
			this.vm.attrs = node.attrs;
		}

		return true;
	}

	replaceWithAttachment(payload: Object | null): void
	{
		if (!Type.isPlainObject(payload))
		{
			return;
		}

		const pos = this.resolvePos();
		if (pos === null)
		{
			return;
		}

		const targetNodeType = resolveTargetNodeTypeByPayload(payload);
		const schemaNodeType = this.editor?.state?.schema?.nodes?.[targetNodeType];
		if (!schemaNodeType)
		{
			return;
		}

		const attrs = buildAttachmentAttrs(payload, targetNodeType);
		if (!attrs)
		{
			return;
		}

		const newNode = schemaNodeType.create(attrs);
		const tr = this.editor.state.tr.replaceWith(pos, pos + this.node.nodeSize, newNode);
		this.editor.view.dispatch(tr);
	}

	resolvePos(): number | null
	{
		if (!Type.isFunction(this.getPos))
		{
			return null;
		}

		const pos = this.getPos();

		return Number.isInteger(pos) && pos >= 0 ? pos : null;
	}

	stopEvent(event: Event): boolean
	{
		if (!(event.target instanceof Element) || !this.dom.contains(event.target))
		{
			return false;
		}

		const isInteractive = isUploaderInteractiveElement(event.target);
		switch (event.type)
		{
			case 'mousedown':
			case 'mouseup':
			case 'click':
			case 'touchstart':
			case 'touchend':
			case 'keydown':
			case 'keypress':
			case 'keyup':
				return isInteractive;
			case 'dragenter':
			case 'dragover':
			case 'dragleave':
			case 'drop':
				// Keep uploader drag-and-drop working inside the node.
				return true;
			case 'dragstart':
				// Allow dragging the node itself, but keep controls non-draggable.
				return isInteractive;
			default:
				return isInteractive;
		}
	}

	ignoreMutation(): boolean
	{
		return true;
	}

	destroy(): void
	{
		if (this.handleEditorUpdate)
		{
			this.editor?.off('update', this.handleEditorUpdate);
			this.handleEditorUpdate = null;
		}
		this.unmountVue();
	}
}
