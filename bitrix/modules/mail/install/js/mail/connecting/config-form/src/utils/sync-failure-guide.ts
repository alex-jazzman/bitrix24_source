import { Loc } from 'main.core';
import { Guide } from 'ui.tour';

const HELPDESK_ARTICLE_ID = '19083990';

export type SyncFailureMode = 'oauth' | 'password';

export type SyncFailureGuideOptions = {
	mode: SyncFailureMode;
	targetSelector: string;
};

type GuideInstance = {
	start(): void;
	close?(): void;
};

type GuideStepConfig = {
	target: string;
	title: string;
	text: string;
	position: 'top' | 'bottom' | 'left' | 'right';
	article: string;
};

const LOCALES: Record<SyncFailureMode, { title: string; text: string }> = {
	oauth: {
		title: 'MAIL_CONFIG_FORM_SYNC_FAILED_OAUTH_TOUR_TITLE',
		text: 'MAIL_CONFIG_FORM_SYNC_FAILED_OAUTH_TOUR_TEXT',
	},
	password: {
		title: 'MAIL_CONFIG_FORM_SYNC_FAILED_PASSWORD_TOUR_TITLE',
		text: 'MAIL_CONFIG_FORM_SYNC_FAILED_PASSWORD_TOUR_TEXT',
	},
};

function findTargetElement(selector: string): HTMLElement | null
{
	if (!selector)
	{
		return null;
	}

	try
	{
		return document.querySelector<HTMLElement>(selector);
	}
	catch
	{
		return null;
	}
}

function buildStep(mode: SyncFailureMode, selector: string): GuideStepConfig
{
	const locales = LOCALES[mode];

	return {
		target: selector,
		title: Loc.getMessage(locales.title) ?? '',
		text: Loc.getMessage(locales.text) ?? '',
		position: 'bottom',
		article: HELPDESK_ARTICLE_ID,
	};
}

/**
 * Shows a tour-bubble hint anchored to a specific element when the last
 * mailbox synchronization failed. Mirrors the legacy wizard's
 * showOauthErrorTour / showPasswordErrorTour behavior.
 *
 * Returns the Guide instance so callers can close it on cleanup, or null
 * if the target element is not in the DOM at call time.
 */
export function showSyncFailureGuide(options: SyncFailureGuideOptions): GuideInstance | null
{
	if (!findTargetElement(options.targetSelector))
	{
		return null;
	}

	const guide = new Guide({
		id: `mail-config-form-sync-failed-${options.mode}-tour`,
		simpleMode: true,
		steps: [buildStep(options.mode, options.targetSelector)],
	}) as GuideInstance;

	guide.start();

	return guide;
}
