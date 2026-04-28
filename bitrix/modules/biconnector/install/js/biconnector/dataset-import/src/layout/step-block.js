import { Text } from 'main.core';
import { Section } from 'ui.section';
import { StepHint } from './step-hint';
import '../css/step.css';

export const StepBlock = {
	data(): Object
	{
		return {
			section: null,
		};
	},
	props: {
		title: {
			type: String,
			required: true,
		},
		hint: {
			type: String,
			required: false,
			default: '',
		},
		isOpenInitially: {
			type: Boolean,
			required: false,
			default: true,
		},
		canCollapse: {
			type: Boolean,
			required: false,
			default: true,
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false,
		},
		customClasses: {
			type: Array,
			default: [],
		},
		hintClass: {
			type: String,
			required: false,
		},
	},
	computed: {
		additionalClasses()
		{
			const custom = this.customClasses.reduce((acc, key) => {
				acc[key] = true;

				return acc;
			}, {});

			return {
				'dataset-import-step__disabled': this.disabled,
				...custom,
			};
		},
	},
	mounted()
	{
		const contentContainer = this.$refs.contentContainer;

		const section = new Section({
			title: this.title,
			isOpen: this.isOpenInitially,
			canCollapse: this.canCollapse,
		});

		section.append(this.$refs.content);
		section.renderTo(contentContainer);
		this.section = section;

		this.$nextTick(() => {
			this.updateHeaderRightContent();
		});
	},
	methods: {
		toggleCollapse(open: ?boolean)
		{
			this.section.toggle(open);
		},
		updateHeaderRightContent()
		{
			if (!this.section)
			{
				return;
			}

			const headerElement = this.section.getContent()?.querySelector('.ui-section__header');
			if (!headerElement)
			{
				return;
			}

			const headerRightSlot = this.$refs.headerRightSlot;
			const existingRightContent = headerElement.querySelector('.step-block__header-right');

			if (headerRightSlot && headerRightSlot.children.length > 0)
			{
				// Create or find the container for the right content
				let rightContentContainer = existingRightContent;
				if (!rightContentContainer)
				{
					rightContentContainer = document.createElement('div');
					rightContentContainer.className = 'step-block__header-right';
					headerElement.appendChild(rightContentContainer);
				}

				rightContentContainer.innerHTML = '';
				while (headerRightSlot.firstChild)
				{
					rightContentContainer.appendChild(headerRightSlot.firstChild);
				}
			}
			else if (existingRightContent)
			{
				// If there is no slot, remove the container
				existingRightContent.remove();
			}
		},
	},
	watch: {
		title(newValue)
		{
			if (!this.section)
			{
				return;
			}

			const titleElement = this.section.getContent().querySelector('.ui-section__title');
			if (titleElement)
			{
				titleElement.innerHTML = Text.encode(newValue);

				this.$nextTick(() => {
					this.updateHeaderRightContent();
				});
			}
		},
	},
	updated()
	{
		this.$nextTick(() => {
			this.updateHeaderRightContent();
		});
	},
	components: {
		StepHint,
	},
	// language=Vue
	template: `
		<div class="dataset-import-step" :class="additionalClasses" ref="contentContainer">
		</div>
		<div ref="content" class="dataset-import-step__content">
			<StepHint v-if="hint" :hint-class="hintClass">
				<span v-html="hint"></span>
			</StepHint>
			<slot></slot>
		</div>
		<div ref="headerRightSlot">
			<slot name="headerRightContent"></slot>
		</div>
	`,
};
