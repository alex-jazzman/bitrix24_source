import {Cache, Dom, Event as EventBinder, Loc, Runtime, Tag, Text, Type} from 'main.core';
import {Editor} from '../editor/product-list-editor';
import {DiscountType, ProductCalculator} from 'catalog.product-calculator';
import type {DiscountTypes, FieldScheme} from 'catalog.product-calculator';
import 'ui.hint';
// @ts-ignore
import 'ui.notification';
import HintPopup from '../popup/hint-popup';
import {ProductModel} from 'catalog.product-model';
import {EventEmitter} from 'main.core.events';
import {StoreSelector} from 'catalog.store-selector';
import ReserveControl from '../control/reserve-control';
import {PopupMenu} from 'main.popup';
import {ProductSelector} from 'catalog.product-selector';
import StoreAvailablePopup from '../popup/store-available-popup';
import MoneyControl from '../control/money-control';
import {SettingsHolder} from '../setting/settings-holder';
import {RowExternalActions} from './row-external-actions';
import {RowFieldUiBinder} from './row-field-ui-binder';

declare const BX: any;

export type CrmEntityProductListYesNo = 'Y' | 'N';

export type CrmEntityProductListProductChangeAction = {type: 'productChange'; id: string};
export type CrmEntityProductListDisableSaveButtonAction = {type: 'disableSaveButton'; id: string};
export type CrmEntityProductListProductListChangedAction = {type: 'productListChanged'};
export type CrmEntityProductListUpdateListFieldAction = {type: 'listField'; field: string; value: any};
export type CrmEntityProductListStateChangedAction = {type: 'stateChange'; value: boolean};
export type CrmEntityProductListUpdateTotalAction = {type: 'total'};

export type CrmEntityProductListAction =
	| CrmEntityProductListProductChangeAction
	| CrmEntityProductListDisableSaveButtonAction
	| CrmEntityProductListProductListChangedAction
	| CrmEntityProductListUpdateListFieldAction
	| CrmEntityProductListStateChangedAction
	| CrmEntityProductListUpdateTotalAction;

type CrmEntityProductListSettings = Record<string, any>;
type CrmEntityProductListTaxRate = {
	ID: number | string,
	NAME: string,
	VALUE: number | string | null,
};

export const MODE_EDIT = 'EDIT';
export const MODE_SET = 'SET';

const enableImageInputCache: Map<string, boolean> = new Map();

export class Row extends SettingsHolder
{
	public static readonly CATALOG_PRICE_CHANGING_DISABLED = 'CATALOG_PRICE_CHANGING_DISABLED';

	private id: string | null = null;
	private editor!: Editor;
	public model!: ProductModel;
	public mainSelector!: ProductSelector;
	public reserveControl: ReserveControl | null = null;
	public storeSelector!: StoreSelector;
	public storeAvailablePopup: StoreAvailablePopup | null = null;
	public fields: Record<string, any> = {};
	private readonly externalActionsQueue: RowExternalActions;
	private readonly uiBinder: RowFieldUiBinder;

	private readonly handleChangeStoreData = (): void => {
		let storeId = this.getField('STORE_ID');

		if (!this.isReserveBlocked() && this.isNewRow() && this.storeSelector)
		{
			const currentAmount = this.getModel().getStoreCollection().getStoreAmount(storeId);
			if (currentAmount <= 0 && this.getModel().isChanged())
			{
				const maxStore: any = this.getModel().getStoreCollection().getMaxFilledStore();
				if (maxStore.AMOUNT > currentAmount)
				{
					this.storeSelector.onStoreSelect(maxStore.STORE_ID, Text.decode(maxStore.STORE_TITLE));
				}
				else if (Type.isNil(storeId))
				{
					storeId = +this.storeSelector.getStoreId();
					if (storeId > 0)
					{
						this.changeStore(storeId);
					}
				}
			}
		}

		this.setField('STORE_AVAILABLE', this.model.getStoreCollection().getStoreAvailableAmount(storeId));

		this.updateUiStoreAmountData();
	};
	private readonly handleProductErrorsChange = Runtime.debounce((): void => {
		this.getEditor().handleProductErrorsChange();
	}, 500, this);
	private readonly handleMainSelectorClear = Runtime.debounce((): void => {
		this.updateField('OFFER_ID', 0);
		this.updateField('PRODUCT_NAME', '');
		this.updateUiStoreAmountData();
		this.updateField('DEDUCTED_QUANTITY', 0);
		this.updateField('ROW_RESERVED', 0);
	}, 500, this);
	private readonly handleStoreFieldChange = Runtime.debounce((event: any): void => {
		const data = event.getData();
		data.fields.forEach((item: any) => {
			this.updateField(item.NAME, item.VALUE);
		});

		this.initHandlersForSelectors();
	}, 500, this);
	private readonly handleStoreFieldClear = Runtime.debounce((): void => {
		this.initHandlersForSelectors();
	}, 500, this);

	private readonly cache = new Cache.MemoryCache<HTMLElement | null>();

	public get externalActions(): CrmEntityProductListAction[] { return this.externalActionsQueue.pending; }
	public set externalActions(value: CrmEntityProductListAction[]) { this.externalActionsQueue.pending = value; }

	public get onAfterExecuteExternalActions(): (() => void) | null { return this.externalActionsQueue.onAfterExecute; }
	public set onAfterExecuteExternalActions(value: (() => void) | null) { this.externalActionsQueue.onAfterExecute = value; }

	constructor(id: string, fields: Record<string, any>, settings: CrmEntityProductListSettings, editor: Editor)
	{
		super();
		this.externalActionsQueue = new RowExternalActions(this);
		this.uiBinder = new RowFieldUiBinder(this);
		this.setId(id);
		this.setSettings(settings);
		this.setEditor(editor);
		this.setModel(fields, settings);
		this.setFields(fields);
		this.initActions();
		this.initSelector();
		this.initStoreSelector();
		this.initStoreAvailablePopup();
		this.initReservedControl();
		this.modifyBasePriceInput();
		this.modifyQuantityInput();
		this.refreshFieldsLayout();
		this.updateUiStoreAmountData();
		this.initHandlersForSelectors();
		requestAnimationFrame(this.initHandlers.bind(this));
	}

	getNode(): HTMLElement | null
	{
		return this.cache.remember('node', () => {
			const rowId = this.getField('ID', 0);

			return this.getEditorContainer()?.querySelector<HTMLElement>('[data-id="' + rowId + '"]') ?? null;
		}) ?? null;
	}

	getSelector(): ProductSelector | null
	{
		return this.mainSelector;
	}

	isNewRow(): boolean
	{
		return isNaN(+this.getField('ID'));
	}

	getId(): string
	{
		return this.id as string;
	}

	setId(id: string): void
	{
		this.id = id;
	}

	setEditor(editor: Editor): void
	{
		this.editor = editor;
	}

	getEditor(): Editor
	{
		return this.editor;
	}

	getEditorContainer(): HTMLElement | null
	{
		return this.getEditor().getContainer();
	}

	getHintPopup(): HintPopup
	{
		return this.getEditor().getHintPopup();
	}

