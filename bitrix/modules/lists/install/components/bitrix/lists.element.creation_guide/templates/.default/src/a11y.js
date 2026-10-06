import { Dom, Event, Reflection, Text, Type } from 'main.core';
import { VisuallyHidden } from 'ui.a11y';

const HELPERS_NAMESPACE = 'BX.Bizproc.A11y';
const SIDE_PANEL_NAMESPACE = 'BX.SidePanel';
const FORM_SELECTOR = 'form';
const ROW_SELECTOR = 'tr';
// a field row owns its cells directly: layout rows and rows of a multiple field table must not match
const LABEL_CELL_SELECTOR = ':scope > td.bx-field-name';
const VALUE_CELL_SELECTOR = ':scope > td.bx-field-value';
const REQUIRED_MARK_SELECTOR = 'span.required';
const CALENDAR_ICON_SELECTOR = '.ui-ctl-icon-calendar';
// the input of a date field: it shares the container of the field with the icon of the calendar
const CALENDAR_CONTROL_SELECTOR = ':scope > input.ui-ctl-element';
// the tag selector of ui.entity-selector holds the value of a field in a hidden input and keeps its
// search box out of sight: the button that opens the list of items is the only node of such a field
// the keyboard reaches
const TAG_SELECTOR_BUTTON_SELECTOR = '.ui-tag-selector-add-button-caption';
const GENERATED_ID_PREFIX = 'lists-element-creation-guide-a11y';
const STEP_HEADING_LEVEL = '2';
// the pass repeats on every mutation of the form, so an already processed node has to be skipped:
// a second binding would turn one keypress into two calendars
const KEYBOARD_READY_ATTR = 'data-a11y-keyboard-ready';
// a button-like input is out of the pass: it already has a name in its value attribute,
// and aria-required is not allowed on the button role
const CONTROL_SELECTOR = 'input:not([type="hidden"]):not([type="button"]):not([type="submit"])'
	+ ':not([type="reset"]), select, textarea';
const OBSERVER_OPTIONS = Object.freeze({ childList: true, subtree: true });

type StepFormsA11yOptions = {
	calendarButtonLabel: string,
	calendarButtonTestIdPrefix: string,
};

type LabelFormControlsOptions = {
	blockSelector: string,
	labelSelector: string,
	contentSelector: string,
	controlSelector: string,
};

type InvalidControl = {
	name: string,
	messageId: string,
};

type AnnounceOptions = {
	assertive?: boolean,
	inTopWindow?: boolean,
};

type BizprocA11yHelpers = {
	labelFormControls: (root: HTMLElement, options: LabelFormControlsOptions) => void,
	announce: (message: string, options?: AnnounceOptions) => void,
	makeActivatable: (element: HTMLElement, handler: (event: MouseEvent) => void) => void,
	markInvalidControls: (root: HTMLElement, fields: Array<InvalidControl>) => ?HTMLElement,
	clearInvalidControls: (root: HTMLElement) => void,
	findUnfilledRequiredControl: (root: HTMLElement) => ?HTMLElement,
};

// a control of an erroneous field, resolved to the form of the step it belongs to
export type StepInvalidField = InvalidControl & {
	formRoot: HTMLFormElement,
};

/**
 * The component requires the lists module only, bizproc stays optional for it. Without that module
 * the helpers are absent and the a11y pass is skipped, so the wizard stays mouse-only. This is the
 * single place the absence is handled: the rest of the module works with a resolved value.
 */
function getA11yHelpers(): ?BizprocA11yHelpers
{
	return Reflection.getClass(HELPERS_NAMESPACE);
}

function getStepForms(stepNode: HTMLElement): Array<HTMLFormElement>
{
	if (!Type.isDomNode(stepNode))
	{
		return [];
	}

	return [...stepNode.querySelectorAll(FORM_SELECTOR)];
}

/**
 * Whether an element of this document holds the focus. A document with nothing focused reports its
 * body as the active element, and Firefox reports the root element instead once the document has been
 * given the focus from the outside, so neither of the two counts as a focused element.
 */
export function hasFocusedElement(): boolean
{
	const active = document.activeElement;

	return active !== null && active !== document.body && active !== document.documentElement;
}

