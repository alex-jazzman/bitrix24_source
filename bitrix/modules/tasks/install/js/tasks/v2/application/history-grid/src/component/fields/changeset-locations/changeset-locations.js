import { localizationMap } from './localization-map';
import './changeset-locations.css';

// @vue/component
export const ChangesetLocations = {
	props: {
		getGrid: {
			type: Function,
			required: true,
		},
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	setup(): Object
	{
		return {
			localizationMap,
		};
	},
	data(): Object
	{
		return {
			changeTypesRef: [],
			changeTypes: [],
		};
	},
	methods: {
		async update(): Promise<void>
		{
			const changes = this.getGrid().querySelectorAll('[data-changeset-location]');

			this.changeTypes = [...changes].map((changeNode: HTMLElement) => {
				return this.getChange(changeNode);
			});

			await this.$nextTick();

			changes.forEach((changeNode: HTMLElement) => {
				const change = this.getChange(changeNode);
				changeNode.append(this.changeTypesRef[change.rowId]);
			});
		},
		getChange(changeTypeNode: HTMLElement): Object
		{
			const rowId = Number(changeTypeNode.closest('[data-id]').dataset.id);
			const changeType = changeTypeNode.dataset.changesetLocation;
			const isComment = ['COMMENT', 'COMMENT_EDIT', 'COMMENT_DEL'].includes(changeType);

			return {
				rowId,
				changeType: this.loc(this.localizationMap[changeType]),
				isComment,
			};
		},
		setRef(element: HTMLElement, rowId: number): void
		{
			this.changeTypesRef ??= {};
			this.changeTypesRef[rowId] = element;
		},
		handleClick(): void
		{
			BX.SidePanel.Instance.open(`/task/comments/${this.taskId}`, {
				width: 1000,
			});
		},
	},
	template: `
		<template v-for="(changeType, id) in changeTypes" :key="id">
			<div
				:ref="(el) => setRef(el, changeType.rowId)"
				@click="() => changeType.isComment && handleClick()"
				:class="{ 'tasks-history-grid-comment-link': changeType.isComment }"
			>
				{{ changeType.changeType }}
			</div>
		</template>
	`,
};
