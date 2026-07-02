import { Dom, Event, Loc, Reflection, Tag, Type } from 'main.core';

type PeriodItem = {
	value: string,
	name: string,
	isDefault?: boolean,
	prefixText?: string,
	valueText?: string,
	suffixText?: string,
};

type DefaultValues = {
	filterPeriod: string,
	dateFilterStart: string,
	dateFilterEnd: string,
};

type PeriodFieldOptions = {
	periodList: PeriodItem[],
	defaultValues: DefaultValues,
};

export class PeriodField
{
	static PERIOD_DEFAULT = 'default';
	static PERIOD_RANGE = 'range';
	static PERIOD_MENU_ID = 'dashboard-filter-period-menu';

	#periodList: PeriodItem[];
	#defaultValues: DefaultValues;
	#periodFieldNode: ?HTMLInputElement;
	#periodSelectorNode: ?HTMLElement;
	#periodSelectorContainerNode: ?HTMLElement;
	#dateFilterStartFieldNode: ?HTMLInputElement;
	#dateFilterEndFieldNode: ?HTMLInputElement;
	#dateRangeContainerNode: ?HTMLElement;
	#isMenuOpened: boolean;

	constructor(options: PeriodFieldOptions)
	{
		this.#periodList = Type.isArray(options?.periodList) ? options.periodList : [];
		this.#defaultValues = Type.isPlainObject(options?.defaultValues) ? options.defaultValues : {};
		this.#periodFieldNode = null;
		this.#periodSelectorNode = null;
		this.#periodSelectorContainerNode = null;
		this.#dateFilterStartFieldNode = null;
		this.#dateFilterEndFieldNode = null;
		this.#dateRangeContainerNode = null;
		this.#isMenuOpened = false;
	}

