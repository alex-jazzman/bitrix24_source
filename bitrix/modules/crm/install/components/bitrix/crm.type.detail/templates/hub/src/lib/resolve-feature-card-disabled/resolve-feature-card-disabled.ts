import { type ScalarRecord } from 'crm.settings-hub';

// Feature cards render through CrmHubFeatureCard directly instead of the generic
// CrmHubControlRenderer, so they need their own version of the kit's backend-gate check
// (crm.settings-hub's resolveDisabled) to keep observing descriptor.ts's `disabled` entries
// (sp-categories/sp-recyclebin today — prod's real backend gates, not a designed dependency).
// Mirrored locally instead of calling the kit function: a value import from crm.settings-hub needs
// BX.Crm.SettingsHub at runtime, which the bare unit-test harness never loads (confirmed — it has no
// config.php to read, unlike the kit's own tests: bundle.config.js sets adjustConfigPhp: false for
// this template). Only the type import above is kept, same as elsewhere in src/, since type imports
// are erased at build and add no runtime dependency. readOnly is not modeled: the feature-card grid
// has no read-only mode of its own, same as every other designed section app.ts wires up today.
export function resolveFeatureCardDisabled(
	record: ScalarRecord,
	snapshot: Record<string, unknown>,
): { disabled: boolean, reason: string }
{
	const gate = record.disabled;
	const isBackendDisabled = gate ? Boolean(snapshot[gate.condition]) : false;

	return {
		disabled: isBackendDisabled,
		reason: isBackendDisabled && gate ? gate.reasonSource : '',
	};
}
