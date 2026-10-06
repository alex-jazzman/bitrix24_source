import { type NotificationCatalog } from './types';

export function isValidNotificationCatalog(value: mixed): boolean
{
	return (
		value !== null
		&& typeof value === 'object'
		&& !Array.isArray(value)
		&& Array.isArray(value.groups)
		&& value.groups.length > 0
		&& value.groups.every(
			(g) => Array.isArray(g.types)
				&& g.types.every((type) => typeof type.counterEnabled === 'boolean'),
		)
	);
}
