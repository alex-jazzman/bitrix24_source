import { emoji } from '../const/emoji';

const emojiVariationSelector = '\uFE0F';
const emojiPresentationCatalog = new Set(
	emoji
		.flatMap((category) => category.emoji)
		.map((item) => item.symbol)
		.filter((symbol) => symbol.endsWith(emojiVariationSelector)),
);

export const toEmojiPresentation = (symbol: string): string => {
	const emojiPresentationSymbol = `${symbol}${emojiVariationSelector}`;

	return emojiPresentationCatalog.has(emojiPresentationSymbol) ? emojiPresentationSymbol : symbol;
};

export const normalizeRecentEmoji = (storedEmoji: Set<string>): { recentEmoji: Set<string>, changed: boolean } => {
	const storedSymbols = [...storedEmoji];
	const normalizedSymbols = storedSymbols.map((symbol) => toEmojiPresentation(symbol));
	const someSymbolRewritten = normalizedSymbols.some((symbol, index) => symbol !== storedSymbols[index]);
	const recentEmoji = new Set(normalizedSymbols);
	const duplicatesCollapsed = recentEmoji.size !== normalizedSymbols.length;

	return {
		recentEmoji,
		changed: someSymbolRewritten || duplicatesCollapsed,
	};
};
