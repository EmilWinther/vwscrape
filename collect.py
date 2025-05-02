import requests
import json
import time

# Will fetch all sites with ID.3 cars from a car site in Denmark.
# and save them to JSON files. Each page will be saved as a separate file.
BASE_URL = "https://www.awebsite.dk/app/dk/usedcarssearchlistpage/search"
PARAMS_TEMPLATE = {
    "page": 1,
    "pageSize": 8,
    "usedCarsFrontPageContentId": 1017,
    "yearfrom": 2014,
    "yearto": 2026,
    "businesstype": 0,
    "model": "ID.3",
    "kmfrom": 0,
    "kmto": 500000,
    "pricefrom": 0,
    "priceto": 1200000,
    "sortoption": 0
}

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

def fetch_and_save():
    page = 1
    while True:
        print(f"Fetching page {page}...")
        params = PARAMS_TEMPLATE.copy()
        params["page"] = page

        try:
            response = requests.get(BASE_URL, params=params, headers=HEADERS)
            response.raise_for_status()
        except requests.RequestException as e:
            print(f"Request failed on page {page}: {e}")
            break

        try:
            data = response.json()
        except json.JSONDecodeError:
            print(f"Failed to parse JSON on page {page}.")
            break

        items = data.get("Items", [])
        if not items:
            print("No more items found. Stopping.")
            break

        file_name = f"page_{page}.json"
        with open(file_name, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"Saved {file_name}")
        if not data.get("HasNextPage", False):
            print("No more pages indicated. Stopping.")
            break

        page += 1
        time.sleep(1)  # polite crawling delay

if __name__ == "__main__":
    fetch_and_save()
