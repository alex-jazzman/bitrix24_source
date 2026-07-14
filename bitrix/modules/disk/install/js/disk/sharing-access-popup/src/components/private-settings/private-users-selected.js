import { TextSm } from 'ui.system.typography.vue';
import { BMenu } from 'ui.system.menu.vue';
import {
	ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS,
	ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS_SHORT,
	TASK_WEIGHT,
} from '../consts';

// @vue/component
export const PrivateUserItem = {
	name: 'PrivateUserItem',
	components: { TextSm, BMenu },
	props: {
		title: { type: String, default: '' },
		taskName: { type: String, default: 'disk_access_read' },
		maxTaskName: { type: String, default: 'disk_access_full' },
		readOnly: { type: Boolean, default: false },
	},
	emits: ['changeRight'],
	data()
	{
		return {
			isMenuShown: false,
			selectedAccessId: 'view',
			accessItems: ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS,
			accessItemsShorts: ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS_SHORT,
		};
	},
	computed: {
		selectedAccessLabel()
		{
			return this.accessItemsShorts.find((item) => item.id === this.taskName)?.title
				?? this.accessItemsShorts[0]?.title
				?? '';
		},
		availableAccessItems()
		{
			return this.accessItems.filter((item) => {
				return TASK_WEIGHT[this.maxTaskName] >= TASK_WEIGHT[item.id];
			});
		},
	},
	methods: {
		openMenu()
		{
			if (this.readOnly)
			{
				return;
			}

			this.isMenuShown = true;
		},
		getMenuOptions()
		{
			return {
				bindElement: this.$refs.accessButton,
				targetContainer: document.body,
				closeOnItemClick: true,
				items: this.availableAccessItems.map((item) => ({
					title: item.title,
					isSelected: item.id === this.taskName,
					onClick: () => {
						this.$emit('changeRight', item.id);
						this.isMenuShown = false;
					},
				})),
			};
		},
	},
	template: `
		<div class="access-private-user__wrapper">
			<div class="access-private-user__info-wrapper">
				<TextSm
					tag="p"
					className="access-private-head__user-name"
				>
					{{title}}
				</TextSm>	
			</div>
			<div class="access-private-user__change-access">
				<button
					ref="accessButton"
					type="button"
					class="access-private-user__access-button"
					:disabled="readOnly"
					@click="openMenu"
				>
					{{ selectedAccessLabel }}
				</button>
				<BMenu
					v-if="isMenuShown"
					:options="getMenuOptions()"
					@close="isMenuShown = false"
				/>
			</div>
		</div>
	`,
};
