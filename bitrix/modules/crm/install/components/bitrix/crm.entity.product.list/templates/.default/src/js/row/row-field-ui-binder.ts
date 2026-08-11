import {Dom, Reflection, Type} from 'main.core';
import {DiscountType} from 'catalog.product-calculator';
import {CurrencyCore} from 'currency.currency-core';
import type {Row} from './product-list-row';

declare const BX: any;

const CURRENCY_DROPDOWN_FIELDS = ['PRICE_CURRENCY', 'SUM_CURRENCY', 'DISCOUNT_TYPE_ID', 'DISCOUNT_ROW_CURRENCY'];

export class RowFieldUiBinder
{
	private readonly row: Row;

	constructor(row: Row)
	{
		this.row = row;
	}

	public getInputByFieldName(fieldName: string): HTMLElement | null
	{
		const fieldId = this.row.getUiFieldId(fieldName);
		let item: HTMLElement | null = document.getElementById(fieldId);

		if (!Type.isElementNode(item))
		{
			item = this.row.getNode()!.querySelector('[name="' + fieldId + '"]') as HTMLElement | null;
		}

		return item;
	}

	public updateInput(name: string, value: any): void
	{
		const item = this.getInputByFieldName(name) as HTMLInputElement | null;

		if (Type.isElementNode(item))
		{
			item!.value = value;
		}
	}

	public updateCheckbox(name: string, value: any): void
	{
		const item = this.getInputByFieldName(name) as HTMLInputElement | null;

		if (Type.isElementNode(item))
		{
			item!.checked = value === 'Y';
		}
	}

	public updateDiscountType(name: string, value: number): void
	{
		const text =
			value === DiscountType.MONETARY
				? this.row.getEditor().currencyManager.getText()
				: '%'
		;

		this.updateMoney(name, value, text);
	}

	public getDropdownApi(name: string): any
	{
		if (!Reflection.getClass('BX.Main.dropdownManager'))
		{
			return null;
		}

		return BX.Main.dropdownManager.getById(this.row.getId() + '_' + name + '_control');
	}

	public updateMoneyWithDropdownApi(dropdown: any, value: number | string): void
	{
		if (dropdown.getValue() === value)
		{
			return;
		}

		const item = dropdown.menu.itemsContainer.querySelector('[data-value="' + value + '"]');
		const menuItem = item && dropdown.getMenuItem(item);
		if (menuItem)
		{
			dropdown.refresh(menuItem);
			dropdown.selectItem(menuItem);
		}
	}

	public updateMoneyManually(name: string, value: number | string, text: string): void
	{
		const item = this.getInputByFieldName(name);
		if (!Type.isElementNode(item))
		{
			return;
		}

		(item as HTMLElement).dataset.value = String(value);

		const span = (item as HTMLElement).querySelector('span.main-dropdown-inner');
		if (!Type.isElementNode(span))
		{
			return;
		}

		(span as HTMLElement).innerHTML = text;
	}

	public updateMoney(name: string, value: number | string, text: string): void
	{
		const dropdownApi = this.getDropdownApi(name);
		if (dropdownApi)
		{
			this.updateMoneyWithDropdownApi(dropdownApi, value);
		}
		else
		{
			this.updateMoneyManually(name, value, text);
		}
	}

	public updateMeasure(code: string, name: string): void
	{
		this.updateMoney('MEASURE_CODE', code, name);
		this.row.updateUiStoreAmountData();
	}

	public updateHtml(name: string, html: string): void
	{
		const item = this.row.getNode()!.querySelector('[data-name="' + name + '"]');

		if (Type.isElementNode(item))
		{
			(item as HTMLElement).innerHTML = html;
		}
	}

	public updateCurrencyFields(): void
	{
		const editor = this.row.getEditor();
		const currencyText = editor.currencyManager.getText();
		const currencyId = '' + editor.getCurrencyId();

		CURRENCY_DROPDOWN_FIELDS.forEach((name) => {
			const dropdownValues: Array<{NAME: string, VALUE: string}> = [];
			if (name === 'DISCOUNT_TYPE_ID')
			{
				dropdownValues.push({
					NAME: '%',
					VALUE: '' + DiscountType.PERCENTAGE,
				});
				dropdownValues.push({
					NAME: currencyText,
					VALUE: '' + DiscountType.MONETARY,
				});
				if (this.row.getDiscountType() === DiscountType.MONETARY)
				{
					this.updateMoneyManually(name, DiscountType.MONETARY, currencyText);
				}
			}
			else
			{
				dropdownValues.push({
					NAME: currencyText,
					VALUE: currencyId,
				});
				this.updateMoney(name, currencyId, currencyText);
			}

			Dom.attr(this.getInputByFieldName(name), 'data-items', dropdownValues);
		});

		this.updateField('TAX_SUM', this.row.getField('TAX_SUM'));
	}

