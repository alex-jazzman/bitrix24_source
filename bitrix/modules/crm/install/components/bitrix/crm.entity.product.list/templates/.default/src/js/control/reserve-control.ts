import {Tag, Text, Loc, Event as EventBinder, Cache, Runtime, Dom} from 'main.core';
import {EventEmitter} from 'main.core.events';
import type {Row} from '../row/product-list-row';
import {ModeList} from 'catalog.store-enable-wizard';
import {FocusNavigator} from 'ui.a11y';

declare const BX: any;

type CrmEntityProductListReserveControlOptions = {
	row: Row;
	inputName?: string;
	dateFieldName?: string;
	quantityFieldName?: string;
	deductedQuantityFieldName?: string;
	defaultDateReservation?: string | null;
	isBlocked?: boolean;
	isInventoryManagementToolEnabled?: boolean;
	inventoryManagementMode?: string;
	measureName?: string;
	isReserveEqualProductQuantity?: boolean;
};

export default class ReserveControl
{
	public static readonly INPUT_NAME = 'INPUT_RESERVE_QUANTITY';
	public static readonly VIEW_NAME = 'VIEW_RESERVE_QUANTITY';
	public static readonly DATE_NAME = 'DATE_RESERVE_END';
	public static readonly QUANTITY_NAME = 'QUANTITY';
	public static readonly DEDUCTED_QUANTITY_NAME = 'DEDUCTED_QUANTITY';

	private readonly row: Row;
	private readonly cache = new Cache.MemoryCache<HTMLElement>();
	public isReserveEqualProductQuantity: boolean = true;
	public wrapper: HTMLElement | null = null;
	public readonly measureName: string | undefined;

	public readonly inputFieldName: string;
	public readonly viewName: string;
	public readonly dateFieldName: string;
	public readonly quantityFieldName: string;
	public readonly deductedQuantityFieldName: string;
	public readonly defaultDateReservation: string | null;
	public readonly isBlocked: boolean;
	public readonly isInventoryManagementToolEnabled: boolean;
	public readonly inventoryManagementMode: string;

	constructor(options: CrmEntityProductListReserveControlOptions)
	{
		this.row = options.row;
		this.inputFieldName = options.inputName || ReserveControl.INPUT_NAME;
		this.viewName = ReserveControl.VIEW_NAME;
		this.dateFieldName = options.dateFieldName || ReserveControl.DATE_NAME;
		this.quantityFieldName = options.quantityFieldName || ReserveControl.QUANTITY_NAME;
		this.deductedQuantityFieldName = options.deductedQuantityFieldName || ReserveControl.DEDUCTED_QUANTITY_NAME;
		this.defaultDateReservation = options.defaultDateReservation || null;
		this.isBlocked = options.isBlocked || false;
		this.isInventoryManagementToolEnabled = options.isInventoryManagementToolEnabled || false;
		this.inventoryManagementMode = options.inventoryManagementMode || '';
		this.measureName = options.measureName;

		this.isReserveEqualProductQuantity =
			!!options.isReserveEqualProductQuantity
			&& (
				this.getReservedQuantity() === this.getQuantity()
				|| this.row.isNewRow()
			)
		;
	}

	public renderTo(node: HTMLElement): void
	{
		this.wrapper = node;

		Dom.append(Tag.render`<div>${this.getReserveInputNode()}</div>`, this.wrapper);
		EventBinder.bind(this.getReserveInputNode().querySelector('input')!, 'input', Runtime.debounce(this.onReserveInputChange, 800, this) as (event: Event) => void);

		if (!this.isInventoryManagementMode1C())
		{
			if (this.getReservedQuantity() > 0 || this.isReserveEqualProductQuantity)
			{
				this.layoutDateReservation(this.getDateReservation());
			}

			Dom.append(this.getDateNode(), this.wrapper);

			EventBinder.bind(this.getDateNode(), 'click', ReserveControl.onDateInputClick.bind(this));
			EventBinder.bind(this.getDateNode().querySelector('button')!, 'keydown', ReserveControl.onDateInputKeyDown.bind(this));
			EventBinder.bind(this.getDateNode().querySelector('input')!, 'change', this.onDateChange.bind(this));
		}
	}

