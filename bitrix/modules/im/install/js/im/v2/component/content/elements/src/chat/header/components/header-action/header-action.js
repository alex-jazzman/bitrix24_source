import { Type } from 'main.core';

// The shared focus ring of the messenger: the `--focus-visible` class every control below carries, and
// the radius that class draws with.
import 'im.v2.css.classes';
import { CHAT_DETAIL_FOCUS_CONTEXT, type ChatDetailFocusContext } from 'im.v2.lib.a11y';

import './css/header-action.css';

/**
 * The semantic keys of the header controls. One key per user result, the same key in the wide, the
 * compact and the AIR composition: ALG-01 tells a control that is gone from a control that has only
 * been rebuilt by this key, so a variant of the header picks a key from here instead of its own literal.
 */
export const HeaderControlKey = Object.freeze({
	profile: 'profile',
	avatar: 'avatar',
	title: 'title',
	members: 'members',
	entity: 'entity',
	taskCard: 'taskCard',
	promoClose: 'promoClose',
	call: 'call',
	addToChat: 'addToChat',
	search: 'search',
	sidebar: 'sidebar',
	commentsBack: 'commentsBack',
	commentsSubscribe: 'commentsSubscribe',
});

/**
 * The geometry of the focus ring. An outline follows the border-radius of its own element, so the
 * shape is set on the control itself - invisibly, since the control paints neither background nor border.
 * `text` is the shape of a control that is a run of text - a name, a counter - and takes the smallest
 * radius of the scale together with the promise not to clip its own content; `rounded` is for a control
 * that is a block. The exception is `avatar`: the picture of a chat is drawn in several shapes, and only
 * the picture knows which one it took, so that ring is handed down to the picture instead of being named
 * here.
 */
export const HeaderActionShape = Object.freeze({
	circle: 'circle',
	rounded: 'rounded',
	text: 'text',
	avatar: 'avatar',
});

// @vue/component
export const HeaderAction = {
	name: 'HeaderAction',
	inject:
	{
		chatDetailFocusContext: {
			from: CHAT_DETAIL_FOCUS_CONTEXT,
			default: null,
		},
	},
	props:
	{
		controlKey: {
			type: String,
			required: true,
		},
		label: {
			type: String,
			default: '',
		},
		href: {
			type: String,
			default: '',
		},
		expanded: {
			type: Boolean,
			default: null,
		},
		controls: {
			type: String,
			default: '',
		},
		checked: {
			type: Boolean,
			default: null,
		},
		shape: {
			type: String,
			default: HeaderActionShape.rounded,
		},
		tabStop: {
			type: Boolean,
			default: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		after: {
			type: String,
			default: '',
		},
		truncate: {
			type: Boolean,
			default: false,
		},
	},
	computed:
	{
		// An action has no address, so it is a button; only a real navigation earns a link.
		isLink(): boolean
		{
			return Type.isStringFilled(this.href);
		},
		isSwitch(): boolean
		{
			return this.checked !== null;
		},
		tag(): string
		{
			return this.isLink ? 'a' : 'button';
		},
		// WebKit leaves a native button out of the sequential walk until it carries a tabindex of its own.
		tabIndex(): string
		{
			return this.tabStop ? '0' : '-1';
		},
		accessibleName(): string | null
		{
			return Type.isStringFilled(this.label) ? this.label : null;
		},
		// Without an explicit phrase the visible content is the accessible name, so it stays exposed.
		isContentDecorative(): boolean
		{
			return this.accessibleName !== null;
		},
		/*
		 * The wrapper of the content creates no box of its own, so the geometry of the consumer is
		 * untouched - unless the content is the thing that has to be cut off, and then a box is exactly
		 * what is needed: the clip cannot sit on the control, because a radius on the very element that
		 * clips cuts the painted glyphs along the arcs of its corners.
		 */
		hasContentBox(): boolean
		{
			return this.isContentDecorative || this.truncate;
		},
		contentClasses(): Array<string>
		{
			return this.truncate ? ['--ellipsis'] : [];
		},
		role(): string | null
		{
			return this.isSwitch ? 'switch' : null;
		},
		ariaChecked(): string | null
		{
			return this.isSwitch ? String(this.checked) : null;
		},
		ariaExpanded(): string | null
		{
			return this.expanded === null ? null : String(this.expanded);
		},
		ariaControls(): string | null
		{
			return Type.isStringFilled(this.controls) ? this.controls : null;
		},
		controlClasses(): Array<string>
		{
			return [`--shape-${this.shape}`];
		},
	},
	created()
	{
		this.registeredElement = null;
	},
	mounted()
	{
		this.registerControl();
	},
	/**
	 * ALG-01 for the case no removal reports: an update of this very control can take its ability to hold
	 * the focus away - it turns disabled, or leaves the walk - and its registration stays where it is. Only
	 * a control that holds the focus can lose it, so the report costs the rest of them nothing.
	 */
	beforeUpdate()
	{
		if (this.holdsFocus())
		{
			this.getFocusContext()?.beforeHeaderControlChange(this.registeredElement);
		}
	},
	updated()
	{
		// The tag switches between a link and a button when the address appears or goes: Vue replaces
		// the element in place without remounting, so the registration has to follow the new one.
		if (this.registeredElement !== this.$refs.control)
		{
			this.unregisterControl();
			this.registerControl();
		}
	},
	beforeUnmount()
	{
		this.unregisterControl();
	},
	methods:
	{
		registerControl(): void
		{
			const element = this.$refs.control;
			if (!element)
			{
				return;
			}

			this.registeredElement = element;
			this.getFocusContext()?.registerHeaderControl({
				key: this.controlKey,
				element,
				after: this.after,
			});
		},
		holdsFocus(): boolean
		{
			return this.registeredElement !== null && this.registeredElement.contains(document.activeElement);
		},
		unregisterControl(): void
		{
			if (this.registeredElement === null)
			{
				return;
			}

			this.getFocusContext()?.unregisterHeaderControl(this.controlKey, this.registeredElement);
			this.registeredElement = null;
		},
		getFocusContext(): ChatDetailFocusContext | null
		{
			return this.chatDetailFocusContext;
		},
	},
	template: `
		<component
			:is="tag"
			ref="control"
			class="bx-im-chat-header-action --focus-visible"
			:class="controlClasses"
			:type="isLink ? null : 'button'"
			:href="isLink ? href : null"
			:disabled="isLink ? null : disabled"
			:tabindex="tabIndex"
			:role="role"
			:aria-label="accessibleName"
			:aria-expanded="ariaExpanded"
			:aria-controls="ariaControls"
			:aria-checked="ariaChecked"
		>
			<span
				v-if="hasContentBox"
				class="bx-im-chat-header-action__content"
				:class="contentClasses"
				:aria-hidden="isContentDecorative ? 'true' : null"
			>
				<slot/>
			</span>
			<slot v-else/>
		</component>
	`,
};
