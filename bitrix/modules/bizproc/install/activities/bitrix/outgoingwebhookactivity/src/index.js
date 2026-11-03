import { ajax, Dom, Event, Tag, Text, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import './style.css';

type SelectOptions = { [string]: string };

type RenderableField = {
	Type: string,
	Name: string,
	FieldName: string,
	Value: mixed,
	Default?: mixed,
	Required?: boolean,
	AllowSelection?: boolean,
	Options?: SelectOptions,
};

type ControlOptions = {
	fieldName: string,
	documentType: Array<string>,
	defaultValue?: mixed,
	selectOptions?: SelectOptions,
	minValue?: number,
	maxValue?: number,
	pairedField?: RenderableField,
	pairsOptionValue?: string,
	pairsValue?: Array<Pair>,
	pairsOptions?: ControlOptions,
	addRowCaption?: string,
	nameColumnCaption?: string,
	valueColumnCaption?: string,
	sectionCaption?: string,
	buttonCaption?: string,
	durationCaption?: string,
	sizeCaption?: string,
	bodyTruncatedCaption?: string,
	expressionWarning?: string,
	methodsWithBody?: Array<string>,
	formBodyType?: string,
	fieldErrorCaption?: string,
};

type TestResponse = {
	success?: boolean,
	responseCode?: number,
	responseBody?: string,
	responseBodySize?: number,
	responseHeaders?: { [string]: string },
	durationMs?: number,
	errorMessage?: string,
};

type Field = {
	controlId: string,
	fieldName: string,
	property: { Name: string, FieldName: string, Options: ControlOptions },
	value: mixed,
};

type Pair = { NAME?: string, VALUE?: string };

const RENDER_MODE = 'designer';
const RENDER_FINISHED_EVENT = 'BX.Bizproc.FieldType.onCollectionRenderControlFinished';
const SUMMARY_SEPARATOR = ' · ';
const ACTIVITY_TYPE = 'OutgoingWebHookActivity';
const EXPRESSION_PATTERNS = [
	/\{=\s*[a-z0-9_]+\s*:\s*[a-z0-9_.]+(\s*>\s*[a-z0-9_:]+(\s*,\s*[a-z0-9_]+)?)?\s*\}/i,
	/\{\{=[\s\S]*?\}\}(?=[^}]|$)/,
	/^\s*=/,
	/^\s*\{\{[\s\S]*?\}\}\s*$/,
];
const HTTP_CODE_ERROR = 300;
const BODY_PREVIEW_LENGTH_MAX = 4096;
const TEST_REQUEST_FIELDS = [
	'method',
	'url',
	'query_params',
	'headers',
	'body_type',
	'body',
	'body_params',
	'timeout',
];

export class OutgoingWebHookActivityRenderer
{
	#pendingFields: Array<{ item: Object, container: HTMLElement, options: ControlOptions }> = [];
	#isFlushScheduled: boolean = false;
	#renderings: Array<Promise<void>> = [];
	#renderFinishedHandlers: Set<Function> = new Set();
	#rowIndex: number = 0;

	getControlRenderers(): Object
	{
		return {
			webhookRequestLine: (field: Field) => this.#renderRequestLine(field),
			webhookParams: (field: Field) => this.#renderParams(field),
			webhookBody: (field: Field) => this.#renderBody(field),
			webhookExtra: (field: Field) => this.#renderExtra(field),
			webhookTest: (field: Field) => this.#renderTest(field),
		};
	}

	#renderRequestLine(field: Field): HTMLElement
	{
		const options = this.#getOptions(field);
		const paired = options.pairedField ?? {};

		return Tag.render`
			<div class="bizproc-webhook-request-line" data-testid="bizproc-webhook-request-line">
				<div class="bizproc-webhook-request-line__method">
					${this.#renderSelect(
						options.fieldName,
						options.selectOptions,
						field.value ?? options.defaultValue,
						'bizproc-webhook-method',
					)}
				</div>
				<div class="bizproc-webhook-request-line__url" data-testid="bizproc-webhook-url">
					${this.#renderEngineField(paired, options)}
				</div>
			</div>
		`;
	}

