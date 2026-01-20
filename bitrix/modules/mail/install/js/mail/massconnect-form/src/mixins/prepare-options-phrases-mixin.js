import { Loc } from 'main.core';

export const PrepareOptionsPhrasesMixin = {
	methods: {
		prepareOptionPhrases(options: Array<{labelKey: string, value: string}>): Array<{label: string, value: string}>
		{
			return options.map((option) => {
				return {
					label: Loc.getMessage(option.labelKey),
					value: option.value,
				};
			});
		},
	},
};
