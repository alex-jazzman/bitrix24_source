import { Type } from 'main.core';
import { EmptyListItem } from './empty-list-item';
import { ListActionButton } from './list-action-button';
// eslint-disable-next-line no-unused-vars
import type { TabListDataTestIds } from './types';
import './styles/list.css';

export const TabList = {
	name: 'tabList',
	components: { ListActionButton, EmptyListItem },
	emits: ['tabListAction'],

	props: {
		id: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		count: {
			type: Number,
			required: false,
		},
		menuItems: {
			type: Array,
			required: false,
			default: [],
		},
		listItems: {
			type: Array,
			required: true,
		},
		emptyItemTitle: {
			type: String,
			required: false,
		},
		emptyItemImageClass: {
			type: String,
			required: false,
		},
		hideEmptyItem: {
			type: Boolean,
			required: false,
			default: false,
		},
		withAddPermission: {
			type: Boolean,
			required: false,
			default: true,
		},
		/** @var { TabListDataTestIds } dataTestIds */
		dataTestIds: {
			type: Object,
			required: false,
			default: {},
		},
	},

	computed: {
		needToShowCount(): boolean
		{
			return Type.isNumber(this.count);
		},
	},

	methods: {
		onActionMenuItemClick(actionId: string): void
		{
			this.$emit('tabListAction', actionId);
		},
	},

	template: `
		<div
			class="hr-department-detail-content__tab-list_container"
			 :data-test-id="dataTestIds.containerDataTestId"
		>
			<div class="hr-department-detail-content__tab-list_header-container">
				<div class="hr-department-detail-content__tab-list_list-title">
					{{ title}}
					<span
						v-if="needToShowCount"
						class="hr-department-detail-content__tab-list_header-count"
						:data-test-id="dataTestIds.listCounterDataTestId"
					>
					{{ count }}
				</span>
				</div>
				<ListActionButton
					:id="id"
					:menuItems="menuItems"
					@tabListAction="onActionMenuItemClick"
					:dataTestIds="{buttonDataTestId: dataTestIds.listActionButtonDataTestId, containerDataTestId: dataTestIds.listActonMenuDataTestId}"
				/>
			</div>
			<div class="hr-department-detail-content__tab_list-container">
				<template v-for="(item) in listItems">
					<slot :item="item"/>
				</template>
				<EmptyListItem v-if="emptyItemTitle && emptyItemImageClass && !listItems.length && !hideEmptyItem"
					:title="emptyItemTitle"
					:imageClass="emptyItemImageClass"
					:withAddPermission="withAddPermission"
				/>
			</div>
		</div>
	`,
};
