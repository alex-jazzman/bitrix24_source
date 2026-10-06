import { defineComponent, type PropType } from 'ui.vue3';
import { Type } from 'main.core';

import { Anchor } from './elements/anchor';
import { InfoButton } from './elements/info-button';
import { Player } from './elements/player';

import {
	type AnchorData,
	type CallRecordData,
	type InfoPopupData,
} from '../types';

export const Toolbar = defineComponent({
	name: 'Toolbar',

	emits: ['anchorActivated'],

	components: {
		Anchor,
		InfoButton,
		Player,
	},

	props: {
		anchors: {
			type: Array<AnchorData>,
			required: true,
		},
		activeAnchorBlockId: {
			type: String,
			default: null,
		},
		record: {
			type: Object as PropType<CallRecordData>,
		},
		infoPopup: {
			type: Object as PropType<InfoPopupData>,
		},
	},

	computed: {
		hasRecord(): boolean
		{
			return !Type.isNil(this.record);
		},
		hasInfoPopup(): boolean
		{
			return !Type.isNil(this.infoPopup);
		},
	},

	methods: {
		handleAnchorActivated(blockId: string): void
		{
			this.$emit('anchorActivated', blockId);
		}
	},

	template: `
		<div class="crm-ai-report-drawer__toolbar">
			<div class="crm-ai-report-drawer__toolbar-left">
				<Player v-if="hasRecord" :recordData="record" />
				<InfoButton v-if="hasInfoPopup" :infoPopupData="infoPopup" />
			</div>
			<span class="crm-ai-report-drawer__anchors">
				<Anchor
					v-for="anchor in anchors"
					:key="anchor.blockId"
					:blockId="anchor.blockId"
					:text="anchor.text"
					:isActive="anchor.blockId === activeAnchorBlockId"
					@activated="handleAnchorActivated"
				/>
			</span>
		</div>
	`,
});
