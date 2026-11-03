import {Dom, Event, Tag, Text, Type} from 'main.core';
import {Backend} from 'landing.backend';
import {Env} from 'landing.env';
import {Loc} from 'landing.loc';
import {Metrika} from 'landing.metrika';
import {A11y} from 'landing.ui.a11y';
import {Highlight} from 'landing.ui.highlight';

import {Node, NodeType} from './node';
import {DesignerBlockUI} from './ui/designerblock';
import {RepoElementType} from './ui/panels/repo';
import {RepoManager} from './panels/repo';

import 'ui.fonts.opensans';
import './designerblock.css';

// Attributes the designer puts on canvas nodes are listed here per node and dropped before saving
const A11Y_MARK = 'data-landing-designer-a11y';

// Every attribute the designer can ever write on a node. The mark on an element says which of them
// are actually there, but the mark is markup, and markup is not always ours: the html of a preset
// comes from whoever filled the repository of elements. Read on its own, the mark would let that
// html name attributes of the block to be thrown away on saving, so it is only ever read against
// this list.
const A11Y_OWNED_ATTRIBUTES = ['tabindex', 'role', 'aria-label', 'aria-current', 'inert'];

// A key that only changes the meaning of another one. Held while the mouse works the canvas, it
// says nothing about the keyboard walking it.
const BARE_MODIFIER_KEYS = ['Alt', 'AltGraph', 'CapsLock', 'Control', 'Meta', 'NumLock', 'ScrollLock', 'Shift'];

// The tags that say nothing about what the element is - and every other tag says something. A `role`
// written over an element that carries one takes away the very meaning the tag holds, including the
// meaning a parent is built out of: a list whose items stopped being items is a list of nothing, a
// table whose rows stopped being rows is a table of nothing, and the same goes for the cells of one
// and the terms of a definition list. Listing the elements that HAVE a role would be a list of the
// whole of html, and everything forgotten in it would be broken exactly that way, so the few that
// have none are named instead.
const GENERIC_TAGS = [
	'B', 'BDI', 'BDO', 'CENTER', 'DATA', 'DIV', 'FONT',
	'I', 'LABEL', 'NOBR', 'PICTURE', 'Q', 'SLOT', 'SMALL', 'SPAN', 'U',
];

// The roles that take their name from what stands inside them, by the tags that carry those roles.
// Everything else is named by what introduces it in the markup and never by its own content: a list
// takes no name from its own items, a row takes none from its own cells, and a section, a quote and
// an article are named by their heading or not at all. A link and an area belong here too, and only
// while they lead somewhere - `takesNameFromContent` asks about those two separately.
const NAME_FROM_CONTENT_TAGS = [
	'BUTTON', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'OPTION', 'SUMMARY', 'TD', 'TH',
];

// Everything the browser makes a tab stop of on its own. Inside the block these are not nodes of
// the manifest: the composite collects none of them, so the walk writes no tabindex on them and
// they stay stops of their own - reached by Tab and answering nothing, since the designer swallows
// what they would do.
const NATIVE_FOCUSABLE_SELECTOR = [
	'a[href]',
	'area[href]',
	'audio[controls]',
	'button',
	'embed',
	'iframe',
	'input:not([type="hidden"])',
	'object',
	'select',
	'summary',
	'textarea',
	'video[controls]',
	'[contenteditable]:not([contenteditable="false"])',
	'[tabindex]:not([tabindex^="-"])'
].join(',');

type ManifestNodesItem = {
	[selector: string]: {
		code: ?string,
		name: ?string,
		type: string,
		useInDesigner: ?boolean
	}
};

export type DesignerBlockOptions = {
	id: number,
	lid: number,
	code: string,
	designed: boolean,
	autoPublicationEnabled: boolean,
	access: string,
	active: boolean,
	anchor: string,
	manifest: {
		cards: {
			[selector: string]: {
				name: string
			}
		},
		nodes: {
			[selector: string]: {
				code: ?string,
				name: ?string,
				type: string
			}
		}
	},
	repository: Array<RepoElementType>
};

export class DesignerBlock
{
	blockNode: HTMLElement;
	originalNode: HTMLElement;
	hoverArea: HTMLElement = null;
	activeNode: Node = null;
	changed: boolean = false;
	saving: boolean = false;
	designed: boolean;
	autoPublicationEnabled: boolean;
	blockCode: string;
	blockId: number;
	landingId: number;
	nodes: ManifestNodesItem;
	highlight: Highlight;
	highlightedNode: ?Node = null;
	nodeMap: WeakMap;
	metrika: Metrika;
	repoManager: RepoManager;
	cardSelectors: Array<string>;
	nodesFocusZone: ?Promise = null;
	// The composite itself once it is built: the focus is put on a node from handlers that cannot
	// wait for a promise - what they answer about is gone by the time one resolves.
	readyNodesFocusZone: ?Object = null;
	addNodeButton: HTMLElement = null;
	hoverActions: HTMLElement = null;
	focusTargetAfterPanel: ?HTMLElement = null;
	deliberateFocusTarget: ?HTMLElement = null;
	arrowsHintSpoken: boolean = false;
	// What the block itself had under an attribute the walk needs, kept per node until it is given
	// back - on the screen when the walk moves on, and in the markup that leaves the canvas.
	overwrittenA11yValues: WeakMap;
	// What the designer would announce a node as, kept per node: whether it is written on the node is
	// decided again every time the composite rebuilds its set.
	announcedNodeNames: WeakMap;
	foreignFocusablesArmed: boolean = false;
	foreignFocusablesObserver: ?MutationObserver = null;
	canvasInputModalityWatched: boolean = false;
	// The handlers the canvas puts on documents that outlive it, kept for the teardown together with
	// the documents they went on: `destroy` has no other way back to them.
	inputModalityHandler: ?Function = null;
	inputModalityListeners: Array<Document> = [];
	saveClickHandler: ?Function = null;
	historyAddNodeHandler: ?Function = null;
	historyRemoveNodeHandler: ?Function = null;
	canvasUnloadHandler: ?Function = null;
	destroyed: boolean = false;

	constructor(blockNode: HTMLElement, options: DesignerBlockOptions)
	{
		if (!blockNode)
		{
			return;
		}

		this.originalNode = blockNode;
		this.blockNode = blockNode.children[0];
		this.blockCode = options.code;
		this.blockId = options.id;
		this.designed = options.designed;
		this.autoPublicationEnabled = options.autoPublicationEnabled;
		this.landingId = options.lid;
		this.nodes = options.manifest.nodes;
		this.highlight = new Highlight();
		this.cardSelectors = options.manifest.cards ? Object.keys(options.manifest.cards) : [];
		this.designAllowed = !!Env.getInstance().getOptions().design_block_allowed;
		this.cardSelectors.push('');// for without cards elements
		this.nodeMap = new WeakMap();
		this.overwrittenA11yValues = new WeakMap();
		this.announcedNodeNames = new WeakMap();
		this.repoManager = new RepoManager({
			repository: options.repository,
			onElementSelect: this.addElement.bind(this)
		});

		this.saveButton = parent.document.getElementById('landing-design-block-save')
			|| top.document.getElementById('landing-design-block-save')
			|| document.getElementById('landing-design-block-save');

		BX.addCustomEvent('Landing.Editor:load', () => {
			this.preventEvents();
			this.initHistoryEvents();
			this.initTopPanel();
			this.initNodes();
			this.initGrid();
			this.initSliders();
			this.initHoverArea();
			this.initHighlightScrollSync();
			this.initNodesFocusZone();
			this.initCanvasEntryHint();
		});

		this.watchCanvasLifetime();
	}

