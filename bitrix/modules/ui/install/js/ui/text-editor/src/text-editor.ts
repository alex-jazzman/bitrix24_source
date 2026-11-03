import { Tag, Dom, Type, Cache, Event, Browser, Text, Extension } from 'main.core';
import { SettingsCollection } from 'main.core.collections';
import { EventEmitter } from 'main.core.events';
import { DefaultBBCodeScheme, type BBCodeScheme, type DefaultBBCodeSchemeOptions } from 'ui.bbcode.model';
import {
	createEditor,
	$getRoot,
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	$getNearestNodeFromDOMNode,
	$setSelection,
	FOCUS_COMMAND,
	BLUR_COMMAND,
	KEY_ENTER_COMMAND,
	KEY_ESCAPE_COMMAND,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	COMMAND_PRIORITY_CRITICAL,
	CLEAR_HISTORY_COMMAND,
	type LexicalEditor,
	type NodeKey,
	type RootNode,
	type LexicalNode,
	type EditorThemeClasses,
	type EditorSetOptions,
	type EditorUpdateOptions,
	type EditorState,
	type SerializedEditorState,
	type Klass,
	type EditableListener,
	type CommandListener,
	type CommandListenerPriority,
	type CommandPayloadType,
	type LexicalCommand,
	type AnyLexicalCommand,
	type MutationListener,
	type Transform,
} from 'ui.lexical.core';
import { signal, type ReadonlySignal, type Signal } from 'ui.lexical.extension';
import { createDOMRange, createRectsFromDOMRange } from 'ui.lexical.selection';
import { $findMatchingParent, mergeRegister } from 'ui.lexical.utils';

import {
	$importFromBBCode,
	$exportToBBCode,
	type BBCodeImportMap,
	type BBCodeExportConversion,
	type BBCodeImportConversion,
	type BBCodeExportMap,
} from './bbcode';
import { HIDE_DIALOG_COMMAND } from './commands';
import { ComponentRegistry } from './component-registry';
import { NewLineMode } from './constants';
import { type DecoratorComponent } from './decorator-component';
import { getAriaMessage } from './helpers/aria-message';
import { createHashCode } from './helpers/create-hash-code';
import { $isRootEmpty } from './helpers/is-root-empty';
import { mergeOptions } from './helpers/merge-options';
import { AutoLinkPlugin } from './plugins/auto-link';
import { BasePlugin, type PluginConstructor, type TypedPluginConstructor } from './plugins/base-plugin';
import { BlockToolbarPlugin } from './plugins/block-toolbar';
import { BoldPlugin } from './plugins/bold';
import { ClearFormatPlugin } from './plugins/clear-format';
import { ClipboardPlugin } from './plugins/clipboard';
import { CodePlugin } from './plugins/code';
import { CopilotPlugin } from './plugins/copilot';
import { FilePlugin } from './plugins/file';
import { FloatingToolbarPlugin } from './plugins/floating-toolbar';
import { HashtagPlugin } from './plugins/hashtag';
import { HistoryPlugin } from './plugins/history';
import { ImagePlugin } from './plugins/image';
import { ItalicPlugin } from './plugins/italic';
import { LinkPlugin } from './plugins/link';
import { ListPlugin } from './plugins/list';
import { MentionPlugin } from './plugins/mention';
import { ParagraphPlugin } from './plugins/paragraph';
import { PlaceholderPlugin } from './plugins/placeholder';
import { PluginCollection } from './plugins/plugin-collection';
import { QuotePlugin } from './plugins/quote';
import { RichTextPlugin } from './plugins/rich-text';
import { SmileyPlugin } from './plugins/smiley';
import { SpoilerPlugin } from './plugins/spoiler';
import { StrikethroughPlugin } from './plugins/strikethrough';
import { TabIndentPlugin } from './plugins/tab-indent';
import { TablePlugin } from './plugins/table';
import { ToolbarPlugin } from './plugins/toolbar';
import { UnderlinePlugin } from './plugins/underline';
import { VideoPlugin } from './plugins/video';
import { SchemeValidation } from './scheme-validation';
import { defaultTheme } from './themes/default-theme';
import { SelectionState } from './toolbar/selection-state';
import { type ClearOptions } from './types/clear-options';
import { type DecoratorOptions } from './types/decorator-options';
import { type InitialEditorStateType } from './types/initial-editor-state-type';
import { type NewLineModeType } from './types/new-line-mode-type';
import { type SetTextOptions } from './types/set-text-options';
import { type TextEditorOptions } from './types/text-editor-options';

import './css/focus-ring.css';
import './css/layout.css';

const CollapsingState = {
	COLLAPSED: 'collapsed',
	COLLAPSING: 'collapsing',
	EXPANDED: 'expanded',
	EXPANDING: 'expanding',
};

type TextEditorNodeKlass = Klass<LexicalNode> & { useDecoratorComponent?: boolean };

/**
 * @memberof BX.UI.TextEditor
 */
export class TextEditor extends EventEmitter
{
	#lexicalEditor: LexicalEditor = null!;
	#editable: Signal<boolean> = null!;
	#appliedAriaLabel: string | null = null;
	#selectionState: SelectionState = null!;
	#componentRegistry: ComponentRegistry = new ComponentRegistry();
	#refs: InstanceType<typeof Cache.MemoryCache> = new Cache.MemoryCache();
	#options: SettingsCollection = null!;
	#plugins: PluginCollection = null!;
	#newLineMode: NewLineModeType = NewLineMode.MIXED;
	#bbcodeScheme: BBCodeScheme = null!;
	#schemeValidation: SchemeValidation = null!;
	#bbcodeImportMap: BBCodeImportMap;
	#bbcodeExportMap: BBCodeExportMap;
	#themeClasses: EditorThemeClasses = {};

