<?php

use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$runtime = CBPRuntime::GetRuntime();
$runtime->includeActivityAiDescriptionFile('setfieldactivity');

class CBPAiCrmSetCompanyField extends CBPAiSetFieldActivity
{
	public function __construct($name = 'crmsetcompanyfield')
	{
		parent::__construct($name);
	}

	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		if (!\Bitrix\Main\Loader::includeModule('crm'))
		{
			return new SettingCollection();
		}

		$documentType = \CCrmBizProcHelper::ResolveDocumentType(\CCrmOwnerType::Company);

		return parent::getAiDescribedSettings($documentType);
	}
}