	/**
	 * Nobody owns the designer: it is built inline in the markup of the block and the reference to it
	 * is dropped on the spot, so there is no owner to call `destroy` when the slider that holds the
	 * canvas is closed. The canvas itself knows when its own life ends, and what has to be taken down
	 * is everything the designer put on documents that outlive it - the documents of the editor keep
	 * the listeners, and every listener keeps a closure over a document that is gone.
	 */
	watchCanvasLifetime()
	{
		const canvasWindow = this.blockNode.ownerDocument.defaultView;
		if (!canvasWindow)
		{
			return;
		}

		this.canvasUnloadHandler = () => this.destroy();

		// Both, and not one of them: `pagehide` is the one a page put into the back/forward cache
		// gets, and browsers that never fire `unload` still fire it.
		Event.bind(canvasWindow, 'pagehide', this.canvasUnloadHandler);
		Event.bind(canvasWindow, 'unload', this.canvasUnloadHandler);
	}

	/**
	 * Takes down everything the designer put outside its own document, and can be called by an owner
	 * as well as by the end of the canvas: a second call finds nothing left to do.
	 *
	 * What lives inside the canvas goes with the document that holds it. What does not - the keys
	 * listened for in the documents of the editor, the button that saves the block, the events of the
	 * history, the panel of presets rendered into the body of the editor - outlives every instance,
	 * and the designer is built anew on every opening of the slider.
	 */
	destroy()
	{
		if (this.destroyed)
		{
			return;
		}

		this.destroyed = true;

		if (this.inputModalityHandler)
		{
			this.inputModalityListeners.map(inputDocument => {
				Event.unbind(inputDocument, 'keydown', this.inputModalityHandler, {capture: true});
			});
			this.inputModalityListeners = [];
			this.inputModalityHandler = null;
		}

		if (this.saveButton && this.saveClickHandler)
		{
			Event.unbind(this.saveButton, 'click', this.saveClickHandler);
			this.saveClickHandler = null;
		}

		if (this.historyAddNodeHandler)
		{
			top.BX.removeCustomEvent('Landing:onHistoryAddNode', this.historyAddNodeHandler);
			this.historyAddNodeHandler = null;
		}

		if (this.historyRemoveNodeHandler)
		{
			top.BX.removeCustomEvent('Landing:onHistoryRemoveNode', this.historyRemoveNodeHandler);
			this.historyRemoveNodeHandler = null;
		}

		if (this.foreignFocusablesObserver)
		{
			this.foreignFocusablesObserver.disconnect();
			this.foreignFocusablesObserver = null;
		}

		if (this.readyNodesFocusZone)
		{
			this.readyNodesFocusZone.deactivate();
			this.readyNodesFocusZone = null;
		}

		this.repoManager.destroy();

		if (this.canvasUnloadHandler)
		{
			const canvasWindow = this.blockNode.ownerDocument.defaultView;
			if (canvasWindow)
			{
				Event.unbind(canvasWindow, 'pagehide', this.canvasUnloadHandler);
				Event.unbind(canvasWindow, 'unload', this.canvasUnloadHandler);
			}
			this.canvasUnloadHandler = null;
		}
	}

	clearHtml(content: string): string
	{
		return content
			.replace(/<div class="[^"]*landing-designer-block-pseudo-last[^"]*"[^>]*>[\s]*<\/div>/g, '')
			.replace(/<div class="[^"]*landing-highlight-border[^"]*"[^>]*>[\s]*<\/div>/g, '')
			.replace(/url\(&quot;(.*?)&quot;\)/g, 'url($1)')
			.replace(/\s*data-(landingwrapper)="[^"]+"\s*/g, ' ')
			.replace(/\s*[\w-_]+--type-wrapper\s*/g, ' ')
			.replace(/<div[\s]*>[\s]*<\/div>/g, '')
			.replace(/\s*style=""/g, '')
			.replace(/cursor: pointer;/g, '')
			.replace(/user-select: none;/g, '');
	}

	serializeNodeHtml(element: HTMLElement, mode: string): string
	{
		const copy = element.cloneNode(true);
		const marked = this.markedElements(copy);
		// A deep copy is walked in the same order as what it was made of, so every marked element of
		// the copy stands next to the one of the block - and only the block knows what was written
		// over, the copy carries the value of the walk.
		const source = this.markedElements(element);

		marked.map((markedElement, index) => {
			this.ownedA11yAttributes(markedElement)
				.filter(name => A11Y_OWNED_ATTRIBUTES.includes(name))
				.map(name => {
					this.writeBackA11yValue(markedElement, source[index], name);
				});
			markedElement.removeAttribute(A11Y_MARK);
		});

		return this.clearHtml(mode === 'inner' ? copy.innerHTML : copy.outerHTML);
	}

	markedElements(root: HTMLElement): Array<HTMLElement>
	{
		const elements = [...root.querySelectorAll(`[${A11Y_MARK}]`)];
		if (root.hasAttribute(A11Y_MARK))
		{
			elements.unshift(root);
		}

		return elements;
	}

	ownedA11yAttributes(element: HTMLElement): Array<string>
	{
		return (element.getAttribute(A11Y_MARK) || '').split(',').filter(Boolean);
	}

	setA11yAttribute(element: HTMLElement, name: string, value: string)
	{
		// The mark of an element is read against this list and nothing else. An attribute outside it
		// would be written on the node and marked as the designer's own, and then saving would leave
		// it in the content of the block and take off the mark - the only trace it was ever there.
		if (!A11Y_OWNED_ATTRIBUTES.includes(name))
		{
			console.warn(`Designer block: '${name}' is not among the attributes the designer owns`, element);

			return;
		}

		this.claimA11yAttribute(element, name);
		element.setAttribute(name, value);
	}

	/**
	 * Names an attribute of an element the designer's own without writing anything: the walk of the
	 * zone writes its own `tabindex` on whatever it collects, and it collects a frame of the block
	 * the moment that frame is live for the mouse. Claimed beforehand, that write is given back on
	 * saving like any other of the designer's, instead of leaving the canvas in the markup of the
	 * block.
	 */
	claimA11yAttribute(element: HTMLElement, name: string)
	{
		if (!A11Y_OWNED_ATTRIBUTES.includes(name))
		{
			return;
		}

		this.rememberA11yValue(element, name);

		const owned = this.ownedA11yAttributes(element);
		if (!owned.includes(name))
		{
			owned.push(name);
		}
		element.setAttribute(A11Y_MARK, owned.join(','));
	}

	rememberA11yValue(element: HTMLElement, name: string)
	{
		let overwritten = this.overwrittenA11yValues.get(element);
		if (!overwritten)
		{
			overwritten = new Map();
			this.overwrittenA11yValues.set(element, overwritten);
		}

		// Only the first write meets the value of the block; every one after it meets the previous
		// value of the walk, and the walk owns none of them.
		if (!overwritten.has(name))
		{
			overwritten.set(name, element.getAttribute(name));
		}
	}

	/**
	 * Nothing is given back for an attribute the designer never wrote. The mark says which attributes
	 * are the designer's, and the mark is markup: the html of a preset comes from whoever filled the
	 * repository of elements and can carry one of its own. Read on its own, such a mark would have the
	 * `role` and the `aria-label` of that preset taken off as if the designer had written them - in
	 * the published site, where nothing is left to put them back.
	 */
	writeBackA11yValue(element: HTMLElement, source: ?HTMLElement, name: string)
	{
		const overwritten = source ? this.overwrittenA11yValues.get(source) : null;
		if (!overwritten || !overwritten.has(name))
		{
			return;
		}

		const original = overwritten.get(name);
		if (Type.isString(original))
		{
			element.setAttribute(name, original);

			return;
		}

		element.removeAttribute(name);
	}

	/**
	 * Gives a node back, on the screen, what the designer wrote over: the walk has moved on and the
	 * attribute belongs to the block again, so the mark stops calling it the designer's.
	 */
	restoreA11yAttribute(element: HTMLElement, name: string)
	{
		this.writeBackA11yValue(element, element, name);

		const owned = this.ownedA11yAttributes(element).filter(ownedName => ownedName !== name);
		if (owned.length > 0)
		{
			element.setAttribute(A11Y_MARK, owned.join(','));

			return;
		}

		element.removeAttribute(A11Y_MARK);
	}

