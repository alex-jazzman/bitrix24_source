import { defineComponent } from 'ui.vue3';

import { CallPopup, type CallPopupTarget } from 'call.component.ui.popup';

import { CallCloudRecordCard } from './card';

import './css/popup.css';

// TODO : NN : replace, wait backend services
const ARTICLE_KEY = 'limit_v2_videocall_cloud_record';

export const CallCloudRecordPopup = defineComponent({
	name: 'CallCloudRecordPopup',
	components: { CallPopup, CallCloudRecordCard },
	props: {
		tariff: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['startRecord', 'hidden'],
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
		handleStartRecord(): void
		{
			this.$emit('startRecord');
		},
	},
	template: /* HTML */`
		<CallPopup ref="popup" class-name="call-cloud-record-popup" @hidden="$emit('hidden')">
			<CallCloudRecordCard :tariff="tariff" @startRecord="handleStartRecord" />
		</CallPopup>
	`,
});
