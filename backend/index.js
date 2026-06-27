
// Phase1: PDF Load krke lao by using pdf loader
// Phase2: Chunking means divide the pdf into small pices, can be done by for loop in js
// Phase3: Convert each chunk into vector, iske liye for loop lagana padega or baar baar call krna padega
// phase4: store them into vector DB(pinecode)

// phase 1 k liye pdf loader, 2&3 k liye for loop, krna padega so use langchain(utility fun) , it has 
// pre build fun that can load pdf, do chunking automatically so no need to write long codes
// isko oficially python k liye banaya gya tha so hm langchainjs use krenge

import * as dotenv from 'dotenv';//Yeh dotenv package ko import karta hai.
dotenv.config();//ye .env file me likhe krys ko process.env me load krta h

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';//PDFLoader :LangChain ka tool jo filesystem se PDF file ko read karke text nikalta hai.  PDF → Text

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';//बड़े text को छोटे chunks में तोड़ता है।
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';//Text को vectors में convert करेगा।
import { Pinecone } from '@pinecone-database/pinecone';//Pinecone database से connection।
import { PineconeStore } from '@langchain/pinecone';//LangChain helper, Documents->Embeddings->Pinecone store


async function indexDocument(){//पूरा indexing process यहाँ चलेगा
const PDF_PATH = './medical.pdf';// PDF file का location
const Loader = new PDFLoader(PDF_PATH);//Loader object बनाया
const rawDocs = await Loader.load();//PDF पढ़ ली
console.log("pdf file loaded");


//console.log(rawDocs.length);//112
//phase2: chunking karo
const textSplitter = new RecursiveCharacterTextSplitter({//Chunk splitter object
    chunkSize: 1000,//हर chunk लगभग 1000 characters
    chunkOverlap: 200,//पिछले chunk के 200 chars अगले chunk में भी रहेंगे
  });
const chunkedDocs = await textSplitter.splitDocuments(rawDocs);//PDF → Chunks
console.log("Chunking Completed");

//console.log(chunkedDocs.length);//226
//console.log(chunkedDocs) // alot of details printed

//Phase 3: convert the chunks into vectors, for it we req vector embedding model
const embeddings = new GoogleGenerativeAIEmbeddings({//Gemini embedding model configure
    apiKey: process.env.GEMINI_API_KEY,
     modelName: "gemini-embedding-001",
   // model: "models/embedding-001",//this model will convert the word into vector
  });

  console.log("Embedding model configured");

//Phase 4: Database ko bhi configure kr lete hai, Initialize Pinecone Client
const pinecone = new Pinecone();//Pinecone client, ye automatically Apikey ko .env file se utha leta hai
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
console.log("Pinecode configured");


//Phase5 : langchain ko chunking, all embeddings, & in which databases u wanna store give these 3 info
// it will complete this all 3 in 1 steps
for (let i = 0; i < chunkedDocs.length; i++) {//सारे chunks पर loop
  try {
    const vec = await embeddings.embedQuery(//Current chunk को vector में convert eg: Chunk Text ko [0.234, -0.112, ...] me convert krna
      chunkedDocs[i].pageContent
    );

    console.log(
      `Chunk ${i}: text=${chunkedDocs[i].pageContent.length}, vector=${vec.length}`
    );
  } catch (err) {
    console.log(`FAILED CHUNK: ${i}`);
    console.error(err);
    break;
  }
}

// await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
//     pineconeIndex,
//     maxConcurrency: 1,
//   });
// console.log("Data Stored Successfully");

for (let i = 0; i < chunkedDocs.length; i++) {//Manual Upload Loop
  const vector = await embeddings.embedQuery(//Current chunk → vector
    chunkedDocs[i].pageContent
  );

  if (!vector || vector.length === 0) continue;//agr vector empty h to skip current chunk and aage badho

  await pineconeIndex.upsert([//Pinecone में insert/update
    {
      id: `chunk-${i}`,
      values: vector,
      metadata: {//Extra info
        text: chunkedDocs[i].pageContent,//Original text भी save कर रहे हो 
      },
    },
  ]);

  console.log(`Stored ${i + 1}/${chunkedDocs.length}`);
}

}
indexDocument();
