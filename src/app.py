from flask import Flask
import psutil

app = Flask(__name__)

@app.route("/")
def root():
    return {"service": "EtR", "cpu": psutil.cpu_percent(interval=0.2)}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
