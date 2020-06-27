document.addEventListener('DOMContentLoaded',() => {
    


    var socket = io.connect(location.protocol + '//' + document.domain + ':' +location.port);

    var username = localStorage.getItem('username');
    var channel = localStorage.getItem('channel');


    socket.on('connect', ()=> {
        if(channel){
            joinRoom(channel);
        };


        document.querySelector("#send_message").onclick = ()=>{
            const text = document.querySelector('#user_message').value;
            socket.emit("text", {"msg": text, "channel": channel});
            document.querySelector('#user_message').value = '';
            // Autofocus on text box
            document.querySelector("#user_message").focus();
        };  
        document.addEventListener('click', event => {
            const element = event.target;
            if (element.className === 'hide') {
                var mid = element.parentElement.getAttribute('data-id');
                console.log(element.parentElement);

                socket.emit("delete_message",{"msgid": mid, "room":channel});
                //element.parentElement.style.animationPlayState = 'running';
                //element.parentElement.remove();
                // element.parentElement.addEventListener('animationend', () =>  {
                //     element.parentElement.remove();
                // });
            }
        });
         
    });
    socket.on("deleted", data => {

        var messageown = document.querySelector('p[data-id="' + data + '"]');

        messageown.remove();

        
        
    });



    socket.on('joinch', info => {
        // Clear message area
        document.querySelector('#display-message-section').innerHTML = '';
               
        var info1 = JSON.parse(info);
        
        var oldmessages = info1['oldmessages'];
        oldmessages = JSON.parse(oldmessages);
        console.log(oldmessages);
        
        for (var i in oldmessages ){
            
           

        // Old Messages 

        const p = document.createElement('p');
        const span_username = document.createElement('span');
        const span_timestamp = document.createElement('span');
        const br = document.createElement('br');
        const delete_button = document.createElement('button');
        const Name = username;

        if(oldmessages[i].username== Name){
        // Display user's own message

        p.setAttribute("class", "my-msg");
        p.setAttribute("data-id",oldmessages[i].msgID);

        // Username
        span_username.setAttribute("class", "my-username");
        span_username.innerText = oldmessages[i].username;

        // Timestamp
        span_timestamp.setAttribute("class", "timestamp");
        span_timestamp.innerText = oldmessages[i].time_stamp;


        // Delete Button
        delete_button.setAttribute("class","hide");
        delete_button.innerText = "Delete";

        // HTML to append
        p.innerHTML += span_username.outerHTML + br.outerHTML + oldmessages[i].msg + br.outerHTML + span_timestamp.outerHTML + delete_button.outerHTML;

        //Append
        document.querySelector('#display-message-section').append(p);
        scrollDownChatWindow();
        }else if(typeof oldmessages[i].username !== 'undefined'){
            // Display other's message

        p.setAttribute("class", "others-msg");
        p.setAttribute("data-id",oldmessages[i].msgID);

        // Username
        span_username.setAttribute("class", "my-username");
        span_username.innerText = oldmessages[i].username;

        // Timestamp
        span_timestamp.setAttribute("class", "timestamp");
        span_timestamp.innerText = oldmessages[i].time_stamp;

        // HTML to append
        p.innerHTML += span_username.outerHTML + br.outerHTML + oldmessages[i].msg + br.outerHTML + span_timestamp.outerHTML;

        //Append
        document.querySelector('#display-message-section').append(p);
        scrollDownChatWindow();
        }

        // end old messages

        };

        
        const p = document.createElement('p');
        p.setAttribute("class", "system-msg");
             
        p.innerHTML += info1["messages1"];
        

        document.querySelector('#display-message-section').append(p);
        scrollDownChatWindow();

        // Autofocus on text box
        document.querySelector("#user_message").focus();
    });


    socket.on('message', data =>{
        printSysMsg(data);
        scrollDownChatWindow();
    });



    // Logout from chat
    document.querySelector("#logout-btn").onclick = () => {
        leaveRoom(channel);
    };

    // Trigger 'leave' event if user was previously on a room
    function leaveRoom(room) {
        socket.emit('leave', {'username': username, 'room': room});

        document.querySelectorAll('.select-room').forEach(p => {
            p.style.color = "black";
        });
    }

    // Trigger 'join' event
    function joinRoom(room) {

        // Join room
        socket.emit('join', {'username': username, 'room': room});

        // Highlight selected room
        document.querySelector('#' + CSS.escape(room)).style.color = "#ffc107";
        document.querySelector('#' + CSS.escape(room)).style.backgroundColor = "white";

        // Autofocus on text box
        document.querySelector("#user_message").focus();
    }



    socket.on("mtext", data => {
        const p = document.createElement('p');
        const span_username = document.createElement('span');
        const span_timestamp = document.createElement('span');
        const br = document.createElement('br');
        const delete_button = document.createElement('button');
        const Name = username;
        console.log(data.ooo);
        if(data.username== Name){
        // Display user's own message

        p.setAttribute("class", "my-msg");
        p.setAttribute("data-id",data.msgID);

        // Username
        span_username.setAttribute("class", "my-username");
        span_username.innerText = data.username;

        // Timestamp
        span_timestamp.setAttribute("class", "timestamp");
        span_timestamp.innerText = data.time_stamp;

        // Delete Button
        delete_button.setAttribute("class","hide");
        delete_button.innerText = "Delete";


        // HTML to append
        p.innerHTML += span_username.outerHTML + br.outerHTML + data.message + br.outerHTML + span_timestamp.outerHTML + delete_button.outerHTML;

        //Append
        document.querySelector('#display-message-section').append(p);
        scrollDownChatWindow();
        }else if(typeof data.username !== 'undefined'){
              // Display other's message

        p.setAttribute("class", "others-msg");
        p.setAttribute("data-id",data.msgID);

        // Username
        span_username.setAttribute("class", "my-username");
        span_username.innerText = data.username;

        // Timestamp
        span_timestamp.setAttribute("class", "timestamp");
        span_timestamp.innerText = data.time_stamp;

        // HTML to append
        p.innerHTML += span_username.outerHTML + br.outerHTML + data.message + br.outerHTML + span_timestamp.outerHTML;

        //Append
        document.querySelector('#display-message-section').append(p);
        scrollDownChatWindow();
        }
        else {
            printSysMsg(data.msg);
            scrollDownChatWindow();
        }
    });








    // Scroll chat window down
    function scrollDownChatWindow() {
        const chatWindow = document.querySelector("#display-message-section");
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };

   
    // Select a room
    document.querySelectorAll('.select-room').forEach(p => {
        p.onclick = () => {
            let newChannel = p.innerHTML
            // Check if user already in the room
            if (newChannel === channel) {
                msg = `You are already in ${channel} room.`;
                printSysMsg(msg);
            } else {
                leaveRoom(channel);
                joinRoom(newChannel);
                document.querySelector('#display-message-section').innerHTML = '';
                localStorage.setItem('channel',newChannel);
                channel = newChannel;
            }
        };
    });



    // Print system messages
    function printSysMsg(msg) {
        const p = document.createElement('p');
        p.setAttribute("class", "system-msg");
        p.innerHTML = msg;
        document.querySelector('#display-message-section').append(p);
        scrollDownChatWindow();

        // Autofocus on text box
        document.querySelector("#user_message").focus();
    }


    // Make 'enter' key submit message
    let msg = document.getElementById("user_message");
    msg.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.getElementById("send_message").click();
        }
    });



});