/* eslint-disable */
(function (exports, main_core, ui_buttons) {
	'use strict';

	const RENDER_MODE = 'designer';
	const RENDER_FINISHED_EVENT = 'BX.Bizproc.FieldType.onCollectionRenderControlFinished';
	const SUMMARY_SEPARATOR = ' · ';
	const ACTIVITY_TYPE = 'OutgoingWebHookActivity';
	const EXPRESSION_PATTERNS = [/\{=\s*[a-z0-9_]+\s*:\s*[a-z0-9_.]+(\s*>\s*[a-z0-9_:]+(\s*,\s*[a-z0-9_]+)?)?\s*\}/i, /\{\{=[\s\S]*?\}\}(?=[^}]|$)/, /^\s*=/, /^\s*\{\{[\s\S]*?\}\}\s*$/];
	const HTTP_CODE_ERROR = 300;
	const BODY_PREVIEW_LENGTH_MAX = 4096;
	const TEST_REQUEST_FIELDS = ['method', 'url', 'query_params', 'headers', 'body_type', 'body', 'body_params', 'timeout'];
	class OutgoingWebHookActivityRenderer {
		#pendingFields = [];
		#isFlushScheduled = false;
		#renderings = [];
		#renderFinishedHandlers = new Set();
		#rowIndex = 0;
		getControlRenderers() {
			return {
				webhookRequestLine: field => this.#renderRequestLine(field),
				webhookParams: field => this.#renderParams(field),
				webhookBody: field => this.#renderBody(field),
				webhookExtra: field => this.#renderExtra(field),
				webhookTest: field => this.#renderTest(field)
			};
		}
		#renderRequestLine(field) {
			const options = this.#getOptions(field);
			const paired = options.pairedField ?? {};
			return main_core.Tag.render`
			<div class="bizproc-webhook-request-line" data-testid="bizproc-webhook-request-line">
				<div class="bizproc-webhook-request-line__method">
					${this.#renderSelect(options.fieldName, options.selectOptions, field.value ?? options.defaultValue, 'bizproc-webhook-method')}
				</div>
				<div class="bizproc-webhook-request-line__url" data-testid="bizproc-webhook-url">
					${this.#renderEngineField(paired, options)}
				</div>
			</div>
		`;
		}
		#renderParams(field) {
			const options = this.#getOptions(field);
			const table = this.#renderPairsTable(options, field.value);
			return this.#renderSection(field.property.Name, table, `bizproc-webhook-section-${OutgoingWebHookActivityRenderer.#toTestId(options.fieldName)}`, () => {
				const filled = OutgoingWebHookActivityRenderer.#countFilledPairs(table);
				return filled > 0 ? String(filled) : '';
			});
		}
		#renderPairsTable(options, value) {
			const rows = main_core.Tag.render`<div class="bizproc-webhook-pairs__rows"></div>`;
			this.#toPairs(value).forEach(pair => main_core.Dom.append(this.#renderPairRow(options, pair), rows));
			const setId = OutgoingWebHookActivityRenderer.#toTestId(options.fieldName);
			const addButton = main_core.Tag.render`
			<span class="bizproc-webhook-pairs__add" data-testid="bizproc-webhook-pairs-add-${setId}">
				<span class="ui-icon-set --plus-l"></span>
				${main_core.Text.encode(options.addRowCaption ?? '')}
			</span>
		`;
			main_core.Event.bind(addButton, 'click', () => {
				main_core.Dom.append(this.#renderPairRow(options), rows);
				this.#notifyChange(rows);
			});
			return main_core.Tag.render`
			<div class="bizproc-webhook-pairs" data-testid="bizproc-webhook-pairs-${setId}">
				<div class="bizproc-webhook-pairs__head">
					<div class="bizproc-webhook-pairs__cell">${main_core.Text.encode(options.nameColumnCaption ?? '')}</div>
					<div class="bizproc-webhook-pairs__cell">${main_core.Text.encode(options.valueColumnCaption ?? '')}</div>
				</div>
				${rows}
				${addButton}
			</div>
		`;
		}
		static #countFilledPairs(table) {
			return [...table.querySelectorAll('.bizproc-webhook-pairs__name')].filter(input => input.value.trim() !== '').length;
		}
		#renderBody(field) {
			const options = this.#getOptions(field);
			const paired = options.pairedField ?? {};
			const select = this.#renderSelect(options.fieldName, options.selectOptions, field.value ?? options.defaultValue, 'bizproc-webhook-body-type');
			const text = this.#renderLabeledField('', this.#renderEngineField(paired, options), 'bizproc-webhook-body');
			const pairsTable = this.#renderPairsTable(options.pairsOptions ?? {}, options.pairsValue);
			const pairs = this.#renderLabeledField('', pairsTable, 'bizproc-webhook-body-params');
			const showPairs = () => {
				const isPairsMode = select.value === options.pairsOptionValue;
				main_core.Dom.style(text, 'display', isPairsMode ? 'none' : '');
				main_core.Dom.style(pairs, 'display', isPairsMode ? '' : 'none');
			};
			main_core.Event.bind(select, 'change', showPairs);
			showPairs();
			const body = main_core.Tag.render`
			<div class="bizproc-webhook-fields">
				${this.#renderLabeledField(field.property.Name, select)}
				${text}
				${pairs}
			</div>
		`;
			return this.#renderSection(paired.Name ?? field.property.Name, body, 'bizproc-webhook-section-body', () => options.selectOptions?.[select.value] ?? '');
		}
		#renderExtra(field) {
			const options = this.#getOptions(field);
			const paired = options.pairedField ?? {};
			const timeout = main_core.Tag.render`
			<input
				type="number"
				class="bizproc-webhook__input bizproc-webhook__timeout"
				data-testid="bizproc-webhook-timeout"
				name="${main_core.Text.encode(options.fieldName)}"
				min="${main_core.Text.encode(String(options.minValue ?? ''))}"
				max="${main_core.Text.encode(String(options.maxValue ?? ''))}"
				value="${main_core.Text.encode(String(field.value ?? options.defaultValue ?? ''))}"
			>
		`;
			const behaviour = this.#renderSelect(paired.FieldName, paired.Options, paired.Value ?? paired.Default, 'bizproc-webhook-error-behaviour');
			const body = main_core.Tag.render`
			<div class="bizproc-webhook-fields">
				${this.#renderLabeledField(field.property.Name, timeout)}
				${this.#renderLabeledField(paired.Name ?? '', behaviour)}
			</div>
		`;
			return this.#renderSection(options.sectionCaption ?? field.property.Name, body, 'bizproc-webhook-section-extra', () => [timeout.value, paired.Options?.[behaviour.value]].filter(Boolean).join(SUMMARY_SEPARATOR));
		}
		#renderTest(field) {
			const options = this.#getOptions(field);
			const result = main_core.Tag.render`
			<div class="bizproc-webhook-test__result" data-testid="bizproc-webhook-test-result"></div>
		`;
			const button = new ui_buttons.Button({
				text: options.buttonCaption ?? '',
				size: ui_buttons.ButtonSize.MEDIUM,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				// The settings panel is a <form> without a submit handler: a button without type submits it
				// natively and navigates the designer away.
				props: {
					type: 'button',
					'data-testid': 'bizproc-webhook-test-button'
				},
				onclick: () => this.#runTestRequest(button, result, options)
			});
			return main_core.Tag.render`
			<div class="bizproc-webhook-test" data-testid="bizproc-webhook-test">
				${button.render()}${result}
			</div>
		`;
		}
		async #runTestRequest(button, result, options) {
			const form = button.getContainer().closest('form');
			if (!form) {
				return;
			}
			const request = this.#collectTestRequest(form);
			main_core.Dom.clean(result);
			if (this.#hasExpression(this.#pickFieldsInUse(request, options))) {
				main_core.Dom.append(this.#renderTestMessage(options.expressionWarning ?? ''), result);
				return;
			}
			button.setDisabled(true);
			const documentType = options.documentType ?? [];
			try {
				const response = await main_core.ajax.runAction('bizproc.activity.request', {
					data: {
						documentType,
						activity: ACTIVITY_TYPE,
						params: {
							...request,
							document_type: documentType,
							form_name: form.getAttribute('id') ?? ACTIVITY_TYPE
						}
					}
				});
				this.#showTestResponse(result, response.data ?? {}, options);
			} catch (response) {
				main_core.Dom.append(this.#renderTestMessage(response?.errors?.[0]?.message ?? ''), result);
			} finally {
				button.setDisabled(false);
			}
		}
		#collectTestRequest(form) {
			const values = main_core.ajax.prepareForm(form).data;
			const request = {};
			TEST_REQUEST_FIELDS.forEach(name => {
				request[name] = values[name] ?? '';
			});
			return request;
		}
		#pickFieldsInUse(request, options) {
			const {
				body,
				body_params: bodyParams,
				...fields
			} = request;
			if (!(options.methodsWithBody ?? []).includes(request.method)) {
				return fields;
			}
			return request.body_type === options.formBodyType ? {
				...fields,
				bodyParams
			} : {
				...fields,
				body
			};
		}
		#hasExpression(value) {
			if (main_core.Type.isString(value)) {
				return EXPRESSION_PATTERNS.some(pattern => pattern.test(value));
			}
			if (main_core.Type.isArray(value) || main_core.Type.isPlainObject(value)) {
				return Object.values(value).some(item => this.#hasExpression(item));
			}
			return false;
		}
		#showTestResponse(result, data, options) {
			if (data.success !== true) {
				main_core.Dom.append(this.#renderTestMessage(String(data.errorMessage ?? '')), result);
				return;
			}
			main_core.Dom.append(this.#renderTestStatus(data, options), result);
			const body = String(data.responseBody ?? '');
			if (body !== '') {
				const bodyNode = main_core.Tag.render`
				<pre class="bizproc-webhook-test__body" data-testid="bizproc-webhook-test-body"></pre>
			`;
				main_core.Dom.adjust(bodyNode, {
					text: this.#getBodyPreview(body, options)
				});
				main_core.Dom.append(bodyNode, result);
			}
		}
		#getBodyPreview(body, options) {
			if (body.length <= BODY_PREVIEW_LENGTH_MAX) {
				return body;
			}
			return `${body.slice(0, BODY_PREVIEW_LENGTH_MAX)}\n\n${String(options.bodyTruncatedCaption ?? '')}`;
		}
		#renderTestStatus(data, options) {
			const code = main_core.Text.toInteger(data.responseCode);
			const size = main_core.Text.toInteger(data.responseBodySize);
			const details = [this.#formatPhrase(options.durationCaption, '#MS#', main_core.Text.toInteger(data.durationMs)), this.#getContentType(data.responseHeaders), size === 0 ? '' : this.#formatPhrase(options.sizeCaption, '#SIZE#', size)];
			return main_core.Tag.render`
			<div class="bizproc-webhook-test__status" data-testid="bizproc-webhook-test-status">
				<span class="bizproc-webhook-test__code ${code >= HTTP_CODE_ERROR ? '--error' : '--success'}">
					${main_core.Text.encode(String(code))}
				</span>
				<span class="bizproc-webhook-test__details">
					${main_core.Text.encode(details.filter(Boolean).join(SUMMARY_SEPARATOR))}
				</span>
			</div>
		`;
		}
		#getContentType(headers) {
			const header = Object.entries(headers ?? {}).find(([name]) => name.toLowerCase() === 'content-type');
			return header ? String(header[1]).split(';')[0].trim() : '';
		}
		#formatPhrase(phrase, marker, value) {
			return phrase ? phrase.replace(marker, String(value)) : '';
		}
		#renderTestMessage(text) {
			return this.#renderMessage(text, 'bizproc-webhook-test-message');
		}
		#renderMessage(text, testId) {
			const message = main_core.Tag.render`
			<div class="bizproc-webhook-test__message" data-testid="${main_core.Text.encode(testId)}"></div>
		`;
			main_core.Dom.adjust(message, {
				text
			});
			return message;
		}
		#renderSection(caption, body, testId, buildSummary) {
			const summary = main_core.Tag.render`<span class="bizproc-webhook-section__summary"></span>`;
			const section = main_core.Tag.render`
			<details class="bizproc-webhook-section" data-testid="${main_core.Text.encode(testId)}">
				<summary class="bizproc-webhook-section__header" data-testid="${main_core.Text.encode(testId)}-header">
					<span class="bizproc-webhook-section__caption">${main_core.Text.encode(caption)}</span>
					${summary}
				</summary>
				<div class="bizproc-webhook-section__body">${body}</div>
			</details>
		`;
			const refresh = () => main_core.Dom.adjust(summary, {
				text: buildSummary()
			});
			main_core.Event.bind(section, 'input', refresh);
			main_core.Event.bind(section, 'change', refresh);
			refresh();
			return section;
		}
		#renderPairRow(options, pair = {}) {
			const index = this.#rowIndex++;
			const setId = OutgoingWebHookActivityRenderer.#toTestId(options.fieldName);
			const removeButton = main_core.Tag.render`
			<span class="bizproc-webhook-pairs__remove" data-testid="bizproc-webhook-pairs-remove-${setId}">
				<span class="ui-icon-set --cross-m"></span>
			</span>
		`;
			const valueField = this.#renderEngineField({
				Type: 'string',
				Name: options.valueColumnCaption ?? '',
				FieldName: `${options.fieldName}[value][${index}]`,
				Value: pair.VALUE ?? '',
				AllowSelection: true
			}, options);
			const row = main_core.Tag.render`
			<div class="bizproc-webhook-pairs__row" data-testid="bizproc-webhook-pairs-row-${setId}">
				<div class="bizproc-webhook-pairs__cell">
					<input
						type="text"
						class="bizproc-webhook__input bizproc-webhook-pairs__name"
						data-testid="bizproc-webhook-pairs-name-${setId}"
						name="${main_core.Text.encode(`${options.fieldName}[name][${index}]`)}"
						value="${main_core.Text.encode(pair.NAME ?? '')}"
					>
				</div>
				<div class="bizproc-webhook-pairs__cell" data-testid="bizproc-webhook-pairs-value-${setId}">
					${valueField}
				</div>
				${removeButton}
			</div>
		`;
			main_core.Event.bind(removeButton, 'click', () => {
				const container = row.parentElement;
				main_core.Dom.remove(row);
				this.#notifyChange(container);
			});
			return row;
		}
		#notifyChange(node) {
			node?.dispatchEvent(new window.Event('change', {
				bubbles: true
			}));
		}
		#renderLabeledField(caption, control, testId = '') {
			return main_core.Tag.render`
			<div class="bizproc-webhook-fields__item" data-testid="${main_core.Text.encode(testId)}">
				<div class="bizproc-webhook-fields__label">${main_core.Text.encode(caption)}</div>
				${control}
			</div>
		`;
		}
		#renderSelect(name, selectOptions, value, testId) {
			const current = String(value ?? '');
			const select = main_core.Tag.render`
			<select
				class="bizproc-webhook__select"
				data-testid="${main_core.Text.encode(testId)}"
				name="${main_core.Text.encode(name ?? '')}"
			></select>
		`;
			Object.entries(selectOptions ?? {}).forEach(([optionValue, label]) => {
				main_core.Dom.append(main_core.Tag.render`
					<option value="${main_core.Text.encode(optionValue)}" ${optionValue === current ? 'selected' : ''}>
						${main_core.Text.encode(String(label))}
					</option>
				`, select);
			});
			return select;
		}

		// The engine renders the field server-side, so every call would cost its own request: collected here
		// and flushed in one batch. The settings panel learns that the fields have arrived through
		// whenControlsRendered(): every property of this activity is custom, so the panel itself renders none.
		#renderEngineField(field, options) {
			const container = main_core.Tag.render`<div class="bizproc-webhook__engine-field"></div>`;
			const fieldName = field.FieldName ?? '';
			this.#pendingFields.push({
				container,
				options,
				item: {
					controlId: fieldName,
					fieldName,
					value: field.Value ?? field.Default ?? '',
					property: field
				}
			});
			if (!this.#isFlushScheduled) {
				this.#isFlushScheduled = true;
				queueMicrotask(() => this.#flushEngineFields());
			}
			return container;
		}

		/** The settings panel awaits it before it treats the form as rendered: the engine fills the fields asynchronously. */
		whenControlsRendered() {
			this.#flushEngineFields();
			return Promise.all(this.#renderings).then(() => undefined);
		}
		destroy() {
			this.#renderFinishedHandlers.forEach(handler => main_core.Event.EventEmitter.unsubscribe(RENDER_FINISHED_EVENT, handler));
			this.#renderFinishedHandlers.clear();
		}
		#whenNodesRendered(nodes) {
			if (nodes.length === 0) {
				return Promise.resolve();
			}
			return new Promise(resolve => {
				const handler = () => {
					if (!nodes.every(node => node.childElementCount > 0 || node.textContent !== '...')) {
						return;
					}
					main_core.Event.EventEmitter.unsubscribe(RENDER_FINISHED_EVENT, handler);
					this.#renderFinishedHandlers.delete(handler);
					resolve();
				};
				this.#renderFinishedHandlers.add(handler);
				main_core.Event.EventEmitter.subscribe(RENDER_FINISHED_EVENT, handler);
			});
		}
		#flushEngineFields() {
			this.#isFlushScheduled = false;
			const pending = this.#pendingFields;
			this.#pendingFields = [];
			if (pending.length === 0) {
				return;
			}
			const rendered = BX.Bizproc.FieldType.renderControlCollection(pending[0].options.documentType ?? [], pending.map(({
				item
			}) => item), RENDER_MODE);
			this.#renderings.push(this.#whenNodesRendered(pending.map(({
				item
			}) => rendered[item.controlId]).filter(Boolean)));
			pending.forEach(({
				item,
				container,
				options
			}) => {
				const node = rendered[item.controlId];
				main_core.Dom.append(node ?? this.#renderMessage(options.fieldErrorCaption ?? '', 'bizproc-webhook-field-error'), container);
			});
		}
		#getOptions(field) {
			return field.property?.Options ?? {};
		}
		static #toTestId(fieldName) {
			return String(fieldName ?? '').replaceAll('_', '-');
		}
		#toPairs(value) {
			if (main_core.Type.isArray(value)) {
				return value;
			}
			return main_core.Type.isPlainObject(value) ? Object.values(value) : [];
		}
	}

	exports.OutgoingWebHookActivityRenderer = OutgoingWebHookActivityRenderer;

})(this.window = this.window || {}, BX, BX.UI);
//# sourceMappingURL=renderer.js.map
