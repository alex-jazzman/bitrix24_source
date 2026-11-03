import { type RelationOption } from '../relation-rows/relation-rows';
import { CLIENT_CHIP_WITHOUT_HINT, RELATION_OPTION_HINT } from '../../const/relations-layout';

// Phrase code of the hover hint for one sub-option chip, or '' when the option has no hint.
//
// The "Client" row's contact and company field chips omit the generic hint: their group heading
// names the artifact and their own label names the card, while the kind-level hint below would
// actively mislead because its "эта карточка" means the card the heading names. The exemption is
// narrowed to child-field on purpose: contact and company are absent from the parent catalog today,
// and if they ever appear there, that chip is a normal one and must keep its hint.
export function resolveRelationOptionHint(option: RelationOption): string
{
	if (
		option.direction === 'child'
		&& option.kind === 'field'
		&& CLIENT_CHIP_WITHOUT_HINT.includes(option.entityTypeId)
	)
	{
		return '';
	}

	return RELATION_OPTION_HINT[`${option.direction}-${option.kind}`] ?? '';
}
