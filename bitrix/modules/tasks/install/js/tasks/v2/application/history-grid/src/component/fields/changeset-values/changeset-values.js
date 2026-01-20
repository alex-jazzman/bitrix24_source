import { HistoryChange } from './history-change';
import { formatMap } from './format/format-map';
import { componentMap } from './component/component-map';

// @vue/component
export const ChangesetValues = {
	components: {
		HistoryChange,
	},
	props: {
		getGrid: {
			type: Function,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			formatMap,
			componentMap,
		};
	},
	data(): Object
	{
		return {
			changesetRef: [],
			changesetLocations: [],
		};
	},
	methods: {
		async update(): Promise<void>
		{
			const changesetValues = this.getGrid().querySelectorAll('[data-changeset-from-value][data-changeset-to-value]');

			this.changesetLocations = [...changesetValues].map((changesetValueNode: HTMLElement) => {
				return this.getChangesetInfo(changesetValueNode);
			});

			await this.$nextTick();

			changesetValues.forEach((changesetValueNode: HTMLElement) => {
				const changeset = this.getChangesetInfo(changesetValueNode);
				changesetValueNode.append(this.changesetRef[changeset.rowId]);
			});
		},
		getChangesetInfo(changesetValueNode: HTMLElement): Object
		{
			const rowId = Number(changesetValueNode.closest('[data-id]').dataset.id);
			const location = this.getGrid().querySelector(`[data-id="${rowId}"] [data-changeset-location]`).dataset.changesetLocation;

			return {
				location,
				rowId,
				changesetValue: {
					fromValue: changesetValueNode.dataset.changesetFromValue,
					toValue: changesetValueNode.dataset.changesetToValue,
				},
			};
		},
		setRef(element: HTMLElement, rowId: number): void
		{
			this.changesetRef ??= {};
			this.changesetRef[rowId] = element;
		},
	},
	template: `
		<template v-for="(changesetLocation, id) in changesetLocations" :key="id">
			<HistoryChange
				:changeset="changesetLocation.changesetValue"
				:component="componentMap[changesetLocation.location]"
				:format="formatMap[changesetLocation.location]"
				:ref="(el) => setRef(el?.$el, changesetLocation.rowId)"
			/>
		</template>
	`,
};
