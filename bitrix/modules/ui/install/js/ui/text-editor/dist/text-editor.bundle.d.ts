/* eslint-disable */
type TextEditorOptions = {
	content?: string;
	editorState?: InitialEditorStateType;
	plugins?: Array<string | PluginConstructor>;
	extraPlugins?: Array<string | PluginConstructor>;
	removePlugins?: Array<string | PluginConstructor>;
	toolbar?: string[];
	hideToolbar?: boolean;
	floatingToolbar?: string[];
	newLineMode?: NewLineModeType;
	autoFocus?: boolean;
	minHeight?: number;
	maxHeight?: number;
	editable?: number;
	collapsingMode?: boolean;
	placeholder?: string;
	paragraphPlaceholder?: string | 'auto';
	/** The accessible name of the editing area. Falls back to a generic phrase. */
	ariaLabel?: string;
	visualOptions?: {
		borderRadius?: string;
		borderWidth?: string;
		borderStyle?: string;
		borderColorBase?: string;
		borderColorFocus?: string;
		colorBackground?: string;
		colorSelection?: string;
		colorToolbarBackground?: string;
		colorToolbarBorder?: string;
		blockSpaceInline?: string;
		blockSpaceStack?: string;
	};
	namespace?: string;
	events?: Record<string, (event: BX.Event.BaseEvent) => void>;
	mention?: {
		dialogOptions?: BX.UI.EntitySelector.DialogOptions;
		entities?: string[];
	};
	copilot?: {
		copilotOptions?: BX.AI.CopilotOptions;
		triggerBySpace?: boolean;
	};
	file?: {
		mode?: 'disk' | 'file';
		files?: BX.UI.Uploader.UploaderFileInfo[];
	};
	list?: {
		maxIndent?: number;
	};
};

type InitialEditorStateType = undefined | null | string | BX.UI.Lexical.Core.EditorState | ((editor: BX.UI.Lexical.Core.LexicalEditor) => void);

type PluginConstructor = TypedPluginConstructor;

type TypedPluginConstructor<T extends BX.UI.TextEditor.BasePlugin = BX.UI.TextEditor.BasePlugin> = (new (textEditor: BX.UI.TextEditor.TextEditor) => T) & PluginStaticMembers;

type BBCodeImportConversion = Record<BBCodeTag, (node: BX.UI.BBCode.BBCodeNode) => BBCodeConversion | null>;

type BBCodeTag = string;

type BBCodeConversion = {
	conversion: BBCodeConversionFn;
	priority: number;
};

type BBCodeConversionFn = (node: BX.UI.BBCode.BBCodeNode) => BBCodeConversionOutput | null;

type BBCodeConversionOutput = {
	after?: (childLexicalNodes: Array<BX.UI.Lexical.Core.LexicalNode>) => Array<BX.UI.Lexical.Core.LexicalNode>;
	forChild?: BBCodeChildConversion;
	node: null | BX.UI.Lexical.Core.LexicalNode | Array<BX.UI.Lexical.Core.LexicalNode>;
};

type BBCodeChildConversion = (lexicalNode: BX.UI.Lexical.Core.LexicalNode, parentLexicalNode: BX.UI.Lexical.Core.LexicalNode | null | undefined) => BX.UI.Lexical.Core.LexicalNode | null | undefined;

type BBCodeExportConversion = Record<BBCodeExportType, BBCodeExportFn>;

type BBCodeExportType = BBCodeExportNodeType | BBCodeExportFormat;

type BBCodeExportNodeType = string;

type BBCodeExportFormat = 'text:bold' | 'text:italic' | 'text:strikethrough' | 'text:underline';

type BBCodeExportFn = BBCodeExportNodeFn | BBCodeExportFormatFn;

type BBCodeExportNodeFn = (lexicalNode: BX.UI.Lexical.Core.LexicalNode) => BBCodeExportOutput | null;

type BBCodeExportOutput = {
	after?: (generatedNode: BX.UI.BBCode.BBCodeNode | null | undefined) => BX.UI.BBCode.BBCodeNode | null | undefined;
	node?: BX.UI.BBCode.BBCodeNode | null;
};

