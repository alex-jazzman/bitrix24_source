import { Loc } from 'main.core';

import { ChatEntityLinkType, type ChatTypeItem } from 'im.v2.const';

type ChatTypeParams = {
	[chatType: ChatTypeItem]: {
		className: string,
		loc: string,
	}
};

export const ParamsByLinkType: ChatTypeParams = {
	[ChatEntityLinkType.tasks]: {
		loc: Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_TASK'),
	},
	[ChatEntityLinkType.calendar]: {
		loc: Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_MEETING_MSGVER_1'),
	},
	[ChatEntityLinkType.sonetGroup]: {
		loc: Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_GROUP_MSGVER_1'),
	},
	[ChatEntityLinkType.mail]: {
		loc: Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_MAIL_MSGVER_1'),
	},
	[ChatEntityLinkType.contact]: {
		loc: Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_CONTACT'),
	},
	[ChatEntityLinkType.deal]: {
		loc: Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_DEAL'),
	},
	[ChatEntityLinkType.lead]: {
		loc: Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_LEAD'),
	},
	[ChatEntityLinkType.dynamic]: {
		loc: Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_DYNAMIC_ELEMENT'),
	},
};
