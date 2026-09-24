# User guide: Ridgeline Promotions

This guide covers three things:

1. How to install and start the system on a fresh computer.
2. How to use it, step by step, with real examples.
3. How to explain it to the interview panel.

No coding knowledge is needed for parts 2 and 3.

---

## Part 1: Install on a fresh computer

### What you need first

| Tool           | Why                                       | How to check                          |
| -------------- | ----------------------------------------- | ------------------------------------- |
| **Git**        | To download the code                      | `git --version`                       |
| **Node.js 24** | Runs the system                           | `node --version` should show `v24...` |
| **pnpm 11**    | Installs the parts                        | `pnpm --version` should show `11...`  |
| **make**       | Short commands (built into Mac and Linux) | `make --version`                      |

If you don't have pnpm, run `corepack enable` once (it comes with Node.js).

### Install (about 2 minutes)

```bash
git clone <repository-url>
cd ridgeline-promotions
make setup
```

`make setup` does everything for you:

- creates the settings files (`.env`)
- downloads what's needed
- builds the shared parts
- creates the small local database
- fills it with the starting deals

### Start it

```bash
make dev
```

Wait until you see `Server is running on: http://localhost:3004`, then open:

| Address                    | What it is                              |
| -------------------------- | --------------------------------------- |
| **http://localhost:3003**  | The app (open this one)                 |
| http://localhost:3004/docs | The API reference, for technical people |

To stop it, press `Ctrl + C` in the terminal.

### Check that everything works (optional)

```bash
make check
```

This builds everything and runs all 66 automatic tests. It should end with no errors.

### If something goes wrong

| You see                                                | Do this                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| "Couldn't load this… Is the API running on port 3004?" | The back end isn't running. Run `make dev` and wait for the "Server is running" line. |
| "Port 3003/3004 already in use"                        | Another copy is running. Close it, or find the other terminal and press `Ctrl + C`.   |
| The demo data is messy after testing                   | Run `make dbreset`, then `make dev`. You're back to the starting deals.               |
| `node` or `pnpm` not found                             | Install Node.js 24, then run `corepack enable`.                                       |
| The publish bar is still there, but every deal says **Published** | Something that isn't a deal is unpublished: the **When deals clash** rule. The bar names it. Set it back to _Customer gets their single best deal_, or click **Undo my changes**. |
| **Schnitzel Tuesday — no pot** is missing from Manage deals | Your database was filled before that deal existed (the starting deals are only added once). Run `make dbreset`, then `make dev`. |

---

## Part 2: The system in one minute

**The customer:** Ridgeline Hotels, a group of 9 pubs and bistros. **The contact:** Tania, who manages marketing and operations.

**Her problem:** the pubs run five deals at once:

- Happy Hour: 15% off drinks, 4–6pm on weekdays
- Member Discount: 10% off everything
- Schnitzel Tuesday: $18 schnitzel with a pot (a schnitzel on its own stays $18, as it is today)
- Staff Discount: 30% off everything
- Parma & Pint for Two: $55 on Thursdays

When a customer qualifies for more than one, **nobody knows what the till will charge.** So staff type in prices by hand, the reports become wrong, and every change needs a support ticket and a 3-day wait.

**What we found:** the till is set up differently from what Tania believes. She says customers "only ever get the best single deal", but the till adds the member discount **on top of** other deals. That's why Ray, a regular, pays $16.20 for the $18 schnitzel.

**What the system does:**

1. Shows the price of any order, **and explains why**.
2. Uses one clear rule: **each item gets its single best deal**.
3. Lets Tania **change deals herself**, check who is affected, then publish. No ticket.
4. Shows a **week view** of where deals clash.
5. Lets supervisors enter a **manual price with a reason**, kept separate from promotions so reports stay accurate.

### Three words you'll see everywhere

| Word in the app  | Meaning                                                               |
| ---------------- | --------------------------------------------------------------------- |
| **Today's till** | How the till prices things right now                                  |
| **New rules**    | How it will price once published                                      |
| **Your draft**   | Changes you're working on. Customers don't see them until you publish |

---

## Part 3: Use cases, step by step

Open **http://localhost:3003**. The menu at the top has five pages. Follow them left to right.

Use cases 1–7 are the demo. Use cases 8–11 check the fixes made after the code review; they're mostly for the technical walkthrough. Use case 12 shows which deals are live and how to turn one off.

> **Tip for trying things out:** anything you change in **Manage deals** goes into **Your draft** only. To see it priced, open **Price an order** and turn on **Your draft** next to "Show receipts for". When you're done, click **Undo my changes** on Manage deals (or run `make dbreset`) so the demo data is clean again.
>
> The prices in these use cases assume **When deals clash** is set to _Customer gets their single best deal_ (the starting setting). If a use case gives a different answer, check that first.

