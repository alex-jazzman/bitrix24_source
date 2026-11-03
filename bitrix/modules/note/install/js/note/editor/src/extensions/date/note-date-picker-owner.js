import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { NodeSelection } from '@tiptap/pm/state';
import { NoteThemeContext } from 'note.ui.theme-context';
import { normalizeDateString, normalizeDateValue } from './note-date-parser';

const NODE_NAME = 'noteDate';

// Same class the color popup already uses for its own scoped dark-theme overrides
// (highlight-link-group.js) - the widget it decorates is foreign the same way.
// Paired by hand with the dark-theme rules in note.ui.theme-context (theme-context.css): a stylesheet
// cannot import this constant, so renaming it here without renaming it there silently drops the dark
// theme of the calendar - and nothing but the eye would notice.
const POPUP_CLASS = 'note-editor-date-picker-popup';

/**
 * Builds the local calendar-midnight Date the picker expects for a `YYYY-MM-DD` value.
 *
 * DatePicker re-tags any Date-like it receives by reading its LOCAL year/month/day (see
 * `createDate()` in ui.date-picker) before comparing it against calendar cells, so the value must
 * be built with the local constructor - a UTC-built Date here would read back a day off west of
 * Greenwich.
 */
function dateFromValue(value: string): Date
{
	const [year, month, day] = value.split('-').map(Number);

	return new Date(year, month - 1, day);
}

/**
 * Reverses dateFromValue(): DatePicker hands its selection back already re-tagged, so its calendar
 * day is read through the UTC fields (mirrors the picker's own `getDate()` helper).
 */
function valueFromPickerDate(date: Date | null): string | null
{
	if (!(date instanceof Date))
	{
		return null;
	}

	return normalizeDateValue(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/**
 * Owns the single `ui.date-picker` instance a `noteDate` extension uses to let the author pick a
 * value - one instance per editor, created on first open() and torn down with the extension.
 *
 * The node has no node view, so there is no live `getPos()` to lean on. Rather than remembering a
 * raw position across the open popup's lifetime (stale the moment an earlier edit lands while it
 * is open), open() and the selection handler both re-read the current `NodeSelection` from the
 * editor: the caller places one on the target node before calling open(), and ProseMirror re-maps
 * an existing selection through every following transaction on its own - the same guarantee
 * note-mention-node.js already leans on for its diff decorations. A selection that stops pointing
 * at a `noteDate` node (the node got deleted from under the open popup) makes both a silent no-op.
 */
export class NoteDatePickerOwner
{
	#editor: Object;
	#picker: DatePicker | null = null;

	constructor(editor: Object)
	{
		this.#editor = editor;
	}

	/**
	 * Opens the calendar on the node currently held by a `NodeSelection`, preselecting its value.
	 * Does nothing if the selection is not one - see the class doc for why this is the contract
	 * instead of taking a position.
	 */
	open(): void
	{
		const target = this.#selectedDateNode();
		if (target === null)
		{
			return;
		}

		const { view } = this.#editor;
		const targetElement = view.nodeDOM(target.pos);
		if (!(targetElement instanceof HTMLElement))
		{
			return;
		}

		const picker = this.#ensurePicker();
		// The target goes in before the popup is ever asked for: getPopup() builds it on first call
		// and binds it to whatever target the picker holds right then. Asking first would bind the
		// very first calendar to nothing and open it away from the date that summoned it.
		picker.setTargetNode(targetElement);

		const popup = picker.getPopup();
		const alreadyOpen = popup.isShown();

		popup.setDesignSystemContext(NoteThemeContext.getDesignSystemContext());
		this.#preselect(picker, normalizeDateString(target.node.attrs.value));

		if (alreadyOpen)
		{
			// Moving the calendar from one date to another happens on a click the already open popup
			// is itself watching (main.popup bindAutoHide, document capture phase): showing it here
			// would be undone the moment that same click finishes travelling, leaving the calendar
			// shut. Hand the show to the next task, once the watcher has closed the previous one.
			setTimeout(() => this.#picker?.show(), 0);

			return;
		}

		picker.show();
	}

	/**
	 * Releases the calendar instance. The popup is cached by its own manager and would otherwise
	 * outlive the document that opened it.
	 */
	destroy(): void
	{
		this.#picker?.destroy();
		this.#picker = null;
	}

	#ensurePicker(): DatePicker
	{
		if (this.#picker !== null)
		{
			return this.#picker;
		}

		this.#picker = new DatePicker({
			type: 'date',
			popupOptions: {
				className: POPUP_CLASS,
			},
		});

		this.#picker.subscribe(DatePickerEvent.SELECT, ({ data }) => this.#applySelected(data?.date));
		// Focus on close is not ours to restore: ui.date-picker builds its popup with a focus trap
		// (date-picker.js, `focusTrap: { initialFocus: false }`), and FocusTrap deliberately leaves
		// the focus alone when it already sits outside the popup - a click into search or the
		// sidebar closes the calendar and stays where the user put it. Focusing the editor here
		// would drag it back out of whatever the user had just chosen.

		return this.#picker;
	}

	#preselect(picker: DatePicker, value: string | null): void
	{
		[...picker.getSelectedDates()].forEach((date) => picker.deselectDate(date, { emitEvents: false, render: false }));
		if (value !== null)
		{
			picker.selectDate(dateFromValue(value), { emitEvents: false });
		}
	}

	#applySelected(date: Date | null): void
	{
		const value = valueFromPickerDate(date);
		if (value === null)
		{
			return;
		}

		const target = this.#selectedDateNode();
		if (target === null)
		{
			return;
		}

		const { view } = this.#editor;
		view.dispatch(view.state.tr.setNodeMarkup(target.pos, undefined, { ...target.node.attrs, value }));
	}

	#selectedDateNode(): { pos: number, node: Object } | null
	{
		const { selection } = this.#editor.view.state;
		if (!(selection instanceof NodeSelection) || selection.node.type.name !== NODE_NAME)
		{
			return null;
		}

		return { pos: selection.from, node: selection.node };
	}
}
