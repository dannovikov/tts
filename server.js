/* 
    User visits the URL:
        https://tts.dantheory.com/?username=TwitchUsername
    and starts hearing the chat of the streamer in the username parameter.

    Add the URL as a browser source in OBS and have TTS forever, as needed.

    Terminology in this program:
        - twitch_connections: 
            - Chat-fetching Twitch clients 
            - connect to the Twitch chat of a streamer and listen for messages
        - listeners: 
            - Clients of this server (OBS clients, Browsers,) 
            - we send the streamer's TTS audio to these clients
        - channel_configs:
            - A dictionary that stores the TTS settings of each channel
            - including bit price, character limit, whitelist, and superlist.
*/

const express = require("express");
const OpenAI = require("openai");
const tmi = require("tmi.js");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
setAPIKeys();
const app = express();
const wss = new WebSocket.Server({ noServer: true });
const openai = new OpenAI();

app.use(express.static("public"));

const listeners = {};
const twitch_connections = {};
const statistics_file = getStatisticsFilePath();
const statistics = readStatisticsFromFile();
const chatter_desired_voices = readChatterDesiredVoicesFromFile();
const channel_configs = readChannelConfigsFromFile();

const voice_map = {
    1: "alloy",
    2: "echo",
    3: "fable",
    4: "onyx",
    5: "nova",
    6: "shimmer",
};

if (!channel_configs["default"]) {
    channel_configs["default"] = {
        tts_bit_price: 0,
        character_limit: 500,
        whitelist: [],
        use_whitelist: false,
        superlist: [],
        tts_symbol: "",
    };
}

let interval = setInterval(function ping() {
    pingListeners();
    saveStatistics();
    saveChannelConfigs();
    saveChatterDesiredVoices();
}, 30000); // Ping every 30 seconds

wss.on("connection", function (ws, request) {
    const streamer = getStreamerNameFromURL(request);
    listeners[streamer].push(ws);

    if (!twitch_connections[streamer]) {
        const client = connect(streamer);

        client.on("message", async (channel, tags, message, self) => {
            initialize(channel, tags);
            if (!satisfiesChannelConfig(channel, tags, message)) return;
            message = parseCommands(channel, tags, message);
            if (!message) return;
            await TTS(message, tags, streamer, channel);
        });

        client.on("cheer", async (channel, tags, message) => {
            initialize(channel, tags);
            if (!satisfiesChannelConfig(channel, tags, message, (is_cheer = true))) return;
            message = parseCommands(channel, tags, message, (is_cheer = true));
            if (!message) return;
            await TTS(message, tags, streamer, channel);
        });

        twitch_connections[streamer] = client; // Store the client
    }

    ws.on("close", () => {
        disconnectListener(streamer, ws);
        console.log(`Client disconnected from ${streamer}`);
    });
});

function setAPIKeys() {
    let key = fs.readFileSync("openai_api_key", "utf8");
    process.env.OPENAI_API_KEY = key.trim();
}

function getStreamerNameFromURL(request) {
    const streamer = new URL(request.url, `http://${request.headers.host}`).searchParams.get("streamer").toLowerCase();
    if (!listeners[streamer]) listeners[streamer] = [];
    return streamer;
}

function connect(streamer) {
    const client = new tmi.Client({ channels: [streamer] });
    client.connect();
    console.log(`Client connected to ${streamer}`);
    return client;
}

function initialize(channel, tags) {
    if (!channel_configs[channel]) {
        channel_configs[channel] = channel_configs["default"];
        console.log(`Created channel config for ${channel}`);
    }
    if (!chatter_desired_voices[tags.username]) {
        chatter_desired_voices[tags.username] = 1;
    }
}

