import { Dom, Event, Loc, Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';

import { Feature, FeatureCode } from 'bizprocdesigner.feature';

import { mountWithChartPinia } from '../../../shared/stores';
import { ExpressionBuilder } from '../ui/expression-builder/expression-builder';
import {
	SELECTOR_BUTTON_ROLE,
	findTargetInput,
	insertExpression,
	isSelectorButtonHidden,
	resolveFieldHost,
} from './expression-builder-insert';
import { closeReadableExpressionPopover, mountFormVeneers } from './readable-expressions-veneer';

const TRIGGER_ROLE = 'expression-builder-trigger';
const TRIGGER_TESTID = 'bizprocdesigner-expression-builder-trigger';
const HOST_CLASS = 'bizprocdesigner-expression-builder-host';
const FIELD_LABEL_MAX_LENGTH = 60;

// What is already mounted is remembered by node, not by an attribute: a row of a `Multiple` field is
// cloned through `innerHTML` (`BX.Bizproc.cloneTypeControl()`), so an attribute would come along with
// the copy and the next pass would skip a row whose buttons have never been mounted.
const mountedButtons: WeakSet<HTMLElement> = new WeakSet();
const delegatedRoots: WeakSet<HTMLElement> = new WeakSet();
const rootContexts: WeakMap<HTMLElement, Object> = new WeakMap();

type BuilderHandle = {
	app: Object,
	container: HTMLElement,
};

let activeBuilder: ?BuilderHandle = null;

/**
 * Take down the open builder, if any. The window lives in `document.body` and is bound to a
 * trigger of a settings form, so whoever throws that form away has to close the builder as well:
 * a window left behind would be positioned against a detached trigger and would insert into a
 * detached input. Idempotent — a no-op when nothing is open.
 */
export function closeExpressionBuilder(): void
{
	closeReadableExpressionPopover();

	if (!activeBuilder)
	{
		return;
	}

	const { app, container } = activeBuilder;
	activeBuilder = null;
	app.unmount();
	Dom.remove(container);
}

function openBuilder(trigger: HTMLElement, fieldHost: HTMLElement, button: HTMLElement, nodeContext: Object): void
{
	closeExpressionBuilder();

	const container = document.createElement('div');
	Dom.append(container, document.body);

	const targetInput = findTargetInput(fieldHost, button);
	const initialValue = targetInput?.value ?? '';

	const app = BitrixVue.createApp(ExpressionBuilder, {
		bindElement: trigger,
		initialValue,
		nodeContext,
		onApply: (value: string): void => {
			// The field is gone when its form was re-rendered or closed under the open window:
			// there is nothing to insert into any more, and writing into the detached input would
			// report success while the value disappears. So the builder only closes.
			if (fieldHost.isConnected)
			{
				insertExpression(findTargetInput(fieldHost, button), value);
			}

			closeExpressionBuilder();
		},
		onClose: (): void => {
			closeExpressionBuilder();
		},
	});

	// The window is an application of its own and gets no Pinia installed, so it reads the stores of
	// the editor through the active instance. The mount is where it collects its sources, and the
	// substitution lasts exactly that long — see mountWithChartPinia() for why not `app.use()`.
	mountWithChartPinia(() => app.mount(container));

	activeBuilder = { app, container };
}

/**
 * The caption of the field the trigger belongs to: the block right above the `.field-row` in the
 * node settings, the neighbouring cell in the tables of the legacy property dialog. A caption
 * holds no control of its own, which is what tells it apart from the field itself; the lookup
 * stays within the field row, so a caption of another field is never picked up. Returns null when
 * nothing readable is found and the trigger keeps its plain name.
 */
function resolveFieldLabel(fieldHost: HTMLElement): ?string
{
	// A row host keeps the control and the selector button in cells of its own, so the caption is
	// either a cell of that row or, when the row is a table wrapping the control (legacy dialog),
	// the cell left of the one that table sits in.
	const captions = [
		...(fieldHost.tagName === 'TR' ? [...fieldHost.children] : [fieldHost.previousElementSibling]),
		fieldHost.closest('td')?.previousElementSibling,
	];

	for (const caption of captions)
	{
		if (!caption || caption.querySelector('input, textarea, select, button'))
		{
			continue;
		}

		const text = caption.textContent.replaceAll(/\s+/g, ' ').trim().replace(/[*:]+$/, '').trim();
		if (text.length > 0 && text.length <= FIELD_LABEL_MAX_LENGTH)
		{
			return text;
		}
	}

	return null;
}

function createTrigger(fieldHost: HTMLElement): HTMLElement
{
	const trigger = document.createElement('button');
	trigger.type = 'button';
	trigger.className = 'bizprocdesigner-expression-builder-trigger';
	trigger.dataset.role = TRIGGER_ROLE;
	trigger.dataset.testid = TRIGGER_TESTID;
	trigger.textContent = '{}';

	const label = Loc.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_TRIGGER_LABEL');
	const fieldLabel = resolveFieldLabel(fieldHost);
	// A dialog holds a trigger per field: the field name is what tells their names apart.
	const accessibleName = fieldLabel === null
		? label
		: Loc.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_TRIGGER_LABEL_FIELD', {
			'#FIELD#': fieldLabel,
		});

	trigger.setAttribute('aria-label', accessibleName);
	trigger.setAttribute('aria-haspopup', 'dialog');
	trigger.title = label;

	return trigger;
}

