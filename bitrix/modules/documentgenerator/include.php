<?php

CJSCore::RegisterExt('documentpreview', [
	'rel' => ['documentgenerator.preview'],
]);

\Bitrix\Main\Loader::registerAutoLoadClasses(
	"documentgenerator",
	[
		"petrovich" => "lib/external/petrovich.php",
	]
);
