import { Extension, Type } from 'main.core';
import type { FeatureCodeType } from './types';

export class Feature
{
	static #constructorGuard = true;
	static #instance: this | null = null;

	#availableFeatureCodes: Set<FeatureCodeType> = new Set();

	constructor()
	{
		if (Feature.#constructorGuard === true)
		{
			throw new Error('Feature class is a singleton and cannot be instantiated multiple times.');
		}

		this.#init();
	}

	static instance(): this
	{
		if (!this.#instance)
		{
			this.#constructorGuard = false;
			this.#instance = new this();

			this.#constructorGuard = true;
		}

		return this.#instance;
	}

	isAvailable(featureCode: FeatureCodeType): boolean
	{
		if (!Type.isStringFilled(featureCode))
		{
			return false;
		}

		return this.#availableFeatureCodes.has(featureCode);
	}

	#init(): void
	{
		const settings = Extension.getSettings('bizprocdesigner.feature') ?? null;
		const featureCodes = settings?.featureCodes ?? [];

		featureCodes.forEach((code: string) => this.#availableFeatureCodes.add(code));
	}
}
