declare type MemberFilterUsersByParticipation = {
	relations: Array<{
		chatId: number,
		id: number,
		isHidden: boolean,
		role: string,
		userId: number,
	}>
}
