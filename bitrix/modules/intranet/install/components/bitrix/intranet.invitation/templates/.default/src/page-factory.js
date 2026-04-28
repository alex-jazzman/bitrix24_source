import { LocalEmailPage } from './page/local-email-page';
import { ExtranetPage } from './page/extranet-page';
import { IntegratorPage } from './page/integrator-page';
import { LinkPage } from './page/link-page';
import { InvitePage } from './page/invite-page';
import { MassPage } from './page/mass-page';
import { RegisterPage } from './page/register-page';
import { Loc, Type } from 'main.core';
import DepartmentControl, { EntityType } from 'intranet.department-control';
import { InputRowFactory } from './input-row-factory';
import type { PageOptions } from './type/page-options';
import { LinkDisabledPage } from './page/link-disabled-page';
import InviteType from './type/invite-type';

export class PageFactory
{
	#options: PageOptions;
	#userOptions: Object;

	constructor(options: PageOptions, userOptions: Object)
	{
		this.#options = options;
		this.#userOptions = userOptions;
	}

	createLocalEmailPage(): LocalEmailPage
	{
		return new LocalEmailPage({
			...this.#options,
			departmentControl: this.createDepartmentControl(
				Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION'),
				[EntityType.DEPARTMENT],
			),
		});
	}

	createInvitePage(inviteType: InviteType, showMassInviteButton: Boolean = true): InvitePage
	{
		return new InvitePage({
			...this.#options,
			inviteType,
			departmentControl: this.createDepartmentControl(
				Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION_WITH_GROUP'),
				[EntityType.DEPARTMENT, EntityType.GROUP, EntityType.EXTRANET],
			),
			inputsFactory: this.createInputRowFactory(inviteType),
			showMassInviteButton,
		});
	}

	createExtranetPage(): ExtranetPage
	{
		return new ExtranetPage({
			...this.#options,
			inputsFactory: this.createInputRowFactory(InviteType.ALL),
			departmentControl: this.createDepartmentControl(
				Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION_EXTRANET'),
				[EntityType.EXTRANET],
			),
		});
	}

	createRegisterPage(): RegisterPage
	{
		return new RegisterPage({
			...this.#options,
			departmentControl: this.createDepartmentControl(
				Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION_WITH_GROUP'),
				[EntityType.DEPARTMENT, EntityType.GROUP, EntityType.EXTRANET],
			),
			inputsFactory: this.createInputRowFactory(),
		});
	}

	createIntegratorPage(): IntegratorPage
	{
		return new IntegratorPage({
			transport: this.#options.transport,
		});
	}

	createLinkPage(): LinkPage
	{
		return new LinkPage({
			...this.#options,
			departmentControl: this.createDepartmentControl(
				Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION'),
				[EntityType.DEPARTMENT],
			),
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
		return new MassPage({
			departmentControl: this.createDepartmentControl(
				Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION'),
				[EntityType.DEPARTMENT],
			),
		});
	}

	createDepartmentControl(description: string, entitiesType: Array): DepartmentControl
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
			description,
			entitiesType,
			groupOptions,
			preselectedItems,
			departmentList: departmentsId,
			dialogOptions: {
				alwaysShowLabels: true,
			},
			rootDepartment: Type.isObject(rootDepartment) ? rootDepartment : null,
			addButtonCaption: withGroups
				? Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_CAPTION_WITH_GROUP')
				: Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_CAPTION'),
		});
	}

	createInputRowFactory(inviteType: InviteType): InputRowFactory
	{
		return new InputRowFactory({
			inviteType,
		});
	}

	#getProjectId(): ?number
	{
		return this.#userOptions?.groupId
			? parseInt(this.#userOptions.groupId, 10)
			: 0;
	}
}
