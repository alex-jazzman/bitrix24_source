import { Event, Reflection, Runtime, Type } from 'main.core';

const stepHeadingId = 'landing-master-step-title';
const serverErrorsId = 'landing-master-errors';
const sliderTriggerSelector = '[data-landing-master-slider]';

/**
 * Single owner of announcements and focus moves in the store creation wizard.
 * Inline scripts of the template report a fact through this interface and never announce themselves.
 */
export class SiteMasterA11y
{
	constructor()
	{
		this.lastMessage = null;
		this.trigger = null;

		Event.ready(() => {
			this.focusLoadTarget();
			this.bindSliderTriggers();
		});
	}

	announce(message: string, politeness: string = 'polite'): void
	{
		if (!Type.isStringFilled(message) || this.isDuplicate(message))
		{
			return;
		}

		this.lastMessage = message;

		// the facade is resolved at the moment of the call: the bundle is evaluated before the template
		// loads its extensions. The template loads it on the server, so the namespace of the page answers
		// without a request; a page that carries none loads it instead, and a failed announcement must not
		// break the wizard
		const facade = Reflection.getClass('BX.Landing.UI.A11y');

		if (facade)
		{
			facade.announce(message, politeness);

			return;
		}

		Runtime.loadExtension('landing.ui.a11y')
			.then(({ A11y }) => A11y.announce(message, politeness))
			.catch(() => {
				// a text nobody heard is no duplicate of itself, so a lost message leaves no trace behind;
				// a message that came after it owns the change and keeps its own
				if (this.lastMessage === message)
				{
					this.lastMessage = null;
				}
			});
	}

	/**
	 * Suppresses a duplicate inside a single change, but lets a new event voice the same text again.
	 */
	isDuplicate(message: string): boolean
	{
		return message === this.lastMessage;
	}

	/**
	 * Ends the current change: the same text may be voiced again. The boundary is an event, never a timeout.
	 * Moves no focus, so inline scripts of the steps call it for events that move none;
	 * focusLoadTarget() and focusStepHeading() call it themselves.
	 */
	endChange(): void
	{
		this.lastMessage = null;
	}

	/**
	 * Chooses where the reading point starts after a page load.
	 * Server errors are rendered above the step heading and a server-rendered alert is never voiced by
	 * a live region, so they become the focus target themselves; otherwise focus goes to the heading.
	 * A loaded page is a new change whichever target takes the reading point.
	 */
	focusLoadTarget(): void
	{
		this.endChange();

		const errors = document.getElementById(serverErrorsId);

		if (errors)
		{
			errors.focus({ preventScroll: true });

			return;
		}

		this.focusStepHeading();
	}

	/**
	 * A step presented to the user is a new change: what was said about the previous one may be said again.
	 */
	focusStepHeading(): void
	{
		this.endChange();

		const heading = document.getElementById(stepHeadingId);

		if (heading)
		{
			heading.focus({ preventScroll: true });
		}
	}

	rememberTrigger(node: HTMLElement): void
	{
		this.trigger = Type.isDomNode(node) ? node : null;
	}

	restoreTrigger(): void
	{
		const trigger = this.trigger;
		this.trigger = null;

		if (trigger && document.contains(trigger))
		{
			trigger.focus({ preventScroll: true });
		}
	}

	/**
	 * A link marked as a slider trigger opens its page in a slider instead of a tab of the browser.
	 * The mark belongs to the markup of the step: the module owns the reading point of such a link and
	 * knows nothing about the step it lives on.
	 */
	bindSliderTriggers(): void
	{
		document.querySelectorAll(sliderTriggerSelector).forEach((trigger: HTMLElement) => {
			Event.bind(trigger, 'click', (event: MouseEvent) => {
				this.openInSlider(event, trigger);
			});
		});
	}

	/**
	 * Gives the reading point back to the link once the slider is closed: left alone it falls to the top
	 * of the page and the step starts over.
	 */
	openInSlider(event: MouseEvent, trigger: HTMLElement): void
	{
		// a click asking for a tab or a window of its own is left to the browser: the slider gives neither
		if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0)
		{
			return;
		}

		// the side panel is a global of the page and not an import of the bundle; without it the link is
		// left to the browser and still leads to the same page
		const sidePanel = window.BX && window.BX.SidePanel ? window.BX.SidePanel.Instance : null;

		if (!sidePanel)
		{
			return;
		}

		event.preventDefault();
		this.rememberTrigger(trigger);

		sidePanel.open(trigger.getAttribute('href'), {
			data: { rightBoundary: 0 },
			events: {
				onCloseComplete: () => {
					this.restoreTrigger();
				},
			},
		});
	}
}

export const siteMasterA11y = new SiteMasterA11y();
