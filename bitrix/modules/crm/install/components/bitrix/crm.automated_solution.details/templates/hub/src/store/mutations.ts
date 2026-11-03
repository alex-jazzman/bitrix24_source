/* eslint-disable no-param-reassign */
import { Runtime, Text } from 'main.core';
import {
	type EditableField,
	type Error,
	type RecoveryState,
	type RecoveryStatus,
	type StateShape,
	type VerifiedState,
} from './index';
import {
	isValidError,
	normalizeDynamicTypesTitles,
	normalizeErrors,
	normalizeId,
	normalizeTitle,
	normalizeTypeId,
	normalizeTypesIds,
	toDescriptionValue,
} from './validation';

export default {
	/**
	 * Sets new initial state for the store. Modification flag is reset
	 */
	setState: (state: StateShape, stateToSet: any): void => {
		state.automatedSolution.id = normalizeId(stateToSet.automatedSolution?.id);

		state.automatedSolution.title = normalizeTitle(stateToSet.automatedSolution?.title);

		state.automatedSolution.description = toDescriptionValue(stateToSet.automatedSolution?.description);

		const typeIds = normalizeTypesIds(stateToSet.automatedSolution?.typeIds);
		state.automatedSolution.typeIds = [...typeIds];
		state.automatedSolutionOrigTypeIds = [...typeIds];

		state.automatedSolution.isVibeEnabled = normalizeVibeEnabled(stateToSet.automatedSolution?.isVibeEnabled);
		state.automatedSolutionOrigIsVibeEnabled = state.automatedSolution.isVibeEnabled;
		state.automatedSolution.vibeId = normalizeVibeId(stateToSet.automatedSolution?.vibeId);

		// A save answer carries the solution only: the section must not disappear until the page is reloaded.
		if (Object.hasOwn(stateToSet, 'isVibeFeatureEnabled'))
		{
			state.isVibeFeatureEnabled = Text.toBoolean(stateToSet.isVibeFeatureEnabled);
		}

		if (Object.hasOwn(stateToSet, 'isVibeAvailable'))
		{
			state.isVibeAvailable = Text.toBoolean(stateToSet.isVibeAvailable);
		}

		state.permissions.canMoveSmartProcessFromCrm = Text.toBoolean(
			stateToSet.permissions?.canMoveSmartProcessFromCrm ?? false,
		);
		state.permissions.canMoveSmartProcessFromAnotherAutomatedSolution = Text.toBoolean(
			stateToSet.permissions?.canMoveSmartProcessFromAnotherAutomatedSolution ?? false,
		);

		state.dynamicTypesTitles = normalizeDynamicTypesTitles(stateToSet.dynamicTypesTitles);

		state.errors = normalizeErrors(stateToSet.errors);

		state.isModified = false;
		state.isPermissionsLayoutV2Enabled = Text.toBoolean(
			stateToSet.isPermissionsLayoutV2Enabled ?? false,
		);
	},

	// Applies the checked server baseline and the draft in one commit; rights, type titles, flags, errors and
	// revisions are not part of it and stay as they are.
	applyVerifiedState: (state: StateShape, { baseline, draft, isModified }: VerifiedState): void => {
		const draftTypeIds = normalizeTypesIds(draft.typeIds);

		state.automatedSolution = {
			id: normalizeId(baseline.id),
			title: normalizeTitle(draft.title),
			typeIds: [...draftTypeIds],
			intranetCustomSectionId: normalizeId(baseline.intranetCustomSectionId),
			description: toDescriptionValue(draft.description),
			isVibeEnabled: normalizeVibeEnabled(draft.isVibeEnabled),
			vibeId: normalizeVibeId(baseline.vibeId),
		};
		state.automatedSolutionOrigTypeIds = [...normalizeTypesIds(baseline.typeIds)];
		state.automatedSolutionOrigIsVibeEnabled = normalizeVibeEnabled(baseline.isVibeEnabled);
		state.isModified = Boolean(isModified);
	},

	// The id of a solution the server has already created is accepted at once, so the next save updates it.
	acceptIdentity: (state: StateShape, { id, vibeId }: { id: unknown, vibeId?: unknown }): void => {
		state.automatedSolution.id = normalizeId(id);
		state.automatedSolution.vibeId = normalizeVibeId(vibeId);
	},

	setRecovery: (state: StateShape, recovery: Partial<RecoveryState>): void => {
		if (Object.hasOwn(recovery, 'status') && !RECOVERY_STATUSES.has(recovery.status as RecoveryStatus))
		{
			return;
		}

		state.recovery = {
			...state.recovery,
			...Runtime.clone(recovery),
		};
	},

	setErrors: (state: StateShape, errors: Error[]): void => {
		state.errors = normalizeErrors(errors);
	},
	removeError: (state: StateShape, error: Error): void => {
		if (!isValidError(error))
		{
			return;
		}

		state.errors = state.errors.filter((x) => x !== error);
	},

	setTitle: (state: StateShape, title: string): void => {
		const newTitle = normalizeTitle(title);

		if (newTitle !== state.automatedSolution.title)
		{
			markEdited(state, 'title');
		}

		state.automatedSolution.title = newTitle;
	},

	setDescription: (state: StateShape, description: string): void => {
		const newDescription = toDescriptionValue(description);

		if (newDescription !== state.automatedSolution.description)
		{
			markEdited(state, 'description');
		}

		state.automatedSolution.description = newDescription;
	},

	addTypeId: (state: StateShape, typeId: number): void => {
		const normalizedTypeId = normalizeTypeId(typeId);
		if (normalizedTypeId <= 0)
		{
			return;
		}

		if (state.automatedSolution.typeIds.includes(normalizedTypeId))
		{
			return;
		}

		state.automatedSolution.typeIds.push(normalizedTypeId);
		markEdited(state, 'typeIds');
	},

	removeTypeId: (state: StateShape, typeId: number): void => {
		const normalizedTypeId = normalizeTypeId(typeId);
		if (normalizedTypeId <= 0)
		{
			return;
		}

		const newTypeIds = state.automatedSolution.typeIds.filter((id) => id !== normalizedTypeId);

		if (newTypeIds.length !== state.automatedSolution.typeIds.length)
		{
			markEdited(state, 'typeIds');
		}

		state.automatedSolution.typeIds = newTypeIds;
	},

	setIsVibeEnabled: (state: StateShape, isVibeEnabled: boolean): void => {
		const newIsVibeEnabled = normalizeVibeEnabled(isVibeEnabled);

		if (newIsVibeEnabled !== state.automatedSolution.isVibeEnabled)
		{
			markEdited(state, 'isVibeEnabled');
		}

		state.automatedSolution.isVibeEnabled = newIsVibeEnabled;
	},
};

const RECOVERY_STATUSES: Set<RecoveryStatus> = new Set(['idle', 'loading', 'failed', 'ready']);

function markEdited(state: StateShape, field: EditableField): void
{
	state.isModified = true;
	state.revisions[field] += 1;
}

function normalizeVibeEnabled(isVibeEnabled: unknown): boolean
{
	return Text.toBoolean(isVibeEnabled ?? false);
}

function normalizeVibeId(vibeId: unknown): number
{
	return Math.max(Text.toInteger(vibeId ?? 0), 0);
}
