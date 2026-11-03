import { Type, Dom, Tag } from 'main.core';

export class MessageBar
{
	#errorContainer: HTMLElement;
	#successContainer: HTMLElement;
	#generalErrorElement: ?HTMLElement = null;
	#fieldErrorElements: Map<string, HTMLElement> = new Map();

	constructor(options)
	{
		this.#errorContainer = Type.isDomNode(options.errorContainer) ? options.errorContainer : null;
		this.#successContainer = Type.isDomNode(options.successContainer) ? options.successContainer : null;

		this.#configureContainers();
		this.hideAll();
	}

	#configureContainers(): void
	{
		if (this.#errorContainer)
		{
			this.#errorContainer.removeAttribute('role');
			this.#errorContainer.removeAttribute('aria-live');
		}

		if (this.#successContainer)
		{
			Dom.attr(this.#successContainer, {
				role: 'status',
				'aria-live': 'polite',
			});
		}
	}

	showError(message: string)
	{
		if (!this.#errorContainer || !Type.isStringFilled(message))
		{
			return;
		}

		if (this.#generalErrorElement)
		{
			this.#generalErrorElement.textContent = message;
		}
		else
		{
			this.#generalErrorElement = this.#wrapMessage(message);
			this.#generalErrorElement.setAttribute('role', 'alert');
			Dom.append(this.#generalErrorElement, this.#errorContainer);
		}

		Dom.style(this.#errorContainer, 'display', 'block');
	}

	showFieldError(id: string, message: string, announce: boolean = true): void
	{
		if (!this.#errorContainer || !Type.isStringFilled(id) || !Type.isStringFilled(message))
		{
			return;
		}

		let errorElement = this.#fieldErrorElements.get(id);
		if (errorElement)
		{
			errorElement.textContent = message;
		}
		else
		{
			errorElement = this.#wrapMessage(message);
			Dom.attr(errorElement, {
				id,
				'data-testid': id,
			});
			this.#fieldErrorElements.set(id, errorElement);
			Dom.append(errorElement, this.#errorContainer);
		}
		this.#syncAlertRole(errorElement, announce);

		Dom.style(this.#errorContainer, 'display', 'block');
	}

	hideFieldError(id: string): void
	{
		const errorElement = this.#fieldErrorElements.get(id);
		if (!errorElement)
		{
			return;
		}

		Dom.remove(errorElement);
		this.#fieldErrorElements.delete(id);
		this.#hideEmptyErrorContainer();
	}

	#wrapMessage(text: string): HTMLElement
	{
		return Tag.render`<div class="ui-alert-message">${BX.util.htmlspecialchars(text)}</div>`;
	}

	#syncAlertRole(errorElement: HTMLElement, announce: boolean): void
	{
		if (announce)
		{
			errorElement.setAttribute('role', 'alert');

			return;
		}

		errorElement.removeAttribute('role');
	}

	showSuccess(message: string)
	{
		if (!this.#successContainer || !Type.isStringFilled(message))
		{
			return;
		}

		Dom.clean(this.#successContainer);
		Dom.style(this.#successContainer, 'display', 'block');
		Dom.append(this.#wrapMessage(message), this.#successContainer);
	}

	hideAll()
	{
		if (this.#errorContainer)
		{
			Dom.style(this.#errorContainer, 'display', 'none');
			Dom.clean(this.#errorContainer);
			this.#generalErrorElement = null;
			this.#fieldErrorElements.clear();
		}

		if (this.#successContainer)
		{
			Dom.style(this.#successContainer, 'display', 'none');
			Dom.clean(this.#successContainer);
		}
	}

	#hideEmptyErrorContainer(): void
	{
		if (this.#errorContainer && !this.#errorContainer.hasChildNodes())
		{
			Dom.style(this.#errorContainer, 'display', 'none');
		}
	}
}
