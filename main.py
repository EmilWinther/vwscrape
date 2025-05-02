import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time

# Will scrape every single carid in the json file to get the zip code and city.. So i can find a car near me since vw doesnt show where their cars are.
# The script takes a while. The result of the script is in result.txt.

# Load car IDs from JSON file
with open("cars.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    car_ids = [item["Id"] for item in data.get("Items", [])]

# Configure headless Chrome
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

base_url = "https://www.awebsite.dk/app/dk/brugte-biler/detaljer/?carId={}"
results = []

for car_id in car_ids:
    url = base_url.format(car_id)
    driver.get(url)
    time.sleep(2)  # Adjust if needed

    soup = BeautifulSoup(driver.page_source, "html.parser")

    zip_city_elem = soup.find("span", id="departmentZipCity")
    zip_city = zip_city_elem.text.strip() if zip_city_elem else "Not found"

    results.append({
        "car_id": car_id,
        "zip_city": zip_city
    })

driver.quit()

# Output results
for result in results:
    print(f"{result['car_id']}: {result['zip_city']}")
