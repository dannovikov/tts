## Twitch Chat Text-to-Speech for OBS / Streamlabs
Twitch chat Text-to-Speech with extremely high quality voices and a super easy 2-Second™ set-up process.

Can be used on all streaming platforms, including mobile apps. Disconnect-resistant. 

Enjoy our patented 2-Second™ set-up process (just change the username parameter in the URL) :). 

This is it:

```https://tts.dantheory.com/?username=YourTwitchUsername```

The webpage is blank. When you vist it, it connects to the Twitch channel in the URL's "username" parameter, and plays audio of all incoming chats. 

### Setup as an OBS Browser source

In OBS, add a new source to your scene of type `Browser`. In the `URL` field, type:

 ```https://tts.dantheory.com/?username=YourTwitchUsername```
 
 replacing `YourTwitchUsername` with your actual Twitch username.

*Note* this source needs to be in every scene where you want TTS.

### Setup in your internet browser
An alternative to using OBS Browser source functionality, you can also just visit the URL in your internet browser like Chrome, Safari, etc. You may need to click a few times on the page, for the audio to start playing. But either way, the audio will start to play as the chats start coming in.


## Run the server yourself
If you want to run the server yourself, 
- install the dependancies with `npm install`,
- create a file `openai_api_key` in the top level directory, and
- run the server with `node server.js`