	// Takes back only what the designer wrote. An attribute it never claimed belongs to the block, and
	// removing that one would be the same leak the mark exists to prevent, the other way round.
	releaseA11yAttribute(element: HTMLElement, name: string)
	{
		if (this.ownedA11yAttributes(element).includes(name))
		{
			this.restoreA11yAttribute(element, name);
		}
	}

	// A name written as an empty string is not a missing name: it lands on top of whatever the markup
	// of the block says the element is and takes that away as well. The phrases of the designer are
	// declared in russian, and until the translations arrive `Loc` answers with nothing.
	setA11yName(element: HTMLElement, name: ?string)
	{
		if (name)
		{
			this.setA11ySemanticAttribute(element, 'aria-label', name);
		}
	}

	preventEvents()
	{
		const preventMap = {
			a: 'click',
			form: 'submit',
			input: 'keydown'
		};
		Object.keys(preventMap).map(tag => {
			[...this.blockNode.querySelectorAll(tag)].map(node => {
				Event.bind(node, preventMap[tag], (e) => {
					e.preventDefault();
				});
			});
		});
	}

	initHistoryEvents()
	{
		BX.Landing.History.getInstance()
			.setTypeDesignerBlock(this.blockId)
			.then(() => {
				return Backend.getInstance()
					.action("History::clearDesignerBlock", {
						blockId: this.blockId,
					});
			});

		const body = this.getDocumentBody();

		// The events of the history are published in the document of the editor and heard there for as
		// long as it lives; the designer is built anew on every opening of the slider, so the handlers
		// are kept to be taken off again - see `destroy`.
		this.historyAddNodeHandler = tags => {
			let elementAdded = false;
			tags.map(tag => {
				const insertAfterSelector = tag.insertAfterSelector || null;
				const parentNodeSelector = tag.parentNodeSelector || null;
				const element = Tag.render`${tag.elementHtml}`;

				if (insertAfterSelector)
				{
					elementAdded = true;
					Dom.insertAfter(element, body.querySelector(insertAfterSelector));
				}
				else if (parentNodeSelector)
				{
					elementAdded = true;
					Dom.prepend(element, body.querySelector(parentNodeSelector));
				}
			});
			if (elementAdded)
			{
				this.refreshManifest();
			}
			void A11y.announce(Loc.getMessage('LANDING_DESIGN_BLOCK_ANNOUNCE_CONTENT_UPDATED'));
		};
		this.historyRemoveNodeHandler = tags => this.onHistoryRemoveNode(tags);

		top.BX.addCustomEvent('Landing:onHistoryAddNode', this.historyAddNodeHandler);
		top.BX.addCustomEvent('Landing:onHistoryRemoveNode', this.historyRemoveNodeHandler);
	}

	/**
	 * Undo and redo take nodes off the canvas exactly as the button of the layer of actions does, and
	 * the focus standing on one of them has the same nowhere to fall to. Who asked for the undo is a
	 * different question: the keys of the editor reach it from outside the canvas as well, and a
	 * focus that was never here is not to be dragged in.
	 */
	onHistoryRemoveNode(tags: Array<{ elementSelector: string }>)
	{
		const body = this.getDocumentBody();
		const elements = tags
			.map(tag => body.querySelector(tag.elementSelector))
			.filter(Boolean);
		const losing = this.focusLosingElement(elements);
		const focusTarget = losing ? this.focusTargetBeside(losing, new Set(elements)) : null;

		elements.map(element => this.removeNode(element));
		this.refreshManifest();
		if (focusTarget)
		{
			this.focusAfterRemoval(focusTarget);
		}
		void A11y.announce(Loc.getMessage('LANDING_DESIGN_BLOCK_ANNOUNCE_CONTENT_UPDATED'));
	}

	initTopPanel()
	{
		// The button that saves the block belongs to the document of the editor and outlives the
		// canvas; the handler is kept so that `destroy` can take it off again.
		this.saveClickHandler = () => {
			this.hideHighlight(true);

			const finishCallback = () => {
				if (BX.SidePanel && BX.SidePanel.Instance)
				{
					BX.SidePanel.Instance.close();
				}
			};
			if (!this.changed)
			{
				finishCallback();
				return;
			}
			if (!this.designAllowed)
			{
				top.BX.UI.InfoHelper.show('limit_crm_superblock');
				return;
			}

			this.saving = true;

			const batch = {};
			batch['Block::updateContent'] = {
				action: 'Block::updateContent',
				data: {
					lid: this.landingId,
					block: this.blockId,
					content: this.serializeNodeHtml(this.originalNode, 'inner').replaceAll(' style="', ' bxstyle="'),
					designed: 1
				}
			};
			if (this.autoPublicationEnabled)
			{
				batch['Landing::publication'] = {
					action: 'Landing::publication',
					data: {
						lid: this.landingId
					}
				};
			}
			batch['History::clearDesignerBlock'] = {
				action: 'History::clearDesignerBlock',
				data: {
					blockId: this.blockId,
				}
			};

			Backend.getInstance()
				.batch('Block::updateContent', batch)
				.then(() => {
					this.saving = false;
					finishCallback();
				});
		};

		Event.bind(this.saveButton, 'click', this.saveClickHandler);
	}

	initNodes()
	{
		Object.keys(this.nodes).map(selector => {
			this.cardSelectors.map(cardSelector => {
				[...this.blockNode.querySelectorAll((cardSelector ? cardSelector + ' ' : '') + selector)].map(element => {
					if (this.nodes[selector]['useInDesigner'] === false)
					{
						return;
					}
					this.addNode({
						element,
						selector,
						cardSelector,
						type: this.nodes[selector]['type']
					});
				});
			});
		});
	}

	initGrid()
	{
		// collect node's parent and add pseudo last elements into the wrappers
		Object.keys(this.nodes).map(selector => {
			this.cardSelectors.map(cardSelector => {
				[...this.blockNode.querySelectorAll((cardSelector ? cardSelector + ' ' : '') + selector)].map(element => {
					if (this.nodes[selector]['useInDesigner'] === false)
					{
						return;
					}
					const wrapper = (this.nodes[selector]['type'] === 'icon')
						? element.parentNode.parentNode
						: element.parentNode;
					if (Dom.attr(wrapper, 'data-landingWrapper'))
					{
						return;
					}
					const pseudoElement = DesignerBlockUI.getPseudoLast();
					Dom.attr(wrapper, 'data-landingWrapper', true);
					Dom.append(pseudoElement, wrapper);
					this.addNode({
						cardSelector,
						element: pseudoElement,
						className: selector.substr(1) + '-last',
						selector: selector + '-last'
					});
				});
			});
		});
	}

	initNodesFocusZone(): Promise
	{
		if (this.nodesFocusZone)
		{
			return this.nodesFocusZone;
		}

		// The last resort focus target once the last node of the block is removed, and the one stop of
		// the walk that is not a node of it. Without a role and a name it is a stop a screen reader
		// passes over in silence. `group` says a set stands here and demands nothing of what is inside
		// it; the roles that do demand - `list`, `grid`, `tree` - would take the meaning off every node
		// that carries one of its own.
		this.setA11yAttribute(this.blockNode, 'tabindex', '-1');
		this.setA11ySemanticAttribute(this.blockNode, 'role', 'group');
		this.setA11yName(this.blockNode, Loc.getMessage('LANDING_DESIGN_BLOCK_CANVAS_NAME'));

		this.nodesFocusZone = A11y.load()
			.then(({FocusZone}) => {
				// The slider can be closed while the extension is still on its way. A zone raised after
				// that would put an observer of its own on a document nobody watches any more, and the
				// teardown that would have taken it down has already run - nothing holds a reference to
				// it to deactivate it later. The claim below is worse still: it puts the keys of the
				// canvas back on the documents of the editor, which outlive it.
				if (this.destroyed)
				{
					return null;
				}

				// Right before the zone collects its set for the first time and not a step earlier:
				// with no zone there is no walk to keep the frames of the block out of.
				this.claimForeignFocusables();

				const focusZone = new FocusZone(this.blockNode, {
					focusInStrategy: () => this.canvasEntryTarget(),
					focusableElementFilter: element => this.acceptCompositeNode(element)
				});
				focusZone.activate();
				this.readyNodesFocusZone = focusZone;

				return focusZone;
			})
			.catch((error) => {
				this.nodesFocusZone = null;
				this.readyNodesFocusZone = null;
				console.warn('Failed to init designer block nodes focus zone', error);

				return null;
			});

		return this.nodesFocusZone;
	}

