import './style.css';
import * as Mixins from '../base/components/mixins';

const KEY_SPACE = ' ';

const ItemSelector = {
	props: ['field', 'listboxId', 'focusedIndex'],
	template: `
		<div 
			ref="container"
			:id="listboxId"
			role="listbox"
		>
			<div class="b24-form-control-list-selector-item"
				v-for="(item, itemIndex) in field.items"
				:key="item.value"
				:id="getItemId(itemIndex)"
				:class="{'b24-form-control-list-selector-item-focused': itemIndex === focusedIndex}"
				role="option"
				@click="selectItem(item)"
			>
				<img class="b24-form-control-list-selector-item-image"
					v-if="pic(item)" 
					:src="pic(item)"
					alt=""
				>
				<div class="b24-form-control-list-selector-item-title">
					<span >{{ item.label }}</span>
				</div>
	
				<div class="b24-form-control-list-selector-item-price"
					v-if="hasPrice(item)"
				>
					<div class="b24-form-control-list-selector-item-price-old"
						v-if="item.discount"
						v-html="field.formatMoney(item.price + item.discount)"
						aria-hidden="true"
					></div>
					<div class="b24-form-control-list-selector-item-price-current"
						v-if="item.price || item.price === 0"
						v-html="field.formatMoney(item.price)"
					></div> 
				</div>
			</div>
		</div>
	`,
	watch: {
		focusedIndex(): void
		{
			this.scrollToFocused();
		},
	},
	methods: {
		getItemId(index): string
		{
			return `${this.field.id}-option-${index}`;
		},
		hasPrice(item): boolean
		{
			return item.price || item.price === 0 || item.discount;
		},
		pic(item)
		{
			return (
				item
				&& item.pics
				&& item.pics.length > 0
			) ? item.pics[0] : '';
		},
		selectItem(item)
		{
			this.$emit('select', item);
		},
		scrollToFocused(): void
		{
			this.$nextTick(() => {
				const container = this.$refs.container;
				if (!container)
				{
					return;
				}
				const focusedElement = container.children[this.focusedIndex];
				if (focusedElement)
				{
					focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
				}
			});
		},
	},
};

const fieldListMixin = {
	props: ['field'],
	mixins: [Mixins.MixinField, Mixins.MixinDropDown],
	components: {
		'item-selector': ItemSelector,
	},
	data(): { focusedItemIndex: number }
	{
		return {
			focusedItemIndex: 0,
		};
	},
	methods: {
		toggleSelector()
		{
			this.toggleDropDown();
		},
		select(item)
		{
			const select = () => {
				if (this.item)
				{
					this.item.selected = false;
				}
				item.selected = true;
				this.closeDropDown();
			};

			if (this.item && this.item.selected)
			{
				select();
			}
			else
			{
				setTimeout(select, 0);
			}
		},
		unselect() {
			this.item.selected = false;
		},
		handleKeydown(event): void
		{
			const { key } = event;

			if (this.dropDownOpened)
			{
				const items = this.field.items;

				// eslint-disable-next-line default-case
				switch (key)
				{
					case 'ArrowDown': {
						event.preventDefault();
						this.focusedItemIndex = Math.min(this.focusedItemIndex + 1, items.length - 1);

						break;
					}

					case 'ArrowUp': {
						event.preventDefault();
						this.focusedItemIndex = Math.max(this.focusedItemIndex - 1, 0);

						break;
					}
					case 'Enter':
					case KEY_SPACE: {
						event.preventDefault();
						if (items[this.focusedItemIndex])
						{
							this.select(items[this.focusedItemIndex]);
						}

						break;
					}
					case 'Escape':
					case 'Esc': {
						event.preventDefault();
						this.closeDropDown();

						break;
					}
				}

				return;
			}

			if (['Enter', KEY_SPACE, 'ArrowDown', 'ArrowUp'].includes(key))
			{
				event.preventDefault();
				this.toggleDropDown();
			}
		},
		onDropdownMousedown(): void
		{
			this.isInteractingWithDropdown = true;
		},
		handleBlur(): void
		{
			if (this.isInteractingWithDropdown)
			{
				this.isInteractingWithDropdown = false;

				return;
			}

			if (this.dropDownOpened)
			{
				this.closeDropDown();
			}
		},
	},
};

