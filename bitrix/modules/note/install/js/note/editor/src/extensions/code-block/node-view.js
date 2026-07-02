import { Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { NoteCodeBlockOverlay } from './code-block-overlay';
import { DEFAULT_LANGUAGE } from '../lowlight-languages';

const OVERLAY_HOST_CLASS = 'note-editor-code-block-overlay-host';
const WRAPPER_CLASS = 'note-editor-code-block';

export class CodeBlockNodeView
{
	node: Object;
	editor: Object;
	getPos: () => number | undefined;

	dom: HTMLElement;
	contentDOM: HTMLElement;

	#overlayHost: HTMLElement;
	#preEl: HTMLElement;
	#vueApp: Object | null;
	#vm: Object | null;

	constructor({ node, editor, getPos }: { node: Object, editor: Object, getPos: Function })
	{
		this.node = node;
		this.editor = editor;
		this.getPos = getPos;

		this.dom = document.createElement('div');
		this.dom.className = WRAPPER_CLASS;
		this.dom.setAttribute('data-type', 'codeBlock');

		this.#overlayHost = document.createElement('div');
		this.#overlayHost.className = OVERLAY_HOST_CLASS;
		this.#overlayHost.contentEditable = 'false';

		this.#preEl = document.createElement('pre');
		const codeEl = document.createElement('code');
		const language = this.#resolveLanguage(node);
		if (language)
		{
			codeEl.classList.add(`language-${language}`);
		}
		this.#preEl.append(codeEl);

		this.dom.append(this.#overlayHost, this.#preEl);
		this.contentDOM = codeEl;

		this.#vueApp = null;
		this.#vm = null;

		this.#mountOverlay();
		this.#bindEditorEvents();
	}

	#bindEditorEvents(): void
	{
		if (!this.editor || typeof this.editor.on !== 'function')
		{
			return;
		}

		this.onEditorState = () => this.#syncEditableState();
		this.editor.on('update', this.onEditorState);
		this.editor.on('transaction', this.onEditorState);
	}

	#unbindEditorEvents(): void
	{
		if (!this.editor || typeof this.editor.off !== 'function' || !this.onEditorState)
		{
			return;
		}

		this.editor.off('update', this.onEditorState);
		this.editor.off('transaction', this.onEditorState);
		this.onEditorState = null;
	}

	#syncEditableState(): void
	{
		if (!this.#vm)
		{
			return;
		}

		const isEditable = Boolean(this.editor?.isEditable);
		if (this.#vm.isEditable !== isEditable)
		{
			this.#vm.isEditable = isEditable;
		}
	}

	#resolveLanguage(node: Object): string
	{
		const lang = node?.attrs?.language;

		return Type.isStringFilled(lang) ? lang : DEFAULT_LANGUAGE;
	}

	#mountOverlay(): void
	{
		const initialLanguage = this.#resolveLanguage(this.node);
		const initialEditable = Boolean(this.editor?.isEditable);
		const onLanguageSelect = (id: string) => this.#changeLanguage(id);
		const onCopy = (ack: Function) => this.#copyContent(ack);

		this.#vueApp = BitrixVue.createApp({
			components: {
				NoteCodeBlockOverlay,
			},
			data: () => ({
				language: initialLanguage,
				isEditable: initialEditable,
			}),
			methods: {
				onLanguageSelect,
				onCopy,
			},
			// language=Vue
			template: `
				<NoteCodeBlockOverlay
					:language="language"
					:is-editable="isEditable"
					@language-select="onLanguageSelect"
					@copy="onCopy"
				/>
			`,
		});

		this.#vm = this.#vueApp.mount(this.#overlayHost);
	}

	#changeLanguage(language: string): void
	{
		const pos = this.#resolvePos();
		if (pos === null)
		{
			return;
		}

		if (this.node?.attrs?.language === language)
		{
			return;
		}

		const view = this.editor?.view;
		if (!view)
		{
			return;
		}

		const tr = view.state.tr.setNodeMarkup(pos, undefined, {
			...this.node.attrs,
			language,
		});
		view.dispatch(tr);
	}

	async #copyContent(ack: Function): Promise<void>
	{
		const text = this.node?.textContent ?? '';
		let success = false;

		try
		{
			if (navigator?.clipboard?.writeText)
			{
				await navigator.clipboard.writeText(text);
				success = true;
			}
			else
			{
				success = this.#fallbackCopy(text);
			}
		}
		catch
		{
			success = this.#fallbackCopy(text);
		}

		if (Type.isFunction(ack))
		{
			ack(success);
		}
	}

	#fallbackCopy(text: string): boolean
	{
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.top = '-1000px';
		textarea.style.left = '-1000px';
		document.body.append(textarea);
		textarea.select();

		let ok = false;
		try
		{
			ok = document.execCommand('copy');
		}
		catch
		{
			ok = false;
		}

		textarea.remove();

		return ok;
	}

	#resolvePos(): number | null
	{
		if (!Type.isFunction(this.getPos))
		{
			return null;
		}

		const pos = this.getPos();

		return Number.isInteger(pos) && pos >= 0 ? pos : null;
	}

	update(node: Object): boolean
	{
		if (node.type !== this.node.type)
		{
			return false;
		}

		const prevLanguage = this.#resolveLanguage(this.node);
		const nextLanguage = this.#resolveLanguage(node);
		this.node = node;

		if (prevLanguage !== nextLanguage)
		{
			const codeEl = this.contentDOM;
			if (codeEl)
			{
				codeEl.classList.remove(`language-${prevLanguage}`);
				if (nextLanguage)
				{
					codeEl.classList.add(`language-${nextLanguage}`);
				}
			}

			if (this.#vm)
			{
				this.#vm.language = nextLanguage;
			}
		}

		const isEditable = Boolean(this.editor?.isEditable);
		if (this.#vm && this.#vm.isEditable !== isEditable)
		{
			this.#vm.isEditable = isEditable;
		}

		return true;
	}

	ignoreMutation(mutation: MutationRecord): boolean
	{
		if (!mutation || !mutation.target)
		{
			return true;
		}

		if (this.contentDOM && this.contentDOM.contains(mutation.target))
		{
			return false;
		}

		return true;
	}

	stopEvent(event: Event): boolean
	{
		const target = event?.target;
		if (!(target instanceof Node))
		{
			return false;
		}

		return this.#overlayHost.contains(target);
	}

	destroy(): void
	{
		this.#unbindEditorEvents();
		this.#vueApp?.unmount?.();
		this.#vueApp = null;
		this.#vm = null;
	}
}
