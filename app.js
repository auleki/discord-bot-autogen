import dotenv from 'dotenv'
dotenv.config()
import axios from 'axios'
import { Client, IntentsBitField } from "discord.js"

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
})

client.on('ready', () => {
    console.log('This bot is active!')
})

client.on('messageCreate', async (message) => {
    const autogenURL = process.env.AUTO_GEN_API || ""
    const userText = message.content
    const channel = client.channels.cache.get(process.env.CHANNEL_ID || "");
    let formattedResponse = "";
    let currentRole = null;

    if (userText.startsWith("/AG")) {
        channel.send("One minute while I look into this...")

        try {
            const pattern = /\/AG/g
            const cleanedUserText = userText.replace(pattern, '').trim()
            const sentMessageResponse = cleanedUserText && await axios.post(`${autogenURL}/discord-message`, { message: cleanedUserText })
            await message.channel.sendTyping()
            if (sentMessageResponse.data) {
                for (const message of sentMessageResponse.data) {
                    if (message.role !== currentRole) {
                        // If the role has changed, add a new line for separation
                        formattedResponse += "\n";
                        currentRole = message.role;
                    }

                    // Append the message content with the role
                    if (message.role === "assistant") {
                        formattedResponse += `Assistant: ${message.content}\n`;
                    } else if (message.role === "user") {
                        formattedResponse += `User: ${message.content}\n`;
                    }
                }
            }
        } catch (error) {
            console.log('Could not get error from AI', error)
        } finally {
            formattedResponse && channel.send(formattedResponse)
        }
    }

})

client.login(process.env.DS_TOKEN)
