import { typeLocalizationMap } from './type-localization-map';

// @vue/component
export const TypeFields = {
	props: {
		getGrid: {
			type: Function,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			typeLocalizationMap,
		};
	},
	data(): Object
	{
		return {
			systemLogTypeRef: [],
			systemLogType: [],
		};
	},
	methods: {
		async update(): Promise<void>
		{
			const type = this.getGrid().querySelectorAll('[data-system-log-type]');

			this.systemLogType = [...type].map((systemLogTypeNode: HTMLElement) => this.getSystemLogType(systemLogTypeNode));

			await this.$nextTick();

			type.forEach((systemLogTypeNode: HTMLElement) => {
				const systemLogType = this.getSystemLogType(systemLogTypeNode);
				systemLogTypeNode.append(this.systemLogTypeRef[systemLogType.rowId]);
			});
		},
		getSystemLogType(systemLogTypeNode: HTMLElement): Object
		{
			const rowId = Number(systemLogTypeNode.closest('[data-id]').dataset.id);
			const type = systemLogTypeNode.dataset.systemLogType;

			return {
				rowId,
				type,
			};
		},
		setRef(element: HTMLElement, rowId: number): void
		{
			this.systemLogTypeRef ??= {};
			this.systemLogTypeRef[rowId] = element;
		},
	},
	template: `
		<template v-for="(type, id) in systemLogType" :key="id">
			<div :ref="(el) => setRef(el, type.rowId)">
				{{ loc(typeLocalizationMap[type.type] ?? Object.values(typeLocalizationMap)[0]) }}
			</div>
		</template>
	`,
};