	public setReservedQuantity(value: number, isTriggerEvent?: boolean | null): void
	{
		const input = this.getReserveInputNode().querySelector('input');
		if (input)
		{
			input.value = String(value);

			if (isTriggerEvent)
			{
				input.dispatchEvent(new window.Event('input'));
			}
		}
	}

	public getReservedQuantity(): number
	{
		return Text.toNumber(this.row.getField(this.inputFieldName));
	}

	public getDateReservation(): string
	{
		return this.row.getField(this.dateFieldName) || '';
	}

	public getQuantity(): number
	{
		return Text.toNumber(this.row.getField(this.quantityFieldName));
	}

	public getDeductedQuantity(): number
	{
		return Text.toNumber(this.row.getField(this.deductedQuantityFieldName));
	}

	public getAvailableQuantity(): number
	{
		return this.getQuantity() - this.getDeductedQuantity();
	}

	public onReserveInputChange(event: Event): void
	{
		const value = Text.toNumber((event.target as HTMLInputElement).value);

		this.changeInputValue(value);
	}

	public changeInputValue(rawValue: number): void
	{
		let value = rawValue;
		if (value > this.getAvailableQuantity())
		{
			this.showNotify('reserveCountError', 'CRM_ENTITY_PL_IS_LESS_QUANTITY_WITH_DEDUCTED_THEN_RESERVED');

			value = this.getAvailableQuantity();
			this.setReservedQuantity(value);
		}
		else if (value < 0)
		{
			this.showNotify('reserveNegativeCountError', 'CRM_ENTITY_PL_IS_NEGATIVE_INPUT_RESERVE');

			value = 0;
			this.setReservedQuantity(value);
		}

		if (value > 0)
		{
			const dateReservation = this.getDateReservation();
			if (dateReservation === '')
			{
				this.changeDateReservation(this.defaultDateReservation ?? '');
			}
			else
			{
				this.layoutDateReservation(dateReservation);
			}
		}
		else if (value <= 0)
		{
			this.changeDateReservation();
		}

		this.setReservedQuantity(value, false);
		this.row.updateField(this.inputFieldName, value);
	}

	public clearCache(): void
	{
		this.cache.delete('dateInput');
		this.cache.delete('reserveInput');
	}

	public isInputDisabled(): boolean
	{
		if (
			this.isBlocked
			|| !this.isInventoryManagementToolEnabled
		)
		{
			return true;
		}

		const model = this.row.getModel();
		if (model)
		{
			return model.isSimple() || model.isService();
		}

		return false;
	}

	private static onDateInputClick(event: Event): void
	{
		const target = event.target as HTMLElement;
		// BX.calendar returns the JCCalendar singleton; its popup is a BX.PopupWindow created
		// with focusTrap:false and bSetFocus that only blurs the button, so focus never enters
		// the calendar. Move focus into the popup on open and restore it to the date button on
		// any close (date pick / Esc / outside click).
		const cal = BX.calendar({
			node: target,
			field: target.parentNode!.querySelector('input'),
			bTime: false,
		});

		const container = cal?.popup?.getPopupContainer?.();
		if (container)
		{
			FocusNavigator.focusFirst(container);
		}

		cal?.popup?.subscribeOnce?.('onPopupClose', () => {
			FocusNavigator.focusTarget(target);
		});
	}

	private static onDateInputKeyDown(event: KeyboardEvent): void
	{
		if (event.key !== 'Enter')
		{
			// Space keeps the native button activation (click on keyup) - no handling needed.
			return;
		}

		// The grid intercepts Enter on a bubbling ancestor and preventDefault()'s the native
		// button activation. Stop propagation so the interceptor never runs, and open the
		// calendar via the same path as click. Space is left to native activation.
		event.preventDefault();
		event.stopPropagation();
		ReserveControl.onDateInputClick(event);
	}

