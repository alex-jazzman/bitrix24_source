import { Event } from 'main.core';
import { type LexicalEditor, type LexicalNodeConfig } from 'ui.lexical.core';
import { mergeRegister } from 'ui.lexical.utils';

import { BBCodeExportConversion, BBCodeImportConversion } from '../bbcode';
import { type TextEditor } from '../text-editor';
import { type SchemeValidationOptions } from '../types/scheme-validation-options';
import { type TextEditorOptions } from '../types/text-editor-options';

export interface PluginStaticMembers
{
	getName(): string;
	getNodes(editor: TextEditor): Array<LexicalNodeConfig>;
	getDependencies?(): TypedPluginConstructor[];
	getPeerDependencies?(): string[];
	getDefaultOptions?(): TextEditorOptions;
}

export type TypedPluginConstructor<T extends BasePlugin = BasePlugin> =
	(new (textEditor: TextEditor) => T) & PluginStaticMembers;
export type PluginConstructor = TypedPluginConstructor;

/**
 * @memberof BX.UI.TextEditor
 */
export class BasePlugin
{
	#textEditor: TextEditor = null!;
	#destroyed: boolean = false;
	#removeListeners: () => void = () => {};
	#afterInitCleanup: (() => void) | null = null;
	#abortController: AbortController = new AbortController();

	constructor(textEditor: TextEditor)
	{
		this.#textEditor = textEditor;
	}

	static getName(): string
	{
		throw new Error('getName must be implemented in a child class');
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [];
	}

	static getDependencies(): TypedPluginConstructor[]
	{
		return [];
	}

	static getPeerDependencies(): string[]
	{
		return [];
	}

	static getDefaultOptions(): TextEditorOptions
	{
		return {} as TextEditorOptions;
	}

	importBBCode(): BBCodeImportConversion | null
	{
		return null;
	}

	exportBBCode(): BBCodeExportConversion | null
	{
		return null;
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return null;
	}

	afterInit(): void | (() => void)
	{
		// you can override this method; a returned function is called on destroy
	}

	getName(): string
	{
		return (this.constructor as typeof BasePlugin).getName();
	}

	getEditor(): TextEditor
	{
		return this.#textEditor;
	}

	getLexicalEditor(): LexicalEditor
	{
		return this.#textEditor.getLexicalEditor();
	}

	/**
	 * Registers teardown work to run when the plugin is destroyed.
	 *
	 * After destroy() there is nothing left to register into: the composite has already run and is
	 * gone, and it never runs a second time. A caller reaching here that late is tearing something
	 * down from inside its own teardown -- so the work is run at once rather than merged into a
	 * list nothing will ever walk, which is how such cleanups used to leak without a trace.
	 */
	cleanUpRegister(...func: Array<Function>): void
	{
		if (this.#destroyed)
		{
			(func as Array<() => void>).forEach((cleanUp: () => void): void => cleanUp());

			return;
		}

		this.#removeListeners = mergeRegister(this.#removeListeners, ...(func as Array<() => void>));
	}

	/**
	 * The cancellation channel of the plugin: it is aborted by destroy(). Pass it to anything that
	 * outlives a single call -- `Event.bind(target, type, handler, { signal })` for DOM listeners,
	 * and the deferred helpers below use it themselves.
	 *
	 * It is the safety net rather than the main path: a listener bound while a dialog is shown is
	 * still unbound when the dialog hides. What the signal adds is that the listener also goes when
	 * the plugin does -- including when the dialog belongs to another module and never reports
	 * hiding at all.
	 */
	getAbortSignal(): AbortSignal
	{
		return this.#abortController.signal;
	}

	registerTimeout(handler: () => void, timeout: number): void
	{
		this.#registerDeferred(handler, (run: () => void): (() => void) => {
			const timeoutId = setTimeout(run, timeout);

			return (): void => clearTimeout(timeoutId);
		});
	}

	registerAnimationFrame(handler: () => void): void
	{
		this.#registerDeferred(handler, (run: () => void): (() => void) => {
			const frameId = requestAnimationFrame(run);

			return (): void => cancelAnimationFrame(frameId);
		});
	}

	/**
	 * Defers a body and drops it on destroy, so a deferred body never reaches into an editor that
	 * has already been taken apart. `schedule` starts the wait and returns the way to call it off.
	 */
	#registerDeferred(handler: () => void, schedule: (run: () => void) => () => void): void
	{
		const signal: AbortSignal = this.getAbortSignal();
		if (signal.aborted)
		{
			return;
		}

		let cancel: () => void = (): void => {};
		const cancelOnAbort = (): void => cancel();

		cancel = schedule((): void => {
			Event.unbind(signal, 'abort', cancelOnAbort);
			handler();
		});

		Event.bind(signal, 'abort', cancelOnAbort, { once: true });
	}

	// called by PluginCollection after afterInit; this cleanup undoes the earliest setup, so it
	// runs last -- after the subscriptions registered inside afterInit
	setAfterInitCleanup(cleanup: () => void): void
	{
		this.#afterInitCleanup = cleanup;
	}

	isDestroyed(): boolean
	{
		return this.#destroyed;
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#abortController.abort();
		this.#removeListeners();
		this.#removeListeners = null!;

		if (this.#afterInitCleanup !== null)
		{
			const cleanup = this.#afterInitCleanup;
			this.#afterInitCleanup = null;
			cleanup();
		}
	}
}
