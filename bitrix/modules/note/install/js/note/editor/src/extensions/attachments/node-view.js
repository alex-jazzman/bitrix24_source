import { Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';

export class VueAttachmentNodeView
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
	activateOnClick: boolean;

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
		this.activateOnClick = false;

		this.dom = document.createElement('div');
		this.dom.setAttribute('data-type', dataType);
		this.dom.className = className;
		this.dom.contentEditable = 'false';

		this.mountVue();
	}

	mountVue(): void
	{
		const component = this.extension.options.nodeViewComponent;
		if (!component)
		{
			return;
		}

		this.app = BitrixVue.createApp({
			components: {
				AttachmentNodeViewComponent: component,
			},
			data: () => ({
				attrs: this.node.attrs,
				defaultTypeMessage: this.extension.options.defaultTypeMessage,
			}),
			// language=Vue
			template: `
				<AttachmentNodeViewComponent
					:attrs="attrs"
					:default-type-message="defaultTypeMessage"
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
		this.activateOnClick = false;
		if (this.vm)
		{
			this.vm.attrs = node.attrs;
		}

		return true;
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

	isNodeSelected(): boolean
	{
		const pos = this.resolvePos();
		const selection = this.editor?.state?.selection;
		if (pos === null || !selection)
		{
			return false;
		}

		return selection.from === pos && selection.to === pos + this.node.nodeSize;
	}

	#isActivatableTarget(target: Element): boolean
	{
		return Boolean(
			target.closest('.note-editor-image-attachment-link')
			|| target.closest('.note-editor-file-attachment-link')
			|| target.closest('.note-editor-video-player'),
		);
	}

	stopEvent(event: Event): boolean
	{
		if (!(event.target instanceof Element) || !this.dom.contains(event.target))
		{
			return false;
		}

		if (!this.#isActivatableTarget(event.target))
		{
			return false;
		}

		if (!this.editor?.isEditable)
		{
			return true;
		}

		if (event.type === 'dragstart')
		{
			this.activateOnClick = false;

			return false;
		}

		if (event.type === 'mousedown' || event.type === 'touchstart')
		{
			this.activateOnClick = this.isNodeSelected();
			if (!this.activateOnClick)
			{
				event.preventDefault();
			}

			return this.activateOnClick;
		}

		if (event.type === 'click' || event.type === 'touchend')
		{
			const shouldActivate = this.activateOnClick;
			this.activateOnClick = false;
			if (!shouldActivate)
			{
				event.preventDefault();
			}

			return shouldActivate;
		}

		return false;
	}

	ignoreMutation(): boolean
	{
		return true;
	}

	destroy(): void
	{
		this.app?.unmount();
		this.app = null;
		this.vm = null;
	}
}
