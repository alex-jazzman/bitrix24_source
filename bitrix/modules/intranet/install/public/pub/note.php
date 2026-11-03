<?php

// A visitor of an external-access link has no account here, and the page must render for user 0.
define('NOT_CHECK_PERMISSIONS', true);
define('SKIP_TEMPLATE_AUTH_ERROR', true);
// The subscription is raised by the client, not by the page prolog.
define('BX_PULL_SKIP_INIT', true);
// The application takes the whole window, so the frame the pub template draws around a small public
// page - the table wrapper with the portal name and the footer - is switched off, exactly as the
// other full-screen pages of /pub/ do it.
define('SKIP_TEMPLATE_WRAPPER', true);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

use Bitrix\Main\Context;
use Bitrix\Main\Loader;
use Bitrix\Note\Public\Provider\ExternalAccessProvider;

/** @var CMain $APPLICATION */
// This file is delivered by intranet and the component by note, so a portal may hold the address while
// note is still a version behind. The class is what tells the two apart: it ships with the component,
// and without it IncludeComponent() would print its own technical error to the visitor.
//
// Nothing else is asked here: the kill-switch, the token and the state of the link are all resolved by
// the component, so that "the entry point is off", "no such link" and "access is closed" come back
// through one and the same path and look alike.
if (Loader::includeModule('note') && class_exists(ExternalAccessProvider::class))
{
	$APPLICATION->IncludeComponent(
		'bitrix:note.public',
		'',
		[
			'TOKEN' => (string)Context::getCurrent()->getRequest()->get('token'),
		],
	);
}
else
{
	// No link can have been issued on such a portal, so the address answers that it holds nothing. The
	// body stays empty on purpose: the look of a refusal belongs to the component, and /404.php would
	// draw the portal's own error page - a site map on a box - to an outside visitor.
	CHTTP::SetStatus('404 Not Found');
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
