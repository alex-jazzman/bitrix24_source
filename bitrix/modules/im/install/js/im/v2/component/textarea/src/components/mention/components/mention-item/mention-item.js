import { DefaultItem } from './components/default-item';
import { CopilotItem } from './components/copilot-item';

import '../../css/mention-item.css';

import type { BitrixVueComponentProps } from 'ui.vue3';

// @vue/component
export const MentionItem = {
	name: 'MentionItem',
	components: { DefaultItem, CopilotItem },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		query: {
			type: String,
			default: '',
		},
		selected: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['itemClick', 'itemHover'],
	computed: {
		mentionItemComponent(): BitrixVueComponentProps
		{
			if (this.dialogId === this.copilotBotDialogId)
			{
				return CopilotItem;
			}

			return DefaultItem;
		},
		copilotBotDialogId(): ?string
		{
			return this.$store.getters['users/bots/getCopilotBotDialogId'];
		},
	},
	methods: {
		onClick()
		{
			this.$emit('itemClick', { dialogId: this.dialogId });
		},
	},
	template: `
		<div 
			@click="onClick" 
			class="bx-im-mention-item__container bx-im-mention-item__scope" 
			:class="{'--selected': selected}"
			@mouseover="$emit('itemHover')"
		>
			<component
				:is="mentionItemComponent"
				:dialogId="dialogId"
				:query="query"
			/>
		</div>
	`,
};
