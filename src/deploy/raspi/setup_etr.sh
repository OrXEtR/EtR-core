#!/usr/bin/env bash
set -e

sudo apt update
sudo apt install -y git python3-venv python3-pip

# Cloner si besoin
cd /home/oryx
if [ ! -d EtR-core ]; then
  git clone https://github.com/OrXEtR/EtR-core.git
fi
cd EtR-core

# Environnement virtuel + deps
python3 -m venv .venv
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt

# Service systemd
sudo install -m 644 deploy/etr.service /etc/systemd/system/etr.service
sudo systemctl daemon-reload
sudo systemctl enable etr.service
sudo systemctl restart etr.service

echo "OK. Service EtR actif sur le port 8080."
