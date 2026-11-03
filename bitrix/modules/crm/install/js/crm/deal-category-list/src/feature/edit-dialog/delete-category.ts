import { categoryApi } from '../../infrastructure/category-api/category-api';

export class DeleteCategory
{
	static async execute(id: number): Promise<void>
	{
		await categoryApi.delete(id);
	}
}
