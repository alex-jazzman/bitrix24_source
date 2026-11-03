import { Dom, Event, Loc, Tag } from 'main.core';
import { DefaultFooter, Dialog } from 'ui.entity-selector';

export class Footer extends DefaultFooter
{
	constructor(dialog: Dialog, options: { [option: string]: any })
	{
		super(dialog, options);

		this.selectAllButton = Tag.render`<div
			class="ui-selector-footer-link"
			data-testid="ui-accessrights-selector-footer-select-all"
		>${
			Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ALL_SELECT_LABEL')
		}</div>`;
		Dom.style(this.selectAllButton, 'display', 'none');
		Event.bind(this.selectAllButton, 'click', this.#selectAll.bind(this));

		this.deselectAllButton = Tag.render`<div
			class="ui-selector-footer-link"
			data-testid="ui-accessrights-selector-footer-deselect-all"
		>${
			Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ALL_DESELECT_LABEL')
		}</div>`;
		Dom.style(this.deselectAllButton, 'display', 'none');
		Event.bind(this.deselectAllButton, 'click', this.#deselectAll.bind(this));

		this.getDialog().subscribe('Item:onSelect', this.updateSelectButtons.bind(this));
		this.getDialog().subscribe('Item:onDeselect', this.updateSelectButtons.bind(this));
		// items of a server-fed dialog arrive after the footer is rendered and are selected silently
		this.getDialog().subscribe('onLoad', this.updateSelectButtons.bind(this));
	}

	getContent(): HTMLElement | HTMLElement[] | string | null
	{
		this.updateSelectButtons();

		return [this.selectAllButton, this.deselectAllButton];
	}

	// public because items put straight into the dialog raise no event: their owner asks for the recount
	updateSelectButtons(): void
	{
		if (this.getOption('hasVariablesSource') === true)
		{
			// 'select all' would only cover the loaded page of a partially fetched source
			Dom.style(this.selectAllButton, 'display', 'none');
			Dom.style(this.deselectAllButton, 'display', this.getDialog().getSelectedItems().length > 0 ? '' : 'none');

			return;
		}

		if (this.getDialog().getSelectedItems().length === this.getDialog().getItems().length)
		{
			Dom.style(this.selectAllButton, 'display', 'none');
			Dom.style(this.deselectAllButton, 'display', '');
		}
		else
		{
			Dom.style(this.selectAllButton, 'display', '');
			Dom.style(this.deselectAllButton, 'display', 'none');
		}
	}

	#selectAll(): void
	{
		this
			.getDialog()
			.getItems()
			.forEach((item: Item) => {
				item.select();
			})
		;
	}

	#deselectAll(): void
	{
		this
			.getDialog()
			.getSelectedItems()
			.forEach((item: Item) => {
				item.deselect();
			})
		;
	}
}
