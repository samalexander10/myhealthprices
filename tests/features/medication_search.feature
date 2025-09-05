Feature: Medication Search Functionality
  As a user seeking medication pricing information
  I want to search for medications by typing in the search box
  So that I can find pricing information for my medications

  Background:
    Given I navigate to the MyHealthPrices website

  Scenario: Search for valid medication shows results
    Given I am on the medication search page
    When I type "ACETAMINOPHEN 325 MG TABLET" in the medication search box
    And I click the Search button
    And I wait for search results to appear
    Then I should see medication pricing information
    And the pricing should include location-specific data

  Scenario: Search for invalid medication
    Given I am on the medication search page
    When I type "invalidmedicationxyz123" in the medication search box
    And I select the "California" location
    And I wait for search results
    Then I should see an error message with status code 404
    And the error should suggest trying a specific medication name

  Scenario: Search with special characters
    Given I am on the medication search page
    When I type "!@#$%^&*()" in the medication search box
    And I select the "California" location
    Then the application should handle the input gracefully
    And no pricing information should be displayed

  Scenario: Search with empty input
    Given I am on the medication search page
    When I clear the medication search box
    And I select the "California" location
    Then no pricing information should be displayed

  Scenario: Search with partial medication name
    Given I am on the medication search page
    When I type "ACETAMINOPHEN" in the medication search box
    And I click the Search button
    And I wait for search results
    Then I should see relevant medication suggestions or results
