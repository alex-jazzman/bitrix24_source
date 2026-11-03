import { BitrixVue } from 'ui.vue';
import { Dom } from 'main.core'
import { Property as Const } from 'sale.checkout.const';
import { Dialog } from 'ui.entity-selector';

import { MixinPropertyField } from './property-field';

const openingKeys = ['Enter', ' ', 'ArrowDown'];

BitrixVue.component('sale-checkout-view-element-input-property-enum', {
	mixins: [MixinPropertyField],
	props: ['item', 'index', 'variants'],
	data()
	{
		return { expanded: false };
	},
	mounted()
	{
		this.createDialog();
	},
	methods: {
		createDialog()
		{
			this.popupMenu = new Dialog({
				targetNode: this.$el,
				dropdownMode: true,
				showAvatars: false,
				compactView: true,
				focusOnFirst: false,
				multiple: false,
				items: this.getMenuItems(),
				events: {
					'Item:onSelect': this.onSelect,
					'Item:onDeselect': this.onDeselect,
					onShow: this.onShow,
					onHide: this.onHide,
				},
				footer: this.isRequired ? '' : this.getFooter(),
			});

			Dom.style(this.popupMenu.getContainer(), 'width', `${this.$el.clientWidth}px`);
			Dom.style(this.popupMenu.getContainer(), 'height', '100%');

			window.addEventListener('resize', this.onResize.bind(this));
		},
		getMenuItems()
		{
			const items = [];
			for (const index in this.variants)
			{
				const variant = this.variants[index];
				items.push({
					id: variant.id,
					entityId: 'item',
					tabs: 'recents',
					title: variant.name,
					selected: this.item.value === variant.value,
					customData: {
						value: variant.value,
					},
				});
			}
			return items;
		},
		deselectAll()
		{
			this.item.value = '';
			this.popupMenu.deselectAll();
			this.popupMenu.hide();
		},
		onSelect(e)
		{
			const selectedItem = e.getData().item.getDialog().getSelectedItems()[0];
			this.$el.value = selectedItem.getTitle();
			const customData = Object.fromEntries(selectedItem.getCustomData());
			this.item.value = customData.value;
			this.validate();
		},
		onDeselect()
		{
			this.item.value = '';
			this.popupMenu.hide();
			this.validate();
		},
		onShow()
		{
			this.expanded = true;
		},
		onHide()
		{
			this.expanded = false;
		},
		getFooter()
		{
			return BX.Tag.render`
					<span onclick="${this.deselectAll}" class="ui-selector-footer-link">
					${this.localize.CHECKOUT_VIEW_PROPERTY_LIST_ENUM_RESET_CHOICE}
					</span>`
		},
		onKeyDown(e)
		{
			if (openingKeys.indexOf(e.key) >= 0)
			{
				// the field holds no text of its own, and Space alone would scroll the page
				e.preventDefault();
				this.render();
			}
		},
		render()
		{
			this.popupMenu.show();
		},
		onResize()
		{
			Dom.style(this.popupMenu.getContainer(), 'width', `${this.$el.clientWidth}px`);
		},
	},
	computed: {
		localize()
		{
			return Object.freeze(
				BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_PROPERTY_LIST_'));
		},
		checkedClassObject()
		{
			return {
				'is-invalid': this.item.validated === Const.validate.failure,
				'is-valid': this.item.validated === Const.validate.successful,
			};
		},
		getObjectClass()
		{
			const classes = {
				'form-control': true,
				'form-control-lg': true,
				'ui-ctl': true,
				'p-0': true,
				'border-0': this.item.validated === Const.validate.unvalidated,
			};
			return Object.assign(classes, this.checkedClassObject);
		},
		getSelectClass()
		{
			return {
				'property-enum-desktop': true,
				'form-control': true,
				'form-control-lg': true,
				'ui-ctl-element': true,
				'bg-transparent': true,
				'border-0': this.item.validated !== Const.validate.unvalidated,
			};
		},
		defaultValue()
		{
			if (this.item.value !== '')
			{
				return this.variants.find((e) => e.value === this.item.value).name;
			}
			return '';
		},
		isEmpty()
		{
			return this.item.value === '';
		},
		isAsteriskShown()
		{
			return this.isEmpty && this.isRequired;
		},
		ariaExpanded()
		{
			return this.expanded ? 'true' : 'false';
		},
	},
	// language=Vue
	template: `
		<div
            class="form-wrap form-asterisk"
			:class="getObjectClass"
			data-testid="sale-checkout-property-enum"
			@blur="validate"
		>
			<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			<input
				readonly
				@click="render"
				@keydown="onKeyDown"
				:class="getSelectClass"
				role="combobox"
				:aria-expanded="ariaExpanded"
				:aria-label="item.name"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				:placeholder="item.name"
				:value="defaultValue"
			>
            <span
				class="asterisk-item"
				aria-hidden="true"
				v-if="isAsteriskShown"
			>
				{{item.name}}
			</span>
		</div>
	`
});
