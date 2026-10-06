import {
	Main
} from 'landing.main';
import {
	PageObject
} from 'landing.pageobject';
import {
	Backend
} from 'landing.backend';
import {
	Env
} from 'landing.env';
import {
	TailwindRuntimeBatchSync,
	TailwindRuntimeSync,
	getPendingBlockIds,
} from 'landing.tailwind.runtimesync';
import {
	RESOLVED,
	PENDING,
	HISTORY_TYPES
} from './internal/constants';
import registerBaseCommands from './internal/register-base-commands';
import removePageHistory from './internal/remove-page-history';
import clear from './internal/clear';
import onUpdate from './internal/on-update';
import onInit from './internal/on-init';
import Command from './history-command';
import Entry from './history-entry';
import Stack from './stack';
import Highlight from './history-highlight'; // not delete - just for export

import './css/style.css';

const TAILWIND_HISTORY_PENDING_ATTRIBUTE = 'data-history-tailwind-pending';
const TAILWIND_HISTORY_PENDING_VISIBILITY_ATTRIBUTE = 'data-history-tailwind-pending-visibility';
const TAILWIND_HISTORY_PENDING_STYLE_ID = 'history-tailwind-pending-style';

/**
 * Implements interface for works with landing history
 * Implements singleton pattern use as BX.Landing.History.getInstance()
 * @memberOf BX.Landing
 */
export class History {
	/**
	 * Stack of action commands
	 */
	stack: ? Stack = null;

	/**
	 * Key - command name, value - a Command object
	 */
	commands: {
		[string]: Command
	} = {};

	/**
	 * If command now running - set to PENDING
	 * @type {string}
	 */
	commandState: string = RESOLVED;

	/**
	 * Type of current entity
	 * @type {string}
	 */
	entityType: string = HISTORY_TYPES.landing;

	/**
	 * Landing or Block ID in relation to type
	 * @type {number}
	 */
	entityId: number;

	constructor() {
		try {
			this.entityId = Main.getInstance().id;
		} catch (err) {
			this.entityId = -1;
		}

		this.stack = new Stack(this.entityId);
		this.stack.init()
			.then(() => {
				return registerBaseCommands(this)
			})
			.then(onInit);
	}

	static Command = Command;
	static Entry = Entry;
	static Highlight = Highlight; // not delete - just for export

