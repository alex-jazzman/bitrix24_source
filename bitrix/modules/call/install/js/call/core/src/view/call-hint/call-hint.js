import { Browser, Dom, Event, Loc, Text, Type } from 'main.core';
import { Popup } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';
import { Button } from 'ui.buttons';

import Util from '../../util';
import { AutoClosePauseReason, AutoClosePolicy } from './auto-close-policy';
import { buildHintMessage } from './hint-message';

const doNothing = () => {};

const HintBackground = '#00428F';
const HintBorderRadius = '27px';

const Politeness = Object.freeze({
	Polite: 'polite',
});

const HandRaiseIconClassName = 'bx-call-view-popup-call-hint-hand-raise-icon';

const FocusableAnchorSelector = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const HiddenFromAssistiveSelector = '[aria-hidden="true"]';

/**
 * Scenario identifiers. The call site names its case with one of these and passes no accessibility
 * parameters at all: role, focus trap, Escape, auto-close base and accessible name come from the
 * factory.
 * @readonly
 */
export const CallHintScenario = Object.freeze({
	MicMuted: 'mic-muted',
	AutoMicMute: 'auto-mic-mute',
	FloorRequest: 'floor-request',
	RoomJoined: 'room-joined',
	MicTakenFrom: 'mic-taken-from',
	MicTakenBy: 'mic-taken-by',
});

const Kind = Object.freeze({
	Notification: 'notification',
	Dialog: 'dialog',
});

// the role follows the kind of hint; it does not depend on the scenario
const KindTraits = Object.freeze({
	[Kind.Notification]: { role: 'group' },
	[Kind.Dialog]: { role: 'dialog' },
});

const NotificationDelay = 10000;
const FloorRequestDelay = 30 * 60 * 1000;
const NoAutoClose = 0;

/**
 * Accessible name, auto-close base and announcement politeness per scenario.
 *
 * Every hint announces politely. Nothing the call window announces interrupts the screen reader:
 * "call ended" and "connection lost" do not reach this live region at all.
 */
const ScenarioTraits = Object.freeze({
	[CallHintScenario.MicMuted]: {
		ariaLabelPhrase: 'CALL_HINT_ARIA_MIC',
		autoCloseDelay: NotificationDelay,
		politeness: Politeness.Polite,
	},
	[CallHintScenario.AutoMicMute]: {
		ariaLabelPhrase: 'CALL_HINT_ARIA_MIC',
		autoCloseDelay: NotificationDelay,
		politeness: Politeness.Polite,
	},
	[CallHintScenario.FloorRequest]: {
		ariaLabelPhrase: 'CALL_HINT_ARIA_FLOOR_REQUEST',
		autoCloseDelay: FloorRequestDelay,
		politeness: Politeness.Polite,
	},
	[CallHintScenario.RoomJoined]: {
		ariaLabelPhrase: 'CALL_HINT_ARIA_ROOM_JOINED',
		autoCloseDelay: NoAutoClose,
		politeness: Politeness.Polite,
	},
	[CallHintScenario.MicTakenFrom]: {
		ariaLabelPhrase: 'CALL_HINT_ARIA_MIC_TRANSFER',
		autoCloseDelay: NotificationDelay,
		politeness: Politeness.Polite,
	},
	[CallHintScenario.MicTakenBy]: {
		ariaLabelPhrase: 'CALL_HINT_ARIA_MIC_TRANSFER',
		autoCloseDelay: NotificationDelay,
		politeness: Politeness.Polite,
	},
});

const DefaultTraits = {
	ariaLabelPhrase: 'CALL_HINT_ARIA_MIC',
	autoCloseDelay: NotificationDelay,
	politeness: Politeness.Polite,
};

function toPlainText(value)
{
	return Type.isStringFilled(value) ? value.replaceAll(/\s+/g, ' ').trim() : '';
}

/**
 * A dark hint plate inside the call window: icon, message, action buttons and a close button.
 *
 * The component does not decide when to appear - NotificationService does. What it does own is
 * everything a hint needs to be perceivable: the role it exposes, its accessible name, the flat
 * text it announces and the single path every close goes through.
 *
 * Two ways in, and they no longer behave alike. A factory with a scenario is the supported one: the
 * scenario carries the role, the politeness and the auto-close base. The bare constructor stays for
 * `BX.Call.Hint` callers and falls back to DefaultTraits (10s, polite); the hotkey line it used to
 * append on desktop unconditionally now takes an explicit showSpaceHint, because that line speaks
 * about the microphone and belongs to the two mute scenarios alone.
 */
export class CallHint
{
	#role;
	#ariaLabelPhrase;
	#politeness;
	#autoClose;
	#announcement = '';
	#closeNotified = false;

