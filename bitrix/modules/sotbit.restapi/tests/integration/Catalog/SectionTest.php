<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration\Catalog;

use JsonException, Throwable;

/**
 * Class SectionTest
 *
 * @package Sotbit\RestAPI\Tests\integration\Catalog
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 27.02.2023
 */
class SectionTest extends BaseCatalogTest
{
    /**
     * Test get all sections
     *
     * @return void
     * @throws JsonException
     * @throws Throwable
     */
    public function testGetSections(): void
    {
        // if no isset available catalog
        if(!self::$catalog) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/'.self::$catalog.'/sections'
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
        $this->assertArrayHasKey('data', $resultJson['message']);
        $this->assertArrayHasKey('info', $resultJson['message']);

        if(count($resultJson['message']['data'])) {
            $section = $resultJson['message']['data'][array_keys($resultJson['message']['data'])[0]];
            $this->assertArrayHasKey('ID', $section);
            self::$section = (int)$section['ID'];
        }
    }

    /**
     * Test available section
     *
     * @return void
     * @throws JsonException
     * @throws Throwable
     */
    public function testGetSection(): void
    {
        // if no isset available catalog and section
        if(!self::$catalog && !self::$section) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/'.self::$catalog.'/sections/'.self::$section
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
        $this->assertArrayHasKey('ID', $resultJson['message']);
    }

    /**
     * Test bad requst for section
     *
     * @return void
     * @throws JsonException
     * @throws Throwable
     */
    public function testGetSectionBadRequest(): void
    {
        // if no isset available catalog
        if(!self::$catalog) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/'.self::$catalog.'/sections/asd'
        );

        // headers
        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('error', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    /**
     * Test not found for section
     *
     * @return void
     * @throws JsonException
     * @throws Throwable
     */
    public function testGetSectionNotFound(): void
    {
        // if no isset available catalog
        if(!self::$catalog) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/'.self::$catalog.'/sections/1111111111111111111'
        );

        // headers
        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('error', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }
}
