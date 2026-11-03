import { Runtime, Type } from 'main.core';

// The import dialog is only ever reached through the footer button, so its bundle is fetched on
// demand instead of riding along with every note page. The promise lives in module scope on
// purpose: in component `data` Vue would wrap it in a reactive proxy.
let dialogPromise: Promise<Function> | null = null;

export function ensureImportDialog(): Promise<Function>
{
	if (dialogPromise === null)
	{
		// Drop a failed promise instead of caching it: a transient load failure must not
		// disable import for the rest of the session.
		dialogPromise = Runtime.loadExtension('note.import')
			.then((exports: Object) => {
				const dialogClass = exports?.ImportDialog;
				if (!Type.isFunction(dialogClass))
				{
					throw new TypeError('note.import extension API is not available');
				}

				return dialogClass;
			})
			.catch((error: Error) => {
				dialogPromise = null;

				throw error;
			});
	}

	return dialogPromise;
}
