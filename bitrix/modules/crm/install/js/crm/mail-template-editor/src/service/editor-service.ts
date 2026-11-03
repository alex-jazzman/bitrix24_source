import { ajax, Loc, Type } from 'main.core';

import { type EditorError, type EditorFields } from '../model/editor-store';

export type EditorSaveData = {
	reference: { source: 'crm'; id: number };
	operation: 'create' | 'update';
};

type EditorSaveResult =
	| { success: true; data: EditorSaveData }
	| { success: false; errors: EditorError[] }
;

class EditorService
{
	async save(id: number, fields: EditorFields): Promise<EditorSaveResult>
	{
		let response: unknown = null;
		try
		{
			response = await ajax.runComponentAction('bitrix:crm.mail_template.editor', 'save', {
				mode: 'class',
				json: { id, fields },
			});
		}
		catch (error)
		{
			return { success: false, errors: this.#getErrors(error) };
		}

		const data = this.#getSavedTemplate(response, id);
		if (!data)
		{
			return { success: false, errors: this.#getErrors(response, 'INVALID_RESPONSE') };
		}

		return { success: true, data };
	}

	#getSavedTemplate(response: unknown, id: number): EditorSaveData | null
	{
		if (
			!Type.isPlainObject(response)
			|| response.status !== 'success'
			|| !Type.isArray(response.errors)
			|| response.errors.length > 0
			|| !Type.isPlainObject(response.data)
		)
		{
			return null;
		}

		const { reference, operation } = response.data;
		if (
			!Type.isPlainObject(reference)
			|| reference.source !== 'crm'
			|| !Type.isInteger(reference.id)
			|| reference.id <= 0
			|| (operation !== 'create' && operation !== 'update')
			|| operation !== (id > 0 ? 'update' : 'create')
			|| (id > 0 && reference.id !== id)
		)
		{
			return null;
		}

		return { reference: { source: 'crm', id: reference.id }, operation };
	}

	#getErrors(response: unknown, fallbackCode: string = 'SAVE_FAILED'): EditorError[]
	{
		const fallback: EditorError = {
			code: fallbackCode,
			message: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SAVE_ERROR') ?? '',
		};
		if (!Type.isPlainObject(response) || !Type.isArray(response.errors))
		{
			return [fallback];
		}

		const fields = new Set<keyof EditorFields>([
			'title', 'entityTypeId', 'access', 'isActive', 'emailFrom', 'subject', 'bodyHtml', 'files',
		]);
		const errors: EditorError[] = [];
		for (const error of response.errors)
		{
			if (!Type.isPlainObject(error))
			{
				continue;
			}

			const code = Type.isString(error.code) || Type.isNumber(error.code) ? String(error.code) : fallbackCode;
			const message = this.#getErrorMessage(code, error.message, fallback.message);
			const candidate = Type.isPlainObject(error.customData) ? error.customData.field : undefined;
			const field = Type.isString(candidate) && fields.has(candidate as keyof EditorFields)
				? candidate as keyof EditorFields
				: undefined
			;
			errors.push({ code, message, field });
		}

		return errors.length > 0 ? errors : [fallback];
	}

	#getErrorMessage(code: string, message: unknown, fallback: string): string
	{
		if (code === 'NETWORK_ERROR')
		{
			return Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_NETWORK_ERROR') ?? '';
		}

		const localizedCodes = new Set([
			'FEATURE_DISABLED', 'ACCESS_DENIED', 'NOT_FOUND', 'VALIDATION_ERROR', 'SAVE_FAILED',
		]);

		return localizedCodes.has(code) && Type.isStringFilled(message) ? message : fallback;
	}
}

export const editorService = new EditorService();
