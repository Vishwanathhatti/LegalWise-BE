import conversationModel from "../models/conversation.model.js";
import MessageModel from "../models/message.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

export const addMessage = async (req, res) => {
  const gemini_api_key = process.env.GEMINI_API_KEY;

  try {
    const genAI = new GoogleGenerativeAI(gemini_api_key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const { content } = req.body;
    const conversationId = req.params.id;
    const userId = req.id;

    if (!conversationId) {
      return res
        .status(400)
        .json({ message: "Error fetching conversation ID" });
    }
    if (!content) {
      return res
        .status(400)
        .json({ message: "Please enter your query", success: false });
    }

    // Fetch conversation and populate messages
    const conversation = await conversationModel
      .findById(conversationId)
      .populate({
        path: "messages",
        select: "role content timestamp",
        options: { sort: { timestamp: -1 }, limit: 10 },
      });

    if (!conversation) {
      return res
        .status(400)
        .json({ message: "Error: Conversation not found", success: false });
    }

    // Ensure user is authorized
    if (conversation.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized action", success: false });
    }

    // Store messages separately before converting to object
    const messagesHistory = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Convert to object for better performance
    const conversationObj = conversation.toObject();

    // console.log("Populated Messages:", messagesHistory);

    // Preparing conversation history for AI prompt
    let history = messagesHistory
      .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
      .reverse()
      .join("\n");

    // Append the latest user message
    history += `\nUser: ${content}`;

    const prompt = `
      You are LegalWise, an AI assistant providing legal guidance related to the Indian judiciary. You must only respond if the user's query is related to one or more of the following topics:
      - Indian laws or legal sections (IPC, CrPC, IT Act, etc.)
      - Document registration (passport, Aadhaar card, PAN, etc.)
      - Cyber crime and IT regulations
      - Legal rights (citizens, women, employees, children, etc.)
      - Filing legal complaints
      - Taxation laws and penalties in India
      - New Indian laws or amendments
      - Punishment, penalty, or sentence under Indian law
      - Indian court case references or summaries
      - Company or business registration and compliance
      - Summary of previous legal topics discussed in this conversation

      If a user asks a question related to these topics, provide helpful information in  using:
      - Paragraphs with <p> tags.
      - Bold text using <b>.
      - Lists using <ul> and <li>.
      - Links using <a href="URL"><u>Link Text</u></a> (underline all links).
      - Do not use triple backticks, Markdown, or any other formatting.
      - Only return raw HTML content. Do not include any surrounding text or code blocks. .
      
      
      If a question is outside these topics, politely reply: 
            If a question is outside these topics, politely reply with:
      <p><b>I am an AI trained to provide information and guidance on Indian judiciary, document registration (like passport, Aadhaar card, etc.), Indian laws, legal rights, complaints registration process, and information or references to old court cases.</b></p>
      <p>I cannot answer questions outside of these topics.</p>

      <p><b>Disclaimer:</b> The information provided is for informational purposes only and should not be considered legal advice. Always consult a qualified legal professional.</p>

      Conversation so far:
      ${history}
    `;

    // Generate AI response
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    // Save new messages (user and AI response)
    const userMessage = new MessageModel({ role: "user", content });
    await userMessage.save();

    const aiMessage = new MessageModel({ role: "bot", content: reply });
    await aiMessage.save();

    // Update conversation with new messages
    await conversationModel.findByIdAndUpdate(conversationId, {
      $push: { messages: { $each: [userMessage._id, aiMessage._id] } },
    });

    // // Fetch updated conversation
    // const updatedConversation = await conversationModel
    //   .findById(conversationId)
    //   .populate({
    //     path: "messages",
    //     model: "Message",
    //     options: { sort: { timestamp: 1 } },
    //   });

    res.status(200).json({
      userMessage,
      aiMessage,
      success: true,
    });
  } catch (error) {
    console.error("Error in addMessage:", error);
    res
      .status(500)
      .json({ message: `Error: ${error.message}`, success: false });
  }
};
