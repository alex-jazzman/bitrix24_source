import { Loc, Text } from 'main.core';
import { type PopupOptions } from 'main.popup';
import { type EventEmitter } from 'main.core.events';

import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { ChatType } from 'im.v2.const';
import { MessengerPopup } from 'im.v2.component.elements.popup';
import { MentionAddUserService } from 'im.v2.component.textarea';
import { Analytics } from 'im.v2.lib.analytics';
import { Notifier } from 'im.v2.lib.notifier';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelUser } from 'im.v2.model';

import { AddToTaskButtonLoader } from './button-loader';

import './css/add-to-task-popup.css';

const POPUP_ID = 'im-mention-add-to-task-popup';
const POPUP_WIDTH = 400;
const POPUP_OFFSET_TOP = 7;

const DESCRIPTION_REPLACEMENTS = {
	'#NAME_START#': '<span class="bx-im-mention-add-to-task__user-name">',
	'#NAME_END#': '</span>',
};

const ADD_TO_TASK_DESCRIPTION = Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_TASK_POPUP_DESCRIPTION', DESCRIPTION_REPLACEMENTS);
const ADD_TO_TASK_BUTTON = Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_TASK_COMMENTS_DROPDOWN_MENU');

// @vue/component
export const AddToTaskPopup = {
	name: 'AddToTaskPopup',
	components: { MessengerPopup, UiButton, AddToTaskButtonLoader },
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
		userId: {
			type: [String, Number],
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		chatId: {
			type: Number,
			required: true,
		},
	},
	emits: ['close'],
	data(): Object
	{
		return {
			isLoading: false,
		};
	},
	computed: {
		POPUP_ID: () => POPUP_ID,
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
		OutlineIcons: () => OutlineIcons,
		buttonText(): string
		{
			return ADD_TO_TASK_BUTTON;
		},
		config(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				bindOptions: { position: 'top' },
				angle: true,
				closeIcon: true,
				autoHide: true,
				width: POPUP_WIDTH,
				offsetTop: POPUP_OFFSET_TOP,
				borderRadius: '20px',
				padding: 0,
				background: 'var(--ui-color-bg-vibrant-default)',
			};
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.userId, true);
		},
		description(): string
		{
			return ADD_TO_TASK_DESCRIPTION.replace('#NAME#', Text.encode(this.user.name));
		},
	},
	methods: {
		onAddClick()
		{
			if (this.isLoading)
			{
				return;
			}

			Analytics.getInstance().mention.onClickAddToChatFromPopup(this.dialogId);

			void this.addUserToChat();
		},
		async addUserToChat()
		{
			const params = { dialogId: this.dialogId, chatId: this.chatId, userId: this.userId };

			this.isLoading = true;

			try
			{
				const isAdded = await this.getAddUserService().addUser(params);

				if (isAdded)
				{
					Notifier.chat.handleUserAddComplete(ChatType.taskComments);
				}

				this.$emit('close');
			}
			catch (error)
			{
				Logger.error('AddToTaskPopup: addUser error', error);

				this.isLoading = false;
				Notifier.chat.handleUserAddError(ChatType.taskComments);
			}
		},
		getAddUserService(): MentionAddUserService
		{
			this.addUserService ??= new MentionAddUserService({ emitter: this.getEmitter() });

			return this.addUserService;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-im-mention-add-to-task__content">
				<div class="bx-im-mention-add-to-task__description" v-html="description"></div>
				<div class="bx-im-mention-add-to-task__action">
					<UiButton
						:text="buttonText"
						:style="AirButtonStyle.FILLED"
						:size="ButtonSize.SMALL"
						:leftIcon="OutlineIcons.ADD_PERSON"
						:disabled="isLoading"
						@click="onAddClick"
					/>
					<AddToTaskButtonLoader v-if="isLoading" />
				</div>
			</div>
		</MessengerPopup>
	`,
};
