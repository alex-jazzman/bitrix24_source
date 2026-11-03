import { Loc, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { Tooltip, TooltipPosition, TooltipTrigger } from 'ui.system.tooltip';

const VISIBLE_DURATION = 2000;

type ActiveInformer = {
	tooltip: Tooltip;
	timeoutId: number;
};

const activeInformers: WeakMap<HTMLElement, ActiveInformer> = new WeakMap();

function scheduleCleanup(target: HTMLElement, tooltip: Tooltip): number
{
	return setTimeout(() => {
		activeInformers.delete(target);
		tooltip.destroy();
	}, VISIBLE_DURATION);
}

export function showCopiedInformer(target: HTMLElement): void
{
	const text = Loc.getMessage('CRM_AI_REPORT_DRAWER_COPIED_INFORMER') ?? '';
	if (!Type.isStringFilled(text))
	{
		return;
	}

	LiveAnnouncer.announce(text);

	if (!Type.isDomNode(target))
	{
		return;
	}

	const active = activeInformers.get(target);
	if (active)
	{
		clearTimeout(active.timeoutId);
		active.timeoutId = scheduleCleanup(target, active.tooltip);
		active.tooltip.show();

		return;
	}

	const tooltip = new Tooltip({
		target,
		content: text,
		position: TooltipPosition.Top,
		trigger: TooltipTrigger.Manual,
	});

	activeInformers.set(target, {
		tooltip,
		timeoutId: scheduleCleanup(target, tooltip),
	});

	tooltip.show();
}
