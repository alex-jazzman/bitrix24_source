<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

// Menu config consumed by bitrix:menu on /guest/{code}; bitrix24's left_vertical
// result_modifier feeds these items into the Social preset, which places
// menu_im_messenger inside the menu_teamwork section.
$aMenuLinks = [
	[
		GetMessage('IM_GUEST_LEFT_MENU_MESSENGER'),
		'#',
		[],
		[
			'menu_item_id' => 'menu_im_messenger',
			'counter_id' => 'im-message',
		],
		'',
	],
];
