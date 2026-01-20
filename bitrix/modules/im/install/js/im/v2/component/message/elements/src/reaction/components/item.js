import { Reaction } from 'ui.reaction.item.vue';

import { ReactionUser } from './user';
import { AdditionalUsers } from './additional-users';

const USERS_TO_SHOW = 5;
const REACTION_SIZE = 16;
const SHOW_USERS_DELAY = 500;

// @vue/component
export const ReactionItem = {
	components: { ReactionUser, AdditionalUsers, Reaction },
	props:
	{
		messageId: {
			type: [String, Number],
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
		counter: {
			type: Number,
			required: true,
		},
		users: {
			type: Array,
			required: true,
		},
		selected: {
			type: Boolean,
			required: true,
		},
		animate: {
			type: Boolean,
			required: true,
		},
		showAvatars: {
			type: Boolean,
			required: false,
			default: true,
		},
	},
	emits: ['click', 'animationFinish'],
	data(): Object
	{
		return {
			showAdditionalUsers: false,
		};
	},
	computed:
	{
		REACTION_SIZE: () => REACTION_SIZE,
		needToShowUsers(): boolean
		{
			if (!this.showAvatars)
			{
				return false;
			}
			const userLimitIsNotReached = this.counter <= USERS_TO_SHOW;
			// after reaction removal we do not receive all users data to show avatar list properly
			const weHaveUsersData = this.counter === this.users.length;

			return userLimitIsNotReached && weHaveUsersData;
		},
		preparedUsers(): number[]
		{
			return [...this.users].sort((a, b) => b - a);
		},
	},
	methods:
	{
		startShowUsersTimer()
		{
			this.showUsersTimeout = setTimeout(() => {
				this.showAdditionalUsers = true;
			}, SHOW_USERS_DELAY);
		},
		clearShowUsersTimer()
		{
			clearTimeout(this.showUsersTimeout);
		},
		onClick()
		{
			this.clearShowUsersTimer();
			this.$emit('click');
		},
	},
	template: `
		<div
			@click="onClick" 
			@mouseenter="startShowUsersTimer"
			@mouseleave="clearShowUsersTimer"
			class="bx-im-reaction-list__item"
			:class="{'--selected': selected}"
		>
			<div class="bx-im-reaction-list__item_icon">
				<Reaction
					:size="REACTION_SIZE"
					:name="type"
					:animate="animate"
					@animationFinish="$emit('animationFinish')"
				/>
			</div>
			<div v-if="needToShowUsers" class="bx-im-reaction-list__user_container" ref="users">
				<TransitionGroup name="bx-im-reaction-list__user_animation">
					<ReactionUser 
						v-for="user in preparedUsers" 
						:key="type + user" 
						:userId="user"
					/>
				</TransitionGroup>
			</div>
			<div v-else class="bx-im-reaction-list__item_counter" ref="counter">{{ counter }}</div>
			<AdditionalUsers
				:show="showAdditionalUsers"
				:bindElement="$refs['users'] || $refs['counter'] || {}"
				:messageId="messageId"
				:reaction="type"
				@close="showAdditionalUsers = false"
			/>
		</div>
	`,
};
