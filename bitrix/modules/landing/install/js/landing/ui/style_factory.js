;(function() {
	"use strict";

	BX.namespace("BX.Landing.UI.Factory");


	/**
	 * Implements style factory
	 * @param {{
	 * 		frame: ?HTMLDocument|Window,
	 * 		[postfix]: ?string,
	 * 	}} options
	 * @constructor
	 */
	BX.Landing.UI.Factory.StyleFactory = function(options)
	{
		this.frame = !!options.frame ? options.frame : null;
		this.postfix = typeof options.postfix === "string" ? options.postfix : "";
	};


	function formatClassName(element, value, items, postfix, inlineReset) {
		postfix = !!postfix ? postfix : "";

		if (!!value && typeof value === "object")
		{
			var valueKeys = Object.keys(value);
			value = valueKeys.map(function(key) {
				return value[key];
			});
		}
		else if (typeof value === "string")
		{
			value = [value];
		}

		value.forEach(function(valueItem) {
			items.forEach(function(item) {
				if (valueItem+postfix !== item.value+postfix)
				{
					element.classList.remove(item.value+postfix);
				}

				if (inlineReset)
				{
					element.style[inlineReset] = null;
					[].slice.call(element.querySelectorAll("*")).forEach(function(child) {
						child.style[inlineReset] = null;
					});
				}
			});

			element.classList.add(valueItem+postfix);
		});
	}


	BX.Landing.UI.Factory.StyleFactory.prototype = {
		/**
		 * Creates field
		 *
		 * The options.selector is the persistence and history key of the style, it is not required
		 * to resolve anything in the live DOM of the editor. The options.elementsSelector is the
		 * selector of the live nodes the field applies the style to; when it is omitted, the field
		 * falls back to options.selector, as it was before. The options.blockLevel tells that the
		 * form edits the block itself and not one of its style nodes: such a field addresses the
		 * single content root of the block (resolveSingleNode) and gets a stable testId.
		 *
		 * @param {Object} options
		 * @param {string} [options.selector]
		 * @param {string} [options.elementsSelector]
		 * @param {boolean} [options.blockLevel]
		 * @returns {{
		 * 	[title]: string,
		 * 	[selector]: string,
		 * 	[format]: function,
		 * 	[frame]: HTMLIFrameElement,
		 * 	[property]: string,
		 * 	[items]: string[]
		 * }}
		 */
		createField: function(options)
		{
			var field = null;
			var blockLevel = options.blockLevel === true;
			// Stable hook for e2e tests: the style name is a stable key of the style type
			// (see .style.php), unlike the generated id of the field. The style panel shows the form
			// of the block together with a form of every style node, and the same style type occurs
			// in several of them (the "typo" group). So the style name is unique only within the form
			// of the block level, and that is the only form whose fields get test ids.
			// Only ButtonGroup, Range and Dropdown read testId; ColorField, ColorPalette and Font
			// ignore it, so the color and font fields of the block form stay without a data-testid.
			var testId = blockLevel && typeof options.style === "string" && options.style
				? "landing-style-" + options.style
				: null;
			var defaultOptions = {
				title: options.title,
				selector: options.selector,
				elementsSelector: options.elementsSelector,
				// The selector of the block level resolves the whole content of the block, but such
				// a field styles its single root; a style node field always styles the whole set.
				// Only ButtonGroup reads the flag: it is the only field that toggles the class on
				// every resolved node, the others read the value from the first node anyway.
				resolveSingleNode: blockLevel,
				contentRoot: BX.Landing.PageObject.getStylePanelContent(),
				style: options.style,
				format: formatClassName,
				frame: this.frame,
				property: options.property,
				pseudoElement: options.pseudoElement,
				pseudoClass: options.pseudoClass,
				items: options.items,
				postfix: this.postfix,
				onChange: options.onChange,
				onReset: options.onReset,
				help: options.help,
				attrKey: options.attrKey,
				testId: testId
			}

			if (options.type === "slider" || options.type === "range-slider")
			{
				field = new BX.Landing.UI.Field.Range(Object.assign(
					defaultOptions,
					{
						type: options.type === "range-slider" ? "multiple" : null
					}
				));
			}

			if (options.type === "buttons")
			{
				field = new BX.Landing.UI.Field.ButtonGroup(Object.assign(
					defaultOptions,
					{
						multiple: options.multiple === true
					}
				));
			}

			if (options.type === "display")
			{
				field = new BX.Landing.UI.Field.ButtonGroup(Object.assign(
					defaultOptions,
					{
						multiple: true,
						className: "landing-ui-display-button-group",
						ariaPressed: true,
						ariaLabels: {
							"l-d-lg-none": BX.Landing.Loc.getMessage("LANDING_DISPLAY_HIDE_ON_DESKTOP"),
							"l-d-md-none": BX.Landing.Loc.getMessage("LANDING_DISPLAY_HIDE_ON_TABLET"),
							"l-d-xs-none": BX.Landing.Loc.getMessage("LANDING_DISPLAY_HIDE_ON_MOBILE")
						},
						// The class names of the items are not readable in a test, so the buttons
						// are named by the device they hide the content on. The names are fixed,
						// therefore they follow the same scope rule as the root testId.
						itemTestIds: testId
							? {
								"l-d-lg-none": "landing-style-display-desktop-btn",
								"l-d-md-none": "landing-style-display-tablet-btn",
								"l-d-xs-none": "landing-style-display-mobile-btn"
							}
							: null
					}
				));
			}

			// todo: need save Backward compatibility for "pallette"?
			if (options.type === "palette")
			{
				field = new BX.Landing.UI.Field.ColorPalette(defaultOptions);
			}

			if (options.type === "color")
			{
				field = new BX.Landing.UI.Field.ColorField(Object.assign(
					defaultOptions,
					{
						block: options.block,
						styleNode: options.styleNode,
						subtype: options.subtype
					}
				));
			}

			if (options.type === "list" && options.style !== "font-family")
			{
				field = new BX.Landing.UI.Field.Dropdown(defaultOptions);
			}

			if (options.style === "font-family")
			{
				field = new BX.Landing.UI.Field.Font(Object.assign(
					defaultOptions,
					{
						styleNode: options.styleNode
					}
				));
			}

			return field;

		}
	};
})();