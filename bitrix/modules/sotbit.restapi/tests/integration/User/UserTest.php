<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration\User;

use Sotbit\RestAPI\Tests\integration\BaseTestCase;

class UserTest extends BaseTestCase
{
    /**
     * @var int
     */
    private static $id;

    /**
     * Test Get All Users.
     */
    public function testGetCurrentUser(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/users'
        );

        $result = (string)$response->getBody();

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('success', $result);
        $this->assertStringContainsString('message', $result);

        $this->assertStringContainsString('main', $result);
        $this->assertStringContainsString('groups', $result);
        $this->assertStringContainsString('personal', $result);
        $this->assertStringContainsString('work', $result);

        $this->assertStringNotContainsString('error', $result);
    }

    /**
     * Test Get One User.
     */
    public function testGetUser(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/users/1'
        );

        $result = (string)$response->getBody();

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('success', $result);
        $this->assertStringContainsString('main', $result);
        $this->assertStringContainsString('groups', $result);
        $this->assertStringContainsString('personal', $result);
        $this->assertStringContainsString('work', $result);
        $this->assertStringNotContainsString('error', $result);
    }

    /**
     * Test Get User Not Found.
     */
    public function testGetUserNotFound(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/users/123456789123456789'
        );

        $result = (string)$response->getBody();

        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));
        $this->assertStringNotContainsString('success', $result);
        $this->assertStringNotContainsString('main', $result);
        $this->assertStringNotContainsString('groups', $result);
        $this->assertStringNotContainsString('personal', $result);
        $this->assertStringNotContainsString('job', $result);
        $this->assertStringNotContainsString('ID', $result);

        $this->assertStringContainsString('error', $result);
    }
}
