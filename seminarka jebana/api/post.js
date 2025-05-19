import { getDatabase } from "./database.js";

export default async function handler(req, res) {
    const {popis, hodnota, datum, categorie} = req.body;
    const database = getDatabase();
    const newLine = database.ref('result').push();
    
    await newLine.set({
        popis: popis,
        hodnota: hodnota,
        datum: datum,
        categorie: categorie
    })

    res.status(200).json({ success: true });
}