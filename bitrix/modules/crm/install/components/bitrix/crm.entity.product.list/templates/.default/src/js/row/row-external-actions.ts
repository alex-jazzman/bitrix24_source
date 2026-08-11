import type {CrmEntityProductListAction} from './product-list-row';
import type {Row} from './product-list-row';

export class RowExternalActions
{
	private readonly row: Row;
	public pending: CrmEntityProductListAction[] = [];
	public onAfterExecute: (() => void) | null = null;

	constructor(row: Row)
	{
		this.row = row;
	}

	public reset(): void
	{
		this.pending.length = 0;
	}

	public addProductChange(): void
	{
		this.pending.push({
			type: this.row.getEditor().actions.productChange,
			id: this.row.getId(),
		});
	}

	public addUpdateFieldList(field: string, value: any): void
	{
		this.pending.push({
			type: this.row.getEditor().actions.updateListField,
			field,
			value,
		});
	}

	public addUpdateTotal(): void
	{
		this.pending.push({
			type: this.row.getEditor().actions.updateTotal,
		});
	}

	public execute(): void
	{
		if (this.pending.length === 0)
		{
			return;
		}

		this.row.getEditor().executeActions(this.pending);
		this.reset();

		if (this.onAfterExecute)
		{
			const callback = this.onAfterExecute;
			this.onAfterExecute = null;
			callback.call(undefined as any);
		}
	}
}
