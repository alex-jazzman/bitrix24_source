import { getCurrentInstance, reactive, toRefs } from 'ui.vue3';
import type { State, Getters } from '../types';
import { useState } from './state';
import { useInstances } from './instances';
import { useActions, type UseActions } from './actions';
import { useGetters } from './getters';
import { useHooks, type UseHooks } from './hooks';

export type UseBlockDiagran = {
	...State,
	...Getters,
	...UseHooks,
	...UseActions,
};

export function useBlockDiagram(options): UseBlockDiagran
{
	const app = getCurrentInstance()?.appContext.app;
	const blockDiagramState = app?.config?.globalProperties?.$blockDiagram ?? null;

	if (blockDiagramState !== null)
	{
		return blockDiagramState;
	}

	const state = useState(options);
	const reactiveState = reactive(state);
	const getters = useGetters(reactiveState);
	const hooks = useHooks();
	const instances = useInstances({ state: reactiveState, getters });
	const actions = useActions({ state: reactiveState, getters, hooks, instances });

	if (options)
	{
		actions.setState(options);
	}

	app.config.globalProperties.$blockDiagram = {
		...toRefs(reactiveState),
		...getters,
		...actions,
		...instances,
		hooks,
	};

	app.config.globalProperties.$blockDiagramTestId = (id: string, ...args: Array<string>): string => {
		if (!id)
		{
			throw new Error('ui.block-diagram not found test id');
		}

		const preparedArgs = args.reduce((acc, arg) => {
			return `${acc}-${arg}`;
		}, '');

		return `${id}${preparedArgs}`;
	};

	return app.config.globalProperties?.$blockDiagram;
}
