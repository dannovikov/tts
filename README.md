# Twitch Chat Text-to-Speech
Twitch chat TTS with a super easy 2-Second(™) set-up process. 

```https://tts.dantheory.com/?username=YourTwitchUsername```

Add this page as a browser source in your streaming platform to hear your Twitch chat.

## Usage Instructions
### Setup as an OBS Browser source
In OBS, add a new source to your scene of type `Browser`. In the `URL` field, type:

 ```https://tts.dantheory.com/?username=YourTwitchUsername```
 
Replace `YourTwitchUsername` with your actual Twitch username.
*Note*: this source needs to be in every scene where you want TTS.

### Chat Commands

Use chat commands to control the service:

- `!tts on` – enable text-to-speech.
- `!tts off` – disable text-to-speech (no messages are sent to OpenAI).
- `!tts voice <1-6>` – change your voice.
- `!ttsbits <n>` – set the bit price for TTS messages.
- `!tts emotes on` / `!tts emotes off` – toggle reading emotes.
- `!tts ban <username>` – ban a user from TTS.
- `!tts unban <username>` – unban a user from TTS.
- `!tts banlist` – list banned users.
- `!tts let <username>` – allow a user to bypass TTS restrictions.
- `!tts letlist` – list users who are allowed.
- `!tts charlimit <n>` – set the character limit (0–500).
- `!tts help` – list all TTS commands.

## For programmers: Building Instructions
If you want to run the server yourself, 
- install the dependancies with `npm install`,
- create a file `openai_api_key` in the top level directory, 
- run the server with `node server.js`, and
- connect to `localhost:3000/?username=YourTwitchUsername`

There are three main files to concern yourself with, `server.js`, `public/app.js`, and `public/index.html`.


