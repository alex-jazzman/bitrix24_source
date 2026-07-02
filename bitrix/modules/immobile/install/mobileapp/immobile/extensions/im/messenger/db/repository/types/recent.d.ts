import { RecentModelState } from '../../../model/recent/src/types';
import { UsersModelState } from '../../../model/users/src/types';
import { MessagesModelState } from '../../../model/messages/src/types/messages';
import { FilesModelState } from '../../../model/files/src/types';
import { StickerState } from '../../../model/sticker-pack/src/types';
import { DraftModelState } from '../../../model/draft/src/types';

export interface RecentPage {
	items: Array<RecentModelState>,
	users: Array<UsersModelState>,
	messages: Array<MessagesModelState>,
	files: Array<FilesModelState>,
	stickers: Array<StickerState>,
	draft: Array<DraftModelState>,
	hasMore: boolean,
}
