import { Loc } from 'main.core';
import type { PopupOptions } from 'main.popup';
import { VoteResultBackend } from './backend';
import type { BackendVotedUser } from './types';
import { Popup } from 'ui.vue3.components.popup';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';
import 'ui.icon-set.animated';

export const VoteAnswerVoted = {
	name: 'VoteAnswerVoted',
	components: { Popup, BIcon },
	props: {
		count: {
			type: String,
			required: true,
		},
		firstPageVoted: {
			/** @type BackendVotedUser[] */
			type: Array,
			required: true,
		},
		signedAttachId: {
			type: String,
			required: true,
		},
		answerId: {
			type: String,
			required: true,
		},
		maxVisibleAvatarsCount:	{
			type: Number,
			required: false,
			default: 3,
		},
		pageSize: {
			type: Number,
			required: true,
		},
	},
	data(): { voted: BackendVotedUser[], page: number }
	{
		return {
			voted: this.firstPageVoted,
			page: 1,
			loading: false,
			expanded: false,
		};
	},
	computed: {
		countNumber(): number
		{
			return parseInt(this.count, 10);
		},
		votedCountTitle(): string
		{
			return Loc.getMessagePlural('VOTE_JS_ATTACHED_RESULT_ANSWER_VOTED_COUNT', this.countNumber, {
				'#COUNT#': this.countNumber,
			});
		},
		firstPageVotedWithAvatars(): BackendVotedUser[]
		{
			return this.firstPageVoted.filter((votedUser: BackendVotedUser) => Boolean(votedUser.IMAGE))
				.slice(0, this.maxVisibleAvatarsCount)
			;
		},
		popupOptions(): PopupOptions
		{
			return {
				bindElement: this.$refs.votedLink,
				borderRadius: '18px',
				autoHide: true,
			};
		},
	},
	methods: {
		async popupScrollHandler(event): Promise<void>
		{
			if (this.loading)
			{
				return;
			}

			if (this.countNumber <= this.voted.length)
			{
				return;
			}

			if (event.target.scrollHeight - event.target.scrollTop > event.target.clientHeight)
			{
				return;
			}

			this.loading = true;
			const nextPage = this.page + 1;
			const backend = new VoteResultBackend(this.signedAttachId, this.pageSize);
			try
			{
				const nextPageUsers: BackendVotedUser[] = await backend.loadAnswer(this.answerId, nextPage);
				this.page = nextPage;
				this.voted = [...this.voted, ...nextPageUsers];
			}
			catch (error)
			{
				console.error(error);
			}
			finally
			{
				this.loading = false;
			}
		},
	},
	template: `
		<div class="vote-answer-voted">
			<div v-if="firstPageVotedWithAvatars.length > 0" class="vote-answer-avatars">
				<img class="vote-answer-avatar" v-for="(user, index) in firstPageVotedWithAvatars" :key="index" :src="user.IMAGE" :alt="user.NAME" />
			</div>
			<div class="vote-answer-voted-link" @click="expanded = true" ref="votedLink">
				<div class="vote-answer-voted-title">{{ votedCountTitle }}</div>
				<div class="vote-answer-voted-down"></div>
			</div>
			<Popup v-if="expanded" :options="popupOptions" @close="expanded = false">
				<div class="vote-answer-popup-container" @scroll="this.popupScrollHandler($event)">
					<div v-for="(user, index) in voted" :key="index" class="vote-answer-voted-user">
						<img v-if="user.IMAGE" class="vote-answer-popup-avatar" :src="user.IMAGE" />
						<BIcon v-if="!user.IMAGE"
							   class="vote-answer-popup-avatar"
							   :name="'person'"
							   :size="26"
						/>
						<div class="vote-answer-voted-user-name">{{ user.NAME }}</div>
					</div>
					<BIcon v-if="loading" :name="'loader-wait'" :size="20" />
				</div>
			</Popup>
		</div>
	`,
};
