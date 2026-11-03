/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, tasks_v2_lib_apiClient) {
	'use strict';

	const CheckListGetAction = 'CheckList.get';
	class CheckListSnapshotService {
		async getItems(taskId) {
			const response = await tasks_v2_lib_apiClient.apiClient.post(CheckListGetAction, {
				taskId
			});
			return Array.isArray(response) ? response : response?.checklist ?? [];
		}
	}
	const checkListSnapshotService = new CheckListSnapshotService();

	function buildCompletionSnapshot(source) {
		const items = (source ?? []).filter(Boolean);
		const byId = new Map(items.map(item => [Number(item.id), item]));
		const children = new Map();
		items.forEach(item => {
			const parentId = Number(item.parentId ?? 0);
			let siblings = children.get(parentId);
			if (!siblings) {
				siblings = [];
				children.set(parentId, siblings);
			}
			siblings.push(item);
		});
		children.forEach(siblings => siblings.sort(compareItems));
		const groups = [];
		const incompleteIds = [];
		(children.get(0) ?? []).forEach(root => {
			const descendants = [];
			walk(root, children, 0, descendants, new Set([Number(root.id)]));
			const incomplete = descendants.filter(({
				item
			}) => item.isComplete !== true);
			if (incomplete.length === 0) {
				return;
			}
			const included = new Set(incomplete.map(({
				item
			}) => Number(item.id)));
			incomplete.forEach(({
				item
			}) => {
				let parentId = Number(item.parentId ?? 0);
				const visitedParentIds = new Set();
				while (parentId !== 0 && parentId !== Number(root.id) && !included.has(parentId) && !visitedParentIds.has(parentId)) {
					visitedParentIds.add(parentId);
					included.add(parentId);
					parentId = Number(byId.get(parentId)?.parentId ?? 0);
				}
			});
			const groupItems = descendants.filter(({
				item
			}) => included.has(Number(item.id))).map(({
				item,
				depth
			}) => Object.freeze({
				id: Number(item.id),
				rootId: Number(root.id),
				title: String(item.title ?? ''),
				depth,
				isContext: item.isComplete === true
			}));
			incompleteIds.push(...incomplete.map(({
				item
			}) => Number(item.id)));
			groups.push(Object.freeze({
				id: Number(root.id),
				title: String(root.title ?? ''),
				completedCount: descendants.length - incomplete.length,
				totalCount: descendants.length,
				items: Object.freeze(groupItems)
			}));
		});
		return Object.freeze({
			groups: Object.freeze(groups),
			incompleteIds: Object.freeze(incompleteIds),
			firstIncompleteId: incompleteIds[0] ?? null
		});
	}
	function walk(parent, children, depth, result, visited) {
		(children.get(Number(parent.id)) ?? []).forEach(item => {
			const id = Number(item.id);
			if (visited.has(id)) {
				return;
			}
			visited.add(id);
			result.push({
				item,
				depth
			});
			walk(item, children, depth + 1, result, visited);
		});
	}
	function compareItems(a, b) {
		return Number(a.sortIndex ?? 0) - Number(b.sortIndex ?? 0) || Number(a.id) - Number(b.id);
	}

	const CompletionStates = Object.freeze({
		Success: 'success',
		Returned: 'returned',
		Cancelled: 'cancelled',
		Failed: 'failed'
	});

	class CheckListCompletionPromptRunner {
		#createDialog;
		constructor(createDialog = loadPromptDialog) {
			this.#createDialog = createDialog;
		}
		async runForTask(taskId, actions, options = {}) {
			try {
				const items = await checkListSnapshotService.getItems(taskId);
				return this.run(buildCompletionSnapshot(items), actions, options);
			} catch (error) {
				console.error('CheckListCompletionPromptRunner: runForTask error', error);
				return makeResult(CompletionStates.Failed, error, null);
			}
		}
		run(snapshot, actions, options = {}) {
			if (snapshot.groups.length === 0) {
				return runAction(actions.complete, snapshot, options.beforeComplete);
			}
			return this.#runWithDialog(snapshot, actions, options);
		}
		async #runWithDialog(snapshot, actions, options) {
			let dialog = null;
			return new Promise(resolve => {
				let actionRunning = false;
				let dialogClosed = false;
				let settled = false;
				const dialogOptions = {
					snapshot,
					presentation: options.presentation,
					onComplete: async () => {
						if (actionRunning || settled || dialog === null) {
							return;
						}
						actionRunning = true;
						dialog.setLoading(true);
						const completionResult = await runAction(actions.completeWithChecklist, snapshot, options.beforeComplete);
						if (completionResult.state === CompletionStates.Success) {
							settled = true;
							dialog.close();
							resolve(completionResult);
							return;
						}
						if (dialogClosed) {
							settled = true;
							resolve(completionResult);
							return;
						}
						if (completionResult.state === CompletionStates.Cancelled) {
							actionRunning = false;
							dialog.setLoading(false);
							return;
						}
						actionRunning = false;
						dialog.setError();
					},
					onReturn: () => {
						if (!settled) {
							settled = true;
							resolve(makeResult(CompletionStates.Returned, null, snapshot));
						}
					},
					onCancel: () => {
						if (!settled) {
							settled = true;
							resolve(makeResult(CompletionStates.Cancelled, null, snapshot));
						}
					},
					onClosed: () => {
						dialogClosed = true;
					}
				};
				try {
					const createdDialog = this.#createDialog(dialogOptions);
					if (isPromiseLike(createdDialog)) {
						void createdDialog.then(loadedDialog => {
							try {
								dialog = loadedDialog;
								dialog.show();
							} catch (error) {
								resolve(makeLoadErrorResult(error, snapshot));
							}
						}, error => resolve(makeLoadErrorResult(error, snapshot)));
						return;
					}
					dialog = createdDialog;
				} catch (error) {
					resolve(makeLoadErrorResult(error, snapshot));
					return;
				}
				dialog.show();
			});
		}
	}
	async function loadPromptDialog(options) {
		const extension = await main_core.Runtime.loadExtension('tasks.v2.lib.check-list-completion-prompt-dialog');
		return new extension.CheckListCompletionPromptDialog(options);
	}
	function isPromiseLike(dialog) {
		return 'then' in dialog;
	}
	function makeLoadErrorResult(error, snapshot) {
		console.error('CheckListCompletionPromptRunner: dialog loading error', error);
		return makeResult(CompletionStates.Failed, error, snapshot);
	}
	async function runAction(action, snapshot, beforeComplete) {
		try {
			if (beforeComplete && !(await beforeComplete())) {
				return makeResult(CompletionStates.Cancelled, null, snapshot);
			}
			const error = await action();
			return makeResult(error ? CompletionStates.Failed : CompletionStates.Success, error, snapshot);
		} catch (error) {
			console.error('CheckListCompletionPromptRunner: runAction error', error);
			return makeResult(CompletionStates.Failed, error, snapshot);
		}
	}
	function makeResult(state, error, snapshot) {
		return Object.freeze({
			state,
			error,
			snapshot
		});
	}
	const checkListCompletionPromptRunner = new CheckListCompletionPromptRunner();

	exports.CompletionStates = CompletionStates;
	exports.buildCompletionSnapshot = buildCompletionSnapshot;
	exports.checkListCompletionPromptRunner = checkListCompletionPromptRunner;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Tasks.V2.Lib);
//# sourceMappingURL=check-list-completion-prompt.bundle.js.map
