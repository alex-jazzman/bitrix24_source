import { Loc, Type } from 'main.core';

import { DepartmentControl, EntityType } from 'intranet.department-control';

import { DepartmentControlBlock } from './elements/department-control-block';
import { InputRowFactory } from './input-row-factory';
import { ExtranetPage } from './page/extranet-page';
import { IntegratorPage } from './page/integrator-page';
import { InvitePage } from './page/invite-page';
import { LinkDisabledPage } from './page/link-disabled-page';
import { LinkPage } from './page/link-page';
import { MassPage } from './page/mass-page';
import { RegisterPage } from './page/register-page';
import InviteType from './type/invite-type';
import { type PageOptions } from './type/page-options';

export class PageFactory
{
	#options: PageOptions;
	#userOptions: Object;

	constructor(options: PageOptions, userOptions: Object)
	{
		this.#options = options;
		this.#userOptions = userOptions;
	}

	createInvitePage(inviteType: InviteType, showMassInviteButton: Boolean = true): InvitePage
	{
		const departmentControl = this.createDepartmentControl(
			[EntityType.DEPARTMENT, EntityType.GROUP, EntityType.EXTRANET],
		);

		return new InvitePage({
			...this.#options,
			inviteType,
			departmentControl,
			departmentControlBlock: this.createDepartmentControlBlock(departmentControl),
			inputsFactory: this.createInputRowFactory(inviteType, true),
			showMassInviteButton,
		});
	}

	createExtranetPage(): ExtranetPage
	{
		const departmentControl = this.createDepartmentControl(
			[EntityType.EXTRANET],
		);

		return new ExtranetPage({
			...this.#options,
			inputsFactory: this.createInputRowFactory(InviteType.ALL),
			departmentControl,
			departmentControlBlock: this.createDepartmentControlBlock(departmentControl),
		});
	}

	createRegisterPage(): RegisterPage
	{
		const departmentControl = this.createDepartmentControl(
			[EntityType.DEPARTMENT, EntityType.GROUP, EntityType.EXTRANET],
		);

		return new RegisterPage({
			...this.#options,
			departmentControl,
			departmentControlBlock: this.createDepartmentControlBlock(departmentControl),
			inputsFactory: this.createInputRowFactory(),
		});
	}

	createIntegratorPage(): IntegratorPage
	{
		return new IntegratorPage({
			...this.#options,
		});
	}

	createLinkPage(): LinkPage
	{
		const departmentControl = this.createDepartmentControl(
			[EntityType.DEPARTMENT, EntityType.GROUP],
		);

		return new LinkPage({
			...this.#options,
			departmentControl,
			departmentControlBlock: this.createDepartmentControlBlock(departmentControl),
		});
	}

	createLinkDisabledPage(): LinkDisabledPage
	{
		return new LinkDisabledPage({
			...this.#options,
		});
	}

	createMassPage(): MassPage
	{
		const departmentControl = this.createDepartmentControl(
			[EntityType.DEPARTMENT],
		);

		return new MassPage({
			departmentControl,
			departmentControlBlock: this.createDepartmentControlBlock(departmentControl),
		});
	}

	createDepartmentControlBlock(departmentControl: DepartmentControl): DepartmentControlBlock
	{
		return new DepartmentControlBlock({
			departmentControl,
			canCreateDepartment: this.#options.canCurrentUserCreateDepartment === true,
		});
	}

	createDepartmentControl(entitiesType: Array): DepartmentControl
	{
		const departmentsId = Type.isArray(this.#userOptions?.departmentList)
			? this.#userOptions.departmentList
			: [];
		let groupOptions = {};
		const preselectedItems = [];
		const rootDepartment = this.#userOptions?.rootDepartment?.id === this.#userOptions?.companyRootDepartment?.id
			? null
			: this.#userOptions?.rootDepartment;
		const withGroups = entitiesType.includes(EntityType.GROUP) || entitiesType.includes(EntityType.EXTRANET);

		if (withGroups)
		{
			groupOptions = {
				createProjectLink: !(!entitiesType.includes(EntityType.GROUP) && entitiesType.includes(EntityType.EXTRANET)),
			};

			if (
				this.projectLimitExceeded
				&& this.projectLimitFeatureId
			)
			{
				groupOptions.lockProjectLink = this.projectLimitExceeded;
				groupOptions.lockProjectLinkFeatureId = this.projectLimitFeatureId;
			}

			const projectId = this.#getProjectId();

			if (projectId)
			{
				preselectedItems.push(['project', projectId]);
			}
		}

		return new DepartmentControl({
			id: 'invite-page-department-control',
			title: '',
			description: '',
			entitiesType,
			groupOptions,
			preselectedItems,
			departmentList: departmentsId,
			showDepartmentCreationFooter: true,
			showDepartmentCreationFooterInRecentTab: true,
			showDepartmentCreationFooterInSearchTab: true,
			dialogOptions: {
				alwaysShowLabels: true,
			},
			rootDepartment: Type.isObject(rootDepartment) ? rootDepartment : null,
			addButtonCaption: withGroups
				? Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_CAPTION_WITH_GROUP_MSGVER_1')
				: Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_CAPTION_MSGVER_1'),
		});
	}

	createInputRowFactory(inviteType?: InviteType, withProfileNameFields: boolean = false): InputRowFactory
	{
		return new InputRowFactory({
			inviteType,
			withProfileNameFields,
		});
	}

	#getProjectId(): ?number
	{
		return this.#userOptions?.groupId
			? parseInt(this.#userOptions.groupId, 10)
			: 0;
	}
}
