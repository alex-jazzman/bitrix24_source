import {Type} from 'main.core';
import type {Editor} from './product-list-editor';

const AJAX_FIELDS = [
	'ID',
	'PRODUCT_ID',
	'PRODUCT_NAME',
	'QUANTITY',
	'TAX_RATE',
	'TAX_NAME',
	'TAX_INCLUDED',
	'PRICE_EXCLUSIVE',
	'PRICE_NETTO',
	'PRICE_BRUTTO',
	'PRICE',
	'CUSTOMIZED',
	'BASE_PRICE',
	'DISCOUNT_ROW',
	'DISCOUNT_SUM',
	'DISCOUNT_TYPE_ID',
	'DISCOUNT_RATE',
	'CURRENCY',
	'STORE_ID',
	'INPUT_RESERVE_QUANTITY',
	'RESERVE_QUANTITY',
	'DATE_RESERVE_END',
	'SORT',
	'MEASURE_CODE',
	'MEASURE_NAME',
	'TYPE',
];

export class EditorProductDataSerializer
{
	private readonly editor: Editor;

	constructor(editor: Editor)
	{
		this.editor = editor;
	}

	public getAjaxFields(): string[]
	{
		return [...AJAX_FIELDS];
	}

	public compile(): void
	{
		const editor = this.editor;

		if (!editor.formManager.exists())
		{
			return;
		}

		editor.formManager.initFields();

		const field = editor.formManager.getDataField();
		const settingsField = editor.formManager.getDataSettingsField();

		editor.productCollection.cleanEmpty();

		if (Type.isElementNode(field) && Type.isElementNode(settingsField))
		{
			field!.value = this.prepareValue();

			settingsField!.value = JSON.stringify({
				ENABLE_DISCOUNT: editor.getDiscountEnabled(),
				ENABLE_TAX: editor.getTaxEnabled(),
			});
		}

		editor.addFirstRowIfEmpty();
	}

	public prepareValue(): string
	{
		const editor = this.editor;

		if (!editor.getProductCount())
		{
			return '';
		}

		const productData: Record<string, any>[] = [];

		editor.productCollection.products.forEach((item) => {
			const saveFields = item.getFields(this.getAjaxFields());

			if (!/^[0-9]+$/.test(saveFields['ID']))
			{
				saveFields['ID'] = 0;
			}

			saveFields['CUSTOMIZED'] = 'Y';

			productData.push(saveFields);
		});

		return JSON.stringify(productData);
	}
}
