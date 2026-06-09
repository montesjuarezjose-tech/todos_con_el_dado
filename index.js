require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a Supabase usando tus variables secretas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


// --- CHISMOSOS DE CONEXIÓN ---
console.log("¿Cargó la URL de Supabase?:", process.env.SUPABASE_URL ? "Sí" : "NO");
console.log("¿Cargó la Key de Supabase?:", process.env.SUPABASE_KEY ? "Sí" : "NO");
// -----------------------------


// Obtener estado desde la nube
// Obtener estado desde la nube
app.get('/api/estado', async (req, res) => {
    const { data, error } = await supabase
        .from('base_dado')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        console.log("🚨 ERROR EN /api/estado:", error);
        return res.status(500).json({ error: 'Error al obtener datos de la nube' });
    }

    // Aquí está el cambio clave: usamos las palabras que index.html espera
    res.json({
        totales: data.estadisticas_globales,
        lanzamientos: data.total_lanzamientos,
        jugadores: data.jugadores
    });
});

// Registrar nuevo lanzamiento en la nube
// Registrar nuevo lanzamiento en la nube
app.post('/api/lanzar', async (req, res) => {
    // Cambio clave: Recibimos "resultado" y "jugadorId" tal como los manda index.html
    const { jugadorId, resultado } = req.body;

    // 1. Obtener los datos más recientes de Supabase
    const { data, error } = await supabase.from('base_dado').select('*').eq('id', 1).single();
    if (error) {
        console.log("🚨 ERROR LEYENDO EN /api/lanzar:", error);
        return res.status(500).json({ error: 'Error leyendo la base de datos' });
    }

    let { estadisticas_globales, total_lanzamientos, jugadores } = data;

    // 2. Sumar el nuevo tiro (usando "resultado")
    estadisticas_globales[resultado - 1] += 1;
    total_lanzamientos += 1;

    if (!jugadores[jugadorId]) {
        jugadores[jugadorId] = { caras: [0,0,0,0,0,0], sumaTotal: 0 };
    }
    jugadores[jugadorId].caras[resultado - 1] += 1;
    jugadores[jugadorId].sumaTotal += resultado;

    // 3. Guardar en Supabase
    const { error: updateError } = await supabase
        .from('base_dado')
        .update({
            estadisticas_globales: estadisticas_globales,
            total_lanzamientos: total_lanzamientos,
            jugadores: jugadores
        })
        .eq('id', 1);

    if (updateError) {
        console.log("🚨 ERROR GUARDANDO EN /api/lanzar:", updateError);
        return res.status(500).json({ error: 'Error guardando datos' });
    }

    // 4. Responder al HTML con las palabras que espera
    res.json({
        totales: estadisticas_globales,
        lanzamientos: total_lanzamientos,
        jugadores: jugadores
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log("=========================================");
    console.log(`🚀 Servidor listo.`);
    console.log(`👉 Abre: http://192.168.1.3:${PORT}`);
    console.log("=========================================");
});