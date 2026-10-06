export type OverflowHost<TItem> = {
	getItems: () => TItem[];
	/**
	 * Runs once before every fit pass: the place for measurements shared by all items of the pass.
	 * `countsMoreBlock` tells whether the row of this pass is the one the "more" block shares its
	 * space with. The first pass always asks for the capacity the row would have without the block;
	 * a host that measures the row as it is may ignore the flag.
	 */
	beforeCollect?: (countsMoreBlock: boolean) => void;
	isNotFit: (item: TItem) => boolean;
	hasMoreBlock: () => boolean;
	addMoreBlock: () => void;
	removeMoreBlock: () => void;
};

/**
 * Single source of overflow logic for every fill path.
 * The legacy panel had two divergent implementations: the resize handler was correct,
 * while addItems dropped the "more" block whenever hidden items were present.
 */
export default class OverflowCalculator<TItem>
{
	#host: OverflowHost<TItem>;
	#hidden: TItem[] = [];

	constructor(host: OverflowHost<TItem>)
	{
		this.#host = host;
	}

	getHiddenItems(): TItem[]
	{
		return this.#hidden;
	}

	recalc(): TItem[]
	{
		// Whether the block is needed at all is decided on the geometry of a row without it, exactly
		// the way the block is added below. Judging by a row the block already narrowed leaves a band
		// of widths — wide enough for the items, too narrow for the items and the block — where an
		// item keeps being reported as not fitting, so the block never goes away and the user sees
		// free space next to it.
		this.#hidden = this.#collectHidden(false);

		if (this.#hidden.length === 0)
		{
			if (this.#host.hasMoreBlock())
			{
				this.#host.removeMoreBlock();
			}

			return this.#hidden;
		}

		if (!this.#host.hasMoreBlock())
		{
			this.#host.addMoreBlock();
		}

		// The "more" block consumes width itself, so the fit check has to run again.
		this.#hidden = this.#collectHidden(true);

		return this.#hidden;
	}

	clear(): void
	{
		this.#hidden = [];

		if (this.#host.hasMoreBlock())
		{
			this.#host.removeMoreBlock();
		}
	}

	#collectHidden(countsMoreBlock: boolean): TItem[]
	{
		this.#host.beforeCollect?.(countsMoreBlock && this.#host.hasMoreBlock());

		return this.#host.getItems().filter((item) => this.#host.isNotFit(item));
	}
}
