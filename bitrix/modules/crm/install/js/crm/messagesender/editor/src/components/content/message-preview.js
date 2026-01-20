import { Previewer } from 'crm.template.editor';
import { Text as BText } from 'ui.system.typography.vue';
import { mapGetters, mapState } from 'ui.vue3.vuex';

// @vue/component
export const MessagePreview = {
	name: 'MessagePreview',
	components: {
		BText,
	},
	placeholdersPreviewer: null,
	computed: {
		...mapGetters({
			/** @type boolean */
			isProgress: 'application/isProgress',
			/** @type string */
			messageBody: 'message/body',
			/** @type Channel */
			currentChannel: 'channels/current',
		}),
		...mapState({
			context: (state) => state.application.context,
		}),
	},
	beforeUnmount()
	{
		this.placeholdersPreviewer?.destroy();
	},
	methods: {
		togglePreviewer(): void
		{
			if (this.isProgress || this.messageBody.trim().length === 0)
			{
				return;
			}

			this.placeholdersPreviewer ??= new Previewer({
				...this.context,
				bindElement: this.$refs.preview.$el,
				isDisplayFormat: !this.currentChannel?.isTemplatesBased,
			});

			if (this.placeholdersPreviewer.isShown())
			{
				this.placeholdersPreviewer.close();
			}
			else
			{
				this.$Bitrix.Data.get('locator').getAnalyticsService().onPreviewShow();

				this.placeholdersPreviewer.preview(this.messageBody);
			}
		},
	},
	template: `
		<BText
			ref="preview"
			size="sm"
			tag="div"
			:className="{
				'crm-messagesender-editor__content__footer__text': true, 
				'--pointer': !isProgress && messageBody.trim().length > 0,
				'--disabled': isProgress || messageBody.trim().length <= 0,
			}"
			data-test-role="preview"
			@click="togglePreviewer"
		>{{ $Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_PREVIEW') }}</BText>
	`,
};
