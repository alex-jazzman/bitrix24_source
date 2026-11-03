import { DefaultMessage } from 'im.v2.component.message.default';
import { FileMessage } from 'im.v2.component.message.file';

import { SessionNumberPlaque } from './components/session-number-plaque';

import './css/session-number.css';

import type { JsonObject } from 'main.core';
import type { ImModelMessage } from 'im.v2.model';

// @vue/component
export const SupportSessionNumberMessage = {
	name: 'SupportSessionNumber',
	components: { DefaultMessage, FileMessage, SessionNumberPlaque },
	props:
	{
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		withTitle: {
			type: Boolean,
			default: true,
		},
		containerHeight: {
			type: [Number, null],
			default: null,
		},
	},
	data(): JsonObject
	{
		return {};
	},
	computed:
	{
		message(): ImModelMessage
		{
			return this.item;
		},
		hasFiles(): boolean
		{
			return this.message.files.length > 0;
		},
	},
	template: `
		<FileMessage
			v-if="hasFiles"
			:item="item"
			:dialogId="dialogId"
			:withTitle="withTitle"
			:containerHeight="containerHeight"
		>
			<template #before-message>
				<SessionNumberPlaque :item="item"/>
			</template>
		</FileMessage>
		<DefaultMessage v-else :item="item" :dialogId="dialogId" :withTitle="withTitle">
			<template #before-message>
				<SessionNumberPlaque :item="item"/>
			</template>
		</DefaultMessage>
	`,
};
