import { type ColumnHead, GridColumn, GridMode, type GridModeValue, Phrase } from '../../const';

const MessageColumns: ColumnHead[] = [
	{ id: GridColumn.From, headClass: 'mail-msg-list-from-cell-head', phrase: Phrase.ColumnFrom, showName: false },
	{
		id: GridColumn.Subject,
		headClass: 'mail-msg-list-subject-cell-head',
		phrase: Phrase.ColumnSubject,
		showName: false,
	},
	{ id: GridColumn.Date, headClass: 'mail-msg-list-date-cell-head', phrase: Phrase.ColumnDate, showName: false },
];

/** The name of this column is the only one the head carries - the screen then clips it out of sight. */
const FavoriteColumn: ColumnHead = {
	id: GridColumn.Favorite,
	headClass: 'mail-msg-list-favorite-cell-head',
	phrase: Phrase.ColumnFavorite,
	showName: true,
};

/** Five narrow columns of the bindings; the drafts of the user have none of them. */
const BindingColumns: ColumnHead[] = [
	{ id: GridColumn.CrmBind, headClass: 'mail-msg-list-crm-cell-head', phrase: Phrase.ColumnCrmBind, showName: false },
	{
		id: GridColumn.TaskBind,
		headClass: 'mail-msg-list-task-cell-head',
		phrase: Phrase.ColumnTaskBind,
		showName: false,
	},
	{
		id: GridColumn.ChatBind,
		headClass: 'mail-msg-list-chat-cell-head',
		phrase: Phrase.ColumnChatBind,
		showName: false,
	},
	{
		id: GridColumn.PostBind,
		headClass: 'mail-msg-list-post-cell-head',
		phrase: Phrase.ColumnPostBind,
		showName: false,
	},
	{
		id: GridColumn.MeetingBind,
		headClass: 'mail-msg-list-meeting-cell-head',
		phrase: Phrase.ColumnMeetingBind,
		showName: false,
	},
];

/**
 * The columns of one list, in the order the head and every row follow: a row places its placeholders
 * by the name of the column, not by their position in the record.
 */
export function resolveColumns(mode: GridModeValue, listImprovementsEnabled: boolean): ColumnHead[]
{
	if (mode === GridMode.Draft)
	{
		return MessageColumns;
	}

	return [
		...(listImprovementsEnabled ? [FavoriteColumn] : []),
		...MessageColumns,
		...BindingColumns,
	];
}