	initHandlers(): void
	{
		const editor = this.getEditor();

		this.getNode()!.querySelectorAll('input').forEach((node) => {
			EventBinder.bind(node, 'input', editor.changeProductFieldHandler);
			EventBinder.bind(node, 'change', editor.changeProductFieldHandler);
			// disable drag-n-drop events for text fields
			EventBinder.bind(node, 'mousedown', (event: any) => event.stopPropagation());
		});
		this.getNode()!.querySelectorAll('select').forEach((node) => {
			EventBinder.bind(node, 'change', editor.changeProductFieldHandler);
			// disable drag-n-drop events for select fields
			EventBinder.bind(node, 'mousedown', (event: any) => event.stopPropagation());
		});

		this.applyDropdownAccessibility();
	}

	// B6: keyboard access for the core main.ui.grid money currency dropdowns.
	// Disabled ones keep the core's tabindex="0" but are not operable - drop them from the tab
	// order. Active ones (measure, discount type, editable price currency) get button semantics
	// and Enter/Space activation, which the core delegate wired to click only.
	applyDropdownAccessibility(): void
	{
		const node = this.getNode();
		if (!node)
		{
			return;
		}

		node
			.querySelectorAll('.main-grid-editor-money-currency:not(.main-dropdown), .main-grid-editor-money-currency.main-dropdown[data-disabled="true"]')
			.forEach((currency) => {
				// This runs again after a product change, when an active dropdown can turn disabled.
				// Drop the button semantics too, or a screen reader keeps announcing an inoperable menu button.
				const element = currency as HTMLElement;
				element.removeAttribute('tabindex');
				element.removeAttribute('role');
				element.removeAttribute('aria-haspopup');
			})
		;

		node
			.querySelectorAll('.main-grid-editor-money-currency.main-dropdown:not([data-disabled="true"])')
			.forEach((activator) => {
				const el = activator as HTMLElement;
				el.setAttribute('role', 'button');
				el.setAttribute('aria-haspopup', 'menu');

				if (el.dataset.a11yKeyboardBound === 'Y')
				{
					return;
				}
				el.dataset.a11yKeyboardBound = 'Y';

				EventBinder.bind(el, 'keydown', (event: KeyboardEvent) => {
					if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
					{
						event.preventDefault();
						// keep Enter from reaching the money container's grid save listener
						event.stopPropagation();
						el.click();
					}
				});
			})
		;

		// B6: native TAX <select> opens on Space but not on Enter - open it with showPicker().
		// No-op on engines without showPicker (Space still works natively). No ARIA needed.
		node
			.querySelectorAll('select.crm-entity-product-control-select-field')
			.forEach((select) => {
				const el = select as HTMLSelectElement & { showPicker?: () => void };
				if (el.dataset.a11yKeyboardBound === 'Y')
				{
					return;
				}
				el.dataset.a11yKeyboardBound = 'Y';

				EventBinder.bind(el, 'keydown', (event: KeyboardEvent) => {
					if (event.key === 'Enter' && typeof el.showPicker === 'function')
					{
						event.preventDefault();
						event.stopPropagation();
						el.showPicker();
					}
				});
			})
		;

		// I4.B2: the "tax included" checkbox is a native input inside the grid's custom editor.
		// The editor's keydown listener turns Enter into a grid save, so Enter never toggles the
		// box. Keep Enter/Space from reaching that listener; Enter toggles explicitly, Space keeps
		// native activation. Accessible name and focus ring come from template aria-label and CSS.
		node
			.querySelectorAll('.crm-entity-product-control-checkbox input[type="checkbox"]')
			.forEach((checkbox) => {
				const el = checkbox as HTMLInputElement;
				if (el.dataset.a11yKeyboardBound === 'Y')
				{
					return;
				}
				el.dataset.a11yKeyboardBound = 'Y';

				EventBinder.bind(el, 'keydown', (event: KeyboardEvent) => {
					if (event.key === 'Enter')
					{
						event.preventDefault();
						event.stopPropagation();
						el.click();
					}
					else if (event.key === ' ' || event.key === 'Spacebar')
					{
						event.stopPropagation();
					}
				});
			})
		;
	}

	initHandlersForSelectors(): void
	{
		const editor = this.getEditor();

		const selectorNames = ['MAIN_INFO', 'STORE_INFO', 'RESERVE_INFO'];

		selectorNames.forEach((name) => {
			this.getNode()!.querySelectorAll('[data-name="' + name + '"] input[type="text"]').forEach(node => {
				EventBinder.bind(node, 'input', editor.changeProductFieldHandler);
				EventBinder.bind(node, 'change', editor.changeProductFieldHandler);
				// disable drag-n-drop events for select fields
				EventBinder.bind(node, 'mousedown', (event: any) => event.stopPropagation());
			});
		});
	}

	unsubscribeCustomEvents(): void
	{
		if (this.mainSelector)
		{
			this.mainSelector.unsubscribeEvents();
			EventEmitter.unsubscribe(
				this.mainSelector,
				'onClear',
				this.handleMainSelectorClear
			);
		}

		if (this.storeSelector)
		{
			this.storeSelector.unsubscribeEvents();
			EventEmitter.unsubscribe(
				this.storeSelector,
				'onChange',
				this.handleStoreFieldChange
			);

			EventEmitter.unsubscribe(
				this.storeSelector,
				'onClear',
				this.handleStoreFieldClear
			);
		}

		EventEmitter.unsubscribe(
			this.model,
			'onChangeStoreData',
			this.handleChangeStoreData,
		);

		EventEmitter.unsubscribe(
			this.model,
			'onErrorsChange',
			this.handleProductErrorsChange,
		);
	}

	private initActions(): void
	{
		if (this.getEditor().isReadOnly() || this.isRestrictedStoreInfo())
		{
			return;
		}

		const actionCellContentContainer = this.getNode()!.querySelector('.main-grid-cell-action .main-grid-cell-content');
		if (Type.isElementNode(actionCellContentContainer))
		{
			const actionsButton = Tag.render`
				<a
					href="#"
					class="main-grid-row-action-button"
				></a>
			`;

			EventBinder.bind(actionsButton, 'click', (event: Event) => {
				const menuItems = [
					{
						text: Loc.getMessage('CRM_ENTITY_PL_COPY') ?? '',
						onclick: this.handleCopyAction.bind(this),
						disabled: this.editor.getSettingValue('disabledSelectProductInput'),
					},
					{
						text: Loc.getMessage('CRM_ENTITY_PL_DELETE') ?? '',
						onclick: this.handleDeleteAction.bind(this),
						disabled: this.getModel().isEmpty() && this.getEditor().productCollection.products.length <= 1,
					}
				];

				PopupMenu.show({
					id: this.getId() + '_actions_popup',
					bindElement: actionsButton,
					items: menuItems,
					cacheable: false,
				});

				event.preventDefault();
				event.stopPropagation();
			});

			Dom.append(actionsButton, actionCellContentContainer);
		}
	}

	modifyBasePriceInput(): void
	{
		const priceNode = this.getNodeChildByDataName('PRICE');
		if (!priceNode)
		{
			return;
		}

		const control = new MoneyControl({
			node: priceNode,
			hint: Loc.getMessage('CRM_ENTITY_PL_PRICE_CHANGING_RESTRICTED'),
		});
		if (!this.isEditableCatalogPrice())
		{
			control.disable();
		}
		else
		{
			control.enable();
		}

		// price currency dropdown may toggle disabled/active on product change - reconcile a11y
		this.applyDropdownAccessibility();
	}

