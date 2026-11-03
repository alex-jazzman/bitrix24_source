<?php

declare(strict_types=1);

use Bitrix\Disk\Controller\Integration\Flipchart\Annotations;
use Bitrix\Main\Engine\Response\Json;
use Bitrix\Main\Routing\RoutingConfigurator;

return static function (RoutingConfigurator $routes): void {
	$methodNotAllowed = static function (string $allow): \Closure {
		return static function () use ($allow): Json {
			$response = new Json([
				'code' => 'method_not_allowed',
				'message' => 'Method is not allowed.',
			]);
			$response->setStatus(405);
			$response->addHeader('Allow', $allow);

			return $response;
		};
	};

	$routes
		->prefix('api/disk/flipchart/annotations/v1')
		->group(static function (RoutingConfigurator $routes) use ($methodNotAllowed): void {
			// every path is declared twice: the cloud web server answers 404 itself to a path with neither an
			// extension nor a trailing slash, so callers move to the slash form while the bare form keeps working
			$routes->any('annotations/count', [Annotations::class, 'count'])->methods(['GET']);
			$routes->any('annotations/count/', [Annotations::class, 'count'])->methods(['GET']);
			$routes->any('annotations/count', $methodNotAllowed('GET'));
			$routes->any('annotations/count/', $methodNotAllowed('GET'));

			$routes->any('annotations', [Annotations::class, 'list'])->methods(['GET']);
			$routes->any('annotations/', [Annotations::class, 'list'])->methods(['GET']);
			$routes->any('annotations', $methodNotAllowed('GET'));
			$routes->any('annotations/', $methodNotAllowed('GET'));

			$routes->any('annotations/delete', [Annotations::class, 'delete'])->methods(['POST']);
			$routes->any('annotations/delete/', [Annotations::class, 'delete'])->methods(['POST']);
			$routes->any('annotations/delete', $methodNotAllowed('POST'));
			$routes->any('annotations/delete/', $methodNotAllowed('POST'));

			$routes->any('annotations/restore', [Annotations::class, 'restore'])->methods(['POST']);
			$routes->any('annotations/restore/', [Annotations::class, 'restore'])->methods(['POST']);
			$routes->any('annotations/restore', $methodNotAllowed('POST'));
			$routes->any('annotations/restore/', $methodNotAllowed('POST'));

			$routes->any('annotations/{annotationId}', [Annotations::class, 'get'])->methods(['GET']);
			$routes->any('annotations/{annotationId}/', [Annotations::class, 'get'])->methods(['GET']);
			$routes->any('annotations/{annotationId}', [Annotations::class, 'put'])->methods(['PUT']);
			$routes->any('annotations/{annotationId}/', [Annotations::class, 'put'])->methods(['PUT']);
			$routes->any('annotations/{annotationId}', [Annotations::class, 'patch'])->methods(['PATCH']);
			$routes->any('annotations/{annotationId}/', [Annotations::class, 'patch'])->methods(['PATCH']);
			$routes->any('annotations/{annotationId}', $methodNotAllowed('GET, PUT, PATCH'));
			$routes->any('annotations/{annotationId}/', $methodNotAllowed('GET, PUT, PATCH'));
		})
	;
};
