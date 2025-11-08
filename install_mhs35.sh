#!/usr/bin/env bash
set -euo pipefail

LOG="/var/log/install_mhs35.log"
exec > >(tee -a "$LOG") 2>&1
echo "=== $(date) : START install_mhs35 ==="

# 1) Paquets essentiels
sudo apt-get update -y
sudo apt-get install -y lxde lightdm xserver-xorg x11-xserver-utils git bc cmake build-essential

# 2) Activer SPI (Bookworm/Trixie)
if command -v raspi-config >/dev/null 2>&1; then
  sudo raspi-config nonint do_spi 0 || true
fi
if ! grep -q '^dtparam=spi=on' /boot/firmware/config.txt 2>/dev/null; then
  echo 'dtparam=spi=on' | sudo tee -a /boot/firmware/config.txt >/dev/null
fi

# 3) Récupérer scripts MHS (LCD-show)
if [ ! -d /opt/LCD-show ]; then
  sudo git clone https://github.com/goodtft/LCD-show.git /opt/LCD-show
else
  sudo bash -lc "cd /opt/LCD-show && git fetch --all && git reset --hard origin/master"
fi
sudo bash -lc "chmod +x /opt/LCD-show/*.sh"

# Neutraliser tout reboot forcé dans ces scripts
sudo sed -i 's/^[[:space:]]*reboot[[:space:]]*$/echo skip-reboot/g' /opt/LCD-show/*.sh || true

# 4) Sauvegarde de la config firmware
if [ ! -f /boot/firmware/config.txt.bak.mhs ]; then
  sudo cp /boot/firmware/config.txt /boot/firmware/config.txt.bak.mhs
fi

# 5) Tenter MHS 3.5" (ILI9486/ST7796). Alternative: LCD35-show selon révision
set +e
sudo bash -lc "cd /opt/LCD-show && ./MHS35-show"
RC=$?
if [ $RC -ne 0 ]; then
  echo "MHS35-show a échoué (rc=$RC), tentative LCD35-show…"
  sudo bash -lc "cd /opt/LCD-show && ./LCD35-show"
fi
set -e

# S’assurer résolution
if ! grep -q '^framebuffer_width=480' /boot/firmware/config.txt 2>/dev/null; then
  echo 'framebuffer_width=480'  | sudo tee -a /boot/firmware/config.txt >/dev/null
fi
if ! grep -q '^framebuffer_height=320' /boot/firmware/config.txt 2>/dev/null; then
  echo 'framebuffer_height=320' | sudo tee -a /boot/firmware/config.txt >/dev/null
fi

# 6) Autologin LightDM (utilisateur courant)
USER_NAME="$(logname 2>/dev/null || echo "$USER")"
sudo mkdir -p /etc/lightdm/lightdm.conf.d
sudo tee /etc/lightdm/lightdm.conf.d/50-autologin.conf >/dev/null <<CFG
[Seat:*]
autologin-user=$USER_NAME
autologin-user-timeout=0
user-session=LXDE
CFG

# Désactiver l’extinction d’écran
sudo -u "$USER_NAME" bash -lc '
  mkdir -p ~/.config/lxsession/LXDE
  cat > ~/.config/lxsession/LXDE/autostart <<AS
@xset s off
@xset -dpms
@xset s noblank
AS
'

# 7) Activer mode graphique par défaut
sudo systemctl set-default graphical.target
sudo systemctl enable lightdm

echo "=== $(date) : END install_mhs35 (REBOOT RECOMMENDED) ==="
