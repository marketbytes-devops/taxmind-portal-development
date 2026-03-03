//Mylib.js

// this (vue instance) is passed as that , so we
// can read and write data from and to it as we please :)
  let authFunction = (that) => {
    that.$socket.emit("auth", {
      accessToken: localStorage.getItem('accesstoken'),
      role: localStorage.getItem('userRole'),
      // from: "web",
    });
    that.sockets.subscribe("auth", (response) => {
      if (response) {
        that.response = response;
        that.authentication = response.authentication;
        that.$store.commit("authValue", response.authentication);
        // handleNewChatMessage(that);
      }
    });
  };
  let handleNewChatMessage = (that) => {
    that.sockets.subscribe("newChatMessage", (response) => {
      // console.log("Response from socket:", response);
      if (response) {
        that.chatData.push(response);
        // console.log("Updated chatData array:", that.chatData);
        that.scrollToBottom();
      }
    });
    // if (that.$socket) {
    //   console.log("Socket object exists.");
    //   if (that.$socket.connected) {
    //     console.log("Socket is connected, setting up newChatMessage listener.");
    //     that.$socket.on("newChatMessage", (message) => {
    //       console.log("New chat message received:", message);
    //       that.chatData.push(message);
    //       that.scrollToBottom();
    //     });
    //   } else {
    //     console.log("Socket is not connected. Cannot set up newChatMessage listener.");
    //     that.$socket.on('connect', () => {
    //       console.log("Socket reconnected, setting up newChatMessage listener.");
    //       that.$socket.on("newChatMessage", (message) => {
    //         console.log("New chat message received after reconnect:", message);
    //         that.chatData.push(message);
    //         that.scrollToBottom();
    //       });
    //     });
    //   }
    // } else {
    //   console.log("Socket object does not exist.");
    // }
  };
  
  var xport = {
    authFunction: authFunction,
    handleNewChatMessage: handleNewChatMessage
  };
  
  export default xport;
  