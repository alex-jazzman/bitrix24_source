/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, landing_backend, landing_env, landing_loc, landing_metrika, landing_ui_a11y, landing_ui_highlight, landing_ui_panel_content) {
	'use strict';

	var Node = /*#__PURE__*/function () {
		function Node(options) {
			babelHelpers.classCallCheck(this, Node);
			this.element = options.element;
			this.selector = options.selector;
			this.cardSelector = options.cardSelector;
			this.onHover = options.onHover;
			this.pseudoElement = main_core.Dom.hasClass(this.element, 'landing-designer-block-pseudo-last');
			main_core.Event.bind(this.element, 'mouseover', this.onMouseOver.bind(this));
			// `focus` does not bubble: binding on the node itself keeps a nested node the active one
			main_core.Event.bind(this.element, 'focus', this.onFocus.bind(this));
			if (options.className) {
				main_core.Dom.addClass(this.element, options.className);
			}
		}
		return babelHelpers.createClass(Node, [{
			key: "isPseudoElement",
			value: function isPseudoElement() {
				return this.pseudoElement;
			}
		}, {
			key: "getSelector",
			value: function getSelector() {
				return (this.cardSelector ? this.cardSelector + ' ' : '') + this.selector;
			}
		}, {
			key: "getCardSelector",
			value: function getCardSelector() {
				return this.cardSelector;
			}
		}, {
			key: "getOriginalSelector",
			value: function getOriginalSelector() {
				return this.selector;
			}
		}, {
			key: "getElement",
			value: function getElement() {
				return this.element;
			}
		}, {
			key: "onMouseOver",
			value: function onMouseOver(event) {
				event.stopPropagation();
				this.onHover(this);
			}
		}, {
			key: "onFocus",
			value: function onFocus(event) {
				event.stopPropagation();
				this.onHover(this);
			}
		}]);
	}();

	var _templateObject$2, _templateObject2$1, _templateObject3$1;
	var DesignerBlockUI = /*#__PURE__*/function () {
		function DesignerBlockUI() {
			babelHelpers.classCallCheck(this, DesignerBlockUI);
		}
		return babelHelpers.createClass(DesignerBlockUI, null, [{
			key: "getHoverDiv",
			value: function getHoverDiv() {
				return main_core.Tag.render(_templateObject$2 || (_templateObject$2 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-designer-block-node-hover\" data-testid=\"landing-designerblock-node-actions\"></div>"])));
			}
		}, {
			key: "getPseudoLast",
			value: function getPseudoLast() {
				return main_core.Tag.render(_templateObject2$1 || (_templateObject2$1 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-designer-block-pseudo-last\" data-testid=\"landing-designerblock-pseudo-slot\"></div>"])));
			}
		}, {
			key: "getAddNodeButton",
			value: function getAddNodeButton() {
				return main_core.Tag.render(_templateObject3$1 || (_templateObject3$1 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<button type=\"button\" class=\"landing-designer-block-node-hover-add\" data-testid=\"landing-designerblock-add-btn\">\n\t\t\t\t<span class=\"landing-designer-block-node-hover-add-title\">\n\t\t\t\t\t", "\n\t\t\t\t</span>\n\t\t\t</button>"])), landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_REPO_BUTTON'));
			}
		}]);
	}();

	var _templateObject$1;
	function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, o.apply(t, e) || t); }
	// Patched after build: super() initialises the given `this`; legacy heirs steal these constructors via .apply().
	function _superPropGet(t, o, e, r) { var p = babelHelpers.get(babelHelpers.getPrototypeOf(t.prototype ), o, e); return 2 & r && "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }

	// The cards are only collected once the panel is on screen, and the wait for that is capped for the
	// same reason the panel caps its own: `animationend` can be late, interrupted by a panel-to-panel
	// transition, or never fire at all in a background tab.
	var SHOW_ANIMATION_TIMEOUT = 600;
	var RepoPanel = /*#__PURE__*/function (_Content) {
		function RepoPanel(options) {
			var _this;
			babelHelpers.classCallCheck(this, RepoPanel);
			_this = _callSuper(this, RepoPanel, ['design_repo', {
				title: landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_REPO_TITLE'),
				scrollAnimation: true
			}]);
			_this.currentCategory = null;
			_this.selectedOption = null;
			_this.cache = new main_core.Cache.MemoryCache();
			_this.onElementSelect = options.onElementSelect;
			_this.renderTo(parent.document.body ? parent.document.body : document.body);
			main_core.Dom.addClass(_this.layout, 'landing-ui-panel-repo');
			main_core.Dom.attr(_this.layout, 'data-testid', 'landing-designerblock-repo-panel');

			// The presets stand one under another in a single column: this is a list of choices, and
			// calling it a grid would promise a second dimension to walk that is not there - and oblige
			// the markup to rows that do not exist either.
			main_core.Dom.attr(_this.content, {
				'role': 'listbox',
				'aria-label': landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_REPO_GRID'),
				'data-testid': 'landing-designerblock-repo-list'
			});
			_this.onOptionFocusInHandler = _this.onOptionFocusIn.bind(_this);
			main_core.Event.bind(_this.content, 'focusin', _this.onOptionFocusInHandler);
			_this.cardsFocusZone = null;
			// The composite itself once it is built: the teardown of the panel runs where nothing can wait
			// for a promise - the document of the canvas is going away with the window it belongs to.
			_this.readyCardsFocusZone = null;
			_this.destroyed = false;
			_this.initCardsFocusZone();

			// The panel is built with the designer and only then waits to be asked for, and what keeps it off
			// the screen until then is a transform: moved out of view it is still read and still walked. The
			// mark is put on here, taken off by show() and put back by hide(), so that neither a panel that
			// never opened nor one that has closed depends on an animation to be out of the walk.
			landing_ui_a11y.A11y.setHidden(_this.layout, true);
			return _this;
		}

		// Roving-tabindex composite over the preset cards: one Tab stop enters the list, arrow keys
		// move between options. Cards added later are tracked by the FocusZone MutationObserver.
		babelHelpers.inherits(RepoPanel, _Content);
		return babelHelpers.createClass(RepoPanel, [{
			key: "initCardsFocusZone",
			value: function initCardsFocusZone() {
				var _this2 = this;
				if (this.cardsFocusZone) {
					return this.cardsFocusZone;
				}
				this.cardsFocusZone = landing_ui_a11y.A11y.load().then(function (_ref) {
					var FocusZone = _ref.FocusZone;
					// The canvas the panel was opened from can be gone before the extension arrives, and the
					// panel is taken down with it. A zone raised after that keeps an observer on the body of
					// the editor, which outlives everything here, and nothing holds it to deactivate it.
					if (_this2.destroyed) {
						return null;
					}
					var focusZone = new FocusZone(_this2.content, {
						focusInStrategy: 'first',
						focusableElementFilter: function focusableElementFilter(element) {
							return element.getAttribute('role') === 'option';
						}
					});
					focusZone.activate();
					_this2.readyCardsFocusZone = focusZone;
					return focusZone;
				}).catch(function (error) {
					_this2.cardsFocusZone = null;
					_this2.readyCardsFocusZone = null;
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
		}, {
			key: "destroy",
			value: function destroy() {
				// Read by the raising of the composite, which can still be waiting for the extension: the flag
				// is what tells a zone arriving late that there is nothing left for it to watch.
				this.destroyed = true;
				if (this.readyCardsFocusZone) {
					this.readyCardsFocusZone.deactivate();
					this.readyCardsFocusZone = null;
				}
				this.cardsFocusZone = null;
				main_core.Event.unbind(this.content, 'focusin', this.onOptionFocusInHandler);
				this.onOptionFocusInHandler = null;
				this.selectedOption = null;
				this.remove();
			}

			/**
			 * A list of choices that never says which one is current announces the names and no state. The
			 * selection follows the walk - the option the keyboard stands on is the selected one - and exactly
			 * one option carries it at a time.
			 */
		}, {
			key: "onOptionFocusIn",
			value: function onOptionFocusIn(event) {
				// The panel is rendered into the document of the editor while this code runs in the document of
				// the canvas, so `instanceof` against the local `Element` is a question about the wrong realm.
				// What is asked instead is whether the target can answer `closest`.
				var target = event.target;
				var option = target && typeof target.closest === 'function' ? target.closest('[role="option"]') : null;
				if (!option) {
					return;
				}

				// The one card that carries the state is remembered rather than looked for among all of them.
				// A card is built once and lives as long as the panel, and every new card starts at `false`,
				// so a remembered card that left the list would only ever take a write that changes nothing.
				if (this.selectedOption && this.selectedOption !== option) {
					main_core.Dom.attr(this.selectedOption, 'aria-selected', 'false');
				}
				this.selectedOption = option;
				main_core.Dom.attr(option, 'aria-selected', 'true');
			}

			/**
			 * The composite is raised on a panel that is still hidden, and nothing inside a hidden layout
			 * counts as focusable: the set it manages starts out empty, so no card gets the entry tabindex
			 * and the arrows have nothing to walk. The set is collected again once the panel is on screen -
			 * the observer of the zone watches the grid itself and never learns that an ancestor of it
			 * stopped being hidden.
			 */
		}, {
			key: "show",
			value: function show(options) {
				// Before the layout starts moving in, and before the panel takes the focus into itself at the end
				// of that: an inert subtree has nothing to give the focus to.
				landing_ui_a11y.A11y.setHidden(this.layout, false);
				var showing = _superPropGet(RepoPanel, "show", this, 3)([options]);
				var showTimeout = null;
				var shown = new Promise(function (resolve) {
					showTimeout = setTimeout(resolve, SHOW_ANIMATION_TIMEOUT);
				});
				void Promise.all([Promise.race([showing, shown]), this.initCardsFocusZone()]).then(function (_ref2) {
					var _ref3 = babelHelpers.slicedToArray(_ref2, 2),
						focusZone = _ref3[1];
					if (focusZone) {
						focusZone.refreshElements();
					}
				})
				// The only failure of this chain is the focus zone, and initCardsFocusZone() warns about it.
				.catch(function () {}).finally(function () {
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
		}, {
			key: "hide",
			value: function hide() {
				var _this3 = this;
				return _superPropGet(RepoPanel, "hide", this, 3)([]).then(function (result) {
					landing_ui_a11y.A11y.setHidden(_this3.layout, true);
					return result;
				});
			}
		}, {
			key: "addRepository",
			value: function addRepository(repository) {
				var _this4 = this;
				repository.map(function (item) {
					_this4.addElement(item);
				});
			}
		}, {
			key: "makeElementUnique",
			value: function makeElementUnique(element) {
				var _this5 = this;
				var newManifest = {};
				var newStyleManifest = {};
				var origNodes = element.manifest.nodes;
				Object.keys(element.manifest.nodes).map(function (selector) {
					var randPostfix = '-' + _this5.randomNum(1000, 9999);
					var className = selector.substring(1);
					element.html = element.html.replaceAll(new RegExp(className + '([\\s"]{1})', 'g'), className + randPostfix + '$1');
					newManifest[selector + randPostfix] = element.manifest.nodes[selector];
					if (element.manifest.style && selector in element.manifest.style) {
						newStyleManifest[selector + randPostfix] = element.manifest.style[selector];
					}
				});
				element.manifest.nodes = newManifest;
				if (element.manifest.style) {
					Object.keys(element.manifest.style).map(function (selector) {
						if (selector in origNodes) {
							return;
						}
						var randPostfix = '-' + _this5.randomNum(1000, 9999);
						var className = selector.substring(1);
						element.html = element.html.replaceAll(new RegExp(className + '([\\s"]{1})', 'g'), className + randPostfix + '$1');
						newStyleManifest[selector + randPostfix] = element.manifest.style[selector];
					});
					element.manifest.style = newStyleManifest;
				}
				return element;
			}
		}, {
			key: "addElement",
			value: function addElement(element) {
				var _this6 = this;
				var nodeCard = new BX.Landing.UI.Card.BlockPreviewCard({
					title: element.name,
					image: '/bitrix/images/landing/designerblock/presets/' + element.code + '.jpg',
					role: 'option',
					onClick: function onClick() {
						_this6.onElementSelect(_this6.makeElementUnique(element));
						void _this6.hide();
					}
				});
				// An option with no state at all is read as a name and nothing else; the one the keyboard
				// reaches turns this into `true`.
				main_core.Dom.attr(nodeCard.layout, 'aria-selected', 'false');
				main_core.Dom.attr(nodeCard.layout, 'data-testid', 'landing-designerblock-repo-card');
				this.appendCard(nodeCard);
			}
		}, {
			key: "randomNum",
			value: function randomNum(min, max) {
				return parseInt(Math.random() * (max - min) + min);
			}
		}, {
			key: "getListContainer",
			value: function getListContainer() {
				return this.cache.remember('listContainer', function () {
					return main_core.Tag.render(_templateObject$1 || (_templateObject$1 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-layer-list-container\"></div>"])));
				});
			}
		}]);
	}(landing_ui_panel_content.Content);

	var RepoManager = /*#__PURE__*/function () {
		function RepoManager(options) {
			babelHelpers.classCallCheck(this, RepoManager);
			this.panel = new RepoPanel({
				onElementSelect: options.onElementSelect
			});
			this.panel.addRepository(options.repository);
		}
		return babelHelpers.createClass(RepoManager, [{
			key: "showPanel",
			value: function showPanel() {
				this.panel.show().then();
			}
		}, {
			key: "destroy",
			value: function destroy() {
				this.panel.destroy();
			}
		}]);
	}();

	var _templateObject, _templateObject2, _templateObject3;

	// Attributes the designer puts on canvas nodes are listed here per node and dropped before saving
	var A11Y_MARK = 'data-landing-designer-a11y';

	// Every attribute the designer can ever write on a node. The mark on an element says which of them
	// are actually there, but the mark is markup, and markup is not always ours: the html of a preset
	// comes from whoever filled the repository of elements. Read on its own, the mark would let that
	// html name attributes of the block to be thrown away on saving, so it is only ever read against
	// this list.
	var A11Y_OWNED_ATTRIBUTES = ['tabindex', 'role', 'aria-label', 'aria-current', 'inert'];

	// A key that only changes the meaning of another one. Held while the mouse works the canvas, it
	// says nothing about the keyboard walking it.
	var BARE_MODIFIER_KEYS = ['Alt', 'AltGraph', 'CapsLock', 'Control', 'Meta', 'NumLock', 'ScrollLock', 'Shift'];

	// The tags that say nothing about what the element is - and every other tag says something. A `role`
	// written over an element that carries one takes away the very meaning the tag holds, including the
	// meaning a parent is built out of: a list whose items stopped being items is a list of nothing, a
	// table whose rows stopped being rows is a table of nothing, and the same goes for the cells of one
	// and the terms of a definition list. Listing the elements that HAVE a role would be a list of the
	// whole of html, and everything forgotten in it would be broken exactly that way, so the few that
	// have none are named instead.
	var GENERIC_TAGS = ['B', 'BDI', 'BDO', 'CENTER', 'DATA', 'DIV', 'FONT', 'I', 'LABEL', 'NOBR', 'PICTURE', 'Q', 'SLOT', 'SMALL', 'SPAN', 'U'];

	// The roles that take their name from what stands inside them, by the tags that carry those roles.
	// Everything else is named by what introduces it in the markup and never by its own content: a list
	// takes no name from its own items, a row takes none from its own cells, and a section, a quote and
	// an article are named by their heading or not at all. A link and an area belong here too, and only
	// while they lead somewhere - `takesNameFromContent` asks about those two separately.
	var NAME_FROM_CONTENT_TAGS = ['BUTTON', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'OPTION', 'SUMMARY', 'TD', 'TH'];

	// Everything the browser makes a tab stop of on its own. Inside the block these are not nodes of
	// the manifest: the composite collects none of them, so the walk writes no tabindex on them and
	// they stay stops of their own - reached by Tab and answering nothing, since the designer swallows
	// what they would do.
	var NATIVE_FOCUSABLE_SELECTOR = ['a[href]', 'area[href]', 'audio[controls]', 'button', 'embed', 'iframe', 'input:not([type="hidden"])', 'object', 'select', 'summary', 'textarea', 'video[controls]', '[contenteditable]:not([contenteditable="false"])', '[tabindex]:not([tabindex^="-"])'].join(',');
	var DesignerBlock = /*#__PURE__*/function () {
		function DesignerBlock(blockNode, options) {
			var _this = this;
			babelHelpers.classCallCheck(this, DesignerBlock);
			babelHelpers.defineProperty(this, "hoverArea", null);
			babelHelpers.defineProperty(this, "activeNode", null);
			babelHelpers.defineProperty(this, "changed", false);
			babelHelpers.defineProperty(this, "saving", false);
			babelHelpers.defineProperty(this, "highlightedNode", null);
			babelHelpers.defineProperty(this, "nodesFocusZone", null);
			// The composite itself once it is built: the focus is put on a node from handlers that cannot
			// wait for a promise - what they answer about is gone by the time one resolves.
			babelHelpers.defineProperty(this, "readyNodesFocusZone", null);
			babelHelpers.defineProperty(this, "addNodeButton", null);
			babelHelpers.defineProperty(this, "hoverActions", null);
			babelHelpers.defineProperty(this, "focusTargetAfterPanel", null);
			babelHelpers.defineProperty(this, "deliberateFocusTarget", null);
			babelHelpers.defineProperty(this, "arrowsHintSpoken", false);
			babelHelpers.defineProperty(this, "foreignFocusablesArmed", false);
			babelHelpers.defineProperty(this, "foreignFocusablesObserver", null);
			babelHelpers.defineProperty(this, "canvasInputModalityWatched", false);
			// The handlers the canvas puts on documents that outlive it, kept for the teardown together with
			// the documents they went on: `destroy` has no other way back to them.
			babelHelpers.defineProperty(this, "inputModalityHandler", null);
			babelHelpers.defineProperty(this, "inputModalityListeners", []);
			babelHelpers.defineProperty(this, "saveClickHandler", null);
			babelHelpers.defineProperty(this, "historyAddNodeHandler", null);
			babelHelpers.defineProperty(this, "historyRemoveNodeHandler", null);
			babelHelpers.defineProperty(this, "canvasUnloadHandler", null);
			babelHelpers.defineProperty(this, "destroyed", false);
			if (!blockNode) {
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
			this.highlight = new landing_ui_highlight.Highlight();
			this.cardSelectors = options.manifest.cards ? Object.keys(options.manifest.cards) : [];
			this.designAllowed = !!landing_env.Env.getInstance().getOptions().design_block_allowed;
			this.cardSelectors.push(''); // for without cards elements
			this.nodeMap = new WeakMap();
			this.overwrittenA11yValues = new WeakMap();
			this.announcedNodeNames = new WeakMap();
			this.repoManager = new RepoManager({
				repository: options.repository,
				onElementSelect: this.addElement.bind(this)
			});
			this.saveButton = parent.document.getElementById('landing-design-block-save') || top.document.getElementById('landing-design-block-save') || document.getElementById('landing-design-block-save');
			BX.addCustomEvent('Landing.Editor:load', function () {
				_this.preventEvents();
				_this.initHistoryEvents();
				_this.initTopPanel();
				_this.initNodes();
				_this.initGrid();
				_this.initSliders();
				_this.initHoverArea();
				_this.initHighlightScrollSync();
				_this.initNodesFocusZone();
				_this.initCanvasEntryHint();
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
		return babelHelpers.createClass(DesignerBlock, [{
			key: "watchCanvasLifetime",
			value: function watchCanvasLifetime() {
				var _this2 = this;
				var canvasWindow = this.blockNode.ownerDocument.defaultView;
				if (!canvasWindow) {
					return;
				}
				this.canvasUnloadHandler = function () {
					return _this2.destroy();
				};

				// Both, and not one of them: `pagehide` is the one a page put into the back/forward cache
				// gets, and browsers that never fire `unload` still fire it.
				main_core.Event.bind(canvasWindow, 'pagehide', this.canvasUnloadHandler);
				main_core.Event.bind(canvasWindow, 'unload', this.canvasUnloadHandler);
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
		}, {
			key: "destroy",
			value: function destroy() {
				var _this3 = this;
				if (this.destroyed) {
					return;
				}
				this.destroyed = true;
				if (this.inputModalityHandler) {
					this.inputModalityListeners.map(function (inputDocument) {
						main_core.Event.unbind(inputDocument, 'keydown', _this3.inputModalityHandler, {
							capture: true
						});
					});
					this.inputModalityListeners = [];
					this.inputModalityHandler = null;
				}
				if (this.saveButton && this.saveClickHandler) {
					main_core.Event.unbind(this.saveButton, 'click', this.saveClickHandler);
					this.saveClickHandler = null;
				}
				if (this.historyAddNodeHandler) {
					top.BX.removeCustomEvent('Landing:onHistoryAddNode', this.historyAddNodeHandler);
					this.historyAddNodeHandler = null;
				}
				if (this.historyRemoveNodeHandler) {
					top.BX.removeCustomEvent('Landing:onHistoryRemoveNode', this.historyRemoveNodeHandler);
					this.historyRemoveNodeHandler = null;
				}
				if (this.foreignFocusablesObserver) {
					this.foreignFocusablesObserver.disconnect();
					this.foreignFocusablesObserver = null;
				}
				if (this.readyNodesFocusZone) {
					this.readyNodesFocusZone.deactivate();
					this.readyNodesFocusZone = null;
				}
				this.repoManager.destroy();
				if (this.canvasUnloadHandler) {
					var canvasWindow = this.blockNode.ownerDocument.defaultView;
					if (canvasWindow) {
						main_core.Event.unbind(canvasWindow, 'pagehide', this.canvasUnloadHandler);
						main_core.Event.unbind(canvasWindow, 'unload', this.canvasUnloadHandler);
					}
					this.canvasUnloadHandler = null;
				}
			}
		}, {
			key: "clearHtml",
			value: function clearHtml(content) {
				return content.replace(/<div class="[^"]*landing-designer-block-pseudo-last[^"]*"[^>]*>[\s]*<\/div>/g, '').replace(/<div class="[^"]*landing-highlight-border[^"]*"[^>]*>[\s]*<\/div>/g, '').replace(/url\(&quot;(.*?)&quot;\)/g, 'url($1)').replace(/\s*data-(landingwrapper)="[^"]+"\s*/g, ' ').replace(/\s*[\w-_]+--type-wrapper\s*/g, ' ').replace(/<div[\s]*>[\s]*<\/div>/g, '').replace(/\s*style=""/g, '').replace(/cursor: pointer;/g, '').replace(/user-select: none;/g, '');
			}
		}, {
			key: "serializeNodeHtml",
			value: function serializeNodeHtml(element, mode) {
				var _this4 = this;
				var copy = element.cloneNode(true);
				var marked = this.markedElements(copy);
				// A deep copy is walked in the same order as what it was made of, so every marked element of
				// the copy stands next to the one of the block - and only the block knows what was written
				// over, the copy carries the value of the walk.
				var source = this.markedElements(element);
				marked.map(function (markedElement, index) {
					_this4.ownedA11yAttributes(markedElement).filter(function (name) {
						return A11Y_OWNED_ATTRIBUTES.includes(name);
					}).map(function (name) {
						_this4.writeBackA11yValue(markedElement, source[index], name);
					});
					markedElement.removeAttribute(A11Y_MARK);
				});
				return this.clearHtml(mode === 'inner' ? copy.innerHTML : copy.outerHTML);
			}
		}, {
			key: "markedElements",
			value: function markedElements(root) {
				var elements = babelHelpers.toConsumableArray(root.querySelectorAll("[".concat(A11Y_MARK, "]")));
				if (root.hasAttribute(A11Y_MARK)) {
					elements.unshift(root);
				}
				return elements;
			}
		}, {
			key: "ownedA11yAttributes",
			value: function ownedA11yAttributes(element) {
				return (element.getAttribute(A11Y_MARK) || '').split(',').filter(Boolean);
			}
		}, {
			key: "setA11yAttribute",
			value: function setA11yAttribute(element, name, value) {
				// The mark of an element is read against this list and nothing else. An attribute outside it
				// would be written on the node and marked as the designer's own, and then saving would leave
				// it in the content of the block and take off the mark - the only trace it was ever there.
				if (!A11Y_OWNED_ATTRIBUTES.includes(name)) {
					console.warn("Designer block: '".concat(name, "' is not among the attributes the designer owns"), element);
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
		}, {
			key: "claimA11yAttribute",
			value: function claimA11yAttribute(element, name) {
				if (!A11Y_OWNED_ATTRIBUTES.includes(name)) {
					return;
				}
				this.rememberA11yValue(element, name);
				var owned = this.ownedA11yAttributes(element);
				if (!owned.includes(name)) {
					owned.push(name);
				}
				element.setAttribute(A11Y_MARK, owned.join(','));
			}
		}, {
			key: "rememberA11yValue",
			value: function rememberA11yValue(element, name) {
				var overwritten = this.overwrittenA11yValues.get(element);
				if (!overwritten) {
					overwritten = new Map();
					this.overwrittenA11yValues.set(element, overwritten);
				}

				// Only the first write meets the value of the block; every one after it meets the previous
				// value of the walk, and the walk owns none of them.
				if (!overwritten.has(name)) {
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
		}, {
			key: "writeBackA11yValue",
			value: function writeBackA11yValue(element, source, name) {
				var overwritten = source ? this.overwrittenA11yValues.get(source) : null;
				if (!overwritten || !overwritten.has(name)) {
					return;
				}
				var original = overwritten.get(name);
				if (main_core.Type.isString(original)) {
					element.setAttribute(name, original);
					return;
				}
				element.removeAttribute(name);
			}

			/**
			 * Gives a node back, on the screen, what the designer wrote over: the walk has moved on and the
			 * attribute belongs to the block again, so the mark stops calling it the designer's.
			 */
		}, {
			key: "restoreA11yAttribute",
			value: function restoreA11yAttribute(element, name) {
				this.writeBackA11yValue(element, element, name);
				var owned = this.ownedA11yAttributes(element).filter(function (ownedName) {
					return ownedName !== name;
				});
				if (owned.length > 0) {
					element.setAttribute(A11Y_MARK, owned.join(','));
					return;
				}
				element.removeAttribute(A11Y_MARK);
			}

			// Takes back only what the designer wrote. An attribute it never claimed belongs to the block, and
			// removing that one would be the same leak the mark exists to prevent, the other way round.
		}, {
			key: "releaseA11yAttribute",
			value: function releaseA11yAttribute(element, name) {
				if (this.ownedA11yAttributes(element).includes(name)) {
					this.restoreA11yAttribute(element, name);
				}
			}

			// A name written as an empty string is not a missing name: it lands on top of whatever the markup
			// of the block says the element is and takes that away as well. The phrases of the designer are
			// declared in russian, and until the translations arrive `Loc` answers with nothing.
		}, {
			key: "setA11yName",
			value: function setA11yName(element, name) {
				if (name) {
					this.setA11ySemanticAttribute(element, 'aria-label', name);
				}
			}
		}, {
			key: "preventEvents",
			value: function preventEvents() {
				var _this5 = this;
				var preventMap = {
					a: 'click',
					form: 'submit',
					input: 'keydown'
				};
				Object.keys(preventMap).map(function (tag) {
					babelHelpers.toConsumableArray(_this5.blockNode.querySelectorAll(tag)).map(function (node) {
						main_core.Event.bind(node, preventMap[tag], function (e) {
							e.preventDefault();
						});
					});
				});
			}
		}, {
			key: "initHistoryEvents",
			value: function initHistoryEvents() {
				var _this6 = this;
				BX.Landing.History.getInstance().setTypeDesignerBlock(this.blockId).then(function () {
					return landing_backend.Backend.getInstance().action("History::clearDesignerBlock", {
						blockId: _this6.blockId
					});
				});
				var body = this.getDocumentBody();

				// The events of the history are published in the document of the editor and heard there for as
				// long as it lives; the designer is built anew on every opening of the slider, so the handlers
				// are kept to be taken off again - see `destroy`.
				this.historyAddNodeHandler = function (tags) {
					var elementAdded = false;
					tags.map(function (tag) {
						var insertAfterSelector = tag.insertAfterSelector || null;
						var parentNodeSelector = tag.parentNodeSelector || null;
						var element = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["", ""])), tag.elementHtml);
						if (insertAfterSelector) {
							elementAdded = true;
							main_core.Dom.insertAfter(element, body.querySelector(insertAfterSelector));
						} else if (parentNodeSelector) {
							elementAdded = true;
							main_core.Dom.prepend(element, body.querySelector(parentNodeSelector));
						}
					});
					if (elementAdded) {
						_this6.refreshManifest();
					}
					void landing_ui_a11y.A11y.announce(landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_ANNOUNCE_CONTENT_UPDATED'));
				};
				this.historyRemoveNodeHandler = function (tags) {
					return _this6.onHistoryRemoveNode(tags);
				};
				top.BX.addCustomEvent('Landing:onHistoryAddNode', this.historyAddNodeHandler);
				top.BX.addCustomEvent('Landing:onHistoryRemoveNode', this.historyRemoveNodeHandler);
			}

			/**
			 * Undo and redo take nodes off the canvas exactly as the button of the layer of actions does, and
			 * the focus standing on one of them has the same nowhere to fall to. Who asked for the undo is a
			 * different question: the keys of the editor reach it from outside the canvas as well, and a
			 * focus that was never here is not to be dragged in.
			 */
		}, {
			key: "onHistoryRemoveNode",
			value: function onHistoryRemoveNode(tags) {
				var _this7 = this;
				var body = this.getDocumentBody();
				var elements = tags.map(function (tag) {
					return body.querySelector(tag.elementSelector);
				}).filter(Boolean);
				var losing = this.focusLosingElement(elements);
				var focusTarget = losing ? this.focusTargetBeside(losing, new Set(elements)) : null;
				elements.map(function (element) {
					return _this7.removeNode(element);
				});
				this.refreshManifest();
				if (focusTarget) {
					this.focusAfterRemoval(focusTarget);
				}
				void landing_ui_a11y.A11y.announce(landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_ANNOUNCE_CONTENT_UPDATED'));
			}
		}, {
			key: "initTopPanel",
			value: function initTopPanel() {
				var _this8 = this;
				// The button that saves the block belongs to the document of the editor and outlives the
				// canvas; the handler is kept so that `destroy` can take it off again.
				this.saveClickHandler = function () {
					_this8.hideHighlight(true);
					var finishCallback = function finishCallback() {
						if (BX.SidePanel && BX.SidePanel.Instance) {
							BX.SidePanel.Instance.close();
						}
					};
					if (!_this8.changed) {
						finishCallback();
						return;
					}
					if (!_this8.designAllowed) {
						top.BX.UI.InfoHelper.show('limit_crm_superblock');
						return;
					}
					_this8.saving = true;
					var batch = {};
					batch['Block::updateContent'] = {
						action: 'Block::updateContent',
						data: {
							lid: _this8.landingId,
							block: _this8.blockId,
							content: _this8.serializeNodeHtml(_this8.originalNode, 'inner').replaceAll(' style="', ' bxstyle="'),
							designed: 1
						}
					};
					if (_this8.autoPublicationEnabled) {
						batch['Landing::publication'] = {
							action: 'Landing::publication',
							data: {
								lid: _this8.landingId
							}
						};
					}
					batch['History::clearDesignerBlock'] = {
						action: 'History::clearDesignerBlock',
						data: {
							blockId: _this8.blockId
						}
					};
					landing_backend.Backend.getInstance().batch('Block::updateContent', batch).then(function () {
						_this8.saving = false;
						finishCallback();
					});
				};
				main_core.Event.bind(this.saveButton, 'click', this.saveClickHandler);
			}
		}, {
			key: "initNodes",
			value: function initNodes() {
				var _this9 = this;
				Object.keys(this.nodes).map(function (selector) {
					_this9.cardSelectors.map(function (cardSelector) {
						babelHelpers.toConsumableArray(_this9.blockNode.querySelectorAll((cardSelector ? cardSelector + ' ' : '') + selector)).map(function (element) {
							if (_this9.nodes[selector]['useInDesigner'] === false) {
								return;
							}
							_this9.addNode({
								element: element,
								selector: selector,
								cardSelector: cardSelector,
								type: _this9.nodes[selector]['type']
							});
						});
					});
				});
			}
		}, {
			key: "initGrid",
			value: function initGrid() {
				var _this0 = this;
				// collect node's parent and add pseudo last elements into the wrappers
				Object.keys(this.nodes).map(function (selector) {
					_this0.cardSelectors.map(function (cardSelector) {
						babelHelpers.toConsumableArray(_this0.blockNode.querySelectorAll((cardSelector ? cardSelector + ' ' : '') + selector)).map(function (element) {
							if (_this0.nodes[selector]['useInDesigner'] === false) {
								return;
							}
							var wrapper = _this0.nodes[selector]['type'] === 'icon' ? element.parentNode.parentNode : element.parentNode;
							if (main_core.Dom.attr(wrapper, 'data-landingWrapper')) {
								return;
							}
							var pseudoElement = DesignerBlockUI.getPseudoLast();
							main_core.Dom.attr(wrapper, 'data-landingWrapper', true);
							main_core.Dom.append(pseudoElement, wrapper);
							_this0.addNode({
								cardSelector: cardSelector,
								element: pseudoElement,
								className: selector.substr(1) + '-last',
								selector: selector + '-last'
							});
						});
					});
				});
			}
		}, {
			key: "initNodesFocusZone",
			value: function initNodesFocusZone() {
				var _this1 = this;
				if (this.nodesFocusZone) {
					return this.nodesFocusZone;
				}

				// The last resort focus target once the last node of the block is removed, and the one stop of
				// the walk that is not a node of it. Without a role and a name it is a stop a screen reader
				// passes over in silence. `group` says a set stands here and demands nothing of what is inside
				// it; the roles that do demand - `list`, `grid`, `tree` - would take the meaning off every node
				// that carries one of its own.
				this.setA11yAttribute(this.blockNode, 'tabindex', '-1');
				this.setA11ySemanticAttribute(this.blockNode, 'role', 'group');
				this.setA11yName(this.blockNode, landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_CANVAS_NAME'));
				this.nodesFocusZone = landing_ui_a11y.A11y.load().then(function (_ref) {
					var FocusZone = _ref.FocusZone;
					// The slider can be closed while the extension is still on its way. A zone raised after
					// that would put an observer of its own on a document nobody watches any more, and the
					// teardown that would have taken it down has already run - nothing holds a reference to
					// it to deactivate it later. The claim below is worse still: it puts the keys of the
					// canvas back on the documents of the editor, which outlive it.
					if (_this1.destroyed) {
						return null;
					}

					// Right before the zone collects its set for the first time and not a step earlier:
					// with no zone there is no walk to keep the frames of the block out of.
					_this1.claimForeignFocusables();
					var focusZone = new FocusZone(_this1.blockNode, {
						focusInStrategy: function focusInStrategy() {
							return _this1.canvasEntryTarget();
						},
						focusableElementFilter: function focusableElementFilter(element) {
							return _this1.acceptCompositeNode(element);
						}
					});
					focusZone.activate();
					_this1.readyNodesFocusZone = focusZone;
					return focusZone;
				}).catch(function (error) {
					_this1.nodesFocusZone = null;
					_this1.readyNodesFocusZone = null;
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
		}, {
			key: "initCanvasEntryHint",
			value: function initCanvasEntryHint() {
				var _this10 = this;
				main_core.Event.bind(this.blockNode, 'focusin', function (event) {
					if (_this10.arrowsHintSpoken || !_this10.isCompositeNode(event.target)) {
						return;
					}
					_this10.arrowsHintSpoken = true;
					void landing_ui_a11y.A11y.announce(landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_ANNOUNCE_ARROWS_HINT'));
				});
				main_core.Event.bind(this.blockNode, 'focusout', function (event) {
					// Walking to another node, or out to the actions over one, is still being in the canvas;
					// only leaving it altogether arms the hint for the next time somebody comes back.
					var goingTo = event.relatedTarget;
					var staysInside = goingTo && (_this10.blockNode.contains(goingTo) || _this10.hoverArea && _this10.hoverArea.contains(goingTo));
					if (!staysInside) {
						_this10.arrowsHintSpoken = false;
					}
				});
			}

			/**
			 * The filter of the composite, and the one place told about a node joining the set or falling out
			 * of it: the zone asks it about every candidate whenever it rebuilds.
			 */
		}, {
			key: "acceptCompositeNode",
			value: function acceptCompositeNode(element) {
				var accepted = this.isCompositeNode(element);
				this.applyNodeA11ySemantics(element, accepted);
				return accepted;
			}
		}, {
			key: "isCompositeNode",
			value: function isCompositeNode(element) {
				var node = this.nodeMap.get(element);

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
		}, {
			key: "hasVisibleBox",
			value: function hasVisibleBox(element) {
				var box = element.getBoundingClientRect();
				return box.width > 0 && box.height > 0;
			}
		}, {
			key: "findNodeElements",
			value: function findNodeElements(container) {
				var _this11 = this;
				return this.markedElements(container).filter(function (element) {
					return _this11.isCompositeNode(element);
				});
			}

			/**
			 * Where the keyboard lands when it comes into the canvas from outside.
			 *
			 * By default the walk starts at the top of the block - that is what the composite is for. But a
			 * node focused on purpose from outside the canvas - the element just added, the control the panel
			 * gave the focus back to - is a decision already made, and the composite redirecting it to the
			 * first node of the block would throw the keyboard back to the top of a block of many cards.
			 */
		}, {
			key: "canvasEntryTarget",
			value: function canvasEntryTarget() {
				var _this$findNodeElement = this.findNodeElements(this.blockNode),
					_this$findNodeElement2 = babelHelpers.slicedToArray(_this$findNodeElement, 1),
					first = _this$findNodeElement2[0];
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
		}, {
			key: "focusDeliberately",
			value: function focusDeliberately(element) {
				var focusZone = this.readyNodesFocusZone;

				// A node put in the document a moment ago is not in the set of the composite yet - the set is
				// rebuilt by an observer a frame later - and a focus on an element outside the set is not
				// counted at all: the walk would go on from the node the user came from.
				if (focusZone) {
					focusZone.refreshElements();
				}
				this.deliberateFocusTarget = element;
				element.focus();
				this.deliberateFocusTarget = null;
				if (!focusZone || !this.isCompositeNode(element) || focusZone.getCurrentFocusedElement() === element) {
					return;
				}

				// Having answered a focus from outside with the very element being focused, the composite
				// returns before writing down where the focus went: the single `tabindex="0"` of the walk and
				// the node the arrows count from stay behind on the node the focus came from. The same focus
				// told from INSIDE the container is written down, so the block takes it for the moment in
				// between - and gives it up in the same task, before anything is read out of it.
				this.blockNode.focus({
					preventScroll: true
				});
				element.focus();
			}

			// Tells whether it found a node to stand on: a preset put in the document a moment ago can have
			// none for this frame - an image that has not loaded its size yet is drawn nowhere - and the
			// caller has to know that the keyboard is still where it was.
		}, {
			key: "focusNodeInside",
			value: function focusNodeInside(container) {
				var _ref2 = container ? this.findNodeElements(container) : [],
					_ref3 = babelHelpers.slicedToArray(_ref2, 1),
					target = _ref3[0];
				if (!target) {
					return false;
				}
				this.focusDeliberately(target);
				return true;
			}
		}, {
			key: "findSiblingNodeElement",
			value: function findSiblingNodeElement(element, wrapper, direction) {
				var isAcceptable = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function () {
					return true;
				};
				for (var sibling = element[direction]; sibling; sibling = sibling[direction]) {
					if (wrapper.contains(sibling) && this.isCompositeNode(sibling) && isAcceptable(sibling)) {
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
		}, {
			key: "focusTargetAfterRemoval",
			value: function focusTargetAfterRemoval(node) {
				var removed = babelHelpers.toConsumableArray(this.getDocumentBody().querySelectorAll(node.getSelector()));
				var losing = this.focusLosingElement(removed);
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
		}, {
			key: "focusLosingElement",
			value: function focusLosingElement(removed) {
				if (!document.hasFocus()) {
					return null;
				}
				var holder = removed.find(function (element) {
					return element.contains(document.activeElement);
				});
				if (holder) {
					return holder;
				}
				var activeElement = this.activeNode ? this.activeNode.getElement() : null;
				return activeElement && this.hasFocusInsideHoverArea() && removed.includes(activeElement) ? activeElement : null;
			}

			/**
			 * The node the focus moves on to once the given set leaves the document: the nearest neighbour
			 * inside the same card, then any node of the block that outlives the removal, and the block
			 * itself when there is nothing left of it to stand on.
			 */
		}, {
			key: "focusTargetBeside",
			value: function focusTargetBeside(element, removed) {
				var survives = function survives(candidate) {
					return !removed.has(candidate);
				};
				var wrapper = element.closest('[data-landingWrapper]') || this.blockNode;
				var sibling = this.findSiblingNodeElement(element, wrapper, 'nextElementSibling', survives) || this.findSiblingNodeElement(element, wrapper, 'previousElementSibling', survives);
				if (sibling) {
					return sibling;
				}
				return this.findNodeElements(this.blockNode).find(function (candidate) {
					return candidate !== element && survives(candidate);
				}) || this.blockNode;
			}

			/**
			 * Last line of defence for the return of focus: whatever else took the target out of the document
			 * between the choice and the removal, focusing a detached element is silently the same as focusing
			 * nothing - the focus goes to the body of the canvas, the very outcome the return exists to
			 * prevent. The block itself is always there to take it.
			 */
		}, {
			key: "focusAfterRemoval",
			value: function focusAfterRemoval(target) {
				var survivor = target && target.isConnected ? target : this.blockNode;
				this.focusDeliberately(survivor);
			}
		}, {
			key: "initSliders",
			value: function initSliders() {
				var sliderSelector = '.js-carousel';
				babelHelpers.toConsumableArray(this.blockNode.querySelectorAll(sliderSelector)).map(function (slider) {
					var count = (main_core.Text.toNumber(slider.dataset.slidesShow) || 1) * (main_core.Text.toNumber(slider.dataset.rows) || 1);
					var selector = ".".concat(babelHelpers.toConsumableArray(slider.classList).join('.'), " .js-slide:not(:nth-child(-n+").concat(count, "))");
					document.head.appendChild(main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["<style>", "{display: none !important;}</style>"])), selector));
				});
			}
		}, {
			key: "initHoverArea",
			value: function initHoverArea() {
				var _this12 = this;
				if (this.hoverArea) {
					return;
				}
				this.hoverArea = DesignerBlockUI.getHoverDiv();
				var addNodeElement = DesignerBlockUI.getAddNodeButton();
				this.addNodeButton = addNodeElement;
				var CardAction = BX.Landing.UI.Button.CardAction;
				var BaseButtonPanel = BX.Landing.UI.Panel.BaseButtonPanel;
				var cardAction = new BaseButtonPanel('nodeAction', 'landing-ui-panel-block-card-action');
				this.hoverActions = cardAction.layout;
				main_core.Event.bind(addNodeElement, 'click', function () {
					_this12.repoManager.showPanel();
					_this12.hideHoverArea();
				});
				var removeButton = new CardAction('remove', {
					html: '&nbsp;',
					ariaLabel: landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_NODE_REMOVE'),
					onClick: this.removeElement.bind(this)
				});
				main_core.Dom.attr(removeButton.layout, 'data-testid', 'landing-designerblock-remove-btn');
				cardAction.addButton(removeButton);
				void cardAction.show();
				main_core.Dom.append(addNodeElement, this.hoverArea);
				main_core.Dom.append(cardAction.layout, this.hoverArea);
				main_core.Dom.append(this.hoverArea, this.getDocumentBody());
				// The layer is built with the canvas, long before anything is hovered or focused. Parked off
				// the screen it would still be a stop of the tab order, and its controls act on the active
				// node - which is nothing yet. It is shown by the positioning, once there is a node to act on.
				this.hideHoverAreaNow();
				main_core.Event.bind(this.blockNode, 'mouseover', function () {
					// The keyboard scenario lives inside the layer: hiding it under the pointer breaks it.
					if (_this12.hasFocusInsideHoverArea()) {
						return;
					}
					_this12.hideHoverArea();
				});
				this.initNodeActionKeys();
				this.repoManager.panel.subscribe('onHide', this.onRepoPanelHide.bind(this));
			}

			/**
			 * The frame over the node is laid in coordinates of the viewport, while the layer of actions over
			 * the same node stands in those of the document. The canvas scrolls on its own, so a wheel turned
			 * without moving the pointer takes one of them along and leaves the other behind.
			 */
		}, {
			key: "initHighlightScrollSync",
			value: function initHighlightScrollSync() {
				var _this13 = this;
				var scheduled = false;
				main_core.Event.bind(this.blockNode.ownerDocument, 'scroll', function () {
					// Scroll does not bubble up from an element, so the listener is a capturing one; and the
					// frame is only worth moving while there is one on screen.
					if (scheduled || !_this13.highlightedNode) {
						return;
					}
					scheduled = true;
					requestAnimationFrame(function () {
						scheduled = false;
						var node = _this13.highlightedNode;
						if (node) {
							_this13.showHighlight(node, node.getElement().getBoundingClientRect());
						}
					});
				}, {
					capture: true,
					passive: true
				});
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
		}, {
			key: "onRepoPanelHide",
			value: function onRepoPanelHide() {
				var _this14 = this;
				// The panel announces the closing before it looks at whether it was open, and one Escape in
				// the editor reaches every panel it knows. A panel that was never on screen has no focus to
				// give back, and taking one would drag the keyboard into the canvas from wherever the user
				// actually was.
				if (!this.repoManager.panel.isShown()) {
					return;
				}
				var addedElement = this.focusTargetAfterPanel;
				this.focusTargetAfterPanel = null;
				var claim = function claim() {
					if (addedElement && _this14.focusNodeInside(addedElement)) {
						return;
					}

					// The element was added and has nothing to stand on yet, or the panel was closed without
					// picking anything: either way the focus belongs to the control the panel was opened
					// from. The block itself takes it when there is no node for the layer to stand over.
					if (_this14.focusAddNodeButton()) {
						return;
					}
					_this14.focusDeliberately(_this14.blockNode);
				};
				setTimeout(function () {
					claim();

					// The panel hands the focus back to whatever held it in the document of the editor, and
					// the holder of a panel opened from inside the canvas is the frame element itself. Focus
					// put on a frame lands on the body of its document, not on the control the focus came
					// from, so the claim is looked at once more after that restore has run. Once, not in a
					// loop: a second empty body means the focus was taken by something else, and fighting
					// for it would only hide that.
					requestAnimationFrame(function () {
						if (document.activeElement === document.body) {
							claim();
						}
					});
				}, 0);
			}
		}, {
			key: "initNodeActionKeys",
			value: function initNodeActionKeys() {
				var _this15 = this;
				main_core.Event.bind(this.blockNode, 'keydown', function (event) {
					if (event.key !== 'Enter' && event.key !== ' ') {
						return;
					}
					if (!_this15.isCompositeNode(event.target)) {
						return;
					}
					event.preventDefault();
					_this15.focusAddNodeButton();
				});
			}
		}, {
			key: "focusAddNodeButton",
			value: function focusAddNodeButton() {
				if (!this.addNodeButton || !this.activeNode) {
					return false;
				}
				this.adjustHoverArea();
				this.addNodeButton.focus();
				return true;
			}
		}, {
			key: "hasFocusInsideHoverArea",
			value: function hasFocusInsideHoverArea() {
				return !!this.hoverArea && this.hoverArea.contains(document.activeElement);
			}

			/**
			 * @return {?DOMRect} the geometry of the active node, for whoever else has to lay something over it
			 */
		}, {
			key: "adjustHoverArea",
			value: function adjustHoverArea() {
				// Nothing to lay the layer over until a node is active, and nothing for its controls to act on.
				if (!this.hoverArea || !this.activeNode) {
					return null;
				}

				// The node is measured before the layer is shown. The layer is positioned absolutely and
				// cannot move the node, but a style written before geometry is read makes the browser
				// recalculate the layout on the spot - once per step of the keyboard walk.
				var clientRect = this.activeNode.getElement().getBoundingClientRect();
				// Read here and not where it is used: the scroll of a window depends on the layout too, and asked
				// for after a style has been written it makes the browser recalculate the layout a second time.
				var editorScroll = BX.Landing.PageObject.getEditorWindow().scrollY;
				this.showHoverArea();
				if (this.hoverActions) {
					if (this.activeNode.isPseudoElement()) {
						main_core.Dom.hide(this.hoverActions);
					} else {
						main_core.Dom.show(this.hoverActions);
					}
				}
				if (this.addNodeButton) {
					main_core.Dom.style(this.addNodeButton, {
						top: clientRect.height - 5 + 'px'
					});
				}
				main_core.Dom.style(this.hoverArea, {
					top: clientRect.top + editorScroll + 'px',
					left: clientRect.left + (clientRect.width < 30 ? 30 : 0) + 'px',
					width: clientRect.width + 'px',
					height: '35px'
				});
				return clientRect;
			}
		}, {
			key: "showHoverArea",
			value: function showHoverArea() {
				if (this.hoverArea) {
					main_core.Dom.show(this.hoverArea);
				}
			}
		}, {
			key: "hideHoverArea",
			value: function hideHoverArea() {
				var _this16 = this;
				if (!this.hoverArea) {
					return;
				}
				setTimeout(function () {
					// The focus can arrive in the layer between the moment the hiding was asked for and the
					// moment it happens - the return of focus after the panel closes does exactly that. A
					// layer hidden then takes the focus down to the body of the canvas, which is the outcome
					// the return of focus exists to prevent, so the question is asked here and not earlier.
					if (_this16.hasFocusInsideHoverArea()) {
						return;
					}
					main_core.Dom.hide(_this16.hoverArea);
				}, 0);
			}

			// The same, without waiting for the next task: used where the layer must not be reachable even
			// for that one task - at the very creation of it, before any node is active.
		}, {
			key: "hideHoverAreaNow",
			value: function hideHoverAreaNow() {
				if (this.hoverArea) {
					main_core.Dom.hide(this.hoverArea);
				}
			}
		}, {
			key: "refreshManifest",
			value: function refreshManifest(manifest) {
				var _this17 = this;
				if (manifest) {
					Object.keys(manifest).map(function (selector) {
						_this17.nodes[selector] = manifest[selector];
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
		}, {
			key: "claimForeignFocusables",
			value: function claimForeignFocusables() {
				var _this18 = this;
				this.watchForeignFocusables();
				this.watchCanvasInputModality();
				this.foreignFocusables().map(function (element) {
					return _this18.claimForeignFocusable(element);
				});
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
		}, {
			key: "watchCanvasInputModality",
			value: function watchCanvasInputModality() {
				var _this19 = this;
				if (this.canvasInputModalityWatched) {
					return;
				}
				this.canvasInputModalityWatched = true;
				this.inputModalityHandler = function (event) {
					if (!BARE_MODIFIER_KEYS.includes(event.key)) {
						_this19.armForeignFocusables();
					}
				};

				// The documents listened to are kept and not asked for again: the answer of
				// `inputModalityDocuments` depends on a canvas that is gone by the time `destroy` runs.
				this.inputModalityListeners = this.inputModalityDocuments();
				this.inputModalityListeners.map(function (inputDocument) {
					main_core.Event.bind(inputDocument, 'keydown', _this19.inputModalityHandler, {
						capture: true
					});
				});
				['pointerover', 'pointermove'].map(function (eventName) {
					main_core.Event.bind(_this19.blockNode, eventName, function () {
						return _this19.disarmForeignFocusables();
					}, {
						capture: true
					});
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
		}, {
			key: "inputModalityDocuments",
			value: function inputModalityDocuments() {
				var documents = [];
				[this.blockNode.ownerDocument, document, parent.document, top.document].map(function (candidate) {
					if (candidate && !documents.includes(candidate)) {
						documents.push(candidate);
					}
				});
				return documents;
			}
		}, {
			key: "armForeignFocusables",
			value: function armForeignFocusables() {
				var _this20 = this;
				if (this.foreignFocusablesArmed) {
					return;
				}
				this.foreignFocusablesArmed = true;
				this.foreignFrames().map(function (frame) {
					return _this20.setA11yAttribute(frame, 'inert', '');
				});

				// A frame given back to the mouse is a frame the walk collects, and the composite hands its
				// single tab stop to whatever the pointer focuses inside its set: a click meant to start a
				// video moves that stop onto the frame. The key heard here would then take the frame out of
				// the walk and leave the canvas with no tab stop at all - the nodes still carry `tabindex="-1"`
				// and the set is only rebuilt on the next animation frame, a whole Tab too late. Rebuilding it
				// in the same key gives the stop back to a node of the block before the browser reads the tab
				// order. There is nothing to rebuild before the zone is up, and nothing to rebuild twice: the
				// arming happens once per walk.
				if (this.readyNodesFocusZone) {
					this.readyNodesFocusZone.refreshElements();
				}
			}
		}, {
			key: "disarmForeignFocusables",
			value: function disarmForeignFocusables() {
				var _this21 = this;
				if (!this.foreignFocusablesArmed) {
					return;
				}
				this.foreignFocusablesArmed = false;
				// By the mark and not by the selector: a frame that stopped answering it between the two calls
				// - taken out of the document and put back, given a node of the manifest inside - would keep an
				// `inert` nobody ever takes off, and its whole subtree with it.
				this.markedElements(this.blockNode).filter(function (element) {
					return _this21.ownedA11yAttributes(element).includes('inert');
				}).map(function (element) {
					return _this21.releaseA11yAttribute(element, 'inert');
				});
			}
		}, {
			key: "foreignFocusables",
			value: function foreignFocusables() {
				var _this22 = this;
				return babelHelpers.toConsumableArray(this.blockNode.querySelectorAll(NATIVE_FOCUSABLE_SELECTOR)).filter(function (element) {
					return !_this22.holdsCompositeNode(element);
				});
			}

			// The only ones the mark is held for, and the only ones it is needed for: a frame goes past the
			// filter of the walk whatever tabindex it carries.
		}, {
			key: "foreignFrames",
			value: function foreignFrames() {
				return this.foreignFocusables().filter(function (element) {
					return element.tagName === 'IFRAME';
				});
			}

			// An element holding a node of the manifest is left alone whatever it is: `inert` would take the
			// node out of the walk along with the subtree around it, and a node inside a link is put there by
			// `addElement` itself.
		}, {
			key: "holdsCompositeNode",
			value: function holdsCompositeNode(element) {
				var _this23 = this;
				return this.markedElements(element).some(function (marked) {
					return _this23.nodeMap.has(marked);
				});
			}

			/**
			 * A frame is claimed whether it is marked or not. Live for the mouse, it is collected by the
			 * walk, and the walk writes its own `tabindex` on everything it collects; claimed, that write
			 * belongs to the designer and serialization takes it off, so the frame still leaves the canvas
			 * carrying the markup of the block and nothing of ours.
			 */
		}, {
			key: "claimForeignFocusable",
			value: function claimForeignFocusable(element) {
				// Only a frame goes past the filter of the walk and takes a `tabindex` from it; the rest is
				// never collected, so there is no write of the walk on them to give back.
				if (element.tagName === 'IFRAME') {
					this.claimA11yAttribute(element, 'tabindex');
					if (this.foreignFocusablesArmed) {
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
		}, {
			key: "watchForeignFocusables",
			value: function watchForeignFocusables() {
				var _this24 = this;
				if (this.foreignFocusablesObserver) {
					return;
				}
				this.foreignFocusablesObserver = new MutationObserver(function (records) {
					records.flatMap(function (record) {
						return babelHelpers.toConsumableArray(record.addedNodes);
					}).filter(function (node) {
						return main_core.Type.isElementNode(node);
					}).flatMap(function (node) {
						return [node].concat(babelHelpers.toConsumableArray(node.querySelectorAll(NATIVE_FOCUSABLE_SELECTOR)));
					}).filter(function (node) {
						return node.matches(NATIVE_FOCUSABLE_SELECTOR) && !_this24.holdsCompositeNode(node);
					}).map(function (element) {
						return _this24.claimForeignFocusable(element);
					});
				});
				this.foreignFocusablesObserver.observe(this.blockNode, {
					childList: true,
					subtree: true
				});
			}
		}, {
			key: "getDocumentBody",
			value: function getDocumentBody() {
				return document.body;
			}
		}, {
			key: "isInsideElement",
			value: function isInsideElement(element) {
				return element.parentElement.tagName === 'A';
			}
		}, {
			key: "addElement",
			value: function addElement(repoElement) {
				var _this25 = this;
				var activeNode = this.activeNode;
				// The controls of the layer can be reached before anything has been picked; there is nothing
				// to insert next to then, and the node they read would be nothing at all.
				if (!activeNode) {
					return;
				}
				var tags = [];
				var activeElement = activeNode.getElement();
				var insertedElements = [];
				var insertedHere = null;
				babelHelpers.toConsumableArray(this.getDocumentBody().querySelectorAll(activeNode.getSelector())).map(function (node) {
					var elementHtml = repoElement.html;
					var element = main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["", ""])), elementHtml);
					var insertAfter = _this25.isInsideElement(node) ? node.parentNode : node;
					main_core.Dom.insertAfter(element, insertAfter);
					insertedElements.push(element);
					if (node === activeElement) {
						insertedHere = element;
					}
					tags.push({
						elementHtml: elementHtml,
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
				void landing_ui_a11y.A11y.announce(landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_ANNOUNCE_NODE_ADDED'));
				landing_backend.Backend.getInstance().action("History::pushDesignerBlock", {
					blockId: this.blockId,
					action: 'ADD_NODE',
					data: {
						tags: tags
					}
				}).then(function (result) {
					BX.Landing.History.getInstance().push();
				});
			}
		}, {
			key: "removeElement",
			value: function removeElement() {
				var _this26 = this;
				// Same as addElement: nothing is active until a node has been picked, and there is nothing
				// to remove.
				if (!this.activeNode) {
					return;
				}
				var tags = [];
				// Everything below is about one node, and `activeNode` stops being that node halfway through:
				// handing the focus to the neighbour makes the neighbour active, synchronously, before the
				// record of the removal is written. Kept in a variable, the node stays the one the user asked
				// to remove.
				var removed = this.activeNode;
				var focusTarget = this.focusTargetAfterRemoval(removed);
				this.hideHoverArea();
				this.hideHighlight();
				setTimeout(function () {
					babelHelpers.toConsumableArray(_this26.getDocumentBody().querySelectorAll(removed.getSelector())).map(function (node) {
						tags.push({
							elementHtml: _this26.serializeNodeHtml(node, 'outer'),
							elementSelector: BX.Landing.Utils.getCSSSelector(node),
							insertAfterSelector: node.previousElementSibling ? BX.Landing.Utils.getCSSSelector(node.previousElementSibling) : null,
							parentNodeSelector: BX.Landing.Utils.getCSSSelector(node.parentNode)
						});
						_this26.removeNode(node);
					});
					_this26.changed = true;
					_this26.refreshManifest();
					if (focusTarget) {
						_this26.focusAfterRemoval(focusTarget);
					}
					void landing_ui_a11y.A11y.announce(landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_ANNOUNCE_NODE_REMOVED'));
					landing_backend.Backend.getInstance().action("History::pushDesignerBlock", {
						blockId: _this26.blockId,
						action: 'REMOVE_NODE',
						data: {
							selector: removed.getOriginalSelector(),
							tags: tags
						}
					}).then(function (result) {
						BX.Landing.History.getInstance().push();
					});
				}, 0);
			}
		}, {
			key: "typeWithWrapper",
			value: function typeWithWrapper(type) {
				return type === 'icon' || type === 'embed';
			}
		}, {
			key: "addNode",
			value: function addNode(nodeOptions) {
				if (nodeOptions.selector.match(/^\.[\w-_]+$/i) === null) {
					return false;
				}
				var manifestSelector = nodeOptions.selector;

				// for some type we get parent node
				var withWrapper = this.typeWithWrapper(nodeOptions.type);
				nodeOptions.element = withWrapper ? nodeOptions.element.parentNode : nodeOptions.element;

				// Asked about the element that is about to be recorded and not the one the manifest named: for
				// the types that carry a wrapper the two are different, and a guard asking about the second one
				// answers "new" on every refresh of the manifest - a second node on the same element, with a
				// second pair of listeners, for every edit the user makes.
				if (this.nodeMap.get(nodeOptions.element)) {
					return false;
				}
				if (withWrapper) {
					nodeOptions.selector = nodeOptions.selector + '--type-wrapper';
					main_core.Dom.addClass(nodeOptions.element, nodeOptions.selector.substr(1));
				}
				// mouse over callback
				nodeOptions.onHover = this.onMouseOver.bind(this);
				var node = new Node(nodeOptions);
				this.nodeMap.set(nodeOptions.element, node);
				if (node.isPseudoElement()) {
					this.setNodeA11yAttributes(nodeOptions.element, manifestSelector, true);
				} else {
					this.setNodeA11yAttributes(nodeOptions.element, manifestSelector);
				}
				return true;
			}
		}, {
			key: "setNodeA11yAttributes",
			value: function setNodeA11yAttributes(element, manifestSelector) {
				var isPlaceToAdd = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
				this.setA11yAttribute(element, 'tabindex', '-1');
				var manifestNode = this.nodes[manifestSelector];
				var name = isPlaceToAdd ? landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_NODE_ADD_PLACE') : manifestNode && manifestNode.name ? manifestNode.name : landing_loc.Loc.getMessage('LANDING_DESIGN_BLOCK_NODE_DEFAULT_NAME');
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
		}, {
			key: "hasNativeRole",
			value: function hasNativeRole(element) {
				// A link is a link while it leads somewhere: an anchor with no href is a piece of text carrying
				// no role at all, and there is nothing there for the designer to step aside for.
				if (element.tagName === 'A' || element.tagName === 'AREA') {
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
		}, {
			key: "hasOwnA11yName",
			value: function hasOwnA11yName(element) {
				// An image says what its `alt` says, and a decorative one - an empty `alt` - says nothing at
				// all: there the name of the manifest is the only name the node can be given, while the role of
				// the image stays its own either way.
				if (element.tagName === 'IMG') {
					return (element.getAttribute('alt') || '').trim() !== '';
				}
				if (!this.takesNameFromContent(element)) {
					return false;
				}
				if (element.textContent.trim() !== '' || (element.getAttribute('title') || '').trim() !== '') {
					return true;
				}

				// An icon of a link is often a picture, and a picture that says something names the link.
				return babelHelpers.toConsumableArray(element.querySelectorAll('img')).some(function (image) {
					return (image.getAttribute('alt') || '').trim() !== '';
				});
			}

			// A link and an area take their name from their content while they lead somewhere; an anchor with
			// no href carries no role at all, and a role with no name of its own takes the name of the manifest.
		}, {
			key: "takesNameFromContent",
			value: function takesNameFromContent(element) {
				if (element.tagName === 'A' || element.tagName === 'AREA') {
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
		}, {
			key: "applyNodeA11ySemantics",
			value: function applyNodeA11ySemantics(element, isInComposite) {
				var name = this.announcedNodeNames.get(element);
				// Nothing was ever meant for this element: it is no node of the manifest.
				if (!main_core.Type.isString(name)) {
					return;
				}
				if (!isInComposite) {
					this.releaseA11yAttribute(element, 'role');
					this.releaseA11yAttribute(element, 'aria-label');
					return;
				}

				// A role of its own is something a node can find while the canvas lives - an anchor is given a
				// href - so the role of the designer is taken back the same way its name is, and not only
				// withheld the first time round.
				if (this.hasNativeRole(element)) {
					this.releaseA11yAttribute(element, 'role');
				} else {
					this.setA11ySemanticAttribute(element, 'role', 'group');
				}

				// What stands inside a node changes over the life of the canvas - a heading is typed into, an
				// icon gives way to a word - so the question is asked again on every rebuild and the name of
				// the designer is given back the moment the node has one of its own.
				if (this.hasOwnA11yName(element)) {
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
		}, {
			key: "setA11ySemanticAttribute",
			value: function setA11ySemanticAttribute(element, name, value) {
				if (element.hasAttribute(name)) {
					return;
				}
				this.setA11yAttribute(element, name, value);
			}
		}, {
			key: "setActiveNode",
			value: function setActiveNode(node) {
				if (this.activeNode) {
					this.restoreA11yAttribute(this.activeNode.getElement(), 'aria-current');
				}
				this.activeNode = node;
				this.setA11yAttribute(node.getElement(), 'aria-current', 'true');
			}
		}, {
			key: "removeNode",
			value: function removeNode(node) {
				if (!node) {
					return;
				}

				// The layer of actions is about one node and every control of it acts on that node. Left
				// standing over the place of a node that is gone, it writes a record of a removal with
				// nothing in it, calls the block changed for that and says an element was removed.
				if (this.activeNode && this.activeNode.getElement() === node) {
					this.activeNode = null;
					this.hideHoverAreaNow();
				}
				main_core.Dom.remove(node);
				this.nodeMap.delete(node);
			}
		}, {
			key: "onMouseOver",
			value: function onMouseOver(node) {
				if (this.saving) {
					return;
				}
				this.setActiveNode(node);
				var clientRect = this.adjustHoverArea();
				if (!node.isPseudoElement()) {
					// Over the node from the body of the canvas, not from inside it: the walk watches the
					// block for children coming and going, and an overlay put inside a node would have it
					// collect the focusable set of the whole block again on every step of mouse and keyboard.
					this.showHighlight(node, clientRect);
				}
			}
		}, {
			key: "showHighlight",
			value: function showHighlight(node, clientRect) {
				this.highlightedNode = node;
				this.highlight.show(node.getElement(), clientRect);
			}
		}, {
			key: "hideHighlight",
			value: function hideHighlight() {
				var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
				this.highlightedNode = null;
				this.highlight.hide(force);
			}
		}]);
	}();

	exports.DesignerBlock = DesignerBlock;

})(this.BX.Landing = this.BX.Landing || {}, BX, BX.Landing, BX.Landing, BX.Landing, BX.Landing, BX.Landing.UI, BX.Landing.UI, BX.Landing.UI.Panel);
//# sourceMappingURL=designerblock.bundle.js.map
