const { createClient } = require('@supabase/supabase-js');

// GitHub Actions inyectará estos valores automáticamente desde los Secrets
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function keepAlive() {
    // Intentamos leer un solo ID de tu tabla 'products' para generar actividad
    const { data, error } = await supabase.from('products').select('id').limit(1);

    if (error) {
        console.error('Error al despertar la DB:', error.message);
        process.exit(1);
    } else {
        console.log('¡Pulso exitoso! Supabase detectó actividad y no pausará el proyecto.');
        process.exit(0); // Forzamos una salida limpia y exitosa
    }
}

// Ejecutamos y aseguramos el manejo del flujo asíncrono
keepAlive()
  .then(() => {
    // Por si acaso la función termina sin ejecutar los bloques internos
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error crítico en el hilo de ejecución:', err);
    process.exit(1);
  });
