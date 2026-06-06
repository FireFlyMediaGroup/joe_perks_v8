/**
 * Creates a real Stripe **test-mode** Connect account that can immediately
 * receive transfers, for the e2e money-path seed (MP-02 payout release).
 *
 * Uses a Custom account with prefilled test "magic" values
 * (`address_full_match`, ssn `0000`, the 110000000/000123456789 test bank) so the
 * `transfers` capability activates without interactive onboarding. Talks to the
 * Stripe REST API directly via fetch — no Stripe SDK / `server-only` import.
 *
 * Returns the `acct_…` id, or `null` when no Stripe **test** key is configured
 * (so normal dev seeding without Stripe still works — caller falls back to a
 * placeholder id).
 */
export async function createTestConnectAccount(input: {
  email: string;
  label: string;
}): Promise<string | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) {
    console.log(
      `  [${input.label}] no sk_test_ key — using placeholder Connect id`
    );
    return null;
  }

  const form = new URLSearchParams({
    "business_profile[mcc]": "5499",
    "business_profile[product_description]": "Coffee fundraiser payouts",
    "business_profile[url]": "https://joeperks.com",
    business_type: "individual",
    "capabilities[transfers][requested]": "true",
    country: "US",
    email: input.email,
    "external_account[account_number]": "000123456789",
    "external_account[country]": "US",
    "external_account[currency]": "usd",
    "external_account[object]": "bank_account",
    "external_account[routing_number]": "110000000",
    "individual[address][city]": "Beverly Hills",
    "individual[address][country]": "US",
    "individual[address][line1]": "address_full_match",
    "individual[address][postal_code]": "90210",
    "individual[address][state]": "CA",
    "individual[dob][day]": "1",
    "individual[dob][month]": "1",
    "individual[dob][year]": "1990",
    "individual[email]": input.email,
    "individual[first_name]": "Jane",
    "individual[id_number]": "000000000",
    "individual[last_name]": "Tester",
    "individual[phone]": "+15555550123",
    "individual[ssn_last_4]": "0000",
    "tos_acceptance[date]": String(Math.floor(Date.now() / 1000)),
    "tos_acceptance[ip]": "8.8.8.8",
    type: "custom",
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/accounts", {
      body: form.toString(),
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });
    const account = (await res.json()) as {
      capabilities?: { transfers?: string };
      error?: { message?: string };
      id?: string;
    };

    if (!(res.ok && account.id)) {
      console.error(
        `  [${input.label}] Connect account create FAILED:`,
        account.error?.message ?? res.status
      );
      return null;
    }

    console.log(
      `  [${input.label}] Connect account ${account.id} (transfers=${account.capabilities?.transfers ?? "unknown"})`
    );
    return account.id;
  } catch (e) {
    // Never let a Connect hiccup break seeding — fall back to a placeholder id.
    console.error(
      `  [${input.label}] Connect account create errored:`,
      e instanceof Error ? e.message : "unknown"
    );
    return null;
  }
}
