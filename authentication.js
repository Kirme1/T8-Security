const axios = require("axios")
const mqttMethod = require("./MQTT")
const mqtt = require("mqtt")
const client = mqtt.connect("mqtt://localhost:1883/")
const process = require('./nodemon.json')
const Api = axios.create({
    baseURL: process.env.VUE_APP_API_ENDPOINT || 'http://localhost:8000/api'
})
const jwt= require("jsonwebtoken")


let result
let token
client.on("connect", e => {
    console.log("connected")
    client.subscribe("/dentistimo/unauthenticated/#", {qos:1},e => {
        client.on("message", (topic, m, option) => {
            console.log('aaoo got something')
            if (m.length !== 0){
                try {
                    let message = JSON.parse(m.toString())
                    console.log(message)
                    if (message.request && message.authenticated !== true) {
                        authenticateUser(message.data).then(data => {
                            if (data.authenticated === true) {
                                console.log('publishing')
                                message.authenticated = true
                                client.publish(topic, JSON.stringify(message), {qos:1})
                            } else if (data.authenticated === false) {
                                let res = { "id": message.id, "response": "response", "data": "401 unauthorized" }
                                client.publish(topic, JSON.stringify(res), {qos:1})
                                client.unsubscribe(topic)
                            }
                        })
                    }
                } 
                catch (e) {
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

 async function authenticateUser(req) {
    console.log(req.token)
    let data = {
        authenticated: false,
        userdata: req.token
    }

    if (req.token === null) {
        return data;
    }
    
    try {
        const decoded = jwt.verify(req.token, process.env.JWT_KEY);
        if (decoded) {
            data.authenticated = true;
            data.userdata = decoded;
            return data;
        } else {
            return data;
        }
    } catch (err) {
        return data;
    }

};
