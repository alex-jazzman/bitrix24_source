import {Cache, Reflection, Text, Type} from 'main.core';
import {EventEmitter} from 'main.core.events';
import type {Editor} from './product-list-editor';

declare const BX: any;

const GRID_TEMPLATE_ROW = 'template_0';

export class EditorGridLifecycle
{
	private readonly editor: Editor;
	private readonly cache = new Cache.MemoryCache();

	constructor(editor: Editor)
	{
		this.editor = editor;
	}

	public getGrid(): any
	{
		return this.cache.remember('grid', () => {
			const gridId = this.editor.getGridId();

			if (!Reflection.getClass('BX.Main.gridManager.getInstanceById'))
			{
				throw Error(`Cannot find grid with '${gridId}' id.`);
			}

			return BX.Main.gridManager.getInstanceById(gridId);
		});
	}

	public initData(): void
	{
		const gridEditData = this.editor.getSettingValue('templateGridEditData', null);
		if (gridEditData)
		{
			this.setEditData(gridEditData);
		}
	}

	public getEditData(): Record<string, any>
	{
		return this.getGrid().arParams.EDITABLE_DATA;
	}

	public setEditData(data: Record<string, any>): void
	{
		this.getGrid().arParams.EDITABLE_DATA = data;
	}

	public setOriginalTemplateEditData(data: any): void
	{
		this.getGrid().arParams.EDITABLE_DATA[GRID_TEMPLATE_ROW] = data;
	}

	public redefineTemplateEditData(newId: string): any
	{
		const data = this.getEditData();
		const originalTemplateData = data[GRID_TEMPLATE_ROW];
		const customEditData = this.prepareCustomEditData(originalTemplateData, newId);

		this.setOriginalTemplateEditData({...originalTemplateData, ...customEditData});

		return originalTemplateData;
	}

	public prepareCustomEditData(originalEditData: Record<string, any>, newId: string): Record<string, any>
	{
		const customEditData: Record<string, any> = {};
		const templateIdMask = this.editor.getSettingValue('templateIdMask', '');

		for (let i in originalEditData)
		{
			if (originalEditData.hasOwnProperty(i))
			{
				if (Type.isStringFilled(originalEditData[i]) && originalEditData[i].indexOf(templateIdMask) >= 0)
				{
					customEditData[i] = originalEditData[i].replace(
						new RegExp(templateIdMask, 'g'),
						newId
					);
				}
				else if (Type.isPlainObject(originalEditData[i]))
				{
					customEditData[i] = this.prepareCustomEditData(originalEditData[i], newId);
				}
				else
				{
					customEditData[i] = originalEditData[i];
				}
			}
		}

		return customEditData;
	}

	public createProductRow(): any
	{
		const newId = Text.getRandom();
		const originalTemplate = this.redefineTemplateEditData(newId);

		const grid = this.getGrid();
		let newRow;
		if (this.editor.getSettingValue('newRowPosition') === 'bottom')
		{
			newRow = grid.appendRowEditor();
		}
		else
		{
			newRow = grid.prependRowEditor();
		}

		const newNode = newRow.getNode();

		if (Type.isElementNode(newNode))
		{
			newNode.setAttribute('data-id', newId);
			newRow.makeCountable();
		}

		if (originalTemplate)
		{
			this.setOriginalTemplateEditData(originalTemplate);
		}

		EventEmitter.emit('Grid::thereEditedRows', [] as any);

		grid.adjustRows();
		grid.updateCounterDisplayed();
		grid.updateCounterSelected();

		return newRow;
	}

	public reload(useProductsFromRequest: boolean = true): void
	{
		this.getGrid().reloadTable(
			'POST',
			{useProductsFromRequest},
			() => EventEmitter.emit(this.editor, 'onGridReloaded')
		);
	}
}
