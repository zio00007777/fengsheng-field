import { json, scoreTotals } from "../_lib";

export async function GET() {
  return json(await scoreTotals());
}
