# BigQuery Release Notes Hub 🚀

A modern, high-fidelity web application built with **Python Flask** and **plain vanilla HTML, CSS, and JavaScript**. This application fetches the official BigQuery release notes Atom feed, splits the aggregated daily release entries into granular, category-specific updates, and displays them in a premium glassmorphic dashboard. It also features a built-in Tweet Composer that lets you easily customize and share specific updates directly to X (formerly Twitter).

---

## ✨ Features

* **Granular Release Note Splitting**: Aggregated daily updates from the feed are automatically parsed and grouped into individual cards categorized as `Feature`, `Announcement`, `Change`, `Breaking`, or `Issue`.
* **Fuzzy Live Search**: Instantly find updates by searching through text descriptions, titles, dates, or update categories.
* **Dynamic Category Filters**: Filter updates by clicking custom category chips or the top statistics summary cards.
* **Premium Dark Mode Design**: Visually stunning UI featuring frosted glassmorphic card layouts, curated color systems, and ambient glow backdrops.
* **Integrated Tweet Composer**:
  * Easily customize tweets for any specific update.
  * Live character counter that highlights warning boundaries (280-char limit) and accurately accounts for Twitter's 23-character URL formatting.
  * Direct Twitter Web Intent integration (no API setup required).
* **Caching Layer**: Includes a 5-minute server-side in-memory caching mechanism to optimize feed fetching, with a force-refresh manual update control.

---

## 🛠️ Technology Stack

* **Backend**: Python 3.13 + Flask + BeautifulSoup4 + feedparser + requests
* **Frontend**: HTML5 Semantic Markup + CSS3 Variables (with custom transition effects) + Vanilla JavaScript (ES6)
* **Fonts & Icons**: FontAwesome 6 (CDN) + Google Fonts (*Plus Jakarta Sans*, *Space Grotesk*, *Inter*)

---

## 📂 Project Structure

```text
├── app.py                  # Core Flask server and API endpoint (/api/notes)
├── templates/
│   └── index.html          # Main application page layout and Tweet modal
├── static/
│   ├── css/
│   │   └── styles.css      # Design tokens, variables, cards, and modal styling
│   └── js/
│       └── main.js         # State management, search, filtering, and modal handlers
├── .gitignore              # Python, environment, and IDE ignore configurations
└── README.md               # Project documentation (this file)
```

---

## ⚙️ How to Setup and Run Locally

### 1. Clone the Repository
```bash
git clone https://github.com/kumarsudu/kumar-17june-2026-event-talks-app.git
cd kumar-17june-2026-event-talks-app
```

### 2. Create and Activate a Virtual Environment
```bash
# On Windows
python -m venv venv
.\venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install flask requests feedparser beautifulsoup4
```

### 4. Start the Application
```bash
python app.py
```

### 5. Access the Hub
Open your browser and navigate to:
👉 **`http://127.0.0.1:5000`**

---

## 📡 API Reference

#### `GET /api/notes`
Fetches and returns the parsed list of updates.

* **Query Parameters**:
  * `refresh` (optional): Set to `true` to bypass the server-side cache and fetch directly from Google's feed.
* **Example Response**:
  ```json
  {
    "success": true,
    "source": "network",
    "last_fetched": "2026-06-18 01:43:00",
    "updates": [
      {
        "id": "tag:google.com,2016:bigquery-release-notes#June_17_2026_0",
        "date": "June 17, 2026",
        "updated": "2026-06-17T00:00:00-07:00",
        "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_17_2026",
        "type": "Feature",
        "html": "<p>You can enable autonomous embedding generation...",
        "text": "You can enable autonomous embedding generation on new or existing..."
      }
    ]
  }
  ```

---

## 📄 License
This project is open-source and available under the MIT License.
