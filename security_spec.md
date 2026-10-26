# Security Specification: Super Storez BD

## Data Invariants
1. Products & Categories are readable by all visitors to browse the storefront, but only authorized admins can create, update, or delete products and categories.
2. Orders can be submitted by guests and authenticated users. The total amount must be non-negative.
3. Order tracking allows customers to query specific orders by exact ID or phone verification without exposing other users' confidential orders.
4. Admins have access to update order status, payment status, and provide digital voucher delivery codes.
5. Site settings (bKash/Nagad/Rocket merchant numbers, store copy) are publicly viewable for payment execution and editable only by administrators.
6. Admin access is authenticated via database admin records and verified developer email `abdulahad.onr2@gmail.com`.
