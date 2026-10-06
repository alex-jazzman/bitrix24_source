import { Dom } from 'main.core';

const SYMBOL_SELECTOR = '.ui-counter__symbol';
const TRUNCATION_SYMBOL = '+';

// ui.cnt renders the sign node once, before the limit is raised, so the "+" of an already
// truncated value survives the value rewrite. A percent counter shares the node — keep its sign.
export function clearTruncationSymbol(counterContainer: ?HTMLElement): void
{
	const symbolNode = counterContainer?.querySelector(SYMBOL_SELECTOR);

	if (symbolNode?.textContent === TRUNCATION_SYMBOL)
	{
		Dom.adjust(symbolNode, { text: '' });
	}
}
