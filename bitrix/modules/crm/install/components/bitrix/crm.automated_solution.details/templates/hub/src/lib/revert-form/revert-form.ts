import { type SolutionBaseline } from '../../store';
import { type TypesControlSnapshot } from '../types-snapshot/types-snapshot';

export type FormSnapshot = { vuexState: any, typesControlState: any } | null;

export type RevertDeps = {
	// False while the server baseline of a failed save is being read back: there is nothing to revert to yet.
	isBaselineKnown?: () => boolean;
	// Restores the full Vuex state via the store `setState` action: it resets isModified and rebuilds
	// permissions / dynamicTypesTitles / errors, not only title / typeIds.
	applyVuexState: (vuexState: any) => void;
	// Hands the types-control its own snapshot — which rows are on screen and their titles, the one
	// piece of state the store does not own (applySnapshot).
	applyTypesControl: (typesControlState: any) => void;
};

// Cancel orchestration: restore the whole Vuex snapshot first, then the imperative
// types-control. Pure, so the ordering and the "no snapshot -> no-op" contract are unit-testable without
// a Vue/Vuex runtime.
export function revertForm(snapshot: FormSnapshot, deps: RevertDeps): void
{
	if (!snapshot || deps.isBaselineKnown?.() === false)
	{
		return;
	}

	deps.applyVuexState(snapshot.vuexState);

	if (snapshot.typesControlState)
	{
		deps.applyTypesControl(snapshot.typesControlState);
	}
}

// The revert target after a partial save: the stored solution over the context of the previous baseline (rights,
// type titles, flags). It is built from the server answer, never from the current draft.
export function commitBaseline(
	previous: FormSnapshot,
	server: SolutionBaseline,
	typesBaseline: TypesControlSnapshot | null,
): FormSnapshot
{
	if (!previous)
	{
		return null;
	}

	return {
		vuexState: {
			...previous.vuexState,
			automatedSolution: {
				...previous.vuexState.automatedSolution,
				id: server.id,
				title: server.title,
				description: server.description,
				typeIds: [...server.typeIds],
				intranetCustomSectionId: server.intranetCustomSectionId,
				isVibeEnabled: server.isVibeEnabled,
				vibeId: server.vibeId,
			},
			automatedSolutionOrigTypeIds: [...server.typeIds],
			automatedSolutionOrigIsVibeEnabled: server.isVibeEnabled,
			isModified: false,
		},
		typesControlState: typesBaseline,
	};
}
