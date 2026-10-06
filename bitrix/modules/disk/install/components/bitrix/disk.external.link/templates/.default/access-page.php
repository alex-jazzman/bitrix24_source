<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * Shared decoration switch for the access pages (see HDR-01 contract).
 * The look depends on who is watching, not on which component renders the page:
 * an anonymous recipient gets the external photo backdrop plus the top header,
 * a portal user gets the internal backdrop and no header at all.
 * Included by external.link / error.page templates from $_SERVER['DOCUMENT_ROOT'].
 *
 * Provides in the caller scope:
 * @var bool $showExternalHeader Whether access-header.php has to be rendered.
 * @var string $pageBodyClass    Class list for the <body> element.
 * @var string $cardLayoutClass  Class list for the access card wrapper.
 */

$isPortalUser = (int)\Bitrix\Main\Engine\CurrentUser::get()->getId() > 0;

$showExternalHeader = !$isPortalUser;
$pageBodyClass = $isPortalUser ? 'disk-ext-page --internal' : 'disk-ext-page';
// The card is centered in the viewport on both outlines: the header floats over the backdrop.
$cardLayoutClass = 'disk-ext-card-layout --centered';