### Use case 1: "Why does Ray pay $16.20?"

1. Click **Price an order** in the menu.
2. Click the **Ray's Tuesday schnitzel** button (it's selected when the page opens).
3. Read the green box at the top. It says the order costs **$18.00** under the new rules, **$5.40 less** than today's till ($23.40).
4. Compare the two receipts:
   - **Today's till:** the schnitzel gets Schnitzel Tuesday, **plus** Member Discount _(extra, on top)_. That's the double discount.
   - **New rules:** one deal only. Under **Not applied**, it says why the member discount wasn't added: _"Part of Schnitzel Tuesday — cheaper as a bundle."_

**Point to make:** the till now explains itself, so staff don't need to guess or override.

### Use case 2: "Price any order I want"

1. On **Price an order**, work through the three numbered steps on the left:
   - **Where and when:** pick a venue, a date and a time.
   - **Who's buying:** Walk-in, Member or Staff.
   - **What they order:** use **+** and **−** on each item.
2. The prices update straight away. Nothing needs to be saved.

Try this: pick **Staff Parma & Pint on Thursday**. Today the staff member pays **$57.40**, more than a walk-in customer pays ($55). The new rules give them **$55**.

### Use case 3: "Give one bistro a different happy hour" (Tania's request)

1. Click **Manage deals**.
2. In the **Happy Hour** row, click the **pencil** icon.
3. Scroll to **Venue exceptions** and click **Add exception**.
4. Choose **The Gilded Spoon**, keep **Runs here** switched on, and set the times to **17:00** to **19:00**.
5. Click **Save to draft**.
6. Look at **Who's affected by your changes**. It shows one line: _"Bistro pint at 6:30pm: $12.00 → $10.20"_. Nothing else changed.
7. Happy with it? Click **Publish to tills** in the bar at the bottom. Changed your mind? Click **Undo my changes**.

**Point to make:** this took one minute, not a 3-day ticket, and Tania saw the effect _before_ any customer did.

### Use case 4: "Add a one-day deal" (Melbourne Cup)

1. On **Manage deals**, click **Add a deal**.
2. Name: `Melbourne Cup`. Kind: **Percent off**, 20.
3. Days: **Tue**. From **11:00** until **19:00**.
4. First day and last day: **3 Nov 2026**.
5. Scroll down to **Where does it run?**, below First day / Last day. Click **Only some venues**, then the **All VIC** quick-pick button. It ticks The Sable Arms and Fitzroy Larder.
6. Click **Save to draft**, then check **Price an order** with a Victorian venue on 3 Nov 2026.

### Use case 5: "Where do deals clash this week?"

1. Click **Week at a glance**.
2. With **Today's till** selected, the red box says customers at The Brass Anchor get **two discounts on one item for 21 hours** this week. Red squares show when.
3. Click a red square: the side panel names the deals and what goes wrong.
4. Switch to **New rules**: the red is gone. Deals still overlap, but the customer gets the better one.

### Use case 6: "A customer complains and the manager changes the price"

1. Click **Manual prices**.
2. Keep **J. Okonjo (casual)** and click **Record override**. It's **refused**: casual staff can't change prices.
3. Choose **M. Ferreira (supervisor)** and try again. It's **accepted**, with the reason recorded.
4. The totals on the right show how much was given away by hand, by reason. This is kept separate from promotions, so promotion reports stay accurate.

### Use case 7: "What changes for customers overall?"

Open **Start here**. The list **What changes for customers** shows every example situation from the brief whose price **or deal** changes. Green means the customer pays less, red means more, and grey **no change** means the same price under a different deal. Click a row to see both receipts.

You should see four rows out of nine situations:

| Situation                        | Today's till → New rules | Why                                              |
| -------------------------------- | ------------------------ | ------------------------------------------------ |
| Ray's Tuesday schnitzel          | $23.40 → $18.00          | Schnitzel and pot as one $18 deal, no extra 10%  |
| Tuesday schnitzel without a pot  | $23.00 → $23.00          | Same price; now reported as *Schnitzel Tuesday — no pot* |
| Member's beer at happy hour      | $18.36 → $20.40          | No more two discounts on one beer                |
| Staff Parma & Pint on Thursday   | $57.40 → $55.00          | Staff get the bundle when it's cheaper           |

Be ready to explain the red one: **members pay more for happy-hour beer** ($18.36 → $20.40 for two pints), because they no longer get two discounts. That follows Tania's own rule, but it's a business decision for her, so the system shows it clearly instead of hiding it.

### Use case 8: "Someone orders the Tuesday schnitzel but doesn't want a pot"

Tania said the $18 schnitzel "includes a pot", but a driver might want a soft drink instead. Until she tells us what she wants, **nobody pays more than today**.

