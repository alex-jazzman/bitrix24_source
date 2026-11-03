import { ajax as Ajax, Text, Type } from 'main.core';
import { type SolutionBaseline } from '../../store';

// A solution as the server has stored it. Only the keys the answer carries are present: an absent key is unknown.
export type SolutionReadBack = Partial<SolutionBaseline> & { id: number };

export class VibeService
{
	// Resolves only with the solution that was asked for; any other answer is a failed read-back.
	static getSolution(id: number): Promise<SolutionReadBack>
	{
		return new Promise((resolve, reject) => {
			Ajax.runAction('crm.automatedsolution.get', { data: { id } })
				.then((response: any) => {
					const solution = mapSolutionDto(response?.data?.automatedSolution);
					if (solution?.id === id)
					{
						resolve(solution);

						return;
					}

					reject(new Error(`The read-back has no automated solution ${id}`));
				})
				.catch(reject);
		});
	}

	// Resolves with the markup of the page settings, empty when the server has nothing to show.
	static getSettings(id: number): Promise<string>
	{
		return new Promise((resolve, reject) => {
			Ajax.runAction('crm.automatedsolution.getVibeSettings', { data: { automatedSolutionId: id } })
				.then((response: any) => {
					if (response?.status !== 'success')
					{
						reject(response);

						return;
					}

					const html = response.data?.html;
					resolve(Type.isStringFilled(html) ? html : '');
				})
				.catch(reject);
		});
	}
}

// Server keys of the solution with their mapping; a key missing in the answer is left out, not defaulted.
const FIELD_MAPPERS: Record<string, (value: unknown) => unknown> = {
	title: (value) => (Type.isNil(value) ? null : String(value)),
	description: (value) => (Type.isNil(value) ? '' : String(value)),
	typeIds: (value) => {
		const typeIds = Array.isArray(value) ? value : [];

		return typeIds.map((typeId: unknown) => Text.toInteger(typeId)).filter((typeId) => typeId > 0);
	},
	isVibeEnabled: (value) => Text.toBoolean(value),
	vibeId: (value) => Math.max(Text.toInteger(value), 0),
	intranetCustomSectionId: (value) => {
		const sectionId = Text.toInteger(value);

		return sectionId > 0 ? sectionId : null;
	},
};

export function mapSolutionDto(dto: unknown): SolutionReadBack | null
{
	if (!Type.isPlainObject(dto))
	{
		return null;
	}

	const source = dto as Record<string, unknown>;
	const id = Text.toInteger(source.id);
	if (id <= 0)
	{
		return null;
	}

	const solution: Record<string, unknown> = { id };
	for (const [key, mapValue] of Object.entries(FIELD_MAPPERS))
	{
		if (Object.hasOwn(source, key))
		{
			solution[key] = mapValue(source[key]);
		}
	}

	return solution as SolutionReadBack;
}
