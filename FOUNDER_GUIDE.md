# MANASARA — Founders' Operations Guide

> This guide is written for you — the people who make the gifts and run the business.  
> No technical background needed. If something feels confusing, reach out to your developer.

---

## 🌸 Daily Operations Checklist

Start each morning with this quick routine:

- [ ] Open **`/admin/payments`** — check for new UTR submissions (customers who've paid and submitted their reference number)
- [ ] For each pending payment: verify in your UPI app → confirm in the admin panel
- [ ] Open **`/admin/dashboard`** — check the production queue (orders that are confirmed and need to be made)
- [ ] Update order statuses as work progresses throughout the day
- [ ] At end of day: update any orders that went out for delivery or were delivered

---

## 📦 How to Handle a New Order — End to End

Here's exactly what happens when a customer places an order, and what you need to do:

**What the customer does:**
1. Customer browses your store → adds item to cart → fills in their details → places order
2. They see a confirmation page with your UPI payment details (your UPI ID and QR code)
3. They pay via GPay / PhonePe / any UPI app
4. They come back to the confirmation page and type in their UTR (the payment reference number)
5. Done — they wait for you to verify and start making their gift!

**What you do:**
1. 🔔 Check `/admin/payments` — you'll see orders with the status **"Payment Review"**
2. Click on the order to see the UTR the customer submitted
3. Open your UPI app (GPay, PhonePe, etc.) and find that transaction
4. Confirm the amount and that it matches the order total
5. Click **"Mark Payment Verified"** in the admin panel → enter the amount you actually received
6. The order moves to **CONFIRMED** → it appears in your production queue
7. Start making the gift! Update the status as you go

---

## 💸 How to Verify UPI Payments — Step by Step

This is the most important part of running the business. Take your time with each one.

1. Go to **`/admin/payments`**
2. You'll see a list of orders awaiting payment review — click on one
3. Note the **UTR number** the customer submitted (looks like a 12-digit code like `427891234567`)
4. Open your **UPI app** (GPay, PhonePe, Paytm, etc.)
5. Go to your **transaction history**
6. Search for or scroll to find the transaction with that UTR number
7. Check all three things:
   - ✅ The **amount matches** the order total exactly
   - ✅ The transaction status is **"Completed"** (not Pending or Failed)
   - ✅ The payment was received **within a reasonable timeframe** of the order
8. If everything checks out → click **"Verify Payment"** in the admin and enter the amount received
9. If something doesn't match → **do not verify** → contact the customer to clarify

---

## ⚠️ IMPORTANT — Never Trust a Screenshot

Customers sometimes WhatsApp you a screenshot of a "successful payment" and ask you to verify their order.

**Do not verify an order based on a screenshot alone.**

Screenshots can be edited. The only proof that matters is seeing the transaction in your own UPI app. Always check there first, every single time — no exceptions.

If a customer is genuine, their payment will appear in your UPI app. If it doesn't, the payment didn't go through.

---

## 🔄 How to Update Order Status

Once an order is verified, move it through these stages as you work on it:

| Status | What it means | When to set it |
|---|---|---|
| **CONFIRMED** | Payment received, work not started yet | Automatically set when you verify payment |
| **IN_PRODUCTION** | You've started making the gift | When you begin crafting |
| **READY** | Gift is packed and ready to dispatch | When packaging is complete |
| **OUT_FOR_DELIVERY** | With courier or on the way | When you hand it to delivery / leave to deliver |
| **DELIVERED** | Customer has received it | When confirmed delivered |
| **CANCELLED** | Order cancelled | Use only when both parties agree |

**To update a status:**
1. Go to **`/admin/dashboard`** or **`/admin/orders`**
2. Click on the order
3. Click the **"Update Status"** button → select the new status
4. The customer can see this update if they track their order at `/track-order`

---

## 🛍️ How to Add a New Product

1. Go to **`/admin/products`** → click **"New Product"**
2. Fill in:
   - **Name** — what customers see (e.g. "Petal Dream Bouquet")
   - **Description** — describe it warmly and clearly
   - **Price** — in rupees (the system handles the rest)
   - **Category** — e.g. Bouquets, Hampers, Keychains, etc.
3. Leave the status as **DRAFT** — this means customers can't see it yet
4. Add any **product options** (e.g. colour choices, personalised note card, ribbon colour)
5. **Upload photos** once you have them (contact your developer if you need help with this the first time)
6. Preview the product by visiting `/products/your-product-name` in the browser
7. When you're happy → change status to **ACTIVE** → it appears in the store

> 💡 **Tip:** Always add products as DRAFT first, review them on the actual website, and only go ACTIVE when it looks perfect.

---

## 💰 How to Price Your Products

Go to **`/admin/costing`** to see a breakdown of your material costs.

The page shows you:
- **Material cost per unit** — based on the expenses you've recorded
- **Suggested price** — calculated from your target profit margin
- **A warning** if you're pricing something below your material cost (so you never accidentally sell at a loss!)

Use this as your guide when deciding what to charge. It won't set prices automatically — you always make the final call.

---

## 🧾 How to Record Expenses

Keeping track of what you spend helps you understand your true profit.

1. Go to **`/admin/expenses`** → click **"Add Expense"**
2. Fill in:
   - **Category** — e.g. Raw Materials, Packaging, Delivery, Tools
   - **Amount** — in rupees
   - **Date** — when you bought / paid for it
   - **Description** — what it was for (be specific — your future self will thank you!)

**Examples:**
- Pipe cleaner pack × 5 — ₹120 — Raw Materials
- Brown kraft paper rolls — ₹200 — Packaging
- Delivery charges paid to courier — ₹49 — Delivery
- Scissors (new pair) — ₹85 — Tools

---

## 📍 How to Add PIN Codes for Delivery

You choose which areas you deliver to. To add a new PIN code:

1. Go to **`/admin/settings`** → scroll to **"Serviceable PIN Codes"**
2. Click **"Add PIN Code"**
3. Fill in:
   - PIN code (6 digits)
   - Area name (e.g. "Koramangala")
   - City
   - Shipping rate in rupees (or 0 for free delivery)
   - Estimated delivery days
4. Click **Add**

Customers entering a PIN code not in your list will see a message that you don't deliver there yet.

---

## 📊 Monthly Reporting

At the end of each month (or whenever you want a snapshot):

1. Go to **`/admin/reports`**
2. Set the **date range** (e.g. 1st to 31st of the month)
3. Review:
   - **Verified collections** — total money you actually received (from verified payments only)
   - **Order count** — how many orders came in
   - **Average order value** — useful for spotting trends
   - **Material/expense costs** — total recorded expenses in the period
   - **Estimated profit** — collections minus expenses

> 💡 **Tip:** Use this monthly to decide if prices need adjusting, which products are most popular, and whether to run any promotions.

---

## ✅ Things to Do Before You Go Live

Before you start sharing your store link with customers, make sure you've done these:

1. **Update your UPI ID**  
   Go to `/admin/settings` → UPI Payment → change it to your actual UPI address (e.g. `yourname@upi`)

2. **Upload your UPI QR code**  
   Get a screenshot of your QR from GPay/PhonePe/etc. → ask your developer to upload it → paste the path in settings

3. **Confirm your product prices**  
   Go to `/admin/products` → click each product → review the price → when you're happy, change status from **DRAFT** to **ACTIVE**

4. **Check your PIN codes**  
   Make sure the areas you deliver to are listed in settings

5. **Place a test order yourself**  
   Use a different phone number, place an order, go through the whole payment flow, and verify it in the admin — so you know exactly what your customers experience

---

## 🆘 Something Went Wrong?

**A customer says they paid but their order isn't showing payment review:**
→ Ask them for their order code (they received it on the confirmation page) and their phone number. Search for the order in `/admin/orders`. Check if they submitted the UTR — sometimes they forget this step.

**A product is showing the wrong price:**
→ Go to `/admin/products` → click the product → update the price. Changes take effect immediately for new orders (existing orders won't change).

**You can't log in to the admin:**
→ Contact your developer — they can reset your password from the Supabase dashboard.

**An order needs to be cancelled:**
→ Go to the order in `/admin/orders` → update status to CANCELLED. Then refund the customer manually through your UPI app.

---

*MANASARA is built with love for your handmade gifting business.* 🌸  
*When in doubt, check with your developer — no question is too small.*
