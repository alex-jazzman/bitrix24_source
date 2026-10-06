import { Runtime, Tag, Text } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { type Guide } from 'ui.tour';

import { Phrase } from '../../const';
import {
	type BodyPosition,
	type ComposeEditorAdapter,
	type EditorUnsubscribe,
} from '../../infrastructure/adapter/editor/types';
import { Api } from '../../infrastructure/service/compose/compose';
import { type AjaxResponse, type CalendarSharingLinkResponse } from '../../infrastructure/service/compose/types';
import { loc } from '../../lib/loc/loc';
import { markMessageBox } from '../../lib/test-id/test-id';
import { type ComposeState } from '../../model/compose/types';

const TestId = Object.freeze({
	calendarDialog: 'mail-compose-slots-calendar',
	calendarOpen: 'mail-compose-slots-calendar-open',
});

/** Feature identifier the promoter of the tariff promo expects. */
const SharingFeatureId = 'calendar_sharing';

/**
 * The identifier of the old form: the guide saves the option `ui-tour`/`view_date_<id>` by it and
 * `Bitrix\Mail\Service\Compose\ComposeFormDataProvider` reads that option, so a user who has seen the hint in
 * the old form does not meet it here again.
 */
const TourId = 'mail-start-calendar-sharing-tour';

/** Help desk article about the free slots, the one the old form links to. */
const TourArticle = '17198666';

const TourWidth = 400;

/** The hint waits out the layout after the editor reports the body ready. */
const TourDelay = 1500;

/**
 * An allowlist of a portal path or an explicit http(s) address, not a search for `javascript:`, which is
 * bypassed by encoding and by control characters. A protocol-relative address is rejected as well.
 */
const SafeLink = /^(?:\/(?!\/)|https?:\/\/)/i;

const noop = (): void => {};

/** `focusVisible` is not part of the standard `FocusOptions` yet. */
type FocusVisibleOptions = FocusOptions & { focusVisible: boolean };

/** The focus returns without a gesture of the user, so the ring has to be drawn. */
const VisibleFocus: FocusVisibleOptions = { focusVisible: true };

type GuideStep = {
	target: HTMLElement,
	position: string,
	title: string,
	text: string,
	article: string,
};

type GuideOptions = {
	id: string,
	autoSave: boolean,
	simpleMode: boolean,
	steps: GuideStep[],
};

type GuideClass = new (options: GuideOptions) => Guide;

type TourExtension = {
	Guide: GuideClass,
};

/**
 * The hint is shown once in the life of a user and waits out both the editor and a second and a half more, so
 * `ui.tour` is kept out of the dependencies of the form and asked for by the hint itself. `main.core` declares
 * an array where it answers with the namespace of the extension.
 */
function loadTourGuide(): Promise<GuideClass>
{
	return (Runtime.loadExtension('ui.tour') as unknown as Promise<TourExtension>)
		.then((extension: TourExtension): GuideClass => extension.Guide);
}

type SharingLinkResponse = AjaxResponse<CalendarSharingLinkResponse>;

/**
 * The hint asks the server for the link and the click on the slots asks for the same thing again, so the
 * answer is kept for the life of the form: the state of the form is the key, and a form taken down takes its
 * answer with it.
 */
const sharingLinkByForm = new WeakMap<ComposeState, Promise<SharingLinkResponse>>();

/**
 * Only an answer with the sharing switched on is kept. The popup of the switched-off case leads the user to
 * the calendar to switch it on, and the click that follows has to see the new answer rather than the old one.
 */
function getSharingLink(state: ComposeState): Promise<SharingLinkResponse>
{
	const asked = sharingLinkByForm.get(state);
	if (asked)
	{
		return asked;
	}

	const request = Api.getCalendarSharingLink().then(
		(response: SharingLinkResponse): SharingLinkResponse => {
			if (response.data?.isSharingFeatureEnabled !== true)
			{
				sharingLinkByForm.delete(state);
			}

			return response;
		},
		(error: unknown): never => {
			sharingLinkByForm.delete(state);

			throw error;
		},
	);

	sharingLinkByForm.set(state, request);

	return request;
}

export type SlotsBodyNodes = {
	signature: HTMLElement | null,
	quote: HTMLElement | null,
};

export type CalendarSlotsParams = {
	editor: ComposeEditorAdapter,
	state: ComposeState,
	/**
	 * The tariff promo binds to this control and the focus comes back to it when the calendar slider closes.
	 * It belongs to the bottom bar, so it is asked for at the moment it is needed.
	 */
	getControlNode?: () => HTMLElement | null,
};

export type CalendarSlotsTourParams = {
	editor: ComposeEditorAdapter,
	state: ComposeState,
	getControlNode: () => HTMLElement | null,
};

/**
 * The caret comes first: it belongs to the editor, whose own insert leaves the caret after the line. The
 * fallback anchors before the signature, which stands before the quote, and lands at the end of the body when
 * it carries neither.
 */
export function resolveSlotsPositions(nodes: SlotsBodyNodes): BodyPosition[]
{
	const anchor = nodes.signature ?? nodes.quote;

	return [{ at: 'caret' }, anchor ? { at: 'before', anchor } : { at: 'end' }];
}

/**
 * A tariff without calendar sharing shows the promo and makes no request at all. Sharing switched off by the
 * user is no failure either: the popup leads to the calendar, where it is switched on. `true` only when the
 * line reached the body, so a failed request leaves the body as it was.
 */
