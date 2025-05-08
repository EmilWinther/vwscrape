import json
from shapely.geometry import shape, Polygon, LinearRing

def determine_winding_order(coords):
    ring = LinearRing(coords)
    return "counter-clockwise" if ring.is_ccw else "clockwise"

def classify_point(coord, min_lon, max_lon, min_lat, max_lat):
    lon, lat = coord
    epsilon = 1e-6
    if abs(lat - min_lat) < epsilon:
        if abs(lon - min_lon) < epsilon:
            return "Bottom-Left"
        elif abs(lon - max_lon) < epsilon:
            return "Bottom-Right"
    elif abs(lat - max_lat) < epsilon:
        if abs(lon - min_lon) < epsilon:
            return "Top-Left"
        elif abs(lon - max_lon) < epsilon:
            return "Top-Right"
    return "Unknown"

def load_and_analyze_geojson(file_path):
    with open(file_path, 'r') as f:
        geojson_data = json.load(f)

    geom = shape(geojson_data)

    if not isinstance(geom, Polygon):
        print("Only Polygon geometry is supported.")
        return

    coords = list(geom.exterior.coords)
    coords = coords[:-1] if coords[0] == coords[-1] else coords  # exclude closure point

    winding = determine_winding_order(coords)

    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    min_lon, max_lon = min(lons), max(lons)
    min_lat, max_lat = min(lats), max(lats)

    print(f"Winding order: {winding}")
    print(f"Coordinates with spatial labels (in input order):")
    for c in coords:
        label = classify_point(c, min_lon, max_lon, min_lat, max_lat)
        print(f"  {label:12} -> {c}")

if __name__ == "__main__":
    geojson_file = "polygon.geojson"
    load_and_analyze_geojson(geojson_file)
