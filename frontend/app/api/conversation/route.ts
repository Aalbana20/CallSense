import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch("http://localhost:5000/api/conversations");
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching conversation data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
