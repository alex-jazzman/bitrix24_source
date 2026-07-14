import { Loc } from 'main.core';
import { copyTextToClipboard } from '../utils/clipboard';
import { animateCollapse, cancelCollapseAnimation } from '../utils/heading-collapse-animator';
import { isPlainHeadingContext, resolveHeadingContainer } from '../utils/heading-slug';

const HEADING_TAGS = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4' };
const DEFAULT_LEVEL = 2;

function resolveLevel(node: Object): number
{
	const level = Number(node?.attrs?.level);

	return level >= 1 && level <= 4 ? level : DEFAULT_LEVEL;
}

function isMobileLayout(): boolean
{
	return typeof document !== 'undefined'
		&& document.documentElement.classList.contains('note-mobile');
}

// Plain ProseMirror NodeView for headings: a wrapper around the editable heading
// element (`contentDOM`) plus a non-editable gutter holding the anchor controls.
// No `@tiptap/vue-3` here — the codebase builds NodeViews as plain classes.
export class HeadingBlockNodeView
{
	node: Object;
	editor: Object;
	getPos: () => number | void;
	documentId: number;
	dom: HTMLElement;
	contentDOM: HTMLElement;
	gutter: HTMLElement | null;
	hashButton: HTMLButtonElement | null;
	toggleButton: HTMLButtonElement | null;
	#animating: boolean;
	#plain: boolean;

