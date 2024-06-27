import { mapGetters, mapMutations } from 'ui.vue3.vuex';
import { ExpandControl } from '../components/expandcontrol';
import { PermissionControl } from '../components/permissioncontrol';
import { PermissionEntityIdentifier } from '../store';

export const SliderPermissions = {
	name: 'SliderPermissions',
	props: {
		entityCode: {
			required: true,
			type: String,
		},
	},
	components: {
		ExpandControl,
		PermissionControl,
	},
	data() {
		return {
			ui: {
				stageVisibilityCodes: {},
			},
		};
	},
	computed: {
		...mapGetters(['getEntitiesGroupedByPermission', 'getAssignedAttribute']),
		permissions() {
			return this.getEntitiesGroupedByPermission(this.entityCode);
		},
		displayList() {
			return this.permissions.filter((perm) => {
				if (!perm.stageField)
				{
					return true;
				}

				return this.ui.stageVisibilityCodes[perm.code];
			});
		},
		isShowExpandControl: () => (perm) => {

			if (perm.stageField)
			{
				return false;
			}

			if (!perm.isEntityStageSupport)
			{
				return false;
			}

			if (!perm.isPermissionStageSupport)
			{
				return false;
			}

			return true;
		},
		getName: () => (perm) => {
			if (!perm.stageField)
			{
				return perm.name;
			}

			return perm.stateName;
		},
	},
	mounted() {},
	methods: {
		...mapMutations(['assignPermissionAttribute']),
		onToggleStageVisibility(code) {
			if (this.ui.stageVisibilityCodes[code])
			{
				delete this.ui.stageVisibilityCodes[code];
			}
			else
			{
				this.ui.stageVisibilityCodes[code] = true;
			}
		},
		isExpanded(code) {
			return this.ui.stageVisibilityCodes[code] || false;
		},
		isRowStageRow(perm) {
			return Boolean(perm.stageField);
		},
		getAttributeValue(identifier: PermissionEntityIdentifier) {
			return this.getAssignedAttribute(identifier) || '';
		},
		onAttributeValueChanged(payload) {
			this.assignPermissionAttribute({ identifier: payload.identifier, value: payload.value });
		},
		getIdentifier(permissionCode, stageField, stageCode): PermissionEntityIdentifier {
			return {
				permissionCode,
				entityCode: this.entityCode,
				stageField,
				stageCode,
			};
		},
	},
	template: `
		<div class="bx-crm-perms-edit-entity-permissions">
			<div
				v-for="perm of displayList"
				class="bx-crm-perms-edit-entity-permissions-item"
				:class="{'stage-item': isRowStageRow(perm)}"
			>
				<div class="bx-crm-perms-edit-entity-permissions-item__column">
					<ExpandControl 
						v-if="isShowExpandControl(perm)"
						:is-expanded="isExpanded(perm.code)"
						@toggle="onToggleStageVisibility(perm.code)"
					/>
					<span :class="{'small-label': isRowStageRow(perm)}">
						{{ getName(perm) }}
					</span>
				</div>
				<div class="bx-crm-perms-edit-entity-permissions-item__column">
					<PermissionControl
						:value="getAttributeValue(getIdentifier(perm.code, perm.stageField, perm.stageCode))"
						:values-map="perm.values"
						:permission-identifier="getIdentifier(perm.code, perm.stageField, perm.stageCode)"
						@value-changed="onAttributeValueChanged"
					/>
				</div>
			</div>
		</div>
	`,
};
