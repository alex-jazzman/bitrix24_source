import { Type, Tag, Dom, Text, Loc } from 'main.core';
import { Alert, AlertColor } from 'ui.alerts';
import { visuallyHidden } from 'bizproc.a11y';

export class ErrorNotifier
{
	#errors: [] = [];
	#element: HTMLElement;
	#idPrefix: string = `bizproc-ws-start-error-${Text.getRandom(8).toLowerCase()}`;
	#messageIdByField: Map<string, string> = new Map();

	constructor(props: { errors: []})
	{
		this.errors = props.errors;
	}

	set errors(errors: [])
	{
		if (Type.isArray(errors))
		{
			this.#errors = errors;
		}
	}

	// field key -> id of the node holding its message, so a control can be bound to its own error
	get messageIdByField(): Map<string, string>
	{
		return this.#messageIdByField;
	}

	render(): HTMLElement
	{
		this.#element = Tag.render`<div>${this.#renderErrors()}</div>`;

		return this.#element;
	}

	show(scrollToElement: boolean = true)
	{
		if (this.#element)
		{
			this.clean();
			Dom.append(this.#renderErrors(), this.#element);

			if (scrollToElement)
			{
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
				BX.scrollToNode(this.#element);
			}
		}
	}

	clean()
	{
		this.#messageIdByField = new Map();

		if (this.#element)
		{
			Dom.clean(this.#element);
		}
	}

	#renderErrors(): ?HTMLElement
	{
		if (Type.isArrayFilled(this.#errors))
		{
			this.#messageIdByField = new Map();

			const message = (
				this.#errors
					.map((error, index) => {
						const messageId = `${this.#idPrefix}-${index}`;
						const field = error.customData?.parameter;
						if (Type.isStringFilled(field))
						{
							this.#messageIdByField.set(field, messageId);
						}

						return `<span id="${messageId}">${Text.encode(error.message || '')}</span>`;
					})
					.join('<br/>')
			);

			// the role lives on the node carrying the text: an always present alert region
			// would announce its own name every time the step is redrawn. The name is a hidden
			// text inside the region, not aria-label: a name on a live region replaces its
			// content in part of the screen readers, and the error text would be lost
			return Tag.render`
				<div role="alert">
					${visuallyHidden(Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_ERRORS_LABEL'))}
					${(new Alert({ text: message, color: AlertColor.DANGER })).render()}
				</div>
			`;
		}

		return null;
	}
}
