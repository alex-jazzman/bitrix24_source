import { Event, Loc, Runtime, Tag } from 'main.core';
import { DefaultFooter, type Dialog, type Item, type Tab } from 'ui.entity-selector';
import { type DatePicker } from 'ui.date-picker';
import { type Button } from 'ui.buttons';

const ENTITY_ID = 'biconnector-digest-period';
const RANGE_PATTERN = /^range:(\d{4})-(\d{2})-(\d{2}):(\d{4})-(\d{2})-(\d{2})$/;
const MAX_DAYS = 366;
const DAY_MS = 86_400_000;

/**
 * Lets a user set a fixed range of dates for a digest by hand. The dates are calendar days
 * of the picker, which keeps them as UTC midnights, so they are read back with UTC getters.
 * The picker and its buttons are loaded on the first opening: this extension comes with every entity selector.
 */
export class DigestPeriodFooter extends DefaultFooter
{
	#picker: DatePicker | null = null;
	#pickerPromise: Promise<DatePicker | null> | null = null;
	#destroyed: boolean = false;
	#createUtcDate: ((year: number, monthIndex: number, day: number) => Date) | null = null;
	#applyButton: Button | null = null;
	#dialogAutoHide: boolean = true;

	constructor(context: Dialog | Tab, options: Object)
	{
		super(context, options);

		this.getDialog().subscribe('onDestroy', () => {
			this.#destroyed = true;
			this.#picker?.destroy();
			this.#picker = null;
		});
	}

	getContent(): HTMLElement
	{
		return this.getSetDatesButton();
	}

	getSetDatesButton(): HTMLElement
	{
		return this.cache.remember('set-dates-button', () => {
			const button = Tag.render`
				<button type="button" class="ui-selector-footer-link" data-testid="biconnector-digest-period-set-dates">
					${Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_FOOTER_SET_DATES')}
				</button>
			`;

			Event.bind(button, 'click', () => this.openPicker());

			return button;
		});
	}

	openPicker(): Promise<void>
	{
		return this.loadPicker().then((picker: DatePicker | null) => {
			if (picker === null || picker.isOpen())
			{
				return;
			}

			picker.deselectAll({ emitEvents: false });

			const chosenRange = this.#getChosenRange();
			if (chosenRange !== null)
			{
				picker.selectRange(chosenRange.from, chosenRange.to, { emitEvents: false });
			}

			this.#refreshApplyButton();

			this.#dialogAutoHide = this.getDialog().isAutoHide();
			this.getDialog().setAutoHide(false);

			// The picker popup gives the focus back to the element that had it on opening, and a click
			// does not focus a button in every browser.
			this.getSetDatesButton().focus();
			picker.show();
		});
	}

	loadPicker(): Promise<DatePicker | null>
	{
		// Loaded one by one: the exports of ui.buttons are the whole BX.UI namespace and would shadow DatePicker.
		this.#pickerPromise ??= Promise.all([Runtime.loadExtension('ui.date-picker'), Runtime.loadExtension('ui.buttons')])
			.then(([{ DatePicker: DatePickerClass, DatePickerEvent, createUtcDate }, buttons]) => {
				if (this.#destroyed)
				{
					return null;
				}

				this.#createUtcDate = createUtcDate;
				this.#applyButton = this.#createApplyButton(buttons);
				this.#picker = new DatePickerClass({
					targetNode: this.getSetDatesButton(),
					selectionMode: 'range',
					maxDays: MAX_DAYS,
					hideOnSelect: false,
					presets: this.#createPresets(),
					popupOptions: {
						buttons: [this.#applyButton, this.#createCancelButton(buttons)],
					},
					events: {
						[DatePickerEvent.SELECT_CHANGE]: () => this.#refreshApplyButton(),
						onHide: () => this.#handlePickerHide(),
					},
				});

				return this.#picker;
			})
			.catch(() => {
				this.#pickerPromise = null;

				return null;
			})
		;

		return this.#pickerPromise;
	}

