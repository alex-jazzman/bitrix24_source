import { Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { IconButton } from 'im.v2.component.elements.icon-button';
import { Color } from 'im.v2.const';
import { Parser } from 'im.v2.lib.parser';

import '../css/message-panel.css';

import type { ImModelMessage } from 'im.v2.model';

// @vue/component
export const EditPanel = {
	name: 'EditPanel',
	components: { IconButton },
	props:
	{
		messageId: {
			type: [Number, String],
			required: true,
		},
	},
	emits: ['close'],
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		closeIconColor: () => Color.gray90,
		message(): ImModelMessage
		{
			return this.$store.getters['messages/getById'](this.messageId);
		},
		preparedText(): string
		{
			return Parser.purifyMessage(this.message);
		},
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-message-panel__container" data-testid="im-textarea-edit-panel">
			<div class="bx-im-message-panel__icon"></div>
			<div class="bx-im-message-panel__content">
				<div class="bx-im-message-panel__title">{{ loc('IM_TEXTAREA_EDIT_MESSAGE_TITLE') }}</div>
				<div class="bx-im-message-panel__text">{{ preparedText }}</div>
			</div>
			<IconButton
				class="bx-im-message-panel__close"
				:iconName="OutlineIcons.CROSS_L"
				:iconColor="closeIconColor"
				:label="loc('IM_TEXTAREA_EDIT_PANEL_CLOSE_ARIA')"
				data-testid="im-textarea-edit-panel-close-btn"
				@click="$emit('close')"
			/>
		</div>
	`,
};
