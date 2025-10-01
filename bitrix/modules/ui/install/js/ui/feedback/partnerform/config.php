<?php


if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/PartnerForm.bundle.css',
	'js' => 'dist/PartnerForm.bundle.js',
	'rel' => [
		'main.core',
		'ui.feedback.form',
	],
	'skip_core' => false,
	'settings' => [
		'partnerUri' => (new \Bitrix\UI\Form\UrlProvider())->getPartnerPortalUrl(),
		'partnerForms' => (new \Bitrix\UI\Form\FormProvider())->getPartnerFormList(),
	],
];
