import {
	type EditRevisions,
	type SolutionBaseline,
	type SolutionDraft,
} from '../../store';

// Solution fields the server has confirmed. A key the answer does not carry is unknown, not empty.
export type ServerSolution = Partial<SolutionBaseline>;

export type ReconcileInput = {
	previousBaseline: SolutionBaseline,
	submitted: SolutionDraft,
	current: SolutionDraft,
	server: ServerSolution,
	revisions: {
		submitted: EditRevisions,
		current: EditRevisions,
	},
};

export type ReconcileResult = {
	baseline: SolutionBaseline,
	draft: SolutionDraft,
	isModified: boolean,
};

// Draft fields the server answer may replace; the selected types always stay in the draft.
type ServerDraftField = 'title' | 'description' | 'isVibeEnabled';

// Merges a failed save with what the server has actually stored. The server values form the new baseline; the draft
// takes them only for fields not edited after the request.
export function reconcileSave(input: ReconcileInput): ReconcileResult
{
	const { previousBaseline, current, server } = input;

	const baseline: SolutionBaseline = {
		id: pickServerValue(server, previousBaseline, 'id'),
		title: pickServerValue(server, previousBaseline, 'title'),
		description: pickServerValue(server, previousBaseline, 'description'),
		typeIds: [...pickServerValue(server, previousBaseline, 'typeIds')],
		isVibeEnabled: pickServerValue(server, previousBaseline, 'isVibeEnabled'),
		vibeId: pickServerValue(server, previousBaseline, 'vibeId'),
		intranetCustomSectionId: pickServerValue(server, previousBaseline, 'intranetCustomSectionId'),
	};

	const takeServer = (field: ServerDraftField): boolean => {
		return Object.hasOwn(server, field) && !isEditedAfterSubmit(input, field);
	};

	const draft: SolutionDraft = {
		title: takeServer('title') ? baseline.title : current.title,
		description: takeServer('description') ? baseline.description : current.description,
		typeIds: [...current.typeIds],
		isVibeEnabled: takeServer('isVibeEnabled') ? baseline.isVibeEnabled : current.isVibeEnabled,
	};

	return {
		baseline,
		draft,
		isModified: !isDraftSaved(draft, baseline),
	};
}

function pickServerValue<K extends keyof SolutionBaseline>(
	server: ServerSolution,
	previousBaseline: SolutionBaseline,
	key: K,
): SolutionBaseline[K]
{
	return Object.hasOwn(server, key) ? server[key] as SolutionBaseline[K] : previousBaseline[key];
}

// An edit that came back to the submitted value is not a pending change: the server answer covers it.
function isEditedAfterSubmit({ submitted, current, revisions }: ReconcileInput, field: ServerDraftField): boolean
{
	return revisions.current[field] !== revisions.submitted[field] && current[field] !== submitted[field];
}

function isDraftSaved(draft: SolutionDraft, baseline: SolutionBaseline): boolean
{
	return (
		draft.title === baseline.title
		&& draft.description === baseline.description
		&& draft.isVibeEnabled === baseline.isVibeEnabled
		&& isSameTypeIds(draft.typeIds, baseline.typeIds)
	);
}

function isSameTypeIds(left: number[], right: number[]): boolean
{
	const rightSet = new Set(right);

	return new Set(left).size === rightSet.size && left.every((typeId) => rightSet.has(typeId));
}
