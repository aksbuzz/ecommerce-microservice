Feature: Basket Service
  As an authenticated user
  I want to manage my shopping basket
  So that I can add items and checkout

  Background:
    Given the basket service is running
    And I am authenticated as a basket user

  Scenario: Get empty basket
    When I get my basket
    Then the response status should be 200
    And the basket should have 0 items

  Scenario: Add item to basket
    When I add item to basket with productId 1 and name "Mug" and price 10.00 and quantity 2
    Then the response status should be 200
    And the basket should have 1 items

  Scenario: Add same item increases quantity
    Given I have item with productId 1 and name "Mug" and price 10.00 and quantity 2 in basket
    When I add item to basket with productId 1 and name "Mug" and price 10.00 and quantity 3
    Then the response status should be 200
    And the basket item with productId 1 should have quantity 5

  Scenario: Update item quantity
    Given I have item with productId 1 and name "Mug" and price 10.00 and quantity 2 in basket
    When I update item 1 quantity to 10
    Then the response status should be 200
    And the basket item with productId 1 should have quantity 10

  Scenario: Remove item from basket
    Given I have item with productId 1 and name "Mug" and price 10.00 and quantity 2 in basket
    Given I have item with productId 2 and name "T-Shirt" and price 20.00 and quantity 1 in basket
    When I remove item 1 from basket
    Then the response status should be 200
    And the basket should have 1 items

  Scenario: Checkout basket
    Given I have item with productId 1 and name "Mug" and price 10.00 and quantity 2 in basket
    When I checkout my basket
    Then the response status should be 202

  Scenario: Checkout empty basket fails
    When I checkout my basket
    Then the response status should be 404

  Scenario: Delete basket
    Given I have item with productId 1 and name "Mug" and price 10.00 and quantity 1 in basket
    When I delete my basket
    Then the response status should be 204

  Scenario: Unauthenticated access is rejected
    Given I am not authenticated
    When I get basket without session
    Then the response status should be 401
