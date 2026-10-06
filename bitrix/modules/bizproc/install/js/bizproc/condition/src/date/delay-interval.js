import { Loc, Type } from 'main.core';

export class DelayInterval
{
	static BASIS_TYPE = {
		CurrentDate: '{=System:Date}',
		CurrentDateTime: '{=System:Now}',
		CurrentDateTimeLocal: '{=System:NowLocal}',
	};

	static DELAY_TYPE = { After: 'after', Before: 'before', In: 'in' };

	#basis = DelayInterval.BASIS_TYPE.CurrentDateTime;
	#type = DelayInterval.DELAY_TYPE.After;
	#value = 0;
	#valueType = 'i';
	#workTime = false;
	#waitWorkDay = false;
	#inTime = null;
	#sourceExpression = null;

	constructor(params: ?Object = null)
	{
		if (Type.isPlainObject(params))
		{
			this.setType(params.type);
			this.setValue(params.value);
			this.setValueType(params.valueType);
			this.setBasis(params.basis);
			this.setWorkTime(params.workTime);
			this.setWaitWorkDay(params.waitWorkDay);
			this.setInTime(params.inTime);
		}
	}

	get basis(): string { return this.#basis; }
	get type(): string { return this.#type; }
	get value(): number { return this.#value; }
	get valueType(): string { return this.#valueType; }
	get workTime(): boolean { return this.#workTime; }
	get waitWorkDay(): boolean { return this.#waitWorkDay; }
	get hasSourceExpression(): boolean { return Type.isStringFilled(this.#sourceExpression); }

	get inTime(): ?Array<number>
	{
		return this.getInTimeAtOffset(this.#getUserOffset());
	}

	get inTimeString(): string
	{
		const inTime = this.inTime;
		if (!inTime)
		{
			return '';
		}

		return `${String(inTime[0]).padStart(2, '0')}:${String(inTime[1]).padStart(2, '0')}`;
	}

	getStoredInTime(): ?Array<number>
	{
		return this.#inTime ? [...this.#inTime] : null;
	}

	getInTimeAtOffset(userOffset: number): ?Array<number>
	{
		if (!this.#inTime)
		{
			return null;
		}

		if (!Type.isNumber(this.#inTime[2]) || this.#inTime[2] === userOffset)
		{
			return [...this.#inTime];
		}

		const diffOffsetMin = Math.floor((this.#inTime[2] - userOffset) / 60);
		let allMinutes = this.#inTime[0] * 60 + this.#inTime[1] - diffOffsetMin;
		if (allMinutes < 0)
		{
			allMinutes += 24 * 60;
		}

		return [Math.floor(allMinutes / 60), allMinutes % 60, userOffset];
	}

	static isSystemBasis(basis: string): boolean
	{
		return Object.values(this.BASIS_TYPE).includes(basis);
	}

	static fromString(expression: ?string, basisFields: Array<Object> = []): DelayInterval
	{
		const interval = new this();
		const sourceExpression = String(expression || '').trim();
		let value = sourceExpression.replace(/^=/, '');
		if (!value)
		{
			return interval;
		}

		const setTimeMatch = value.match(/^settime\((.+?),\s*(\d+),\s*(\d+)(?:,\s*(-?\d+))?\)$/);
		if (setTimeMatch)
		{
			value = setTimeMatch[1];
			interval.setInTime([
				Number(setTimeMatch[2]),
				Number(setTimeMatch[3]),
				...(Type.isString(setTimeMatch[4]) ? [Number(setTimeMatch[4])] : []),
			]);
		}

		const addMatch = value.match(/^(workdateadd|dateadd)\((.*),\s*["']?(-?[\d]+[ihd])["']?(?:,.*)?\)$/);
		if (addMatch)
		{
			interval.setWorkTime(addMatch[1] === 'workdateadd');
			interval.setBasis(DelayInterval.#normalizeBasis(addMatch[2].trim(), basisFields));
			const amount = addMatch[3];
			interval.setType(amount.startsWith('-') ? this.DELAY_TYPE.Before : this.DELAY_TYPE.After);
			interval.setValue(Math.abs(parseInt(amount, 10)));
			interval.setValueType(amount.slice(-1));
		}
		else
		{
			interval.setBasis(DelayInterval.#normalizeBasis(value, basisFields));
			if (interval.basis !== this.BASIS_TYPE.CurrentDateTime || interval.inTime)
			{
				interval.setType(this.DELAY_TYPE.In);
			}
		}

		const isKnownBasis = this.isSystemBasis(value)
			|| basisFields.some((field) => field.SystemExpression === value || field.Expression === value);
		if (!addMatch && !isKnownBasis)
		{
			interval.#sourceExpression = sourceExpression;
		}

		return interval;
	}

	static #normalizeBasis(basis: string, fields: Array<Object>): string
	{
		if (this.isSystemBasis(basis))
		{
			return basis;
		}

		const field = fields.find((item) => item.SystemExpression === basis || item.Expression === basis);

		return field ? field.SystemExpression : this.BASIS_TYPE.CurrentDateTime;
	}

	setType(type: ?string): this
	{
		this.#sourceExpression = null;
		this.#type = Object.values(DelayInterval.DELAY_TYPE).includes(type) ? type : DelayInterval.DELAY_TYPE.After;

		return this;
	}

	setValue(value: mixed): this
	{
		this.#sourceExpression = null;
		this.#value = Math.max(0, parseInt(value, 10) || 0);

		return this;
	}

	setValueType(type: ?string): this
	{
		this.#sourceExpression = null;
		this.#valueType = ['i', 'h', 'd'].includes(type) ? type : 'i';

		return this;
	}

	setBasis(basis: ?string): this
	{
		this.#sourceExpression = null;
		if (Type.isStringFilled(basis))
		{
			this.#basis = basis;
		}

		return this;
	}

	setWorkTime(flag: mixed): this
	{
		this.#sourceExpression = null;
		this.#workTime = Boolean(flag);

		return this;
	}

	setWaitWorkDay(flag: mixed): this
	{
		this.#sourceExpression = null;
		this.#waitWorkDay = Boolean(flag);

		return this;
	}

	setInTime(value: ?Array<number>): this
	{
		this.#sourceExpression = null;

		let normalized = value;
		if (Type.isArray(normalized) && normalized.length >= 2 && !Type.isNumber(normalized[2]))
		{
			normalized = [...normalized, this.#getUserOffset()];
		}

		this.#inTime = Type.isArray(normalized) && normalized.length >= 2
			? [Number(normalized[0]), Number(normalized[1]), ...(Type.isNumber(normalized[2]) ? [Number(normalized[2])] : [])]
			: null;

		return this;
	}

	isNow(): boolean
	{
		return this.#type === DelayInterval.DELAY_TYPE.After && this.#basis === DelayInterval.BASIS_TYPE.CurrentDateTime
			&& this.#value === 0 && !this.#workTime && !this.#inTime;
	}

	setNow(): this
	{
		return this.setType(DelayInterval.DELAY_TYPE.After)
			.setValue(0)
			.setValueType('i')
			.setBasis(DelayInterval.BASIS_TYPE.CurrentDateTime)
			.setInTime(null);
	}

	clone(): DelayInterval
	{
		const clone = new this.constructor(this.serialize());
		clone.#sourceExpression = this.#sourceExpression;

		return clone;
	}

	serialize(): Object
	{
		return {
			type: this.#type,
			value: this.#value,
			valueType: this.#valueType,
			basis: this.#basis,
			workTime: this.#workTime ? 1 : 0,
			waitWorkDay: this.#waitWorkDay ? 1 : 0,
			inTime: this.getStoredInTime(),
		};
	}

	static fromMinutes(minutes: number): Array<number | string>
	{
		if (minutes % 1440 === 0)
		{
			return [minutes / 1440, 'd'];
		}
		if (minutes % 60 === 0)
		{
			return [minutes / 60, 'h'];
		}

		return [minutes, 'i'];
	}

	static toMinutes(value: number, valueType: string): number
	{
		return value * ({ i: 1, h: 60, d: 1440 }[valueType] || 0);
	}

	format(emptyText: string, fields: Array<Object> = []): string
	{
		let result = emptyText;
		if (this.#type === DelayInterval.DELAY_TYPE.In)
		{
			result = Loc.getMessage('BIZPROC_AUTOMATION_CMP_IN_TIME_2');
			const field = fields.find((item) => item.SystemExpression === this.#basis);
			if (field)
			{
				result += ` ${field.Name}`;
			}
			if (this.inTime)
			{
				result += ` ${this.inTimeString}`;
			}
		}
		else if (this.#value)
		{
			const prefix = this.#type === DelayInterval.DELAY_TYPE.After
				? Loc.getMessage('BIZPROC_AUTOMATION_CMP_THROUGH_3')
				: Loc.getMessage('BIZPROC_AUTOMATION_CMP_FOR_TIME_3');
			result = `${prefix} ${this.getFormattedPeriodLabel(this.#value, this.#valueType)}`;
			const field = fields.find((item) => item.SystemExpression === this.#basis);
			if (field)
			{
				result += ` ${this.#type === DelayInterval.DELAY_TYPE.After
					? Loc.getMessage('BIZPROC_AUTOMATION_CMP_AFTER')
					: Loc.getMessage('BIZPROC_AUTOMATION_CMP_BEFORE_1')} ${field.Name}`;
			}
		}

		return this.#workTime ? `${result}, ${Loc.getMessage('BIZPROC_AUTOMATION_CMP_IN_WORKTIME')}` : result;
	}

	getFormattedPeriodLabel(value: number, type: string): string
	{
		const labels = DelayInterval.getPeriodLabels(type);
		const normalizedValue = value > 20 ? value % 10 : value;
		const labelIndex = normalizedValue === 1 ? 0 : (normalizedValue > 1 && normalizedValue < 5 ? 1 : 2);

		return `${value} ${labels[labelIndex] || ''}`;
	}

	static getPeriodLabels(period: string): Array<string>
	{
		const key = { i: 'MIN', h: 'HOUR', d: 'DAY' }[period];

		return key ? [1, 2, 3].map((index) => Loc.getMessage(`BIZPROC_AUTOMATION_CMP_${key}${index}`)) : [];
	}

	toExpression(basisFields: Array<Object> = [], workerExpression: ?string = null): string
	{
		if (this.hasSourceExpression)
		{
			return this.#sourceExpression;
		}

		let basis = this.#basis;
		const field = basisFields.find((item) => item.SystemExpression === basis);
		if (field)
		{
			basis = field.Expression;
		}

		if (this.isNow() || (this.#type === DelayInterval.DELAY_TYPE.In && !this.#workTime && !this.#inTime))
		{
			return basis;
		}

		let amount = this.#value ? `${this.#value}${this.#valueType}` : '';
		if (amount && this.#type === DelayInterval.DELAY_TYPE.Before)
		{
			amount = `-${amount}`;
		}
		if (this.#workTime && !amount)
		{
			amount = '0d';
		}

		let result = amount ? `${this.#workTime ? 'workdateadd' : 'dateadd'}(${basis},"${amount}"${this.#workTime && workerExpression ? `,${workerExpression}` : ''})` : basis;
		if (this.#inTime)
		{
			result = `settime(${result}, ${this.#inTime[0]}, ${this.#inTime[1]}, ${this.#inTime[2] || 0})`;
		}

		return result === basis ? result : `=${result}`;
	}

	#getUserOffset(): number
	{
		const offset = Number(Loc.getMessage('USER_TZ_OFFSET'));

		return Type.isNumber(offset) ? offset : 0;
	}
}
