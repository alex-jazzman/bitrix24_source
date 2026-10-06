import { Dom, Event, Loc, Tag, Text, Type } from 'main.core';

import { type Block } from '../../../shared/types';
import {
	type ExpressionRefToken,
	type ExpressionToken,
	buildExpressionTokens,
	expressionTokenLabel,
	isReadableExpressionsAvailable,
	tokenSectionClass,
} from '../../../entities/node-settings/utils/readable-expressions';
import {
	closeReadableExpressionPopover,
	closeReadableExpressionPopoverIn,
	openReadableExpressionPopover,
} from '../ui/readable-expression-popover/readable-expression-popover';
import {
	SELECTOR_BUTTON_ROLE,
	findTargetInput,
	isSelectorButtonHidden,
	resolveFieldHost,
} from './expression-builder-insert';

import './readable-expressions-veneer.css';

export { closeReadableExpressionPopover };

const RAW_CLASS = 'bxr-raw';
const VENEER_CLASS = 'bxr-veneer';
const MULTILINE_CLASS = 'bxr-multiline';
const TOKEN_CLASS = 'bxr-tok';
const UNKNOWN_CLASS = 'bxr-unknown';
const VENEER_TESTID = 'bizprocdesigner-readable-expression-veneer';
const TOKEN_TESTID = 'bizprocdesigner-readable-expression-token';
const ACTIVATION_KEYS = new Set(['Enter', ' ']);

// Typography and insets of the layer are carried over from the field, so a token sits exactly where
// its code sits in the value. The border widths go along: the layer is stretched over the border box
// of the field, while its own borders stay transparent.
const TRANSFERRED_STYLES = [
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'letterSpacing',
	'lineHeight',
	'textAlign',
	'textIndent',
	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',
	'borderTopWidth',
	'borderRightWidth',
	'borderBottomWidth',
	'borderLeftWidth',
];

// What is already mounted is remembered by node, not by an attribute: a row of a `Multiple` field is
// cloned through `innerHTML` (`BX.Bizproc.cloneTypeControl()`), so an attribute would come along with
// the copy and the next pass would take a field that carries no veneer of its own for a mounted one.
const fieldVeneers: WeakMap<HTMLElement, HTMLElement> = new WeakMap();
const fieldObservers: WeakMap<HTMLElement, ResizeObserver> = new WeakMap();
const fieldContextBlocks: WeakMap<HTMLElement, Array<Block>> = new WeakMap();
const anchoredHosts: WeakSet<HTMLElement> = new WeakSet();
const watchedFields: WeakSet<HTMLElement> = new WeakSet();
const elementTokens: WeakMap<HTMLElement, ExpressionRefToken> = new WeakMap();
const rootContextBlocks: WeakMap<HTMLElement, Array<Block>> = new WeakMap();
const rootObservers: WeakMap<HTMLElement, MutationObserver> = new WeakMap();

/**
 * Put a readable layer over every field of the server-rendered markup whose value holds a reference.
 * Fields are found by their selector button and resolved exactly like the expression builder resolves
 * them. Blocks of the node context are taken along: a rule card sees sources of its own, which are
 * not on the diagram the resolving reads by itself.
 */
export function mountFormVeneers(root: ?HTMLElement, contextBlocks: ?Array<Block> = null): void
{
	if (!root || !isReadableExpressionsAvailable())
	{
		return;
	}

	if (contextBlocks)
	{
		rootContextBlocks.set(root, contextBlocks);
	}

	mountRootFields(root);
	observeRootRows(root);
}

function mountRootFields(root: HTMLElement): void
{
	const contextBlocks = rootContextBlocks.get(root) ?? null;

	root.querySelectorAll(`[data-role="${SELECTOR_BUTTON_ROLE}"]`).forEach((button: HTMLElement) => {
		if (isSelectorButtonHidden(button))
		{
			return;
		}

		const fieldHost = resolveFieldHost(root, button);
		const field = fieldHost ? findTargetInput(fieldHost, button) : null;

		watchField(field);
		mountFieldVeneer(field, contextBlocks);
	});
}

/**
 * A row of a `Multiple` field is added by the legacy markup itself, without a mounting pass of ours,
 * and arrives with a dead copy of the layer of the row it was cloned from. Only added markup that
 * brings a selector button of its own is taken: a layer of ours holds no such button, so putting one
 * in does not raise the observer again.
 */
function observeRootRows(root: HTMLElement): void
{
	if (rootObservers.has(root))
	{
		return;
	}

	const observer = new MutationObserver((mutations: Array<MutationRecord>) => {
		const hasNewFields = mutations.some((mutation: MutationRecord) => {
			return [...mutation.addedNodes].some((node: Node) => holdsSelectorButton(node));
		});

		if (hasNewFields)
		{
			mountRootFields(root);
		}
	});

	observer.observe(root, { childList: true, subtree: true });
	rootObservers.set(root, observer);
}

function holdsSelectorButton(node: Node): boolean
{
	if (!Type.isDomNode(node) || node.nodeType !== Node.ELEMENT_NODE)
	{
		return false;
	}

	const selector = `[data-role="${SELECTOR_BUTTON_ROLE}"]`;

	return node.matches(selector) || node.querySelector(selector) !== null;
}

