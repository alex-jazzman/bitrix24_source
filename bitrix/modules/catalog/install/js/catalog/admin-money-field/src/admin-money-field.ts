import { Type, Event } from 'main.core';
import { CurrencyCore } from 'currency.currency-core';

const MARKER: string = 'catalog-money-edit';
const DEFAULT_DECIMALS: number = 2;

type CurrencyFormat = {
	DECIMALS?: number | string,
};

type DomEvent = {
	target: EventTarget | null,
};

/**
 * Formats the displayed value of a legacy admin price input by the DECIMALS of the selected
 * currency, while keeping the full DECIMAL(26,8) precision in the `data-money-raw` attribute.
 *
 * Markup is produced by `CCatalogAdminTools::renderMoneyEditField()`:
 *   <input class="catalog-money-edit" value="{formatted}"
 *          data-money-raw="{fullPrecision}" data-money-currency-source="{currencyControlId}">
 *
 * Binding model: a single delegated pair of listeners on `document` in the capture phase.
 * This is deliberate, not lazy — the store-document editor re-renders its whole product grid via
 * `products.innerHTML = ajaxResult` (cat_store_document_edit.php → addRowResult) on every product
 * add, replacing every money input with fresh markup after page load. Per-element binding would
 * silently miss those re-created inputs, so the full-precision value would no longer be restored on
 * submit. Delegation on `document` keeps working regardless of when the markup appears.
 *
 * Capture phase is required: the raw value must be normalized before the legacy inline `onchange`
 * recalculations read it, and the full-precision value must be restored before the form `onsubmit`
 * handlers and the actual submit run.
 *
 * Behaviour:
 *   - on user change of the input: `data-money-raw` is updated with the typed full-precision value;
 *   - on change of the bound currency control: the displayed value is reformatted by the new DECIMALS;
 *   - on form submit: for fields whose displayed value still represents `data-money-raw` at the
 *     current precision (untouched), the full-precision raw value is restored, so the server
 *     receives the original DECIMAL(26,8) value (no precision loss from formatting).
 *
 * The visible input keeps its `name`, so the legacy inline `parseFloat()`-based price
 * calculations keep reading the displayed (currency-precision) value without any changes.
 */
export class AdminMoneyField
{
	#bound: boolean = false;

