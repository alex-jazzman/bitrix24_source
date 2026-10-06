import { Type, Runtime } from 'main.core';
import {
	Designer,
	getGlobalContext,
	InlineSelectorCondition,
	SelectorContext,
	SelectorManager,
} from 'bizproc.automation';
import { ConditionContext, ConditionGroupSelector } from 'bizproc.condition';

/**
 * Robot-flavoured ConditionContext. Fields/documentType/title come from
 * the robots designer environment (`getGlobalContext` / `Designer`); the
 * value-selector and field-menu are built from the robots infrastructure
 * (`SelectorManager` / `SelectorContext` / `InlineSelectorCondition`). This is the
 * only place the condition control reaches into `bizproc.automation` internals.
 */
export class AutomationConditionContext extends ConditionContext
{
	#fields: Array<Object>;

	constructor(options: ?Object)
	{
		super();

		this.#fields = [];
		if (Type.isPlainObject(options) && Type.isArray(options.fields))
		{
			this.#fields = options.fields;
		}
	}

	getFields(): Array<Object>
	{
		return this.#fields;
	}

	setFields(fields: Array<Object>): void
	{
		this.#fields = Type.isArray(fields) ? fields : [];
	}

	resolveField(object: string, id: string): Object
	{
		let field;
		const robot = Designer.getInstance().robot;
		const component = Designer.getInstance().component;
		const tpl = robot ? robot.getTemplate() : null;

		switch (object)
		{
			case 'Document':
				for (let i = 0; i < this.#fields.length; ++i)
				{
					if (id === this.#fields[i].Id)
					{
						field = this.#fields[i];
					}
				}
				break;
			case 'Template':
				if (tpl && component && component.triggerManager)
				{
					field = component.triggerManager.getReturnProperty(tpl.getStatusId(), id);
				}
				break;
			case 'Constant':
				if (tpl)
				{
					field = tpl.getConstant(id);
				}
				break;
			case 'GlobalConst':
				if (component)
				{
					field = component.getConstant(id);
				}
				break;
			case 'GlobalVar':
				if (component)
				{
					field = component.getGVariable(id);
				}
				break;
			default:
				var foundRobot = tpl ? tpl.getRobotById(object) : null;
				if (foundRobot)
				{
					field = foundRobot.getReturnProperty(id);
				}
				break;
		}

		return field || this.createSyntheticField(object, id);
	}

	getDocumentType(): ?Array<any>
	{
		const currentDocument = (
			Designer.getInstance().component
				? Designer.getInstance().component.document
				: getGlobalContext().document
		);

		return [...currentDocument.getRawType(), currentDocument.getCategoryId()];
	}

	getTitle(): string
	{
		return getGlobalContext().document.title;
	}

	createValueSelector(node: HTMLElement, ctx: Object): ?Object
	{
		return SelectorManager.createSelectorByRole(node.dataset.role, {
			context: new SelectorContext({
				fields: getGlobalContext().document.getFields(),
				useSwitcherMenu: false,
				rootGroupTitle: ctx?.rootGroupTitle ?? getGlobalContext().document.title,
			}),
			customSelectorFn: ctx?.customSelectorFn,
		});
	}

	createFieldMenu(condition: Object, ctx: Object): ?Object
	{
		const globalContext = getGlobalContext();
		const fields = Runtime.clone(
			Type.isArrayFilled(ctx?.fields) ? ctx.fields : globalContext.document.getFields(),
		);

		const dialog = new InlineSelectorCondition({
			context: new SelectorContext({
				fields,
				rootGroupTitle: globalContext.document.title,
			}),
			condition,
		});

		if (Type.isFunction(ctx?.onOpenFieldMenu))
		{
			dialog.subscribe('onOpenMenu', ctx.onOpenFieldMenu);
		}

		dialog.subscribe('change', (event) => {
			if (Type.isFunction(ctx?.onFieldChange))
			{
				ctx.onFieldChange(event.getData().field);
			}
		});

		dialog.renderTo(ctx?.target);

		return dialog;
	}
}

/**
 * BC wrapper. Existing consumers import `ConditionGroupSelector` from
 * `bizproc.automation` and never pass a context; keep them working by injecting
 * an `AutomationConditionContext` when none is supplied. The public options
 * (`fields` / `customSelector` / `showValuesSelector`) are preserved and coexist
 * with the context.
 */
export class AutomationConditionGroupSelector extends ConditionGroupSelector
{
	constructor(conditionGroup, options)
	{
		const preparedOptions = Type.isPlainObject(options) ? { ...options } : {};

		if (!(preparedOptions.context instanceof ConditionContext))
		{
			preparedOptions.context = new AutomationConditionContext({
				fields: Type.isArray(preparedOptions.fields) ? preparedOptions.fields : [],
			});
		}

		// BC: legacy consumers pass the option as `customSelector`; the base control now
		// reads `customSelectorFn`. Map the old key so the host value selector (BPAShowSelector)
		// keeps working for read/write data storage and the filter-expression editor.
		if (preparedOptions.customSelectorFn === undefined)
		{
			preparedOptions.customSelectorFn = preparedOptions.customSelector;
		}

		super(conditionGroup, preparedOptions);
	}
}
