import type { CheckListModel } from 'tasks.v2.model.check-list';

export const CheckListWidgetMixin = {
	methods: {
		getItemLevel(checkList: CheckListModel): number
		{
			let level = 0;
			let current = checkList;

			const findParent = (parentId) => this.checkLists
				.find((item: CheckListModel) => item.id === parentId);

			while (current.parentId !== 0)
			{
				current = findParent(current.parentId);
				if (!current)
				{
					break;
				}
				level++;
			}

			return level;
		},
	},
};