export function unmountFormVeneers(root: ?HTMLElement): void
{
	if (!root)
	{
		return;
	}

	rootObservers.get(root)?.disconnect();
	rootObservers.delete(root);
	rootContextBlocks.delete(root);

	root.querySelectorAll(`[data-role="${SELECTOR_BUTTON_ROLE}"]`).forEach((button: HTMLElement) => {
		const fieldHost = resolveFieldHost(root, button);
		const field = fieldHost ? findTargetInput(fieldHost, button) : null;

		unwatchField(field);
		unmountFieldVeneer(field);
	});
}

/**
 * A field the pass left without a layer gets its first reference later: the value selector and the
 * expression builder both write into an already rendered form and both leave the field focused. So
 * the layer is mounted when the field is left — the very moment a mounted layer shows its tokens.
 */
function watchField(field: ?HTMLElement): void
{
	if (!Type.isDomNode(field) || watchedFields.has(field))
	{
		return;
	}

	watchedFields.add(field);
	Event.bind(field, 'blur', mountOnBlur);
}

function unwatchField(field: ?HTMLElement): void
{
	if (!Type.isDomNode(field) || !watchedFields.has(field))
	{
		return;
	}

	watchedFields.delete(field);
	Event.unbind(field, 'blur', mountOnBlur);
}

function mountOnBlur(event: FocusEvent): void
{
	mountFieldVeneer(event.currentTarget);
}

export function mountFieldVeneer(field: ?HTMLElement, contextBlocks: ?Array<Block> = null): void
{
	if (!Type.isDomNode(field))
	{
		return;
	}

	if (contextBlocks)
	{
		fieldContextBlocks.set(field, contextBlocks);
	}

	if (fieldVeneers.has(field))
	{
		return;
	}

	// A cloned row of a `Multiple` field arrives with a copy of the layer of the row it came from:
	// the copy goes away first, so the field is left bare and gets a live layer of its own.
	dropStaleVeneer(field);

	const { tokens, hasReference, pending } = buildExpressionTokens(field.value ?? '', fieldContextBlocks.get(field));
	if (!hasReference)
	{
		return;
	}

	// The layer goes in before the field: focus moving forward reaches the tokens while the layer is
	// still shown, and only then the field, which hides the layer for the time it is being edited.
	const veneer = renderVeneer(field, tokens);
	Dom.insertBefore(veneer, field);
	fieldVeneers.set(field, veneer);

	anchorHost(field);
	syncVeneerBox(field, veneer);
	observeFieldBox(field);

	Event.bind(field, 'focus', showRawValue);
	Event.bind(field, 'blur', showTokens);
	Event.bind(field, 'scroll', syncVeneerScroll);

	pending?.then(() => refreshVeneer(field));
}

export function unmountFieldVeneer(field: ?HTMLElement): void
{
	const veneer = Type.isDomNode(field) ? fieldVeneers.get(field) : null;
	if (!veneer)
	{
		return;
	}

	fieldVeneers.delete(field);
	fieldObservers.get(field)?.disconnect();
	fieldObservers.delete(field);

	Event.unbind(field, 'focus', showRawValue);
	Event.unbind(field, 'blur', showTokens);
	Event.unbind(field, 'scroll', syncVeneerScroll);

	dropVeneer(veneer);
	releaseHost(field);
}

/**
 * Focus stands on the field itself or on a token of its layer. Both cases keep the layer as it is:
 * rebuilding it would take away the node the focus sits on, and moving a focused field would take
 * the focus off the field being edited.
 */
export function hasFocusInside(field: ?HTMLElement): boolean
{
	if (!Type.isDomNode(field))
	{
		return false;
	}

	return document.activeElement === field || fieldVeneers.get(field)?.contains(document.activeElement) === true;
}

function showRawValue(event: FocusEvent): void
{
	Dom.addClass(fieldVeneers.get(event.currentTarget), RAW_CLASS);
}

function showTokens(event: FocusEvent): void
{
	const field = event.currentTarget;

	Dom.removeClass(fieldVeneers.get(field), RAW_CLASS);
	refreshVeneer(field);
}

/**
 * Rebuild the tokens from the current value of the field. A value left without references takes the
 * layer down: an empty layer over a transparent field would hide the text the user still sees.
 */
function refreshVeneer(field: HTMLElement): void
{
	const veneer = fieldVeneers.get(field);
	if (!veneer || hasFocusInside(field))
	{
		return;
	}

	const { tokens, hasReference, pending } = buildExpressionTokens(field.value ?? '', fieldContextBlocks.get(field));
	if (!hasReference)
	{
		unmountFieldVeneer(field);

		return;
	}

	const rebuilt = renderVeneer(field, tokens);
	closeReadableExpressionPopoverIn(veneer);
	Dom.replace(veneer, rebuilt);
	fieldVeneers.set(field, rebuilt);
	syncVeneerBox(field, rebuilt);

	pending?.then(() => refreshVeneer(field));
}

