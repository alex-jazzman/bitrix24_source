import { CallParsingEvent as AICallParsingEventBuilder } from './builders/ai/call-parsing-event';
import { CreateEvent as CreateAutomatedSolutionEvent } from './builders/automation/automatedsolution/create-event';
import { DeleteEvent as DeleteAutomatedSolutionEvent } from './builders/automation/automatedsolution/delete-event';
import { EditEvent as EditAutomatedSolutionEvent } from './builders/automation/automatedsolution/edit-event';
import { CreateEvent as CreateTypeEvent } from './builders/automation/type/create-event';
import { DeleteEvent as DeleteTypeEvent } from './builders/automation/type/delete-event';
import { EditEvent as EditTypeEvent } from './builders/automation/type/edit-event';
import { CloseEvent as BlockCloseEvent } from './builders/block/close-event';
import { EnableEvent as BlockEnableEvent } from './builders/block/enable-event';
import { LinkEvent as BlockLinkEvent } from './builders/block/link-event';

import { AutoUpdateEvent as CallAssessmentAutoUpdateEventBuilder } from './builders/call-assessment/auto-update-event';
import { BiReportEvent as CallAssessmentBiReportEventBuilder } from './builders/call-assessment/bi-report-event';
import { CallListViewEvent as CallAssessmentCallListViewEventBuilder } from './builders/call-assessment/call-list-view-event';
import { CallReassessmentEvent as CallAssessmentCallReassessmentEventBuilder } from './builders/call-assessment/call-reassessment-event';
import { GridActionsEvent as CallAssessmentGridActionsEventBuilder } from './builders/call-assessment/grid-actions-event';
import { OpenCallScoreEvent as CallAssessmentOpenCallScoreEventBuilder } from './builders/call-assessment/open-call-score-event';
import { OpenScriptEvent as CallAssessmentOpenScriptEventBuilder } from './builders/call-assessment/open-script-event';
import { ScriptDeleteEvent as CallAssessmentScriptDeleteEventBuilder } from './builders/call-assessment/script-delete-event';
import { ScriptToggleEvent as CallAssessmentScriptToggleEventBuilder } from './builders/call-assessment/script-toggle-event';
import { ScriptWizardEvent as CallAssessmentScriptWizardEventBuilder } from './builders/call-assessment/script-wizard-event';
import { SummaryWizardEvent as CallAssessmentSummaryWizardEventBuilder } from './builders/call-assessment/summary-wizard-event';

import { ConnectEvent as CommunicationChannelConnectEventBuilder } from './builders/communication/channel/connect-event';
import { InviteEvent as CommunicationChannelInviteEventBuilder } from './builders/communication/channel/invite-event';

import { DeleteEvent as CommunicationDeleteEvent } from './builders/communication/delete-event';
import { ResendEvent as CommunicationEditorResendEventBuilder } from './builders/communication/editor/resend-event';
import { SendEvent as CommunicationEditorSendEventBuilder } from './builders/communication/editor/send-event';
import { FormEvent as CommunicationFormEvent } from './builders/communication/form-event';
import { SendEvent as CommunicationSendEvent } from './builders/communication/send-event';
import { AddEvent as EntityAddEventBuilder } from './builders/entity/add-event';
import { ChangeStageEvent as EntityChangeStageEventBuilder } from './builders/entity/change-stage-event';
import { CloseEvent as EntityCloseEventBuilder } from './builders/entity/close-event';
import { ConvertBatchEvent as EntityConvertBatchEventBuilder } from './builders/entity/convert-batch-event';
import { ConvertEvent as EntityConvertEventBuilder } from './builders/entity/convert-event';

import { ClickEvent as RepeatSaleBannerClickBuilder } from './builders/repeat-sale/banner/click-event';
import { CloseEvent as RepeatSaleBannerCloseBuilder } from './builders/repeat-sale/banner/close-event';
import { ViewEvent as RepeatSaleBannerViewBuilder } from './builders/repeat-sale/banner/view-event';
import { CancelEvent as RepeatSaleSegmentCancelBuilder } from './builders/repeat-sale/segment/cancel-event';
import { EditEvent as RepeatSaleSegmentEditBuilder } from './builders/repeat-sale/segment/edit-event';
import { ViewEvent as RepeatSaleSegmentViewBuilder } from './builders/repeat-sale/segment/view-event';

