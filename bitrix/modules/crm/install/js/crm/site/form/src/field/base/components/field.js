import { Controller } from '../controller';
import { Aria } from '../../../util/aria';
import './css/field.css';
import './css/animation.css';

const Field = {
	props: {
		field: {
			type: Controller,
			required: true,
		},
	},
	template: `
		<transition name="b24-form-field-a-slide">
			<div class="b24-form-field"
				:class="classes"
				v-show="field.visible"
			>
				<div v-if="field.isComponentDuplicable">
				<transition-group name="b24-form-field-a-slide" tag="div">
					<component v-bind:is="field.getComponentName()"
						v-for="(item, itemIndex) in field.items"
						v-bind:key="field.id"
						v-bind:field="field"
						v-bind:itemIndex="itemIndex"
						v-bind:item="item"
						@input-blur="onBlur"
						@input-focus="onFocus"
						@input-key-down="onKeyDown"
					></component>
				</transition-group>
					<button 
						type="button"
						class="b24-form-control-add-btn"
						v-if="field.multiple"
						@click="addItem"
						:aria-label="field.messages.get('fieldAdd')"
					>
						{{ field.messages.get('fieldAdd') }}
					</button>
					<div
						class="b24-form-control-comment"
						:id="hintId"
						v-if="field.hint && !field.hintOnFocus || field.hint && field.hintOnFocus && field.focused"
						>{{field.hint}}</div>
				</div>
				<div v-if="!field.isComponentDuplicable">
					<component v-bind:is="field.getComponentName()"
						v-bind:key="field.id"
						v-bind:field="field"
						@input-blur="onBlur"
						@input-focus="onFocus"
						@input-key-down="onKeyDown"
					></component>
					<div
						class="b24-form-control-comment"
						:id="hintId"
						v-if="field.hint && !field.hintOnFocus || field.hint && field.hintOnFocus && field.focused"
						>{{field.hint}}</div>
				</div>
			</div>
		</transition>
	`,
	computed: {
		hintId(): string
		{
			return Aria.getHintId(this.field);
		},
		hasErrors(): boolean
		{
			return Aria.hasErrors(this.field);
		},
		classes()
		{
			const list = [
				`b24-form-field-${this.field.type}`,
				`b24-form-control-${this.field.getOriginalType()}`,
			];
			/*
			if (this.field.design.dark)
			{
				list.push('b24-form-field-dark');
			}
			*/
			if (this.field.multiple)
			{
				list.push('b24-form-control-group');
			}

			if (this.hasErrors)
			{
				list.push('b24-form-control-alert');
			}

			return list;
		},
	},
	methods: {
		addItem() {
			this.field.addItem({});
		},
		onFocus()
		{
			this.field.focused = true;
			this.field.emit(this.field.events.focus);
		},
		onBlur()
		{
			this.field.focused = false;
			this.field.valid();
			setTimeout(() => {
				this.field.emit(this.field.events.blur);
			}, 350);
		},
		onKeyDown(e)
		{
			const key = e.key;

			if (e.ctrlKey || e.metaKey)
			{
				return;
			}

			if (key.length === 1)
			{
				// eslint-disable-next-line unicorn/no-array-callback-reference
				const filteredValue = this.field.filter(key);
				if (filteredValue !== key)
				{
					e.preventDefault();

					return;
				}
			}

			if (['Escape', 'Esc', 'Delete', 'Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key))
			{
				return;
			}
		},
	},
};

export {
	Field,
};
