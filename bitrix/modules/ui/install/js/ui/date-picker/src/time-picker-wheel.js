import { Dom, Loc, Tag } from 'main.core';
import { type BaseCache, MemoryCache } from 'main.core.cache';
import { DateTimeFormat } from 'main.date';

import { type DatePicker } from './date-picker';
import { DatePickerEvent } from './date-picker-event';
import { createUtcDate } from './helpers/index.js';
import {
	TimePickerBase,
	type TimePickerHour,
	type TimePickerMeridiem,
	type TimePickerMinute,
} from './time-picker-base';

import './css/time-picker.css';

export class TimePickerWheel extends TimePickerBase
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#focusSelectorId: string = null;
	#scrollEndTimeouts: Map<string, number> = new Map();
	#scrollingSelectorIds: Set<string> = new Set();
	#adjustedScrollTops: Map<string, number> = new Map();
	#destroyed: boolean = false;

	constructor(datePicker: DatePicker)
	{
		super(datePicker);

		datePicker.subscribe('onShow', this.#handleDatePickerShow.bind(this));
		datePicker.subscribe('onHide', this.#cancelPendingScrolls.bind(this));
		datePicker.subscribe(DatePickerEvent.DESTROY, this.#handleDatePickerDestroy.bind(this));
	}

	getContainer(): HTMLElement
	{
		return this.#refs.remember('container', () => {
			return Tag.render`
				<div class="ui-time-picker" role="none">
					${
						this.getDatePicker().getType() === 'time'
							? null
							: this.getHeaderContainer(this.getPrevBtn(), this.getHeaderTitle())
					}
					<div class="ui-time-picker-content" role="none">
						${this.getTimeHighlighter()}
						<div
							class="ui-time-picker-selector"
							role="none"
							data-selector-id="hour"
							onmouseenter="${this.#handleSelectorMouseEnter.bind(this)}"
						>
							<div 
								class="ui-time-picker-selector-title" 
								id="${this.getSelectorId('hours')}"
							>${Loc.getMessage('UI_DATE_PICKER_HOURS')}</div>
							<div class="ui-time-picker-viewport" role="none">
								<div class="ui-time-picker-scroll-container"
									tabindex="0"
									role="listbox"
									aria-labelledby="${this.getSelectorId('hours')}"
									onscroll="${this.#handleSelectorScroll.bind(this)}"
									onfocus="${this.#handleFocus.bind(this)}"
								>
									${this.getHoursContainer()}
								</div>
							</div>
						</div>
						<div class="ui-time-picker-time-separator" aria-hidden="true"></div>
						<div
							class="ui-time-picker-selector"
							role="none"
							data-selector-id="minute"
							onmouseenter="${this.#handleSelectorMouseEnter.bind(this)}"
						>
							<div 
								class="ui-time-picker-selector-title" 
								id="${this.getSelectorId('minutes')}"
							>${Loc.getMessage('UI_DATE_PICKER_MINUTES')}</div>
							<div class="ui-time-picker-viewport" role="none">
								<div class="ui-time-picker-scroll-container"
									tabindex="0"
									role="listbox"
									aria-labelledby="${this.getSelectorId('minutes')}"
									onscroll="${this.#handleSelectorScroll.bind(this)}"
									onfocus="${this.#handleFocus.bind(this)}"
								>
									${this.getMinutesContainer()}
								</div>
							</div>
						</div>
						${
							this.getDatePicker().isAmPmMode()
								? Tag.render`
									<div
										class="ui-time-picker-selector"
										role="none"
										onmouseenter="${this.#handleSelectorMouseEnter.bind(this)}"
										data-selector-id="meridiem"
									>
										<div 
											class="ui-time-picker-selector-title" 
											id="${this.getSelectorId('meridiem')}"
										>AM/PM</div>
										<div class="ui-time-picker-viewport" role="none">
											<div class="ui-time-picker-scroll-container"
												tabindex="0"
												role="listbox"
												aria-labelledby="${this.getSelectorId('meridiem')}"
												onscroll="${this.#handleSelectorScroll.bind(this)}"
												onfocus="${this.#handleFocus.bind(this)}"
											>
												${this.getMeridiemsContainer()}
											</div>
										</div>
									</div>
								`
								: null
						}
					</div>
				</div>
			`;
		});
	}

	getHeaderTitle(): HTMLElement
	{
		return this.#refs.remember('header-title', () => {
			return Tag.render`
				<div class="ui-time-picker-header-title" onclick="${this.#handleTitleClick.bind(this)}"></div>
			`;
		});
	}

	getHoursContainer(): HTMLElement
	{
		return this.#refs.remember('hours', () => {
			return Tag.render`
				<div 
					class="ui-time-picker-list-container"
					role="none"
					onclick="${this.#handleItemClick.bind(this)}"
				></div>
			`;
		});
	}

	getMinutesContainer(): HTMLElement
	{
		return this.#refs.remember('minutes', () => {
			return Tag.render`
				<div 
					class="ui-time-picker-list-container" 
					onclick="${this.#handleItemClick.bind(this)}"
				></div>
			`;
		});
	}

	getMeridiemsContainer(): HTMLElement
	{
		return this.#refs.remember('meridiems', () => {
			return Tag.render`
				<div 
					class="ui-time-picker-list-container" 
					onclick="${this.#handleItemClick.bind(this)}"
				></div>
			`;
		});
	}

	getSelectorId(id: string): string
	{
		return `${this.getDatePicker().getId()}-time-selector${id}`;
	}

	getTimeHighlighter(): HTMLElement
	{
		return this.#refs.remember('time-highlighter', () => {
			return Tag.render`<div class="ui-time-picker-time-highlighter" aria-hidden="true"></div>`;
		});
	}

	onHide()
	{
		super.onHide();
		this.#cancelPendingScrolls();
	}

	onShow()
	{
		super.onShow();
		this.focusSelector('hour', !this.getDatePicker().isInline());
	}

	renderTo(container: HTMLElement)
	{
		super.renderTo(container);

		this.#adjustScrollHeight(this.getHoursContainer());
		this.#adjustScrollHeight(this.getMinutesContainer());
		if (this.getDatePicker().isAmPmMode())
		{
			this.#adjustScrollHeight(this.getMeridiemsContainer());
		}
	}

	render(): void
	{
		super.render();

		let selectedHourIndex = 0;
		this.getHours().forEach((hour: TimePickerHour) => {
			if (hour.selected)
			{
				selectedHourIndex = hour.index;
			}

			this.#renderHour(hour);
		});

		this.#restoreScrollPosition(this.getHoursContainer(), selectedHourIndex);

		let selectedMinuteIndex = 0;
		this.getMinutes().forEach((minute: TimePickerMinute) => {
			if (minute.selected)
			{
				selectedMinuteIndex = minute.index;
			}

			this.#renderMinute(minute);
		});

		this.#restoreScrollPosition(this.getMinutesContainer(), selectedMinuteIndex);

		const picker = this.getDatePicker();
		if (picker.isAmPmMode())
		{
			let selectedMeridiemIndex = 0;
			this.getMeridiems().forEach((meridiem: TimePickerMeridiem) => {
				if (meridiem.selected)
				{
					selectedMeridiemIndex = meridiem.index;
				}

				this.#renderMeridiem(meridiem);
			});

			this.#restoreScrollPosition(this.getMeridiemsContainer(), selectedMeridiemIndex);
		}
	}

	getItemHeight(): number
	{
		return 30;
	}

	focusSelector(id: string, changePageFocus: boolean = true)
	{
		if (this.#focusSelectorId === id)
		{
			return;
		}

		if (this.#focusSelectorId !== null)
		{
			const currentSelector = (
				this.getContainer().querySelector(`[data-selector-id="${this.#focusSelectorId}"]`)
			);

			Dom.removeClass(currentSelector, '--focused');
		}

		this.#focusSelectorId = id;

		const newSelector: HTMLElement = this.getContainer().querySelector(`[data-selector-id="${id}"]`);
		const scrollContainer: HTMLElement = newSelector.querySelector('[tabindex]:not([tabindex="-1"])');

		Dom.addClass(newSelector, '--focused');

		if (changePageFocus)
		{
			scrollContainer.focus({ preventScroll: true });
		}
	}

	#renderHour(hour: TimePickerHour): void
	{
		const div = this.#refs.remember(`hour-${hour.value}`, () => {
			const label = DateTimeFormat.format(
				DateTimeFormat.getFormat('SHORT_TIME_FORMAT'),
				createUtcDate(1970, 0, 1, hour.value),
				null,
				true,
			);

			const hourContainer = Tag.render`
				<div
					class="ui-time-picker-list-item"
					role="option"
					aria-label="${label}"
					data-index="${hour.index}"
					data-value="${hour.value}"
				>${hour.name}</div>
			`;

			Dom.append(hourContainer, this.getHoursContainer());

			return hourContainer;
		});

		if (hour.selected)
		{
			Dom.addClass(div, '--selected');
		}
		else
		{
			Dom.removeClass(div, '--selected');
		}

		div.setAttribute('aria-selected', hour.selected ? 'true' : 'false');
	}

	#renderMinute(minute: TimePickerMinute): void
	{
		const div = this.#refs.remember(`minute-${minute.value}`, () => {
			const label = DateTimeFormat.format(
				'idiff',
				createUtcDate(1970, 0, 1, 0, 0),
				createUtcDate(1970, 0, 1, 0, minute.value),
				true,
			);

			const minuteContainer = Tag.render`
				<div
					class="ui-time-picker-list-item"
					role="option"
					aria-label="${label}"
					data-index="${minute.index}"
					data-value="${minute.value}"
				>${minute.name}</div>
			`;

			Dom.append(minuteContainer, this.getMinutesContainer());

			return minuteContainer;
		});

		if (minute.selected)
		{
			Dom.addClass(div, '--selected');
		}
		else
		{
			Dom.removeClass(div, '--selected');
		}

		div.setAttribute('aria-selected', minute.selected ? 'true' : 'false');

		if (minute.hidden)
		{
			div.dataset.index = '';
			Dom.addClass(div, '--hidden');
			div.setAttribute('aria-hidden', 'true');
		}
		else
		{
			div.dataset.index = minute.index;
			Dom.removeClass(div, '--hidden');
			div.removeAttribute('aria-hidden');
		}
	}

	#renderMeridiem(meridiem: TimePickerMeridiem): void
	{
		const div = this.#refs.remember(`meridiem-${meridiem.value}`, () => {
			const meridiemContainer = Tag.render`
				<div
					class="ui-time-picker-list-item"
					role="option"
					data-index="${meridiem.index}"
					data-value="${meridiem.value}"
				>${meridiem.name}</div>
			`;

			Dom.append(meridiemContainer, this.getMeridiemsContainer());

			return meridiemContainer;
		});

		if (meridiem.selected)
		{
			Dom.addClass(div, '--selected');
		}
		else
		{
			Dom.removeClass(div, '--selected');
		}

		div.setAttribute('aria-selected', meridiem.selected ? 'true' : 'false');
	}

	#adjustScrollHeight(listContainer: HTMLElement): void
	{
		const viewport: HTMLElement = listContainer.parentNode.parentNode;
		const offset = viewport.offsetHeight / 2 - this.getItemHeight() / 2;

		Dom.style(listContainer, {
			marginTop: `${offset}px`,
			marginBottom: `${offset}px`,
		});
	}

	#restoreScrollPosition(listContainer: HTMLElement, index: number): void
	{
		const selectorId = listContainer.parentNode.parentNode.parentNode.dataset.selectorId;
		if (!this.#scrollingSelectorIds.has(selectorId))
		{
			this.#adjustScrollPosition(listContainer, index, false);
		}
	}

	#adjustScrollPosition(listContainer: HTMLElement, index: number, smooth: boolean = true): boolean
	{
		const scrollContainer: HTMLElement = listContainer.parentNode;
		const scrollTop = this.getItemHeight() * index;
		if (scrollContainer.scrollTop !== scrollTop)
		{
			if (!smooth)
			{
				const selectorId = listContainer.parentNode.parentNode.parentNode.dataset.selectorId;
				this.#adjustedScrollTops.set(selectorId, scrollTop);
			}

			scrollContainer.scrollTo({
				top: scrollTop,
				behavior: smooth ? 'smooth' : 'instant',
			});

			return true;
		}

		return false;
	}

	// An instant alignment fires a real scroll event; treating it as a user scroll would revert the selected time.
	#isAdjustedScroll(selectorId: string, scrollTop: number): boolean
	{
		if (!this.#adjustedScrollTops.has(selectorId))
		{
			return false;
		}

		const adjustedScrollTop = this.#adjustedScrollTops.get(selectorId);
		this.#adjustedScrollTops.delete(selectorId);

		return Math.abs(scrollTop - adjustedScrollTop) <= 1;
	}

	#handleItemClick(event: MouseEvent): void
	{
		const item = event.target;
		if (!item.closest('.ui-time-picker-list-item'))
		{
			return;
		}

		const listContainer: HTMLElement = item.parentNode;
		const index = Number(item.dataset.index);

		const scrollChanged = this.#adjustScrollPosition(listContainer, index);
		if (!scrollChanged)
		{
			this.#selectTime(listContainer.parentNode);
		}
	}

	#handleTitleClick(event: MouseEvent): void
	{
		this.emit('onTitleClick');
	}

	getPrevBtnLabel(): string
	{
		return Loc.getMessage('UI_DATE_PICKER_BACK_TO_DAYS');
	}

	getNextBtnLabel(): string
	{
		return '';
	}

	#handleSelectorMouseEnter(event: MouseEvent): void
	{
		this.focusSelector(event.target.dataset.selectorId);
	}

	#handleFocus(event: FocusEvent)
	{
		this.focusSelector(event.target.parentNode.parentNode.dataset.selectorId);
	}

	#handleSelectorScroll(event: Event): void
	{
		if (this.#destroyed)
		{
			return;
		}

		const selectorId = event.target.parentNode.parentNode.dataset.selectorId;
		if (this.#isAdjustedScroll(selectorId, event.target.scrollTop))
		{
			return;
		}

		clearTimeout(this.#scrollEndTimeouts.get(selectorId));

		this.#scrollingSelectorIds.add(selectorId);
		this.#scrollEndTimeouts.set(selectorId, setTimeout(() => {
			this.#scrollEndTimeouts.delete(selectorId);
			this.#handleSelectorScrollEnd(event);
		}, 200));
	}

	#cancelPendingScrolls(): void
	{
		this.#scrollEndTimeouts.forEach((timeoutId: number) => clearTimeout(timeoutId));
		this.#scrollEndTimeouts.clear();
		this.#scrollingSelectorIds.clear();
	}

	// A wheel scrolled while the picker was closing keeps its position, so align it with the selected time.
	#handleDatePickerShow(): void
	{
		if (this.isRendered() && this.getDatePicker().getPicker() === this)
		{
			this.render();
		}
	}

	#handleDatePickerDestroy(): void
	{
		this.#cancelPendingScrolls();
		this.#destroyed = true;
	}

	#handleSelectorScrollEnd(event: Event): void
	{
		this.#scrollingSelectorIds.delete(event.target.parentNode.parentNode.dataset.selectorId);

		const datePicker = this.getDatePicker();
		const isHidden = (!datePicker.isInline() && !datePicker.isOpen()) || datePicker.getPicker() !== this;
		if (isHidden)
		{
			return;
		}

		const scrollContainer = event.target;
		const scrollTop = scrollContainer.scrollTop;
		const itemHeight = this.getItemHeight();
		const atSnappingPoint = Math.abs(scrollTop - this.#getScrollIndex(scrollContainer) * itemHeight) <= 1;
		if (atSnappingPoint)
		{
			this.#selectTime(scrollContainer);
		}
	}

	#getScrollIndex(scrollContainer: HTMLElement): number
	{
		return Math.round(scrollContainer.scrollTop / this.getItemHeight());
	}

	#selectTime(scrollContainer: HTMLElement): void
	{
		const index = this.#getScrollIndex(scrollContainer);
		const selector: HTMLElement = scrollContainer.parentNode.parentNode;
		const selectorId = selector.dataset.selectorId;
		const item: HTMLElement = selector.querySelector(`[data-index="${index}"]`);
		if (item === null)
		{
			return;
		}

		const selectedDate = this.getTimeDate();
		const currentHour = selectedDate === null ? -1 : selectedDate.getUTCHours();
		const currentMinute = selectedDate === null ? -1 : selectedDate.getUTCMinutes();

		switch (selectorId)
		{
			case 'hour':
			{
				const hour = Number(item.dataset.value);
				if (currentHour !== hour)
				{
					this.emit('onSelect', { hour });
				}

				break;
			}

			case 'minute':
			{
				const minute = Number(item.dataset.value);
				if (currentMinute !== minute)
				{
					this.emit('onSelect', { minute });
				}

				break;
			}

			case 'meridiem':
			{
				const meridiem = item.dataset.value;
				if (meridiem === 'am' && currentHour >= 12)
				{
					const hour = currentHour - 12;
					this.emit('onSelect', { hour });
				}
				else if (meridiem === 'pm' && currentHour >= 0 && currentHour < 12)
				{
					const hour = currentHour + 12;
					this.emit('onSelect', { hour });
				}

				break;
			}
			default:
				break;
		}
	}
}