	#renderParams(field: Field): HTMLElement
	{
		const options = this.#getOptions(field);
		const table = this.#renderPairsTable(options, field.value);

		return this.#renderSection(
			field.property.Name,
			table,
			`bizproc-webhook-section-${OutgoingWebHookActivityRenderer.#toTestId(options.fieldName)}`,
			() => {
				const filled = OutgoingWebHookActivityRenderer.#countFilledPairs(table);

				return filled > 0 ? String(filled) : '';
			},
		);
	}

	#renderPairsTable(options: ControlOptions, value: mixed): HTMLElement
	{
		const rows = Tag.render`<div class="bizproc-webhook-pairs__rows"></div>`;

		this.#toPairs(value).forEach((pair) => Dom.append(this.#renderPairRow(options, pair), rows));

		const setId = OutgoingWebHookActivityRenderer.#toTestId(options.fieldName);
		const addButton = Tag.render`
			<span class="bizproc-webhook-pairs__add" data-testid="bizproc-webhook-pairs-add-${setId}">
				<span class="ui-icon-set --plus-l"></span>
				${Text.encode(options.addRowCaption ?? '')}
			</span>
		`;
		Event.bind(addButton, 'click', () => {
			Dom.append(this.#renderPairRow(options), rows);
			this.#notifyChange(rows);
		});

		return Tag.render`
			<div class="bizproc-webhook-pairs" data-testid="bizproc-webhook-pairs-${setId}">
				<div class="bizproc-webhook-pairs__head">
					<div class="bizproc-webhook-pairs__cell">${Text.encode(options.nameColumnCaption ?? '')}</div>
					<div class="bizproc-webhook-pairs__cell">${Text.encode(options.valueColumnCaption ?? '')}</div>
				</div>
				${rows}
				${addButton}
			</div>
		`;
	}

	static #countFilledPairs(table: HTMLElement): number
	{
		return [...table.querySelectorAll('.bizproc-webhook-pairs__name')]
			.filter((input) => input.value.trim() !== '')
			.length
		;
	}

	#renderBody(field: Field): HTMLElement
	{
		const options = this.#getOptions(field);
		const paired = options.pairedField ?? {};
		const select = this.#renderSelect(
			options.fieldName,
			options.selectOptions,
			field.value ?? options.defaultValue,
			'bizproc-webhook-body-type',
		);

		const text = this.#renderLabeledField(
			'',
			this.#renderEngineField(paired, options),
			'bizproc-webhook-body',
		);
		const pairsTable = this.#renderPairsTable(options.pairsOptions ?? {}, options.pairsValue);
		const pairs = this.#renderLabeledField('', pairsTable, 'bizproc-webhook-body-params');

		const showPairs = () => {
			const isPairsMode = select.value === options.pairsOptionValue;
			Dom.style(text, 'display', isPairsMode ? 'none' : '');
			Dom.style(pairs, 'display', isPairsMode ? '' : 'none');
		};
		Event.bind(select, 'change', showPairs);
		showPairs();

		const body = Tag.render`
			<div class="bizproc-webhook-fields">
				${this.#renderLabeledField(field.property.Name, select)}
				${text}
				${pairs}
			</div>
		`;

		return this.#renderSection(
			paired.Name ?? field.property.Name,
			body,
			'bizproc-webhook-section-body',
			() => options.selectOptions?.[select.value] ?? '',
		);
	}

	#renderExtra(field: Field): HTMLElement
	{
		const options = this.#getOptions(field);
		const paired = options.pairedField ?? {};
		const timeout = Tag.render`
			<input
				type="number"
				class="bizproc-webhook__input bizproc-webhook__timeout"
				data-testid="bizproc-webhook-timeout"
				name="${Text.encode(options.fieldName)}"
				min="${Text.encode(String(options.minValue ?? ''))}"
				max="${Text.encode(String(options.maxValue ?? ''))}"
				value="${Text.encode(String(field.value ?? options.defaultValue ?? ''))}"
			>
		`;
		const behaviour = this.#renderSelect(
			paired.FieldName,
			paired.Options,
			paired.Value ?? paired.Default,
			'bizproc-webhook-error-behaviour',
		);

		const body = Tag.render`
			<div class="bizproc-webhook-fields">
				${this.#renderLabeledField(field.property.Name, timeout)}
				${this.#renderLabeledField(paired.Name ?? '', behaviour)}
			</div>
		`;

		return this.#renderSection(
			options.sectionCaption ?? field.property.Name,
			body,
			'bizproc-webhook-section-extra',
			() => [timeout.value, paired.Options?.[behaviour.value]].filter(Boolean).join(SUMMARY_SEPARATOR),
		);
	}

	#renderTest(field: Field): HTMLElement
	{
		const options = this.#getOptions(field);
		const result = Tag.render`
			<div class="bizproc-webhook-test__result" data-testid="bizproc-webhook-test-result"></div>
		`;
		const button = new Button({
			text: options.buttonCaption ?? '',
			size: ButtonSize.MEDIUM,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			// The settings panel is a <form> without a submit handler: a button without type submits it
			// natively and navigates the designer away.
			props: { type: 'button', 'data-testid': 'bizproc-webhook-test-button' },
			onclick: () => this.#runTestRequest(button, result, options),
		});

		return Tag.render`
			<div class="bizproc-webhook-test" data-testid="bizproc-webhook-test">
				${button.render()}${result}
			</div>
		`;
	}

	async #runTestRequest(button: Button, result: HTMLElement, options: ControlOptions): Promise<void>
	{
		const form = button.getContainer().closest('form');
		if (!form)
		{
			return;
		}

		const request = this.#collectTestRequest(form);
		Dom.clean(result);

		if (this.#hasExpression(this.#pickFieldsInUse(request, options)))
		{
			Dom.append(this.#renderTestMessage(options.expressionWarning ?? ''), result);

			return;
		}

		button.setDisabled(true);
		const documentType = options.documentType ?? [];

		try
		{
			const response = await ajax.runAction('bizproc.activity.request', {
				data: {
					documentType,
					activity: ACTIVITY_TYPE,
					params: {
						...request,
						document_type: documentType,
						form_name: form.getAttribute('id') ?? ACTIVITY_TYPE,
					},
				},
			});

			this.#showTestResponse(result, response.data ?? {}, options);
		}
		catch (response)
		{
			Dom.append(this.#renderTestMessage(response?.errors?.[0]?.message ?? ''), result);
		}
		finally
		{
			button.setDisabled(false);
		}
	}

	#collectTestRequest(form: HTMLFormElement): Object
	{
		const values = ajax.prepareForm(form).data;
		const request = {};

		TEST_REQUEST_FIELDS.forEach((name) => {
			request[name] = values[name] ?? '';
		});

		return request;
	}

	#pickFieldsInUse(request: Object, options: ControlOptions): Object
	{
		const { body, body_params: bodyParams, ...fields } = request;

		if (!(options.methodsWithBody ?? []).includes(request.method))
		{
			return fields;
		}

		return request.body_type === options.formBodyType ? { ...fields, bodyParams } : { ...fields, body };
	}

	#hasExpression(value: mixed): boolean
	{
		if (Type.isString(value))
		{
			return EXPRESSION_PATTERNS.some((pattern) => pattern.test(value));
		}

		if (Type.isArray(value) || Type.isPlainObject(value))
		{
			return Object.values(value).some((item) => this.#hasExpression(item));
		}

		return false;
	}

	#showTestResponse(result: HTMLElement, data: TestResponse, options: ControlOptions): void
	{
		if (data.success !== true)
		{
			Dom.append(this.#renderTestMessage(String(data.errorMessage ?? '')), result);

			return;
		}

		Dom.append(this.#renderTestStatus(data, options), result);

		const body = String(data.responseBody ?? '');
		if (body !== '')
		{
			const bodyNode = Tag.render`
				<pre class="bizproc-webhook-test__body" data-testid="bizproc-webhook-test-body"></pre>
			`;
			Dom.adjust(bodyNode, { text: this.#getBodyPreview(body, options) });
			Dom.append(bodyNode, result);
		}
	}

	#getBodyPreview(body: string, options: ControlOptions): string
	{
		if (body.length <= BODY_PREVIEW_LENGTH_MAX)
		{
			return body;
		}

		return `${body.slice(0, BODY_PREVIEW_LENGTH_MAX)}\n\n${String(options.bodyTruncatedCaption ?? '')}`;
	}

	#renderTestStatus(data: TestResponse, options: ControlOptions): HTMLElement
	{
		const code = Text.toInteger(data.responseCode);
		const size = Text.toInteger(data.responseBodySize);
		const details = [
			this.#formatPhrase(options.durationCaption, '#MS#', Text.toInteger(data.durationMs)),
			this.#getContentType(data.responseHeaders),
			size === 0 ? '' : this.#formatPhrase(options.sizeCaption, '#SIZE#', size),
		];

		return Tag.render`
			<div class="bizproc-webhook-test__status" data-testid="bizproc-webhook-test-status">
				<span class="bizproc-webhook-test__code ${code >= HTTP_CODE_ERROR ? '--error' : '--success'}">
					${Text.encode(String(code))}
				</span>
				<span class="bizproc-webhook-test__details">
					${Text.encode(details.filter(Boolean).join(SUMMARY_SEPARATOR))}
				</span>
			</div>
		`;
	}

	#getContentType(headers: ?{ [string]: string }): string
	{
		const header = Object.entries(headers ?? {}).find(([name]) => name.toLowerCase() === 'content-type');

		return header ? String(header[1]).split(';')[0].trim() : '';
	}

	#formatPhrase(phrase: ?string, marker: string, value: number): string
	{
		return phrase ? phrase.replace(marker, String(value)) : '';
	}

	#renderTestMessage(text: string): HTMLElement
	{
		return this.#renderMessage(text, 'bizproc-webhook-test-message');
	}

	#renderMessage(text: string, testId: string): HTMLElement
	{
		const message = Tag.render`
			<div class="bizproc-webhook-test__message" data-testid="${Text.encode(testId)}"></div>
		`;
		Dom.adjust(message, { text });

		return message;
	}

	#renderSection(
		caption: string,
		body: HTMLElement,
		testId: string,
		buildSummary: () => string,
	): HTMLElement
	{
		const summary = Tag.render`<span class="bizproc-webhook-section__summary"></span>`;
		const section = Tag.render`
			<details class="bizproc-webhook-section" data-testid="${Text.encode(testId)}">
				<summary class="bizproc-webhook-section__header" data-testid="${Text.encode(testId)}-header">
					<span class="bizproc-webhook-section__caption">${Text.encode(caption)}</span>
					${summary}
				</summary>
				<div class="bizproc-webhook-section__body">${body}</div>
			</details>
		`;

		const refresh = () => Dom.adjust(summary, { text: buildSummary() });
		Event.bind(section, 'input', refresh);
		Event.bind(section, 'change', refresh);
		refresh();

		return section;
	}

	#renderPairRow(options: ControlOptions, pair: Pair = {}): HTMLElement
	{
		const index = this.#rowIndex++;
		const setId = OutgoingWebHookActivityRenderer.#toTestId(options.fieldName);
		const removeButton = Tag.render`
			<span class="bizproc-webhook-pairs__remove" data-testid="bizproc-webhook-pairs-remove-${setId}">
				<span class="ui-icon-set --cross-m"></span>
			</span>
		`;
		const valueField = this.#renderEngineField(
			{
				Type: 'string',
				Name: options.valueColumnCaption ?? '',
				FieldName: `${options.fieldName}[value][${index}]`,
				Value: pair.VALUE ?? '',
				AllowSelection: true,
			},
			options,
		);

		const row = Tag.render`
			<div class="bizproc-webhook-pairs__row" data-testid="bizproc-webhook-pairs-row-${setId}">
				<div class="bizproc-webhook-pairs__cell">
					<input
						type="text"
						class="bizproc-webhook__input bizproc-webhook-pairs__name"
						data-testid="bizproc-webhook-pairs-name-${setId}"
						name="${Text.encode(`${options.fieldName}[name][${index}]`)}"
						value="${Text.encode(pair.NAME ?? '')}"
					>
				</div>
				<div class="bizproc-webhook-pairs__cell" data-testid="bizproc-webhook-pairs-value-${setId}">
					${valueField}
				</div>
				${removeButton}
			</div>
		`;

		Event.bind(removeButton, 'click', () => {
			const container = row.parentElement;
			Dom.remove(row);
			this.#notifyChange(container);
		});

		return row;
	}

	#notifyChange(node: ?HTMLElement): void
	{
		node?.dispatchEvent(new window.Event('change', { bubbles: true }));
	}

	#renderLabeledField(caption: string, control: HTMLElement, testId: string = ''): HTMLElement
	{
		return Tag.render`
			<div class="bizproc-webhook-fields__item" data-testid="${Text.encode(testId)}">
				<div class="bizproc-webhook-fields__label">${Text.encode(caption)}</div>
				${control}
			</div>
		`;
	}

	#renderSelect(name: string, selectOptions: ?SelectOptions, value: mixed, testId: string): HTMLElement
	{
		const current = String(value ?? '');
		const select = Tag.render`
			<select
				class="bizproc-webhook__select"
				data-testid="${Text.encode(testId)}"
				name="${Text.encode(name ?? '')}"
			></select>
		`;

		Object.entries(selectOptions ?? {}).forEach(([optionValue, label]) => {
			Dom.append(
				Tag.render`
					<option value="${Text.encode(optionValue)}" ${optionValue === current ? 'selected' : ''}>
						${Text.encode(String(label))}
					</option>
				`,
				select,
			);
		});

		return select;
	}

	// The engine renders the field server-side, so every call would cost its own request: collected here
	// and flushed in one batch. The settings panel learns that the fields have arrived through
	// whenControlsRendered(): every property of this activity is custom, so the panel itself renders none.
	#renderEngineField(field: RenderableField, options: ControlOptions): HTMLElement
	{
		const container = Tag.render`<div class="bizproc-webhook__engine-field"></div>`;
		const fieldName = field.FieldName ?? '';

		this.#pendingFields.push({
			container,
			options,
			item: {
				controlId: fieldName,
				fieldName,
				value: field.Value ?? field.Default ?? '',
				property: field,
			},
		});

		if (!this.#isFlushScheduled)
		{
			this.#isFlushScheduled = true;
			queueMicrotask(() => this.#flushEngineFields());
		}

		return container;
	}

	/** The settings panel awaits it before it treats the form as rendered: the engine fills the fields asynchronously. */
	whenControlsRendered(): Promise<void>
	{
		this.#flushEngineFields();

		return Promise.all(this.#renderings).then(() => undefined);
	}

	destroy(): void
	{
		this.#renderFinishedHandlers.forEach((handler) => Event.EventEmitter.unsubscribe(RENDER_FINISHED_EVENT, handler));
		this.#renderFinishedHandlers.clear();
	}

	#whenNodesRendered(nodes: Array<HTMLElement>): Promise<void>
	{
		if (nodes.length === 0)
		{
			return Promise.resolve();
		}

		return new Promise((resolve) => {
			const handler = () => {
				if (!nodes.every((node) => node.childElementCount > 0 || node.textContent !== '...'))
				{
					return;
				}

				Event.EventEmitter.unsubscribe(RENDER_FINISHED_EVENT, handler);
				this.#renderFinishedHandlers.delete(handler);
				resolve();
			};
			this.#renderFinishedHandlers.add(handler);
			Event.EventEmitter.subscribe(RENDER_FINISHED_EVENT, handler);
		});
	}

	#flushEngineFields(): void
	{
		this.#isFlushScheduled = false;

		const pending = this.#pendingFields;
		this.#pendingFields = [];
		if (pending.length === 0)
		{
			return;
		}

		const rendered = BX.Bizproc.FieldType.renderControlCollection(
			pending[0].options.documentType ?? [],
			pending.map(({ item }) => item),
			RENDER_MODE,
		);

		this.#renderings.push(
			this.#whenNodesRendered(pending.map(({ item }) => rendered[item.controlId]).filter(Boolean)),
		);

		pending.forEach(({ item, container, options }) => {
			const node = rendered[item.controlId];
			Dom.append(
				node ?? this.#renderMessage(options.fieldErrorCaption ?? '', 'bizproc-webhook-field-error'),
				container,
			);
		});
	}

	#getOptions(field: Field): ControlOptions
	{
		return field.property?.Options ?? {};
	}

	static #toTestId(fieldName: ?string): string
	{
		return String(fieldName ?? '').replaceAll('_', '-');
	}

	#toPairs(value: mixed): Array<Pair>
	{
		if (Type.isArray(value))
		{
			return value;
		}

		return Type.isPlainObject(value) ? Object.values(value) : [];
	}
}
