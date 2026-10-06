const blobBrands = new Set(['[object Blob]', '[object File]']);

/**
 * Tells a Blob or a File of any window from an object that only looks like one.
 *
 * `instanceof` is bound to a window, the brand is not: it is read from the prototype of the
 * window the object was created in. Testing for `size` and `slice` instead would take any
 * object for a file, and rebuilding one gives `new Blob([object])` — the 15 bytes of
 * `[object Object]`, which reach the server as a broken image.
 *
 * @param {*} value
 * @returns {boolean}
 */
export default function isBlob(value)
{
	return blobBrands.has(Object.prototype.toString.call(value));
}
