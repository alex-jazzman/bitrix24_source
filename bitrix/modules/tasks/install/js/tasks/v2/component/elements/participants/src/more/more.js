import './more.css';

// @vue/component
export const More = {
	props: {
		count: {
			type: Number,
			required: true,
		},
		withRemove: {
			type: Boolean,
			default: false,
		},
		inline: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['showMore', 'removeAll'],
	computed: {
		moreFormatted(): string
		{
			return this.loc('TASKS_V2_USERS_MORE_COUNT', {
				'#COUNT#': this.count,
			});
		},
	},
	template: `
		<div v-if="count || withRemove" :class="['tasks-field-users-footer', { '--inline': inline }]">
			<button v-if="count" type="button" class="tasks-field-users-more" @click="$emit('showMore')">
				{{ moreFormatted }}
			</button>
			<button v-if="withRemove" type="button" class="tasks-field-users-more --remove" @click="$emit('removeAll')">
				{{ loc('TASKS_V2_USERS_REMOVE_ALL') }}
			</button>
		</div>
	`,
};
