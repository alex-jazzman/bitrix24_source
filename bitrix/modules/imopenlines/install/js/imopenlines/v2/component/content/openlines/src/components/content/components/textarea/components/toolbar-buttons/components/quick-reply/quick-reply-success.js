import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { useDelay } from 'imopenlines.v2.lib.utils';

import './css/quick-reply-success.css';

const SUCCESS_DISPLAY_TIME = 3000;

// @vue/component
export const QuickReplySuccess = {
	name: 'QuickReplySuccess',
	components: { BIcon },
	props: {
		isSaving: {
			type: Boolean,
			default: false,
		},
		isEdit: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['hide'],
	data()
	{
		return {
			message: '',
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	watch: {
		isSaving(newVal: boolean, oldVal: boolean): void
		{
			const savingFinished = oldVal && !newVal;
			if (!savingFinished)
			{
				return;
			}

			this.message = this.isEdit
				? this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_SUCCESS_UPDATED')
				: this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_SUCCESS_ADDED');

			this.hideDelay.start(() => {
				this.message = '';
				this.$emit('hide');
			});
		},
	},
	created()
	{
		this.hideDelay = useDelay(SUCCESS_DISPLAY_TIME);
	},
	beforeUnmount()
	{
		this.hideDelay.stop();
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div v-if="message" class="bx-imol-quick-reply-popup__success">
			<BIcon :name="OutlineIcons.CHECK_M" />
			<span>{{ message }}</span>
		</div>
	`,
};
