export type AbsencesModelState = {
	collection: { [userId: string]: UserAbsence };
	fetching: boolean;
};

export type UserAbsence = {
	id: number;
	userId: number;
	fromTs: number;
	toTs: number;
	viewed: boolean;
}
