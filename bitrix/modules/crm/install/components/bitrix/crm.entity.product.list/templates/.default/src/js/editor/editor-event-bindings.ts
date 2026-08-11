import {Dom, Event as EventBinder, Type} from 'main.core';
import {EventEmitter} from 'main.core.events';
// @ts-ignore - pull.client type defs do not expose PULL, available at runtime
import {PULL} from 'pull.client';
import type {Editor} from './product-list-editor';

type DomBinding = {
	selector: string;
	handler: (e: any) => void;
	gate?: () => boolean;
	beforeBind?: (el: Element) => void;
};

export class EditorEventBindings
{
	private readonly editor: Editor;
	private pullReloadGrid: (() => void) | null = null;

	constructor(editor: Editor)
	{
		this.editor = editor;
	}

	public subscribeDom(): void
	{
		this.unsubscribeDom();
		const container = this.editor.getContainer();
		if (!Type.isElementNode(container))
		{
			return;
		}
		for (const binding of this.getDomBindings())
		{
			if (binding.gate && !binding.gate())
			{
				continue;
			}
			container!.querySelectorAll(binding.selector).forEach((el) => {
				binding.beforeBind?.(el);
				EventBinder.bind(el, 'click', binding.handler);
			});
		}
	}

	public unsubscribeDom(): void
	{
		const container = this.editor.getContainer();
		if (!Type.isElementNode(container))
		{
			return;
		}
		for (const binding of this.getDomBindings())
		{
			container!.querySelectorAll(binding.selector).forEach((el) => {
				EventBinder.unbind(el, 'click', binding.handler);
			});
		}
	}

	public subscribeCustom(): void
	{
		this.unsubscribeCustom();
		for (const [name, handler] of this.getCustomBindings())
		{
			EventEmitter.subscribe(name, handler);
		}
		if (PULL)
		{
			this.pullReloadGrid = PULL.subscribe({
				moduleId: 'crm',
				callback: (data: any) => {
					if (
						data.command === 'onCatalogInventoryManagementEnabled'
						|| data.command === 'onCatalogInventoryManagementDisabled'
					)
					{
						this.editor.reloadGrid(false);
					}
				}
			});
		}
	}

	public unsubscribeCustom(): void
	{
		for (const [name, handler] of this.getCustomBindings())
		{
			EventEmitter.unsubscribe(name, handler);
		}
		if (!Type.isNil(this.pullReloadGrid))
		{
			this.pullReloadGrid!();
		}
	}

	private getDomBindings(): DomBinding[]
	{
		const e = this.editor;
		return [
			{
				selector: '[data-role="product-list-select-button"]',
				handler: e.productSelectionPopupHandler,
				gate: () => !e.getSettingValue('disabledSelectProductButton', false),
			},
			{
				selector: '[data-role="product-list-add-button"]',
				handler: e.productRowAddHandler,
				gate: () => !e.getSettingValue('disabledAddRowButton', false),
				beforeBind: (button: Element) => {
					if (e.getSettingValue('isOnecInventoryManagementRestricted') === true)
					{
						Dom.addClass(button, 'ui-btn-icon-lock');
					}
				},
			},
			{
				selector: '[data-role="product-list-settings-button"]',
				handler: e.showSettingsPopupHandler,
			},
		];
	}

	private getCustomBindings(): Array<[string, Function]>
	{
		const e = this.editor;
		return [
			['CrmProductSearchDialog_SelectProduct', e.onDialogSelectProductHandler],
			['onAddViewedProductToDeal', e.onAddViewedProductToDealHandler],
			['BX.Crm.EntityEditor:onSave', e.onSaveHandler],
			['onFocusToProductList', e.onFocusToProductList],
			['onCrmEntityUpdate', e.onEntityUpdateHandler],
			['BX.Crm.EntityEditorAjax:onSubmit', e.onEditorSubmit],
			['EntityProductListController:onInnerCancel', e.onInnerCancelHandler],
			['Grid::beforeRequest', e.onBeforeGridRequestHandler],
			['Grid::updated', e.onGridUpdatedHandler],
			['Grid::rowMoved', e.onGridRowMovedHandler],
			['BX.Catalog.ProductSelector:onBeforeChange', e.onBeforeProductChangeHandler],
			['BX.Catalog.ProductSelector:onChange', e.onProductChangeHandler],
			['BX.Catalog.ProductSelector:onBeforeClear', e.onBeforeProductClearHandler],
			['BX.Catalog.ProductSelector:onClear', e.onProductClearHandler],
			['Dropdown::change', e.dropdownChangeHandler],
		];
	}
}
