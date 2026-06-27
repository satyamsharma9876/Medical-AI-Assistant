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
    topK: 10,//Top 10 matching chunks lao.
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
      Context:
      ${context}

      User Question:
      ${queries}    `
      }
       ]
     }
   ],
    config: {
      systemInstruction: `
       You are a Medical AI Assistant.

       You will be given a context of relevant medical information and a user question.

       Your task is to answer the user's question based ONLY on the provided context.

       If the answer is not present in the context, you must clearly say:
       "I could not find relevant medical information in the provided context."

      Rules:
      - Do NOT give personal medical diagnosis or prescriptions.
      - Always keep answers simple, clear, and easy to understand.
      - Prefer short, structured, and educational explanations.
      - If appropriate, include general health awareness or precautions.
      - Do not hallucinate or assume missing medical information.
      - If the question is unrelated to medical topics, politely say you can only answer medical-related questions.

     Tone:
     - Professional
     - Calm
     - Helpful
     - Non-alarming
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

