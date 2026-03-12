import { MessagesModelState } from '../../../model/messages/src/types/messages';
import { UsersModelState } from '../../../model/users/src/types';
import { FilesModelState } from '../../../model/files/src/types';
import { ReactionsModelState } from '../../../model/messages/src/reactions/types';
import { TariffRestrictions } from '../../../model/dialogues/src/types';
import { VoteModelState } from '../../../model/messages/src/vote/types';
import {StickerState} from "../../../model/sticker-pack/src/types";

export interface MessageRepositoryPage {
	messageList: Array<MessagesModelState>,
	additionalMessageList: Array<MessagesModelState>,
	userList: Array<UsersModelState>,
	fileList: Array<FilesModelState>,
	reactionList: Array<ReactionsModelState>,
	dialogFields?: TariffRestrictions,
	voteList?: Array<VoteModelState>,
	stickerList?: Array<StickerState>,
}

export interface MessageRepositoryContext extends MessageRepositoryPage {
	hasContextMessage: boolean,
}
