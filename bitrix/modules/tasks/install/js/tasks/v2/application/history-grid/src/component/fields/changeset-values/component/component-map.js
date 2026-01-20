import { UserElementList } from './user-component/user-element-list';
import { RelatedTaskElementList } from './related-task-component/related-task-element-list';
import { GroupElement } from './group-component/group-element';
import { FlowElement } from './flow-component/flow-element';
import { CrmElementList } from './crm-component/crm-element-list';
import { CheckListElement } from './check-list-component/check-list-element';

export const componentMap = {
	RESPONSIBLE_ID: UserElementList,
	AUDITORS: UserElementList,
	CREATED_BY: UserElementList,
	ACCOMPLICES: UserElementList,
	PARENT_ID: RelatedTaskElementList,
	DEPENDS_ON: RelatedTaskElementList,
	GROUP_ID: GroupElement,
	FLOW_ID: FlowElement,
	UF_CRM_TASK_DELETED: CrmElementList,
	UF_CRM_TASK_ADDED: CrmElementList,
	CHECKLIST_ITEM_CHECK: CheckListElement,
	CHECKLIST_ITEM_UNCHECK: CheckListElement,
};