/**
 * Whether the focus of the document above this frame stands on a node the user has reached themselves.
 * Until the frame of the wizard takes the focus, the document above keeps it on the frame or on a
 * wrapper of it — the container of the slider takes the focus when it opens — while any other node is
 * one the user has gone to on their own, the close button of the slider for instance, and the focus of
 * such a node must not be taken away.
 */
export function hasFocusAboveFrame(): boolean
{
	// absent for a document of its own, and for a frame of another origin: no document above to account for
	const frame = window.frameElement;
	if (!frame)
	{
		return false;
	}

	const active = frame.ownerDocument.activeElement;

	// contains() counts the node itself, so the frame and every wrapper of it are covered at once
	return active !== null && !active.contains(frame);
}

function hasFocusInside(stepNode: HTMLElement): boolean
{
	return Type.isDomNode(stepNode) && hasFocusedElement() && stepNode.contains(document.activeElement);
}

/**
 * An id of its own for a node aria-labelledby has to point at.
 */
function ensureId(node: HTMLElement): string
{
	if (!Type.isStringFilled(node.id))
	{
		Dom.attr(node, 'id', `${GENERATED_ID_PREFIX}-${Text.getRandom().toLowerCase()}`);
	}

	return node.id;
}

/**
 * Text for a screen reader only, invisible on the screen.
 */
export function visuallyHidden(text: string): HTMLElement
{
	const node = new VisuallyHidden();
	node.textContent = text;

	return node;
}

/**
 * Names the slider dialog the wizard is opened in. The side panel names it after the title of the page
 * it loads, and the page of this component has none, so the dialog reaches a screen reader unnamed.
 * Outside a slider the wizard is a page of its own and there is no dialog to name.
 */
export function nameSliderDialog(label: string): void
{
	const slider = Reflection.getClass(SIDE_PANEL_NAMESPACE)?.Instance?.getSliderByWindow(window);
	if (slider)
	{
		Dom.attr(slider.getContainer(), 'aria-label', label);
	}
}

/**
 * Binds the handler of a clickable node that is not a control, and gives the node the role, the Tab
 * stop and the keyboard activation of a button. Without the helpers the node stays mouse-only.
 */
export function makeActivatable(node: HTMLElement, handler: (event: MouseEvent) => void): void
{
	const helpers = getA11yHelpers();
	if (helpers)
	{
		helpers.makeActivatable(node, handler);

		return;
	}

	Event.bind(node, 'click', handler);
}

/**
 * Gives the step a heading of its own, for a screen reader only: the visible title above the steps
 * names the process and stays the same on every step. The heading is the focus target of a step change.
 */
export function addStepHeading(stepNode: HTMLElement, title: string): HTMLElement
{
	const heading = visuallyHidden(title);
	Dom.attr(heading, { role: 'heading', 'aria-level': STEP_HEADING_LEVEL, tabindex: '-1' });
	Dom.prepend(heading, stepNode);

	return heading;
}

/**
 * The focus goes to the heading and not to the first control: a screen reader speaks the element
 * the focus lands on, so a live region announcing the step at the same moment would compete with it.
 * The navigation buttons live outside the step content, so without this move the focus stays on them.
 */
export function focusStepHeading(heading: ?HTMLElement): void
{
	heading?.focus({ preventScroll: true });
}

/**
 * The wizard closes its slider right after a successful start, so the message has to outlive this
 * document: it is spoken by the live region of the top window. A polite message would be dropped
 * along the way, hence the assertive one.
 */
export function announceStartResult(message: string): void
{
	getA11yHelpers()?.announce(message, { assertive: true, inTopWindow: true });
}

/**
 * Takes the error mark off the controls of the step: cleaning the message container alone would
 * leave them with a description pointing at a node that no longer exists.
 */
export function clearStepInvalidControls(stepNode: HTMLElement): void
{
	const helpers = getA11yHelpers();
	getStepForms(stepNode).forEach((formRoot) => helpers?.clearInvalidControls(formRoot));
}

/**
 * Marks the controls the errors point at and moves the focus to the first of them. An error without
 * a field key points at a required field left empty.
 *
 * Whenever no control of the step got the focus, it goes to the node of the error alert: the button
 * that has just been pressed is disabled while the step is being saved, so by this moment the focus
 * of the document is on its body. A control is not always reachable either — the value of a tag
 * selector lives in a hidden field, and focus() on it does nothing — hence the check of the result
 * and not of the target alone.
 *
 * The alert node and not the heading of the step: a screen reader speaks the element the focus lands
 * on, and the alert carries the very text its live region announces at that moment, while the heading
 * would name a step that has not changed — the same speech a successful step change gives. The heading
 * is left as the last resort, for a step whose errors went to no alert node.
 */
