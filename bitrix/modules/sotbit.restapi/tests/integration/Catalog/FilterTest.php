<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration\Catalog;

use JsonException, Throwable;

/**
 * Class FilterTest
 *
 * @package Sotbit\RestAPI\Tests\integration\Catalog
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 27.02.2023
 */
class FilterTest extends BaseCatalogTest
{
    /**
     * Test catalog filter
     *
     * @return void
     * @throws JsonException
     * @throws Throwable
     */
    public function testGetCatalogFilter(): void
    {
        if(!self::$catalog) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/'.self::$catalog.'/filter'
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    public function testGetCatalogFilterSection(): void
    {
        if(!self::$catalog) {
            $this->expectNotToPerformAssertions();
        }
        $this->expectNotToPerformAssertions();
    }

}