type BBCodeExportFormatFn = (lexicalNode: BX.UI.Lexical.Core.TextNode, node: BX.UI.BBCode.BBCodeNode) => BX.UI.BBCode.BBCodeNode | null;

type SchemeValidationOptions = {
	nodes?: SchemeNodeValidation[];
	bbcodeMap?: Record<string, string>;
};

type SchemeNodeValidation = {
	nodeClass: BX.UI.Lexical.Core.Klass<BX.UI.Lexical.Core.LexicalNode>;
	validate?: (node: BX.UI.Lexical.Core.LexicalNode, schemeValidation: BX.UI.TextEditor.SchemeValidation) => boolean;
};

interface PluginStaticMembers {
	getName(): string;
	getNodes(editor: BX.UI.TextEditor.TextEditor): Array<BX.UI.Lexical.Core.LexicalNodeConfig>;
	getDependencies?(): TypedPluginConstructor[];
	getPeerDependencies?(): string[];
	getDefaultOptions?(): TextEditorOptions;
}

type NewLineModeType = 'line-break' | 'paragraph' | 'mixed';

type ComponentFactory = () => BX.UI.TextEditor.ToolbarItem;

type SetTextOptions = {
	discrete?: boolean;
};

type ClearOptions = {
	discrete?: boolean;
};

type BBCodeExportMap = Map<BBCodeExportType, BBCodeExportFn>;

type BBCodeImportMap = Map<BBCodeTag, Array<(node: BX.UI.BBCode.BBCodeNode) => BBCodeConversion | null>>;

type DecoratorComponentOptions = {
	textEditor: BX.UI.TextEditor.TextEditor;
	nodeKey: string;
	target: HTMLElement;
	options: BX.JsonObject;
};

type DecoratorOptions = {
	componentClass: new (componentOptions: DecoratorComponentOptions) => BX.UI.TextEditor.DecoratorComponent;
	options: BX.JsonObject;
};

type ToolbarOptions = Array<ToolbarItem>;

type ToolbarItem = string;

