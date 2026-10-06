(function() {
	'use strict';

	BX.namespace('BX.Landing');

	const slice = BX.Landing.Utils.slice;
	const proxy = BX.Landing.Utils.proxy;
	const bind = BX.Landing.Utils.bind;
	const addClass = BX.Landing.Utils.addClass;
	const removeClass = BX.Landing.Utils.removeClass;
	const data = BX.Landing.Utils.data;
	const onTransitionEnd = BX.Landing.Utils.onTransitionEnd;
	// a ring is drawn for the keyboard only; where the selector is unknown, it is drawn anyway —
	// an extra ring costs a mouse user nothing, a missing one costs the keyboard its place
	const isKeyboardFocus = function(element) {
		try
		{
			return element.matches(':focus-visible');
		}
		catch (error)
		{
			return true;
		}
	};
	const getCopilotPosition = function(copilot) {
		const bodyPosition = BX.Dom.getPosition(document.body);
		const differenceWidthWindowSlider = top.window.innerWidth - bodyPosition.width;
		const copilotWidth = bodyPosition.width * 0.4;
		const newCopilotPositionLeft = differenceWidthWindowSlider + ((bodyPosition.width - copilotWidth) / 2);
		const newCopilotPositionTop = top.window.innerHeight * 0.3;

		return {
			top: newCopilotPositionTop,
			left: newCopilotPositionLeft,
		};
	};

	/**
	 * For edit title.
	 */
	BX.Landing.EditTitleForm = function(params)
	{
		this.siteId = params.siteId;

		// ai
		this.isAiAvailable = Boolean(params.isAiAvailable) === true;
		this.isAiActive = Boolean(params.isAiActive) === true;
		this.aiUnactiveInfoCode = params.aiUnactiveInfoCode ?? null;

		this.node = params.node;
		this.isEventTargetNode = Boolean(params.isEventTargetNode) === true;

		this.controlButtonContainer = this.node.querySelector('.landing-editable-field-buttons');
		this.btn = this.node.querySelector('.ui-title-input-btn-js');
		this.aiCopilotContainer = this.node.querySelector('.landing-editable-field-button.--copilot');
		this.label = this.node.querySelector('.landing-editable-field-label-js');
		this.input = this.node.querySelector('.landing-editable-field-input-js');

		this.active = false;
		this.originalValue = '';

		this.showInput = this.showInput.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onFocusOut = this.onFocusOut.bind(this);
		this.adjustInputHeight = this.adjustInputHeight.bind(this);

		BX.bind(this.input, 'input', this.adjustInputHeight);
		BX.bind(this.input, 'paste', this.adjustInputHeight);
		BX.bind(this.btn, 'click', this.showInput);

		if (this.isEventTargetNode)
		{
			BX.bind(this.label, 'click', this.showInput);
		}

		if (this.isAiAvailable && this.aiCopilotContainer)
		{
			this.initCopilotBtn();
		}
	};

	BX.Landing.EditTitleForm.prototype = {
		initCopilotBtn()
		{
			const copilotIcon = BX.Tag.render`
				<span class="ui-title-input-btn --icon-gradient" aria-hidden="true">
					<span class="ui-icon-set --bitrix-gpt"></span>
				</span>
			`;
			if (this.input.value === '')
			{
				this.context = ' ';
			}
			else
			{
				this.context = this.input.value;
			}
			const Copilot = (top.BX.AI && top.BX.AI.Copilot) ? top.BX.AI.Copilot : BX.AI.Copilot;
			this.copilot = new Copilot({
				moduleId: 'landing',
				contextId: 'settings',
				category: 'landing_setting',
			});
			this.copilot.subscribe('finish-init', this.copilotFinishInitHandler.bind(this));
			this.copilot.subscribe('save', this.copilotSaveHandler.bind(this));
			this.copilot.subscribe('add_below', this.copilotAddBelowHandler.bind(this));
			BX.Event.bind(document, 'click', this.onClickHandler.bind(this));
			this.copilot.init();

			BX.bind(this.aiCopilotContainer, 'click', () => {
				if (this.isAiActive)
				{
					if (this.finishInit)
					{
						this.showCopilot();
					}
					else
					{
						const checkFinishInit = setInterval(() => {
							if (this.finishInit)
							{
								clearInterval(checkFinishInit);
								this.showCopilot();
							}
						}, 500);
					}
				}
				else if (this.aiUnactiveInfoCode && this.aiUnactiveInfoCode.length > 0)
				{
					BX.UI.InfoHelper.show(this.aiUnactiveInfoCode);
				}
			});

			BX.Dom.append(copilotIcon, this.aiCopilotContainer);
		},
		adjustInputHeight()
		{
			if (!this.input)
			{
				return;
			}

			BX.Dom.style(this.input, {
				height: 'auto',
			});

			requestAnimationFrame(() => {
				BX.Dom.style(this.input, {
					height: `${this.input.scrollHeight}px`,
				});
			});
		},
		showInput(event)
		{
			event.stopPropagation();

			if (this.active)
			{
				return;
			}

			// label content is indented by the template, the form field must not inherit that
			this.originalValue = this.label.textContent.trim();
			this.input.value = this.originalValue;

			BX.Dom.style(this.label, 'display', 'none');
			BX.Dom.addClass(this.controlButtonContainer, '--hidden');
			BX.Dom.style(this.input, 'display', 'block');

			this.adjustInputHeight();

			BX.bind(this.input, 'keydown', this.onKeyDown);
			BX.bind(this.input, 'focusout', this.onFocusOut);
			this.active = true;

			this.input.focus();
			if (!BX.Dom.hasClass(this.input, 'landing-editable-field-input-js-init'))
			{
				this.input.selectionStart = this.input.value.length;
				BX.Dom.addClass(this.input, 'landing-editable-field-input-js-init');
			}
		},
		hideInput(applyValue)
		{
			if (!this.active)
			{
				return;
			}

			this.active = false;
			// unbind before returning focus, otherwise the focusout of the input would leave the mode twice
			BX.unbind(this.input, 'keydown', this.onKeyDown);
			BX.unbind(this.input, 'focusout', this.onFocusOut);

			if (applyValue)
			{
				this.label.textContent = this.input.value;
			}
			else
			{
				this.input.value = this.originalValue;
			}

			BX.Dom.style(this.input, 'display', null);
			BX.Dom.style(this.label, 'display', null);
			BX.Dom.removeClass(this.controlButtonContainer, '--hidden');

			if (this.btn)
			{
				this.btn.focus();
			}
		},
		onKeyDown(event)
		{
			if (event.key === 'Escape')
			{
				this.hideInput(false);
				event.stopPropagation();
			}
			// a multiline field keeps Enter for the line break, it leaves the mode by Escape or focus loss
			else if (event.key === 'Enter' && this.input.tagName !== 'TEXTAREA')
			{
				this.hideInput(true);
				event.stopPropagation();
				event.preventDefault();
			}
		},
		onFocusOut()
		{
			this.hideInput(true);
		},
		copilotSaveHandler(event)
		{
			this.copilot.hide();
			this.label.innerText = event.data.result;
			this.input.value = event.data.result;
			this.adjustInputHeight();
		},
		copilotAddBelowHandler(event)
		{
			this.copilot.hide();
			this.label.innerText = `${this.label.innerText} ${event.data.result}`;
			this.input.value = `${this.label.value} ${event.data.result}`;
			this.adjustInputHeight();
		},
		onClickHandler(event)
		{
			if (!this.aiCopilotContainer.contains(event.target) && this.copilot.isShown())
			{
				this.copilot.hide();
			}
		},
		copilotFinishInitHandler()
		{
			this.copilot.setSelectedText(this.context);
			this.finishInit = true;
		},
		showCopilot()
		{
			this.copilot.setSelectedText(this.context);
			this.copilot.show({
				width: BX.Dom.getPosition(document.body).width * 0.4,
			});
			const copilotPosition = getCopilotPosition(this.copilot);
			this.copilot.adjust(
				{
					position: {
						top: copilotPosition.top,
						left: copilotPosition.left,
					},
				},
			);
		},
	};

	/**
-	 * Length limit for fields
-	 */
	BX.Landing.FieldLengthLimited = function(params)
	{
		this.field = params.field;
		this.node = params.node;
		this.length = params.length;
		this.isAiAvailable = Boolean(params.isAiAvailable) === true;
		this.isAiActive = Boolean(params.isAiActive) === true;
		this.aiCopilotContainer = this.field.parentNode.querySelector('.landing-editable-field-button.--copilot');
		if (this.isAiAvailable && this.aiCopilotContainer)
		{
			this.initCopilotBtn();
		}
		BX.bind(this.field, 'keyup', () => {
			if (this.node)
			{
				if (this.length)
				{
					this.node.textContent = this.checkLength(this.field.value, this.length);
				}
				else
				{
					this.node.textContent = this.field.value;
				}
			}
		});
	};

	BX.Landing.FieldLengthLimited.prototype = {
		initCopilotBtn()
		{
			this.context = this.field.value;
			if (this.context === '')
			{
				this.context = ' ';
			}
			const copilotIcon = BX.Tag.render`
				<span class="ui-title-input-btn --icon-gradient" aria-hidden="true">
					<span class="ui-icon-set --bitrix-gpt"></span>
				</span>
			`;
			const Copilot = (top.BX.AI && top.BX.AI.Copilot) ? top.BX.AI.Copilot : BX.AI.Copilot;
			this.copilot = new Copilot({
				moduleId: 'landing',
				contextId: 'settings',
				category: 'landing_setting',
			});
			this.copilot.subscribe('finish-init', this.copilotFinishInitHandler.bind(this));
			this.copilot.subscribe('save', this.copilotSaveHandler.bind(this));
			this.copilot.subscribe('add_below', this.copilotAddBelowHandler.bind(this));
			BX.Event.bind(document, 'click', this.onClickHandler.bind(this));
			this.copilot.init();

			BX.bind(this.aiCopilotContainer, 'click', () => {
				if (this.isAiActive)
				{
					if (this.finishInit)
					{
						this.showCopilot();
					}
					else
					{
						const checkFinishInit = setInterval(() => {
							if (this.finishInit)
							{
								clearInterval(checkFinishInit);
								this.showCopilot();
							}
						}, 500);
					}
				}
				else if (this.aiUnactiveInfoCode && this.aiUnactiveInfoCode.length > 0)
				{
					BX.UI.InfoHelper.show(this.aiUnactiveInfoCode);
				}
			});

			BX.Dom.append(copilotIcon, this.aiCopilotContainer);
		},
		copilotFinishInitHandler()
		{
			this.copilot.setSelectedText(this.context);
			this.finishInit = true;
		},
		copilotSaveHandler(event)
		{
			this.copilot.hide();
			const result = this.checkLength(event.data.result, this.length);
			if (this.node)
			{
				this.node.textContent = result;
			}
			this.field.value = result;
		},
		copilotAddBelowHandler(event)
		{
			this.copilot.hide();
			if (this.node)
			{
				this.node.textContent = this.checkLength(`${this.node.textContent} ${event.data.result}`, this.length);
			}
			this.field.value = this.checkLength(`${this.field.value} ${event.data.result}`, this.length);
		},
		onClickHandler(event)
		{
			if (!this.aiCopilotContainer.contains(event.target) && this.copilot.isShown())
			{
				this.copilot.hide();
			}
		},
		checkLength(value, length) {
			if (length)
			{
				if (value.length <= length)
				{
					return value;
				}

				return value.slice(0, Math.max(0, length));
			}

			return value;
		},
		showCopilot()
		{
			this.context = this.field.value;
			if (this.context === '')
			{
				this.context = ' ';
			}
			this.copilot.setSelectedText(this.context);
			this.copilot.show({
				width: BX.Dom.getPosition(document.body).width * 0.4,
			});
			const copilotPosition = getCopilotPosition(this.copilot);
			this.copilot.adjust(
				{
					position: {
						top: copilotPosition.top,
						left: copilotPosition.left,
					},
				},
			);
		},
	};

	/**
	 * Favicon change.
	 * @param object params
	 */
	BX.Landing.Favicon = function(params)
	{
		const messages = (params && params.messages) || {};
		const editLink = BX('landing-form-favicon-change');
		const editInput = BX('landing-form-favicon-input');
		const editValue = BX('landing-form-favicon-value');
		const editForm = BX('landing-form-favicon-form');
		const editSrc = BX('landing-form-favicon-src');
		const editError = BX('landing-form-favicon-error');

		if (!editForm || !editInput || !editLink)
		{
			return;
		}

		// The node is the description of the button and a live region at once: a colour is neither
		// announced nor a way to tell what went wrong, so the failure has to reach it as text.
		const formatHint = editError ? editError.textContent : '';
		let failed = false;
		const declareFailure = (next) => {
			if (!editError || next === failed)
			{
				return;
			}

			failed = next;
			editError.textContent = next ? (messages.error || formatHint) : formatHint;
			editError.style.color = next ? 'red' : '';
		};

		// open file dialog
		BX.bind(editLink, 'click', (e) => {
			BX.fireEvent(editInput, 'click');
			BX.PreventDefault(e);
		});
		// upload picture
		BX.bind(editInput, 'change', (e) => {
			BX.ajax.submitAjax(editForm, {
				method: 'POST',
				dataType: 'json',
				onsuccess(data) {
					if (
						data.type === 'success'
						&& typeof data.result !== 'undefined'
						&& data.result !== false
					)
					{
						editValue.value = data.result.id;
						editSrc.setAttribute('src', data.result.src);
						declareFailure(false);
					}
					else
					{
						declareFailure(true);
					}
				},
			});
			BX.PreventDefault(e);
		});
	};

	/**
	 * Custom 503 or 404 page.
	 * @param HTMLSelectElement select
	 */
	BX.Landing.Custom404And503 = function(select, useField)
	{
		BX.bind(select, 'change', (event) => {
			if (event.currentTarget.value === '')
			{
				useField.checked = false;
				useField.click();
			}
			else
			{
				useField.checked = true;
			}
		});

		BX.addCustomEvent('BX.UI.LayoutForm:onToggle', (event) => {
			if (
				event.getData().checkbox
				&& event.getData().checkbox === useField
				&& !event.getData().checkbox.checked
			)
			{
				select.value = '';
			}
		});
	};

	/**
	 * Copyright on/off.
	 */
	BX.Landing.Copyright = function(form, copyright)
	{
		BX.bind(copyright, 'change', function()
		{
			let formAction = form.getAttribute('action');
			formAction = formAction.replace(/&feature_copyright=[NY]/, '');
			formAction += `&feature_copyright=${this.checked ? 'Y' : 'N'}`;
			form.setAttribute('action', formAction);
		});
	};

	/**
	 * Rights.
	 */
	BX.Landing.Access = function(params)
	{
		BX.Landing.Access.selected = params.selected;
		this.table = params.table;
		const name = 'RIGHTS';
		const form = params.form;
		const rowTemplate = params.rowTemplate;
		let inc = params.inc;

		BX.Access.Init({
			other: {
				disabled_cr: true,
			},
		});

		BX.Access.SetSelected(BX.Landing.Access.selected, name);

		function showForm()
		{
			BX.Access.ShowForm({
				callback: (obSelected) => {
					for (const provider in obSelected)
					{
						if (obSelected.hasOwnProperty(provider))
						{
							for (const id in obSelected[provider])
							{
								if (obSelected[provider].hasOwnProperty(id))
								{
									const cnt = this.table.rows.length;
									const row = this.table.insertRow(cnt - 1);
									row.classList.add('landing-form-rights');

									BX.Landing.Access.selected[id] = true;
									// the provider is separated the same way the server rows separate it
									const providerName = BX.Access.GetProviderName(provider);
									const roleName = BX.util.htmlspecialchars(
										(providerName ? `${providerName}: ` : '') + obSelected[provider][id].name,
									);
									// The markup comes from the template, next to the server rendered rows.
									row.innerHTML = rowTemplate
										.replace(/#inc#/g, inc)
										.replace(/#code#/g, () => BX.util.htmlspecialchars(id))
										.replace(/#role#/g, () => roleName);
									inc++;
								}
							}
						}
					}
				},
				bind: name,
			});
		}

		form.addEventListener('click', showForm.bind(this));
	};

	BX.Landing.Access.selected = [];

	BX.Landing.Access.onRowDelete = function(link) {
		BX.Landing.Access.selected[BX.data(BX(link), 'id')] = false;
		BX.remove(BX.findParent(BX(link), { tag: 'tr' }, true));
	};

	/**
	 * Layout.
	 */
	BX.Landing.Layout = function(params)
	{
		this.params = params;
		this.params.messages = this.params.messages || {};
		this.container = this.params.container;
		this.areaFields = [];
		this.builtAreasCount = null;
		this.valueField = this.params.valueField;

		this.values = [];
		if (this.valueField.value)
		{
			this.values = this.valueField.value.split(',').map(value => parseInt(value.split(':')[1]) || 0);
		}
		else if (this.params.defaultValues)
		{
			this.values = this.params.defaultValues;
		}

		const layouts = [].slice.call(this.container.querySelectorAll('.landing-form-layout-item'));
		// the switcher, not the tile: arrow keys of a radio group change the choice without any click
		const switchers = [].slice.call(this.container.querySelectorAll('.layout-switcher'));
		switchers.forEach((switcher) => {
			switcher.addEventListener('change', this.onLayoutChange.bind(this));
			switcher.addEventListener('focus', this.onLayoutFocus.bind(this));
			switcher.addEventListener('blur', this.onLayoutBlur.bind(this));
		});
		this.createBlocks(layouts[0].dataset.block);

		if (typeof this.params.areasCount !== 'undefined')
		{
			this.changeLayout(this.params.areasCount, this.params.current);
		}

		const arrowContainer = this.container.querySelector('.landing-form-select-buttons');
		arrowContainer.addEventListener('click', this.onArrowClick.bind(this));

		if (this.params.tplUse)
		{
			this.useCheck = this.params.tplUse;
			this.inputs = this.container.querySelectorAll('.layout-switcher');
			BX.addCustomEvent('BX.UI.LayoutForm:onToggle', (event) => {
				if (
					event.getData().checkbox
					&& event.getData().checkbox === this.useCheck
				)
				{
					this.container.classList.add('landing-form-page-layout-short');
					this.inputs.forEach((item) => {
						item.checked = false;
					});
				}
			});
		}
	};

	BX.Landing.Layout.CLASS_ITEM_FOCUS = '--focus';

	BX.Landing.Layout.prototype = {
		/**
		 *
		 * @param {number} position
		 * @return {number}
		 */
		getAreaValue(position)
		{
			position = parseInt(position);
			position = Math.min(position, this.areaFields.length);
			position = Math.max(position, 0);

			const savedValue = this.values[position] || 0;
			const value =
				(this.areaFields[position] && this.areaFields[position].getValue())
					? this.areaFields[position].getValue().slice(13)
					: savedValue
			;

			return parseInt(value);
		},

		onArrowClick(event)
		{
			const layoutContainer = this.container.querySelector('.landing-form-list-inner');

			if (event.target.classList.contains('landing-form-select-next'))
			{
				layoutContainer.classList.add('--prev');
			}
			else
			{
				layoutContainer.classList.remove('--prev');
			}
		},

		createBlocks(count)
		{
			count = parseInt(count);
			// Most layouts of the gallery ask for the same number of areas, and a step of the arrow
			// key walks through several of them: the fields hold their values themselves, so building
			// the same set again would only throw them away and build them back.
			if (count === this.builtAreasCount)
			{
				return;
			}

			this.builtAreasCount = count;
			this.areaFields = [];
			const layoutBlockContainer = this.container.querySelector('.landing-form-layout-block-container');
			layoutBlockContainer.innerHTML = '';

			for (let i = 0; i < count; i++)
			{
				const block = BX.create('div', {
					attrs: {
						className: 'landing-form-layout-block-item',
					},
				});

				const numberBlock = i + 1;
				let linkContent = this.getAreaValue(i);
				linkContent = linkContent > 0 ? `#landing${linkContent}` : '';

				const layoutField = new BX.Landing.UI.Field.LinkUrl({
					title: `${this.params.messages.area} #${numberBlock}`,
					content: linkContent,
					textOnly: true,
					disableCustomURL: true,
					disableBlocks: true,
					disallowType: true,
					enableAreas: true,
					allowedTypes: [
						BX.Landing.UI.Field.LinkUrl.TYPE_PAGE,
					],
					typeData: {
						button: {
							className: 'fa fa-chevron-right',
							text: '',
							action: BX.Landing.UI.Field.LinkUrl.TYPE_PAGE,
						},
						hideInput: false,
						contentEditable: false,
					},
					settingMode: true,
					options: {
						siteId: this.params.siteId,
						landingId: this.params.landingId,
						filter: {
							'=TYPE': this.params.type,
						},
					},
					onInit: this.onAreaFieldChange.bind(this),
					onInput: this.onAreaFieldChange.bind(this),
					onValueChange: this.onAreaFieldChange.bind(this),
				});

				this.areaFields[i] = layoutField;
				block.appendChild(layoutField.layout);
				layoutBlockContainer.appendChild(block);
			}
		},

		onAreaFieldChange()
		{
			const values = [];
			for (let i = 0, c = this.areaFields.length; i < c; i++)
			{
				this.values[i] = this.getAreaValue(i);
				values.push(`${i + 1}:${this.getAreaValue(i)}`);
			}
			this.valueField.value = values.join(',');
		},

		onLayoutChange(event)
		{
			const layoutItem = this.getLayoutItem(event.target);
			if (!layoutItem)
			{
				return;
			}

			const layoutItemSelected = this.container.querySelector('.landing-form-layout-item-selected');
			if (layoutItemSelected)
			{
				layoutItemSelected.classList.remove('landing-form-layout-item-selected');
			}

			this.changeLayout(layoutItem.dataset.block, layoutItem.dataset.layout);
		},

		/**
		 * The switcher is out of sight, so the focus is drawn on the item it is bound to, and the
		 * gallery shows five items of seven behind its own clipping: the item is slid into sight as
		 * well, or the choice is made behind the edge.
		 */
		onLayoutFocus(event)
		{
			const layoutItem = this.getLayoutItem(event.target);
			if (!layoutItem)
			{
				return;
			}

			if (isKeyboardFocus(event.target))
			{
				BX.Dom.addClass(layoutItem, BX.Landing.Layout.CLASS_ITEM_FOCUS);
			}

			this.showLayoutItem(layoutItem);
		},

		onLayoutBlur(event)
		{
			const layoutItem = this.getLayoutItem(event.target);
			if (layoutItem)
			{
				BX.Dom.removeClass(layoutItem, BX.Landing.Layout.CLASS_ITEM_FOCUS);
			}
		},

		/**
		 * @param {HTMLInputElement} switcher
		 * @return {HTMLElement|null}
		 */
		getLayoutItem(switcher)
		{
			return switcher.labels ? switcher.labels[0] : null;
		},

		/**
		 * The strip is moved by its own buttons and clips the rest, so a tile reached by the keyboard
		 * stays out of sight until the strip follows the focus.
		 * @param {HTMLElement} layoutItem
		 */
		showLayoutItem(layoutItem)
		{
			const strip = this.container.querySelector('.landing-form-list-inner');
			const viewport = this.container.querySelector('.landing-form-list-container');
			if (!strip || !viewport)
			{
				return;
			}

			const itemPosition = layoutItem.getBoundingClientRect();
			const viewportPosition = viewport.getBoundingClientRect();

			if (itemPosition.right > viewportPosition.right)
			{
				strip.classList.add('--prev');
			}
			else if (itemPosition.left < viewportPosition.left)
			{
				strip.classList.remove('--prev');
			}
		},

		changeLayout(block, layout)
		{
			const detailLayoutContainer = this.container.querySelector('.landing-form-layout-detail');
			this.container.classList.remove('landing-form-page-layout-short');
			detailLayoutContainer.classList.remove('landing-form-layout-detail-hidden');

			this.createBlocks(block);

			if (typeof layout !== 'undefined')
			{
				this.changeLayoutImg(layout);
			}
		},

		changeLayoutImg(layout)
		{
			const layoutDetail = this.container.querySelectorAll('.landing-form-layout-img');
			for (const element of layoutDetail)
			{
				if (element.dataset.layout === layout)
				{
					element.style.display = 'block';
				}
				else
				{
					element.style.display = 'none';
				}
			}
		},
	};

	/**
	 * For show/hide additional fields.
	 * @param HTMLElement form
	 */
	BX.Landing.ToggleAdditionalFields = function(form)
	{
		this.isOpen = false;
		this.form = form;
		this.hiddenRows = BX.convert.nodeListToArray(
			this.form.querySelectorAll(BX.Landing.ToggleAdditionalFields.SELECTOR_ROWS),
		);

		this.toggleContainer = this.form.querySelector(BX.Landing.ToggleAdditionalFields.SELECTOR_CONTAINER);
		this.toggleButton = this.form.querySelector(BX.Landing.ToggleAdditionalFields.SELECTOR_TOGGLE);
		BX.Event.bind(this.toggleContainer, 'click', this.onToggleClick.bind(this));

		if (window.location.hash)
		{
			const anchor = window.location.hash.slice(1);

			this.hiddenRows.forEach((row) => {
				const id = row.dataset[BX.Landing.ToggleAdditionalFields.DATA_ROW_OPTION];
				if (id && id === anchor)
				{
					this.highlightHiddenRow(row);
				}
			});

			const mainOptionRow = this.form.querySelector(
				`[${BX.Landing.ToggleAdditionalFields.DATA_MAIN_OPTION_NAME}="${anchor}"]`,
			);
			if (mainOptionRow)
			{
				this.highlightRow(mainOptionRow);
			}
		}
	};

	BX.Landing.ToggleAdditionalFields.SELECTOR_ROWS = '.landing-form-additional-row';
	BX.Landing.ToggleAdditionalFields.SELECTOR_CONTAINER = '.landing-form-additional-fields-js';
	// the toggle of both settings forms declares its state in the markup, and this script keeps that
	// state in step: a toggle without the attribute is not one it drives
	BX.Landing.ToggleAdditionalFields.SELECTOR_TOGGLE = '.landing-form-collapse-label[aria-expanded]';
	BX.Landing.ToggleAdditionalFields.DATA_OPTION = 'landingAdditionalOption';
	BX.Landing.ToggleAdditionalFields.DATA_ROW_OPTION = 'landingAdditionalDetail';
	BX.Landing.ToggleAdditionalFields.DATA_ROW_OPTION_NAME = 'data-landing-additional-detail';
	BX.Landing.ToggleAdditionalFields.DATA_MAIN_OPTION_NAME = 'data-landing-main-option';
	BX.Landing.ToggleAdditionalFields.CLASS_HIGHLIGHT = 'landing-form-row-highlight';

	BX.Landing.ToggleAdditionalFields.prototype = {
		onToggleClick(event)
		{
			if (event.target.dataset[BX.Landing.ToggleAdditionalFields.DATA_OPTION])
			{
				this.onHeaderClick(event);
			}
			else
			{
				this.toggleRows();
			}
		},

		toggleRows()
		{
			return this.isOpen ? this.hideRows() : this.showRows();
		},

		hideRows()
		{
			const promises = [];
			this.hiddenRows.forEach((row) => {
				if (row.scrollHeight > 0)
				{
					row.style.height = 0;
					promises.push(onTransitionEnd(row));
				}
			});

			BX.Dom.removeClass(this.form, 'landing-form-additional-open');
			this.isOpen = false;
			this.setToggleExpanded(false);

			return Promise.all(promises);
		},

		showRows()
		{
			const promises = [];
			this.hiddenRows.forEach((row) => {
				if (row.scrollHeight > 0)
				{
					row.style.height = 'auto';
					promises.push(onTransitionEnd(row));
				}
			});

			BX.Dom.addClass(this.form, 'landing-form-additional-open');
			this.isOpen = true;
			this.setToggleExpanded(true);

			return Promise.all(promises);
		},

		setToggleExpanded(expanded)
		{
			BX.Dom.attr(this.toggleButton, 'aria-expanded', expanded ? 'true' : 'false');
		},

		onHeaderClick(event) {
			const option = event.target.dataset[BX.Landing.ToggleAdditionalFields.DATA_OPTION];
			if (option)
			{
				const detailSelector = `[${BX.Landing.ToggleAdditionalFields.DATA_ROW_OPTION_NAME} = "${option}"]`;
				const detailRow = this.form.querySelector(detailSelector);
				if (detailRow)
				{
					this.highlightHiddenRow(detailRow);
				}
			}
		},

		highlightHiddenRow(node)
		{
			const promiseShow = this.isOpen ? Promise.resolve() : this.showRows();
			promiseShow.then(() => {
				this.highlightRow(node);
			});
		},

		highlightRow(node)
		{
			BX.Dom.addClass(node, BX.Landing.ToggleAdditionalFields.CLASS_HIGHLIGHT);

			// the row scrolls smoothly on its own, the browser must not jump to it on focus
			node.focus({ preventScroll: true });

			window.scrollTo({
				top: BX.pos(node).top,
				behavior: 'smooth',
			});

			setTimeout(() => {
				BX.Dom.removeClass(node, BX.Landing.ToggleAdditionalFields.CLASS_HIGHLIGHT);
			}, 2500);
		},
	};

	/**
	 * Keyboard and declared state for the checkbox blocks of BX.UI.LayoutForm.
	 *
	 * LayoutForm cancels the native activation of the checkbox and reimplements it on the click of
	 * the whole row, which only a mouse produces: pressed from the keyboard, the native toggle and
	 * the reimplemented one cancel each other out and the block never opens. The key is turned into
	 * the click the row expects instead.
	 *
	 * Enter is taken over as well, unlike on a plain checkbox: the row acts as a disclosure, and the
	 * implicit submission it would trigger instead saves the whole form.
	 *
	 * The checkbox is also the only handle of the block it opens, so it names that block and
	 * declares whether the block is open. The state is set here and not in the markup because
	 * LayoutForm owns the toggle and the blocks are printed by three different places of the two
	 * settings forms.
	 * @param HTMLElement container
	 */
	BX.Landing.FormRowToggleKeyboard = function(container)
	{
		this.container = container;
		BX.Event.bind(this.container, 'keydown', this.onKeyDown.bind(this));
		// the row toggles the block in a handler of its own, and a click reaches the container only
		// after that handler is through
		BX.Event.bind(this.container, 'click', this.onFormEvent.bind(this));
		// a row is also marked without a click: a page chosen in the 404 or 503 list checks the
		// checkbox itself, and LayoutForm reports its own toggle by a custom event
		BX.Event.bind(this.container, 'change', this.onFormEvent.bind(this));
		BX.addCustomEvent('BX.UI.LayoutForm:onToggle', this.onLayoutToggle.bind(this));
		this.declareBlocks();
	};

	BX.Landing.FormRowToggleKeyboard.SELECTOR_ROW = '[data-form-row-hidden]';
	BX.Landing.FormRowToggleKeyboard.SELECTOR_CHECKBOX = '.ui-ctl-element[type="checkbox"]';

	BX.Landing.FormRowToggleKeyboard.prototype = {
		onKeyDown(event)
		{
			if (event.key !== ' ' && event.key !== 'Enter')
			{
				return;
			}

			const checkbox = event.target;
			if (!checkbox.matches || !checkbox.matches(BX.Landing.FormRowToggleKeyboard.SELECTOR_CHECKBOX))
			{
				return;
			}

			const row = this.rowOf(checkbox);
			if (!row)
			{
				return;
			}

			event.preventDefault();
			row.click();
		},

		onFormEvent(event)
		{
			this.declareStateOf(event.target);
		},

		onLayoutToggle(event)
		{
			this.declareStateOf(event.getData().checkbox);
		},

		declareStateOf(node)
		{
			const row = this.rowOf(node) || this.rowOwningBlockOf(node);
			if (row)
			{
				this.declareState(row);
			}
		},

		rowOf(node)
		{
			const row = node && node.closest
				? node.closest(BX.Landing.FormRowToggleKeyboard.SELECTOR_ROW)
				: null;

			return row && this.container.contains(row) ? row : null;
		},

		// a field of the block reports the row that opens it: the 404 and 503 lists mark the checkbox
		// of their row on a change of their own, and no event of the row itself follows
		rowOwningBlockOf(node)
		{
			const block = node && node.closest
				? node.closest(`${BX.Landing.FormRowToggleKeyboard.SELECTOR_ROW} + *`)
				: null;

			return block ? this.rowOf(block.previousElementSibling) : null;
		},

		declareBlocks()
		{
			const rows = this.container.querySelectorAll(BX.Landing.FormRowToggleKeyboard.SELECTOR_ROW);
			[].slice.call(rows).forEach((row) => {
				const checkbox = row.querySelector(BX.Landing.FormRowToggleKeyboard.SELECTOR_CHECKBOX);
				// the block of a row is its next sibling: the pairing LayoutForm itself toggles by
				const block = row.nextElementSibling;
				if (!checkbox || !block)
				{
					return;
				}

				if (block.id === '')
				{
					block.id = `${checkbox.id || BX.util.getRandomString(8)}-block`;
				}

				BX.Dom.attr(checkbox, 'aria-controls', block.id);
				this.declareState(row);
			});
		},

		declareState(row)
		{
			const checkbox = row.querySelector(BX.Landing.FormRowToggleKeyboard.SELECTOR_CHECKBOX);
			if (checkbox && checkbox.hasAttribute('aria-controls'))
			{
				BX.Dom.attr(checkbox, 'aria-expanded', checkbox.checked ? 'true' : 'false');
			}
		},
	};

	/**
	 * GA metrika.
	 */
	BX.Landing.ExternalMetrika = function(fieldUseId, fieldSendClickId, fieldSendShowId)
	{
		if (fieldUseId.value === '')
		{
			fieldSendClickId.disabled = true;
			fieldSendShowId.disabled = true;
		}

		fieldUseId.addEventListener('input', onInput.bind(this));

		function onInput()
		{
			if (fieldUseId.value === '')
			{
				fieldSendClickId.disabled = true;
				fieldSendClickId.checked = false;

				fieldSendShowId.disabled = true;
				fieldSendShowId.checked = false;
			}
			else
			{
				fieldSendClickId.disabled = false;
				fieldSendShowId.disabled = false;
			}
		}
	};

	/**
	 * Change save button.
	 */

	BX.Landing.SaveBtn = function(saveBtn)
	{
		saveBtn.addEventListener('click', changeSaveBtn.bind(this));

		function changeSaveBtn()
		{
			saveBtn.classList.add('ui-btn-clock');
			saveBtn.style.cursor = 'default';
			saveBtn.style.pointerEvents = 'none';
		}
	};

	/**
	 * Cookies.
	 */
	BX.Landing.Cookies = function()
	{
		this.bgPickerBtn = document.querySelector('.landing-form-cookies-color-bg');
		this.textPickerBtn = document.querySelector('.landing-form-cookies-color-text');
		this.simplePreview = document.querySelector('.landing-form-cookies-settings-type-simple');
		this.advancedPreview = document.querySelector('.landing-form-cookies-settings-type-advanced');
		this.positions = document.querySelectorAll('.landing-form-cookies-position-item');
		this.positionSwitchers = document.querySelectorAll('.landing-form-cookies-position-input');
		this.inputApp = document.querySelector('#radio-cookies-mode-A');
		this.inputInfo = document.querySelector('#radio-cookies-mode-I');
		this.settings = document.querySelector('.landing-form-cookies-settings-wrapper');

		this.bgPicker = new BX.ColorPicker({
			bindElement: this.bgPickerBtn,
			popupOptions: { angle: false, offsetTop: 5 },
			onColorSelected: this.onBgColorSelected.bind(this),
			colors: BX.Landing.ColorPicker.prototype.setColors(),
		});

		this.textPicker = new BX.ColorPicker({
			bindElement: this.textPickerBtn,
			popupOptions: { angle: false, offsetTop: 5 },
			onColorSelected: this.onTextColorSelected.bind(this),
			colors: BX.Landing.ColorPicker.prototype.setColors(),
		});

		this.setSelectedBgColor(this.bgPickerBtn.value);
		this.setSelectedTextColor(this.textPickerBtn.value);
		this.hideCookiesSettings();

		this.bindEvents();
	};

	BX.Landing.Cookies.CLASS_ITEM_FOCUS = '--focus';

	BX.Landing.Cookies.prototype = {

		bindEvents() {
			// A click on the corner and an arrow key inside the radiogroup both check the switcher, so
			// the change event of the switcher covers the mouse and the keyboard alike.
			this.positionSwitchers.forEach((switcher) => {
				switcher.addEventListener('change', this.onSelectCookiesPosition.bind(this));
				switcher.addEventListener('focus', this.onPositionFocus.bind(this));
				switcher.addEventListener('blur', this.onPositionBlur.bind(this));
			});

			this.bgPickerBtn.addEventListener('click', this.showBgPicker.bind(this));
			this.textPickerBtn.addEventListener('click', this.showTextPicker.bind(this));
			this.inputInfo.addEventListener('change', this.hideCookiesSettings.bind(this));
			this.inputApp.addEventListener('change', this.showCookiesSettings.bind(this));
		},

		onBgColorSelected() {
			const color = this.bgPicker.getSelectedColor();
			this.setSelectedBgColor(color);
		},

		onTextColorSelected() {
			const color = this.textPicker.getSelectedColor();
			this.setSelectedTextColor(color);
		},

		onSelectCookiesPosition(event) {
			const item = this.getPositionItem(event.target);
			if (!item)
			{
				return;
			}

			this.positions.forEach((position) => {
				if (position.classList.contains('landing-form-cookies-position-item-selected'))
				{
					position.classList.remove('landing-form-cookies-position-item-selected');
				}
			});
			item.classList.add('landing-form-cookies-position-item-selected');
		},

		/**
		 * The switcher is out of sight, so the focus is drawn on the corner it is bound to. The pair
		 * is resolved here: CSS cannot pair a switcher with its own label by itself.
		 */
		onPositionFocus(event) {
			const item = this.getPositionItem(event.target);
			if (item && isKeyboardFocus(event.target))
			{
				BX.Dom.addClass(item, BX.Landing.Cookies.CLASS_ITEM_FOCUS);
			}
		},

		onPositionBlur(event) {
			const item = this.getPositionItem(event.target);
			if (item)
			{
				BX.Dom.removeClass(item, BX.Landing.Cookies.CLASS_ITEM_FOCUS);
			}
		},

		getPositionItem(switcher) {
			return [].slice.call(this.positions).find((item) => item.getAttribute('for') === switcher.id) ?? null;
		},

		showBgPicker() {
			this.bgPicker.open();
		},

		showTextPicker() {
			this.textPicker.open();
		},

		setSelectedBgColor(color) {
			this.bgPickerBtn.style.background = color;
			this.bgPickerBtn.value = color;
			this.simplePreview.style.background = color;
			this.advancedPreview.style.background = color;
		},

		setSelectedTextColor(color) {
			this.textPickerBtn.style.background = color;
			this.textPickerBtn.value = color;
			this.advancedPreview.style.color = color;

			const svgList = document.querySelectorAll('.landing-form-cookies-settings-preview-svg');
			svgList.forEach((svg) => {
				svg.style.fill = color;
			});
		},

		hideCookiesSettings()
		{
			if (this.inputInfo.checked)
			{
				this.settings.style.height = '0';
				this.settings.style.opacity = '0';
			}
		},

		showCookiesSettings() {
			if (this.inputApp.checked)
			{
				this.settings.style.height = `${this.settings.scrollHeight}px`;
				this.settings.style.opacity = '1';
				onTransitionEnd(this.settings).then(() => {
					this.settings.height = 'auto';
				});
			}
		},

	};

	/**
	 * B24 widget change custom color
	 * @param typeSelector
	 * @param colorInput
	 * @constructor
	 */
	BX.Landing.B24ButtonColor = function(typeSelector, colorInput)
	{
		this.typeSelector = typeSelector;
		this.colorInput = colorInput;
		this.valueControlWrap = BX.findParent(colorInput, { class: 'ui-ctl' });

		bind(typeSelector, 'change', this.checkVisibility.bind(this));

		this.checkVisibility();
	};

	BX.Landing.B24ButtonColor.prototype = {
		checkVisibility()
		{
			this.valueControlWrap.hidden = this.typeSelector.value !== 'custom';
			this.colorInput.labels.forEach((label) => {
				label.hidden = this.typeSelector.value !== 'custom';
			});
		},
	};

	/**
	 * Alert for fields, then need republication after change
	 * @param inputIds
	 * @constructor
	 */
	BX.Landing.NeedPublicationField = function(inputIds)
	{
		inputIds.forEach((id) => {
			const input = BX(id);
			if (input)
			{
				BX.bind(input, 'click', () => {
					BX.UI.Dialogs.MessageBox.alert(BX.Loc.getMessage('LANDING_EDIT_NEED_PUBLICATION'));
				});
			}
		});
	};

	/**
	 * For setting color palette
	 * @param HTMLElement allColorsNode
	 * @param ?HTMLElement customColorNode
	 */
	BX.Landing.ColorPalette = function(allColorsNode, customColorNode)
	{
		this.allColorsNode = allColorsNode;
		this.customColorNode = null;
		this.colorPickerNode = null;
		if (typeof customColorNode !== 'undefined' && customColorNode)
		{
			this.customColorNode = customColorNode;
			this.colorPickerNode = customColorNode.querySelector('input[type="text"]');
		}

		this.init();

		return this;
	};

	BX.Landing.ColorPalette.prototype = {
		/**
		 * Initializes template preview elements
		 */
		init()
		{
			// themes
			let colorItems;
			if (this.allColorsNode)
			{
				colorItems = slice(this.allColorsNode.children);
			}

			if (this.customColorNode)
			{
				colorItems = [...colorItems, this.customColorNode];
			}

			if (colorItems)
			{
				colorItems.forEach(this.initSelectableItem, this);
			}

			if (colorItems)
			{
				this.setColor();
			}
		},

		setColor(theme) {
			if (theme === undefined)
			{
				this.color = data(this.getActiveColorNode(), 'data-value');
			}
			else
			{
				this.color = theme;
			}

			if (this.colorPickerNode)
			{
				this.colorPickerNode.setAttribute('value', this.color);
			}
		},

		getActiveColorNode()
		{
			let active;
			if (this.allColorsNode)
			{
				active = this.allColorsNode.querySelector('.active');
			}

			if (!active && this.customColorNode && BX.Dom.hasClass(this.customColorNode, 'active'))
			{
				active = this.customColorNode;
			}

			// by default - first
			if (!active && this.allColorsNode)
			{
				active = this.allColorsNode.firstElementChild;
			}

			return active;
		},

		/**
		 * Initializes selectable items
		 * @param {HTMLElement} item
		 */
		initSelectableItem(item)
		{
			bind(item, 'click', proxy(this.onSelectableItemClick, this));
		},

		/**
		 * Handles click on selectable item
		 * @param event
		 */
		onSelectableItemClick(event)
		{
			event.preventDefault();

			// themes
			if (event.currentTarget.parentElement === this.allColorsNode && event.currentTarget.hasAttribute('data-value'))
			{
				removeClass(this.getActiveColorNode(), 'active');
				addClass(event.currentTarget, 'active');
				this.setColor(data(event.currentTarget, 'data-value'));
			}

			this.currentTarget = event.currentTarget;
			BX.Event.EventEmitter.subscribe('BX.Landing.ColorPickerTheme:onSelectColor', () => {
				if (this.currentTarget.hasAttribute('data-value'))
				{
					removeClass(this.getActiveColorNode(), 'active');
					addClass(this.currentTarget, 'active');
					this.setColor(data(this.currentTarget, 'data-value'));
				}
			});
		},
	};

	/**
	 * Extend main colorpicker for landings
	 */
	BX.Landing.ColorPicker = function(node, params, metrikaParams = {})
	{
		let defaultColor = null;
		if (params)
		{
			defaultColor = params.defaultColor;
		}

		this.metrikaParams = metrikaParams;

		this.element = node;

		this.loader = new BX.Loader({
			target: node.parentNode,
			size: 29,
			offset: {
				left: '30%',
			},
		});

		this.currentColor = null;
		if (this.element.value)
		{
			this.currentColor = this.element.value;
		}

		this.colorField = new BX.Landing.UI.Field.ColorField({
			subtype: 'color',
		});
		this.colorField.createPopup({
			contentRoot: null,
			isNeedCalcPopupOffset: false,
			isNeedResetPopupWhenOpen: false,
			analytics: this.getMetrikaParams(),
		});
		if (this.currentColor !== null)
		{
			this.colorField.colorPopup.setHexValue(this.currentColor);
		}
		this.colorField.colorPopup.subscribe('onHexColorPopupChange', (e) => {
			this.onColorSelected(e.data);
		});
		this.colorField.colorPopup.subscribe('onPopupShow', (e) => {
			this.loader.hide();
		});

		this.input = node;
		this.colorPickerNode = node.parentElement;
		BX.addClass(this.colorPickerNode, 'ui-colorpicker');

		this.colorIcon = BX.create('span', {
			props: {
				className: 'ui-colorpicker-color',
			},
		});
		BX.insertBefore(this.colorIcon, this.input);

		this.colorValue = node.value;
		if (!this.colorValue && defaultColor)
		{
			node.value = defaultColor;
			this.colorValue = node.value;
		}

		if (this.colorValue)
		{
			BX.adjust(this.colorIcon, {
				attrs: {
					style: `background-color:${this.colorValue}`,
				},
			});

			BX.addClass(this.colorPickerNode, 'ui-colorpicker-selected');
		}

		this.clearBtn = BX.create('span', {
			props: {
				className: 'ui-colorpicker-clear',
			},
		});
		BX.insertAfter(this.clearBtn, this.input);

		BX.bind(this.colorPickerNode, 'click', this.show.bind(this));
		BX.bind(this.clearBtn, 'click', this.clear.bind(this));
	};

	BX.Landing.ColorPicker.prototype = {
		onColorSelected(color)
		{
			this.colorPickerNode.classList.add('ui-colorpicker-selected');
			this.colorIcon.style.backgroundColor = color;
			this.input.value = color;
			BX.Event.EventEmitter.emit(this, 'BX.Landing.ColorPicker:onSelectColor');
		},
		show(event)
		{
			if (event.target === this.clearBtn)
			{
				return;
			}

			this.loader.show();
			this.colorField.colorPopup.onPopupOpenClick(event, this.element);
		},
		clear()
		{
			this.colorPickerNode.classList.remove('ui-colorpicker-selected');
			this.input.value = '';
			BX.Event.EventEmitter.emit(this, 'BX.Landing.ColorPicker:onClearColorPicker');
		},
		setColors()
		{
			return [
				['#f5f5f5', '#eeeeee', '#e0e0e0', '#9e9e9e', '#757575', '#616161', '#212121'],
				['#cfd8dc', '#b0bec5', '#90a4ae', '#607d8b', '#546e7a', '#455a64', '#263238'],
				['#d7ccc8', '#bcaaa4', '#a1887f', '#795548', '#6d4c41', '#5d4037', '#3e2723'],
				['#ffccbc', '#ffab91', '#ff8a65', '#ff5722', '#f4511e', '#e64a19', '#bf360c'],
				['#ffe0b2', '#ffcc80', '#ffb74d', '#ff9800', '#fb8c00', '#f57c00', '#e65100'],
				['#ffecb3', '#ffe082', '#ffd54f', '#ffc107', '#ffb300', '#ffa000', '#ff6f00'],
				['#fff9c4', '#fff59d', '#fff176', '#ffeb3b', '#fdd835', '#fbc02d', '#f57f17'],
				['#f0f4c3', '#e6ee9c', '#dce775', '#cddc39', '#c0ca33', '#afb42b', '#827717'],
				['#dcedc8', '#c5e1a5', '#aed581', '#8bc34a', '#7cb342', '#689f38', '#33691e'],
				['#c8e6c9', '#a5d6a7', '#81c784', '#4caf50', '#43a047', '#388e3c', '#1b5e20'],
				['#b2dfdb', '#80cbc4', '#4db6ac', '#009688', '#00897b', '#00796b', '#004d40'],
				['#b2ebf2', '#80deea', '#4dd0e1', '#00bcd4', '#00acc1', '#0097a7', '#006064'],
				['#b3e5fc', '#81d4fa', '#4fc3f7', '#03a9f4', '#039be5', '#0288d1', '#01579b'],
				['#bbdefb', '#90caf9', '#64b5f6', '#2196f3', '#1e88e5', '#1976d2', '#0d47a1'],
				['#c5cae9', '#9fa8da', '#7986cb', '#3f51b5', '#3949ab', '#303f9f', '#1a237e'],
				['#d1c4e9', '#b39ddb', '#9575cd', '#673ab7', '#5e35b1', '#512da8', '#311b92'],
				['#e1bee7', '#ce93d8', '#ba68c8', '#9c27b0', '#8e24aa', '#7b1fa2', '#4a148c'],
				['#f8bbd0', '#f48fb1', '#f06292', '#e91e63', '#d81b60', '#c2185b', '#880e4f'],
				['#ffcdd2', '#ef9a9a', '#e57373', '#f44336', '#e53935', '#d32f2f', '#b71c1c'],
			].map((item, index, arr) => {
				return arr.map((row) => {
					return row[index];
				});
			});
		},
		getMetrikaParams()
		{
			return {
				category: 'settings',
				c_sub_section: this.metrikaParams?.subSection ?? null,
				p1: this.metrikaParams?.p1 ?? null,
			};
		},
	};
})();