import { ViewEvent as OldEntityViewOldInvoiceReadonlyViewBuilder } from './builders/old-entity-view/old-invoice-readonly/view-event';
import { ClickEvent as OldEntityViewOldInvoiceReadonlyClickBuilder } from './builders/old-entity-view/old-invoice-readonly/click-event';
import { CloseEvent as OldEntityViewOldInvoiceReadonlyCloseBuilder } from './builders/old-entity-view/old-invoice-readonly/close-event';

import { ViewEvent as EInvoicePromoViewBuilder } from './builders/einvoice-promo/view-event';
import { ClickEvent as EInvoicePromoClickBuilder } from './builders/einvoice-promo/click-event';
import { CloseEvent as EInvoicePromoCloseBuilder } from './builders/einvoice-promo/close-event';

import { ViewEvent as ImportViewEventBuilder } from './builders/import/view-event';
import { EditEvent as ImportEditEventBuilder } from './builders/import/edit-event';
import { CreateEvent as ImportCreateEventBuilder } from './builders/import/create-event';
import { CancelEvent as ImportCancelEventBuilder } from './builders/import/cancel-event';

import { Dictionary } from './dictionary';
import { getCrmMode } from './helpers';

import type {
	AICallParsingEvent,
	CallAssessmentAutoUpdateEvent,
	CallAssessmentBiReportEvent,
	CallAssessmentCallListViewEvent,
	CallAssessmentCallReassessmentEvent,
	CallAssessmentGridActionsEvent,
	CallAssessmentOpenCallScoreEvent,
	CallAssessmentOpenScriptEvent,
	CallAssessmentScriptDeleteEvent,
	CallAssessmentScriptToggleEvent,
	CallAssessmentScriptWizardEvent,
	CallAssessmentSummaryWizardEvent,
	CommunicationChannelConnectEvent,
	CommunicationChannelInviteEvent,
	CommunicationEditorResendEvent,
	CommunicationEditorSendEvent,
	EntityAddEvent,
	EntityChangeStageEvent,
	EntityCloseEvent,
	EntityConvertBatchEvent,
	EntityConvertEvent,
	EventStatus,
	RepeatSaleBannerClickEvent,
	RepeatSaleBannerCloseEvent,
	RepeatSaleBannerViewEvent,
	RepeatSaleSegmentCancelEvent,
	RepeatSaleSegmentEditEvent,
	RepeatSaleSegmentViewEvent,
	OldEntityViewOldInvoiceReadonlyViewEvent,
	OldEntityViewOldInvoiceReadonlyClickEvent,
	OldEntityViewOldInvoiceReadonlyCloseEvent,
	EInvoicePromoViewEvent,
	EInvoicePromoClickEvent,
	EInvoicePromoCloseEvent,
	ImportViewEvent,
	ImportCreateEvent,
	ImportEditEvent,
	ImportCancelEvent,
} from './types';

