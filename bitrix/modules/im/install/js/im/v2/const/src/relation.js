import { UserRole } from 'im.v2.const';

export type Relation = {
	id: number,
	userId: number,
	chatId: number,
	isHidden: boolean,
	role: $Values<typeof UserRole>,
};
