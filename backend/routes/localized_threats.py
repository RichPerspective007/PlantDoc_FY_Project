from flask import Blueprint, request, jsonify, g
from utils.wrappers import token_required
from utils.load_mongo_client import get_db
db = get_db()
scans = db["scans"]

localized_threats_bp = Blueprint("localized_threats_bp", __name__)

@localized_threats_bp.route("/local-pulse", methods=["GET"])
@token_required
def get_local_pulse():
    # PyMongo Geospatial Aggregation Pipeline
    lat = float(request.args.get("lat"))
    lon = float(request.args.get("lon"))
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
    results = list(scans.aggregate(pipeline))
    
    if not results:
        return jsonify({"total_scans": 0, "top_threat": "None", "threat_count": 0})
        
    return jsonify({
        "total_local_scans": sum(item['count'] for item in results),
        "top_threat": results[0]["_id"],
        "threat_count": results[0]["count"]
    })