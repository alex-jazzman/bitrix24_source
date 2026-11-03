import { Dom, Tag, Type, Event } from 'main.core';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import { FocusKeys, FocusZone } from 'ui.a11y';
import { computed, type ReadonlySignal } from 'ui.lexical.extension';

import { getAriaMessage } from '../helpers/aria-message';
import { type TextEditor } from '../text-editor';
import { type ToolbarOptions, type ToolbarItem } from '../types/toolbar-options';
import { Button } from './button';
import { type SelectionState } from './selection-state';
import { Separator } from './separator';
import { type ToolbarItem as ToolbarItemInstance } from './toolbar-item';

import './toolbar.css';

export class Toolbar
{
	#textEditor: TextEditor = null!;
	#testId: string = '';
	#items: ToolbarItemInstance[] = [];
	#rendered: boolean = false;
	#moreBtn: Button | null = null;
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#resizeObserver: ResizeObserver | null = null;
	#focusZone: FocusZone | null = null;
	#focusZoneRefreshed: boolean = false;
	#destroyed: boolean = false;
	#resetItemsAnimation: ((event: TransitionEvent) => void) | null = null;

	/**
	 * @param testId names this toolbar for tests: the container gets it as is, its items get
	 *   `{testId}-{item}`. The main and the floating toolbar are both a `Toolbar`, so a shared item
	 *   would otherwise carry the same test id in both of them.
	 */
	constructor(textEditor: TextEditor, options: ToolbarOptions, testId: string)
	{
		this.#textEditor = textEditor;
		this.#testId = testId;

		const toolbarOptions: ToolbarOptions = Type.isArray(options) ? options : [];
		this.#fillFromOptions(toolbarOptions);

		if (this.#items.length > 0)
		{
			this.#resizeObserver = new ResizeObserver(this.#handleResize.bind(this));
		}
	}

	renderTo(container: HTMLElement): void
	{
		if (this.isRendered())
		{
			return;
		}

		if (Type.isElementNode(container))
		{
			this.#items.forEach((item: ToolbarItemInstance) => {
				Dom.append(item.render(), this.getItemsContainer());
			});

			Dom.append(this.getContainer(), container);

			if (this.#resizeObserver !== null)
			{
				this.#resizeObserver.observe(this.getContainer());
			}

			// A toolbar is a single stop in the tab order, arrows move between its buttons. The zone
			// keeps track of disabled and inert buttons on its own, so nothing here has to tell it
			// about a selection change or a collapsed row.
			this.#focusZone = new FocusZone(this.getContainer(), {
				bindKeys: FocusKeys.ArrowHorizontal | FocusKeys.HomeAndEnd,
				focusOutBehavior: 'wrap',
			});
			this.#focusZone.activate();

