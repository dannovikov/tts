# Twitch Text-to-Speech Browser source for OBS

If you ever need text-to-speech for your Twitch channel, just visit in your browser or as a Browser source in OBS.

```https://tts.dantheory.com/?username=YourTwitchUsername```

The webpage is blank, but it connects to your Twitch channel and plays audio of the chats in the URL's "username" parameter. 

## Setup OBS Browser Source (easy)

In OBS, add a knew source to the scene of type Browser. In the URL field, type:

 ```https://tts.dantheory.com/?username=YourTwitchUsername```
 
 replacing `YourTwitchUsername` with your actual Twitch username.

 ## Alternatives:

 ### Open in your internet Browser
 Just point your internet browser to the URL. You may need to click a few times for the audio to start playing. But after a few chats it will start to talk for sure. 


### Run the server yourself
If you want to run the server yourself, 
- install the dependancies with `npm install`,
- create a file `openai_api_key` in the top level directory, and
- run the server with `node server.js`