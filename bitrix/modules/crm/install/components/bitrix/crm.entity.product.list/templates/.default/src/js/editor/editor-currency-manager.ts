import {Text, Type} from 'main.core';
import {CurrencyCore} from 'currency.currency-core';
import * as calc from '../tool/calc-utils';
import type {Editor} from './product-list-editor';

const PRICE_FIELDS_FOR_RECALC = [
	'BASE_PRICE',
	'TAX_INCLUDED',
	'PRICE_NETTO',
	'PRICE_BRUTTO',
	'DISCOUNT_ROW',
	'DISCOUNT_SUM',
	'CURRENCY',
];

const TEMPLATE_CURRENCY_FIELDS = ['DISCOUNT_ROW', 'SUM', 'PRICE'];
const PRODUCT_CURRENCY_FIELD_NAMES = ['BASE_PRICE', 'DISCOUNT_ROW', 'DISCOUNT_SUM', 'CURRENCY_ID'];

export class EditorCurrencyManager
{
	private readonly editor: Editor;

	constructor(editor: Editor)
	{
		this.editor = editor;
	}

	public getPriceRecalcFieldNames(): string[]
	{
		return [...PRICE_FIELDS_FOR_RECALC];
	}

	public change(currencyId: string): void
	{
		this.set(currencyId);

		const products: Array<{fields: Record<string, any>, id: string}> = [];
		this.editor.productCollection.products.forEach((product) => {
			const priceFields: Record<string, any> = {};
			for (const name of PRICE_FIELDS_FOR_RECALC)
			{
				priceFields[name] = product.getField(name);
			}
			priceFields.CATALOG_PRICE = product.getField('CATALOG_PRICE');

			products.push({
				fields: priceFields,
				id: product.getId(),
			});
		});

		if (products.length > 0)
		{
			this.editor.ajaxClient.request('calculateProductPrices', {
				products,
				currencyId,
			});
		}

		this.updateGridTemplateCurrency();
	}

	public set(currencyId: string): void
	{
		this.editor.setSettingValue('currencyId', currencyId);

		const format: any = CurrencyCore.getCurrencyFormat(currencyId);
		const precision =
			(format && format.DECIMALS != null && format.DECIMALS !== '')
				? calc.parseIntValue(format.DECIMALS, 2)
				: 2
		;
		this.editor.setSettingValue('pricePrecision', precision);

		this.editor.productCollection.products.forEach(product => product.getModel()?.setOption('currency', currencyId));
	}

	public getText(): string
	{
		const currencyId = this.editor.getCurrencyId();
		if (!Type.isStringFilled(currencyId))
		{
			return '';
		}

		const format: any = CurrencyCore.getCurrencyFormat(currencyId);

		return (format && format.FORMAT_STRING.replace(/(^|[^&])#/, '$1').trim()) || currencyId;
	}

	public applyCalculatedPrices(products: Record<string, any>): void
	{
		this.editor.productCollection.products.forEach((product) => {
			const calculated: any = products[product.getId()];
			if (!Type.isPlainObject(calculated))
			{
				return;
			}

			product.updateUiCurrencyFields();
			for (const name of PRODUCT_CURRENCY_FIELD_NAMES)
			{
				product.updateField(name, Text.toNumber(calculated[name]));
			}
			product.setField('CURRENCY', calculated['CURRENCY_ID']);
			product.setField('CATALOG_PRICE', calculated['CATALOG_PRICE']);
		});

		this.editor.totalsService.updateUiCurrency();
	}

	private updateGridTemplateCurrency(): void
	{
		const editData = this.editor.gridLifecycle.getEditData();
		const templateRow = editData['template_0'];
		const currencyId = this.editor.getCurrencyId();
		templateRow['CURRENCY'] = currencyId;

		for (const field of TEMPLATE_CURRENCY_FIELDS)
		{
			templateRow[field]['CURRENCY']['VALUE'] = currencyId;
		}

		this.editor.gridLifecycle.setEditData(editData);
	}
}
