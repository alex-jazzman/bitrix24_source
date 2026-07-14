<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/mailer.bundle.js',
	'rel' => [
		'mail.client.binding',
		'mail.client.errorbox',
		'mail.client.filtertoolbar',
		'mail.client.mailboxselector',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];