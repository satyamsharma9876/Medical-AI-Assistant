import * as dotenv from 'dotenv';
dotenv.config();
import readlineSync from 'readline-sync';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';//Text ko vector (numbers) me convert karne ke liye,Pinecone sirf vectors samajhta hai
import { Pinecone } from '@pinecone-database/pinecone';//Pinecone database use karne ke liye.
import { GoogleGenAI } from "@google/genai";//Gemini model se answer generate karne ke liye.

//const ai = new GoogleGenAI({});//Yahan Gemini client create ho raha hai.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const chatHistory = [];

async function transformQuery(question){

const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:
     {
      role:'user',
      parts:[{text:question}]
     },
    config: {
      systemInstruction: `You are a query rewriting expert. Based on the provided chat history, rephrase the "Follow Up user Question" into a complete, standalone question that can be understood without the chat history.
      Only output the rewritten question and nothing else, No punctuation explanation,No punctuation explanation .
      `,
    },
 });
 
 return response.text
}


 export async function chatting(question) {//Ye function ek question lega aur answer dega.
    // convert this question into vector

    const queries = await transformQuery(question);

    const embeddings = new GoogleGenerativeAIEmbeddings({//Embedding model initialize kar rahe ho. Purpose: Question -> Vector
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-embedding-001",
    });
 
 const queryVector = await embeddings.embedQuery(queries); //Question -> Vector

 const pinecone = new Pinecone();//Pinecone client create.
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);//Specific index connect.

 const searchResults = await pineconeIndex.query({//yha Question vector leta hai,Database ke vectors se compare karta h,Most similar chunks return karta h
    topK: 5,//Top 10 matching chunks lao.
    vector: queryVector,
    includeMetadata: true,//Sirf vector nahi,actual text bhi lao.
    });
    //console.log(searchResults)

    const context = searchResults.matches
                   .map(match => match.metadata.text)
                   .join("\n\n---\n\n");//Ye retrieved chunks ko ek string me jod raha hai. it works ike a seperator
      
    chatHistory.push({
    role:'user',
    parts:[{text:queries}]
    })   
    
    const response = await ai.models.generateContent({//Actual answer generate ho raha h
    model: "gemini-2.5-flash",
   // contents: chatHistory,//Saare previous messages Gemini ko diye ja rahe hain.
    contents: [
     ...chatHistory,
    {
      role: "user",
      parts: [
        {
          text: `
          You must answer ONLY using the medical knowledge provided below.

         =========================
         MEDICAL KNOWLEDGE BASE
         =========================

        Context:
        ${context}

         =========================
         USER QUESTION
         =========================

        ${queries}

        Important Instructions:
        - Answer only from the provided context.
        - Do not invent any information.
        - Return the answer in well-formatted Markdown.
        - Use headings and bullet points whenever appropriate.
        `
      }
       ]
     }
   ],
    config: {
      systemInstruction: `
       You are an expert Medical AI Assistant.

Your role is to convert medical knowledge into clear, concise and user-friendly answers.

You MUST answer ONLY from the provided context.

If the context does not contain the answer, reply exactly:

"I couldn't find reliable information in my medical knowledge base. Please consult a qualified healthcare professional."

Rules:

- Never hallucinate.
- Never provide personal diagnosis.
- Never prescribe medicines or dosages.
- Never invent information.
- If the question is not medical, reply:
"I am a Medical AI Assistant and can only answer health-related questions."

=========================
RESPONSE STYLE
=========================

Always use this exact layout.

🩺 Overview

Write a short explanation in 2–3 sentences.

━━━━━━━━━━━━━━━━━━━━

🤒 Symptoms

• Symptom 1

• Symptom 2

• Symptom 3

━━━━━━━━━━━━━━━━━━━━

🦠 Causes

• Cause 1

• Cause 2

━━━━━━━━━━━━━━━━━━━━

🔬 Diagnosis

• Diagnosis method 1

• Diagnosis method 2

━━━━━━━━━━━━━━━━━━━━

💊 Treatment

• Treatment 1

• Treatment 2

━━━━━━━━━━━━━━━━━━━━

🛡 Prevention

• Prevention 1

• Prevention 2

━━━━━━━━━━━━━━━━━━━━

⚠ When to See a Doctor

Explain emergency warning signs in 2–3 sentences.

━━━━━━━━━━━━━━━━━━━━

📌 Summary

Summarize everything in one or two sentences.

━━━━━━━━━━━━━━━━━━━━

⚠ Disclaimer

This information is for educational purposes only and should not replace professional medical advice.

━━━━━━━━━━━━━━━━━━━━

💡 Related Questions

• Question 1

• Question 2

• Question 3

=========================
FORMATTING RULES
=========================

- Do NOT use Markdown headings (# or ##).
- Do NOT use tables.
- Keep answers compact.
- Maximum 5 bullets in each section.
- Do not leave unnecessary blank lines.
- Skip any section if the information is not available in the context.
- Use plain Unicode emojis exactly as shown.
- Never repeat information. `,
    },
   });

   chatHistory.push({
    role:'model',
     parts: [{ text: response.text || "No response generated." }]
  })

 // console.log("\n");
  // console.log(response.text);
 return response.text || "No response generated.";
}

// async function main(){
//     const userProblem = readlineSync.question("Ask me Anything--> ");
//     await chatting(userProblem);
//     main();//Fir se question puchega.
// }
// main();// commented b/c frontend aane ke baad readline ki zarurat nahi hogi.

//Embedding → Vector DB (Pinecone) → Retrieval → Context Injection → LLM Generation (Gemini)

