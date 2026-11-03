<?php

return [
	'extensions' => [
		'background/ui-manager',
		'tourist',
		'intranet:cowork-meetup-promo/const',
		'intranet:cowork-meetup-promo/rest',
		'intranet:cowork-meetup-promo/utils',
	],
	'components' => [
		// opened by name from const, so there is no literal for the linter to find
		'intranet:cowork-meetup-promo', // @keep
	],
];
