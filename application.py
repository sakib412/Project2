import os
import time
import json
import random
from time import localtime, strftime
from flask import Flask, render_template, request, session, redirect, flash
from flask_socketio import SocketIO, emit, send, join_room, leave_room
from flask_session import Session

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config['SESSION_TYPE'] = 'filesystem'
socketio = SocketIO(app, manage_session=False)
Session(app)


usersLogged = []

# Keep track of channels created (Check for channel name)
channelsCreated = []


# format {"username": session.get('username'), "msg" : msg, "time_stamp": time_stamp}

channelsMessages = {}



if __name__ == "__main__":
    socketio.run(app,debug=True)



@app.route("/")
def index(): 
    username = session.get('username')
    if not username:
        flash("Login First")
        return redirect('/login')
    if not session.get('current_channel') in channelsCreated:
        return render_template("index.html")

    current_channel = session.get('current_channel')
    return render_template("index.html", channels = channelsCreated, username =username, msg=channelsMessages[current_channel], current_channel= current_channel)

@app.route("/login", methods=["POST", "GET"])
def login():
    username = session.get('username')
    if username:
        flash("You are already logged in")
        return redirect('/')

    username = request.form.get("username")
    
    if request.method == "POST":

        if len(username) < 1 or username is '':
            return render_template("login.html", message="username can't be empty.")
            

        if username in usersLogged:
            return render_template("login.html", message="that username already exists!")                   
        
        usersLogged.append(username)

        session['username'] = username

        # Remember the user session on a cookie if the browser is closed.
        session.permanent = True

        return redirect("/create")
    else:
        return render_template("login.html", username = username)


@app.route("/logout")
def logout():

    # Remove from list
    try:
        usersLogged.remove(session['username'])
    except ValueError:
        pass

    # Delete cookie
    session.clear()

    return redirect("/login")




@socketio.on("disconnect")
def usrDis(data):
    print(data)



@socketio.on("message")
def message(data):
    print(data)
    send(data)

@app.route("/create", methods=['GET','POST'])
def createChannel():

    # Get channel name from form
    newChannel = request.form.get("channel")
    username = session.get('username')
    session['current_channel'] = newChannel

    if request.method == "POST":
        if newChannel == '':
            flash("Please input a channel name.")
            return render_template("channel.html")

        if newChannel in channelsCreated:
            flash("That channel already exists!")
            return render_template("channel.html")
        
        # Add channel to global list of channels
        channelsCreated.append(newChannel)

        channelsMessages[newChannel] = []

        flash("Channel Created!!")

        return redirect("/")
    
    else:

        return render_template("channel.html", channels = channelsCreated, username= username)



@app.route("/channels/<channel>", methods=['GET','POST'])
def enter_channel(channel):

    # Updates user current channel
    session['current_channel'] = channel

    if request.method == "POST":
        
        return redirect("/")
    else:
        return render_template("index.html", channels= channelsCreated, msg=channelsMessages[channel])


@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['room']
    msg = channelsMessages[room]
    msg1 = json.dumps(msg)
    join_room(room)
    info1 = { "messages1" : username + ' has joined the ' + room, "oldmessages" : msg1}
    info = json.dumps(info1)
    emit("joinch", f"{info}" , room = room)



@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['room']
    leave_room(room)
    send( username + ' has left the ' + room, room=room)

@socketio.on("text")
def text(data):
    msg = data["msg"]
    channel = data["channel"]
    time_stamp = time.strftime('%b-%d %I:%M%p', time.localtime())
    s = random.sample(range(1, 510078668686788), 1)
    mID = ''.join([str(elem) for elem in s])
    msgID = int(mID)
    if msg=='':
        return render_template("index.html")


    
    if len(channelsMessages[channel]) > 99:
        # Pop the oldest message
        channelsMessages[channel].pop(0)

    
    my_data = {"msgID":msgID,"username": session.get('username'), "msg" : msg, "time_stamp": time_stamp}
    channelsMessages[channel].append(my_data)


    
    emit("mtext", {"msgID":msgID,"username": session.get('username'),"message":msg,"time_stamp": time_stamp,"ooo":channelsMessages, "channel": channel}, room = channel)

@socketio.on("delete_message")
def delete_message(data):
    msid = data["msgid"]
    
    msgid = int(msid)
    room = data["room"]
    room_msg = channelsMessages[room]

    for i, msg in enumerate(room_msg):
        if msg['msgID'] == msgid:
            del room_msg[i]
    print("HEyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy")
    emit("deleted", msgid, room = room)