export function insertCalendarSlots(params: CalendarSlotsParams): Promise<boolean>
{
	const { calendarSharing } = params.state;
	if (!calendarSharing.available)
	{
		return Promise.resolve(false);
	}

	if (!calendarSharing.featureEnabled)
	{
		showSharingPromo(params);

		return Promise.resolve(false);
	}

	return getSharingLink(params.state).then(
		(response): boolean => {
			if (response.data?.isSharingFeatureEnabled !== true)
			{
				showOpenCalendarPopup(params);

				return false;
			}

			const link = toSafeLink(response.data.sharingUrl ?? '');

			return link === null ? false : insertSlotsLine(params.editor, link);
		},
		(): boolean => false,
	);
}

/**
 * `showTour` is cleared right away, so a bottom bar mounted anew offers the hint once; the option of the user
 * is written by the guide itself and only for a hint that was really shown. The returned function drops both
 * the subscription and the pending timer.
 */
export function showCalendarSlotsTour(params: CalendarSlotsTourParams): EditorUnsubscribe
{
	const { calendarSharing } = params.state;
	if (!calendarSharing.available || !calendarSharing.showTour)
	{
		return noop;
	}

	calendarSharing.showTour = false;

	let timer: ReturnType<typeof setTimeout> | null = null;
	const unsubscribeReady = params.editor.subscribeReady((): void => {
		timer = setTimeout((): void => {
			void startTour(params.state, params.getControlNode());
		}, TourDelay);
	});

	return (): void => {
		unsubscribeReady();
		if (timer !== null)
		{
			clearTimeout(timer);
		}
	};
}

function insertSlotsLine(editor: ComposeEditorAdapter, link: string): boolean
{
	const node = renderSlotsLine(link);
	const positions = resolveSlotsPositions({
		signature: editor.getBodyNode(editor.bodyNodes.signature),
		quote: editor.getBodyNode(editor.bodyNodes.quote),
	});

	const inserted = positions.some((position: BodyPosition): boolean => editor.insertNode(node, position));
	if (inserted)
	{
		node.ownerDocument.body.dispatchEvent(new window.Event('input', { bubbles: true }));
	}

	return inserted;
}

/** The address goes in both as the text of the link and as its target, so it is encoded for both places. */
function renderSlotsLine(link: string): HTMLElement
{
	const address = Text.encode(link);

	return Tag.render`
		<span>${loc(Phrase.SlotsText, {
			'[sharing_link]': `<a href="${address}">`,
			'[/sharing_link]': '</a>',
			'#SHARING_LINK#': address,
		})}</span>
	`;
}

function showSharingPromo(params: CalendarSlotsParams): void
{
	FeaturePromotersRegistry.getPromoter({
		featureId: SharingFeatureId,
		bindElement: params.getControlNode?.() ?? undefined,
	}).show();
}

/**
 * With no calendar path in the initial data the popup keeps the text alone, without a button leading nowhere.
 * The address goes through the same allowlist as the link to the slots: both are navigation targets that come
 * from the server.
 */
function showOpenCalendarPopup(params: CalendarSlotsParams): void
{
	const path = toSafeLink(params.state.calendarSharing.userCalendarPath);

	const box = MessageBox.create({
		title: loc(Phrase.SlotsCalendarTitle),
		message: loc(Phrase.SlotsCalendarText),
		buttons: path === null ? MessageBoxButtons.OK : MessageBoxButtons.OK_CANCEL,
		okCaption: path === null ? undefined : loc(Phrase.SlotsCalendarOpen),
		onOk: (): boolean => {
			openCalendar(path, params.getControlNode);

			return true;
		},
	});

	markMessageBox(box, { dialog: TestId.calendarDialog, ok: TestId.calendarOpen });
	box.show();
}

/** The slider of the calendar takes the focus away from the form, so the focus comes back on its close. */
function openCalendar(path: string | null, getControlNode?: () => HTMLElement | null): void
{
	if (path === null)
	{
		return;
	}

	SidePanel.Instance.open(path, {
		events: {
			onCloseComplete: (): void => {
				const control = getControlNode?.() ?? null;
				if (control && document.body.contains(control))
				{
					control.focus(VisibleFocus);
				}
			},
		},
	});
}

/** A control gone by the time the hint is due leaves nothing to point at, so the hint is not shown at all. */
function startTour(state: ComposeState, control: HTMLElement | null): Promise<void>
{
	if (!control)
	{
		return Promise.resolve();
	}

	return Promise.all([getSharingLink(state), loadTourGuide()]).then(
		([response, Guide]): void => {
			showTourGuide(Guide, control, response.data?.isSharingFeatureEnabled === true);
		},
		(): void => {},
	);
}

function showTourGuide(Guide: GuideClass, control: HTMLElement, isSharingEnabled: boolean): void
{
	const guide = new Guide({
		id: TourId,
		autoSave: true,
		simpleMode: true,
		steps: [{
			target: control,
			position: 'top',
			title: loc(Phrase.SlotsTourTitle),
			text: loc(isSharingEnabled ? Phrase.SlotsTourTextEnabled : Phrase.SlotsTourTextDisabled),
			article: TourArticle,
		}],
	});

	guide.getPopup().setWidth(TourWidth);
	guide.start();
}

function toSafeLink(url: string): string | null
{
	const address = url.trim();

	return SafeLink.test(address) ? address : null;
}
