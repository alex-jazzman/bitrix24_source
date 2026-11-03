import { Dom, Loc, Tag, Text } from 'main.core';

import './style.css';

export type SigningMethodType = 'ukep' | 'goskey';

export const SigningMethod: Readonly<Record<string, SigningMethodType>> = Object.freeze({
	ukep: 'ukep',
	goskey: 'goskey',
});

const defaultMethod: SigningMethodType = SigningMethod.ukep;

/**
 * Signing method of the company representative. The list is offered only when the server says the
 * method is available for the selected company and provider: the client never derives availability
 * from the representative himself, and the right of that person to use goskey is checked by the
 * server when the step is left.
 */
export class SigningMethodSelector
{
	#available: boolean = false;
	#selectedMethod: SigningMethodType = defaultMethod;
	#container: HTMLElement | null = null;
	#block: HTMLElement | null = null;
	#select: HTMLSelectElement | null = null;

	getLayout(): HTMLElement
	{
		const container: HTMLElement = this.#container ?? Tag.render`<div></div>`;
		this.#container = container;

		return container;
	}

	setAvailable(available: boolean): void
	{
		if (available === this.#available)
		{
			return;
		}

		this.#available = available;
		if (available)
		{
			this.#renderBlock();

			return;
		}

		this.#removeBlock();
	}

	isAvailable(): boolean
	{
		return this.#available;
	}

	getSelectedMethod(): SigningMethodType | null
	{
		return this.#available ? this.#selectedMethod : null;
	}

	setSelectedMethod(method: string | null): void
	{
		if (!Object.values(SigningMethod).includes(method as SigningMethodType))
		{
			return;
		}

		this.#selectedMethod = method as SigningMethodType;
		if (this.#select)
		{
			this.#select.value = this.#selectedMethod;
		}
	}

	#renderBlock(): void
	{
		if (this.#block)
		{
			return;
		}

		const select: HTMLSelectElement = Tag.render`
			<select
				class="ui-ctl-element"
				data-test-id="sign-b2e-signing-method-selector-select"
				onchange="${({ target }: { target: HTMLSelectElement }) => {
					this.setSelectedMethod(target.value);
				}}"
			></select>
		`;
		this.#renderOptions(select);
		select.value = this.#selectedMethod;
		this.#select = select;

		const block: HTMLElement = Tag.render`
			<div
				class="sign-b2e-settings__item --representative-signing-method"
				data-test-id="sign-b2e-signing-method-selector"
			>
				<p class="sign-b2e-settings__item_title">
					${Loc.getMessage('SIGN_V2_B2E_SIGNING_METHOD_SELECTOR_TITLE')}
				</p>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown sign-b2e-signing-method-selector__dropdown">
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					${select}
				</div>
			</div>
		`;
		this.#block = block;

		Dom.append(block, this.getLayout());
	}

	#renderOptions(select: HTMLSelectElement): void
	{
		const options: Array<{ value: SigningMethodType, text: string }> = [
			{
				value: SigningMethod.ukep,
				text: Loc.getMessage('SIGN_V2_B2E_SIGNING_METHOD_SELECTOR_VALUE_UKEP') ?? '',
			},
			{
				value: SigningMethod.goskey,
				text: Loc.getMessage('SIGN_V2_B2E_SIGNING_METHOD_SELECTOR_VALUE_GOSKEY') ?? '',
			},
		];

		options.forEach((option) => {
			Dom.append(
				Tag.render`<option value="${option.value}">${Text.encode(option.text)}</option>`,
				select,
			);
		});
	}

	#removeBlock(): void
	{
		Dom.remove(this.#block);
		this.#block = null;
		this.#select = null;
	}
}
