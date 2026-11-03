import { BX } from './internal/global';

/**
 * `BX.util` — 45 subfunctions used by 720 files (MOD-01).
 *
 * Transcribed from `src/old/core.js` without behaviour changes: loose comparisons, mutations of
 * the arguments, the default values and the answers on a nil or wrongly typed argument are all
 * part of the contract at this consumer count, and `test/old/core/util.test.ts` pins them.
 * Neighbouring groups (`BX.mergeEx`, `BX.clone`, `BX.type`, `BX.Text`, `BX.Uri`, `BX.browser`,
 * `BX.create`) are reached through the global on purpose — see `internal/global.ts`.
 *
 * The heading the source file carries over this block: some useful util functions.
 */
export const util = {
	/**
	 * @deprecated
	 * @use [].filter(value => !BX.Type.isNil(value))
	 * @param ar
	 * @return {*}
	 */
	array_values(ar: any): any
	{
		if (!BX.type.isArray(ar))
		{
			return util._array_values_ob(ar);
		}

		const arv = [];
		for (let i = 0, l = ar.length; i < l; i++)
		{
			if (ar[i] !== null && typeof ar[i] !== 'undefined')
			{
				arv.push(ar[i]);
			}
		}

		return arv;
	},

	/**
	 * @deprecated
	 * @use Object.values([]).filter(value => !BX.Type.isNil(value))
	 * @param ar
	 * @return {Array}
	 * @private
	 */
	_array_values_ob(ar: any): any[]
	{
		const arv = [];
		for (const i in ar)
		{
			if (ar[i] !== null && typeof ar[i] !== 'undefined')
			{
				arv.push(ar[i]);
			}
		}

		return arv;
	},

	/**
	 * @deprecated
	 * @use
	 * @param ar
	 * @return {*}
	 */
	array_keys(ar: any): any
	{
		if (!BX.type.isArray(ar))
		{
			return util._array_keys_ob(ar);
		}

		// numeric indexes for an array, string keys for an object — the asymmetry is the contract
		const arv = [];
		for (let i = 0, l = ar.length; i < l; i++)
		{
			if (ar[i] !== null && typeof ar[i] !== 'undefined')
			{
				arv.push(i);
			}
		}

		return arv;
	},

	_array_keys_ob(ar: any): string[]
	{
		const arv = [];
		for (const i in ar)
		{
			if (ar[i] !== null && typeof ar[i] !== 'undefined')
			{
				arv.push(i);
			}
		}

		return arv;
	},

	object_keys(obj: any): string[]
	{
		const arv = [];
		for (const k in obj)
		{
			// not obj.hasOwnProperty(k): that threw on parsed JSON carrying an own
			// "hasOwnProperty" key, see FIX-01 in legacy/README.md
			if (Object.prototype.hasOwnProperty.call(obj, k))
			{
				arv.push(k);
			}
		}

		return arv;
	},

	/**
	 * @deprecated
	 * @use firstArr.concat(secondArr);
	 * @param first
	 * @param second
	 * @return {*[]}
	 */
	array_merge(first: any, second: any): any[]
	{
		if (!BX.type.isArray(first))
		{
			first = [];
		}

		if (!BX.type.isArray(second))
		{
			second = [];
		}

		let i = first.length;
		let j = 0;

		if (typeof second.length === 'number')
		{
			for (let l = second.length; j < l; j++)
			{
				first[i++] = second[j];
			}
		}
		else
		{
			while (second[j] !== undefined)
			{
				first[i++] = second[j++];
			}
		}

		first.length = i;

		return first;
	},

	array_flip(object: any): Record<string, string>
	{
		const newObject: Record<string, string> = {};

		for (const key in object)
		{
			newObject[object[key]] = key;
		}

		return newObject;
	},

	array_diff(ar1: any, ar2: any, hash?: any): any[]
	{
		hash = BX.type.isFunction(hash) ? hash : null;

		let i = 0;
		let length = 0;
		let v;
		let h;
		const map: Record<string, boolean> = {};
		const result = [];

		for (i = 0, length = ar2.length; i < length; i++)
		{
			v = ar2[i];
			h = hash ? hash(v) : v;
			map[h] = true;
		}

		for (i = 0, length = ar1.length; i < length; i++)
		{
			v = ar1[i];
			h = hash ? hash(v) : v;
			if (typeof (map[h]) === 'undefined')
			{
				result.push(v);
			}
		}

		return result;
	},

	/**
	 * @deprecated
	 * @use Set
	 */
	array_unique(ar: any): any
	{
		let i = 0;
		let j;
		let len = ar.length;
		if (len < 2)
		{
			return ar;
		}

		for (; i < len - 1; i++)
		{
			for (j = i + 1; j < len; j++)
			{
				if (ar[i] == ar[j])
				{
					ar.splice(j--, 1);
					len--;
				}
			}
		}

		return ar;
	},

	/**
	 * @deprecated
	 * @use myArr.includes(needle)
	 */
	in_array(needle: any, haystack: any): boolean
	{
		// indexed rather than for-of on purpose: the argument need not be iterable — an
		// array-like object and a string both work here and would throw under for-of
		for (let i = 0; i < haystack.length; i++)
		{
			if (haystack[i] == needle)
			{
				return true;
			}
		}

		return false;
	},

	/**
	 * @deprecated
	 * @use myArr.findIndex(item => item === needle);
	 */
	array_search(needle: any, haystack: any): number
	{
		// indexed for the same reason as in_array: `entries()` is not there on an array-like
		// argument or on a string
		for (let i = 0; i < haystack.length; i++)
		{
			if (haystack[i] == needle)
			{
				return i;
			}
		}

		return -1;
	},

	object_search_key(needle: any, haystack: any): any
	{
		if (typeof haystack[needle] !== 'undefined')
		{
			return haystack[needle];
		}

		for (const i in haystack)
		{
			if (typeof haystack[i] === 'object')
			{
				const result = util.object_search_key(needle, haystack[i]);
				if (result !== false)
				{
					return result;
				}
			}
		}

		return false;
	},

	trim(s: any): any
	{
		if (BX.type.isString(s))
		{
			return s.trim();
		}

		return s;
	},

	urlencode(s: any): string { return encodeURIComponent(s); },

	// it may also be useful. via sVD.
	deleteFromArray(ar: any, ind: any): any[] { return ar.slice(0, ind).concat(ar.slice(ind + 1)); },
	insertIntoArray(ar: any, ind: any, el: any): any[] { return ar.slice(0, ind).concat([el]).concat(ar.slice(ind)); },

	htmlspecialchars(str: any): string
	{
		return BX.Text.encode(str);
	},

	htmlspecialcharsback(str: any): string
	{
		return BX.Text.decode(str);
	},

	// Quote regular expression characters plus an optional character
	preg_quote(str: any, delimiter?: any): any
	{
		if (!str.replace)
		{
			return str;
		}

		// `replace`, not `replaceAll`: the guard above tests for `replace`, so a value carrying
		// only that method has always been accepted here
		return str.replace(new RegExp(`[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\${delimiter || ''}-]`, 'g'), '\\$&');
	},

	jsencode(str: any): any
	{
		if (!str || !str.replace)
		{
			return str;
		}

		const escapes = [
			{ c: '\\\\', r: '\\\\' }, // should be first
			{ c: '\\t', r: '\\t' },
			{ c: '\\n', r: '\\n' },
			{ c: '\\r', r: '\\r' },
			{ c: '"', r: '\\"' },
			{ c: "'", r: "\\'" },
			{ c: '<', r: '\\x3C' },
			{ c: '>', r: '\\x3E' },
			{ c: '\\u2028', r: '\\u2028' },
			{ c: '\\u2029', r: '\\u2029' },
		];

		for (const rule of escapes)
		{
			// `replace`, not `replaceAll`: see `preg_quote` — the guard tests for `replace`
			str = str.replace(new RegExp(rule.c, 'g'), rule.r);
		}

		return str;
	},

	getCssName(jsName: any): string
	{
		if (!BX.type.isNotEmptyString(jsName))
		{
			return '';
		}

		return jsName.replaceAll(/[A-Z]/g, (match: string) => {
			return `-${match.toLowerCase()}`;
		});
	},

	getJsName(cssName: any): any
	{
		// the literal stays inside the call: hoisting it out would make `test()` leave a search
		// position behind and turn a repeated call into a different answer
		const regex = /-([a-z])/g;
		if (regex.test(cssName))
		{
			return cssName.replaceAll(regex, (match: string, letter: string) => {
				return letter.toUpperCase();
			});
		}

		return cssName;
	},

	nl2br(str: any): any
	{
		if (!str || !str.replace)
		{
			return str;
		}

		// `replace`, not `replaceAll`: see `preg_quote` — the guard tests for `replace`
		return str.replace(/([^>])\n/g, '$1<br/>');
	},

	/**
	 * @deprecated
	 * @use .padStart() / .padEnd()
	 * @param input
	 * @param pad_length
	 * @param pad_string
	 * @param pad_type
	 * @return {*}
	 */
	str_pad(input: any, pad_length: any, pad_string?: any, pad_type?: any): string
	{
		pad_string = pad_string || ' ';
		pad_type = pad_type || 'right';
		input = input.toString();

		if (pad_type === 'left')
		{
			return util.str_pad_left(input, pad_length, pad_string);
		}

		return util.str_pad_right(input, pad_length, pad_string);
	},

	str_pad_left(input: any, pad_length: any, pad_string?: any): string
	{
		return input.toString().padStart(pad_length, pad_string);
	},

	str_pad_right(input: any, pad_length: any, pad_string?: any): string
	{
		return input.toString().padEnd(pad_length, pad_string);
	},

	strip_tags(str: any): string
	{
		return str.split(/<[^>]+>/g).join('');
	},

	strip_php_tags(str: any): string
	{
		return str.replaceAll(/<\?(.|[\n\r])*?\?>/g, '');
	},

	popup(url: any, width: any, height: any): Window | null
	{
		let w = 0;
		let h = 0;
		if (BX.browser.IsOpera())
		{
			w = document.body.offsetWidth;
			h = document.body.offsetHeight;
		}
		else
		{
			w = screen.width;
			h = screen.height;
		}

		return window.open(url, '', `status=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${Math.floor((h - height) / 2 - 14)},left=${Math.floor((w - width) / 2 - 5)}`);
	},

	shuffle(array: any): any
	{
		let temporaryValue = null;
		let randomIndex = 0;
		let currentIndex = array.length;

		while (currentIndex !== 0)
		{
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	},

	// BX.util.objectSort(object, sortBy, sortDir) - Sort object by property
	// function params: 1 - object for sort, 2 - sort by property, 3 - sort direction (asc/desc)
	// return: sort array [[objectElement], [objectElement]] in sortDir direction

	// example: BX.util.objectSort({'L1': {'name': 'Last'}, 'F1': {'name': 'First'}}, 'name', 'asc');
	// return: [{'name' : 'First'}, {'name' : 'Last'}]
	objectSort(object: any, sortBy: any, sortDir?: any): any[]
	{
		// only the exact string 'asc' means ascending; anything else, omitted included, is descending
		sortDir = sortDir == 'asc' ? 'asc' : 'desc';

		const arItems = [];
		for (const key in object)
		{
			// a falsy sort value drops the element out of the result entirely
			if (Object.prototype.hasOwnProperty.call(object, key) && object[key][sortBy])
			{
				arItems.push([key, object[key][sortBy]]);
			}
		}

		// Date by timestamp, anything numeric through parseInt, everything else as a lowercase string
		const sortValue = (item: any): any => {
			if (BX.type.isDate(item[1]))
			{
				return item[1].getTime();
			}

			if (isNaN(item[1]))
			{
				return item[1].toString().toLowerCase();
			}

			return parseInt(item[1]);
		};

		if (sortDir == 'asc')
		{
			arItems.sort((a: any, b: any) => {
				const s1 = sortValue(a);
				const s2 = sortValue(b);

				if (s1 > s2)
				{
					return 1;
				}

				if (s1 < s2)
				{
					return -1;
				}

				return 0;
			});
		}
		else
		{
			arItems.sort((a: any, b: any) => {
				const s1 = sortValue(a);
				const s2 = sortValue(b);

				if (s1 < s2)
				{
					return 1;
				}

				if (s1 > s2)
				{
					return -1;
				}

				return 0;
			});
		}

		const arReturnArray = [];
		for (const item of arItems)
		{
			arReturnArray.push(object[item[0]]);
		}

		return arReturnArray;
	},

	objectMerge(): any
	{
		// ring util <-> inherit (`merge` calls `util.array_merge`): stays late-bound
		return BX.mergeEx.apply(window, arguments);
	},

	objectClone(object: any): any
	{
		return BX.clone(object, true);
	},

	// #fdf9e5 => {r=253, g=249, b=229}
	hex2rgb(color: any): { r: number, g: number, b: number }
	{
		const rgb = color.replaceAll(/[ #]/g, '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3').match(/.{2}/g);
		for (let i = 0; i < 3; i++)
		{
			rgb[i] = parseInt(rgb[i], 16);
		}

		return { r: rgb[0], g: rgb[1], b: rgb[2] };
	},

	/**
	 * @deprecated
	 * @use BX.Uri
	 * @param url
	 * @param param
	 * @return {string}
	 */
	remove_url_param(url: any, param: any): string
	{
		return BX.Uri.removeParam(url, param);
	},

	/*
	{'param1': 'value1', 'param2': 'value2'}
	 */
	/**
	 * @deprecated
	 * @use BX.Uri
	 * @param url
	 * @param params
	 * @return {string}
	 */
	add_url_param(url: any, params: any): string
	{
		const preparedParams = Object.entries(params).reduce((acc: Record<string, any>, item: any) => {
			acc[item[0]] = BX.type.isArray(item[1]) ? item[1].join(',') : item[1];

			return acc;
		}, {});

		return BX.Uri.addParam(url, preparedParams);
	},

	/*
{'param1': 'value1', 'param2': 'value2'}
 */
	buildQueryString(params: any): string
	{
		let result = '';
		for (const key in params)
		{
			const value = params[key];
			if (BX.type.isArray(value))
			{
				// forEach rather than for-of: it skips the holes of a sparse array, and
				// `entries()` would emit an `undefined` element for each of them
				// eslint-disable-next-line no-loop-func
				value.forEach((valueElement: any, index: number) => {
					const indexedKey = `${key}[${index}]`;
					result += `${encodeURIComponent(indexedKey)}=${encodeURIComponent(valueElement)}&`;
				});
			}
			else
			{
				result += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
			}
		}

		if (result.length > 0)
		{
			result = result.slice(0, -1);
		}

		return result;
	},

	even(digit: any): boolean
	{
		return (parseInt(digit) % 2 == 0);
	},

	hashCode(str: any): number
	{
		if (!BX.type.isNotEmptyString(str))
		{
			return 0;
		}

		let hash = 0;
		for (let i = 0; i < str.length; i++)
		{
			const c = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + c;
			hash &= hash;
		}

		return hash;
	},

	getRandomString(length?: any): string
	{
		return BX.Text.getRandom(length);
	},

	number_format(number: any, decimals?: any, dec_point?: any, thousands_sep?: any): string
	{
		let sign = '';
		// the guard reads the absolute value, so only NaN falls back to 2 — a negative count does not
		decimals = Math.abs(decimals);
		if (isNaN(decimals) || decimals < 0)
		{
			decimals = 2;
		}

		dec_point = dec_point || ',';
		if (typeof thousands_sep === 'undefined')
		{
			thousands_sep = '.';
		}

		number = (Number(number) || 0).toFixed(decimals);
		if (number < 0)
		{
			sign = '-';
			number = -number;
		}

		// `i` holds the integer part as a string and is then used in `number - i`, where the
		// subtraction coerces it back; the type stays loose so the coercion survives untouched
		const i: any = String(parseInt(number, 10));
		const j = (i.length > 3 ? i.length % 3 : 0);

		const km = (j ? i.slice(0, j) + thousands_sep : '');
		const kw = i.slice(j).replaceAll(/(\d{3})(?=\d)/g, `$1${thousands_sep}`);
		const kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).replace(/-/, '0').slice(2) : '');

		return sign + km + kw + kd;
	},

	getExtension(url: any): string
	{
		url = url || '';
		const items = url.split('?')[0].split('.');

		return items[items.length - 1].toLowerCase();
	},
	addObjectToForm(object: any, form: any, prefix?: any): void
	{
		if (!BX.type.isString(prefix))
		{
			prefix = '';
		}

		for (const key in object)
		{
			if (!Object.prototype.hasOwnProperty.call(object, key))
			{
				continue;
			}

			let value = object[key];
			const name = prefix === '' ? key : (`${prefix}[${key}]`);
			if (BX.type.isArray(value))
			{
				const obj: Record<number, any> = {};
				// indexed rather than `entries()`: a hole of a sparse array must become an own
				// `undefined` key here, exactly as it does today
				for (let i = 0; i < value.length; i++)
				{
					obj[i] = value[i];
				}

				util.addObjectToForm(obj, form, name);
			}
			else if (BX.type.isPlainObject(value))
			{
				util.addObjectToForm(value, form, name);
			}
			else
			{
				value = BX.type.isFunction(value.toString) ? value.toString() : '';
				if (value !== '')
				{
					form.appendChild(BX.create('INPUT', { attrs: { type: 'hidden', name, value } }));
				}
			}
		}
	},

	observe(object: any, enable: any): boolean
	{
		console.error('BX.util.observe: function is no longer supported by browser.');

		return false;
	},

	escapeRegExp(str: any): string
	{
		return str.replaceAll(/[$()*+./?[\\\]^{|}-]/g, '\\$&');
	},
};