	render(): HTMLElement
	{
		const selectedPeriodItem = this.#getSelectedPeriodItem();

		return Tag.render`
			<div>
				<div class="dashboard-params-title-container">
					<div class="dashboard-params-title">
						${Loc.getMessage('DASHBOARD_EDIT_PERIOD')}
					</div>
				</div>
				<input
					type="hidden"
					id="dashboard-filter-period-field"
				>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100 dashboard-period-wrapper"
					id="dashboard-filter-period-selector-container"
				>
					<div class="ui-ctl-element" id="dashboard-filter-period-selector">
						${this.#renderSelectedPeriodContent(selectedPeriodItem)}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
				<div class="dashboard-period-range" id="dashboard-period-range">
					<div class="dashboard-period-range-item">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">${Loc.getMessage('DASHBOARD_EDIT_PERIOD_FROM')}</div>
						</div>
						<div class="ui-ctl ui-ctl-before-icon ui-ctl-datetime ui-ctl-w100">
							<div class="ui-ctl-before ui-ctl-icon-calendar"></div>
							<input
								type="text"
								class="ui-ctl-element"
								id="dashboard-filter-period-start"
							>
						</div>
					</div>
					<div class="dashboard-period-range-item">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">${Loc.getMessage('DASHBOARD_EDIT_PERIOD_TO')}</div>
						</div>
						<div class="ui-ctl ui-ctl-before-icon ui-ctl-datetime ui-ctl-w100">
							<div class="ui-ctl-before ui-ctl-icon-calendar"></div>
							<input
								type="text"
								class="ui-ctl-element"
								id="dashboard-filter-period-end"
							>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	bind(rootNode: HTMLElement): void
	{
		if (!Type.isDomNode(rootNode))
		{
			return;
		}

		this.#periodFieldNode = rootNode.querySelector('#dashboard-filter-period-field');
		this.#periodSelectorNode = rootNode.querySelector('#dashboard-filter-period-selector');
		this.#periodSelectorContainerNode = rootNode.querySelector('#dashboard-filter-period-selector-container');
		this.#dateFilterStartFieldNode = rootNode.querySelector('#dashboard-filter-period-start');
		this.#dateFilterEndFieldNode = rootNode.querySelector('#dashboard-filter-period-end');
		this.#dateRangeContainerNode = rootNode.querySelector('#dashboard-period-range');
		this.#setDefaultInputValues();

		if (Type.isDomNode(this.#periodSelectorContainerNode))
		{
			Event.bind(this.#periodSelectorContainerNode, 'click', this.#toggleMenu.bind(this));
		}

		if (Type.isDomNode(this.#dateFilterStartFieldNode))
		{
			Event.bind(this.#dateFilterStartFieldNode, 'click', () => {
				PeriodField.showCalendar(this.#dateFilterStartFieldNode);
			});
		}

		if (Type.isDomNode(this.#dateFilterEndFieldNode))
		{
			Event.bind(this.#dateFilterEndFieldNode, 'click', () => {
				PeriodField.showCalendar(this.#dateFilterEndFieldNode);
			});
		}

		this.#toggleRangeFields();
	}

	#setDefaultInputValues(): void
	{
		const selectedPeriodItem = this.#getSelectedPeriodItem();
		if (Type.isDomNode(this.#periodFieldNode))
		{
			this.#periodFieldNode.value = selectedPeriodItem?.value ?? PeriodField.PERIOD_DEFAULT;
		}

		if (Type.isDomNode(this.#dateFilterStartFieldNode))
		{
			this.#dateFilterStartFieldNode.value = this.#getDefaultDateFilterStart();
		}

		if (Type.isDomNode(this.#dateFilterEndFieldNode))
		{
			this.#dateFilterEndFieldNode.value = this.#getDefaultDateFilterEnd();
		}
	}

	getValue(): { filterPeriod: string, dateFilterStart: string, dateFilterEnd: string }
	{
		return {
			filterPeriod: this.#periodFieldNode?.value ?? PeriodField.PERIOD_DEFAULT,
			dateFilterStart: this.#dateFilterStartFieldNode?.value ?? '',
			dateFilterEnd: this.#dateFilterEndFieldNode?.value ?? '',
		};
	}

	#getSelectedPeriodItem(value: ?string = null): ?PeriodItem
	{
		const selectedValue = Type.isStringFilled(value) ? value : this.#getDefaultFilterPeriod();

		return this.#periodList.find((item) => item.value === selectedValue) ?? this.#periodList[0] ?? null;
	}

	#getDefaultFilterPeriod(): string
	{
		const period = this.#defaultValues?.filterPeriod;
		if (!Type.isStringFilled(period))
		{
			return PeriodField.PERIOD_DEFAULT;
		}

		return period;
	}

	#getDefaultDateFilterStart(): string
	{
		const dateStart = this.#defaultValues?.dateFilterStart;
		if (!Type.isStringFilled(dateStart))
		{
			return '';
		}

		return dateStart;
	}

	#getDefaultDateFilterEnd(): string
	{
		const dateEnd = this.#defaultValues?.dateFilterEnd;
		if (!Type.isStringFilled(dateEnd))
		{
			return '';
		}

		return dateEnd;
	}

	#toggleMenu(): void
	{
		if (this.#isMenuOpened)
		{
			this.#closeMenu();

			return;
		}

		this.#openMenu();
	}

	#openMenu(): void
	{
		if (!Type.isDomNode(this.#periodSelectorContainerNode) || this.#periodList.length === 0)
		{
			return;
		}

		const menuItems = this.#periodList.map((item) => {
			const menuItem = {
				text: item.name,
				value: item.value,
				onclick: () => {
					this.#selectPeriod(item.value);
				},
			};

			if (item?.isDefault === true)
			{
				return {
					...menuItem,
					html: this.#renderSelectedPeriodContent(item),
				};
			}

			return menuItem;
		});

		const selectorPositionY = BX.Dom.getPosition(this.#periodSelectorContainerNode).y;
		const distanceToTop = selectorPositionY - window.pageYOffset;
		const distanceToBottom = document.documentElement.clientHeight + window.pageYOffset - selectorPositionY;
		const popupMaxHeight = distanceToTop > distanceToBottom ? distanceToTop - 50 : distanceToBottom - 100;

		BX.PopupMenu.show(
			PeriodField.PERIOD_MENU_ID,
			this.#periodSelectorContainerNode,
			menuItems,
			{
				angle: false,
				width: `${this.#periodSelectorContainerNode.offsetWidth}px`,
				maxHeight: popupMaxHeight,
				events: {
					onPopupShow: this.#onMenuShow.bind(this),
					onPopupClose: this.#onMenuClose.bind(this),
				},
			},
		);