	#decoratorNodes: Set<NodeKey> = new Set();
	#decoratorComponents: Map<string, DecoratorComponent> = new Map();
	#removeListeners: Function = null!;

	#highlightContainer = Tag.render`<div class="ui-text-editor-selection-highlighting"></div>`;
	#autoFocus: boolean = false;
	#minHeight: number | null = null;
	#maxHeight: number | null = null;

	#collapsingMode: boolean = false;
	#collapsingState: string = CollapsingState.EXPANDED;
	#collapsingTransitionEnd: (event: TransitionEvent) => void = this.#handleCollapsingTransition.bind(this);
	#paragraphHeight: number | null = null;

	#resizeObserver: ResizeObserver = null!;
	#destroying: boolean = false;
	#rendered: boolean = false;
	#prevEmptyStatus: boolean = true;

	constructor(editorOptions: TextEditorOptions)
	{
		super();
		this.setEventNamespace('BX.UI.TextEditor.Editor');

		const presetDefaults: TextEditorOptions = (this.constructor as typeof TextEditor).getDefaultOptions();
		const options: TextEditorOptions = Type.isPlainObject(editorOptions) ? editorOptions : {} as TextEditorOptions;
		const resolvedOptions: TextEditorOptions = mergeOptions(presetDefaults, options);

		const builtinPlugins = [...(this.constructor as typeof TextEditor).getBuiltinPlugins()];
		const plugins: Array<string | PluginConstructor> = resolvedOptions.plugins ?? builtinPlugins;
		const extraPlugins: Array<string | PluginConstructor> = resolvedOptions.extraPlugins ?? [];
		const pluginsToRemove: Array<string | PluginConstructor> = resolvedOptions.removePlugins ?? [];

		// the local theme extends EditorThemeClasses with object-valued entries (e.g. image)
		this.#themeClasses = defaultTheme as unknown as EditorThemeClasses;

		this.#plugins = new PluginCollection(
			builtinPlugins,
			[...plugins, ...extraPlugins],
			pluginsToRemove,
		);

