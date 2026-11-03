import { Type, Text, Loc } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { type BBCodeNode, type BBCodeNodeOptions } from 'ui.bbcode.model';
import { Outline } from 'ui.icon-set.api.core';
import {
	$isTextNode,
	createCommand,
	$createParagraphNode,
	COMMAND_PRIORITY_LOW,
	COMMAND_PRIORITY_EDITOR,
	type LexicalCommand,
	type LexicalNode,
	type LexicalNodeConfig,
	type ElementNode,
} from 'ui.lexical.core';
import {
	TableNode,
	TableCellNode,
	TableRowNode,
	$createTableNode,
	$createTableCellNode,
	$createTableRowNode,
	$createTableNodeWithDimensions,
	registerTableSelectionObserver,
	setScrollableTablesActive,
	TableCellHeaderStates,
	INSERT_TABLE_COMMAND,
} from 'ui.lexical.table';
import { $insertNodeToNearestRoot } from 'ui.lexical.utils';

import {
	$normalizeTextNodes,
	shouldWrapInParagraph,
	type BBCodeExportConversion,
	type BBCodeConversion,
	type BBCodeConversionOutput,
	type BBCodeExportOutput,
	type BBCodeImportConversion,
} from '../../bbcode';
import { DIALOG_VISIBILITY_COMMAND, HIDE_DIALOG_COMMAND } from '../../commands';
import { returnFocusToEditor } from '../../helpers/return-focus-to-editor';
import { type TextEditor } from '../../text-editor';
import { Button } from '../../toolbar/button';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
import { BasePlugin } from '../base-plugin';
import { TableDialog } from './table-dialog';

export const INSERT_TABLE_DIALOG_COMMAND: LexicalCommand<{ targetNode: HTMLElement }> = createCommand(
	'INSERT_TABLE_DIALOG_COMMAND',
);

export class TablePlugin extends BasePlugin
{
	#tableDialog: TableDialog | null = null;

	constructor(editor: TextEditor)
	{
		super(editor);

		// a wide table scrolls inside the theme.tableScrollableWrapper element
		setScrollableTablesActive(this.getLexicalEditor(), true);

		this.#registerCommands();
		this.#registerListeners();
		this.#registerComponents();
	}

	static getName(): string
	{
		return 'Table';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [TableNode, TableCellNode, TableRowNode];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			table: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					return {
						node: $createTableNode(),
					};
				},
				priority: 0,
			}),
			tr: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					return {
						node: $createTableRowNode(),
					};
				},
				priority: 0,
			}),
			td: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					return {
						node: ($createTableCellNode as () => TableCellNode)(),
						after: (childLexicalNodes: Array<LexicalNode>): Array<LexicalNode> => {
							return $normalizeTextNodes(childLexicalNodes);
						},
					};
				},
				priority: 0,
			}),
			th: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					return {
						node: $createTableCellNode(TableCellHeaderStates.ROW),
						after: (childLexicalNodes: Array<LexicalNode>): Array<LexicalNode> => {
							return $normalizeTextNodes(childLexicalNodes);
						},
					};
				},
				priority: 0,
			}),
		};
	}

	exportBBCode(): BBCodeExportConversion
	{
		return {
			table: (): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createElement({ name: 'table' } as BBCodeNodeOptions),
				};
			},
			tablerow: (): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createElement({ name: 'tr' } as BBCodeNodeOptions),
				};
			},
			tablecell: (node: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createElement({ name: (node as TableCellNode).hasHeader() ? 'th' : 'td' } as BBCodeNodeOptions),
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [
				{
					nodeClass: TableNode,
					validate: (tableNode: LexicalNode) => {
						if ((tableNode as TableNode).getChildrenSize() === 0)
						{
							tableNode.remove();

							return true;
						}

						return false;
					},
				},
				{
					nodeClass: TableCellNode,
					validate: (tableCellNode: LexicalNode) => {
						(tableCellNode as TableCellNode).getChildren().forEach((child: LexicalNode | ElementNode) => {
							if (shouldWrapInParagraph(child))
							{
								const paragraph = $createParagraphNode();
								child.replace(paragraph);
								paragraph.append(child);
							}
						});

						return false;
					},
				},
			],

			bbcodeMap: {
				table: 'table',
				tablerow: 'tr',
				tablecell: 'td',
			},
		};
	}

	#registerComponents(): void
	{
		this.getEditor()
			.getComponentRegistry()
			.register('table', (): Button => {
				const button: Button = new Button();
				button.setIcon(Outline.TABLE);
				button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_TABLE') as string | null);
				button.setHasPopup('dialog');
				button.subscribe('onClick', (): void => {
					this.getEditor().dispatchCommand(INSERT_TABLE_DIALOG_COMMAND, {
						targetNode: button.getContainer(),
					});
				});

				return button;
			});
	}

	#registerCommands(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerCommand(
				INSERT_TABLE_COMMAND,
				({ columns, rows }) => {
					const rowCount = Math.max(1, Text.toNumber(rows));
					const columnCount = Math.max(1, Text.toNumber(columns));
					const tableNode = $createTableNodeWithDimensions(rowCount, columnCount, false);
					$insertNodeToNearestRoot(tableNode);

					const firstDescendant: LexicalNode | null = tableNode.getFirstDescendant();
					if ($isTextNode(firstDescendant))
					{
						firstDescendant.select();
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
			this.getEditor().registerCommand(
				INSERT_TABLE_DIALOG_COMMAND,
				(payload): boolean => {
					if (!Type.isPlainObject(payload) || !Type.isElementNode(payload.targetNode))
					{
						return false;
					}

					if (this.#tableDialog !== null)
					{
						if (this.#tableDialog.getTargetNode() === payload.targetNode)
						{
							this.#tableDialog.show();

							return true;
						}

						this.#tableDialog.destroy();
					}

					this.#tableDialog = new TableDialog({
						targetNode: payload.targetNode,
						events: {
							onSelect: (event: BaseEvent) => {
								this.getEditor().dispatchCommand(INSERT_TABLE_COMMAND, event.getData());
								this.#tableDialog!.hide();
							},
							onClose: () => {
								returnFocusToEditor(this.getEditor());
							},
							onDestroy: () => {
								this.#tableDialog = null;
							},
						},
					});

					this.#tableDialog.show();

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				HIDE_DIALOG_COMMAND,
				(): boolean => {
					if (this.#tableDialog !== null)
					{
						this.#tableDialog.hide();
					}

					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				DIALOG_VISIBILITY_COMMAND,
				(): boolean => {
					return this.#tableDialog !== null && this.#tableDialog.isShown();
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}

	#registerListeners(): void
	{
		// in 0.49 the registry of TableObservers and their lifecycle are encapsulated in
		// registerTableSelectionObserver (a mutation listener plus SELECTION_CHANGE)
		this.cleanUpRegister(
			registerTableSelectionObserver(this.getLexicalEditor(), true),
		);
	}

	destroy(): void
	{
		super.destroy();

		if (this.#tableDialog !== null)
		{
			this.#tableDialog.destroy();
		}
	}
}
