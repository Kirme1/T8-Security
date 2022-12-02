const axios = require("axios")
const mqtt = require("mqtt")
const client = mqtt.connect("mqtt://localhost:1883/")
const Api = axios.create({
    baseURL: process.env.VUE_APP_API_ENDPOINT || 'http://localhost:8000/api'
})
const jwt= require("jsonwebtoken")
let result
let token
client.on("connect", e => {
    console.log("connected")
    client.subscribe("/dentistimo/#", {qos:1},e => {
        client.on("message", (topic, m, option) => {
            console.log('aaoo got something')
            if (m.length !== 0){
                try {
                    console.log(m.toString())
                    let message = JSON.parse(m.toString())
                    if (message.url=== '/users'){
                         result= mqtt('postU', '/users', this.data)
                        token = result.token
                    }
                    else{
                        
                       result= mqtt('post', postRequest.url, this.data)
                       authenticateUser()
                    }
                    
                    console.log(option)
                } catch (e) {
                    let response = { "id": topic.split('/').pop(), "response": "response", "data": "400 Bad Requests" }
                    return client.publish(topic, JSON.stringify(response), {qos:1})
                }
            } 
        })
    })
})

async function postRequest(url, data, Autho) {
    let res = {}
    if(Autho != undefined){
        await Api.post(url, data, {headers: {Authorization: 'Bearer ' + Autho}}).then(response => {
            res = { "status": response.status + " " + response.statusText, "data": response.data }
        }).catch(e => {
            res = { "error": e.response.status + " " + e.response.statusText }
        })
        return res
    } else {
        await Api.post(url, data).then(response => {
            res = { "status": response.status + " " + response.statusText, "data": response.data }
        }).catch(e => {
            res = { "error": e.response.status + " " + e.response.statusText }
        })
        return res
    }
}

 async function authenticateUser(req, res, next) {

    if (token === null) {
        return res.status(401).json({ error: "User not authenticated!"});
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        if (decoded) {
            req.authenticated = true;
            req.userData = decoded
            return next();
        } else {
            return res.status(401).json({ error: "User not authenticated!"});
            //req.authenticated = false;
        }
    } catch (err) {
        return res.status(401).json({error: "User not authenticated!"});
    }

};
