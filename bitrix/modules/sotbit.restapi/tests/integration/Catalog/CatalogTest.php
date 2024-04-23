<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration\Catalog;

/**
 * Class CatalogTest
 *
 * @package Sotbit\RestAPI\Tests\integration\Catalog
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 27.02.2023
 */
class CatalogTest extends BaseCatalogTest
{
    /**
     * Get all available catalogs and test first
     *
     * @return void
     * @throws \Throwable
     */
    public function testGetCatalog(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog'
        );

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);

        if(is_array($resultJson['message']['data']) && count($resultJson['message']['data'])) {
            $selectIblock = array_keys($resultJson['message']['data'])[0];
            if($resultJson['message']['data'][$selectIblock]) {
                self::$catalog = (int) $resultJson['message']['data'][$selectIblock]['IBLOCK_ID'];
            }
        }
    }

    /**
     * Test isset available catalog
     *
     * @return void
     * @throws \Throwable
     */
    public function testGetIssetCatalog(): void
    {
        if(self::$catalog) {
            $response = $this->runApp(
                'GET',
                '/'.self::VERSION_API.'/catalog/'.self::$catalog
            );

            $this->assertEquals(200, $response->getStatusCode());
            $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

            $resultJson = $this->getJson($response);
            $this->assertEquals('success', $resultJson['status']);
            $this->assertArrayHasKey('message', $resultJson);

        } else {
            $this->expectNotToPerformAssertions();
        }
    }

    /**
     * Test catalog from settings
     *
     * @return void
     */
    public function testGetCurrentSettingCatalog(): void
    {
        $this->expectNotToPerformAssertions();
    }

    /**
     * Test catalog not found
     *
     * @return void
     * @throws \Throwable
     */
    public function testGetCatalogBadRequest(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/asd'
        );

        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));

        $resultJson = $this->getJson($response);
        $this->assertEquals('error', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    public function testGetCatalogNotFount(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/1111111111111111111'
        );

        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));

        $resultJson = $this->getJson($response);
        $this->assertEquals('error', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }
}
