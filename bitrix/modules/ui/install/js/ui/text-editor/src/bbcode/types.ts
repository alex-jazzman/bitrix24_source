import { type JsonObject } from 'main.core';
import { type LexicalNode, type TextNode } from 'ui.lexical.core';
import { type BBCodeNode } from 'ui.bbcode.model';

/**
 * What a plugin passes to createBBCodeElement(); `scheme` is added by the scheme itself.
 *
 * `value` is as wide as BBCodeNode.setValue() accepts — a mention writes the numeric entity id
 * there, and the declared parameter of createElement() calls it a string.
 */
export type BBCodeElementOptions = {
	name: string;
	value?: string | number | boolean;
	/** carried by five call sites and ignored by the model: the scheme decides inline-ness */
	inline?: boolean;
	attributes?: JsonObject;
};

export type BBCodeImportConversion = Record<BBCodeTag, (node: BBCodeNode) => BBCodeConversion | null>;

export type BBCodeTag = string;

export type BBCodeImportMap = Map<BBCodeTag, Array<(node: BBCodeNode) => BBCodeConversion | null>>;

export type BBCodeConversion = {
	conversion: BBCodeConversionFn;
	priority: number;
};

export type BBCodeConversionFn = (node: BBCodeNode) => BBCodeConversionOutput | null;

export type BBCodeConversionOutput = {
	after?: (childLexicalNodes: Array<LexicalNode>) => Array<LexicalNode>;
	forChild?: BBCodeChildConversion;
	node: null | LexicalNode | Array<LexicalNode>;
};

export type BBCodeChildConversion = (
	lexicalNode: LexicalNode,
	parentLexicalNode: LexicalNode | null | undefined,
) => LexicalNode | null | undefined;

export type BBCodeExportOutput = {
	after?: (generatedNode: BBCodeNode | null | undefined) => BBCodeNode | null | undefined;
	node?: BBCodeNode | null;
};

export type BBCodeExportConversion = Record<BBCodeExportType, BBCodeExportFn>;
export type BBCodeExportFn = BBCodeExportNodeFn | BBCodeExportFormatFn;
export type BBCodeExportNodeFn = (lexicalNode: LexicalNode) => BBCodeExportOutput | null;
export type BBCodeExportFormatFn = (lexicalNode: TextNode, node: BBCodeNode) => BBCodeNode | null;
export type BBCodeExportMap = Map<BBCodeExportType, BBCodeExportFn>;
export type BBCodeExportType = BBCodeExportNodeType | BBCodeExportFormat;
export type BBCodeExportNodeType = string;
export type BBCodeExportFormat = 'text:bold' | 'text:italic' | 'text:strikethrough' | 'text:underline';