function parseCommands(channel, tags, message, is_cheer = false) {
    // A recursive parser that supports multiple commands in a single message

    const parsed = message.trim().split(/\s+/);
    let tokens_processed = 0;

    // !voice <n>
    if (message.startsWith("!voice")) {
        if (parsed.length >= 2) {
            const voice = parseInt(parsed[1].trim());
            if (voice_map[voice]) {
                chatter_desired_voices[tags.username] = voice;
                console.log("Chatter", tags.username, "has selected voice", voice_map[voice]);
            } else {
                chatter_desired_voices[tags.username] = 1;
            }
            tokens_processed = 2;
        } else {
            tokens_processed = 1;
        }
    }

    // !ttsbits <n=0>
    else if (message.startsWith("!ttsbits")) {
        if (parsed.length >= 2) {
            const bits = parseInt(parsed[1].trim());
            if (bits || bits === 0) {
                channel_configs[channel]["tts_bit_price"] = bits;
                console.log(`Set bit price for ${channel} to ${bits}`);
                speak(`Bit price for TTS set to ${bits} bits for ${channel}`, channel);
                tokens_processed = 2;
            } else {
                channel_configs[channel]["tts_bit_price"] = 0;
                console.log(`Set bit price for ${channel} to 0`);
                speak(`Bit price for TTS set to 0 bits for ${channel}`, channel);
                tokens_processed = 1;
            }
        }
    }

    // !let <username>
    else if (message.startsWith("!let")) {
        const superlist = channel_configs[channel]["superlist"];
        let target_user;
        if (parsed.length >= 2) {
            target_user = parsed[1].trim().replace("@", "").toLowerCase();
            let found = false;
            for (let i = 0; i < superlist.length; i++) {
                if (superlist[i]["user"] === target_user) {
                    superlist.splice(i, 1);
                    found = true;
                    break;
                }
            }
            if (found) speak(`Removed ${target_user} from the superlist`, channel);
            else {
                superlist.push(target_user);
                speak(`Added ${target_user} to the superlist`, channel);
            }
            tokens_processed = 2;
        }
    }

    // !charlimit <n>
    else if (message.startsWith("!charlimit")) {
        if (parsed.length >= 2) {
            const limit = parseInt(parsed[1].trim());
            if (limit && limit >= 0 && limit <= 500) {
                channel_configs[channel]["character_limit"] = limit;
                console.log(`Set character limit for ${channel} to ${limit}`);
                speak(`Character limit for TTS set to ${limit} for ${channel}`, channel);
                tokens_processed = 2;
            } else {
                channel_configs[channel]["character_limit"] = 500;
                console.log(`Set character limit for ${channel} to 500`);
                speak(`Character limit for TTS set to 500 for ${channel}`, channel);
                tokens_processed = 1;
            }
        }
    }

    // !superlist
    else if (message.startsWith("!superlist")) {
        speak(`Superlist for ${channel}: ${channel_configs[channel]["superlist"].join(", ")}`, channel);
        tokens_processed = 1;
    }

    // Admin commands
    if (channel === "#loldayzo" && tags.username === "loldayzo") {
        if (message.startsWith("!announce")) {
            const announcement = message.slice(9);
            for (const streamer in listeners) {
                speak(announcement, streamer);
            }
        }
        if (message.startsWith("!tell")) {
            if (parsed.length >= 3) {
                const target = parsed[1].trim();
                const announcement = parsed.slice(2).join(" ");
                if (listeners[target]) {
                    speak(`Message from Dayzo to ${target}: ${announcement}`, target);
                }
            }
        }
    }

    if (tokens_processed > 0) {
        message = parsed.slice(tokens_processed).join(" ");
        if (message.startsWith("!")) parseCommands(channel, tags, message);
    }
    return message;
}

async function TTS(message, tags, streamer, channel) {
    try {
        await speak(message, streamer, chatter_desired_voices[tags.username]);
        recordStatistics({
            streamer: streamer,
            voice: chatter_desired_voices[tags.username],
            channel: channel,
            username: tags.username,
            message: message,
        });
        cleanUpAudioFiles(streamer, getDate().toISOString().replace(/:/g, "-"));
    } catch (error) {
        console.error("Error processing speech:", error);
    }
}

async function speak(message, streamer, voice = 1) {
    if (streamer.startsWith("#")) streamer = streamer.slice(1);
    const timestamp = getDate().toISOString().replace(/:/g, "-");
    const filePath = path.join(__dirname, "public", `${streamer}_${timestamp}.mp3`);

    const response = await callWhisperAPI(message, voice);
    const buffer = Buffer.from(await response.arrayBuffer());

    fs.writeFile(filePath, buffer, (err) => {
        if (err) {
            console.error("Failed to save file:", err);
            return;
        }
        // console.log(`Saved audio to ${filePath}`);
        if (listeners[streamer]) {
            listeners[streamer].forEach((listener) => {
                console.log(`Sending audio to ${streamer}`);
                listener.send(JSON.stringify({ audioUrl: `/${streamer}_${timestamp}.mp3` }));
            });
        }
    });
}

function satisfiesChannelConfig(channel, tags, message, is_cheer = false) {
    console.log("processing message", message);
    const channel_config = channel_configs[channel];
    const chatter = tags.username;

    if (chatter === channel.slice(1)) {
        console.log(`${channel}: Allowing message from ${chatter} for: streamer`);
        return true;
    }

    if (channel_config["superlist"].includes(chatter)) {
        console.log(`${channel}: Allowing message from ${chatter} for: superlist`);
        return true;
    }

    if (channel_config["tts_bit_price"] > 0) {
        console.log(
            `${chatter} has ${tags.bits} bits out of ${channel_config["tts_bit_price"]} required for ${channel}`
        );
        return is_cheer && tags.bits >= channel_config["tts_bit_price"];
    }

    if (message.length > channel_config["character_limit"]) {
        console.log(`${chatter} exceeded character limit in ${channel}`);
        return false;
    }

    if (channel_config["use_whitelist"] && !channel_config["whitelist"].includes(tags.username)) {
        console.log(`${chatter} is not on the whitelist for ${channel}`);
        return false;
    }

    return true;
}

async function callWhisperAPI(message, voice = 1) {
    console.log("Sending message to OpenAI: ", message);
    const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice_map[voice],
        input: message,
    });
    return response;
}

