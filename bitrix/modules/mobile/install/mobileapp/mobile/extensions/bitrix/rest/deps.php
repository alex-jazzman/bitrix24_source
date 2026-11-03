<?php

return [
	'extensions' => [
		// Nothing here requires db, helpers/holder or utils, but consumers of rest do: they reach
		// globals these extensions install without declaring them, and the declaration below is the
		// only reason those globals are in their bundle. Dropping it is a separate task with its own
		// audit of every consumer.
		'db', //@keep
		'helpers/holder', //@keep
		'rest/run-action-executor',
		'rest/transport',
		'type',
		'utils', //@keep
		'utils/object',
	],
];
