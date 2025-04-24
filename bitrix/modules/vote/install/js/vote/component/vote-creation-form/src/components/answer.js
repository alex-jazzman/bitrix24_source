import { Resize } from '../directives/resize';

// @vue/component
export const Answer = {
	name: 'voteAnswer',
	directives: { resize: Resize },
	props: {
		id: {
			type: String,
			required: true,
		},
		removable: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['removeAnswer', 'changeAnswer'],
	data(): { answerText: string; }
	{
		return { answerText: '' };
	},
	methods:
	{
		removeAnswer(): void
		{
			this.$emit('removeAnswer');
		},
		changeAnswer(): void
		{
			this.$emit('changeAnswer', this.answerText);
		},
	},
	template: `
		<div class="vote-creation-form__answer" :data-id="id">
			<div class="vote-creation-form__answer_dnd-icon ui-icon-set --more-points"></div>
			<div class="ui-ctl ui-ctl-textarea ui-ctl-no-resize">
				<textarea
					maxlength="100"
					class="ui-ctl-element"
					v-resize
					v-model.trim="answerText"
					@input="changeAnswer"
				></textarea>
			</div>
			<div
				v-if="removable"
				class="vote-creation-form__answer_trash"
				@click="removeAnswer"
			>
			</div>
		</div>
	`,
};
