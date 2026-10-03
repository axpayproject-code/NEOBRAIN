// Local deterministic mock; never contacts PayMongo or processes money.
import { createServer } from "node:http";
const checkouts = new Map();
let sequence = 0;
export function createPaymentMock() {
  return createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    res.setHeader("content-type", "application/json");
    const path = req.url;
    if (req.method === "POST" && path === "/checkout_sessions") {
      const id = `cs_test_${++sequence}`;
      const amount = body.data.attributes.line_items[0].amount;
      const record = {
        id,
        attributes: {
          checkout_url: `https://checkout.example.test/${id}`,
          payments: [
            {
              id: `pay_test_${sequence}`,
              attributes: { status: "paid", amount, currency: "PHP" },
            },
          ],
        },
      };
      checkouts.set(id, record);
      res.end(JSON.stringify({ data: record }));
    } else if (req.method === "GET" && path.startsWith("/checkout_sessions/")) {
      res.end(JSON.stringify({ data: checkouts.get(path.split("/").at(-1)) }));
    } else if (path === "/refunds") {
      res.end(
        JSON.stringify({
          data: { id: "refund_test", attributes: { status: "pending" } },
        }),
      );
    } else {
      res.statusCode = 404;
      res.end("{}");
    }
  });
}
