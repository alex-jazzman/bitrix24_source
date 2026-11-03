<?php

return [
	'extensions' => [
		'type',
		'apptheme',
		'utils/console', // @keep polyfills console.group used by printers.js
		'utils/object',
	],
	'bundle' => [
		'./test-suite',
		'./test-case',
		'./suite-registry',
		'./test-config',
		'./expectation-failed',
		'./expectation-count',
		'./timeout-failed',
		'./expectation',
		'./matchers',
		'./report',
		'./printers',
	],
];