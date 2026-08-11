import {Dom, Type} from 'main.core';
import type {Editor} from './product-list-editor';

declare const BX: any;

export class EditorFormManager
{
	private readonly editor: Editor;
	private form: HTMLElement | null = null;

	constructor(editor: Editor)
	{
		this.editor = editor;
	}

	public init(): void
	{
		const formId = this.editor.getSettingValue('formId', '');
		const form = Type.isStringFilled(formId) ? BX('form_' + formId) : null;

		if (Type.isElementNode(form))
		{
			this.set(form);
		}
	}

	public get(): HTMLElement | null
	{
		return this.form;
	}

	public set(form: HTMLElement | null): void
	{
		this.form = form;
	}

	public exists(): boolean
	{
		return Type.isElementNode(this.form);
	}

	public initFields(): void
	{
		const container = this.form;
		if (Type.isElementNode(container))
		{
			const field = this.getDataField();
			if (!Type.isElementNode(field))
			{
				this.initDataField();
			}

			const settingsField = this.getDataSettingsField();
			if (!Type.isElementNode(settingsField))
			{
				this.initDataSettingsField();
			}
		}
	}

	public initField(fieldName: string): void
	{
		const container = this.form;

		if (Type.isElementNode(container) && Type.isStringFilled(fieldName))
		{
			Dom.append(
				Dom.create(
					'input',
					{attrs: {type: 'hidden', name: fieldName}}
				),
				container!
			);
		}
	}

	public removeFields(): void
	{
		const field = this.getDataField();
		if (Type.isElementNode(field))
		{
			Dom.remove(field);
		}

		const settingsField = this.getDataSettingsField();
		if (Type.isElementNode(settingsField))
		{
			Dom.remove(settingsField);
		}
	}

	public initDataField(): void
	{
		this.initField(this.editor.getDataFieldName());
	}

	public initDataSettingsField(): void
	{
		this.initField(this.editor.getDataSettingsFieldName());
	}

	public getField(fieldName: string): HTMLInputElement | null
	{
		const container = this.form;

		if (Type.isElementNode(container) && Type.isStringFilled(fieldName))
		{
			return container!.querySelector('input[name="' + fieldName + '"]') as HTMLInputElement | null;
		}

		return null;
	}

	public getDataField(): HTMLInputElement | null
	{
		return this.getField(this.editor.getDataFieldName());
	}

	public getDataSettingsField(): HTMLInputElement | null
	{
		return this.getField(this.editor.getDataSettingsFieldName());
	}
}
