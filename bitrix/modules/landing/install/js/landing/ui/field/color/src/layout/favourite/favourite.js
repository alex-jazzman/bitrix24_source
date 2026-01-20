import { Cache, Event, Tag, Dom, Type, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Backend } from 'landing.backend';
import isHex from '../../internal/is-hex';
import './css/favourite.css';

export default class Favourite extends EventEmitter
{
	static USER_OPTION_NAME: string = 'color_field_favourite_colors';
	static MAX_ITEMS: number = 80;

	static items: string[] = [];
	static itemsLoaded: boolean = false;

	static MODE_CLASSES = {
		VIEW: 'view-mode',
		EDIT: 'edit-mode',
	};

	constructor()
	{
		super();
		this.setEventNamespace('BX.Landing.UI.Field.Color.Favourite');

		this.cache = new Cache.MemoryCache();
		this.itemsContainer = null;
		this.isEditMode = false;
		this.activeHex = null;
		this.itemElements = [];
		this.buttonChange = null;
		this.buttonSave = null;
	}

	getLayout(): HTMLDivElement
	{
		return this.getLayoutContainer();
	}

	getLayoutContainer(): HTMLDivElement
	{
		this.buttonChange = Tag.render`
			<div class="landing-ui-field-color-favourite-head-button-change">
				${Loc.getMessage('LANDING_FIELD_COLOR_FAVOURITES_BUTTON_CHANGE')}
			</div>
		`;
		this.buttonSave = Tag.render`
			<div class="landing-ui-field-color-favourite-head-button-save" hidden>
				${Loc.getMessage('LANDING_FIELD_COLOR_FAVOURITES_BUTTON_SAVE')}
			</div>
		`;

		Event.bind(this.buttonChange, 'click', () => this.onChangeButtonClick());
		Event.bind(this.buttonSave, 'click', () => this.onSaveButtonClick());

		return this.cache.remember('layout', () => {
			this.itemsContainer = Tag.render`<div class="landing-ui-field-color-favourite-colors view-mode"></div>`;
			Dom.append(this.getItemsLayout(), this.itemsContainer);

			return Tag.render`
				<div>
					<div class="landing-ui-field-color-favourite-head">
						<div class="landing-ui-field-color-favourite-head-title">
							${Loc.getMessage('LANDING_FIELD_COLOR_FAVOURITES_TITLE')}
						</div>
						<div class="landing-ui-field-color-favourite-head-buttons">
							${this.buttonChange}
							${this.buttonSave}
						</div>
					</div>
					${this.itemsContainer}
				</div>
			`;
		});
	}

	static initItems(): Promise<void>
	{
		return new Promise((resolve) => {
			if (Favourite.itemsLoaded)
			{
				resolve();
			}
			else
			{
				Backend.getInstance()
					.action('Utils::getUserOption', { name: Favourite.USER_OPTION_NAME })
					.then((result) => {
						if (result && Type.isString(result.items))
						{
							Favourite.items = [];
							result.items.split(',').forEach((item) => {
								if (isHex((item)) && Favourite.items.length < Favourite.MAX_ITEMS)
								{
									Favourite.items.push(item);
								}
							});
							Favourite.itemsLoaded = true;
						}
						resolve();
					})
					.catch(() => {
						resolve();
					});
			}
		});
	}

	getItemsLayout(activeHex: string | null = null): HTMLElement
	{
		const itemLayoutButtonAdd = Tag.render`
			<div class="landing-ui-field-color-favourite-item-container">
				<div class="landing-ui-field-color-favourite-item-add"></div>
			</div>
		`;
		Event.bind(itemLayoutButtonAdd, 'click', () => this.onAddButtonClick());

		if (activeHex)
		{
			this.setActiveHex(activeHex);
		}

		this.itemElements = [];

		const itemsContainer = Tag.render`<div class="landing-ui-field-color-favourite-items-container"></div>`;
		Dom.append(itemLayoutButtonAdd, itemsContainer);

		Favourite.items.forEach((item) => {
			if (isHex(item))
			{
				const isActive = this.activeHex === item;
				const removeButton = Tag.render`
					<div class="landing-ui-field-color-favourite-item-remove-button"${this.isEditMode ? '' : ' hidden'}></div>
				`;
				const itemLayout = Tag.render`
					<div class="landing-ui-field-color-favourite-item-container ${isActive ? ' active' : ''}">
						<div 
							class="landing-ui-field-color-favourite-item"
							style="background:${item}"
							data-value="${item}"
						></div>
						${removeButton}
					</div>
				`;
				this.itemElements.push(itemLayout);

				const colorItem = itemLayout.querySelector('.landing-ui-field-color-favourite-item');
				if (colorItem)
				{
					Event.bind(colorItem, 'click', (event) => this.onItemClick(event, itemLayout));
				}

				if (removeButton)
				{
					Event.bind(removeButton, 'click', (event) => this.onRemoveButtonClick(event, item, itemLayout));
				}

				Dom.append(itemLayout, itemsContainer);
			}
		});

		return itemsContainer;
	}