const FieldListItem = {
	mixins: [fieldListMixin],
	props: ['field', 'item', 'itemIndex', 'itemSubComponent'],
	template: `
		<div class="b24-form-control-container b24-form-control-icon-after"
			:id="fieldId"
			tabindex="0"
			@click="toggleSelector"
			@keydown="onKeydown"
			@blur="onBlur"
			:aria-label="field.label"
			:aria-invalid="ariaInvalid"
			:aria-describedby="ariaDescribedby"
			:aria-expanded="dropDownOpened ? 'true' : 'false'"
			:aria-controls="getDropdownId()"
			:aria-activedescendant="dropDownOpened ? getActiveDescendantId() : ''"
			role="combobox"
		>
			<input readonly="" type="text" class="b24-form-control"
				:value="itemLabel"
				:class="classes"
				tabindex="-1"
			>
			<div class="b24-form-control-label" aria-hidden="true">
				{{ field.label }}
				<span v-show="field.required" class="b24-form-control-required">*</span>
			</div>
			<button
				type="button"
				class="b24-form-icon-after b24-form-icon-remove"
				v-if="item.selected"
				@click.stop="unselect"
				@keydown.stop="onRemoveKeydown"
				:aria-label="field.messages.get('fieldListUnselect')"
			></button>
			<field-item-alert 
				v-bind:field="field"
				v-bind:item="item"
				v-bind:itemIndex="itemIndex"
			></field-item-alert>
			<field-item-dropdown 
				:marginTop="0" 
				:visible="dropDownOpened"
				:title="field.label"
				:messages="field.messages"
				@close="closeDropDown()"
				@visible:on="$emit('visible:on')"
				@visible:off="$emit('visible:off')"
				@mousedown.native="onDropdownMousedown"
			>
				<item-selector
					:field="field"
					:listboxId="getDropdownId()"
					:focusedIndex="focusedItemIndex"
					@select="select"
					@close="closeDropDown"
				></item-selector>
			</field-item-dropdown>
			<field-item-image-slider 
				v-if="item.selected && field.bigPic" 
				:field="field" 
				:item="item"
			></field-item-image-slider>
			<component v-if="item.selected && itemSubComponent" :is="itemSubComponent"
				:key="field.id"
				:field="field"
				:item="item"
			></component>
		</div>
	`,
	computed: {
		itemLabel()
		{
			if (!this.item || !this.item.selected)
			{
				return '';
			}

			return this.item.label;
		},
		classes()
		{
			const list = [];

			if (this.itemLabel)
			{
				list.push('b24-form-control-not-empty');
			}

			return list;
		},
	},
	methods: {
		getDropdownId(): string
		{
			return `${this.fieldId}-listbox`;
		},
		getActiveDescendantId(): string
		{
			if (!this.dropDownOpened || this.field.items.length === 0)
			{
				return '';
			}

			return `${this.field.id}-option-${this.focusedItemIndex}`;
		},
		onKeydown(event): void
		{
			this.handleKeydown(event);
		},
		onBlur(): void
		{
			this.handleBlur();
		},
		onRemoveKeydown(event): void
		{
			if (event.key === 'Enter' || event.key === KEY_SPACE)
			{
				event.preventDefault();
				this.unselect();
			}
		},
	},
};

const FieldList = {
	mixins: [fieldListMixin],
	components: {
		'field-list-item': FieldListItem,
	},
	template: `
		<div>
			<field-list-item
				v-for="(item, itemIndex) in getItems()"
				:key="itemIndex"
				:field="field"
				:item="item"
				:itemIndex="itemIndex"
				:itemSubComponent="itemSubComponent"
				@visible:on="$emit('input-focus')"
				@visible:off="$emit('input-blur')"
			></field-list-item>
			<button 
				type="button"
				class="b24-form-control-add-btn"
				v-if="isAddVisible()"
				@click="toggleSelector"
				@keydown="handleKeydown"
				@blur="handleBlur"
				:aria-label="field.messages.get('fieldAdd')"
				:aria-expanded="dropDownOpened ? 'true' : 'false'"
				:aria-controls="getAddListboxId()"
				:aria-activedescendant="dropDownOpened ? getActiveDescendantId() : ''"
			>
				{{ field.messages.get('fieldAdd') }}
			</button>
			<field-item-dropdown 
				:marginTop="0" 
				:visible="dropDownOpened"
				:title="field.label"
				:messages="field.messages"
				@close="closeDropDown()"
				@visible:on="$emit('input-focus')"
				@visible:off="$emit('input-blur')"
				@mousedown.native="onDropdownMousedown"
			>
				<item-selector
					:field="field"
					:listboxId="getAddListboxId()"
					:focusedIndex="focusedItemIndex"
					@select="select"
					@close="closeDropDown"
				></item-selector>
			</field-item-dropdown>
		</div>
	`,
	computed: {
		itemSubComponent()
		{
			return null;
		},
	},
	methods: {
		getAddListboxId(): string
		{
			return `${this.field.id}-add-listbox`;
		},
		getActiveDescendantId(): string
		{
			if (!this.dropDownOpened || this.field.items.length === 0)
			{
				return '';
			}

			return `${this.field.id}-option-${this.focusedItemIndex}`;
		},
		getItems()
		{
			return this.field.selectedItem()
				? this.field.selectedItems()
				: (this.field.item() ? [this.field.item()] : []);
		},
		isAddVisible()
		{
			return this.field.multiple
				&& this.field.item()
				&& this.field.selectedItem()
				&& this.field.unselectedItem();
		},
	},
};

export {
	FieldListItem,
	FieldList,
};
