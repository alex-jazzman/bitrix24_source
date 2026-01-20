import { HelpDeskLoc } from 'booking.component.help-desk-loc';
import { HelpDesk } from 'booking.const';

import { CrmFormsList } from './crm-forms-list/crm-forms-list';
import { CrmFormsToolbar } from './toolbar/crm-forms-toolbar';
import { AddCrmFormButton } from './add-crm-form-button/add-crm-form-button';
import { AllCrmFormsButton } from './all-crm-forms-button/all-crm-forms-button';

import './crm-forms-content.css';

// @vue/component
export const CrmFormsContent = {
	name: 'CrmFormsContent',
	components: {
		AddCrmFormButton,
		AllCrmFormsButton,
		CrmFormsList,
		CrmFormsToolbar,
		HelpDeskLoc,
	},
	// eslint-disable-next-line flowtype/require-return-type
	setup()
	{
		const helpDesk = HelpDesk.CrmFormsPopup;

		return {
			helpDesk,
		};
	},
	template: `
		<div class="booking--booking--crm-forms-popup__wrapper">
			<div class="booking--booking--crm-forms-popup__header">
				<div class="booking--booking--crm-forms-popup__header-title-row">
					<slot name="icon"/>
					<span class="booking--booking--crm-forms-popup__header-title">
					{{ loc('BOOKING_OPEN_CRM_FORMS_POPUP_TITLE') }}
				</span>
				</div>
				<div class="booking--booking--crm-forms-popup__header-description">
					<HelpDeskLoc
						:message="loc('BOOKING_OPEN_CRM_FORMS_POPUP_DESCRIPTION')"
						:code="helpDesk.code"
						:anchor="helpDesk.anchorCode"
					/>
				</div>
			</div>
			<div class="booking--booking--crm-forms-popup__toolbar">
				<CrmFormsToolbar/>
			</div>
			<div class="booking--booking-crm-forms-popup__list-wrapper">
				<CrmFormsList/>
			</div>
			<div class="booking--booking-crm-forms-popup__footer">
				<div class="booking--booking--crm-forms-popup--footer-buttons-bar">
					<AllCrmFormsButton/>
					<AddCrmFormButton/>
				</div>
			</div>
		</div>
	`,
};
