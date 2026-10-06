import { Dom, Event, Loc, Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PULL } from 'pull.client';
import { BulkActionPanel } from './bulk-action-panel';
import './style.css';

const GRID_UPDATE_TIMEOUT = 15000;
const BULK_PROCESS_EXTENSION = 'sign.v2.grid.b2e.my-documents.bulk-action-process';
const NOTIFICATION_EXTENSION = 'ui.notification';
const NOTIFICATION_AUTO_HIDE_DELAY = 6000;

type MyDocumentsGridOptions = {
	gridId?: string,
	bulkActionAvailable?: boolean,
	bulkActionLabels?: {
		disabledHint?: { [action: string]: string },
	},
	needActionCounterId: string,
	counterPullEventName: string,
};

type BulkActionSelection = {
	actionType: string,
	memberIds: number[],
	trigger: ?HTMLElement,
};

export class MyDocuments
{
	#options: MyDocumentsGridOptions;
	#bulkActionPanel: ?BulkActionPanel = null;
	#bulkActionProcess: ?Object = null;
	#bulkProcessFactory: ?Function = null;
	#bulkProcessLoading = false;
	#bulkOperationRunning = false;
	#awaitingGridUpdate = false;
	#reloadRequested = false;
	#pullReloadPending = false;
	#dialogClosed = false;
	#focusTrigger: ?HTMLElement = null;
	#frozenGridContainer: ?HTMLElement = null;
	#gridUpdateTimeoutId: ?number = null;
	#onGridUpdated = (event) => {
		if (!this.#isOwnGridEvent(event))
		{
			return;
		}

		if (this.#bulkOperationRunning)
		{
			this.#freezeGrid();

			return;
		}

		if (this.#awaitingGridUpdate)
		{
			this.#completeGridUpdate();
		}
	};

	constructor(options: MyDocumentsGridOptions)
	{
		this.#options = options;
		// the panel follows the portal, not the page: rows with checkboxes come and go with every AJAX
		// update of the grid, and the panel has to be ready for the page that brings them back
		if (options.bulkActionAvailable && options.bulkActionLabels)
		{
			this.#bulkActionPanel = new BulkActionPanel({
				gridId: this.#getGridId(),
				labels: options.bulkActionLabels,
				onApply: (selection) => this.#startBulkAction(selection),
			});
		}
	}

