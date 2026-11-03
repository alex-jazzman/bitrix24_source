import { Dom, Loc, Type } from 'main.core';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';

import { DatePickerAdapter } from '../../infrastructure/adapter/date-picker-adapter';
import {
	describeTimezone,
	readBound,
	resolveTimezoneId,
	toRequestBound,
} from '../../period';
import { type FieldErrorTarget } from '../../state';
import { type VacationAutoReplySetting } from '../../types';

type BoundName = 'start' | 'end';

type BoundRefs = {
	startField?: { $el?: Element } | Element,
	endField?: { $el?: Element } | Element,
	error?: Element,
	hint?: Element,
};

type AdapterRuntime = {
	create(
		startInput: HTMLInputElement,
		endInput: HTMLInputElement,
		onStartChange: () => void,
		onEndChange: () => void,
	): void,
	destroy(): void,
	setValue(name: BoundName, value: string | null | undefined): void,
	setDisabled(disabled: boolean): void,
	getRequestValue(name: BoundName, loaded: string | null | undefined): string,
	getFormatExample(): string,
	focusStart(): void,
};

const TestId = Object.freeze({
	start: 'mail-vacation-auto-reply-period-start',
	end: 'mail-vacation-auto-reply-period-end',
	format: 'mail-vacation-auto-reply-period-format',
	error: 'mail-vacation-auto-reply-error-period',
});

const InputId = Object.freeze({
	start: 'mail-vacation-auto-reply-start',
	end: 'mail-vacation-auto-reply-end',
});

function loc(phrase: string, replacements: Record<string, string> | null = null): string
{
	return Loc.getMessage(phrase, replacements) ?? '';
}

function createAdapterRuntime(): AdapterRuntime
{
	let startAdapter: DatePickerAdapter | null = null;
	let endAdapter: DatePickerAdapter | null = null;

	const adapterByName = (name: BoundName): DatePickerAdapter | null => {
		return name === 'start' ? startAdapter : endAdapter;
	};

	return {
		create(
			startInput: HTMLInputElement,
			endInput: HTMLInputElement,
			onStartChange: () => void,
			onEndChange: () => void,
		): void
		{
			this.destroy();
			startAdapter = markRaw(new DatePickerAdapter({ input: startInput, onChange: onStartChange }));
			endAdapter = markRaw(new DatePickerAdapter({ input: endInput, onChange: onEndChange }));
		},

		destroy(): void
		{
			startAdapter?.destroy();
			endAdapter?.destroy();
			startAdapter = null;
			endAdapter = null;
		},

		setValue(name: BoundName, value: string | null | undefined): void
		{
			adapterByName(name)?.setValue(value);
		},

		setDisabled(disabled: boolean): void
		{
			startAdapter?.setDisabled(disabled);
			endAdapter?.setDisabled(disabled);
		},

		getRequestValue(name: BoundName, loaded: string | null | undefined): string
		{
			return adapterByName(name)?.getRequestValue(loaded) ?? toRequestBound(readBound(loaded));
		},

		getFormatExample(): string
		{
			return startAdapter?.getFormatExample() ?? '';
		},

		focusStart(): void
		{
			startAdapter?.focus();
		},
	};
}

function resolveRefElement(ref: { $el?: Element } | Element | undefined): Element | null
{
	if (Type.isElementNode(ref))
	{
		return ref as Element;
	}

	const element = (ref as { $el?: Element } | undefined)?.$el;

	return Type.isElementNode(element) ? element as Element : null;
}

function resolveNativeInput(ref: { $el?: Element } | Element | undefined): HTMLInputElement | null
{
	const element = resolveRefElement(ref);
	if (element === null)
	{
		return null;
	}

	if (element.tagName === 'INPUT')
	{
		return element as HTMLInputElement;
	}

	return element.querySelector<HTMLInputElement>('input');
}

function decorateInput(input: HTMLInputElement, name: BoundName): void
{
	Dom.attr(input, {
		id: InputId[name],
		role: 'combobox',
		autocomplete: 'off',
		'data-testid': TestId[name],
	});
}

