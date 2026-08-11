import { Dom, Tag, Event, Text, Loc } from 'main.core';
import { Menu, MenuManager, type MenuItemOptions } from 'main.popup';
import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { CollapsibleCard } from '../card/collapsible-card';
import { CardHint } from '../card/card-hint';
import { SettingsApi } from '../api/settings-api';
import { type PeriodFilterData, type CardConstructorOptions } from '../types';
import './period-filter-card.css';

declare const BX: any;

const RANGE_VALUE = 'range';
const SAVE_DEBOUNCE_MS = 500;

export class PeriodFilterCard
{
	#card: CollapsibleCard;
	#data: PeriodFilterData;
	#componentName: string;
	#signedParameters: string;

	#fieldElement: HTMLElement | null = null;
	#fieldValueElement: HTMLElement | null = null;
	#menu: Menu | null = null;
	#rangeBlock: HTMLElement | null = null;
	#startInput: HTMLInputElement | null = null;
	#endInput: HTMLInputElement | null = null;
	#contentContainer: HTMLElement | null = null;
	#currentPeriod: string;
	#datePicker: DatePicker | null = null;
	#saveTimerId: number | null = null;

	constructor(
		data: PeriodFilterData,
		componentName: string,
		signedParameters: string,
		options: CardConstructorOptions = {},
	)
	{
		this.#data = data;
		this.#currentPeriod = data.currentPeriod;
		this.#componentName = componentName;
		this.#signedParameters = signedParameters;

		this.#card = new CollapsibleCard({
			id: 'period-filter',
			title: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_PERIOD_TITLE') ?? '',
			iconClass: '--o-calendar-with-slots',
			collapsed: options.collapsed,
		});
	}

	getLayout(): HTMLElement
	{
		const layout = this.#card.getLayout();
		this.#contentContainer = this.#card.getContentContainer();

		const hint = new CardHint({
			text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_PERIOD_HINT') ?? '',
			link: {
				text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LINK_MORE') ?? '',
				helpCode: '20337242',
			},
		});
		Dom.append(hint.getLayout(), this.#contentContainer);

		this.#buildSelect();
		this.#buildRangeFields();

		return layout;
	}

	#buildSelect(): void
	{
		this.#fieldValueElement = Tag.render`
			<span class="biconnector-settings-period__select-text"></span>
		`;
		this.#updateFieldLabel();

		const control: HTMLElement = Tag.render`
			<div class="biconnector-settings-period__select" tabindex="0">
				${this.#fieldValueElement}
			</div>
		`;

		this.#fieldElement = Tag.render`
			<div class="biconnector-settings-period__select-wrapper">
				${control}
				<div class="ui-icon-set --chevron-down-s biconnector-settings-period__select-arrow"></div>
			</div>
		`;

		Event.bind(this.#fieldElement!, 'click', () => {
			this.#toggleMenu();
		});

		Event.bind(control, 'keydown', (event: KeyboardEvent) => {
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				this.#toggleMenu();
			}
		});

		Dom.append(this.#fieldElement, this.#contentContainer);
	}

	#updateFieldLabel(): void
	{
		if (!this.#fieldValueElement)
		{
			return;
		}

		const current = this.#data.items.find((item) => item.value === this.#currentPeriod);
		if (!current)
		{
			this.#fieldValueElement.textContent = '';

			return;
		}

		if (current.isHtml)
		{
			this.#fieldValueElement.innerHTML = current.name;
		}
		else
		{
			this.#fieldValueElement.textContent = current.name;
		}
	}

	#toggleMenu(): void
	{
		if (this.#menu && this.#menu.getPopupWindow().isShown())
		{
			this.#menu.close();

			return;
		}

		this.#openMenu();
	}

	#openMenu(): void
	{
		if (this.#menu)
		{
			this.#menu.destroy();
			this.#menu = null;
		}

		const items: MenuItemOptions[] = this.#data.items.map((item) => {
			const itemOptions: MenuItemOptions = {
				attrs: {},
				className: item.value === this.#currentPeriod
					? 'menu-popup-no-icon biconnector-settings-period__menu-item --selected'
					: 'menu-popup-no-icon biconnector-settings-period__menu-item',
				onclick: (): {} => {
					this.#selectPeriod(item.value);
					this.#menu?.close();

					return {};
				},
			};

			if (item.isHtml)
			{
				itemOptions.html = item.name;
			}
			else
			{
				itemOptions.text = item.name;
			}

			return itemOptions;
		});

		const menu = MenuManager.create({
			id: `biconnector-settings-period-menu-${this.#componentName}`,
			bindElement: this.#fieldElement,
			items,
			minWidth: this.#fieldElement ? this.#fieldElement.offsetWidth : 0,
			closeByEsc: true,
			angle: false,
			cacheable: false,
			navigationOptions: { initialFocusPosition: 'first' },
		});

		this.#menu = menu;
		menu.show();
	}

	#selectPeriod(value: string): void
	{
		if (value === this.#currentPeriod)
		{
			return;
		}

		this.#currentPeriod = value;
		this.#updateFieldLabel();
		this.#toggleRange();
		this.#scheduleSave();
	}

	#buildRangeFields(): void
	{
		this.#startInput = Tag.render`
			<input
				type="text"
				class="biconnector-settings-period__date-input"
				value="${Text.encode(this.#data.dateStart)}"
			>
		`;
		this.#endInput = Tag.render`
			<input
				type="text"
				class="biconnector-settings-period__date-input"
				value="${Text.encode(this.#data.dateEnd)}"
			>
		`;

		const initialDates: string[] = [];
		if (this.#data.dateStart)
		{
			initialDates.push(this.#data.dateStart);
		}
		if (this.#data.dateEnd)
		{
			initialDates.push(this.#data.dateEnd);
		}

		this.#datePicker = new DatePicker({
			targetNode: this.#startInput!,
			selectionMode: 'range',
			rangeStartInput: this.#startInput!,
			rangeEndInput: this.#endInput!,
			selectedDates: initialDates,
		});

		Event.bind(this.#startInput!, 'click', () => {
			this.#datePicker!.setTargetNode(this.#startInput!);
			this.#datePicker!.show();
		});
		Event.bind(this.#endInput!, 'click', () => {
			this.#datePicker!.setTargetNode(this.#endInput!);
			this.#datePicker!.show();
		});

		this.#datePicker.subscribe(DatePickerEvent.BEFORE_DAY_SELECT, (event: any) => {
			const picker = this.#datePicker;
			if (!picker)
			{
				return;
			}

			if (picker.getSelectedDates().length === 2)
			{
				event.preventDefault();
				picker.deselectAll();
				picker.selectRange(event.getData().date);
			}
		});

		this.#datePicker.subscribe(DatePickerEvent.SELECT_CHANGE, () => {
			if (this.#datePicker!.getSelectedDates().length === 2)
			{
				this.#datePicker!.hide();
				this.#scheduleSave();
			}
		});

		this.#rangeBlock = Tag.render`
			<div class="biconnector-settings-period__range">
				<div class="biconnector-settings-period__range-field">
					<div class="biconnector-settings-period__range-label">
						${Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_PERIOD_FROM') ?? ''}
					</div>
					<div class="biconnector-settings-period__date-wrapper">
						<div class="ui-icon-set --o-calendar-empty biconnector-settings-period__date-icon"></div>
						${this.#startInput}
					</div>
				</div>
				<div class="biconnector-settings-period__range-divider"></div>
				<div class="biconnector-settings-period__range-field">
					<div class="biconnector-settings-period__range-label">
						${Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_PERIOD_TO') ?? ''}
					</div>
					<div class="biconnector-settings-period__date-wrapper">
						<div class="ui-icon-set --o-calendar-empty biconnector-settings-period__date-icon"></div>
						${this.#endInput}
					</div>
				</div>
			</div>
		`;

		Dom.append(this.#rangeBlock, this.#contentContainer);
		this.#toggleRange();
	}

	#toggleRange(): void
	{
		if (!this.#rangeBlock)
		{
			return;
		}

		if (this.#currentPeriod === RANGE_VALUE)
		{
			Dom.removeClass(this.#rangeBlock, '--hidden');
		}
		else
		{
			Dom.addClass(this.#rangeBlock, '--hidden');
		}
	}

	#scheduleSave(): void
	{
		if (this.#saveTimerId !== null)
		{
			window.clearTimeout(this.#saveTimerId);
		}

		this.#saveTimerId = window.setTimeout(() => {
			this.#saveTimerId = null;
			void this.#save();
		}, SAVE_DEBOUNCE_MS);
	}

	async #save(): Promise<void>
	{
		const data: Record<string, string> = {
			FILTER_PERIOD: this.#currentPeriod,
		};

		if (this.#currentPeriod === RANGE_VALUE)
		{
			const startFieldName = this.#data.dateStartFieldName ?? 'DATE_FILTER_START';
			const endFieldName = this.#data.dateEndFieldName ?? 'DATE_FILTER_END';
			data[startFieldName] = this.#startInput?.value ?? '';
			data[endFieldName] = this.#endInput?.value ?? '';
		}

		try
		{
			await SettingsApi.savePeriodFilter(
				this.#componentName,
				this.#signedParameters,
				data,
			);
			BX.UI?.SidePanel?.Wrapper?.reloadGridOnParentPage?.();
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_PERIOD_SAVED'),
				autoHideDelay: 2000,
			});
		}
		catch
		{
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_SAVE_ERROR'),
				autoHideDelay: 2000,
			});
		}
	}
}