export function focusStepError(
	stepNode: HTMLElement,
	fields: Array<StepInvalidField>,
	errorRegion: ?HTMLElement,
	stepHeading: ?HTMLElement,
): void
{
	const helpers = getA11yHelpers();
	if (helpers)
	{
		const forms = getStepForms(stepNode);
		forms.forEach((formRoot) => helpers.clearInvalidControls(formRoot));

		let target = null;
		fields.forEach(({ formRoot, name, messageId }) => {
			const marked = helpers.markInvalidControls(formRoot, [{ name, messageId }]);
			target ??= marked;
		});

		forms.forEach((formRoot) => {
			target ??= helpers.findUnfilledRequiredControl(formRoot);
		});

		target?.focus();
	}

	if (hasFocusInside(stepNode))
	{
		return;
	}

	// the region has just been inserted into the document, so it is the node of the current error
	errorRegion?.focus({ preventScroll: true });

	if (!hasFocusedElement())
	{
		focusStepHeading(stepHeading);
	}
}

/**
 * Takes every step but the active one out of the Tab order and out of the accessibility tree.
 * The --hidden class only moves a step out of sight (position, transform and opacity), so without
 * this every step of the wizard stays reachable at once.
 */
export function isolateInactiveSteps(stepNodes: Array<HTMLElement>, activeNode: HTMLElement): void
{
	stepNodes.forEach((stepNode) => {
		Dom.attr(stepNode, 'inert', stepNode === activeNode ? null : 'true');
	});
}

/**
 * Names and marks the controls of the main.interface.form markup a wizard step renders.
 * The pass is idempotent, so it is safe to repeat it on every mutation of the form.
 */
export class StepFormsA11y
{
	#observers: Map<HTMLElement, Array<MutationObserver>> = new Map();
	#calendarButtonLabel: string;
	#calendarButtonTestIdPrefix: string;

	constructor(options: StepFormsA11yOptions)
	{
		this.#calendarButtonLabel = options.calendarButtonLabel;
		this.#calendarButtonTestIdPrefix = options.calendarButtonTestIdPrefix;
	}

	observeStepForms(stepNode: HTMLElement): void
	{
		this.leaveStep(stepNode);

		const helpers = getA11yHelpers();
		if (!helpers)
		{
			return;
		}

		const observers = getStepForms(stepNode).map((formRoot) => {
			this.#applyFormA11y(formRoot, stepNode, helpers);

			// fields arrive as ready HTML: a mutation is the only signal of a new or remounted control
			const observer = new MutationObserver(() => {
				this.#applyFormA11y(formRoot, stepNode, helpers);
			});
			observer.observe(formRoot, OBSERVER_OPTIONS);

			return observer;
		});

		if (observers.length > 0)
		{
			this.#observers.set(stepNode, observers);
		}
	}

	leaveStep(stepNode: HTMLElement): void
	{
		const observers = this.#observers.get(stepNode);
		if (observers)
		{
			observers.forEach((observer) => observer.disconnect());
			this.#observers.delete(stepNode);
		}
	}

	#applyFormA11y(formRoot: HTMLFormElement, stepNode: HTMLElement, helpers: BizprocA11yHelpers): void
	{
		helpers.labelFormControls(formRoot, {
			blockSelector: ROW_SELECTOR,
			labelSelector: LABEL_CELL_SELECTOR,
			contentSelector: VALUE_CELL_SELECTOR,
			controlSelector: CONTROL_SELECTOR,
		});

		this.#markRequiredControls(formRoot);
		this.#nameTagSelectorButtons(formRoot);
		this.#activateCalendarIcons(stepNode, helpers);
	}

