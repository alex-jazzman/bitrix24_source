import { Wizard } from './wizard/wizard';

export type ConverterParams = {
	redirectAfterSuccess: boolean,
};

export class Converter
{
	#params: ConverterParams;

	constructor(params: ConverterParams)
	{
		this.#params = params;
	}

	convertToCollab(groupId: number)
	{
		void new Wizard({ groupId, redirectAfterSuccess: this.#params.redirectAfterSuccess }).show();
	}
}