1. Click **Price an order**, then the **Tuesday schnitzel without a pot** button.
2. Both receipts say **$23.00**: the schnitzel for $18 plus a $5 soft drink.
3. On the **New rules** receipt, the schnitzel shows **Schnitzel Tuesday — no pot**. Under **Not applied**, *Schnitzel Tuesday* says _"Needs 1× Chicken Schnitzel + 1× Pot"_.
4. Now add a **Lager — pot** with **+**. The total stays **$23.00** ($18 for the schnitzel and pot together, plus the soft drink): the pot comes free with the deal. The schnitzel now shows **Schnitzel Tuesday**, not the no-pot deal.

**Point to make:** the no-pot deal is there on purpose, and its description in Manage deals says so. If Tania says the pot is part of the deal, switch it off and the preview shows who pays more.

### Use case 9: "A smaller deal plus the member's 10% beats a bigger deal"

When a rule allows the member discount on top of one deal, the system compares the **final** prices, extras included. Before the fix it compared the deals alone and could charge a member more than necessary.

1. On **Manage deals**, click **Add a deal**. Name: `Schnitzel 15% off`. Kind: **Percent off**, 15. What it covers: **Specific items**, tick **Chicken Schnitzel**. Leave the days and times as they are (every day, all day). **Save to draft**.
2. Add another: `Schnitzel 20% off`, **Percent off**, 20, **Specific items**, **Chicken Schnitzel**. **Save to draft**.
3. Click the pencil on **Member Discount**. Under **Can be added on top of**, tick **Schnitzel 15% off** only. **Save to draft**.
4. Go to **Price an order**. Pick The Brass Anchor, a **Wednesday** (for example 23 Sep 2026) at 12:00, **Member** (Ray), and one **Chicken Schnitzel**. Turn on **Your draft**.
5. The **Your draft** receipt says **$19.89**: *Schnitzel 15% off* ($26.00 → $22.10) plus *Member Discount* on top (−$2.21). Under **Not applied**, *Schnitzel 20% off* says _"One deal per item — Schnitzel 15% off is cheaper ($19.89 vs $20.80)"_.
6. Clean up: **Undo my changes** on Manage deals.

### Use case 10: "A bundle priced higher than buying the items separately"

A bundle is never charged if it costs the same as, or more than, its items at menu price, whatever the rules. The same already applied to a set price on a single item.

1. On **Manage deals**, click the pencil on **Parma & Pint for Two**. Set the price to **100** and **Save to draft**.
2. On **Price an order**, pick a **Thursday** (for example 24 Sep 2026) at **18:30**, **Walk-in**, then 2× **Parmigiana** and 2× **Lager — pint**. Turn on **Your draft**.
3. The draft receipt charges the menu price, **$82.00**. Under **Not applied**, the bundle says _"Bundle price isn't below the menu price ($100.00 vs $82.00)"_.
4. Clean up: **Undo my changes**.

### Use case 11: "Tania types something the system can't accept"

The editor now says exactly what's wrong instead of showing an empty message.

1. On **Manage deals**, click the pencil on **Happy Hour**.
2. Set **Percent off** to **150** and click **Save to draft**.
3. A red message says _"value: A percentage can't be over 100"_, and nothing is saved.
4. Close the editor without saving. Nothing needs undoing.

### Use case 12: "Which deals are on the tills, and how do I turn one off?"

Every deal in **Your draft** has a **Status** that says whether the tills already run it. It's worked out by comparing your draft with the new rules, so it can't go out of date.

| Status | Meaning |
| --- | --- |
| **Published** (green) | The tills run exactly this version |
| **Changed, not published** | The tills run it, but you've edited it since |
| **New, not published** | Only in your draft; the tills don't have it |
| **Turned off, not published** | You switched it off, but the tills still run it until you publish |
| **Removed, not published** (red, crossed out) | You deleted it, but the tills still run it until you publish |

Above the table, the badges count how many deals are published and how many aren't. If you changed **When deals clash**, a badge says so too, since that isn't part of any one deal.

**Turn off a published deal:**

1. Click **Manage deals**. On **Your draft**, every deal says **Published**.
2. Flip the switch on **Member Discount** to off. Its status becomes **Turned off, not published**, and the badges show **1 not published yet**.
3. Look at **Who's affected by your changes**: one line, _"Member's pint at 12:30am: $11.70 → $13.00"_. The other member situations don't move, because they already get a better deal. This is the check before it reaches the tills.
4. Click **Publish to tills**. Member Discount's status goes back to **Published**, and it stays switched off. The **New rules** tab shows it faded.

**Change your mind about one deal (Undo):**

