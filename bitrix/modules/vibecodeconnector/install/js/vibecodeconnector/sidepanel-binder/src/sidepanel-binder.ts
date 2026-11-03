import { Page } from 'main.core';
import { SidePanel, type SliderManager } from 'main.sidepanel';

import { createAppPageRule } from './app-page-rule';

import './sidepanel-binder.css';

const ANCHORS_BOUND_FLAG = 'vibecodeconnectorAppPageAnchorsBound';

export type RootWindow = {
	[ANCHORS_BOUND_FLAG]?: boolean;
};

export function bindAppPageAnchors(): boolean
{
	if (Page.getRootWindow() !== window)
	{
		return false;
	}

	return bindAppPageAnchorsTo(window as unknown as RootWindow, SidePanel.Instance);
}

export function bindAppPageAnchorsTo(rootWindow: RootWindow | null, sliderManager: SliderManager | null): boolean
{
	if (!rootWindow || !sliderManager)
	{
		return false;
	}

	if (rootWindow[ANCHORS_BOUND_FLAG] === true)
	{
		return false;
	}

	const bindingWindow = rootWindow;
	bindingWindow[ANCHORS_BOUND_FLAG] = true;
	sliderManager.bindAnchors({ rules: [createAppPageRule()] });

	return true;
}

bindAppPageAnchors();
