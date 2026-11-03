/**
 * The focus trap every editor dialog opens with.
 *
 * It keeps Tab inside the dialog and hands the initial focus to the first tabbable element;
 * putting the focus back into the editable is up to the plugin, see returnFocusToEditor.
 */
export const DIALOG_FOCUS_TRAP = { initialFocus: 'first-tabbable', restoreFocus: false } as const;
