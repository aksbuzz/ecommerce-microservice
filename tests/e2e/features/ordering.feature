Feature: Ordering Service
  As an authenticated user
  I want to manage my orders
  So that I can create, view, and cancel orders

  Background:
    Given the ordering service is running
    And I am authenticated as an ordering user

  Scenario: Create an order
    When I create an order with item productId 1 and name "Mug" and price 10.00 and units 2
    Then the response status should be 201
    And the response should contain "id"
    And the response "status" should equal "submitted"

  Scenario: List my orders
    Given I have an order with item productId 1 and name "Mug" and price 10.00 and units 1
    When I list my orders
    Then the response status should be 200
    And the response should contain "items" array
    And the response should contain "totalItems"

  Scenario: Get order by ID
    Given I have an order with item productId 1 and name "Mug" and price 10.00 and units 1
    When I get order by last order ID
    Then the response status should be 200
    And the response "status" should equal "submitted"

  Scenario: Get non-existent order returns 404
    When I get order by ID 999999
    Then the response status should be 404

  Scenario: Cancel a submitted order
    Given I have an order with item productId 1 and name "Mug" and price 10.00 and units 1
    When I cancel the last order
    Then the response status should be 200
    And the response "status" should equal "cancelled"

  Scenario: Unauthenticated access to orders returns 401
    Given I am not authenticated as ordering user
    When I list orders without session
    Then the response status should be 401