declare namespace BX.UI.TextEditor {
	/**
	 * @memberof BX.UI.TextEditor
	 */
	class TextEditor extends BX.Event.EventEmitter {
		constructor(editorOptions: TextEditorOptions);
		static getBuiltinPlugins(): TypedPluginConstructor[];
		static getDefaultOptions(): TextEditorOptions;
		/**
		 * A value from the extension settings, or the fallback when the portal carries no such key.
		 *
		 * The reader has to say what it expects: SettingsCollection is an untyped bag, and the pair of
		 * signatures is what keeps the `null` out of the callers that already pass a fallback.
		 */
		static getGlobalOption<TValue>(path: string, defaultValue: TValue): TValue;
		static getGlobalOption<TValue = unknown>(path: string): TValue | null;
		getComponentRegistry(): ComponentRegistry;
		getOptions(): BX.Collections.SettingsCollection;
		/** A value from this editor's options; see getGlobalOption() for why the reader names the type. */
		getOption<TValue>(path: string, defaultValue: TValue): TValue;
		getOption<TValue = unknown>(path: string): TValue | null;
		getThemeClasses(): BX.UI.Lexical.Core.EditorThemeClasses;
		getThemeClass(tagName: string): string;
		getNewLineMode(): NewLineModeType;
		getBBCodeScheme(): BX.UI.BBCode.BBCodeScheme;
		getSchemeValidation(): SchemeValidation;
		setText(text: string, options?: SetTextOptions): void;
		clear(focus?: boolean, options?: ClearOptions): void;
		clearHistory(): void;
		getText(): string;
		isEmpty(trim?: boolean): boolean;
		setAutoFocus(flag: boolean | undefined): void;
		hasAutoFocus(): boolean;
		setMinHeight(minHeight: number | null | undefined): void;
		getMinHeight(): number | null;
		setMaxHeight(maxHeight: number | null | undefined): void;
		getMaxHeight(): number | null;
		setVisualOptions(options: TextEditorOptions['visualOptions']): void;
		isCollapsingModeEnabled(): boolean;
		/**
		 * True from the first statement of destroy() onwards. Deferred work that would otherwise
		 * commit into the document needs it: during teardown there is no document left to commit to,
		 * and the same callback that is right when a view is merely replaced is pointless here.
		 */
		isDestroying(): boolean;
		isCollapsed(): boolean;
		collapse(animate?: boolean): void;
		expand(animate?: boolean): void;
		toggle(animate?: boolean): void;
		getParagraphHeight(): number;
		getLexicalEditor(): BX.UI.Lexical.Core.LexicalEditor;
		setRootElement(contentEditableElement: null | HTMLElement): void;
		getBBCodeExportMap(): BBCodeExportMap;
		getBBCodeImportMap(): BBCodeImportMap;
		getEditorState(): BX.UI.Lexical.Core.EditorState;
		getPlugins(): PluginCollection;
		getPlugin<T extends BasePlugin>(plugin: TypedPluginConstructor<T>): T | null;
		getPlugin<T extends BasePlugin = BasePlugin>(name: string): T | null;
		getPlugin(key: PluginConstructor | string): BasePlugin | null;
		getElementByKey(key: BX.UI.Lexical.Core.NodeKey): HTMLElement | null;
		setEditorState(editorState: BX.UI.Lexical.Core.EditorState, options?: BX.UI.Lexical.Core.EditorSetOptions): void;
		setEditable(editable: boolean): void;
		isEditable(): boolean;
		/**
		 * The editable state as a signal, for consumers that need to react to it rather than poll.
		 * {@link isEditable} answers from the same signal, so there is one source of the truth.
		 *
		 * @internal Not covered by compatibility guarantees; external consumers should not rely on it.
		 */
		getEditableSignal(): BX.UI.Lexical.Extension.ReadonlySignal<boolean>;
		/**
		 * @internal Not covered by compatibility guarantees; external consumers must not rely on it.
		 */
		getSelectionState(): SelectionState;
		registerUpdateListener(listener: Parameters<BX.UI.Lexical.Core.LexicalEditor['registerUpdateListener']>[0]): () => void;
		registerEditableListener(listener: BX.UI.Lexical.Core.EditableListener): () => void;
		registerCommand<P>(command: BX.UI.Lexical.Core.LexicalCommand<P>, listener: BX.UI.Lexical.Core.CommandListener<P>, priority: BX.UI.Lexical.Core.CommandListenerPriority): () => void;
		dispatchCommand<TCommand extends BX.UI.Lexical.Core.AnyLexicalCommand>(type: TCommand, payload?: BX.UI.Lexical.Core.CommandPayloadType<TCommand>): boolean;
		registerMutationListener(klass: BX.UI.Lexical.Core.Klass<BX.UI.Lexical.Core.LexicalNode>, listener: BX.UI.Lexical.Core.MutationListener, options?: {
			skipInitialization?: boolean;
		}): () => void;
		registerNodeTransform<T extends BX.UI.Lexical.Core.LexicalNode>(klass: BX.UI.Lexical.Core.Klass<T>, listener: BX.UI.Lexical.Core.Transform<T>): () => void;
		registerTextContentListener(listener: (text: string) => void): () => void;
		registerDecoratorListener<T>(listener: (decorators: Record<BX.UI.Lexical.Core.NodeKey, T>) => void): () => void;
		registerRootListener(listener: (rootElement: null | HTMLElement, prevRootElement: null | HTMLElement) => void): () => void;
		registerEventListener(nodeType: BX.UI.Lexical.Core.Klass<BX.UI.Lexical.Core.LexicalNode>, eventType: string, eventListener: (event: globalThis.Event, nodeKey: BX.UI.Lexical.Core.NodeKey) => void): () => void;
		update(updateFn: () => void, options?: BX.UI.Lexical.Core.EditorUpdateOptions): void;
		focus(callbackFn?: (() => void) | null, options?: {
			defaultSelection?: 'rootStart' | 'rootEnd';
		}): void;
		hasFocus(): boolean;
		blur(): void;
		isComposing(): boolean;
		getRootElement(): null | HTMLElement;
		hasNodes(nodes: Array<BX.UI.Lexical.Core.Klass<BX.UI.Lexical.Core.LexicalNode>>): boolean;
		getRootContainer(): HTMLElement;
		getInnerContainer(): HTMLElement;
		getToolbarContainer(): HTMLElement;
		getScrollerContainer(): HTMLElement;
		getEditableContainer(): HTMLElement;
		/**
		 * The accessible name of the editor: the explicit option, then a generic phrase. The
		 * placeholder is not a name -- PlaceholderPlugin puts it on the very same element as
		 * aria-placeholder, so borrowing it here makes a screen reader read the hint twice.
		 */
		getAriaLabel(): string | null;
		/**
		 * role="textbox" only lives in editable mode. A read-only editor is no longer an input but
		 * plain content, and the role would hide the structure of its tables, lists and quotes from a
		 * screen reader. The name follows the role, because ARIA forbids naming a roleless element.
		 *
		 * The name is moved only while it is still the one this editor put there. A host may name the
		 * editable itself -- ui.userfield.rich-text and bizprocdesigner both do -- and that name has
		 * to survive an editable toggle, which is exactly what an unconditional write would destroy.
		 */
		syncEditableSemantics(container: HTMLElement, isEditable: boolean): void;
		getFooterContainer(): HTMLElement;
		getHeaderContainer(): HTMLElement;
		renderTo(container: HTMLElement, replaceNode?: boolean): void;
		isRendered(): boolean;
		highlightSelection(): void;
		resetHighlightSelection(): void;
		destroy(): void;
	}

