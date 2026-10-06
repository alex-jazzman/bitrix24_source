/* eslint-disable */
(function (main_core) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Component');

	/**
	 * @memberOf BX.Crm.Component
	 */
	class Router {
		/**
		 * @public
		 * @param roots
		 * @param rules
		 */
		static bindAnchors(roots, rules) {
			const preparedRules = [];
			rules.forEach(rule => {
				preparedRules.push(this.prependRootsToRuleConditions(roots, rule));
			});
			BX.SidePanel.Instance.bindAnchors({
				rules: preparedRules
			});
		}
		static bindAnchor(roots, rule) {
			const rules = [this.prependRootsToRuleConditions(roots, rule)];
			BX.SidePanel.Instance.bindAnchors({
				rules
			});
		}

		/**
		 * @protected
		 * @param roots
		 * @param rule
		 * @return {BX.SidePanel.Rule}
		 */
		static prependRootsToRuleConditions(roots, rule) {
			// Don't change the received object to avoid problems
			const localRule = main_core.Runtime.clone(rule);
			if (!main_core.Type.isArrayFilled(localRule.condition)) {
				return localRule;
			}
			const modifiedConditions = [];
			localRule.condition.forEach(condition => {
				if (main_core.Type.isRegExp(condition)) {
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
		static wrapRuleOptions(ruleOptions) {
			return link => {
				const preparedOptions = main_core.Type.isFunction(ruleOptions) ? ruleOptions(link) : ruleOptions;
				if (!main_core.Type.isPlainObject(preparedOptions)) {
					return preparedOptions;
				}
				if (preparedOptions.copyLinkLabel === true && !main_core.Type.isStringFilled(preparedOptions.newWindowUrl) && main_core.Type.isStringFilled(link == null ? void 0 : link.url)) {
					return {
						...preparedOptions,
						newWindowUrl: link.url
					};
				}
				return preparedOptions;
			};
		}
	}
	namespace.Router = Router;

})(BX);
//# sourceMappingURL=script.js.map
