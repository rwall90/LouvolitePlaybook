import { NextRequest, NextResponse } from "next/server";
import { parseResponse, supabaseFetch } from "@/lib/supabase";

const tableName = "leads";

type LeadInput = {
  name: string;
  email: string;
  company: string;
  phone: string;
  volume: string;
  message: string;
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: securityHeaders()
  });
}

export async function POST(request: NextRequest) {
  try {
    const lead = sanitizeLead(await request.json().catch(() => ({})));
    const validationError = validateLead(lead);

    if (validationError) {
      return json({ message: validationError }, 400);
    }

    const response = await supabaseFetch(tableName, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...lead, source: "website" })
    });
    const data = await parseResponse<Array<Record<string, string>>>(response);

    if (!response.ok) {
      return json({ message: "Could not save lead." }, 502);
    }

    return json({ lead: data[0] }, 201);
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : "Unexpected server error." }, 500);
  }
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return json({ message: "Invalid admin password." }, 401);
  }

  const response = await supabaseFetch(`${tableName}?select=*&order=submitted_at.desc`);
  const data = await parseResponse(response);

  if (!response.ok) {
    return json({ message: "Could not load leads." }, 502);
  }

  return json({ leads: data }, 200);
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return json({ message: "Invalid admin password." }, 401);
  }

  const response = await supabaseFetch(`${tableName}?id=not.is.null`, {
    method: "DELETE"
  });

  if (!response.ok) {
    return json({ message: "Could not clear leads." }, 502);
  }

  return new NextResponse(null, { status: 204, headers: securityHeaders() });
}

function sanitizeLead(input: Partial<LeadInput>): LeadInput {
  return {
    name: cleanString(input.name),
    email: cleanString(input.email).toLowerCase(),
    company: cleanString(input.company),
    phone: cleanString(input.phone),
    volume: cleanString(input.volume),
    message: cleanString(input.message)
  };
}

function validateLead(lead: LeadInput) {
  if (!lead.name || !lead.email || !lead.company || !lead.phone || !lead.volume) {
    return "Please complete all required fields.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return "Please enter a valid email address.";
  }

  if (lead.message.length < 10) {
    return "Please add a short note about what you need.";
  }

  return "";
}

function cleanString(value: unknown) {
  return String(value || "").trim().slice(0, 1000);
}

function isAdmin(request: NextRequest) {
  return request.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: securityHeaders()
  });
}

function securityHeaders() {
  return {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff"
  };
}
