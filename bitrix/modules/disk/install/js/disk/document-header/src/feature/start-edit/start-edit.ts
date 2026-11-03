import { Page, Reflection, Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { type AnalyticsOptions, sendData } from 'ui.analytics';

import { type CompositionModel } from '../../model/composition/types';
import { loadPromoGate, type PromoGate, PromoGateLoadLimit } from '../promo-gate/promo-gate';

/**
 * The page is about to be left for the editor of the same object. The session of the current opening
 * continues there, so the shell of the page is told before the transition: the lifetime of the session
 * belongs to the shell, and closing it on the way out would take the editing down with it.
 */
export const BeforeStartEditEvent = 'Disk.DocumentHeader:onBeforeStartEdit';

/**
 * The code of the opening itself. The item under it does not move the object to a concrete engine:
 * the server picks the engine again, exactly as it did when the object was opened.
 */
export const ServerChosenEditor = 'onlyoffice';

/** The same map the edit process of the file list uses; an unknown extension goes as it is. */
const AnalyticsDocumentTypes: Record<string, string> = {
	docx: 'doc',
	xlsx: 'sheet',
	pptx: 'pres',
};

type ViewerActions = {
	runActionEdit: (request: { objectId: number, name: string, serviceCode: string }) => void,
};

type Slider = {
	getCustomLeftBoundary: () => number,
	close: () => void,
};

type SidePanel = {
	getSliderByWindow: (frame: Window) => Slider | null,
	open: (url: string, options: Record<string, unknown>) => void,
};

export type StartEditRequest = {
	/** Empty for the button itself: it continues the current opening in editing mode. */
	editorCode: string,
	/** Address of the transition; it is built by the server for this very opening. */
	editUrl: string,
	/** Absent for an opening which carries no header of its own; only the analytics reads it. */
	composition: CompositionModel | null,
	/** The scenario of the restriction binds itself to the pressed control. */
	trigger: HTMLElement | null,
	/**
	 * Asked once the gate has been waited for: the wait can outlive the surface which asked for the
	 * transition, and a page nobody is on any more is neither left nor shown a scenario. Absent for a
	 * surface which lives as long as the page it is on.
	 */
	isStillWanted?: () => boolean,
};

/**
 * How the ask ended. A refusal is the scenario of the restriction shown instead of the editor, and
 * it answers the person on its own; nothing at all happened only under `unavailable`, and the answer
 * to that outcome belongs to whoever asked.
 */
export type StartEditOutcome = 'opened' | 'refused' | 'unavailable';

/**
 * The transition to editing. Tariff restrictions and the limit of simultaneous sessions are checked
 * by the existing gate before anything is opened: it decides whether the editor opens at all or the
 * scenario of the restriction is shown instead. Another editor of the menu is opened by the package
 * which owns that transition today, with the rules of the chosen service.
 */
export async function startEdit(request: StartEditRequest): Promise<StartEditOutcome>
{
	if (request.editorCode !== '' && request.editorCode !== ServerChosenEditor)
	{
		return openInEditor(request.editorCode, request.composition);
	}

	const gate = await loadPromoGate(describeOpening(request.composition), PromoGateLoadLimit);
	if (request.isStillWanted !== undefined && !request.isStillWanted())
	{
		return 'unavailable';
	}

	if (gate !== null && gate.shouldShow())
	{
		showRestriction(gate, request);

		return 'refused';
	}

	return openEditor(request.editUrl) ? 'opened' : 'unavailable';
}

function showRestriction(gate: PromoGate, request: StartEditRequest): void
{
	gate.show(request.trigger, true);
	sendData({
		tool: 'docs',
		category: 'docs',
		event: 'oo_limit_edit',
		...describeOpening(request.composition),
	});
}

/** Context of the events of the restriction; the event and the tool belong to the sender. */
function describeOpening(composition: CompositionModel | null): Partial<AnalyticsOptions>
{
	if (composition === null)
	{
		return {};
	}

	const { extension, id } = composition.object;

	return {
		c_sub_section: 'old_element',
		c_element: 'view_mode',
		p3: AnalyticsDocumentTypes[extension] ?? extension,
		p4: `fileId_${id}`,
	};
}

/**
 * The editor takes the whole page it is opened on. Inside a slider that page is the slider itself, so
 * it is reopened at full width instead of being navigated from the inside.
 */
function openEditor(url: string): boolean
{
	if (!Type.isStringFilled(url))
	{
		return false;
	}

	EventEmitter.emit(BeforeStartEditEvent);

	const sidePanel = (Reflection.getClass('BX.SidePanel.Instance') ?? null) as SidePanel | null;
	const slider = sidePanel === null ? null : sidePanel.getSliderByWindow(window);
	if (sidePanel === null || slider === null)
	{
		Page.redirect(url);

		return true;
	}

	const customLeftBoundary = slider.getCustomLeftBoundary();
	slider.close();

	sidePanel.open(url, {
		width: '100%',
		customLeftBoundary,
		cacheable: false,
		allowChangeHistory: false,
		data: { documentEditor: true },
	});

	return true;
}

async function openInEditor(serviceCode: string, composition: CompositionModel | null): Promise<StartEditOutcome>
{
	if (composition === null)
	{
		return 'unavailable';
	}

	try
	{
		await Runtime.loadExtension('disk.viewer.actions');

		const actions = (Reflection.getClass('BX.Disk.Viewer.Actions') ?? null) as ViewerActions | null;
		if (actions === null)
		{
			return 'unavailable';
		}

		actions.runActionEdit({
			objectId: composition.object.id,
			name: composition.object.name,
			serviceCode,
		});

		return 'opened';
	}
	catch
	{
		// the package of the actions reports its own failures; a refused load leaves the object open
		return 'unavailable';
	}
}
