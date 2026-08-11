import {Type} from 'main.core';
import {Row} from '../row/product-list-row';
import type {Editor} from './product-list-editor';

export class EditorProductCollection
{
	public products: Row[] = [];
	public productsAreInitiated: boolean = false;

	private readonly editor: Editor;

	constructor(editor: Editor)
	{
		this.editor = editor;
	}

	public init(): void
	{
		const list = this.editor.getSettingValue('items', []);

		const isReserveBlocked = this.editor.getSettingValue('isReserveBlocked', false);
		const isInventoryManagementToolEnabled = this.editor.getSettingValue('isInventoryManagementToolEnabled', false);
		const inventoryManagementMode = this.editor.getSettingValue('inventoryManagementMode', null);

		for (const item of list)
		{
			const fields = {...item.fields};
			const settings = {
				selectorId: item.selectorId,
				isReserveBlocked,
				isInventoryManagementToolEnabled,
				inventoryManagementMode,
			};
			this.products.push(new Row(item.rowId, fields, settings, this.editor));
		}

		this.numerate();

		this.productsAreInitiated = true;
	}

	public count(): number
	{
		return this.products.filter(item => !item.isEmpty()).length;
	}

	public findById(id: string): Row | undefined
	{
		const rowId = this.editor.getRowIdPrefix() + id;
		return this.findByRowId(rowId);
	}

	public findByRowId(rowId: string): Row | undefined
	{
		return this.products.find((row: Row) => row.getId() === rowId);
	}

	public numerate(): void
	{
		this.products.forEach((product, index) => {
			product.setRowNumber(index + 1);
		});
	}

	public refreshSort(): void
	{
		this.products.forEach((item, index) => item.setField('SORT', (index + 1) * 10));
	}

	public resortByIds(ids: any[]): boolean
	{
		let changed = false;

		if (Type.isArrayFilled(ids))
		{
			this.products.sort((a, b) => {
				if (ids.indexOf(a.getField('ID')) > ids.indexOf(b.getField('ID')))
				{
					return 1;
				}

				changed = true;

				return -1;
			});
		}

		return changed;
	}

	public cleanEmpty(): void
	{
		this.products
			.filter(item => item.isEmpty())
			.forEach((row) => this.editor.deleteRow(row.getField('ID'), true))
		;
	}

	public unsubscribeAll(): void
	{
		this.products.forEach((current) => {
			current.unsubscribeCustomEvents();
		});
	}

	public reset(): void
	{
		this.products = [];
		this.productsAreInitiated = false;
	}
}
