BX.namespace("BX.UI");

//region EDITOR FIELD SINGLE EDIT CONTROLLER
if(typeof BX.UI.EditorFieldSingleEditController === "undefined")
{
	BX.UI.EditorFieldSingleEditController = function()
	{
		this._id = "";
		this._settings = null;
		this._field = null;
		this._wrapper = null;

		this._fieldWrapperHandler = BX.delegate(this.onFieldWrapperClick, this);
		this._documentHandler = BX.delegate(this.onDocumentClick, this);
		this._documentTimeoutHandle = 0;

		this._isInitialized = false;
		this._isActive = false;
	};
	BX.UI.EditorFieldSingleEditController.prototype =
		{
			initialize: function(id, settings)
			{
				this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
				this._settings = settings ? settings : {};

				this._time = (new Date()).toString();

				this._field = BX.prop.get(this._settings, "field");
				if(!(this._field instanceof BX.UI.EntityEditorField))
				{
					throw "EditorFieldSingleEditController: The 'field' param must be EntityEditorField.";
				}

				this._wrapper = this._field.getWrapper();
				if(!BX.type.isElementNode(this._wrapper))
				{
					throw "EditorFieldSingleEditController: Could not find the wrapper element.";
				}

				window.setTimeout(BX.delegate(this.bind, this), 100);
				this._isActive = this._isInitialized = true;
			},
			isActive: function()
			{
				return this._isActive;
			},
			setActive: function(active)
			{
				this._isActive = !!active;
			},
			setActiveDelayed: function(active, delay)
			{
				if(typeof(delay) === "undefined")
				{
					delay = 0;
				}

				window.setTimeout(
					BX.delegate(function(){ this.setActive(active); }, this),
					delay
				);
			},
			release: function()
			{
				this._isActive = this._isInitialized = false;
				this.unbind();
			},
			bind: function()
			{
				if(this._isInitialized)
				{
					BX.bind(this._wrapper, "click", this._fieldWrapperHandler);
					BX.bind(document, "click", this._documentHandler);
				}
			},
			unbind: function()
			{
				BX.unbind(this._wrapper, "click", this._fieldWrapperHandler);
				BX.unbind(document, "click", this._documentHandler);
			},
			saveControl: function()
			{
				if(!this._isActive)
				{
					return;
				}

				var editor = this._field.getEditor();
				if(editor)
				{
					editor.switchControlMode(this._field, BX.UI.EntityEditorMode.view, BX.UI.EntityEditorModeOptions.none);
					//Is not supported by the all controls
					//editor.saveControl(this._field);
				}

				this._isActive = false;
			},
			onFieldWrapperClick: function(e)
			{
				//The call of "preventDefault" is not allowed because of the checkbox controls
				BX.eventCancelBubble(e);
			},
			onDocumentClick: function(e)
			{
				if(this._documentTimeoutHandle > 0)
				{
					window.clearTimeout(this._documentTimeoutHandle);
					this._documentTimeoutHandle = 0;
				}

				this._documentTimeoutHandle = window.setTimeout(
					BX.delegate(this.saveControl, this),
					400
				);
			}
		};
	BX.UI.EditorFieldSingleEditController.create = function(id, settings)
	{
		var self = new BX.UI.EditorFieldSingleEditController();
		self.initialize(id, settings);
		return self;
	}
}
//endregion

