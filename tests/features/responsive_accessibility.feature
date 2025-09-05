Feature: Responsive Design and Accessibility
  As a user accessing the site from various devices and with different abilities
  I want the application to be accessible and responsive
  So that I can use it effectively regardless of my device or accessibility needs

  Background:
    Given I navigate to the MyHealthPrices website

  Scenario: Mobile device layout
    Given I set the viewport to mobile size
    When I am on the medication search page
    Then the layout should be optimized for mobile
    And all location buttons should be accessible and clickable
    And the search box should be properly sized

  Scenario: Tablet device layout
    Given I set the viewport to tablet size
    When I am on the medication search page
    Then the layout should be optimized for tablet
    And location buttons should be arranged appropriately
    And pricing information should be readable

  Scenario: Desktop layout
    Given I set the viewport to desktop size
    When I am on the medication search page
    Then the layout should utilize the full screen effectively
    And all elements should be properly spaced

  Scenario: Keyboard navigation
    Given I am on the medication search page
    When I use tab navigation to move through the page
    Then I should be able to reach all interactive elements
    And the focus indicators should be clearly visible
    And I should be able to select locations using keyboard

  Scenario: Screen reader compatibility
    Given I am on the medication search page
    When I analyze the page for accessibility
    Then all buttons should have appropriate labels
    And form elements should have proper labels
    And pricing information should be structured clearly
