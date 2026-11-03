/**
 * An external script: the markup carried a non-empty `src`, and the address is all the parser
 * keeps. A `<script>` whose `src` is empty counts as an inline script, not an external one.
 */
export interface ExternalScript
{
	readonly isInternal: false;
	readonly src: string;
	readonly runFirst: boolean;
	readonly type: string | null;
}

/**
 * An inline script: the markup carried the code itself.
 */
export interface InlineScript
{
	readonly isInternal: true;
	readonly text: string;
	readonly runFirst: boolean;
	readonly type: string | null;
}

export type AssetScript = ExternalScript | InlineScript;

export interface AssetStyle
{
	readonly href: string;
	readonly media: string | null;
}

export interface ExtractedAssets
{
	/**
	 * The markup with the collected scripts and stylesheet links taken out of it, and nothing
	 * else changed: what is not removed is returned byte for byte, unlike a parser that rebuilds
	 * the string from a tree. A `<script>` of a template type stays where it is, uncollected,
	 * because its content is markup for the consumer to read rather than code to run.
	 */
	readonly html: string;
	readonly scripts: ReadonlyArray<AssetScript>;
	readonly styles: ReadonlyArray<AssetStyle>;
}

export interface ExtractAssetsOptions
{
	/**
	 * Marks every script as early-run regardless of its attributes. The legacy parser spelled
	 * this `scriptsRunFirst`.
	 */
	readonly runFirst?: boolean;

	/**
	 * Script types left in the markup instead of being collected. A `<script>` of one of these
	 * types is a template or a settings block, not code to run.
	 */
	readonly templateTypes?: ReadonlyArray<string>;
}