	modifyQuantityInput(): void
	{
		if (!this.isRestrictedStoreInfo())
		{
			return;
		}

		const countField = this.getNodeChildByDataName('QUANTITY');
		if (countField)
		{
			const control = new MoneyControl({
				node: countField,
				hint: Loc.getMessage('CRM_ENTITY_PL_ROW_UPDATE_RESTRICTED_BY_STORE'),
			});
			control.disable();
		}
	}

	private isEditableCatalogPrice(): boolean
	{
		return this.editor.canEditCatalogPrice()
			|| !this.getModel().isCatalogExisted()
			|| this.getModel().isNew()
		;
	}

	private initSelector(): void
	{
		const id = 'crm_grid_' + this.getId();
		const enableImageInput = this.editor.getSettingValue('enableSelectProductImageInput', true);

		const existingSelector = ProductSelector.getById(id);
		if (existingSelector)
		{
			this.mainSelector = existingSelector;
		}
		if (!existingSelector)
		{
			const selectorOptions = {
				iblockId: this.model.getIblockId(),
				basePriceId: this.model.getBasePriceId(),
				currency: this.model.getCurrency(),
				model: this.model,
				config: {
					ENABLE_SEARCH: true,
					IS_ALLOWED_CREATION_PRODUCT: true,
					ENABLE_IMAGE_INPUT: enableImageInput,
					ROLLBACK_INPUT_AFTER_CANCEL: true,
					ENABLE_INPUT_DETAIL_LINK: true,
					ROW_ID: this.getId(),
					ENABLE_SKU_SELECTION: true,
					ENABLE_EMPTY_PRODUCT_ERROR: false,
					SELECTOR_INPUT_DISABLED: this.editor.getSettingValue('disabledSelectProductInput'),
					URL_BUILDER_CONTEXT: this.editor.getSettingValue('productUrlBuilderContext'),
					RESTRICTED_PRODUCT_TYPES: this.getEditor().getRestrictedProductTypes(),
				},
				mode: ProductSelector.MODE_EDIT,
			};

			this.mainSelector = new ProductSelector('crm_grid_' + this.getId(), selectorOptions);
		}
		else
		{
			this.mainSelector.subscribeEvents();

			if (enableImageInput !== enableImageInputCache.get(id))
			{
				this.mainSelector.setConfig('ENABLE_IMAGE_INPUT', enableImageInput);
				if (enableImageInput)
				{
					this.mainSelector.layoutImage();
				}
			}
		}

		enableImageInputCache.set(id, enableImageInput);

		if (this.isRestrictedStoreInfo())
		{
			this.mainSelector.setMode(ProductSelector.MODE_VIEW);
		}

		const mainInfoNode = this.getNodeChildByDataName('MAIN_INFO');
		if (mainInfoNode)
		{
			const numberSelector = mainInfoNode.querySelector('.main-grid-row-number');
			if (!Type.isElementNode(numberSelector))
			{
				Dom.append(Tag.render`<div class="main-grid-row-number"></div>`, mainInfoNode);
			}

			let selectorWrapper = mainInfoNode.querySelector<HTMLElement>('.main-grid-row-product-selector');
			if (!Type.isElementNode(selectorWrapper))
			{
				selectorWrapper = Tag.render`<div class="main-grid-row-product-selector"></div>`;
				Dom.append(selectorWrapper, mainInfoNode);
			}

			this.mainSelector.skuTreeInstance = null;
			if (this.editor.isVisible())
			{
				this.mainSelector.renderTo(selectorWrapper);
			}
			else
			{
				this.mainSelector.wrapper = selectorWrapper;
			}
		}

		EventEmitter.subscribe(
			this.mainSelector,
			'onClear',
			this.handleMainSelectorClear
		);
	}

	private initStoreSelector(): void
	{
		if (!this.editor.isAllowReservation())
		{
			return;
		}

		this.storeSelector = new StoreSelector(
			this.getId(),
			{
				inputFieldId: 'STORE_ID',
				inputFieldTitle: 'STORE_TITLE',
				config: {
					ENABLE_SEARCH: true,
					ENABLE_INPUT_DETAIL_LINK: false,
					ROW_ID: this.getId(),
				},
				mode: StoreSelector.MODE_EDIT,
				model: this.model,
			}
		);

		EventEmitter.subscribe(
			this.storeSelector,
			'onChange',
			this.handleStoreFieldChange
		);

		EventEmitter.subscribe(
			this.storeSelector,
			'onClear',
			this.handleStoreFieldClear
		);

		if (this.isRestrictedStoreInfo() && this.storeSelector.searchInput)
		{
			this.storeSelector.searchInput.disable(
				Loc.getMessage('CRM_ENTITY_PL_ROW_UPDATE_STORE_RESTRICTED_BY_STORE') ?? ''
			);
		}

		this.layoutStoreSelector();
	}

	layoutStoreSelector(): void
	{
		const storeWrapper = this.getNodeChildByDataName('STORE_INFO');
		if (this.storeSelector && storeWrapper)
		{
			storeWrapper.innerHTML = '';

			if (this.needStoreSelectorInput())
			{
				this.storeSelector.renderTo(storeWrapper);

				if (this.isReserveBlocked())
				{
					this.applyStoreSelectorTweaks(() => this.editor.openIntegrationLimitSlider());
				}
				else if (!this.isInventoryManagementToolEnabled())
				{
					this.applyStoreSelectorTweaks(() => this.editor.openInventoryManagementToolDisabledSlider());
				}
			}
		}
	}

	private initStoreAvailablePopup(): void
	{
		const storeAvaiableNode = this.getNodeChildByDataName('STORE_AVAILABLE');
		if (!storeAvaiableNode)
		{
			return;
		}

		this.storeAvailablePopup = new StoreAvailablePopup({
			rowId: this.id as string,
			model: this.getModel(),
			node: storeAvaiableNode,
			inventoryManagementMode: this.getInventoryManagementMode(),
		});
	}

	private applyStoreSelectorTweaks(onWrapperClick: () => void): void
	{
		const storeSearchInput = this.storeSelector.searchInput;
		if (!storeSearchInput || !storeSearchInput.getNameInput())
		{
			return;
		}

		storeSearchInput.toggleIcon(storeSearchInput.getSearchIcon(), 'none');
		storeSearchInput.getNameInput().disabled = true;
		Dom.addClass(storeSearchInput.getNameInput(), 'crm-entity-product-list-locked-field');

		const wrapper = this.storeSelector.getWrapper();
		if (wrapper)
		{
			Dom.addClass(wrapper, 'crm-entity-product-list-locked-field-wrapper');
			EventBinder.bind(wrapper, 'click', onWrapperClick);
		}
	}

