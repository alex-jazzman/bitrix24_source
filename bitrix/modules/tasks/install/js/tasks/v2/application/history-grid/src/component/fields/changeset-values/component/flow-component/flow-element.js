import { Runtime, Type } from 'main.core';

export type FlowChangeset = {
	id: ?number,
	name: ?string,
};

// @vue/component
export const FlowElement = {
	props: {
		value: {
			type: String,
			default: '',
		},
	},
	data(): Object
	{
		return {
			viewFormExtension: null,
		};
	},
	computed: {
		flow(): FlowChangeset
		{
			return JSON.parse(this.value);
		},
		isNotFilled(): boolean
		{
			return Type.isNull(this.flow);
		},
		isHidden(): boolean
		{
			return Object.keys(this.flow).length === 0;
		},
		flowName(): string
		{
			return this.flow?.name || '';
		},
	},
	async beforeMount(): Promise<void>
	{
		const extension = await Runtime.loadExtension('tasks.flow.view-form');
		this.viewFormExtension = extension.ViewForm;
	},
	methods: {
		handleClick(): void
		{
			this.viewFormExtension?.showInstance({
				flowId: this.flow?.id,
				bindElement: this.$refs.flowLink,
			});
		},
	},
	template: `
		<span v-if="isNotFilled"/>
		<span v-else-if="isHidden">{{ loc('TASKS_V2_HISTORY_LOG_HIDDEN_VALUE') }}</span>
		<a v-else @click="handleClick" ref="flowLink">{{ flowName }}</a>
	`,
};
