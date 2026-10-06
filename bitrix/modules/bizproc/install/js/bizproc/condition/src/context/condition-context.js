import { Type, Text, Event, Tag, Dom } from 'main.core';
import { Menu } from 'main.popup';

import type { Field } from '../selectors/types';
import { DelayInterval } from '../date/delay-interval';
import { DelayIntervalSelector } from '../date/delay-interval-selector';
import { InlineTimeSelector } from '../date/inline-time-selector';

/**
 * Injection seam between the context-agnostic condition control and its
 * environment. All methods are lazy - they are called while the control renders.
 * The robot-flavoured implementation lives in `bizproc.automation`
 * (`AutomationConditionContext`); the default lives here (`SimpleConditionContext`).
 */
export class ConditionContext
{
	getFields(): Array<Field>
	{
		return [];
	}

	setFields(fields: Array<Field>): void
	{}

	resolveField(object: string, id: string): Field
	{
		return this.createSyntheticField(object, id);
	}

	getDocumentType(): ?Array<any>
	{
		return null;
	}

	getTitle(): string
	{
		return '';
	}

	createValueSelector(node: HTMLElement, ctx: Object): ?Object
	{
		return null;
	}

	createFieldMenu(condition: Object, ctx: Object): ?Object
	{
		return null;
	}

	createSyntheticField(object: string, id: string): Field
	{
		return {
			Id: id,
			ObjectId: object,
			Name: id,
			Type: 'string',
			Expression: id,
			SystemExpression: `{=${object}:${id}}`,
		};
	}
}

/**
 * Default, robot-free implementation. Fields/documentType/title come straight
 * from the data it is built with (constructor options or `setFields`). The
 * value-selector wraps a runtime callback and owns its date expression editor;
 * the field menu is built from the plain field list.
 */
export class SimpleConditionContext extends ConditionContext
{
	#fields: Array<Field>;
	#documentType: ?Array<any>;
	#title: string;

	constructor(options: ?Object)
	{
		super();

		this.#fields = [];
		this.#documentType = null;
		this.#title = '';

		if (Type.isPlainObject(options))
		{
			if (Type.isArray(options.fields))
			{
				this.#fields = options.fields;
			}

			if (Type.isArray(options.documentType))
			{
				this.#documentType = options.documentType;
			}

			if (Type.isStringFilled(options.title))
			{
				this.#title = options.title;
			}
		}
	}

	getFields(): Array<Field>
	{
		return this.#fields;
	}

	setFields(fields: Array<Field>): void
	{
		this.#fields = Type.isArray(fields) ? fields : [];
	}

	resolveField(object: string, id: string): Field
	{
		let field;
		if (object === 'Document')
		{
			for (let i = 0; i < this.#fields.length; ++i)
			{
				if (id === this.#fields[i].Id)
				{
					field = this.#fields[i];
				}
			}
		}

		return field || this.createSyntheticField(object, id);
	}

	getDocumentType(): ?Array<any>
	{
		return this.#documentType;
	}

	getTitle(): string
	{
		return this.#title;
	}

	createValueSelector(node: HTMLElement, ctx: Object): ?Object
	{
		const customSelectorFn = ctx?.customSelectorFn;
		const isDate = ['date', 'datetime'].includes(node.getAttribute('data-selector-type'));
		const isTime = node.getAttribute('data-selector-type') === 'time';
		const basisFields = this.#fields.filter((field) => (
			field.Type === 'date' || field.Type === 'datetime' || field.Type === 'UF:date'
		));

		return {
			subscribe() {},
			parseTargetProperties() {},
			targetInput: null,
			renderTo(target: HTMLElement): void
			{
				if (!(target instanceof HTMLElement) || !target.parentNode)
				{
					return;
				}

				target.setAttribute('autocomplete', 'off');
				if (!target.id)
				{
					target.id = `${target.getAttribute('name') || 'bp-condition-value'}-${Text.getRandom()}`;
				}

				const calendarIcon = target.parentNode.querySelector('.calendar-icon');
				if (calendarIcon)
				{
					Dom.remove(calendarIcon);
				}

				const dotted = Tag.render`<span class="bizproc-automation-popup-select-dotted" data-testid="bp-condition-value-dotted"></span>`;
				if (Type.isFunction(customSelectorFn))
				{
					Event.bind(dotted, 'click', () => customSelectorFn(target.id));
				}

				const wrapper = Tag.render`<div class="bizproc-automation-popup-select"></div>`;
				target.parentNode.replaceChild(wrapper, target);
				wrapper.appendChild(target);
				if (isDate)
				{
					new DelayIntervalSelector({
						labelNode: target,
						basisFields,
						useAfterBasis: true,
						onchange: (delay) => {
							target.value = delay.toExpression(basisFields);
							BX.fireEvent(target, 'change');
						},
					}).init(DelayInterval.fromString(target.value, basisFields));
				}
				else if (isTime)
				{
					new InlineTimeSelector({
						onchange: (input) => {
							BX.fireEvent(input, 'change');
						},
					}).renderTo(target);
				}
				wrapper.appendChild(dotted);
			},
		};
	}

	createFieldMenu(condition: Object, ctx: Object): ?Object
	{
		const fields = Type.isArrayFilled(ctx?.fields) ? ctx.fields : this.#fields;

		const menu = new Menu({
			id: `bp-condition-field-menu-${Text.getRandom()}`,
			bindElement: ctx?.target,
			items: fields.map((field) => ({
				text: Text.encode(field.Name),
				onclick: () => {
					menu.close();
					if (Type.isFunction(ctx?.onFieldChange))
					{
						ctx.onFieldChange({ ...field, ObjectId: field.ObjectId ?? 'Document' });
					}
				},
			})),
		});

		return {
			openMenu: () => menu.show(),
			destroy: () => menu.destroy(),
		};
	}
}
