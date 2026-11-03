import { type ToolbarItem } from './toolbar/toolbar-item';

type ComponentFactory = () => ToolbarItem;

function normalizeName(name: string): string
{
	return String(name).toLowerCase();
}

export class ComponentRegistry
{
	#components: Map<string, ComponentFactory> = new Map();

	register(name: string, factory: ComponentFactory): void
	{
		this.#components.set(normalizeName(name), factory);
	}

	create(name: string): ToolbarItem | null
	{
		const factory: ComponentFactory | undefined = this.#components.get(normalizeName(name));

		return factory === undefined ? null : factory();
	}
}
