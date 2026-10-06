import type { AccessRightItem } from '../../../store/model/access-rights-model';
import type { AccessRightValue } from '../../../store/model/user-groups-model';
import { CellLayout } from '../../layout/cell-layout';
import { Cells, getValueComponent } from '../value/registry';

export const ValueCell = {
	name: 'ValueCell',
	components: {
		CellLayout,
		...Cells,
	},
	props: {
		right: {
			/** @type AccessRightItem */
			type: Object,
			required: true,
		},
	},
	inject: ['section', 'userGroup'],
	provide(): Object {
		return {
			right: this.right,
		};
	},
	computed: {
		value(): AccessRightValue
		{
			const value = this.userGroup.accessRights.get(this.right.id);

			return value || this.$store.getters['userGroups/getEmptyAccessRightValue'](this.userGroup.id, this.section.sectionCode, this.right.id);
		},
		cellComponent(): string
		{
			return getValueComponent(this.right);
		},
		isReadOnly(): boolean
		{
			return this.userGroup.isReadOnly === true;
		},
	},
	// data attributes are needed for e2e automated tests
	template: `
		<CellLayout
			:class="{
				'ui-access-rights-v2-group-children': right.group,
				'--modified': value.isModified,
				'--read-only': isReadOnly
			}"
			v-memo="[userGroup.id, value.values, value.isModified, isReadOnly]"
		>
			<Component
				:is="cellComponent"
				:value="value"
				:data-accessrights-right-id="right.id"
			/>
		</CellLayout>
	`,
};
