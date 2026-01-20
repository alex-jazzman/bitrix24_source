export type Reactions = {
	reactionCounters: {[reactionType: string]: number},
	reactionUsers: {[reactionType: string]: Set<number>},
	ownReactions: Set<string>
};