	private initReservedControl(): void
	{
		const storeWrapper = this.getNodeChildByDataName('RESERVE_INFO');
		if (storeWrapper && this.getAllowedStores().length)
		{
			this.reserveControl = new ReserveControl({
				row: this,
				isReserveEqualProductQuantity: this.isReserveEqualProductQuantity(),
				defaultDateReservation: this.editor.getSettingValue('defaultDateReservation'),
				isInventoryManagementToolEnabled: this.isInventoryManagementToolEnabled(),
				inventoryManagementMode: this.getInventoryManagementMode() ?? '',
				isBlocked: this.isReserveBlocked(),
				measureName: this.getMeasureName(),
			});

			EventEmitter.subscribe(
				this.reserveControl,
				'onNodeClick',
				() => {
					if (this.isReserveBlocked())
					{
						this.editor.openIntegrationLimitSlider();
					}
					else if (!this.isInventoryManagementToolEnabled())
					{
						this.editor.openInventoryManagementToolDisabledSlider();
					}
				}
			);

			if (this.isRestrictedStoreInfo())
			{
				this.reserveControl.disable();
			}

			this.layoutReserveControl();
		}

		const quantityInput = this.getNode()!.querySelector('div[data-name="QUANTITY"] input') as HTMLInputElement | null;
		if (quantityInput)
		{
			EventBinder.bind(
				quantityInput,
				'change',
				(event: Event) => {
					const isReserveEqualProductQuantity =
						this.isReserveEqualProductQuantity()
						&& this.reserveControl?.isReserveEqualProductQuantity
					;
					if (isReserveEqualProductQuantity)
					{
						this.setReserveQuantity(this.getField('QUANTITY'));
						return;
					}

					const value = Text.toNumber((event.target as HTMLInputElement).value);
					const errorNotifyId = 'quantityReservedCountError';
					let notify = BX.UI.Notification.Center.getBalloonById(errorNotifyId);
					if (value < this.getField('INPUT_RESERVE_QUANTITY'))
					{
						if (!notify)
						{
							const notificationOptions = {
								id: errorNotifyId,
								closeButton: true,
								autoHideDelay: 3000,
								content: Tag.render`<div>${Loc.getMessage('CRM_ENTITY_PL_IS_LESS_QUANTITY_THEN_RESERVED')}</div>`,
							};

							notify = BX.UI.Notification.Center.notify(notificationOptions);
						}

						this.setReserveQuantity(this.getField('QUANTITY'));
						notify.show();
					}
				}
			);
		}
	}

	layoutReserveControl(): void
	{
		const storeWrapper = this.getNodeChildByDataName('RESERVE_INFO');
		if (storeWrapper && this.reserveControl)
		{
			storeWrapper.innerHTML = '';
			this.reserveControl.clearCache();

			if (this.needReserveControlInput())
			{
				if (this.isRestrictedStoreInfo())
				{
					storeWrapper.innerHTML = this.reserveControl.getReservedQuantity() + ' ' + Text.encode(this.getMeasureName());
					return;
				}

				this.reserveControl.renderTo(storeWrapper);
			}
		}
	}

	clearReserveControl(): void
	{
		const storeWrapper = this.getNodeChildByDataName('RESERVE_INFO');
		if (storeWrapper && this.reserveControl)
		{
			storeWrapper.innerHTML = '';
			this.reserveControl.clearCache();
		}
	}

	setRowNumber(num: number): void
	{
		this.getNode()!.querySelectorAll('.main-grid-row-number').forEach(node => {
			node.textContent = num + '.';
		});
	}

	getFields(fields: string[] = []): Record<string, any>
	{
		let result: Record<string, any>;

		if (!Type.isArrayFilled(fields))
		{
			result = Runtime.clone(this.fields);
		}
		else
		{
			result = {};

			for (const fieldName of fields)
			{
				result[fieldName] = this.getField(fieldName);
			}
		}

		if ('PRODUCT_NAME' in result)
		{
			const fixedProductName = this.getField('FIXED_PRODUCT_NAME', '');

			if (Type.isStringFilled(fixedProductName))
			{
				result['PRODUCT_NAME'] = fixedProductName;
			}
		}

		return result;
	}

	getCatalogFields(): Record<string, any>
	{
		const fields = this.getFields(['CURRENCY', 'QUANTITY', 'MEASURE_CODE']);

		fields['PRICE'] = this.getBasePrice();
		fields['VAT_INCLUDED'] = this.getTaxIncluded();
		fields['VAT_ID'] = this.getTaxIdFromNode();

		return fields;
	}

	getCalculateFields(): FieldScheme
	{
		return {
			'PRICE': this.getPrice(),
			'BASE_PRICE': this.getBasePrice(),
			'PRICE_EXCLUSIVE': this.getPriceExclusive(),
			'PRICE_NETTO': this.getPriceNetto(),
			'PRICE_BRUTTO': this.getPriceBrutto(),
			'QUANTITY': this.getQuantity(),
			'DISCOUNT_TYPE_ID': this.getDiscountType(),
			'DISCOUNT_RATE': this.getDiscountRate(),
			'DISCOUNT_SUM': this.getDiscountSum(),
			'DISCOUNT_ROW': this.getDiscountRow(),
			'TAX_INCLUDED': this.getTaxIncluded(),
			'TAX_RATE': this.getTaxRate()
		} as unknown as FieldScheme;
	}

	setFields(fields: Record<string, any>): void
	{
		for (const name in fields)
		{
			if (fields.hasOwnProperty(name))
			{
				this.setField(name, fields[name]);
				this.getModel().setField(name, fields[name]);
			}
		}
	}

	getField(name: string, defaultValue?: any): any
	{
		return this.fields.hasOwnProperty(name) ? this.fields[name] : defaultValue;
	}

	setField(name: string, value: any, changeModel: boolean = true): void
	{
		this.fields[name] = value;

		if (changeModel)
		{
			this.getModel().setField(name, value);
		}
	}

	getUiFieldId(field: string): string
	{
		return this.getId() + '_' + field;
	}

	getBasePrice(): number
	{
		return this.getField('BASE_PRICE', 0);
	}

	isPriceNetto(): boolean
	{
		return this.getEditor().isTaxAllowed() && !this.isTaxIncluded();
	}

	getPrice(): number
	{
		return this.getField('PRICE', 0);
	}

	getPriceExclusive(): number
	{
		return this.getField('PRICE_EXCLUSIVE', 0);
	}

	getPriceNetto(): number
	{
		return this.getField('PRICE_NETTO', 0);
	}

	getPriceBrutto(): number
	{
		return this.getField('PRICE_BRUTTO', 0);
	}

	getQuantity(): number
	{
		return this.getField('QUANTITY', 1);
	}

	getDiscountType(): DiscountTypes
	{
		return this.getField('DISCOUNT_TYPE_ID', DiscountType.UNDEFINED);
	}

	isDiscountUndefined(): boolean
	{
		return this.getDiscountType() === DiscountType.UNDEFINED;
	}

	isDiscountPercentage(): boolean
	{
		return this.getDiscountType() === DiscountType.PERCENTAGE;
	}

	isDiscountMonetary(): boolean
	{
		return this.getDiscountType() === DiscountType.MONETARY;
	}

	isDiscountHandmade(): boolean
	{
		return this.isDiscountPercentage() || this.isDiscountMonetary();
	}

	getDiscountRate(): number
	{
		return this.getField('DISCOUNT_RATE', 0);
	}

	getDiscountSum(): number
	{
		return this.getField('DISCOUNT_SUM', 0);
	}

	getDiscountRow(): number
	{
		return this.getField('DISCOUNT_ROW', 0);
	}

	isEmptyRow(): boolean
	{
		return (
			!Type.isStringFilled(this.getField('NAME', '').trim())
			&& this.model.isEmpty()
			&& this.getBasePrice() <= 0
		);
	}

	getTaxIncluded(): CrmEntityProductListYesNo
	{
		return this.getField('TAX_INCLUDED', 'N');
	}

	isTaxIncluded(): boolean
	{
		return this.getTaxIncluded() === 'Y';
	}

