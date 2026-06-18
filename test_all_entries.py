import feedparser
import requests
from bs4 import BeautifulSoup

url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
response = requests.get(url, timeout=10)
feed = feedparser.parse(response.text)

print(f"Total entries: {len(feed.entries)}")
for i, entry in enumerate(feed.entries):
    content_val = entry.content[0].value if 'content' in entry else entry.get('summary', '')
    soup = BeautifulSoup(content_val, 'html.parser')
    headers = soup.find_all('h3')
    
    parsed_updates = []
    if headers:
        for h3 in headers:
            update_type = h3.get_text().strip()
            siblings = []
            sibling = h3.next_sibling
            while sibling and sibling.name != 'h3':
                siblings.append(sibling)
                sibling = sibling.next_sibling
            
            html_content = "".join(str(s) for s in siblings)
            text_content = "".join(s.get_text() if hasattr(s, 'get_text') else str(s) for s in siblings).strip()
            
            parsed_updates.append({
                'type': update_type,
                'html': html_content,
                'text': text_content
            })
    else:
        parsed_updates.append({
            'type': 'Update',
            'html': content_val,
            'text': soup.get_text().strip()
        })
        
    print(f"Entry {i+1}: '{entry.title}' (Published: {entry.get('updated', 'N/A')}) - Parsed into {len(parsed_updates)} sub-updates.")
    for j, upd in enumerate(parsed_updates):
        print(f"  [{j+1}] Type: {upd['type']} | Text length: {len(upd['text'])}")
    print("-" * 40)