/**
 * The selector button the trigger belongs to: the trigger is mounted right before it and a cloned
 * row keeps that order. Everything else is resolved from the button, exactly like the mounting pass
 * does it — in a `Multiple` field every row carries a button and an input of its own, and the value
 * has to land in the input of the very row the trigger was clicked in.
 */
function resolveSelectorButton(trigger: HTMLElement): ?HTMLElement
{
	const button = trigger.nextElementSibling;

	return button?.getAttribute('data-role') === SELECTOR_BUTTON_ROLE ? button : null;
}

function handleRootClick(root: HTMLElement, event: MouseEvent): void
{
	const { target } = event;
	const trigger = Type.isDomNode(target) ? target.closest(`[data-role="${TRIGGER_ROLE}"]`) : null;
	if (!trigger)
	{
		return;
	}

	// The trigger has a data-role of its own, so the form delegate (onFormClick) ignores it; claiming
	// the click in the capture phase keeps the handlers between the form and the button out of the way.
	event.preventDefault();
	event.stopPropagation();

	const button = resolveSelectorButton(trigger);
	const fieldHost = button ? resolveFieldHost(root, button) : null;
	if (!fieldHost)
	{
		return;
	}

	openBuilder(trigger, fieldHost, button, rootContexts.get(root) ?? {});
}

/**
 * One delegated listener per form root instead of a listener per trigger: a row cloned through
 * `innerHTML` brings a copy of the trigger markup but no listener of its own, and a repeated mounting
 * pass over a re-rendered form must not pile listeners up on the same root.
 */
function delegateRootClicks(root: HTMLElement): void
{
	if (delegatedRoots.has(root))
	{
		return;
	}

	delegatedRoots.add(root);
	Event.bind(root, 'click', (event: MouseEvent) => handleRootClick(root, event), true);
}

/**
 * Drop the trigger a cloned row brought with it, so the row is left with the single trigger built
 * for its own button. The copy always sits right before the button — that is where a trigger is
 * mounted, and cloning keeps the order.
 */
function removeClonedTrigger(button: HTMLElement): void
{
	const previous = button.previousElementSibling;
	if (previous?.getAttribute('data-role') === TRIGGER_ROLE)
	{
		Dom.remove(previous);
	}
}

/**
 * DOM post-processing: after the PHP-rendered field controls are in the DOM, place an
 * additive expression-builder trigger next to each `bp-selector-button`. Shown only when the
 * `expressionBuilder` feature is available. The existing selector button is left untouched.
 */
export function mountExpressionBuilders(root: ?HTMLElement, nodeContext: Object = {}): void
{
	if (!root)
	{
		return;
	}

	// The readable layer has a feature flag of its own and is put over the very same fields, so it is
	// mounted before the gate of the builder: behind it the pass would leave the fields untouched.
	mountFormVeneers(root, nodeContext.connectedBlocks);

	if (!Feature.instance().isAvailable(FeatureCode.expressionBuilder))
	{
		return;
	}

	// The context is read at click time: a form root outlives a re-render, and by the next mounting
	// pass the block or the port behind the same node may already be another one.
	rootContexts.set(root, nodeContext);
	delegateRootClicks(root);

	const buttons = root.querySelectorAll(`[data-role="${SELECTOR_BUTTON_ROLE}"]`);
	buttons.forEach((button: HTMLElement) => {
		// A hidden button is not remembered as mounted: should the field show it later, the pass over
		// the re-rendered form still has to put the trigger in.
		if (mountedButtons.has(button) || isSelectorButtonHidden(button))
		{
			return;
		}

		const fieldHost = resolveFieldHost(root, button);
		if (!fieldHost)
		{
			return;
		}

		mountedButtons.add(button);
		Dom.addClass(fieldHost, HOST_CLASS);
		removeClonedTrigger(button);
		const trigger = createTrigger(fieldHost);
		// Before the selector button, which the trigger sits left of on the screen: that is what
		// keeps the tab order of the two buttons matching what the user sees.
		Dom.insertBefore(trigger, button);
	});
}
