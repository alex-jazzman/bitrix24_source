import { Loc, Tag, Dom, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Timezone, DateTimeFormat } from 'main.date';
import { Api } from 'sign.v2.api';
import './style.css';
import 'ui.design-tokens';

export class DatetimeLimitSelector extends EventEmitter
{
	#api: Api;
	#documentUids: Array<string>;
	#documentDateField: HTMLElement;
	#selectedDate: Date | null = null;

	constructor(date: Date = new Date())
	{
		super();
		this.setEventNamespace('BX.Sign.V2.DatetimeLimitSelector');

		this.#documentUids = [];
		this.#api = new Api();

		this.#documentDateField = this.#getDateField();
		this.setDate(date);
	}

	getLayout(): HTMLElement
	{
		return Tag.render`
			<div class="sign-datetime-limit-selector">
				<span class="sign-datetime-limit-selector__label">
					${Loc.getMessage('SIGN_BLANK_DATETIME_SELECTOR_LABEL')}
				</span>
				${this.#documentDateField}
			</div>
		`;
	}

	#getDateField(): HTMLElement
	{
		return Tag.render`
			<div
				class="sign-datetime-limit-selector_field"
				onclick="${() => {
					BX.calendar({
						node: this.#documentDateField,
						field: this.#documentDateField,
						currentTime: this.#selectedDate.getTime() / 1000,
						value: DateTimeFormat.format(DateTimeFormat.getFormat('FORMAT_DATETIME'), this.#selectedDate.getTime() / 1000),
						bTime: true,
						bHideTime: false,
						callback: (date) => {
							this.emit('beforeDateModify');

							this.#saveSelectedDate(date).then(
								() => {
									Dom.removeClass(this.#documentDateField, '--invalid');

									this.emit('afterDateModify', new Event.BaseEvent({
										data: { isValid: true },
									}));
								},
								() => {
									Dom.addClass(this.#documentDateField, '--invalid');

									this.emit('afterDateModify', new Event.BaseEvent({
										data: { isValid: false },
									}));
								},
							);

							return true;
						},
						callback_after: (date) => {
							this.setDate(date);
						},
					});
				}}"
			>
				<span class="sign-datetime-limit-selector_field-text"></span>
			</div>
		`;
	}

	#saveSelectedDate(datetime: Date): Promise<any[]>
	{
		const timestamp = Timezone.UserTime.toUTCTimestamp(datetime);

		return Promise.all(this.#documentUids.map((uid) => this.#api.modifyDateSignUntil(uid, timestamp)));
	}

	setDocumentUids(uids: Array<string>)
	{
		this.#documentUids = uids;
	}

	getSelectedDate(): Date | null
	{
		return this.#selectedDate;
	}

	setDate(date: Date): void
	{
		this.#selectedDate = date;

		const dateFormatted = DateTimeFormat.format(DateTimeFormat.getFormat('MEDIUM_DATE_FORMAT'), date);
		const timeFormatted = DateTimeFormat.format(DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), date);
		const formattedDate = Loc.getMessage('SIGN_BLANK_DATETIME_SELECTOR_DATE', {
			'#MEDIUM_DATE#': dateFormatted,
			'#SHORT_TIME#': timeFormatted,
		});

		const dateTextNode = this.#documentDateField.firstElementChild;
		dateTextNode.textContent = formattedDate;
	}

	isValid(): boolean
	{
		return !Dom.hasClass(this.#documentDateField, '--invalid');
	}
}
