import { Button as UiButton, AirButtonStyle, ButtonColor, ButtonSize } from 'ui.vue3.components.button';

import './css/quick-answer.css';

// @vue/component
export const QuickAnswer = {
	name: 'QuickAnswer',
	components: { UiButton },
	props: {
		notification: {
			type: Object,
			required: true,
		},
	},
	emits: ['sendQuickAnswer'],
	data()
	{
		return {
			quickAnswerText: '',
			quickAnswerResultMessage: '',
			showQuickAnswer: false,
			isSending: false,
			successSentQuickAnswer: false,
		};
	},
	computed: {
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		AirButtonStyle: () => AirButtonStyle,
	},
	methods:
	{
		toggleQuickAnswer()
		{
			if (this.successSentQuickAnswer)
			{
				this.showQuickAnswer = true;
				this.successSentQuickAnswer = false;
				this.quickAnswerResultMessage = '';
			}
			else
			{
				this.showQuickAnswer = !this.showQuickAnswer;
			}

			if (this.showQuickAnswer)
			{
				this.$nextTick(() => {
					this.$refs['textarea'].focus();
				});
			}
		},
		sendQuickAnswer()
		{
			if (this.isSending || this.quickAnswerText.trim() === '')
			{
				return;
			}

			this.isSending = true;

			this.$emit('sendQuickAnswer', {
				id: this.notification.id,
				text: this.quickAnswerText.trim(),
				callbackSuccess: (response) => {
					const {result_message: resultMessage} = response.data();
					const [message] = resultMessage;
					this.quickAnswerResultMessage = message;
					this.successSentQuickAnswer = true;
					this.quickAnswerText = '';
					this.isSending = false;
				},
				callbackError: () => {
					this.isSending = false;
				}
			});
		},
	},
	template: `
		<div class="bx-im-content-notification-quick-answer__container">
			<UiButton
				v-if="!showQuickAnswer"
				:size="ButtonSize.SMALL"
				:text="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_QUICK_ANSWER_BUTTON')"
				:loading="isSending"
				class="--air"
				:style="AirButtonStyle.OUTLINE_NO_ACCENT"
				@click="toggleQuickAnswer" 
				@dblclick.stop
			>
				{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_QUICK_ANSWER_BUTTON') }}
			</UiButton>
			<transition name="quick-answer-slide">
				<div 
					v-if="showQuickAnswer && !successSentQuickAnswer" 
					class="bx-im-content-notification-quick-answer__textarea-container"
				>
					<textarea
						ref="textarea"
						autofocus
						class="bx-im-content-notification-quick-answer__textarea"
						v-model="quickAnswerText"
						:disabled="isSending"
						@keydown.enter.prevent
						@keyup.enter.prevent="sendQuickAnswer"
					/>
					<div 
						v-if="!successSentQuickAnswer" 
						class="bx-im-content-notification-quick-answer__buttons-container"
					>
						<UiButton
							:size="ButtonSize.SMALL"
							:text="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_QUICK_ANSWER_SEND')"
							:isLoading="isSending"
							class="--air"
							:style="AirButtonStyle.FILLED"
							@click="sendQuickAnswer"
						/>
						<UiButton
							:size="ButtonSize.SMALL"
							class="--air"
							:style="AirButtonStyle.OUTLINE_NO_ACCENT"
							:text="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_QUICK_ANSWER_CANCEL')"
							:isDisabled="isSending"
							@click="toggleQuickAnswer"
						/>
					</div>
				</div>
			</transition>
			<div v-if="successSentQuickAnswer" class="bx-im-content-notification-quick-answer__result">
				<div class="bx-im-content-notification-quick-answer__success-icon"></div>
				<div class="bx-im-content-notification-quick-answer__success-text">{{ quickAnswerResultMessage }}</div>
			</div>
		</div>
	`,
};
