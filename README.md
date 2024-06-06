# Twitch Chat Text-to-Speech
Twitch chat TTS with a super easy, 2-Second™ set-up process. State-of-the-art voices. Works on all streaming platforms, including mobile apps with spotty connections. 

```https://tts.dantheory.com/?username=YourTwitchUsername```

Add this page as a browser source in your streaming platform to hear your Twitch chat.

## Usage Instructions
### Setup as an OBS Browser source
In OBS, add a new source to your scene of type `Browser`. In the `URL` field, type:

 ```https://tts.dantheory.com/?username=YourTwitchUsername```
 
Replace `YourTwitchUsername` with your actual Twitch username.
*Note*: this source needs to be in every scene where you want TTS.

## For programmers: Building Instructions
If you want to run the server yourself, 
- install the dependancies with `npm install`,
- create a file `openai_api_key` in the top level directory, 
- run the server with `node server.js`, and
- connect to `localhost:3000/?username=YourTwitchUsername`

There are three main files to concern yourself with, `server.js`, `public/app.js`, and `public/index.html`.


