type InitialParamType = 'right-side-expand' | 'right-side-view';

export const InitialParamDict: Record<string, InitialParamType> = {
	RightSideExpand: 'right-side-expand',
	RightSideView: 'right-side-view',
};

export type RightSideViewType = 'structure' | 'map';

export const RightSideViewDict = Object.freeze({
	Structure: 'structure',
	Map: 'map',
});

const prefix = 'intranet-user-mini-profile';

export class InitialParamService
{
	// eslint-disable-next-line flowtype/require-return-type
	static getValue(type: InitialParamType): string
	{
		const key = this.#getKeyByType(type);

		return localStorage.getItem(key);
	}

	static save(type: InitialParamType, value: string): void
	{
		const key = this.#getKeyByType(type);
		if (!Object.values(InitialParamDict).includes(type))
		{
			return;
		}

		localStorage.setItem(key, value);
	}

	static #getKeyByType(type: InitialParamType): string
	{
		return prefix + type;
	}
}
