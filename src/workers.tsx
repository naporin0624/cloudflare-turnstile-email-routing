import { EmailMessage } from "cloudflare:email";
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { createMimeMessage } from "mimetext";

type ErrorCode =
  | "missing-input-secret"
  | "invalid-input-secret"
  | "missing-input-response"
  | "invalid-input-response"
  | "invalid-widget-id"
  | "invalid-parsed-secret"
  | "bad-request"
  | "timeout-or-duplicate"
  | "internal-error";

type SiteVerify =
  | {
      success: true;
      challenge_ts: string;
      hostname: string;
      "error-codes": [];
      action: string;
      cdata: string;
    }
  | {
      success: false;
      "error-codes": ErrorCode[];
    };

type Bindings = {
  TURNSTILE_SECRET_KEY: string;
  EMAIL: SendEmail;
};
type HonoEnv = {
  Bindings: Bindings;
};

const app = new Hono<HonoEnv>();
app.get("*", serveStatic({ root: "./" }));

app.post("/api/turnstile", async (c) => {
  const form = await c.req.formData();
  const textarea = form.get("description")?.toString();
  const token = form.get("cf-turnstile-response")?.toString();
  const ip = c.req.header("CF-Connecting-IP");
  if (token === undefined) return c.body("token is undefined", 400);

  const formData = new FormData();
  formData.append("secret", c.env.TURNSTILE_SECRET_KEY);
  formData.append("response", token);
  if (ip !== null && ip !== undefined) {
    formData.append("remoteip", ip);
  }

  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const result = await fetch(url, {
    body: formData,
    method: "POST",
  });

  const outcome = (await result.json()) as SiteVerify;
  if (!outcome.success) {
    return c.json(
      { ok: false, "error-codes": outcome["error-codes"] },
      { status: 500 },
    );
  }

  try {
    const msg = createMimeMessage();
    const from = "";
    const to = "";
    msg.setSender({ name: "テストユーザー", addr: from });
    msg.setRecipient(to);

    msg.setSubject("テストユーザー");
    msg.addMessage({
      contentType: "text/html",
      data: `
        <h1>テストメール</h1>
        <p style="white-space: pre-wrap;">${textarea}</p>
      `,
    });

    msg.addMessage({
      contentType: "text/plain",
      data: `hello world\n${textarea}`,
    });

    const message = new EmailMessage(from, to, msg.asRaw());
    await c.env.EMAIL.send(message);

    return c.json({ ok: true });
  } catch (e) {
    if (e instanceof Error) {
      return c.json({ ok: false, message: e.message }, { status: 500 });
    }

    return c.json({ ok: false }, { status: 500 });
  }
});

export default app;
