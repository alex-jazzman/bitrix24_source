import { Page, Uri } from 'main.core';
import { SidePanel, type Slider } from 'main.sidepanel';
import { inject, type InjectionKey } from 'ui.vue3';

import { type PathsState } from '../../model/compose/types';

/**
 * The message list answers this parameter with a way out instead of an error: a mailbox that cannot be shown
 * leads to the start screen of the mail (`mail.client.message.list/class.php`).
 */
const StrictParam = Object.freeze({ strict: 'N' });

export type CloseComposeForm = () => void;

export const closeComposeFormKey: InjectionKey<CloseComposeForm> = Symbol('mail-compose-form-close');

const noop = (): void => {};

/** Provided by the bootstrap class alone; a component mounted without it closes nothing. */
export function useCloseComposeForm(): CloseComposeForm
{
	return inject(closeComposeFormKey, noop);
}

export type CloseFormParams = {
	/**
	 * `ComposeForm.destroy()` emits the destroy event, the only signal the large attachments have to clean a
	 * conversion set off Disk.
	 */
	destroyForm: () => void,
	/** Addresses the form leaves to when it stands in no panel. */
	paths: PathsState,
};

/**
 * The way out the form does not start itself: the panel is closing already, by its own control or by Escape,
 * and the form only has to take itself down and leave no copy of itself behind.
 */
export function releaseComposeForm(destroyForm: () => void): void
{
	try
	{
		destroyForm();
	}
	finally
	{
		// A cached panel reopened at the same address would bring the previously typed text back with it,
		// so a teardown that throws must not leave the panel cacheable.
		SidePanel.Instance.getSliderByWindow(window)?.setCacheable(false);
	}
}

/**
 * The form is taken down before the panel closes: closing the panel takes the frame of the form with it, and
 * a form that never learned of its own end would leave its events unsent. Only the panel of this form closes,
 * so a reply opened over the original message leaves that screen open.
 */
export function closeComposeForm(params: CloseFormParams): void
{
	try
	{
		releaseComposeForm(params.destroyForm);
	}
	finally
	{
		// The way out is taken even by a teardown that throws: a form left on screen is already half torn down.
		const slider: Slider | null = SidePanel.Instance.getSliderByWindow(window);
		if (slider)
		{
			slider.close();
		}
		else
		{
			leaveToList(params.paths);
		}
	}
}

/** The redirect of the core passes an address of the portal alone, so a path of the payload leads nowhere else. */
function leaveToList(paths: PathsState): void
{
	const path = paths.messageList ?? paths.home;
	if (path === '')
	{
		return;
	}

	Page.redirect(Uri.addParam(path, StrictParam));
}
