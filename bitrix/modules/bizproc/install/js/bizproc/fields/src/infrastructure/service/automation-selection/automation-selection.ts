import {Runtime, Type} from 'main.core';
import {SelectorManager, InlineSelector, SelectorContext, tryGetGlobalContext} from 'bizproc.automation';
import {type Property} from '../../../const/type';
import type {SelectionContext, SelectionProvider} from '../../../model/selection/selection';
import {isAutomationAvailable} from '../../../lib/automation/automation';

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

	decorateByRole(
		role: string,
		controlNode: HTMLElement,
		_property: Property,
		context: SelectionContext,
	): HTMLElement
	{
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

		return selector.renderWith(controlNode);
	}
}
