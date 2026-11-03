const ajaxController: string = 'main.bitrix.main.controller.loadext.resolveextensions';

export type ExtensionMessages = Record<string, string> | Array<never> | null;
export type ExtensionSettings = Record<string, any> | Array<any> | null;

export type CoreIncludes = {
	js: Array<string>;
	css: Array<string>;
};

export type ExtensionEntry = {
	extension: string;
	namespace: string | null;
	js: Array<string>;
	css: Array<string>;
	messages: ExtensionMessages;
	settings: ExtensionSettings;
	// Present only on the core entry when the server serves the full core: URLs of
	// the assets bundled inside core.js, to be registered as already loaded.
	coreIncludes?: CoreIncludes;
};

export type LoadAssetsResult = Promise<Array<ExtensionEntry>>;

export type LoadAssetsOptions = {
	extension: Array<string>;
	coreLoaded?: boolean;
	// Extensions already registered on the client: the server skips their
	// branches instead of re-resolving them on every call.
	loadedExtension?: Array<string>;
};

export function loadAssets(options: LoadAssetsOptions): LoadAssetsResult
{
	return new Promise((resolve, reject) => {
		const extension: Array<string> = options?.extension || [];
		const data = {
			extension,
			coreLoaded: options?.coreLoaded === true ? 'Y' : 'N',
			loadedExtension: options?.loadedExtension || [],
		};
		const getParameters = {
			e: extension.join(','),
		};

		(BX as any).ajax
			.runAction(ajaxController, { data, getParameters })
			.then((result: any) => {
				resolve(result?.data);
			})
			.catch((err: any) => {
				reject(err);
			});
	});
}
