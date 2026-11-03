import { Type } from 'main.core';

import { type TextEditor } from '../text-editor';
import { type TextEditorOptions } from '../types/text-editor-options';
import { BasePlugin, type PluginConstructor, type TypedPluginConstructor } from './base-plugin';

// the set of plugins is known before their defaults are collected, so a default for these options
// would have had nothing left to affect: it is dropped, and dropped with a warning rather than silently
const COMPOSITION_ONLY_OPTIONS: Set<string> = new Set(['plugins', 'extraPlugins', 'removePlugins']);

export class PluginCollection
{
	#pluginConstructors: Map<string, PluginConstructor> = new Map();
	#plugins: Map<string, BasePlugin> = new Map();

	constructor(
		builtinPlugins: PluginConstructor[] = [],
		plugins: Array<string | PluginConstructor> = [],
		pluginsToRemove: Array<string | PluginConstructor> = [],
	)
	{
		// only the composition below reads this: what survives it is #pluginConstructors
		const availablePlugins: Map<string, PluginConstructor> = new Map();

		for (const pluginConstructor of builtinPlugins)
		{
			if (pluginConstructor.getName())
			{
				availablePlugins.set(pluginConstructor.getName(), pluginConstructor);
			}
		}

		for (const plugin of plugins)
		{
			if (Type.isFunction(plugin) && plugin.getName() && !availablePlugins.has(plugin.getName()))
			{
				availablePlugins.set(plugin.getName(), plugin);
			}
		}

		const pluginsToLoad = plugins.filter((plugin: string | PluginConstructor) => {
			if (pluginsToRemove.includes(plugin))
			{
				return false;
			}

			if (Type.isFunction(plugin) && pluginsToRemove.includes(plugin.getName()))
			{
				return false;
			}

			return !pluginsToRemove.includes(availablePlugins.get(plugin as string) as PluginConstructor);
		});

		pluginsToLoad
			.map((plugin: PluginConstructor | string) => {
				return Type.isFunction(plugin) ? plugin : availablePlugins.get(plugin);
			})
			.forEach((pluginConstructor: PluginConstructor | undefined) => {
				if (Type.isFunction(pluginConstructor))
				{
					const name: string = pluginConstructor.getName();
					const registered: PluginConstructor | undefined = this.#pluginConstructors.get(name);
					if (registered !== undefined && registered !== pluginConstructor)
					{
						// eslint-disable-next-line no-console
						console.warn(
							`TextEditor: plugin name collision: "${name}" is registered by more than one constructor, the last one wins.`,
						);
					}

					this.#pluginConstructors.set(name, pluginConstructor);
				}
			});

		this.#includeDependencies(pluginsToRemove);
		this.#sortByDependencies();
	}

