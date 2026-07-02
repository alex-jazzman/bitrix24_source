import { FocusMonitor } from './focus-monitor/focus-monitor';
import { FocusTrap } from './focus-trap/focus-trap';
import { FocusNavigator, RESTORE_FOCUS_EVENT, type FocusNavigatorOptions } from './focus-navigator/focus-navigator';
import { InputModalityTracker, type InputModality } from './focus-monitor/input-modality-tracker';
import { FocusTrapDirective } from './focus-trap/focus-trap-directive';
import { InteractivityChecker } from './interactivity-checker/interactivity-checker';
import { LiveAnnouncer, type LiveAnnouncerOptions, type AriaLivePoliteness } from './live-announcer/live-announcer';
import { AccessibilityLogger, type LogCategory } from './accessibility-logger/accessibility-logger';
import { FocusZone, ActiveDescendant } from './focus-zone/focus-zone';
import { AccessibilitySettings } from './accessibility-settings/accessibility-settings';
import { VisuallyHidden } from "./visually-hidden/visually-hidden";

import {
	type FocusTrapOptions,
	type InitialFocus,
	type RestoreFocus,
	type FocusBoundaryTarget,
} from './focus-trap/types';

import { type FocusZoneOptions, type FocusZoneDirection } from './focus-zone/types';
import { FocusKeys } from './focus-zone/keys';

FocusMonitor.initialize();

export {
	FocusMonitor,
	FocusTrap,
	FocusTrapDirective,
	FocusNavigator,
	FocusZone,
	InteractivityChecker,
	InputModalityTracker,
	LiveAnnouncer,
	AccessibilityLogger,
	RESTORE_FOCUS_EVENT,
	FocusKeys,
	ActiveDescendant,
	AccessibilitySettings,
	VisuallyHidden,
};

export type {
	FocusTrapOptions,
	InitialFocus,
	RestoreFocus,
	FocusBoundaryTarget,
	FocusNavigatorOptions,
	FocusZoneOptions,
	FocusZoneDirection,
	LiveAnnouncerOptions,
	AriaLivePoliteness,
	InputModality,
	LogCategory,
};
