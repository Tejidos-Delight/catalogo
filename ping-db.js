const https = require('https');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

// Limpiamos la URL por si acaso tiene barras finales
const baseUrl = supabaseUrl.replace(/\/$/, "");

// Apuntamos directamente a la raíz de la API de Supabase, que requiere autenticación
const url = `${baseUrl}/rest/v1/`;

const options = {
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  },
  timeout: 10000 // 10 segundos de límite
};

console.log(`Enviando pulso de actividad a: ${baseUrl}`);

const req = https.request(url, options, (res) => {
  console.log(`Estado de respuesta del servidor: ${res.statusCode}`);
  
  // Cualquier código 2xx o incluso un 4xx (si la clave es correcta pero el endpoint cambia) 
  // significa que la base de datos procesó la solicitud y está DESPIERTA.
  if (res.statusCode >= 200 && res.statusCode < 500) {
    console.log("¡Pulso exitoso! La infraestructura de Supabase detectó la actividad.");
    process.exit(0);
  } else {
    console.error(`Error: El servidor respondió con un código inesperado: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error("Error crítico de conexión (Posible bloqueo de red o IPv6 en GitHub):", err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error("Error: Tiempo de espera agotado al conectar con Supabase.");
  req.destroy();
  process.exit(1);
});

req.end();
