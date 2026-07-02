/**
 * Type declarations for BX.ajax from core_ajax.js
 *
 * This is the legacy AJAX subsystem added via concat in bundle.config.ts.
 * For new code, prefer `BX.ajax.runAction()` / `BX.ajax.runComponentAction()`.
 */

export {};

type AjaxConfig = {
	url: string;
	method?: 'GET' | 'POST';
	data?: string | Record<string, any>;
	dataType?: 'html' | 'json' | 'script';
	timeout?: number;
	async?: boolean;
	processData?: boolean;
	scriptsRunFirst?: boolean;
	emulateOnload?: boolean;
	skipAuthCheck?: boolean;
	start?: boolean;
	cache?: boolean;
	preparePost?: boolean;
	headers?: Array<{ name: string; value: string }> | false;
	lsId?: string;
	lsTimeout?: number;
	lsForce?: boolean;
	onsuccess?: (data: any) => void;
	onfailure?: (reason: string, httpStatus?: number, config?: AjaxConfig) => void;
	onprogress?: (event: ProgressEvent) => void;
	onprogressupload?: (event: ProgressEvent) => void;
	onrequeststart?: (xhr: XMLHttpRequest) => void;
};

type RunActionConfig = {
	method?: 'GET' | 'POST';
	data?: Record<string, any>;
	getParameters?: Record<string, string>;
	headers?: Array<{ name: string; value: string }>;
	timeout?: number;
	preparePost?: boolean;
	analyticsLabel?: string | Record<string, string>;
	analytics?: {
		event?: string;
		tool?: string;
		category?: string;
		c_section?: string;
		c_sub_section?: string;
		c_element?: string;
		type?: string;
		p1?: string;
		p2?: string;
		p3?: string;
		p4?: string;
		p5?: string;
		status?: 'success' | 'error' | 'attempt' | 'cancel';
	};
	navigation?: {
		page?: number;
	};
	onrequeststart?: (xhr: XMLHttpRequest) => void;
	onprogress?: (event: ProgressEvent) => void;
	onprogressupload?: (event: ProgressEvent) => void;
};

type RunComponentActionConfig = RunActionConfig & {
	signedParameters?: string;
	mode?: 'ajax' | 'class';
};

type AjaxLoadItem = {
	url: string;
	type: 'html' | 'json' | 'script' | 'css';
	callback?: (data: any) => void;
};

declare global {
	namespace BX {

		/**
		 * Low-level AJAX request.
		 * @deprecated For controller actions use `BX.ajax.runAction()`.
		 */
		function ajax(config: AjaxConfig): XMLHttpRequest | null;

		namespace ajax {
			function xhr(): XMLHttpRequest | null;
			function isCrossDomain(url: string, location?: Location): boolean;
			function getHostPort(protocol: string, host: string): string;
			function processRequestData(data: any, config: AjaxConfig): void;
			function processScripts(scripts: Array<{ isInternal: boolean; JS: string }>, runFirst?: boolean, callback?: () => void): void;
			function prepareData(data: string | string[] | Record<string, any>, prefix?: string): string;
			function xhrSuccess(xhr: XMLHttpRequest): boolean;
			function Setup(config: Partial<AjaxConfig>, bTemp?: boolean): void;
			function replaceLocalStorageValue(lsId: string, data: any, ttl?: number): void;

			/** Simple GET request */
			function get(url: string, data: string | Record<string, any>, callback?: (data: string) => void): XMLHttpRequest | null;
			function get(url: string, callback: (data: string) => void): XMLHttpRequest | null;

			/** Simple POST request */
			function post(url: string, data: string | Record<string, any>, callback?: (data: string) => void): XMLHttpRequest;

			function getCaptcha(callback?: (data: any) => void): XMLHttpRequest | null;
			function insertToNode(url: string, node: HTMLElement | string): XMLHttpRequest | void;
			function promise(config: AjaxConfig): BXPromise;
			function loadScriptAjax(src: string, callback: () => void, preload?: boolean): XMLHttpRequest | void;
			function loadJSON(url: string, data: any, success: (result: any) => void, failure?: (reason: any) => void): XMLHttpRequest | void;

			/**
			 * Calls a controller action.
			 * Returns a Promise that resolves with `AjaxResponse`.
			 */
			function runAction<T = any>(action: string, config?: RunActionConfig): Promise<AjaxResponse<T>>;

			/**
			 * Calls a component controller action.
			 * Returns a Promise that resolves with `AjaxResponse`.
			 */
			function runComponentAction<T = any>(component: string, action: string, config?: RunComponentActionConfig): Promise<AjaxResponse<T>>;

			function load(items: AjaxLoadItem | AjaxLoadItem[], callback?: () => void): void;
			function submit(form: HTMLFormElement, callback?: (data: any) => void): false;
			function submitComponentForm(form: HTMLFormElement, container: HTMLElement | string, wait?: boolean): true;
			function prepareForm(form: HTMLFormElement, data?: Record<string, any>): { data: Record<string, any>; filesCount: number; roughSize: number };
			function submitAjax(form: HTMLFormElement, config: AjaxConfig): void;
			function UpdatePageData(arData: Record<string, any>): void;
		}
	}
}