	/**
	 * @memberof BX.UI.TextEditor
	 */
	class BasePlugin {
		constructor(textEditor: TextEditor);
		static getName(): string;
		static getNodes(editor: TextEditor): Array<BX.UI.Lexical.Core.LexicalNodeConfig>;
		static getDependencies(): TypedPluginConstructor[];
		static getPeerDependencies(): string[];
		static getDefaultOptions(): TextEditorOptions;
		importBBCode(): BBCodeImportConversion | null;
		exportBBCode(): BBCodeExportConversion | null;
		validateScheme(): SchemeValidationOptions | null;
		afterInit(): void | (() => void);
		getName(): string;
		getEditor(): TextEditor;
		getLexicalEditor(): BX.UI.Lexical.Core.LexicalEditor;
		/**
		 * Registers teardown work to run when the plugin is destroyed.
		 *
		 * After destroy() there is nothing left to register into: the composite has already run and is
		 * gone, and it never runs a second time. A caller reaching here that late is tearing something
		 * down from inside its own teardown -- so the work is run at once rather than merged into a
		 * list nothing will ever walk, which is how such cleanups used to leak without a trace.
		 */
		cleanUpRegister(...func: Array<Function>): void;
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
		getAbortSignal(): AbortSignal;
		registerTimeout(handler: () => void, timeout: number): void;
		registerAnimationFrame(handler: () => void): void;
		setAfterInitCleanup(cleanup: () => void): void;
		isDestroyed(): boolean;
		destroy(): void;
	}

	class SchemeValidation {
		constructor(editor: TextEditor);
		isNodeAllowed(parent: BX.UI.Lexical.Core.LexicalNode | string, child: BX.UI.Lexical.Core.LexicalNode | string): boolean;
		findAllowedParent(node: BX.UI.Lexical.Core.LexicalNode): BX.UI.Lexical.Core.ElementNode | null;
		moveToNextParent(node: BX.UI.Lexical.Core.LexicalNode | BX.UI.Lexical.Core.ElementNode, removeOnFail?: boolean): boolean;
	}

	class ComponentRegistry {
		register(name: string, factory: ComponentFactory): void;
		create(name: string): ToolbarItem | null;
	}

	class ToolbarItem extends BX.Event.EventEmitter {
		constructor();
		getContainer(): HTMLElement;
		render(): HTMLElement;
		/**
		 * Releases whatever the item holds beyond its DOM. A plain item holds nothing, but one that
		 * subscribes to a signal outlives its toolbar through the signal's subscriber list unless the
		 * subscription is disposed here.
		 */
		destroy(): void;
	}

