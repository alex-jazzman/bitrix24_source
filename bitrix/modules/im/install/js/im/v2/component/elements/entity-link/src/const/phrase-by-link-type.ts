import { Loc } from 'main.core';

import { ChatEntityLinkType } from 'im.v2.const';

export const PhraseByLinkType = {
	[ChatEntityLinkType.tasks]: Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_TASK'),
	[ChatEntityLinkType.calendar]: Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_MEETING'),
	[ChatEntityLinkType.sonetGroup]: Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_GROUP'),
	[ChatEntityLinkType.mail]: Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_MAIL'),
	[ChatEntityLinkType.contact]: Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_CONTACT'),
	[ChatEntityLinkType.deal]: Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_DEAL'),
	[ChatEntityLinkType.lead]: Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_LEAD'),
	[ChatEntityLinkType.dynamic]: Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_DYNAMIC_ELEMENT'),
	[ChatEntityLinkType.vibecodeApp]: Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_VIBECODE_APP'),
	default: Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN'),
} as Record<string, string>;
