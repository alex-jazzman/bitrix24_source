/* eslint-disable */
this.BX = this.BX || {};
(function (exports, landing_main, landing_pageobject, landing_backend, landing_env, landing_tailwind_runtimesync, main_core, landing_ui_highlight) {
	'use strict';

	const RESOLVED = 'resolved';
	const PENDING = 'pending';
	const HISTORY_TYPES = {
		landing: 'L',
		designerBlock: 'D'
	};

	const {
		scrollTo: scrollTo$d,
		highlight: highlight$c
	} = BX.Landing.Utils;

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	const editNode = function (entry) {
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.block);
			if (!block) {
				return Promise.reject();
			}
			block.forceInit();
			const node = block.nodes.getBySelector(entry.selector);
			if (!node) {
				return Promise.reject();
			}
			return scrollTo$d(node.node).then(highlight$c.bind(null, node.node, editNode.useRangeRect)).then(() => {
				return node.setValue(entry.params.value, false, true);
			});
		});
	};
	editNode.useRangeRect = true;

	const editText = editNode;

	const editEmbed = editNode;

	const editMap = editNode;

	const editImage = editNode;
	editImage.useRangeRect = false;

	const editIcon = editImage;

	const editLink = editNode;
	editLink.useRangeRect = false;

	const {
		scrollTo: scrollTo$c,
		highlight: highlight$b
	} = BX.Landing.Utils;

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function changeNodeName(entry) {
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.block);
			if (!block) {
				return Promise.reject();
			}
			block.forceInit();
			const node = block.nodes.getBySelector(entry.selector);
			if (!node) {
				return Promise.reject();
			}
			return scrollTo$c(node.node).then(() => {
				return highlight$b(node.node);
			}).then(() => {
				if (node.onChangeTag) {
					node.onChangeTag(entry.params.value, true);
				}
				return true;
			});
		});
	}

	const {
		scrollTo: scrollTo$b,
		highlight: highlight$a
	} = BX.Landing.Utils;

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function sortBlock(entry) {
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.block);
			block.forceInit();
			return scrollTo$b(block.node).then(highlight$a.bind(null, block.node)).then(() => {
				return block[entry.params.direction](true);
			});
		});
	}

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function moveBlock(entry) {
		const {
			scrollTo,
			highlight
		} = BX.Landing.Utils;
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			const order = Array.isArray(entry.params.order) ? entry.params.order.map(blockId => parseInt(blockId, 10)).filter(blockId => blockId > 0) : [];
			if (order.length === 0) {
				return Promise.reject();
			}
			const reorderedBlocks = order.map(blockId => blocks.get(blockId));
			if (reorderedBlocks.some(block => !block || !block.node || !block.node.parentNode)) {
				return Promise.reject();
			}
			const container = reorderedBlocks[0].node.parentNode;
			reorderedBlocks.forEach(block => {
				block.forceInit();
				container.appendChild(block.node);
			});
			blocks.clear();
			reorderedBlocks.forEach(block => {
				blocks.add(block);
			});
			const movedIds = Array.isArray(entry.params.movedIds) ? entry.params.movedIds.map(blockId => parseInt(blockId, 10)).filter(blockId => blockId > 0) : [];
			const focusBlock = blocks.get(movedIds[0] || order[0]);
			if (!focusBlock) {
				return Promise.resolve();
			}
			return scrollTo(focusBlock.node).then(() => {
				void highlight(focusBlock.node);
			});
		});
	}

	const {
		scrollTo: scrollTo$a,
		highlight: highlight$9
	} = BX.Landing.Utils;

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function addBlock(entry) {
		return landing_pageobject.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.params.currentBlock);
			return new Promise(resolve => {
				if (block) {
					block.forceInit();
				}
				resolve();
			}).then(() => {
				const landing = BX.Landing.Main.getInstance();
				landing.currentBlock = block;
				return landing_pageobject.PageObject.getInstance().view().then(iframe => {
					landing.currentArea = iframe.contentDocument.body.querySelector(`[data-landing="${entry.params.lid}"]`);
					landing.insertBefore = entry.params.insertBefore;
					return landing.onAddBlock(entry.params.code, entry.block, true).then(newBlock => {
						return scrollTo$a(newBlock).then(highlight$9.bind(null, newBlock, false, false));
					});
				});
			});
		});
	}

	const {
		scrollTo: scrollTo$9,
		highlight: highlight$8
	} = BX.Landing.Utils;

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function removeBlock(entry) {
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.block);
			block.forceInit();
			return scrollTo$9(block.node).then(() => {
				highlight$8(block.node);
				return block.deleteBlock(true);
			});
		});
	}

	const {
		scrollTo: scrollTo$8,
		highlight: highlight$7
	} = BX.Landing.Utils;

	/**
	 * @param {string} state
	 * @param {object} entry
	 * @return {Promise}
	 */
	function addCard(entry) {
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.block);
			if (block) {
				block.forceInit();
			}
			if (!block) {
				return Promise.reject();
			}
			const parentNode = block.node.querySelector(entry.params.selector).parentNode;
			return scrollTo$8(parentNode).then(() => {
				return block.addCard({
					index: entry.params.position,
					container: parentNode,
					content: entry.params.content,
					selector: entry.params.selector
				}, true).then(() => {
					const cardSelector = entry.params.selector + '@' + entry.params.position;
					const card = block.cards.getBySelector(cardSelector);
					if (!card) {
						return Promise.reject();
					}
					return highlight$7(card.node);
				});
			});
		}).catch(err => {
			console.log("Error in history action addCard", err);
		});
	}

	const {
		scrollTo: scrollTo$7,
		highlight: highlight$6
	} = BX.Landing.Utils;

	/**
	 * @param {string} state
	 * @param {object} entry
	 * @return {Promise}
	 */
	function removeCard(entry) {
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.block);
			block.forceInit();
			if (!block) {
				return Promise.reject();
			}
			const relativeSelector = entry.params.selector + '@' + (entry.params.position + 1);
			const card = block.cards.getBySelector(relativeSelector);
			if (!card) {
				return Promise.reject();
			}
			return scrollTo$7(card.node).then(highlight$6.bind(null, card.node)).then(() => {
				return block.removeCard(relativeSelector, true);
			});
		});
	}

	/**
	 * History entry action for add node.
	 * @param {object} entry History entry.
	 * @return {Promise}
	 */
	function addNode(entry) {
		// entry.block === null >> designer mode

		return new Promise((resolve, reject) => {
			const tags = entry.params.tags || {};
			top.BX.onCustomEvent(this, 'Landing:onHistoryAddNode', [tags]);
			resolve();
		});
	}

	/**
	 * History entry action for remove node.
	 * @param {object} entry History entry.
	 * @return {Promise}
	 */
	function removeNode(entry) {
		// entry.block === null >> designer mode

		return new Promise((resolve, reject) => {
			const tags = entry.params.tags || {};
			top.BX.onCustomEvent(this, 'Landing:onHistoryRemoveNode', [tags]);
			resolve();
		});
	}

	const {
		scrollTo: scrollTo$6,
		slice
	} = BX.Landing.Utils;

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function editStyle(entry) {
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.block);
			if (!block) {
				return Promise.reject();
			}
			block.forceInit();
			block.initStyles();
			return block;
		}).then(block => {
			return scrollTo$6(block.node).then(() => {
				return block;
			});
		}).then(block => {
			let elements = slice(block.node.querySelectorAll(entry.selector));
			if (entry.params.isWrapper) {
				elements = [block.content];
				entry.selector += ' > :first-child';
			}
			elements.forEach((element, pos) => {
				if (entry.params.position >= 0 && entry.params.position !== pos) {
					return;
				}
				element.className = entry.params.value.className;
				if (entry.params.value.style && entry.params.value.style !== '') {
					element.style = entry.params.value.style;
				} else {
					element.removeAttribute('style');
				}
			});
			return block;
		}).then(block => {
			const form = block.forms.find(currentForm => {
				return currentForm.selector === entry.selector || currentForm.relativeSelector === entry.selector;
			});
			if (form) {
				form.fields.forEach(field => {
					field.reset();
					field.onFrameLoad();
				});
			}

			// todo: relative selector? position?
			const styleNode = block.styles.find(style => {
				return style.selector === entry.selector || style.relativeSelector === entry.selector;
			});
			if (styleNode) {
				if (entry.params.affect && entry.params.affect.length > 0) {
					styleNode.setAffects(entry.params.affect);
				}
				block.onStyleInputWithDebounce({
					node: styleNode.node,
					data: styleNode.getValue()
				}, true);
			}
		});
	}

	const {
		scrollTo: scrollTo$5,
		highlight: highlight$5
	} = BX.Landing.Utils;

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function editAttributes(entry) {
		return landing_pageobject.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.block);
			return new Promise((resolve, reject) => {
				if (block) {
					block.forceInit();
					resolve(block);
				} else {
					reject();
				}
			}).then(block => {
				return scrollTo$5(block.node).then(() => {
					return block.applyAttributeChanges({
						[entry.params.selector]: {
							attrs: {
								[entry.params.attribute]: entry.params.value
							}
						}
					});
				}).then(highlight$5.bind(null, block.node, false, false));
			});
		});
	}

	class Entry {
		constructor(options) {
			this.block = options.block;
			this.selector = options.selector;
			this.command = main_core.Type.isStringFilled(options.command) ? options.command : '#invalidCommand';
			this.params = options.params;
			this.onAfterCommand = typeof options.onAfterCommand === 'function' ? options.onAfterCommand : null;
		}
	}

	const {
		scrollTo: scrollTo$4,
		highlight: highlight$4
	} = BX.Landing.Utils;
	const editComponent = entry => {
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			/**
			 * @type {BX.Landing.Block}
			 */
			const block = blocks.get(entry.block);
			if (!block) {
				return Promise.reject();
			}
			block.forceInit();
			if (!block.node) {
				return Promise.reject();
			}
			return scrollTo$4(block.node).then(() => {
				return block.applyAttributeChanges({
					[entry.params.selector]: {
						attrs: entry.params.value
					}
				}, true);
			}).then(block.reload.bind(block)).then(highlight$4.bind(null, block.node, false, false));
		});
	};

	const {
		scrollTo: scrollTo$3,
		highlight: highlight$3
	} = BX.Landing.Utils;

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function updateContent(entry) {
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.block);
			block.forceInit();
			return scrollTo$3(block.node).then(() => {
				void highlight$3(block.node);
				return block.updateContent(entry.params.content, true);
			});
		});
	}

	const {
		scrollTo: scrollTo$2,
		highlight: highlight$2
	} = BX.Landing.Utils;
	const commands = {
		updateContent,
		addBlock,
		removeBlock,
		moveBlock
	};
	commands.__contract = 'const commands = { updateContent, addBlock, removeBlock, moveBlock };';

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function multiply(entry) {
		let blockId = null;
		const updateBlockStateData = {};
		const commandQueue = [];
		entry.params.forEach(singleAction => {
			if (!blockId && singleAction.params.block) {
				blockId = singleAction.params.block;
			}
			if (singleAction.command === 'editText' || singleAction.command === 'editImage' || singleAction.command === 'editEmbed' || singleAction.command === 'editMap' || singleAction.command === 'editIcon' || singleAction.command === 'editLink') {
				updateBlockStateData[singleAction.params.selector] = singleAction.params.value;
			}
			if (singleAction.command === 'updateDynamic') {
				updateBlockStateData.dynamicParams = singleAction.params.dynamicParams;
				updateBlockStateData.dynamicState = singleAction.params.dynamicState;
			}
			if (singleAction.command === 'changeAnchor') {
				updateBlockStateData.settings = {
					id: singleAction.params.value
				};
			}
			if (commands[singleAction.command]) {
				commandQueue.push(() => commands[singleAction.command]({
					block: singleAction.params.block,
					selector: singleAction.params.selector,
					command: singleAction.command,
					params: singleAction.params
				}).then(() => {
					if (typeof entry.onAfterCommand === 'function') {
						return entry.onAfterCommand(singleAction);
					}
					return null;
				}));
			}
		});
		return BX.Landing.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(blockId);
			if (block) {
				block.forceInit();
				return scrollTo$2(block.node).then(() => {
					void highlight$2(block.node);
					if (Object.keys(updateBlockStateData).length > 0) {
						block.updateBlockState(updateBlockStateData, true);
					}
				});
			}
		}).then(() => {
			return commandQueue.reduce((promise, command) => {
				return promise.then(command);
			}, Promise.resolve());
		});
	}
	multiply.__contract = 'commandQueue.reduce((promise, command) => promise.then(command), Promise.resolve());';

	const {
		scrollTo: scrollTo$1,
		highlight: highlight$1
	} = BX.Landing.Utils;

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function replaceLanding(entry) {
		return new Promise((resolve, reject) => {
			top.window.location.reload();
			resolve();
		});
	}

	const {
		scrollTo,
		highlight
	} = BX.Landing.Utils;

	/**
	 * @param {object} entry
	 * @return {Promise}
	 */
	function changeAnchor(entry) {
		return landing_pageobject.PageObject.getInstance().blocks().then(blocks => {
			const block = blocks.get(entry.params.currentBlock);
			return new Promise((resolve, reject) => {
				if (block) {
					block.forceInit();
					resolve(block);
				} else {
					reject();
				}
			}).then(block => {
				scrollTo(block).then(highlight.bind(null, block, false, false));
			});
		});
	}

	/**
	 * Implements interface for works with command of history
	 * @param {{id: string, undo: function, redo: function}} options
	 */
	class Command {
		constructor(options) {
			this.id = main_core.Type.isStringFilled(options.id) ? options.id : '#invalidCommand';
			this.command = main_core.Type.isFunction(options.command) ? options.command : () => {};
			this.onBeforeCommand = main_core.Type.isFunction(options.onBeforeCommand) ? options.onBeforeCommand : () => {
				return Promise.resolve();
			};
		}
	}

	/**
	 * Registers base internal commands
	 * @param {History} history
	 * @return {Promise<History>}
	 */
	function registerBaseCommands(history) {
		history.registerCommand(new Command({
			id: 'editText',
			command: editText
		}));
		history.registerCommand(new Command({
			id: 'editImage',
			command: editImage
		}));
		history.registerCommand(new Command({
			id: 'editEmbed',
			command: editEmbed
		}));
		history.registerCommand(new Command({
			id: 'editMap',
			command: editMap
		}));
		history.registerCommand(new Command({
			id: 'editIcon',
			command: editIcon
		}));
		history.registerCommand(new Command({
			id: 'editLink',
			command: editLink
		}));
		history.registerCommand(new Command({
			id: 'cnangeNodeName',
			command: changeNodeName
		}));
		history.registerCommand(new Command({
			id: 'sortBlock',
			command: sortBlock
		}));
		history.registerCommand(new Command({
			id: 'moveBlock',
			command: moveBlock
		}));
		history.registerCommand(new Command({
			id: 'addBlock',
			command: addBlock
		}));
		history.registerCommand(new Command({
			id: 'removeBlock',
			command: removeBlock
		}));
		history.registerCommand(new Command({
			id: 'updateStyle',
			command: editStyle
		}));
		history.registerCommand(new Command({
			id: 'addCard',
			command: addCard
		}));
		history.registerCommand(new Command({
			id: 'removeCard',
			command: removeCard
		}));
		history.registerCommand(new Command({
			id: 'addNode',
			command: addNode
		}));
		history.registerCommand(new Command({
			id: 'removeNode',
			command: removeNode
		}));
		history.registerCommand(new Command({
			id: 'updateContent',
			command: updateContent
		}));
		history.registerCommand(new Command({
			id: 'replaceLanding',
			command: replaceLanding,
			onBeforeCommand: () => {
				return main_core.Runtime.loadExtension('main.loader').then(() => {
					const editor = BX.Landing.PageObject.getEditorWindow();
					if (editor) {
						const container = main_core.Tag.render`<div class="landing-ui-modal"></div>`;
						main_core.Dom.append(container, editor.document.body);
						const loader = new BX.Loader({
							target: container
						});
						loader.show();
					}
					return Promise.resolve();
				});
			}
		}));
		history.registerCommand(new Command({
			id: 'changeAnchor',
			command: changeAnchor
		}));
		history.registerCommand(new Command({
			id: 'editAttributes',
			command: editAttributes
		}));
		history.registerCommand(new Command({
			id: 'editComponent',
			command: editComponent
		}));
		history.registerCommand(new Command({
			id: 'multiply',
			command: multiply
		}));
		return Promise.resolve(history);
	}

	const worker$1 = new Worker('/bitrix/js/landing/history/src/worker/json-parse-worker.js');

	/**
	 * Parses json string
	 * @param {string} str
	 * @return {Promise<?Object|array>}
	 */
	function asyncJsonParse(str) {
		return new Promise(resolve => {
			worker$1.postMessage(str);
			worker$1.addEventListener('message', event => {
				resolve(event.data);
			});
		});
	}

	const worker = new Worker('/bitrix/js/landing/history/src/worker/json-stringify-worker.js');

	/**
	 * Serializes object
	 * @param {Object|array} obj
	 * @return {Promise<?String>}
	 */
	function asyncJsonStringify(obj) {
		return new Promise(resolve => {
			worker.postMessage(obj);
			worker.addEventListener('message', event => {
				resolve(event.data);
			});
		});
	}

	/**
	 * Removes page history from storage
	 * @param {int} pageId
	 * @param {History} history
	 * @return {Promise<History>}
	 */
	function removePageHistory(pageId, history) {
		return asyncJsonParse(window.localStorage.history).then(historyData => {
			return main_core.Type.isPlainObject(historyData) ? historyData : {};
		}).then(all => {
			if (pageId in all) {
				delete all[pageId];
			}
			return all;
		}).then(asyncJsonStringify).then(allString => {
			window.localStorage.history = allString;
			return history;
		});
	}

	/**
	 * Clears history stack
	 * @param {History} history
	 * @return {Promise<History>}
	 */
	function clear(history) {
		history.stack = null;
		history.commandState = RESOLVED;
		return Promise.resolve(history);
	}

	/**
	 * Calls on update history stack
	 * @param {History} history
	 * @return {Promise<History>}
	 */
	function onUpdate(history) {
		const rootWindow = BX.Landing.PageObject.getRootWindow();
		BX.onCustomEvent(rootWindow.window, 'BX.Landing.History:update', [history]);
		return Promise.resolve(history);
	}

	/**
	 * Calls on init history object
	 * @param history
	 * @return {Promise<History>}
	 */
	function onInit(history) {
		const rootWindow = BX.Landing.PageObject.getRootWindow();
		BX.onCustomEvent(rootWindow.window, 'BX.Landing.History:init', [history]);
		return Promise.resolve(history);
	}

	class Stack {
		/**
		 * ID and type of main entity (landing or design block)
		 */

		items = [];
		/**
		 * All entities in stack and them current steps
		 */
		entitySteps = {};
		constructor(entityId, entityType = HISTORY_TYPES.landing) {
			this.mainEntityId = entityId;
			this.entityType = entityType;
		}
		init() {
			return this.#loadFromBackend().then(this.#adjustMultiPage.bind(this));
		}
		reload() {
			this.items = [];
			this.step = 0;
			return this.#loadFromBackend();
		}
		#loadFromBackend() {
			return BX.Landing.Backend.getInstance().action(this.#getLoadBackendActionName(), this.#getLoadBackendParams()).then(data => {
				const items = main_core.Type.isArray(data.stack) ? data.stack : [];
				items.forEach(item => {
					if (item.entityId && main_core.Type.isNumber(item.entityId) && item.command && main_core.Type.isString(item.command)) {
						this.items.push({
							entityId: item.entityId,
							command: item.command
						});
						if (item.current && item.current === true) {
							this.entitySteps[item.entityId] = this.items.length;
						}
					}
				});
				const step = main_core.Text.toNumber(data.step);
				this.step = Math.min(this.items.length, step);
				this.step = Math.max(0, this.step);
			}).catch(e => {
				console.error('History load error', e);
				return history;
			});
		}
		#getLoadBackendActionName() {
			if (this.entityType === HISTORY_TYPES.designerBlock) {
				return "History::getForDesignerBlock";
			}
			return "History::getForLanding";
		}
		#getLoadBackendParams() {
			if (this.entityType === HISTORY_TYPES.designerBlock) {
				return {
					blockId: this.mainEntityId
				};
			}
			return {
				lid: this.mainEntityId
			};
		}
		#adjustMultiPage() {
			const currentItem = this.items[this.step - 1];
			if (currentItem && this.entityType === HISTORY_TYPES.landing && this.#isMultiPage()) {
				const entitiesToClearFuture = [];
				this.items.forEach((item, index) => {
					const step = index + 1;
					if (step >= this.step) {
						return;
					}

					// Clear future for all entities, except current, that have future (have steps after own current)
					if (item.entityId !== currentItem.entityId && this.entitySteps[item.entityId] < step) {
						entitiesToClearFuture.push(item.entityId);
					}
				});
				if (entitiesToClearFuture.length > 0) {
					const backend = landing_backend.Backend.getInstance();
					const promises = [];
					entitiesToClearFuture.forEach(entityId => {
						promises.push(backend.action('History::clearFutureForLanding', {
							landingId: entityId
						}));
					});
					return Promise.all(promises).then(this.reload.bind(this));
				}
			}
			return Promise.resolve();
		}
		#isMultiPage() {
			return Object.keys(this.entitySteps).length > 1;
		}
		setTypeDesignerBlock(blockId) {
			this.mainEntityId = blockId;
			this.entityType = HISTORY_TYPES.designerBlock;
			return this.reload();
		}
		getCommandName(undo = true) {
			let step = undo ? this.step : this.step + 1;
			step--; // array index correction

			return this.items[step] ? this.items[step].command : null;
		}
		getCommandEntityId(undo = true) {
			let step = undo ? this.step : this.step + 1;
			step--; // array index correction

			return this.items[step] ? this.items[step].entityId : null;
		}

		/**
		 * Check is stack undoable
		 * @return {boolean}
		 */
		canUndo() {
			return this.step > 0 && this.step <= this.items.length;
		}

		/**
		 * Check is stack reduable
		 * @return {boolean}
		 */
		canRedo() {
			return this.step >= 0 && this.step < this.items.length;
		}

		/**
		 * Change stack when undo or redo
		 * @param undo - if false - redo
		 * @return {Promise}
		 */
		offset(undo = true) {
			const newStep = undo ? this.step - 1 : this.step + 1;
			if (newStep >= 0 && newStep <= this.items.length) {
				this.step = newStep;
			}
			return Promise.resolve();
		}
		push() {
			// For some types actions history.push called before backend changes. Need add input timeout
			return new Promise(resolve => {
				setTimeout(() => {
					// change values before load
					if (this.step < this.items.length) {
						this.items = this.items.slice(0, this.step - 1);
					}
					this.step++;
					this.items.push(this.items[this.step - 1]);
					return this.reload().then(resolve);
				}, 500);
			});
		}
	}

	class Highlight extends landing_ui_highlight.Highlight {
		constructor() {
			super();
			this.layout.classList.add('landing-ui-highlight-animation');
			this.animationDuration = 300;
		}
		static getInstance() {
			const rootWindow = landing_pageobject.PageObject.getRootWindow();
			if (!rootWindow.BX.Landing.History.Highlight.instance) {
				rootWindow.BX.Landing.History.Highlight.instance = new Highlight();
			}
			return rootWindow.BX.Landing.History.Highlight.instance;
		}
		show(element, rect) {
			BX.Landing.UI.Highlight.prototype.show.call(this, element, rect);
			return new Promise(resolve => {
				setTimeout(resolve, this.animationDuration);
				this.hide();
			});
		}
	}

	const TAILWIND_HISTORY_PENDING_ATTRIBUTE = 'data-history-tailwind-pending';
	const TAILWIND_HISTORY_PENDING_VISIBILITY_ATTRIBUTE = 'data-history-tailwind-pending-visibility';
	const TAILWIND_HISTORY_PENDING_STYLE_ID = 'history-tailwind-pending-style';

	/**
	 * Implements interface for works with landing history
	 * Implements singleton pattern use as BX.Landing.History.getInstance()
	 * @memberOf BX.Landing
	 */
	class History {
		/**
		 * Stack of action commands
		 */
		stack = null;

		/**
		 * Key - command name, value - a Command object
		 */
		commands = {};

		/**
		 * If command now running - set to PENDING
		 * @type {string}
		 */
		commandState = RESOLVED;

		/**
		 * Type of current entity
		 * @type {string}
		 */
		entityType = HISTORY_TYPES.landing;

		/**
		 * Landing or Block ID in relation to type
		 * @type {number}
		 */

		constructor() {
			try {
				this.entityId = landing_main.Main.getInstance().id;
			} catch (err) {
				this.entityId = -1;
			}
			this.stack = new Stack(this.entityId);
			this.stack.init().then(() => {
				return registerBaseCommands(this);
			}).then(onInit);
		}
		static Command = Command;
		static Entry = Entry;
		static Highlight = Highlight; // not delete - just for export

		static getInstance() {
			const rootWindow = landing_pageobject.PageObject.getRootWindow();
			if (!rootWindow.BX.Landing.History.instance) {
				rootWindow.BX.Landing.History.instance = new BX.Landing.History();
			}
			return rootWindow.BX.Landing.History.instance;
		}

		/**
		 * Set special type for designer block history
		 * @param blockId
		 * @return {Promise<BX.Landing.History>|*}
		 */
		setTypeDesignerBlock(blockId) {
			this.entityType = HISTORY_TYPES.designerBlock;
			this.entityId = blockId;
			return this.stack.setTypeDesignerBlock(blockId).then(() => {
				return this;
			});
		}
		getEntityId() {
			return this.entityId;
		}
		beforeUndo() {
			const commandName = this.stack.getCommandName();
			if (commandName && this.commands[commandName]) {
				const command = this.commands[commandName];
				return command.onBeforeCommand();
			}
			return Promise.resolve();
		}
		beforeRedo() {
			const commandName = this.stack.getCommandName(false);
			if (commandName && this.commands[commandName]) {
				const command = this.commands[commandName];
				return command.onBeforeCommand();
			}
			return Promise.resolve();
		}

		/**
		 * Applies preview history entry
		 * @return {Promise}
		 */
		undo() {
			if (this.canUndo()) {
				const entityId = this.stack.getCommandEntityId(true);
				let historyCommand = null;
				let tailwindBatchSync = null;
				this.commandState = PENDING;
				return this.beforeUndo().then(() => {
					return landing_backend.Backend.getInstance().action(this.getBackendActionName(true), this.getBackendActionParams(true));
				}).then(command => {
					if (command) {
						historyCommand = command;
						const params = command.params;
						const entry = new Entry({
							block: params.block,
							selector: params.selector,
							command: command.command,
							params: params,
							onAfterCommand: null
						});
						return this.prepareTailwindRuntimeBeforeHistoryCommand(entityId, historyCommand).then(() => {
							return this.prepareTailwindRuntimeBatchBeforeHistoryCommand(entityId, historyCommand);
						}).then(batchSync => {
							tailwindBatchSync = batchSync;
							entry.onAfterCommand = this.createTailwindRuntimeAfterHistoryCommandCallback(entityId, historyCommand, tailwindBatchSync);
							return this.runCommand(entry);
						});
					}
					return Promise.reject();
				}).then(() => {
					return this.offset();
				}).then(onUpdate).then(history => {
					return this.rebuildTailwindAfterHistoryCommand(history, entityId, historyCommand, tailwindBatchSync);
				}).then(history => {
					return this.publicationAfterHistoryCommand(history, entityId, historyCommand);
				});
			}
			return Promise.resolve(this);
		}

		/**
		 * Applies preview next history entry
		 * @return {Promise}
		 */
		redo() {
			if (this.canRedo()) {
				const entityId = this.stack.getCommandEntityId(false);
				let historyCommand = null;
				let tailwindBatchSync = null;
				this.commandState = PENDING;
				return this.beforeRedo().then(() => {
					return landing_backend.Backend.getInstance().action(this.getBackendActionName(false), this.getBackendActionParams(false));
				}).then(command => {
					if (command) {
						historyCommand = command;
						const params = command.params;
						const entry = new Entry({
							block: params.block,
							selector: params.selector,
							command: command.command,
							params: params,
							onAfterCommand: null
						});
						return this.prepareTailwindRuntimeBeforeHistoryCommand(entityId, historyCommand).then(() => {
							return this.prepareTailwindRuntimeBatchBeforeHistoryCommand(entityId, historyCommand);
						}).then(batchSync => {
							tailwindBatchSync = batchSync;
							entry.onAfterCommand = this.createTailwindRuntimeAfterHistoryCommandCallback(entityId, historyCommand, tailwindBatchSync);
							return this.runCommand(entry);
						});
					}
					return Promise.reject();
				}).then(() => {
					return this.offset(false);
				}).then(onUpdate).then(history => {
					return this.rebuildTailwindAfterHistoryCommand(history, entityId, historyCommand, tailwindBatchSync);
				}).then(history => {
					return this.publicationAfterHistoryCommand(history, entityId, historyCommand);
				});
			}
			return Promise.resolve(this);
		}

		/**
		 * Get name for backend action
		 * @param {boolean} undo - true, if need undo, false for redo
		 * @return {string}
		 */
		getBackendActionName(undo = true) {
			if (this.entityType === HISTORY_TYPES.designerBlock) {
				return undo ? 'History::undoDesignerBlock' : 'History::redoDesignerBlock';
			}
			return undo ? 'History::undoLanding' : 'History::redoLanding';
		}

		/**
		 * Get id for entity for backend action
		 * @param {boolean} undo - true, if need undo, false for redo
		 * @return {string}
		 */
		getBackendActionParams(undo = true) {
			if (this.entityType === HISTORY_TYPES.designerBlock) {
				return {
					blockId: this.entityId
				};
			}
			return {
				lid: this.stack.getCommandEntityId(undo)
			};
		}
		isAutoPublicationEnabled() {
			const rootWindow = landing_pageobject.PageObject.getRootWindow();
			const topWindow = rootWindow && rootWindow.top ? rootWindow.top : window.top;
			if (topWindow && topWindow.window && typeof topWindow.window.autoPublicationEnabled === 'boolean') {
				return topWindow.window.autoPublicationEnabled;
			}
			const option = landing_env.Env.getInstance().getOptions().autoPublicationEnabled;
			return option === true || option === 'Y' || option === 1 || option === '1';
		}
		isTailwindRuntimeEnabled() {
			const option = landing_env.Env.getInstance().getOptions().tailwindRuntimeEnabled;
			return option === true || option === 'Y' || option === 1 || option === '1';
		}
		publicationAfterHistoryCommand(history, entityId, command) {
			const landingId = this.resolveTailwindRuntimeLandingId(entityId, command) || entityId || this.entityId;
			if (this.entityType !== HISTORY_TYPES.landing || !this.isAutoPublicationEnabled() || !landingId || this.isTailwindRebuildFailed(command)) {
				return Promise.resolve(history);
			}
			return landing_backend.Backend.getInstance().action('Landing::publication', {
				lid: landingId
			}).then(() => history).catch(() => history);
		}
		prepareTailwindRuntimeBeforeHistoryCommand(entityId, command) {
			if (!this.isTailwindRuntimeEnabled()) {
				return Promise.resolve();
			}
			const landingId = this.resolveTailwindRuntimeLandingId(entityId, command);
			const pendingBlockIds = landing_tailwind_runtimesync.getPendingBlockIds(this.normalizeTailwindHistoryOperations(command));
			if (!landingId || pendingBlockIds.size <= 0) {
				return Promise.resolve();
			}
			return landing_pageobject.PageObject.getInstance().view().then(iframe => {
				return landing_tailwind_runtimesync.TailwindRuntimeSync.preloadRuntimeForWindow(iframe?.contentWindow, {
					helpersBasePath: this.resolveTailwindRuntimeHelpersBasePath()
				});
			}).catch(err => {
				this.commandState = RESOLVED;
				console.error('History Tailwind runtime preload failed.', err);
				return Promise.reject(err);
			});
		}
		prepareTailwindRuntimeBatchBeforeHistoryCommand(entityId, command) {
			if (!this.isTailwindRuntimeEnabled()) {
				return Promise.resolve(null);
			}
			const landingId = this.resolveTailwindRuntimeLandingId(entityId, command);
			const operations = this.normalizeTailwindHistoryOperations(command);
			const pendingBlockIds = landing_tailwind_runtimesync.getPendingBlockIds(operations);
			if (!landingId || pendingBlockIds.size <= 0) {
				return Promise.resolve(null);
			}
			return landing_pageobject.PageObject.getInstance().view().then(iframe => {
				const targetDocument = this.resolveTailwindRuntimeDocument(iframe);
				if (!targetDocument?.head) {
					return Promise.reject(new Error('History Tailwind visual guard target document is not available.'));
				}
				return this.resolveTailwindRuntimeBlocks().then(blocks => {
					const batchSync = new landing_tailwind_runtimesync.TailwindRuntimeBatchSync({
						landingId,
						targetWindow: iframe?.contentWindow,
						targetDocument,
						helpersBasePath: this.resolveTailwindRuntimeHelpersBasePath(),
						pendingStyleId: TAILWIND_HISTORY_PENDING_STYLE_ID,
						pendingAttribute: TAILWIND_HISTORY_PENDING_ATTRIBUTE,
						pendingVisibilityAttribute: TAILWIND_HISTORY_PENDING_VISIBILITY_ATTRIBUTE,
						operations,
						finalRebuildRequired: true,
						resolveBlockNode: blockId => this.resolveTailwindRuntimeBlockNode(blocks, blockId),
						onFailure: err => {
							if (command && command.tailwindRuntime) {
								command.tailwindRuntime.rebuildFailed = true;
							}
							console.error('History Tailwind CSS rebuild failed.', err);
							this.reloadEditorWindowAfterTailwindRuntimeFailure();
						}
					});
					return batchSync.prepare().then(() => batchSync);
				});
			}).catch(err => {
				this.commandState = RESOLVED;
				console.error('History Tailwind visual guard failed.', err);
				return Promise.reject(err);
			});
		}
		rebuildTailwindAfterHistoryCommand(history, entityId, command, batchSync = null) {
			const landingId = this.resolveTailwindRuntimeLandingId(entityId, command);
			if (!batchSync || !this.isTailwindRuntimeEnabled() || !landingId || this.isTailwindRebuildFailed(command) || typeof batchSync.finalize !== 'function') {
				return Promise.resolve(history);
			}
			return batchSync.finalize().then(() => history).then(result => result);
		}
		createTailwindRuntimeAfterHistoryCommandCallback(entityId, command, batchSync) {
			const commandName = String(command?.command || '').trim();
			const landingId = this.resolveTailwindRuntimeLandingId(entityId, command);
			if (commandName !== 'multiply' || !this.isTailwindRuntimeEnabled() || !landingId || !batchSync || typeof batchSync.afterOperation !== 'function' || batchSync.getPendingBlockIds().size <= 0) {
				return null;
			}
			return singleCommand => {
				return batchSync.afterOperation(this.normalizeTailwindHistoryOperation(singleCommand));
			};
		}
		reloadEditorWindowAfterTailwindRuntimeFailure() {
			const editorWindow = landing_pageobject.PageObject.getEditorWindow();
			if (editorWindow?.location && typeof editorWindow.location.reload === 'function') {
				landing_tailwind_runtimesync.TailwindRuntimeSync.reloadWindow(editorWindow);
				return;
			}
			landing_tailwind_runtimesync.TailwindRuntimeSync.reloadWindow(window);
		}
		resolveTailwindRuntimeDocument(iframe) {
			return iframe?.contentDocument || iframe?.contentWindow?.document || document;
		}
		resolveTailwindRuntimeHelpersBasePath() {
			try {
				const bx = landing_pageobject.PageObject.getRootWindow()?.BX;
				if (typeof bx?.message !== 'function') {
					return null;
				}
				const templatePath = String(bx.message('SITE_TEMPLATE_PATH') || '').trim().replace(/\/+$/, '');
				if (templatePath === '') {
					return null;
				}
				return `${templatePath}/assets/js/helpers`;
			} catch (error) {
				return null;
			}
		}
		resolveTailwindRuntimeBlocks() {
			return landing_pageobject.PageObject.getInstance().blocks().catch(() => null);
		}
		resolveTailwindRuntimeBlockNode(blocks, blockId) {
			const block = blocks && typeof blocks.get === 'function' ? blocks.get(blockId) : null;
			return block?.node || null;
		}
		normalizeTailwindHistoryOperation(command) {
			if (!command) {
				return null;
			}
			const typeMap = {
				updateContent: 'update_block',
				addBlock: 'add_block',
				removeBlock: 'delete_block',
				moveBlock: 'move_block'
			};
			const commandName = String(command.command || '').trim();
			const type = typeMap[commandName] || null;
			const blockId = parseInt(command?.params?.block, 10);
			if (!type || !(blockId > 0)) {
				return null;
			}
			return {
				type,
				blockId,
				raw: command
			};
		}
		normalizeTailwindHistoryOperations(command) {
			if (!command) {
				return [];
			}
			const commandName = String(command.command || '').trim();
			if (commandName === 'multiply' && Array.isArray(command.params)) {
				return command.params.flatMap(singleCommand => this.normalizeTailwindHistoryOperations(singleCommand));
			}
			const operation = this.normalizeTailwindHistoryOperation(command);
			return operation ? [operation] : [];
		}
		resolveTailwindRuntimeLandingId(entityId, command) {
			const tailwindRuntime = command && command.tailwindRuntime;
			const landingId = tailwindRuntime && tailwindRuntime.landingId || entityId || this.entityId;
			if (this.entityType !== HISTORY_TYPES.landing || !tailwindRuntime || tailwindRuntime.rebuildRequired !== true || !landingId) {
				return null;
			}
			return landingId;
		}
		isTailwindRebuildFailed(command) {
			return Boolean(command && command.tailwindRuntime && command.tailwindRuntime.rebuildRequired === true && command.tailwindRuntime.rebuildFailed === true);
		}
		runCommand(entry) {
			if (entry) {
				const command = this.commands[entry.command];
				if (command) {
					this.commandState = PENDING;
					return command.command(entry).then(() => {
						this.commandState = RESOLVED;
						return this;
					}).catch(err => {
						console.error(`History error in command ${command.id}.`, err);
						this.commandState = RESOLVED;
						return this;
					});
				}
			}
		}
		offset(undo = true) {
			if (this.commandState === PENDING) {
				return Promise.resolve(this);
			}
			return this.stack.offset(undo).then(() => {
				return this;
			});
		}

		/**
		 * Check that there are actions to undo
		 * @returns {boolean}
		 */
		canUndo() {
			return this.commandState !== PENDING && this.stack.canUndo();
		}

		/**
		 * Check that there are actions to redo
		 * @returns {boolean}
		 */
		canRedo() {
			return this.commandState !== PENDING && this.stack.canRedo();
		}

		/**
		 * Adds entry to history stack
		 */
		push() {
			return this.stack.push().then(() => {
				return onUpdate(this);
			});
		}
		reload() {
			return this.stack.reload().then(() => {
				return onUpdate(this);
			});
		}

		/**
		 * Registers unique history command
		 * @param {Command} command
		 */
		registerCommand(command) {
			if (command instanceof Command) {
				this.commands[command.id] = command;
			}
		}

		/**
		 * Removes page history from storage
		 * @param {int} pageId
		 * @return {Promise<BX.Landing.History>}
		 */
		removePageHistory(pageId) {
			return removePageHistory(pageId, this).then(history => {
				let currentPageId;
				try {
					currentPageId = BX.Landing.Main.getInstance().id;
				} catch (err) {
					currentPageId = -1;
				}
				if (currentPageId === pageId) {
					return clear(history);
				}
				return Promise.reject();
			}).then(onUpdate).catch(() => {});
		}
	}

	exports.History = History;

})(this.BX.Landing = this.BX.Landing || {}, BX.Landing, BX.Landing, BX.Landing, BX.Landing, BX.Landing, BX, BX.Landing.UI);
//# sourceMappingURL=history.bundle.js.map
