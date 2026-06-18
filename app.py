import os
import time
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Simple in-memory cache
cache = {
    "data": None,
    "last_fetched": 0
}
CACHE_DURATION = 300  # 5 minutes cache

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_release_notes():
    """Fetches and parses the BigQuery release notes feed into granular updates."""
    response = requests.get(FEED_URL, timeout=15)
    response.raise_for_status()
    
    feed = feedparser.parse(response.text)
    all_updates = []
    
    for entry in feed.entries:
        content_val = entry.content[0].value if 'content' in entry else entry.get('summary', '')
        soup = BeautifulSoup(content_val, 'html.parser')
        headers = soup.find_all('h3')
        
        entry_title = entry.get('title', 'Unknown Date')
        entry_updated = entry.get('updated', '')
        entry_link = entry.get('link', '')
        entry_id = entry.get('id', '')
        
        parsed_updates = []
        if headers:
            for idx, h3 in enumerate(headers):
                update_type = h3.get_text().strip()
                siblings = []
                sibling = h3.next_sibling
                while sibling and sibling.name != 'h3':
                    siblings.append(sibling)
                    sibling = sibling.next_sibling
                
                # Reconstruct HTML and raw text
                html_content = "".join(str(s) for s in siblings)
                text_content = "".join(s.get_text() if hasattr(s, 'get_text') else str(s) for s in siblings).strip()
                
                # Clean up multiple whitespaces/newlines for clean tweeting
                clean_text = " ".join(text_content.split())
                
                parsed_updates.append({
                    "id": f"{entry_id}_{idx}",
                    "date": entry_title,
                    "updated": entry_updated,
                    "link": entry_link,
                    "type": update_type,
                    "html": html_content,
                    "text": clean_text
                })
        else:
            # Fallback if no <h3> headings are found in the entry content
            clean_text = " ".join(soup.get_text().strip().split())
            parsed_updates.append({
                "id": f"{entry_id}_0",
                "date": entry_title,
                "updated": entry_updated,
                "link": entry_link,
                "type": "Update",
                "html": content_val,
                "text": clean_text
            })
            
        all_updates.extend(parsed_updates)
        
    return all_updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = time.time()
    
    if force_refresh or not cache["data"] or (now - cache["last_fetched"] > CACHE_DURATION):
        try:
            updates = parse_release_notes()
            cache["data"] = updates
            cache["last_fetched"] = now
            return jsonify({
                "success": True,
                "source": "network" if force_refresh or (now - cache["last_fetched"] > CACHE_DURATION) else "cached",
                "last_fetched": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(cache["last_fetched"])),
                "updates": updates
            })
        except Exception as e:
            # If network fetch fails, fallback to cache if available
            if cache["data"]:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "source": "fallback_cache",
                    "last_fetched": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(cache["last_fetched"])),
                    "updates": cache["data"]
                })
            return jsonify({
                "success": False,
                "error": str(e),
                "updates": []
            }), 500
            
    return jsonify({
        "success": True,
        "source": "cache",
        "last_fetched": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(cache["last_fetched"])),
        "updates": cache["data"]
    })

if __name__ == '__main__':
    # Running on localhost port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
