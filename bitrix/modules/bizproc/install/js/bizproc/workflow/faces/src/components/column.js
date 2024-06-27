import { DateTimeFormat } from 'main.date';
import { Type, Text } from 'main.core';
import 'ui.tooltip';

import '../css/column.css';

export const Column = {
	name: 'bp-workflow-faces-column',
	props: {
		title: String,
		avatars: Array,
		status: {
			type: String,
			validator: (value) => {
				return ['accept', 'decline', 'progress'].includes(value);
			},
		},
		hasMoreTasks: {
			type: Boolean,
			default: false,
		},
		tasksCount: Number,
		time: Number,
	},
	computed: {
		hasTitle(): boolean
		{
			return Type.isStringFilled(this.title);
		},
		hasFaces(): boolean
		{
			return Type.isArrayFilled(this.avatars);
		},
		hasStatus(): boolean
		{
			return Type.isStringFilled(this.status);
		},
		hasTime(): boolean
		{
			return Type.isNumber(this.time);
		},
		isProgressStatus(): boolean
		{
			return this.status === 'progress';
		},
		isAcceptStatus(): boolean
		{
			return this.status === 'accept';
		},
		isDeclineStatus(): boolean
		{
			return this.status === 'decline';
		},
		duration(): string
		{
			if (Type.isNil(this.time) || this.time === 0)
			{
				return this.$Bitrix.Loc.getMessage('BIZPROC_JS_WORKFLOW_FACES_EMPTY_TIME');
			}

			return DateTimeFormat.format(
				[['s', 'sdiff'], ['i', 'idiff'], ['H', 'Hdiff'], ['d', 'ddiff'], ['m', 'mdiff'], ['Y', 'Ydiff']],
				0,
				this.time,
			);
		},
		completedTasksCountMessage(): string
		{
			return this.$Bitrix.Loc.getMessage('BIZPROC_JS_WORKFLOW_COMPLETED_TASK_COUNT', { '#COUNT#': this.tasksCount });
		},
	},
	methods: {
		getSafeUrl(url): string
		{
			return `url('${encodeURI(Text.encode(url))}')`;
		},
	},
	template: `
		<div
			:class="{
				'bp-workflow-faces__steps-item': true,
				'--in-progress': hasFaces,
				'--loading': !hasFaces && hasStatus,
			}">
			<div
				v-if="hasMoreTasks"
				:title="completedTasksCountMessage"
				class="bp-workflow-faces__icon-progress-box"
			>
				<div class="ui-icon-set --more bp-workflow-faces__icon-progress"></div>
				<div class="bp-workflow-faces__icon-progress-overlay"></div>
			</div>
			<div class="bp-workflow-faces__steps-name">
				<div v-if="hasTitle" class="bp-workflow-faces__text-area">
					{{ title }}
				</div>
				<div v-else class="bp-workflow-faces__fake-area">
					<div class="bp-workflow-faces__fake-area-stub"></div>
				</div>
			</div>
			<div class="bp-workflow-faces__steps-users">
				<div v-if="!hasFaces && !hasStatus" class="ui-icon-set --person bp-workflow-faces__steps-user"></div>
				<template v-else-if="hasFaces">
					<template v-if="hasStatus">
						<div v-if="isProgressStatus" class="bp-workflow-faces__icon-waiting-box">
							<div class="ui-icon-set --black-clock bp-workflow-faces__icon-waiting"></div>
							<div class="bp-workflow-faces__icon-overlay"></div>
						</div>
						<div v-if="isAcceptStatus" class="bp-workflow-faces__icon-done-box">
							<div class="ui-icon-set --circle-check bp-workflow-faces__icon-done"></div>
							<div class="bp-workflow-faces__icon-overlay"></div>
						</div>
						<div v-if="isDeclineStatus" class="bp-workflow-faces__icon-decline-box">
							<div class="ui-icon-set --cross-circle-60 bp-workflow-faces__icon-decline"></div>
							<div class="bp-workflow-faces__icon-overlay"></div>
						</div>
					</template>
					<template v-for="avatar in avatars" :key="avatar.id">
						<div 
							v-if="avatar.avatarUrl"
							class="bp-workflow-faces__steps-user-item"
							:style="{ backgroundImage: getSafeUrl(avatar.avatarUrl)}"
							:bx-tooltip-user-id="avatar.id"
						></div>
						<div
							v-else-if="avatar.id > 0"
							class="bp-workflow-faces__steps-user-item"
							:bx-tooltip-user-id="avatar.id"
						></div>
						<div v-else class="bp-workflow-faces__steps-user-item --tech"></div>
					</template>
				</template>
				<template v-else>
					<div v-if="isProgressStatus" class="bp-workflow-faces__icon-waiting-box --center">
						<div class="ui-icon-set --black-clock bp-workflow-faces__icon-waiting"></div>
						<div class="bp-workflow-faces__icon-overlay"></div>
					</div>
					<div v-if="isAcceptStatus" class="bp-workflow-faces__icon-done-box --center">
						<div class="ui-icon-set --circle-check bp-workflow-faces__icon-done"></div>
						<div class="bp-workflow-faces__icon-overlay"></div>
					</div>
				</template>
			</div>
			<div class="bp-workflow-faces__steps-duration">
				<div v-if="hasTime" class="bp-workflow-faces__text-area">
					{{ duration }}
				</div>
				<div v-else class="bp-workflow-faces__fake-area">
					<div class="bp-workflow-faces__fake-area-stub"></div>
				</div>
			</div>
		</div>
	`,
};
