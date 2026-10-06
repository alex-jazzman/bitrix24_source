import {Dom, Event, Tag, Text, Type} from 'main.core';
import {EventEmitter} from 'main.core.events';
import {FocusZone, FocusKeys} from 'ui.a11y';
import {SkuTree} from 'catalog.sku-tree';

export default class SkuProperty
{
	parent: ?SkuTree;

	focusZone: ?FocusZone = null;

	skuSelectHandler = this.handleSkuSelect.bind(this);

	skuKeydownHandler = this.handleSkuKeydown.bind(this);

	constructor(options)
	{
		this.parent = options.parent || null;
		if (!this.parent)
		{
			throw new Error('Parent is not defined.');
		}

		this.property = options.property || {};
		this.offers = options.offers || [];
		this.existingValues = options.existingValues || [];
		this.nodeDescriptions = [];
		this.hideUnselected = options.hideUnselected;
	}

	getId()
	{
		return this.property.ID;
	}

	getSelectedSkuId()
	{
		return this.parent.getSelectedSkuId();
	}

	hasSkuValues()
	{
		return this.property.VALUES.length;
	}

	renderPictureSku(propertyValue, uniqueId)
	{
		const propertyName = Type.isStringFilled(propertyValue.NAME) ? Text.encode(propertyValue.NAME) : '';

		let nameNode = '';
		if (Type.isStringFilled(propertyName))
		{
			nameNode = Tag.render`<span class="ui-ctl-label-text">${propertyName}</span>`;
		}

		let iconNode = '';
		if (propertyValue.PICT && propertyValue.PICT.SRC)
		{
			const style = "background-image: url('" + propertyValue.PICT.SRC + "');";
			iconNode = Tag.render`<span class="ui-ctl-label-img" style="${style}"></span>`;
		}
		else if (nameNode)
		{
			nameNode.style.paddingLeft = '0';
		}
		else
		{
			nameNode = Tag.render`<span class="ui-ctl-label-text">-</span>`;
		}

		const titleItem =
			this.parent.isShortView && Type.isStringFilled(this.property.NAME)
				? Text.encode(this.property.NAME)
				: propertyName
		;

		const node = Tag.render`
			<label 	class="ui-ctl ui-ctl-radio-selector"
					onclick="${this.skuSelectHandler}"
					title="${titleItem}"
					data-property-id="${this.getId()}"
					data-property-value="${propertyValue.ID}">
				<input type="radio"
					disabled="${!this.parent.isSelectable()}"
					name="property-${this.getSelectedSkuId()}-${this.getId()}-${uniqueId}"
					class="ui-ctl-element">
				<span class="ui-ctl-inner">
					${iconNode}
					${nameNode}
				</span>
			</label>
		`;

		this.#applyRadioSemantics(node, propertyValue);

		return node;
	}

	renderTextSku(propertyValue, uniqueId)
	{
		const propertyName = Type.isStringFilled(propertyValue.NAME) ? Text.encode(propertyValue.NAME) : '-';
		const titleItem =
			this.parent.isShortView && Type.isStringFilled(this.property.NAME)
				? Text.encode(this.property.NAME)
				: propertyName
		;

		const node = Tag.render`
			<label 	class="ui-ctl ui-ctl-radio-selector"
					onclick="${this.skuSelectHandler}"
					title="${titleItem}"
					data-property-id="${this.getId()}"
					data-property-value="${propertyValue.ID}">
				<input type="radio"
					disabled="${!this.parent.isSelectable()}"
					name="property-${this.getSelectedSkuId()}-${this.getId()}-${uniqueId}"
					class="ui-ctl-element">
				<span class="ui-ctl-inner">
					<span class="ui-ctl-label-text">${propertyName}</span>
				</span>
			</label>
		`;

		this.#applyRadioSemantics(node, propertyValue);

		return node;
	}

	// ui.forms renders the native <input type=radio> as display:none, so it is not
	// in the accessibility tree. Carry the radio semantics on the visible <label>
	// instead (APG radiogroup); the hidden input stays only for CSS :checked styling.
	#applyRadioSemantics(node, propertyValue): void
	{
		Dom.attr(node, 'role', 'radio');

		if (this.parent.isSelectable())
		{
			// Managed by FocusZone (roving tabindex); presence makes the label focusable.
			Dom.attr(node, 'tabindex', '-1');
		}
		else
		{
			// The hidden native input carries `disabled`, but it is not in the a11y tree.
			// Mirror the disabled state onto the visible label that holds the radio role.
			Dom.attr(node, 'aria-disabled', 'true');
		}

		if (Type.isStringFilled(propertyValue.NAME))
		{
			Dom.attr(node, 'aria-label', propertyValue.NAME);
		}
	}

	layout()
	{
		if (!this.hasSkuValues())
		{
			return;
		}

		this.skuList = this.renderProperties();
		this.toggleSkuPropertyValues();

		Dom.attr(this.skuList, 'role', 'radiogroup');

		const hasName = Type.isStringFilled(this.property.NAME);
		let title = '';
		if (!this.parent.isShortView)
		{
			const titleId = `sku-radiogroup-title-${this.getId()}-${Text.getRandom()}`;
			title = Tag.render`<div class="product-item-detail-info-container-title" id="${titleId}">${Text.encode(this.property.NAME)}</div>`;
			if (hasName)
			{
				Dom.attr(this.skuList, 'aria-labelledby', titleId);
			}
		}
		else if (hasName)
		{
			Dom.attr(this.skuList, 'aria-label', this.property.NAME);
		}

		this.#activateFocusZone();

		return Tag.render`
			<div class="product-item-detail-info-container">
				${title}
				<div class="product-item-scu-container">
					${this.skuList}
				</div>
			</div>
		`;
	}