	/**
	 * @param {object} options - see the constructor
	 * @return {CallHint}
	 */
	static notification(options = {})
	{
		return new CallHint(options, Kind.Notification);
	}

	/**
	 * Differs from a notification by role and accessible name - but not by the focus trap and not by
	 * moving focus inside: a hint never takes focus away from the call.
	 *
	 * @param {object} options - see the constructor
	 * @return {CallHint}
	 */
	static dialog(options = {})
	{
		return new CallHint(options, Kind.Dialog);
	}

	/**
	 * @param {object} options
	 * @param {string} [options.scenario] - scenario identifier from CallHintScenario
	 * @param {string} [options.title] - message body, may arrive as ready-made markup
	 * @param {string} [options.announceText] - flat text announced instead of the message body
	 * @param {HTMLElement} [options.bindElement] - popup anchor and the source focus returns to
	 * @param {HTMLElement} [options.targetContainer] - mount container
	 * @param {boolean} [options.callFolded]
	 * @param {string} [options.icon] - css class of the decorative icon
	 * @param {string} [options.buttonsLayout] - 'right' | 'bottom'
	 * @param {Array} [options.buttons] - action buttons
	 * @param {boolean} [options.showSpaceHint] - whether the hotkey hint is needed; scenarios 1 and 2 only
	 * @param {boolean} [options.showAngle] - passed through to the popup angle
	 * @param {string} [options.customClassName] - extra popup class
	 * @param {number} [options.autoCloseDelay] - overrides the auto-close base of the scenario
	 * @param {Function} [options.customRender] - replaces the middle block entirely
	 * @param {string} [options.initiatorName] - read from customRender
	 * @param {Function} [options.onAskSpeakButtonClicked]
	 * @param {Function} [options.onClose] - called once, whichever way the hint closes
	 * @param {string} [kind] - internal: which factory built the instance
	 */
	constructor(options = {}, kind = Kind.Notification)
	{
		const { role } = KindTraits[kind] ?? KindTraits[Kind.Notification];
		const traits = ScenarioTraits[options.scenario] ?? DefaultTraits;

		this.#role = role;
		this.#ariaLabelPhrase = traits.ariaLabelPhrase;
		this.#politeness = traits.politeness;

		this.popup = null;

		this.title = Type.isString(options.title)
			? options.title
			: Text.encode(Loc.getMessage('IM_CALL_MIC_MUTED_WHILE_TALKING'));

		// the live region cuts an announcement off at 160 characters with nothing to reach the rest
		// by, so a case whose content does not fit says what to announce in its place; the shown text
		// stays as it is
		this.announceText = toPlainText(options.announceText);
		this.icon = Type.isStringFilled(options.icon) ? options.icon : 'mic';

		this.bindElement = Type.isDomNode(options.bindElement) ? options.bindElement : null;
		this.targetContainer = Type.isDomNode(options.targetContainer) ? options.targetContainer : null;
		this.callFolded = options.callFolded === true;
		this.showAngle = options.showAngle === true;
		// off unless the case asks for it: the hotkey hint belongs to the two mute scenarios, not to
		// every hint that happens to be shown on desktop
		this.showSpaceHint = options.showSpaceHint === true;

		// the base belongs to the scenario; an explicit value still wins for the legacy entry point
		this.autoCloseDelay = Type.isNumber(options.autoCloseDelay) ? options.autoCloseDelay : traits.autoCloseDelay;

		this.customClassName = Type.isStringFilled(options.customClassName) ? options.customClassName : '';
		this.initiatorName = Type.isStringFilled(options.initiatorName) ? options.initiatorName : '';
		this.customRender = Type.isFunction(options.customRender) ? options.customRender : null;

		this.buttonsLayout = options.buttonsLayout === 'bottom' ? 'bottom' : 'right';
		this.buttons = Type.isArray(options.buttons) ? options.buttons : [];

		this.callbacks = {
			onClose: Type.isFunction(options.onClose) ? options.onClose : doNothing,
			onAskSpeakButtonClicked: Type.isFunction(options.onAskSpeakButtonClicked)
				? options.onAskSpeakButtonClicked
				: doNothing,
		};

		this.#autoClose = this.#createAutoClose();
	}

	show()
	{
		if (!this.popup)
		{
			this.popup = new Popup(this.getPopupOptions());
			this.#closeNotified = false;
			// the previous policy is terminal once the hint has been closed, so a hint shown again
			// counts down on a policy of its own
			this.#autoClose = this.#createAutoClose();
			this.#bindAutoClosePauses();
		}

		this.popup.show();
		this.#autoClose.start();
		this.#announce();
	}

