<?php

use Bitrix\Main\Loader;
use Bitrix\UI\Form\FormProvider;
use Bitrix\UI\Form\UrlProvider;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$formProvider = new FormProvider();

$partnerPresets = [];
if (Loader::includeModule('bitrix24'))
{
	$currentUser = \Bitrix\Bitrix24\CurrentUser::get();
	$partnerPresets = [
		'user_id' => $currentUser->getId(),
		'user_email' => $currentUser->getEmail(),
		'is_admin' => $currentUser->isAdmin() ? 'Y' : 'N',
		'user_phone' => $currentUser->getPhoneNumber(),
	];
}

return [
	'css' => 'dist/partner-form.bundle.css',
	'js' => 'dist/partner-form.bundle.js',
	'rel' => [
		'main.core',
		'ui.feedback.form',
	],
	'skip_core' => false,
	'settings' => [
		'partnerFeedbackPresets' => $partnerPresets,
		'partnerUri' => (new UrlProvider())->getPartnerPortalUrl(),
		'partnerForms' => $formProvider->getPartnerFormList(),
		'partnerFeedbackForms' => $formProvider->getPartnerFeedbackFormList(),
		'partnerRefusalForms' => $formProvider->getPartnerRefusalFormList(),
		'partnerRefusalCheckoutForms' => $formProvider->getPartnerRefusalCheckoutFormList(),
	],
];
