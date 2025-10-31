// supabase-client.js - ACTUALIZADO
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Configuración REAL
const supabaseUrl = 'https://egjlhlkholudjpjesunj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg'
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