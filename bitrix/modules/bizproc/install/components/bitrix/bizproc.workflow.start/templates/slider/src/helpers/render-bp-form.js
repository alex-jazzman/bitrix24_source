import { Tag, Text, Type, Event, Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { labelFormControls } from 'bizproc.a11y';
import type { Property } from '../types/property';

import 'bp_field_type';
import 'ui.forms';

import '../css/form.css';

const FIELD_BLOCK_SELECTOR = '.bizproc__ws_start__content-form-block';
const FIELD_LABEL_SELECTOR = '.ui-ctl-title';
const FIELD_CONTROL_SELECTOR = 'input:not([type="hidden"]), select, textarea';
const CONTROL_RENDER_EVENTS = [
	'BX.Bizproc.FieldType.onCustomRenderControlFinished',
	'BX.Bizproc.FieldType.onCollectionRenderControlFinished',
];
const DEFAULT_TITLE_LEVEL = 2;

type RenderBpFormOptions = {
	description?: ?string,
	signedDocumentId?: ?string,
	onSubmit?: ?Function,
	// heading level of the form title; null keeps the title out of the accessibility tree
	titleLevel?: ?number,
};

export function renderBpForm(
	formName: string,
	title: string,
	fields: Array<Property>,
	documentType: [],
	options: RenderBpFormOptions = {},
): HTMLFormElement
{
	const {
		description = null,
		signedDocumentId = null,
		onSubmit = null,
		titleLevel = DEFAULT_TITLE_LEVEL,
	} = options;

	let context = {};
	if (Type.isStringFilled(signedDocumentId))
	{
		context = { isStartWorkflow: true, signedDocumentId };
	}

	const controls = BX.Bizproc.FieldType.renderControlCollection(
		documentType,
		fields.map((field) => ({
			property: field,
			fieldName: field.Id,
			value: field.Default,
			controlId: field.Id,
		})),
		'public',
		context,
	);

	const form = Tag.render`
		<form name="${formName}" data-testid="${formName}">
			<div class="bizproc__ws_start__content-form-title-block">
				${renderFormTitle(title, titleLevel)}
				<div class="bizproc__ws_start__content-form-description">${Text.encode(description)}</div>
			</div>
				${fields.map((property) => {
		const control = (
			Type.isElementNode(controls[property.Id])
				? controls[property.Id]
				: BX.Bizproc.FieldType.renderControlPublic(
					documentType,
					property,
					property.Id,
					property.Default,
					false,
				)
		);

		return renderBpFieldForForm(property, control);
	})}
		</form>
	`;

	Event.bind(form, 'submit', (event) => {
		event.preventDefault();
		if (Type.isFunction(onSubmit))
		{
			onSubmit(event);
		}
	});

	const requiredFieldNames = fields
		.filter((field) => Text.toBoolean(field.Required))
		.map((field) => field.Id)
	;

	const describeControls = () => {
		labelControls(form);
		markRequiredControls(form, requiredFieldNames);
	};

	describeControls();
	CONTROL_RENDER_EVENTS.forEach((eventName) => {
		// multiple fields and entity selectors draw their controls after the form is built
		EventEmitter.subscribe(eventName, describeControls);
	});

	return form;
}

export function renderBpFieldForForm(property: Property, control: HTMLElement): HTMLElement
{
	const isRequired = Text.toBoolean(property.Required);

	return Tag.render`
		<div class="bizproc__ws_start__content-form-block" data-testid="bizproc-ws-start-field-${Text.encode(property.Id)}">
			<div class="ui-ctl-title${isRequired ? ' --required' : ''}">
				${Text.encode(property.Name)}
			</div>
			${control}
		</div>
	`;
}

function renderFormTitle(title: string, level: ?number): HTMLElement
{
	const node = Tag.render`
		<div class="bizproc__ws_start__content-form-title">${Text.encode(title)}</div>
	`;

	if (Type.isNumber(level))
	{
		Dom.attr(node, { role: 'heading', 'aria-level': String(level) });
	}
	else
	{
		// the surrounding step already renders a heading with the same text
		Dom.attr(node, 'aria-hidden', 'true');
	}

	return node;
}

function labelControls(form: HTMLFormElement): void
{
	labelFormControls(form, {
		blockSelector: FIELD_BLOCK_SELECTOR,
		labelSelector: FIELD_LABEL_SELECTOR,
	});
}

function markRequiredControls(form: HTMLFormElement, fieldNames: Array<string>): void
{
	if (fieldNames.length === 0)
	{
		return;
	}

	[...form.querySelectorAll(FIELD_CONTROL_SELECTOR)]
		// a date field also renders a timezone select, it carries another name
		.filter((node) => fieldNames.some((name) => node.name === name || node.name === `${name}[]`))
		.forEach((node) => Dom.attr(node, 'aria-required', 'true'))
	;
}
