import { LIVE_BOOLEAN_FIELD_NAMES } from '../../const/descriptor';
import { normalizeDaysBeforeClose } from '../hub-values/hub-values';
import { type TypeHubValues } from '../../model/type-hub-store';

export type TypeSeed = Record<string, unknown>;

// Compose the payload fields from the server seed (arResult['type']) overwritten by the
// store values, exactly as prod's save() writes onto TypeModel.data. Empty-collection collapse to
// `false` is NOT done here; it stays in TypeModel.getData() (crm.type-model), applied at save time
// by the adapter, so it is not reimplemented. The dead field
// isCrmTrackingEnabled is never written (it is not among the 16 live names).
// The description is not in the seed: the converter does not send it, so it comes from the store only, passed
// through the injected field rule (normalizeHubDescription of crm.settings-hub). The store keeps what was typed.
export function collectTypeFields(
	seed: TypeSeed,
	values: TypeHubValues,
	hasCustomSection: boolean,
	normalizeDescription: (value: string) => string,
): Record<string, unknown>
{
	const fields: Record<string, unknown> = { ...seed };

	fields.title = values.title; // client does NOT trim
	fields.description = normalizeDescription(values.description);
	fields.daysBeforeClose = normalizeDaysBeforeClose(values.daysBeforeClose);

	LIVE_BOOLEAN_FIELD_NAMES.forEach((name) => {
		fields[name] = Boolean(values[name]);
	});

	fields.linkedUserFields = values.linkedUserFields;
	fields.relations = {
		parent: values.relations.parent,
		child: values.relations.child,
	};

	// customSectionId / customSections / isExternal / isSaveFromTypeDetail are written only when the
	// custom-section control is present (prod: `if (this.customSectionController)`), otherwise the
	// seed values are preserved verbatim.
	if (hasCustomSection)
	{
		fields.customSectionId = values.customSectionId;
		fields.customSections = values.customSections;
		fields.isExternal = values.isExternal;
		fields.isSaveFromTypeDetail = true;
	}

	return fields;
}
