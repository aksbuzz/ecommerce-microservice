Feature: Catalog Service
  As an API consumer
  I want to manage catalog items, brands, and types
  So that I can maintain the product catalog

  Background:
    Given the catalog service is running

  Scenario: List all catalog items
    When I request GET "/api/v1/catalog/items"
    Then the response status should be 200
    And the response should contain "items" array
    And the response should contain "totalItems"

  Scenario: Get a catalog item by ID
    When I request GET "/api/v1/catalog/items/1"
    Then the response status should be 200
    And the response should contain "name"
    And the response should contain "price"

  Scenario: Create a new catalog item
    When I request POST "/api/v1/catalog/items" with body:
      """
      {
        "name": "Test Mug",
        "description": "A test mug for E2E",
        "price": 9.99,
        "catalogTypeId": 1,
        "catalogBrandId": 1,
        "availableStock": 25
      }
      """
    Then the response status should be 201
    And the response should contain "id"
    And the response "name" should equal "Test Mug"

  Scenario: Update a catalog item price
    Given a catalog item exists with name "Update Test Item"
    When I request PATCH "/api/v1/catalog/items/{lastItemId}" with body:
      """
      { "price": 19.99 }
      """
    Then the response status should be 200
    And the response "price" should equal 19.99

  Scenario: Delete a catalog item
    Given a catalog item exists with name "Delete Test Item"
    When I request DELETE "/api/v1/catalog/items/{lastItemId}"
    Then the response status should be 204

  Scenario: List catalog brands
    When I request GET "/api/v1/catalog/brands"
    Then the response status should be 200
    And the response should be a non-empty array

  Scenario: List catalog types
    When I request GET "/api/v1/catalog/types"
    Then the response status should be 200
    And the response should be a non-empty array

  Scenario: Filter items by brand
    When I request GET "/api/v1/catalog/items?brandId=2"
    Then the response status should be 200
    And the response should contain "items" array

  Scenario: Search items by name
    When I request GET "/api/v1/catalog/items?search=.NET"
    Then the response status should be 200
    And the response should contain "items" array

  Scenario: Get non-existent item returns 404
    When I request GET "/api/v1/catalog/items/99999"
    Then the response status should be 404
    And the response should contain "error"