	close()
	{
		this.popup?.close();
	}

	destroy()
	{
		this.#autoClose.destroy();
		this.popup?.destroy();
	}

	/**
	 * Built apart from the popup on purpose: what the hint exposes to assistive technology has to be
	 * readable without a live call.
	 *
	 * @return {object}
	 */
	getPopupOptions()
	{
		return {
			bindElement: this.bindElement,
			targetContainer: this.targetContainer,
			content: this.render(),
			padding: 0,
			contentPadding: 0,
			className: ['bx-call-view-popup-call-hint', this.customClassName].filter(Boolean).join(' '),
			background: HintBackground,
			contentBackground: HintBackground,
			darkMode: true,
			contentBorderRadius: HintBorderRadius,
			borderRadius: HintBorderRadius,
			angle: (this.showAngle && this.bindElement),
			role: this.#role,
			ariaLabel: Loc.getMessage(this.#ariaLabelPhrase),
			// main.popup builds a focus trap itself when the option is omitted and the portal
			// setting is on - and a hint must never hold focus inside the call
			focusTrap: false,
			closeByEsc: true,
			events: {
				onPopupClose: () => this.#handleClose(),
				onPopupDestroy: () => {
					this.popup = null;
				},
			},
		};
	}

	render()
	{
		return Dom.create('div', {
			props: { className: `bx-call-view-popup-call-hint-body layout-${this.buttonsLayout}` },
			attrs: { 'data-testid': 'call-hint' },
			children: [
				Dom.create('div', {
					props: { className: `bx-call-view-popup-call-hint-icon ${this.icon}` },
					attrs: { 'aria-hidden': 'true', 'data-testid': 'call-hint-icon' },
				}),
				this.#renderMessage(),
				(this.buttonsLayout === 'right' ? this.#renderButtons() : null),
				this.#renderCloseButton(),
			],
		});
	}

	createAskSpeakButton()
	{
		return new Button({
			baseClass: 'ui-btn',
			text: Loc.getMessage('CALL_RISE_YOU_HAND_IN_HINT'),
			size: Button.Size.EXTRA_SMALL,
			color: Button.Color.LIGHT_BORDER,
			noCaps: true,
			round: true,
			dataset: { testid: 'call-hint-ask-speak-btn' },
			events: {
				click: () => {
					this.callbacks.onAskSpeakButtonClicked();
				},
			},
		});
	}

	#renderMessage()
	{
		if (this.customRender)
		{
			const content = this.customRender();

			this.#describeHandRaiseIcon(content);
			this.#announcement = this.#toAnnouncement(content);

			return content;
		}

		const message = buildHintMessage({
			title: this.title,
			isDesktop: Util.isDesktop(),
			isPushToTalkAvailable: Util.isPushToTalkAvailable(),
			isMac: Browser.isMac(),
			callFolded: this.callFolded,
			showSpaceHint: this.showSpaceHint,
			buttonsLayout: this.buttonsLayout,
		});

		this.#announcement = message.text;

		return Dom.create('div', {
			props: { className: 'bx-call-view-popup-call-hint-middle-block' },
			attrs: { 'data-testid': 'call-hint-message' },
			children: [
				Dom.create('div', {
					props: { className: 'bx-call-view-popup-call-hint-text' },
					attrs: { 'data-testid': 'call-hint-text' },
					html: message.html,
				}),
				(this.buttonsLayout === 'bottom' ? this.#renderButtons() : null),
			],
		});
	}

	#renderButtons()
	{
		return Dom.create('div', {
			props: { className: 'bx-call-view-popup-call-hint-buttons-container' },
			attrs: { 'data-testid': 'call-hint-buttons' },
			children: this.buttons.map((button) => button.render()),
		});
	}

	#renderCloseButton()
	{
		return Dom.create('button', {
			props: {
				type: 'button',
				className: 'bx-call-view-popup-call-hint-close',
			},
			attrs: {
				'aria-label': Loc.getMessage('CALL_HINT_CLOSE_ARIA'),
				'data-testid': 'call-hint-close',
			},
			events: {
				click: () => this.close(),
			},
		});
	}

	/**
	 * The floor-request phrase puts an icon where a word belongs; without a text alternative the
	 * sentence breaks in the middle both for a screen reader and for the announcement.
	 *
	 * The name is an attribute rather than a hidden child: the icon is sized as an empty node, and a
	 * child of any kind takes that away from it.
	 *
	 * @param {HTMLElement} content
	 */
	#describeHandRaiseIcon(content)
	{
		content?.querySelectorAll?.(`.${HandRaiseIconClassName}`)?.forEach((icon) => {
			Dom.attr(icon, {
				role: 'img',
				'aria-label': Loc.getMessage('CALL_HINT_RISE_HAND_ICON_ALT'),
			});
		});
	}

	/**
	 * An element named for assistive tech stands in the flat text for its name: an icon put where a
	 * word belongs carries no text of its own.
	 *
	 * @param {HTMLElement} content
	 * @return {string}
	 */
	#toAnnouncement(content)
	{
		const copy = content?.cloneNode?.(true);

		copy?.querySelectorAll?.('[aria-label]')?.forEach((node) => {
			node.replaceWith(node.getAttribute('aria-label'));
		});

		return toPlainText(copy?.textContent);
	}

	/**
	 * Every way out - close button, timer, Escape and an external close() - arrives here through the
	 * popup close event, so the owner learns about the closing exactly once.
	 */
	#handleClose()
	{
		if (this.#closeNotified)
		{
			return;
		}

		this.#closeNotified = true;

		// the countdown outlives the popup otherwise: a floor-request hint keeps a closure alive for
		// half an hour after the user has closed it
		this.#autoClose.destroy();

		// the popup node is gone right after destroy(), so the check has to happen before it
		const focusWasInside = this.popup?.getPopupContainer()?.contains(document.activeElement) === true;

		this.callbacks.onClose();
		this.popup?.destroy();
		this.popup = null;

		// destroy() takes the focused node out of the document, so the keyboard has to be given a
		// place to land. A hint that closed by itself while the user was elsewhere leaves focus alone
		if (focusWasInside)
		{
			this.#focusAnchor();
		}
	}

	#focusAnchor()
	{
		const anchor = this.#resolveFocusAnchor();

		if (!anchor)
		{
			return;
		}

		// an anchor that cannot take focus on its own is made focusable programmatically; one that
		// already can keeps the place in the tab order it was given
		if (!anchor.hasAttribute('tabindex') && anchor.tabIndex < 0)
		{
			Dom.attr(anchor, 'tabindex', -1);
		}

		anchor.focus();
	}

	/**
	 * The popup is anchored where the call site wants it drawn, and in the call panel that is a
	 * decorative glyph carrying aria-hidden inside the real button. Focus has to land on the control
	 * instead: on the glyph the browser voids aria-hidden, and the screen reader is handed a node with
	 * no accessible name.
	 *
	 * @returns {HTMLElement|null} element focus returns to, or null when there is nowhere safe to land
	 */
	#resolveFocusAnchor()
	{
		if (!this.bindElement)
		{
			return null;
		}

		const control = this.bindElement.closest(FocusableAnchorSelector);

		if (control)
		{
			return control;
		}

		// no control around and the anchor itself is hidden from assistive technology: <body> is a
		// better landing place than a node the screen reader is not meant to see. main.popup restores
		// focus to wherever it came from, so the keyboard is not lost by giving up here
		return this.bindElement.closest(HiddenFromAssistiveSelector) ? null : this.bindElement;
	}

	#createAutoClose()
	{
		return new AutoClosePolicy(this.autoCloseDelay, () => this.close());
	}

	#bindAutoClosePauses()
	{
		const container = this.popup?.getPopupContainer();

		if (!container)
		{
			return;
		}

		Event.bind(container, 'mouseenter', () => this.#autoClose.hold(AutoClosePauseReason.Hover));
		Event.bind(container, 'mouseleave', () => this.#autoClose.release(AutoClosePauseReason.Hover));
		Event.bind(container, 'focusin', () => this.#autoClose.hold(AutoClosePauseReason.Focus));
		Event.bind(container, 'focusout', (event) => {
			// focusout bubbles when focus only moves between elements of the same popup
			if (!container.contains(event.relatedTarget))
			{
				this.#autoClose.release(AutoClosePauseReason.Focus);
			}
		});
	}

	#announce()
	{
		const text = [this.announceText || this.#announcement, this.#announceActions()]
			.filter(Boolean)
			.join(' ');

		if (text === '')
		{
			return;
		}

		LiveAnnouncer.announce(text, this.#politeness);
	}

	/**
	 * A hint never takes focus and a notification is gone in ten seconds, so the announcement is the
	 * only place the actions can be learnt from before they disappear. Scenarios that build their
	 * content themselves keep their buttons inside it and pass none here.
	 *
	 * @return {string}
	 */
	#announceActions()
	{
		const names = this.buttons
			.map((button) => toPlainText(button.getText?.()))
			.filter(Boolean);

		if (names.length === 0)
		{
			return '';
		}

		return Loc.getMessage('CALL_HINT_ANNOUNCE_ACTIONS', { '#ACTIONS#': names.join(', ') });
	}
}
