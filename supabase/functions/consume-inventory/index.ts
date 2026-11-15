// ═══════════════════════════════════════════════════════════════════════════
// MANASARA — Edge Function: consume-inventory
// Admin-only endpoint that deducts raw material stock when an order enters
// production. Uses an idempotency key (reference_code = `consume:{order_id}`)
// to prevent double-deductions if the function is called more than once.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RequestBody {
  order_id: string;
  production_note?: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
}

interface ProductRecipe {
  material_id: string;
  quantity_per_unit: number; // NUMERIC stored as number in JS
}

// ─── Helper: respond with JSON ────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // ── 1. Verify JWT and confirm the caller is an active admin ──────────────

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const jwt = authHeader.replace("Bearer ", "");

  // Service-role client for all privileged DB operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  // User-scoped client just to decode and verify the caller's identity
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    },
  );

  const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
  if (userErr || !user) {
    return json({ error: "Unauthorized — invalid JWT" }, 401);
  }

  // Check active admin_profiles row
  const { data: adminProfile, error: adminErr } = await supabaseAdmin
    .from("admin_profiles")
    .select("id, role, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminErr) {
    console.error("admin_profiles query error:", adminErr);
    return json({ error: "Internal server error" }, 500);
  }
  if (!adminProfile) {
    return json({ error: "Forbidden — active admin account required" }, 403);
  }

  // ── 2. Parse and validate request body ───────────────────────────────────

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { order_id, production_note } = body;

  if (
    !order_id ||
    typeof order_id !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(order_id)
  ) {
    return json({ error: "order_id must be a valid UUID" }, 400);
  }

  const idempotencyKey = `consume:${order_id}`;

  // ── 3. Idempotency check — was this order already consumed? ──────────────

  const { data: existing, error: idempotencyErr } = await supabaseAdmin
    .from("inventory_transactions")
    .select("id")
    .eq("reference_code", idempotencyKey)
    .limit(1)
    .maybeSingle();

  if (idempotencyErr) {
    console.error("idempotency check error:", idempotencyErr);
    return json({ error: "Internal server error" }, 500);
  }
  if (existing) {
    return json({ already_consumed: true, order_id }, 200);
  }

  // ── 4. Fetch the order and its items ─────────────────────────────────────

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("id, status, production_note")
    .eq("id", order_id)
    .maybeSingle();

  if (orderErr) {
    console.error("order fetch error:", orderErr);
    return json({ error: "Internal server error" }, 500);
  }
  if (!order) {
    return json({ error: "Order not found" }, 404);
  }

  const { data: orderItems, error: itemsErr } = await supabaseAdmin
    .from("order_items")
    .select("id, product_id, quantity")
    .eq("order_id", order_id);

  if (itemsErr) {
    console.error("order_items fetch error:", itemsErr);
    return json({ error: "Internal server error" }, 500);
  }
  if (!orderItems || orderItems.length === 0) {
    return json({ error: "Order has no items" }, 422);
  }

  // ── 5. Fetch recipes for every product in the order ──────────────────────

  const productIds = [...new Set((orderItems as OrderItem[]).map((i) => i.product_id))];

  const { data: recipes, error: recipesErr } = await supabaseAdmin
    .from("product_recipes")
    .select("product_id, material_id, quantity_per_unit")
    .in("product_id", productIds);

  if (recipesErr) {
    console.error("product_recipes fetch error:", recipesErr);
    return json({ error: "Internal server error" }, 500);
  }
  if (!recipes || recipes.length === 0) {
    return json(
      { error: "No recipes found for products in this order. Add recipes before consuming inventory." },
      422,
    );
  }

  // Build a lookup map: product_id → recipe rows
  const recipeMap = new Map<string, ProductRecipe[]>();
  for (const r of recipes as (ProductRecipe & { product_id: string })[]) {
    const existing = recipeMap.get(r.product_id) ?? [];
    existing.push({ material_id: r.material_id, quantity_per_unit: r.quantity_per_unit });
    recipeMap.set(r.product_id, existing);
  }

  // ── 6. Build inventory_transactions rows ──────────────────────────────────

  const noteText = production_note?.trim() || "Production usage for order";
  const transactions: {
    material_id: string;
    transaction_type: string;
    quantity_change: number;
    reference_code: string;
    notes: string;
    created_by: string;
  }[] = [];

  const warnings: string[] = [];

  for (const item of orderItems as OrderItem[]) {
    const itemRecipes = recipeMap.get(item.product_id);
    if (!itemRecipes || itemRecipes.length === 0) {
      warnings.push(`No recipe found for product ${item.product_id} — skipped.`);
      continue;
    }

    for (const recipe of itemRecipes) {
      // quantity_change is NEGATIVE (deduction)
      const totalQty = recipe.quantity_per_unit * item.quantity;

      transactions.push({
        material_id: recipe.material_id,
        transaction_type: "PRODUCTION_USAGE",
        // Stored as negative to represent stock reduction
        quantity_change: -Math.abs(totalQty),
        reference_code: idempotencyKey,
        notes: `${noteText} | order_item: ${item.id}`,
        created_by: user.id,
      });
    }
  }

  if (transactions.length === 0) {
    return json(
      {
        error: "No inventory transactions could be generated. Ensure all products have recipes.",
        warnings,
      },
      422,
    );
  }

  // ── 7. Insert all transactions in one batch ───────────────────────────────

  const { error: insertErr } = await supabaseAdmin
    .from("inventory_transactions")
    .insert(transactions);

  if (insertErr) {
    console.error("inventory_transactions insert error:", insertErr);
    return json({ error: "Failed to record inventory transactions" }, 500);
  }

  // ── 8. Optionally update production_note on the order ────────────────────

  if (production_note?.trim()) {
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({ production_note: production_note.trim(), updated_at: new Date().toISOString() })
      .eq("id", order_id);

    if (updateErr) {
      // Non-fatal — inventory was already committed; log and continue
      console.warn("Failed to update order production_note:", updateErr);
    }
  }

  // ── 9. Return success ─────────────────────────────────────────────────────

  return json({
    success: true,
    order_id,
    transactions_recorded: transactions.length,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
});
