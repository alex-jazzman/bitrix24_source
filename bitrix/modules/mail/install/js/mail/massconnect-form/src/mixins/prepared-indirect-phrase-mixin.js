export const PreparedIndirectPhraseMixin = {
	methods: {
		preparedIndirectPhrase(phraseCode: string, indirectCode: string): { beforeText: ?string, afterText: ?string }
		{
			const phrase = this.$Bitrix.Loc.getMessage(phraseCode);
			const parts = phrase.split(indirectCode);

			return {
				beforeText: parts[0] || null,
				afterText: parts[1] || null,
			};
		},
	},
};