function recordStatistics(data) {
    const { streamer, timestamp, voice, channel, chatter, message, usage } = data;
    if (!statistics[streamer]) {
        statistics[streamer] = {
            totalMessages: 0,
            totalCharacters: 0,
            averageCharacters: 0,
            voices: {},
            chatters: [],
        };
    }

    const stats = statistics[streamer];
    stats.totalMessages += 1;
    stats.totalCharacters += message.length;
    stats.averageCharacters = stats.totalCharacters / stats.totalMessages;

    if (!stats.voices[voice]) {
        stats.voices[voice] = 0;
    }
    stats.voices[voice] += 1;
    if (!stats.chatters.includes(chatter)) {
        stats.chatters.push(chatter);
    }
}

function saveStatistics() {
    const data = JSON.stringify(statistics, null, 2);
    fs.writeFile(statistics_file, data, (err) => {
        if (err) {
            console.error("Failed to write statistics file:", err);
        }
    });
}

function saveChannelConfigs() {
    const data = JSON.stringify(channel_configs, null, 2);
    fs.writeFile(path.join(__dirname, "user_configurations", "channel_configs.json"), data, (err) => {
        if (err) {
            console.error("Failed to write config file:", err);
        }
    });
}

function saveChatterDesiredVoices() {
    const data = JSON.stringify(chatter_desired_voices, null, 2);
    fs.writeFile(path.join(__dirname, "user_configurations", "chatter_desired_voices.json"), data, (err) => {
        if (err) {
            console.error("Failed to write chatter desired voices file:", err);
        }
    });
}

function readStatisticsFromFile() {
    if (fs.existsSync(statistics_file)) {
        const data = fs.readFileSync(statistics_file);
        return JSON.parse(data);
    } else {
        console.log(`Creating a new statistics file for ${getDate()}`);
        fs.writeFileSync(statistics_file, JSON.stringify({}));
    }
    return {};
}

function readChannelConfigsFromFile() {
    const filePath = path.join(__dirname, "user_configurations", "channel_configs.json");
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    } else {
        console.log("Creating a new config file");
        fs.writeFileSync(filePath, JSON.stringify({}));
    }
    return {};
}

function readChatterDesiredVoicesFromFile() {
    const filePath = path.join(__dirname, "user_configurations", "chatter_desired_voices.json");
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    } else {
        console.log("Creating a new chatter desired voices file");
        fs.writeFileSync(filePath, JSON.stringify({}));
    }
    return {};
}

function getStatisticsFilePath() {
    ``;
    const today = getDate();
    const date = today.toISOString().split("T")[0];
    const file = `statistics_${date}.json`;
    return path.join(__dirname, file);
}

function cleanUpAudioFiles(streamer, timestamp) {
    fs.readdir(path.join(__dirname, "public"), (err, files) => {
        if (err) {
            console.error("Failed to read directory:", err);
            return;
        }
        files.forEach((file) => {
            deleteOldFile(file, streamer, timestamp);
        });
    });
}

function deleteOldFile(file, streamer, timestamp) {
    if (file.startsWith(streamer) && file !== `${streamer}-${timestamp}.mp3`) {
        let file_timestamp;
        try {
            file_timestamp = parseFileTimestamp(file, streamer);
        } catch (error) {
            console.error("Skipping file", file, "due to: Failed to parse file timestamp:", error);
            return;
        }
        const file_date = getDate(file_timestamp);
        const current_date = getDate();
        const diff = current_date - file_date;
        const one_minute = 60 * 1000;
        if (diff > one_minute) {
            fs.unlink(path.join(__dirname, "public", file), (err) => {
                if (err) {
                    console.error("Failed to delete file:", err);
                }
            });
        }
    }
}

function getStreamerNameFromURL(request) {
    const streamer = new URL(request.url, `http://${request.headers.host}`).searchParams.get("streamer").toLowerCase();
    if (!listeners[streamer]) listeners[streamer] = [];
    return streamer;
}

function pingListeners() {
    wss.clients.forEach(function each(ws) {
        ws.ping();
    });
}

function disconnectListener(streamer, ws) {
    listeners[streamer] = listeners[streamer].filter((listener) => listener !== ws);
    if (listeners[streamer].length === 0) {
        twitch_connections[streamer].disconnect();
        delete twitch_connections[streamer];
    }
}

function getDate(date = "now") {
    if (date === "now") {
        return new Date();
    } else {
        return new Date(date);
    }
}

function parseFileTimestamp(file, streamer) {
    const file_date_part = file.slice(streamer.length + 1, -4);
    const file_date_time = file_date_part.split("T")[1].replace(/-/g, ":");
    const file_timestamp = new Date(`${file_date_part.split("T")[0]}T${file_date_time}`);
    return file_timestamp;
}

const server = app.listen(3000, () => {
    console.log("Server running on port 3000");
});

server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (pathname === "/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
        });
    } else {
        socket.destroy();
    }
});
