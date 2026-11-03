/* eslint-disable */
declare namespace BX.Bizproc.Fields.User {
	/**
	 * User field type. The control itself is the legacy user selector widget: the type only
	 * builds the nodes around it, hands one of them over and adapts what the widget produces
	 * to the BaseField contract. The whole selection - single or multiple - lives in one
	 * widget, hence rendersOwnMultiple().
	 */
	class UserField extends BX.Bizproc.Fields.BaseField {
		/**
		 * The whole selection is one control, and one control is not a group: the core neither
		 * builds rows around it nor announces the field as a group of controls.
		 */
		rendersOwnMultiple(): boolean;
		/**
		 * The type declines the insertion decorator instead of leaving it to the caller: the
		 * decorator would replace the value node with a copy of it, while the widget keeps a
		 * direct reference to the node it created (user_selector.js:166) and would go on
		 * writing into the detached one.
		 */
		decoratesSelection(): boolean;
		/**
		 * The named node is the `group` around the widget, and ARIA 1.2 allows `aria-required` on the
		 * input family of roles alone - on a group the attribute is dropped and the field would be
		 * announced as optional. The requirement is spelled into the accessible name instead
		 * (see accessibleName).
		 */
		protected namedNodeCarriesRequired(): boolean;
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
		/**
		 * What a screen reader calls this field. The requirement is part of the name (WCAG H90)
		 * because no ARIA state can carry it here - see namedNodeCarriesRequired - and the asterisk
		 * the core draws beside the name is aria-hidden.
		 *
		 * Only that addition belongs to the type: the name itself - trimmed, falling through to the
		 * field name where the property names the field with nothing - is the core's own rule, and
		 * naming this field by another rule than the rest is not what the requirement asks for.
		 */
		protected accessibleName(): string;
		/**
		 * The whole selection is one string in one node, never the list a multiple field reads: the
		 * one place this type narrows `BaseField.getValue()`, which answers a multiple field with a
		 * `string[]` of its rows. The widget holds every entity of the selection in a single value node,
		 * so there is no list to answer with. The narrowed return type says as much to whoever holds
		 * this type; a consumer branching on isMultiple() over a `BaseField` reference sees the union
		 * alone, hence the note here and on the base method.
		 */
		getValue(): string;
		/**
		 * Written the same way round as the first render: the widget first, the value string last.
		 * The base would spread a multiple value over one node per entity, while the whole selection
		 * of this type lives in a single node of a single widget.
		 */
		protected applyValue(value: string | string[]): void;
		protected release(): void;
	}
}
