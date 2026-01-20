import { TagSelector } from 'ui.entity-selector';

// @vue/component
export const UserSelector = {
	props: {
		modelValue: {
			type: Array,
			default: () => [],
		},
	},

	emits: ['update:modelValue'],

	selectorInstance: null,
	targetNode: null,

	watch: {
		modelValue(newValue: Array): void
		{
			if (!this.selectorInstance)
			{
				return;
			}

			const newItemsSet = new Set(newValue.map((item) => `${item.entityId}:${item.id}`));
			const currentTags = this.selectorInstance.getTags();
			const currentTagsSet = new Set(currentTags.map((tag) => `${tag.getEntityId()}:${tag.getId()}`));

			currentTags.forEach((tag) => {
				const tagId = `${tag.getEntityId()}:${tag.getId()}`;
				if (!newItemsSet.has(tagId))
				{
					this.selectorInstance.removeTag(tag);
				}
			});

			newValue.forEach((item) => {
				const itemId = `${item.entityId}:${item.id}`;
				if (!currentTagsSet.has(itemId))
				{
					this.selectorInstance.addTag({
						id: item.id,
						entityId: item.entityId,
						title: item.name,
					});
				}
			});
		},
	},

	mounted(): void
	{
		this.selectorInstance = new TagSelector({
			dialogOptions: {
				width: 425,
				height: 320,
				multiple: true,
				context: 'MAIL_CRM_QUEUE',
				preselectedItems: this.modelValue.map((item) => [item.entityId, item.id]),
				entities: [
					{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							emailUsers: false,
							inviteEmployeeLink: false,
						},
					},
					{
						id: 'department',
						options: {
							selectMode: 'departmentsOnly',
						},
					},
				],
			},
			events: {
				onAfterTagAdd: this.onUpdate,
				onAfterTagRemove: this.onUpdate,
			},
		});

		this.selectorInstance.renderTo(this.$el);
	},

	beforeUnmount(): void
	{
		const dialog = this.selectorInstance.getDialog();

		if (dialog)
		{
			dialog.destroy();
		}
	},

	methods: {
		onUpdate(): void
		{
			const selectedItems = this.selectorInstance.getTags().map((tag) => ({
				id: tag.getId(),
				entityId: tag.getEntityId(),
				name: tag.getTitle(),
			}));

			this.$emit('update:modelValue', selectedItems);
		},
	},
	template: '<div></div>',
};
