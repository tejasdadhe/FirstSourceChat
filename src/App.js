import React from "react";
import Firebase from "firebase";
import config from "./firebase-config";


const currentPage = {LOGIN_PAGE:1,USERS_LIST:2,CONVERSATION_PAGE:3};
const userReference = "USERS";
const conversationReference = "CONVERSATION";

class App extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) 
            Firebase.initializeApp(config);

        this.state = {
            currentPage: currentPage.LOGIN_PAGE,  
            myUserName: null,  
            myUserId: null,
            users: [],
            conversationId:null,
            messages: []
        };
    }

    getUsersList = () => {
        let ref = Firebase.database().ref(userReference);
        ref.on("value", snapshot => {
            if(snapshot.exists)
            {
                this.setState({users : snapshot.val()});
                this.setState({currentPage  : currentPage.USERS_LIST});
            }
        });
    }

    getChatID = (userID1, userId2) =>
    {
        if(userID1 < userId2)
            return userID1+"-"+userId2;
        else
            return userId2+"-"+userID1;
    }

    startConversation = (targetUserId) =>
    {
        const myUserId = this.state.myUserId;
        const conversationId = this.getChatID(myUserId,targetUserId);
        this.setState({conversationId},()=>{
            this.setState({currentPage:currentPage.CONVERSATION_PAGE});
            this.fetchMessages(conversationId);
        });
    }


    createNewUser = (userName) =>
    {
    this.setState({myUserName:userName},()=>{
        const ref = Firebase.database().ref(userReference).push(userName);
        const userId = ref.key;
        this.setState({myUserId:userId});
        this.getUsersList();
    })
    }

    fetchMessages(conversationId)
    {
        Firebase.database().ref(conversationReference).child(conversationId).limitToLast(20).on('value',(dataSnapshot)=>
        {
            if(dataSnapshot.exists())
            {
                const messageObj = dataSnapshot.val();
                this.setState({messages:{...this.state.messages,...messageObj}})
                Object.keys(messageObj).map((key)=>{<span>{key}</span>});
            }
        })
    }

    handleLogin = (e) =>
    {
        e.preventDefault();
        if(this.refs.userName.value !== "")
        {
            const userName = this.refs.userName.value;

            Firebase.database()
                    .ref(userReference)
                    .orderByValue().equalTo(userName)
                    .on("value", function(snapshot){
                        if(snapshot.exists())
                        {
                            return
                        }
                    });
            this.createNewUser(userName)   
        }
    }

    handleSend = (e) =>
    {
        e.preventDefault();
        let message = this.refs.message.value;
        if(message === "") return;

        const conversationId = this.state.conversationId;
        const myUserId = this.state.myUserId;
        const messageObj = {message,senderId:myUserId};

        Firebase.database().ref(conversationReference).child(conversationId).push(messageObj)

        this.refs.message.value = "";
        document.getElementById('end').scrollIntoView({ behavior: "smooth" });
    }

    handleSubmit = event => {
        event.preventDefault();
        let name = this.refs.name.value;
        let role = this.refs.role.value;
        let uid = this.refs.uid.value;

        if (uid && name && role) {
        const { developers } = this.state;
        const devIndex = developers.findIndex(data => {
            return data.uid === uid;
        });
        developers[devIndex].name = name;
        developers[devIndex].role = role;
        this.setState({ developers });
        } else if (name && role) {
        const uid = new Date().getTime().toString();
        const { developers } = this.state;
        developers.push({ uid, name, role });
        this.setState({ developers });
        }

        this.refs.name.value = "";
        this.refs.role.value = "";
        this.refs.uid.value = "";
    };

    removeData = developer => {
        const { developers } = this.state;
        const newState = developers.filter(data => {
        return data.uid !== developer.uid;
        });
        this.setState({ developers: newState });
    };

    updateData = developer => {
        this.refs.uid.value = developer.uid;
        this.refs.name.value = developer.name;
        this.refs.role.value = developer.role;
    };

    render() 
    {
    if(this.state.currentPage === currentPage.LOGIN_PAGE)
    {
        console.log("State",this.state)
        return (
            <div className="container">
                <form onSubmit={this.handleLogin} className="loginForm">
                    <label>Your name in the chat room?</label>
                    <input typr="text" placeholder="tejas_dadhe" ref="userName" required></input>
                    <input type="submit" value="Login"></input>
                </form>
            </div>
        )
    }
    else if(this.state.currentPage === currentPage.USERS_LIST)
    {
        const users = this.state.users;
        const myUserId = this.state.myUserId;
        delete users[myUserId];
        return (
            <div>
                <div className="userList">
                <div className="title user-item">Who do you want to chat with ?</div>
                    {Object.keys(users).map((key) => (<div className="user-item" key={key} userid={key} onClick={()=>{this.startConversation(key)}}>{users[key]}<br></br></div>))}
                </div>
            </div>
        );
    }
    else if(this.state.currentPage === currentPage.CONVERSATION_PAGE)
    {
        const myUserId = this.state.myUserId;
        return (
            <React.Fragment>
                <div className="container">
                <div className="chat-page">
                {
                    Object.keys(this.state.messages).map((index)=> (<div className="message-box"><span className={(this.state.messages[index].senderId == myUserId) ? "sent-message":"recieved-message"}>{this.state.messages[index].message}</span></div>))
                }
                </div>
                <div className="inputBar">
                    <form className="message-form" onSubmit={this.handleSend}>
                        <input type="text" ref="message"></input>
                        <button>Send</button>
                    </form>
                </div>
                </div>
                <div className = "dummyDiv" id="end"></div>
            </React.Fragment>
        );
    } 
  }
}

export default App;
