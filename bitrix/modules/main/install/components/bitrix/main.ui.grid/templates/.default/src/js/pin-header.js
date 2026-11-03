(function() {
	'use strict';

	BX.namespace('BX.Grid');

	/**
	 * BX.Grid.PinHeader
	 * @param {BX.Main.grid} parent
	 * @constructor
	 */
	BX.Grid.PinHeader = function(parent)
	{
		this.parent = null;
		this.table = null;
		this.header = null;
		this.container = null;
		this.parentNodeResizeObserver = null;
		this.scrollContainer = undefined;
		this.scrollFrame = null;

		const adminPanel = this.getAdminPanel();

		if (adminPanel)
		{
			this.mo = new MutationObserver(this.onAdminPanelMutation.bind(this));
			this.mo.observe(document.documentElement, { attributes: true });
		}

		this.init(parent);
	};

	BX.Grid.PinHeader.cloneCounter = 0;

	BX.Grid.PinHeader.prototype = {
		init(parent)
		{
			this.parent = parent;
			this.rect = BX.pos(this.parent.getHead());
			this.gridRect = BX.pos(this.parent.getTable());

			let workArea = BX.Grid.Utils.getBySelector(document, '#workarea-content', true);

			if (!workArea)
			{
				workArea = this.parent.getContainer().parentNode;
				workArea = workArea ? workArea.parentNode : workArea;
			}

			if (workArea)
			{
				this.parentNodeResizeObserver = new BX.ResizeObserver(BX.proxy(this.refreshRect, this));
				this.parentNodeResizeObserver.observe(workArea);
			}

			this.create(true);

			// `capture`, because a scroll event of an element does not bubble: without it
			// only the document scroll would be seen, and a grid given a height of its own
			// scrolls inside itself instead of growing the page.
			document.addEventListener(
				'scroll',
				BX.proxy(this._onScroll, this),
				BX.Grid.Utils.listenerParams({ passive: true, capture: true }),
			);
			document.addEventListener('resize', BX.proxy(this._onResize, this), BX.Grid.Utils.listenerParams({ passive: true }));
			BX.addCustomEvent('Grid::updated', BX.proxy(this._onGridUpdate, this));
			BX.addCustomEvent('Grid::resize', BX.proxy(this._onGridUpdate, this));
			BX.bind(window, 'resize', BX.proxy(this._onGridUpdate, this));
		},

		/**
		 * `BX.Main.grid#destroy` has always called this, so a grid with a pinned header
		 * used to throw on being destroyed. Left behind, the header keeps its listeners
		 * and answers scroll events by measuring a table that is no longer on the page.
		 */
		destroy()
		{
			document.removeEventListener(
				'scroll',
				BX.proxy(this._onScroll, this),
				BX.Grid.Utils.listenerParams({ passive: true, capture: true }),
			);
			document.removeEventListener('resize', BX.proxy(this._onResize, this), BX.Grid.Utils.listenerParams({ passive: true }));
			BX.removeCustomEvent('Grid::updated', BX.proxy(this._onGridUpdate, this));
			BX.removeCustomEvent('Grid::resize', BX.proxy(this._onGridUpdate, this));
			BX.unbind(window, 'resize', BX.proxy(this._onGridUpdate, this));

			this.parentNodeResizeObserver && this.parentNodeResizeObserver.disconnect();
			this.mo && this.mo.disconnect();

			if (this.scrollFrame)
			{
				cancelAnimationFrame(this.scrollFrame);
				this.scrollFrame = null;
			}

			BX.remove(this.getContainer());
			this.container = null;
			this.table = null;
		},

		refreshRect()
		{
			this.scrollContainer = undefined;
			this.gridRect = BX.pos(this.parent.getTable());
			this.rect = BX.pos(this.parent.getHead());
		},

		_onGridUpdate()
		{
			const isPinned = this.isPinned();

			BX.remove(this.getContainer());
			this.create();

			isPinned && this.pin();

			this.refreshRect();

			this.adjustPosition();

			BX.onCustomEvent(window, 'Grid::headerUpdated', []);
		},

		create(async)
		{
			const cells = BX.Grid.Utils.getByTag(this.parent.getHead(), 'th');
			const cloneThead = BX.clone(this.parent.getHead());
			const cloneCells = BX.Grid.Utils.getByTag(cloneThead, 'th');

			// The resize handles are registered from this very clone (see Resize.getPinnedTableButtons),
			// so they stay operable for the pointer while the rest of the copy is taken out of the way.
			// The class is read defensively: `create` is reachable with a parent that carries the
			// markup but no settings, and a missing selector only means no exception is made.
			const resizeButtonClass = this.parent.settings?.get('classResizeButton');

			BX.Grid.Utils.hideFromAssistiveTech(cloneThead, resizeButtonClass ? `.${resizeButtonClass}` : undefined);

			// The clone is a copy of the head down to its ids, so without this the page would
			// carry every id of the head twice while the pinned header is on it. The counter
			// keeps the prefix unique across the clones this header goes through on updates.
			BX.Grid.Utils.makeCloneIdsUnique(cloneThead, `main-grid-pinned-${++BX.Grid.PinHeader.cloneCounter}-`);

			const resizeCloneCells = function()
			{
				cells.forEach(
					(cell, index) => {
						let width = BX.width(cell);

						if (index > 0)
						{
							width -= parseInt(BX.style(cell, 'border-left-width'));
							width -= parseInt(BX.style(cell, 'border-right-width'));
						}

						cloneCells[index].firstElementChild && (cloneCells[index].firstElementChild.style.width = `${width}px`);

						if (cells.length - 1 > index)
						{
							cloneCells[index].style.width = `${width}px`;
						}
					},
				);
			};

			async ? setTimeout(resizeCloneCells, 0) : resizeCloneCells();

			this.container = BX.decl({
				block: 'main-grid-fixed-bar',
				mix: 'main-grid-fixed-top',
				attrs: {
					style: `width: ${BX.width(this.parent.getContainer())}px`,
				},
				content: {
					block: 'main-grid-table',
					tag: 'table',
					content: cloneThead,
				},
			});

			this.container.hidden = true;
			this.table = null;

			// Appended after the live table on purpose: `getHead` takes the first `thead` of
			// the grid, so inserting the clone before it would make the clone the head.
			this.parent.getWrapper().appendChild(this.container);

			this.adjustHorizontalPosition();
		},

		/**
		 * The clone is a fresh node sitting at the left edge, while the table it heads keeps
		 * whatever horizontal offset the user scrolled it to. Every rebuild - "show more",
		 * sorting, a cancelled group edit - therefore has to carry that offset over, or the
		 * titles end up over the wrong columns.
		 *
		 * The fader positions the clone the same way, but only when it hears `Grid::updated`,
		 * and a rebuild does not always come with one. Placing the clone is part of building
		 * it, so the header does it itself.
		 */
		adjustHorizontalPosition()
		{
			const scrollContainer = this.parent.getScrollContainer();
			const fixedTable = this.getFixedTable();

			if (!scrollContainer || !fixedTable)
			{
				return;
			}

			BX.Grid.Utils.styleForEach([fixedTable], {
				'margin-left': `${-scrollContainer.scrollLeft}px`,
			});
		},

		getContainer()
		{
			return this.container;
		},

		getFixedTable()
		{
			return this.table || (this.table = BX.Grid.Utils.getByTag(this.getContainer(), 'table', true));
		},

		getAdminPanel()
		{
			if (BX.Type.isUndefined(this.adminPanel))
			{
				this.adminPanel = document.querySelector('.adm-header');
			}

			return this.adminPanel;
		},

		isAdminPanelPinned()
		{
			return BX.hasClass(document.documentElement, 'adm-header-fixed');
		},

		getPinOffset()
		{
			const adminPanel = this.getAdminPanel();

			if (adminPanel && this.isAdminPanelPinned())
			{
				return BX.Text.toNumber(BX.style(adminPanel, 'height'));
			}

			return 0;
		},

		pin()
		{
			const container = this.getContainer();

			if (container)
			{
				container.hidden = false;
			}

			BX.onCustomEvent(window, 'Grid::headerPinned', []);
		},

		unpin()
		{
			const container = this.getContainer();

			if (container)
			{
				container.hidden = true;
			}

			BX.onCustomEvent(window, 'Grid::headerUnpinned', []);
		},

		stopPin()
		{
			BX.Grid.Utils.styleForEach([this.getContainer()], {
				position: 'absolute',
				top: (`${this.gridRect.bottom - this.rect.height - this.gridRect.top}px`),
				'box-shadow': 'none',
			});
		},

		startPin()
		{
			BX.Grid.Utils.styleForEach([this.getContainer()], {
				position: 'fixed',
				top: `${this.getPinOffset()}px`,
				'box-shadow': '',
			});
		},

		isPinned()
		{
			return !this.getContainer().hidden;
		},

		/**
		 * Element the grid scrolls vertically inside, when the page gave the grid a height
		 * of its own instead of growing along with it. `null` when the grid scrolls with
		 * the document, which is how it has always worked.
		 *
		 * @returns {?HTMLElement}
		 */
		getScrollContainer()
		{
			// The lookup walks the ancestors reading their computed style, so its result is
			// kept until the layout can actually change it (`refreshRect`). Nothing but a
			// style change can change the answer, so a negative one is kept as well.
			if (this.scrollContainer !== undefined)
			{
				return this.scrollContainer;
			}

			this.scrollContainer = this.findScrollContainer();

			return this.scrollContainer;
		},

		/**
		 * The scroller is recognized by its `overflow-y` alone. Whether it overflows
		 * right now says nothing: content grows after the first lookup - images and
		 * fonts arrive - without resizing the scroller itself, so a cached answer that
		 * depended on the content would keep the header unpinned for good.
		 *
		 * @returns {?HTMLElement}
		 */
		findScrollContainer()
		{
			const wrapper = this.parent.getWrapper();
			let node = this.parent.getTable().parentElement;

			while (node && wrapper && wrapper.contains(node))
			{
				const overflowY = BX.style(node, 'overflow-y');

				if (overflowY === 'auto' || overflowY === 'scroll')
				{
					return node;
				}

				node = node.parentElement;
			}

			return null;
		},

		/**
		 * Pinning inside the grid's own scroller: the header sticks to its top edge and
		 * lets go once the table has been scrolled past it. Viewport coordinates rather
		 * than document ones - in this mode the document does not move at all.
		 *
		 * @param {HTMLElement} scrollContainer
		 */
		pinInsideScrollContainer(scrollContainer)
		{
			// The pinned administrative panel covers the top of the viewport, so it is the
			// lowest coordinate the header may take - not an addition to the scroller's own
			// top, which is a viewport coordinate already.
			const top = Math.max(scrollContainer.getBoundingClientRect().top, this.getPinOffset());
			const headRect = this.parent.getHead().getBoundingClientRect();
			const tableRect = this.parent.getTable().getBoundingClientRect();

			if (tableRect.bottom <= (top + headRect.height))
			{
				BX.Grid.Utils.styleForEach([this.getContainer()], {
					'border-top-left-radius': '',
					'border-top-right-radius': '',
				});
				this.stopPin();

				return;
			}

			BX.Grid.Utils.styleForEach([this.getContainer()], {
				position: 'fixed',
				top: `${top}px`,
				'box-shadow': '',
				// The bar is `fixed`, so the rounded top corners of the scroller do not clip
				// it: square corners of the header would stick out over the rounded ones.
				'border-top-left-radius': BX.style(scrollContainer, 'border-top-left-radius'),
				'border-top-right-radius': BX.style(scrollContainer, 'border-top-right-radius'),
			});

			if (headRect.top < top)
			{
				!this.isPinned() && this.pin();
			}
			else
			{
				this.isPinned() && this.unpin();
			}
		},

		_onScroll(event)
		{
			// Scrolling something that does not hold this grid - a popup list, another
			// grid - says nothing about this header, and `capture` brings all of it here.
			const target = event ? event.target : null;
			if (target && BX.Type.isFunction(target.contains) && !target.contains(this.parent.getTable()))
			{
				return;
			}

			// Scroll fires more often than the browser paints: measuring and positioning
			// the header once per frame is enough, and the frame is dropped on `destroy`.
			if (this.scrollFrame)
			{
				return;
			}

			this.scrollFrame = requestAnimationFrame(() => {
				this.scrollFrame = null;
				this.adjustPosition();
			});
		},

		adjustPosition()
		{
			if (!this.getContainer())
			{
				return;
			}

			const scrollContainer = this.getScrollContainer();

			if (scrollContainer)
			{
				this.pinInsideScrollContainer(scrollContainer);

				return;
			}

			let scrollY = 0;

			if (this.scrollRect)
			{
				scrollY = this.scrollRect.scrollTop;
			}
			else
				if (document.scrollingElement)
				{
					this.scrollRect = document.scrollingElement;
				}
				else
					if (document.documentElement.scrollTop > 0)
					{
						this.scrollRect = document.documentElement;
					}
					else if (document.body.scrollTop > 0)
					{
						this.scrollRect = document.body;
					}

			if (this.gridRect.bottom > (scrollY + this.rect.height))
			{
				this.startPin();

				const offset = this.getPinOffset();

				if ((this.rect.top - offset) <= scrollY)
				{
					!this.isPinned() && this.pin();
				}
				else
				{
					this.isPinned() && this.unpin();
				}
			}
			else
			{
				this.stopPin();
			}
		},

		onAdminPanelMutation()
		{
			this._onScroll();
		},

		_onResize()
		{
			this.rect = BX.pos(this.parent.getHead());
		},
	};
})();
