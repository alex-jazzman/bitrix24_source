import { Dom, Event } from 'main.core';

export type TableStretcherNodes = {
	root: HTMLElement,
	container: HTMLElement,
	table: HTMLTableElement,
	/** The foot of the grid; whatever it draws is height the table may not take. */
	panels: HTMLElement,
};

/**
 * An empty table reaching down to the bottom of the window, and the word it draws held in the frame.
 *
 * A list with no rows would be a white strip under the head with the page showing below it, so the
 * table is given the height left down to the bottom of the window, less what the window has already
 * spent on the insets of everything the grid stands inside and on the foot of the grid.
 *
 * The cell the word of an empty list stands in is as wide as the table, so a table walked sideways
 * would carry the word out of the frame; it is held at the width of the grid and moved with the
 * scroll.
 *
 * Carried over from `Grid::adjustEmptyTable` of the platform grid, whose script is not loaded on
 * this path. Its class of an empty grid is written by the table itself, and hiding the foot of a
 * first page is what the foot of this grid does on its own.
 *
 * Every table gets a stretcher of its own and it holds its listener only while its table stands.
 */
export class TableStretcher
{
	#nodes: TableStretcherNodes | null = null;
	#block: HTMLElement | null = null;

	#handleScroll = (): void => {
		this.#holdBlockInFrame();
	};

	start(nodes: TableStretcherNodes): void
	{
		this.#nodes = nodes;

		Event.bind(nodes.container, 'scroll', this.#handleScroll, { passive: true });
	}

	destroy(): void
	{
		const nodes = this.#nodes;
		if (!nodes)
		{
			return;
		}

		Event.unbind(nodes.container, 'scroll', this.#handleScroll, { passive: true });

		this.#nodes = null;
		this.#block = null;
	}

	/** The table draws an empty row, and `block` is the word standing in its cell. */
	stretch(block: HTMLElement): void
	{
		const nodes = this.#nodes;
		if (!nodes)
		{
			return;
		}

		this.#block = block;

		const place = Dom.getPosition(nodes.root);

		// the list of the drafts stands hidden until the screen is switched to it, and a grid that is
		// not drawn has nothing to measure against the window
		if (place.height === 0)
		{
			Dom.style(nodes.table, 'min-height', null);

			return;
		}

		const windowBottom = window.scrollY + window.innerHeight;
		const roomLeft = windowBottom - place.top - nodes.panels.offsetHeight - this.#paddingOffset();

		Dom.style(nodes.table, 'min-height', `${Math.max(0, roomLeft)}px`);
		Dom.style(block, 'width', `${nodes.root.offsetWidth}px`);
		this.#holdBlockInFrame();
	}

	/** The table draws rows again and answers for its own height. */
	release(): void
	{
		const nodes = this.#nodes;
		if (!nodes || !this.#block)
		{
			return;
		}

		Dom.style(nodes.table, 'min-height', null);
		Dom.style(this.#block, 'width', null);
		Dom.style(this.#block, 'transform', null);

		this.#block = null;

		// a table let go of keeps in Chrome the height it was stretched to, and writing a height of its
		// own is what makes it measure itself again (`grid.js:836`)
		Dom.style(nodes.table, 'height', '1px');
		requestAnimationFrame((): void => {
			Dom.style(this.#nodes?.table, 'height', '1px');
		});
	}

	#holdBlockInFrame(): void
	{
		const nodes = this.#nodes;
		if (!nodes || !this.#block)
		{
			return;
		}

		Dom.style(this.#block, 'transform', `translate3d(${nodes.container.scrollLeft}px, 0px, 0)`);
	}

	/** The insets of everything the grid stands inside: height the window has already spent. */
	#paddingOffset(): number
	{
		let offset = 0;
		let parent = this.#nodes?.root.parentElement ?? null;

		while (parent)
		{
			const style = getComputedStyle(parent);

			offset += (Number.parseFloat(style.paddingTop) || 0)
				+ (Number.parseFloat(style.paddingBottom) || 0)
			;
			parent = parent.parentElement;
		}

		return offset;
	}
}