//region EDITOR FIELD VIEW CONTROLLER
if(typeof BX.UI.EditorFieldViewController === "undefined")
{
	BX.UI.EditorFieldViewController = function()
	{
		this._id = "";
		this._settings = null;
		this._field = null;
		this._wrapper = null;

		this._timeoutHandle = 0;
		this._time = 0;
		this._pos = { x: 0, y: 0 };

		this._mouseDownHandler = BX.delegate(this.onMouseDown, this);
		this._mouseUpHandler = BX.delegate(this.onMouseUp, this);
		this._keyDownHandler = BX.delegate(this.onKeyDown, this);

		this._isInitialized = false;
		this._isActive = false;

		//Both the role and the accessible name depend on the contents, so they go stale
		//whenever the contents change - see refreshAccessibilityState(). We manage only
		//the attributes the field did not come with.
		this._managesRole = false;
		this._managesAriaLabel = false;
		this._contentObserver = null;
	};
	BX.UI.EditorFieldViewController.prototype =
		{
			initialize: function (id, settings)
			{
				this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
				this._settings = settings ? settings : {};

				this._field = BX.prop.get(this._settings, "field");
				if (!(this._field instanceof BX.UI.EntityEditorField)) {
					throw "EditorFieldViewController: The 'field' param must be EntityEditorField.";
				}

				this._wrapper = BX.prop.getElementNode(this._settings, "wrapper");
				if (!BX.type.isElementNode(this._wrapper)) {
					throw "EditorFieldSingleEditController: Could not find the wrapper element.";
				}

				window.setTimeout(BX.delegate(this.bind, this), 100);
				this._isActive = this._isInitialized = true;
			},
			release: function()
			{
				this._isActive = this._isInitialized = false;
				this.unbind();
			},
			bind: function()
			{
				if(this._isInitialized)
				{
					BX.bind(this._wrapper, "mousedown", this._mouseDownHandler);
					BX.bind(this._wrapper, "mouseup", this._mouseUpHandler);

					//A field in view mode switches to editing on a click,
					//so it must be reachable from the keyboard too (WCAG 2.1 AA, 2.1.1).
					BX.bind(this._wrapper, "keydown", this._keyDownHandler);

					this.prepareAccessibilityAttributes();
					if(this._managesRole || this._managesAriaLabel)
					{
						this.observeContent();
					}
				}
			},
			prepareAccessibilityAttributes: function()
			{
				//Not every field can be switched to editing: for a non-editable field
				//and for an editor in "read only" mode switchTo() silently does nothing.
				//Such a field must not enter the keyboard tab order and promise an action
				//that does not exist (WCAG 4.1.2, 2.4.3).
				if(!this._field.isSingleEditEnabled())
				{
					return;
				}

				//We do not overwrite the attributes if someone has already set them.
				if(!this._wrapper.hasAttribute("tabindex"))
				{
					this._wrapper.setAttribute("tabindex", "0");
				}

				this._managesRole = !this._wrapper.hasAttribute("role");
				this._managesAriaLabel = !this._wrapper.hasAttribute("aria-label");

				this.refreshAccessibilityState();
			},
			//role="button" makes descendants presentational per the ARIA spec, and the name
			//computed from the contents (the field value) goes presentational with them,
			//hence the explicit aria-label. A field with interactive descendants keeps
			//neither: it stays merely focusable and is named by its contents. Both depend on
			//the contents, so both are recomputed together - see observeContent().
			refreshAccessibilityState: function()
			{
				if(!this._wrapper)
				{
					return;
				}

				var hasInteractiveContent = this.hasInteractiveContent();

				if(this._managesRole)
				{
					if(hasInteractiveContent)
					{
						this._wrapper.removeAttribute("role");
					}
					else
					{
						this._wrapper.setAttribute("role", "button");
					}
				}

				if(!this._managesAriaLabel)
				{
					return;
				}

				var label = hasInteractiveContent ? "" : this.getAccessibleName();
				if(label !== "")
				{
					this._wrapper.setAttribute("aria-label", label);
				}
				else
				{
					//An empty name is worse than none: it would leave the control unnamed
					//while still claiming a label.
					this._wrapper.removeAttribute("aria-label");
				}
			},
			//The optimized refreshLayout() of a field in view mode rewrites the contents of
			//_innerWrapper and keeps the node itself, so prepareAccessibilityAttributes()
			//never runs again: the label keeps announcing the previous value while the screen
			//shows the new one, and the role keeps claiming a button after an interactive
			//control has arrived (WCAG 4.1.2). Seven field types take that path
			//(Text, MultiText, MultiMoney, Textarea, List, Link, Money), so instead of
			//patching each one we watch the contents here.
			observeContent: function()
			{
				if(this._contentObserver || typeof MutationObserver === "undefined")
				{
					return;
				}

				//Only childList/characterData: role and aria-label are attributes and are
				//not observed, so refreshing them cannot retrigger this observer.
				this._contentObserver = new MutationObserver(
					BX.delegate(this.refreshAccessibilityState, this)
				);
				this._contentObserver.observe(
					this._wrapper,
					{ childList: true, characterData: true, subtree: true }
				);
			},
			hasInteractiveContent: function()
			{
				return !!this._wrapper.querySelector(
					"a[href], button, input, select, textarea, [tabindex], [contenteditable]"
				);
			},
			getAccessibleName: function()
			{
				var title = this._field.getTitle();
				if(!BX.type.isNotEmptyString(title))
				{
					return "";
				}

				var action = BX.message("UI_ENTITY_EDITOR_CHANGE");
				var name = BX.type.isNotEmptyString(action) ? (action + ": " + title) : title;

				//Fold in the current value so it survives role="button" turning the
				//contents presentational. Only fields without interactive
				//descendants reach here, so textContent is the clean value.
				var value = this.getFieldValueText();
				if(value !== "")
				{
					name += ", " + value;
				}

				return name;
			},
			getFieldValueText: function()
			{
				var text = this._wrapper ? (this._wrapper.textContent || "") : "";

				return text.replace(/\s+/g, " ").trim();
			},
			unbind: function()
			{
				BX.unbind(this._wrapper, "mousedown", this._mouseDownHandler);
				BX.unbind(this._wrapper, "mouseup", this._mouseUpHandler);
				BX.unbind(this._wrapper, "keydown", this._keyDownHandler);

				if(this._contentObserver)
				{
					this._contentObserver.disconnect();
					this._contentObserver = null;
				}
			},
			onMouseDown: function(e)
			{
				if(this._timeoutHandle > 0)
				{
					window.clearTimeout(this._timeoutHandle);
					this._timeoutHandle = 0;
				}

				if(!this.isHandleableEvent(e))
				{
					return;
				}

				this._time = new Date().valueOf();
				this._pos = { x: e.clientX, y: e.clientY };
			},
			onMouseUp: function(e)
			{
				if(this._timeoutHandle > 0)
				{
					window.clearTimeout(this._timeoutHandle);
					this._timeoutHandle = 0;
				}

				if(!this.isHandleableEvent(e))
				{
					return;
				}

				if((new Date().valueOf() - this._time) < 400 || Math.abs(this._pos.x - e.clientX) < 2)
				{
					this._timeoutHandle = window.setTimeout(
						BX.delegate(this.switchTo, this),
						0
					);
				}

				this._time = 0;
			},
			onKeyDown: function(e)
			{
				//We only handle an event addressed to the wrapper itself.
				//Nested controls — native buttons, links, inputs, checkboxes —
				//handle the keyboard themselves, and preventDefault here would cancel
				//their activation: on a native button the click is the default action
				//for keydown and runs only after bubbling (WCAG 2.1.1).
				if(BX.getEventTarget(e) !== this._wrapper)
				{
					return;
				}

				//Enter and Space switch the field to editing — the same as a click.
				var key = e && e.key ? e.key : "";
				if(key !== "Enter" && key !== " " && key !== "Spacebar")
				{
					return;
				}

				//Space would otherwise scroll the page.
				if(e.preventDefault)
				{
					e.preventDefault();
				}

				this.switchTo();
			},
			isHandleableEvent: function(e)
			{
				const node = BX.getEventTarget(e);
				if (node.tagName === 'A')
				{
					return false;
				}

				const isButton = (control) => {
					return typeof control?.getAttribute === 'function'
						&& control.getAttribute('data-editor-control-type') === 'button';
				};

				if (isButton(node) || BX.findParent(node, isButton, this._wrapper))
				{
					return false;
				}

				return !BX.findParent(node, { tagName: 'a' }, this._wrapper);
			},
			switchTo: function()
			{
				this._field.switchToSingleEditMode();
			}
		};
	BX.UI.EditorFieldViewController.create = function(id, settings)
	{
		var self = new BX.UI.EditorFieldViewController();
		self.initialize(id, settings);
		return self;
	}
}

