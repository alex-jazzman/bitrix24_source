<?php

use Bitrix\Main\Mail\Internal\EventTypeTable;
use Bitrix\Main\Sms\TemplateTable;
use Bitrix\Main\SiteTable;

$languages = [];
$langs = CLanguage::GetList();
while ($language = $langs->Fetch())
{
	$languages[] = $language;
}

$eventTypes = [];
foreach ($languages as $language)
{
	$lid = $language['LID'];

	IncludeModuleLangFile(__FILE__, $lid);

	$eventTypes[] = [
		'LID' => $lid,
		'EVENT_NAME' => 'VIRUS_DETECTED',
		'NAME' => GetMessage('VIRUS_DETECTED_NAME'),
		'DESCRIPTION' => GetMessage('VIRUS_DETECTED_DESC'),
	];
	$eventTypes[] = [
		'LID' => $lid,
		'EVENT_NAME' => 'USER_OTP_AUTH_CODE',
		'NAME' => GetMessage('SEC_EVENT_USER_OTP_NAME'),
		'DESCRIPTION' => GetMessage('SEC_EVENT_USER_OTP_DESC'),
	];
	$eventTypes[] = [
		'LID' => $lid,
		'EVENT_NAME' => 'USER_OTP_EMAIL_CONFIRM',
		'NAME' => GetMessage('SEC_EVENT_USER_OTP_CONFIRM_NAME'),
		'DESCRIPTION' => GetMessage('SEC_EVENT_USER_OTP_CONFIRM_DESC'),
	];

	//sms types
	$eventTypes[] = [
		'LID' => $lid,
		'EVENT_NAME' => 'SMS_USER_OTP_AUTH_CODE',
		'EVENT_TYPE' => EventTypeTable::TYPE_SMS,
		'NAME' => GetMessage('SECURITY_INSTALL_SMS_EVENT_OTP_CONFIRM_NAME'),
		'DESCRIPTION' => GetMessage('SECURITY_INSTALL_SMS_EVENT_OTP_CONFIRM_DESC'),
	];
}

foreach ($eventTypes as $eventType)
{
	CEventType::Add($eventType);
}

foreach ($languages as $language)
{
	$lid = $language['LID'];

	IncludeModuleLangFile(__FILE__, $lid);

	$arSites = [];
	$sites = CSite::GetList('', '', ['LANGUAGE_ID' => $lid]);
	while ($site = $sites->Fetch())
	{
		$arSites[] = $site['LID'];
	}

	if (!empty($arSites))
	{
		$emailTemplates = [
			[
				'ACTIVE' => 'Y',
				'EVENT_NAME' => 'VIRUS_DETECTED',
				'LID' => $arSites,
				'LANGUAGE_ID' => $lid,
				'EMAIL_FROM' => '#DEFAULT_EMAIL_FROM#',
				'EMAIL_TO' => '#EMAIL#',
				'BCC' => '',
				'SUBJECT' => GetMessage('VIRUS_DETECTED_SUBJECT'),
				'MESSAGE' => GetMessage('VIRUS_DETECTED_MESSAGE'),
				'BODY_TYPE' => 'text',
			],
			[
				'ACTIVE' => 'N',
				'EVENT_NAME' => 'USER_OTP_AUTH_CODE',
				'LID' => $arSites,
				'LANGUAGE_ID' => $lid,
				'EMAIL_FROM' => '#DEFAULT_EMAIL_FROM#',
				'EMAIL_TO' => '#EMAIL#',
				'BCC' => '',
				'SUBJECT' => GetMessage('SEC_TEMPLATE_USER_OTP_SUBJECT'),
				'MESSAGE' => GetMessage('SEC_TEMPLATE_USER_OTP_MESSAGE'),
				'BODY_TYPE' => 'text',
			],
			[
				'ACTIVE' => 'N',
				'EVENT_NAME' => 'USER_OTP_EMAIL_CONFIRM',
				'LID' => $arSites,
				'LANGUAGE_ID' => $lid,
				'EMAIL_FROM' => '#DEFAULT_EMAIL_FROM#',
				'EMAIL_TO' => '#EMAIL#',
				'BCC' => '',
				'SUBJECT' => GetMessage('SEC_TEMPLATE_USER_OTP_CONFIRM_SUBJECT'),
				'MESSAGE' => GetMessage('SEC_TEMPLATE_USER_OTP_CONFIRM_MESSAGE'),
				'BODY_TYPE' => 'text',
			],
		];

		$emess = new CEventMessage();
		foreach ($emailTemplates as $emailTemplate)
		{
			$emess->Add($emailTemplate);
		}
	}

	//sms templates
	$smsTemplates = [
		[
			'EVENT_NAME' => 'SMS_USER_OTP_AUTH_CODE',
			'ACTIVE' => true,
			'SENDER' => '#DEFAULT_SENDER#',
			'RECEIVER' => '#USER_PHONE#',
			'MESSAGE' => GetMessage('SECURITY_INSTALL_SMS_TEMPLATE_OTP_CONFIRM_MESS'),
			'LANGUAGE_ID' => $lid,
		],
	];

	$entity = TemplateTable::getEntity();
	$site = SiteTable::getEntity()->wakeUpObject(CSite::GetDefSite());

	foreach ($smsTemplates as $smsTemplate)
	{
		$template = $entity->createObject();
		foreach ($smsTemplate as $field => $value)
		{
			$template->set($field, $value);
		}
		$template->addToSites($site);
		$template->save();
	}
}
