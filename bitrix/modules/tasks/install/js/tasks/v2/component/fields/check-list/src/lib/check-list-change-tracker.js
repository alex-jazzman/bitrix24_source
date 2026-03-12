import { Type } from 'main.core';
import type { CheckListModel } from 'tasks.v2.model.check-list';

type Params = {
	computed?: {
		checkLists: () => CheckListModel[],
	},
};

type CheckListSnapshot = {
	id: number | string,
	title: string,
	parentId: number | string,
	sortIndex: number,
	isImportant: boolean,
	isComplete: boolean,
	accomplices: any[],
	auditors: any[],
	attachments: any[],
	childrenIds: (number | string)[],
};

export class CheckListChangeTracker
{
	#params: Params;
	#initialSnapshot: Map<number | string, CheckListSnapshot> = new Map();
	#isInitialized: boolean = false;

	constructor(params: Params)
	{
		this.#params = params;
	}

	createSnapshot(): void
	{
		this.#initialSnapshot.clear();
		const checkLists = this.#getCheckLists();

		checkLists.forEach((item: CheckListModel) => {
			const children = this.#getCheckLists()
				.filter((child: CheckListModel) => child.parentId === item.id)
				.map((child: CheckListModel) => child.id);

			this.#initialSnapshot.set(item.id, {
				id: item.id,
				title: item.title || '',
				parentId: item.parentId || 0,
				sortIndex: item.sortIndex || 0,
				isImportant: item.isImportant || false,
				isComplete: item.isComplete || false,
				accomplices: [...(item.accomplices || [])],
				auditors: [...(item.auditors || [])],
				attachments: [...(item.attachments || [])],
				childrenIds: children,
			});
		});

		this.#isInitialized = true;
	}

	hasChanges(): boolean
	{
		if (!this.#isInitialized)
		{
			return false;
		}

		const currentCheckLists = this.#getCheckLists();
		const currentIds = new Set(currentCheckLists.map((item: CheckListModel) => item.id));
		const initialIds = new Set(this.#initialSnapshot.keys());

		if (currentIds.size !== initialIds.size)
		{
			return true;
		}

		for (const id of initialIds)
		{
			if (!currentIds.has(id))
			{
				return true;
			}
		}

		for (const currentItem of currentCheckLists)
		{
			const initialItem = this.#initialSnapshot.get(currentItem.id);

			if (!initialItem)
			{
				return true;
			}

			if (this.#hasItemChanged(currentItem, initialItem))
			{
				return true;
			}
		}

		return false;
	}

	getLastUpdatedCheckListId(getRootParentByChildId: (id: number | string) => ?CheckListModel): number | string
	{
		if (!this.hasChanges())
		{
			return 0;
		}

		const changedItemId = this.#findFirstChangedItemId();
		if (!changedItemId)
		{
			return 0;
		}

		const rootParent = getRootParentByChildId(changedItemId);

		return rootParent ? rootParent.id : 0;
	}

	reset(): void
	{
		this.createSnapshot();
	}

	isInitialized(): boolean
	{
		return this.#isInitialized;
	}

	#hasItemChanged(currentItem: CheckListModel, initialItem: CheckListSnapshot): boolean
	{
		if (
			currentItem.title !== initialItem.title
			|| currentItem.parentId !== initialItem.parentId
			|| currentItem.sortIndex !== initialItem.sortIndex
			|| currentItem.isImportant !== initialItem.isImportant
			|| currentItem.isComplete !== initialItem.isComplete
		)
		{
			return true;
		}

		if (this.#arraysChanged(currentItem.accomplices || [], initialItem.accomplices))
		{
			return true;
		}

		if (this.#arraysChanged(currentItem.auditors || [], initialItem.auditors))
		{
			return true;
		}

		if (this.#arraysChanged(currentItem.attachments || [], initialItem.attachments))
		{
			return true;
		}

		const currentChildren = this.#getCheckLists()
			.filter((child: CheckListModel) => child.parentId === currentItem.id)
			.map((child: CheckListModel) => child.id);

		return this.#arraysChanged(currentChildren, initialItem.childrenIds);
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	#arraysChanged(current: any[], initial: any[]): boolean
	{
		if (current.length !== initial.length)
		{
			return true;
		}

		if (current.length > 0 && Type.isObjectLike(current[0]) && !Type.isUndefined(current[0].id))
		{
			const currentIds = new Set(current.map((item) => item.id));
			const initialIds = new Set(initial.map((item) => item.id));

			if (currentIds.size !== initialIds.size)
			{
				return true;
			}

			for (const id of currentIds)
			{
				if (!initialIds.has(id))
				{
					return true;
				}
			}
		}
		else
		{
			for (const [i, element] of current.entries())
			{
				if (element !== initial[i])
				{
					return true;
				}
			}
		}

		return false;
	}

	#findFirstChangedItemId(): ?(number | string)
	{
		const currentCheckLists = this.#getCheckLists();

		for (const currentItem of currentCheckLists)
		{
			const initialItem = this.#initialSnapshot.get(currentItem.id);
			if (!initialItem || this.#hasItemChanged(currentItem, initialItem))
			{
				return currentItem.id;
			}
		}

		return null;
	}

	#getCheckLists(): CheckListModel[]
	{
		return this.#params?.computed?.checkLists() ?? [];
	}
}
