import { Dom, Event, Tag, Text, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';

import { type Block } from '../../../shared/types';
import { createUniqueId, globalFieldsCache, systemValuesCache } from '../../../shared/utils';
import {
	type ExpressionRefToken,
	type ExpressionToken,
	buildExpressionTokens,
	expressionTokenLabel,
	expressionTokenUnresolvedHint,
	isReadableExpressionsAvailable,
	tokenSectionClass,
} from '../../../entities/node-settings/utils/readable-expressions';
import {
	READABLE_EXPRESSION_FIX_KEY_EVENT,
	closeReadableExpressionPopover,
	closeReadableExpressionPopoverIn,
	notifyKeyFixed,
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
const ORIGINAL_SPELLCHECK_ATTRIBUTE = 'data-bxr-original-spellcheck';
const ABSENT_SPELLCHECK_ATTRIBUTE = '__absent__';
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
const veneerFields: WeakMap<HTMLElement, HTMLElement> = new WeakMap();
const fieldIds: WeakMap<HTMLElement, string> = new WeakMap();
const fieldFixHandlers: WeakMap<HTMLElement, (event: BaseEvent) => void> = new WeakMap();
const rootContextBlocks: WeakMap<HTMLElement, Array<Block>> = new WeakMap();
const rootObservers: WeakMap<HTMLElement, MutationObserver> = new WeakMap();

// A field is found by what marks it a target of the value selector, and there are two such marks. The
// server markup puts a button of its own next to the field; the client-side renderer of `bizproc`
// marks the field itself - that is how the value of a condition row of the filter block is rendered.
// A field whose mark names a selector type of its own (date, file) is left out: that selector owns
// both the value the field shows and the click on it.
const INLINE_FIELD_ROLE = 'inline-selector-target';
const FIELD_MARKER_SELECTOR = `[data-role="${SELECTOR_BUTTON_ROLE}"],[data-role="${INLINE_FIELD_ROLE}"]:not([data-selector-type])`;

function isMarkerButton(marker: HTMLElement): boolean
{
	return marker.getAttribute('data-role') === SELECTOR_BUTTON_ROLE;
}

// The marked node is the field itself unless the mark is a button standing next to it.
function resolveMarkedField(root: HTMLElement, marker: HTMLElement): ?HTMLElement
{
	if (!isMarkerButton(marker))
	{
		return marker;
	}

	const fieldHost = resolveFieldHost(root, marker);

	return fieldHost ? findTargetInput(fieldHost, marker) : null;
}

/**
 * Put a readable layer over every field of the form whose value holds a reference. Fields are found
 * by the mark that makes them a target of the value selector and resolved exactly like the expression
 * builder resolves them. Blocks of the node context are taken along: a rule card sees sources of its
 * own, which are not on the diagram the resolving reads by itself.
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

	root.querySelectorAll(FIELD_MARKER_SELECTOR).forEach((marker: HTMLElement) => {
		if (isMarkerButton(marker) && isSelectorButtonHidden(marker))
		{
			return;
		}

		const field = resolveMarkedField(root, marker);

		watchField(field);
		mountFieldVeneer(field, contextBlocks);
	});
}

/**
 * A row of a `Multiple` field is added by the legacy markup itself, without a mounting pass of ours,
 * and arrives with a dead copy of the layer of the row it was cloned from. A row of the filter block
 * is added the same way, by the condition tree. Only added markup that brings a field mark of its own
 * is taken: a layer of ours carries no mark, so putting one in does not raise the observer again.
 */
function observeRootRows(root: HTMLElement): void
{
	if (rootObservers.has(root))
	{
		return;
	}

	const observer = new MutationObserver((mutations: Array<MutationRecord>) => {
		mutations.forEach((mutation: MutationRecord) => {
			mutation.removedNodes.forEach((node: Node) => unmountRemovedFields(root, node));
		});

		const hasNewFields = mutations.some((mutation: MutationRecord) => {
			return [...mutation.addedNodes].some((node: Node) => holdsFieldMarker(node));
		});

		if (hasNewFields)
		{
			mountRootFields(root);
		}
	});

	observer.observe(root, { childList: true, subtree: true });
	rootObservers.set(root, observer);
}

function unmountRemovedFields(root: HTMLElement, node: Node): void
{
	if (!holdsFieldMarker(node))
	{
		return;
	}

	const markers = node.matches(FIELD_MARKER_SELECTOR)
		? [node]
		: [...node.querySelectorAll(FIELD_MARKER_SELECTOR)]
	;
	markers.forEach((marker: HTMLElement) => {
		const field = resolveMarkedField(root, marker);

		unwatchField(field);
		unmountFieldVeneer(field);
	});
}

function holdsFieldMarker(node: Node): boolean
{
	if (!Type.isDomNode(node) || node.nodeType !== Node.ELEMENT_NODE)
	{
		return false;
	}

	return node.matches(FIELD_MARKER_SELECTOR) || node.querySelector(FIELD_MARKER_SELECTOR) !== null;
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

	root.querySelectorAll(FIELD_MARKER_SELECTOR).forEach((marker: HTMLElement) => {
		const field = resolveMarkedField(root, marker);

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
	globalFieldsCache.retryFailed();
	systemValuesCache.rereadPage();
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
		// A field named by its caption - the `{{...}}` of the automation designer - becomes a reference
		// only once the fields of the document land, so the value is read again when they do. A field
		// taken off the document meanwhile gets no layer: there is nobody left to unmount it.
		pending?.then(() => {
			if (field.isConnected)
			{
				mountFieldVeneer(field);
			}
		});

		return;
	}

	// The layer goes in before the field: focus moving forward reaches the tokens while the layer is
	// still shown, and only then the field, which hides the layer for the time it is being edited.
	const veneer = renderVeneer(field, tokens);
	suppressFieldSpellcheck(field);
	Dom.insertBefore(veneer, field);
	fieldVeneers.set(field, veneer);

	anchorHost(field);
	syncVeneerBox(field, veneer);
	observeFieldBox(field);

	Event.bind(field, 'focus', showRawValue);
	Event.bind(field, 'blur', showTokens);
	Event.bind(field, 'scroll', syncVeneerScroll);
	listenToKeyFix(field);

	// The focus that hides the layer may have arrived before the layer did.
	if (hasFocusInside(field))
	{
		revealRawValue(field);
	}

	pending?.then(() => refreshVeneer(field));
}

/**
 * The popover of a token has no way into the value of the field, so the fixed spelling of a reference
 * comes back as an event and the field it was opened for writes it (block EVENT-01).
 */
function listenToKeyFix(field: HTMLElement): void
{
	const handler = (event: BaseEvent): void => applyKeyFix(field, event.getData());

	fieldFixHandlers.set(field, handler);
	EventEmitter.subscribe(READABLE_EXPRESSION_FIX_KEY_EVENT, handler);
}

function forgetKeyFix(field: HTMLElement): void
{
	const handler = fieldFixHandlers.get(field);
	if (handler)
	{
		fieldFixHandlers.delete(field);
		EventEmitter.unsubscribe(READABLE_EXPRESSION_FIX_KEY_EVENT, handler);
	}
}

/**
 * Exactly the one reference the popover was opened for is replaced: the same code written elsewhere in
 * the value may well be meant as it is. The field is told of the change the way typing into it tells:
 * without the events the legacy form saves the value it kept before.
 */
function applyKeyFix(
	field: HTMLElement,
	data: ?{ fieldId: string, start: number, end: number, original: string, fixed: string },
): void
{
	if (fieldIds.get(field) !== data?.fieldId)
	{
		return;
	}

	const value = field.value ?? '';
	if (
		!Number.isInteger(data.start)
		|| !Number.isInteger(data.end)
		|| data.start < 0
		|| data.end < data.start
		|| data.end > value.length
		|| value.slice(data.start, data.end) !== data.original
	)
	{
		return;
	}

	field.value = value.slice(0, data.start) + data.fixed + value.slice(data.end);
	field.dispatchEvent(new window.Event('input', { bubbles: true }));
	field.dispatchEvent(new window.Event('change', { bubbles: true }));
	notifyKeyFixed();

	// The popover gave the focus back to the token it was opened on, and that token is the one going
	// away, so the layer is rebuilt over the focus instead of waiting for it to leave.
	refreshVeneer(field, true);
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
	forgetKeyFix(field);

	dropVeneer(veneer);
	restoreFieldSpellcheck(field, true);
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
	revealRawValue(event.currentTarget);
}

function revealRawValue(field: HTMLElement): void
{
	Dom.addClass(fieldVeneers.get(field), RAW_CLASS);
	restoreFieldSpellcheck(field);
}

function showTokens(event: FocusEvent): void
{
	const field = event.currentTarget;

	suppressFieldSpellcheck(field);
	Dom.removeClass(fieldVeneers.get(field), RAW_CLASS);
	refreshVeneer(field);
}

function suppressFieldSpellcheck(field: HTMLElement): void
{
	if (!field.hasAttribute(ORIGINAL_SPELLCHECK_ATTRIBUTE))
	{
		Dom.attr(
			field,
			ORIGINAL_SPELLCHECK_ATTRIBUTE,
			field.getAttribute('spellcheck') ?? ABSENT_SPELLCHECK_ATTRIBUTE,
		);
	}

	Dom.attr(field, 'spellcheck', 'false');
}

function restoreFieldSpellcheck(field: HTMLElement, forget: boolean = false): void
{
	if (!field.hasAttribute(ORIGINAL_SPELLCHECK_ATTRIBUTE))
	{
		return;
	}

	const original = field.getAttribute(ORIGINAL_SPELLCHECK_ATTRIBUTE);
	Dom.attr(field, 'spellcheck', original === ABSENT_SPELLCHECK_ATTRIBUTE ? null : original);

	if (forget)
	{
		Dom.attr(field, ORIGINAL_SPELLCHECK_ATTRIBUTE, null);
	}
}

/**
 * Rebuild the tokens from the current value of the field. A value left without references takes the
 * layer down: an empty layer over a transparent field would hide the text the user still sees.
 * A rebuild forced by a change of the value goes on through the focus - the value the layer shows is
 * no longer the value of the field.
 */
function refreshVeneer(field: HTMLElement, force: boolean = false): void
{
	const veneer = fieldVeneers.get(field);
	if (!veneer || (!force && hasFocusInside(field)))
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

// The wheel goes through the layer into the field, so the layer follows the field it covers. What
// follows is the share of the scroll, not the offset in pixels: a token is wider than the code it
// covers, so the layer wraps into more lines and stands taller than the field. Mirroring the offset
// would leave the tail of the layer below its own bottom edge - the field is already scrolled to the
// end while the layer still has lines to go, and the last line of the value is cut off. By the share
// both ends meet exactly; in between the layer drifts by the difference of the heights, and there the
// raw text it covers is transparent, so there is nothing for the drift to disagree with.
function syncScroll(field: HTMLElement, veneer: HTMLElement): void
{
	veneer.scrollTop = scrollShare(field.scrollTop, field.scrollHeight - field.clientHeight, veneer.scrollHeight - veneer.clientHeight);
	veneer.scrollLeft = scrollShare(field.scrollLeft, field.scrollWidth - field.clientWidth, veneer.scrollWidth - veneer.clientWidth);
}

function scrollShare(position: number, fieldRange: number, veneerRange: number): number
{
	if (fieldRange <= 0)
	{
		return 0;
	}

	return (position / fieldRange) * veneerRange;
}

function renderVeneer(field: HTMLElement, tokens: Array<ExpressionToken>): HTMLElement
{
	const className = [VENEER_CLASS, field.tagName === 'TEXTAREA' ? MULTILINE_CLASS : ''].filter(Boolean).join(' ');
	const veneer = Tag.render`<div class="${className}" data-testid="${VENEER_TESTID}">${tokens.map(renderToken)}</div>`;

	const fieldStyle = getComputedStyle(field);
	TRANSFERRED_STYLES.forEach((property: string) => Dom.style(veneer, property, fieldStyle[property]));

	Event.bind(veneer, 'click', handleVeneerClick);
	Event.bind(veneer, 'keydown', handleVeneerKeydown);
	veneerFields.set(veneer, field);

	return veneer;
}

function renderToken(token: ExpressionToken): Node
{
	if (token.kind !== 'ref')
	{
		return document.createTextNode(token.text);
	}

	const unresolvedHint = expressionTokenUnresolvedHint(token);
	const className = [TOKEN_CLASS, tokenSectionClass(token), unresolvedHint === null ? '' : UNKNOWN_CLASS]
		.filter(Boolean)
		.join(' ')
	;
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
	if (unresolvedHint !== null)
	{
		Dom.attr(element, 'title', unresolvedHint);
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

	openReadableExpressionPopover(token, element, fieldIdOf(element));

	return true;
}

/**
 * The identifier of a field is what tells the fix of one field from the fix of another, and it lives
 * only as long as the field does: the legacy markup gives its fields no identifier of its own.
 */
function fieldIdOf(element: HTMLElement): string
{
	const field = veneerFields.get(element.closest(`.${VENEER_CLASS}`));
	if (!Type.isDomNode(field))
	{
		return '';
	}

	if (!fieldIds.has(field))
	{
		fieldIds.set(field, createUniqueId());
	}

	return fieldIds.get(field);
}

function dropStaleVeneer(field: HTMLElement): void
{
	const previous = field.previousElementSibling;
	if (previous?.classList.contains(VENEER_CLASS))
	{
		restoreFieldSpellcheck(field, true);
		dropVeneer(previous);
	}
}

function dropVeneer(veneer: HTMLElement): void
{
	closeReadableExpressionPopoverIn(veneer);
	Dom.remove(veneer);
}
