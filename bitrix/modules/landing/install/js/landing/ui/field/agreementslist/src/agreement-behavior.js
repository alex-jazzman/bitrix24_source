export const PERSONAL_DATA_AGREEMENT_CODE = 'crm_def';

type AgreementBehavior = {
	checked?: boolean,
	required?: boolean,
	acceptBySubmit?: boolean,
};

export function getAgreementBehaviorType(agreement: AgreementBehavior): string
{
	if (agreement.acceptBySubmit === true)
	{
		return 'type5';
	}

	if (agreement.checked === true && agreement.required === true)
	{
		return 'type1';
	}

	if (agreement.checked === false && agreement.required === true)
	{
		return 'type2';
	}

	if (agreement.checked === true && agreement.required === false)
	{
		return 'type3';
	}

	return 'type4';
}

export function getInitialAgreementBehavior(agreementCode: ?string, isNewForm: boolean): AgreementBehavior
{
	if (agreementCode === PERSONAL_DATA_AGREEMENT_CODE && isNewForm)
	{
		return {acceptBySubmit: true};
	}

	return {checked: true, required: true, acceptBySubmit: false};
}
