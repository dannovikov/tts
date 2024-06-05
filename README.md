# Twitch Chat Text-to-Speech
Twitch chat TTS with extremely high quality voices, and a super easy, 2-Second™ set-up process. It works on all streaming platforms, including mobile apps. Disconnect-resistant. Add this page as a browser source in your streaming platform to hear your Twitch chat come to life.

```https://tts.dantheory.com/?username=YourTwitchUsername```

## Setup as an OBS Browser source

In OBS, add a new source to your scene of type `Browser`. In the `URL` field, type:

 ```https://tts.dantheory.com/?username=YourTwitchUsername```
 
Replace `YourTwitchUsername` with your actual Twitch username.
*Note*: this source needs to be in every scene where you want TTS.

## Setup in your internet browser
If you don't want to use OBS Browser source, an alternative is to visit the URL in your internet browser like Chrome, Safari, etc. You may need to click a few times on the page, for the audio to start playing. But either way, the audio will start to play as the chats start coming in.


## Run the server yourself
If you want to run the server yourself, 
- install the dependancies with `npm install`,
- create a file `openai_api_key` in the top level directory, and
- run the server with `node server.js`


