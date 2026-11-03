import { type PreparedTemplate } from '../../../model/compose/types';
import { type PreparedTemplateDto } from './types';

/**
 * Reads the prepared template of the transport as the form keeps it. Old Mail backends omit the
 * attachments, and every consumer of the state relies on the list being there, so the field is filled
 * here rather than checked at each place that walks it. The answer is filled in place: the form keeps
 * the very object the transport returned, and the identity of that object is what tells one prepared
 * template from another.
 */
export function toPreparedTemplate(dto: PreparedTemplateDto): PreparedTemplate
{
	return Object.assign(dto, { attachments: dto.attachments ?? [] });
}
