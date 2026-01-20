import type { PopupOptions } from 'main.popup';

import { Popup } from 'ui.vue3.components.popup';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.tooltip';
import 'ui.icon-set.outline';

import { UserAvatar } from 'tasks.v2.component.elements.user-avatar';

import { formatTime } from '../lib/time-tracking-util';
import './time-tracking-participants-popup.css';

// @vue/component
export const TimeTrackingParticipantsPopup = {
	name: 'TasksTimeTrackingParticipantsPopup',
	components: {
		BIcon,
		UserAvatar,
		Popup,
	},
	props: {
		isShown: {
			type: Boolean,
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			default: () => null,
		},
		users: {
			type: Array,
			required: true,
		},
		contribution: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			Outline,
			formatTime,
		};
	},
	computed: {
		options(): PopupOptions
		{
			return {
				id: 'ui-user-avatar-list-more-popup',
				bindElement: this.bindElement,
				padding: 18,
				maxWidth: 320,
				maxHeight: 240,
				offsetTop: 8,
				offsetLeft: -18,
				targetContainer: document.body,
			};
		},
	},
	methods: {
		close(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<Popup v-if="isShown" :options @close="close">
			<div class="tasks-time-tracking-list-users --popup">
				<template v-for="user of users" :key="user.id">
					<div class="tasks-time-tracking-list-user-container">
						<div class="tasks-time-tracking-list-user-inner">
							<div :bx-tooltip-user-id="user.id" bx-tooltip-context="b24">
								<span class="tasks-time-tracking-list-user-image">
									<UserAvatar :src="user.image" :type="user.type"/>
								</span>
								<span class="tasks-time-tracking-list-user-title">{{ user.name }}</span>
							</div>
							<div>
								<span class="tasks-time-tracking-list-user-time">
									{{ formatTime(contribution[user.id]) }}
								</span>
								<BIcon class="tasks-time-tracking-list-user-icon" :name="Outline.TIMER"/>
							</div>
						</div>
					</div>
				</template>
			</div>
		</Popup>
	`,
};
