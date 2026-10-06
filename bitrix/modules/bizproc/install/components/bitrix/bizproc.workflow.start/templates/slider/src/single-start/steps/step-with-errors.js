import { Type } from 'main.core';
import { clearInvalidControls, findUnfilledRequiredControl, markInvalidControls } from 'bizproc.a11y';

import { ErrorNotifier } from '../../components/error-notifier';

import { Step } from './step';

export class StepWithErrors extends Step
{
	errorNotifier: ErrorNotifier;

	constructor(config)
	{
		super(config);

		this.errorNotifier = new ErrorNotifier({});
	}

	renderErrors(): HTMLElement
	{
		return this.errorNotifier.render();
	}

	showErrors(errors, form: ?HTMLFormElement = null)
	{
		if (Type.isArrayFilled(errors))
		{
			this.errorNotifier.errors = errors;
			this.errorNotifier.show();
			this.#focusInvalidControl(form);
		}
	}

	cleanErrors(form: ?HTMLFormElement = null)
	{
		this.errorNotifier.errors = [];
		this.errorNotifier.clean();

		if (Type.isDomNode(form))
		{
			clearInvalidControls(form);
		}
	}

	// the announcement alone leaves a keyboard user with no idea where the error is, so the focus
	// goes to the field itself; the message is bound to the control and read together with its name
	#focusInvalidControl(form: ?HTMLFormElement): void
	{
		if (!Type.isDomNode(form))
		{
			return;
		}

		clearInvalidControls(form);

		const fields = [...this.errorNotifier.messageIdByField].map(
			([name, messageId]) => ({ name, messageId }),
		);

		// errors without a field key still point at a required field left empty
		const control = markInvalidControls(form, fields) ?? findUnfilledRequiredControl(form);
		control?.focus();
	}
}
