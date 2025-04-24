from flask import Flask, render_template, request, redirect, session, url_for, jsonify
import config
import datetime
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant
from twilio.twiml.voice_response import VoiceResponse, Dial
import os

app = Flask(__name__)
app.secret_key = 'iphone_simulator_secret_key'  # Required for session

# Twilio configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', 'your_account_sid')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', 'your_auth_token')
TWILIO_API_KEY = os.environ.get('TWILIO_API_KEY', 'your_api_key')
TWILIO_API_SECRET = os.environ.get('TWILIO_API_SECRET', 'your_api_secret')
TWILIO_TWIML_APP_SID = os.environ.get('TWILIO_TWIML_APP_SID', 'your_twiml_app_sid')

# Track the current app state
@app.before_request
def before_request():
    # Initialize session if it doesn't exist
    if 'current_app' not in session:
        session['current_app'] = 'home'

@app.route('/hotspot-detect.html')
def hotspot_detect():
    # Check the current app state from session and render the appropriate template
    current_app = session.get('current_app', 'home')
    
    if current_app == 'home':
        return render_template('home_screen.html')
    elif current_app == 'phone':
        return render_template('phone_app.html')
    elif current_app == 'contacts':
        return render_template('contacts_app.html')
    elif current_app == 'safari':
        return render_template('safari_app.html')
    else:
        # Default to home if unknown app
        session['current_app'] = 'home'
        return render_template('home_screen.html')

# Routes to set the current app and redirect to hotspot-detect.html
@app.route('/')
def home():
    session['current_app'] = 'home'
    return redirect('/hotspot-detect.html')

@app.route('/phone')
def phone():
    session['current_app'] = 'phone'
    return redirect('/hotspot-detect.html')

@app.route('/contacts')
def contacts():
    session['current_app'] = 'contacts'
    return redirect('/hotspot-detect.html')

@app.route('/safari')
def safari():
    session['current_app'] = 'safari'
    return redirect('/hotspot-detect.html')

# Generate a Twilio Voice token for the client
@app.route('/api/token', methods=['GET'])
def get_token():
    # Create a unique identity for this client
    identity = request.args.get('identity', 'iphone-user')
    
    # Create access token with credentials
    token = AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, identity=identity)
    
    # Create a Voice grant and add to token
    voice_grant = VoiceGrant(
        outgoing_application_sid=TWILIO_TWIML_APP_SID,
        incoming_allow=True,
    )
    token.add_grant(voice_grant)
    
    # Return token info as JSON
    return jsonify(token=token.to_jwt().decode())

# Handle outgoing calls
@app.route('/api/make_call', methods=['POST'])
def make_call():
    data = request.json
    phone_number = data.get('phone_number', '')
    
    if not phone_number:
        return jsonify({'status': 'error', 'message': 'No phone number provided'}), 400
    
    # Log the call attempt
    print(f"Initiating VoIP call to: {phone_number}")
    
    # Generate a call ID
    call_id = f"call_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Store call info in session (could be a database in production)
    if 'calls' not in session:
        session['calls'] = {}
    
    session['calls'][call_id] = {
        'phone_number': phone_number,
        'status': 'initiating',
        'start_time': datetime.datetime.now().isoformat()
    }
    
    return jsonify({
        'status': 'success',
        'message': f'VoIP call initiated to {phone_number}',
        'call_id': call_id,
        'timestamp': datetime.datetime.now().isoformat()
    })

# TwiML for outgoing calls
@app.route('/api/voice', methods=['POST'])
def voice():
    phone_number = request.form.get('To', '')
    
    # Create TwiML response
    resp = VoiceResponse()
    
    # If we have a number, make the call
    if phone_number:
        dial = Dial(caller_id=config.CALLER_ID)
        
        # If the phone number starts with a +, it's an E.164 number
        if phone_number.startswith('+'):
            dial.number(phone_number)
        else:
            # Add the + and country code if not present
            dial.number(f"+1{phone_number}")
            
        resp.append(dial)
    else:
        resp.say("Thanks for calling!")
    
    return str(resp)

# Handle call status updates
@app.route('/api/call_status', methods=['POST'])
def call_status():
    call_sid = request.form.get('CallSid', '')
    call_status = request.form.get('CallStatus', '')
    
    print(f"Call {call_sid} status update: {call_status}")
    
    # Update call status in our storage
    # In a real app, you'd update a database
    
    return '', 204

# End an active call
@app.route('/api/end_call', methods=['POST'])
def end_call():
    data = request.json
    call_id = data.get('call_id', '')
    
    if not call_id or 'calls' not in session or call_id not in session['calls']:
        return jsonify({'status': 'error', 'message': 'Invalid call ID'}), 400
    
    # Update call status
    session['calls'][call_id]['status'] = 'ended'
    session['calls'][call_id]['end_time'] = datetime.datetime.now().isoformat()
    
    # In a real implementation, you would use Twilio's API to end the call
    # client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    # client.calls(call_sid).update(status="completed")
    
    return jsonify({
        'status': 'success',
        'message': 'Call ended successfully'
    })

# Serve static files
@app.route('/static/<path:path>')
def serve_static(path):
    return app.send_static_file(path)

if __name__ == "__main__":
    print(f"Starting web server on {config.PORTAL_IP}:{config.WEB_SERVER_PORT}")
    app.run(host=config.PORTAL_IP, port=config.WEB_SERVER_PORT, debug=False)
