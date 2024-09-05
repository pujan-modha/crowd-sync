import { Client, Account } from "appwrite";

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);

// Debug logging
console.log("Appwrite client initialized with:");
console.log("Endpoint:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
console.log("Project ID:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Test the connection
account
  .get()
  .then(() => console.log("Appwrite connection successful"))
  .catch((error) => console.error("Appwrite connection error:", error));
