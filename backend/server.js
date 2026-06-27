
import express from "express";//Express request पकड़ता है jo ki frontend se ya postman se aarha hota h
import cors from "cors";
import { chatting } from "./query.js";

const app = express();//Express app created

app.use(cors());//server is now ready for CORS allow करने के लिए
app.use(express.json());//JSON body read करने के लिए


app.post("/chat", async (req, res) => {//Server को पता चल जाता है:"/chat" endpoint आएगा तो ये function run करना है
  try {
    const { question } = req.body;

    const answer = await chatting(question);

    res.json({//Response बनता है
      success: true,
      answer,
    });//Frontend को response मिल जाता है:
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

