import { type SelectorEntityItem } from 'im.v2.const';

export class ChatMemberDiffManager
{
	#initialManagers: number[] = [];
	#initialMembers: SelectorEntityItem[] = [];

	setInitialManagers(initialManagers: number[])
	{
		this.#initialManagers = initialManagers;
	}

	setInitialChatMembers(initialMembers: SelectorEntityItem)
	{
		this.#initialMembers = initialMembers;
	}

	getAddedMemberEntities(modifiedEntities: SelectorEntityItem[]): SelectorEntityItem[]
	{
		const originalSet = new Set(this.#initialMembers.map((elem) => JSON.stringify(elem)));

		return modifiedEntities.filter((elem) => !originalSet.has(JSON.stringify(elem)));
	}

	getDeletedMemberEntities(modifiedEntities: SelectorEntityItem[]): SelectorEntityItem[]
	{
		const modifiedSet = new Set(modifiedEntities.map((elem) => JSON.stringify(elem)));

		return this.#initialMembers.filter((elem) => !modifiedSet.has(JSON.stringify(elem)));
	}

	getAddedManagers(modifiedArray: number[]): number[]
	{
		const originalSet = new Set(this.#initialManagers);

		return modifiedArray.filter((elem) => !originalSet.has(elem));
	}

	getDeletedManagers(modifiedArray: number[]): number[]
	{
		const modifiedSet = new Set(modifiedArray);

		return this.#initialManagers.filter((elem) => !modifiedSet.has(elem));
	}
}
