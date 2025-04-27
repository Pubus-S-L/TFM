let stompCliente = null;

const onConnectSocket = () => {
    console.log('Conectado al WebSocket!');
    stompCliente.subscribe('/conversacion/mensajes', (mensaje) => {
        console.log('Mensaje recibido: ', mensaje.body);
        mostrarMensaje(mensaje.body);
    })
};

const onWebSocketClose = () => {
    if (stompCliente !== null) {
        stompCliente.deactivate();
    }
};

const conectarWS = () => {
    onWebSocketClose();
    stompCliente = new StompJs.Client({
        webSocketFactory: () => new WebSocket('ws://https://tfm-m1dn.onrender.com/websocket')
    });
    stompCliente.onConnect = onConnectSocket;
    stompCliente.onWebSocketClose = onWebSocketClose;
    stompCliente.activate();
    stompCliente.onStompError = (frame) => {
        console.error('Broker error: ' + frame.headers['message']);
        console.error('Details: ' + frame.body);
    };

};



const enviarMensaje = () => {
    let txtNombre = document.getElementById('txtNombre');
    let txtMensaje = document.getElementById('txtMensaje');

    const mensaje = {
        nombre: txtNombre.value,
        contenido: txtMensaje.value
    };
    console.log('Enviando mensaje:', mensaje);

    stompCliente.publish({
        destination: '/app/envio',
        body: JSON.stringify({
            nombre: txtNombre.value,
            contenido: txtMensaje.value
        })
    });
};

const mostrarMensaje = (mensaje) => {
    const body = JSON.parse(mensaje);
    const ULMensajes = document.getElementById('ULMensajes');

    const mensajeLI = document.createElement('li');
    mensajeLI.classList.add('list-group-item');
    mensajeLI.innerHTML = `<strong>${body.nombre}</strong>: ${body.contenido}`;
    ULMensajes.appendChild(mensajeLI);
};

document.addEventListener('DOMContentLoaded', () => {
    const btnEnviar = document.getElementById('btnEnviar');
    btnEnviar.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Enviando mensaje...');
        enviarMensaje();
    });
    conectarWS();
});