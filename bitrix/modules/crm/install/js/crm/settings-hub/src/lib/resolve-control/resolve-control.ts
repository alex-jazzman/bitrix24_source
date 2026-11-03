// Control selection: a form-provided control (its complex controls) wins over the kit default
// for the same controlType; an unknown controlType with neither resolves to null (the kit has no
// default for relation/array, so the form must supply those). Kept framework-agnostic (generic T)
// so it carries no ui.vue3 runtime dependency and stays unit-testable in the bare harness.
export function resolveControl<T>(
	controlType: string,
	formControls: Record<string, T> | null,
	defaults: Record<string, T>,
): T | null
{
	const formControl = formControls === null ? undefined : formControls[controlType];

	return formControl ?? defaults[controlType] ?? null;
}
