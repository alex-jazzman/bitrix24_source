import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { Spinner, SpinnerSize, SpinnerColor } from 'im.v2.component.elements.loader';

import '../css/header.css';

// @vue/component
export const CopilotWidgetListHeader = {
	name: 'CopilotWidgetListHeader',
	components: { BIcon, Spinner },
	props: {
		isCreating: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['newChat', 'close'],
	computed: {
		OutlineIcons: () => OutlineIcons,
		SpinnerColor: () => SpinnerColor,
		SpinnerSize: () => SpinnerSize,
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
				<div
					class="bx-im-copilot-widget-header__create-chat"
					:title="loc('IM_AI_ASSISTANT_WIDGET_HEADER_NEW_CHAT')"
				>
					<div class="bx-im-copilot-widget-header__create-chat">
						<Spinner 
							v-if="isCreating" 
							:size="SpinnerSize.XS"
							:color="SpinnerColor.copilot"
						/>
						<BIcon
							v-else
							class="bx-im-copilot-widget-header__create-chat_icon"
							:name="OutlineIcons.PLUS_L"
							:hoverable="true"
							@click="$emit('newChat')"
						/>
					</div>
				</div>
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