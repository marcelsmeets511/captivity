# config.py
# IP-adres van de machine waar de web_server.py draait
PORTAL_IP = "172.17.205.70"  # VERVANG DIT met het daadwerkelijke IP van je portal server

# Poort waarop de webserver luistert
WEB_SERVER_PORT = 80  # Standaard HTTP poort

# Poort waarop de DNS server luistert
DNS_SERVER_PORT = 53  # Standaard DNS poort

# Interface waarop de DNS server moet luisteren (0.0.0.0 = alle interfaces)
DNS_LISTEN_IP = "127.0.0.1"

# Pad naar de template map
TEMPLATE_FOLDER = "templates"

# Pad naar de static map
STATIC_FOLDER = "static"

# Een (zeer eenvoudige) manier om geautoriseerde clients bij te houden
# In een echte setup zou dit een database of firewall interactie zijn.
AUTHORIZED_IPS = set()

# Twilio settings
CALLER_ID = "+15551234567"