	#includeDependencies(pluginsToRemove: Array<string | PluginConstructor>): void
	{
		const removedNames: Set<string> = new Set(
			pluginsToRemove.map((plugin: string | PluginConstructor) => {
				return Type.isFunction(plugin) ? plugin.getName() : plugin;
			}),
		);

		const queue: PluginConstructor[] = [...this.#pluginConstructors.values()];
		for (let index = 0; index < queue.length; index++)
		{
			const pluginConstructor: PluginConstructor = queue[index];
			const dependencies: TypedPluginConstructor[] = pluginConstructor.getDependencies?.() ?? [];
			for (const dependency of dependencies)
			{
				const name: string = dependency.getName();
				if (removedNames.has(name))
				{
					throw new TypeError(
						`TextEditor: plugin "${pluginConstructor.getName()}" requires plugin "${name}", removed via removePlugins.`,
					);
				}

				if (!this.#pluginConstructors.has(name))
				{
					this.#pluginConstructors.set(name, dependency);
					queue.push(dependency);
				}
			}
		}
	}

	#sortByDependencies(): void
	{
		const names: string[] = [...this.#pluginConstructors.keys()];

		// a peer declaration asks for an order without asking for the plugin itself, so it is a
		// preference: peers that cannot be honoured at all give way to the hard order
		let sortedNames: string[] = this.#sortStably(names, this.#collectPrerequisites(true));
		if (sortedNames.length < names.length)
		{
			sortedNames = this.#sortStably(names, this.#collectPrerequisites(false));
		}

		if (sortedNames.length < names.length)
		{
			const resolved: Set<string> = new Set(sortedNames);
			const unresolvedNames: string[] = names.filter((name: string) => !resolved.has(name));
			throw new TypeError(`TextEditor: unresolvable dependency order between plugins: ${unresolvedNames.join(', ')}.`);
		}

		const sorted: Map<string, PluginConstructor> = new Map();
		for (const name of sortedNames)
		{
			sorted.set(name, this.#pluginConstructors.get(name)!);
		}

		this.#pluginConstructors = sorted;
	}

	#collectPrerequisites(withPeers: boolean): Map<string, string[]>
	{
		const prerequisites: Map<string, string[]> = new Map();
		for (const [name, pluginConstructor] of this.#pluginConstructors)
		{
			const prerequisiteNames: Set<string> = new Set();
			for (const dependency of pluginConstructor.getDependencies?.() ?? [])
			{
				prerequisiteNames.add(dependency.getName());
			}

			if (withPeers)
			{
				for (const peerName of pluginConstructor.getPeerDependencies?.() ?? [])
				{
					prerequisiteNames.add(peerName);
				}
			}

			prerequisiteNames.delete(name);
			prerequisites.set(name, [...prerequisiteNames]);
		}

		return prerequisites;
	}

	// returns fewer names than asked for when the prerequisites cannot be satisfied
	#sortStably(names: string[], prerequisites: Map<string, string[]>): string[]
	{
		const sortedNames: string[] = [];
		const visited: Set<string> = new Set();
		let progress = true;
		while (sortedNames.length < names.length && progress)
		{
			progress = false;
			for (const name of names)
			{
				if (visited.has(name))
				{
					continue;
				}

				const ready = prerequisites.get(name)!.every((prerequisite: string) => {
					return visited.has(prerequisite) || !this.#pluginConstructors.has(prerequisite);
				});

				if (ready)
				{
					visited.add(name);
					sortedNames.push(name);
					progress = true;
					// restarts the scan from the very beginning so the next pick is always
					// the minimal original index among the ready plugins, not just the next
					// one found while continuing forward in the same pass (strict stability)
					break;
				}
			}
		}

		return sortedNames;
	}

	init(textEditor: TextEditor): void
	{
		const instances = [];
		for (const [, PluginConstruct] of this.#pluginConstructors)
		{
			const plugin = new PluginConstruct(textEditor);
			if (!(plugin instanceof BasePlugin))
			{
				throw new TypeError('TextEditor: a plugin must be an instance of TextEditor.BasePlugin.');
			}

			this.#plugins.set(PluginConstruct.getName(), plugin);
			instances.push(plugin);
		}

		instances.forEach((instance: BasePlugin) => {
			const cleanup: void | (() => void) = instance.afterInit();
			if (Type.isFunction(cleanup))
			{
				instance.setAfterInitCleanup(cleanup as () => void);
			}
		});
	}

	getConstructors(): PluginConstructor[]
	{
		return [...this.#pluginConstructors.values()];
	}

	getDefaultOptions(): TextEditorOptions
	{
		// the owners map lets no top-level key repeat, so there is nothing to merge one level deep
		const collected: Record<string, unknown> = {};
		const owners: Map<string, string> = new Map();

		for (const [name, pluginConstructor] of this.#pluginConstructors)
		{
			const defaults: TextEditorOptions = pluginConstructor.getDefaultOptions?.() ?? ({} as TextEditorOptions);

			for (const [key, value] of Object.entries(defaults))
			{
				if (COMPOSITION_ONLY_OPTIONS.has(key))
				{
					// eslint-disable-next-line no-console
					console.warn(
						`TextEditor: plugin "${name}" declares a default for option "${key}", which is applied `
						+ 'before plugin defaults are collected, so the default is ignored.',
					);

					continue;
				}

				const owner: string | undefined = owners.get(key);
				if (owner !== undefined)
				{
					// eslint-disable-next-line no-console
					console.warn(
						`TextEditor: plugins "${owner}" and "${name}" both declare a default for option "${key}", "${owner}" wins.`,
					);

					continue;
				}

				owners.set(key, name);
				// an explicitly undefined default is no default: the key stays absent so that a
				// layer above still decides it
				if (value !== undefined)
				{
					collected[key] = value;
				}
			}
		}

		return collected as TextEditorOptions;
	}

	getPlugins(): Map<string, BasePlugin>
	{
		return this.#plugins;
	}

	/**
	 * Reverse order of initialisation: a plugin that starts after the one it depends on has to
	 * stop before it, while that dependency is still whole.
	 *
	 * Teardown is total even when one plugin throws. Letting the throw out used to end the loop:
	 * every remaining plugin kept its commands, listeners and observers, and TextEditor.destroy()
	 * never reached its own cleanup either -- while its re-entry guard was already set, so a second
	 * destroy() call returned at once and the editor could never be cleaned up at all.
	 */
	destroy(): void
	{
		for (const plugin of [...this.#plugins.values()].reverse())
		{
			try
			{
				plugin.destroy();
			}
			catch (error)
			{
				console.error(`TextEditor: plugin "${plugin.getName()}" threw while being destroyed.`, error);
			}
		}

		this.#plugins.clear();
	}

	[Symbol.iterator](): IterableIterator<[string, BasePlugin]>
	{
		return this.#plugins[Symbol.iterator]();
	}

	get<T extends BasePlugin>(key: TypedPluginConstructor<T>): T | null;
	get<T extends BasePlugin = BasePlugin>(key: string): T | null;
	get(key: PluginConstructor | string): BasePlugin | null;
	get(key: PluginConstructor | TypedPluginConstructor | string): BasePlugin | null
	{
		const name: string = Type.isFunction(key) ? key.getName() : key;

		return this.#plugins.get(name) || null;
	}

	has(key: PluginConstructor | string): boolean
	{
		const name: string = Type.isFunction(key) ? key.getName() : key;

		return this.#plugins.has(name);
	}
}
