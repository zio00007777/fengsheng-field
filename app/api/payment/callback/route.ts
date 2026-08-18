import { json } from "../../_lib";

export async function POST() {
  return json({ error: "payment_provider_not_configured" }, { status: 503 });
}
