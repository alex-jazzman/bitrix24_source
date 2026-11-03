import { createCommand, type LexicalCommand } from 'ui.lexical.core';

export type HideDialogCommandPayload = { sender?: string, context?: string } | void;

export const HIDE_DIALOG_COMMAND: LexicalCommand<HideDialogCommandPayload> = createCommand('HIDE_DIALOG_COMMAND');
export const DIALOG_VISIBILITY_COMMAND: LexicalCommand<void> = createCommand('DIALOG_VISIBILITY_COMMAND');
export const DRAG_START_COMMAND: LexicalCommand<void> = createCommand('DRAG_START_COMMAND');
export const DRAG_END_COMMAND: LexicalCommand<void> = createCommand('DRAG_END_COMMAND');