	/**
	 * Tells the keyboard, once, how the canvas is walked.
	 *
	 * The composite keeps a single tab stop and hands the rest over to the arrows, and nothing on the
	 * screen says so: a user who tabs in, sees one node and stops, never learns the rest of the block
	 * is a keypress away. The hint is spoken when the keyboard comes INTO the canvas and not on every
	 * step inside it - a hint repeated on each arrow press is worse than no hint at all.
	 */
	initCanvasEntryHint()
	{
		Event.bind(this.blockNode, 'focusin', (event) => {
			if (this.arrowsHintSpoken || !this.isCompositeNode(event.target))
			{
				return;
			}

			this.arrowsHintSpoken = true;
			void A11y.announce(Loc.getMessage('LANDING_DESIGN_BLOCK_ANNOUNCE_ARROWS_HINT'));
		});

		Event.bind(this.blockNode, 'focusout', (event) => {
			// Walking to another node, or out to the actions over one, is still being in the canvas;
			// only leaving it altogether arms the hint for the next time somebody comes back.
			const goingTo = event.relatedTarget;
			const staysInside = goingTo
				&& (this.blockNode.contains(goingTo) || (this.hoverArea && this.hoverArea.contains(goingTo)));

			if (!staysInside)
			{
				this.arrowsHintSpoken = false;
			}
		});
	}

	/**
	 * The filter of the composite, and the one place told about a node joining the set or falling out
	 * of it: the zone asks it about every candidate whenever it rebuilds.
	 */
	acceptCompositeNode(element: HTMLElement): boolean
	{
		const accepted = this.isCompositeNode(element);
		this.applyNodeA11ySemantics(element, accepted);

		return accepted;
	}

	isCompositeNode(element: HTMLElement): boolean
	{
		const node = this.nodeMap.get(element);

		// The place at the end of a wrapper belongs here too: adding an element there is the only
		// thing the designer offers per card, and a pointer gets it by hovering. Left out, it would
		// be a function the mouse has and the keyboard has not.
		return !!node && this.hasVisibleBox(element);
	}

	/**
	 * A node with an empty box is drawn nowhere: an empty subtitle keeps its full width and no height
	 * at all. Such a node still counts as visible for the focus zone - it is not hidden, it is just
	 * flat - so it would join the composite and, being the first in the document, become the one entry
	 * point of the canvas. The focus ring would then be laid out on a box nobody can see: the keyboard
	 * enters the canvas and the screen says nothing happened. The pointer never reaches these nodes
	 * either - there is nothing to hover - so leaving them out costs the keyboard nothing the mouse
	 * has, and the walk starts on a node the eye can find.
	 */
	hasVisibleBox(element: HTMLElement): boolean
	{
		const box = element.getBoundingClientRect();

		return box.width > 0 && box.height > 0;
	}

	findNodeElements(container: HTMLElement): Array<HTMLElement>
	{
		return this.markedElements(container).filter(element => this.isCompositeNode(element));
	}

	/**
	 * Where the keyboard lands when it comes into the canvas from outside.
	 *
	 * By default the walk starts at the top of the block - that is what the composite is for. But a
	 * node focused on purpose from outside the canvas - the element just added, the control the panel
	 * gave the focus back to - is a decision already made, and the composite redirecting it to the
	 * first node of the block would throw the keyboard back to the top of a block of many cards.
	 */
	canvasEntryTarget(): ?HTMLElement
	{
		const [first] = this.findNodeElements(this.blockNode);

		return this.deliberateFocusTarget || first || null;
	}

	/**
	 * Puts the focus on a node chosen on purpose - the element a preset has just added, the neighbour
	 * of the node that was removed - and keeps the composite of that choice.
	 *
	 * Every such choice is made outside the block: the layer of actions and the panel of presets are
	 * children of the body of the canvas, not of `blockNode`. For the composite that is a focus
	 * arriving from outside, and it answers with its own entry point instead - the first node of the
	 * block. The answer is prepared here, where the strategy can read it while `focus()` is still
	 * running, and taken away right after.
	 */
	focusDeliberately(element: HTMLElement)
	{
		const focusZone = this.readyNodesFocusZone;

		// A node put in the document a moment ago is not in the set of the composite yet - the set is
		// rebuilt by an observer a frame later - and a focus on an element outside the set is not
		// counted at all: the walk would go on from the node the user came from.
		if (focusZone)
		{
			focusZone.refreshElements();
		}

		this.deliberateFocusTarget = element;
		element.focus();
		this.deliberateFocusTarget = null;

		if (!focusZone || !this.isCompositeNode(element) || focusZone.getCurrentFocusedElement() === element)
		{
			return;
		}

		// Having answered a focus from outside with the very element being focused, the composite
		// returns before writing down where the focus went: the single `tabindex="0"` of the walk and
		// the node the arrows count from stay behind on the node the focus came from. The same focus
		// told from INSIDE the container is written down, so the block takes it for the moment in
		// between - and gives it up in the same task, before anything is read out of it.
		this.blockNode.focus({ preventScroll: true });
		element.focus();
	}

	// Tells whether it found a node to stand on: a preset put in the document a moment ago can have
	// none for this frame - an image that has not loaded its size yet is drawn nowhere - and the
	// caller has to know that the keyboard is still where it was.
	focusNodeInside(container: ?HTMLElement): boolean
	{
		const [target] = container ? this.findNodeElements(container) : [];
		if (!target)
		{
			return false;
		}

		this.focusDeliberately(target);

		return true;
	}

	findSiblingNodeElement(
		element: HTMLElement,
		wrapper: HTMLElement,
		direction: string,
		isAcceptable: (HTMLElement) => boolean = () => true
	): ?HTMLElement
	{
		for (let sibling = element[direction]; sibling; sibling = sibling[direction])
		{
			if (wrapper.contains(sibling) && this.isCompositeNode(sibling) && isAcceptable(sibling))
			{
				return sibling;
			}
		}

		return null;
	}

	/**
	 * A removal takes away not the picked node alone but every copy of it under the same selector -
	 * in a block of repeated cards that is one element per card. A copy from that set is a valid
	 * neighbour right up to the moment the removal happens, and then it is gone, so the focus lands
	 * on nothing. The set is asked for here exactly as the removal asks for it, and its members are
	 * out of the running.
	 *
	 * Nothing is answered when the keyboard was nowhere near the removal: a click on "Delete" leaves
	 * the focus on the button of the layer - the keyboard route is covered by that - while a pointer
	 * that never focused anything would have the frame and the layer of actions jump onto a
	 * neighbouring node the user was not even hovering.
	 */
	focusTargetAfterRemoval(node: Node): ?HTMLElement
	{
		const removed = [...this.getDocumentBody().querySelectorAll(node.getSelector())];
		const losing = this.focusLosingElement(removed);

		return losing ? this.focusTargetBeside(losing, new Set(removed)) : null;
	}

