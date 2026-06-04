from flask import Blueprint, request, jsonify

localized_threats_bp = Blueprint("localized_threats_bp", __name__)

@localized_threats_bp.route("/local-pulse", methods=["GET"])
def get_local_pulse(lat: float, lon: float):
    # PyMongo Geospatial Aggregation Pipeline
    pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": [lon, lat]},
                "distanceField": "distance_meters",
                "maxDistance": 15000,
                "spherical": True
            }
        },
        {
            "$group": {
                "_id": "$disease_name",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    # Executing the blocking query safely
    results = list(db.scans.aggregate(pipeline))
    
    if not results:
        return jsonify({"total_scans": 0, "top_threat": "None", "threat_count": 0})
        
    return jsonify({
        "total_local_scans": sum(item['count'] for item in results),
        "top_threat": results[0]["_id"],
        "threat_count": results[0]["count"]
    })