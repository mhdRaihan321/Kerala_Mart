Kerala Mart E-Commerce Website - Your one-stop shop for all things Kerala!
Overview
Kerala Mart is an advanced e-commerce website that offers a user-friendly platform for online shopping. The website is designed to handle various functionalities such as user registration, product browsing, order placement, and more. It is built using modern web technologies and follows best practices for a scalable and maintainable application.

Features
User Registration and Authentication: Secure user registration and login system.
Product Browsing: Users can browse through various categories of products.
Cart Management: Add, update, or remove items from the shopping cart.
Order Placement: Place orders and track order status.
Admin Panel: Manage products, orders, and users.
OTP Verification: Email-based OTP verification for enhanced security.
Technologies Used
Frontend: HTML, CSS, JavaScript, Bootstrap, Handlebars.js
Backend: Node.js, Express.js
Database: MongoDB
Authentication: Passport.js, JWT
Email Service: Nodemailer
Setup Instructions
Prerequisites
Node.js (version 14 or above)
MongoDB (local or cloud-based)
Installation
Clone the repository:

bash
Copy code
git clone https://github.com/yourusername/kerala-mart.git
cd kerala-mart
Install dependencies:

bash
Copy code
npm install
Set up environment variables:

Create a .env file in the root directory and add the following:

env
Copy code
PORT=3000
MONGODB_URI=your_mongodb_uri
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
JWT_SECRET=your_jwt_secret
Run the application:

bash
Copy code
npm start
The application will be running at http://localhost:3000.

Folder Structure
bash
Copy code
kerala-mart/
├── public/                 # Static files (CSS, JS, images)
├── routes/                 # Route handlers
│   ├── index.js            # Main routes
│   ├── auth.js             # Authentication routes
│   ├── products.js         # Product routes
│   ├── orders.js           # Order routes
├── views/                  # Handlebars views
│   ├── layouts/            # Layouts (main.hbs)
│   ├── partials/           # Partials (header.hbs, footer.hbs)
│   ├── index.hbs           # Homepage view
│   ├── cart.hbs            # Cart view
│   ├── login.hbs           # Login view
│   ├── register.hbs        # Registration view
│   ├── product-details.hbs # Product details view
├── .env                    # Environment variables
├── app.js                  # Express application
├── package.json            # Project dependencies
└── README.md               # Project documentation
Key Functionalities
User Registration and Login
Registration: Users can sign up by providing their email and password.
Login: Registered users can log in using their email and password.
Email Verification: Users receive an OTP for email verification.
Product Browsing
Categories: Products are categorized for easy browsing.
Search: Users can search for products by name.
Cart Management
Add to Cart: Users can add products to their cart.
Update Cart: Users can update the quantity of products in their cart.
Remove from Cart: Users can remove products from their cart.
Order Placement
Checkout: Users can proceed to checkout and place an order.
Order Tracking: Users can track the status of their orders.
Admin Panel
Product Management: Admins can add, update, or delete products.
Order Management: Admins can view and manage orders.
User Management: Admins can manage user accounts.
Deployment
Using Render
Create a Render Account: Sign up for a Render account at Render.

Create a New Web Service:

Connect your GitHub repository.
Choose the kerala-mart repository.
Set the build command to npm install.
Set the start command to npm start.
Set Environment Variables:

In the Render dashboard, go to the settings of your web service.
Add the environment variables from your .env file.
Deploy:

Deploy the web service. Render will automatically build and deploy your application.
Contributing
Fork the repository.
Create a new branch (git checkout -b feature/your-feature).
Commit your changes (git commit -m 'Add some feature').
Push to the branch (git push origin feature/your-feature).
Open a pull request.
License
This project is licensed under the MIT License.

Kerala Mart - Your one-stop shop for all things Kerala!




# Kerala_Mart
‣敋慲慬䵟牡ੴ