import {Runtime, Type} from 'main.core';
import {CurrencyCore} from 'currency.currency-core';
import type {Editor} from './product-list-editor';

declare const BX: any;

const TOTAL_BLOCK_FIELDS = [
	'totalCost',
	'totalDelivery',
	'totalTax',
	'totalWithoutTax',
	'totalDiscount',
	'totalWithoutDiscount',
];

const PRODUCT_FIELDS_FOR_TOTAL = [
	'PRODUCT_ID',
	'PRODUCT_NAME',
	'QUANTITY',
	'TAX_ID',
	'DISCOUNT_TYPE_ID',
	'DISCOUNT_RATE',
	'DISCOUNT_SUM',
	'TAX_RATE',
	'TAX_NAME',
	'TAX_INCLUDED',
	'PRICE_EXCLUSIVE',
	'PRICE',
	'CUSTOMIZED',
];

export class EditorTotalsService
{
	private readonly editor: Editor;
	private readonly state = {inProgress: false};
	private readonly updateDelayed: (options?: Record<string, any>) => void;

	constructor(editor: Editor)
	{
		this.editor = editor;
		this.updateDelayed = Runtime.debounce(this.runDelayed.bind(this), 1000, this) as (options?: Record<string, any>) => void;
	}

	public getProductFieldList(): string[]
	{
		return [...PRODUCT_FIELDS_FOR_TOTAL];
	}

	public scheduleUpdate(options: Record<string, any> = {}): void
	{
		if (this.state.inProgress)
		{
			return;
		}

		this.updateDelayed(options);
	}

	public apply(data: Record<string, any>, options: Record<string, any> = {}): void
	{
		const item = BX(this.editor.getSettingValue('totalBlockContainerId', null));
		if (Type.isElementNode(item))
		{
			const currencyId = this.editor.getCurrencyId();

			for (const id of TOTAL_BLOCK_FIELDS)
			{
				const row = item.querySelector('[data-total="' + id + '"]');

				if (Type.isElementNode(row) && (id in data))
				{
					row.innerHTML = CurrencyCore.currencyFormat(data[id], currencyId, false);
				}
			}
		}

		this.sendToController(data, options);
		this.state.inProgress = false;
	}

	public updateUiCurrency(): void
	{
		const totalBlock = BX(this.editor.getSettingValue('totalBlockContainerId', null));
		if (!Type.isElementNode(totalBlock))
		{
			return;
		}

		totalBlock.querySelectorAll<HTMLElement>('.crm-product-list-payment-side-table-column').forEach((column) => {
			const valueElement = column.querySelector('.crm-product-list-result-grid-total');
			if (valueElement)
			{
				column.innerHTML = CurrencyCore.getPriceControl(valueElement, this.editor.getCurrencyId());
			}
		});
	}

	private runDelayed(options: Record<string, any> = {}): void
	{
		if (this.state.inProgress)
		{
			return;
		}

		this.state.inProgress = true;

		const products = this.editor.getProductsFields(this.getProductFieldList());
		products.forEach(item => item['CUSTOMIZED'] = 'Y');

		this.editor.ajaxClient.request('calculateTotalData', {
			options,
			products,
			currencyId: this.editor.getCurrencyId(),
		});
	}

	private sendToController(data: Record<string, any>, options: Record<string, any>): void
	{
		const controller = this.editor.controller;
		if (!controller)
		{
			return;
		}

		let needMarkAsChanged = true;
		if (
			Type.isObject(options)
			&& (options.isInternalChanging === true || options.isInternalChanging === 'true')
		)
		{
			needMarkAsChanged = false;
		}

		setTimeout(
			() => {
				controller.changeSumTotal(data, needMarkAsChanged, !this.editor.childrenHasErrors());
			},
			500
		);
	}
}