			this.#rendered = true;
		}
	}

	isEmpty(): boolean
	{
		return this.#items.length === 0;
	}

	getContainer(): HTMLElement
	{
		return this.#refs.remember('container', () => {
			const container: HTMLElement = Tag.render`
				<div
					class="ui-text-editor-toolbar-container"
					role="toolbar"
					data-testid="${this.#testId}"
				>
					${this.getItemsContainer()}
					${this.getMoreBtnContainer()}
				</div>
			`;

			Dom.attr(container, 'aria-label', getAriaMessage('TEXT_EDITOR_TOOLBAR_ARIA'));

			return container;
		});
	}

	getItemsContainer(): HTMLElement
	{
		return this.#refs.remember('items-container', () => {
			return Tag.render`
				<div class="ui-text-editor-toolbar-items"></div>
			`;
		});
	}

	getMoreBtnContainer(): HTMLElement
	{
		return this.#refs.remember('more-btn-container', () => {
			return Tag.render`
				<div class="ui-text-editor-toolbar-more-btn">
				${this.getMoreBtn().render()}
				</div>
			`;
		});
	}

	getMoreBtn(): Button
	{
		if (this.#moreBtn === null)
		{
			// transitionend bubbles: every button inside the rows sends one, and ending the
			// animation on a button's event measures a layout that has not settled yet
			const resetAnimation = (event: TransitionEvent) => {
				if (this.#destroyed || event.target !== this.getItemsContainer())
				{
					return;
				}

				this.#unbindItemsAnimation();
				Dom.style(this.getItemsContainer(), 'height', null);
				Dom.removeClass(this.getItemsContainer(), '--animating');
				// only now the rows have their final height, so which of them are cut off is known
				this.#syncClippedItems();
			};

			this.#resetItemsAnimation = resetAnimation;

			this.#moreBtn = new Button();
			this.#moreBtn.setContent('<span class="ui-text-editor-toolbar-more-btn-icon"></span>');
			this.#moreBtn.setTooltip(getAriaMessage('TEXT_EDITOR_TOOLBAR_MORE'));
			// an in-flow disclosure, neither a menu nor a dialog: aria-expanded is enough
			this.#moreBtn.setExpanded(false);
			this.#moreBtn.subscribe('onClick', (): void => {
				this.#unbindItemsAnimation();

				const willExpand = !Dom.hasClass(this.getContainer(), '--expanded');
				this.getMoreBtn().setExpanded(willExpand);

				if (Dom.hasClass(this.getContainer(), '--expanded'))
				{
					Dom.style(this.getItemsContainer(), { height: `${this.getItemsContainer().scrollHeight}px` });
					requestAnimationFrame(() => {
						// destroy() drops the ref cache, so a frame that outlives it has nothing to reach
						if (this.#destroyed)
						{
							return;
						}

						Dom.removeClass(this.getContainer(), '--expanded');
						Dom.addClass(this.getItemsContainer(), '--animating');
						Dom.style(this.getItemsContainer(), 'height', null);
					});
				}
				else
				{
					Dom.addClass(this.getItemsContainer(), '--animating');
					Dom.style(this.getItemsContainer(), { height: `${this.getItemsContainer().scrollHeight}px` });
					Dom.addClass(this.getContainer(), '--expanded');
					// the rows are on their way in, so they become reachable right away rather
					// than only once the transition ends
					this.#syncClippedItems();
				}

				Event.bind(this.getItemsContainer(), 'transitionend', resetAnimation);
			});
		}

		return this.#moreBtn!;
	}

	getItems(): ToolbarItemInstance[]
	{
		return this.#items;
	}

	isRendered(): boolean
	{
		return this.#rendered;
	}

	/** idempotent: the rows may be folded and unfolded many times, and destroy() has to unbind too */
	#unbindItemsAnimation(): void
	{
		if (this.#resetItemsAnimation !== null && this.isRendered())
		{
			Event.unbind(this.getItemsContainer(), 'transitionend', this.#resetItemsAnimation);
		}
	}

	destroy(): void
	{
		this.#unbindItemsAnimation();
		this.#resetItemsAnimation = null;
		this.#destroyed = true;

		if (this.#resizeObserver !== null)
		{
			this.#resizeObserver.disconnect();
			this.#resizeObserver = null;
		}

		if (this.#focusZone !== null)
		{
			this.#focusZone.deactivate();
			this.#focusZone = null;
		}

		if (this.isRendered())
		{
			Dom.remove(this.getContainer());
		}

		this.#items.forEach((item: ToolbarItemInstance): void => {
			item.destroy();
		});

		if (this.#moreBtn !== null)
		{
			this.#moreBtn.destroy();
		}

		this.#items = null!;
		this.#refs = null!;
	}

	#fillFromOptions(options: ToolbarOptions)
	{
		options.forEach((item: ToolbarItem) => {
			if (item === '|')
			{
				this.#items.push(new Separator());
			}
			else
			{
				const toolbarItem: ToolbarItemInstance | null = this.#textEditor.getComponentRegistry().create(item);
				if (toolbarItem === null)
				{
					// eslint-disable-next-line no-console
					console.warn(`TextEditor Toolbar: "${item}" component doesn't exist.`);
				}
				else
				{
					toolbarItem.getContainer().dataset.testid = `${this.#testId}-${item}`;
					this.#items.push(toolbarItem);

					if (toolbarItem instanceof Button)
					{
						this.#bindReactiveState(toolbarItem);
					}
				}
			}
		});
	}

	#bindReactiveState(item: Button): void
	{
		const state = this.#textEditor.getSelectionState();
		const disabled = this.#resolveDisabledSignal(item, state);

		const format = item.getFormat();
		const blockType = item.getBlockType();
		let active: ReadonlySignal<boolean> | null = null;
		if (format !== null)
		{
			active = state.formatActive(format);
		}
		else if (blockType !== null)
		{
			active = state.blockTypeActive(blockType);
		}

		if (active !== null)
		{
			const source = active;
			item.bindActive(computed((): boolean => !disabled.value && source.value));
		}
	}

	/**
	 * Recomputes everything the buttons derive from the selection. Nothing inside the editor needs
	 * it — a document or selection change invalidates the snapshot on its own — but a button with
	 * its own disable callback can depend on state the editor never sees, and then only its owner
	 * knows that the answer changed.
	 */
	update(): void
	{
		this.#textEditor.getSelectionState().invalidate();
	}

	/**
	 * Returns the signal the button's disabled state follows from now on. A button that already
	 * took that state from a signal of its own keeps it, and keeps it first: binding a second
	 * source would leave two writers fighting over one attribute.
	 */
	#resolveDisabledSignal(item: Button, state: SelectionState): ReadonlySignal<boolean>
	{
		if (item.hasReactiveDisabled())
		{
			return item.getDisabledSignal()!;
		}

		if (item.hasOwnDisableCallback())
		{
			// the callback is opaque, so nothing finer than the two things that can change its
			// answer is available to depend on: the selection revision and the editable state
			const disabled = computed((): boolean => {
				void state.getRevisionSignal().value;
				void this.#textEditor.getEditableSignal().value;

				// reading the selection is the natural body of such a callback, and a computed is
				// evaluated wherever its first reader happens to be -- including the constructor,
				// long before any editor state is active
				return this.#textEditor.getEditorState().read((): boolean => item.invokeDisableCallback());
			});
			item.bindDisabled(disabled);

			return disabled;
		}

		const disabled = state.disabled(item.shouldDisableInsideUnformatted());
		item.bindDisabled(disabled);

		return disabled;
	}

	#handleResize(entries: ResizeObserverEntry[])
	{
		if (this.getContainer().offsetWidth === 0 || Dom.hasClass(this.getItemsContainer(), '--animating'))
		{
			return;
		}

		const lastItem: ToolbarItemInstance | null | undefined = this.#items.at(-1);
		if (!lastItem || lastItem.getContainer().offsetTop >= lastItem.getContainer().offsetHeight)
		{
			Dom.addClass(this.getContainer(), '--overflowed');
		}
		else
		{
			Dom.removeClass(this.getContainer(), ['--overflowed', '--expanded']);
			this.getMoreBtn().setExpanded(false);
		}

		this.#syncClippedItems();

		// renderTo() builds the toolbar before the editor itself joins the document, and a
		// disconnected button counts as unfocusable — the zone would start with an empty set and
		// never notice, because attaching the editor is no mutation inside the toolbar. The first
		// resize is the earliest point where the buttons are laid out for real, and from then on
		// the zone keeps itself current through its own mutation observer. Refreshing on every
		// tick instead would re-walk the container and re-measure every button on every frame of
		// a window drag.
		if (!this.#focusZoneRefreshed && this.#focusZone !== null)
		{
			this.#focusZoneRefreshed = true;
			this.#focusZone.refreshElements();
		}
	}

	/**
	 * A collapsed toolbar keeps only its first row visible and cuts the rest off with
	 * `overflow: hidden`. Clipped buttons stay in the DOM and would otherwise still take focus, so
	 * the caret would land on controls nobody can see. `inert` takes them out, and the focus zone
	 * picks the change up through its own mutation observer.
	 */
	#syncClippedItems(): void
	{
		const itemsContainer = this.getItemsContainer();
		const visibleHeight = itemsContainer.clientHeight;
		const isCollapsed = Dom.hasClass(this.getContainer(), '--overflowed')
			&& !Dom.hasClass(this.getContainer(), '--expanded');

		// every offset is read before any attribute is written: a write between two reads
		// invalidates the layout, so the next read pays for a synchronous reflow -- and this
		// whole method runs on every tick of the resize observer
		const clipped: boolean[] = this.#items.map((item: ToolbarItemInstance): boolean => {
			return isCollapsed && item.getContainer().offsetTop >= visibleHeight;
		});

		this.#items.forEach((item: ToolbarItemInstance, index: number): void => {
			const element = item.getContainer();
			if (clipped[index] === element.hasAttribute('inert'))
			{
				return;
			}

			Dom.attr(element, 'inert', clipped[index] ? '' : null);
		});
	}
}