	getTaxRate(): number
	{
		return this.getField('TAX_RATE', 0);
	}

	getTaxSum(): number
	{
		return this.isTaxIncluded()
			? this.getPrice() * this.getQuantity() * (1 - 1 / (1 + this.getTaxRate() / 100))
			: this.getPriceExclusive() * this.getQuantity() * this.getTaxRate() / 100;
	}

	getTaxNode(): HTMLSelectElement | null
	{
		return this.getNode()!.querySelector('select[data-field-code="TAX_RATE"]') as HTMLSelectElement | null;
	}

	getTaxName(): string
	{
		return this.getField('TAX_NAME', '');
	}

	getTaxId(): number | string
	{
		return this.getField('TAX_ID', '');
	}

	getTaxIdFromNode(): number
	{
		const taxNode = this.getTaxNode();

		if (Type.isElementNode(taxNode) && taxNode!.options[taxNode!.selectedIndex])
		{
			return Text.toNumber(taxNode!.options[taxNode!.selectedIndex].getAttribute('data-tax-id'));
		}

		return 0;
	}

	updateFieldByEvent(fieldCode: string, event: UIEvent): void
	{
		const target = event.target as HTMLInputElement;
		const value = target.type === 'checkbox' ? target.checked : target.value;
		const mode = (event.type === 'input' || event.type === 'change') ? MODE_EDIT : MODE_SET;

		this.updateField(fieldCode, value, mode);
	}

	updateField(fieldCode: string, value: any, mode: string = MODE_SET): void
	{
		if (fieldCode === 'TAX_RATE')
		{
			fieldCode = 'TAX_ID';
		}

		this.resetExternalActions();
		this.updateFieldValue(fieldCode, value, mode);
		this.executeExternalActions();
	}

	updateFieldValue(code: string, value: any, mode: string = MODE_SET): void
	{
		switch (code)
		{
			case 'ID':
			case 'OFFER_ID':
				this.changeProductId(value);
				break;

			case 'QUANTITY':
				this.changeQuantity(value, mode);
				break;

			case 'MEASURE_CODE':
				this.changeMeasureCode(value, mode);
				break;

			case 'DISCOUNT':
			case 'DISCOUNT_PRICE':
				this.changeDiscount(value, mode);
				break;

			case 'DISCOUNT_TYPE_ID':
				this.changeDiscountType(value);
				break;

			case 'DISCOUNT_ROW':
				this.changeRowDiscount(value, mode);
				break;

			case 'VAT_ID':
			case 'TAX_ID':
				this.changeTaxId(value);
				break;

			case 'VAT_INCLUDED':
			case 'TAX_INCLUDED':
				this.changeTaxIncluded(value);
				break;

			case 'SUM':
				this.changeRowSum(value, mode);
				break;

			case 'NAME':
			case 'PRODUCT_NAME':
			case 'MAIN_INFO':
				this.changeProductName(value);
				break;

			case 'SORT':
				this.changeSort(value, mode);
				break;

			case 'STORE_ID':
				this.changeStore(value);
				break;
			case 'STORE_TITLE':
				this.changeStoreName(value);
				break;
			case 'INPUT_RESERVE_QUANTITY':
				this.changeReserveQuantity(value);
				break;
			case 'DATE_RESERVE_END':
				this.changeDateReserveEnd(value);
				break;
			case 'PRICE':
			case 'BASE_PRICE':
				this.changeBasePrice(value, mode);
				break;
			case 'DEDUCTED_QUANTITY':
				this.setDeductedQuantity(value);
				break;
			case 'ROW_RESERVED':
				this.setRowReserved(value);
				break;
			case 'TYPE':
				this.setType(value);
				break;
			case 'SKU_TREE':
			case 'DETAIL_URL':
			case 'IMAGE_INFO':
			case 'COMMON_STORE_AMOUNT':
				this.setField(code, value);
				break;
		}
	}

	updateFieldByName(field: string, value: any): void
	{
		switch (field)
		{
			case 'TAX_INCLUDED':
				this.setTaxIncluded(value);
				break;
		}
	}

	handleCopyAction(event: any, menuItem: any): void
	{
		this.getEditor()?.copyRow(this);
		const menu = menuItem.getMenuWindow();
		if (menu)
		{
			menu.destroy();
		}
	}

	handleDeleteAction(event: any, menuItem: any): void
	{
		this.getEditor()?.deleteRow(this.getField('ID'));
		const menu = menuItem.getMenuWindow();
		if (menu)
		{
			menu.destroy();
		}
	}

	changeProductId(value: any): void
	{
		const preparedValue = this.parseInt(value);

		this.setProductId(preparedValue);
	}

	changeQuantity(value: any, mode: string = MODE_SET): void
	{
		const preparedValue = this.parseFloat(value, this.getQuantityPrecision());
		this.setQuantity(preparedValue, mode);
	}

	changeMeasureCode(value: string, mode: string = MODE_SET): void
	{
		this
			.getEditor()
			.getMeasures()
			.filter((item: any) => item.CODE === value)
			.forEach((item: any) => this.setMeasure(item, mode))
		;
	}

	changeDiscount(value: any, mode: string = MODE_SET): void
	{
		let preparedValue: any;

		if (this.isDiscountPercentage())
		{
			preparedValue = this.parseFloat(value, this.getCommonPrecision());
		}
		else
		{
			preparedValue = this
				.parseFloat(value, this.getCalculationPricePrecision())
				.toFixed(this.getCalculationPricePrecision())
			;
		}

		this.setDiscount(preparedValue, mode);
	}

	changeDiscountType(value: any): void
	{
		const preparedValue = this.parseInt(value, DiscountType.UNDEFINED);

		this.setDiscountType(preparedValue);
	}

	changeRowDiscount(value: any, mode: string = MODE_SET): void
	{
		const preparedValue = this.parseFloat(value, this.getCalculationPricePrecision());

		this.setRowDiscount(preparedValue, mode);
	}

	changeTaxId(value: number): void
	{
		const taxList = this.getEditor().getTaxList() as CrmEntityProductListTaxRate[];
		if (Type.isArrayFilled(taxList))
		{
			let taxRate = taxList.find((item) => parseInt(String(item.ID), 10) === Number(value));
			if (!taxRate)
			{
				taxRate = taxList.find((item) => Type.isNil(item.VALUE));
			}

			if (taxRate)
			{
				this.setTaxRate(taxRate);
			}
		}
	}

	changeTaxIncluded(value: any): void
	{
		if (Type.isBoolean(value))
		{
			value = value ? 'Y' : 'N';
		}

		this.setTaxIncluded(value);
	}

	changeRowSum(value: any, mode: string = MODE_SET): void
	{
		const preparedValue = this.parseFloat(value, this.getCalculationPricePrecision());

		this.setRowSum(preparedValue, mode);
	}

	changeProductName(value: any): void
	{
		const preparedValue = value.toString();
		const isChangedValue = this.getField('PRODUCT_NAME') !== preparedValue;

		if (isChangedValue)
		{
			this.setField('PRODUCT_NAME', preparedValue);
			this.setField('NAME', preparedValue);
			this.addActionProductChange();
		}
	}

	changeSort(value: any, mode: string = MODE_SET): void
	{
		const preparedValue = this.parseInt(value);

		if (mode === MODE_SET)
		{
			this.setField('SORT', preparedValue);
		}

		const isChangedValue = this.getField('SORT') !== preparedValue;

		if (isChangedValue)
		{
			this.addActionProductChange();
		}
	}