	public updateField(field: string, value: any): void
	{
		const uiName = this.getUiName(field);
		if (!uiName)
		{
			return;
		}

		const uiType = this.getUiType(uiName);
		if (!uiType)
		{
			return;
		}

		if (!this.allowUpdate(field))
		{
			return;
		}

		const row = this.row;

		switch (uiType)
		{
			case 'input':
				if (field === 'QUANTITY')
				{
					value = row.parseFloat(value, row.getQuantityPrecision());
				}
				else if (field === 'DISCOUNT_RATE')
				{
					value = row.parseFloat(value, row.getCommonPrecision());
				}
				else if (field === 'TAX_RATE')
				{
					value =
						Type.isNil(value) || value === ''
							? ''
							: row.parseFloat(value, row.getCommonPrecision())
					;
				}
				else if (value === 0)
				{
					value = '';
				}
				else if (Type.isNumber(value))
				{
					value = row
						.parseFloat(value, row.getPricePrecision())
						.toFixed(row.getPricePrecision())
					;
				}

				this.updateInput(uiName, value);
				break;

			case 'checkbox':
				this.updateCheckbox(uiName, value);
				break;

			case 'discount_type_field':
				this.updateDiscountType(uiName, value);
				break;

			case 'html':
				this.updateHtml(uiName, value);
				break;

			case 'money_html':
				value = CurrencyCore.currencyFormat(value, row.getEditor().getCurrencyId(), true);
				this.updateHtml(uiName, value);
				break;
		}
	}

	public getUiName(field: string): string
	{
		let result: any = null;

		switch (field)
		{
			case 'QUANTITY':
			case 'MEASURE_CODE':
			case 'DISCOUNT_ROW':
			case 'DISCOUNT_TYPE_ID':
			case 'TAX_RATE':
			case 'TAX_INCLUDED':
			case 'TAX_SUM':
			case 'SUM':
			case 'PRODUCT_NAME':
			case 'SORT':
				result = field;
				break;

			case 'BASE_PRICE':
				result = 'PRICE';
				break;

			case 'DISCOUNT_RATE':
			case 'DISCOUNT_SUM':
				result = 'DISCOUNT_PRICE';
				break;
		}

		return result;
	}

	public getUiType(field: string): string
	{
		let result: any = null;

		switch (field)
		{
			case 'PRICE':
			case 'QUANTITY':
			case 'TAX_RATE':
			case 'DISCOUNT_PRICE':
			case 'DISCOUNT_RATE':
			case 'DISCOUNT_SUM':
			case 'DISCOUNT_ROW':
			case 'SUM':
			case 'PRODUCT_NAME':
			case 'SORT':
				result = 'input';
				break;

			case 'DISCOUNT_TYPE_ID':
				result = 'discount_type_field';
				break;

			case 'TAX_INCLUDED':
				result = 'checkbox';
				break;

			case 'TAX_SUM':
				result = 'money_html';
				break;
		}

		return result;
	}

	public allowUpdate(field: string): boolean
	{
		let result = true;

		switch (field)
		{
			case 'PRICE_NETTO':
				result = this.row.isPriceNetto();
				break;

			case 'PRICE_BRUTTO':
				result = !this.row.isPriceNetto();
				break;

			case 'DISCOUNT_RATE':
				result = this.row.isDiscountPercentage();
				break;

			case 'DISCOUNT_SUM':
				result = this.row.isDiscountMonetary();
				break;
		}

		return result;
	}

	public refreshLayout(exceptFields: string[] = []): void
	{
		const fields = this.row.fields;
		for (const field in fields)
		{
			if (fields.hasOwnProperty(field) && !exceptFields.includes(field))
			{
				this.updateField(field, fields[field]);
			}
		}
	}
}