	/**
	 * The clickable icon of a date field comes from the iblock.property.field.public.edit component:
	 * a bare div with a handler of its own, unreachable by keyboard. The helper adds the role, the
	 * Tab stop and the Enter/Space activation; the activation dispatches a click, so the handler of
	 * the owner opens the calendar exactly as it does for a mouse.
	 *
	 * The mark of an icon ends with its number in the step, because a step can render several date
	 * fields and one mark for them all addresses none of them. The names of the fields are no source
	 * for it: a field of an element is named PROPERTY_167[n0][VALUE], and that name differs from stand
	 * to stand. The whole step is renumbered on every pass, so a field inserted into any of its forms
	 * shifts the numbers of the icons after it instead of taking a number already given out.
	 */
	#activateCalendarIcons(stepNode: HTMLElement, helpers: BizprocA11yHelpers): void
	{
		stepNode.querySelectorAll(CALENDAR_ICON_SELECTOR).forEach((icon, index) => {
			Dom.attr(icon, 'data-testid', `${this.#calendarButtonTestIdPrefix}-${index}`);
			this.#putCalendarIconAfterControl(icon);

			if (icon.hasAttribute(KEYBOARD_READY_ATTR))
			{
				return;
			}

			Dom.attr(icon, KEYBOARD_READY_ATTR, 'true');
			Dom.attr(icon, 'aria-label', this.#calendarButtonLabel);

			// the node keeps the click handler of its owner: only the keyboard path is missing
			helpers.makeActivatable(icon, () => {});
		});
	}

	/**
	 * Tab order of a date field: the field itself first, the button of its calendar next. The owner
	 * renders the icon before the input, so with the icon being a Tab stop the keyboard used to reach
	 * the calendar before the field it belongs to, and a screen reader named the calendar instead of
	 * the field. The icon is positioned absolutely, so its place among the children of the field has
	 * no effect on the layout.
	 *
	 * Unlike the keyboard binding, the move is not guarded by the readiness mark: the mark is given to
	 * a node once, while the order of the markup comes back with every remount of the Vue application
	 * of the field. An icon already standing after its input is left alone, so a pass over an ordered
	 * form mutates nothing and the observer of the form is not woken up by the pass itself.
	 */
	#putCalendarIconAfterControl(icon: HTMLElement): void
	{
		const control = icon.parentElement?.querySelector(CALENDAR_CONTROL_SELECTOR);
		if (!control)
		{
			return;
		}

		const positionOfControl = icon.compareDocumentPosition(control);
		if ((positionOfControl & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
		{
			Dom.insertAfter(icon, control);
		}
	}

	/**
	 * The list of required fields is not passed to the bundle: the form names an element field
	 * as FIELD_ID[key][VALUE], while the server knows FIELD_ID only. The label cell of the row
	 * is the single mark that works for element fields, process parameters and constants alike.
	 */
	#markRequiredControls(formRoot: HTMLFormElement): void
	{
		formRoot.querySelectorAll(ROW_SELECTOR).forEach((row) => {
			const labelCell = row.querySelector(LABEL_CELL_SELECTOR);
			if (!labelCell || !labelCell.querySelector(REQUIRED_MARK_SELECTOR))
			{
				return;
			}

			const valueCell = row.querySelector(VALUE_CELL_SELECTOR);
			if (!valueCell)
			{
				return;
			}

			valueCell.querySelectorAll(CONTROL_SELECTOR).forEach((control) => {
				Dom.attr(control, 'aria-required', 'true');
			});
		});
	}

	/**
	 * Names the button of a tag selector by the label cell of its row. Alone the button says nothing
	 * but its own caption ("select"), while the name of the field and its required mark land on the
	 * hidden input the keyboard never reaches. The label goes as aria-labelledby together with the
	 * button itself, so the caption stays part of the name and the required mark of the row comes
	 * along: aria-required is not allowed on the button role.
	 */
	#nameTagSelectorButtons(formRoot: HTMLFormElement): void
	{
		formRoot.querySelectorAll(ROW_SELECTOR).forEach((row) => {
			const labelCell = row.querySelector(LABEL_CELL_SELECTOR);
			const valueCell = row.querySelector(VALUE_CELL_SELECTOR);
			if (!labelCell || !valueCell)
			{
				return;
			}

			valueCell.querySelectorAll(TAG_SELECTOR_BUTTON_SELECTOR).forEach((button) => {
				if (button.hasAttribute('aria-labelledby'))
				{
					return;
				}

				Dom.attr(button, 'aria-labelledby', `${ensureId(labelCell)} ${ensureId(button)}`);
			});
		});
	}
}