	changeStore(value: number): void
	{
		if (this.isReserveBlocked())
		{
			return;
		}

		const preparedValue = Text.toNumber(value);
		if (this.getField('STORE_ID') === preparedValue)
		{
			return;
		}

		this.setField('STORE_ID', preparedValue);
		this.setField('STORE_AVAILABLE', this.model.getStoreCollection().getStoreAvailableAmount(value));

		this.updateUiStoreAmountData();
		this.layoutReserveControl();
		this.addActionProductChange();
		this.initHandlersForSelectors();
	}

	updateUiStoreAmountData(): void
	{
		const availableWrapper = this.getNodeChildByDataName('STORE_AVAILABLE');
		if (!Type.isElementNode(availableWrapper))
		{
			return;
		}

		const storeId = this.getField('STORE_ID');
		const canShowAmount =
			Boolean(storeId)
			&& this.getModel().isCatalogExisted()
			&& !this.isRestrictedStoreInfo()
			&& !this.getModel().isService()
		;

		if (!canShowAmount)
		{
			// No real value: drop content and make the node non-interactive / unnamed (B2),
			// so it is not a phantom tab stop and is not announced by a screen reader.
			(availableWrapper as HTMLElement).innerHTML = '';
			this.setStoreAvailableInteractive(availableWrapper as HTMLElement, false);

			return;
		}

		const available = this.model.getStoreCollection().getStoreAvailableAmount(storeId);
		const amount = Text.toNumber(available);
		const amountWithMeasure = amount + ' ' + this.getMeasureName();

		(availableWrapper as HTMLElement).innerHTML =
			amount > 0
				? amountWithMeasure
				: `<span class="store-available-popup-link--danger">${amountWithMeasure}</span>`
		;

		this.setStoreAvailableInteractive(availableWrapper as HTMLElement, true);
	}

	// Keeps the STORE_AVAILABLE anchor focusable + named + popup-styled only when it holds a
	// real value; the popup click handler stays bound (see initStoreAvailablePopup) and simply
	// has nothing to reach while the node is inert (B2).
	private setStoreAvailableInteractive(node: HTMLElement, isInteractive: boolean): void
	{
		if (isInteractive)
		{
			node.setAttribute('href', '#');
			Dom.addClass(node, 'store-available-popup-link');
		}
		else
		{
			node.removeAttribute('href');
			node.removeAttribute('aria-label');
			Dom.removeClass(node, 'store-available-popup-link');
		}
	}

	updatePropertyFields(): void
	{
		const productProps = this.model.getField('PRODUCT_PROPERTIES');

		for (const property in productProps)
		{
			const availableWrapper = this.getNodeChildByDataName(property);
			if (availableWrapper)
			{
				const value = this.model.getField('PRODUCT_PROPERTIES')[property] ?? '';
				availableWrapper.innerHTML = value;
			}
		}
	}

	clearPropertyFields(): void
	{
		const propNodes = this.getNodesChild();
		propNodes.forEach((property) => {
			(property as HTMLElement).innerHTML = '';
		});
	}

	setRowReserved(value: any): void
	{
		this.setField('ROW_RESERVED', value);
		const reserveWrapper = this.getNodeChildByDataName('ROW_RESERVED');
		if (!Type.isElementNode(reserveWrapper))
		{
			return;
		}

		if (!this.getModel().isCatalogExisted() || this.getModel().isService())
		{
			reserveWrapper!.innerHTML = '';
			return;
		}

		reserveWrapper!.innerHTML = Text.toNumber(this.getField('ROW_RESERVED')) + ' ' + this.getMeasureName();
	}

	setDeductedQuantity(value: any): void
	{
		this.setField('DEDUCTED_QUANTITY', value);
		const deductedWrapper = this.getNodeChildByDataName('DEDUCTED_QUANTITY');
		if (!Type.isElementNode(deductedWrapper))
		{
			return;
		}

		if (!this.getModel().isCatalogExisted() || this.getModel().isService())
		{
			deductedWrapper!.innerHTML = '';
			return;
		}

		deductedWrapper!.innerHTML = Text.toNumber(this.getField('DEDUCTED_QUANTITY')) + ' ' + this.getMeasureName();
	}

	changeStoreName(value: any): void
	{
		const preparedValue = value.toString();
		this.setField('STORE_TITLE', preparedValue);
		this.addActionProductChange();
	}

	changeDateReserveEnd(value: string): void
	{
		const preparedValue = Type.isNil(value) ? '' : value.toString();
		this.setField('DATE_RESERVE_END', preparedValue);
		this.addActionProductChange();
	}

	changeReserveQuantity(value: number): void
	{
		const preparedValue = Text.toNumber(value);
		const reserveDifference = preparedValue - this.getField('INPUT_RESERVE_QUANTITY');

		if (reserveDifference === 0 || isNaN(reserveDifference))
		{
			return;
		}
		const newReserve = this.getField('ROW_RESERVED') + reserveDifference;

		this.setField('ROW_RESERVED', newReserve);
		this.setField('RESERVE_QUANTITY', Math.max(newReserve, 0));
		this.setField('INPUT_RESERVE_QUANTITY', preparedValue);

		this.addActionProductChange();
	}

	resetReserveFields(): void
	{
		this.setField('ROW_RESERVED', null);
		this.setField('RESERVE_QUANTITY', null);
		this.setField('INPUT_RESERVE_QUANTITY', null);
	}

	refreshFieldsLayout(exceptFields: string[] = []): void
	{
		this.uiBinder.refreshLayout(exceptFields);
	}

	getCalculator(): ProductCalculator
	{
		const settings = {
			pricePrecision: this.getCalculationPricePrecision(),
			commonPrecision: this.getCommonPrecision(),
			quantityPrecision: this.getQuantityPrecision(),
		};

		return this.getModel()
			.getCalculator()
			.setFields(this.getCalculateFields())
			.setSettings(settings)
		;
	}

	setModel(fields: Record<string, any> = {}, settings: CrmEntityProductListSettings = {}): void
	{
		const selectorId = settings.selectorId;
		if (selectorId)
		{
			const model = ProductModel.getById(selectorId);
			if (model)
			{
				this.model = model;
			}
		}

		if (!this.model)
		{
			this.model = new ProductModel({
				id: selectorId,
				currency: this.getEditor().getCurrencyId(),
				iblockId: fields['IBLOCK_ID'],
				basePriceId: fields['BASE_PRICE_ID'],
				isSimpleModel: Text.toInteger(fields['PRODUCT_ID']) <= 0 && Type.isStringFilled(fields['NAME']),
				skuTree: Type.isStringFilled(fields['SKU_TREE']) ? JSON.parse(fields['SKU_TREE']) : null,
				storeMap: fields['STORE_MAP'] ?? {},
				fields,
			} as any);

			if (!Type.isNil(fields['DETAIL_URL']))
			{
				this.model.setDetailPath(fields['DETAIL_URL']);
			}
		}

		// fill after change setting show pictures.
		const imageInfo: any = Type.isStringFilled(fields['IMAGE_INFO']) ? JSON.parse(fields['IMAGE_INFO']) : null;
		if (imageInfo !== null && typeof imageInfo === 'object')
		{
			this.model.getImageCollection().setPreview(imageInfo['preview']);
			this.model.getImageCollection().setEditInput(imageInfo['input']);
			this.model.getImageCollection().setMorePhotoValues(imageInfo['values']);
		}

		if (this.isReserveEqualProductQuantity())
		{
			if (!this.getModel().getField('DATE_RESERVE_END'))
			{
				this.setField('DATE_RESERVE_END', this.editor.getSettingValue('defaultDateReservation'));
			}
		}

		EventEmitter.subscribe(
			this.model,
			'onErrorsChange',
			this.handleProductErrorsChange,
		);

		EventEmitter.subscribe(
			this.model,
			'onChangeStoreData',
			this.handleChangeStoreData,
		);
	}

