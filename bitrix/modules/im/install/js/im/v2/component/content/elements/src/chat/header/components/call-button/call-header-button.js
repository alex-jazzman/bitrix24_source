import { CallButton } from 'call.widget.call-button';
import { Extension } from 'main.core';
import type { BitrixVueComponentProps } from 'ui.vue3';

import { CHAT_DETAIL_FOCUS_CONTEXT, type ChatDetailFocusContext } from 'im.v2.lib.a11y';
import type { ImModelChat } from 'im.v2.model';

import { HeaderControlKey } from '../header-action/header-action';

const { callInstalled } = Extension.getSettings('im.v2.lib.call');

/**
 * The place of the external call widget in the header. The widget is opaque: `im` owns the position and
 * the semantic key of the call, the widget owns its own contents, accessible name and inner walk. The
 * position element is the one thing that stays the same in the wide, the compact and the AIR composition,
 * so ALG-01 reads a change of the button form as a rebuild instead of a removal and leaves the focus
 * inside the widget alone.
 */
// @vue/component
export const CallHeaderButton = {
	name: 'CallHeaderButton',
	inject:
	{
		chatDetailFocusContext: {
			from: CHAT_DETAIL_FOCUS_CONTEXT,
			default: null,
		},
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		compactMode: {
			type: Boolean,
			default: false,
		},
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		componentToRender(): BitrixVueComponentProps
		{
			if (!callInstalled)
			{
				return null;
			}

			return CallButton;
		},
	},
	mounted()
	{
		this.registerPosition();
	},
	beforeUnmount()
	{
		this.unregisterPosition();
	},
	methods:
	{
		registerPosition(): void
		{
			const element = this.$refs.position;
			if (!element)
			{
				return;
			}

			this.getFocusContext()?.registerHeaderControl({ key: HeaderControlKey.call, element });
		},
		unregisterPosition(): void
		{
			const element = this.$refs.position;
			if (!element)
			{
				return;
			}

			this.getFocusContext()?.unregisterHeaderControl(HeaderControlKey.call, element);
		},
		getFocusContext(): ChatDetailFocusContext | null
		{
			return this.chatDetailFocusContext;
		},
	},
	// The position is programmatically focusable (tabindex="-1"): it answers ALG-01 that the call is still
	// there, and serves as the fallback target of the restore. The stop of the walk stays the button of the
	// widget itself, so the position adds none of its own.
	template: `
		<div
			v-if="componentToRender"
			class="bx-im-chat-header__call-position --focus-visible"
			ref="position"
			tabindex="-1"
			data-testid="im-chat-header-call"
		>
			<component :is="componentToRender" :dialog="dialog" :compactMode="compactMode" />
		</div>
	`,
};