	init(): void
	{
		if (this.#bound)
		{
			return;
		}

		this.#bound = true;

		Event.bind(document, 'change', this.#handleChange, true);
		Event.bind(document, 'submit', this.#handleSubmit, true);
	}

	#toElement(target: EventTarget | null): HTMLElement | null
	{
		return Type.isElementNode(target) ? (target as HTMLElement) : null;
	}

	#getDecimals(currency: string): number
	{
		if (!Type.isStringFilled(currency))
		{
			return DEFAULT_DECIMALS;
		}

		const format: CurrencyFormat | null = CurrencyCore.getCurrencyFormat(currency) || null;
		if (format)
		{
			if (Type.isNumber(format.DECIMALS))
			{
				return (format.DECIMALS as number);
			}

			if (Type.isStringFilled(format.DECIMALS))
			{
				const parsed: number = Number.parseInt((format.DECIMALS as string), 10);
				if (!Number.isNaN(parsed))
				{
					return parsed;
				}
			}
		}

		return DEFAULT_DECIMALS;
	}

	#parseAmount(value: string): number | null
	{
		const normalized: string = String(value ?? '').replace(/\s/g, '').replace(',', '.');
		if (normalized === '')
		{
			return null;
		}

		const num: number = Number.parseFloat(normalized);

		return Number.isNaN(num) ? null : num;
	}

	#format(rawValue: string, currency: string): string
	{
		const num: number | null = this.#parseAmount(rawValue);
		if (num === null)
		{
			return '';
		}

		return num.toFixed(this.#getDecimals(currency));
	}

	#getCurrencyControl(input: HTMLInputElement): HTMLInputElement | null
	{
		const id: string | null = input.getAttribute('data-money-currency-source');
		if (!Type.isStringFilled(id))
		{
			return null;
		}

		return document.getElementById(id as string) as HTMLInputElement | null;
	}

	#getCurrency(input: HTMLInputElement): string
	{
		const control: HTMLInputElement | null = this.#getCurrencyControl(input);

		return control ? String(control.value || '') : '';
	}

	#isMoneyInput(element: HTMLElement | null): boolean
	{
		return element !== null && element.tagName === 'INPUT' && element.classList.contains(MARKER);
	}

	#getMoneyInputs(scope: Document | HTMLElement): Array<HTMLInputElement>
	{
		return Array.from(scope.getElementsByClassName(MARKER)) as Array<HTMLInputElement>;
	}

	#normalizeRaw(input: HTMLInputElement): void
	{
		const num: number | null = this.#parseAmount(input.value);
		input.setAttribute('data-money-raw', num === null ? '' : String(num));
	}

	#reformat(input: HTMLInputElement, currency: string): void
	{
		const raw: string | null = input.getAttribute('data-money-raw');
		input.value = Type.isStringFilled(raw) ? this.#format(raw as string, currency) : '';
	}

	#restoreRawForSubmit(input: HTMLInputElement): void
	{
		const raw: string | null = input.getAttribute('data-money-raw');
		if (!Type.isStringFilled(raw))
		{
			return;
		}

		if (!Type.isStringFilled(String(input.value).replace(/\s/g, '')))
		{
			return;
		}

		const current: number | null = this.#parseAmount(input.value);
		const rawNum: number | null = this.#parseAmount(raw as string);
		if (current === null || rawNum === null)
		{
			return;
		}

		const decimals: number = this.#getDecimals(this.#getCurrency(input));

		// The displayed value still represents the raw value at the current precision:
		// submit the full-precision raw value so formatting never truncates a stored price.
		if (current.toFixed(decimals) === rawNum.toFixed(decimals))
		{
			input.value = (raw as string);
		}
	}

	#ensureFormat(currency: string, callback: () => void): void
	{
		if (!Type.isStringFilled(currency) || CurrencyCore.getCurrencyFormat(currency))
		{
			callback();

			return;
		}

		const result: Promise<unknown> = CurrencyCore.loadCurrencyFormat(currency);
		if (result && Type.isFunction(result.then))
		{
			result.then(callback, callback);

			return;
		}

		callback();
	}

	#handleChange = (event: DomEvent): void => {
		const target: HTMLElement | null = this.#toElement(event.target);

		if (this.#isMoneyInput(target))
		{
			this.#normalizeRaw(target as HTMLInputElement);

			return;
		}

		if (target === null || !Type.isStringFilled(target.id))
		{
			return;
		}

		const sourceId: string = target.id;
		const matched: Array<HTMLInputElement> = Array.from(
			document.querySelectorAll(`input.${MARKER}[data-money-currency-source="${sourceId}"]`),
		) as Array<HTMLInputElement>;

		if (matched.length === 0)
		{
			return;
		}

		const currency: string = String((target as HTMLInputElement).value || '');
		this.#ensureFormat(currency, (): void => {
			matched.forEach((input: HTMLInputElement): void => this.#reformat(input, currency));
		});
	};

	#handleSubmit = (event: DomEvent): void => {
		const form: HTMLElement | null = this.#toElement(event.target);
		if (form === null || form.tagName !== 'FORM')
		{
			return;
		}

		const inputs: Array<HTMLInputElement> = this.#getMoneyInputs(form);
		inputs.forEach((input: HTMLInputElement): void => this.#restoreRawForSubmit(input));

		// The submit may be cancelled by a legacy submit handler (confirm/validation), so the
		// page does not navigate. Re-format on the next tick so the full-precision raw value
		// restored above is never left visible in the inputs (e.g. the first range row in the
		// product editor, mirrored from the base price).
		setTimeout((): void => {
			inputs.forEach(
				(input: HTMLInputElement): void => this.#reformat(input, this.#getCurrency(input)),
			);
		}, 0);
	};
}

export const adminMoneyField: AdminMoneyField = new AdminMoneyField();

adminMoneyField.init();
