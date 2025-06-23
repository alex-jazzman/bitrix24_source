import { BIcon } from 'ui.icon-set.api.vue';

import { IconSetMixin } from '../../mixins/icon-set-mixin';
import { LocMixin } from '../../mixins/loc-mixin';
import { DepartmentConnector } from './components/connector/department-connector';
import { DepartmentBlock } from './components/department-block/department-block';
import { LockedDepartmentBlock } from './components/department-block/locked-department-block';
import { DepartmentSpacer } from './components/department-spacer';
import { LockedDepartment } from './const';

// eslint-disable-next-line no-unused-vars
import type { BranchProp, StructureViewListDataType } from './type';
import type { DepartmentType, UserData } from '../../type';

import './style.css';

// @vue/component
export const StructureView = {
	name: 'StructureView',
	components: {
		BIcon,
		DepartmentBlock,
		LockedDepartmentBlock,
		DepartmentConnector,
		DepartmentSpacer,
	},
	mixins: [LocMixin, IconSetMixin],
	props: {
		title: {
			type: String,
			default: '',
		},
		branch: {
			/** @type BranchProp */
			type: Array,
			required: true,
		},
		headDictionary: {
			/** @type HeadDictionary */
			type: Object,
			required: true,
		},
		userDepartmentId: {
			type: Number,
			default: null,
		},
		user: {
			/** @type UserData | null */
			type: Object,
			default: null,
		},
	},
	data(): StructureViewListDataType
	{
		return {
			blocks: [],
			connectorBindElementPairs: [],
		};
	},
	computed: {
		LockedDepartment: () => LockedDepartment,
	},
	mounted(): void
	{
		this.$nextTick((): void => {
			this.makeConnectors();
		});
	},
	methods: {
		makeConnectors(): void
		{
			this.connectorBindElementPairs = [];

			const connectorCount = this.blocks.length - 2;

			for (let i = 0; i <= connectorCount; ++i)
			{
				const topBlock = this.blocks[i].$el;
				const bottomBlock = this.blocks[i + 1].$el;

				this.connectorBindElementPairs.push([topBlock, bottomBlock]);
			}
		},
		getHeadForDepartment(department: DepartmentType): UserData | null
		{
			const { id: departmentId } = department;
			if (departmentId !== this.userDepartmentId)
			{
				return null;
			}

			const { headIds } = department;
			const userIsHead = headIds.includes(this.user.id);
			if (userIsHead)
			{
				return null;
			}

			const firstHeadId = headIds[0];
			if (!firstHeadId)
			{
				return null;
			}

			return this.headDictionary[firstHeadId] ?? null;
		},
		getUserForDepartment(department: DepartmentType): UserData | null
		{
			const { id: departmentId } = department;
			if (departmentId === this.userDepartmentId)
			{
				return this.user;
			}

			const { headIds } = department;

			const firstHeadId = headIds[0];
			if (!firstHeadId)
			{
				return null;
			}

			return this.headDictionary[firstHeadId] ?? null;
		},
	},
	template: `
		<div class="intranet-user-mini-profile__structure-view">
			<div class="intranet-user-mini-profile__structure-view__title">
				<div class="intranet-user-mini-profile__structure-view__title-icon">
					<BIcon :name="outlineSet.COMPANY" :size="18"/>
				</div>
				<span>{{ title }}</span>
			</div>
			<div class="intranet-user-mini-profile__structure-view__preview" v-if="branch.length">
				<div v-for="(department, index) in branch"
					 class="intranet-user-mini-profile__structure-view__preview-row"
				>
					<DepartmentSpacer :value="index * 20"/>
					<template v-if="department === LockedDepartment">
						<LockedDepartmentBlock
							:ref="el => { blocks[index] = el}"
						/>
					</template>
					<template v-else>
						<DepartmentBlock
							:ref="el => { blocks[index] = el}"
							:key="'department-' + department.id"
							:title="department.title"
							:nodeId="department.id"
							:employee-count="department.employeeCount"
							:user="getUserForDepartment(department)"
							:head="getHeadForDepartment(department)"
							:highlighted="department.id === userDepartmentId"
						/>
					</template>
				</div>
				<template
					v-for="elementPair in connectorBindElementPairs"
				>
					<DepartmentConnector
						:topBindElement="elementPair[0]"
						:bottomBindElement="elementPair[1]"
						:offsetLeft="11"
					/>
				</template>
			</div>
		</div>
	`,
};
