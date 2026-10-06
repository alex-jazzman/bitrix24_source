import { Reflection, Type } from 'main.core';

import 'ui.design-tokens.air';
import 'ui.icon-set.actions';
import 'ui.icon-set.main';
import 'ui.icon-set.outline';

import { Dictionary } from './dictionary';
import { getInstance } from './get-instance';
import { Label } from './label';
import { MessageEvent } from './message-event';
import { Slider } from './slider';
import { SliderEvent } from './slider-event';
import { SliderManager } from './slider-manager';
import { Toolbar } from './toolbar';
import { ToolbarItem } from './toolbar-item';

import { type LabelOptions } from './types/label-options';
import { type LinkOptions } from './types/link-options';
import { type MinimizeOptions } from './types/minimize-options';
import { type OuterBoundary } from './types/outer-boundary';
import { type RuleOptions } from './types/rule-options';
import { type SliderOptions } from './types/slider-options';
import { type ToolbarItemOptions } from './types/toolbar-item-options';
import { type ToolbarOptions } from './types/toolbar-options';

import './css/sidepanel.css';

const SidePanel = {} as {
	readonly Instance: SliderManager;
};

Object.defineProperty(SidePanel, 'Instance', {
	enumerable: false,
	get: getInstance,
});

const namespace = Reflection.namespace('BX.SidePanel');

Object.defineProperty(namespace, 'Instance', {
	enumerable: false,
	get: getInstance,
});

const Manager = SliderManager;
const Event = SliderEvent;

export {
	SidePanel,
	Slider,
	SliderManager,
	Manager,
	SliderEvent,
	Event,
	MessageEvent,
	Toolbar,
	ToolbarItem,
	Label,
	Dictionary,
};

export type {
	LabelOptions,
	LinkOptions,
	RuleOptions,
	MinimizeOptions,
	SliderOptions,
	ToolbarOptions,
	ToolbarItemOptions,
	OuterBoundary,
};
