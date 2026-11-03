import { Loc, Runtime } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';

type Params = {
	groupId?: number,
	loadExtension?: (extension: string) => Promise<Object>,
}

type MoveContext = {
	sourceColumn: Object,
	sourceNextItem: ?Object,
}

type FinishMoveContext = {
	item: Object,
	sourceColumn: Object,
	sourceNextItem: ?Object,
	targetColumn: Object,
	beforeItem: ?Object,
}

/**
 * Intercepts a drag into the FINISH column: asks for checklist completion first and
 * rolls the item back to its original place when the move or the completion fails.
 */
export class FinishMoveController
{
	constructor(params: Params = {})
	{
		this.groupId = Number(params.groupId ?? 0);
		this.loadExtension = params.loadExtension ?? ((extension) => Runtime.loadExtension(extension));
		this.moveContexts = new Map();
		this.pendingMoves = new Map();
		this.confirmedFinishMoves = new Set();
	}

	rememberMove(event: Object): void
	{
		const item = event.getItem();
		if (!item)
		{
			return;
		}

		const taskId = Number(item.getId());
		if (this.pendingMoves.has(taskId))
		{
			return;
		}

		const sourceColumn = item.getColumn();
		this.moveContexts.set(taskId, {
			sourceColumn,
			sourceNextItem: sourceColumn.getNextItemSibling(item),
		});
	}

	consumeConfirmedFinishMove(item: Object): boolean
	{
		const taskId = Number(item.getId());
		if (!this.confirmedFinishMoves.delete(taskId))
		{
			return false;
		}

		this.moveContexts.delete(taskId);

		return true;
	}

	async handleItemMoved(
		grid: Object,
		item: Object,
		moveAction: () => Promise<?Error>,
	): Promise<void>
	{
		const taskId = Number(item.getId());
		const context: ?MoveContext = this.moveContexts.get(taskId);
		this.moveContexts.delete(taskId);

		const error = await moveAction();
		if (error)
		{
			if (context)
			{
				grid.moveItem(item, context.sourceColumn, context.sourceNextItem);
			}
			await this.resyncBoard(grid);
		}
	}

	handleBeforeItemMoved(
		grid: Object,
		event: Object,
		onItemMoved: () => ?Error,
	): ?Promise<void>
	{
		const item = event.getItem();
		const targetColumn = event.getTargetColumn();
		if (!item || !targetColumn)
		{
			return null;
		}

		const sourceColumn = item.getColumn();
		const taskId = Number(item.getId());
		if (this.pendingMoves.has(taskId))
		{
			event.denyAction();

			return this.pendingMoves.get(taskId);
		}

		const isFinishMove = (
			targetColumn.getType() === 'FINISH'
			&& sourceColumn.getType() !== 'FINISH'
		);
		if (!isFinishMove)
		{
			return null;
		}

		event.denyAction();

		const context: FinishMoveContext = {
			item,
			sourceColumn,
			sourceNextItem: sourceColumn.getNextItemSibling(item),
			targetColumn,
			beforeItem: event.getTargetItem(),
		};
		const movePromise = this.handleFinishMove(grid, context, onItemMoved)
			.finally(() => {
				this.pendingMoves.delete(taskId);
				this.moveContexts.delete(taskId);
			})
		;
		this.pendingMoves.set(taskId, movePromise);

		return movePromise;
	}

	async handleFinishMove(grid: Object, context: FinishMoveContext, onItemMoved: () => ?Error): Promise<void>
	{
		const taskId = Number(context.item.getId());
		try
		{
			const { checkListCompletionPromptRunner, CompletionStates } = await this.loadExtension(
				'tasks.v2.lib.check-list-completion-prompt',
			);
			const result = await checkListCompletionPromptRunner.runForTask(taskId, {
				complete: () => this.moveItem(grid, context, onItemMoved, true),
				completeWithChecklist: () => this.moveItem(grid, context, onItemMoved, true),
			}, {
				presentation: {
					returnButtonText: Loc.getMessage('KANBAN_CHECKLIST_COMPLETE_RETURN_BUTTON'),
				},
				beforeComplete: () => this.showDod(grid, context.item),
			});
			if (result.state === CompletionStates.Returned)
			{
				const { TaskCard } = await this.loadExtension('tasks.v2.application.task-card');

				TaskCard.showFullCard({ taskId });
			}
			else if (result.state === CompletionStates.Failed)
			{
				throw result.error;
			}
		}
		catch (error)
		{
			BX.UI.Notification.Center.notify({ content: normalizeError(error).message });
		}
	}

	async showDod(grid: Object, item: Object): Promise<boolean>
	{
		const taskId = Number(item.getId());
		const itemData = item.getData() ?? {};
		const parentTaskId = Number(itemData.parentId || grid.getParentTaskId?.() || 0);
		const groupId = Number(itemData.groupId || grid.groupId || this.groupId || 0);
		const { TaskStatus } = await this.loadExtension('tasks.scrum.task-status');
		const taskStatus = new TaskStatus({
			taskId,
			parentTaskId,
			groupId,
			action: 'complete',
		});
		if (parentTaskId > 0 && await taskStatus.isParentScrumTask())
		{
			return true;
		}

		return taskStatus.showDodConfirmation(taskId);
	}

