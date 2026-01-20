const { Dom, Event: BXEvent, UI, Type } = BX;

type AiNodeBpJsonMessages = {
	valid: string,
	invalid: string,
	confirmOverwrite: string,
};

type AiNodeBpJsonElements = {
	returnTypeSelect: ?HTMLSelectElement,
	tabs: HTMLElement[],
	jsonRow: ?HTMLElement,
	jsonTextarea: ?HTMLTextAreaElement,
	templateBtn: ?HTMLButtonElement,
	statusBox: ?HTMLElement,
};

class AiNodeBpJsonEditor
{
	static IDS = Object.freeze({
		returnTypeTabs: 'ai-node-bp-json-return-type-tabs',
		jsonSchemaTemplateBtn: 'ai-node-bp-json-schema-template-btn',
		jsonSchemaStatus: 'ai-node-bp-json-schema-status',
	});

	static TEXTAREA_MAX_HEIGHT = 500;
	static VALIDATE_DEBOUNCE = 250;

	lastJsonValue: string;
	messages: AiNodeBpJsonMessages;
	elements: AiNodeBpJsonElements;

	static init(messages?: AiNodeBpJsonMessages): AiNodeBpJsonEditor
	{
		return new AiNodeBpJsonEditor(messages);
	}

	constructor(messages?: AiNodeBpJsonMessages)
	{
		this.lastJsonValue = '';
		this.messages = messages && Object.keys(messages).length > 0 ? messages : this.getMessages();
		this.elements = this.queryElements();
		this.bindEvents();
	}

	getMessages(): AiNodeBpJsonMessages
	{
		const box = document.getElementById(this.constructor.IDS.messagesBox);

		return {
			valid: box?.dataset.statusValid || '',
			invalid: box?.dataset.statusInvalid || '',
			confirmOverwrite: box?.dataset.confirmOverwrite || '',
		};
	}

	queryElements(): AiNodeBpJsonElements
	{
		const { IDS } = this.constructor;
		const els: AiNodeBpJsonElements = {
			returnTypeSelect: (document.querySelector('select[name="returnType"]'): any),
			tabs: [...document.querySelectorAll(`#${IDS.returnTypeTabs} .node-settings-tab`)],
			jsonRow: document.getElementById('row_jsonSchema'),
			jsonTextarea: (document.querySelector('textarea[name="jsonSchema"]'): any),
			templateBtn: (document.getElementById(IDS.jsonSchemaTemplateBtn): any),
			statusBox: document.getElementById(IDS.jsonSchemaStatus),
		};
		if (els.jsonTextarea)
		{
			this.lastJsonValue = els.jsonTextarea.value;
		}

		return els;
	}

	setStatus(ok: boolean): void
	{
		const { statusBox } = this.elements;
		if (!statusBox)
		{
			return;
		}
		const { valid, invalid } = this.messages;
		Dom.style(statusBox, 'display', 'flex');
		Dom[ok ? 'addClass' : 'removeClass'](statusBox, '--ok');
		Dom[ok ? 'removeClass' : 'addClass'](statusBox, '--err');
		const textEl = statusBox.querySelector('.status-text');
		if (textEl)
		{
			textEl.textContent = ok ? valid : invalid;
		}
	}

	clearStatus(): void
	{
		const { statusBox } = this.elements;
		if (!statusBox)
		{
			return;
		}
		Dom.style(statusBox, 'display', 'none');
		Dom.removeClass(statusBox, '--ok');
		Dom.removeClass(statusBox, '--err');
	}

	autoResize(): void
	{
		const { jsonTextarea } = this.elements;
		if (!jsonTextarea)
		{
			return;
		}
		Dom.style(jsonTextarea, 'height', 'auto');
		Dom.style(jsonTextarea, 'height', `${Math.min(jsonTextarea.scrollHeight, this.constructor.TEXTAREA_MAX_HEIGHT)}px`);
	}

	buildTemplate(): string
	{
		const schema = {
			type: 'object',
			properties: {
				category: { type: 'string', description: 'Category description' },
				priority: { type: 'integer', description: 'Priority description' },
			},
			required: ['category'],
		};

		return JSON.stringify(schema, null, 2);
	}

