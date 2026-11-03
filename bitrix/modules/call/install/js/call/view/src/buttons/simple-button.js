import { Dom, Loc, Text, Type } from 'main.core';
// registers the <visually-hidden> custom element used by the counter description
import 'ui.a11y';

import { AriaHasPopup } from './helpers/aria';
import { createCssTooltip } from './helpers/create-css-tooltip';
import { guardedClick } from './helpers/guarded-click';
import { panelTestId } from './helpers/test-id';

// Popup kind of the view contract mapped onto the ARIA token: the two vocabularies coincide today
// but are not the same thing. An unknown kind maps to nothing and announces no layer at all.
const ariaHasPopupOfKind = new Map([
	['menu', AriaHasPopup.Menu],
	['dialog', AriaHasPopup.Dialog],
]);

export class SimpleButton
{
	constructor(config)
	{
		this.class = config.class;
		// the panel the button belongs to names the hook namespace; the button itself does not know it
		this.testId = panelTestId(this.class, config.testIdPrefix);
		this.backgroundClass = config.backgroundClass ?? '';
		this.backgroundClass = `bx-messenger-videocall-panel-icon-background${this.backgroundClass ? ' ' : ''}${this.backgroundClass}`;
		this.blocked = config.blocked === true;

		this.tooltip = createCssTooltip(Type.isPlainObject(config.tooltip) ? config.tooltip : {});

		this.text = config.text ?? '';
		this.isActive = false;
		// render() always starts the badge at zero, so there is nothing to take from the config
		this.counter = 0;
		this.isComingSoon = config.isComingSoon || false;
		// per instance: the same class renders both in the panel and in the picture-in-picture window,
		// so a fixed id would end up duplicated in the DOM
		this.comingSoonId = `bx-messenger-videocall-panel-item-coming-soon-${Text.getRandom()}`;
		// what the counter means is known to the owner of the button, not to the button:
		// the phrase takes #COUNT#, so the key is passed in and not the ready text
		this.counterDescriptionMessageKey = config.counterDescriptionMessageKey ?? '';
		// a button whose owner named no phrase never gets a description, so it needs neither id nor node
		this.counterDescriptionId = this.counterDescriptionMessageKey === ''
			? ''
			: `bx-messenger-videocall-panel-item-counter-description-${Text.getRandom()}`;
		// accessible name for icon-only buttons; buttons with a visible text label must not pass this (WCAG 2.5.3)
		this.ariaLabel = config.ariaLabel ?? '';
		// opt-in toggle semantics: only buttons with a persistent on/off state expose aria-pressed
		this.isToggle = config.isToggle === true;
		// opt-in disclosure semantics: buttons that open a popup/menu expose aria-haspopup + aria-expanded
		// setPopupKind() wins on a rendered button: this value is applied once, by the first render()
		this.ariaHasPopup = config.ariaHasPopup ?? '';
		// a kind written while the layer of this button is open is kept aside and applied on close
		this.isPopupOpen = false;
		this.deferredPopupKind = null;
		this.hasDeferredPopupKind = false;
		// opt-in state description: the button carries the state of its feature as a description,
		// which keeps the state readable under Tab without touching the name of the button
		this.stateDescriptionId = config.hasStateDescription === true
			? `bx-messenger-videocall-panel-item-state-description-${Text.getRandom()}`
			: '';
		this.stateDescriptionText = '';

		this.elements = {
			root: null,
			counter: null,
			counterDescription: null,
			stateDescription: null,
			comingSoon: null,
		};

		this.callbacks = {
			onClick: guardedClick(this, Type.isFunction(config.onClick) ? config.onClick : () => {}),
		};
	}

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		const textNode = this.text === '' ? null : Dom.create('div', {
			props: { className: 'bx-messenger-videocall-panel-text' },
			attrs: { 'data-testid': `${this.testId}-text` },
			children: [
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-panel-text-content' },
					text: this.text,
				}),
			],
		});

		this.elements.counterDescription = this.#createDescriptionNode(
			this.counterDescriptionId,
			'counter-description',
		);
		this.elements.stateDescription = this.#createDescriptionNode(
			this.stateDescriptionId,
			'state-description',
			this.stateDescriptionText,
		);

		const {
			tooltipClass, tooltipStyle,
		} = this.tooltip;

		this.elements.root = Dom.create('button', {
			props: {
				type: 'button',
				className: `bx-messenger-videocall-panel-item ${tooltipClass}${
					this.blocked ? ' blocked' : ''}${
					this.isComingSoon ? ' coming-soon' : ''}`,
			},
			attrs: { style: tooltipStyle, 'data-testid': this.testId },
			children: [
				Dom.create('div', {
					props: { className: this.backgroundClass },
					children: [
						Dom.create('div', {
							props: {
								className: `bx-messenger-videocall-panel-icon bx-messenger-videocall-panel-icon-${
									this.class}`,
							},
							attrs: { 'aria-hidden': 'true' },
						}),
						this.elements.counter = Dom.create('span', {
							props: { className: 'bx-messenger-videocall-panel-item-counter' },
							attrs: { 'aria-hidden': 'true', 'data-testid': `${this.testId}-counter` },
							text: '0',
							dataset: {
								counter: '0',
								counterType: 'digits',
							},
						}),
						this.elements.counterDescription,
						this.elements.stateDescription,
						this.elements.comingSoon = Dom.create('span', {
							props: { className: 'bx-messenger-videocall-panel-item-coming-soon' },
							attrs: {
								id: this.comingSoonId,
								'aria-hidden': 'true',
								'data-testid': `${this.testId}-coming-soon`,
							},
							text: Loc.getMessage('CALL_FEATURES_COMING_SOON_MSGVER_1'),
							dataset: {
								visible: this.isComingSoon ? 'Y' : 'N',
							},
						}),
					],
				}),
				textNode,
			],
			events: {
				click: this.callbacks.onClick,
			},
		});

		this.#applyInitialState();
		this.syncDescribedBy();

		return this.elements.root;
	}

	#applyInitialState()
	{
		if (this.isActive)
		{
			Dom.addClass(this.elements.root, 'active');
		}

		if (this.isToggle)
		{
			this.elements.root.setAttribute('aria-pressed', this.isActive ? 'true' : 'false');
		}

		if (this.blocked)
		{
			this.elements.root.setAttribute('aria-disabled', 'true');
		}

		if (this.ariaLabel)
		{
			this.elements.root.setAttribute('aria-label', this.ariaLabel);
		}

		if (this.ariaHasPopup)
		{
			this.elements.root.setAttribute('aria-haspopup', this.ariaHasPopup);
			this.elements.root.setAttribute('aria-expanded', 'false');
		}
	}

	// A description node exists only for a button whose owner opted into that description: for the
	// rest it would stay empty forever, and an empty custom element still costs an upgrade.
	#createDescriptionNode(id, testIdSuffix, text = '')
	{
		if (id === '')
		{
			return null;
		}

		return Dom.create('visually-hidden', {
			attrs: {
				id,
				// the description lives inside the button, so aria-hidden keeps its text
				// out of the accessible name; aria-describedby still resolves it
				'aria-hidden': 'true',
				'data-testid': `${this.testId}-${testIdSuffix}`,
			},
			text,
		});
	}

	// single point that assembles aria-describedby out of the currently active description sources
	syncDescribedBy()
	{
		if (!this.elements.root)
		{
			return;
		}

		const describedBy = [
			this.isComingSoon ? this.comingSoonId : '',
			this.hasCounterDescription() ? this.counterDescriptionId : '',
			this.stateDescriptionText === '' ? '' : this.stateDescriptionId,
		].filter(Boolean);

		if (describedBy.length === 0)
		{
			this.elements.root.removeAttribute('aria-describedby');

			return;
		}

		this.elements.root.setAttribute('aria-describedby', describedBy.join(' '));
	}

	// the badge caps at 99+, so the description is the only place carrying the exact number
	getCounterDescriptionText()
	{
		if (this.counter <= 0 || this.counterDescriptionMessageKey === '')
		{
			return '';
		}

		// a lost phrase leaves nothing to say: getMessage returns nothing for an unknown key
		return Loc.getMessage(this.counterDescriptionMessageKey, { '#COUNT#': this.counter }) ?? '';
	}

	// an empty description reads worse than no description, so the text decides, not the key
	hasCounterDescription()
	{
		return this.getCounterDescriptionText() !== '';
	}

	syncCounterDescription()
	{
		if (!this.elements.counterDescription)
		{
			return;
		}

		this.elements.counterDescription.textContent = this.getCounterDescriptionText();

		this.syncDescribedBy();
	}

	// Spoken after the name of the button and never as part of it: the name of the element the user
	// is focused on must not change under them (WCAG 2.5.3). Empty text takes the description away.
	setStateDescription(text)
	{
		const stateText = Type.isString(text) ? text : '';

		if (this.stateDescriptionText === stateText)
		{
			return;
		}

		this.stateDescriptionText = stateText;

		if (!this.elements.stateDescription)
		{
			return;
		}

		this.elements.stateDescription.textContent = stateText;

		this.syncDescribedBy();
	}

	setActive(isActive)
	{
		if (this.isActive === isActive)
		{
			return;
		}
		this.isActive = isActive;
		if (!this.elements.root)
		{
			return;
		}

		if (this.isActive)
		{
			Dom.addClass(this.elements.root, 'active');
		}
		else
		{
			Dom.removeClass(this.elements.root, 'active');
		}

		if (this.isToggle)
		{
			this.elements.root.setAttribute('aria-pressed', this.isActive ? 'true' : 'false');
		}

		const {
			hasTooltip, getTooltipText, tooltipTextVarName,
		} = this.tooltip;

		if (hasTooltip)
		{
			Dom.style(this.elements.root, tooltipTextVarName, `'${getTooltipText()}'`);
		}
	}

	// Safe on a button that has not been rendered yet: the caller synchronises again after render.
	setPopupKind(kind)
	{
		if (this.isPopupOpen)
		{
			this.deferredPopupKind = kind;
			this.hasDeferredPopupKind = true;

			return;
		}

		this.#applyPopupKind(kind);
	}

	// Told by the owner of the layer, not guessed from the DOM: while it lives the layer owns
	// aria-expanded of the trigger and puts its own snapshot back on destroy.
	setPopupOpen(isOpen)
	{
		if (this.isPopupOpen === isOpen)
		{
			return;
		}

		this.isPopupOpen = isOpen;

		if (this.isPopupOpen || !this.hasDeferredPopupKind)
		{
			return;
		}

		const kind = this.deferredPopupKind;
		this.deferredPopupKind = null;
		this.hasDeferredPopupKind = false;

		this.#applyPopupKind(kind);
	}

	#applyPopupKind(kind)
	{
		if (!this.elements.root)
		{
			return;
		}

		const ariaHasPopup = ariaHasPopupOfKind.get(kind) ?? '';

		if (ariaHasPopup === '')
		{
			this.elements.root.removeAttribute('aria-haspopup');
			this.elements.root.removeAttribute('aria-expanded');

			return;
		}

		this.elements.root.setAttribute('aria-haspopup', ariaHasPopup);

		// aria-expanded belongs to the menu pattern; a dialog is not an expanded state of its
		// trigger, and a "false" left over from a previous kind would freeze into a lie
		if (ariaHasPopup === AriaHasPopup.Menu)
		{
			this.elements.root.setAttribute('aria-expanded', 'false');

			return;
		}

		this.elements.root.removeAttribute('aria-expanded');
	}

	setBlocked(isBlocked)
	{
		if (this.blocked === isBlocked)
		{
			return;
		}

		this.blocked = isBlocked;
		if (this.blocked)
		{
			Dom.addClass(this.elements.root, 'blocked');
			this.elements.root.setAttribute('aria-disabled', 'true');
		}
		else
		{
			Dom.removeClass(this.elements.root, 'blocked');
			this.elements.root.removeAttribute('aria-disabled');
		}
	}

	setCounter(counter)
	{
		this.counter = parseInt(counter, 10);

		if (Number.isNaN(this.counter))
		{
			this.counter = 0;
			this.elements.counter.dataset.counter = 0;
			this.elements.counter.dataset.counterType = 'digits';
			this.elements.counter.innerText = 0;
			this.syncCounterDescription();

			return;
		}

		let counterLabel = this.counter;
		const counterData = counterLabel;

		if (counterLabel > 99)
		{
			counterLabel = '99+';
		}

		let counterType = 'digits';
		if (counterLabel.toString().length === 2)
		{
			counterType = 'dozens';
		}
		else if (counterLabel.toString().length > 2)
		{
			counterType = 'hundreds';
		}

		this.elements.counter.dataset.counter = counterData;
		this.elements.counter.dataset.counterType = counterType;
		this.elements.counter.innerText = counterLabel;
		this.syncCounterDescription();
	}

	setIsComingSoon(isActive)
	{
		this.isComingSoon = isActive;

		if (this.isComingSoon)
		{
			this.elements.comingSoon.dataset.visible = 'Y';
		}
		else
		{
			this.elements.comingSoon.dataset.visible = 'N';
		}

		if (this.isComingSoon)
		{
			Dom.addClass(this.elements.root, 'coming-soon');
		}
		else
		{
			Dom.removeClass(this.elements.root, 'coming-soon');
		}

		this.syncDescribedBy();
	}
}
