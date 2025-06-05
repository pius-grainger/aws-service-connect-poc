from flask import Flask, jsonify
import os
import socket
import requests
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

API_SERVICE_URL = os.environ.get('API_SERVICE_URL', 'http://api-service')

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

@app.route('/')
def index():
    hostname = socket.gethostname()
    return jsonify({
        "message": "Hello from Client service!",
        "hostname": hostname,
        "service": "client-service"
    })

@app.route('/call-api')
def call_api():
    try:
        api_url = f"{API_SERVICE_URL}/api/data"
        app.logger.info(f"Calling API at: {api_url}")
        
        response = requests.get(api_url, timeout=5)
        api_data = response.json()
        
        return jsonify({
            "client_service": {
                "hostname": socket.gethostname(),
                "service": "client-service"
            },
            "api_response": api_data
        })
    except Exception as e:
        app.logger.error(f"Error calling API: {str(e)}")
        return jsonify({
            "error": str(e),
            "client_service": {
                "hostname": socket.gethostname(),
                "service": "client-service"
            }
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)