<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!defined('AIR_SITE_TEMPLATE'))
{
	return [];
}

return [
	'css' => 'grid.css',
	'rel' => ['intranet.old-interface.popup'],
];