1. On **Your draft**, click the pencil on **Happy Hour**, change the percentage to 20, and **Save to draft**. Its status becomes **Changed, not published**.
2. A curved-arrow **Undo** button appears next to the pencil. Click it: Happy Hour goes back to exactly what the tills run, and the status says **Published**. Other unpublished changes stay as they are. (**Undo my changes** at the bottom throws away *all* of them.)
3. Click the pencil on **Parma & Pint for Two** and click **Remove**. The deal doesn't disappear: it stays in the table, crossed out, as **Removed, not published**, because the tills still run it.
4. Click **Undo** on that row. It comes back as **Published**.

**Point to make:** Tania can always see what the tills are doing, deal by deal. Turning a deal off goes through the same preview as any other change, so nothing reaches customers unseen. There's no switch that changes the tills directly, on purpose.

---

## Part 4: Explaining it to the interview panel

The session has three parts. Here is what to say in each.

### For the non-technical person (10 minutes)

Follow the **Start here** page from top to bottom:

1. **The problem (1 min):** "Five deals clash, nobody can predict the till, so staff override prices and the reports are wrong."
2. **The surprise (1 min):** "The till isn't doing what Tania thinks. It adds the member discount on top. That's why Ray pays $16.20."
3. **Use case 1 (2 min):** Ray's receipt, old vs new, and the reason.
4. **Use case 3 (3 min):** the bistro happy hour: change it, see who's affected, publish.
5. **Use case 5 (2 min):** the red week, then switch to New rules.
6. **Close (1 min):** "Tania can now change deals herself, safely, and every price explains itself."

### For the technical person (15 minutes)

- **Shape:** a monorepo with three main parts.
  - A **pricing engine**: pure logic, no database, where most of the tests live.
  - A **NestJS API**: it reads Trestle's data and stores the deals in SQLite.
  - A **Next.js web app**: it only displays results; it never calculates prices itself.
- **Key decisions:**
  - Best single deal instead of Trestle's "priority" rule. "Best" means the final price, including any extras a rule allows on top (use case 9).
  - A bundle or set price is never charged if it's not below the menu price (use case 10).
  - Stacking only when explicitly allowed, deal by deal.
  - Draft → check impact → publish, with a status on every deal (Published, Changed, New, Turned off, Removed) worked out by comparing draft with live, never stored (use case 12).
  - "Today's till" is rebuilt from Trestle's data on every read, so we can prove we reproduce the current problem exactly.
- **What I cut, and why:** payments, logins, publish history, real till integration. They weren't needed to solve the problem inside the time box.
- **Trestle gaps I found:**
  - No timezone on venues.
  - No field saying who a deal is for (members or staff).
  - No venue or date limits on deals.
  - Sales records don't say which deal was applied, which is why the reports can't be trusted.

More detail: `docs/ARCHITECTURE.md` and `docs/decisions/`.

### For the live change (15 minutes)

They will change a requirement. First decide: **is it a setting, or a rule?**

| If they ask…                        | It's a…     | Where                                                                     |
| ----------------------------------- | ----------- | ------------------------------------------------------------------------- |
| "Bistro happy hour 5–7"             | Setting     | Manage deals → Happy Hour → Venue exception                               |
| "Members keep 10% on the schnitzel" | Setting     | Member Discount → tick **both** _Schnitzel Tuesday_ and _Schnitzel Tuesday — no pot_ under "Can be added on top of" |
| "The pot is part of the deal"       | Setting     | Switch off _Schnitzel Tuesday — no pot_. The preview shows who pays more   |
| "Pull a deal off the tills tonight" | Setting     | Your draft → switch it off → Publish to tills (use case 12)               |
| "Melbourne Cup, Victoria only"      | Setting     | Add a deal (use case 4)                                                   |
| "Any pint counts for Parma & Pint"  | Setting     | Parma & Pint → tick Pale Ale in the pint part                             |
| "Never discount more than 30%"      | Rule (code) | `packages/pricing-engine/src/engine.ts`, test first                       |

Say out loud: _"First I'll write a test for the new behaviour, then change the code, then run the checks."_ Finish with `make check`.

### Honest answers to likely questions

- **"Does the real till use this now?"** No. It's a working prototype. The till would call the same pricing engine once Trestle supports it.
- **"Why do some members pay more?"** Because Tania's rule is "best single deal". If she wants members to keep extras on some deals, that's a setting (see the live-change table above), not new code.
- **"Why are there two Schnitzel Tuesday deals?"** Tania said the $18 "includes a pot", so the main deal is schnitzel plus pot. A schnitzel on its own is $18 today, and I didn't want anyone's price to go up before she answers. So the second deal keeps it at $18, and it's reported under its own name so we can see how often it happens.
- **"What did you assume?"** The list is on the Start here page: which venues are the bistros, the pot price, and a few others. Each one is waiting on Tania's answers.
