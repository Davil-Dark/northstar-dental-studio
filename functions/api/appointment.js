const TO_EMAIL = "delivered@resend.dev";

export async function onRequestPost(context) {
  const request = context.request;

  let data;

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
  } catch {
    return json({ error: "Invalid form submission." }, 400);
  }

  // Anti-bot honeypot
  if (String(data.website || "").trim()) {
    return json({ ok: true });
  }

  const name = clean(data.name, 120);
  const email = clean(data.email, 180);
  const phone = clean(data.phone, 60);
  const service = clean(data.service, 120);
  const message = clean(data.message, 2000);

  if (!name || !email || !phone) {
    return json(
      { error: "Please provide your name, email, and phone number." },
      400
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(
      { error: "Please enter a valid email address." },
      400
    );
  }

  const apiKey = context.env.RESEND_API_KEY;

  if (!apiKey) {
    return json(
      { error: "Email service is not configured yet." },
      500
    );
  }

  const from =
    context.env.FROM_EMAIL ||
    "Northstar Dental <onboarding@resend.dev>";

  const emailHTML = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#17251f">
      <h2>New Northstar Appointment Request</h2>

      <p style="color:#6d7773">
        Submitted from the Northstar Dental Studio website.
      </p>

      <table cellpadding="8" cellspacing="0"
        style="width:100%;border-collapse:collapse">

        <tr>
          <td><strong>Name</strong></td>
          <td>${esc(name)}</td>
        </tr>

        <tr>
          <td><strong>Email</strong></td>
          <td>${esc(email)}</td>
        </tr>

        <tr>
          <td><strong>Phone</strong></td>
          <td>${esc(phone)}</td>
        </tr>

        <tr>
          <td><strong>Service</strong></td>
          <td>${esc(service || "Not specified")}</td>
        </tr>

        <tr>
          <td><strong>Message</strong></td>
          <td>${esc(message || "—")}</td>
        </tr>

      </table>

      <p style="margin-top:24px;font-size:12px;color:#7b857f">
        Northstar Dental Studio concept · Virexa & Hartwell
      </p>
    </div>
  `;

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",

      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        from,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `Northstar Dental — Appointment Request from ${name}`,
        html: emailHTML
      })
    }
  );

  if (!response.ok) {
    console.error(await response.text());

    return json(
      { error: "The request could not be emailed." },
      502
    );
  }

  // Confirmation email to visitor
  try {
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          from,
          to: [email],
          subject:
            "We received your Northstar appointment request",

          html: `
            <p>Hi ${esc(name)},</p>

            <p>
              Thanks for reaching out to Northstar Dental Studio.
              We received your appointment request and will follow up
              with available options.
            </p>

            <p>
              — Northstar Dental Studio
            </p>
          `
        })
      }
    );
  } catch (error) {
    console.error("Confirmation email error:", error);
  }

  return json({ ok: true });
}

function clean(value, max) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function esc(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]
  );
}

function json(body, status = 200) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8"
      }
    }
  );
}
