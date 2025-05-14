To implement a subscription service using Stripe with React and TypeScript, you need to handle user subscription flows, such as signing up, managing payment information, and canceling. The setup involves both front-end and back-end components. We'll use React for the front end and Node.js for the backend, incorporating Express.js and Stripe API for payment processing.

### Project Setup

1. **Backend Setup (Node.js with Express):**

   First, create a folder for your project and initialize a new Node.js application:

   ```bash
   mkdir subscription-service
   cd subscription-service
   npm init -y
   ```

   Then, install necessary packages:

   ```bash
   npm install express stripe dotenv cors
   npm install --save-dev typescript @types/node @types/express ts-node nodemon
   ```

2. **Project Structure:**

   ```
   subscription-service
   ├── backend
   │   ├── server.ts
   │   ├── .env
   │   ├── package.json
   │   └── tsconfig.json
   ├── frontend
   │   └── src
   │       ├── components
   │       │   ├── Subscribe.tsx
   │       │   └── SubscriptionManagement.tsx
   │       ├── App.tsx
   │       ├── index.tsx
   └── README.md
   ```

3. **Backend (Node.js + Express):**

   **`backend/server.ts`:**

   ```typescript
   import express from 'express';
   import Stripe from 'stripe';
   import dotenv from 'dotenv';
   import cors from 'cors';

   dotenv.config();

   const app = express();
   app.use(cors());
   app.use(express.json());

   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
     apiVersion: '2022-08-01',
   });

   app.post('/create-subscription', async (req, res) => {
     try {
       const { email, paymentMethodId } = req.body;

       const customer = await stripe.customers.create({
         email,
         payment_method: paymentMethodId,
         invoice_settings: {
           default_payment_method: paymentMethodId,
         },
       });

       const subscription = await stripe.subscriptions.create({
         customer: customer.id,
         items: [{ price: process.env.STRIPE_SUBSCRIPTION_PRICE }],
         expand: ['latest_invoice.payment_intent'],
       });

       res.send({
         subscriptionId: subscription.id,
         clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
       });
     } catch (error) {
       res.status(400).send({ error: { message: error.message } });
     }
   });

   app.post('/cancel-subscription', async (req, res) => {
     try {
       const { subscriptionId } = req.body;

       const deletedSubscription = await stripe.subscriptions.del(subscriptionId);

       res.send({ subscription: deletedSubscription });
     } catch (error) {
       res.status(400).send({ error: { message: error.message } });
     }
   });

   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
   ```

   **`backend/.env`:**

   ```
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_SUBSCRIPTION_PRICE=price_id_here
   ```

   **`backend/tsconfig.json`:**

   ```json
   {
     "compilerOptions": {
       "target": "ES6",
       "module": "commonjs",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
     }
   }
   ```

4. **Frontend (React + TypeScript):**

   Set up a new React application in the `frontend` folder:

   ```bash
   npx create-react-app frontend --template typescript
   ```

   Install Stripe's package for the client side:

   ```bash
   cd frontend
   npm install @stripe/react-stripe-js @stripe/stripe-js
   ```

   **`frontend/src/components/Subscribe.tsx`:**

   ```typescript
   import React from 'react';
   import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

   const Subscribe = () => {
     const stripe = useStripe();
     const elements = useElements();

     const handleSubscription = async () => {
       if (!stripe || !elements) {
         return;
       }

       const cardElement = elements.getElement(CardElement);

       const { error, paymentMethod } = await stripe.createPaymentMethod({
         type: 'card',
         card: cardElement!,
       });

       if (error) {
         console.error(error);
         return;
       }

       const response = await fetch('http://localhost:5000/create-subscription', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           email: 'customer@example.com', // you can use your auth module to get the logged-in user's email
           paymentMethodId: paymentMethod!.id,
         }),
       });

       const subscriptionResult = await response.json();

       if (response.ok) {
         console.log('Subscription successful:', subscriptionResult);
       } else {
         console.error('Subscription error:', subscriptionResult);
       }
     };

     return (
       <div>
         <CardElement />
         <button onClick={handleSubscription} disabled={!stripe}>
           Subscribe
         </button>
       </div>
     );
   };

   export default Subscribe;
   ```

   **`frontend/src/components/SubscriptionManagement.tsx`:**

   ```typescript
   import React, { useState } from 'react';

   const SubscriptionManagement = () => {
     const [subscriptionId, setSubscriptionId] = useState('');

     const handleCancelSubscription = async () => {
       const response = await fetch('http://localhost:5000/cancel-subscription', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ subscriptionId }),
       });

       const result = await response.json();

       if (response.ok) {
         console.log('Subscription canceled:', result);
       } else {
         console.error('Error canceling subscription:', result);
       }
     };

     return (
       <div>
         <input
           type="text"
           placeholder="Enter subscription ID"
           value={subscriptionId}
           onChange={(e) => setSubscriptionId(e.target.value)}
         />
         <button onClick={handleCancelSubscription}>Cancel Subscription</button>
       </div>
     );
   };

   export default SubscriptionManagement;
   ```

   **`frontend/src/App.tsx`:**

   ```typescript
   import React from 'react';
   import { Elements } from '@stripe/react-stripe-js';
   import { loadStripe } from '@stripe/stripe-js';
   import Subscribe from './components/Subscribe';
   import SubscriptionManagement from './components/SubscriptionManagement';

   const stripePromise = loadStripe('your_publishable_key_here');

   function App() {
     return (
       <Elements stripe={stripePromise}>
         <div>
           <h1>Subscription Service</h1>
           <Subscribe />
           <SubscriptionManagement />
         </div>
       </Elements>
     );
   }

   export default App;
   ```

5. **Run the Project:**

   - Start the backend server:

     ```bash
     cd backend
     npx ts-node-dev server.ts
     ```

   - Start the React front-end:
   
     ```bash
     cd frontend
     npm start
     ```

### Important Notes:

- **Security:** Ensure to securely store and manage your Stripe secret key. Do not expose it to the frontend.
- **Recurring Payments:** The backend sets up a subscription with a fixed price. The price ID should match a price defined in your Stripe dashboard.
- **Email Management:** Replace the static email used in the server with an actual email from your user authentication logic.
- **Environment Configurations:** Replace placeholders like `your_stripe_secret_key` and `your_publishable_key_here` with actual keys from your Stripe account.

This code provides a simple yet production-ready implementation for managing subscriptions using Stripe with a focus on clear structure and maintainability.