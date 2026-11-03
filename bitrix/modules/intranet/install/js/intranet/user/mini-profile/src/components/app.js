import { Backend } from '../classes/backend';
import {
	InitialParamDict,
	InitialParamService,
	RightSideViewDict,
	type RightSideViewType,
} from '../classes/initial-param-service';

import type { DepartmentType, UserData } from '../type';
import { Divider } from './divider/divider';
import { ErrorState } from './error-state/error-state';
import { ErrorStateDict } from './error-state/const';
import { LoaderTransition } from './loader-transition/loader-transition';
import { LocationView } from './location-view/location-view';
import { UserMiniProfileLoader } from './loader/loader';
import { StructureViewList } from './structure-view-list/structure-view-list';
import { CollapseTransition } from './transition-collapse/transition-collapse';
import type { UserMiniProfileDataType } from './type';
import { UserBaseInfo } from './user-base-info/user-base-info';
import { SystemUserBadge } from './system-user-badge/system-user-badge';
import { UserDetailedInfo } from './user-detailed-info/user-detailed-info';

// @vue/component
export const UserMiniProfileComponent = {
	name: 'UserMiniProfile',
	components: {
		UserMiniProfileLoader,
		UserBaseInfo,
		SystemUserBadge,
		UserDetailedInfo,
		Divider,
		StructureViewList,
		CollapseTransition,
		ErrorState,
		LoaderTransition,
		LocationView,
	},
	props: {
		popup: {
			/** @type Popup */
			type: Object,
			required: true,
		},
		userId: {
			type: Number,
			required: true,
		},
	},
	data(): UserMiniProfileDataType
	{
		return {
			isError: false,
			errorType: ErrorStateDict.Default,
			isLoaded: false,
			isLoading: false,
			isExpanded: true,
			isExpandBlocked: false,
			backendData: null,
			rightSideView: RightSideViewDict.Structure,
			isLocationBlockEmpty: false,
		};
	},
	computed: {
		userDepartments(): Array<DepartmentType>
		{
			const userDepartmentIds = this.backendData.structure?.userDepartmentIds ?? [];
			const departmentDictionary = this.backendData.structure?.departmentDictionary ?? [];
			const userDepartments = [];
			userDepartmentIds.forEach((id: number) => {
				const department = departmentDictionary[id];
				if (!department)
				{
					return;
				}

				userDepartments.push(department);
			});

			return userDepartments;
		},
		departments(): Array<DepartmentType>
		{
			return Object.values(this.backendData.structure?.departmentDictionary ?? {});
		},
		heads(): Array<UserData>
		{
			const userHeadIds = this.backendData.structure.userHeadIds ?? [];
			if (userHeadIds.length === 0)
			{
				return [];
			}

			const headDictionary = this.backendData.structure?.headDictionary ?? {};
			const heads = [];
			userHeadIds.forEach((id: number) => {
				const head = headDictionary[id];
				if (head)
				{
					heads.push(head);
				}
			});

			return heads;
		},
		canShowDepartments(): boolean
		{
			return this.userDepartments.length > 0;
		},
		isShouldBeExpandedByInitial(): boolean
		{
			return InitialParamService.getValue(InitialParamDict.RightSideExpand) === 'Y';
		},
		canChat(): boolean
		{
			return this.backendData?.access.canChat ?? false;
		},
		isSystemUser(): boolean
		{
			return this.backendData?.baseInfo?.isSystemUser === true;
		},
		hasLocationBlock(): boolean
		{
			return this.backendData?.isLocationAvailable === true;
		},
		hasLocationView(): boolean
		{
			return this.hasLocationBlock && !this.isLocationBlockEmpty;
		},
		canShowRightSide(): boolean
		{
			return (this.canShowDepartments || this.hasLocationView) && !this.isSystemUser;
		},
		isMapView(): boolean
		{
			return this.rightSideView === RightSideViewDict.Map;
		},
		isShowStructure(): boolean
		{
			return this.canShowDepartments && this.isExpanded && !this.isSystemUser && !this.isMapView;
		},
		isShowLocation(): boolean
		{
			return this.hasLocationView && this.isExpanded && !this.isSystemUser && this.isMapView;
		},
		isShowRightSide(): boolean
		{
			return this.isShowStructure || this.isShowLocation;
		},
		isShowInlineStructure(): boolean
		{
			return this.canShowDepartments && this.isSystemUser;
		},
	},
	created(): void
	{
		if (!this.isLoaded)
		{
			this.isLoading = true;
			void Backend.load(this.userId)
				.then((data) => {
					this.backendData = data;
					this.isLoaded = true;
					this.applyInitialRightSideView();
				})
				.catch((errorCode) => {
					if (errorCode === 'ACCESS_DENIED')
					{
						this.errorType = ErrorStateDict.AccessDenied;
					}
					this.isError = true;
				})
				.finally(() => {
					this.isLoading = false;
					this.$nextTick(() => {
						this.adjustPopup();
					});
				})
			;
		}

		this.isExpanded = this.isShouldBeExpandedByInitial;
	},
	mounted(): void
	{
		this.adjustPopup();
	},
	methods: {
		onExpand(): void
		{
			if (this.isExpandBlocked)
			{
				return;
			}

			this.isExpanded = !this.isExpanded;
			InitialParamService.save(InitialParamDict.RightSideExpand, this.isExpanded ? 'Y' : 'N');

			this.$nextTick(() => {
				this.adjustPopup();
			});
		},
		applyInitialRightSideView(): void
		{
			const savedView = InitialParamService.getValue(InitialParamDict.RightSideView);

			this.rightSideView = this.isRightSideViewAvailable(savedView)
				? savedView
				: this.getAvailableRightSideView();
		},
		isRightSideViewAvailable(view: ?RightSideViewType): boolean
		{
			if (view === RightSideViewDict.Map)
			{
				return this.hasLocationView;
			}

			if (view === RightSideViewDict.Structure)
			{
				return this.canShowDepartments;
			}

			return false;
		},
		getAvailableRightSideView(): RightSideViewType
		{
			return this.canShowDepartments ? RightSideViewDict.Structure : RightSideViewDict.Map;
		},
		onToggleRightSideView(): void
		{
			const nextView = this.isMapView ? RightSideViewDict.Structure : RightSideViewDict.Map;
			if (!this.isRightSideViewAvailable(nextView))
			{
				return;
			}

			this.rightSideView = nextView;
			InitialParamService.save(InitialParamDict.RightSideView, nextView);

			if (!this.isExpanded)
			{
				this.onExpand();

				return;
			}

			this.$nextTick(() => {
				this.adjustPopup();
			});
		},
		onLocationBlockEmpty(): void
		{
			this.isLocationBlockEmpty = true;

			if (this.canShowDepartments)
			{
				this.rightSideView = RightSideViewDict.Structure;
			}
		},
		adjustPopup(): void
		{
			this.popup?.adjustPosition();
		},
		onCollapseStart(): void
		{
			this.isExpandBlocked = true;
			this.adjustPopup();
		},
		onCollapseEnd(): void
		{
			this.isExpandBlocked = false;
			this.adjustPopup();
		},
		getUserData(): UserData
		{
			const { avatar, name, workPosition, url } = this.backendData.baseInfo;

			return {
				id: this.userId,
				avatar,
				name,
				workPosition,
				url,
			};
		},
	},
	template: `
		<div class="intranet-user-mini-profile-wrapper">
			<SystemUserBadge v-if="isSystemUser"/>
			<template v-if="!isError">
				<LoaderTransition 
					:isLoading="isLoading" 
					:isShowContent="!!backendData"
					:isLoaderShort="!isShouldBeExpandedByInitial"
					@end="() => this.adjustPopup()"
				>
					<div class="intranet-user-mini-profile-wrapper__content">
						<div class="intranet-user-mini-profile-wrapper__column --left"
							 ref="leftColumn"
						>
							<UserBaseInfo
								:userId="userId"
								:info="backendData.baseInfo"
								:isShowExpand="canShowRightSide"
								:isShowMapButton="hasLocationView && !isSystemUser"
								:isMapView="isMapView"
								:isExpanded="isExpanded"
								:canChat="canChat"
								@expand="onExpand"
								@toggleView="onToggleRightSideView"
							/>
							<template v-if="backendData.detailInfo">
								<Divider style="margin-top: 18px; margin-bottom: 14px"/>
								<UserDetailedInfo
								  :info="backendData.detailInfo"
								  :userDepartments="userDepartments"
								  :departments="departments"
								  :heads="heads"
								  :teams="backendData.structure.teams"
								/>
							</template>
							<template v-if="isShowInlineStructure">
								<Divider style="margin-top: 18px; margin-bottom: 14px"/>
								<StructureViewList
									:structure="backendData.structure"
									:user="getUserData()"
									data-test-id="usermp_structure-view-list"
								/>
							</template>
						</div>
						<div v-if="isShowRightSide"
							class="intranet-user-mini-profile-wrapper__content__right-wrapper"
							data-test-id="usermp_structure-wrapper"
						>
							<Divider isVertical style="margin: 0 18px"/>
							<div class="intranet-user-mini-profile-wrapper__column --right" data-test-id="usermp_structure-column">
								<StructureViewList v-if="isShowStructure"
									:structure="backendData.structure"
									:user="getUserData()"
									data-test-id="usermp_structure-view-list"
								/>
								<LocationView v-else-if="isShowLocation"
									:userId="userId"
									@empty="onLocationBlockEmpty"
									@render="() => this.adjustPopup()"
								/>
							</div>
						</div>
					</div>
				</LoaderTransition>
			</template>
			<ErrorState v-if="isError"
				:type="errorType"
			/>
		</div>
	`,
};
