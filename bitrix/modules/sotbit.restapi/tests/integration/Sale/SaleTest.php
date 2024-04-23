<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration\Sale;

use Sotbit\RestAPI\Tests\integration\BaseTestCase;

class SaleTest extends BaseTestCase
{
    /**
     * Test get all my orders
     */
    public function testGetAllOrders(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/orders'
        );

        $result = (string) $response->getBody();

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('success', $result);
        $this->assertStringContainsString('message', $result);
        $this->assertStringContainsString('data', $result);

        $this->assertStringNotContainsString('error', $result);
    }

    /**
     * Test get detail order
     */
    public function testGetCurrentOrder(): void
    {
        $responseOrders = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/orders'
        );
        $resultOrders = (string) $responseOrders->getBody();
        if($resultOrders) {
            $orders = json_decode($resultOrders, true)['message']['data'];
            if(count($orders)) {
                $orderId = array_keys($orders)[0];
            }
        }

        if($orderId) {
            $response = $this->runApp(
                'GET',
                '/'.self::VERSION_API.'/orders/'.$orderId
            );

            $result = (string) $response->getBody();

            $this->assertEquals(200, $response->getStatusCode());
            $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
            $this->assertStringContainsString('success', $result);
            $this->assertStringContainsString('message', $result);
            $this->assertStringContainsString('data', $result);

            $this->assertStringNotContainsString('error', $result);
        } else {
            $this->expectOutputString('Orders not founds!');
            $this->assertTrue(false);
        }

    }

    /**
     * Test get detail order is not found
     */
    public function testGetCurrentNotFoundOrder(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/orders/1234567890'
        );

        $result = (string) $response->getBody();

        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));

        $this->assertStringNotContainsString('Not Found', $result);
    }

    /**
     * Test get status order
     */
    public function testGetStatusOrder(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/orders/status/1'
        );

        $result = (string) $response->getBody();

        $this->assertContains($response->getStatusCode(), [200, 404]);

        $this->assertStringNotContainsString('Not Found', $result);
    }

    /**
     * Test cancel order
     */
    public function testCancelNotFoundOrder(): void
    {
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/orders/cancel',
            ['id' => 123456789]
        );

        $result = (string) $response->getBody();

        $this->assertContains($response->getStatusCode(), [200, 404]);

        $this->assertStringNotContainsString('Not Found', $result);

    }


    /**
     * Test get sale pay systems
     */
    public function testGetPaySystems(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/sale/paysystems',
        );

        $result = (string) $response->getBody();

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('success', $result);
        $this->assertStringContainsString('message', $result);

        $this->assertStringNotContainsString('error', $result);

    }

    /**
     * Test get sale deliveries
     */
    public function testGetDeliveries(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/sale/deliveries',
        );

        $result = (string) $response->getBody();

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('success', $result);
        $this->assertStringContainsString('message', $result);

        $this->assertStringNotContainsString('error', $result);
    }

    /**
     * Test get sale person types
     */
    public function testGetPersonTypes(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/sale/persontypes',
        );

        $result = (string) $response->getBody();

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('success', $result);
        $this->assertStringContainsString('message', $result);

        $this->assertStringNotContainsString('error', $result);
    }

    /**
     * Test get sale order statuses
     */
    public function testGetOrderStatuses(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/sale/statuses',
        );

        $result = (string) $response->getBody();

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('success', $result);
        $this->assertStringContainsString('message', $result);

        $this->assertStringNotContainsString('error', $result);
    }

}
