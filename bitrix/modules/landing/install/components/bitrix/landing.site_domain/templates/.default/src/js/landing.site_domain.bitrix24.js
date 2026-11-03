import {Loc} from 'main.core';
import {Input} from './landing.site_domain.input';

export class Bitrix24 extends Input
{
	/**
	 * Constructor.
	 */
	constructor(params)
	{
		super(params);
	}

	/**
	 * Refuses a name with a character outside ASCII: Domain::check would turn it into punycode.
	 * @param {string} domainName Trimmed name from the field.
	 * @return {string|null}
	 */
	getNameError(domainName)
	{
		const hasNonAscii = [...domainName].some((char) => char.codePointAt(0) > 0x7F);

		return hasNonAscii ? Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_NOT_ASCII') : null;
	}
}