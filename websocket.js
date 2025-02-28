const websocketMap = {}

module.exports = wsInstance => {
    // Add broadcast capability to the websocket instance
    wsInstance.broadcast = (data) => {
        for (const sessionID in websocketMap) {
            try {
                websocketMap[sessionID].send(JSON.stringify(data));
            } catch (err) {
                console.error('Websocket broadcast error:', err.message);
            }
        }
    };
    
    return (ws, req) => {
        ws.sessionID = req.sessionID;
        websocketMap[req.sessionID] = ws;
        
        ws.on('message', rawData => {
            let data = {};
            try {
                data = JSON.parse(rawData);
            } catch(err) {
                console.error(err.message, rawData);
                return;
            }
            
            // Handle chat messages
            if (data.from && data.to && data.message) {
                req.sessionStore.all((err, sessions) => {
                    if(err) {
                        console.error('Cannot retrieve sessions');
                        return;
                    }
                    for(const sessionID in sessions) {
                        if(websocketMap[sessionID] // chat was opened or not
                           && sessions[sessionID].passport
                           && sessions[sessionID].passport.user
                           && sessions[sessionID].passport.user == data.to) {
                            try {
                                websocketMap[sessionID].send(JSON.stringify(data));
                            } catch(err) {
                                console.error('Websocket send error:', err.message);
                            }
                        }
                    }
                });
            }
        });
        
        ws.on('close', () => {
            delete websocketMap[ws.sessionID];
        });
    };
};