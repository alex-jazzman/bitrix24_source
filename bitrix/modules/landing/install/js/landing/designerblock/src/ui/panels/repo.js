import {Loc} from 'landing.loc';
import {A11y} from 'landing.ui.a11y';
import {Content} from 'landing.ui.panel.content';
import {Dom, Cache, Event, Tag} from 'main.core';

// The cards are only collected once the panel is on screen, and the wait for that is capped for the
// same reason the panel caps its own: `animationend` can be late, interrupted by a panel-to-panel
// transition, or never fire at all in a background tab.
const SHOW_ANIMATION_TIMEOUT = 600;

export type RepoElementType = {
	name: string,
	code: string,
	html: string,
	manifest: {
		nodes: {
			[selector: string]: {
				type: string
			}
		},
		style: {
			[selector: string]: {
				type: string
			}
		}
	}
};

export type RepoPanelOptions = {
	onElementSelect: (RepoElementType) => {}
};


export class RepoPanel extends Content
{
	constructor(options: RepoPanelOptions)
	{
		super('design_repo', {
			title: Loc.getMessage('LANDING_DESIGN_BLOCK_REPO_TITLE'),
			scrollAnimation: true
		});

		this.currentCategory = null;
		this.selectedOption = null;
		this.cache = new Cache.MemoryCache();
		this.onElementSelect = options.onElementSelect;

		this.renderTo(
			parent.document.body
			? parent.document.body
			: document.body
		);

		Dom.addClass(this.layout, 'landing-ui-panel-repo');
		Dom.attr(this.layout, 'data-testid', 'landing-designerblock-repo-panel');

		// The presets stand one under another in a single column: this is a list of choices, and
		// calling it a grid would promise a second dimension to walk that is not there - and oblige
		// the markup to rows that do not exist either.
		Dom.attr(this.content, {
			'role': 'listbox',
			'aria-label': Loc.getMessage('LANDING_DESIGN_BLOCK_REPO_GRID'),
			'data-testid': 'landing-designerblock-repo-list'
		});
		this.onOptionFocusInHandler = this.onOptionFocusIn.bind(this);
		Event.bind(this.content, 'focusin', this.onOptionFocusInHandler);
		this.cardsFocusZone = null;
		// The composite itself once it is built: the teardown of the panel runs where nothing can wait
		// for a promise - the document of the canvas is going away with the window it belongs to.
		this.readyCardsFocusZone = null;
		this.destroyed = false;
		this.initCardsFocusZone();

		// The panel is built with the designer and only then waits to be asked for, and what keeps it off
		// the screen until then is a transform: moved out of view it is still read and still walked. The
		// mark is put on here, taken off by show() and put back by hide(), so that neither a panel that
		// never opened nor one that has closed depends on an animation to be out of the walk.
		A11y.setHidden(this.layout, true);
	}

	// Roving-tabindex composite over the preset cards: one Tab stop enters the list, arrow keys
	// move between options. Cards added later are tracked by the FocusZone MutationObserver.
	initCardsFocusZone(): Promise
	{
		if (this.cardsFocusZone)
		{
			return this.cardsFocusZone;
		}

		this.cardsFocusZone = A11y.load()
			.then(({FocusZone}) => {
				// The canvas the panel was opened from can be gone before the extension arrives, and the
				// panel is taken down with it. A zone raised after that keeps an observer on the body of
				// the editor, which outlives everything here, and nothing holds it to deactivate it.
				if (this.destroyed)
				{
					return null;
				}

				const focusZone = new FocusZone(this.content, {
					focusInStrategy: 'first',
					focusableElementFilter: (element) => element.getAttribute('role') === 'option'
				});
				focusZone.activate();
				this.readyCardsFocusZone = focusZone;

				return focusZone;
			})
			.catch((error) => {
				this.cardsFocusZone = null;
				this.readyCardsFocusZone = null;
				console.warn('Failed to init designer block repo grid focus zone', error);

				return null;
			});

		return this.cardsFocusZone;
	}

	/**
	 * The panel is rendered into the body of the editor and lives as long as that document: it
	 * outlives the canvas it was opened from, while the designer is built anew on every opening of
	 * the slider. What has to go with the canvas is everything holding a reference back into it - the
	 * composite over the cards with the observer it keeps, the listener on the list, and the layout
	 * itself, which would otherwise be left standing in the document of the editor.
	 */
	destroy()
	{
		// Read by the raising of the composite, which can still be waiting for the extension: the flag
		// is what tells a zone arriving late that there is nothing left for it to watch.
		this.destroyed = true;

		if (this.readyCardsFocusZone)
		{
			this.readyCardsFocusZone.deactivate();
			this.readyCardsFocusZone = null;
		}
		this.cardsFocusZone = null;

		Event.unbind(this.content, 'focusin', this.onOptionFocusInHandler);
		this.onOptionFocusInHandler = null;
		this.selectedOption = null;

		this.remove();
	}

