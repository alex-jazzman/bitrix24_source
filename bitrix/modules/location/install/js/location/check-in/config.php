<?php

use Bitrix\Location\Service\FormatService;
use Bitrix\Location\Entity\Source\Factory;
use Bitrix\Location\Repository\SourceRepository;
use Bitrix\Location\Entity\Source\OrmConverter;
use Bitrix\Main\SystemException;
use Bitrix\Main\Loader;
use Bitrix\Location\Infrastructure\UserLocation;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

// Engine selection: explicit request override wins, otherwise the backend
// feature flag (Option) governs rollout. Falls back to Leaflet.
$requestEngine = (string)($_REQUEST['mapEngine'] ?? '');
$mapEngine = in_array($requestEngine, ['maplibre', 'leaflet'], true)
	? $requestEngine
	: (
		\Bitrix\Main\Config\Option::get('stafftrackmobile', 'check_in_map_engine', 'leaflet') === 'maplibre'
			? 'maplibre'
			: 'leaflet'
	);

return [
	'css' => 'dist/check-in-map.bundle.css',
	'js' => 'dist/check-in-map.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'location.core',
		'location.source',
		'ui.avatar',
	],
	// The MapLibre engine ships a heavy vendor bundle, so it is attached to the page
	// only for the engine that was actually selected.
	'post_rel' => $mapEngine === 'maplibre' ? ['location.osm.check-in-maplibre'] : [],
	'skip_core' => true,
	'oninit' => static function() use ($mapEngine)
	{
		if (!Loader::includeModule('location'))
		{
			throw new SystemException('Module Location have not been installed');
		}

		$sourceCode = '';
		$sourceParams = [];
		$sourceLanguageId = LANGUAGE_ID;

		// TODO: After Google Maps support is fully implemented in check-in,
		//  restore dynamic source selection via SourceService::getInstance()->getSource()
		//  Currently hardcoded to OSM to ensure consistent behavior.
		$sourceRepository = new SourceRepository(new OrmConverter());
		$source = $sourceRepository->findByCode(Factory::OSM_SOURCE_CODE);


		if ($source)
		{
			$sourceCode = $source->getCode();
			$sourceParams = $source->getJSParams();
			$sourceLanguageId = $source->convertLang(LANGUAGE_ID);
			$sourceParams['autocompleteReplacements'] = $source->getAutocompleteReplacements(LANGUAGE_ID);
		}

		$format = FormatService::getInstance()->findDefault(LANGUAGE_ID);
		$format  = $format ? $format->toJson() : '';

		$defaultLocationPoint = UserLocation::getPoint();

		return [
			'lang_additional' => [
				'LOCATION_MOBILE_SOURCE_CODE' => $sourceCode,
				'LOCATION_MOBILE_SOURCE_PARAMS' => $sourceParams,
				'LOCATION_MOBILE_MAP_ENGINE' => $mapEngine,
				'LOCATION_WIDGET_DEFAULT_FORMAT' => $format,
				'LOCATION_MOBILE_LANGUAGE_ID' => LANGUAGE_ID,
				'LOCATION_MOBILE_SOURCE_LANGUAGE_ID' => $sourceLanguageId,
				'LOCATION_MOBILE_DEFAULT_LOCATION_POINT' => Json::encode([
					'latitude' => $defaultLocationPoint->getLat(),
					'longitude' => $defaultLocationPoint->getLng()
				]),
			]
		];
	}
];
