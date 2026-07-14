import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { AiAssistantCreateChatButton } from 'im.v2.component.list.container.ai-assistant';

import '../css/header.css';

// @vue/component
export const CopilotWidgetListHeader = {
	name: 'CopilotWidgetListHeader',
	components: { BIcon, AiAssistantCreateChatButton },
	props: {
		isCreating: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['createChat', 'close'],
	computed: {
		OutlineIcons: () => OutlineIcons,
		copilotName(): string
		{
			return this.$store.getters['copilot/getName'];
		},
	},
	methods: {
		loc(phrase: string): string
		{
			return this.$Bitrix.Loc.getMessage(phrase);
		},
	},
	template: `
		<div class="bx-im-copilot-widget-header__container">
			<div class="bx-im-copilot-widget-header__title">
				{{ copilotName }}
			</div>
			<div class="bx-im-copilot-widget-header__actions">
				<AiAssistantCreateChatButton
					:isCreating="isCreating"
					@newChat="$emit('createChat')"
				/>
				<div
					class="bx-im-copilot-widget-header__close"
					:title="loc('IM_AI_ASSISTANT_WIDGET_HEADER_CLOSE')"
					@click="$emit('close')"
				>
					<BIcon
						class="bx-im-copilot-widget-header__close-icon"
						:name="OutlineIcons.CROSS_L"
						:hoverable="true"
					/>
				</div>
			</div>
		</div>
	`,
};
