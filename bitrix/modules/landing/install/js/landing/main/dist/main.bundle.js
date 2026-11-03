/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, landing_env, landing_loc, landing_ui_a11y, landing_ui_panel_content, landing_ui_panel_saveblock, landing_ui_panel_floatingnodepanel, landing_sliderhacks, landing_pageobject, landing_backend) {
	'use strict';

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _postMessages = /*#__PURE__*/new WeakMap();
	var _currentMobileTop = /*#__PURE__*/new WeakMap();
	var _mouseEntered = /*#__PURE__*/new WeakMap();
	var _disableControls = /*#__PURE__*/new WeakMap();
	var _currentMousePosition = /*#__PURE__*/new WeakMap();
	var _blocksMobileTops = /*#__PURE__*/new WeakMap();
	var _ExternalControls_brand = /*#__PURE__*/new WeakSet();
	let ExternalControls = /*#__PURE__*/function () {
		function ExternalControls() {
			babelHelpers.classCallCheck(this, ExternalControls);
			/**
			 * Registers all required listeners.
			 */
			_classPrivateMethodInitSpec(this, _ExternalControls_brand);
			_classPrivateFieldInitSpec(this, _postMessages, {
				mode: 'mode',
				register: 'register',
				changeState: 'changestate',
				editorEnable: 'editorenable',
				showControls: 'showcontrols',
				showBlockControls: 'showblockcontrols',
				hideAll: 'hideall',
				backendAction: 'backendaction'
			});
			_classPrivateFieldInitSpec(this, _currentMobileTop, -1);
			_classPrivateFieldInitSpec(this, _mouseEntered, false);
			_classPrivateFieldInitSpec(this, _disableControls, false);
			_classPrivateFieldInitSpec(this, _currentMousePosition, 0);
			_classPrivateFieldInitSpec(this, _blocksMobileTops, []);
			if (Main.isExternalControlsEnabled() && landing_env.Env.getInstance().isBlockControlsEnabled()) {
				_assertClassBrand(_ExternalControls_brand, this, _registerListeners).call(this);
			}
		}
		return babelHelpers.createClass(ExternalControls, [{
			key: "onBackendAction",
			value:
			/**
			 * Invokes when backend action occurred.
			 */
			function onBackendAction(action, data) {
				_classPrivateFieldSet(_disableControls, this, false);
				this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).backendAction, {
					action,
					data
				});
			}

			/**
			 * Creates and returns Block object for sending to external window.
			 *
			 * @param {BX.Landing.} block
			 * @return {Block}
			 */
		}, {
			key: "isControlsExternal",
			value:
			/**
			 * Checks that landing controls is external
			 *
			 * @return {boolean}
			 */
			function isControlsExternal() {
				return main_core.Dom.hasClass(document.body, 'landing-ui-external-controls');
			}

			/**
			 * Recalculates block tops.
			 *
			 * @param {boolean} resetMobileTop
			 */
		}, {
			key: "recalculateTops",
			value: function recalculateTops(resetMobileTop) {
				_classPrivateFieldSet(_blocksMobileTops, this, []);
				if (resetMobileTop) {
					_classPrivateFieldSet(_currentMobileTop, this, -1);
				}
				[...document.body.querySelectorAll('.block-wrapper')].map(block => {
					const blockRect = block.getBoundingClientRect();
					if (blockRect.height > 1)
						// hidden on mobile blocks
						{
							_classPrivateFieldGet(_blocksMobileTops, this).push({
								blockId: parseInt(block.getAttribute('data-id')),
								top: blockRect.top,
								height: blockRect.height
							});
						}
				});
				this.onMobileMouseMove(_classPrivateFieldGet(_currentMousePosition, this));
			}

			/**
			 * Recalculates block tops only if external controls are enabled.
			 *
			 * @param {boolean} resetMobileTop
			 */
		}, {
			key: "recalculateTopsIfExternals",
			value: function recalculateTopsIfExternals(resetMobileTop) {
				if (this.isControlsExternal()) {
					this.recalculateTops(resetMobileTop);
				}
			}

			/**
			 * Call when user moves mouse over the mobile page.
			 *
			 * @param {number} top
			 */
		}, {
			key: "onMobileMouseMove",
			value: function onMobileMouseMove(top) {
				if (_classPrivateFieldGet(_disableControls, this) || !this.isControlsExternal()) {
					return;
				}
				if (top <= 0) {
					_classPrivateFieldSet(_currentMobileTop, this, -1);
					return;
				}
				_classPrivateFieldSet(_currentMousePosition, this, top);
				for (let i = 0, c = _classPrivateFieldGet(_blocksMobileTops, this).length; i < c; i++) {
					if (top >= _classPrivateFieldGet(_blocksMobileTops, this)[i]['top'] && (!_classPrivateFieldGet(_blocksMobileTops, this)[i + 1] || top < _classPrivateFieldGet(_blocksMobileTops, this)[i + 1]['top'])) {
						if (_classPrivateFieldGet(_blocksMobileTops, this)[i]['top'] !== _classPrivateFieldGet(_currentMobileTop, this)) {
							_classPrivateFieldSet(_currentMobileTop, this, _classPrivateFieldGet(_blocksMobileTops, this)[i]['top']);
							this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).showControls, {
								blockId: _classPrivateFieldGet(_blocksMobileTops, this)[i]['blockId'],
								top: _classPrivateFieldGet(_blocksMobileTops, this)[i]['top'],
								height: _classPrivateFieldGet(_blocksMobileTops, this)[i]['height']
							});
						}
						break;
					}
				}
			}

			/**
			 * Sends action with payload to parent window.
			 *
			 * @param {string} action
			 * @param {Object} payload
			 */
		}, {
			key: "postExternalCommand",
			value: function postExternalCommand(action, payload) {
				if (window.parent) {
					window.parent.postMessage({
						action,
						payload
					}, window.location.origin);
				}
			}

			/**
			 * Receives actions with payload from parent window.
			 *
			 * @param {string} action
			 * @param {Object} payload
			 */
		}, {
			key: "listenExternalCommands",
			value: function listenExternalCommands(action, payload) {
				const block = BX.Landing.PageObject.getBlocks().get(payload?.blockId ? payload.blockId : -1);
				if (payload?.blockId && !block) {
					return;
				}
				const successCallback = () => {
					setTimeout(() => {
						_classPrivateFieldSet(_currentMousePosition, this, 0);
						this.recalculateTops();
					}, 300);
				};
				switch (action) {
					case 'onDesignerBlockClick':
						{
							block.onDesignerBlockClick();
							break;
						}
					case 'onEditBlockClick':
						{
							block.onShowContentPanel();
							break;
						}
					case 'onStyleBlockClick':
						{
							block.onStyleShow();
							break;
						}
					case 'onSortDownBlockClick':
						{
							block.moveDown();
							successCallback();
							break;
						}
					case 'onSortUpBlockClick':
						{
							block.moveUp();
							successCallback();
							break;
						}
					case 'onRemoveBlockClick':
						{
							block.deleteBlock();
							break;
						}
					case 'onChangeStateBlockClick':
						{
							block.onStateChange();
							break;
						}
					case 'onCutBlockClick':
						{
							Main.getInstance().onCutBlock.bind(Main.getInstance(), block)();
							break;
						}
					case 'onCopyBlockClick':
						{
							Main.getInstance().onCopyBlock.bind(Main.getInstance(), block)();
							break;
						}
					case 'onPasteBlockClick':
						{
							Main.getInstance().onPasteBlock.bind(Main.getInstance(), block, blockId => {
								setTimeout(() => {
									_assertClassBrand(_ExternalControls_brand, this, _registerNewBlock).call(this, blockId);
								}, 300);
							})();
							break;
						}
					case 'onFeedbackClick':
						{
							block.showFeedbackForm();
							break;
						}
					case 'onSaveInLibraryClick':
						{
							block.saveBlock();
							break;
						}
					case 'onHideEditorPanel':
						{
							BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
							break;
						}
				}
			}
		}]);
	}();
	function _registerListeners() {
		setTimeout(() => {
			_assertClassBrand(_ExternalControls_brand, this, _registerBlocks).call(this);
		}, 0);

		// listening commands from outer frame
		window.addEventListener('message', event => {
			if (this.isControlsExternal()) {
				this.listenExternalCommands(event.data.action, event.data.payload);
			}
		});

		// catching the mouse and scrolling
		document.addEventListener('mouseenter', event => {
			_classPrivateFieldSet(_mouseEntered, this, true);
		});
		document.addEventListener('mouseleave', event => {
			_classPrivateFieldSet(_mouseEntered, this, false);
		});
		document.addEventListener('mousemove', event => {
			this.onMobileMouseMove(event.y);
		});
		document.addEventListener('scroll', () => {
			if (_classPrivateFieldGet(_mouseEntered, this)) {
				this.recalculateTopsIfExternals();
			}
		});

		// checking when external commands become enabled
		BX.addCustomEvent('BX.Landing.Main:changeControls', (type, topInPercent) => {
			if (type === 'internal') {
				this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).hideAll, {});
			} else {
				// mode switching some time
				setTimeout(() => {
					this.recalculateTops(true);
				}, 400);
			}
		});

		// checking inline editor — enabled or disabled
		BX.addCustomEvent('BX.Landing.Editor:enable', () => {
			_classPrivateFieldSet(_disableControls, this, true);
			if (this.isControlsExternal()) {
				this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).hideAll, {});
			}
		});
		BX.addCustomEvent('BX.Landing.Editor:disable', () => {
			_classPrivateFieldSet(_disableControls, this, false);
			this.recalculateTopsIfExternals(true);
		});

		// checking that new block was added and any block changed its active status
		BX.addCustomEvent('BX.Landing.Block:onAfterAdd', event => {
			setTimeout(() => {
				const blockData = event.getData();
				_assertClassBrand(_ExternalControls_brand, this, _registerNewBlock).call(this, blockData.id);
			}, 500);
		});
		BX.addCustomEvent('BX.Landing.Block:changeState', (blockId, state) => {
			this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).changeState, {
				blockId,
				state
			});
		});

		// form's settings were opened and then closed
		BX.addCustomEvent('BX.Landing.Block:onFormSettingsOpen', () => {
			if (this.isControlsExternal()) {
				this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).hideAll, {});
			}
			_classPrivateFieldSet(_disableControls, this, true);
		});
		BX.addCustomEvent('BX.Landing.Block:onFormSettingsClose', blockId => {
			// after form completely closed
			setTimeout(() => {
				_classPrivateFieldSet(_disableControls, this, false);
				this.recalculateTopsIfExternals(true);
			}, 400);
			this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).hideAll, {});
		});
		BX.addCustomEvent('BX.Landing.Block:onAfterFormSave', blockId => {
			setTimeout(() => {
				this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).backendAction, {
					action: 'Landing\\Block::saveForm',
					data: {
						block: blockId
					}
				});
			}, 1000);
		});
		BX.addCustomEvent('BX.Landing.Block:onBlockEditClose', () => {
			_classPrivateFieldSet(_disableControls, this, false);
			this.recalculateTopsIfExternals(true);
		});
		BX.addCustomEvent('BX.Landing.Block:onContentSave', this.recalculateTopsIfExternals.bind(this));
		BX.addCustomEvent('BX.Landing.Block:onDesignerBlockSave', this.recalculateTopsIfExternals.bind(this));
		BX.addCustomEvent('BX.Landing.Block:Card:add', this.recalculateTopsIfExternals.bind(this));
		BX.addCustomEvent('BX.Landing.Block:Card:remove', this.recalculateTopsIfExternals.bind(this));
		BX.addCustomEvent('BX.Landing.Block:afterRemove', this.recalculateTopsIfExternals.bind(this));
		BX.addCustomEvent('BX.Landing.Backend:action', this.onBackendAction.bind(this));
		BX.addCustomEvent('BX.Landing.Backend:batch', this.onBackendAction.bind(this));
	}
	function _createBlockObject(block) {
		return {
			id: parseInt(block.id),
			state: block.isEnabled(),
			permissions: {
				allowDesignBlock: block.isDesignBlockAllowed(),
				allowModifyStyles: block.isStyleModifyAllowed(),
				allowEditContent: block.isEditBlockAllowed(),
				allowSorting: block.isEditBlockAllowed(),
				allowRemove: block.isRemoveBlockAllowed(),
				allowChangeState: block.isChangeStateBlockAllowed(),
				allowPaste: block.isPasteBlockAllowed(),
				allowSaveInLibrary: block.isSaveBlockInLibraryAllowed()
			}
		};
	}
	/**
	 * Registers all blocks on entire page.
	 */
	function _registerBlocks() {
		const blocksCollection = BX.Landing.PageObject.getBlocks();
		const data = [];
		[...blocksCollection].map(block => data.push(_assertClassBrand(_ExternalControls_brand, this, _createBlockObject).call(this, block)));
		this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).register, {
			blocks: data
		});
	}
	/**
	 * Registers new block.
	 *
	 * @param {number} blockId
	 */
	function _registerNewBlock(blockId) {
		const block = BX.Landing.PageObject.getBlocks().get(blockId);
		if (block) {
			this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).register, {
				blocks: [_assertClassBrand(_ExternalControls_brand, this, _createBlockObject).call(this, block)]
			});
			// because new block adding some time
			if (this.isControlsExternal()) {
				this.recalculateTops();
			} else {
				this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).hideAll, {});
			}
		}
	}

	/**
	 * Checks that element contains block
	 * @param {HTMLElement} element
	 * @return {boolean}
	 */
	function hasBlock(element) {
		return !!element && !!element.querySelector('.block-wrapper');
	}

	/**
	 * Checks that element contains "Add new Block" button
	 * @param {HTMLElement} element
	 * @return {boolean}
	 */
	function hasCreateButton(element) {
		return !!element && !!element.querySelector('button[data-id="insert_first_block"]');
	}

	function onAnimationEnd(element, animationName) {
		return new Promise(resolve => {
			const onAnimationEndListener = event => {
				if (event.animationName === animationName) {
					resolve(event);
					main_core.Event.bind(element, 'animationend', onAnimationEndListener);
				}
			};
			main_core.Event.bind(element, 'animationend', onAnimationEndListener);
		});
	}

	function isEmpty(value) {
		if (main_core.Type.isNil(value)) {
			return true;
		}
		if (main_core.Type.isArrayLike(value)) {
			return !value.length;
		}
		if (main_core.Type.isObject(value)) {
			return Object.keys(value).length <= 0;
		}
		return true;
	}

	function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function () { return !!t; })(); }
	BX.Landing.getMode = () => 'edit';

	// Semantics of the "Add block" panel: the cards container is a list of block
	// cards. The container role, the card role, the FocusZone filter and the focus
	// outline selector in landing.ui.card.basecard must all agree on these values.
	const BLOCKS_LIST_ROLE = 'list';
	const BLOCK_CARD_ROLE = 'listitem';

	// The list is laid out in several columns, and the rows it is cut into here are
	// the visual ones - the reading order of the list itself stays linear.
	function getBlocksListRows(list) {
		const cards = [...list.querySelectorAll(`[role="${BLOCK_CARD_ROLE}"]`)].filter(card => card.offsetParent !== null);
		const rows = [];
		let currentTop = null;
		let currentRow = null;
		cards.forEach(card => {
			const top = Math.round(card.getBoundingClientRect().top);
			if (currentRow === null || Math.abs(top - currentTop) > 2) {
				currentRow = [];
				rows.push(currentRow);
				currentTop = top;
			}
			currentRow.push(card);
		});
		return rows;
	}

	// 2D roving over the multi-column layout: ArrowUp/Down move by visual row keeping
	// the column; ArrowLeft/Right (and Home/End) fall back to FocusZone linear order.
	function createBlocksListNavigator(list) {
		// Cache the computed row layout to avoid re-measuring every card on each
		// arrow step. The set/order of cards changes on category switch, add/remove,
		// reorder and DnD (all childList mutations); a resize can reflow the column
		// count. Both drop the cache so the next step recomputes from live geometry.
		let rowsCache = null;
		const invalidateRowsCache = () => {
			rowsCache = null;
		};
		new MutationObserver(invalidateRowsCache).observe(list, {
			childList: true,
			subtree: true
		});
		window.addEventListener('resize', invalidateRowsCache);
		return (direction, from, event) => {
			if (!from || event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
				return null;
			}
			if (rowsCache === null) {
				rowsCache = getBlocksListRows(list);
			}
			const rows = rowsCache;
			let rowIndex = -1;
			let columnIndex = -1;
			rows.forEach((row, index) => {
				const position = row.indexOf(from);
				if (position !== -1) {
					rowIndex = index;
					columnIndex = position;
				}
			});
			if (rowIndex === -1) {
				return null;
			}
			const targetRow = rows[rowIndex + (event.key === 'ArrowDown' ? 1 : -1)];
			if (!targetRow) {
				return null;
			}
			return targetRow[Math.min(columnIndex, targetRow.length - 1)] || null;
		};
	}

	/**
	 * @memberOf BX.Landing
	 */
	let Main = /*#__PURE__*/function (_EventEmitter) {
		function Main(id) {
			var _this;
			babelHelpers.classCallCheck(this, Main);
			_this = _callSuper(this, Main);
			_this.setEventNamespace('BX.Landing.Main');
			const options = landing_env.Env.getInstance().getOptions();
			_this.id = id;
			_this.options = Object.freeze(options);
			_this.blocks = _this.options.blocks;
			_this.currentBlock = null;
			_this.isDesignBlockModeFlag = _this.options["design_block"] === true;
			_this.loadedDeps = {};
			_this.cache = new main_core.Cache.MemoryCache();
			_this.externalControls = new ExternalControls();
			_this.onSliderFormLoaded = _this.onSliderFormLoaded.bind(_this);
			_this.onBlockDelete = _this.onBlockDelete.bind(_this);
			BX.addCustomEvent('Landing.Block:onAfterDelete', _this.onBlockDelete);
			_this.adjustEmptyAreas();
			BX.Landing.UI.Panel.StatusPanel.setLastModified(options.lastModified);
			if (!_this.isDesignBlockModeFlag) {
				BX.Landing.UI.Panel.StatusPanel.getInstance().show();
			}
			const pageType = landing_env.Env.getInstance().getType();
			if (pageType === Main.TYPE_KNOWLEDGE || pageType === Main.TYPE_GROUP) {
				const mainArea = document.querySelector('.landing-main');
				if (main_core.Type.isDomNode(mainArea)) {
					main_core.Dom.addClass(mainArea, 'landing-ui-collapse');
				}
			}
			return _this;
		}
		babelHelpers.inherits(Main, _EventEmitter);
		return babelHelpers.createClass(Main, [{
			key: "clear",
			value: function clear() {
				BX.removeCustomEvent('Landing.Block:onAfterDelete', this.onBlockDelete);
			}
		}, {
			key: "isCrmFormPage",
			value: function isCrmFormPage() {
				return landing_env.Env.getInstance().getSpecialType() === 'crm_forms';
			}
		}, {
			key: "isDesignBlockMode",
			value: function isDesignBlockMode() {
				return this.isDesignBlockModeFlag;
			}
		}, {
			key: "getSaveBlockPanel",
			value: function getSaveBlockPanel() {
				const panel = new landing_ui_panel_saveblock.SaveBlock('save_block_panel', {
					block: this.currentBlock
				});
				panel.layout.hidden = true;
				panel.content.hidden = false;
				main_core.Dom.append(panel.layout, window.parent.document.body);
				return panel;
			}
		}, {
			key: "getBlocksPanel",
			value: function getBlocksPanel() {
				return this.cache.remember('blockPanel', () => {
					const blocksPanel = this.createBlocksPanel();
					setTimeout(() => {
						if (blocksPanel.sidebarButtons.get(this.options.default_section)) {
							blocksPanel.sidebarButtons.get(this.options.default_section).layout.click();
						} else {
							[...blocksPanel.sidebarButtons][0].layout.click();
						}
					});
					blocksPanel.layout.hidden = true;
					blocksPanel.content.hidden = false;
					main_core.Dom.append(blocksPanel.layout, window.parent.document.body);
					return blocksPanel;
				});
			}
		}, {
			key: "getBlocksPanelContent",
			value: function getBlocksPanelContent() {
				return this.getBlocksPanel().content;
			}
		}, {
			key: "hideBlocksPanel",
			value: function hideBlocksPanel() {
				if (this.getBlocksPanel()) {
					return this.getBlocksPanel().hide();
				}
				return Promise.resolve();
			}
		}, {
			key: "getLayoutAreas",
			value: function getLayoutAreas() {
				return this.cache.remember('layoutAreas', () => {
					return [...document.body.querySelectorAll('.landing-header'), ...document.body.querySelectorAll('.landing-sidebar'), ...document.body.querySelectorAll('.landing-main'), ...document.body.querySelectorAll('.landing-footer')];
				});
			}

			/**
			 * Creates insert block button
			 * @param {HTMLElement} area
			 * @return {BX.Landing.UI.Button.Plus}
			 */
		}, {
			key: "createInsertBlockButton",
			value: function createInsertBlockButton(area) {
				const button = new BX.Landing.UI.Button.Plus('insert_first_block', {
					text: landing_loc.Loc.getMessage('ACTION_BUTTON_CREATE')
				});
				button.on('click', this.showBlocksPanel.bind(this, null, area, button));
				button.on('mouseover', this.onCreateButtonMouseover.bind(this, area, button));
				button.on('mouseout', this.onCreateButtonMouseout.bind(this, area, button));
				return button;
			}
		}, {
			key: "onCreateButtonMouseover",
			value: function onCreateButtonMouseover(area, button) {
				if (main_core.Dom.hasClass(area, 'landing-header') || main_core.Dom.hasClass(area, 'landing-footer')) {
					const areas = this.getLayoutAreas();
					if (areas.length > 1) {
						const createText = landing_loc.Loc.getMessage('ACTION_BUTTON_CREATE');
						if (main_core.Dom.hasClass(area, 'landing-main')) {
							button.setText(`${createText} ${landing_loc.Loc.getMessage('LANDING_ADD_BLOCK_TO_MAIN')}`);
						}
						if (main_core.Dom.hasClass(area, 'landing-header')) {
							button.setText(`${createText} ${landing_loc.Loc.getMessage('LANDING_ADD_BLOCK_TO_HEADER')}`);
						}
						if (main_core.Dom.hasClass(area, 'landing-sidebar')) {
							button.setText(`${createText} ${landing_loc.Loc.getMessage('LANDING_ADD_BLOCK_TO_SIDEBAR')}`);
						}
						if (main_core.Dom.hasClass(area, 'landing-footer')) {
							button.setText(`${createText} ${landing_loc.Loc.getMessage('LANDING_ADD_BLOCK_TO_FOOTER')}`);
						}
						clearTimeout(this.fadeTimeout);
						this.fadeTimeout = setTimeout(() => {
							main_core.Dom.addClass(area, 'landing-area-highlight');
							areas.filter(currentArea => currentArea !== area).forEach(currentArea => {
								main_core.Dom.addClass(currentArea, 'landing-area-fade');
							});
						}, 400);
					}
				}
			}
		}, {
			key: "onCreateButtonMouseout",
			value: function onCreateButtonMouseout(area, button) {
				clearTimeout(this.fadeTimeout);
				if (main_core.Dom.hasClass(area, 'landing-header') || main_core.Dom.hasClass(area, 'landing-footer')) {
					const areas = this.getLayoutAreas();
					if (areas.length > 1) {
						button.setText(landing_loc.Loc.getMessage('ACTION_BUTTON_CREATE'));
						areas.forEach(currentArea => {
							main_core.Dom.removeClass(currentArea, 'landing-area-highlight');
							main_core.Dom.removeClass(currentArea, 'landing-area-fade');
						});
					}
				}
			}
		}, {
			key: "initEmptyArea",
			value: function initEmptyArea(area) {
				if (area) {
					area.innerHTML = '';
					main_core.Dom.append(this.createInsertBlockButton(area).layout, area);
					main_core.Dom.addClass(area, 'landing-empty');
				}
			}

			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "destroyEmptyArea",
			value: function destroyEmptyArea(area) {
				if (area) {
					const button = area.querySelector('button[data-id="insert_first_block"]');
					if (button) {
						main_core.Dom.remove(button);
					}
					main_core.Dom.removeClass(area, 'landing-empty');
				}
			}

			/**
			 * Adjusts areas
			 */
		}, {
			key: "adjustEmptyAreas",
			value: function adjustEmptyAreas() {
				this.getLayoutAreas().filter(area => {
					return hasBlock(area) && hasCreateButton(area);
				}).forEach(this.destroyEmptyArea, this);
				this.getLayoutAreas().filter(area => {
					return !hasBlock(area) && !hasCreateButton(area);
				}).forEach(this.initEmptyArea, this);
				const main = document.body.querySelector('main.landing-edit-mode');
				const isAllEmpty = !this.getLayoutAreas().some(hasBlock);
				if (main) {
					if (isAllEmpty) {
						main_core.Dom.addClass(main, 'landing-empty');
						return;
					}
					main_core.Dom.removeClass(main, 'landing-empty');
				}
			}

			/**
			 * Enables landing controls
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "enableControls",
			value: function enableControls() {
				main_core.Dom.removeClass(document.body, 'landing-ui-hide-controls');
			}

			/**
			 * Disables landing controls
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "disableControls",
			value: function disableControls() {
				main_core.Dom.addClass(document.body, 'landing-ui-hide-controls');
			}

			/**
			 * Checks that landing controls is enabled
			 * @return {boolean}
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "isControlsEnabled",
			value: function isControlsEnabled() {
				return !main_core.Dom.hasClass(document.body, 'landing-ui-hide-controls');
			}

			/**
			 * Makes landing controls internal.
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "makeControlsInternal",
			value: function makeControlsInternal() {
				BX.onCustomEvent('BX.Landing.Main:changeControls', ['internal', Main.topInPercent()]);
				main_core.Dom.removeClass(document.body, 'landing-ui-external-controls');
			}

			/**
			 * Makes landing controls external.
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "makeControlsExternal",
			value: function makeControlsExternal() {
				BX.onCustomEvent('BX.Landing.Main:changeControls', ['external', Main.topInPercent()]);
				main_core.Dom.addClass(document.body, 'landing-ui-external-controls');
			}

			/**
			 * Checks that landing controls is external.
			 * @return {boolean}
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "isControlsExternal",
			value: function isControlsExternal() {
				return main_core.Dom.hasClass(document.body, 'landing-ui-external-controls');
			}

			/**
			 * Set device code in body data-attribute.
			 * @param {string} code
			 */
		}, {
			key: "setDeviceCode",
			value: function setDeviceCode(code) {
				document.body.setAttribute('data-device', code);
			}

			/**
			 * Get device code from body attribute.
			 * @return {string}
			 */
		}, {
			key: "getDeviceCode",
			value: function getDeviceCode() {
				return document.body.getAttribute('data-device');
			}

			/**
			 * Set BX classes to mark this landing frame as mobile (touch) device
			 */
		}, {
			key: "setTouchDevice",
			value: function setTouchDevice() {
				main_core.Dom.removeClass(document.documentElement, 'bx-no-touch');
				main_core.Dom.addClass(document.documentElement, 'bx-touch');
			}

			/**
			 * Set BX classes to mark this landing frame as desktop (no touch) device
			 */
		}, {
			key: "setNoTouchDevice",
			value: function setNoTouchDevice() {
				main_core.Dom.removeClass(document.documentElement, 'bx-touch');
				main_core.Dom.addClass(document.documentElement, 'bx-no-touch');
			}

			/**
			 * Appends block
			 * @param {addBlockResponse} data
			 * @param {boolean} [withoutAnimation]
			 * @returns {HTMLElement}
			 */
		}, {
			key: "appendBlock",
			value: function appendBlock(data, withoutAnimation) {
				if (!this.isAllowedAppendBlock(data)) {
					return main_core.Tag.render``;
				}
				const block = main_core.Tag.render`${data.content}`;
				block.id = `block${data.id}`;
				if (!withoutAnimation) {
					main_core.Dom.addClass(block, 'landing-ui-show');
					onAnimationEnd(block, 'showBlock').then(() => {
						main_core.Dom.removeClass(block, 'landing-ui-show');
					});
				}
				this.insertToBlocksFlow(block);
				return block;
			}

			/**
			 * Check if the block can be appended
			 * @param {addBlockResponse} data
			 * @returns {boolean} - Returns true if the block can be appended, otherwise false
			 */
		}, {
			key: "isAllowedAppendBlock",
			value: function isAllowedAppendBlock(data) {
				const type = BX.Landing.Env.getInstance().getType().toLowerCase();
				let allowedBlockTypes = data.manifest.block.type ?? [];
				if (type === 'mainpage' || allowedBlockTypes.includes('mainpage')) {
					if (main_core.Type.isString(allowedBlockTypes)) {
						allowedBlockTypes = [allowedBlockTypes];
					}
					if (!allowedBlockTypes.includes(type)) {
						return false;
					}
				}
				return true;
			}

			/**
			 * Shows blocks list panel
			 * @param {BX.Landing.Block} block
			 * @param {HTMLElement} [area]
			 * @param [button]
			 * @param [insertBefore]
			 */
		}, {
			key: "showBlocksPanel",
			value: function showBlocksPanel(block, area, button, insertBefore) {
				BX.UI.Analytics.sendData({
					tool: BX.Landing.Main.getAnalyticsCategoryByType(),
					category: 'widget_list',
					event: 'open_widget_list'
				});
				this.currentBlock = block;
				this.currentArea = area;
				this.insertBefore = insertBefore;
				BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
				if (this.isCrmFormPage() || this.isControlsExternal()) {
					const rootWindow = landing_pageobject.PageObject.getRootWindow();
					main_core.Dom.append(this.getBlocksPanel().layout, rootWindow.document.body);
					main_core.Dom.append(this.getBlocksPanel().overlay, rootWindow.document.body);
				}
				this.getBlocksPanel().show();
				this.disableAddBlockButtons();
				if (!!area && !!button) {
					this.onCreateButtonMouseout(area, button);
				}
			}
		}, {
			key: "showSaveBlock",
			value: function showSaveBlock(block) {
				this.currentBlock = block;
				this.getSaveBlockPanel().show();
			}
		}, {
			key: "disableAddBlockButtons",
			value: function disableAddBlockButtons() {
				landing_pageobject.PageObject.getBlocks().forEach(block => {
					const panel = block.panels.get('create_action');
					if (panel) {
						const button = panel.buttons.get('insert_after');
						if (button) {
							button.disable();
						}
					}
				});
			}
		}, {
			key: "enableAddBlockButtons",
			value: function enableAddBlockButtons() {
				landing_pageobject.PageObject.getBlocks().forEach(block => {
					const panel = block.panels.get('create_action');
					if (panel) {
						const button = panel.buttons.get('insert_after');
						if (button) {
							button.enable();
						}
					}
				});
			}

			/**
			 * Creates blocks list panel
			 * @returns {BX.Landing.UI.Panel.Content}
			 */
		}, {
			key: "createBlocksPanel",
			value: function createBlocksPanel() {
				const {
					blocks
				} = this.options;
				const categories = Object.keys(blocks);
				const panel = new landing_ui_panel_content.Content('blocks_panel', {
					title: landing_loc.Loc.getMessage('LANDING_CONTENT_BLOCKS_TITLE'),
					className: 'landing-ui-panel-block-list',
					scrollAnimation: true
				});
				panel.getFocusTrapOptions = () => ({
					...landing_ui_panel_content.Content.prototype.getFocusTrapOptions.call(panel),
					initialFocus: 'container'
				});

				// Stable hooks for e2e tests. The panel is built once per editor, so a single set of
				// ids is enough: the layout is the panel itself, the content is the container of the
				// cards - the one that carries the list role while it holds them.
				main_core.Dom.attr(panel.layout, 'data-testid', 'landing-blocks-panel');
				main_core.Dom.attr(panel.content, 'data-testid', 'landing-blocks-panel-list');
				this.setupBlocksListFocusZone(panel.content);
				panel.subscribe('onCancel', () => {
					this.enableAddBlockButtons();
				});
				categories.forEach(categoryId => {
					const hasItems = !isEmpty(blocks[categoryId].items);
					const isPopular = categoryId === 'popular';
					const isSeparator = blocks[categoryId].separator;
					const isFavourite = categoryId === 'favourite';
					if (hasItems && !isPopular || isSeparator || isFavourite) {
						panel.appendSidebarButton(this.createBlockPanelSidebarButton(categoryId, blocks[categoryId]));
					}
				});
				const feedbackButton = new BX.Landing.UI.Button.SidebarButton('feedback_button', {
					className: 'landing-ui-button-sidebar-feedback',
					text: landing_loc.Loc.getMessage('LANDING_BLOCKS_LIST_FEEDBACK_BUTTON'),
					onClick: this.showFeedbackForm.bind(this)
				});
				main_core.Dom.attr(feedbackButton.layout, 'data-testid', 'landing-blocks-panel-feedback-btn');
				panel.appendSidebarButton(feedbackButton);
				return panel;
			}

			// Roving-tabindex composite over the block cards: a single Tab stop enters the
			// list, arrow keys move between cards. The FocusZone manages only the cards
			// (role="listitem"); nested badge/remove buttons stay outside the roving set
			// and remain reachable within the focused card. Card add/remove on category
			// switch is tracked by the FocusZone MutationObserver.
		}, {
			key: "setupBlocksListFocusZone",
			value: function setupBlocksListFocusZone(list) {
				if (this.blocksListFocusZone) {
					return this.blocksListFocusZone;
				}
				this.blocksListFocusZone = landing_ui_a11y.A11y.load().then(({
					FocusZone
				}) => {
					const focusZone = new FocusZone(list, {
						focusInStrategy: 'first',
						focusableElementFilter: element => element.getAttribute('role') === BLOCK_CARD_ROLE,
						getNextFocusable: createBlocksListNavigator(list)
					});
					focusZone.activate();
					return focusZone;
				}).catch(error => {
					this.blocksListFocusZone = null;
					console.warn('Failed to init blocks list focus zone', error);
					return null;
				});
				return this.blocksListFocusZone;
			}

			/**
			 * Shows feedback form
			 * @param data
			 */
		}, {
			key: "showSliderFeedbackForm",
			value: function showSliderFeedbackForm(data = {}) {
				main_core.Runtime.loadExtension('ui.feedback.form').then(() => {
					const data = {};
					data.bitrix24 = this.options.server_name;
					data.siteId = this.options.site_id;
					data.siteUrl = this.options.url;
					data.siteTemplate = this.options.xml_id;
					data.productType = this.options.productType || 'Undefined';
					data.typeproduct = (() => {
						if (this.options.params.type === Main.TYPE_GROUP) {
							return 'KNOWLEDGE_GROUP';
						}
						return this.options.params.type;
					})();
					BX.UI.Feedback.Form.open({
						id: Math.random() + '',
						forms: this.getFeedbackFormOptions(),
						presets: data
					});
				});
			}

			/**
			 * Gets feedback form options
			 * @return {{id: string, sec: string, lang: string}}
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "getFeedbackFormOptions",
			value: function getFeedbackFormOptions() {
				return [{
					zones: ['en', 'eu', 'in', 'uk'],
					id: 16,
					lang: 'en',
					sec: '3h483y'
				}, {
					zones: ['ru', 'by', 'kz'],
					id: 8,
					lang: 'ru',
					sec: 'x80yjw'
				}, {
					zones: ['ua'],
					id: 18,
					lang: 'ua',
					sec: 'd9e09o'
				}, {
					zones: ['la', 'co', 'mx'],
					id: 14,
					lang: 'la',
					sec: 'wu561i'
				}, {
					zones: ['de'],
					id: 10,
					lang: 'de',
					sec: 'eraz2q'
				}, {
					zones: ['com.br', 'br'],
					id: 12,
					lang: 'br',
					sec: 'r6wvge'
				}];
			}

			/**
			 * Handles feedback loaded event
			 */
		}, {
			key: "onSliderFormLoaded",
			value: function onSliderFormLoaded() {
				this.sliderFormLoader.hide();
			}

			/**
			 * Shows feedback form for blocks list panel
			 */
		}, {
			key: "showFeedbackForm",
			value: function showFeedbackForm() {
				this.showSliderFeedbackForm({
					target: 'blocksList'
				});
			}

			/**
			 * Creates blocks list panel sidebar button
			 * @param {string} category
			 * @param {object} options
			 * @returns {BX.Landing.UI.Button.SidebarButton}
			 */
		}, {
			key: "createBlockPanelSidebarButton",
			value: function createBlockPanelSidebarButton(category, options) {
				const button = new BX.Landing.UI.Button.SidebarButton(category, {
					text: options.name,
					child: !options.separator,
					className: options.new ? 'landing-ui-new-section' : '',
					onClick: this.onBlocksListCategoryChange.bind(this, category)
				});

				// The category a button stands for is already on it as `data-id`, so the hook is the
				// same for all of them: a test picks the one it needs by that id.
				main_core.Dom.attr(button.layout, 'data-testid', 'landing-blocks-panel-category-btn');
				return button;
			}

			/**
			 * Adds dynamically new block to the category.
			 * @param {string} category Category code.
			 * @param {{code: string, name: string, preview: string, section: Array<string>}} block Block data.
			 */
		}, {
			key: "addNewBlockToCategory",
			value: function addNewBlockToCategory(category, block) {
				if (this.blocks[category]) {
					const blockCode = block['codeOriginal'] || block['code'];
					if (category === 'last') {
						if (!this.lastBlocks) {
							this.lastBlocks = Object.keys(this.blocks.last.items);
						}
						this.lastBlocks.unshift(blockCode);
					} else {
						this.blocks[category].items[blockCode] = block;
					}
					this.onBlocksListCategoryChange(category);
				}
			}
		}, {
			key: "removeBlockFromList",
			value: function removeBlockFromList(blockCode) {
				let removed = false;
				for (let category in this.blocks) {
					if (this.blocks[category].items[blockCode] !== undefined) {
						delete this.blocks[category].items[blockCode];
						removed = true;
					}
				}
				if (this.lastBlocks.indexOf(blockCode) !== -1) {
					this.lastBlocks.splice(this.lastBlocks.indexOf(blockCode), 1);
					removed = true;
				}

				// refresh panel
				if (removed) {
					const activeCategoryButton = this.getBlocksPanel().sidebarButtons.find(button => {
						return main_core.Dom.hasClass(button.layout, 'landing-ui-active');
					});
					if (activeCategoryButton) {
						this.onBlocksListCategoryChange(activeCategoryButton.id);
					}
				}
			}

			/**
			 * Returns page's template code if exists.
			 * @return {string|null}
			 */
		}, {
			key: "getTemplateCode",
			value: function getTemplateCode() {
				let {
					tplCode
				} = landing_env.Env.getInstance().getOptions();
				if (tplCode.indexOf('@') > 0) {
					tplCode = tplCode.split('@')[1];
				}
				if (!tplCode || tplCode.length <= 0) {
					tplCode = null;
				}
				return tplCode;
			}

			/**
			 * Handles event on blocks list category change
			 * @param {string} category - Category id
			 */
		}, {
			key: "onBlocksListCategoryChange",
			value: async function onBlocksListCategoryChange(category) {
				await this.renderBlocksListCategory(category);
				this.updateBlocksListSemantics();
			}

			// The list role requires the container to own nothing but list items, so the
			// role and its label live on the container only while it holds block cards:
			// an empty category shows the empty state instead and stays role-less.
		}, {
			key: "updateBlocksListSemantics",
			value: function updateBlocksListSemantics() {
				const content = this.getBlocksPanelContent();
				const hasCards = content.querySelector(`[role="${BLOCK_CARD_ROLE}"]`) !== null;
				main_core.Dom.attr(content, {
					'role': hasCards ? BLOCKS_LIST_ROLE : null,
					'aria-label': hasCards ? landing_loc.Loc.getMessage('LANDING_BLOCKS_LIST_GRID_LABEL') : null
				});
			}

			/**
			 * Renders cards of the blocks list category
			 * @param {string} category - Category id
			 */
		}, {
			key: "renderBlocksListCategory",
			value: async function renderBlocksListCategory(category) {
				this.currentCategory = category;
				if (this.currentCategory === 'favourite') {
					BX.UI.Analytics.sendData({
						tool: BX.Landing.Main.getAnalyticsCategoryByType(),
						category: 'widget_list',
						event: 'open_favorites',
						c_section: 'site_editor'
					});
				}
				const templateCode = this.getTemplateCode();
				this.getBlocksPanel().content.hidden = false;
				this.getBlocksPanel().sidebarButtons.forEach(button => {
					const action = button.id === category ? 'add' : 'remove';
					button.layout.classList[action]('landing-ui-active');
				});
				this.getBlocksPanel().content.innerHTML = '';
				const loader = new BX.Loader({
					target: this.getBlocksPanel().content,
					size: 90
				});
				loader.show();
				try {
					this.favouriteBlocks = await BX.Landing.Backend.getInstance().action('Landing::getFavouriteBlocks');
				} catch (e) {
					console.warn('Failed to fetch favourite blocks', e);
					this.favouriteBlocks = [];
				}
				loader.hide();
				if (category === 'last') {
					if (!this.lastBlocks) {
						this.lastBlocks = Object.keys(this.blocks.last.items);
					}
					this.lastBlocks = [...new Set(this.lastBlocks)];
					this.lastBlocks.forEach(blockKey => {
						const block = this.getBlockFromRepository(blockKey);
						if (block) {
							block.currentCategory = category;
							this.getBlocksPanel().appendCard(this.createBlockCard(blockKey, block));
						}
					});
					return;
				}
				if (category === 'favourite') {
					if (!this.favouriteBlocks) {
						this.favouriteBlocks = Object.keys(this.blocks.favourite.items);
					}
					const blockCards = [];
					this.favouriteBlocks = [...new Set(this.favouriteBlocks)];
					this.favouriteBlocks.forEach(blockKey => {
						const block = this.getBlockFromRepository(blockKey);
						if (block) {
							block.currentCategory = category;
							blockCards.push(this.createBlockCard(blockKey, block));
						}
					});
					if (blockCards.length === 0) {
						main_core.Dom.append(this.createFavouriteCategoryEmptyState(), this.getBlocksPanelContent());
						return;
					}
					blockCards.forEach(blockCard => {
						this.getBlocksPanel().appendCard(blockCard);
					});
					return;
				}
				Object.keys(this.blocks[category].items).forEach(blockKey => {
					const block = this.blocks[category].items[blockKey];
					const blockTplCode = block['tpl_code'] && block['tpl_code'].length > 0 ? block['tpl_code'] : null;
					if (!templateCode || !blockTplCode || blockTplCode && blockTplCode === templateCode) {
						block.currentCategory = category;
						this.getBlocksPanel().appendCard(this.createBlockCard(blockKey, block));
					}
				});
				if (this.getBlocksPanel().content.scrollTop) {
					requestAnimationFrame(() => {
						this.getBlocksPanel().content.scrollTop = 0;
					});
				}
			}

			// eslint-disable-next-line consistent-return
		}, {
			key: "getBlockFromRepository",
			value: function getBlockFromRepository(code) {
				const {
					blocks
				} = this.options;
				const categories = Object.keys(blocks);
				const category = categories.find(categoryId => {
					return code in blocks[categoryId].items;
				});
				if (category) {
					return blocks[category].items[code];
				}
			}

			/**
			 * Handles copy block event
			 * @param {BX.Landing.Block} block
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "onCopyBlock",
			value: function onCopyBlock(block) {
				window.localStorage.landingBlockId = block.id;
				window.localStorage.landingBlockName = block.manifest.block.name;
				window.localStorage.landingBlockAction = 'copy';
				try {
					window.localStorage.requiredUserAction = JSON.stringify(block.requiredUserActionOptions);
				} catch (err) {
					window.localStorage.requiredUserAction = '';
				}
			}

			/**
			 * Handles cut block event
			 * @param {BX.Landing.Block} block
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "onCutBlock",
			value: function onCutBlock(block) {
				window.localStorage.landingBlockId = block.id;
				window.localStorage.landingBlockName = block.manifest.block.name;
				window.localStorage.landingBlockAction = 'cut';
				try {
					window.localStorage.requiredUserAction = JSON.stringify(block.requiredUserActionOptions);
				} catch (err) {
					window.localStorage.requiredUserAction = '';
				}
				BX.Landing.PageObject.getBlocks().remove(block);
				main_core.Dom.remove(block.node);
				BX.onCustomEvent('Landing.Block:onAfterDelete', [block]);
			}

			/**
			 * Handles paste block event
			 * @param {BX.Landing.Block} block
			 * @param {() => {}} callback
			 */
		}, {
			key: "onPasteBlock",
			value: function onPasteBlock(block, callback) {
				if (window.localStorage.landingBlockId) {
					let action = 'Landing::copyBlock';
					if (window.localStorage.landingBlockAction === 'cut') {
						action = 'Landing::moveBlock';
					}
					const requestBody = {};
					requestBody[action] = {
						action,
						data: {
							lid: block.lid || BX.Landing.Main.getInstance().id,
							block: window.localStorage.landingBlockId,
							params: {
								AFTER_ID: block.id,
								RETURN_CONTENT: 'Y'
							}
						}
					};
					landing_backend.Backend.getInstance().batch(action, requestBody, {
						action
					}).then(res => {
						this.currentBlock = block;
						return this.addBlock(res[action].result.content, false, false, callback);
					});
				}
			}

			/**
			 * Adds block from server response
			 * @param {addBlockResponse} res
			 * @param {boolean} [withoutAnimation = false]
			 * @param {boolean} [insertBefore = false]
			 * @param {() => {}} callback
			 * @return {Promise<T>}
			 */
		}, {
			key: "addBlock",
			value: function addBlock(res, withoutAnimation, insertBefore = false, callback) {
				if (this.lastBlocks) {
					this.lastBlocks.unshift(res.manifest.codeOriginal || res.manifest.code);
				}
				const self = this;
				const block = this.appendBlock(res, withoutAnimation);
				return this.loadBlockDeps(res).then(blockRes => {
					self.currentBlock = null;
					self.currentArea = null;
					const blockId = parseInt(res.id);
					const allOldBlocks = BX.Landing.PageObject.getBlocks();
					if (allOldBlocks) {
						allOldBlocks.forEach(oldBlock => {
							if (oldBlock.id === blockId) {
								main_core.Dom.remove(oldBlock.node);
								BX.Landing.PageObject.getBlocks().remove(oldBlock);
							}
						});
					}

					// Init block entity
					void new BX.Landing.Block(block, {
						id: blockId,
						sections: res.sections,
						requiredUserAction: res.requiredUserAction,
						manifest: res.manifest,
						access: res.access,
						active: main_core.Text.toBoolean(res.active),
						php: res.php,
						designed: res.designed,
						anchor: res.anchor,
						dynamicParams: res.dynamicParams,
						repoId: res.repoId
					});
					return self.runBlockScripts(res).then(() => {
						if (callback) {
							callback(blockId);
						}
						return block;
					});
				}).catch(err => {
					console.warn(err);
				});
			}

			/**
			 * Handles edd block event
			 * @param {string} blockCode
			 * @param {*} [restoreId]
			 * @param {?boolean} [preventHistory = false]
			 * @return {Promise<BX.Landing.Block>}
			 */
		}, {
			key: "onAddBlock",
			value: function onAddBlock(blockCode, restoreId, preventHistory = false) {
				const id = main_core.Text.toNumber(restoreId);
				this.hideBlocksPanel();
				return this.showBlockLoader().then(this.loadBlock(blockCode, id, preventHistory)).then(res => {
					return new Promise(resolve => {
						setTimeout(() => {
							resolve(res);
						}, 500);
					});
				}).then(res => {
					res.manifest.codeOriginal = blockCode;
					const p = this.addBlock(res, false, this.insertBefore);
					this.insertBefore = false;
					this.adjustEmptyAreas();
					void this.hideBlockLoader();
					this.enableAddBlockButtons();
					BX.onCustomEvent('BX.Landing.Block:onAfterAdd', res);
					return p;
				});
			}

			/**
			 * Inserts element to blocks flow.
			 * Element can be inserted after current block or after last block
			 * @param {HTMLElement} element
			 */
		}, {
			key: "insertToBlocksFlow",
			value: function insertToBlocksFlow(element) {
				const isCurrentBlockAvailable = this.currentBlock && this.currentBlock.node && this.currentBlock.node.parentNode;
				if (isCurrentBlockAvailable && !this.insertBefore) {
					main_core.Dom.insertAfter(element, this.currentBlock.node);
					return;
				}
				if (isCurrentBlockAvailable && this.insertBefore) {
					main_core.Dom.insertBefore(element, this.currentBlock.node);
				}
				main_core.Dom.prepend(element, this.currentArea);
			}

			/**
			 * Gets block loader
			 * @return {HTMLElement}
			 */
		}, {
			key: "getBlockLoader",
			value: function getBlockLoader() {
				if (!this.blockLoader) {
					this.blockLoader = new BX.Loader({
						size: 60
					});
					this.blockLoaderContainer = main_core.Dom.create('div', {
						props: {
							className: 'landing-block-loader-container'
						},
						children: [this.blockLoader.layout]
					});
				}
				return this.blockLoaderContainer;
			}

			/**
			 * Shows block loader
			 * @return {Function}
			 */
		}, {
			key: "showBlockLoader",
			value: function showBlockLoader() {
				this.insertToBlocksFlow(this.getBlockLoader());
				this.blockLoader.show();
				return Promise.resolve();
			}

			/**
			 * Hides block loader
			 * @return {Function}
			 */
		}, {
			key: "hideBlockLoader",
			value: function hideBlockLoader() {
				main_core.Dom.remove(this.getBlockLoader());
				this.blockLoader = null;
				return Promise.resolve();
			}

			/**
			 * Loads block dependencies
			 * @param {addBlockResponse} data
			 * @returns {Promise<addBlockResponse>}
			 */
		}, {
			key: "loadBlockDeps",
			value: function loadBlockDeps(data) {
				const ext = BX.processHTML(data.content_ext);
				if (BX.type.isArray(ext.SCRIPT)) {
					ext.SCRIPT = ext.SCRIPT.filter(item => {
						return !item.isInternal;
					});
				}
				if (BX.type.isObject(data.lang)) {
					landing_loc.Loc.setMessage(data.lang);
				}
				let loadedScripts = 0;
				const scriptsCount = data.js.length + ext.SCRIPT.length + ext.STYLE.length + data.css.length;
				let resPromise = null;
				if (!this.loadedDeps[data.manifest.code] && scriptsCount > 0) {
					resPromise = new Promise(resolve => {
						function onLoad() {
							loadedScripts += 1;
							if (loadedScripts === scriptsCount) {
								resolve(data);
							}
						}
						if (scriptsCount > loadedScripts) {
							// Load extensions files
							ext.SCRIPT.forEach(item => {
								if (!item.isInternal) {
									BX.loadScript(item.JS, onLoad);
								}
							});
							ext.STYLE.forEach(item => {
								BX.loadScript(item, onLoad);
							});

							// Load block files
							data.css.forEach(item => {
								BX.loadScript(item, onLoad);
							});
							data.js.forEach(item => {
								BX.loadScript(item, onLoad);
							});
						} else {
							onLoad();
						}
						this.loadedDeps[data.manifest.code] = true;
					});
				} else {
					resPromise = Promise.resolve(data);
				}
				return resPromise.then(data => {
					if (BX.type.isArray(data.assetStrings)) {
						const head = document.head;
						data.assetStrings.forEach(string => {
							const element = main_core.Tag.render`${string}`;
							main_core.Dom.insertAfter(element, head.lastChild);
						});
					}
					return data;
				});
			}

			/**
			 * Executes block scripts
			 * @param data
			 * @return {Promise}
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "runBlockScripts",
			value: function runBlockScripts(data) {
				return new Promise(resolve => {
					const scripts = BX.processHTML(data.content).SCRIPT;
					if (scripts.length) {
						BX.ajax.processScripts(scripts, undefined, () => {
							resolve(data);
						});
					} else {
						resolve(data);
					}
				});
			}

			/**
			 * Load new block from server
			 * @param {string} blockCode
			 * @param {int} [restoreId]
			 * @param {boolean} [preventHistory = false]
			 * @returns {Function}
			 */
		}, {
			key: "loadBlock",
			value: function loadBlock(blockCode, restoreId, preventHistory) {
				return () => {
					let lid = this.id;
					let siteId = this.options.site_id;
					if (this.currentBlock) {
						lid = this.currentBlock.lid;
						siteId = this.currentBlock.siteId;
					}
					if (this.currentArea) {
						lid = main_core.Dom.attr(this.currentArea, 'data-landing');
						siteId = main_core.Dom.attr(this.currentArea, 'data-site');
					}
					let requestBody = {
						lid,
						siteId,
						preventHistory: preventHistory ? 1 : 0
					};
					const fields = {
						ACTIVE: 'Y',
						CODE: blockCode,
						AFTER_ID: this.currentBlock ? this.currentBlock.id : 0,
						RETURN_CONTENT: 'Y',
						CATEGORY: this.currentCategory
					};
					if (!main_core.Type.isBoolean(preventHistory) || preventHistory === false) {
						// Change history steps
						BX.Landing.History.getInstance().push();
					}
					if (!restoreId) {
						requestBody.fields = fields;
						return landing_backend.Backend.getInstance().action('Landing::addBlock', requestBody, {
							code: blockCode
						}).then(result => {
							if (this.insertBefore) {
								return landing_backend.Backend.getInstance().action('Landing::upBlock', {
									lid,
									siteId,
									block: result.id
								}).then(() => {
									return result;
								});
							}
							return result;
						});
					}
					return landing_backend.Backend.getInstance().action('Block::getContent', {
						block: restoreId,
						lid,
						fields,
						editMode: 1
					}).then(res => {
						res.id = restoreId;
						return res;
					});
				};
			}

			/**
			 * Creates block preview card
			 * @param {string} blockKey - Block key (folder name)
			 * @param {{name: string, [preview]: ?string, [new]: ?boolean}} block - Object with block data
			 * @param {string} [mode]
			 * @returns {BX.Landing.UI.Card.BlockPreviewCard}
			 */
		}, {
			key: "createBlockCard",
			value: function createBlockCard(blockKey, block, mode) {
				return new BX.Landing.UI.Card.BlockPreviewCard({
					title: block.name,
					image: block.preview,
					code: blockKey,
					app_expired: block.app_expired,
					favorite: !!block.favorite,
					favoriteMy: !!block.favoriteMy,
					repo_id: block.repo_id,
					mode,
					isNew: block.new === true,
					onClick: this.onAddBlock.bind(this, blockKey),
					currentCategory: block.currentCategory,
					role: BLOCK_CARD_ROLE,
					useFavouriteBadge: true,
					isFavorite: Array.isArray(this.favouriteBlocks) && this.favouriteBlocks.includes(blockKey)
				});
			}
		}, {
			key: "createFavouriteCategoryEmptyState",
			value: function createFavouriteCategoryEmptyState() {
				return main_core.Tag.render`
			<div
				class="landing-favourite-category-empty-state text-center"
				data-testid="landing-blocks-panel-empty-state"
			>
				<img 
					class="landing-favourite-category-empty-state--image" 
					src="/bitrix/images/landing/empty-favourite.webp"
					alt=""
					style="margin-bottom: 14px;"
				/>
				<p 
					class="landing-favourite-category-empty-state--title"
					style="color: #333333; font-weight: 500; font-size: 19px; line-height: 26px; margin-bottom: 10px;"
				>
					${landing_loc.Loc.getMessage('LANDING_SECTION_FAVOURITE_EMPTY_STATE_TITLE')}
				</p>
				<p 
					class="landing-favourite-category-empty-state--text"
					style="color: #414A56; font-weight: 400; font-size: 16px; line-height: 21px; max-width: 340px; margin: auto;"
				>
					${landing_loc.Loc.getMessage('LANDING_SECTION_FAVOURITE_EMPTY_STATE_TEXT')}
				</p>
			</div>
		`;
			}

			/**
			 * Handles block delete event
			 */
		}, {
			key: "onBlockDelete",
			value: function onBlockDelete(block) {
				if (!block.parent.querySelector('.block-wrapper')) {
					this.adjustEmptyAreas();
				}
			}

			/**
			 * Shows page overlay
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "showOverlay",
			value: function showOverlay() {
				const main = document.querySelector('main.landing-edit-mode');
				if (main) {
					main_core.Dom.addClass(main, 'landing-ui-overlay');
				}
			}

			/**
			 * Hides page overlay
			 */
			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "hideOverlay",
			value: function hideOverlay() {
				const main = document.querySelector('main.landing-edit-mode');
				if (main) {
					main_core.Dom.removeClass(main, 'landing-ui-overlay');
				}
			}
		}, {
			key: "reloadSlider",
			value: function reloadSlider(url) {
				return landing_sliderhacks.SliderHacks.reloadSlider(url, window.parent);
			}
		}], [{
			key: "getMode",
			value: function getMode() {
				return 'edit';
			}
		}, {
			key: "createInstance",
			value: function createInstance(id) {
				const rootWindow = BX.Landing.PageObject.getRootWindow();
				if (rootWindow.BX.Landing.Main.instance) {
					rootWindow.BX.Landing.Main.instance.clear();
				}
				rootWindow.BX.Landing.Main.instance = new BX.Landing.Main(id);
			}
		}, {
			key: "getInstance",
			value: function getInstance() {
				const rootWindow = BX.Landing.PageObject.getRootWindow();
				rootWindow.BX.Reflection.namespace('BX.Landing.Main');
				if (rootWindow.BX.Landing.Main.instance) {
					return rootWindow.BX.Landing.Main.instance;
				}
				rootWindow.BX.Landing.Main.instance = new Main(-1);
				return rootWindow.BX.Landing.Main.instance;
			}

			/**
			 * Returns true, if current page is Editor.
			 * @return {boolean}
			 */
		}, {
			key: "isEditorMode",
			value: function isEditorMode() {
				return main_core.Dom.hasClass(document.body, 'landing-editor');
			}

			/**
			 * Returns true, if external controls is enabled.
			 * @return {boolean}
			 */
		}, {
			key: "isExternalControlsEnabled",
			value: function isExternalControlsEnabled() {
				return main_core.Dom.hasClass(document.body, 'enable-external-controls');
			}

			/**
			 * Returns in percent scroll position of page.
			 *
			 * @return {number}
			 */
		}, {
			key: "topInPercent",
			value: function topInPercent() {
				const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
				const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
				return scrollTop / scrollHeight * 100;
			}

			/**
			 * Maps site type to analytics category.
			 *
			 * @return {string}
			 */
		}, {
			key: "getAnalyticsCategoryByType",
			value: function getAnalyticsCategoryByType() {
				const siteType = BX.Landing.Env.getInstance().getType();
				switch (siteType) {
					case 'STORE':
						return 'shop';
					case 'KNOWLEDGE':
					case 'GROUP':
						return 'kb';
					case 'VIBE':
						return 'vibe';
					default:
						return 'site';
				}
			}

			/**
			 * Landing ID
			 * @type {number}
			 */
		}]);
	}(main_core_events.EventEmitter);
	babelHelpers.defineProperty(Main, "TYPE_PAGE", 'PAGE');
	babelHelpers.defineProperty(Main, "TYPE_STORE", 'STORE');
	babelHelpers.defineProperty(Main, "TYPE_KNOWLEDGE", 'KNOWLEDGE');
	babelHelpers.defineProperty(Main, "TYPE_GROUP", 'GROUP');

	exports.Main = Main;

})(this.BX.Landing = this.BX.Landing || {}, BX, BX.Event, BX.Landing, BX.Landing, BX.Landing.UI, BX.Landing.UI.Panel, BX.Landing.UI.Panel, BX.Landing.UI.Panel, BX.Landing, BX.Landing, BX.Landing);
//# sourceMappingURL=main.bundle.js.map
