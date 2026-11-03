import { ajax } from 'main.core';

import {
	type DealCategoryDto,
	type DealCategoryMutationFields,
} from '../../types';

type CategoryActionResponse = {
	data: {
		category: DealCategoryDto,
	},
};

export class CategoryApi
{
	async delete(id: number): Promise<void>
	{
		await ajax.runAction(
			'crm.api.dealcategory.grid.delete',
			{
				data: {
					id,
				},
			},
		);
	}

	async save(
		category: DealCategoryDto | null,
		fields: DealCategoryMutationFields,
	): Promise<DealCategoryDto>
	{
		const action = category === null ? 'add' : 'update';
		const data = category === null
			? {
				fields,
			}
			: {
				id: category.id,
				fields,
			}
		;

		const response = await ajax.runAction(
			`crm.api.dealcategory.grid.${action}`,
			{ data },
		) as CategoryActionResponse;

		return response.data.category;
	}
}

export const categoryApi = new CategoryApi();
