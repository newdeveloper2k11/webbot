+import os
+import requests
+from flask import Flask, request, jsonify
+from flask_cors import CORS
+
+app = Flask(__name__)
+CORS(app)  # Enable CORS for all routes
+
+API_KEY = os.getenv("api_key")
+
+if not API_KEY:
+    raise RuntimeError("API key not found. Please set the 'api_key' environment variable.")
+
+@app.route('/api/data', methods=['GET', 'POST'])
+def get_meditation_data():
+    """Proxy endpoint to fetch meditation data from external API."""
+    query = request.args.get('query')
+    if request.method == 'POST' and not query:
+        if request.is_json:
+            query = request.get_json().get('query')
+        else:
+            query = request.form.get('query')
+    if not query:
+        return jsonify({"error": "Missing 'query' parameter."}), 400
+
+    api_url = f"https://api.meditation-class.com/data?query={query}"
+    headers = {"Authorization": f"Bearer {API_KEY}"}
+    try:
+        response = requests.get(api_url, headers=headers, timeout=10)
+        response.raise_for_status()
+    except requests.RequestException as exc:
+        return jsonify({"error": str(exc)}), 502
+
+    try:
+        data = response.json()
+    except ValueError:
+        return jsonify({"error": "Invalid JSON response from upstream API."}), 502
+
+    return jsonify(data)
+
+if __name__ == '__main__':
+    app.run(host='0.0.0.0', port=5000, debug=True)
