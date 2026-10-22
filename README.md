👨🏾‍🍳 Chef's Menu Manager

A mobile application designed to help restaurant owners and chefs manage their restaurant menus efficiently. Chef's Menu Manager provides a simple interface for organising dishes, viewing menu items, searching for meals, filtering by course, and reviewing menu statistics.

📌 Table of Contents

- "About the Project" (#-about-the-project)
- "Project Objectives" (#-project-objectives)
- "Features" (#-features)
- "Technology Stack" (#-technology-stack)
- "Application Structure" (#-application-structure)
- "Getting Started" (#-getting-started)
- "How to Use the Application" (#-how-to-use-the-application)
- "Data Model" (#-data-model)
- "Testing" (#-testing)
- "Future Improvements" (#-future-improvements)
- "Development and Refactoring" (#-development-and-refactoring)
- "Author" (#-author)
- "License" (#-license)

📖 About the Project

Chef's Menu Manager is a React Native mobile application developed using TypeScript and Expo. The application is intended to simplify the process of managing a restaurant's menu by allowing users to organise dishes and access important menu information in one place.

The project focuses on creating a user-friendly mobile experience while demonstrating fundamental mobile application development concepts, including reusable code, data modelling, state management, form validation, and interactive user interfaces.

The application is being developed and enhanced as part of a mobile application development project.

🎯 Project Objectives

The main objectives of Chef's Menu Manager are to:

1. Provide a straightforward way to view and organise restaurant dishes.
2. Allow menu items to be added, edited, updated, and deleted.
3. Enable users to search for dishes by name.
4. Allow menu items to be filtered according to their course.
5. Display useful statistics about the restaurant menu.
6. Improve the application's usability through clear layouts and feedback.
7. Apply good coding practices through refactoring and organised TypeScript code.

✨ Features

The following features describe the application's planned functionality. Refer to the current implementation when determining which features are complete.

1. Menu Management

The application is designed to support the management of individual menu items.

- Add new dishes.
- Edit existing dish information.
- Update dish details, including the name, description, course, and price.
- Delete dishes that are no longer required.
- Validate menu information before saving changes.
- Display appropriate feedback when actions are completed.

2. Search and Filtering

Users will be able to find dishes more easily through:

- Searching for menu items by name.
- Filtering dishes by course.
- Viewing the relevant results based on the selected search or filter criteria.
- Returning to the full menu when the search or filter is cleared.

Available course categories:

- Starter
- Main Course
- Dessert

3. Menu Statistics

The statistics section is intended to provide an overview of the restaurant's menu, including:

- Total number of dishes.
- Number of starters.
- Number of main courses.
- Number of desserts.
- Average menu price.

These statistics should update when menu items are added, edited, or deleted.

4. User Interface and Experience

The application uses a restaurant-inspired visual design, with a dark green and neutral colour palette.

The interface aims to provide:

- Clear headings and readable text.
- Organised menu cards.
- Visible dish prices and course categories.
- Consistent spacing and styling.
- Simple navigation and intuitive interactions.
- Helpful validation and confirmation messages.

5. Code Quality

The project uses TypeScript to define the structure of menu items and improve consistency when working with menu data.

The codebase is intended to be improved through:

- Reusable components.
- Clear naming conventions.
- Separation of data types, application logic, and presentation.
- Removal of unnecessary or duplicated code.
- Consistent formatting and maintainable code.

🛠️ Technology Stack

Technology| Purpose
React Native| Building the mobile user interface
Expo| Developing and running the React Native application
TypeScript| Providing type definitions and improving code reliability
JavaScript| Supporting application logic through the TypeScript ecosystem
Visual Studio Code| Writing and managing the source code
Git and GitHub| Version control and project hosting

📂 Application Structure

The project uses Expo Router conventions. The structure may change as additional screens and components are implemented.

ChefsMenuManagerRebuild/
│
├── app/
│   ├── _layout.tsx
│   └── index.tsx
│
├── menuData.ts
├── types.ts
├── assets/
├── package.json
├── tsconfig.json
├── app.json
└── README.md

Main Files

- "app/index.tsx" — Contains the main screen and the user interface for displaying menu items.
- "app/_layout.tsx" — Defines the Expo Router layout and screen navigation configuration.
- "types.ts" — Defines the TypeScript types used to represent menu items and course categories.
- "menuData.ts" — Contains the initial sample menu data used during development.
- "assets/" — Stores application resources such as images and icons.
- "package.json" — Lists project dependencies and available development scripts.
- "README.md" — Documents the project, setup instructions, features, and development progress.

Note: The structure above is a guide. Keep the README consistent with the files that actually exist in your repository.

🚀 Getting Started

Prerequisites

Before running the application, ensure that you have:

- Node.js installed.
- npm installed.
- Visual Studio Code or another suitable code editor.
- Expo Go on a compatible mobile device, or an Android emulator.
- Git installed if you intend to manage the project through Git commands.

Installation

Step 1: Clone the repository

Replace the placeholder URL with the actual URL of this GitHub repository.

git clone YOUR_GITHUB_REPOSITORY_URL

Step 2: Navigate to the project folder

cd ChefsMenuManagerRebuild

Use the actual folder name created by cloning if it differs.

Step 3: Install dependencies

npm install

Step 4: Start the development server

npx expo start

Step 5: Open the application

Choose an available option in the Expo terminal:

- Scan the QR code with Expo Go, where supported by your setup.
- Press "a" to open the app in a configured Android emulator.

Keep the development server running while testing the application.

📱 How to Use the Application

The following workflow describes the intended use of the application as its features are completed.

1. Open Chef's Menu Manager.
2. View the dishes displayed on the main menu screen.
3. Add a new dish by entering its name, description, course, and price.
4. Edit a dish when its information needs to change.
5. Delete a dish when it is no longer required.
6. Use the search field to find a particular dish.
7. Filter the menu by Starter, Main Course, or Dessert.
8. Open the statistics section to review menu totals and average prices.

The availability of each step depends on the features implemented in the current version.

🗃️ Data Model

Each menu item is represented by a TypeScript type containing the following properties:

Property| Type| Description
"id"| "string"| Unique identifier for the menu item
"name"| "string"| Name of the dish
"description"| "string"| Description of the dish
"course"| "Course"| Category of the dish
"price"| "number"| Price of the dish

The course type is restricted to three categories:

export type Course =
  | 'Starter'
  | 'Main Course'
  | 'Dessert';

Example menu item:

const exampleDish: MenuItem = {
  id: '1',
  name: 'Grilled Chicken',
  description: 'Grilled chicken served with vegetables.',
  course: 'Main Course',
  price: 120,
};

The example uses a price of 120, representing R120.00 when displayed in South African rand.

🧪 Testing

The application should be tested throughout development to verify that the implemented features work as expected.

Recommended manual tests include:

Test| Expected result
Open the app| The main screen displays correctly
View the menu| Available dishes and their details are displayed
Add a valid dish| The new dish appears in the menu
Submit incomplete information| Appropriate validation feedback is shown
Edit a dish| Updated information is displayed
Delete a dish| The selected dish is removed
Search by name| Matching dishes are displayed
Filter by course| Only dishes from the selected course are displayed
Update menu items| Statistics reflect the current menu
Test on a mobile screen| Content remains readable and usable

Record the actual results of these tests during development. Do not mark a test as passed until it has been performed.

🔮 Future Improvements

Possible future improvements include:

- Persistent local storage so menu changes remain available after restarting the app.
- More advanced search and sorting options.
- Additional menu categories.
- Improved accessibility and screen-reader support.
- Automated unit and component tests.
- Better error handling.
- Menu item images.
- Exporting menu information for restaurant use.

These are possible enhancements and are not claims about features already implemented.

🔧 Development and Refactoring

Development focuses on improving the existing application while keeping its original purpose as a restaurant menu management tool.

Refactoring aims to make the code easier to read, understand, test, and maintain without unnecessarily changing the application's intended behaviour.

As development progresses, this section should document the changes actually completed, for example:

- Introduced TypeScript types for menu items and course categories.
- Organised initial menu data into a separate file.
- Improved the presentation of menu items.
- Implemented menu management functionality.
- Added search and course filtering.
- Implemented menu statistics.
- Improved validation and user feedback.

Only retain statements that accurately describe the changes made in the repository. Update this section as each feature is completed.

👩🏾‍💻 Author

Promedi Ilunga

Student developer interested in mobile application development, web development, and software engineering.

Project: Chef's Menu Manager

GitHub: Promza-20

📄 License

This project was developed for educational purposes. No specific open-source license has been selected yet. If you choose to distribute the project publicly, add an appropriate "LICENSE" file and update this section.