if (typeof BX.UI.EntityEditorController === 'undefined')
{
	BX.UI.EntityEditorController = function()
	{
		this._id = '';
		this._settings = {};

		this._editor = null;
		this._model = null;
		this._config = null;

		this._isChanged = false;
	};

	BX.UI.EntityEditorController.prototype =
	{
		initialize: function(id, settings)
		{
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings ? settings : {};

			this._editor = BX.prop.get(this._settings, 'editor', null);
			this._model = BX.prop.get(this._settings, 'model', null);
			this._config = BX.prop.getObject(this._settings, 'config', {});

			this.doInitialize();
		},

		doInitialize: function()
		{
		},

		getConfig: function()
		{
			return this._config;
		},

		getConfigStringParam: function(name, defaultValue)
		{
			return BX.prop.getString(this._config, name, defaultValue);
		},

		isChanged: function()
		{
			return this._isChanged;
		},

		markAsChanged: function()
		{
			if (this._isChanged)
			{
				return;
			}

			this._isChanged = true;
			if (this._editor)
			{
				this._editor.processControllerChange(this);
			}
		},

		release: function()
		{
		},
		rollback: function()
		{
		},
		validate: function()
		{
			return null;
		},
		innerCancel: function()
		{
		},

		onBeforeSubmit: function()
		{
		},

		onAfterSave: function()
		{
			if (this._isChanged)
			{
				this._isChanged = false;
			}
		},

		onReload: function()
		{
			if (!this._isChanged)
			{
				this.onAfterSave();
			}
		},

		onBeforeSaveControl: function(data)
		{
			return this.onBeforeSaveControl(data);
		},

		/**
		 * @deprecated Use onBeforeSaveControl instead
		 *
		 * This method with misprint left for backward compatibility and
		 * will be removed in future
		 */
		onBeforesSaveControl: function(data)
		{
			return data;
		}
	};
}
//endregion