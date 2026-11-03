import { Type } from 'main.core';
import { mapSolutionDto, type SolutionReadBack } from '../infrastructure/service/vibe-service';
import { reconcileSave, type ReconcileResult, type ServerSolution } from '../lib/reconcile-save/reconcile-save';
import {
	type EditRevisions,
	type SolutionBaseline,
	type SolutionDraft,
	type StateShape,
} from '../store';

// What the store looked like when the save request was sent.
export type SaveContext = {
	previousBaseline: SolutionBaseline,
	submitted: SolutionDraft,
	revisions: EditRevisions,
};

export type RecoverSolutionDeps = {
	getSolution: (id: number) => Promise<SolutionReadBack>,
	notifyUpdated: (solution: SolutionReadBack) => void,
};

type RecoveryStore = {
	state: StateShape,
	commit: (name: string, payload?: unknown) => void,
};

// The context of the read-back a retry repeats; the store state object is the key, so it lives as long as the store.
const pendingContexts: WeakMap<StateShape, SaveContext> = new WeakMap();

// After a failed save that has already created or changed the solution, the server state is read back: it becomes the
// new baseline, the draft keeps what was not saved, and only then the outside world hears about the solution.
export class RecoverSolution
{
	static captureContext(state: StateShape): SaveContext
	{
		const solution = state.automatedSolution;

		return {
			previousBaseline: {
				id: solution.id,
				// The store does not keep the saved texts: the submitted ones stand in for them.
				title: solution.title,
				description: solution.description,
				typeIds: [...state.automatedSolutionOrigTypeIds],
				isVibeEnabled: state.automatedSolutionOrigIsVibeEnabled,
				vibeId: solution.vibeId,
				intranetCustomSectionId: solution.intranetCustomSectionId,
			},
			submitted: readDraft(state),
			revisions: { ...state.revisions },
		};
	}

	// Until the created solution is read back another save could add it the second time.
	static isPending(state: StateShape): boolean
	{
		return ['loading', 'failed'].includes(state.recovery.status);
	}

	// Returns null for an error answer without the solution: nothing was saved and there is nothing to recover. An
	// ordinary update error also carries the stored solution, but it leaves the form as it was.
	static startFromSaveError(
		store: RecoveryStore,
		response: any,
		context: SaveContext,
		deps: RecoverSolutionDeps,
	): Promise<void> | null
	{
		const answer = mapSolutionDto(response?.data?.automatedSolution);
		if (!answer || !isPartialSave(response, context))
		{
			return null;
		}

		store.commit('acceptIdentity', {
			id: answer.id,
			vibeId: answer.vibeId ?? store.state.automatedSolution.vibeId,
		});

		const identified: SaveContext = {
			...context,
			previousBaseline: { ...context.previousBaseline, id: answer.id },
		};

		// The error answer carries the actual page state, but its types may be the submitted ones, not the stored.
		const answerVibe = pickPresent(answer, ['id', 'vibeId', 'isVibeEnabled']);
		const verified = reconcile(store.state, identified, answerVibe);
		if (verified.draft.isVibeEnabled !== store.state.automatedSolution.isVibeEnabled)
		{
			identified.submitted = { ...identified.submitted, isVibeEnabled: verified.draft.isVibeEnabled };
			identified.revisions = { ...identified.revisions, isVibeEnabled: store.state.revisions.isVibeEnabled };
		}

		store.commit('applyVerifiedState', verified);

		pendingContexts.set(store.state, identified);

		return readBack(store, identified, deps);
	}

	static retry(store: RecoveryStore, deps: RecoverSolutionDeps): Promise<void>
	{
		const context = pendingContexts.get(store.state);
		if (store.state.recovery.status !== 'failed' || !context)
		{
			return Promise.resolve();
		}

		return readBack(store, context, deps);
	}
}

// A failed add with the solution has created it. A failed update is partial only after the Vibe lifecycle: its answer
// has a VIBE_* code or the lifecycle DTO, which unlike the get answer carries no intranetCustomSectionId.
function isPartialSave(response: any, context: SaveContext): boolean
{
	if (context.previousBaseline.id === null)
	{
		return true;
	}

	const errors = Array.isArray(response?.errors) ? response.errors : [];
	if (errors.some((error: any) => Type.isStringFilled(error?.code) && error.code.startsWith('VIBE_')))
	{
		return true;
	}

	return !Object.hasOwn(response.data.automatedSolution, 'intranetCustomSectionId');
}

function readBack(store: RecoveryStore, context: SaveContext, deps: RecoverSolutionDeps): Promise<void>
{
	const solutionId = context.previousBaseline.id as number;
	const token = store.state.recovery.token + 1;

	store.commit('setRecovery', {
		token,
		solutionId,
		status: 'loading',
		baseline: context.previousBaseline,
		draft: context.submitted,
	});

	const isCurrent = (): boolean => {
		return store.state.recovery.token === token && store.state.automatedSolution.id === solutionId;
	};

	return deps.getSolution(solutionId).then(
		(server: SolutionReadBack) => {
			if (!isCurrent())
			{
				return;
			}

			if (server?.id !== solutionId)
			{
				store.commit('setRecovery', { status: 'failed' });

				return;
			}

			const verified = reconcile(store.state, context, server);
			store.commit('applyVerifiedState', verified);
			store.commit('setRecovery', { status: 'ready', baseline: verified.baseline, draft: verified.draft });
			pendingContexts.delete(store.state);

			deps.notifyUpdated(server);
		},
		() => {
			if (isCurrent())
			{
				store.commit('setRecovery', { status: 'failed' });
			}
		},
	);
}

function reconcile(state: StateShape, context: SaveContext, server: ServerSolution): ReconcileResult
{
	return reconcileSave({
		previousBaseline: context.previousBaseline,
		submitted: context.submitted,
		current: readDraft(state),
		server,
		revisions: {
			submitted: context.revisions,
			current: { ...state.revisions },
		},
	});
}

function readDraft(state: StateShape): SolutionDraft
{
	const solution = state.automatedSolution;

	return {
		title: solution.title,
		description: solution.description,
		typeIds: [...solution.typeIds],
		isVibeEnabled: solution.isVibeEnabled,
	};
}

function pickPresent(solution: SolutionReadBack, keys: Array<keyof SolutionBaseline>): ServerSolution
{
	const picked: Record<string, unknown> = {};
	for (const key of keys)
	{
		if (Object.hasOwn(solution, key))
		{
			picked[key] = solution[key];
		}
	}

	return picked as ServerSolution;
}
