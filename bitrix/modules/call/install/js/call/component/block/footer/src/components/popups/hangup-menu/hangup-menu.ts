import { defineComponent } from 'ui.vue3';

import { CallPopup, type CallPopupTarget } from 'call.component.ui.popup';

import { CallMenu } from 'call.component.ui.menu';

import type { LocFunction } from 'call.plugin.loc';

import './css/hangup-menu.css';

interface HangupMenuItem
{
	action: string;
	label: string;
}

export const CallFooterHangupMenu = defineComponent({
	name: 'CallFooterHangupMenu',
	components: { CallMenu, CallPopup },
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	emits: ['hangup', 'hangup:all', 'hidden'],
	computed: {
		items(): HangupMenuItem[]
		{
			return [
				{ action: 'hangup', label: (this.loc as LocFunction)('CALL_FOOTER_HANGUP_MENU_END_CALL_FOR_ALL') },
				{ action: 'hangup:all', label: (this.loc as LocFunction)('CALL_FOOTER_HANGUP_MENU_END_CALL') },
			];
		},
	},
	methods: {
		show(target: CallPopupTarget): void
		{
			(this.$refs.popup as InstanceType<typeof CallPopup> | undefined)?.show(target);
		},
		hide(): void
		{
			(this.$refs.popup as InstanceType<typeof CallPopup> | undefined)?.hide();
		},
		toggle(target?: CallPopupTarget): void
		{
			(this.$refs.popup as InstanceType<typeof CallPopup> | undefined)?.toggle(target);
		},
		handleAction(action: 'hangup' | 'hangup:all' | 'hidden'): void
		{
			this.hide();
			this.$emit(action, true);
		},
	},
	template: /* HTML */`
		<CallPopup ref="popup" class-name="call-footer-hangup-menu" @hidden="$emit('hidden')">
			<CallMenu :items="items" @item:click="handleAction($event.item.action)" />
		</CallPopup>
	`,
});