	class PluginCollection {
		constructor(builtinPlugins?: PluginConstructor[], plugins?: Array<string | PluginConstructor>, pluginsToRemove?: Array<string | PluginConstructor>);
		init(textEditor: TextEditor): void;
		getConstructors(): PluginConstructor[];
		getDefaultOptions(): TextEditorOptions;
		getPlugins(): Map<string, BasePlugin>;
		/**
		 * Reverse order of initialisation: a plugin that starts after the one it depends on has to
		 * stop before it, while that dependency is still whole.
		 *
		 * Teardown is total even when one plugin throws. Letting the throw out used to end the loop:
		 * every remaining plugin kept its commands, listeners and observers, and TextEditor.destroy()
		 * never reached its own cleanup either -- while its re-entry guard was already set, so a second
		 * destroy() call returned at once and the editor could never be cleaned up at all.
		 */
		destroy(): void;
		[Symbol.iterator](): IterableIterator<[string, BasePlugin]>;
		get<T extends BasePlugin>(key: TypedPluginConstructor<T>): T | null;
		get<T extends BasePlugin = BasePlugin>(key: string): T | null;
		get(key: PluginConstructor | string): BasePlugin | null;
		has(key: PluginConstructor | string): boolean;
	}

	/**
	 * Derives the toolbar-facing state of the current selection once per revision, so that every
	 * toolbar of the editor reads one computation instead of deriving its own.
	 *
	 * @internal reached through TextEditor.getSelectionState(); not part of the public editor API.
	 */
	class SelectionState {
		constructor(editor: TextEditor);
		getRevisionSignal(): BX.UI.Lexical.Extension.ReadonlySignal<number>;
		/**
		 * Invalidates the snapshot without any editor change. The one thing the class cannot observe
		 * is an opaque disable callback whose answer depends on the world outside the document — a
		 * finished upload, an ajax reply — so its owner has to say when the answer may have changed.
		 */
		invalidate(): void;
		/**
		 * Requesting a format that was never asked for before writes to the revision signal, so this
		 * must not be called from inside a `computed` or an `effect` — ask for the signal first and
		 * read it there.
		 */
		formatActive(format: string): BX.UI.Lexical.Extension.ReadonlySignal<boolean>;
		blockTypeActive(type: string): BX.UI.Lexical.Extension.ReadonlySignal<boolean>;
		disabled(insideUnformattedMatters: boolean): BX.UI.Lexical.Extension.ReadonlySignal<boolean>;
		destroy(): void;
	}

	/**
	 * @memberof BX.UI.TextEditor
	 */
	class BasicEditor extends TextEditor {
		static getDefaultOptions(): TextEditorOptions;
	}

	/**
	 * @memberof BX.UI.TextEditor
	 */
	class RichText extends TextEditor {
		static getDefaultOptions(): TextEditorOptions;
	}

	const TextEditorComponent: BX.Vue3.BitrixVueComponentProps;

	const BasicEditorComponent: BX.Vue3.ComponentOptions;

