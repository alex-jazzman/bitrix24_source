import { BX, resolve } from './internal/global';

/**
 * The eleven helpers for `<select>` elements (MOD-01).
 *
 * The group has no shared state, and what holds it together is a calling convention: the methods
 * reach their neighbours through `this` - `sortSelect` calls `this.optionCompare`,
 * `addNewOption` calls `this.sortSelect`, `addSelectedOptions` calls `this.addNewOption`. Turning
 * them into free functions of a module would pass every behavioural test and still break every
 * consumer who takes a method off the namespace, so the object stays an object with methods.
 * `test/old/core/select-utils.test.ts` detaches one on purpose and asserts it throws.
 *
 * Two things are carried over as they are. `addNewOption` returns early on a duplicate, *before*
 * the sorting, so a call that asked for both gets neither. And `addSelectedOptions` hands its two
 * flags to `addNewOption` in the opposite order to the one its own parameter names announce -
 * they land in the right slots, so the code works, but anyone re-deriving the call from the names
 * will get it backwards.
 *
 * `sortSelect`, `moveOptionsUp` and `moveOptionsDown` rebuild their options with `new Option`,
 * which knows nothing about attributes: everything but the text and the value is lost. That is
 * observable and stays.
 */

export const selectUtils = {
	addNewOption(this: any, oSelect: any, opt_value: any, opt_name: any, do_sort?: any, check_unique?: any): void
	{
		oSelect = resolve(oSelect);
		if (oSelect)
		{
			const n = oSelect.length;
			if (check_unique !== false)
			{
				for (let i = 0; i < n; i++)
				{
					if (oSelect[i].value == opt_value)
					{
						// the early return skips the sorting below as well
						return;
					}
				}
			}

			oSelect.options[n] = new Option(opt_name, opt_value, false, false);
		}

		if (do_sort === true)
		{
			this.sortSelect(oSelect);
		}
	},

	deleteOption(oSelect: any, opt_value: any): void
	{
		oSelect = resolve(oSelect);
		if (oSelect)
		{
			for (let i = 0; i < oSelect.length; i++)
			{
				if (oSelect[i].value == opt_value)
				{
					oSelect.remove(i);
					break;
				}
			}
		}
	},

	deleteSelectedOptions(oSelect: any): void
	{
		oSelect = resolve(oSelect);
		if (oSelect)
		{
			let i = 0;
			while (i < oSelect.length)
			{
				if (oSelect[i].selected)
				{
					oSelect[i].selected = false;
					oSelect.remove(i);
				}
				else
				{
					i++;
				}
			}
		}
	},

	deleteAllOptions(oSelect: any): void
	{
		oSelect = resolve(oSelect);
		if (oSelect)
		{
			for (let i = oSelect.length - 1; i >= 0; i--)
			{
				oSelect.remove(i);
			}
		}
	},

	optionCompare(record1: any, record2: any): number
	{
		const value1 = record1.optText.toLowerCase();
		const value2 = record2.optText.toLowerCase();
		if (value1 > value2)
		{
			return (1);
		}

		if (value1 < value2)
		{
			return (-1);
		}

		return (0);
	},

	sortSelect(this: any, oSelect: any): void
	{
		oSelect = resolve(oSelect);
		if (oSelect)
		{
			const myOptions = [];
			let n = oSelect.options.length;
			let i;
			for (i = 0; i < n; i++)
			{
				myOptions[i] = {
					optText: oSelect[i].text,
					optValue: oSelect[i].value,
				};
			}
			myOptions.sort(this.optionCompare);
			oSelect.length = 0;
			n = myOptions.length;
			for (i = 0; i < n; i++)
			{
				oSelect[i] = new Option(myOptions[i].optText, myOptions[i].optValue, false, false);
			}
		}
	},

	selectAllOptions(oSelect: any): void
	{
		oSelect = resolve(oSelect);
		if (oSelect)
		{
			const n = oSelect.length;
			for (let i = 0; i < n; i++)
			{
				oSelect[i].selected = true;
			}
		}
	},

	selectOption(oSelect: any, opt_value: any): void
	{
		oSelect = resolve(oSelect);
		if (oSelect)
		{
			const n = oSelect.length;
			for (let i = 0; i < n; i++)
			{
				// the comparison is assigned, so the rest are deselected in the same pass
				oSelect[i].selected = (oSelect[i].value == opt_value);
			}
		}
	},

	addSelectedOptions(this: any, oSelect: any, to_select_id: any, check_unique?: any, do_sort?: any): void
	{
		oSelect = resolve(oSelect);
		if (!oSelect)
		{
			return;
		}
		const n = oSelect.length;
		for (let i = 0; i < n; i++)
		{
			if (oSelect[i].selected)
			{
				// the two flags go over in the opposite order to the one the names above announce
				this.addNewOption(to_select_id, oSelect[i].value, oSelect[i].text, do_sort, check_unique);
			}
		}
	},

	moveOptionsUp(oSelect: any): void
	{
		oSelect = resolve(oSelect);
		if (!oSelect)
		{
			return;
		}
		const n = oSelect.length;
		for (let i = 0; i < n; i++)
		{
			if (oSelect[i].selected && i > 0 && oSelect[i - 1].selected == false)
			{
				const option = new Option(oSelect[i].text, oSelect[i].value);
				oSelect[i] = new Option(oSelect[i - 1].text, oSelect[i - 1].value);
				oSelect[i].selected = false;
				oSelect[i - 1] = option;
				oSelect[i - 1].selected = true;
			}
		}
	},

	moveOptionsDown(oSelect: any): void
	{
		oSelect = resolve(oSelect);
		if (!oSelect)
		{
			return;
		}
		const n = oSelect.length;
		for (let i = n - 1; i >= 0; i--)
		{
			if (oSelect[i].selected && i < n - 1 && oSelect[i + 1].selected == false)
			{
				const option = new Option(oSelect[i].text, oSelect[i].value);
				oSelect[i] = new Option(oSelect[i + 1].text, oSelect[i + 1].value);
				oSelect[i].selected = false;
				oSelect[i + 1] = option;
				oSelect[i + 1].selected = true;
			}
		}
	},
};
