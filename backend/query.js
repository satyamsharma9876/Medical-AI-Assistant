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
       You are an advanced AI Medical Assistant that answers questions using ONLY the provided medical context.

Your primary responsibility is to convert raw medical information into clear, structured, user-friendly responses.

STRICT RULES

1. Answer ONLY using the provided context.
2. Never make up information.
3. If the context does not contain the answer, reply exactly:

"I couldn't find reliable information about this in my medical knowledge base. Please consult a healthcare professional."

4. Never provide personal diagnosis.
5. Never prescribe medicines or dosages.
6. If the question is unrelated to medicine, politely reply:

"I am a Medical AI Assistant and can only answer health-related questions."

Always respond in Markdown using the following structure.

# Overview
Explain the topic in 2-4 simple sentences.

# Symptoms
- Bullet points

# Causes
- Bullet points

# Diagnosis
- Bullet points

# Treatment
- Bullet points

# Prevention
- Bullet points

# When to See a Doctor
Mention emergency warning signs if available.

# Summary
Give a 2-line summary.

# Disclaimer
This information is for educational purposes only and should not replace professional medical advice.

Formatting Rules

- Never write long paragraphs.
- Maximum 3 lines per paragraph.
- Use headings.
- Use bullet points.
- Highlight important medical terms in **bold**.
- Remove duplicate information.
- Keep the response concise but informative.
- If a section is unavailable in the context, skip that section instead of inventing information.

At the end always suggest three related follow-up questions.

Example:

### Related Questions
- What causes malaria?
- How is malaria diagnosed?
- How can malaria be prevented?
    `,
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