	getModel(): ProductModel
	{
		return this.model;
	}

	setProductId(value: any): void
	{
		const isChangedValue = this.getField('PRODUCT_ID') !== value;

		if (isChangedValue)
		{
			this.getModel().setOption('isSimpleModel', value <= 0 && Type.isStringFilled(this.getField('NAME')));
			this.setField('PRODUCT_ID', value, false);
			this.setField('OFFER_ID', value, false);
			this.storeSelector?.setProductId(value);

			this.addActionProductChange();
			this.addActionUpdateTotal();

			if (
				this.reserveControl
				&& this.isReserveEqualProductQuantity()
				&& this.needReserveControlInput()
			)
			{
				if (!this.getModel().getField('DATE_RESERVE_END'))
				{
					this.setField('DATE_RESERVE_END', this.editor.getSettingValue('defaultDateReservation'));
				}

				this.resetReserveFields();

				this.onAfterExecuteExternalActions = () => {
					this.reserveControl!.changeInputValue(this.getField('QUANTITY'));
				};
			}
		}
	}

	changeBasePrice(value: any, mode: string = MODE_SET): void
	{
		if (mode === MODE_EDIT && !this.isEditableCatalogPrice())
		{
			value = this.getField('BASE_PRICE');
			this.updateUiInputField('PRICE', value.toFixed(this.getPricePrecision()));

			return;
		}

		const originalPrice = value;
		// price can't be less than zero
		value = Math.max(value, 0);

		if (mode === MODE_SET)
		{
			this.updateUiInputField('PRICE', value.toFixed(this.getPricePrecision()));
		}

		const isChangedValue = this.getBasePrice() !== value;
		if (isChangedValue)
		{
			const calculatedFields = this.getCalculator().calculateBasePrice(value);
			this.setFields(calculatedFields);

			const exceptFieldNames = (mode === MODE_EDIT) ? ['BASE_PRICE', 'PRICE'] : [];
			this.refreshFieldsLayout(exceptFieldNames);

			this.addActionProductChange();
			this.addActionUpdateTotal();
		}

		this.togglePriceHintPopup(originalPrice < 0 && originalPrice !== value);
	}

	private shouldShowSmallPriceHint(): boolean
	{
		return (
			Text.toNumber(this.getField('PRICE')) > 0
			&& Text.toNumber(this.getField('PRICE')) < 1
			&& this.isDiscountPercentage()
			&& (
				Text.toNumber(this.getField('DISCOUNT_SUM')) > 0
				|| Text.toNumber(this.getField('DISCOUNT_RATE')) > 0
				|| Text.toNumber(this.getField('DISCOUNT_ROW')) > 0
			)
		);
	}

	private togglePriceHintPopup(showNegative: boolean = false): void
	{
		if (this.shouldShowSmallPriceHint())
		{
			this.getHintPopup()
				.load(
					this.getInputByFieldName('PRICE')!,
					Loc.getMessage('CRM_ENTITY_PL_SMALL_PRICE_NOTICE') ?? ''
				)
				.show()
			;
		}
		else if (showNegative)
		{
			this.getHintPopup()
				.load(
					this.getInputByFieldName('PRICE')!,
					Loc.getMessage('CRM_ENTITY_PL_NEGATIVE_PRICE_NOTICE') ?? ''
				)
				.show()
			;
		}
		else
		{
			this.getHintPopup().close();
		}
	}

	setQuantity(value: any, mode: string = MODE_SET): void
	{
		if (mode === MODE_SET)
		{
			this.updateUiInputField('QUANTITY', value);
		}

		const isChangedValue = this.getField('QUANTITY') !== value;
		if (isChangedValue)
		{
			const errorNotifyId = 'quantityReservedCountError';
			const notify = BX.UI.Notification.Center.getBalloonById(errorNotifyId);
			if (notify)
			{
				notify.close();
			}

			const calculatedFields = this.getCalculator().calculateQuantity(value);
			this.setFields(calculatedFields);
			this.refreshFieldsLayout(['QUANTITY']);

			this.addActionProductChange();
			this.addActionUpdateTotal();
		}
	}

	setReserveQuantity(value: any): void
	{
		const node = this.getNodeChildByDataName('RESERVE_INFO');
		const input = node?.querySelector('input[name="INPUT_RESERVE_QUANTITY"]') as HTMLInputElement | null;
		if (Type.isElementNode(input))
		{
			input!.value = value;

			const view = node?.querySelector('span[data-name="VIEW_RESERVE_QUANTITY"]');
			if (view)
			{
				view.textContent = value;
			}

			this.reserveControl?.changeInputValue(value);
		}
		else
		{
			this.changeReserveQuantity(value);
		}
	}

	setMeasure(measure: any, mode: string = MODE_SET): void
	{
		this.setField('MEASURE_CODE', measure.CODE);
		this.setField('MEASURE_NAME', measure.SYMBOL);

		this.updateUiMoneyField('MEASURE_CODE', measure.CODE, Text.encode(measure.SYMBOL));

		if (this.getModel().isNew())
		{
			// @ts-expect-error: ProductModel.save() typing doesn't expose the optional fields argument
			this.getModel().save(['MEASURE_CODE']);
		}
		else if (mode === MODE_EDIT)
		{
			this.getModel().showSaveNotifier(
				'measureChanger_' + this.getId(),
				{
					title: Loc.getMessage('CATALOG_PRODUCT_MODEL_SAVING_NOTIFICATION_MEASURE_CHANGED_QUERY'),
					events: {
						onSave: () => {
							// @ts-expect-error: ProductModel.save() typing doesn't expose the optional fields argument
							this.getModel().save(['MEASURE_CODE', 'MEASURE_NAME']);
						}
					},
				}
			);
		}

		this.addActionProductChange();
	}

	setDiscount(value: any, mode: string = MODE_SET): void
	{
		if (!this.isDiscountHandmade())
		{
			return;
		}

		const fieldName = this.isDiscountPercentage() ? 'DISCOUNT_RATE' : 'DISCOUNT_SUM';
		const isChangedValue = this.getField(fieldName) !== value;
		if (isChangedValue)
		{
			const calculatedFields = this.getCalculator().calculateDiscount(value);
			this.setFields(calculatedFields);
			const exceptFieldNames = (mode === MODE_EDIT) ? ['DISCOUNT_RATE', 'DISCOUNT_SUM', 'DISCOUNT'] : [];
			this.refreshFieldsLayout(exceptFieldNames);

			this.addActionProductChange();
			this.addActionUpdateTotal();
		}

		this.togglePriceHintPopup();
	}