	/**
	 * Which element is about to lose the focus once the given nodes leave the canvas.
	 *
	 * A node holds the keyboard in two places, and only one of them is inside it: the layer of
	 * actions is a child of the body of the canvas, and Enter on a node hands the focus to the button
	 * that adds an element. The layer goes off the screen together with the node it stands on, so a
	 * focus on its controls has the same nowhere to fall to as a focus on the node itself.
	 *
	 * `activeElement` names the last element focused in this document even after the focus has left
	 * the frame altogether, so the document is asked whether the focus is here at all: undo is
	 * reached from the panels of the editor as well, and a focus that was never in the canvas is not
	 * to be dragged into it.
	 */
	focusLosingElement(removed: Array<HTMLElement>): ?HTMLElement
	{
		if (!document.hasFocus())
		{
			return null;
		}

		const holder = removed.find(element => element.contains(document.activeElement));
		if (holder)
		{
			return holder;
		}

		const activeElement = this.activeNode ? this.activeNode.getElement() : null;

		return (activeElement && this.hasFocusInsideHoverArea() && removed.includes(activeElement))
			? activeElement
			: null;
	}

	/**
	 * The node the focus moves on to once the given set leaves the document: the nearest neighbour
	 * inside the same card, then any node of the block that outlives the removal, and the block
	 * itself when there is nothing left of it to stand on.
	 */
	focusTargetBeside(element: HTMLElement, removed: Set<HTMLElement>): HTMLElement
	{
		const survives = (candidate: HTMLElement) => !removed.has(candidate);
		const wrapper = element.closest('[data-landingWrapper]') || this.blockNode;
		const sibling = this.findSiblingNodeElement(element, wrapper, 'nextElementSibling', survives)
			|| this.findSiblingNodeElement(element, wrapper, 'previousElementSibling', survives);

		if (sibling)
		{
			return sibling;
		}

		return this.findNodeElements(this.blockNode)
			.find(candidate => candidate !== element && survives(candidate))
			|| this.blockNode;
	}

	/**
	 * Last line of defence for the return of focus: whatever else took the target out of the document
	 * between the choice and the removal, focusing a detached element is silently the same as focusing
	 * nothing - the focus goes to the body of the canvas, the very outcome the return exists to
	 * prevent. The block itself is always there to take it.
	 */
	focusAfterRemoval(target: ?HTMLElement)
	{
		const survivor = (target && target.isConnected) ? target : this.blockNode;

		this.focusDeliberately(survivor);
	}

	initSliders()
	{
		const sliderSelector = '.js-carousel';
		[...this.blockNode.querySelectorAll(sliderSelector)].map(slider => {
			const count =
				(Text.toNumber(slider.dataset.slidesShow) || 1)
				* (Text.toNumber(slider.dataset.rows) || 1)
			;
			const selector = `.${[...slider.classList].join('.')} .js-slide:not(:nth-child(-n+${count}))`;
			document.head.appendChild(
				Tag.render`<style>${selector}{display: none !important;}</style>`
			);
		});
	}

	initHoverArea()
	{
		if (this.hoverArea)
		{
			return;
		}

		this.hoverArea = DesignerBlockUI.getHoverDiv();

		const addNodeElement = DesignerBlockUI.getAddNodeButton();
		this.addNodeButton = addNodeElement;
		const CardAction = BX.Landing.UI.Button.CardAction;
		const BaseButtonPanel = BX.Landing.UI.Panel.BaseButtonPanel;
		const cardAction = new BaseButtonPanel(
			'nodeAction',
			'landing-ui-panel-block-card-action'
		);
		this.hoverActions = cardAction.layout;

		Event.bind(addNodeElement, 'click', () => {
			this.repoManager.showPanel();
			this.hideHoverArea();
		});

		const removeButton = new CardAction('remove', {
			html: '&nbsp;',
			ariaLabel: Loc.getMessage('LANDING_DESIGN_BLOCK_NODE_REMOVE'),
			onClick: this.removeElement.bind(this)
		});
		Dom.attr(removeButton.layout, 'data-testid', 'landing-designerblock-remove-btn');
		cardAction.addButton(removeButton);

		void cardAction.show();

		Dom.append(addNodeElement, this.hoverArea);
		Dom.append(cardAction.layout, this.hoverArea);
		Dom.append(this.hoverArea, this.getDocumentBody());
		// The layer is built with the canvas, long before anything is hovered or focused. Parked off
		// the screen it would still be a stop of the tab order, and its controls act on the active
		// node - which is nothing yet. It is shown by the positioning, once there is a node to act on.
		this.hideHoverAreaNow();

		Event.bind(this.blockNode, 'mouseover', () => {
			// The keyboard scenario lives inside the layer: hiding it under the pointer breaks it.
			if (this.hasFocusInsideHoverArea())
			{
				return;
			}
			this.hideHoverArea();
		});

		this.initNodeActionKeys();
		this.repoManager.panel.subscribe('onHide', this.onRepoPanelHide.bind(this));
	}

	/**
	 * The frame over the node is laid in coordinates of the viewport, while the layer of actions over
	 * the same node stands in those of the document. The canvas scrolls on its own, so a wheel turned
	 * without moving the pointer takes one of them along and leaves the other behind.
	 */
	initHighlightScrollSync()
	{
		let scheduled = false;

		Event.bind(this.blockNode.ownerDocument, 'scroll', () => {
			// Scroll does not bubble up from an element, so the listener is a capturing one; and the
			// frame is only worth moving while there is one on screen.
			if (scheduled || !this.highlightedNode)
			{
				return;
			}

			scheduled = true;
			requestAnimationFrame(() => {
				scheduled = false;
				const node = this.highlightedNode;
				if (node)
				{
					this.showHighlight(node, node.getElement().getBoundingClientRect());
				}
			});
		}, {capture: true, passive: true});
	}

	/**
	 * Where the focus goes once the panel is closed - after the panel has let it go, not against it.
	 *
	 * A closing panel gives the focus back to whatever held it in the document of the editor, and for
	 * a panel opened from inside the canvas that holder is the frame itself: its own restore can never
	 * land on a control of the block. It runs in a microtask of the closing, so a task queued here is
	 * the first thing to happen after it. Claiming the focus straight away instead would win the
	 * assertion and lose the browser.
	 *
	 * The panel closes on a picked preset too, and `addElement` leaves the target here rather than
	 * taking the focus on its own, so both ways out of the panel end in the same place.
	 */
	onRepoPanelHide()
	{
		// The panel announces the closing before it looks at whether it was open, and one Escape in
		// the editor reaches every panel it knows. A panel that was never on screen has no focus to
		// give back, and taking one would drag the keyboard into the canvas from wherever the user
		// actually was.
		if (!this.repoManager.panel.isShown())
		{
			return;
		}

		const addedElement = this.focusTargetAfterPanel;
		this.focusTargetAfterPanel = null;

		const claim = () => {
			if (addedElement && this.focusNodeInside(addedElement))
			{
				return;
			}

			// The element was added and has nothing to stand on yet, or the panel was closed without
			// picking anything: either way the focus belongs to the control the panel was opened
			// from. The block itself takes it when there is no node for the layer to stand over.
			if (this.focusAddNodeButton())
			{
				return;
			}

			this.focusDeliberately(this.blockNode);
		};

		setTimeout(() => {
			claim();

			// The panel hands the focus back to whatever held it in the document of the editor, and
			// the holder of a panel opened from inside the canvas is the frame element itself. Focus
			// put on a frame lands on the body of its document, not on the control the focus came
			// from, so the claim is looked at once more after that restore has run. Once, not in a
			// loop: a second empty body means the focus was taken by something else, and fighting
			// for it would only hide that.
			requestAnimationFrame(() => {
				if (document.activeElement === document.body)
				{
					claim();
				}
			});
		}, 0);
	}

