import {DialogType} from "../../../model/types/dialogues";
import {DialogId} from "../../../types/common";
import {MessageStatus} from "../../../model/types/recent";

declare type ListByDialogTypeFilter = {
	dialogTypes?: Array<DialogType>,
	exceptDialogTypes?: Array<DialogType>,
	lastActivityDate?: string,
	limit: number,
}

declare type RecentStoredData = {
	id: DialogId,
	lastActivityDate: Date,
	message: {
		id: number,
		senderId: string,
		date: Date,
		status: MessageStatus,
		subTitleIcon: string,
		sending: boolean,
		text: string,
		params: object,
	},
	dateMessage: Date,
	unread: boolean,
	pinned: boolean,
	invitation?: {
		isActive: boolean,
		originator: number,
		canResend: boolean,
	},
	options: {
		defaultUserRecord?: boolean,
		birthdayPlaceholder?: boolean,
	}
}
declare type PinnedListByDialogTypeFilter = {
	dialogTypes?: Array<DialogType>,
	exceptDialogTypes?: Array<DialogType>,
}
