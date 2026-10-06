import { ref, type Ref } from 'ui.vue3';

export class NodeTitleEditService
{
	#isEdit: Ref<boolean> = ref(false);

	get isEdit(): Ref<boolean>
	{
		return this.#isEdit;
	}

	startEdit(): void
	{
		this.#isEdit.value = true;
	}

	confirm(): void
	{
		this.#isEdit.value = false;
	}

	cancel(): void
	{
		this.#isEdit.value = false;
	}
}

// The key is a block id that comes from the server, so it is data, not a known name: on a plain
// object an id like `__proto__` or `constructor` would answer with an inherited value instead of
// a service, and `??=` would never create one.
const nodeTitleEditServicesMap: { [string]: NodeTitleEditService } = Object.create(null);

export const nodeTitleEditServices = {
	get(blockId: string): NodeTitleEditService
	{
		nodeTitleEditServicesMap[blockId] ??= new NodeTitleEditService();

		return nodeTitleEditServicesMap[blockId];
	},
	delete(blockId: string): void
	{
		delete nodeTitleEditServicesMap[blockId];
	},
};
