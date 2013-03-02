//Teste de servidor de monitoramento de recursos da maquina

var oWebSocketServer = require("websocket").server,
	oHTTP = require("http"),
	oDiskSpace = require('diskspace'),
	oOS = require('os');

var aDisks = {};
var aClients = [];
var iPort = 32221;

MapAllDisks();
setInterval(function(){	MapAllDisks();}, 60000);

setInterval(function(){
	var aReturn = {};
	var aCpu = oOS.cpus();
	var aNetwork = oOS.networkInterfaces();
	var fMemUsage = oOS.totalmem()-oOS.freemem();
		
	aReturn["cpu"] = aCpu;
	setTimeout(function(){
		aReturn["cpu2"] = oOS.cpus();
		aReturn["network"] = aNetwork;
		aReturn["mem"] = {"total": oOS.totalmem(), "free": oOS.freemem(), "usage": fMemUsage};
		aReturn["disk"] = aDisks;
		
		switch(process.platform){
			case "darwin": var sPlataform = "Darwin OS ".process.arch; break;
			case "freebsd": var sPlataform = "FreeBSD ".process.arch; break;
			case "linux": var sPlataform = "Linux ".process.arch; break;
			case "sunos": var sPlataform = "SunOS ".process.arch; break;
			case "win32": var sPlataform = "Windows ".process.arch; break;
		}
		
		aReturn["plataform"] = sPlataform;
		Broadcast(JSON.stringify(aReturn));
	}, 1000);
}, 1000);

var oServerHTTP = oHTTP.createServer(function(mRequest, mResponse) {
    console.log("Requerimento: " + mRequest.url);
    mResponse.writeHead(404);
    mResponse.end();
});

oServerHTTP.listen(iPort, function() {
    console.log("Servidor rodando na porta "+iPort);
});

oServerWebsocket = new oWebSocketServer({
    httpServer: oServerHTTP,
    autoAcceptConnections: false
});

oServerWebsocket.on("request", function(oRequest) {
    var oConnection = oRequest.accept("server-monitor", oRequest.origin);
    console.log(oConnection.remoteAddress + " conectou-se.");
    aClients.push(oConnection);
                
    oConnection.on("close", function(iReasonCode, sDescription) {
        console.log(oConnection.remoteAddress + " desconectou-se.");
    });
});

/**
 * Função para enviar comandos a todos os clients
 * 
 * @param string sMsg
 * @return void
 */
function Broadcast(sMsg){		
	if(aClients.length > 0)
		for(var iKey in aClients)
			aClients[iKey].sendUTF(sMsg);
}

/**
 * Função para realizar mapaeamento dos HD's do computador
 * 
 * @return
 */
function MapAllDisks(){
	var aUnits = ["C","D","E","F","G","H","I","J","K","L"];
	
	for(var iKey in aUnits){
		setTimeout(function(sUnit){
			oDiskSpace.check(sUnit, function(iTotal, iFree, bStatus){ 
				if(iTotal > 0 && iFree > 0)
					aDisks[sUnit] = {"total": iTotal, "free": iFree};
			});
		}, 100, aUnits[iKey]);		
	}
}