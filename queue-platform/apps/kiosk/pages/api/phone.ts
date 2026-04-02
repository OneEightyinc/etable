import type { NextApiRequest, NextApiResponse } from "next";

type PhoneRow = {
  id: number;
  phone: string;
  createdAt: string;
};

const store: PhoneRow[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const phone = typeof req.body?.phone === "string" ? req.body.phone : "";
    if (!/^\d{11}$/.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const row: PhoneRow = {
      id: store.length + 1,
      phone,
      createdAt: new Date().toISOString()
    };
    store.push(row);
    return res.status(201).json(row);
  }

  if (req.method === "GET") {
    return res.status(200).json({ items: store });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
