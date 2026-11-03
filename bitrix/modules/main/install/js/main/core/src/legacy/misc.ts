import { BX } from './internal/global';
import { delegate } from './delegate';
import { fireEvent } from './events';

/**
 * The two symbols that found no smaller home (MOD-01).
 *
 * `misc.ts` is deliberately small. MOD-01 keeps a symbol with the module it belongs with rather
 * than in a catch-all: `False` and `DoNothing` live in `events.ts`, where their identity matters,
 * `parseJSON` in `html.ts`, `clearNodeCache` and `createFragment` in `dom-traverse.ts`. What is
 * left here is the session-id reader and the form submitter, and they share nothing but the fact
 * that the submitter calls the reader.
 */

export function bitrix_sessid(): any
{
	return BX.message('bitrix_sessid');
}

export function submit(obForm: any, action_name?: any, action_value?: any, onAfterSubmit?: any): void
{
	action_name = action_name || 'save';
	if (!obForm[`BXFormSubmit_${action_name}`])
	{
		obForm[`BXFormSubmit_${action_name}`] = obForm.appendChild(BX.create('INPUT', {
			props: {
				type: 'submit',
				name: action_name,
				value: action_value || 'Y',
			},
			style: {
				display: 'none',
			},
		}));
	}

	if (obForm.sessid)
	{
		obForm.sessid.value = bitrix_sessid();
	}

	setTimeout(delegate(function(this: any) {
		fireEvent(this, 'click');
		if (onAfterSubmit)
		{
			onAfterSubmit();
		}
	}, obForm[`BXFormSubmit_${action_name}`]), 10);
}
