import { ViewMode, type ViewMode as ViewModeValue } from '../../../const/view-mode';
import { isViewMode, resolveViewMode } from '../../../feature/view-mode/view-mode';

export const PreferenceOptionName = Object.freeze({
	Call: 'copilot_call_hint_call',
	Assessment: 'copilot_call_hint_assessment',
} as const);

export type PreferenceOptionName = typeof PreferenceOptionName[keyof typeof PreferenceOptionName];

type UserOptionsApi = {
	userOptions: {
		save: (
			category: string,
			optionName: string,
			field: string,
			value: string,
			common: boolean,
		) => void,
	},
};

export class Preference
{
	#optionName: PreferenceOptionName;

	constructor(optionName: PreferenceOptionName)
	{
		if (!Object.values(PreferenceOptionName).includes(optionName))
		{
			throw new TypeError('Unknown call hint preference option name');
		}

		this.#optionName = optionName;
	}

	resolve(hasHint: boolean, preferredMode: unknown): ViewModeValue
	{
		return resolveViewMode(hasHint, preferredMode);
	}

	save(mode: ViewModeValue): void
	{
		if (!isViewMode(mode))
		{
			return;
		}

		const { userOptions } = window.BX as unknown as UserOptionsApi;
		userOptions.save('crm', this.#optionName, 'mode', mode, false);
	}
}
