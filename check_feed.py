import feedparser
import requests

url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
print(f"Fetching feed from {url}...")
try:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    print("Feed downloaded successfully.")
    
    feed = feedparser.parse(response.text)
    print(f"Feed Title: {feed.feed.get('title', 'N/A')}")
    print(f"Number of entries: {len(feed.entries)}")
    
    if feed.entries:
        first = feed.entries[0]
        print("\nFirst entry keys:", list(first.keys()))
        print(f"Title: {first.get('title', 'N/A')}")
        print(f"Updated/Published: {first.get('updated', first.get('published', 'N/A'))}")
        print(f"Link: {first.get('link', 'N/A')}")
        print(f"ID: {first.get('id', 'N/A')}")
        print("\nContent snippet:")
        content = first.get('content', [{}])[0].get('value', first.get('summary', 'No content'))
        print(content[:500])
    else:
        print("No entries found in feed.")
except Exception as e:
    print(f"Error: {e}")
