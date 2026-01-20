import { Loc, Type } from 'main.core';
import { TagSelector } from 'ui.entity-selector';

const ENTITY_TYPES = Object.freeze({
	USER: 'user',
	DEPARTMENT: 'structure-node',
});

const VALUE_PARSERS = [
	{
		template: /^group_hrr(\d+)$/,
		format: (match) => [ENTITY_TYPES.DEPARTMENT, match[1]],
	},
	{
		template: /^group_hr(\d+)$/,
		format: (match) => [ENTITY_TYPES.DEPARTMENT, `${match[1]}:F`],
	},
	{
		template: /^user_(\d+)$/,
		format: (match) => [ENTITY_TYPES.USER, match[1]],
	},
];

// @vue/component
export const ConstantUser = {
	name: 'ConstantUser',
	props: {
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: [String, Array],
			default: '',
		},
	},
	emits: ['update:modelValue'],
	mounted(): void
	{
		this.initializeSelector();
	},
	beforeUnmount(): void
	{
		if (this.tagSelector)
		{
			this.tagSelector.getDialog().destroy();
			this.tagSelector = null;
		}
	},
	methods: {
		syncValue(): void
		{
			if (!this.tagSelector)
			{
				return;
			}

			const tags = this.tagSelector.getTags();
			const newValues = tags.map((tag) => {
				const rawId = tag.getId();
				const title = tag.getTitle();
				const entityId = tag.getEntityId();

				if (entityId === ENTITY_TYPES.USER)
				{
					return `${title}[${rawId}]`;
				}

				if (entityId === ENTITY_TYPES.DEPARTMENT)
				{
					if (Type.isString(rawId) && rawId.endsWith(':F'))
					{
						const id = rawId.replace(':F', '');

						return `${title}[HR${id}]`;
					}

					return `${title}[HRR${rawId}]`;
				}

				return null;
			}).filter(Boolean);

			if (this.item.multiple)
			{
				this.$emit('update:modelValue', newValues.join(';'));
			}
			else
			{
				this.$emit('update:modelValue', newValues.length > 0 ? newValues[0] : '');
			}
		},
		getPreselectedItems(): Array
		{
			const valuesToParse = this.normalizeModelValue();
			if (valuesToParse.length === 0)
			{
				return [];
			}

			const parsedValues = valuesToParse.map((element) => this.parseValue(element));

			return parsedValues.filter(Boolean);
		},
		normalizeModelValue(): Array<string>
		{
			const { modelValue, item } = this;

			if (item.multiple && Type.isStringFilled(modelValue))
			{
				return modelValue.split(';');
			}

			if (Type.isArray(modelValue))
			{
				return modelValue;
			}

			return modelValue ? [String(modelValue)] : [];
		},
		parseValue(rawValue: string): Array | null
		{
			const value = String(rawValue).trim();
			if (!value)
			{
				return null;
			}

			for (const parser of VALUE_PARSERS)
			{
				const match = value.match(parser.template);
				if (match)
				{
					return parser.format(match);
				}
			}

			return [ENTITY_TYPES.USER, value];
		},
		initializeSelector(): void
		{
			this.tagSelector = new TagSelector({
				multiple: this.item.multiple,
				showCreateButton: false,
				dialogOptions: {
					context: `BIZPROC_USER_SELECTOR_${this.item.id}`,
					preselectedItems: this.getPreselectedItems(),
					popupOptions: {
						className: 'bizproc-setup-template__no-tabs-selector-popup',
					},
					width: 500,
					entities: [
						{
							id: ENTITY_TYPES.USER,
							options: { inviteEmployeeLink: false },
						},
						{
							id: ENTITY_TYPES.DEPARTMENT,
							options: {
								selectMode: 'usersAndDepartments',
								allowSelectRootDepartment: true,
								allowFlatDepartments: true,
							},
						},
					],
					multiple: this.item.multiple,
					showAvatars: true,
					dropdownMode: true,
					compactView: true,
					height: 250,
				},
				addButtonCaption: Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_ADD_USER'),
				events: {
					onAfterTagAdd: this.syncValue,
					onAfterTagRemove: this.syncValue,
				},
			});

			this.tagSelector.renderTo(this.$refs.container);
		},
	},
	template: `
		<div ref="container" data-test-id="bizproc-setup-template__form-user"></div>
	`,
};