	subscribeOnGridEvents(): void
	{
		this.#bulkActionPanel?.subscribe();
		EventEmitter.subscribe('Grid::updated', this.#onGridUpdated);
	}

	applyBulkAction(actionType: 'approve' | 'reject'): void
	{
		this.#bulkActionPanel?.apply(actionType);
	}

	openSignSliderByGridId(gridId: string): void
	{
		Event.ready(async () => {
			const gridContainer = document.querySelector(gridId);
			if (!gridContainer)
			{
				return;
			}

			Event.bind(gridContainer, 'click', async (event) => {
				let target = event.target;
				if (Dom.hasClass(target, 'ui-btn-text'))
				{
					target = target.parentNode;
				}

				if (!Dom.hasClass(target, 'ui-btn') || !target.dataset.memberId)
				{
					return;
				}

				if (Dom.hasClass(target, 'sign-action-button'))
				{
					Dom.addClass(target, 'ui-btn-wait');

					const memberId = Number(target.dataset.memberId);
					Runtime.loadExtension('sign.v2.b2e.sign-link')
						.then((exports) => {
							return new exports.SignLink({ memberId }).openSlider({
								target,
								events: {
									onClose: async () => {
										await BX.ajax.runAction(
											'sign.api_v1.B2e.Document.Member.callStatus',
											{ json: { memberId } },
										);

										if (Type.isNil(PULL))
										{
											this.#reload();
										}
									},
								},
							});
						})
						.catch((error) => {
							console.error(error);
						})
						.finally(() => {
							Dom.removeClass(target, 'ui-btn-wait');
						});
					event.preventDefault();
				}
			});
		});
	}

	#reload(): void
	{
		Event.ready(() => this.#getGrid()?.reload());
	}

	subscribeOnPullEvents(): void
	{
		Event.ready(() => {
			if (Type.isNil(PULL))
			{
				return;
			}

			PULL.subscribe({
				moduleId: 'sign',
				command: 'updateMyDocumentGrid',
				callback: () => {
					// changes made by the running operation arrive with its own final reload
					if (this.#bulkOperationRunning)
					{
						return;
					}

					if (this.#awaitingGridUpdate)
					{
						this.#pullReloadPending = true;

						return;
					}

					this.#reload();
				},
			});

			PULL.subscribe({
				moduleId: 'sign',
				command: this.#options?.counterPullEventName,
				callback: (params) => {
					if (!Type.isNumber(params?.needActionCount))
					{
						return;
					}

					if (!Type.isStringFilled(this.#options?.needActionCounterId))
					{
						return;
					}

					Event.EventEmitter.emit('BX.Sign.DocumentCounter.Item:updateCounter', {
						id: this.#options.needActionCounterId,
						count: params.needActionCount,
					});
				},
			});
		});
	}

	#startBulkAction(selection: BulkActionSelection): void
	{
		if (
			this.#bulkOperationRunning
			|| this.#awaitingGridUpdate
			|| this.#bulkProcessLoading
			|| this.#bulkActionProcess !== null
		)
		{
			return;
		}

		this.#dialogClosed = false;
		this.#focusTrigger = selection.trigger ?? null;
		void this.#showBulkActionProcess(selection);
	}

	async #showBulkActionProcess(selection: BulkActionSelection): Promise<void>
	{
		this.#bulkProcessLoading = true;
		this.#bulkActionPanel?.setDisabled(true);
		try
		{
			const createProcess = await this.#loadBulkProcessFactory();
			this.#bulkActionProcess = createProcess({
				actionType: selection.actionType,
				memberIds: selection.memberIds,
				trigger: selection.trigger,
				onStart: () => {
					this.#bulkOperationRunning = true;
					this.#freezeGrid();
				},
				onTerminal: () => this.#finishBulkAction(),
				onDialogClosed: (trigger) => {
					this.#dialogClosed = true;
					this.#focusTrigger = trigger ?? this.#focusTrigger;
					this.#bulkActionProcess = null;
					if (!this.#awaitingGridUpdate)
					{
						this.#restoreFocus();
					}
				},
			});
			this.#bulkActionProcess.show();
		}
		catch (error)
		{
			console.error(error);
			this.#notifyBulkProcessUnavailable();
			this.#focusTrigger = null;
		}
		finally
		{
			this.#bulkProcessLoading = false;
			if (!this.#bulkOperationRunning)
			{
				this.#bulkActionPanel?.setDisabled(false);
			}
		}
	}

	async #loadBulkProcessFactory(): Promise<Function>
	{
		if (this.#bulkProcessFactory === null)
		{
			const { BulkActionProcess } = await Runtime.loadExtension(BULK_PROCESS_EXTENSION);
			if (!Type.isFunction(BulkActionProcess))
			{
				throw new TypeError(`${BULK_PROCESS_EXTENSION} does not export BulkActionProcess`);
			}

			this.#bulkProcessFactory = (processOptions) => new BulkActionProcess(processOptions);
		}

		return this.#bulkProcessFactory;
	}

	#notifyBulkProcessUnavailable(): void
	{
		void Runtime.loadExtension(NOTIFICATION_EXTENSION)
			.then(({ UI }) => {
				UI.Notification.Center.notify({
					content: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_PROCESS_UNAVAILABLE'),
					autoHideDelay: NOTIFICATION_AUTO_HIDE_DELAY,
				});
			})
			.catch((error) => {
				console.error(error);
			})
		;
	}

	#finishBulkAction(): void
	{
		if (this.#reloadRequested)
		{
			return;
		}

		this.#reloadRequested = true;
		this.#bulkOperationRunning = false;
		this.#getGrid()?.getRows().unselectAll();
		if (!this.#requestGridUpdate())
		{
			this.#completeGridUpdate();
		}
	}

	#requestGridUpdate(): boolean
	{
		const grid = this.#getGrid();
		if (!Type.isObject(grid))
		{
			return false;
		}

		this.#awaitingGridUpdate = true;
		this.#startGridUpdateTimeout();
		grid.reload();

		return true;
	}

	#completeGridUpdate(): void
	{
		const hasPendingPullReload = this.#pullReloadPending;
		this.#awaitingGridUpdate = false;
		this.#pullReloadPending = false;
		this.#clearGridUpdateTimeout();
		this.#unfreezeGrid();
		if (this.#dialogClosed)
		{
			this.#restoreFocus();
		}

		// pull updates received while the grid was frozen are picked up by a single extra reload
		if (hasPendingPullReload)
		{
			this.#reload();
		}
	}

	// Grid::updated never arrives if the reload request fails, so the frozen grid needs a fallback release
	#startGridUpdateTimeout(): void
	{
		this.#clearGridUpdateTimeout();
		this.#gridUpdateTimeoutId = window.setTimeout(() => {
			this.#gridUpdateTimeoutId = null;
			if (this.#awaitingGridUpdate)
			{
				this.#completeGridUpdate();
			}
		}, GRID_UPDATE_TIMEOUT);
	}

	#clearGridUpdateTimeout(): void
	{
		if (this.#gridUpdateTimeoutId !== null)
		{
			window.clearTimeout(this.#gridUpdateTimeoutId);
			this.#gridUpdateTimeoutId = null;
		}
	}

	#freezeGrid(): void
	{
		const grid = this.#getGrid();
		if (!Type.isObject(grid))
		{
			return;
		}

		this.#bulkActionPanel?.setDisabled(true);
		const gridContainer = grid.getContainer();
		gridContainer.setAttribute('aria-busy', 'true');
		this.#disableGridCheckboxes(gridContainer);
		if (this.#frozenGridContainer !== gridContainer)
		{
			if (this.#frozenGridContainer !== null)
			{
				Event.unbind(this.#frozenGridContainer, 'click', this.#preventGridSelection);
				Event.unbind(this.#frozenGridContainer, 'keydown', this.#preventGridSelection);
			}

			this.#frozenGridContainer = gridContainer;
			Event.bind(gridContainer, 'click', this.#preventGridSelection);
			Event.bind(gridContainer, 'keydown', this.#preventGridSelection);
		}
		grid.tableFade();
	}

	#unfreezeGrid(): void
	{
		const grid = this.#getGrid();
		const gridContainer = grid?.getContainer() ?? this.#frozenGridContainer;
		if (gridContainer !== null)
		{
			gridContainer.setAttribute('aria-busy', 'false');
			gridContainer.querySelectorAll('[data-sign-bulk-disabled]').forEach((checkbox) => {
				const gridCheckbox = checkbox;
				gridCheckbox.disabled = gridCheckbox.dataset.signBulkDisabled === 'true';
				delete gridCheckbox.dataset.signBulkDisabled;
			});
			Event.unbind(gridContainer, 'click', this.#preventGridSelection);
			Event.unbind(gridContainer, 'keydown', this.#preventGridSelection);
		}

		grid?.tableUnfade();
		this.#bulkActionPanel?.setDisabled(false);
		this.#frozenGridContainer = null;
		this.#reloadRequested = false;
	}

	#disableGridCheckboxes(gridContainer: HTMLElement): void
	{
		gridContainer.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
			const gridCheckbox = checkbox;
			if (!gridCheckbox.hasAttribute('data-sign-bulk-disabled'))
			{
				gridCheckbox.dataset.signBulkDisabled = gridCheckbox.disabled ? 'true' : 'false';
			}
			gridCheckbox.disabled = true;
		});
	}

	#preventGridSelection = (event): void => {
		if (event.target?.closest?.('input[type="checkbox"], .main-grid-row-checkbox, .main-grid-check-all'))
		{
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	};

	#restoreFocus(): void
	{
		const trigger = this.#focusTrigger;
		const panel = document.querySelector('[data-testid="sign-my-documents-bulk-action-panel"]');
		const fallback = document.querySelector('[data-testid="sign-my-documents-bulk-action-approve"]')
			?? document.querySelector('[data-testid="sign-my-documents-bulk-action-reject"]')
			?? panel?.querySelector('button:not([disabled]), [tabindex="0"]')
		;
		const target = trigger?.isConnected ? trigger : fallback;
		if (Type.isFunction(target?.focus))
		{
			target.focus();
		}

		this.#focusTrigger = null;
	}

	#isOwnGridEvent(event): boolean
	{
		const [eventGrid] = event?.getCompatData?.() ?? [];
		const grid = this.#getGrid();

		return Type.isObject(eventGrid)
			&& (eventGrid === grid || eventGrid.getId?.() === this.#getGridId())
		;
	}

	#getGridId(): string
	{
		return this.#options.gridId ?? 'SIGN_B2E_MY_DOCUMENTS_GRID';
	}

	#getGrid(): ?BX.Main.grid
	{
		const gridId = this.#getGridId();

		return BX.Main.gridManager?.getInstanceById(gridId)
			?? BX.Main.gridManager?.getById(gridId)?.instance
			?? null
		;
	}
}