		if (BX.PopupMenu.currentItem && BX.PopupMenu.currentItem.popupWindow)
		{
			BX.PopupMenu.currentItem.popupWindow.setWidth(BX.pos(this.#periodSelectorContainerNode).width);
		}
	}

	#closeMenu(): void
	{
		const menu = BX.PopupMenu.getMenuById(PeriodField.PERIOD_MENU_ID);
		if (menu)
		{
			menu.popupWindow.close();
		}
	}

	#onMenuShow(): void
	{
		if (Type.isDomNode(this.#periodSelectorContainerNode))
		{
			Dom.addClass(this.#periodSelectorContainerNode, 'ui-ctl-active');
		}

		this.#isMenuOpened = true;
	}

	#onMenuClose(): void
	{
		BX.PopupMenu.destroy(PeriodField.PERIOD_MENU_ID);

		if (Type.isDomNode(this.#periodSelectorContainerNode))
		{
			Dom.removeClass(this.#periodSelectorContainerNode, 'ui-ctl-active');
		}

		this.#isMenuOpened = false;
	}

	#selectPeriod(value: string): void
	{
		if (Type.isDomNode(this.#periodFieldNode))
		{
			this.#periodFieldNode.value = value;
		}

		const selectedPeriodItem = this.#getSelectedPeriodItem(value);
		if (Type.isDomNode(this.#periodSelectorNode))
		{
			Dom.clean(this.#periodSelectorNode);
			Dom.append(this.#renderSelectedPeriodContent(selectedPeriodItem), this.#periodSelectorNode);
		}

		this.#toggleRangeFields();
		this.#closeMenu();
	}

	#toggleRangeFields(): void
	{
		if (!Type.isDomNode(this.#dateRangeContainerNode))
		{
			return;
		}

		const isRangePeriod = this.#periodFieldNode?.value === PeriodField.PERIOD_RANGE;
		Dom.style(this.#dateRangeContainerNode, 'display', isRangePeriod ? 'flex' : 'none');
	}

	#renderSelectedPeriodContent(selectedPeriodItem: ?PeriodItem): HTMLElement
	{
		const container = document.createElement('span');

		if (selectedPeriodItem?.isDefault !== true || !Type.isStringFilled(selectedPeriodItem?.valueText))
		{
			container.textContent = selectedPeriodItem?.name ?? '';

			return container;
		}

		const prefixNode = document.createElement('span');
		prefixNode.textContent = selectedPeriodItem?.prefixText ?? '';

		const valueNode = document.createElement('span');
		valueNode.className = 'ui-color-light';
		valueNode.textContent = selectedPeriodItem.valueText;

		const suffixNode = document.createElement('span');
		suffixNode.textContent = selectedPeriodItem?.suffixText ?? '';

		Dom.append(prefixNode, container);
		Dom.append(valueNode, container);
		Dom.append(suffixNode, container);

		return container;
	}

	static showCalendar(input: ?HTMLElement): void
	{
		const showCalendar = Reflection.getClass('BX.calendar');
		if (!Type.isDomNode(input) || !Type.isFunction(showCalendar))
		{
			return;
		}

		const getCalendar = Reflection.getClass('BX.calendar.get');
		if (Type.isFunction(getCalendar))
		{
			getCalendar().Close();
		}

		showCalendar({ node: input, field: input, bTime: false, bSetFocus: false });
	}
}