	async moveItem(
		grid: Object,
		context: FinishMoveContext,
		onItemMoved: () => ?Error,
		completeWithChecklist: boolean,
	): Promise<?Error>
	{
		const moved = grid.moveItem(context.item, context.targetColumn, context.beforeItem);
		if (!moved)
		{
			return new Error('The Scrum item was not moved');
		}

		const taskId = Number(context.item.getId());
		this.confirmedFinishMoves.add(taskId);
		let error: ?Error = null;
		try
		{
			error = await this.runExistingMove(grid, onItemMoved, completeWithChecklist);
		}
		finally
		{
			this.confirmedFinishMoves.delete(taskId);
		}

		if (error)
		{
			grid.moveItem(context.item, context.sourceColumn, context.sourceNextItem);
			await this.resyncBoard(grid);
		}

		return error;
	}

	async resyncBoard(grid: Object): Promise<void>
	{
		const promises = [];
		EventEmitter.emit('tasks:kanban:resyncRequest', {
			grid,
			groupId: this.groupId,
			allowStaleChild: true,
			promises,
		});
		await Promise.all(promises);
	}

	// Invariant: patching grid.ajax only works while the base onItemMoved
	// calls this.ajax('moveTask') synchronously inside the callback.
	async runExistingMove(
		grid: Object,
		callback: () => ?Error,
		completeWithChecklist: boolean = false,
	): Promise<?Error>
	{
		const originalAjax = grid.ajax;
		let resolveRequest: (error: ?Error) => void = () => {};
		let requestStarted = false;
		const result = new Promise((resolve) => {
			resolveRequest = resolve;
		});

		// eslint-disable-next-line no-param-reassign
		grid.ajax = function(action, data) {
			const requestData = (action === 'moveTask' && completeWithChecklist)
				? { ...data, completeWithChecklist: true }
				: data;
			const request = originalAjax.call(this, action, requestData);
			if (action === 'moveTask')
			{
				requestStarted = true;
				Promise.resolve(request).then(
					(response) => {
						const hasErrors = (response?.errors ?? []).length > 0;
						resolveRequest(hasErrors ? normalizeError(response) : null);
					},
				).catch((error) => resolveRequest(normalizeError(error)));
			}

			return request;
		};

		let callbackError = null;
		try
		{
			callbackError = callback();
		}
		catch (error)
		{
			callbackError = normalizeError(error);
		}
		finally
		{
			// eslint-disable-next-line no-param-reassign
			grid.ajax = originalAjax;
		}

		if (callbackError instanceof Error)
		{
			return callbackError;
		}

		if (!requestStarted)
		{
			return new Error('The existing Scrum move did not start');
		}

		return result;
	}
}

export function createScrumKanbanGrid(finishMoveController: FinishMoveController, options: Object): Object
{
	const ParentGrid = BX.Tasks.Kanban.Grid;
	const ScrumKanbanGrid = function(gridOptions) {
		ParentGrid.call(this, gridOptions);
		EventEmitter.subscribe(this, 'Kanban.Grid:onBeforeItemMoved', (event: BaseEvent) => {
			const [dragEvent] = event.getCompatData();
			finishMoveController.rememberMove(dragEvent);
			void finishMoveController.handleBeforeItemMoved(
				this,
				dragEvent,
				() => BX.onCustomEvent(
					this,
					'Kanban.Grid:onItemMoved',
					[
						dragEvent.getItem(),
						dragEvent.getTargetColumn(),
						dragEvent.getTargetItem(),
					],
				),
			);
		});
	};
	ScrumKanbanGrid.prototype = Object.create(ParentGrid.prototype);
	ScrumKanbanGrid.prototype.constructor = ScrumKanbanGrid;
	ScrumKanbanGrid.prototype.hasExternalMoveRollback = function() {
		return true;
	};
	ScrumKanbanGrid.prototype.onItemMoved = function(item, targetColumn, beforeItem) {
		if (finishMoveController.consumeConfirmedFinishMove(item))
		{
			ParentGrid.prototype.onItemMoved.call(this, item, targetColumn, beforeItem);

			return;
		}

		void finishMoveController.handleItemMoved(
			this,
			item,
			() => finishMoveController.runExistingMove(
				this,
				() => ParentGrid.prototype.onItemMoved.call(this, item, targetColumn, beforeItem),
			),
		);
	};

	return new ScrumKanbanGrid(options);
}

function normalizeError(error: mixed): Error
{
	if (error instanceof Error)
	{
		return error;
	}

	return new Error(error?.errors?.[0]?.message ?? String(error));
}
