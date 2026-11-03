/* eslint-disable */
type LocFunction = (messageId: string, replacements?: Record<string, string>) => string;

type LocPluginOptions = {
	getMessage: LocFunction;
	languageId?: string;
};

declare namespace BX.Call.Plugin {
	const LocPlugin: BX.Vue3.Plugin<LocPluginOptions>;
}