	setReturnType(value: string): void
	{
		const { returnTypeSelect } = this.elements;
		if (!returnTypeSelect || returnTypeSelect.value === value)
		{
			return;
		}
		returnTypeSelect.value = value;

		returnTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
	}

	applyVisibility(): void
	{
		const { returnTypeSelect, tabs, jsonRow, jsonTextarea } = this.elements;
		if (!returnTypeSelect)
		{
			return;
		}
		const val = returnTypeSelect.value;
		tabs.forEach((btn) => {
			Dom[btn.dataset.value === val ? 'addClass' : 'removeClass'](btn, '--active');
		});
		if (!jsonRow)
		{
			return;
		}

		if (val === 'json')
		{
			Dom.style(jsonRow, 'display', '');
			if (jsonTextarea && jsonTextarea.value.trim() === '' && this.lastJsonValue.trim() !== '')
			{
				jsonTextarea.value = this.lastJsonValue;
				this.validate();
				this.autoResize();
			}

			return;
		}

		if (jsonTextarea && jsonTextarea.value.trim() !== '')
		{
			this.lastJsonValue = jsonTextarea.value;
			jsonTextarea.value = '';
		}
		Dom.style(jsonRow, 'display', 'none');
	}

	validate(): void
	{
		const { jsonTextarea } = this.elements;
		if (!jsonTextarea)
		{
			return;
		}
		const raw = jsonTextarea.value.trim();
		if (raw === '')
		{
			this.clearStatus();

			return;
		}

		let parsed = null;
		try
		{
			parsed = JSON.parse(raw);
		}
		catch
		{
			this.setStatus(false);

			return;
		}

		this.setStatus(Type.isObject(parsed));
	}

	applyTemplate(): void
	{
		const { jsonTextarea } = this.elements;
		if (!jsonTextarea)
		{
			return;
		}
		const template = this.buildTemplate();
		jsonTextarea.value = template;
		this.lastJsonValue = template;
		this.validate();
		this.autoResize();
	}

	promptAndApplyTemplate(): void
	{
		const { jsonTextarea } = this.elements;
		if (!jsonTextarea)
		{
			return;
		}

		if (jsonTextarea.value.trim() === '')
		{
			this.applyTemplate();

			return;
		}

		const { confirmOverwrite } = this.messages;
		if (UI.Dialogs.MessageBox)
		{
			UI.Dialogs.MessageBox.confirm(confirmOverwrite, (mb) => {
				this.applyTemplate();
				mb.close();
			});
		}
		else
		{
			this.applyTemplate();
		}
	}

	bindEvents(): void
	{
		this.bindTabEvents();
		this.bindReturnTypeEvents();
		this.bindJsonTextareaEvents();
		this.bindTemplateButton();
	}

	bindTabEvents(): void
	{
		const { tabs } = this.elements;
		if (tabs.length === 0)
		{
			return;
		}
		tabs.forEach((btn) => {
			BXEvent.bind(btn, 'click', () => this.setReturnType(btn.dataset.value || ''));
		});
	}

	bindReturnTypeEvents(): void
	{
		const { returnTypeSelect } = this.elements;
		if (!returnTypeSelect)
		{
			return;
		}
		const visibilityFn = this.applyVisibility.bind(this);
		BXEvent.bind(returnTypeSelect, 'change', visibilityFn);
		visibilityFn();
	}

	bindJsonTextareaEvents(): void
	{
		const { jsonTextarea } = this.elements;
		if (!jsonTextarea)
		{
			return;
		}
		let timer = null;
		BXEvent.bind(jsonTextarea, 'input', () => {
			this.autoResize();
			if (timer)
			{
				clearTimeout(timer);
			}
			timer = setTimeout(() => this.validate(), this.constructor.VALIDATE_DEBOUNCE);
		});
		this.autoResize();
		this.validate();
	}

	bindTemplateButton(): void
	{
		const { templateBtn, jsonTextarea } = this.elements;
		if (templateBtn && jsonTextarea)
		{
			BXEvent.bind(templateBtn, 'click', () => this.promptAndApplyTemplate());
		}
	}
}

BX.AiNodeBpJsonEditor = AiNodeBpJsonEditor;