	buildItemsLayout(activeHex: string | null = null)
	{
		if (activeHex)
		{
			this.setActiveHex(activeHex);
		}

		if (this.itemsContainer)
		{
			Dom.clean(this.itemsContainer);
			Dom.append(this.getItemsLayout(), this.itemsContainer);
		}
	}

	onItemClick(event: MouseEvent, clickedElement: HTMLElement)
	{
		this.itemElements.forEach((el) => BX.Dom.removeClass(el, 'active'));
		BX.Dom.addClass(clickedElement, 'active');
		this.setActiveHex(clickedElement.dataset.value);

		this.emit('onSelectColor', { hex: event.currentTarget.dataset.value });
	}

	onAddButtonClick(): void
	{
		if (this.activeHex !== null)
		{
			this.addItem(this.activeHex);
		}

		this.emit('onAddColor', { hex: this.activeHex });
	}

	onRemoveButtonClick(event, hex): void
	{
		event.stopPropagation();
		this.removeItem(hex);

		this.emit('onRemoveColor', { hex });
	}

	onChangeButtonClick(): void
	{
		this.emit('onEditColors');

		this.isEditMode = true;

		BX.Dom.removeClass(this.itemsContainer, Favourite.MODE_CLASSES.VIEW);
		BX.Dom.addClass(this.itemsContainer, Favourite.MODE_CLASSES.EDIT);

		if (this.buttonChange && this.buttonSave)
		{
			this.buttonChange.setAttribute('hidden', 'true');
			this.buttonSave.removeAttribute('hidden');
		}

		const removeButtons = this.itemsContainer
			? this.itemsContainer.querySelectorAll('.landing-ui-field-color-favourite-item-remove-button')
			: [];
		removeButtons.forEach((btn) => btn.removeAttribute('hidden'));
	}

	onSaveButtonClick(): void
	{
		this.emit('onSaveColors');

		this.isEditMode = false;

		BX.Dom.addClass(this.itemsContainer, Favourite.MODE_CLASSES.VIEW);
		BX.Dom.removeClass(this.itemsContainer, Favourite.MODE_CLASSES.EDIT);

		if (this.buttonChange && this.buttonSave)
		{
			this.buttonSave.setAttribute('hidden', 'true');
			this.buttonChange.removeAttribute('hidden');
		}

		const removeButtons = this.itemsContainer
			? this.itemsContainer.querySelectorAll('.landing-ui-field-color-favourite-item-remove-button')
			: [];
		removeButtons.forEach((btn) => btn.setAttribute('hidden', ''));
	}

	addItem(hex: string): Favourite
	{
		if (isHex(hex))
		{
			const pos = Favourite.items.indexOf(hex);
			if (pos !== -1)
			{
				Favourite.items.splice(pos, 1);
			}
			Favourite.items.unshift(hex);
			if (Favourite.items.length > Favourite.MAX_ITEMS)
			{
				Favourite.items.splice(Favourite.MAX_ITEMS);
			}

			this.buildItemsLayout(hex);
			this.saveItems();
		}

		return this;
	}

	removeItem(hex: string): Favourite
	{
		if (isHex(hex))
		{
			const index = Favourite.items.indexOf(hex);
			if (index !== -1)
			{
				Favourite.items.splice(index, 1);
			}

			this.buildItemsLayout();
			this.saveItems();
		}

		return this;
	}

	saveItems(): Favourite
	{
		if (Favourite.items.length > 0)
		{
			BX.userOptions.save('landing', Favourite.USER_OPTION_NAME, 'items', Favourite.items);
		}

		return this;
	}

	setActiveHex(hex: string): void
	{
		this.activeHex = hex;
	}
}
