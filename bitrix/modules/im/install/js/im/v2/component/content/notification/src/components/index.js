import { CalendarNotificationItem } from './modules/calendar/calendar-item';
import { CrmNotificationItem } from './modules/crm/crm-item';
import { TaskNotificationItem } from './modules/task/task-item';
import { BizprocNotificationItem } from './modules/bizproc/bizproc-item';
import { SonetNotificationItem } from './modules/sonet/sonet';
import { CompatibilityNotificationItem } from './modules/compatibility/compatibility-item';
import { DefaultNotificationItem } from './modules/default/default-item';

export const NotificationComponents = {
	TaskEntity: TaskNotificationItem,
	CalendarEntity: CalendarNotificationItem,
	CompatibilityEntity: CompatibilityNotificationItem,
	CrmEntity: CrmNotificationItem,
	BizprocEntity: BizprocNotificationItem,
	SonetEntity: SonetNotificationItem,
	DefaultEntity: DefaultNotificationItem,
};
