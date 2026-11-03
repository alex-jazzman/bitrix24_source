import { type JsonObject } from 'main.core';

import { DecoratorComponent } from '../decorator-component';
import { type DecoratorComponentOptions } from './decorator-component-options';

export type DecoratorOptions = {
	componentClass: new (componentOptions: DecoratorComponentOptions) => DecoratorComponent;
	options: JsonObject;
};
