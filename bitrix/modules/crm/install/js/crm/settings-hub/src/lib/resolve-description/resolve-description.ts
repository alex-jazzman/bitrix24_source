import { type SettingsRecord } from '../../const/record';

export function resolveDescription(descriptor: SettingsRecord): string
{
	return (descriptor.kind === 'scalar' && descriptor.description) ? descriptor.description : '';
}
