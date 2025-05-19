import { getDatabase } from "./database.js";

export default async function handler(req, res) {
    const database = getDatabase();
    const data = await database.ref('result').once('value');

    res.status(200).json(data.val());
}
