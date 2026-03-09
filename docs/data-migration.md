# Data Migration — WordPress → Supabase

> Source: Brainers WordPress site at `brainers.brainai.co.il` (BuddyBoss + LearnDash + WooCommerce + GamiPress)
> Full audit: `courses-platform/docs/wordpress-migration.md`

---

## Source Database

| Field | Value |
|---|---|
| Engine | MariaDB (MySQL-compatible) |
| Host | `s184.proginter.com:3306` |
| Database | `vaiwkuepwmbj_wp` |
| Table prefix | `4fQSfc_` |
| Access | SELECT only (read-only) |

---

## Data Inventory

| Entity | Count | Source Table(s) |
|---|---|---|
| Users | 7,143 | `users` |
| Google-linked accounts | 2,837 | `social_users` |
| Active subscriptions | 4,588 | `wc_orders` (type=shop_subscription) |
| CardCom billing tokens | 7,099 | `woocommerce_payment_tokens` |
| Courses (real tool courses) | 6 | `posts` (post_type=sfwd-courses) |
| Lessons | ~246 | `posts` (post_type=sfwd-lessons) |
| Recordings (club meetings) | 108 | sfwd-lessons under course ID 1125 |
| AI Agents / Custom GPTs | 20 | sfwd-lessons under course ID 1945 |
| Course progress records | 138,261 | `learndash_user_activity` |
| BuddyBoss groups | 6 | `bp_groups` |
| Group members | ~3,534 | `bp_groups_members` |
| Activity feed posts | 1,313 | `bp_activity` (type=activity_update) |
| Reactions / likes | 9,511 | `bb_user_reactions` |
| GamiPress levels | 15 | `posts` (post_type=leves) |
| Users with XP points | 5,467 | `gamipress_user_earnings` |
| XP earning records | 69,013 | `gamipress_user_earnings` |
| Referral affiliate IDs | 6,258 | `usermeta` (_gamipress_referrals_affiliate_id) |
| Direct messages | 616 | `bp_messages_messages` |
| Notifications | 138,755 | `bp_notifications` |

---

## Entity Mapping (WordPress → Supabase)

| Supabase Table | WordPress Source |
|---|---|
| `auth.users` + `profiles` | `users` + `usermeta` (first_name, last_name, phone) |
| Google OAuth link | `social_users` (2,837 Nextend accounts) + `bb_social_sign_on_users` (53) |
| `subscriptions` | `wc_orders WHERE type='shop_subscription'` |
| `cardcom_tokens` | `woocommerce_payment_tokens` + `wc_orders_meta` (CardcomToken, CardcomTokenId, LowProfileId) |
| `courses` | `posts WHERE post_type='sfwd-courses'` (exclude courses 1125 + 1945) |
| `lessons` | `posts WHERE post_type='sfwd-lessons'` + course_id mapping |
| `lesson_progress` | `learndash_user_activity` (completed + accessed types) |
| `recordings` | sfwd-lessons WHERE course_id = 1125 |
| `ai_agents` | sfwd-lessons WHERE course_id = 1945 |
| `groups` | `bp_groups` |
| `group_members` | `bp_groups_members` + `bp_groups_membermeta` (join dates) |
| `posts` (feed) | `bp_activity WHERE type='activity_update'` |
| `post_reactions` | `bb_user_reactions` |
| `levels` | `posts WHERE post_type='leves'` (15 levels, 0–15,000 pts scale) |
| `xp_events` | `gamipress_user_earnings` (point awards + level-ups) |
| `referrals` | `usermeta._gamipress_referrals_affiliate_id` + `gamipress_user_earnings` (commissions) |
| `notifications` | `bp_notifications` (recent/unread only) |
| `messages` + `message_threads` | `bp_messages_messages` + `bp_messages_recipients` |

---

## Migration Priority Order

Run in this order — each step depends on the previous:

1. **Users + Profiles + Social Login** — foundation (7,143 users → Supabase Auth, 2,837 Google links)
2. **Subscriptions + CardCom Tokens** — determines access control and billing (4,588 active subs)
3. **Levels + XP** — GamiPress config (15 levels) + user points (5,467 users)
4. **Courses + Lessons + Progress** — LearnDash content (246 lessons, 138K progress records)
5. **Groups + Members** — 6 groups with member mappings and join dates
6. **Recordings** — 108 club meeting recordings (course 1125)
7. **AI Agents** — 20 custom GPTs (course 1945)
8. **Activity Feed + Reactions** — 1,313 posts, 9,511 reactions
9. **Referrals** — 6,258 affiliate IDs, 2,022 commission records
10. **Messages** — 616 messages with threading
11. **Notifications** — migrate recent/unread only; skip historical

---

## What NOT to Migrate

Skip these WordPress tables entirely:

- `woocommerce_order_items` / `itemmeta` (250K+ rows — transaction line items, not needed)
- `uap_*` tables — Uncanny Automator workflow logs (4.8M rows)
- `gamipress_logs` / `_meta` — detailed GamiPress logs (883K rows — we have `user_earnings`)
- `actionscheduler_*` — background job logs
- `fsmpt_email_logs` — Fluent SMTP email logs
- `bp_notifications` historical (keep recent/unread only)
- `comments WHERE type='order_note'` — 128K WooCommerce internal notes
- All LiteSpeed, WP Import/Export, WP Affiliates tables (operational/unused)

---

## Real vs Mock Data Differences

When replacing mock data, note these differences:

| Feature | Mock (src/data/) | Real (WordPress) |
|---|---|---|
| Groups | 6 AI-themed (made up) | 6 groups with different names |
| Courses | 6 generic | 6 real tool courses |
| Recordings | 34 fake | 108 real club meetings |
| AI Agents | 6 generic | 20 custom GPTs |
| Levels | 13 levels (0–8,000 pts) | **15 levels (0–15,000 pts)** |
| Users | None | 7,143 real users |

---

## Security Notes

- **CardCom LowProfileId** (`Profile` field in `wc_orders_meta`) — this is a sensitive token. Store encrypted or in a restricted table with strict RLS.
- Billing tokens should only be readable via **service role** — never expose to client via RLS.
- Google identifier strings from `social_users` should not be returned to the frontend.