	constructor({ node, editor, getPos, documentId }: {
		node: Object,
		editor: Object,
		getPos: () => number | void,
		documentId: number | string | null,
	})
	{
		this.node = node;
		this.editor = editor;
		this.getPos = getPos;
		this.documentId = Number(documentId) || 0;
		this.#animating = false;
		this.#plain = this.#resolvePlain();

		const level = resolveLevel(node);

		this.dom = document.createElement('div');
		this.dom.className = 'note-heading';
		this.dom.setAttribute('data-level', String(level));

		this.contentDOM = document.createElement(HEADING_TAGS[level] ?? HEADING_TAGS[DEFAULT_LEVEL]);
		this.contentDOM.className = 'note-heading__text';

		// Headings inside a table, blockquote or callout stay plain: they are
		// decorative section structure, not foldable document sections, so they
		// carry neither the anchor (link) control nor the collapse chevron and take
		// no part in the collapse mask. The anchor id decoration still applies, so
		// existing direct links keep working.
		if (this.#plain)
		{
			this.gutter = null;
			this.hashButton = null;
			this.toggleButton = null;
			this.dom.appendChild(this.contentDOM);

			return;
		}

		this.gutter = document.createElement('div');
		this.gutter.className = 'note-heading__gutter';
		this.gutter.contentEditable = 'false';

		this.hashButton = this.#createHashButton();
		this.toggleButton = this.#createToggleButton();
		// The chevron stays in the left gutter on every layout.
		this.gutter.appendChild(this.toggleButton);

		// On touch there is no hover: a tap on the heading reveals the controls
		// (mirroring web hover). It never toggles collapse (see #onHeadingClick).
		this.contentDOM.addEventListener('click', (event) => this.#onHeadingClick(event));

		this.dom.appendChild(this.gutter);
		this.dom.appendChild(this.contentDOM);

		// On the web the link icon sits next to the chevron in the left gutter.
		// On mobile it trails the heading text (revealed by a tap on the heading).
		if (isMobileLayout())
		{
			this.hashButton.contentEditable = 'false';
			this.dom.appendChild(this.hashButton);
		}
		else
		{
			this.gutter.insertBefore(this.hashButton, this.toggleButton);
		}

		this.#applyCollapsedState();
	}

	#createHashButton(): HTMLButtonElement
	{
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'note-heading__hash';

		const icon = document.createElement('div');
		// Chain/link glyph — the control copies a link to the heading. A little
		// larger on mobile, where it trails the heading text.
		icon.className = 'ui-icon-set --link-3';
		icon.style.setProperty('--ui-icon-set__icon-size', isMobileLayout() ? '20px' : '16px');
		icon.style.setProperty('--ui-icon-set__icon-color', 'currentColor');
		button.appendChild(icon);

		const label = Loc.getMessage('NOTE_EDITOR_HEADING_COPY_ANCHOR');
		button.title = label;
		button.setAttribute('aria-label', label);
		// Keep the editor selection intact when interacting with the control.
		button.addEventListener('mousedown', (event) => event.preventDefault());
		button.addEventListener('click', (event) => this.#onCopyAnchor(event));

		return button;
	}

	#createToggleButton(): HTMLButtonElement
	{
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'note-heading__toggle';
		const label = Loc.getMessage('NOTE_EDITOR_HEADING_TOGGLE_COLLAPSE');
		button.title = label;
		button.setAttribute('aria-label', label);

		const icon = document.createElement('div');
		// Same glyph the sidebar disclosure uses (see BIcon "chevron-right-l").
		icon.className = 'ui-icon-set --chevron-right-l';
		icon.style.setProperty('--ui-icon-set__icon-size', '16px');
		icon.style.setProperty('--ui-icon-set__icon-color', 'var(--ui-color-accent-main-primary)');
		button.appendChild(icon);

		button.addEventListener('mousedown', (event) => event.preventDefault());
		button.addEventListener('click', (event) => this.#onToggle(event));

		return button;
	}

	#applyCollapsedState(): void
	{
		const collapsed = Boolean(this.node.attrs?.collapsed);
		this.dom.setAttribute('data-collapsed', collapsed ? 'true' : 'false');
		this.toggleButton.classList.toggle('is-expanded', !collapsed);
		this.toggleButton.setAttribute('aria-expanded', String(!collapsed));
	}

	#resolvePos(): number | null
	{
		const pos = typeof this.getPos === 'function' ? this.getPos() : null;

		return Number.isInteger(pos) && pos >= 0 ? pos : null;
	}

	// A move between a plain container (table/blockquote/callout) and the top
	// level recreates the node view (remove+insert), so resolving once in the
	// constructor is enough.
	#resolvePlain(): boolean
	{
		const doc = this.editor?.state?.doc;
		const pos = this.#resolvePos();
		if (!doc || pos === null)
		{
			return false;
		}

		return isPlainHeadingContext(doc.resolve(pos));
	}

	// Sibling blocks following this heading inside its own container, up to the
	// next heading of the same or shallower level — the ones the collapse mask
	// hides. Bounded by the container end so a heading nested in a blockquote/
	// callout folds only within it, matching the decoration range (see sectionEnd
	// in heading-anchor-plugin); an outer heading still gets its nested container
	// as one block of the iteration.
	#collectFollowingBlocks(headingPos: number): HTMLElement[]
	{
		const view = this.editor?.view;
		const doc = this.editor?.state?.doc;
		if (!view || !doc)
		{
			return [];
		}

		const headingNode = doc.nodeAt(headingPos);
		if (!headingNode)
		{
			return [];
		}

		const level = resolveLevel(headingNode);
		const blocks = [];
		let pos = headingPos + headingNode.nodeSize;
		const end = resolveHeadingContainer(doc, headingPos).containerEnd;

		while (pos < end)
		{
			const node = doc.nodeAt(pos);
			if (!node)
			{
				break;
			}

			if (node.type.name === this.node.type.name && resolveLevel(node) <= level)
			{
				break;
			}

			const dom = view.nodeDOM(pos);
			if (dom instanceof HTMLElement)
			{
				blocks.push(dom);
			}

			pos += node.nodeSize;
		}

		return blocks;
	}

	#onToggle(event: MouseEvent): void
	{
		event.preventDefault();
		event.stopPropagation();
		void this.#toggleCollapsed();
	}

	// A heading click never toggles collapse. On touch (no hover) a tap reveals
	// the heading's controls — the link icon and the collapse chevron — the way
	// hovering does on the web (collapsed headings included). Desktop uses hover.
	#onHeadingClick(event: MouseEvent): void
	{
		if (!isMobileLayout() || this.editor?.isEditable)
		{
			return;
		}

		// Don't hijack taps on links inside the heading.
		if (event.target instanceof Element && event.target.closest('a'))
		{
			return;
		}

		this.dom.classList.toggle('is-revealed');
	}

	async #toggleCollapsed(): Promise<void>
	{
		if (this.#animating)
		{
			return;
		}

		const pos = this.#resolvePos();
		if (pos === null)
		{
			return;
		}

		const collapsing = !Boolean(this.node.attrs?.collapsed);
		const blocks = this.#collectFollowingBlocks(pos);

		// Toggling resets the mobile reveal so the next state starts clean.
		this.dom.classList.remove('is-revealed');

		// Immediate chevron feedback; update() reconciles once the attr changes.
		this.toggleButton.classList.toggle('is-expanded', !collapsing);
		this.toggleButton.setAttribute('aria-expanded', String(!collapsing));
		this.dom.setAttribute('data-collapsed', collapsing ? 'true' : 'false');

		if (blocks.length === 0)
		{
			this.editor.commands.setHeadingCollapsed(pos, collapsing);

			return;
		}

		this.#animating = true;
		try
		{
			if (collapsing)
			{
				await animateCollapse(blocks, { collapsing: true });
				this.editor.commands.setHeadingCollapsed(this.#resolvePos() ?? pos, true);
				blocks.forEach(cancelCollapseAnimation);
			}
			else
			{
				// Reveal first so the natural height can be measured, then animate up.
				this.editor.commands.setHeadingCollapsed(this.#resolvePos() ?? pos, false);
				await animateCollapse(blocks, { collapsing: false });
			}
		}
		finally
		{
			this.#animating = false;
		}
	}

	#onCopyAnchor(event: MouseEvent): void
	{
		event.preventDefault();
		event.stopPropagation();

		const slug = this.dom.getAttribute('id') || '';
		if (slug === '' || this.documentId <= 0 || typeof window === 'undefined')
		{
			return;
		}

		const url = `${window.location.origin}/note/document/${this.documentId}/#${slug}`;
		void copyTextToClipboard(url).then((copied) => {
			if (copied && window.BX?.UI?.Notification?.Center)
			{
				window.BX.UI.Notification.Center.notify({
					content: Loc.getMessage('NOTE_EDITOR_HEADING_ANCHOR_COPIED'),
					position: 'top-right',
				});
			}
		});
	}

	update(node: Object): boolean
	{
		if (node.type !== this.node.type)
		{
			return false;
		}

		// A level change swaps the heading tag — let ProseMirror recreate the view.
		if (resolveLevel(node) !== resolveLevel(this.node))
		{
			return false;
		}

		this.node = node;
		// While a local toggle animates, the optimistic chevron state is already
		// correct — don't let an interim update flip it back.
		if (!this.#plain && !this.#animating)
		{
			this.#applyCollapsedState();
		}

		return true;
	}

	stopEvent(event: Event): boolean
	{
		if (!(event.target instanceof Node))
		{
			return false;
		}

		return Boolean(this.gutter?.contains(event.target))
			|| Boolean(this.hashButton?.contains(event.target));
	}

	ignoreMutation(mutation: Object): boolean
	{
		if (mutation.type === 'selection')
		{
			return false;
		}

		return !(mutation.target instanceof Node) || !this.contentDOM.contains(mutation.target);
	}
}
