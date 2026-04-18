# Smart Meal Finder

Smart Meal Finder is a beginner-friendly, data-driven MVP built with HTML, CSS, JavaScript, and a small Node server.

The project helps users explore healthier and more realistic food choices based on personal goals, weekly budget, food benefits, and nearby support options. Instead of acting like a simple meal planner, the app is positioned as a food-access and meal-guidance tool that connects personal needs with real external data.

## Project Purpose

Many people want to eat better, but food decisions are shaped by more than motivation. Budget, benefits, and local access all affect what is realistic.

Smart Meal Finder was created to explore that problem through a simple product experience that:

- collects baseline user information
- asks whether the user wants a Budget path or a Benefit path
- returns meal guidance, grocery ideas, recipe inspiration, and nearby support options

This direction reflects feedback received during the week, especially the adjustment to position the project less like a generic meal planner and more like a practical food-access support tool.

## MVP Flow

The app follows a simple 3-step flow:

1. **Home**
   - Introduces the product and its purpose

2. **Baseline User Information**
   - Collects:
     - age
     - height
     - weight
     - activity level
     - healthy goal
     - dietary concern or health condition

3. **Food Finder Preferences**
   - Collects ZIP code
   - Lets the user choose between:
     - **Budget path**
     - **Benefit path**

4. **Results**
   - Displays:
     - grocery suggestions
     - meal strategy
     - budget or benefit summary
     - recipe ideas
     - nearby stores and support options

## Data-Driven Strategy

This project is data-driven because it combines user input with external data sources and structured application logic.

### Live APIs used in the MVP

#### 1. Edamam API
Used for:
- recipe ideas
- recipe images
- recipe links
- simple ingredient-based recipe context

This API supports the recipe section of the results page.

#### 2. NYC Open Data API
Used for:
- nearby food-access support
- benefits-related locations
- assistance-oriented location results connected to the user’s ZIP code or borough

This API supports the “Nearby Stores and Support” section of the results page.

## Mock Data and Fallback Logic

To make the MVP stable and presentation-ready within the time available, some parts of the experience use structured mock data or fallback logic.

These include:
- grocery suggestions
- meal strategy
- budget or benefit summary
- fallback recipe cards if the recipe API fails
- fallback support locations if public data is unavailable or incomplete

This was an intentional product decision. The goal of the MVP is to clearly demonstrate the user flow, external data usage, and product thinking without depending on every API response working perfectly.

## Tech Stack

- HTML
- CSS
- JavaScript
- Node.js

## Project Structure

```text
Smart Meal Finder/
├── index.html
├── baseline.html
├── preferences.html
├── results.html
├── styles.css
├── server.js
├── package.json
└── js/
    ├── landing.js
    ├── storage.js
    ├── baseline.js
    ├── preferences.js
    └── results.js