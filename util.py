import os
import json

# Will extract the ids from the json file and save them to a new json file.
def extract_ids_from_json_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as file:
        try:
            data = json.load(file)
        except json.JSONDecodeError:
            print(f"Warning: Skipping malformed JSON file: {filepath}")
            return []

        ids = []

        def collect_ids(obj):
            if isinstance(obj, list):
                for item in obj:
                    collect_ids(item)
            elif isinstance(obj, dict):
                for key, value in obj.items():
                    if key == "Id" and isinstance(value, str):
                        ids.append(value)
                    else:
                        collect_ids(value)

        collect_ids(data)
        return ids

def collect_ids_from_current_directory(output_file='collected_ids.json'):
    all_ids = []

    for filename in os.listdir('.'):
        if filename.endswith('.json') and filename != output_file:
            ids = extract_ids_from_json_file(filename)
            all_ids.extend(ids)

    with open(output_file, 'w', encoding='utf-8') as out_file:
        json.dump(all_ids, out_file, indent=2)
    print(f"Collected {len(all_ids)} IDs into {output_file}")

if __name__ == '__main__':
    collect_ids_from_current_directory()
