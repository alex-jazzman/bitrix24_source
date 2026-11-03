import { Runtime } from 'main.core';

import { checkListSnapshotService } from '../../infrastructure/service/check-list-snapshot-service/check-list-snapshot-service';
import { buildCompletionSnapshot } from '../../lib/snapshot-builder/snapshot-builder';
import { CompletionStates } from '../../const';
import {
	type CheckListCompletionSnapshot,
	type CompletionActions,
	type CompletionPromptOptions,
	type CompletionResult,
	type CompletionState,
	type PromptDialogOptions,
} from '../../types';

type PromptDialog = {
	show: () => void,
	close: () => void,
	setLoading: (loading: boolean) => void,
	setError: () => void,
};

type DialogFactory = (options: PromptDialogOptions) => PromptDialog | Promise<PromptDialog>;

type PromptDialogExtension = {
	CheckListCompletionPromptDialog: new(options: PromptDialogOptions) => PromptDialog,
};

export class CheckListCompletionPromptRunner
{
	#createDialog: DialogFactory;

	constructor(createDialog: DialogFactory = loadPromptDialog)
	{
		this.#createDialog = createDialog;
	}

	async runForTask(
		taskId: number,
		actions: CompletionActions,
		options: CompletionPromptOptions = {},
	): Promise<CompletionResult>
	{
		try
		{
			const items = await checkListSnapshotService.getItems(taskId);

			return this.run(buildCompletionSnapshot(items), actions, options);
		}
		catch (error)
		{
			console.error('CheckListCompletionPromptRunner: runForTask error', error);

			return makeResult(CompletionStates.Failed, error, null);
		}
	}

	run(
		snapshot: CheckListCompletionSnapshot,
		actions: CompletionActions,
		options: CompletionPromptOptions = {},
	): Promise<CompletionResult>
	{
		if (snapshot.groups.length === 0)
		{
			return runAction(actions.complete, snapshot, options.beforeComplete);
		}

		return this.#runWithDialog(snapshot, actions, options);
	}

	async #runWithDialog(
		snapshot: CheckListCompletionSnapshot,
		actions: CompletionActions,
		options: CompletionPromptOptions,
	): Promise<CompletionResult>
	{
		let dialog: PromptDialog | null = null;

		return new Promise<CompletionResult>((resolve) => {
			let actionRunning = false;
			let dialogClosed = false;
			let settled = false;
			const dialogOptions: PromptDialogOptions = {
				snapshot,
				presentation: options.presentation,
				onComplete: async () => {
					if (actionRunning || settled || dialog === null)
					{
						return;
					}

					actionRunning = true;
					dialog.setLoading(true);
					const completionResult = await runAction(
						actions.completeWithChecklist,
						snapshot,
						options.beforeComplete,
					);
					if (completionResult.state === CompletionStates.Success)
					{
						settled = true;
						dialog.close();
						resolve(completionResult);

						return;
					}

					if (dialogClosed)
					{
						settled = true;
						resolve(completionResult);

						return;
					}

					if (completionResult.state === CompletionStates.Cancelled)
					{
						actionRunning = false;
						dialog.setLoading(false);

						return;
					}

					actionRunning = false;
					dialog.setError();
				},
				onReturn: () => {
					if (!settled)
					{
						settled = true;
						resolve(makeResult(CompletionStates.Returned, null, snapshot));
					}
				},
				onCancel: () => {
					if (!settled)
					{
						settled = true;
						resolve(makeResult(CompletionStates.Cancelled, null, snapshot));
					}
				},
				onClosed: () => {
					dialogClosed = true;
				},
			};

			try
			{
				const createdDialog = this.#createDialog(dialogOptions);
				if (isPromiseLike(createdDialog))
				{
					void createdDialog.then(
						(loadedDialog) => {
							try
							{
								dialog = loadedDialog;
								dialog.show();
							}
							catch (error)
							{
								resolve(makeLoadErrorResult(error, snapshot));
							}
						},
						(error) => resolve(makeLoadErrorResult(error, snapshot)),
					);

					return;
				}

				dialog = createdDialog;
			}
			catch (error)
			{
				resolve(makeLoadErrorResult(error, snapshot));

				return;
			}

			dialog.show();
		});
	}
}

async function loadPromptDialog(options: PromptDialogOptions): Promise<PromptDialog>
{
	const extension = await Runtime.loadExtension(
		'tasks.v2.lib.check-list-completion-prompt-dialog',
	) as unknown as PromptDialogExtension;

	return new extension.CheckListCompletionPromptDialog(options);
}

function isPromiseLike(dialog: PromptDialog | Promise<PromptDialog>): dialog is Promise<PromptDialog>
{
	return 'then' in dialog;
}

function makeLoadErrorResult(
	error: unknown,
	snapshot: CheckListCompletionSnapshot,
): CompletionResult
{
	console.error('CheckListCompletionPromptRunner: dialog loading error', error);

	return makeResult(CompletionStates.Failed, error, snapshot);
}

async function runAction(
	action: () => Promise<unknown | null>,
	snapshot: CheckListCompletionSnapshot,
	beforeComplete?: () => Promise<boolean>,
): Promise<CompletionResult>
{
	try
	{
		if (beforeComplete && !(await beforeComplete()))
		{
			return makeResult(CompletionStates.Cancelled, null, snapshot);
		}

		const error = await action();

		return makeResult(error ? CompletionStates.Failed : CompletionStates.Success, error, snapshot);
	}
	catch (error)
	{
		console.error('CheckListCompletionPromptRunner: runAction error', error);

		return makeResult(CompletionStates.Failed, error, snapshot);
	}
}

function makeResult(
	state: CompletionState,
	error: unknown | null,
	snapshot: CheckListCompletionSnapshot | null,
): CompletionResult
{
	return Object.freeze({ state, error, snapshot });
}

export const checkListCompletionPromptRunner = new CheckListCompletionPromptRunner();