	static getInstance(): History {
		const rootWindow = PageObject.getRootWindow();
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
	setTypeDesignerBlock(blockId: number): Promise < History > {
		this.entityType = HISTORY_TYPES.designerBlock;
		this.entityId = blockId;

		return this.stack.setTypeDesignerBlock(blockId)
			.then(() => {
				return this;
			})
	}

	getEntityId(): number {
		return this.entityId;
	}

	beforeUndo(): Promise {
		const commandName = this.stack.getCommandName();
		if (commandName && this.commands[commandName]) {
			const command = this.commands[commandName];

			return command.onBeforeCommand();
		}

		return Promise.resolve();
	}

	beforeRedo(): Promise {
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
	undo(): Promise {
		if (this.canUndo()) {
			const entityId = this.stack.getCommandEntityId(true);
			let historyCommand = null;
			let tailwindBatchSync = null;
			this.commandState = PENDING;
			return this.beforeUndo()
				.then(() => {
					return Backend.getInstance()
						.action(
							this.getBackendActionName(true),
							this.getBackendActionParams(true),
						)
				})
				.then(command => {
					if (command) {
						historyCommand = command;
						const params = command.params;
						const entry = new Entry({
							block: params.block,
							selector: params.selector,
							command: command.command,
							params: params,
							onAfterCommand: null,
						});

						return this.prepareTailwindRuntimeBeforeHistoryCommand(entityId, historyCommand)
							.then(() => {
								return this.prepareTailwindRuntimeBatchBeforeHistoryCommand(entityId, historyCommand);
							})
							.then(batchSync => {
								tailwindBatchSync = batchSync;
								entry.onAfterCommand = this.createTailwindRuntimeAfterHistoryCommandCallback(
									entityId,
									historyCommand,
									tailwindBatchSync,
								);

								return this.runCommand(entry);
							});
					}

					return Promise.reject();
				})
				.then(() => {
					return this.offset();
				})
				.then(onUpdate)
				.then(history => {
					return this.rebuildTailwindAfterHistoryCommand(
						history,
						entityId,
						historyCommand,
						tailwindBatchSync,
					);
				})
				.then(history => {
					return this.publicationAfterHistoryCommand(history, entityId, historyCommand);
				});
		}

		return Promise.resolve(this);
	}


	/**
	 * Applies preview next history entry
	 * @return {Promise}
	 */
	redo(): Promise {
		if (this.canRedo()) {
			const entityId = this.stack.getCommandEntityId(false);
			let historyCommand = null;
			let tailwindBatchSync = null;
			this.commandState = PENDING;
			return this.beforeRedo()
				.then(() => {
					return Backend.getInstance()
						.action(
							this.getBackendActionName(false),
							this.getBackendActionParams(false),
						)
				})
				.then(command => {
					if (command) {
						historyCommand = command;
						const params = command.params;
						const entry = new Entry({
							block: params.block,
							selector: params.selector,
							command: command.command,
							params: params,
							onAfterCommand: null,
						});

						return this.prepareTailwindRuntimeBeforeHistoryCommand(entityId, historyCommand)
							.then(() => {
								return this.prepareTailwindRuntimeBatchBeforeHistoryCommand(entityId, historyCommand);
							})
							.then(batchSync => {
								tailwindBatchSync = batchSync;
								entry.onAfterCommand = this.createTailwindRuntimeAfterHistoryCommandCallback(
									entityId,
									historyCommand,
									tailwindBatchSync,
								);

								return this.runCommand(entry);
							});
					}

					return Promise.reject();
				})
				.then(() => {
					return this.offset(false);
				})
				.then(onUpdate)
				.then(history => {
					return this.rebuildTailwindAfterHistoryCommand(
						history,
						entityId,
						historyCommand,
						tailwindBatchSync,
					);
				})
				.then(history => {
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
	getBackendActionName(undo: boolean = true): string {
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
	getBackendActionParams(undo: boolean = true): string {
		if (this.entityType === HISTORY_TYPES.designerBlock) {
			return {
				blockId: this.entityId,
			};
		}

		return {
			lid: this.stack.getCommandEntityId(undo),
		};
	}

	isAutoPublicationEnabled(): boolean {
		const rootWindow = PageObject.getRootWindow();
		const topWindow = rootWindow && rootWindow.top ? rootWindow.top : window.top;
		if (
			topWindow &&
			topWindow.window &&
			typeof topWindow.window.autoPublicationEnabled === 'boolean'
		) {
			return topWindow.window.autoPublicationEnabled;
		}

		const option = Env.getInstance().getOptions().autoPublicationEnabled;
		return option === true || option === 'Y' || option === 1 || option === '1';
	}

	isTailwindRuntimeEnabled(): boolean {
		const option = Env.getInstance().getOptions().tailwindRuntimeEnabled;

		return option === true || option === 'Y' || option === 1 || option === '1';
	}

	publicationAfterHistoryCommand(history: History, entityId: ? number, command : ? Object): Promise < History > {
		const landingId = this.resolveTailwindRuntimeLandingId(entityId, command) || entityId || this.entityId;
		if (
			this.entityType !== HISTORY_TYPES.landing ||
			!this.isAutoPublicationEnabled() ||
			!landingId ||
			this.isTailwindRebuildFailed(command)
		) {
			return Promise.resolve(history);
		}

		return Backend.getInstance()
			.action('Landing::publication', {
				lid: landingId,
			})
			.then(() => history)
			.catch(() => history);
	}

	prepareTailwindRuntimeBeforeHistoryCommand(entityId: ? number, command : ? Object): Promise {
		if (!this.isTailwindRuntimeEnabled()) {
			return Promise.resolve();
		}

		const landingId = this.resolveTailwindRuntimeLandingId(entityId, command);
		const pendingBlockIds = getPendingBlockIds(this.normalizeTailwindHistoryOperations(command));
		if (!landingId || pendingBlockIds.size <= 0) {
			return Promise.resolve();
		}

		return PageObject.getInstance()
			.view()
			.then(iframe => {
				return TailwindRuntimeSync.preloadRuntimeForWindow(
					iframe?.contentWindow, {
						helpersBasePath: this.resolveTailwindRuntimeHelpersBasePath(),
					},
				);
			})
			.catch(err => {
				this.commandState = RESOLVED;
				console.error('History Tailwind runtime preload failed.', err);

				return Promise.reject(err);
			});
	}

	prepareTailwindRuntimeBatchBeforeHistoryCommand(entityId: ? number, command : ? Object): Promise < ? TailwindRuntimeBatchSync > {
		if (!this.isTailwindRuntimeEnabled()) {
			return Promise.resolve(null);
		}

		const landingId = this.resolveTailwindRuntimeLandingId(entityId, command);
		const operations = this.normalizeTailwindHistoryOperations(command);
		const pendingBlockIds = getPendingBlockIds(operations);
		if (!landingId || pendingBlockIds.size <= 0) {
			return Promise.resolve(null);
		}

		return PageObject.getInstance()
			.view()
			.then(iframe => {
				const targetDocument = this.resolveTailwindRuntimeDocument(iframe);
				if (!targetDocument?.head) {
					return Promise.reject(new Error('History Tailwind visual guard target document is not available.'));
				}

				return this.resolveTailwindRuntimeBlocks()
					.then((blocks) => {
						const batchSync = new TailwindRuntimeBatchSync({
							landingId,
							targetWindow: iframe?.contentWindow,
							targetDocument,
							helpersBasePath: this.resolveTailwindRuntimeHelpersBasePath(),
							pendingStyleId: TAILWIND_HISTORY_PENDING_STYLE_ID,
							pendingAttribute: TAILWIND_HISTORY_PENDING_ATTRIBUTE,
							pendingVisibilityAttribute: TAILWIND_HISTORY_PENDING_VISIBILITY_ATTRIBUTE,
							operations,
							finalRebuildRequired: true,
							resolveBlockNode: (blockId) => this.resolveTailwindRuntimeBlockNode(blocks, blockId),
							onFailure: (err) => {
								if (command && command.tailwindRuntime) {
									command.tailwindRuntime.rebuildFailed = true;
								}

								console.error('History Tailwind CSS rebuild failed.', err);
								this.reloadEditorWindowAfterTailwindRuntimeFailure();
							},
						});

						return batchSync.prepare()
							.then(() => batchSync);
					});
			})
			.catch(err => {
				this.commandState = RESOLVED;
				console.error('History Tailwind visual guard failed.', err);

				return Promise.reject(err);
			});
	}

	rebuildTailwindAfterHistoryCommand(
		history: History,
		entityId: ? number,
		command : ? Object,
		batchSync : ? TailwindRuntimeBatchSync = null,
	): Promise < History > {
		const landingId = this.resolveTailwindRuntimeLandingId(entityId, command);
		if (
			!batchSync ||
			!this.isTailwindRuntimeEnabled() ||
			!landingId ||
			this.isTailwindRebuildFailed(command) ||
			(typeof batchSync.finalize !== 'function')
		) {
			return Promise.resolve(history);
		}

		return batchSync.finalize()
			.then(() => history)
			.then((result) => result);
	}

	createTailwindRuntimeAfterHistoryCommandCallback(
		entityId: ? number,
		command : ? Object,
		batchSync : ? TailwindRuntimeBatchSync,
	): ? Function {
		const commandName = String(command?.command || '').trim();
		const landingId = this.resolveTailwindRuntimeLandingId(entityId, command);
		if (
			commandName !== 'multiply' ||
			!this.isTailwindRuntimeEnabled() ||
			!landingId ||
			!batchSync ||
			typeof batchSync.afterOperation !== 'function' ||
			batchSync.getPendingBlockIds().size <= 0
		) {
			return null;
		}

		return (singleCommand) => {
			return batchSync.afterOperation(this.normalizeTailwindHistoryOperation(singleCommand));
		};
	}

	reloadEditorWindowAfterTailwindRuntimeFailure(): void {
		const editorWindow = PageObject.getEditorWindow();
		if (editorWindow?.location && typeof editorWindow.location.reload === 'function') {
			TailwindRuntimeSync.reloadWindow(editorWindow);

			return;
		}

		TailwindRuntimeSync.reloadWindow(window);
	}

	resolveTailwindRuntimeDocument(iframe: ? HTMLIFrameElement): ? Document {
		return iframe?.contentDocument || iframe?.contentWindow?.document || document;
	}

	resolveTailwindRuntimeHelpersBasePath(): ? string {
		try {
			const bx = PageObject.getRootWindow()?.BX;
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

	resolveTailwindRuntimeBlocks(): Promise {
		return PageObject.getInstance()
			.blocks()
			.catch(() => null);
	}

	resolveTailwindRuntimeBlockNode(blocks: ? Object, blockId : number): ? Element {
		const block = blocks && typeof blocks.get === 'function' ? blocks.get(blockId) : null;

		return block?.node || null;
	}

	normalizeTailwindHistoryOperation(command: ? Object): ? Object {
		if (!command) {
			return null;
		}

		const typeMap = {
			updateContent: 'update_block',
			addBlock: 'add_block',
			removeBlock: 'delete_block',
			moveBlock: 'move_block',
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
			raw: command,
		};
	}

	normalizeTailwindHistoryOperations(command: ? Object): Array < Object > {
		if (!command) {
			return [];
		}

		const commandName = String(command.command || '').trim();
		if (commandName === 'multiply' && Array.isArray(command.params)) {
			return command.params.flatMap((singleCommand) => this.normalizeTailwindHistoryOperations(singleCommand));
		}

		const operation = this.normalizeTailwindHistoryOperation(command);

		return operation ? [operation] : [];
	}

	resolveTailwindRuntimeLandingId(entityId: ? number, command : ? Object): ? number {
		const tailwindRuntime = command && command.tailwindRuntime;
		const landingId = (tailwindRuntime && tailwindRuntime.landingId) || entityId || this.entityId;
		if (
			this.entityType !== HISTORY_TYPES.landing ||
			!tailwindRuntime ||
			tailwindRuntime.rebuildRequired !== true ||
			!landingId
		) {
			return null;
		}

		return landingId;
	}

	isTailwindRebuildFailed(command: ? Object): boolean {
		return Boolean(
			command &&
			command.tailwindRuntime &&
			command.tailwindRuntime.rebuildRequired === true &&
			command.tailwindRuntime.rebuildFailed === true
		);
	}

	runCommand(entry: Entry) {
		if (entry) {
			const command = this.commands[entry.command];
			if (command) {
				this.commandState = PENDING;

				return command.command(entry)
					.then(() => {
						this.commandState = RESOLVED;

						return this;
					})
					.catch(err => {
						console.error(`History error in command ${command.id}.`, err);
						this.commandState = RESOLVED;

						return this;
					});
			}
		}
	}

	offset(undo: boolean = true): Promise < History > {
		if (this.commandState === PENDING) {
			return Promise.resolve(this);
		}

		return this.stack.offset(undo)
			.then(() => {
				return this;
			});
	}

	/**
	 * Check that there are actions to undo
	 * @returns {boolean}
	 */
	canUndo() {
		return (
			this.commandState !== PENDING &&
			this.stack.canUndo()
		);
	}


	/**
	 * Check that there are actions to redo
	 * @returns {boolean}
	 */
	canRedo() {
		return (
			this.commandState !== PENDING &&
			this.stack.canRedo()
		);
	}


	/**
	 * Adds entry to history stack
	 */
	push(): Promise < History > {
		return this.stack.push()
			.then(() => {
				return onUpdate(this);
			});
	}

	reload(): Promise < History > {
		return this.stack.reload()
			.then(() => {
				return onUpdate(this);
			});
	}


	/**
	 * Registers unique history command
	 * @param {Command} command
	 */
	registerCommand(command: Command) {
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
		return removePageHistory(pageId, this)
			.then((history) => {
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
			})
			.then(onUpdate)
			.catch(() => {});
	}
}
