declare module 'ui.mermaid'
{
	type MermaidConfig = {
		startOnLoad?: boolean;
		securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox';
		theme?: string;
		[key: string]: any;
	};

	type ParseOptions = {
		suppressErrors?: boolean;
	};

	type ParseResult = {
		diagramType: string;
	};

	type RenderResult = {
		svg: string;
		diagramType?: string;
		bindFunctions?: (element: Element) => void;
	};

	type RunOptions = {
		querySelector?: string;
		nodes?: ArrayLike<HTMLElement>;
		postRenderCallback?: (id: string) => unknown;
		suppressErrors?: boolean;
	};

	interface Mermaid {
		/** Apply global configuration. */
		initialize(config: MermaidConfig): void;
		/** Validate diagram source. Resolves to `false` on invalid syntax when `suppressErrors` is set. */
		parse(text: string, parseOptions?: ParseOptions): Promise<boolean | ParseResult>;
		/** Render a single diagram to SVG. */
		render(id: string, text: string, container?: Element): Promise<RenderResult>;
		/** Render the diagrams found in the given nodes / selector. */
		run(options?: RunOptions): Promise<void>;
		// The full mermaid surface is large; keep the rest open instead of stubbing all of it.
		[key: string]: any;
	}

	export const mermaid: Mermaid;
}