	getPicker(): DatePicker | null
	{
		return this.#picker;
	}

	applyRange(): void
	{
		const picker = this.getPicker();
		if (picker === null)
		{
			return;
		}

		const from = picker.getRangeStart();
		const to = picker.getRangeEnd();
		if (!this.#isRangeAllowed(from, to))
		{
			return;
		}

		const dialog = this.getDialog();
		const item: Item = dialog.addItem({
			id: `range:${formatIsoDate(from)}:${formatIsoDate(to)}`,
			entityId: ENTITY_ID,
			title: `${picker.formatDate(from)} – ${picker.formatDate(to)}`,
		});

		picker.hide();

		dialog.deselectAll();
		item.select();

		if (dialog.shouldHideOnSelect())
		{
			dialog.hide();
		}
	}

	#handlePickerHide(): void
	{
		this.getDialog().setAutoHide(this.#dialogAutoHide);
		this.getSetDatesButton().focus();
	}

	#createApplyButton({ Button: ButtonClass, ButtonSize, AirButtonStyle }): Button
	{
		return new ButtonClass({
			text: Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_FOOTER_APPLY'),
			size: ButtonSize.SMALL,
			useAirDesign: true,
			style: AirButtonStyle.FILLED,
			onclick: () => this.applyRange(),
		});
	}

	#createCancelButton({ Button: ButtonClass, ButtonSize, AirButtonStyle }): Button
	{
		return new ButtonClass({
			text: Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_FOOTER_CANCEL'),
			size: ButtonSize.SMALL,
			useAirDesign: true,
			style: AirButtonStyle.PLAIN,
			onclick: () => this.getPicker().hide(),
		});
	}

	#refreshApplyButton(): void
	{
		const picker = this.getPicker();

		this.#applyButton.setDisabled(!this.#isRangeAllowed(picker.getRangeStart(), picker.getRangeEnd()));
	}

	#isRangeAllowed(from: Date | null, to: Date | null): boolean
	{
		if (from === null || to === null)
		{
			return false;
		}

		return Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1 <= MAX_DAYS;
	}

	#getChosenRange(): { from: Date, to: Date } | null
	{
		for (const item of this.getDialog().getSelectedItems())
		{
			const matches = item.getEntityId() === ENTITY_ID ? String(item.getId()).match(RANGE_PATTERN) : null;
			if (matches !== null)
			{
				const [, fromYear, fromMonth, fromDay, toYear, toMonth, toDay] = matches.map(Number);

				return {
					from: this.#createUtcDate(fromYear, fromMonth - 1, fromDay),
					to: this.#createUtcDate(toYear, toMonth - 1, toDay),
				};
			}
		}

		return null;
	}

	#createPresets(): Array<{ label: string, value: () => [Date, Date] }>
	{
		const todayParts = (): [number, number] => {
			const today = this.getPicker().getToday();

			return [today.getUTCFullYear(), today.getUTCMonth()];
		};

		return [
			{
				label: Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_PRESET_PREVIOUS_MONTH'),
				value: () => {
					const [year, month] = todayParts();

					return [this.#createUtcDate(year, month - 1, 1), this.#createUtcDate(year, month, 0)];
				},
			},
			{
				label: Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_PRESET_PREVIOUS_QUARTER'),
				value: () => {
					const [year, month] = todayParts();
					const quarterStart = month - (month % 3);

					return [this.#createUtcDate(year, quarterStart - 3, 1), this.#createUtcDate(year, quarterStart, 0)];
				},
			},
			{
				label: Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_PRESET_PREVIOUS_YEAR'),
				value: () => {
					const [year] = todayParts();

					return [this.#createUtcDate(year - 1, 0, 1), this.#createUtcDate(year - 1, 11, 31)];
				},
			},
		];
	}
}

function formatIsoDate(date: Date): string
{
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');

	return `${date.getUTCFullYear()}-${month}-${day}`;
}