	setDiscountType(value: any): void
	{
		const isChangedValue = value !== DiscountType.UNDEFINED
			&& this.getField('DISCOUNT_TYPE_ID') !== value;

		if (isChangedValue)
		{
			const calculatedFields = this.getCalculator().calculateDiscountType(value);
			this.setFields(calculatedFields);
			this.refreshFieldsLayout();

			this.addActionProductChange();
			this.addActionUpdateTotal();
		}
	}

	setRowDiscount(value: any, mode: string = MODE_SET): void
	{
		const isChangedValue = this.getField('DISCOUNT_ROW') !== value;
		if (isChangedValue)
		{
			const calculatedFields = this.getCalculator().calculateRowDiscount(value);
			this.setFields(calculatedFields);

			const exceptFieldNames = (mode === MODE_EDIT) ? ['DISCOUNT_ROW'] : [];
			this.refreshFieldsLayout(exceptFieldNames);

			this.addActionProductChange();
			this.addActionUpdateTotal();
		}
	}

	setTaxRate(taxRate: CrmEntityProductListTaxRate): void
	{
		if (!this.getEditor().isTaxAllowed())
		{
			return;
		}

		const preparedTaxValue =
			taxRate.VALUE !== null
				? this.parseFloat(taxRate.VALUE, this.getCommonPrecision())
				: null
		;

		const isChangedValue =
			this.getTaxId() !== taxRate.ID
			|| this.getTaxRate() !== preparedTaxValue
			|| this.getTaxName() !== taxRate.NAME
		;
		if (isChangedValue)
		{
			this.fields['TAX_ID'] = taxRate.ID;
			this.fields['TAX_NAME'] = taxRate.NAME;
			const calculatedFields = this.getCalculator().calculateTax(preparedTaxValue);
			this.setFields(calculatedFields);
			this.refreshFieldsLayout();

			this.addActionProductChange();
			this.addActionUpdateTotal();
		}
	}

	setTaxIncluded(value: CrmEntityProductListYesNo, mode: string = MODE_SET): void
	{
		if (!this.getEditor().isTaxAllowed())
		{
			return;
		}

		if (mode === MODE_SET)
		{
			this.updateUiCheckboxField('TAX_INCLUDED', value);
		}

		const isChangedValue = this.getTaxIncluded() !== value;
		if (isChangedValue)
		{
			const calculatedFields = this.getCalculator().calculateTaxIncluded(value);
			this.setFields(calculatedFields);
			this.refreshFieldsLayout();

			this.addActionUpdateFieldList('TAX_INCLUDED', value);
			this.addActionProductChange();
			this.addActionUpdateTotal();
		}
	}

	setRowSum(value: any, mode: string = MODE_SET): void
	{
		const isChangedValue = this.getField('SUM') !== value;
		if (isChangedValue)
		{
			const calculatedFields = this.getCalculator().calculateRowSum(value);
			this.setFields(calculatedFields);
			const exceptFieldNames = (mode === MODE_EDIT) ? ['SUM'] : [];
			this.refreshFieldsLayout(exceptFieldNames);

			this.addActionProductChange();
			this.addActionUpdateTotal();
		}
	}

	// controls (delegated to ./row-field-ui-binder)
	getInputByFieldName(fieldName: string): HTMLElement | null { return this.uiBinder.getInputByFieldName(fieldName); }
	updateUiInputField(name: string, value: any): void { this.uiBinder.updateInput(name, value); }
	updateUiCheckboxField(name: string, value: any): void { this.uiBinder.updateCheckbox(name, value); }
	updateUiMoneyField(name: string, value: number | string, text: string): void { this.uiBinder.updateMoney(name, value, text); }
	updateUiMeasure(code: string, name: string): void { this.uiBinder.updateMeasure(code, name); }
	updateUiHtmlField(name: string, html: string): void { this.uiBinder.updateHtml(name, html); }
	updateUiCurrencyFields(): void { this.uiBinder.updateCurrencyFields(); }
	updateUiField(field: string, value: any): void { this.uiBinder.updateField(field, value); }

	// proxy
	parseInt(value: number | string, defaultValue: number = 0): number
	{
		return this.getEditor().parseInt(value, defaultValue);
	}

	parseFloat(value: number | string, precision: number, defaultValue: number = 0): number
	{
		return this.getEditor().parseFloat(value, precision, defaultValue);
	}

	getPricePrecision(): number
	{
		return this.getEditor().getPricePrecision();
	}

	getCalculationPricePrecision(): number
	{
		return this.getEditor().getCalculationPricePrecision();
	}

	getQuantityPrecision(): number
	{
		return this.getEditor().getQuantityPrecision();
	}

	getCommonPrecision(): number
	{
		return this.getEditor().getCommonPrecision();
	}

	resetExternalActions(): void { this.externalActionsQueue.reset(); }
	addActionProductChange(): void { this.externalActionsQueue.addProductChange(); }
	addActionUpdateFieldList(field: string, value: any): void { this.externalActionsQueue.addUpdateFieldList(field, value); }
	addActionUpdateTotal(): void { this.externalActionsQueue.addUpdateTotal(); }
	executeExternalActions(): void { this.externalActionsQueue.execute(); }

	isEmpty(): boolean
	{
		return (
			!Type.isStringFilled(this.getField('PRODUCT_NAME', '').trim())
			&& this.getField('PRODUCT_ID', 0) <= 0
			&& this.getPrice() <= 0
		);
	}

	isReserveBlocked(): boolean
	{
		return this.getSettingValue('isReserveBlocked', false);
	}

	isInventoryManagementToolEnabled(): boolean
	{
		return this.getSettingValue('isInventoryManagementToolEnabled', true);
	}

	getInventoryManagementMode(): string | null
	{
		return this.getSettingValue('inventoryManagementMode', '');
	}

	isRestrictedStoreInfo(): boolean
	{
		if (!this.editor.isAllowReservation())
		{
			return false;
		}

		const storeId = this.getField('STORE_ID')?.toString();
		if (Type.isNil(storeId) || storeId === '0')
		{
			return false;
		}
		else if (this.getModel().isSimple() || this.getModel().isService())
		{
			return false;
		}

		return !this.getAllowedStores().includes(storeId);
	}

	private getAllowedStores(): any[]
	{
		return this.editor.getSettingValue('allowedStores', []);
	}

	private isReserveEqualProductQuantity(): boolean
	{
		return this.editor.getSettingValue('isReserveEqualProductQuantity', false);
	}

	getMeasureName(): string
	{
		const measureName =
			Type.isStringFilled(this.model.getField('MEASURE_NAME'))
				? this.model.getField('MEASURE_NAME')
				: this.editor.getDefaultMeasure()?.SYMBOL || ''
		;

		return Text.encode(measureName);
	}

	private getNodeChildByDataName(name: string): HTMLElement | null
	{
		return this.getNode()!.querySelector(`[data-name="${name}"]`);
	}

	private getNodesChild(): NodeList
	{
		return this.getNode()!.querySelectorAll(`span[data-name]`);
	}

	setType(value: any): void
	{
		this.setField('TYPE', value);

		if (this.getModel().isService())
		{
			this.clearReserveControl();
		}
	}

	private needReserveControlInput(): boolean
	{
		return !this.getModel().isSimple() && !this.getModel().isService();
	}

	private needStoreSelectorInput(): boolean
	{
		return !this.getModel().isSimple() && !this.getModel().isService();
	}
}
