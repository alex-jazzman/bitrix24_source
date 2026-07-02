export type User = {
	id: number;
	name: string;
	position: string;
	avatar: {
		src: string;
	} | null | void;

	pathToProfile: string;
};