		// plugin defaults are the bottom layer, so they are collected once the set of plugins is known
		this.#options = new SettingsCollection(
			mergeOptions(mergeOptions(this.#plugins.getDefaultOptions(), presetDefaults), options),
		);

		const newLineMode = this.#options.get('newLineMode');
		if ([NewLineMode.LINE_BREAK, NewLineMode.PARAGRAPH].includes(newLineMode))
		{
			this.#newLineMode = newLineMode;
		}

		const constructors = this.#plugins.getConstructors();
		const nodes = constructors.map((pluginConstructor: PluginConstructor) => {
			return pluginConstructor.getNodes(this);
		});

		const namespace: string = this.#options.get('namespace');

		this.#lexicalEditor = createEditor({
			// uses when you copy-paste from one to another editor
			namespace: Type.isStringFilled(namespace) ? namespace : this.#createNamespace(constructors),
			nodes: nodes.flat() as Array<Klass<LexicalNode>>,
			onError: (error: Error) => {
				console.error(error);
			},
			theme: this.#themeClasses,
			editable: this.#options.get('editable') !== false,
		});

		this.#editable = signal(this.#lexicalEditor.isEditable());

		this.setMinHeight(this.#options.get('minHeight'));
		this.setMaxHeight(this.#options.get('maxHeight'));
		this.setAutoFocus(this.#options.get('autoFocus'));
		this.setVisualOptions(this.#options.get('visualOptions'));

		this.#selectionState = new SelectionState(this);

		this.#removeListeners = mergeRegister(
			this.#registerCommands(),
			this.#registerStateListeners(),
			this.#initDecorateNodes(nodes.flat() as Array<TextEditorNodeKlass>),
		);

		this.#plugins.init(this);

		this.#bbcodeImportMap = this.#initBBCodeImportMap();
		this.#bbcodeExportMap = this.#initBBCodeExportMap();
		this.#bbcodeScheme = this.#initBBCodeScheme();
		this.#schemeValidation = new SchemeValidation(this);

		this.subscribeFromOptions(options.events ?? {});
	}

	static getBuiltinPlugins(): TypedPluginConstructor[]
	{
		return [
			RichTextPlugin,
			ParagraphPlugin,
			ClipboardPlugin,
			BoldPlugin,
			UnderlinePlugin,
			ItalicPlugin,
			StrikethroughPlugin,
			ClearFormatPlugin,
			TabIndentPlugin,
			CodePlugin,
			QuotePlugin,
			ListPlugin,
			MentionPlugin,
			LinkPlugin,
			AutoLinkPlugin,
			ImagePlugin,
			VideoPlugin,
			SmileyPlugin,
			SpoilerPlugin,
			TablePlugin,
			HashtagPlugin,
			CopilotPlugin,
			HistoryPlugin,
			BlockToolbarPlugin,
			FloatingToolbarPlugin,
			ToolbarPlugin,
			PlaceholderPlugin,
			FilePlugin,
		];
	}

	static getDefaultOptions(): TextEditorOptions
	{
		return {} as TextEditorOptions;
	}

	/**
	 * A value from the extension settings, or the fallback when the portal carries no such key.
	 *
	 * The reader has to say what it expects: SettingsCollection is an untyped bag, and the pair of
	 * signatures is what keeps the `null` out of the callers that already pass a fallback.
	 */
	static getGlobalOption<TValue>(path: string, defaultValue: TValue): TValue;
	static getGlobalOption<TValue = unknown>(path: string): TValue | null;
	static getGlobalOption<TValue>(path: string, defaultValue: TValue | null = null): TValue | null
	{
		const settings = Extension.getSettings('ui.text-editor');

		return settings.get(path, defaultValue) as TValue | null;
	}

	getComponentRegistry(): ComponentRegistry
	{
		return this.#componentRegistry;
	}

	getOptions(): SettingsCollection
	{
		return this.#options;
	}

	/** A value from this editor's options; see getGlobalOption() for why the reader names the type. */
	getOption<TValue>(path: string, defaultValue: TValue): TValue;
	getOption<TValue = unknown>(path: string): TValue | null;
	getOption<TValue>(path: string, defaultValue: TValue | null = null): TValue | null
	{
		return this.#options.get(path, defaultValue) as TValue | null;
	}

	getThemeClasses(): EditorThemeClasses
	{
		return this.#themeClasses;
	}

	getThemeClass(tagName: string): string
	{
		const className = this.#themeClasses[tagName];
		if (className !== undefined)
		{
			return className;
		}

		return '';
	}

	getNewLineMode(): NewLineModeType
	{
		return this.#newLineMode;
	}

	#initEditorState(initialEditorState?: InitialEditorStateType, options?: SetTextOptions): void
	{
		if (Type.isNil(initialEditorState))
		{
			this.#lexicalEditor.update(() => {
				const root = $getRoot();
				if (root.isEmpty())
				{
					const paragraph = $createParagraphNode();
					root.append(paragraph);
				}
			}, options as EditorUpdateOptions);
		}
		else if (Type.isPlainObject(initialEditorState) || Type.isStringFilled(initialEditorState))
		{
			const parsedEditorState: EditorState = this.#lexicalEditor.parseEditorState(
				initialEditorState as unknown as string | SerializedEditorState,
			);
			this.#lexicalEditor.setEditorState(parsedEditorState);
		}
		else if (Type.isFunction(initialEditorState))
		{
			this.#lexicalEditor.update(() => {
				const root = $getRoot();
				if (root.isEmpty())
				{
					initialEditorState(this.#lexicalEditor);
				}
			}, options as EditorUpdateOptions);
		}
	}

	#initDecorateNodes(editorNodes: TextEditorNodeKlass[]): () => void
	{
		const removeListeners = [];
		editorNodes.forEach((nodeClass) => {
			if (nodeClass.useDecoratorComponent)
			{
				const removeListener = this.registerMutationListener(nodeClass, (nodes, payload) => {
					for (const [key, val] of nodes)
					{
						if (val === 'destroyed')
						{
							const component: DecoratorComponent | undefined = this.#decoratorComponents.get(key);
							if (component)
							{
								component.destroy();
							}

							this.#decoratorComponents.delete(key);
							this.#decoratorNodes.delete(key);
						}
						else
						{
							this.#decoratorNodes.add(key);
						}
					}
				});

				removeListeners.push(removeListener);
			}
		});

		const removeListener = this.#lexicalEditor.registerDecoratorListener(
			(decorators: Record<NodeKey, DecoratorOptions>) => {
				this.#decoratorNodes.forEach((nodeKey) => {
					// one component must not take the pass down with it: the keys behind it would
					// never be mounted, and the collection below would never be emptied either,
					// so every later pass would start again from the same broken key
					try
					{
						this.#mountDecoratorComponent(nodeKey, decorators[nodeKey]);
					}
					catch (error)
					{
						console.error(`TextEditor: the decorator component of node "${nodeKey}" threw while mounting.`, error);
					}
				});

				this.#decoratorNodes.clear();
			},
		);

		removeListeners.push(removeListener);

		return mergeRegister(...removeListeners);
	}

	#mountDecoratorComponent(nodeKey: NodeKey, decorator: DecoratorOptions | undefined): void
	{
		// the collected key outlives its node whenever the node goes away before the pass that
		// would have mounted it, and then lexical has no entry left to build anything from
		if (decorator === undefined)
		{
			return;
		}

		const { componentClass: DecoratorClass, options: decoratorOptions } = decorator;

		const component: DecoratorComponent | undefined = this.#decoratorComponents.get(nodeKey);
		const htmlElement: HTMLElement | null = this.#lexicalEditor.getElementByKey(nodeKey);
		// an empty target is a legal state, so a live component is told from a stale one by
		// the element it was built for
		if (component && component.getTarget() === htmlElement)
		{
			component.update(decoratorOptions);

			return;
		}

		if (htmlElement === null)
		{
			return;
		}

		if (component)
		{
			component.destroy();
			this.#decoratorComponents.delete(nodeKey);
		}

		this.#decoratorComponents.set(
			nodeKey,
			new DecoratorClass({
				textEditor: this,
				target: htmlElement,
				nodeKey,
				options: decoratorOptions,
			}),
		);
	}

	#registerCommands(): () => void
	{
		return mergeRegister(
			this.registerCommand(
				FOCUS_COMMAND,
				(): boolean => {
					if (
						this.isCollapsingModeEnabled()
						&& this.#collapsingState === CollapsingState.COLLAPSED
						&& this.isEmpty(false)
					)
					{
						this.expand();

						return true;
					}

					this.emit('onFocus');

					return false;
				},
				COMMAND_PRIORITY_CRITICAL,
			),

			this.registerCommand(
				BLUR_COMMAND,
				(): boolean => {
					// A collapse or an expand blurs the editable itself, which is the editor moving
					// and not the user leaving, so it raises no onBlur. Suppressing the event is all
					// that is wanted here: returning true would stop the dispatch outright and take
					// every handler registered after this one down with it -- PlaceholderPlugin
					// registers in #plugins.init(), which runs later than #registerCommands().
					const isCollapsingAnimation = (
						this.isCollapsingModeEnabled()
						&& (this.#collapsingState === CollapsingState.COLLAPSING
							|| this.#collapsingState === CollapsingState.EXPANDING)
					);

					if (!isCollapsingAnimation)
					{
						this.emit('onBlur');
					}

					return false;
				},
				COMMAND_PRIORITY_CRITICAL,
			),

			this.registerCommand(
				KEY_ENTER_COMMAND,
				(event: KeyboardEvent | null) => {
					if (event === null)
					{
						return false;
					}

					const { ctrlKey, metaKey } = event;
					if ((Browser.isMac() && metaKey) || ctrlKey)
					{
						this.emit('onMetaEnter');

						return true;
					}

					return false;
				},
				COMMAND_PRIORITY_LOW,
			),

			// COMMAND_PRIORITY_EDITOR and nothing above it: while the mention dialog is open it
			// swallows Escape in its own handler at COMMAND_PRIORITY_LOW, and a subscriber must not
			// receive an event with which the user is merely closing the picker
			this.registerCommand(
				KEY_ESCAPE_COMMAND,
				(): boolean => {
					this.emit('onEscape');

					return false;
				},
				COMMAND_PRIORITY_EDITOR,
			),
		);
	}

	#registerStateListeners(): () => void
	{
		return mergeRegister(
			this.registerUpdateListener(({ dirtyElements, dirtyLeaves, prevEditorState, tags }) => {
				const isComposing = this.isComposing();
				const hasContentChanges = dirtyLeaves.size > 0 || dirtyElements.size > 0;
				if (isComposing || !hasContentChanges)
				{
					return;
				}

				const isInitialChange: boolean = prevEditorState.isEmpty();
				if (this.#options.get('collapsingMode') === true)
				{
					if (isInitialChange)
					{
						this.#initCollapsingMode();
					}
					else if (this.isCollapsed() && !this.isEmpty())
					{
						this.expand(false);
					}
				}

				if (!isInitialChange && tags.has('history-merge'))
				{
					return;
				}

				this.emit('onChange', { isInitialChange, tags });

				const isEmpty = this.isEmpty();
				if (this.#prevEmptyStatus !== isEmpty)
				{
					this.#prevEmptyStatus = isEmpty;
					this.emit('onEmptyContentToggle', { isEmpty, isInitialChange });
				}
			}),

			this.registerEditableListener((isEditable: boolean): void => {
				this.#editable.value = isEditable;

				// the DOM setter coerces the boolean to 'true' / 'false'
				this.getEditableContainer().contentEditable = isEditable as unknown as string;
				this.syncEditableSemantics(this.getEditableContainer(), isEditable);
				if (isEditable)
				{
					Dom.removeClass(this.getRootContainer(), '--read-only');
					Dom.addClass(this.getRootContainer(), '--editable');
				}
				else
				{
					Dom.removeClass(this.getRootContainer(), '--editable');
					Dom.addClass(this.getRootContainer(), '--read-only');
				}

				this.emit('onEditable', { isEditable });
			}),
		);
	}

	#createNamespace(plugins: PluginConstructor[]): string
	{
		const hashCode = createHashCode(
			plugins
				.map((node) => node.getName())
				.sort()
				.join('-'),
		);

		return String(hashCode);
	}

	getBBCodeScheme(): BBCodeScheme
	{
		return this.#bbcodeScheme;
	}

	getSchemeValidation(): SchemeValidation
	{
		return this.#schemeValidation;
	}

	#initBBCodeImportMap(): BBCodeImportMap
	{
		const importMap: BBCodeImportMap = new Map();
		for (const [, plugin] of this.#plugins)
		{
			const map: BBCodeImportConversion | null = plugin.importBBCode();
			if (map !== null)
			{
				Object.keys(map).forEach((key: string): void => {
					let currentValue = importMap.get(key);
					if (currentValue === undefined)
					{
						currentValue = [];
						importMap.set(key, currentValue);
					}

					currentValue.push(map[key]);
				});
			}
		}

		return importMap;
	}

	#initBBCodeExportMap(): BBCodeExportMap
	{
		const exportMap: BBCodeExportMap = new Map();
		for (const [, plugin] of this.#plugins)
		{
			const map: BBCodeExportConversion | null = plugin.exportBBCode();
			if (map !== null)
			{
				Object.keys(map).forEach((nodeType: string): void => {
					if (Type.isFunction(map[nodeType]))
					{
						exportMap.set(nodeType, map[nodeType]);
					}
				});
			}
		}

		return exportMap;
	}

	#initBBCodeScheme(): BBCodeScheme
	{
		const filePlugin: FilePlugin | null = this.getPlugin(FilePlugin);
		const fileTag = filePlugin?.isEnabled() ? filePlugin.getMode() : 'none';

		return new DefaultBBCodeScheme({ fileTag } as DefaultBBCodeSchemeOptions);
	}

	setText(text: string, options?: SetTextOptions): void
	{
		if (Type.isString(text))
		{
			const updateOptions: EditorUpdateOptions = {
				discrete: (Type.isPlainObject(options) && options.discrete === true) as true,
			};

			this.#lexicalEditor.update((): void => {
				const lexicalNodes: Array<LexicalNode> = $importFromBBCode(text, this);
				const root: RootNode = $getRoot();
				root.clear();
				root.append(...lexicalNodes);
				$setSelection(null);
			}, updateOptions);
		}
	}

	clear(focus: boolean = true, options: ClearOptions = {}): void
	{
		const updateOptions: EditorUpdateOptions = {
			discrete: (Type.isPlainObject(options) && options.discrete === true) as true,
		};

		this.#lexicalEditor.update((): void => {
			const root: RootNode = $getRoot();
			const paragraph = $createParagraphNode();
			root.clear();
			root.append(paragraph);

			$setSelection(null);

			if (focus)
			{
				paragraph.select();
			}
		}, updateOptions);
	}

	clearHistory(): void
	{
		this.dispatchCommand(CLEAR_HISTORY_COMMAND);
	}

	getText(): string
	{
		return this.#lexicalEditor.getEditorState().read(() => {
			const bbCodeAst = $exportToBBCode($getRoot(), this);

			return bbCodeAst.toString();
		});
	}

	isEmpty(trim: boolean = true): boolean
	{
		return this.#lexicalEditor.getEditorState().read(() => {
			return $isRootEmpty(trim);
		});
	}

	setAutoFocus(flag: boolean | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.#autoFocus = flag;
		}
	}

	hasAutoFocus(): boolean
	{
		return this.#autoFocus;
	}

	setMinHeight(minHeight: number | null | undefined): void
	{
		if ((Type.isNumber(minHeight) && minHeight > 0) || minHeight === null)
		{
			const changed = this.#minHeight !== minHeight;
			this.#minHeight = minHeight;

			if (changed)
			{
				Dom.style(
					this.getScrollerContainer(),
					'--ui-text-editor-min-height',
					(minHeight as number) > 0 ? `${minHeight}px` : null,
				);
			}
		}
	}

	getMinHeight(): number | null
	{
		return this.#minHeight;
	}

	setMaxHeight(maxHeight: number | null | undefined): void
	{
		if ((Type.isNumber(maxHeight) && maxHeight > 0) || maxHeight === null)
		{
			const changed = this.#maxHeight !== maxHeight;
			this.#maxHeight = maxHeight;

			if (changed)
			{
				Dom.style(
					this.getScrollerContainer(),
					'--ui-text-editor-max-height',
					(maxHeight as number) > 0 ? `${maxHeight}px` : null,
				);
			}
		}
	}

	getMaxHeight(): number | null
	{
		return this.#maxHeight;
	}

	setVisualOptions(options: TextEditorOptions['visualOptions']): void
	{
		if (!Type.isPlainObject(options))
		{
			return;
		}

		for (const [option, value] of Object.entries(options))
		{
			const name = Text.toKebabCase(option);

			Dom.style(this.getRootContainer(), `--ui-text-editor-${name}`, value as string);
		}
	}

	#initCollapsingMode()
	{
		this.#collapsingMode = true;
		if (this.isEmpty())
		{
			this.#collapse('hide', false, true);
		}
		else
		{
			this.expand(false);
		}
	}

	isCollapsingModeEnabled(): boolean
	{
		return this.#collapsingMode;
	}

	/**
	 * True from the first statement of destroy() onwards. Deferred work that would otherwise
	 * commit into the document needs it: during teardown there is no document left to commit to,
	 * and the same callback that is right when a view is merely replaced is pointless here.
	 */
	isDestroying(): boolean
	{
		return this.#destroying;
	}

	isCollapsed(): boolean
	{
		return this.#collapsingState === CollapsingState.COLLAPSED;
	}

	/**
	 * destroy() drops the prototype of the instance, so a frame that outlives it would fail on
	 * the very first method call in its body.
	 */
	#registerAnimationFrame(handler: () => void): void
	{
		requestAnimationFrame((): void => {
			if (this.#destroying)
			{
				return;
			}

			handler();
		});
	}

	#collapse(mode: 'show' | 'hide' | 'toggle' = 'hide', animate: boolean = true, initialState: boolean = false): void
	{
		if (!this.isCollapsingModeEnabled())
		{
			return;
		}

		const collapsed = (
			this.#collapsingState === CollapsingState.COLLAPSED
			|| this.#collapsingState === CollapsingState.COLLAPSING
		);

		const expanded = (
			this.#collapsingState === CollapsingState.EXPANDED
			|| this.#collapsingState === CollapsingState.EXPANDING
		);

		if ((mode === 'hide' && collapsed) || (mode === 'show' && expanded))
		{
			return;
		}

		if (animate === false)
		{
			if (collapsed)
			{
				this.#collapsingState = CollapsingState.EXPANDED;
				Dom.removeClass(this.getRootContainer(), '--collapsed');
				this.emit('onCollapsingToggle', { isOpen: true });
				this.focus();
			}
			else
			{
				this.#collapsingState = CollapsingState.COLLAPSED;
				Dom.addClass(this.getRootContainer(), '--collapsed');
				this.emit('onCollapsingToggle', { isOpen: false });
				this.clear(false);
				this.clearHistory();
				if (!initialState)
				{
					this.blur();
				}
			}

			return;
		}

		Event.unbind(this.getRootContainer(), 'transitionend', this.#collapsingTransitionEnd);

		if (collapsed)
		{
			this.#collapsingState = CollapsingState.EXPANDING;
			this.blur(); // to avoid a root container scrolling because of a browser focus

			const currentHeight = this.getRootContainer().offsetHeight;
			Dom.removeClass(this.getRootContainer(), ['--collapsed', '--collapsing']);
			Dom.style(this.getRootContainer(), { height: `${currentHeight}px`, overflow: 'hidden' });
			Dom.style(this.getInnerContainer(), { opacity: 0 });

			this.#registerAnimationFrame(() => {
				Dom.addClass(this.getRootContainer(), '--expanding');
				Dom.style(this.getRootContainer(), { height: `${this.getRootContainer().scrollHeight}px` });
				Dom.style(this.getInnerContainer(), { opacity: 1 });

				this.emit('onCollapsingToggle', { isOpen: true });
			});
		}
		else
		{
			this.#collapsingState = CollapsingState.COLLAPSING;

			const currentHeight = this.getRootContainer().offsetHeight;

			Dom.removeClass(this.getRootContainer(), ['--expanding']);
			Dom.style(this.getRootContainer(), { height: `${currentHeight}px`, overflow: 'hidden' });
			Dom.style(this.getInnerContainer(), { opacity: 1 });

			this.blur();

			const paragraphHeight = this.getParagraphHeight();

			this.#registerAnimationFrame(() => {
				Dom.addClass(this.getRootContainer(), '--collapsing');
				Dom.style(this.getRootContainer(), { height: `${paragraphHeight}px` });
				Dom.style(this.getInnerContainer(), { opacity: 0 });

				this.emit('onCollapsingToggle', { isOpen: false });
			});
		}

		Event.bind(this.getRootContainer(), 'transitionend', this.#collapsingTransitionEnd);
	}

	collapse(animate: boolean = true): void
	{
		this.#collapse('hide', animate);
	}

	expand(animate: boolean = true): void
	{
		this.#collapse('show', animate);
	}

	toggle(animate: boolean = true): void
	{
		this.#collapse('toggle', animate);
	}

	getParagraphHeight(): number
	{
		if (this.#paragraphHeight !== null)
		{
			return this.#paragraphHeight;
		}

		const className = this.getThemeClasses().paragraph || '';
		const paragraph = Tag.render`<p class="${className}"><br /></p>`;

		Dom.style(paragraph, {
			position: 'absolute',
			transform: 'translateY(-1000px)',
		});

		Dom.append(paragraph, this.getScrollerContainer());

		this.#paragraphHeight = (
			paragraph.offsetHeight
			+ Text.toNumber(Dom.style(paragraph, 'margin-top'))
			+ Text.toNumber(Dom.style(paragraph, 'margin-bottom'))
		);

		Dom.remove(paragraph);

		return this.#paragraphHeight;
	}

	#handleCollapsingTransition(event: TransitionEvent): void
	{
		// transitionend bubbles, and the inner container fades over the same duration as the root
		// grows -- ending the animation on its event would drop the height mid-flight
		if (event.target !== this.getRootContainer())
		{
			return;
		}

		Event.unbind(this.getRootContainer(), 'transitionend', this.#collapsingTransitionEnd);

		// Dom.style() resets a property when its value is null
		Dom.style(this.getRootContainer(), 'height', null);
		Dom.style(this.getRootContainer(), 'overflow', null);
		Dom.style(this.getInnerContainer(), 'opacity', null);
		Dom.removeClass(this.getRootContainer(), ['--expanding', '--collapsing']);

		if (this.#collapsingState === CollapsingState.COLLAPSING)
		{
			Dom.addClass(this.getRootContainer(), '--collapsed');
			this.#collapsingState = CollapsingState.COLLAPSED;
			this.clear(false);
			this.clearHistory();
			this.blur();
		}
		else
		{
			this.focus();
			this.#collapsingState = CollapsingState.EXPANDED;
		}
	}

	getLexicalEditor(): LexicalEditor
	{
		return this.#lexicalEditor;
	}

	setRootElement(contentEditableElement: null | HTMLElement)
	{
		if (Type.isElementNode(contentEditableElement) || contentEditableElement === null)
		{
			this.#lexicalEditor.setRootElement(contentEditableElement);
		}
	}

	getBBCodeExportMap(): BBCodeExportMap
	{
		return this.#bbcodeExportMap;
	}

	getBBCodeImportMap(): BBCodeImportMap
	{
		return this.#bbcodeImportMap;
	}

	getEditorState(): EditorState
	{
		return this.#lexicalEditor.getEditorState();
	}

	getPlugins(): PluginCollection
	{
		return this.#plugins;
	}

	getPlugin<T extends BasePlugin>(plugin: TypedPluginConstructor<T>): T | null;
	getPlugin<T extends BasePlugin = BasePlugin>(name: string): T | null;
	getPlugin(key: PluginConstructor | string): BasePlugin | null;
	getPlugin(key: PluginConstructor | TypedPluginConstructor | string): BasePlugin | null
	{
		return this.#plugins.get(key);
	}

	getElementByKey(key: NodeKey): HTMLElement | null
	{
		return this.#lexicalEditor.getElementByKey(key);
	}

	setEditorState(editorState: EditorState, options?: EditorSetOptions): void
	{
		this.#lexicalEditor.setEditorState(editorState, options);
	}

	setEditable(editable: boolean): void
	{
		if (Type.isBoolean(editable))
		{
			this.dispatchCommand(HIDE_DIALOG_COMMAND);
			if (!editable)
			{
				this.blur();
			}

			this.#lexicalEditor.setEditable(editable);
		}
	}

	isEditable(): boolean
	{
		return this.#editable.value;
	}

	/**
	 * The editable state as a signal, for consumers that need to react to it rather than poll.
	 * {@link isEditable} answers from the same signal, so there is one source of the truth.
	 *
	 * @internal Not covered by compatibility guarantees; external consumers should not rely on it.
	 */
	getEditableSignal(): ReadonlySignal<boolean>
	{
		return this.#editable;
	}

	/**
	 * @internal Not covered by compatibility guarantees; external consumers must not rely on it.
	 */
	getSelectionState(): SelectionState
	{
		return this.#selectionState;
	}

	registerUpdateListener(listener: Parameters<LexicalEditor['registerUpdateListener']>[0]): () => void
	{
		return this.#lexicalEditor.registerUpdateListener(listener);
	}

	registerEditableListener(listener: EditableListener): () => void
	{
		return this.#lexicalEditor.registerEditableListener(listener);
	}

	registerCommand<P>(
		command: LexicalCommand<P>,
		listener: CommandListener<P>,
		priority: CommandListenerPriority,
	): () => void
	{
		return this.#lexicalEditor.registerCommand(command, listener, priority);
	}

	dispatchCommand<TCommand extends AnyLexicalCommand>(
		type: TCommand,
		payload?: CommandPayloadType<TCommand>,
	): boolean
	{
		return this.#lexicalEditor.dispatchCommand(type, payload as CommandPayloadType<TCommand>);
	}

	registerMutationListener(
		klass: Klass<LexicalNode>,
		listener: MutationListener,
		options: { skipInitialization?: boolean } = {},
	): () => void
	{
		// upstream turned the initial pass on by default in 0.21; the facade keeps it off, and it
		// has to stay off for an options object that omits the field
		return this.#lexicalEditor.registerMutationListener(klass, listener, {
			...options,
			skipInitialization: options.skipInitialization ?? true,
		});
	}

	registerNodeTransform<T extends LexicalNode>(klass: Klass<T>, listener: Transform<T>): () => void
	{
		return this.#lexicalEditor.registerNodeTransform(klass, listener);
	}

	registerTextContentListener(listener: (text: string) => void): () => void
	{
		return this.#lexicalEditor.registerTextContentListener(listener);
	}

	registerDecoratorListener<T>(listener: (decorators: Record<NodeKey, T>) => void): () => void
	{
		return this.#lexicalEditor.registerDecoratorListener(listener);
	}

	registerRootListener(
		listener: (rootElement: null | HTMLElement, prevRootElement: null | HTMLElement) => void,
	): () => void
	{
		return this.#lexicalEditor.registerRootListener(listener);
	}

	registerEventListener(
		nodeType: Klass<LexicalNode>,
		eventType: string,
		eventListener: (event: globalThis.Event, nodeKey: NodeKey) => void,
	): () => void
	{
		const isCaptured = ['mouseenter', 'mouseleave'].includes(eventType);
		const handleEvent = (event: globalThis.Event) => {
			this.update(() => {
				const nearestNode = $getNearestNodeFromDOMNode(event.target as Node);
				if (nearestNode !== null)
				{
					const targetNode = isCaptured
						? (nearestNode instanceof nodeType
							? nearestNode
							: null)
						: $findMatchingParent(nearestNode, (node) => node instanceof nodeType);

					if (targetNode !== null)
					{
						eventListener(event, targetNode.getKey());
					}
				}
			});
		};

		return this.registerRootListener((rootElement, prevRootElement): void => {
			if (rootElement)
			{
				Event.bind(rootElement, eventType, handleEvent, isCaptured);
			}

			if (prevRootElement)
			{
				Event.unbind(prevRootElement, eventType, handleEvent, isCaptured);
			}
		});
	}

	update(updateFn: () => void, options?: EditorUpdateOptions): void
	{
		this.#lexicalEditor.update(updateFn, options);
	}

	focus(callbackFn?: (() => void) | null, options?: { defaultSelection?: 'rootStart' | 'rootEnd' }): void
	{
		if (!document.hasFocus())
		{
			window.focus();
		}

		this.#lexicalEditor.focus(
			(Type.isFunction(callbackFn) ? callbackFn : null) as () => void,
			Type.isPlainObject(options) ? options : { defaultSelection: 'rootStart' },
		);
	}

	hasFocus(): boolean
	{
		const rootElement = this.getRootElement();

		return rootElement !== null && rootElement.contains(document.activeElement);
	}

	blur(): void
	{
		this.#lexicalEditor.blur();
	}

	isComposing(): boolean
	{
		return this.#lexicalEditor.isComposing();
	}

	getRootElement(): null | HTMLElement
	{
		return this.#lexicalEditor.getRootElement();
	}

	hasNodes(nodes: Array<Klass<LexicalNode>>): boolean
	{
		return this.#lexicalEditor.hasNodes(nodes);
	}

	getRootContainer(): HTMLElement
	{
		return this.#refs.remember('root', () => {
			const classes = [this.isEditable() ? '--editable' : '--read-only'];

			return Tag.render`
				<div class="ui-text-editor ${classes.join(' ')}">
					${this.getInnerContainer()}
				</div>
			`;
		});
	}

	getInnerContainer(): HTMLElement
	{
		return this.#refs.remember('inner', () => {
			return Tag.render`
				<div class="ui-text-editor-inner">
					${this.getHeaderContainer()}
					${this.getToolbarContainer()}
					${this.getScrollerContainer()}
					${this.getFooterContainer()}
				</div>
			`;
		});
	}

	getToolbarContainer(): HTMLElement
	{
		return this.#refs.remember('toolbar', () => {
			return Tag.render`
				<div class="ui-text-editor-toolbar" tabindex="-1"></div>
			`;
		});
	}

	getScrollerContainer(): HTMLElement
	{
		return this.#refs.remember('scroller', () => {
			return Tag.render`
				<div class="ui-text-editor-scroller">
					${this.getEditableContainer()}
				</div>
			`;
		});
	}

	getEditableContainer(): HTMLElement
	{
		return this.#refs.remember('editable', () => {
			const container: HTMLElement = Tag.render`
				<div
					class="ui-text-editor-editable"
					contenteditable="${this.isEditable() ? 'true' : 'false'}"
					spellcheck="true"
				></div>
			`;

			this.syncEditableSemantics(container, this.isEditable());

			return container;
		});
	}

	/**
	 * The accessible name of the editor: the explicit option, then a generic phrase. The
	 * placeholder is not a name -- PlaceholderPlugin puts it on the very same element as
	 * aria-placeholder, so borrowing it here makes a screen reader read the hint twice.
	 */
	getAriaLabel(): string | null
	{
		const ariaLabel = this.getOption('ariaLabel');
		if (Type.isStringFilled(ariaLabel))
		{
			return ariaLabel;
		}

		return getAriaMessage('TEXT_EDITOR_LABEL_ARIA');
	}

	/**
	 * role="textbox" only lives in editable mode. A read-only editor is no longer an input but
	 * plain content, and the role would hide the structure of its tables, lists and quotes from a
	 * screen reader. The name follows the role, because ARIA forbids naming a roleless element.
	 *
	 * The name is moved only while it is still the one this editor put there. A host may name the
	 * editable itself -- ui.userfield.rich-text and bizprocdesigner both do -- and that name has
	 * to survive an editable toggle, which is exactly what an unconditional write would destroy.
	 */
	syncEditableSemantics(container: HTMLElement, isEditable: boolean): void
	{
		Dom.attr(container, {
			role: isEditable ? 'textbox' : null,
			'aria-multiline': isEditable ? 'true' : null,
		});

		const currentName: string | null = container.getAttribute('aria-label');
		if (currentName !== null && currentName !== this.#appliedAriaLabel)
		{
			return;
		}

		this.#appliedAriaLabel = isEditable ? this.getAriaLabel() : null;
		Dom.attr(container, 'aria-label', this.#appliedAriaLabel);
	}

	getFooterContainer(): HTMLElement
	{
		return this.#refs.remember('footer', () => {
			return Tag.render`
				<div class="ui-text-editor-slot ui-text-editor-footer" tabindex="-1"></div>
			`;
		});
	}

	getHeaderContainer(): HTMLElement
	{
		return this.#refs.remember('header', () => {
			return Tag.render`
				<div class="ui-text-editor-slot ui-text-editor-header" tabindex="-1"></div>
			`;
		});
	}

	renderTo(container: HTMLElement, replaceNode: boolean = false): void
	{
		if (!Type.isElementNode(container))
		{
			return;
		}

		if (!this.isRendered())
		{
			if (Type.isStringFilled(this.#options.get('content')))
			{
				this.setText(this.#options.get('content'));
			}
			else
			{
				this.#initEditorState(this.#options.get('editorState'));
			}
		}

		if (replaceNode)
		{
			Dom.replace(container, this.getRootContainer());
		}
		else
		{
			Dom.append(this.getRootContainer(), container);
		}

		this.#lexicalEditor.setRootElement(this.getEditableContainer());

		if (this.hasAutoFocus())
		{
			this.focus(null, { defaultSelection: 'rootStart' });
		}

		if (!this.#rendered)
		{
			this.#resizeObserver = new ResizeObserver(() => {
				this.emit('onResize');
				this.dispatchCommand(HIDE_DIALOG_COMMAND, { context: 'resize' });
			});

			this.#resizeObserver.observe(this.getScrollerContainer());
		}

		this.#rendered = true;
	}

	isRendered(): boolean
	{
		return this.#rendered;
	}

	highlightSelection(): void
	{
		this.getEditorState().read(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection) || selection.isCollapsed())
			{
				return;
			}

			const anchor = selection.anchor;
			const focus = selection.focus;
			const range = createDOMRange(this.#lexicalEditor, anchor.getNode(), anchor.offset, focus.getNode(), focus.offset);

			if (range !== null)
			{
				const scrollerContainer = this.getScrollerContainer();
				const scrollerRect = scrollerContainer.getBoundingClientRect();
				const selectionRects = createRectsFromDOMRange(this.#lexicalEditor, range);
				const selectionRectsLength = selectionRects.length;

				this.#highlightContainer.innerHTML = '';

				for (let i = 0; i < selectionRectsLength; i++)
				{
					const selectionRect = selectionRects[i];
					const elem = Tag.render`<span class="ui-text-editor-selection-part"></span>`;
					const top = selectionRect.top - scrollerRect.top + scrollerContainer.scrollTop;
					const left = selectionRect.left - scrollerRect.left + scrollerContainer.scrollLeft;

					Dom.style(elem, {
						top: `${top}px`,
						left: `${left}px`,
						height: `${selectionRect.height}px`,
						width: `${selectionRect.width}px`,
					});

					Dom.append(elem, this.#highlightContainer);
				}

				Dom.append(this.#highlightContainer, this.getScrollerContainer());
			}
		});
	}

	resetHighlightSelection(): void
	{
		Dom.remove(this.#highlightContainer);
	}

	destroy(): void
	{
		if (this.#destroying)
		{
			return;
		}

		this.#destroying = true;
		this.emit('onDestroy');

		this.#plugins.destroy();

		// one component must not take the rest of the teardown with it: the re-entry guard above
		// has already closed the door on a second attempt
		for (const [nodeKey, component] of this.#decoratorComponents)
		{
			try
			{
				component.destroy();
			}
			catch (error)
			{
				console.error(
					`TextEditor: the decorator component of node "${nodeKey}" threw while being destroyed.`,
					error,
				);
			}
		}

		this.#decoratorComponents.clear();

		this.#removeListeners();
		this.#selectionState.destroy();

		if (this.isRendered())
		{
			this.#resizeObserver.disconnect();
			this.setRootElement(null);
			Dom.remove(this.getRootContainer());
		}

		this.#resizeObserver = null!;
		this.#plugins = null!;
		this.#lexicalEditor = null!;
		this.#refs = null!;
		this.#schemeValidation = null!;
		this.#bbcodeImportMap = null!;
		this.#bbcodeExportMap = null!;
		this.#decoratorNodes = null!;
		this.#decoratorComponents = null!;

		Object.setPrototypeOf(this, null);
	}
}
