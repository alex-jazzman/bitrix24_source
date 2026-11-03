import { load, setJSList, setCSSList } from '../../../../legacy/assets';
import Type from '../../../type';

// Registers already-present assets as loaded so a later `load` skips them.
// Legacy parity: CJSCore emitted setJSList/setCSSList for the files bundled inside core.js
// right after core.js, keeping a direct `load` from re-executing the embedded core_ajax.js,
// polyfills, etc.
//
// The registry used to be reached through `BX.*` and guarded by an isFunction check, because
// it lives in the legacy layer and the layer was a separate bundle - absent from
// main.core.minimal, where the guard made the call a silent no-op. The layer is part of the
// module graph now, so the functions are imported and always present; the guard went with the
// global.
export function registerAssetsAsLoaded(js: Array<string>, css: Array<string>): void
{
	if (Type.isArrayFilled(js))
	{
		setJSList(js);
	}

	if (Type.isArrayFilled(css))
	{
		setCSSList(css);
	}
}

export function loadAll(items: Array<string | { url: string, ext?: string }>): Promise<void>
{
	const itemsList = Type.isArray(items) ? items : [items];

	if (itemsList.length === 0)
	{
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		load(itemsList, resolve, document, reject);
	});
}
