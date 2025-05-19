import { getDatabase } from "./database.js";

export default async function handler(req, res){
    const database = getDatabase();
    const key = req.body;
    await database.ref('result').child(key).remove();
    res.status(200).json({success: true});
}