	public onDateChange(event: Event): void
	{
		const value = (event.target as HTMLInputElement).value;
		const newDate = BX.parseDate(value);
		const current = new Date();
		current.setHours(0, 0, 0, 0);
		if (newDate >= current)
		{
			this.changeDateReservation(value);
		}
		else
		{
			this.showNotify('reserveDateError', 'CRM_ENTITY_PL_DATE_IN_PAST');

			this.changeDateReservation(this.defaultDateReservation ?? '');
		}
	}

	private getDateNode(): HTMLElement
	{
		return this.cache.remember('dateInput', () => {
			return Tag.render`
				<div>
					<button type="button" class="crm-entity-product-list-reserve-date" hidden></button>
					<input
						data-name="${this.dateFieldName}"
						name="${this.dateFieldName}"
						type="hidden"
						value="${this.getDateReservation()}"
					>
				</div>
			`;
		}) as HTMLElement;
	}

	private getReserveInputNode(): HTMLElement
	{
		return this.cache.remember('reserveInput', () => {
			const viewReserveNode =
				this.isInventoryManagementMode1C()
					? Tag.render`
						<span>
							<span data-name="${this.viewName}">
								${this.getReservedQuantity()}
							</span>
							&nbsp;
							${Text.encode(this.row.getMeasureName())}
						</span>
					`
					: null
			;

			const tag = Tag.render`
				<div ${this.isInputDisabled() ? 'class="crm-entity-product-list-locked-field-wrapper"' : ''}>
					${viewReserveNode}
					<input type="${this.isInventoryManagementMode1C() ? 'hidden' : 'text'}"
						data-name="${this.inputFieldName}"
						name="${this.inputFieldName}"
						class="ui-ctl-element ui-ctl-textbox ${this.isInputDisabled() ? 'crm-entity-product-list-locked-field' : ''}"
						autoComplete="off"
						value="${this.getReservedQuantity()}"
						placeholder="0"
						title="${this.getReservedQuantity()}"
						${this.isInputDisabled() ? 'disabled' : ''}
					/>
				</div>
			`;
			if (this.isBlocked || !this.isInventoryManagementToolEnabled)
			{
				tag.onclick = () => EventEmitter.emit(this, 'onNodeClick');
			}

			return tag;
		}) as HTMLElement;
	}

	public changeDateReservation(date: string = ''): void
	{
		if (date !== this.getDateReservation())
		{
			this.row.updateField(this.dateFieldName, date);
		}

		this.layoutDateReservation(date);
	}

	private layoutDateReservation(date: string = ''): void
	{
		const linkText =
			(date === '')
				? ''
				: (Loc.getMessage(
					'CRM_ENTITY_PL_RESERVED_DATE',
					{
						'#FINAL_RESERVATION_DATE#': date,
					},
				) ?? '')
		;
		const link = this.getDateNode().querySelector('button');
		if (link)
		{
			link.innerText = linkText;
			link.hidden = (linkText === '');
		}

		const hiddenInput = this.getDateNode().querySelector('input');
		if (hiddenInput)
		{
			hiddenInput.value = date;
		}
	}

	public disable(wrapper?: Element | null): void
	{
		const node = wrapper || this.wrapper;
		if (node)
		{
			node.innerHTML = this.getReservedQuantity() + ' ' + Text.encode(this.measureName ?? '');
		}
	}

	private isInventoryManagementMode1C(): boolean
	{
		return this.inventoryManagementMode === ModeList.MODE_1C;
	}

	private showNotify(notifyId: string, messageId: string): void
	{
		let notify = BX.UI.Notification.Center.getBalloonById(notifyId);
		if (!notify)
		{
			const notificationOptions = {
				id: notifyId,
				closeButton: true,
				autoHideDelay: 3000,
				content: Tag.render`<div>${Loc.getMessage(messageId)}</div>`,
			};

			notify = BX.UI.Notification.Center.notify(notificationOptions);
		}

		notify.show();
	}
}
