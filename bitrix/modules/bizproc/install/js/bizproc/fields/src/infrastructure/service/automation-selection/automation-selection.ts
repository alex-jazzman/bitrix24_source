import { Dom, Runtime, Type } from 'main.core';
import {SelectorManager, InlineSelector, SelectorContext, tryGetGlobalContext} from 'bizproc.automation';
import {type Property} from '../../../const/type';
import type {SelectionContext, SelectionProvider} from '../../../model/selection/selection';
import {isAutomationAvailable} from '../../../lib/automation/automation';

/**
 * One property object is handed to decorateByRole() once per node of the field it describes -
 * BackendRenderer.#initSelectors walks every [data-role] inside the placeholder - so serializing
 * it per node repeats identical work. Keyed by the object, so the entry goes with the field.
 */
const serializedProperties: WeakMap<Property, string> = new WeakMap();

export class AutomationSelectionProvider implements SelectionProvider
{
	isAvailable(): boolean
	{
		return isAutomationAvailable();
	}

	supports(_property: Property): boolean
	{
		return true;
	}

	decorate(
		controlNode: HTMLElement,
		property: Property,
		context: SelectionContext,
	): HTMLElement
	{
		return this.decorateByRole(SelectorManager.SELECTOR_ROLE_INLINE, controlNode, property, context);
	}

	/**
	 * The role decides which selector is built, the write target whether one is built at all: every
	 * selector reached from here decorates through `InlineSelector.renderWith`, which wraps a copy of
	 * the node and writes an inserted value into that copy - into the `.value` of a control holding
	 * text, into an option of a `<select>`. A node holding no value - the container of a user, file
	 * or entity widget, which the host renders and fills itself - would get a working-looking handle
	 * whose insertion lands nowhere.
	 *
	 * The `<select>` is offered as a target and `InlineSelector.onFieldSelect` fills it on its own, so
	 * nothing is done for it here. A `<label>`, which the selector fills too, is no target the
	 * framework declares: a type rendering one brings its own target or a role to decorate by
	 * (DEV-07: target and mode are the field's). The same refusal the adapter of the designer makes.
	 */
	decorateByRole(
		role: string,
		controlNode: HTMLElement,
		property: Property,
		context: SelectionContext,
	): HTMLElement
	{
		if (Type.isNil(context.writeTarget))
		{
			return controlNode;
		}

		const globalContext = tryGetGlobalContext();
		const document = globalContext?.document ?? null;

		const userOptionsProp = Type.isNil(globalContext?.userOptions)
			? {}
			: {userOptions: globalContext.userOptions};

		const selectorContext = new SelectorContext({
			fields: document ? Runtime.clone(document.getFields()) : [],
			useSwitcherMenu: globalContext?.get('showTemplatePropertiesMenuOnSelecting') === true,
			rootGroupTitle: document?.title ?? '',
			...userOptionsProp,
			...context.extra,
			...(Type.isUndefined(context.documentType) ? {} : {documentType: context.documentType}),
		});

		const selector = SelectorManager.createSelectorByRole(
			role,
			{context: selectorContext},
		);

		if (!selector || !(selector instanceof InlineSelector))
		{
			return controlNode;
		}

		this.#writeTargetProperties(controlNode, property);

		return selector.renderWith(controlNode);
	}

	/**
	 * Target properties InlineSelector.parseTargetProperties() reads off the node it is handed.
	 *
	 * Written here and not by the caller because renderWith() works on a Runtime.clone of the
	 * node: an attribute set afterwards stays on the original and never reaches the copy the
	 * selector reads. Unconditional per attribute, so a node that arrived with leftovers of its
	 * own - server markup prints `data-property` - ends up describing the property it is decorated
	 * for and nothing else.
	 *
	 * How the value is written - over what the control holds, or at the caret - is not among them:
	 * that is the control's own declaration (`data-select-mode`, printed by the type that rendered
	 * it) and is left exactly as the node carries it. A mode decided here by type would overwrite
	 * the declaration of a control this provider knows nothing about.
	 */
	#writeTargetProperties(controlNode: HTMLElement, property: Property): void
	{
		let serializedProperty = serializedProperties.get(property);

		if (Type.isUndefined(serializedProperty))
		{
			serializedProperty = JSON.stringify(property);
			serializedProperties.set(property, serializedProperty);
		}

		Dom.attr(controlNode, {
			'data-property': serializedProperty,
			'data-selector-type': property.Type,
		});
	}
}
