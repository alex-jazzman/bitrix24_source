import { CrmFormTemplateId, CrmFormSettingsDataPropName, CrmFormTemplatesWithSku } from 'booking.const';

import {
	defaultBookingDefaultForm,
	defaultBookingAutoSelectionForm,
	defaultSkuBookingForm,
} from '../const';
import type {
	BookingSettingsData,
	BookingSettingsDataProperty,
	BookingForm,
	BookingAutoSelectionForm,
	BookingDefaultForm,
	TemplateId,
} from '../types';

export class BookingSettingsDataModel
{
	#isAutoSelectionOn: boolean;
	#settingsData: BookingSettingsData;

	constructor(settingsData: BookingSettingsData, isAutoSelectionOn: boolean, templateId: TemplateId)
	{
		this.#isAutoSelectionOn = isAutoSelectionOn;

		const autoSelectionData = (
			settingsData[CrmFormSettingsDataPropName.autoSelection]
			|| this.#getAutoSelectionFormByTemplate(templateId)
		);
		const defaultData = (
			settingsData[CrmFormSettingsDataPropName.default]
			|| this.#getDefaultFormByTemplate(templateId)
		);
		this.#settingsData = {
			[CrmFormSettingsDataPropName.isAutoSelectionOn]: isAutoSelectionOn,
			[CrmFormSettingsDataPropName.autoSelection]: autoSelectionData,
			[CrmFormSettingsDataPropName.default]: defaultData,
		};
	}

	#isTemplateWithSkus(templateId: string): boolean
	{
		return CrmFormTemplatesWithSku.includes(templateId);
	}

	#getAutoSelectionFormByTemplate(templateId: string): BookingAutoSelectionForm
	{
		const form = defaultBookingAutoSelectionForm;

		if (this.#isTemplateWithSkus(templateId))
		{
			return { ...form, ...defaultSkuBookingForm };
		}

		return form;
	}

	#getDefaultFormByTemplate(templateId: TemplateId): BookingDefaultForm
	{
		let form = { ...defaultBookingDefaultForm };

		if (
			templateId === CrmFormTemplateId.BookingAnyResource
			|| templateId === CrmFormTemplateId.BookingAnyResourceSku
		)
		{
			form.hasSlotsAllAvailableResources = true;
		}

		if (this.#isTemplateWithSkus(templateId))
		{
			form = { ...form, ...defaultSkuBookingForm };
		}

		return form;
	}

	get dataSettingsProperty(): BookingSettingsDataProperty
	{
		return this.#isAutoSelectionOn
			? CrmFormSettingsDataPropName.autoSelection
			: CrmFormSettingsDataPropName.default;
	}

	setSettingsData(patch: Partial<BookingForm> = {}): void
	{
		Object.assign(this.#settingsData[this.dataSettingsProperty], patch);
	}

	get settingsData(): BookingSettingsData
	{
		return this.#settingsData;
	}

	get form(): BookingForm
	{
		return this.#settingsData[this.dataSettingsProperty];
	}
}
