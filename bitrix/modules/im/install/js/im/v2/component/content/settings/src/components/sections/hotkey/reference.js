import { Loc } from 'main.core';

import { HotkeyCombination } from 'im.v2.const';
import { HotkeyOs, Utils } from 'im.v2.lib.utils';

export type HotkeyReferenceRow = {
	action: string,
	cells: string[],
	combinations: Array<string | string[]>,
};

export type HotkeyReferenceBlock = {
	id: string,
	title: string,
	columns: string[],
	rows: HotkeyReferenceRow[],
};

const BlockId = {
	send: 'send',
	chats: 'chats',
	text: 'text',
	formatting: 'formatting',
};

const Phrase = {
	columnAction: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_COLUMN_ACTION'),
	columnWindows: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_COLUMN_WINDOWS'),
	columnMacos: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_COLUMN_MACOS'),
	columnSyntax: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_COLUMN_SYNTAX'),

	blockSend: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_BLOCK_SEND'),
	blockChats: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_BLOCK_CHATS'),
	blockText: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_BLOCK_TEXT'),
	blockFormatting: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_BLOCK_FORMATTING'),

	sendMessage: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_SEND_MESSAGE'),
	newLine: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_NEW_LINE'),
	editLast: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_EDIT_LAST'),
	insertName: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_INSERT_NAME'),
	selectAll: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_SELECT_ALL'),
	bold: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_BOLD'),
	italic: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_ITALIC'),
	underline: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_UNDERLINE'),
	strikethrough: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_STRIKETHROUGH'),
	quote: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_QUOTE'),
	link: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_LINK'),
	color: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_COLOR'),
	size: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_ACTION_SIZE'),

	syntaxQuote: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_QUOTE'),
	syntaxBold: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_BOLD'),
	syntaxItalic: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_ITALIC'),
	syntaxUnderline: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_UNDERLINE'),
	syntaxStrikethrough: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_STRIKETHROUGH'),
	syntaxLink: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_LINK'),
	syntaxColor: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_COLOR'),
	syntaxSize: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_SYNTAX_SIZE'),

	avatarClick: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_AVATAR_CLICK'),
	or: Loc.getMessage('IM_CONTENT_SETTINGS_HOTKEY_OR'),
};

const OutsideRegistry = {
	selectAll: 'Ctrl+A',
	insertNameModifier: 'Alt',
};

const OsColumns = [Phrase.columnAction, Phrase.columnWindows, Phrase.columnMacos];
const OsList = [HotkeyOs.windows, HotkeyOs.macos];
const SyntaxColumns = [Phrase.columnAction, Phrase.columnSyntax];

export const getHotkeyReference = (sendByEnter: boolean): HotkeyReferenceBlock[] => {
	const { sendMessage, newLine, editMessage, textDecoration } = HotkeyCombination;

	return [
		{
			id: BlockId.send,
			title: Phrase.blockSend,
			columns: OsColumns,
			rows: sendByEnter
				? [
					osRow(Phrase.sendMessage, sendMessage.byEnter),
					osRow(Phrase.newLine, newLine.byShiftEnter, newLine.byCtrlEnter),
				]
				: [
					osRow(Phrase.sendMessage, sendMessage.byCtrlEnter),
					osRow(Phrase.newLine, newLine.byShiftEnter, newLine.byEnter),
				],
		},
		{
			id: BlockId.chats,
			title: Phrase.blockChats,
			columns: OsColumns,
			rows: [
				osRow(Phrase.editLast, editMessage.lastOwn),
				pointerRow(Phrase.insertName, OutsideRegistry.insertNameModifier, Phrase.avatarClick),
			],
		},
		{
			id: BlockId.text,
			title: Phrase.blockText,
			columns: OsColumns,
			rows: [
				osRow(Phrase.selectAll, OutsideRegistry.selectAll),
				osRow(Phrase.bold, textDecoration.bold),
				osRow(Phrase.italic, textDecoration.italic),
				osRow(Phrase.underline, textDecoration.underline),
				osRow(Phrase.strikethrough, textDecoration.strikethrough),
			],
		},
		{
			id: BlockId.formatting,
			title: Phrase.blockFormatting,
			columns: SyntaxColumns,
			rows: [
				syntaxRow(Phrase.quote, Phrase.syntaxQuote),
				syntaxRow(Phrase.bold, Phrase.syntaxBold),
				syntaxRow(Phrase.italic, Phrase.syntaxItalic),
				syntaxRow(Phrase.underline, Phrase.syntaxUnderline),
				syntaxRow(Phrase.strikethrough, Phrase.syntaxStrikethrough),
				syntaxRow(Phrase.link, Phrase.syntaxLink),
				syntaxRow(Phrase.color, Phrase.syntaxColor),
				syntaxRow(Phrase.size, Phrase.syntaxSize),
			],
		},
	];
};

const osRow = (action: string, ...combinations: Array<string | string[]>): HotkeyReferenceRow => {
	return {
		action,
		combinations,
		cells: OsList.map((os) => combinationsText(os, combinations)),
	};
};

const syntaxRow = (action: string, syntax: string): HotkeyReferenceRow => {
	return {
		action,
		combinations: [],
		cells: [syntax],
	};
};

const pointerRow = (action: string, modifier: string, pointerAction: string): HotkeyReferenceRow => {
	return {
		action,
		combinations: [],
		cells: OsList.map((os) => `${Utils.key.getCombinationText(modifier, os)} + ${pointerAction}`),
	};
};

const combinationsText = (os: string, combinations: Array<string | string[]>): string => {
	return combinations
		.map((combination) => Utils.key.getCombinationText(combination, os))
		.join(` ${Phrase.or} `)
	;
};
