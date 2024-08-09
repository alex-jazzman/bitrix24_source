<?php

return [
	'extensions' => [
		'bbcode/formatter',
		'bbcode/parser',
		'bbcode/model',
		'type',
		'in-app-url',
	],
    'bundle' => [
        'node-formatters/disk-formatter',
        'node-formatters/strip-tag-formatter',
        'node-formatters/mention-formatter',
        'node-formatters/text-formatter',
    ],
];
