import { defineComponent } from 'ui.vue3';

import { CallPopup, type CallPopupTarget } from 'call.component.ui.popup';

import { CallMenu } from 'call.component.ui.menu';

import type { LocFunction } from 'call.plugin.loc';

import './css/record-menu.css';

interface RecordMenuItem
{
	action: string;
	label: string;
	icon?: string;
}

export const CallFooterRecordMenu = defineComponent({
	name: 'CallFooterRecordMenu',
	components: { CallMenu, CallPopup },
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	props: {
		recording: {
			type: Boolean,
			default: false,
		},
		paused: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['delete', 'pause', 'resume', 'stop', 'hidden', 'audio', 'video'],
	computed: {
		className(): string
		{
			return this.recording ? 'call-footer-record-menu --recording' : 'call-footer-record-menu';
		},
		items(): RecordMenuItem[]
		{
			if (this.recording)
			{
				return [
					{ action: 'delete', label: (this.loc as LocFunction)('CALL_FOOTER_RECORD_MENU_DELETE'), icon: 'trash-can' },
					{
						action: this.paused ? 'resume' : 'pause',
						label: (this.loc as LocFunction)(this.paused ? 'CALL_FOOTER_RECORD_MENU_RESUME' : 'CALL_FOOTER_RECORD_MENU_PAUSE'),
						icon: this.paused ? 'play' : 'pause',
					},
					{ action: 'stop', label: (this.loc as LocFunction)('CALL_FOOTER_RECORD_MENU_STOP'), icon: 'stop' },
				];
			}

			return [
				{ action: 'audio', label: (this.loc as LocFunction)('CALL_FOOTER_RECORD_MENU_ONLY_AUDIO') },
				{ action: 'video', label: (this.loc as LocFunction)('CALL_FOOTER_RECORD_MENU_VIDEO_AND_AUDIO') },
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
		handleAction(action: 'delete' | 'audio' | 'video' | 'hidden' | 'pause' | 'resume' | 'stop'): void
		{
			this.hide();
			this.$emit(action, true);
		},
	},
	template: /* HTML */`
		<CallPopup
			ref="popup"
			:class-name="className"
			background="#00428F"
			@hidden="$emit('hidden')"
		>
			<CallMenu :items="items" :reverse="recording" @item:click="handleAction($event.item.action)" />
		</CallPopup>
	`,
});