	initNodeActionKeys()
	{
		Event.bind(this.blockNode, 'keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ')
			{
				return;
			}

			if (!this.isCompositeNode(event.target))
			{
				return;
			}

			event.preventDefault();
			this.focusAddNodeButton();
		});
	}

	focusAddNodeButton(): boolean
	{
		if (!this.addNodeButton || !this.activeNode)
		{
			return false;
		}

		this.adjustHoverArea();
		this.addNodeButton.focus();

		return true;
	}

	hasFocusInsideHoverArea(): boolean
	{
		return !!this.hoverArea && this.hoverArea.contains(document.activeElement);
	}

	/**
	 * @return {?DOMRect} the geometry of the active node, for whoever else has to lay something over it
	 */
	adjustHoverArea(): ?DOMRect
	{
		// Nothing to lay the layer over until a node is active, and nothing for its controls to act on.
		if (!this.hoverArea || !this.activeNode)
		{
			return null;
		}

		// The node is measured before the layer is shown. The layer is positioned absolutely and
		// cannot move the node, but a style written before geometry is read makes the browser
		// recalculate the layout on the spot - once per step of the keyboard walk.
		const clientRect = this.activeNode.getElement().getBoundingClientRect();
		// Read here and not where it is used: the scroll of a window depends on the layout too, and asked
		// for after a style has been written it makes the browser recalculate the layout a second time.
		const editorScroll = BX.Landing.PageObject.getEditorWindow().scrollY;

		this.showHoverArea();

		if (this.hoverActions)
		{
			if (this.activeNode.isPseudoElement())
			{
				Dom.hide(this.hoverActions);
			}
			else
			{
				Dom.show(this.hoverActions);
			}
		}

		if (this.addNodeButton)
		{
			Dom.style(
				this.addNodeButton,
				{ top: (clientRect.height - 5) + 'px' }
			);
		}

		Dom.style(
			this.hoverArea,
			{
				top: clientRect.top + editorScroll + 'px',
				left: clientRect.left + (clientRect.width < 30 ? 30 : 0) + 'px',
				width: clientRect.width + 'px',
				height: '35px'
			}
		);

		return clientRect;
	}

	showHoverArea()
	{
		if (this.hoverArea)
		{
			Dom.show(this.hoverArea);
		}
	}

	hideHoverArea()
	{
		if (!this.hoverArea)
		{
			return;
		}

		setTimeout(() => {
			// The focus can arrive in the layer between the moment the hiding was asked for and the
			// moment it happens - the return of focus after the panel closes does exactly that. A
			// layer hidden then takes the focus down to the body of the canvas, which is the outcome
			// the return of focus exists to prevent, so the question is asked here and not earlier.
			if (this.hasFocusInsideHoverArea())
			{
				return;
			}

			Dom.hide(this.hoverArea);
		}, 0);
	}

	// The same, without waiting for the next task: used where the layer must not be reachable even
	// for that one task - at the very creation of it, before any node is active.
	hideHoverAreaNow()
	{
		if (this.hoverArea)
		{
			Dom.hide(this.hoverArea);
		}
	}

	refreshManifest(manifest: ?ManifestNodesItem)
	{
		if (manifest)
		{
			Object.keys(manifest).map(selector => {
				this.nodes[selector] = manifest[selector];
			});
		}
		this.initNodes();
		this.initGrid();
	}

	/**
	 * A frame is the one element the composite takes without asking the filter of the canvas: the
	 * walk of `ui.a11y` lets every `<iframe>` through to look for focusable content inside it, and a
	 * cross-origin one - a video insert of a block is exactly that - hands out no content document to
	 * descend into, so the frame itself stays in the set. There it is a nameless stop of the arrow
	 * walk, and the focus the walk puts there leaves for a document whose keys the canvas never hears.
	 *
	 * `inert` is the one mark that takes the frame out of that walk: `isFocusable` asks
	 * `closest('[inert]')` before anything else. The same mark takes the element out of hit testing,
	 * and the block is asked to play its video in the canvas, so the mark is held only for as long as
	 * the keyboard walks: see `watchCanvasInputModality`.
	 *
	 * The rest of what the browser makes a tab stop of on its own - a link, a button, a field of the
	 * block or of a preset - is answered with `tabindex="-1"` instead. The filter of the canvas keeps
	 * them out of the composite, so without an answer they stay tab stops of it next to the single one
	 * it promises; and the html of a preset comes from whoever filled the repository, so what is in it
	 * cannot be known in advance. What they must not be answered with is `inert`: it takes a subtree
	 * out of the accessibility tree as well, and the whole time a block is edited the text of its
	 * links and buttons would not exist for a screen reader at all.
	 */
	claimForeignFocusables()
	{
		this.watchForeignFocusables();
		this.watchCanvasInputModality();
		this.foreignFocusables().map(element => this.claimForeignFocusable(element));
		this.armForeignFocusables();
	}

	/**
	 * Which of the two the canvas is being worked with, and nothing else follows from it.
	 *
	 * The keyboard is heard on both documents in the capture phase - before the zone, which listens on
	 * the block itself, and before the browser reads its own tab order to answer a Tab - so the very
	 * key that would walk onto a frame meets one already out of the walk. The mouse is heard on the
	 * block: a marked frame is the target of no pointer event, but the node carrying it is, so
	 * moving the mouse towards the video is enough to have the player answer the click that follows.
	 */
	watchCanvasInputModality()
	{
		if (this.canvasInputModalityWatched)
		{
			return;
		}

		this.canvasInputModalityWatched = true;

		this.inputModalityHandler = (event) => {
			if (!BARE_MODIFIER_KEYS.includes(event.key))
			{
				this.armForeignFocusables();
			}
		};

		// The documents listened to are kept and not asked for again: the answer of
		// `inputModalityDocuments` depends on a canvas that is gone by the time `destroy` runs.
		this.inputModalityListeners = this.inputModalityDocuments();
		this.inputModalityListeners.map(inputDocument => {
			Event.bind(inputDocument, 'keydown', this.inputModalityHandler, {capture: true});
		});

		['pointerover', 'pointermove'].map(eventName => {
			Event.bind(this.blockNode, eventName, () => this.disarmForeignFocusables(), {capture: true});
		});
	}

	/**
	 * Where a key that decides how the canvas is being worked with can be pressed.
	 *
	 * The way into the canvas runs through the document ABOVE it - the header of the editor page and
	 * the link that skips to the content are there - so the Tab that walks onto a frame of the block is
	 * pressed outside the canvas and heard by nobody inside it. That is enough for the trap to come
	 * back: the pointer takes the frames out of the walk on its way over the canvas, the focus leaves
	 * for a panel of the editor, and the walk down finds a frame nothing armed again. Answering the
	 * focus arriving instead would be too late - by then it is already inside the frame.
	 */
	inputModalityDocuments(): Array<Document>
	{
		const documents = [];

		[this.blockNode.ownerDocument, document, parent.document, top.document].map(candidate => {
			if (candidate && !documents.includes(candidate))
			{
				documents.push(candidate);
			}
		});

		return documents;
	}

	armForeignFocusables()
	{
		if (this.foreignFocusablesArmed)
		{
			return;
		}

		this.foreignFocusablesArmed = true;
		this.foreignFrames().map(frame => this.setA11yAttribute(frame, 'inert', ''));

		// A frame given back to the mouse is a frame the walk collects, and the composite hands its
		// single tab stop to whatever the pointer focuses inside its set: a click meant to start a
		// video moves that stop onto the frame. The key heard here would then take the frame out of
		// the walk and leave the canvas with no tab stop at all - the nodes still carry `tabindex="-1"`
		// and the set is only rebuilt on the next animation frame, a whole Tab too late. Rebuilding it
		// in the same key gives the stop back to a node of the block before the browser reads the tab
		// order. There is nothing to rebuild before the zone is up, and nothing to rebuild twice: the
		// arming happens once per walk.
		if (this.readyNodesFocusZone)
		{
			this.readyNodesFocusZone.refreshElements();
		}
	}

	disarmForeignFocusables()
	{
		if (!this.foreignFocusablesArmed)
		{
			return;
		}

		this.foreignFocusablesArmed = false;
		// By the mark and not by the selector: a frame that stopped answering it between the two calls
		// - taken out of the document and put back, given a node of the manifest inside - would keep an
		// `inert` nobody ever takes off, and its whole subtree with it.
		this.markedElements(this.blockNode)
			.filter(element => this.ownedA11yAttributes(element).includes('inert'))
			.map(element => this.releaseA11yAttribute(element, 'inert'));
	}

	foreignFocusables(): Array<HTMLElement>
	{
		return [...this.blockNode.querySelectorAll(NATIVE_FOCUSABLE_SELECTOR)]
			.filter(element => !this.holdsCompositeNode(element));
	}

	// The only ones the mark is held for, and the only ones it is needed for: a frame goes past the
	// filter of the walk whatever tabindex it carries.
	foreignFrames(): Array<HTMLElement>
	{
		return this.foreignFocusables().filter(element => element.tagName === 'IFRAME');
	}

	// An element holding a node of the manifest is left alone whatever it is: `inert` would take the
	// node out of the walk along with the subtree around it, and a node inside a link is put there by
	// `addElement` itself.
	holdsCompositeNode(element: HTMLElement): boolean
	{
		return this.markedElements(element).some(marked => this.nodeMap.has(marked));
	}

	/**
	 * A frame is claimed whether it is marked or not. Live for the mouse, it is collected by the
	 * walk, and the walk writes its own `tabindex` on everything it collects; claimed, that write
	 * belongs to the designer and serialization takes it off, so the frame still leaves the canvas
	 * carrying the markup of the block and nothing of ours.
	 */
	claimForeignFocusable(element: HTMLElement)
	{
		// Only a frame goes past the filter of the walk and takes a `tabindex` from it; the rest is
		// never collected, so there is no write of the walk on them to give back.
		if (element.tagName === 'IFRAME')
		{
			this.claimA11yAttribute(element, 'tabindex');

			if (this.foreignFocusablesArmed)
			{
				this.setA11yAttribute(element, 'inert', '');
			}

			return;
		}

		// Out of the tab order and left where it is: the element still answers the mouse, and a screen
		// reader still reads what it holds. The value of the block is remembered and given back, on the
		// screen and in the markup that is saved, like every other write of the designer.
		this.setA11yAttribute(element, 'tabindex', '-1');
	}

	/**
	 * The claim has to hold on the boundary of the canvas and not on the two calls that happen to
	 * know about it: a frame the block puts in place itself - a player loaded lazily - would meet
	 * the walk first and take a `tabindex` from it unmarked, and an unmarked attribute leaves the
	 * canvas in the saved markup of the block. The zone answers a mutation by scheduling the
	 * rebuilding of its set for the next animation frame, so a claim made in the microtask of that
	 * same mutation always reaches a frame first, whenever the frame arrives.
	 */
	watchForeignFocusables()
	{
		if (this.foreignFocusablesObserver)
		{
			return;
		}

		this.foreignFocusablesObserver = new MutationObserver((records) => {
			records
				.flatMap(record => [...record.addedNodes])
				.filter(node => Type.isElementNode(node))
				.flatMap(node => [node, ...node.querySelectorAll(NATIVE_FOCUSABLE_SELECTOR)])
				.filter(node => node.matches(NATIVE_FOCUSABLE_SELECTOR) && !this.holdsCompositeNode(node))
				.map(element => this.claimForeignFocusable(element));
		});

		this.foreignFocusablesObserver.observe(this.blockNode, {childList: true, subtree: true});
	}

	getDocumentBody(): HTMLElement
	{
		return document.body;
	}

	isInsideElement(element: HTMLElement): boolean
	{
		return element.parentElement.tagName === 'A';
	}

	addElement(repoElement: RepoElementType)
	{
		const activeNode = this.activeNode;
		// The controls of the layer can be reached before anything has been picked; there is nothing
		// to insert next to then, and the node they read would be nothing at all.
		if (!activeNode)
		{
			return;
		}

		const tags = [];
		const activeElement = activeNode.getElement();
		const insertedElements = [];
		let insertedHere = null;

		[...this.getDocumentBody().querySelectorAll(activeNode.getSelector())].map(node => {
			const elementHtml = repoElement.html;
			const element = Tag.render`${elementHtml}`;
			const insertAfter = this.isInsideElement(node) ? node.parentNode : node;
			Dom.insertAfter(element, insertAfter);
			insertedElements.push(element);
			if (node === activeElement)
			{
				insertedHere = element;
			}
			tags.push({
				elementHtml,
				elementSelector: BX.Landing.Utils.getCSSSelector(element),
				insertAfterSelector: BX.Landing.Utils.getCSSSelector(insertAfter)
			});
		});

		this.changed = true;
		// The panel is still closing, and the focus it gives back on the way out would leave the new
		// node behind: the target is handed to the handler of the closing instead of being taken here.
		// Of the copies added - one per card - the focus belongs to the one next to the node the user
		// picked. The first of them belongs to the first card of the block, and a keyboard sent there
		// loses the place it was working in.
		this.focusTargetAfterPanel = insertedHere || insertedElements[0] || null;
		this.refreshManifest(repoElement.manifest.nodes);
		this.hideHighlight();
		void A11y.announce(Loc.getMessage('LANDING_DESIGN_BLOCK_ANNOUNCE_NODE_ADDED'));

		Backend.getInstance()
			.action("History::pushDesignerBlock", {
				blockId: this.blockId,
				action: 'ADD_NODE',
				data: {
					tags: tags,
				},
			})
			.then(result => {
				BX.Landing.History.getInstance().push();
			});
	}

	removeElement()
	{
		// Same as addElement: nothing is active until a node has been picked, and there is nothing
		// to remove.
		if (!this.activeNode)
		{
			return;
		}

		const tags = [];
		// Everything below is about one node, and `activeNode` stops being that node halfway through:
		// handing the focus to the neighbour makes the neighbour active, synchronously, before the
		// record of the removal is written. Kept in a variable, the node stays the one the user asked
		// to remove.
		const removed = this.activeNode;
		const focusTarget = this.focusTargetAfterRemoval(removed);
		this.hideHoverArea();

		this.hideHighlight();

		setTimeout(() => {
			[...this.getDocumentBody().querySelectorAll(removed.getSelector())].map(node => {
				tags.push({
					elementHtml: this.serializeNodeHtml(node, 'outer'),
					elementSelector: BX.Landing.Utils.getCSSSelector(node),
					insertAfterSelector: node.previousElementSibling ? BX.Landing.Utils.getCSSSelector(node.previousElementSibling) : null,
					parentNodeSelector: BX.Landing.Utils.getCSSSelector(node.parentNode)
				});
				this.removeNode(node);
			});

			this.changed = true;
			this.refreshManifest();
			if (focusTarget)
			{
				this.focusAfterRemoval(focusTarget);
			}
			void A11y.announce(Loc.getMessage('LANDING_DESIGN_BLOCK_ANNOUNCE_NODE_REMOVED'));

			Backend.getInstance()
				.action("History::pushDesignerBlock", {
					blockId: this.blockId,
					action: 'REMOVE_NODE',
					data: {
						selector: removed.getOriginalSelector(),
						tags: tags,
					},
				})
				.then(result => {
					BX.Landing.History.getInstance().push();
				});

		}, 0);
	}

	typeWithWrapper(type: string)
	{
		return type === 'icon' || type === 'embed';
	}

	addNode(nodeOptions: NodeType): boolean
	{
		if (nodeOptions.selector.match(/^\.[\w-_]+$/i) === null)
		{
			return false;
		}

		const manifestSelector = nodeOptions.selector;

		// for some type we get parent node
		const withWrapper = this.typeWithWrapper(nodeOptions.type);
		nodeOptions.element = withWrapper
			? nodeOptions.element.parentNode
			: nodeOptions.element;

		// Asked about the element that is about to be recorded and not the one the manifest named: for
		// the types that carry a wrapper the two are different, and a guard asking about the second one
		// answers "new" on every refresh of the manifest - a second node on the same element, with a
		// second pair of listeners, for every edit the user makes.
		if (this.nodeMap.get(nodeOptions.element))
		{
			return false;
		}

		if (withWrapper)
		{
			nodeOptions.selector = nodeOptions.selector + '--type-wrapper';
			Dom.addClass(nodeOptions.element, nodeOptions.selector.substr(1));
		}
		// mouse over callback
		nodeOptions.onHover = this.onMouseOver.bind(this);

		const node = new Node(nodeOptions);
		this.nodeMap.set(nodeOptions.element, node);

		if (node.isPseudoElement())
		{
			this.setNodeA11yAttributes(nodeOptions.element, manifestSelector, true);
		}
		else
		{
			this.setNodeA11yAttributes(nodeOptions.element, manifestSelector);
		}

		return true;
	}

	setNodeA11yAttributes(element: HTMLElement, manifestSelector: string, isPlaceToAdd: boolean = false)
	{
		this.setA11yAttribute(element, 'tabindex', '-1');

		const manifestNode = this.nodes[manifestSelector];
		const name = isPlaceToAdd
			? Loc.getMessage('LANDING_DESIGN_BLOCK_NODE_ADD_PLACE')
			: ((manifestNode && manifestNode.name)
				? manifestNode.name
				: Loc.getMessage('LANDING_DESIGN_BLOCK_NODE_DEFAULT_NAME'));

		this.announcedNodeNames.set(element, name);
		this.applyNodeA11ySemantics(element, this.isCompositeNode(element));
	}

	/**
	 * Whether the element carries a role of its own: a heading, a link, a list, an item of one, an
	 * image and a button all have one the browser gives them, and a `role="group"` written over such
	 * an element is not an allowed role of it at all. Says nothing about the name of the element - an
	 * image carries the role of an image whatever its `alt` says, and only `hasOwnA11yName` tells
	 * whether a name of its own is really there.
	 */
	hasNativeRole(element: HTMLElement): boolean
	{
		// A link is a link while it leads somewhere: an anchor with no href is a piece of text carrying
		// no role at all, and there is nothing there for the designer to step aside for.
		if (element.tagName === 'A' || element.tagName === 'AREA')
		{
			return element.hasAttribute('href');
		}

		return !GENERIC_TAGS.includes(element.tagName);
	}

	/**
	 * Whether the element already carries an accessible name of its own. Its semantics say where such
	 * a name would come from - the `alt` of an image, the content of a link, a button or a heading -
	 * and the content says whether it is there at all: a link holding one icon and a heading made of a
	 * single space are stops of the walk a screen reader announces with nothing. Everything whose role
	 * takes no name from its content - a list, a row of a table, a section, an element with no
	 * semantics at all - is a case content can never answer yes to.
	 */
	hasOwnA11yName(element: HTMLElement): boolean
	{
		// An image says what its `alt` says, and a decorative one - an empty `alt` - says nothing at
		// all: there the name of the manifest is the only name the node can be given, while the role of
		// the image stays its own either way.
		if (element.tagName === 'IMG')
		{
			return (element.getAttribute('alt') || '').trim() !== '';
		}

		if (!this.takesNameFromContent(element))
		{
			return false;
		}

		if (element.textContent.trim() !== '' || (element.getAttribute('title') || '').trim() !== '')
		{
			return true;
		}

		// An icon of a link is often a picture, and a picture that says something names the link.
		return [...element.querySelectorAll('img')]
			.some(image => (image.getAttribute('alt') || '').trim() !== '');
	}

	// A link and an area take their name from their content while they lead somewhere; an anchor with
	// no href carries no role at all, and a role with no name of its own takes the name of the manifest.
	takesNameFromContent(element: HTMLElement): boolean
	{
		if (element.tagName === 'A' || element.tagName === 'AREA')
		{
			return element.hasAttribute('href');
		}

		return NAME_FROM_CONTENT_TAGS.includes(element.tagName);
	}

	/**
	 * Writes on a node what the designer announces it as, or takes that back.
	 *
	 * Only a node the walk can reach is worth announcing: a node with an empty box is left out of the
	 * composite, and a named group nothing can walk to is a group a screen reader lists and a keyboard
	 * never visits. The box of a node changes over the life of the canvas - a preset draws its image a
	 * frame later - so the question is asked again on every rebuild of the set.
	 */
	applyNodeA11ySemantics(element: HTMLElement, isInComposite: boolean)
	{
		const name = this.announcedNodeNames.get(element);
		// Nothing was ever meant for this element: it is no node of the manifest.
		if (!Type.isString(name))
		{
			return;
		}

		if (!isInComposite)
		{
			this.releaseA11yAttribute(element, 'role');
			this.releaseA11yAttribute(element, 'aria-label');

			return;
		}

		// A role of its own is something a node can find while the canvas lives - an anchor is given a
		// href - so the role of the designer is taken back the same way its name is, and not only
		// withheld the first time round.
		if (this.hasNativeRole(element))
		{
			this.releaseA11yAttribute(element, 'role');
		}
		else
		{
			this.setA11ySemanticAttribute(element, 'role', 'group');
		}

		// What stands inside a node changes over the life of the canvas - a heading is typed into, an
		// icon gives way to a word - so the question is asked again on every rebuild and the name of
		// the designer is given back the moment the node has one of its own.
		if (this.hasOwnA11yName(element))
		{
			this.releaseA11yAttribute(element, 'aria-label');

			return;
		}

		this.setA11yName(element, name);
	}

	/**
	 * A role or a name the block brought with it belongs to the published site, and the designer is a
	 * layer laid over that site for the time of the editing: it names what has no name and leaves the
	 * rest as the library that ships the block wrote it. Everything it does write it marks as its own
	 * and takes off again before saving, so nothing of the block goes missing on the way out.
	 *
	 * The working attributes of the walk - `tabindex` and `aria-current` - belong to the block just as
	 * much: a link of a hidden slide of a carousel is out of the tab order by the will of the author.
	 * The walk cannot leave those as they are, so it writes over them and gives back what it wrote
	 * over - `setA11yAttribute` remembers the value, `restoreA11yAttribute` returns it on the screen
	 * and `serializeNodeHtml` in the markup that is saved.
	 */
	setA11ySemanticAttribute(element: HTMLElement, name: string, value: string)
	{
		if (element.hasAttribute(name))
		{
			return;
		}

		this.setA11yAttribute(element, name, value);
	}

	setActiveNode(node: Node)
	{
		if (this.activeNode)
		{
			this.restoreA11yAttribute(this.activeNode.getElement(), 'aria-current');
		}

		this.activeNode = node;
		this.setA11yAttribute(node.getElement(), 'aria-current', 'true');
	}

	removeNode(node: HTMLElement)
	{
		if (!node)
		{
			return;
		}

		// The layer of actions is about one node and every control of it acts on that node. Left
		// standing over the place of a node that is gone, it writes a record of a removal with
		// nothing in it, calls the block changed for that and says an element was removed.
		if (this.activeNode && this.activeNode.getElement() === node)
		{
			this.activeNode = null;
			this.hideHoverAreaNow();
		}

		Dom.remove(node);
		this.nodeMap.delete(node);
	}

	onMouseOver(node: Node)
	{
		if (this.saving)
		{
			return;
		}
		this.setActiveNode(node);
		const clientRect = this.adjustHoverArea();
		if (!node.isPseudoElement())
		{
			// Over the node from the body of the canvas, not from inside it: the walk watches the
			// block for children coming and going, and an overlay put inside a node would have it
			// collect the focusable set of the whole block again on every step of mouse and keyboard.
			this.showHighlight(node, clientRect);
		}
	}

	showHighlight(node: Node, clientRect: ?DOMRect)
	{
		this.highlightedNode = node;
		this.highlight.show(node.getElement(), clientRect);
	}

	hideHighlight(force: boolean = false)
	{
		this.highlightedNode = null;
		this.highlight.hide(force);
	}
}
