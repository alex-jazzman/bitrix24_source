import { Event } from 'main.core';
import { BitrixVue } from 'ui.vue';
import { SkuTree } from 'catalog.sku-tree';
import { Announcer } from 'sale.checkout.lib';
import { EventType } from 'sale.checkout.const';
import { EventEmitter } from 'main.core.events';

import { whenShutterVisible } from './focus';

const changeSkuShutterSelector = '.js-backdrop-open-change-sku';
const skuLoadedEvent = 'BX.Catalog.SkuTree::onSkuLoaded';

BitrixVue.component('sale-checkout-view-product-sku_tree', {
	props: ['tree', 'index'],
	data()
	{
		return {
			skuTree: new SkuTree({
				skuTree: this.tree,
				selectable: true,
				hideUnselected: false
			})
		}
	},
	computed:
	{
		localize()
		{
			return BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_PRODUCT_SKU_')
		},
		getHash()
		{
			return this.prepareValues(this.tree.SELECTED_VALUES)
		}
	},
	methods:
	{
		prepareValues(values)
		{
			return Object.keys(values)
			.concat(
				Object.values(values))
			.join()
		},
		appendBlockHtml()
		{
			let wrapper = this.$refs.container;
			wrapper.appendChild(this.skuTree.layout());
		},
		focusSelectedProperty()
		{
			const propertyId = Object.keys(this.tree.SELECTED_VALUES ?? {})[0];

			if (propertyId === undefined)
			{
				return;
			}

			this.releaseFocusBeforeEntry();

			// the method is new in catalog and modules update on their own schedule
			this.skuTree.focusPropertyTabStop?.(propertyId);
		},
		// catalog draws the radios once its request for the properties is back, which may come after the shutter
		// has appeared
		focusSelectedPropertyWhenDrawn()
		{
			this.stopWaitingForDraw();

			if (this.$el.contains(document.activeElement))
			{
				return;
			}

			this.visitorActed = false;
			this.focusBeforeVisitor = null;
			this.visitorInputHandler = () => {
				if (!this.visitorActed)
				{
					this.visitorActed = true;
					this.focusBeforeVisitor = document.activeElement;
				}
			};
			Event.bind(document, 'keydown', this.visitorInputHandler, true);
			Event.bind(document, 'pointerdown', this.visitorInputHandler, true);

			this.skuLoadedHandler = (event) => {
				if (event.getData()?.id !== this.skuTree.id)
				{
					return;
				}

				const focusLeftByShutter = this.isFocusLeftByShutter();
				this.stopWaitingForDraw();

				if (
					focusLeftByShutter
					&& this.$el.closest('[inert]') === null
					&& !this.$el.contains(document.activeElement)
				)
				{
					this.focusSelectedProperty();
				}
			};

			EventEmitter.subscribe(skuLoadedEvent, this.skuLoadedHandler);
		},
		// the trap of the shutter puts the focus on its first stop meanwhile; a focus the visitor has moved stays
		isFocusLeftByShutter()
		{
			const active = document.activeElement;

			return !this.visitorActed
				|| active === null
				|| active === document.body
				|| active === this.focusBeforeVisitor;
		},
		stopWaitingForDraw()
		{
			if (this.skuLoadedHandler !== null)
			{
				EventEmitter.unsubscribe(skuLoadedEvent, this.skuLoadedHandler);
				this.skuLoadedHandler = null;
			}

			if (this.visitorInputHandler !== null)
			{
				Event.unbind(document, 'keydown', this.visitorInputHandler, true);
				Event.unbind(document, 'pointerdown', this.visitorInputHandler, true);
				this.visitorInputHandler = null;
				this.focusBeforeVisitor = null;
			}
		},
		// the focus zone of the group adopts an entry only from nowhere: coming from the opener,
		// its arrow cursor would stay on the first value and the arrows would not move
		releaseFocusBeforeEntry()
		{
			const active = document.activeElement;

			if (active !== null && active !== document.body && !this.$el.contains(active))
			{
				active.blur();
			}
		},
		// Orca repeats the state of a radio only after Space, so a choice by Enter, arrows or mouse is silent;
		// the property name goes first, since a product carries several groups
		announceChoice(propertyId)
		{
			const chosen = this.$el.querySelector(
				`[role="radio"][data-property-id="${CSS.escape(String(propertyId))}"][aria-checked="true"]`,
			);

			if (chosen === null)
			{
				return;
			}

			const value = chosen.getAttribute('aria-label') || chosen.getAttribute('title') || '';

			if (value === '')
			{
				return;
			}

			const property = this.getGroupName(chosen);
			const template = this.localize.CHECKOUT_VIEW_PRODUCT_SKU_SELECTED_ARIA || '';
			const replacements = { '#PROPERTY#': property, '#VALUE#': value };

			Announcer.announce(
				property === '' || template === ''
					? value
					: template.replace(/#PROPERTY#|#VALUE#/g, (placeholder) => replacements[placeholder]),
			);
		},
		getGroupName(node)
		{
			const group = node.closest('[role="radiogroup"]');

			if (group === null)
			{
				return '';
			}

			const label = group.getAttribute('aria-label');

			if (label)
			{
				return label;
			}

			const titleId = group.getAttribute('aria-labelledby');
			const title = titleId === null ? null : document.getElementById(titleId);

			return title === null ? '' : (title.textContent ?? '').trim();
		},
	},
	watch:
	{
		getHash()
		{
			let selectedValues  = this.tree.SELECTED_VALUES;

			try
			{
				for (let propertyId in selectedValues)
				{
					if (!selectedValues.hasOwnProperty(propertyId))
					{
						continue;
					}

					this.skuTree.setSelectedProperty(propertyId, selectedValues[propertyId]);
				}
			}
			catch (e) {}

			this.skuTree.toggleSkuProperties();
		}
	},
	created()
	{
		this.cancelShutterWait = null;
		this.skuLoadedHandler = null;
		this.visitorInputHandler = null;
		this.focusBeforeVisitor = null;
		this.visitorActed = false;

		// the group was built in a hidden shutter, so its radios get a tab stop only when asked for one
		this.openChangeSkuHandler = (event) => {
			if (event.getData().index !== this.index)
			{
				return;
			}

			this.$nextTick(() => {
				this.cancelShutterWait = whenShutterVisible(this.$el, () => {
					// a shutter the row refused to open, or closed during the fade, stays inert
					if (this.$el.closest('[inert]') === null)
					{
						this.focusSelectedProperty();
						this.focusSelectedPropertyWhenDrawn();
					}
				});
			});
		};
	},
	mounted()
	{
		this.appendBlockHtml();

		if (this.$el.closest(changeSkuShutterSelector) !== null)
		{
			EventEmitter.subscribe(EventType.basket.backdropOpenChangeSku, this.openChangeSkuHandler);
		}

		if (this.skuTree)
		{
			// fired only on a choice of the visitor, not when the watcher above replays the offers
			this.skuTree.subscribe(EventType.basket.changeSkuOriginName, (event) => {
				const data = event.getData();

				this.announceChoice(data[1]?.ID);
				EventEmitter.emit(EventType.basket.changeSku, {index: this.index, data})
			});
		}
	},
	beforeDestroy()
	{
		this.cancelShutterWait?.();
		this.stopWaitingForDraw();
		EventEmitter.unsubscribe(EventType.basket.backdropOpenChangeSku, this.openChangeSkuHandler);
	},
	// language=Vue
	template: `<div data-testid="sale-checkout-sku-tree">
	  	<div ref="container"/>
    </div>
	`
});