	#activateFocusZone(): void
	{
		// Radio semantics live on the labels (native inputs are display:none), so
		// FocusZone provides the arrow-key roving-tabindex navigation over them.
		if (!this.parent.isSelectable() || this.focusZone)
		{
			return;
		}

		// Selection is decoupled from focus: arrows only move the roving focus.
		// A radio is selected by Enter/Space (keydown below) or click (label onclick).
		Event.bind(this.skuList, 'keydown', this.skuKeydownHandler);

		this.focusZone = new FocusZone(this.skuList, {
			bindKeys: FocusKeys.ArrowHorizontal | FocusKeys.ArrowVertical | FocusKeys.HomeAndEnd,
			focusOutBehavior: 'wrap',
			// Roving tab-stop follows the checked value (APG radiogroup entry point).
			focusInStrategy: () => this.getTabStopElement(),
		});

		requestAnimationFrame(() => {
			if (this.focusZone && !this.focusZone.isActive())
			{
				this.focusZone.activate();
			}
		});
	}

	getTabStopElement(): ?HTMLElement
	{
		if (!this.skuList)
		{
			return null;
		}

		return this.skuList.querySelector('[role="radio"][aria-checked="true"]')
			|| this.skuList.querySelector('[role="radio"]');
	}

	focusTabStop(): void
	{
		const element = this.getTabStopElement();
		if (!element)
		{
			return;
		}

		// The group was just recreated: make sure its FocusZone is live before
		// moving DOM focus, so the roving tab-stop lands on the checked value.
		if (this.focusZone && !this.focusZone.isActive())
		{
			this.focusZone.activate();
		}

		this.focusZone?.refreshElements();
		element.focus();
	}

	renderProperties()
	{
		const skuList = Tag.render`<div class="product-item-scu-list ui-ctl-spacing-right"></div>`;

		this.property.VALUES.forEach((propertyValue) => {
			let propertyValueId = propertyValue.ID;
			let node;
			let uniqueId = Text.getRandom();

			if (!propertyValueId || this.existingValues.includes(propertyValueId))
			{
				if (this.property.SHOW_MODE === 'PICT')
				{
					Dom.addClass(skuList, 'product-item-scu-list--pick-color');
					node = this.renderPictureSku(propertyValue, uniqueId);
				}
				else
				{
					Dom.addClass(skuList, 'product-item-scu-list--pick-size');
					node = this.renderTextSku(propertyValue, uniqueId);
				}

				this.nodeDescriptions.push({propertyValueId, node});
				skuList.appendChild(node);
			}
		});

		return skuList;
	}

	toggleSkuPropertyValues()
	{
		const selectedSkuProperty = this.parent.getSelectedSkuProperty(this.getId());
		const activeSkuProperties = this.parent.getActiveSkuProperties(this.getId());

		const visibleNodes = [];

		this.nodeDescriptions.forEach((item) => {
			let id = Text.toNumber(item.propertyValueId);
			let input = item.node.querySelector('input[type="radio"]');

			if (selectedSkuProperty === id)
			{
				input.checked = true;
				Dom.addClass(item.node, 'selected');
				Dom.attr(item.node, 'aria-checked', 'true');
			}
			else
			{
				input.checked = false;
				Dom.removeClass(item.node, 'selected');
				Dom.attr(item.node, 'aria-checked', 'false');
			}

			if (
				(this.hideUnselected && selectedSkuProperty !== id)
				|| !activeSkuProperties.includes(item.propertyValueId)
			)
			{
				Dom.style(item.node, {display: 'none'});
			}
			else
			{
				Dom.style(item.node, {display: null});
				visibleNodes.push(item.node);
			}
		});

		// The browser cannot compute set position (radio semantics live on labels,
		// not a native group), so expose it explicitly for screen readers.
		visibleNodes.forEach((node, index) => {
			Dom.attr(node, 'aria-setsize', visibleNodes.length);
			Dom.attr(node, 'aria-posinset', index + 1);
		});

		// Defer to the next frame: SkuTree toggles every group in sequence, so
		// refreshing here would interleave DOM writes with layout-reading visibility
		// checks and force a reflow per group.
		requestAnimationFrame(() => {
			this.focusZone?.refreshElements();
		});
	}

	handleSkuKeydown(event)
	{
		if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')
		{
			return;
		}

		const radio = event.target.closest('[role="radio"][data-property-id]');
		if (!radio || !this.skuList.contains(radio))
		{
			return;
		}

		// Non-native radio (semantics on the label): the browser does not synthesize
		// activation from Enter/Space, so do it here. preventDefault stops Space scroll.
		event.preventDefault();
		this.handleSkuSelect(event);
	}

	handleSkuSelect(event)
	{
		event.stopPropagation();

		const selectedSkuProperty = event.target.closest('[data-property-id]');
		if (!this.parent.isSelectable() || Dom.hasClass(selectedSkuProperty, 'selected'))
		{
			return;
		}

		const fromKeyboard = event.type === 'keydown';
		const propertyId = Text.toNumber(selectedSkuProperty.getAttribute('data-property-id'));
		const propertyValue = Text.toNumber(selectedSkuProperty.getAttribute('data-property-value'));
		this.parent.setSelectedProperty(propertyId, propertyValue);

		this.parent.getSelectedSku().then((selectedSkuData) => {
			const meta = { fromKeyboard, propertyId };
			EventEmitter.emit('SkuProperty::onChange', [selectedSkuData, this.property, meta]);
			if (this.parent)
			{
				this.parent.emit('SkuProperty::onChange', [selectedSkuData, this.property, meta]);
			}
		});

		this.parent.toggleSkuProperties();
	}
}