	/**
	 * A list of choices that never says which one is current announces the names and no state. The
	 * selection follows the walk - the option the keyboard stands on is the selected one - and exactly
	 * one option carries it at a time.
	 */
	onOptionFocusIn(event: FocusEvent)
	{
		// The panel is rendered into the document of the editor while this code runs in the document of
		// the canvas, so `instanceof` against the local `Element` is a question about the wrong realm.
		// What is asked instead is whether the target can answer `closest`.
		const target = event.target;
		const option = (target && typeof target.closest === 'function')
			? target.closest('[role="option"]')
			: null;
		if (!option)
		{
			return;
		}

		// The one card that carries the state is remembered rather than looked for among all of them.
		// A card is built once and lives as long as the panel, and every new card starts at `false`,
		// so a remembered card that left the list would only ever take a write that changes nothing.
		if (this.selectedOption && this.selectedOption !== option)
		{
			Dom.attr(this.selectedOption, 'aria-selected', 'false');
		}

		this.selectedOption = option;
		Dom.attr(option, 'aria-selected', 'true');
	}

	/**
	 * The composite is raised on a panel that is still hidden, and nothing inside a hidden layout
	 * counts as focusable: the set it manages starts out empty, so no card gets the entry tabindex
	 * and the arrows have nothing to walk. The set is collected again once the panel is on screen -
	 * the observer of the zone watches the grid itself and never learns that an ancestor of it
	 * stopped being hidden.
	 */
	show(options?: any): Promise
	{
		// Before the layout starts moving in, and before the panel takes the focus into itself at the end
		// of that: an inert subtree has nothing to give the focus to.
		A11y.setHidden(this.layout, false);

		const showing = super.show(options);
		let showTimeout = null;
		const shown = new Promise((resolve) => {
			showTimeout = setTimeout(resolve, SHOW_ANIMATION_TIMEOUT);
		});

		void Promise.all([Promise.race([showing, shown]), this.initCardsFocusZone()])
			.then(([, focusZone]) => {
				if (focusZone)
				{
					focusZone.refreshElements();
				}
			})
			// The only failure of this chain is the focus zone, and initCardsFocusZone() warns about it.
			.catch(() => {})
			.finally(() => {
				clearTimeout(showTimeout);
			});

		return showing;
	}

	/**
	 * The other half of what show() does, and it cannot be left to the panel below: what takes a closed
	 * panel off the screen is an animation of another module, and `animationend` can be late,
	 * interrupted by a panel-to-panel transition or never fire at all in a background tab. Left to it,
	 * a panel that has been open once stays in the walk and in the accessibility tree - and now says so
	 * itself, since show() wrote `aria-hidden="false"` on it.
	 *
	 * The mark goes on after the focus has left: an inert subtree holding the focus hands it to the
	 * body of the document instead of to the control the panel was opened from.
	 */
	hide(): Promise
	{
		return super.hide().then((result) => {
			A11y.setHidden(this.layout, true);

			return result;
		});
	}

	addRepository(repository: Array<RepoElementType>)
	{
		repository.map(item => {
			this.addElement(item);
		});
	}

	makeElementUnique(element: RepoElementType): RepoElementType
	{
		const newManifest = {};
		const newStyleManifest = {};
		const origNodes = element.manifest.nodes;
		Object.keys(element.manifest.nodes).map(selector => {
			const randPostfix = '-' + this.randomNum(1000, 9999);
			const className = selector.substring(1);
			element.html = element.html.replaceAll(new RegExp(className + '([\\s"]{1})', 'g'), className + randPostfix + '$1');
			newManifest[selector + randPostfix] = element.manifest.nodes[selector];
			if (element.manifest.style && selector in element.manifest.style)
			{
				newStyleManifest[selector + randPostfix] = element.manifest.style[selector];
			}
		});
		element.manifest.nodes = newManifest;
		if (element.manifest.style)
		{
			Object.keys(element.manifest.style).map(selector => {
				if (selector in origNodes)
				{
					return;
				}
				const randPostfix = '-' + this.randomNum(1000, 9999);
				const className = selector.substring(1);
				element.html = element.html.replaceAll(new RegExp(className + '([\\s"]{1})', 'g'), className + randPostfix + '$1');
				newStyleManifest[selector + randPostfix] = element.manifest.style[selector];
			});
			element.manifest.style = newStyleManifest;
		}
		return element;
	}

	addElement(element: RepoElementType)
	{
		const nodeCard = new BX.Landing.UI.Card.BlockPreviewCard({
			title: element.name,
			image: '/bitrix/images/landing/designerblock/presets/' + element .code + '.jpg',
			role: 'option',
			onClick: () => {
				this.onElementSelect(this.makeElementUnique(element));
				void this.hide();
			}
		});
		// An option with no state at all is read as a name and nothing else; the one the keyboard
		// reaches turns this into `true`.
		Dom.attr(nodeCard.layout, 'aria-selected', 'false');
		Dom.attr(nodeCard.layout, 'data-testid', 'landing-designerblock-repo-card');
		this.appendCard(nodeCard);
	}

	randomNum(min: number, max: number): number
	{
		return parseInt(Math.random() * (max - min) + min);
	}

	getListContainer(): HTMLDivElement
	{
		return this.cache.remember('listContainer', () => {
			return Tag.render`<div class="landing-ui-field-layer-list-container"></div>`;
		});
	}
}
