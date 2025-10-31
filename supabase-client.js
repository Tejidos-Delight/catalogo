// supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Configuración - REEMPLAZA con tus credenciales
const supabaseUrl = 'https://tu-proyecto.supabase.co'
const supabaseKey = 'tu-clave-publica-anon'
export const supabase = createClient(supabaseUrl, supabaseKey)

// Funciones para productos
export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_order', { ascending: true })
    
    if (error) {
        console.error('Error cargando productos:', error)
        return []
    }
    
    return data
}

export async function saveProduct(product) {
    const { data, error } = await supabase
        .from('products')
        .upsert(product)
    
    if (error) {
        console.error('Error guardando producto:', error)
        throw error
    }
    
    return data
}

export async function deleteProduct(id) {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
    
    if (error) {
        console.error('Error eliminando producto:', error)
        throw error
    }
}