	/**
	 * @memberof BX.UI.TextEditor
	 */
	class Button extends ToolbarItem {
		setContent(content: string | HTMLElement): void;
		setIcon(icon: string): void;
		setFormat(format: string): void;
		getFormat(): string | null;
		setBlockType(type: string): void;
		getBlockType(): string | null;
		/**
		 * The tooltip doubles as the accessible name: the button holds a single icon and has no other
		 * source of a name. Both attributes are written with setAttribute, so the value must not be
		 * HTML-encoded — a screen reader would otherwise read out "&amp;" instead of "&".
		 */
		setTooltip(tooltip: string | null): void;
		/**
		 * The kind of surface the button opens: 'dialog', 'menu', 'listbox' and so on. No aria-expanded
		 * goes with it — an open dialog is not an expanded state of the button itself.
		 */
		setHasPopup(type: string | null): void;
		setExpanded(expanded: boolean): void;
		disableInsideUnformatted(): void;
		enableInsideUnformatted(): void;
		shouldDisableInsideUnformatted(): boolean;
		setActive(active?: boolean): void;
		isActive(): boolean;
		setDisabled(disabled?: boolean): void;
		disable(): void;
		enable(): void;
		isDisabled(): boolean;
		hasOwnDisableCallback(): boolean;
		setDisableCallback(fn: Function): void;
		invokeDisableCallback(): boolean;
		/**
		 * Hands the disabled state over to a signal. From now on the button reports itself as reactive
		 * and the toolbar binds no source of its own over it: two writers on one attribute would fight
		 * each other.
		 */
		bindDisabled(source: BX.UI.Lexical.Extension.ReadonlySignal<boolean>): void;
		hasReactiveDisabled(): boolean;
		getDisabledSignal(): BX.UI.Lexical.Extension.ReadonlySignal<boolean> | null;
		/**
		 * Binds the pressed state to a signal. The caller is responsible for folding the disabled
		 * state in: a disabled button never reads as active.
		 */
		bindActive(source: BX.UI.Lexical.Extension.ReadonlySignal<boolean>): void;
		destroy(): void;
		getContainer(): HTMLButtonElement;
		render(): HTMLElement;
	}

	/**
	 * @namespace BX.UI.TextEditor.Plugins
	 */
	const Plugins: {
		Paragraph: typeof Paragraph;
		AutoLink: typeof AutoLink;
		BlockToolbar: typeof BlockToolbar;
		Bold: typeof Bold;
		Code: typeof Code;
		FloatingToolbar: typeof FloatingToolbar;
		History: typeof History;
		Image: typeof Image;
		Italic: typeof Italic;
		Link: typeof Link;
		List: typeof List;
		Mention: typeof Mention;
		Quote: typeof Quote;
		Strikethrough: typeof Strikethrough;
		TabIndent: typeof TabIndent;
		Toolbar: typeof Toolbar;
		Underline: typeof Underline;
		Video: typeof Video;
		Spoiler: typeof Spoiler;
		Smiley: typeof Smiley;
		Table: typeof Table;
		Hashtag: typeof Hashtag;
		File: typeof File;
		Copilot: typeof Copilot;
	};

	/**
	 * @namespace BX.UI.TextEditor.Commands
	 */
	const Commands: {
		HIDE_DIALOG_COMMAND: import("ui.lexical.core").LexicalCommand<AllCommands.HideDialogCommandPayload>;
		DIALOG_VISIBILITY_COMMAND: import("ui.lexical.core").LexicalCommand<void>;
		DRAG_START_COMMAND: import("ui.lexical.core").LexicalCommand<void>;
		DRAG_END_COMMAND: import("ui.lexical.core").LexicalCommand<void>;
	};

	/**
	 * @namespace BX.UI.TextEditor.Commands
	 */
	const Constants: {
		UNFORMATTED: 1;
		SLIDER_IGNORE_AUTOBINDING_ATTRIBUTE: "data-slider-ignore-autobinding";
		TRANSPARENT_GIF_SRC: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
		NewLineMode: Record<string, NewLineModeType>;
	};

	/**
	 * @namespace BX.UI.TextEditor.Debug
	 */
	const Debug: {
		generateContent: typeof generateContent;
	};

	function generateContent(editor: TextEditor | BX.UI.Lexical.Core.LexicalEditor): string;

	class DecoratorComponent {
		constructor(componentOptions: DecoratorComponentOptions);
		update(options: BX.JsonObject): void;
		destroy(): void;
		getEditor(): TextEditor;
		getNodeKey(): string;
		getTarget(): HTMLElement;
		getNodeSelection(): ReturnType<typeof createNodeSelection>;
		isSelected(): boolean;
		setSelected(selected: boolean): void;
		getOptions(): BX.JsonObject;
		getOption(option: string, defaultValue?: BX.JsonValue): BX.JsonValue | null;
	}

	function createNodeSelection(editor: TextEditor, key: BX.UI.Lexical.Core.NodeKey): {
		isSelected: () => boolean;
		destroy: () => void;
		onSelect: (fn: Function) => void;
		setSelected: (selected: boolean) => void;
		clearSelection: () => void;
	};
}
