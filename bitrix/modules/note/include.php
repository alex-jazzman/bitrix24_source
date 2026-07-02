<?php

use Bitrix\Main\Loader;

Loader::registerAutoLoadClasses(
	'note',
	[
		'Bitrix\\Note\\' => 'lib/',
	]
);
