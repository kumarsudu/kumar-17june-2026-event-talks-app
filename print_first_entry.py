import feedparser
import requests
from bs4 import BeautifulSoup

url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
response = requests.get(url, timeout=10)
feed = feedparser.parse(response.text)

if feed.entries:
    first = feed.entries[0]
    print(f"Title: {first.title}")
    content_val = first.content[0].value
    print("--- HTML CONTENT ---")
    print(content_val)
    print("--- END HTML CONTENT ---")
    
    # Let's test splitting it by <h3> elements or similar
    soup = BeautifulSoup(content_val, 'html.parser')
    
    current_type = None
    current_elements = []
    updates = []
    
    # The elements are usually flat siblings, like <h3> followed by <p>, <ul>, etc.
    for element in soup.contents:
        if element.name == 'h3':
            if current_type and current_elements:
                updates.append({
                    'type': current_type,
                    'html': "".join(str(e) for e in current_elements),
                    'text': "".join(e.get_text() for e in current_elements).strip()
                })
            current_type = element.get_text().strip()
            current_elements = []
        elif element.name is not None:
            current_elements.append(element)
            
    if current_type and current_elements:
        updates.append({
            'type': current_type,
            'html': "".join(str(e) for e in current_elements),
            'text': "".join(e.get_text() for e in current_elements).strip()
        })
        
    print(f"\nParsed {len(updates)} individual updates:")
    for idx, upd in enumerate(updates):
        print(f"Update #{idx+1} | Type: {upd['type']}")
        print(f"HTML: {upd['html'][:150]}...")
        print(f"Text: {upd['text'][:150]}...")
        print("-" * 20)
