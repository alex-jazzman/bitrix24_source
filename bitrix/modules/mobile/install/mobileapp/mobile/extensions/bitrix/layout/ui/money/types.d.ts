import { BaseMethods } from '../../../../../../../../dev/janative/types/elements/base-view';
import { ElementStyle } from '../../../../../../../../dev/janative/types/style/element';

/** A node of the money layout: what the render callbacks return and what MoneyView produces. */
type MoneyViewNode = BaseMethods;

/**
 * What the view reads from a money entity. The `money` extension ships no declaration of its
 * Money class, so the contract states the requirement instead of naming a type nobody can resolve.
 */
type MoneySource = {
	formattedAmount: string,
	template?: {
		PARTS?: string[],
		VALUE_INDEX?: number,
	},
};

type MoneyViewProps = {
	money: MoneySource,
	/** Renders the amount part of the currency template. */
	renderAmount: (amount: string) => MoneyViewNode,
	/** Renders every part of the template around the amount. */
	renderCurrency: (currency: string) => MoneyViewNode,
	/** Wraps the ready parts; without it they go into a row View. */
	renderContainer?: (nodes: MoneyViewNode[]) => MoneyViewNode,
	/** Strips the padding the currency template carries around its parts. */
	trim?: boolean,
	/** Applies to the fallback row View only, so renderContainer ignores it. */
	containerStyle?: Partial<ElementStyle>,
};

export { MoneySource, MoneyViewNode, MoneyViewProps };
