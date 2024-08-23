from azapi import AZlyrics
import sys
import json

# Names should be passed corrrectly
# If you can't remember, use google or duckduckgo
# AZlyrics('google')
def get_lyrics(song, artist):
    api = AZlyrics()
    try: 
        api.artist = artist
        api.title = song

        Lyrics = api.getLyrics()
        return Lyrics
    except Exception as e:
        print(f"Error getting lyrics: {e}")
        return None



if __name__ == "__main__":
    song = sys.argv[1]
    artist = sys.argv[2]
    lyrics = get_lyrics(song, artist)
    print(json.dumps({"lyrics": lyrics}))