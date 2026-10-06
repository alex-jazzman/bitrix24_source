/**
 * @namespace BX.UI.Uploader
 */
export const FilterType = {
	VALIDATION: 'validation',
	PREPARATION: 'preparation',
};

export type FilterType = (typeof FilterType)[keyof typeof FilterType];
