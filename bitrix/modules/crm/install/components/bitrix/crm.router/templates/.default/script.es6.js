import { Reflection, Runtime, Type } from 'main.core';

const namespace = Reflection.namespace('BX.Crm.Component');

/**
 * @memberOf BX.Crm.Component
 */
class Router
{
	/**
	 * @public
	 * @param roots
	 * @param rules
	 */
	static bindAnchors(roots: string[], rules: BX.SidePanel.Rule[]): void
	{
		const preparedRules: BX.SidePanel.Rule[] = [];

		rules.forEach(rule => {
			preparedRules.push(this.prependRootsToRuleConditions(roots, rule));
		});

		BX.SidePanel.Instance.bindAnchors({rules: preparedRules});
	}

	static bindAnchor(roots: string[], rule: BX.SidePanel.Rule): void
	{
		const rules = [
			this.prependRootsToRuleConditions(roots, rule),
		];

		BX.SidePanel.Instance.bindAnchors({ rules });
	}

	/**
	 * @protected
	 * @param roots
	 * @param rule
	 * @return {BX.SidePanel.Rule}
	 */
	static prependRootsToRuleConditions(roots: string[], rule: BX.SidePanel.Rule): BX.SidePanel.Rule
	{
		// Don't change the received object to avoid problems
		const localRule: BX.SidePanel.Rule = Runtime.clone(rule);

		if (!Type.isArrayFilled(localRule.condition))
		{
			return localRule;
		}

		const modifiedConditions = [];
		localRule.condition.forEach((condition: string|RegExp) => {
			if (Type.isRegExp(condition))
			{
				condition = condition.toString();
			}

			roots.forEach(root => {
				modifiedConditions.push(root + condition);
			});
		});

		localRule.condition = modifiedConditions;
		localRule.options = this.wrapRuleOptions(localRule.options);

		return localRule;
	}

	// It adds newWindowUrl to the options if copyLinkLabel is true and newWindowUrl is not set
	static wrapRuleOptions(
		ruleOptions: BX.SidePanel.Options | ((link: BX.SidePanel.Link) => BX.SidePanel.Options),
	): BX.SidePanel.Options | ((link: BX.SidePanel.Link) => BX.SidePanel.Options)
	{
		return (link: BX.SidePanel.Link): BX.SidePanel.Options => {
			const preparedOptions = Type.isFunction(ruleOptions) ? ruleOptions(link) : ruleOptions;
			if (!Type.isPlainObject(preparedOptions))
			{
				return preparedOptions;
			}

			if (
				preparedOptions.copyLinkLabel === true
				&& !Type.isStringFilled(preparedOptions.newWindowUrl)
				&& Type.isStringFilled(link?.url)
			)
			{
				return {
					...preparedOptions,
					newWindowUrl: link.url,
				};
			}

			return preparedOptions;
		};
	}
}

namespace.Router = Router;
