import {Reflection, Runtime} from 'main.core';
import defaultOptions from './internal/default-options';
import type {EnvOptions} from './types/env.options.types';

export {isSupportedVideoUrl} from './video-recognizer';

const optionsKey = Symbol('options');
const mergeOptions = (baseOptions: EnvOptions = {}, options: EnvOptions = {}): EnvOptions => {
	const merge = Runtime?.merge || BX?.Runtime?.merge;
	if (typeof merge === 'function')
	{
		return merge(baseOptions, options);
	}

	return {
		...baseOptions,
		...options,
		params: {
			...(baseOptions.params || {}),
			...(options.params || {}),
		},
	};
};

const getGlobalClass = (name: string): ?Object => {
	const getClass = Reflection?.getClass || BX?.Reflection?.getClass;

	return typeof getClass === 'function' ? getClass(name) : null;
};

/**
 * @memberOf BX.Landing
 */
export class Env
{
	static instance = null;

	static getInstance(): Env
	{
		return Env.instance || Env.createInstance();
	}

	static createInstance(options: EnvOptions = {}): Env
	{
		Env.instance = new Env(options);

			const parentEnv = getGlobalClass('parent.BX.Landing.Env');
		if (parentEnv)
		{
			parentEnv.instance = Env.instance;
		}

		return Env.instance;
	}

	constructor(options: EnvOptions = {})
	{
		this[optionsKey] = Object.seal(
			mergeOptions(defaultOptions, options),
		);
	}

	getOptions(): EnvOptions
	{
		return {...this[optionsKey]};
	}

	setOptions(options: {[key: string]: any})
	{
		this[optionsKey] = mergeOptions(this[optionsKey], options);
	}

	getType(): string
	{
		return this.getOptions().params.type;
	}

	setType(type: string): void
	{
		this.getOptions().params.type = type;
	}

	getSpecialType(): string
	{
		return this.getOptions().specialType;
	}

	getSiteId(): number
	{
		return this.getOptions().site_id || -1;
	}

	getLandingEditorUrl(options: {site?: number, landing: number} = {}): string
	{
		const envOptions = this.getOptions();
		const urlMask = envOptions.params.sef_url.landing_view;

		const siteId = options.site ? options.site : envOptions.site_id;

		return urlMask
			.replace('#site_show#', siteId)
			.replace('#landing_edit#', options.landing);
	}

	isBlockControlsEnabled(): boolean
	{
		const option = this.getOptions().blockControlsEnabled;

		return typeof option === 'undefined' ? true : BX.Text.toBoolean(option);
	}

	isVkVideoAvailable(): boolean
	{
		const option = this.getOptions().vkVideoAvailable;

		return typeof option === 'undefined' ? true : BX.Text.toBoolean(option);
	}
}