const Builder = Object.freeze({
	Entity: {
		AddEvent: EntityAddEventBuilder,
		ConvertEvent: EntityConvertEventBuilder,
		ConvertBatchEvent: EntityConvertBatchEventBuilder,
		CloseEvent: EntityCloseEventBuilder,
		ChangeStageEvent: EntityChangeStageEventBuilder,
	},
	AI: {
		CallParsingEvent: AICallParsingEventBuilder,
	},
	Automation: {
		AutomatedSolution: {
			CreateEvent: CreateAutomatedSolutionEvent,
			EditEvent: EditAutomatedSolutionEvent,
			DeleteEvent: DeleteAutomatedSolutionEvent,
		},
		Type: {
			CreateEvent: CreateTypeEvent,
			EditEvent: EditTypeEvent,
			DeleteEvent: DeleteTypeEvent,
		},
	},
	Block: {
		CloseEvent: BlockCloseEvent,
		EnableEvent: BlockEnableEvent,
		LinkEvent: BlockLinkEvent,
	},
	Communication: {
		DeleteEvent: CommunicationDeleteEvent,
		FormEvent: CommunicationFormEvent,
		SendEvent: CommunicationSendEvent,
		Channel: {
			ConnectEvent: CommunicationChannelConnectEventBuilder,
			InviteEvent: CommunicationChannelInviteEventBuilder,
		},
		Editor: {
			SendEvent: CommunicationEditorSendEventBuilder,
			ResendEvent: CommunicationEditorResendEventBuilder,
		},
	},
	RepeatSale: {
		Banner: {
			ViewEvent: RepeatSaleBannerViewBuilder,
			ClickEvent: RepeatSaleBannerClickBuilder,
			CloseEvent: RepeatSaleBannerCloseBuilder,
		},
		Segment: {
			ViewEvent: RepeatSaleSegmentViewBuilder,
			CancelEvent: RepeatSaleSegmentCancelBuilder,
			EditEvent: RepeatSaleSegmentEditBuilder,
		},
	},
	OldEntityView: {
		OldInvoiceReadonly: {
			ViewEvent: OldEntityViewOldInvoiceReadonlyViewBuilder,
			ClickEvent: OldEntityViewOldInvoiceReadonlyClickBuilder,
			CloseEvent: OldEntityViewOldInvoiceReadonlyCloseBuilder,
		},
	},
	EInvoicePromo: {
		ViewEvent: EInvoicePromoViewBuilder,
		ClickEvent: EInvoicePromoClickBuilder,
		CloseEvent: EInvoicePromoCloseBuilder,
	},
	Import: {
		ViewEvent: ImportViewEventBuilder,
		EditEvent: ImportEditEventBuilder,
		CreateEvent: ImportCreateEventBuilder,
		CancelEvent: ImportCancelEventBuilder,
	},
	CallAssessment: {
		AutoUpdateEvent: CallAssessmentAutoUpdateEventBuilder,
		BiReportEvent: CallAssessmentBiReportEventBuilder,
		CallListViewEvent: CallAssessmentCallListViewEventBuilder,
		CallReassessmentEvent: CallAssessmentCallReassessmentEventBuilder,
		GridActionsEvent: CallAssessmentGridActionsEventBuilder,
		OpenCallScoreEvent: CallAssessmentOpenCallScoreEventBuilder,
		OpenScriptEvent: CallAssessmentOpenScriptEventBuilder,
		ScriptDeleteEvent: CallAssessmentScriptDeleteEventBuilder,
		ScriptToggleEvent: CallAssessmentScriptToggleEventBuilder,
		ScriptWizardEvent: CallAssessmentScriptWizardEventBuilder,
		SummaryWizardEvent: CallAssessmentSummaryWizardEventBuilder,
	},
});

export {
	Builder,
	Dictionary,
	getCrmMode,
};

export type {
	AICallParsingEvent,
	EntityAddEvent,
	EntityCloseEvent,
	EntityConvertEvent,
	EntityConvertBatchEvent,
	EntityChangeStageEvent,
	EventStatus,
	RepeatSaleBannerViewEvent,
	RepeatSaleBannerClickEvent,
	RepeatSaleBannerCloseEvent,
	RepeatSaleSegmentViewEvent,
	RepeatSaleSegmentCancelEvent,
	RepeatSaleSegmentEditEvent,
	CommunicationChannelConnectEvent,
	CommunicationChannelInviteEvent,
	CommunicationEditorSendEvent,
	CommunicationEditorResendEvent,
	OldEntityViewOldInvoiceReadonlyViewEvent,
	OldEntityViewOldInvoiceReadonlyClickEvent,
	OldEntityViewOldInvoiceReadonlyCloseEvent,
	EInvoicePromoViewEvent,
	EInvoicePromoClickEvent,
	EInvoicePromoCloseEvent,
	ImportViewEvent,
	ImportCreateEvent,
	ImportEditEvent,
	ImportCancelEvent,
	CallAssessmentAutoUpdateEvent,
	CallAssessmentBiReportEvent,
	CallAssessmentCallListViewEvent,
	CallAssessmentCallReassessmentEvent,
	CallAssessmentGridActionsEvent,
	CallAssessmentOpenCallScoreEvent,
	CallAssessmentOpenScriptEvent,
	CallAssessmentScriptDeleteEvent,
	CallAssessmentScriptToggleEvent,
	CallAssessmentScriptWizardEvent,
	CallAssessmentSummaryWizardEvent,
};
