import { type SettingsRecord } from '../../const/record';

export type DisabledState = {
	isDisabled: boolean;
	reason: string;
};

// The disabled modifier is orthogonal to kind/controlType: a record is disabled when the form is
// read-only globally, or when its backend gate key is truthy in the snapshot. The reason phrase is
// shown only for a backend gate (read-only mode hides the whole panel, so no per-control reason).
export function resolveDisabled(
	descriptor: SettingsRecord,
	snapshot: Record<string, unknown>,
	readOnly: boolean,
): DisabledState
{
	const gate = descriptor.disabled;
	const backendDisabled = gate ? Boolean(snapshot[gate.condition]) : false;

	return {
		isDisabled: readOnly || backendDisabled,
		reason: backendDisabled && gate ? gate.reasonSource : '',
	};
}
