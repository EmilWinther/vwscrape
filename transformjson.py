import json

# Was used to transform a long array in a json file into the format we wanted to use it in main.py.
input_file = "cars.json"
output_file = "output.json"

with open(input_file, 'r') as f:
    data = json.load(f)

data["items"] = [{"id": item} for item in data.get("items", [])]

with open(output_file, 'w') as f:
    json.dump(data, f, indent=2)