// @vue/component
export const PeriodField = defineComponent({
	name: 'MailVacationAutoReplyPeriodField',
	components: {
		BInput,
	},
	props: {
		startsAt: {
			type: String as PropType<string | null>,
			default: null,
		},
		endsAt: {
			type: String as PropType<string | null>,
			default: null,
		},
		setting: {
			type: Object as PropType<VacationAutoReplySetting | null | undefined>,
			default: undefined,
		},
		timezoneId: {
			type: String,
			default: '',
		},
		fallbackTimezoneId: {
			type: String,
			default: '',
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		error: {
			type: String,
			default: '',
		},
	},
	setup()
	{
		return {
			adapterRuntime: createAdapterRuntime(),
			inputDesign: InputDesign.LightGrey,
			inputSize: InputSize.Md,
			inputId: InputId,
			testId: TestId,
		};
	},
	data(): { startValue: string, endValue: string, formatExample: string }
	{
		return {
			startValue: '',
			endValue: '',
			formatExample: '',
		};
	},
	computed: {
		startLabel(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_PERIOD_START_LABEL');
		},

		endLabel(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_PERIOD_END_LABEL');
		},

		formatHint(): string
		{
			return this.formatExample === ''
				? ''
				: loc('MAIL_VACATION_AUTO_REPLY_PERIOD_FORMAT_HINT', { '#EXAMPLE#': this.formatExample })
			;
		},

		timezoneHint(): string
		{
			const timezoneId = resolveTimezoneId(this.timezoneId, this.fallbackTimezoneId);

			return loc('MAIL_VACATION_AUTO_REPLY_PERIOD_HINT', {
				'#TIMEZONE#': describeTimezone(timezoneId, loc('LANGUAGE_ID')),
			});
		},
	},
	watch: {
		startsAt(value: string | null): void
		{
			if (this.setting === undefined)
			{
				this.syncLoadedBound('start', value);
			}
		},

		endsAt(value: string | null): void
		{
			if (this.setting === undefined)
			{
				this.syncLoadedBound('end', value);
			}
		},

		setting(value: VacationAutoReplySetting | null | undefined): void
		{
			// Every server answer must replace values typed directly into the legacy date pickers.
			if (value !== null && value !== undefined)
			{
				this.syncLoadedBounds(value.startsAt, value.endsAt);
			}
		},

		readonly(value: boolean): void
		{
			this.setReadonly(value);
		},
	},
	mounted(): void
	{
		void this.$nextTick((): void => {
			this.createAdapters();
			this.syncLoadedBounds(
				this.setting === undefined ? this.startsAt : this.setting?.startsAt ?? null,
				this.setting === undefined ? this.endsAt : this.setting?.endsAt ?? null,
			);
			this.setReadonly(this.readonly);
		});
	},
	beforeUnmount(): void
	{
		this.adapterRuntime.destroy();
	},
	methods: {
		createAdapters(): void
		{
			const startInput = this.getInput('start');
			const endInput = this.getInput('end');
			if (startInput === null || endInput === null)
			{
				return;
			}

			decorateInput(startInput, 'start');
			decorateInput(endInput, 'end');
			this.adapterRuntime.create(
				startInput,
				endInput,
				(): void => this.syncDisplayValue('start'),
				(): void => this.syncDisplayValue('end'),
			);
			this.formatExample = this.adapterRuntime.getFormatExample();
		},

		syncLoadedBounds(
			startsAt: string | null | undefined = undefined,
			endsAt: string | null | undefined = undefined,
		): void
		{
			const currentStartsAt = startsAt === undefined ? this.startsAt : startsAt;
			const currentEndsAt = endsAt === undefined ? this.endsAt : endsAt;

			this.syncLoadedBound('start', currentStartsAt);
			this.syncLoadedBound('end', currentEndsAt);
		},

		syncLoadedBound(name: BoundName, value: string | null | undefined): void
		{
			this.adapterRuntime.setValue(name, value);
			this.syncDisplayValue(name);
		},

		syncDisplayValue(name: BoundName): void
		{
			const input = this.getInput(name);
			if (input === null)
			{
				return;
			}

			if (name === 'start')
			{
				this.startValue = input.value;

				return;
			}

			this.endValue = input.value;
		},

		getInput(name: BoundName): HTMLInputElement | null
		{
			const refs = this.$refs as BoundRefs;

			return resolveNativeInput(name === 'start' ? refs.startField : refs.endField);
		},

		getRequestValues(
			loadedStartsAt: string | null | undefined = undefined,
			loadedEndsAt: string | null | undefined = undefined,
		): { startsAt: string, endsAt: string }
		{
			const currentStartsAt = loadedStartsAt === undefined ? this.startsAt : loadedStartsAt;
			const currentEndsAt = loadedEndsAt === undefined ? this.endsAt : loadedEndsAt;

			return {
				startsAt: this.adapterRuntime.getRequestValue('start', currentStartsAt),
				endsAt: this.adapterRuntime.getRequestValue('end', currentEndsAt),
			};
		},

		setReadonly(readonly: boolean): void
		{
			this.adapterRuntime.setDisabled(readonly);
		},

		focusStart(): boolean
		{
			this.adapterRuntime.focusStart();

			if (document.activeElement === this.getInput('start'))
			{
				return true;
			}

			this.getInput('start')?.focus();

			return document.activeElement === this.getInput('start');
		},

		getErrorTarget(): FieldErrorTarget
		{
			const refs = this.$refs as BoundRefs;
			const message = resolveRefElement(refs.error) as HTMLElement | null;
			const hint = resolveRefElement(refs.hint) as HTMLElement | null;
			const startInput = this.getInput('start');
			const endInput = this.getInput('end');
			const startField = resolveRefElement(refs.startField) as HTMLElement | null;
			const endField = resolveRefElement(refs.endField) as HTMLElement | null;

			return {
				message: message ?? document.createElement('div'),
				controls: [startInput, endInput, startField, endField].filter(Boolean) as HTMLElement[],
				hint: hint ?? undefined,
				focus: (): boolean => this.focusStart(),
			};
		},
	},
	template: `
		<div class="mail-vacation-auto-reply-form__row">
			<div class="mail-vacation-auto-reply-form__period">
				<div class="mail-vacation-auto-reply-form__bound">
					<label class="mail-vacation-auto-reply-form__label" :for="inputId.start">
						{{ startLabel }}
					</label>
					<BInput
						ref="startField"
						v-model="startValue"
						:design="inputDesign"
						:size="inputSize"
						:readonly="readonly"
						stretched
					/>
				</div>
				<div class="mail-vacation-auto-reply-form__bound">
					<label class="mail-vacation-auto-reply-form__label" :for="inputId.end">
						{{ endLabel }}
					</label>
					<BInput
						ref="endField"
						v-model="endValue"
						:design="inputDesign"
						:size="inputSize"
						:readonly="readonly"
						stretched
					/>
				</div>
			</div>
			<div
				ref="hint"
				:id="testId.format"
				class="mail-vacation-auto-reply-form__hint"
				:data-testid="testId.format"
			>{{ formatHint }}</div>
			<div class="mail-vacation-auto-reply-form__hint">{{ timezoneHint }}</div>
			<div
				ref="error"
				:id="testId.error"
				class="mail-vacation-auto-reply-form__error"
				data-role="error-period"
				:data-testid="testId.error"
			>{{ error }}</div>
		</div>
	`,
});
