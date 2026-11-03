import { Runtime } from 'main.core';
import { canShowVibe, type VibeVisibility } from '../vibe-state/vibe-state';

type SolutionFields = {
	typeIds: number[],
	description?: unknown,
	[field: string]: unknown,
};

// Fields of the add/update request: a copy of the state with the description passed through the field rule. The state
// keeps what was typed, so an error leaves the field as it was. The rule is injected: the template's unit harness does
// not load crm.settings-hub, whose normalizeHubDescription the app hands in.
// The page switch travels only while its section is visible; without the visibility the section counts as hidden.
export function buildSaveFields(
	automatedSolution: SolutionFields,
	normalizeDescription: (value: unknown) => string,
	vibeVisibility: VibeVisibility | null = null,
): Record<string, unknown>
{
	const fields: Record<string, unknown> = Runtime.clone(automatedSolution);
	fields.description = normalizeDescription(automatedSolution.description);

	delete fields.vibeId;
	if (!vibeVisibility || !canShowVibe(vibeVisibility))
	{
		delete fields.isVibeEnabled;
	}

	if (automatedSolution.typeIds.length <= 0)
	{
		// we cant send an empty array in form data
		fields.typeIds = false;
	}

	return fields;
}
