## Twitch Text-to-Speech for OBS / Streamlabs
Instant text to speech for your twitch channel with extremely high quality voices. Can be used as an OBS (or Streamlabs) Browser source. Mobile streaming apps supported. Disconnect-resistant. Find out more in the features section below. 

```https://tts.dantheory.com/?username=YourTwitchUsername```

The webpage is blank. It connects to the Twitch channel in the URL's "username" parameter and plays audio of all incoming chats. 

### Setup option 1) as an OBS Browser source

In OBS, add a new source to your scene of type `Browser`. In the `URL` field, type:

 ```https://tts.dantheory.com/?username=YourTwitchUsername```
 
 replacing `YourTwitchUsername` with your actual Twitch username.

*Note* this source needs to be in every scene where you want TTS.

## Setup option 2) in your internet browser
Just point your internet browser to the URL. You may need to click a few times for the audio to start playing. But after a few chats it will start to talk for sure. 


## Run the server yourself
If you want to run the server yourself, 
- install the dependancies with `npm install`,
- create a file `openai_api_key` in the top level directory, and
- run the server with `node server.js`