/**
 * The layer lies over the box of the field and is out of flow, so the field keeps the geometry the
 * design system gives it and the rules that reach the control as a direct child keep matching.
 */
function syncVeneerBox(field: HTMLElement, veneer: HTMLElement): void
{
	Dom.style(veneer, {
		top: `${field.offsetTop}px`,
		left: `${field.offsetLeft}px`,
		width: `${field.offsetWidth}px`,
		height: `${field.offsetHeight}px`,
	});

	syncScroll(field, veneer);
}

/**
 * The parent of the field is the containing block of the layer: an element of its own around the
 * field would break the design-system rules written for a control that is a direct child.
 */
function anchorHost(field: HTMLElement): void
{
	const host = field.parentElement;
	if (host && getComputedStyle(host).position === 'static')
	{
		Dom.style(host, 'position', 'relative');
		anchoredHosts.add(host);
	}
}

// The parent keeps the positioning context only while a layer of ours still leans on it.
function releaseHost(field: HTMLElement): void
{
	const host = field.parentElement;
	if (anchoredHosts.has(host) && !host.querySelector(`.${VENEER_CLASS}`))
	{
		Dom.style(host, 'position', null);
		anchoredHosts.delete(host);
	}
}

/**
 * A textarea is resized by the user, and the field moves inside its parent when a neighbour above it
 * grows, so the box of the layer is taken from the field anew on every such change.
 */
function observeFieldBox(field: HTMLElement): void
{
	const observer = new ResizeObserver(() => {
		const veneer = fieldVeneers.get(field);
		if (veneer)
		{
			syncVeneerBox(field, veneer);
		}
	});

	observer.observe(field);
	if (field.parentElement)
	{
		observer.observe(field.parentElement);
	}

	fieldObservers.set(field, observer);
}

function syncVeneerScroll(event: Event): void
{
	const field = event.currentTarget;
	const veneer = fieldVeneers.get(field);
	if (veneer)
	{
		syncScroll(field, veneer);
	}
}

// The wheel goes through the layer into the field, so the layer follows the field it covers.
function syncScroll(field: HTMLElement, veneer: HTMLElement): void
{
	veneer.scrollTop = field.scrollTop;
	veneer.scrollLeft = field.scrollLeft;
}

function renderVeneer(field: HTMLElement, tokens: Array<ExpressionToken>): HTMLElement
{
	const className = [VENEER_CLASS, field.tagName === 'TEXTAREA' ? MULTILINE_CLASS : ''].filter(Boolean).join(' ');
	const veneer = Tag.render`<div class="${className}" data-testid="${VENEER_TESTID}">${tokens.map(renderToken)}</div>`;

	const fieldStyle = getComputedStyle(field);
	TRANSFERRED_STYLES.forEach((property: string) => Dom.style(veneer, property, fieldStyle[property]));

	Event.bind(veneer, 'click', handleVeneerClick);
	Event.bind(veneer, 'keydown', handleVeneerKeydown);

	return veneer;
}

function renderToken(token: ExpressionToken): Node
{
	if (token.kind !== 'ref')
	{
		return document.createTextNode(token.text);
	}

	const className = [TOKEN_CLASS, tokenSectionClass(token), token.unknown ? UNKNOWN_CLASS : ''].filter(Boolean).join(' ');
	const label = expressionTokenLabel(token);
	const element = Tag.render`
		<span
			class="${className}"
			data-testid="${TOKEN_TESTID}"
			tabindex="0"
			role="button"
			aria-haspopup="dialog"
		>${Text.encode(label)}</span>
	`;

	// A broken reference is told apart by colour alone, so the same is said in words as well.
	if (token.unknown)
	{
		Dom.attr(element, 'title', Loc.getMessage('BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_UNKNOWN') ?? '');
	}

	elementTokens.set(element, token);

	return element;
}

// A token opens a popover of its own, so its click does not go on to the handlers of the form: the
// row of the field would take it for a click on itself and open the settings of the node over it.
function handleVeneerClick(event: MouseEvent): void
{
	if (openPopover(event.target))
	{
		event.stopPropagation();
	}
}

function handleVeneerKeydown(event: KeyboardEvent): void
{
	if (!ACTIVATION_KEYS.has(event.key))
	{
		return;
	}

	event.preventDefault();

	// A held-down key repeats, and every repeat would toggle the popover of the same token.
	if (event.repeat)
	{
		return;
	}

	openPopover(event.target);
}

function openPopover(target: EventTarget): boolean
{
	const element = Type.isDomNode(target) ? target.closest(`.${TOKEN_CLASS}`) : null;
	const token = element ? elementTokens.get(element) : null;
	if (!token)
	{
		return false;
	}

	openReadableExpressionPopover(token, element);

	return true;
}

function dropStaleVeneer(field: HTMLElement): void
{
	const previous = field.previousElementSibling;
	if (previous?.classList.contains(VENEER_CLASS))
	{
		dropVeneer(previous);
	}
}

function dropVeneer(veneer: HTMLElement): void
{
	closeReadableExpressionPopoverIn(veneer);
	Dom.remove(veneer);
}
