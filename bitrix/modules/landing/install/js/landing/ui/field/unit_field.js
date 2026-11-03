;(function() {
	"use strict";

	BX.namespace("BX.Landing.UI.Field");


	/**
	 * Implements unit field interface
	 *
	 * @extends {BX.Landing.UI.Field.Text}
	 *
	 * @param data
	 * @constructor
	 */
	BX.Landing.UI.Field.Unit = function(data)
	{
		// Text is a native ES class: it cannot be called through apply(), so the instance is built
		// with Reflect.construct and returned from this legacy constructor
		var self = Reflect.construct(BX.Landing.UI.Field.Text, [data], new.target || BX.Landing.UI.Field.Unit);
		self.layout.classList.add("landing-ui-field-unit");
		self.unit = BX.Landing.UI.Field.Unit.createUnit();

		self.onInputHandler = typeof data.onInput === "function" ? data.onInput : (function() {});
		self.input.addEventListener("keydown", self.onInputKeydown.bind(self));
		self.input.addEventListener("input", BX.debounce(self.onInputInput, 200, self));
		self.input.addEventListener("input", self.onInputInputWithoutDebounce.bind(self));
		self.input.value = data.content;
		self.input.placeholder = self.placeholder;
		self.items = data.items;
		self.unit.innerText = typeof data.unit === "string" ? data.unit : "";
		self.input.min = typeof data.min === "number" ? data.min : 0;
		self.input.max = typeof data.max === "number" ? data.max : Infinity;
		self.input.step = typeof data.step === "number" ? data.step : 1;
		self.frame = typeof data.frame === "object" ? data.frame : null;
		self.selector = typeof data.selector === "string" ? data.selector : null;
		self.property = typeof data.property === "string" ? data.property : null;
		self.postfix = typeof data.postfix === "string" ? data.postfix : "";
		self.format = typeof data.format === "function" ? data.format : (function() {});
		self.elements = null;

		if (self.frame)
		{
			self.onFrameLoad();
		}

		self.layout.appendChild(self.unit);
		self.enableTextOnly();

		return self;
	};


	BX.Landing.UI.Field.Unit.createUnit = function()
	{
		return BX.create("div", {props: {className: "landing-ui-field-unit-unit"}});
	};


	BX.Landing.UI.Field.Unit.prototype = {
		constructor: BX.Landing.UI.Field.Unit,
		__proto__: BX.Landing.UI.Field.Text.prototype,

		onFrameLoad: function()
		{
			this.elements = [].slice.call(this.frame.document.querySelectorAll(this.selector));

			if (this.elements.length)
			{
				var value = parseFloat(BX.style(this.elements[0], this.property));
				value = value === value ? value : 0;
				this.setValue(value);
			}
		},


		/**
		 * Handles input event on field input
		 */
		onInputInput: function()
		{
			this.onInputHandler(this);
		},


		onInputInputWithoutDebounce: function()
		{
			if (!!this.elements)
			{
				this.elements.forEach(function(element) {
					this.format(element, this.getValue(), this.items);
				}, this);
			}
		},


		/**
		 * Handles keydown event on field input
		 * @param {Object} event
		 */
		onInputKeydown: function(event)
		{
			if (event.keyCode === 13)
			{
				event.preventDefault();
			}
		},


		/**
		 * Creates input element
		 * @return {HTMLElement}
		 */
		createInput: function()
		{
			return BX.create("input", {props: {
				className: "landing-ui-field-input",
				type: "number"
			}});
		},


		/**
		 * Sets field value
		 * @param value
		 */
		setValue: function(value)
		{
			this.input.value = value;
			BX.fireEvent(this.input, "input");
		},


		/**
		 * Gets field value
		 * @return {number}
		 */
		getValue: function()
		{
			return this.input.value;
		},


		/**
		 * Enables edit
		 */
		enableEdit: function()
		{
			if (this !== BX.Landing.UI.Field.BaseField.currentField && BX.Landing.UI.Field.BaseField.currentField !== null)
			{
				/** Disable preview active field */
				BX.Landing.UI.Field.BaseField.currentField.disableEdit();
			}

			/** Set this field as active */
			BX.Landing.UI.Field.BaseField.currentField = this;

			/** Adjust input focus */
			this.input.focus();
		},


		/**
		 * Disables edit
		 */
		disableEdit: function()
		{

		}
	};
})();